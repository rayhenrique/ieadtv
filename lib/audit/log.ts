import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserWithRole, type UserRole } from "@/lib/auth/roles";

const AUDIT_LOGS_TABLE = "audit_logs" as never;

export interface AuditLogEntry {
    id: string;
    actor_user_id: string | null;
    actor_user_email?: string | null;
    actor_user_name?: string | null;
    actor_role: UserRole | null;
    action: string;
    resource_type: string;
    resource_id: string | null;
    payload: Record<string, unknown>;
    created_at: string;
}

export interface AuditLogQueryParams {
    page?: number;
    pageSize?: number;
    action?: string;
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
}

export async function logAuditEvent(input: {
    action: string;
    resourceType: string;
    resourceId?: string | null;
    payload?: Record<string, unknown>;
    actorUserId?: string | null;
    actorRole?: UserRole | null;
}) {
    try {
        const admin = createAdminClient();
        let actorUserId = input.actorUserId;
        let actorRole = input.actorRole;

        if (!actorUserId && !actorRole) {
            const auth = await getCurrentUserWithRole();
            actorUserId = auth.user?.id ?? null;
            actorRole = auth.role;
        }

        await admin
            .from(AUDIT_LOGS_TABLE)
            .insert(
                {
                    actor_user_id: actorUserId ?? null,
                    actor_role: actorRole ?? null,
                    action: input.action,
                    resource_type: input.resourceType,
                    resource_id: input.resourceId ?? null,
                    payload: input.payload ?? {},
                } as never
            );
    } catch (error) {
        console.error("[audit] failed to log event", error);
    }
}

export async function cleanupOldAuditLogs(retentionDays = 30) {
    const admin = createAdminClient();

    const threshold = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error, count } = await admin
        .from(AUDIT_LOGS_TABLE)
        .delete({ count: "exact" })
        .lt("created_at", threshold);

    if (error) {
        console.error("[audit] cleanup error", error);
        return { deleted: 0, error: "Erro ao limpar logs de auditoria." };
    }

    return { deleted: count || 0 };
}

export async function queryAuditLogs(params: AuditLogQueryParams) {
    const admin = createAdminClient();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(10, params.pageSize || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = admin
        .from(AUDIT_LOGS_TABLE)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (params.action) {
        query = query.ilike("action", `%${params.action}%`);
    }

    if (params.resourceType) {
        query = query.ilike("resource_type", `%${params.resourceType}%`);
    }

    if (params.dateFrom) {
        query = query.gte("created_at", params.dateFrom);
    }

    if (params.dateTo) {
        query = query.lte("created_at", params.dateTo);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
        console.error("[audit] query error", error);
        return {
            items: [] as AuditLogEntry[],
            total: 0,
            page,
            pageSize,
            error: "Erro ao consultar logs de auditoria.",
        };
    }

    const items: AuditLogEntry[] = ((data || []) as AuditLogEntry[]).map(
        (item): AuditLogEntry => ({
            ...item,
            actor_user_email: item.actor_user_email ?? null,
            actor_user_name: item.actor_user_name ?? null,
        })
    );

    const actorIds = Array.from(
        new Set(
            items
                .map((item) => item.actor_user_id)
                .filter((value): value is string => Boolean(value))
        )
    );

    if (actorIds.length > 0) {
        const userEntries: Array<
            readonly [string, { email: string | null; name: string | null } | null]
        > = await Promise.all(
            actorIds.map(async (actorId) => {
                const { data: userData, error: userError } =
                    await admin.auth.admin.getUserById(actorId);

                if (userError || !userData?.user) {
                    return [actorId, null] as const;
                }

                const metadata = userData.user.user_metadata as
                    | Record<string, unknown>
                    | undefined;
                const actorName =
                    (typeof metadata?.nome === "string" && metadata.nome) ||
                    (typeof metadata?.full_name === "string" && metadata.full_name) ||
                    null;

                return [
                    actorId,
                    {
                        email: userData.user.email ?? null,
                        name: actorName,
                    },
                ] as const;
            })
        );

        const actorMap: Map<
            string,
            { email: string | null; name: string | null } | null
        > = new Map(userEntries);

        for (const item of items) {
            if (!item.actor_user_id) {
                continue;
            }

            const actor = actorMap.get(item.actor_user_id);
            if (!actor) {
                continue;
            }

            item.actor_user_email = actor.email;
            item.actor_user_name = actor.name;
        }
    }

    return {
        items,
        total: count || 0,
        page,
        pageSize,
    };
}
