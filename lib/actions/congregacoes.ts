"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface Congregation {
    id: string;
    nome: string;
    slug: string;
    endereco: string | null;
    dirigente: string | null;
    historico: string | null;
    imagem_url: string | null;
    created_at?: string;
    updated_at?: string | null;
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

const STORAGE_BUCKET_CANDIDATES = ["congregacoes", "posts"] as const;

function isNextRedirectError(error: unknown) {
    if (!error || typeof error !== "object") return false;
    const maybeDigest = (error as { digest?: string }).digest;
    return typeof maybeDigest === "string" && maybeDigest.startsWith("NEXT_REDIRECT");
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

function extractStorageObject(imageUrl?: string | null) {
    if (!imageUrl) return null;
    const marker = "/storage/v1/object/public/";
    const index = imageUrl.indexOf(marker);
    if (index === -1) return null;
    const remainder = imageUrl.slice(index + marker.length);
    const slashIndex = remainder.indexOf("/");
    if (slashIndex === -1) return null;

    const bucket = remainder.slice(0, slashIndex);
    const path = remainder.slice(slashIndex + 1);

    if (!bucket || !path) return null;
    return { bucket, path };
}

export async function getCongregations() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("congregacoes")
        .select("*")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Error fetching congregations:", error);
        return [];
    }

    return data as Congregation[];
}

export async function getCongregation(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("congregacoes")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data as Congregation;
}

async function uploadCoverImage(supabase: Awaited<ReturnType<typeof createClient>>, file: File, nome: string) {
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = slugify(nome).slice(0, 24) || "congregacao";
    const fileName = `${Date.now()}-${safeName}.${fileExt}`;
    const contentType = file.type || "image/jpeg";
    const fileBuffer = await file.arrayBuffer();

    const uploadErrors: string[] = [];

    for (const bucket of STORAGE_BUCKET_CANDIDATES) {
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileBuffer, { contentType });

        if (uploadError) {
            uploadErrors.push(`${bucket}: ${uploadError.message}`);
            continue;
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName);

        return { publicUrl };
    }

    return {
        error: `Erro ao fazer upload da imagem. ${uploadErrors.join(" | ")}`,
    };
}

export async function createCongregation(formData: FormData) {
    try {
        const auth = await hasAuthenticatedUser();
        const { supabase } = auth;

        if (!auth.ok) {
            return { error: "Sua sessão expirou. Faça login novamente." };
        }

        const nome = (formData.get("nome") as string)?.trim();
        const providedSlug = (formData.get("slug") as string)?.trim();
        const slug = providedSlug || slugify(nome || "");
        const endereco = (formData.get("endereco") as string)?.trim();
        const dirigente = (formData.get("dirigente") as string)?.trim();
        const historico = (formData.get("historico") as string)?.trim();
        const imagemUrlManual = (formData.get("imagem_url") as string)?.trim();
        const file = formData.get("imagem") as File | null;

        if (!nome) {
            return { error: "Nome obrigatório." };
        }

        if (!slug) {
            return { error: "Slug obrigatório." };
        }

        let imagem_url = imagemUrlManual || null;

        if (file && file.size > 0) {
            const uploadResult = await uploadCoverImage(supabase, file, nome);
            if ("error" in uploadResult) return uploadResult;
            imagem_url = uploadResult.publicUrl;
        }

        const { error } = await supabase.from("congregacoes").insert({
            nome,
            slug,
            endereco: endereco || null,
            dirigente: dirigente || null,
            historico: historico || null,
            imagem_url,
        });

        if (error) {
            console.error("Create Congregation Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma congregação com este slug." };
            }
            return { error: "Erro ao criar congregação." };
        }

        revalidatePath("/admin/congregacoes");
        revalidatePath("/congregacoes");
        revalidatePath("/");
        redirect("/admin/congregacoes");
    } catch (error) {
        if (isNextRedirectError(error)) {
            throw error;
        }
        console.error("Unexpected createCongregation error:", error);
        return {
            error: "Erro inesperado ao salvar. Tente novamente com uma imagem menor.",
        };
    }
}

export async function updateCongregation(id: string, formData: FormData) {
    try {
        const auth = await hasAuthenticatedUser();
        const { supabase } = auth;

        if (!auth.ok) {
            return { error: "Sua sessão expirou. Faça login novamente." };
        }

        const current = await getCongregation(id);

        const nome = (formData.get("nome") as string)?.trim();
        const providedSlug = (formData.get("slug") as string)?.trim();
        const slug = providedSlug || slugify(nome || "");
        const endereco = (formData.get("endereco") as string)?.trim();
        const dirigente = (formData.get("dirigente") as string)?.trim();
        const historico = (formData.get("historico") as string)?.trim();
        const imagemUrlManual = (formData.get("imagem_url") as string)?.trim();
        const file = formData.get("imagem") as File | null;

        if (!nome) {
            return { error: "Nome obrigatório." };
        }

        if (!slug) {
            return { error: "Slug obrigatório." };
        }

        const updates: Partial<Congregation> = {
            nome,
            slug,
            endereco: endereco || null,
            dirigente: dirigente || null,
            historico: historico || null,
        };

        if (imagemUrlManual) {
            updates.imagem_url = imagemUrlManual;
        }

        if (file && file.size > 0) {
            const uploadResult = await uploadCoverImage(supabase, file, nome);
            if ("error" in uploadResult) return uploadResult;
            updates.imagem_url = uploadResult.publicUrl;

            const oldObject = extractStorageObject(current?.imagem_url);
            if (oldObject) {
                await supabase.storage
                    .from(oldObject.bucket)
                    .remove([oldObject.path]);
            }
        }

        const { error } = await supabase
            .from("congregacoes")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("Update Congregation Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma congregação com este slug." };
            }
            return { error: "Erro ao atualizar congregação." };
        }

        revalidatePath("/admin/congregacoes");
        revalidatePath("/congregacoes");
        if (current?.slug) revalidatePath(`/congregacoes/${current.slug}`);
        revalidatePath(`/congregacoes/${slug}`);
        revalidatePath("/");
        redirect("/admin/congregacoes");
    } catch (error) {
        if (isNextRedirectError(error)) {
            throw error;
        }
        console.error("Unexpected updateCongregation error:", error);
        return {
            error: "Erro inesperado ao atualizar. Tente novamente.",
        };
    }
}

export async function deleteCongregation(id: string) {
    try {
        const auth = await hasAuthenticatedUser();
        const { supabase } = auth;

        if (!auth.ok) {
            return { error: "Sua sessão expirou. Faça login novamente." };
        }

        const current = await getCongregation(id);

        const { error } = await supabase
            .from("congregacoes")
            .delete()
            .eq("id", id);

        if (error) {
            return { error: "Erro ao excluir congregação." };
        }

        const storageObject = extractStorageObject(current?.imagem_url);
        if (storageObject) {
            await supabase.storage
                .from(storageObject.bucket)
                .remove([storageObject.path]);
        }

        revalidatePath("/admin/congregacoes");
        revalidatePath("/congregacoes");
        if (current?.slug) revalidatePath(`/congregacoes/${current.slug}`);
        revalidatePath("/");
    } catch (error) {
        console.error("Unexpected deleteCongregation error:", error);
        return {
            error: "Erro inesperado ao excluir congregação.",
        };
    }
}
