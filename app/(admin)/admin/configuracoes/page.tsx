"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2, Link as LinkIcon, Facebook, Youtube, Instagram, MessageCircle } from "lucide-react";

interface SiteSetting {
    key: string;
    value: string;
    label: string;
}

export default function ConfiguracoesPage() {
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const supabase = createClient();

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("site_settings")
            .select("*")
            .order("key");

        if (error) {
            console.error("Error fetching settings:", error);
        } else {
            setSettings(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (key: string, newValue: string) => {
        setSettings((prev) =>
            prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const updates = settings.map((setting) =>
                supabase
                    .from("site_settings")
                    .update({ value: setting.value })
                    .eq("key", setting.key)
            );

            await Promise.all(updates);
            setMessage({ type: "success", text: "Configurações salvas com sucesso!" });
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: "error", text: "Erro ao salvar configurações." });
        } finally {
            setSaving(false);
        }
    };

    const getIcon = (key: string) => {
        if (key.includes("facebook")) return <Facebook className="h-5 w-5 text-blue-600" />;
        if (key.includes("instagram")) return <Instagram className="h-5 w-5 text-pink-600" />;
        if (key.includes("youtube")) return <Youtube className="h-5 w-5 text-red-600" />;
        if (key.includes("whatsapp")) return <MessageCircle className="h-5 w-5 text-green-600" />;
        return <LinkIcon className="h-5 w-5 text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[800px] space-y-8 px-4 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações do Site</h1>
                    <p className="text-muted-foreground">Gerencie links de redes sociais e outras configurações globais.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                </button>
            </div>

            {message && (
                <div
                    className={`rounded-md px-4 py-3 text-sm font-medium ${message.type === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                >
                    {message.text}
                </div>
            )}

            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-gray-800">Redes Sociais</h2>
                <div className="space-y-6">
                    {settings.map((setting) => (
                        <div key={setting.key} className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                {getIcon(setting.key)}
                                {setting.label}
                            </label>
                            <input
                                type="url"
                                value={setting.value}
                                onChange={(e) => handleChange(setting.key, e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="https://..."
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
