"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AdminUserItem {
    id: string;
    email: string;
    nome: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
}

async function hasAuthenticatedUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (user && !userError) {
        return { ok: true as const, supabase };
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
        return { ok: true as const, supabase };
    }

    const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();

    if (refreshed.session?.user && !refreshError) {
        return { ok: true as const, supabase };
    }

    return { ok: false as const, supabase };
}

export async function getAdminUsers() {
    const auth = await hasAuthenticatedUser();
    if (!auth.ok) {
        return {
            users: [] as AdminUserItem[],
            error: "Sua sessão expirou. Faça login novamente.",
        };
    }

    try {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 200,
        });

        if (error) {
            console.error("List Users Error:", error);
            return {
                users: [] as AdminUserItem[],
                error: "Erro ao listar usuários.",
            };
        }

        const users = (data?.users || [])
            .map((item) => ({
                id: item.id,
                email: item.email || "",
                nome:
                    (item.user_metadata?.nome as string | undefined) ||
                    (item.user_metadata?.full_name as string | undefined) ||
                    null,
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
        console.error("Unexpected getAdminUsers error:", error);
        return {
            users: [] as AdminUserItem[],
            error: "Não foi possível acessar a API de administração do Supabase.",
        };
    }
}

export async function createAdminUser(formData: FormData) {
    const auth = await hasAuthenticatedUser();
    if (!auth.ok) {
        return { error: "Sua sessão expirou. Faça login novamente." };
    }

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = (formData.get("password") as string)?.trim();
    const nome = (formData.get("nome") as string)?.trim();

    if (!email) {
        return { error: "E-mail é obrigatório." };
    }

    if (!password || password.length < 6) {
        return { error: "A senha deve ter no mínimo 6 caracteres." };
    }

    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                nome: nome || null,
                full_name: nome || null,
            },
        });

        if (error) {
            console.error("Create User Error:", error);
            if (error.message.toLowerCase().includes("already")) {
                return { error: "Já existe um usuário com este e-mail." };
            }
            return { error: "Erro ao criar usuário." };
        }

        revalidatePath("/admin/usuarios");
        return { success: "Usuário criado com sucesso." };
    } catch (error) {
        console.error("Unexpected createAdminUser error:", error);
        return {
            error: "Não foi possível criar usuário. Verifique a configuração do Supabase.",
        };
    }
}
