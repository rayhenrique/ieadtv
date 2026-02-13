"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("noticias")
        .select("*, categorias(nome, slug)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching news:", error);
        return [];
    }

    return data as News[];
}

export async function getNewsItem(slugOrId: string) {
    const supabase = await createClient();

    // Try to fetch by slug first (typical for public view)
    let query = supabase
        .from("noticias")
        .select("*, categorias(nome, slug)")
        .eq("slug", slugOrId)
        .single();

    let { data, error } = await query;

    // If failed (maybe UUID usage in admin?), try ID if it looks like UUID
    if (error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)) {
        query = supabase
            .from("noticias")
            .select("*, categorias(nome, slug)")
            .eq("id", slugOrId)
            .single();
        ({ data, error } = await query);
    }

    if (error) return null;
    return data as News;
}

export async function getPublicNews(limit = 3) {
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const titulo = formData.get("titulo") as string;
    const slug = formData.get("slug") as string || slugify(titulo);
    const resumo = formData.get("resumo") as string;
    const conteudo = formData.get("conteudo") as string;
    const categoria_id = formData.get("categoria_id") as string;
    const link_fotos = formData.get("link_fotos") as string;
    const publicado = formData.get("publicado") === "on";
    const destaque = formData.get("destaque") === "on";
    const publicationDateInput = formData.get("published_at");
    const parsedPublicationDate = parsePublicationDate(publicationDateInput);

    if (parsedPublicationDate === undefined) {
        return { error: "Data de publicação inválida." };
    }

    // Handle Cover Image
    const file = formData.get("imagem_capa") as File;
    let imagem_capa_url = "";

    if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${slugify(titulo).substring(0, 20)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(filePath, file);

        if (uploadError) {
            return { error: "Erro ao fazer upload da imagem de capa" };
        }

        const { data: { publicUrl } } = supabase.storage
            .from("posts")
            .getPublicUrl(filePath);

        imagem_capa_url = publicUrl;
    }

    // Handle Gallery Images
    const galeria_fotos: string[] = [];
    const galleryFiles = formData.getAll("galeria_novas") as File[];

    // Logic to limit total photos could be here, but for now we process all uploaded (up to max upload size/timeout)
    // Limit is loosely enforced by UI, but here we can iterate.

    for (let i = 0; i < galleryFiles.length; i++) {
        const gFile = galleryFiles[i];
        if (gFile && gFile.size > 0) {
            const gFileExt = gFile.name.split(".").pop();
            const gFileName = `galeria/${Date.now()}-${i}-${slugify(titulo).substring(0, 10)}.${gFileExt}`;

            const { error: gUploadError } = await supabase.storage
                .from("posts")
                .upload(gFileName, gFile);

            if (!gUploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("posts")
                    .getPublicUrl(gFileName);
                galeria_fotos.push(publicUrl);
            }
        }
    }

    const { error } = await supabase.from("noticias").insert({
        titulo,
        slug,
        resumo,
        conteudo,
        imagem_capa_url,
        link_fotos: link_fotos || null,
        galeria_fotos: galeria_fotos.length > 0 ? galeria_fotos : null,
        categoria_id,
        publicado,
        destaque,
        autor: "Admin",
        published_at: publicado
            ? parsedPublicationDate || new Date().toISOString()
            : parsedPublicationDate || null,
    });

    if (error) {
        console.error("Create News Error:", error);
        if (error.code === "23505") {
            return { error: "Já existe uma notícia com este slug." };
        }
        return { error: "Erro ao criar notícia." };
    }

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/missoes");
    revalidatePath("/");
    redirect("/admin/noticias");
}

export async function updateNews(id: string, formData: FormData) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const titulo = formData.get("titulo") as string;
    const slug = formData.get("slug") as string || slugify(titulo);
    const resumo = formData.get("resumo") as string;
    const conteudo = formData.get("conteudo") as string;
    const categoria_id = formData.get("categoria_id") as string;
    const link_fotos = formData.get("link_fotos") as string;
    const publicado = formData.get("publicado") === "on";
    const destaque = formData.get("destaque") === "on";
    const publicationDateInput = formData.get("published_at");
    const parsedPublicationDate = parsePublicationDate(publicationDateInput);

    if (parsedPublicationDate === undefined) {
        return { error: "Data de publicação inválida." };
    }

    // Reconstruct existing gallery from hidden inputs
    const existingGallery = formData.getAll("galeria_existente") as string[];
    const galeria_fotos = [...existingGallery];

    const updates: any = {
        titulo,
        slug,
        resumo,
        conteudo,
        categoria_id,
        link_fotos: link_fotos || null,
        publicado,
        destaque,
        published_at: publicado
            ? parsedPublicationDate || new Date().toISOString()
            : parsedPublicationDate || null,
        updated_at: new Date().toISOString(),
    };

    // Cover Image
    const file = formData.get("imagem_capa") as File;
    if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${slugify(titulo).substring(0, 20)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(filePath, file);

        if (uploadError) {
            return { error: "Erro ao fazer upload da imagem de capa" };
        }

        const { data: { publicUrl } } = supabase.storage
            .from("posts")
            .getPublicUrl(filePath);

        updates.imagem_capa_url = publicUrl;
    }

    // New Gallery Images
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
                const { data: { publicUrl } } = supabase.storage
                    .from("posts")
                    .getPublicUrl(gFileName);
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

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/missoes");
    revalidatePath("/");
    redirect("/admin/noticias");
}

export async function deleteNews(id: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase.from("noticias").delete().eq("id", id);

    if (error) {
        return { error: "Erro ao excluir notícia." };
    }

    revalidatePath("/admin/noticias");
    revalidatePath("/noticias");
    revalidatePath("/missoes");
    revalidatePath("/");
}
