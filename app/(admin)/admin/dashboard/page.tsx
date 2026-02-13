import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
    Newspaper,
    CalendarDays,
    Church,
    Image,
    Tag,
    Heart,
    FileText,
    Megaphone,
    Star,
    PenSquare,
    Clock3,
    Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CountResult = {
    count: number | null;
    error: { message: string } | null;
};

type DashboardMetric = {
    label: string;
    value: string | number;
    description: string;
    href: string;
    icon: LucideIcon;
};

interface CampanhaFinanceira {
    valor_arrecadado: number | null;
    meta_valor: number | null;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
    }).format(value);
}

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();
    const queryErrors: string[] = [];

    const [
        noticiasTotalResult,
        noticiasPublicadasResult,
        noticiasRascunhosResult,
        noticiasDestaqueResult,
        eventosTotalResult,
        eventosFuturosResult,
        congregacoesTotalResult,
        congregacoesComImagemResult,
        bannersTotalResult,
        bannersAtivosResult,
        categoriasTotalResult,
        campanhasTotalResult,
        campanhasAtivasResult,
        paginasTotalResult,
        campanhasFinanceiroResult,
        proximoEventoResult,
    ] = await Promise.all([
        supabase.from("noticias").select("*", { count: "exact", head: true }),
        supabase
            .from("noticias")
            .select("*", { count: "exact", head: true })
            .eq("publicado", true),
        supabase
            .from("noticias")
            .select("*", { count: "exact", head: true })
            .eq("publicado", false),
        supabase
            .from("noticias")
            .select("*", { count: "exact", head: true })
            .eq("destaque", true),
        supabase.from("eventos").select("*", { count: "exact", head: true }),
        supabase
            .from("eventos")
            .select("*", { count: "exact", head: true })
            .gte("data_inicio", nowIso),
        supabase
            .from("congregacoes")
            .select("*", { count: "exact", head: true }),
        supabase
            .from("congregacoes")
            .select("*", { count: "exact", head: true })
            .not("imagem_url", "is", null),
        supabase.from("banners").select("*", { count: "exact", head: true }),
        supabase
            .from("banners")
            .select("*", { count: "exact", head: true })
            .eq("ativo", true),
        supabase
            .from("categorias")
            .select("*", { count: "exact", head: true }),
        supabase
            .from("campanhas")
            .select("*", { count: "exact", head: true }),
        supabase
            .from("campanhas")
            .select("*", { count: "exact", head: true })
            .eq("ativa", true),
        supabase
            .from("paginas_estaticas")
            .select("*", { count: "exact", head: true }),
        supabase.from("campanhas").select("valor_arrecadado, meta_valor"),
        supabase
            .from("eventos")
            .select("data_inicio")
            .gte("data_inicio", nowIso)
            .order("data_inicio", { ascending: true })
            .limit(1),
    ]);

    const readCount = (result: CountResult, label: string) => {
        if (result.error) {
            queryErrors.push(`${label}: ${result.error.message}`);
            console.error(`[Dashboard] erro em ${label}:`, result.error.message);
            return 0;
        }
        return result.count ?? 0;
    };

    const noticiasTotal = readCount(noticiasTotalResult, "noticiasTotal");
    const noticiasPublicadas = readCount(
        noticiasPublicadasResult,
        "noticiasPublicadas"
    );
    const noticiasRascunhos = readCount(
        noticiasRascunhosResult,
        "noticiasRascunhos"
    );
    const noticiasDestaque = readCount(noticiasDestaqueResult, "noticiasDestaque");
    const eventosTotal = readCount(eventosTotalResult, "eventosTotal");
    const eventosFuturos = readCount(eventosFuturosResult, "eventosFuturos");
    const congregacoesTotal = readCount(
        congregacoesTotalResult,
        "congregacoesTotal"
    );
    const congregacoesComImagem = readCount(
        congregacoesComImagemResult,
        "congregacoesComImagem"
    );
    const bannersTotal = readCount(bannersTotalResult, "bannersTotal");
    const bannersAtivos = readCount(bannersAtivosResult, "bannersAtivos");
    const categoriasTotal = readCount(categoriasTotalResult, "categoriasTotal");
    const campanhasTotal = readCount(campanhasTotalResult, "campanhasTotal");
    const campanhasAtivas = readCount(campanhasAtivasResult, "campanhasAtivas");
    const paginasTotal = readCount(paginasTotalResult, "paginasTotal");

    if (campanhasFinanceiroResult.error) {
        queryErrors.push(
            `campanhasFinanceiro: ${campanhasFinanceiroResult.error.message}`
        );
        console.error(
            "[Dashboard] erro em campanhasFinanceiro:",
            campanhasFinanceiroResult.error.message
        );
    }

    if (proximoEventoResult.error) {
        queryErrors.push(`proximoEvento: ${proximoEventoResult.error.message}`);
        console.error(
            "[Dashboard] erro em proximoEvento:",
            proximoEventoResult.error.message
        );
    }

    const campanhasFinanceiras = (campanhasFinanceiroResult.data ||
        []) as CampanhaFinanceira[];
    const valorArrecadadoTotal = campanhasFinanceiras.reduce(
        (sum, campanha) => sum + Number(campanha.valor_arrecadado || 0),
        0
    );
    const valorMetaTotal = campanhasFinanceiras.reduce(
        (sum, campanha) => sum + Number(campanha.meta_valor || 0),
        0
    );
    const percentualMeta =
        valorMetaTotal > 0
            ? Math.min((valorArrecadadoTotal / valorMetaTotal) * 100, 100)
            : null;

    const proximoEvento =
        proximoEventoResult.data && proximoEventoResult.data.length > 0
            ? new Date(proximoEventoResult.data[0].data_inicio).toLocaleString(
                "pt-BR"
            )
            : "Sem eventos futuros";

    const principaisMetricas: DashboardMetric[] = [
        {
            label: "Notícias",
            value: noticiasTotal,
            description: "Total cadastrado",
            href: "/admin/noticias",
            icon: Newspaper,
        },
        {
            label: "Eventos",
            value: eventosTotal,
            description: "Total na agenda",
            href: "/admin/eventos",
            icon: CalendarDays,
        },
        {
            label: "Congregações",
            value: congregacoesTotal,
            description: "Unidades cadastradas",
            href: "/admin/congregacoes",
            icon: Church,
        },
        {
            label: "Banners",
            value: bannersTotal,
            description: "Banners do site",
            href: "/admin/banners",
            icon: Image,
        },
        {
            label: "Categorias",
            value: categoriasTotal,
            description: "Classificações de notícias",
            href: "/admin/categorias",
            icon: Tag,
        },
        {
            label: "Campanhas",
            value: campanhasTotal,
            description: "Projetos cadastrados",
            href: "/admin/campanhas",
            icon: Heart,
        },
        {
            label: "Páginas",
            value: paginasTotal,
            description: "Páginas estáticas",
            href: "/admin/paginas",
            icon: FileText,
        },
    ];

    const metricasOperacionais: DashboardMetric[] = [
        {
            label: "Notícias Publicadas",
            value: noticiasPublicadas,
            description: "Visíveis no site",
            href: "/admin/noticias",
            icon: Megaphone,
        },
        {
            label: "Notícias em Rascunho",
            value: noticiasRascunhos,
            description: "Aguardando publicação",
            href: "/admin/noticias",
            icon: PenSquare,
        },
        {
            label: "Notícias em Destaque",
            value: noticiasDestaque,
            description: "Marcadas como destaque",
            href: "/admin/noticias",
            icon: Star,
        },
        {
            label: "Eventos Futuros",
            value: eventosFuturos,
            description: "A partir de agora",
            href: "/admin/eventos",
            icon: Clock3,
        },
        {
            label: "Banners Ativos",
            value: bannersAtivos,
            description: "Em exibição pública",
            href: "/admin/banners",
            icon: Image,
        },
        {
            label: "Campanhas Ativas",
            value: campanhasAtivas,
            description: "Abertas para acompanhamento",
            href: "/admin/campanhas",
            icon: Heart,
        },
        {
            label: "Congregações com Imagem",
            value: congregacoesComImagem,
            description: "Com capa definida",
            href: "/admin/congregacoes",
            icon: Church,
        },
    ];

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Visão geral do portal com dados reais do banco.
            </p>

            {queryErrors.length > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Algumas métricas não puderam ser carregadas. Verifique RLS/permissões no
                    Supabase.
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {principaisMetricas.map((metric) => (
                    <Link
                        key={metric.label}
                        href={metric.href}
                        className="rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-muted-foreground">{metric.label}</p>
                                <p className="mt-1 text-2xl font-semibold text-foreground">
                                    {metric.value}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {metric.description}
                                </p>
                            </div>
                            <metric.icon className="h-5 w-5 text-primary" />
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metricasOperacionais.map((metric) => (
                    <Link
                        key={metric.label}
                        href={metric.href}
                        className="rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-muted-foreground">{metric.label}</p>
                                <p className="mt-1 text-2xl font-semibold text-foreground">
                                    {metric.value}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {metric.description}
                                </p>
                            </div>
                            <metric.icon className="h-5 w-5 text-primary" />
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-white p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-4 w-4 text-primary" />
                        Finanças das Campanhas
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                        {formatCurrency(valorArrecadadoTotal)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Meta total: {formatCurrency(valorMetaTotal)}
                        {percentualMeta !== null
                            ? ` (${percentualMeta.toFixed(1)}% atingido)`
                            : ""}
                    </p>
                </div>

                <div className="rounded-lg border border-border bg-white p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Próximo Evento
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                        {proximoEvento}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Agenda pública baseada em `eventos.data_inicio`.
                    </p>
                </div>
            </div>
        </div>
    );
}
