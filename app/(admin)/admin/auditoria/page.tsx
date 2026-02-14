import Link from "next/link";
import { getAuditLogs } from "@/lib/actions/auditoria";
import { AuditCleanupButton } from "./components/AuditCleanupButton";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
    ACCESS_DENIED: "Acesso negado",
    USER_CREATE: "Criação de usuário",
    USER_ROLE_UPDATE: "Alteração de papel de usuário",
    BANNER_CREATE: "Criação de banner",
    BANNER_UPDATE: "Atualização de banner",
    BANNER_DELETE: "Exclusão de banner",
    BANNER_STATUS_TOGGLE: "Alteração de status do banner",
    CATEGORIA_CREATE: "Criação de categoria",
    CATEGORIA_UPDATE: "Atualização de categoria",
    CATEGORIA_DELETE: "Exclusão de categoria",
    NOTICIA_CREATE: "Criação de notícia",
    NOTICIA_UPDATE: "Atualização de notícia",
    NOTICIA_DELETE: "Exclusão de notícia",
    EVENTO_CREATE: "Criação de evento",
    EVENTO_UPDATE: "Atualização de evento",
    EVENTO_DELETE: "Exclusão de evento",
    CONGREGACAO_CREATE: "Criação de congregação",
    CONGREGACAO_UPDATE: "Atualização de congregação",
    CONGREGACAO_DELETE: "Exclusão de congregação",
    CAMPANHA_CREATE: "Criação de campanha",
    CAMPANHA_UPDATE: "Atualização de campanha",
    CAMPANHA_DELETE: "Exclusão de campanha",
    PAGINA_CREATE: "Criação de página",
    PAGINA_UPDATE: "Atualização de página",
    PAGINA_DELETE: "Exclusão de página",
    CONFIGURACAO_UPDATE: "Atualização de configuração",
    PERFIL_UPDATE: "Atualização de perfil",
    BLOGGER_IMPORT_NEWS: "Importação de notícias do Blogger",
};

const RESOURCE_LABELS: Record<string, string> = {
    authorization: "Autorização",
    user_roles: "Papéis de usuário",
    users: "Usuários",
    banners: "Banners",
    categorias: "Categorias",
    noticias: "Notícias",
    eventos: "Eventos",
    congregacoes: "Congregações",
    campanhas: "Campanhas",
    paginas: "Páginas",
    configuracoes: "Configurações",
    perfil: "Perfil",
};

const PAYLOAD_LABELS: Record<string, string> = {
    from: "De",
    to: "Para",
    email: "E-mail",
    role: "Papel",
    requiredRole: "Papel exigido",
    currentRole: "Papel atual",
    scope: "Escopo",
};

function normalizeLabel(raw: string) {
    if (!raw) return "Não informado";

    return raw
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActionLabel(action: string) {
    return ACTION_LABELS[action] || normalizeLabel(action);
}

function getResourceLabel(resourceType: string) {
    return RESOURCE_LABELS[resourceType] || normalizeLabel(resourceType);
}

function getPayloadLabel(key: string) {
    return PAYLOAD_LABELS[key] || normalizeLabel(key);
}

function formatTimestamp(value: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
    }).format(new Date(value));
}

function formatRelativeTime(value: string) {
    const date = new Date(value).getTime();
    const now = Date.now();
    const diffSeconds = Math.round((date - now) / 1000);
    const absSeconds = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

    if (absSeconds < 60) return rtf.format(diffSeconds, "second");

    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");

    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");

    const diffDays = Math.round(diffHours / 24);
    return rtf.format(diffDays, "day");
}

function formatScalarValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") return value;

    return JSON.stringify(value);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getActionTone(action: string) {
    if (action === "ACCESS_DENIED") {
        return "bg-red-50 text-red-700 border-red-200";
    }

    if (action.includes("DELETE")) {
        return "bg-rose-50 text-rose-700 border-rose-200";
    }

    if (action.includes("CREATE")) {
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (action.includes("UPDATE") || action.includes("TOGGLE")) {
        return "bg-blue-50 text-blue-700 border-blue-200";
    }

    return "bg-surface text-foreground border-border";
}

function getRoleTone(role: string | null) {
    if (role === "admin") {
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }

    if (role === "operador") {
        return "bg-amber-50 text-amber-700 border-amber-200";
    }

    return "bg-surface text-muted-foreground border-border";
}

function shortId(value: string) {
    if (value.length <= 16) return value;
    return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

interface AuditPageProps {
    searchParams?: {
        page?: string;
        action?: string;
        resourceType?: string;
        dateFrom?: string;
        dateTo?: string;
    };
}

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
    const page = Number(searchParams?.page || "1");
    const action = searchParams?.action || "";
    const resourceType = searchParams?.resourceType || "";
    const dateFrom = searchParams?.dateFrom || "";
    const dateTo = searchParams?.dateTo || "";

    const result = await getAuditLogs({
        page: Number.isFinite(page) ? page : 1,
        pageSize: 20,
        action,
        resourceType,
        dateFrom,
        dateTo,
    });

    const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

    const queryString = (targetPage: number) => {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        if (action) params.set("action", action);
        if (resourceType) params.set("resourceType", resourceType);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        return params.toString();
    };

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Logs de Auditoria
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Registro de ações do painel administrativo. Retenção automática: 30 dias.
                    </p>
                </div>
                <AuditCleanupButton />
            </div>

            <form className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-5">
                <input
                    name="action"
                    defaultValue={action}
                    placeholder="Filtrar por ação"
                    className="rounded-md border border-border px-3 py-2 text-sm"
                />
                <input
                    name="resourceType"
                    defaultValue={resourceType}
                    placeholder="Filtrar por recurso"
                    className="rounded-md border border-border px-3 py-2 text-sm"
                />
                <input
                    type="date"
                    name="dateFrom"
                    defaultValue={dateFrom}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                />
                <input
                    type="date"
                    name="dateTo"
                    defaultValue={dateTo}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                />
                <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                >
                    Filtrar
                </button>
            </form>

            {result.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {result.error}
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-surface">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ação</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recurso</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {result.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Nenhum log encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    result.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {formatTimestamp(item.created_at)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(item.created_at)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getActionTone(
                                                        item.action
                                                    )}`}
                                                >
                                                    {getActionLabel(item.action)}
                                                </span>
                                                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    {item.action}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {getResourceLabel(item.resource_type)}
                                                </p>
                                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                    {item.resource_id || "Sem ID"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {item.actor_user_name ||
                                                        item.actor_user_email ||
                                                        (item.actor_user_id
                                                            ? shortId(item.actor_user_id)
                                                            : "Sistema")}
                                                </p>
                                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                    {item.actor_user_email ||
                                                        item.actor_user_id ||
                                                        "Sem identificador"}
                                                </p>
                                                <span
                                                    className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleTone(
                                                        item.actor_role
                                                    )}`}
                                                >
                                                    {item.actor_role || "sem papel"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {isObjectLike(item.payload) &&
                                                Object.keys(item.payload).length > 0 ? (
                                                    <details className="max-w-[360px] rounded border border-border bg-surface p-2">
                                                        <summary className="cursor-pointer select-none font-medium text-foreground">
                                                            Ver detalhes
                                                        </summary>
                                                        <div className="mt-2 space-y-1">
                                                            {Object.entries(item.payload).map(
                                                                ([key, value]) => (
                                                                    <p key={key}>
                                                                        <span className="font-medium text-foreground">
                                                                            {getPayloadLabel(key)}:
                                                                        </span>{" "}
                                                                        {formatScalarValue(value)}
                                                                    </p>
                                                                )
                                                            )}
                                                        </div>
                                                    </details>
                                                ) : (
                                                    <span>Sem detalhes adicionais.</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!result.error && (
                        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
                            <span className="text-muted-foreground">
                                Página {result.page} de {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Link
                                    href={`/admin/auditoria?${queryString(Math.max(1, result.page - 1))}`}
                                    className={`rounded border px-3 py-1 ${
                                        result.page <= 1
                                            ? "pointer-events-none opacity-40"
                                            : "hover:bg-surface"
                                    }`}
                                >
                                    Anterior
                                </Link>
                                <Link
                                    href={`/admin/auditoria?${queryString(Math.min(totalPages, result.page + 1))}`}
                                    className={`rounded border px-3 py-1 ${
                                        result.page >= totalPages
                                            ? "pointer-events-none opacity-40"
                                            : "hover:bg-surface"
                                    }`}
                                >
                                    Próxima
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
