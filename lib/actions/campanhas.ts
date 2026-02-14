"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

export interface Campanha {
    id: string;
    titulo: string;
    slug: string;
    descricao: string | null;
    conteudo: string | null;
    imagem_url: string | null;
    meta_valor: number | null;
    valor_arrecadado: number;
    ativa: boolean;
    tipo: string;
    data_inicio: string | null;
    data_fim: string | null;
    created_at: string;
    updated_at?: string | null;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

function toNumberOrNull(value: FormDataEntryValue | null) {
    if (typeof value !== "string" || !value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export async function getCampanhasAdmin() {
    try {
        const { supabase } = await requireBackofficeUser("campanhas.read");

        const { data, error } = await supabase
            .from("campanhas")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching campanhas:", error);
            return { campanhas: [] as Campanha[], error: "Erro ao carregar campanhas." };
        }

        return { campanhas: (data || []) as Campanha[] };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { campanhas: [] as Campanha[], error: error.message };
        }

        console.error("Unexpected getCampanhasAdmin error:", error);
        return { campanhas: [] as Campanha[], error: "Erro ao carregar campanhas." };
    }
}

export async function saveCampanha(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("campanhas.save");

        const id = (formData.get("id") as string | null)?.trim() || null;
        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const providedSlug = (formData.get("slug") as string | null)?.trim() || "";
        const slug = providedSlug || slugify(titulo);

        if (!titulo || !slug) {
            return { error: "Título e slug são obrigatórios." };
        }

        const payload = {
            titulo,
            slug,
            descricao: (formData.get("descricao") as string | null)?.trim() || null,
            conteudo: (formData.get("conteudo") as string | null)?.trim() || null,
            imagem_url: (formData.get("imagem_url") as string | null)?.trim() || null,
            meta_valor: toNumberOrNull(formData.get("meta_valor")),
            valor_arrecadado: toNumberOrNull(formData.get("valor_arrecadado")) || 0,
            ativa: (formData.get("ativa") as string | null) === "true",
            tipo: (formData.get("tipo") as string | null)?.trim() || "social",
            data_inicio: (formData.get("data_inicio") as string | null)?.trim() || null,
            data_fim: (formData.get("data_fim") as string | null)?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        if (id) {
            const { error } = await supabase
                .from("campanhas")
                .update(payload)
                .eq("id", id);

            if (error) {
                console.error("Update Campanha Error:", error);
                return { error: "Erro ao atualizar campanha." };
            }

            await logAuditEvent({
                action: "CAMPANHA_UPDATE",
                resourceType: "campanhas",
                resourceId: id,
                payload: { titulo, slug },
                actorUserId: user.id,
                actorRole: role,
            });
        } else {
            const { data, error } = await supabase
                .from("campanhas")
                .insert(payload)
                .select("id")
                .single();

            if (error) {
                console.error("Create Campanha Error:", error);
                return { error: "Erro ao criar campanha." };
            }

            await logAuditEvent({
                action: "CAMPANHA_CREATE",
                resourceType: "campanhas",
                resourceId: data.id,
                payload: { titulo, slug },
                actorUserId: user.id,
                actorRole: role,
            });
        }

        revalidatePath("/admin/campanhas");
        revalidatePath("/campanhas");
        revalidatePath("/");

        return { success: "Campanha salva com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected saveCampanha error:", error);
        return { error: "Erro inesperado ao salvar campanha." };
    }
}

export async function deleteCampanha(id: string) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("campanhas.delete");

        const { error } = await supabase.from("campanhas").delete().eq("id", id);

        if (error) {
            console.error("Delete Campanha Error:", error);
            return { error: "Erro ao excluir campanha." };
        }

        await logAuditEvent({
            action: "CAMPANHA_DELETE",
            resourceType: "campanhas",
            resourceId: id,
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/campanhas");
        revalidatePath("/campanhas");
        revalidatePath("/");

        return { success: "Campanha excluída com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected deleteCampanha error:", error);
        return { error: "Erro inesperado ao excluir campanha." };
    }
}

export async function getPublicCampanhas() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("campanhas")
        .select("*")
        .eq("ativa", true)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching public campanhas:", error);
        return [] as Campanha[];
    }

    return (data || []) as Campanha[];
}