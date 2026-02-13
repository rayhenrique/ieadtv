"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("ordem", { ascending: true });

    if (error) {
        console.error("Error fetching banners:", error);
        return [];
    }

    return data as Banner[];
}

export async function getBanner(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data as Banner;
}

export async function getPublicBanners() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("banners")
        .select("id, titulo, imagem_url, link_destino")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

    if (error) {
        console.error("Error fetching public banners:", error);
        return [];
    }

    return data as Partial<Banner>[];
}

export async function createBanner(formData: FormData) {
    const supabase = await createClient();

    // 1. Validate Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // 2. Extract Data
    const titulo = formData.get("titulo") as string;
    const link_destino = formData.get("link_destino") as string;
    const ativo = formData.get("ativo") === "on";
    const ordem = parseInt(formData.get("ordem") as string) || 0;
    const file = formData.get("imagem") as File;

    if (!file || file.size === 0) {
        return { error: "Image is required" };
    }

    // 3. Upload Image
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, file);

    if (uploadError) {
        console.error("Upload error:", uploadError);
        return { error: "Error uploading image" };
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);

    // 4. Insert into DB
    const { error: dbError } = await supabase.from("banners").insert({
        titulo,
        imagem_url: publicUrl,
        link_destino: link_destino || null,
        ativo,
        ordem,
    });

    if (dbError) {
        console.error("DB error:", dbError);
        // Cleanup uploaded file?
        return { error: "Error saving banner" };
    }

    revalidatePath("/admin/banners");
    revalidatePath("/"); // Update home
    redirect("/admin/banners");
}

export async function updateBanner(id: string, formData: FormData) {
    const supabase = await createClient();

    // 1. Validate Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // 2. Extract Data
    const titulo = formData.get("titulo") as string;
    const link_destino = formData.get("link_destino") as string;
    const ativo = formData.get("ativo") === "on";
    const ordem = parseInt(formData.get("ordem") as string) || 0;
    const file = formData.get("imagem") as File;

    const updates: Partial<Banner> = {
        titulo,
        link_destino: link_destino || null,
        ativo,
        ordem,
    };

    // 3. Handle Image Upload if provided
    if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("banners")
            .upload(filePath, file);

        if (uploadError) {
            return { error: "Error uploading image" };
        }

        const { data: { publicUrl } } = supabase.storage
            .from("banners")
            .getPublicUrl(filePath);

        updates.imagem_url = publicUrl;

        // TODO: Delete old image?
    }

    // 4. Update DB
    const { error: dbError } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id);

    if (dbError) {
        console.error("DB Update Error", dbError);
        return { error: "Error updating banner" };
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
    redirect("/admin/banners");
}

export async function deleteBanner(id: string, imageUrl: string) {
    const supabase = await createClient();

    // 1. Validate Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // 2. Delete from Storage
    // Extract filename from URL
    const fileName = imageUrl.split("/").pop();
    if (fileName) {
        await supabase.storage.from("banners").remove([fileName]);
    }

    // 3. Delete from DB
    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
        return { error: "Error deleting banner" };
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
}

export async function toggleBannerStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient();

    await supabase.from("banners").update({ ativo: !currentStatus }).eq("id", id);

    revalidatePath("/admin/banners");
    revalidatePath("/");
}
