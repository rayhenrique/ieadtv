"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export interface EventItem {
    id: string;
    titulo: string;
    descricao: string | null;
    local: string | null;
    link: string | null;
    data_inicio: string;
    data_fim: string | null;
    created_at?: string;
    updated_at?: string | null;
}

function toIsoOrNull(value: FormDataEntryValue | null): string | null | undefined {
    const stringValue = typeof value === "string" ? value.trim() : "";
    if (!stringValue) return null;

    const parsed = new Date(stringValue);
    if (Number.isNaN(parsed.getTime())) return undefined;

    return parsed.toISOString();
}

export async function getEvents() {
    try {
        const { supabase } = await requireBackofficeUser("eventos.read");
        const { data, error } = await supabase
            .from("eventos")
            .select("*")
            .order("data_inicio", { ascending: true });

        if (error) {
            console.error("Error fetching events:", error);
            return [];
        }

        return data as EventItem[];
    } catch {
        return [];
    }
}

export async function getPublicEvents(limit = 4) {
    const supabase = createPublicClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .or(
            `data_inicio.gte.${nowIso},and(data_inicio.lte.${nowIso},data_fim.gte.${nowIso})`
        )
        .order("data_inicio", { ascending: true })
        .limit(limit);

    if (error) {
        console.error("Error fetching public events:", error);
        return [];
    }

    return data as EventItem[];
}

export async function getEvent(id: string) {
    try {
        const { supabase } = await requireBackofficeUser("eventos.read_one");
        const { data, error } = await supabase
            .from("eventos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) return null;
        return data as EventItem;
    } catch {
        return null;
    }
}

export async function createEvent(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("eventos.create");

        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const descricao = (formData.get("descricao") as string | null)?.trim() || null;
        const local = (formData.get("local") as string | null)?.trim() || null;
        const link = (formData.get("link") as string | null)?.trim() || null;
        const data_inicio = toIsoOrNull(formData.get("data_inicio"));
        const data_fim = toIsoOrNull(formData.get("data_fim"));

        if (!titulo) {
            return { error: "Título obrigatório." };
        }

        if (data_inicio === undefined || data_fim === undefined) {
            return { error: "Data/hora inválida." };
        }

        if (!data_inicio) {
            return { error: "Data e horário de início são obrigatórios." };
        }

        if (data_fim && new Date(data_fim) < new Date(data_inicio)) {
            return { error: "A data/hora de fim deve ser maior que a de início." };
        }

        const { data, error } = await supabase
            .from("eventos")
            .insert({
                titulo,
                descricao,
                local,
                link,
                data_inicio,
                data_fim,
            })
            .select("id")
            .single();

        if (error) {
            console.error("Create Event Error:", error);
            return { error: "Erro ao criar evento." };
        }

        await logAuditEvent({
            action: "EVENT_CREATE",
            resourceType: "eventos",
            resourceId: data.id,
            payload: { titulo, data_inicio, data_fim },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/eventos");
        revalidatePath("/eventos");
        revalidatePath("/");
        redirect("/admin/eventos");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function updateEvent(id: string, formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("eventos.update");

        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const descricao = (formData.get("descricao") as string | null)?.trim() || null;
        const local = (formData.get("local") as string | null)?.trim() || null;
        const link = (formData.get("link") as string | null)?.trim() || null;
        const data_inicio = toIsoOrNull(formData.get("data_inicio"));
        const data_fim = toIsoOrNull(formData.get("data_fim"));

        if (!titulo) {
            return { error: "Título obrigatório." };
        }

        if (data_inicio === undefined || data_fim === undefined) {
            return { error: "Data/hora inválida." };
        }

        if (!data_inicio) {
            return { error: "Data e horário de início são obrigatórios." };
        }

        if (data_fim && new Date(data_fim) < new Date(data_inicio)) {
            return { error: "A data/hora de fim deve ser maior que a de início." };
        }

        const { error } = await supabase
            .from("eventos")
            .update({
                titulo,
                descricao,
                local,
                link,
                data_inicio,
                data_fim,
            })
            .eq("id", id);

        if (error) {
            console.error("Update Event Error:", error);
            return { error: "Erro ao atualizar evento." };
        }

        await logAuditEvent({
            action: "EVENT_UPDATE",
            resourceType: "eventos",
            resourceId: id,
            payload: { titulo, data_inicio, data_fim },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/eventos");
        revalidatePath("/eventos");
        revalidatePath("/");
        redirect("/admin/eventos");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function deleteEvent(id: string) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("eventos.delete");

        const { error } = await supabase.from("eventos").delete().eq("id", id);

        if (error) {
            return { error: "Erro ao excluir evento." };
        }

        await logAuditEvent({
            action: "EVENT_DELETE",
            resourceType: "eventos",
            resourceId: id,
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/eventos");
        revalidatePath("/eventos");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        return { error: "Erro inesperado ao excluir evento." };
    }
}
