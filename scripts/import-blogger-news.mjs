#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BLOGGER_FEED_URL =
    "https://blogadteotoniovilela.blogspot.com/feeds/posts/default?alt=json";
const IMPORT_SOURCE = "blogger";
const DEFAULT_AUTHOR = "Blog AD Teotônio Vilela";
const FALLBACK_COVER = "https://ieadtv.kltecnologia.com/images/share-cover.png";
const SUMMARY_MAX_LENGTH = 500;
const PAGE_SIZE = 150;

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const idx = trimmed.indexOf("=");
        if (idx <= 0) {
            continue;
        }

        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function stripHtml(html) {
    return String(html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function truncateText(value, max) {
    const text = String(value || "").trim();
    if (text.length <= max) {
        return text;
    }

    return `${text.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function toIsoDate(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

function normalizeBloggerImageUrl(rawUrl) {
    let url = String(rawUrl || "").trim();
    if (!url) {
        return null;
    }

    if (url.startsWith("//")) {
        url = `https:${url}`;
    }

    // blogspot style size in path: /s72-c/
    url = url.replace(/\/s\d+(-[a-z0-9]+)?\//i, "/s0/");
    // googleusercontent style size at end: =s72-c
    url = url.replace(/=s\d+(-[a-z0-9]+)*$/i, "");

    return url;
}

function extractImageUrlsFromHtml(html) {
    const source = String(html || "");
    const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const urls = [];
    const seen = new Set();

    let match = regex.exec(source);
    while (match) {
        const normalized = normalizeBloggerImageUrl(match[1]);
        if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            urls.push(normalized);
        }
        match = regex.exec(source);
    }

    return urls;
}

function getAlternateLink(entry) {
    const links = Array.isArray(entry?.link) ? entry.link : [];
    const alternate = links.find((item) => item?.rel === "alternate");
    return alternate?.href || null;
}

function slugFromUrl(url, titleFallback) {
    if (url) {
        try {
            const parsed = new URL(url);
            const segments = parsed.pathname.split("/").filter(Boolean);
            const last = segments[segments.length - 1] || "";
            const withoutExt = last.replace(/\.html?$/i, "");
            const slug = slugify(withoutExt);
            if (slug) {
                return slug;
            }
        } catch {
            // Ignore URL parse failures and fallback to title slug.
        }
    }

    return slugify(titleFallback || "noticia-blogger");
}

function normalizeEntry(entry) {
    const id = entry?.id?.$t || null;
    const title = String(entry?.title?.$t || "").trim();
    const html = String(entry?.content?.$t || "").trim();
    const summaryRaw = String(entry?.summary?.$t || "").trim();
    const url = getAlternateLink(entry);
    const publishedAt = toIsoDate(entry?.published?.$t);
    const updatedAt = toIsoDate(entry?.updated?.$t) || publishedAt;

    if (!id || !title || !html || !publishedAt || !updatedAt) {
        return {
            ok: false,
            reason: "Campos obrigatórios ausentes ou inválidos no post do Blogger.",
        };
    }

    const slug = slugFromUrl(url, title);
    const imageUrls = extractImageUrlsFromHtml(html);
    const thumbUrl = normalizeBloggerImageUrl(entry?.["media$thumbnail"]?.url);
    const coverImage = imageUrls[0] || thumbUrl || FALLBACK_COVER;
    const galleryImages = imageUrls.length > 1 ? imageUrls.slice(1) : [];
    const summaryBase = summaryRaw || stripHtml(html);
    const summary = truncateText(summaryBase, SUMMARY_MAX_LENGTH);

    return {
        ok: true,
        value: {
            id,
            url,
            title,
            slug,
            html,
            summary,
            publishedAt,
            updatedAt,
            imageUrls,
            coverImage,
            galleryImages,
        },
    };
}

async function fetchBloggerPage(startIndex) {
    const url = `${BLOGGER_FEED_URL}&max-results=${PAGE_SIZE}&start-index=${startIndex}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha ao buscar feed do Blogger (${response.status}).`);
    }

    return response.json();
}

async function fetchAllBloggerEntries() {
    let startIndex = 1;
    let totalResults = 0;
    const entries = [];

    while (true) {
        const page = await fetchBloggerPage(startIndex);
        const feed = page?.feed || {};
        const totalRaw = feed?.["openSearch$totalResults"]?.$t || "0";
        totalResults = Number(totalRaw) || totalResults;
        const batch = Array.isArray(feed.entry) ? feed.entry : [];

        if (batch.length === 0) {
            break;
        }

        entries.push(...batch);
        startIndex += batch.length;

        if (totalResults > 0 && entries.length >= totalResults) {
            break;
        }
    }

    return { totalResults, entries };
}

function nowStamp() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function ensureEnv() {
    const root = process.cwd();
    loadEnvFile(path.join(root, ".env"));
    loadEnvFile(path.join(root, ".env.local"));

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !key) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para importar notícias."
        );
    }

    return { url, key };
}

async function main() {
    const args = process.argv.slice(2);
    const applyMode = args.includes("--apply");
    const dryRunMode = !applyMode;

    const { url, key } = ensureEnv();
    const supabase = createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    console.log(
        `[import-blogger] Modo: ${dryRunMode ? "dry-run" : "apply"}`
    );
    console.log("[import-blogger] Buscando categoria de destino...");

    const { data: category, error: categoryError } = await supabase
        .from("categorias")
        .select("id, nome, slug")
        .eq("slug", "noticias")
        .maybeSingle();

    if (categoryError) {
        throw new Error(`Falha ao buscar categoria: ${categoryError.message}`);
    }

    if (!category?.id) {
        throw new Error(
            "Categoria com slug 'noticias' não encontrada. Crie-a antes da importação."
        );
    }

    console.log("[import-blogger] Carregando notícias existentes para deduplicação...");
    const { data: existingNews, error: existingError } = await supabase
        .from("noticias")
        .select("slug, fonte_externa, fonte_externa_id");

    if (existingError) {
        throw new Error(
            `Falha ao carregar notícias existentes. Verifique se db/blogger_import.sql foi aplicado. Detalhe: ${existingError.message}`
        );
    }

    const existingExternalIds = new Set(
        (existingNews || [])
            .filter(
                (item) =>
                    item.fonte_externa === IMPORT_SOURCE && item.fonte_externa_id
            )
            .map((item) => item.fonte_externa_id)
    );

    const existingSlugs = new Set(
        (existingNews || []).map((item) => item.slug).filter(Boolean)
    );
    const reservedSlugs = new Set(existingSlugs);

    console.log("[import-blogger] Lendo feed completo do Blogger...");
    const { totalResults, entries } = await fetchAllBloggerEntries();

    const report = {
        mode: dryRunMode ? "dry-run" : "apply",
        source: BLOGGER_FEED_URL,
        executedAt: new Date().toISOString(),
        totalEsperadoNoFeed: totalResults,
        totalLidos: entries.length,
        totalNovos: 0,
        totalDuplicados: 0,
        totalFalhas: 0,
        imported: [],
        duplicated: [],
        failed: [],
    };

    for (const entry of entries) {
        const normalized = normalizeEntry(entry);
        if (!normalized.ok) {
            report.totalFalhas += 1;
            report.failed.push({
                sourceId: entry?.id?.$t || null,
                slug: null,
                reason: normalized.reason,
            });
            continue;
        }

        const item = normalized.value;

        if (existingExternalIds.has(item.id)) {
            report.totalDuplicados += 1;
            report.duplicated.push({
                sourceId: item.id,
                slug: item.slug,
                reason: "source_id_already_imported",
            });
            continue;
        }

        if (reservedSlugs.has(item.slug)) {
            report.totalDuplicados += 1;
            report.duplicated.push({
                sourceId: item.id,
                slug: item.slug,
                reason: "slug_already_exists",
            });
            continue;
        }

        const insertPayload = {
            titulo: item.title,
            slug: item.slug,
            resumo: item.summary,
            conteudo: item.html,
            imagem_capa_url: item.coverImage,
            link_fotos: null,
            galeria_fotos: item.galleryImages.length > 0 ? item.galleryImages : null,
            categoria_id: category.id,
            autor: DEFAULT_AUTHOR,
            publicado: true,
            destaque: false,
            published_at: item.publishedAt,
            created_at: item.publishedAt,
            updated_at: item.updatedAt,
            fonte_externa: IMPORT_SOURCE,
            fonte_externa_id: item.id,
            fonte_externa_url: item.url,
        };

        if (!dryRunMode) {
            const { error: insertError } = await supabase
                .from("noticias")
                .insert(insertPayload);

            if (insertError) {
                report.totalFalhas += 1;
                report.failed.push({
                    sourceId: item.id,
                    slug: item.slug,
                    reason: insertError.message,
                });
                continue;
            }
        }

        report.totalNovos += 1;
        report.imported.push({
            sourceId: item.id,
            slug: item.slug,
            url: item.url,
            publishedAt: item.publishedAt,
        });

        existingExternalIds.add(item.id);
        reservedSlugs.add(item.slug);
    }

    if (!dryRunMode) {
        const auditPayload = {
            source: "blogger",
            total_lidos: report.totalLidos,
            total_novos: report.totalNovos,
            total_duplicados: report.totalDuplicados,
            total_falhas: report.totalFalhas,
        };

        const { error: auditError } = await supabase.from("audit_logs").insert({
            actor_user_id: null,
            actor_role: null,
            action: "BLOGGER_IMPORT_NEWS",
            resource_type: "noticias",
            resource_id: null,
            payload: auditPayload,
        });

        if (auditError) {
            console.warn(
                `[import-blogger] Aviso: não foi possível registrar auditoria (${auditError.message}).`
            );
        }
    }

    const reportsDir = path.join(process.cwd(), "docs", "reports");
    fs.mkdirSync(reportsDir, { recursive: true });
    const reportPath = path.join(
        reportsDir,
        `blogger-import-${nowStamp()}.json`
    );
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log("[import-blogger] Concluído.");
    console.log(
        `[import-blogger] lidos=${report.totalLidos} novos=${report.totalNovos} duplicados=${report.totalDuplicados} falhas=${report.totalFalhas}`
    );
    console.log(`[import-blogger] relatório: ${reportPath}`);

    if (report.totalFalhas > 0) {
        process.exitCode = 2;
    }
}

main().catch((error) => {
    console.error(`[import-blogger] ERRO: ${error.message}`);
    process.exit(1);
});
