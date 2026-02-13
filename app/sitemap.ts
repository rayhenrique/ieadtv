import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://ieadtv.kltecnologia.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: now,
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${SITE_URL}/noticias`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/eventos`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/congregacoes`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/videos`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/campanhas`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/institucional`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${SITE_URL}/missoes`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.6,
        },
        {
            url: `${SITE_URL}/lgpd`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return staticRoutes;
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const nowIso = new Date().toISOString();

        const { data } = await supabase
            .from("noticias")
            .select("slug,updated_at,created_at")
            .eq("publicado", true)
            .or(`published_at.is.null,published_at.lte.${nowIso}`)
            .limit(1000);

        const newsRoutes: MetadataRoute.Sitemap = (data || [])
            .filter((item) => item.slug)
            .map((item) => ({
                url: `${SITE_URL}/noticias/${item.slug}`,
                lastModified: item.updated_at || item.created_at || now,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));

        return [...staticRoutes, ...newsRoutes];
    } catch (error) {
        console.error("Erro ao gerar sitemap dinâmico:", error);
        return staticRoutes;
    }
}
