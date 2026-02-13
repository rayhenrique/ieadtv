"use client";

import { deleteBanner, toggleBannerStatus } from "@/lib/actions/banners";
import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface BannerActionsProps {
    id: string;
    imagemUrl: string;
    ativo: boolean;
}

export function BannerActions({ id, imagemUrl, ativo }: BannerActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("Tem certeza que deseja excluir este banner?")) {
            startTransition(async () => {
                await deleteBanner(id, imagemUrl);
            });
        }
    };

    const handleToggle = () => {
        startTransition(async () => {
            await toggleBannerStatus(id, ativo);
        });
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${ativo
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
            >
                {ativo ? "Ativo" : "Inativo"}
            </button>

            <Link
                href={`/admin/banners/${id}/edit`}
                className="text-gray-500 hover:text-blue-600 transition-colors"
            >
                <Pencil className="w-4 h-4" />
            </Link>

            <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
            </button>
        </div>
    );
}
