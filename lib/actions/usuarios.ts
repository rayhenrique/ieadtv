"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    AuthorizationError,
    requireAdmin,
    type UserRole,
} from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

const USER_ROLES_TABLE = "user_roles" as never;

export interface AdminUserItem {
    id: string;
    email: string;
    nome: string | null;
    role: UserRole;
    created_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
}

export async function getAdminUsers() {
    try {
        await requireAdmin("usuarios.read");

        const supabaseAdmin = createAdminClient();
        const [{ data, error }, { data: rolesData, error: rolesError }] =
            await Promise.all([
                supabaseAdmin.auth.admin.listUsers({
                    page: 1,
                    perPage: 500,
                }),
                supabaseAdmin.from(USER_ROLES_TABLE).select("user_id, role"),
            ]);

        if (error) {
            console.error("List Users Error:", error);
            return {
                users: [] as AdminUserItem[],
                error: "Erro ao listar usuários.",
            };
        }

        if (rolesError) {
            console.error("List User Roles Error:", rolesError);
        }

        const roleMap = new Map<string, UserRole>(
            ((rolesData || []) as Array<{ user_id: string; role: UserRole }>).map(
                (item) => [item.user_id, item.role]
            )
        );

        const users = (data?.users || [])
            .map((item) => ({
                id: item.id,
                email: item.email || "",
                nome:
                    (item.user_metadata?.nome as string | undefined) ||
                    (item.user_metadata?.full_name as string | undefined) ||
                    null,
                role: roleMap.get(item.id) || "operador",
                created_at: item.created_at || null,
                last_sign_in_at: item.last_sign_in_at || null,
                email_confirmed_at: item.email_confirmed_at || null,
            }))
            .sort((a, b) => {
                const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
                return bTime - aTime;
            });

        return { users };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return {
                users: [] as AdminUserItem[],
                error: error.message,
            };
        }

        console.error("Unexpected getAdminUsers error:", error);
        return {
            users: [] as AdminUserItem[],
            error: "Não foi possível acessar a API de administração do Supabase.",
        };
    }
}

export async function createAdminUser(formData: FormData) {
    try {
        const { user } = await requireAdmin("usuarios.create");

        const email = (formData.get("email") as string | null)?.trim().toLowerCase();
        const password = (formData.get("password") as string | null)?.trim();
        const nome = (formData.get("nome") as string | null)?.trim();
        const role = ((formData.get("role") as string | null)?.trim() ||
            "operador") as UserRole;

        if (!email) {
            return { error: "E-mail é obrigatório." };
        }

        if (!password || password.length < 6) {
            return { error: "A senha deve ter no mínimo 6 caracteres." };
        }

        if (role !== "admin" && role !== "operador") {
            return { error: "Papel inválido para o usuário." };
        }

        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                nome: nome || null,
                full_name: nome || null,
            },
        });

        if (error || !data.user) {
            console.error("Create User Error:", error);
            if (error?.message.toLowerCase().includes("already")) {
                return { error: "Já existe um usuário com este e-mail." };
            }
            return { error: "Erro ao criar usuário." };
        }

        const { error: roleError } = await supabaseAdmin
            .from(USER_ROLES_TABLE)
            .upsert(
                {
                    user_id: data.user.id,
                    role,
                    created_by: user.id,
                } as never,
                { onConflict: "user_id" }
            );

        if (roleError) {
            console.error("Create User Role Error:", roleError);
            return { error: "Usuário criado, mas falhou ao definir papel." };
        }

        await logAuditEvent({
            action: "USER_CREATE",
            resourceType: "users",
            resourceId: data.user.id,
            payload: { email, role },
            actorUserId: user.id,
            actorRole: "admin",
        });

        revalidatePath("/admin/usuarios");
        return { success: "Usuário criado com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected createAdminUser error:", error);
        return {
            error: "Não foi possível criar usuário. Verifique a configuração do Supabase.",
        };
    }
}

export async function setUserRole(userId: string, role: UserRole) {
    try {
        const { user } = await requireAdmin("usuarios.set_role");

        if (!userId) {
            return { error: "Usuário inválido." };
        }

        if (role !== "admin" && role !== "operador") {
            return { error: "Papel inválido." };
        }

        const supabaseAdmin = createAdminClient();
        const { data: currentRoleData } = await supabaseAdmin
            .from(USER_ROLES_TABLE)
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();

        const currentRole =
            ((currentRoleData as { role?: UserRole } | null)?.role as
                | UserRole
                | undefined) || "operador";

        if (currentRole === role) {
            return { success: "Papel já está atualizado." };
        }

        if (currentRole === "admin" && role === "operador") {
            const { count, error: adminCountError } = await supabaseAdmin
                .from(USER_ROLES_TABLE)
                .select("user_id", { head: true, count: "exact" })
                .eq("role", "admin");

            if (adminCountError) {
                console.error("Count admins error:", adminCountError);
                return { error: "Erro ao validar quantidade de administradores." };
            }

            if ((count || 0) <= 1) {
                return {
                    error: "Não é permitido rebaixar o último administrador do sistema.",
                };
            }
        }

        const { error } = await supabaseAdmin.from(USER_ROLES_TABLE).upsert(
            {
                user_id: userId,
                role,
                created_by: user.id,
            } as never,
            { onConflict: "user_id" }
        );

        if (error) {
            console.error("Set User Role Error:", error);
            return { error: "Erro ao atualizar papel do usuário." };
        }

        await logAuditEvent({
            action: "USER_ROLE_UPDATE",
            resourceType: "user_roles",
            resourceId: userId,
            payload: { from: currentRole, to: role },
            actorUserId: user.id,
            actorRole: "admin",
        });

        revalidatePath("/admin/usuarios");
        return { success: "Papel atualizado com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected setUserRole error:", error);
        return { error: "Erro inesperado ao atualizar papel." };
    }
}
