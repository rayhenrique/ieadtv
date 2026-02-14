"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export interface SiteSetting {
    key: string;
    value: string;
    label: string;
}

export async function getSiteSettings() {
    try {
        const { supabase } = await requireBackofficeUser("configuracoes.read");

        const { data, error } = await supabase
            .from("site_settings")
            .select("key, value, label")
            .order("key", { ascending: true });

        if (error) {
            console.error("Error fetching settings:", error);
            return { settings: [] as SiteSetting[], error: "Erro ao carregar configurações." };
        }

        return { settings: (data || []) as SiteSetting[] };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { settings: [] as SiteSetting[], error: error.message };
        }

        console.error("Unexpected getSiteSettings error:", error);
        return { settings: [] as SiteSetting[], error: "Erro ao carregar configurações." };
    }
}

export async function saveSiteSettings(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("configuracoes.save");

        const updates = Array.from(formData.entries())
            .filter(([key]) => key.startsWith("setting_"))
            .map(([key, value]) => ({
                key: key.replace("setting_", ""),
                value: typeof value === "string" ? value : "",
            }));

        if (updates.length === 0) {
            return { error: "Nenhuma configuração informada." };
        }

        const results = await Promise.all(
            updates.map((setting) =>
                supabase
                    .from("site_settings")
                    .update({ value: setting.value })
                    .eq("key", setting.key)
            )
        );

        const failed = results.find((result) => result.error);
        if (failed?.error) {
            console.error("Save settings error:", failed.error);
            return { error: "Erro ao salvar configurações." };
        }

        await logAuditEvent({
            action: "SETTINGS_UPDATE",
            resourceType: "site_settings",
            resourceId: null,
            payload: {
                updatedKeys: updates.map((item) => item.key),
            },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/configuracoes");
        revalidatePath("/");

        return { success: "Configurações salvas com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected saveSiteSettings error:", error);
        return { error: "Erro inesperado ao salvar configurações." };
    }
}