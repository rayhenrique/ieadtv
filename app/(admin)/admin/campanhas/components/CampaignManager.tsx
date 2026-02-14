"use client";

import { useState, useTransition } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Loader2,
    Heart,
    Target,
} from "lucide-react";
import {
    deleteCampanha,
    getCampanhasAdmin,
    saveCampanha,
    type Campanha,
} from "@/lib/actions/campanhas";

const emptyForm = {
    titulo: "",
    slug: "",
    descricao: "",
    conteudo: "",
    imagem_url: "",
    meta_valor: "",
    valor_arrecadado: "0",
    ativa: true,
    tipo: "social",
    data_inicio: "",
    data_fim: "",
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

export function CampaignManager({
    initialCampanhas,
    initialError,
}: {
    initialCampanhas: Campanha[];
    initialError?: string;
}) {
    const [campanhas, setCampanhas] = useState<Campanha[]>(initialCampanhas);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(initialError ? { type: "error", text: initialError } : null);
    const [isPending, startTransition] = useTransition();

    const reloadCampanhas = async () => {
        setLoading(true);
        const result = await getCampanhasAdmin();
        if (result.error) {
            setMessage({ type: "error", text: result.error });
        } else {
            setCampanhas(result.campanhas);
        }
        setLoading(false);
    };

    const openNew = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
        setMessage(null);
    };

    const openEdit = (campanha: Campanha) => {
        setForm({
            titulo: campanha.titulo,
            slug: campanha.slug,
            descricao: campanha.descricao || "",
            conteudo: campanha.conteudo || "",
            imagem_url: campanha.imagem_url || "",
            meta_valor: campanha.meta_valor?.toString() || "",
            valor_arrecadado: campanha.valor_arrecadado?.toString() || "0",
            ativa: campanha.ativa,
            tipo: campanha.tipo,
            data_inicio: campanha.data_inicio || "",
            data_fim: campanha.data_fim || "",
        });
        setEditingId(campanha.id);
        setShowForm(true);
        setMessage(null);
    };

    const handleTituloChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            titulo: value,
            slug: editingId ? prev.slug : slugify(value),
        }));
    };

    const handleSave = () => {
        if (!form.titulo.trim() || !form.slug.trim()) {
            setMessage({ type: "error", text: "Título e slug são obrigatórios." });
            return;
        }

        setMessage(null);

        startTransition(async () => {
            const formData = new FormData();

            if (editingId) {
                formData.set("id", editingId);
            }

            formData.set("titulo", form.titulo);
            formData.set("slug", form.slug);
            formData.set("descricao", form.descricao);
            formData.set("conteudo", form.conteudo);
            formData.set("imagem_url", form.imagem_url);
            formData.set("meta_valor", form.meta_valor);
            formData.set("valor_arrecadado", form.valor_arrecadado);
            formData.set("ativa", form.ativa ? "true" : "false");
            formData.set("tipo", form.tipo);
            formData.set("data_inicio", form.data_inicio);
            formData.set("data_fim", form.data_fim);

            const result = await saveCampanha(formData);

            if (result.error) {
                setMessage({ type: "error", text: result.error });
                return;
            }

            setMessage({
                type: "success",
                text: editingId ? "Campanha atualizada!" : "Campanha criada!",
            });
            setShowForm(false);
            await reloadCampanhas();
        });
    };

    const handleDelete = (id: string, titulo: string) => {
        if (!confirm(`Deseja realmente excluir a campanha \"${titulo}\"?`)) return;

        startTransition(async () => {
            const result = await deleteCampanha(id);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
                return;
            }

            setMessage({ type: "success", text: "Campanha excluída." });
            await reloadCampanhas();
        });
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Campanhas
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Gerencie projetos sociais e de construção.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Campanha
                    </button>
                )}
            </div>

            {message && (
                <div
                    className={`mt-4 rounded-md px-4 py-3 text-sm ${
                        message.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                    }`}
                >
                    {message.text}
                </div>
            )}

            {showForm && (
                <div className="mt-6 rounded-lg border border-border bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                            {editingId ? "Editar Campanha" : "Nova Campanha"}
                        </h2>
                        <button
                            onClick={() => setShowForm(false)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Título *</label>
                            <input
                                type="text"
                                value={form.titulo}
                                onChange={(e) => handleTituloChange(e.target.value)}
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Slug</label>
                            <input
                                type="text"
                                value={form.slug}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Tipo</label>
                            <select
                                value={form.tipo}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, tipo: e.target.value }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="social">Projeto Social</option>
                                <option value="construcao">Construção</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Status</label>
                            <select
                                value={form.ativa ? "true" : "false"}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        ativa: e.target.value === "true",
                                    }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="true">Ativa</option>
                                <option value="false">Inativa</option>
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Descrição curta</label>
                            <textarea
                                value={form.descricao}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, descricao: e.target.value }))
                                }
                                rows={3}
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Conteúdo (HTML)</label>
                            <textarea
                                value={form.conteudo}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, conteudo: e.target.value }))
                                }
                                rows={8}
                                className="w-full rounded-md border border-border px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">URL da imagem</label>
                            <input
                                type="url"
                                value={form.imagem_url}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, imagem_url: e.target.value }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Meta (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.meta_valor}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, meta_valor: e.target.value }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Valor arrecadado (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.valor_arrecadado}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        valor_arrecadado: e.target.value,
                                    }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Data início</label>
                            <input
                                type="date"
                                value={form.data_inicio}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, data_inicio: e.target.value }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Data fim</label>
                            <input
                                type="date"
                                value={form.data_fim}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, data_fim: e.target.value }))
                                }
                                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowForm(false)}
                            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {editingId ? "Atualizar" : "Criar"}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-6 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-surface">
                        <tr>
                            <th className="px-4 py-3 font-medium text-foreground">Campanha</th>
                            <th className="hidden px-4 py-3 font-medium text-foreground sm:table-cell">
                                Tipo
                            </th>
                            <th className="hidden px-4 py-3 font-medium text-foreground md:table-cell">
                                Progresso
                            </th>
                            <th className="px-4 py-3 font-medium text-foreground">Status</th>
                            <th className="px-4 py-3 text-right font-medium text-foreground">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {campanhas.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-muted-foreground"
                                >
                                    Nenhuma campanha cadastrada.
                                </td>
                            </tr>
                        ) : (
                            campanhas.map((campanha) => {
                                const progresso =
                                    campanha.meta_valor && campanha.meta_valor > 0
                                        ? Math.min(
                                              (campanha.valor_arrecadado / campanha.meta_valor) * 100,
                                              100
                                          )
                                        : null;

                                return (
                                    <tr
                                        key={campanha.id}
                                        className="transition-colors hover:bg-surface/50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {campanha.tipo === "social" ? (
                                                    <Heart className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Target className="h-4 w-4 text-primary" />
                                                )}
                                                <span className="font-medium text-foreground">
                                                    {campanha.titulo}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                            {campanha.tipo === "social" ? "Social" : "Construção"}
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            {progresso !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-surface">
                                                        <div
                                                            className="h-full rounded-full bg-primary"
                                                            style={{ width: `${progresso}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {progresso.toFixed(0)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    campanha.ativa
                                                        ? "bg-green-50 text-green-700"
                                                        : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                {campanha.ativa ? "Ativa" : "Inativa"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(campanha)}
                                                    className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(campanha.id, campanha.titulo)
                                                    }
                                                    disabled={isPending}
                                                    className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}