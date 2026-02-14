"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cleanupAuditLogs } from "@/lib/actions/auditoria";
import { Loader2, Trash2 } from "lucide-react";

export function AuditCleanupButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string>("");

    const handleCleanup = () => {
        if (!confirm("Deseja remover logs com mais de 30 dias?")) {
            return;
        }

        setMessage("");
        startTransition(async () => {
            const result = await cleanupAuditLogs();
            if (result.error) {
                setMessage(result.error);
                return;
            }

            setMessage(result.success || "Limpeza concluída.");
            router.refresh();
        });
    };

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={handleCleanup}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Trash2 className="h-4 w-4" />
                )}
                Limpar logs antigos
            </button>

            {message && <span className="text-xs text-muted-foreground">{message}</span>}
        </div>
    );
}