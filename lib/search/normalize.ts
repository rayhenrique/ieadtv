export type WeightedSearchField = {
    name: string;
    value: string | null | undefined;
    weight: number;
};

export function normalizeText(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function sanitizeQuery(raw: string, maxLength = 80) {
    return raw.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function tokenizeQuery(raw: string) {
    const normalized = normalizeText(raw);
    if (!normalized) return [];

    return normalized.split(" ").filter(Boolean);
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesPrefix(text: string, token: string) {
    return text.split(" ").some((word) => word.startsWith(token));
}

export function computeRelevanceScore(
    tokens: string[],
    fields: WeightedSearchField[]
) {
    if (tokens.length === 0) {
        return { score: 0, matchedFields: [] as string[] };
    }

    const matchedFields = new Set<string>();
    let score = 0;
    let matchedTokenCount = 0;

    for (const token of tokens) {
        let tokenMatched = false;
        const tokenWordRegex = new RegExp(`\\b${escapeRegExp(token)}\\b`, "i");

        for (const field of fields) {
            const normalizedValue = normalizeText(field.value || "");
            if (!normalizedValue) continue;

            if (tokenWordRegex.test(normalizedValue)) {
                score += field.weight * 3;
                tokenMatched = true;
                matchedFields.add(field.name);
                continue;
            }

            if (normalizedValue.includes(token)) {
                score += field.weight * 2;
                tokenMatched = true;
                matchedFields.add(field.name);
                continue;
            }

            if (includesPrefix(normalizedValue, token)) {
                score += field.weight;
                tokenMatched = true;
                matchedFields.add(field.name);
            }
        }

        if (tokenMatched) {
            matchedTokenCount += 1;
        }
    }

    if (matchedTokenCount === tokens.length) {
        score += 10 + tokens.length * 2;
    }

    return {
        score,
        matchedFields: Array.from(matchedFields),
    };
}
