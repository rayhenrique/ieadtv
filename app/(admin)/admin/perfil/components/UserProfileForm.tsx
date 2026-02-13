"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserCircle2 } from "lucide-react";
import { updateMyProfile } from "@/lib/actions/perfil";

interface UserProfileFormProps {
    email: string;
    initialNome: string;
}

export function UserProfileForm({ email, initialNome }: UserProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
            const result = await updateMyProfile(formData);
            if (result?.error) {
                setError(result.error);
                return;
            }
            setSuccess(result?.success || "Perfil atualizado com sucesso.");
        });
    };

    return (
        <form
            action={handleSubmit}
            className="space-y-6 rounded-lg border border-border bg-white p-6"
        >
            <div className="flex items-center gap-2">
                <UserCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Meu Perfil</h2>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        E-mail
                    </label>
                    <input
                        value={email}
                        readOnly
                        disabled
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nome
                    </label>
                    <input
                        name="nome"
                        defaultValue={initialNome}
                        placeholder="Seu nome"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nova Senha
                    </label>
                    <input
                        name="senha"
                        type="password"
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Confirmar Nova Senha
                    </label>
                    <input
                        name="confirmar_senha"
                        type="password"
                        minLength={6}
                        placeholder="Repita a nova senha"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar Perfil
                </button>
            </div>
        </form>
    );
}
