"use client";

import { createBanner, updateBanner } from "@/lib/actions/banners";
import { Banner } from "@/lib/actions/banners";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Upload, AlertCircle } from "lucide-react";

interface BannerFormProps {
    initialData?: Banner | null;
}

export function BannerForm({ initialData }: BannerFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>("");
    const [preview, setPreview] = useState<string>(initialData?.imagem_url || "");

    const handleSubmit = async (formData: FormData) => {
        setError("");
        startTransition(async () => {
            try {
                if (initialData) {
                    const res = await updateBanner(initialData.id, formData);
                    if (res?.error) setError(res.error);
                } else {
                    // Validate image for new banner
                    if (!formData.get("imagem") || (formData.get("imagem") as File).size === 0) {
                        setError("A imagem é obrigatória para novos banners.");
                        return;
                    }
                    const res = await createBanner(formData);
                    if (res?.error) setError(res.error);
                }
            } catch (e) {
                setError("Ocorreu um erro inesperado.");
                console.error(e);
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título (Interno)
                </label>
                <input
                    name="titulo"
                    defaultValue={initialData?.titulo}
                    required
                    placeholder="Ex: Campanha de Missões 2026"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem do Banner
                </label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 bg-gray-50/50">
                    <div className="text-center">
                        {preview ? (
                            <div className="relative mb-4">
                                <img src={preview} alt="Preview" className="mx-auto h-48 object-contain rounded-md shadow-sm" />
                                <button type="button" onClick={() => setPreview("")} className="text-xs text-red-500 underline mt-2">Remover</button>
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
                                    name="imagem"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleImageChange}
                                />
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">Recomendado: 1920x600px (PNG, JPG, WEBP)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link de Destino (Opcional)
                    </label>
                    <input
                        name="link_destino"
                        defaultValue={initialData?.link_destino || ""}
                        placeholder="https://..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ordem de Exibição
                    </label>
                    <input
                        name="ordem"
                        type="number"
                        defaultValue={initialData?.ordem || 0}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="ativo"
                    name="ativo"
                    type="checkbox"
                    defaultChecked={initialData ? initialData.ativo : true}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-900">
                    Banner Ativo (Visível no site)
                </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/banners"
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
                    {initialData ? "Salvar Alterações" : "Criar Banner"}
                </button>
            </div>
        </form>
    );
}
