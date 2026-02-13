"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function hasAuthenticatedUser() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (user && !userError) {
        return { ok: true as const, supabase, user };
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
        return { ok: true as const, supabase, user: session.user };
    }

    const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();

    if (refreshed.session?.user && !refreshError) {
        return { ok: true as const, supabase, user: refreshed.session.user };
    }

    return { ok: false as const, supabase, user: null };
}

export async function updateMyProfile(formData: FormData) {
    const auth = await hasAuthenticatedUser();
    const { supabase, user } = auth;

    if (!auth.ok || !user) {
        return { error: "Sua sessão expirou. Faça login novamente." };
    }

    const nome = (formData.get("nome") as string)?.trim();
    const senha = (formData.get("senha") as string)?.trim();
    const confirmarSenha = (formData.get("confirmar_senha") as string)?.trim();

    if (!nome && !senha) {
        return { error: "Informe ao menos um campo para atualizar." };
    }

    if (senha) {
        if (senha.length < 6) {
            return { error: "A nova senha deve ter no mínimo 6 caracteres." };
        }

        if (senha !== confirmarSenha) {
            return { error: "A confirmação de senha não confere." };
        }
    }

    const updatePayload: {
        password?: string;
        data?: {
            nome?: string | null;
            full_name?: string | null;
        };
    } = {};

    if (senha) {
        updatePayload.password = senha;
    }

    if (nome) {
        updatePayload.data = {
            nome,
            full_name: nome,
        };
    }

    const { error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
        console.error("Update Profile Error:", error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/admin/perfil");
    return { success: "Perfil atualizado com sucesso." };
}
