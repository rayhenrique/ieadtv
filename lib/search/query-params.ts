export type QueryParamValue = string | string[] | undefined;

function normalizeWhitespace(value: string) {
    return value.trim().replace(/\s+/g, " ");
}

export function getSingleQueryValue(input: QueryParamValue) {
    if (typeof input === "string") {
        return normalizeWhitespace(input);
    }

    if (Array.isArray(input)) {
        for (const value of input) {
            if (typeof value !== "string") continue;
            const normalized = normalizeWhitespace(value);
            if (normalized) return normalized;
        }
    }

    return "";
}
