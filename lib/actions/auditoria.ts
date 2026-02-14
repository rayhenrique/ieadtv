"use server";

import { requireAdmin, AuthorizationError } from "@/lib/auth/roles";
import {
    cleanupOldAuditLogs,
    queryAuditLogs,
    type AuditLogQueryParams,
} from "@/lib/audit/log";

export async function getAuditLogs(params: AuditLogQueryParams = {}) {
    try {
        await requireAdmin("audit.logs.read");
        await cleanupOldAuditLogs(30);

        return await queryAuditLogs(params);
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return {
                items: [],
                total: 0,
                page: 1,
                pageSize: 20,
                error: error.message,
            };
        }

        console.error("[audit] getAuditLogs unexpected error", error);
        return {
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            error: "Erro ao carregar logs de auditoria.",
        };
    }
}

export async function cleanupAuditLogs() {
    try {
        await requireAdmin("audit.logs.cleanup");
        const result = await cleanupOldAuditLogs(30);

        if (result.error) {
            return { error: result.error };
        }

        return { success: `Limpeza concluída. ${result.deleted} logs removidos.` };
    } catch (error) {
        if (error instanceof AuthorizationError) {
            return { error: error.message };
        }

        console.error("[audit] cleanupAuditLogs unexpected error", error);
        return { error: "Erro ao limpar logs de auditoria." };
    }
}