"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export interface News {
    id: string;
    titulo: string;
    slug: string;
    resumo: string;
    conteudo: string;
    imagem_capa_url: string;
    link_fotos: string | null;
    galeria_fotos: string[];
    categoria_id: string;
    autor: string;
    publicado: boolean;
    destaque: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    categorias?: {
        nome: string;
        slug: string;
    };
}

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function parsePublicationDate(input: FormDataEntryValue | null) {
    const value = typeof input === "string" ? input.trim() : "";
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;

    return parsed.toISOString();
}

export async function getNews() {
    try {
        const { supabase } = await requireBackofficeUser("noticias.read");
        const { data, error } = await supabase
            .from("noticias")
            .select("*, categorias(nome, slug)")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching news:", error);
            return [];
        }

        return data as News[];
    } catch {
        return [];
    }
}

export async function getNewsItem(slugOrId: string) {
    try {
        const { supabase } = await requireBackofficeUser("noticias.read_one");

        let query = supabase
            .from("noticias")
            .select("*, categorias(nome, slug)")
            .eq("slug", slugOrId)
            .single();

        let { data, error } = await query;

        if (
            error &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                slugOrId
            )
        ) {
            query = supabase
                .from("noticias")
                .select("*, categorias(nome, slug)")
                .eq("id", slugOrId)
                .single();
            ({ data, error } = await query);
        }

        if (error) return null;
        return data as News;
    } catch {
        return null;
    }
}

export async function getPublicNews(limit = 3) {
    const supabase = createPublicClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
        .from("noticias")
        .select("*, categorias(nome, slug)")
        .eq("publicado", true)
        .or(`published_at.is.null,published_at.lte.${nowIso}`)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching public news:", error);
        return [];
    }

    return data as News[];
}

export async function getPublicNewsItem(slug: string) {
    const supabase = createPublicClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
        .from("noticias")
        .select("*, categorias(nome, slug)")
        .eq("slug", slug)
        .eq("publicado", true)
        .or(`published_at.is.null,published_at.lte.${nowIso}`)
        .single();

    if (error) return null;
    return data as News;
}

export async function createNews(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("noticias.create");

        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const slug = (formData.get("slug") as string | null)?.trim() || slugify(titulo);
        const resumo = (formData.get("resumo") as string | null)?.trim() || "";
        const conteudo = (formData.get("conteudo") as string | null) || "";
        const categoria_id = (formData.get("categoria_id") as string | null)?.trim() || "";
        const link_fotos = (formData.get("link_fotos") as string | null)?.trim() || null;
        const publicado = formData.get("publicado") === "on";
        const destaque = formData.get("destaque") === "on";
        const publicationDateInput = formData.get("published_at");
        const parsedPublicationDate = parsePublicationDate(publicationDateInput);

        if (parsedPublicationDate === undefined) {
            return { error: "Data de publicação inválida." };
        }

        const file = formData.get("imagem_capa") as File;
        let imagem_capa_url = "";

        if (file && file.size > 0) {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${slugify(titulo).substring(0, 20)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("posts")
                .upload(fileName, file);

            if (uploadError) {
                return { error: "Erro ao fazer upload da imagem de capa" };
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("posts").getPublicUrl(fileName);

            imagem_capa_url = publicUrl;
        }

        const galeria_fotos: string[] = [];
        const galleryFiles = formData.getAll("galeria_novas") as File[];

        for (let i = 0; i < galleryFiles.length; i++) {
            const gFile = galleryFiles[i];
            if (gFile && gFile.size > 0) {
                const gFileExt = gFile.name.split(".").pop();
                const gFileName = `galeria/${Date.now()}-${i}-${slugify(titulo).substring(0, 10)}.${gFileExt}`;

                const { error: gUploadError } = await supabase.storage
                    .from("posts")
                    .upload(gFileName, gFile);

                if (!gUploadError) {
                    const {
                        data: { publicUrl },
                    } = supabase.storage.from("posts").getPublicUrl(gFileName);
                    galeria_fotos.push(publicUrl);
                }
            }
        }

        const { data, error } = await supabase
            .from("noticias")
            .insert({
                titulo,
                slug,
                resumo,
                conteudo,
                imagem_capa_url,
                link_fotos,
                galeria_fotos: galeria_fotos.length > 0 ? galeria_fotos : null,
                categoria_id,
                publicado,
                destaque,
                autor: "Admin",
                published_at: publicado
                    ? parsedPublicationDate || new Date().toISOString()
                    : parsedPublicationDate || null,
            })
            .select("id")
            .single();

        if (error) {
            console.error("Create News Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma notícia com este slug." };
            }
            return { error: "Erro ao criar notícia." };
        }

        await logAuditEvent({
            action: "NEWS_CREATE",
            resourceType: "noticias",
            resourceId: data.id,
            payload: { titulo, slug, publicado, destaque },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/noticias");
        revalidatePath("/noticias");
        revalidatePath("/missoes");
        revalidatePath("/");
        redirect("/admin/noticias");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function updateNews(id: string, formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("noticias.update");

        const titulo = (formData.get("titulo") as string | null)?.trim() || "";
        const slug = (formData.get("slug") as string | null)?.trim() || slugify(titulo);
        const resumo = (formData.get("resumo") as string | null)?.trim() || "";
        const conteudo = (formData.get("conteudo") as string | null) || "";
        const categoria_id = (formData.get("categoria_id") as string | null)?.trim() || "";
        const link_fotos = (formData.get("link_fotos") as string | null)?.trim() || null;
        const publicado = formData.get("publicado") === "on";
        const destaque = formData.get("destaque") === "on";
        const publicationDateInput = formData.get("published_at");
        const parsedPublicationDate = parsePublicationDate(publicationDateInput);

        if (parsedPublicationDate === undefined) {
            return { error: "Data de publicação inválida." };
        }

        const existingGallery = formData.getAll("galeria_existente") as string[];
        const galeria_fotos = [...existingGallery];

        const updates: {
            titulo: string;
            slug: string;
            resumo: string;
            conteudo: string;
            categoria_id: string;
            link_fotos: string | null;
            publicado: boolean;
            destaque: boolean;
            published_at: string | null;
            updated_at: string;
            imagem_capa_url?: string;
            galeria_fotos?: string[] | null;
        } = {
            titulo,
            slug,
            resumo,
            conteudo,
            categoria_id,
            link_fotos,
            publicado,
            destaque,
            published_at: publicado
                ? parsedPublicationDate || new Date().toISOString()
                : parsedPublicationDate || null,
            updated_at: new Date().toISOString(),
        };

        const file = formData.get("imagem_capa") as File;
        if (file && file.size > 0) {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${slugify(titulo).substring(0, 20)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("posts")
                .upload(fileName, file);

            if (uploadError) {
                return { error: "Erro ao fazer upload da imagem de capa" };
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("posts").getPublicUrl(fileName);

            updates.imagem_capa_url = publicUrl;
        }

        const galleryFiles = formData.getAll("galeria_novas") as File[];
        for (let i = 0; i < galleryFiles.length; i++) {
            const gFile = galleryFiles[i];
            if (gFile && gFile.size > 0) {
                const gFileExt = gFile.name.split(".").pop();
                const gFileName = `galeria/${Date.now()}-${i}-${slugify(titulo).substring(0, 10)}.${gFileExt}`;

                const { error: gUploadError } = await supabase.storage
                    .from("posts")
                    .upload(gFileName, gFile);

                if (!gUploadError) {
                    const {
                        data: { publicUrl },
                    } = supabase.storage.from("posts").getPublicUrl(gFileName);
                    galeria_fotos.push(publicUrl);
                }
            }
        }

        updates.galeria_fotos = galeria_fotos.length > 0 ? galeria_fotos : null;

        const { error } = await supabase
            .from("noticias")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("Update News Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma notícia com este slug." };
            }
            return { error: "Erro ao atualizar notícia." };
        }

        await logAuditEvent({
            action: "NEWS_UPDATE",
            resourceType: "noticias",
            resourceId: id,
            payload: { titulo, slug, publicado, destaque },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/noticias");
        revalidatePath("/noticias");
        revalidatePath("/missoes");
        revalidatePath("/");
        redirect("/admin/noticias");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function deleteNews(id: string) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("noticias.delete");

        const { error } = await supabase.from("noticias").delete().eq("id", id);

        if (error) {
            return { error: "Erro ao excluir notícia." };
        }

        await logAuditEvent({
            action: "NEWS_DELETE",
            resourceType: "noticias",
            resourceId: id,
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/noticias");
        revalidatePath("/noticias");
        revalidatePath("/missoes");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        return { error: "Erro inesperado ao excluir notícia." };
    }
}