"use client";

import { deleteCategory } from "@/lib/actions/categorias";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CategoryActionsProps {
    id: string;
    nome: string;
}

export function CategoryActions({ id, nome }: CategoryActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) {
            startTransition(async () => {
                await deleteCategory(id);
                router.refresh();
            });
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Link
                href={`/admin/categorias/${id}/edit`}
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
