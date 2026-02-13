"use client";

import { createEvent, updateEvent } from "@/lib/actions/eventos";
import type { EventItem } from "@/lib/actions/eventos";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

interface EventFormProps {
    initialData?: EventItem | null;
}

function toInputDateTime(value?: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function EventForm({ initialData }: EventFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setError("");
        startTransition(async () => {
            try {
                if (initialData) {
                    const res = await updateEvent(initialData.id, formData);
                    if (res?.error) setError(res.error);
                } else {
                    const res = await createEvent(formData);
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
            className="space-y-6 max-w-3xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Evento
                </label>
                <input
                    name="titulo"
                    required
                    defaultValue={initialData?.titulo || ""}
                    placeholder="Ex: Culto de Jovens"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data/Hora de Início
                    </label>
                    <input
                        type="datetime-local"
                        name="data_inicio"
                        required
                        defaultValue={toInputDateTime(initialData?.data_inicio)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data/Hora de Fim (Opcional)
                    </label>
                    <input
                        type="datetime-local"
                        name="data_fim"
                        defaultValue={toInputDateTime(initialData?.data_fim)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Local (Opcional)
                </label>
                <input
                    name="local"
                    defaultValue={initialData?.local || ""}
                    placeholder="Ex: Templo Sede - Centro"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link (Opcional)
                </label>
                <input
                    type="url"
                    name="link"
                    defaultValue={initialData?.link || ""}
                    placeholder="https://..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Ex: transmissão, inscrição ou mapa.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (Opcional)
                </label>
                <textarea
                    name="descricao"
                    rows={5}
                    defaultValue={initialData?.descricao || ""}
                    placeholder="Detalhes do evento, programação e observações."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/eventos"
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
                    {initialData ? "Salvar Alterações" : "Criar Evento"}
                </button>
            </div>
        </form>
    );
}
