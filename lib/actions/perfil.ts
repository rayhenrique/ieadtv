"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export async function updateMyProfile(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("perfil.update");

        const nome = (formData.get("nome") as string | null)?.trim();
        const senha = (formData.get("senha") as string | null)?.trim();
        const confirmarSenha = (formData.get("confirmar_senha") as string | null)?.trim();

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

        await logAuditEvent({
            action: "PROFILE_UPDATE",
            resourceType: "users",
            resourceId: user.id,
            payload: {
                updatedName: Boolean(nome),
                updatedPassword: Boolean(senha),
            },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/perfil");
        return { success: "Perfil atualizado com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected updateMyProfile error:", error);
        return { error: "Erro inesperado ao atualizar perfil." };
    }
}