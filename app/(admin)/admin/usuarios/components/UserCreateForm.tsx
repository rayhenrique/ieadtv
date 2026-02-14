"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, UserPlus2 } from "lucide-react";
import { createAdminUser } from "@/lib/actions/usuarios";

export function UserCreateForm() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
            const result = await createAdminUser(formData);
            if (result?.error) {
                setError(result.error);
                return;
            }

            setSuccess(result?.success || "Usuário criado com sucesso.");
            formRef.current?.reset();
            router.refresh();
        });
    };

    return (
        <form
            ref={formRef}
            action={handleSubmit}
            className="space-y-4 rounded-lg border border-border bg-white p-6"
        >
            <div className="flex items-center gap-2">
                <UserPlus2 className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Criar Novo Usuário</h2>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nome (Opcional)
                    </label>
                    <input
                        name="nome"
                        placeholder="Ex: João Silva"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        E-mail
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="usuario@exemplo.com"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Senha
                    </label>
                    <input
                        type="password"
                        name="password"
                        minLength={6}
                        required
                        placeholder="Mínimo 6 caracteres"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Papel
                    </label>
                    <select
                        name="role"
                        defaultValue="operador"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                        <option value="operador">Operador</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar Usuário
                </button>
            </div>
        </form>
    );
}
