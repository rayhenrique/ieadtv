import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserRole = "admin" | "operador";
const USER_ROLES_TABLE = "user_roles" as never;
const AUDIT_LOGS_TABLE = "audit_logs" as never;

export class AuthorizationError extends Error {
    code: "UNAUTHENTICATED" | "FORBIDDEN";

    constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
        super(message);
        this.code = code;
        this.name = "AuthorizationError";
    }
}

type AuthWithRole = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    user: User | null;
    role: UserRole | null;
};

type DeniedPayload = {
    requiredRole: UserRole | "backoffice";
    currentRole: UserRole | null;
    scope?: string;
};

async function recordAccessDenied(userId: string | null, payload: DeniedPayload) {
    try {
        const admin = createAdminClient();
        await admin
            .from(AUDIT_LOGS_TABLE)
            .insert(
                {
                    actor_user_id: userId,
                    actor_role: payload.currentRole,
                    action: "ACCESS_DENIED",
                    resource_type: "authorization",
                    resource_id: payload.scope || null,
                    payload,
                } as never
            );
    } catch {
        // Best effort only.
    }
}

async function getAuthenticatedUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (user && !userError) {
        return { supabase, user };
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
        return { supabase, user: session.user };
    }

    const {
        data: { session: refreshedSession },
        error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshedSession?.user && !refreshError) {
        return { supabase, user: refreshedSession.user };
    }

    return { supabase, user: null };
}

async function tryBootstrapFirstAdmin(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
) {
    try {
        const admin = createAdminClient();
        const { count, error: countError } = await admin
            .from(USER_ROLES_TABLE)
            .select("user_id", { count: "exact", head: true });

        if (countError || (count ?? 0) > 0) {
            return;
        }

        await supabase.from(USER_ROLES_TABLE).insert(
            {
                user_id: userId,
                role: "admin",
                created_by: userId,
            } as never
        );
    } catch {
        // If bootstrap fails, caller will continue with null role.
    }
}

export async function getCurrentUserWithRole(): Promise<AuthWithRole> {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
        return { supabase, user: null, role: null };
    }

    let { data } = await supabase
        .from(USER_ROLES_TABLE)
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!data) {
        await tryBootstrapFirstAdmin(supabase, user.id);
        ({ data } = await supabase
            .from(USER_ROLES_TABLE)
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle());
    }

    const role =
        ((data as { role?: UserRole } | null)?.role as UserRole | undefined) ??
        null;

    return { supabase, user, role };
}

export async function requireBackofficeUser(scope?: string) {
    const auth = await getCurrentUserWithRole();

    if (!auth.user) {
        await recordAccessDenied(null, {
            requiredRole: "backoffice",
            currentRole: null,
            scope,
        });
        throw new AuthorizationError(
            "UNAUTHENTICATED",
            "Sua sessão expirou. Faça login novamente."
        );
    }

    if (!auth.role) {
        await recordAccessDenied(auth.user.id, {
            requiredRole: "backoffice",
            currentRole: null,
            scope,
        });
        throw new AuthorizationError(
            "FORBIDDEN",
            "Seu usuário não possui acesso ao painel administrativo."
        );
    }

    return {
        supabase: auth.supabase,
        user: auth.user,
        role: auth.role,
    };
}

export async function requireAdmin(scope?: string) {
    const auth = await getCurrentUserWithRole();

    if (!auth.user) {
        await recordAccessDenied(null, {
            requiredRole: "admin",
            currentRole: null,
            scope,
        });
        throw new AuthorizationError(
            "UNAUTHENTICATED",
            "Sua sessão expirou. Faça login novamente."
        );
    }

    if (auth.role !== "admin") {
        await recordAccessDenied(auth.user.id, {
            requiredRole: "admin",
            currentRole: auth.role,
            scope,
        });
        throw new AuthorizationError(
            "FORBIDDEN",
            "Apenas administradores podem executar esta ação."
        );
    }

    return {
        supabase: auth.supabase,
        user: auth.user,
        role: auth.role,
    };
}
