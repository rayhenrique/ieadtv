import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { CalendarDays, Church, HeartHandshake, Newspaper } from "lucide-react";

type SearchPageProps = {
    searchParams?: {
        q?: string;
    };
};

type NewsResult = {
    id: string;
    slug: string;
    titulo: string;
    resumo: string | null;
    published_at: string | null;
    created_at: string;
};

type EventResult = {
    id: string;
    titulo: string;
    descricao: string | null;
    data_inicio: string;
    local: string | null;
};

type CongregationResult = {
    id: string;
    slug: string;
    nome: string;
    dirigente: string | null;
    endereco: string | null;
};

type CampaignResult = {
    id: string;
    titulo: string;
    descricao: string | null;
    tipo: string | null;
};

function includesQuery(text: string | null | undefined, query: string) {
    if (!text) return false;
    return text.toLowerCase().includes(query);
}

export default async function BuscaPage({ searchParams }: SearchPageProps) {
    const query = (searchParams?.q || "").trim();
    const normalizedQuery = query.toLowerCase();
    const hasQuery = normalizedQuery.length >= 2;

    let noticias: NewsResult[] = [];
    let eventos: EventResult[] = [];
    let congregacoes: CongregationResult[] = [];
    let campanhas: CampaignResult[] = [];

    if (hasQuery) {
        const supabase = createPublicClient();
        const nowIso = new Date().toISOString();

        const [newsResponse, eventsResponse, congregationsResponse, campaignsResponse] =
            await Promise.all([
                supabase
                    .from("noticias")
                    .select("id, slug, titulo, resumo, published_at, created_at")
                    .eq("publicado", true)
                    .or(`published_at.is.null,published_at.lte.${nowIso}`)
                    .order("published_at", { ascending: false, nullsFirst: false })
                    .limit(100),
                supabase
                    .from("eventos")
                    .select("id, titulo, descricao, data_inicio, local")
                    .order("data_inicio", { ascending: true })
                    .limit(100),
                supabase
                    .from("congregacoes")
                    .select("id, slug, nome, dirigente, endereco")
                    .order("nome", { ascending: true })
                    .limit(100),
                supabase
                    .from("campanhas")
                    .select("id, titulo, descricao, tipo")
                    .eq("ativa", true)
                    .order("created_at", { ascending: false })
                    .limit(100),
            ]);

        noticias = ((newsResponse.data || []) as NewsResult[]).filter(
            (item) =>
                includesQuery(item.titulo, normalizedQuery) ||
                includesQuery(item.resumo, normalizedQuery)
        );

        eventos = ((eventsResponse.data || []) as EventResult[]).filter(
            (item) =>
                includesQuery(item.titulo, normalizedQuery) ||
                includesQuery(item.descricao, normalizedQuery) ||
                includesQuery(item.local, normalizedQuery)
        );

        congregacoes = ((congregationsResponse.data || []) as CongregationResult[]).filter(
            (item) =>
                includesQuery(item.nome, normalizedQuery) ||
                includesQuery(item.dirigente, normalizedQuery) ||
                includesQuery(item.endereco, normalizedQuery)
        );

        campanhas = ((campaignsResponse.data || []) as CampaignResult[]).filter(
            (item) =>
                includesQuery(item.titulo, normalizedQuery) ||
                includesQuery(item.descricao, normalizedQuery) ||
                includesQuery(item.tipo, normalizedQuery)
        );
    }

    const totalResults =
        noticias.length + eventos.length + congregacoes.length + campanhas.length;

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Busca</h1>
            <p className="mt-2 text-muted-foreground">
                Pesquise notícias, eventos, congregações e campanhas.
            </p>

            {!query ? (
                <div className="mt-8 rounded-lg border border-border bg-white p-6">
                    <p className="text-muted-foreground">
                        Digite um termo na busca do topo para encontrar conteúdos.
                    </p>
                </div>
            ) : !hasQuery ? (
                <div className="mt-8 rounded-lg border border-border bg-white p-6">
                    <p className="text-muted-foreground">
                        Use pelo menos 2 caracteres para buscar.
                    </p>
                </div>
            ) : (
                <div className="mt-8 space-y-8">
                    <div className="rounded-lg border border-border bg-white p-4">
                        <p className="text-sm text-muted-foreground">
                            Resultado para <span className="font-semibold text-foreground">&quot;{query}&quot;</span>:{" "}
                            <span className="font-semibold text-foreground">{totalResults}</span> itens encontrados.
                        </p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
                            <Newspaper className="h-5 w-5 text-primary" />
                            Notícias ({noticias.length})
                        </h2>
                        {noticias.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {noticias.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/noticias/${item.slug}`}
                                        className="rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <h3 className="font-semibold text-foreground">{item.titulo}</h3>
                                        {item.resumo && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {item.resumo}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum resultado em notícias.</p>
                        )}
                    </section>

                    <section className="space-y-4">
                        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Eventos ({eventos.length})
                        </h2>
                        {eventos.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {eventos.map((item) => (
                                    <Link
                                        key={item.id}
                                        href="/eventos"
                                        className="rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <h3 className="font-semibold text-foreground">{item.titulo}</h3>
                                        {item.descricao && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {item.descricao}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {new Date(item.data_inicio).toLocaleDateString("pt-BR")}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum resultado em eventos.</p>
                        )}
                    </section>

                    <section className="space-y-4">
                        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
                            <Church className="h-5 w-5 text-primary" />
                            Congregações ({congregacoes.length})
                        </h2>
                        {congregacoes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {congregacoes.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/congregacoes/${item.slug}`}
                                        className="rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <h3 className="font-semibold text-foreground">{item.nome}</h3>
                                        {item.dirigente && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Dirigente: {item.dirigente}
                                            </p>
                                        )}
                                        {item.endereco && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {item.endereco}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum resultado em congregações.</p>
                        )}
                    </section>

                    <section className="space-y-4">
                        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground">
                            <HeartHandshake className="h-5 w-5 text-primary" />
                            Campanhas ({campanhas.length})
                        </h2>
                        {campanhas.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {campanhas.map((item) => (
                                    <Link
                                        key={item.id}
                                        href="/campanhas"
                                        className="rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <h3 className="font-semibold text-foreground">{item.titulo}</h3>
                                        {item.descricao && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {item.descricao}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum resultado em campanhas.</p>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
