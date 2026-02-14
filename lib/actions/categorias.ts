"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireBackofficeUser } from "@/lib/auth/roles";
import { logAuditEvent } from "@/lib/audit/log";

export interface Category {
    id: string;
    nome: string;
    slug: string;
    created_at: string;
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

export async function getCategories() {
    try {
        const { supabase } = await requireBackofficeUser("categorias.read");
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .order("nome", { ascending: true });

        if (error) {
            console.error("Error fetching categories:", error);
            return [];
        }

        return data as Category[];
    } catch {
        return [];
    }
}

export async function getCategory(id: string) {
    try {
        const { supabase } = await requireBackofficeUser("categorias.read_one");
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .eq("id", id)
            .single();

        if (error) return null;
        return data as Category;
    } catch {
        return null;
    }
}

export async function createCategory(formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("categorias.create");

        const nome = (formData.get("nome") as string | null)?.trim() || "";
        const slug = ((formData.get("slug") as string | null)?.trim() || slugify(nome));

        if (!nome) {
            return { error: "Nome obrigatório" };
        }

        const { data, error } = await supabase
            .from("categorias")
            .insert({ nome, slug })
            .select("id")
            .single();

        if (error) {
            console.error("Create Category Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma categoria com este slug." };
            }
            return { error: "Erro ao criar categoria." };
        }

        await logAuditEvent({
            action: "CATEGORY_CREATE",
            resourceType: "categorias",
            resourceId: data.id,
            payload: { nome, slug },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/categorias");
        redirect("/admin/categorias");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function updateCategory(id: string, formData: FormData) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("categorias.update");

        const nome = (formData.get("nome") as string | null)?.trim() || "";
        const slug = ((formData.get("slug") as string | null)?.trim() || slugify(nome));

        if (!nome) {
            return { error: "Nome obrigatório" };
        }

        const { error } = await supabase
            .from("categorias")
            .update({ nome, slug })
            .eq("id", id);

        if (error) {
            console.error("Update Category Error:", error);
            if (error.code === "23505") {
                return { error: "Já existe uma categoria com este slug." };
            }
            return { error: "Erro ao atualizar categoria." };
        }

        await logAuditEvent({
            action: "CATEGORY_UPDATE",
            resourceType: "categorias",
            resourceId: id,
            payload: { nome, slug },
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/categorias");
        redirect("/admin/categorias");
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        throw error;
    }
}

export async function deleteCategory(id: string) {
    try {
        const { supabase, user, role } = await requireBackofficeUser("categorias.delete");

        const { error } = await supabase.from("categorias").delete().eq("id", id);

        if (error) {
            return { error: "Erro ao excluir categoria." };
        }

        await logAuditEvent({
            action: "CATEGORY_DELETE",
            resourceType: "categorias",
            resourceId: id,
            actorUserId: user.id,
            actorRole: role,
        });

        revalidatePath("/admin/categorias");
        return { success: true };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        return { error: "Erro inesperado ao excluir categoria." };
    }
}