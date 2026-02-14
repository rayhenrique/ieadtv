"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldCheck, UserCog } from "lucide-react";
import { setUserRole } from "@/lib/actions/usuarios";
import { useRouter } from "next/navigation";

export function UserRoleActions({
    userId,
    role,
}: {
    userId: string;
    role: "admin" | "operador";
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string>("");

    const handleToggle = () => {
        const nextRole = role === "admin" ? "operador" : "admin";

        startTransition(async () => {
            const result = await setUserRole(userId, nextRole);
            if (result.error) {
                setMessage(result.error);
                return;
            }

            setMessage(result.success || "Papel atualizado.");
            router.refresh();
        });
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleToggle}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-surface disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : role === "admin" ? (
                    <UserCog className="h-3 w-3" />
                ) : (
                    <ShieldCheck className="h-3 w-3" />
                )}
                {role === "admin" ? "Tornar operador" : "Promover admin"}
            </button>
            {message && <span className="text-[11px] text-muted-foreground">{message}</span>}
        </div>
    );
}