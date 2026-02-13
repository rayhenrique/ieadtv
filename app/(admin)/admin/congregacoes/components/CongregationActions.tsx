"use client";

import { deleteCongregation } from "@/lib/actions/congregacoes";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface CongregationActionsProps {
    id: string;
    nome: string;
}

export function CongregationActions({ id, nome }: CongregationActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja excluir a congregação "${nome}"?`)) {
            startTransition(async () => {
                const res = await deleteCongregation(id);
                if (res?.error) {
                    alert(res.error);
                    return;
                }
                router.refresh();
            });
        }
    };

    return (
        <div className="flex items-center justify-end gap-3">
            <Link
                href={`/admin/congregacoes/${id}/edit`}
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
