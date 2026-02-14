import Link from "next/link";
import { CalendarDays, Church, HandHelping, Newspaper } from "lucide-react";
import { getGlobalSearchResults } from "@/lib/actions/busca";
import { getSingleQueryValue } from "@/lib/search/query-params";

type SearchPageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

const MIN_QUERY_LENGTH = 2;

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenizeForHighlight(query: string) {
    return query
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 10);
}

function renderHighlightedText(text: string, tokens: string[]) {
    if (!text || tokens.length === 0) {
        return text;
    }

    const pattern = tokens.map(escapeRegExp).join("|");
    if (!pattern) {
        return text;
    }

    const regex = new RegExp(`(${pattern})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const isMatch = tokens.some(
            (token) => token.toLowerCase() === part.toLowerCase()
        );

        if (!isMatch) {
            return <span key={`txt-${index}`}>{part}</span>;
        }

        return (
            <mark
                key={`mark-${index}`}
                className="rounded bg-yellow-100 px-0.5 text-foreground"
            >
                {part}
            </mark>
        );
    });
}

export default async function BuscaPage({ searchParams }: SearchPageProps) {
    const resolvedSearchParams = await searchParams;
    const query = getSingleQueryValue(resolvedSearchParams?.q);

    if (process.env.NODE_ENV !== "production") {
        console.info("[busca-page] raw_q=%o normalized_q=%s", resolvedSearchParams?.q, query);
    }

    const hasQuery = query.length >= MIN_QUERY_LENGTH;
    const highlightTokens = tokenizeForHighlight(query);
    const results = hasQuery
        ? await getGlobalSearchResults({ q: query, limitPerSection: 12 })
        : null;

    const totalResults = results?.total || 0;
    const noticias = results?.sections.noticias || [];
    const eventos = results?.sections.eventos || [];
    const congregacoes = results?.sections.congregacoes || [];
    const missoes = results?.sections.missoes || [];

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Busca</h1>
            <p className="mt-2 text-muted-foreground">
                Pesquise notícias, eventos, congregações e missões.
            </p>

            {!query ? (
                <div className="mt-8 rounded-lg border border-border bg-white p-6">
                    <p className="text-muted-foreground">
                        Digite um termo na busca do topo para encontrar conteúdos.
                    </p>
                </div>
            ) : query.length < MIN_QUERY_LENGTH ? (
                <div className="mt-8 rounded-lg border border-border bg-white p-6">
                    <p className="text-muted-foreground">
                        Use pelo menos 2 caracteres para buscar.
                    </p>
                </div>
            ) : results?.error ? (
                <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
                    <p className="text-red-700">{results.error}</p>
                </div>
            ) : (
                <div className="mt-8 space-y-8">
                    <div className="rounded-lg border border-border bg-white p-4">
                        <p className="text-sm text-muted-foreground">
                            Resultado para <span className="font-semibold text-foreground">&quot;{query}&quot;</span>:{" "}
                            <span className="font-semibold text-foreground">{totalResults}</span> itens encontrados.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Ordenação por relevância e data. Busca sem distinção de acentuação.
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
                                        <h3 className="font-semibold text-foreground">
                                            {renderHighlightedText(item.title, highlightTokens)}
                                        </h3>
                                        {item.summary && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {renderHighlightedText(item.summary, highlightTokens)}
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
                                        <h3 className="font-semibold text-foreground">
                                            {renderHighlightedText(item.title, highlightTokens)}
                                        </h3>
                                        {item.description && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {renderHighlightedText(item.description, highlightTokens)}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {new Date(item.startDate).toLocaleDateString("pt-BR")}
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
                                        <h3 className="font-semibold text-foreground">
                                            {renderHighlightedText(item.name, highlightTokens)}
                                        </h3>
                                        {item.leader && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Dirigente: {renderHighlightedText(item.leader, highlightTokens)}
                                            </p>
                                        )}
                                        {item.address && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {renderHighlightedText(item.address, highlightTokens)}
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
                            <HandHelping className="h-5 w-5 text-primary" />
                            Missões ({missoes.length})
                        </h2>
                        {missoes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {missoes.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/noticias/${item.slug}`}
                                        className="rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <h3 className="font-semibold text-foreground">
                                            {renderHighlightedText(item.title, highlightTokens)}
                                        </h3>
                                        {item.summary && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {renderHighlightedText(item.summary, highlightTokens)}
                                            </p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum resultado em missões.</p>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
