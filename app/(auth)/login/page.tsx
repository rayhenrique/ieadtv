"use client";

import { useActionState } from "react";
import { login } from "./actions";
import Image from "next/image";

const initialState = {
    message: "",
};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-[400px]">
                {/* Card Container */}
                <div className="relative overflow-hidden rounded-2xl bg-white px-8 py-10 shadow-2xl ring-1 ring-gray-900/5 sm:px-10">
                    {/* Gold Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600" />

                    <div className="flex flex-col items-center mb-8 mt-2">
                        <div className="relative h-24 w-20 mb-4 transition-transform hover:scale-105">
                            <Image
                                src="/images/logo.png"
                                alt="Logo ADTV"
                                fill
                                className="object-contain drop-shadow-sm"
                                priority
                            />
                        </div>
                        <h2 className="text-center text-2xl font-bold tracking-tight text-[#0f172a]">
                            Painel Administrativo
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-500">
                            Acesso restrito à equipe de mídia
                        </p>
                    </div>

                    <form className="space-y-5" action={formAction}>
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-semibold leading-6 text-gray-700">
                                E-mail
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="block w-full rounded-lg border-0 bg-gray-50 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-semibold leading-6 text-gray-700">
                                    Senha
                                </label>
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                                        Esqueceu a senha?
                                    </a>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="block w-full rounded-lg border-0 bg-gray-50 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {state?.message && (
                            <div className="rounded-lg bg-red-50 p-3 border border-red-100 flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-red-800">{state.message}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="flex w-full justify-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                            >
                                {isPending ? "Autenticando..." : "Entrar"}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-8 text-center text-xs text-slate-500 font-medium">
                    &copy; 2026 IEADTV - Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
