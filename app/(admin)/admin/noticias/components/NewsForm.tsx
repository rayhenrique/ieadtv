"use client";

import { createNews, updateNews, News } from "@/lib/actions/noticias";
import { Category } from "@/lib/actions/categorias";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, AlertCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface NewsFormProps {
    initialData?: News | null;
    categories: Category[];
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

export function NewsForm({ initialData, categories }: NewsFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>("");
    const [titulo, setTitulo] = useState(initialData?.titulo || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [preview, setPreview] = useState<string>(initialData?.imagem_capa_url || "");

    // Gallery state
    const [existingGallery, setExistingGallery] = useState<string[]>(initialData?.galeria_fotos || []);
    const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]); // To track files for UI clearing if needed, but simple file input handles it mostly. Actually for preview we need to manage.

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitulo(newTitle);
        if (!initialData) {
            setSlug(slugify(newTitle));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newPreviews: string[] = [];
            for (let i = 0; i < files.length; i++) {
                newPreviews.push(URL.createObjectURL(files[i]));
            }
            setNewGalleryPreviews(newPreviews);
        }
    };

    const removeExistingPhoto = (index: number) => {
        const newGallery = [...existingGallery];
        newGallery.splice(index, 1);
        setExistingGallery(newGallery);
    };

    const handleSubmit = async (formData: FormData) => {
        setError("");

        // Append existing gallery URLs to keep
        existingGallery.forEach(url => {
            formData.append("galeria_existente", url);
        });

        startTransition(async () => {
            try {
                if (initialData) {
                    const res = await updateNews(initialData.id, formData);
                    if (res?.error) setError(res.error);
                } else {
                    // Validate image for new news
                    if (!formData.get("imagem_capa") || (formData.get("imagem_capa") as File).size === 0) {
                        setError("A imagem de capa é obrigatória para novas notícias.");
                        return;
                    }
                    const res = await createNews(formData);
                    if (res?.error) setError(res.error);
                }
            } catch (e) {
                setError("Ocorreu um erro inesperado.");
                console.error(e);
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título da Notícia
                        </label>
                        <input
                            name="titulo"
                            value={titulo}
                            onChange={handleTitleChange}
                            required
                            placeholder="Ex: Culto de Jovens reúne multidão"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug (URL)
                        </label>
                        <input
                            name="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria
                        </label>
                        <select
                            name="categoria_id"
                            defaultValue={initialData?.categoria_id || ""}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="" disabled>Selecione uma categoria...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resumo (Subtítulo)
                        </label>
                        <textarea
                            name="resumo"
                            defaultValue={initialData?.resumo || ""}
                            rows={3}
                            required
                            placeholder="Breve descrição que aparece nos cards..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Link para Fotos (Google Drive / OneDrive)
                        </label>
                        <input
                            name="link_fotos"
                            defaultValue={initialData?.link_fotos || ""}
                            placeholder="https://drive.google.com/..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Opcional. Exibirá um botão "Ver Fotos" na notícia.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Imagem de Capa
                        </label>
                        <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 bg-gray-50/50">
                            <div className="text-center">
                                {preview ? (
                                    <div className="relative mb-4">
                                        <img src={preview} alt="Preview" className="mx-auto h-48 object-cover rounded-md shadow-sm" />
                                        <button type="button" onClick={() => setPreview("")} className="text-xs text-red-500 underline mt-2">Remover / Alterar</button>
                                    </div>
                                ) : (
                                    <Upload className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                )}

                                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                                    >
                                        <span>Selecione um arquivo</span>
                                        <input
                                            id="file-upload"
                                            name="imagem_capa"
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                    <p className="pl-1">ou arraste e solte</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                id="publicado"
                                name="publicado"
                                type="checkbox"
                                defaultChecked={initialData ? initialData.publicado : true}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <label htmlFor="publicado" className="text-sm font-medium text-gray-900">
                                Publicar Notícia
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="destaque"
                                name="destaque"
                                type="checkbox"
                                defaultChecked={initialData ? initialData.destaque : false}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <label htmlFor="destaque" className="text-sm font-medium text-gray-900">
                                Destacar na Home
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo da Notícia
                </label>
                <textarea
                    name="conteudo"
                    defaultValue={initialData?.conteudo || ""}
                    rows={15}
                    required
                    placeholder="Escreva o conteúdo da notícia aqui (HTML básico ou Texto)..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Dica: Use parágrafos para separar o texto.
                </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galeria de Fotos (Carrossel)
                </label>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="mb-4">
                        <input
                            type="file"
                            name="galeria_novas"
                            multiple
                            accept="image/*"
                            onChange={handleGalleryChange}
                            className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Selecione até 10 fotos para adicionar ao carrossel.
                        </p>
                    </div>

                    {/* Existing Photos */}
                    {existingGallery.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fotos Atuais</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {existingGallery.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <div className="relative w-full h-full rounded overflow-hidden">
                                            <Image
                                                src={url}
                                                alt={`Foto ${idx}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExistingPhoto(idx)}
                                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remover foto"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Photos Preview */}
                    {newGalleryPreviews.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Novas Fotos (Preview)</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {newGalleryPreviews.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded overflow-hidden border border-blue-200">
                                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/noticias"
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
                    {initialData ? "Salvar Alterações" : "Criar Notícia"}
                </button>
            </div>
        </form>
    );
}
