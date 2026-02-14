"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export interface PaginaEstatica {
    id: string;
    slug: string;
    titulo: string;
    conteudo: string | null;
    updated_at: string | null;
}

export async function getAdminStaticPages() {
    try {
        const { supabase } = await requireBackofficeUser("paginas.read");
        const { data, error } = await supabase
            .from("paginas_estaticas")
            .select("*")
            .order("slug", { ascending: true });

        if (error) {
            console.error("Error fetching static pages:", error);
            return { pages: [] as PaginaEstatica[], error: "Erro ao carregar páginas." };
        }

        return { pages: (data || []) as PaginaEstatica[] };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { pages: [] as PaginaEstatica[], error: error.message };
        }

        console.error("Unexpected getAdminStaticPages error:", error);
        return { pages: [] as PaginaEstatica[], error: "Erro ao carregar páginas." };
    }
}

export async function saveStaticPage(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("paginas.save");

        const slug = (formData.get("slug") as string | null)?.trim() || "";
        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const conteudo = (formData.get("conteudo") as string | null) || "";

        if (!slug || !titulo) {
            return { error: "Slug e título são obrigatórios." };
        }

        const { error } = await supabase
            .from("paginas_estaticas")
            .upsert(
                {
                    slug,
                    titulo,
                    conteudo,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "slug" }
            );

        if (error) {
            console.error("Save static page error:", error);
            return { error: "Erro ao salvar página." };
        }

        await logAuditEvent({
            action: "PAGINA_SAVE",
            resourceType: "paginas_estaticas",
            resourceId: slug,
            payload: { titulo },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/paginas");
        revalidatePath("/institucional");
        revalidatePath("/lgpd");
        revalidatePath("/");

        return { success: "Página salva com sucesso." };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected saveStaticPage error:", error);
        return { error: "Erro inesperado ao salvar página." };
    }
}

export async function uploadStaticPageImage(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("paginas.upload_image");

        const file = formData.get("file") as File | null;

        if (!file || file.size === 0) {
            return { error: "Imagem inválida." };
        }

        if (file.size > 10 * 1024 * 1024) {
            return { error: "A imagem deve ter no máximo 10MB." };
        }

        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `paginas/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(fileName, file, { upsert: false });

        if (uploadError) {
            return { error: `Erro no upload: ${uploadError.message}` };
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from("posts").getPublicUrl(fileName);

        await logAuditEvent({
            action: "PAGINA_IMAGE_UPLOAD",
            resourceType: "storage.posts",
            resourceId: fileName,
            payload: { size: file.size, contentType: file.type },
            actorUserId: user.id,
            actorRole: role,
        });

        return { url: publicUrl };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected uploadStaticPageImage error:", error);
        return { error: "Erro inesperado no upload da imagem." };
    }
}