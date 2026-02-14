"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export interface Banner {
    id: string;
    titulo: string;
    imagem_url: string;
    link_destino: string | null;
    ativo: boolean;
    ordem: number;
    created_at: string;
}

export async function getBanners() {
    try {
        const { supabase } = await requireBackofficeUser("banners.read");
        const { data, error } = await supabase
            .from("banners")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            console.error("Error fetching banners:", error);
            return [];
        }

        return data as Banner[];
    } catch {
        return [];
    }
}

export async function getBanner(id: string) {
    try {
        const { supabase } = await requireBackofficeUser("banners.read_one");
        const { data, error } = await supabase
            .from("banners")
            .select("*")
            .eq("id", id)
            .single();

        if (error) return null;
        return data as Banner;
    } catch {
        return null;
    }
}

export async function getPublicBanners() {
    const supabase = createPublicClient();
    const { data, error } = await supabase
        .from("banners")
        .select("id, titulo, imagem_url, link_destino")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

    if (error) {
        console.error("Error fetching public banners:", error);
        return [];
    }

    return (data || []) as Pick<Banner, "id" | "titulo" | "imagem_url" | "link_destino">[];
}

export async function createBanner(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("banners.create");

        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const link_destino = (formData.get("link_destino") as string | null)?.trim() || null;
        const ativo = formData.get("ativo") === "on";
        const ordem = parseInt((formData.get("ordem") as string) || "0", 10) || 0;
        const file = formData.get("imagem") as File;

        if (!file || file.size === 0) {
            return { error: "Imagem é obrigatória." };
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("banners")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: "Erro ao enviar imagem." };
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from("banners").getPublicUrl(fileName);

        const { data, error: dbError } = await supabase
            .from("banners")
            .insert({
                titulo,
                imagem_url: publicUrl,
                link_destino,
                ativo,
                ordem,
            })
            .select("id")
            .single();

        if (dbError) {
            console.error("DB error:", dbError);
            return { error: "Erro ao salvar banner." };
        }

        await logAuditEvent({
            action: "BANNER_CREATE",
            resourceType: "banners",
            resourceId: data.id,
            payload: { titulo, ativo, ordem },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/banners");
        revalidatePath("/");
        redirect("/admin/banners");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function updateBanner(id: string, formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("banners.update");

        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const link_destino = (formData.get("link_destino") as string | null)?.trim() || null;
        const ativo = formData.get("ativo") === "on";
        const ordem = parseInt((formData.get("ordem") as string) || "0", 10) || 0;
        const file = formData.get("imagem") as File;

        const updates: Partial<Banner> = {
            titulo,
            link_destino,
            ativo,
            ordem,
        };

        if (file && file.size > 0) {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("banners")
                .upload(fileName, file);

            if (uploadError) {
                return { error: "Erro ao enviar imagem." };
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("banners").getPublicUrl(fileName);

            updates.imagem_url = publicUrl;
        }

        const { error: dbError } = await supabase
            .from("banners")
            .update(updates)
            .eq("id", id);

        if (dbError) {
            console.error("DB Update Error", dbError);
            return { error: "Erro ao atualizar banner." };
        }

        await logAuditEvent({
            action: "BANNER_UPDATE",
            resourceType: "banners",
            resourceId: id,
            payload: updates as Record<string, unknown>,
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/banners");
        revalidatePath("/");
        redirect("/admin/banners");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function deleteBanner(id: string, imageUrl: string) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("banners.delete");

        const fileName = imageUrl.split("/").pop();
        if (fileName) {
            await supabase.storage.from("banners").remove([fileName]);
        }

        const { error } = await supabase.from("banners").delete().eq("id", id);

        if (error) {
            return { error: "Erro ao excluir banner." };
        }

        await logAuditEvent({
            action: "BANNER_DELETE",
            resourceType: "banners",
            resourceId: id,
            payload: { imageUrl },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/banners");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        return { error: "Erro inesperado ao excluir banner." };
    }
}

export async function toggleBannerStatus(id: string, currentStatus: boolean) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("banners.toggle_status");

        const nextStatus = !currentStatus;

        const { error } = await supabase
            .from("banners")
            .update({ ativo: nextStatus })
            .eq("id", id);

        if (error) {
            return { error: "Erro ao alterar status do banner." };
        }

        await logAuditEvent({
            action: "BANNER_TOGGLE_STATUS",
            resourceType: "banners",
            resourceId: id,
            payload: { previous: currentStatus, current: nextStatus },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/banners");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        return { error: "Erro inesperado ao alterar status." };
    }
}