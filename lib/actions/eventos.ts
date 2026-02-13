"use server";

import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function toIsoOrNull(value: FormDataEntryValue | null) {
    const stringValue = typeof value === "string" ? value : "";
    if (!stringValue) return null;
    return new Date(stringValue).toISOString();
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

export async function getEvents() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .order("data_inicio", { ascending: true });

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }

    return data as EventItem[];
}

export async function getPublicEvents(limit = 4) {
    const supabase = createPublicClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .gte("data_inicio", nowIso)
        .order("data_inicio", { ascending: true })
        .limit(limit);

    if (error) {
        console.error("Error fetching public events:", error);
        return [];
    }

    return data as EventItem[];
}

export async function getEvent(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data as EventItem;
}

export async function createEvent(formData: FormData) {
    const auth = await hasAuthenticatedUser();
    const { supabase } = auth;
    if (!auth.ok) {
        return { error: "Sua sessão expirou. Faça login novamente." };
    }

    const titulo = (formData.get("titulo") as string)?.trim();
    const descricao = (formData.get("descricao") as string)?.trim();
    const local = (formData.get("local") as string)?.trim();
    const link = (formData.get("link") as string)?.trim();
    const data_inicio = toIsoOrNull(formData.get("data_inicio"));
    const data_fim = toIsoOrNull(formData.get("data_fim"));

    if (!titulo) {
        return { error: "Título obrigatório." };
    }

    if (!data_inicio) {
        return { error: "Data e horário de início são obrigatórios." };
    }

    if (data_fim && new Date(data_fim) < new Date(data_inicio)) {
        return { error: "A data/hora de fim deve ser maior que a de início." };
    }

    const { error } = await supabase.from("eventos").insert({
        titulo,
        descricao: descricao || null,
        local: local || null,
        link: link || null,
        data_inicio,
        data_fim,
    });

    if (error) {
        console.error("Create Event Error:", error);
        return { error: "Erro ao criar evento." };
    }

    revalidatePath("/admin/eventos");
    revalidatePath("/eventos");
    revalidatePath("/");
    redirect("/admin/eventos");
}

export async function updateEvent(id: string, formData: FormData) {
    const auth = await hasAuthenticatedUser();
    const { supabase } = auth;
    if (!auth.ok) {
        return { error: "Sua sessão expirou. Faça login novamente." };
    }

    const titulo = (formData.get("titulo") as string)?.trim();
    const descricao = (formData.get("descricao") as string)?.trim();
    const local = (formData.get("local") as string)?.trim();
    const link = (formData.get("link") as string)?.trim();
    const data_inicio = toIsoOrNull(formData.get("data_inicio"));
    const data_fim = toIsoOrNull(formData.get("data_fim"));

    if (!titulo) {
        return { error: "Título obrigatório." };
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
            descricao: descricao || null,
            local: local || null,
            link: link || null,
            data_inicio,
            data_fim,
        })
        .eq("id", id);

    if (error) {
        console.error("Update Event Error:", error);
        return { error: "Erro ao atualizar evento." };
    }

    revalidatePath("/admin/eventos");
    revalidatePath("/eventos");
    revalidatePath("/");
    redirect("/admin/eventos");
}

export async function deleteEvent(id: string) {
    const auth = await hasAuthenticatedUser();
    const { supabase } = auth;
    if (!auth.ok) {
        return { error: "Sua sessão expirou. Faça login novamente." };
    }

    const { error } = await supabase.from("eventos").delete().eq("id", id);

    if (error) {
        return { error: "Erro ao excluir evento." };
    }

    revalidatePath("/admin/eventos");
    revalidatePath("/eventos");
    revalidatePath("/");
}
