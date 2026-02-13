"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return data as Category[];
}

export async function getCategory(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data as Category;
}

export async function createCategory(formData: FormData) {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const nome = formData.get("nome") as string;
    const slug = formData.get("slug") as string || slugify(nome);

    if (!nome) {
        return { error: "Nome obrigatório" };
    }

    const { error } = await supabase.from("categorias").insert({
        nome,
        slug,
    });

    if (error) {
        console.error("Create Category Error:", error);
        if (error.code === "23505") { // Unique violation
            return { error: "Já existe uma categoria com este slug." };
        }
        return { error: "Erro ao criar categoria." };
    }

    revalidatePath("/admin/categorias");
    redirect("/admin/categorias");
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const nome = formData.get("nome") as string;
    const slug = formData.get("slug") as string || slugify(nome);

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

    revalidatePath("/admin/categorias");
    redirect("/admin/categorias");
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase.from("categorias").delete().eq("id", id);

    if (error) {
        return { error: "Erro ao excluir categoria." };
    }

    revalidatePath("/admin/categorias");
}
