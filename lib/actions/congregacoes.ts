"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

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
    try {
        const { supabase } = await requireBackofficeUser("congregacoes.read");
        const { data, error } = await supabase
            .from("congregacoes")
            .select("*")
            .order("nome", { ascending: true });

        if (error) {
            console.error("Error fetching congregations:", error);
            return [];
        }

        return data as Congregation[];
    } catch {
        return [];
    }
}

export async function getCongregation(id: string) {
    try {
        const { supabase } = await requireBackofficeUser("congregacoes.read_one");
        const { data, error } = await supabase
            .from("congregacoes")
            .select("*")
            .eq("id", id)
            .single();

        if (error) return null;
        return data as Congregation;
    } catch {
        return null;
    }
}

async function uploadCoverImage(
    supabase: Awaited<ReturnType<typeof requireBackofficeUser>>["supabase"],
    file: File,
    nome: string
) {
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
        const { supabase, user, role } = await requireBackofficeUser("congregacoes.create");

        const nome = (formData.get("nome") as string | null)?.trim() || "";
        const providedSlug = (formData.get("slug") as string | null)?.trim();
        const slug = providedSlug || slugify(nome);
        const endereco = (formData.get("endereco") as string | null)?.trim();
        const dirigente = (formData.get("dirigente") as string | null)?.trim();
        const historico = (formData.get("historico") as string | null)?.trim();
        const imagemUrlManual = (formData.get("imagem_url") as string | null)?.trim();
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

        const { data, error } = await supabase
            .from("congregacoes")
            .insert({
                nome,
                slug,
                endereco: endereco || null,
                dirigente: dirigente || null,
                historico: historico || null,
                imagem_url,
            })
            .select("id")
            .single();

        if (error) {
            console.error("Create Congregation Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma congregação com este slug." };
            }
            return { error: "Erro ao criar congregação." };
        }

        await logAuditEvent({
            action: "CONGREGATION_CREATE",
            resourceType: "congregacoes",
            resourceId: data.id,
            payload: { nome, slug },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/congregacoes");
        revalidatePath("/congregacoes");
        revalidatePath("/");
        redirect("/admin/congregacoes");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }
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
        const { supabase, user, role } = await requireBackofficeUser("congregacoes.update");
        const current = await getCongregation(id);

        const nome = (formData.get("nome") as string | null)?.trim() || "";
        const providedSlug = (formData.get("slug") as string | null)?.trim();
        const slug = providedSlug || slugify(nome);
        const endereco = (formData.get("endereco") as string | null)?.trim();
        const dirigente = (formData.get("dirigente") as string | null)?.trim();
        const historico = (formData.get("historico") as string | null)?.trim();
        const imagemUrlManual = (formData.get("imagem_url") as string | null)?.trim();
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
                await supabase.storage.from(oldObject.bucket).remove([oldObject.path]);
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

        await logAuditEvent({
            action: "CONGREGATION_UPDATE",
            resourceType: "congregacoes",
            resourceId: id,
            payload: { nome, slug },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/congregacoes");
        revalidatePath("/congregacoes");
        if (current?.slug) revalidatePath(`/congregacoes/${current.slug}`);
        revalidatePath(`/congregacoes/${slug}`);
        revalidatePath("/");
        redirect("/admin/congregacoes");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }
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
        const { supabase, user, role } = await requireBackofficeUser("congregacoes.delete");
        const current = await getCongregation(id);

        const { error } = await supabase.from("congregacoes").delete().eq("id", id);

        if (error) {
            return { error: "Erro ao excluir congregação." };
        }

        const storageObject = extractStorageObject(current?.imagem_url);
        if (storageObject) {
            await supabase.storage.from(storageObject.bucket).remove([storageObject.path]);
        }

        await logAuditEvent({
            action: "CONGREGATION_DELETE",
            resourceType: "congregacoes",
            resourceId: id,
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/congregacoes");
        revalidatePath("/congregacoes");
        if (current?.slug) revalidatePath(`/congregacoes/${current.slug}`);
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("Unexpected deleteCongregation error:", error);
        return {
            error: "Erro inesperado ao excluir congregação.",
        };
    }
}