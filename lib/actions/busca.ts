import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import {
    computeRelevanceScore,
    sanitizeQuery,
    tokenizeQuery,
    type WeightedSearchField,
} from "@/lib/search/normalize";

type SearchInput = {
    q: string;
    limitPerSection?: number;
};

type SearchResultBase = {
    id: string;
    score: number;
    matchedFields: string[];
    sortDate: string | null;
};

export type SearchNewsResult = SearchResultBase & {
    slug: string;
    title: string;
    summary: string | null;
};

export type SearchEventResult = SearchResultBase & {
    title: string;
    description: string | null;
    startDate: string;
};

export type SearchCongregationResult = SearchResultBase & {
    slug: string;
    name: string;
    leader: string | null;
    address: string | null;
};

export type SearchMissionResult = SearchResultBase & {
    slug: string;
    title: string;
    summary: string | null;
};

export type GlobalSearchResult = {
    query: string;
    tokens: string[];
    total: number;
    limitPerSection: number;
    sections: {
        noticias: SearchNewsResult[];
        eventos: SearchEventResult[];
        congregacoes: SearchCongregationResult[];
        missoes: SearchMissionResult[];
    };
    error?: string;
};

const FETCH_LIMIT_PER_SECTION = 300;
const DEFAULT_LIMIT_PER_SECTION = 12;
const MAX_LIMIT_PER_SECTION = 24;
const MIN_QUERY_LENGTH = 2;

type NewsRow = {
    id: string;
    slug: string;
    titulo: string;
    resumo: string | null;
    published_at: string | null;
    created_at: string;
};

type EventRow = {
    id: string;
    titulo: string;
    descricao: string | null;
    data_inicio: string;
    local: string | null;
};

type CongregationRow = {
    id: string;
    slug: string;
    nome: string;
    dirigente: string | null;
    endereco: string | null;
};

type MissionCategoryRow = {
    id: string;
};

type MissionNewsRow = {
    id: string;
    slug: string;
    titulo: string;
    resumo: string | null;
    published_at: string | null;
    created_at: string;
};

function parseIsoTimestamp(value: string | null) {
    if (!value) return 0;
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? 0 : ts;
}

function sortByRelevanceAndDate<T extends SearchResultBase>(items: T[]) {
    return items.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        const bDate = parseIsoTimestamp(b.sortDate);
        const aDate = parseIsoTimestamp(a.sortDate);
        if (bDate !== aDate) {
            return bDate - aDate;
        }

        return a.id.localeCompare(b.id);
    });
}

function clampLimit(limitPerSection?: number) {
    if (!limitPerSection || Number.isNaN(limitPerSection)) {
        return DEFAULT_LIMIT_PER_SECTION;
    }

    return Math.max(1, Math.min(MAX_LIMIT_PER_SECTION, Math.floor(limitPerSection)));
}

function toScore(tokens: string[], fields: WeightedSearchField[]) {
    return computeRelevanceScore(tokens, fields);
}

export async function getGlobalSearchResults(
    params: SearchInput
): Promise<GlobalSearchResult> {
    const startedAt = Date.now();
    const query = sanitizeQuery(params.q || "");
    const limitPerSection = clampLimit(params.limitPerSection);
    const tokens = tokenizeQuery(query);

    const emptyResult: GlobalSearchResult = {
        query,
        tokens,
        total: 0,
        limitPerSection,
        sections: {
            noticias: [],
            eventos: [],
            congregacoes: [],
            missoes: [],
        },
    };

    if (tokens.length === 0 || query.length < MIN_QUERY_LENGTH) {
        return emptyResult;
    }

    try {
        const supabase = createPublicClient();
        const nowIso = new Date().toISOString();

        const [newsResponse, eventsResponse, congregationsResponse, missionCategoriesResponse] =
            await Promise.all([
                supabase
                    .from("noticias")
                    .select("id, slug, titulo, resumo, published_at, created_at")
                    .eq("publicado", true)
                    .or(`published_at.is.null,published_at.lte.${nowIso}`)
                    .order("published_at", { ascending: false, nullsFirst: false })
                    .limit(FETCH_LIMIT_PER_SECTION),
                supabase
                    .from("eventos")
                    .select("id, titulo, descricao, data_inicio, local")
                    .order("data_inicio", { ascending: true })
                    .limit(FETCH_LIMIT_PER_SECTION),
                supabase
                    .from("congregacoes")
                    .select("id, slug, nome, dirigente, endereco")
                    .order("nome", { ascending: true })
                    .limit(FETCH_LIMIT_PER_SECTION),
                supabase
                    .from("categorias")
                    .select("id")
                    .in("slug", ["missao", "missoes"]),
            ]);

        const newsRows = (newsResponse.data || []) as NewsRow[];
        const eventRows = (eventsResponse.data || []) as EventRow[];
        const congregationRows = (congregationsResponse.data ||
            []) as CongregationRow[];
        const missionCategoryRows = (missionCategoriesResponse.data ||
            []) as MissionCategoryRow[];
        const missionCategoryIds = missionCategoryRows.map((item) => item.id);

        const missionRows: MissionNewsRow[] = [];
        if (missionCategoryIds.length > 0) {
            const { data: missionNewsData } = await supabase
                .from("noticias")
                .select("id, slug, titulo, resumo, published_at, created_at")
                .eq("publicado", true)
                .in("categoria_id", missionCategoryIds)
                .or(`published_at.is.null,published_at.lte.${nowIso}`)
                .order("published_at", { ascending: false, nullsFirst: false })
                .limit(FETCH_LIMIT_PER_SECTION);

            missionRows.push(...((missionNewsData || []) as MissionNewsRow[]));
        }

        const noticias = sortByRelevanceAndDate(
            newsRows
                .map((item) => {
                    const { score, matchedFields } = toScore(tokens, [
                        { name: "titulo", value: item.titulo, weight: 10 },
                        { name: "resumo", value: item.resumo, weight: 6 },
                    ]);

                    return {
                        id: item.id,
                        slug: item.slug,
                        title: item.titulo,
                        summary: item.resumo,
                        score,
                        matchedFields,
                        sortDate: item.published_at || item.created_at || null,
                    } as SearchNewsResult;
                })
                .filter((item) => item.score > 0)
        ).slice(0, limitPerSection);

        const eventos = sortByRelevanceAndDate(
            eventRows
                .map((item) => {
                    const { score, matchedFields } = toScore(tokens, [
                        { name: "titulo", value: item.titulo, weight: 10 },
                        { name: "descricao", value: item.descricao, weight: 6 },
                        { name: "local", value: item.local, weight: 5 },
                    ]);

                    return {
                        id: item.id,
                        title: item.titulo,
                        description: item.descricao,
                        startDate: item.data_inicio,
                        score,
                        matchedFields,
                        sortDate: item.data_inicio || null,
                    } as SearchEventResult;
                })
                .filter((item) => item.score > 0)
        ).slice(0, limitPerSection);

        const congregacoes = sortByRelevanceAndDate(
            congregationRows
                .map((item) => {
                    const { score, matchedFields } = toScore(tokens, [
                        { name: "nome", value: item.nome, weight: 10 },
                        { name: "dirigente", value: item.dirigente, weight: 5 },
                        { name: "endereco", value: item.endereco, weight: 5 },
                    ]);

                    return {
                        id: item.id,
                        slug: item.slug,
                        name: item.nome,
                        leader: item.dirigente,
                        address: item.endereco,
                        score,
                        matchedFields,
                        sortDate: null,
                    } as SearchCongregationResult;
                })
                .filter((item) => item.score > 0)
        ).slice(0, limitPerSection);

        const missoes = sortByRelevanceAndDate(
            missionRows
                .map((item) => {
                    const { score, matchedFields } = toScore(tokens, [
                        { name: "titulo", value: item.titulo, weight: 10 },
                        { name: "resumo", value: item.resumo, weight: 6 },
                    ]);

                    return {
                        id: item.id,
                        slug: item.slug,
                        title: item.titulo,
                        summary: item.resumo,
                        score,
                        matchedFields,
                        sortDate: item.published_at || item.created_at || null,
                    } as SearchMissionResult;
                })
                .filter((item) => item.score > 0)
        ).slice(0, limitPerSection);

        const result: GlobalSearchResult = {
            query,
            tokens,
            limitPerSection,
            total:
                noticias.length +
                eventos.length +
                congregacoes.length +
                missoes.length,
            sections: {
                noticias,
                eventos,
                congregacoes,
                missoes,
            },
        };

        if (process.env.NODE_ENV !== "production") {
            const elapsed = Date.now() - startedAt;
            console.info(
                "[search] query=%s ms=%d counts={noticias:%d,eventos:%d,congregacoes:%d,missoes:%d}",
                query,
                elapsed,
                noticias.length,
                eventos.length,
                congregacoes.length,
                missoes.length
            );
        }

        return result;
    } catch (error) {
        console.error("[search] failed to fetch global search results", error);
        return {
            ...emptyResult,
            error: "Não foi possível executar a busca neste momento.",
        };
    }
}
