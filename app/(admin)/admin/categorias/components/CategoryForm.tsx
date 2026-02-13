"use client";

import { createCategory, updateCategory, Category } from "@/lib/actions/categorias";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface CategoryFormProps {
    initialData?: Category | null;
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

export function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>("");
    const [nome, setNome] = useState(initialData?.nome || "");
    const [slug, setSlug] = useState(initialData?.slug || "");

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setNome(newName);
        if (!initialData) {
            setSlug(slugify(newName));
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setError("");
        startTransition(async () => {
            try {
                if (initialData) {
                    const res = await updateCategory(initialData.id, formData);
                    if (res?.error) setError(res.error);
                } else {
                    const res = await createCategory(formData);
                    if (res?.error) setError(res.error);
                }
            } catch (e) {
                setError("Ocorreu um erro inesperado.");
                console.error(e);
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6 max-w-xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Categoria
                </label>
                <input
                    name="nome"
                    value={nome}
                    onChange={handleNameChange}
                    required
                    placeholder="Ex: Notícias"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL amigável)
                </label>
                <input
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="ex: noticias"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Usado na URL: adteotoniovilela.com.br/categoria/<strong>{slug || "..."}</strong>
                </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/categorias"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                    {initialData ? "Salvar Alterações" : "Criar Categoria"}
                </button>
            </div>
        </form>
    );
}
