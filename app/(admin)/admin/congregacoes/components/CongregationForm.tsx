"use client";

import {
    Congregation,
    createCongregation,
    updateCongregation,
} from "@/lib/actions/congregacoes";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface CongregationFormProps {
    initialData?: Congregation | null;
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

export function CongregationForm({ initialData }: CongregationFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [nome, setNome] = useState(initialData?.nome || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [preview, setPreview] = useState(initialData?.imagem_url || "");

    const handleNameChange = (value: string) => {
        setNome(value);
        if (!initialData) {
            setSlug(slugify(value));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 10MB.");
            e.target.value = "";
            return;
        }
        setError("");
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (formData: FormData) => {
        setError("");
        startTransition(async () => {
            try {
                if (initialData) {
                    const res = await updateCongregation(initialData.id, formData);
                    if (res?.error) setError(res.error);
                } else {
                    const res = await createCongregation(formData);
                    if (res?.error) setError(res.error);
                }
            } catch (submitError) {
                console.error(submitError);
                setError("Ocorreu um erro inesperado.");
            }
        });
    };

    return (
        <form
            action={handleSubmit}
            className="space-y-6 max-w-4xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Congregação
                    </label>
                    <input
                        name="nome"
                        value={nome}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        placeholder="Ex: Congregação Bairro Centro"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug
                    </label>
                    <input
                        name="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                        placeholder="congregacao-centro"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-gray-600"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirigente (Opcional)
                    </label>
                    <input
                        name="dirigente"
                        defaultValue={initialData?.dirigente || ""}
                        placeholder="Ex: Pr. João Silva"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço (Opcional)
                    </label>
                    <input
                        name="endereco"
                        defaultValue={initialData?.endereco || ""}
                        placeholder="Rua Exemplo, 123 - Teotônio Vilela/AL"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem de Capa (Upload)
                </label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-8 bg-gray-50/50">
                    <div className="text-center">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Pré-visualização"
                                className="mx-auto mb-4 h-44 rounded-md object-cover"
                            />
                        ) : (
                            <Upload className="mx-auto h-12 w-12 text-gray-300" />
                        )}

                        <label
                            htmlFor="congregacao-imagem"
                            className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
                        >
                            Selecionar arquivo
                        </label>
                        <input
                            id="congregacao-imagem"
                            name="imagem"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem (Opcional)
                </label>
                <input
                    type="url"
                    name="imagem_url"
                    defaultValue={initialData?.imagem_url || ""}
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Se preencher este campo e não enviar arquivo, a URL será usada como capa.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Histórico (Opcional)
                </label>
                <textarea
                    name="historico"
                    rows={10}
                    defaultValue={initialData?.historico || ""}
                    placeholder="Conte a história da congregação..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/congregacoes"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending && (
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    )}
                    {initialData ? "Salvar Alterações" : "Criar Congregação"}
                </button>
            </div>
        </form>
    );
}
