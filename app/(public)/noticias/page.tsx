import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";

type NewsListItem = {
    id: string;
    slug: string;
    titulo: string;
    resumo: string | null;
    imagem_capa_url: string | null;
    published_at: string | null;
    created_at: string;
    categorias?: {
        nome: string;
    } | null;
};

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://ieadtv.kltecnologia.com";

export const metadata: Metadata = {
    title: "Notícias",
    description:
        "Acompanhe as últimas notícias, comunicados e atualizações da Assembleia de Deus em Teotônio Vilela.",
    alternates: {
        canonical: "/noticias",
    },
    openGraph: {
        type: "website",
        url: `${SITE_URL}/noticias`,
        title: "Notícias | AD Teotônio Vilela",
        description:
            "Veja as últimas notícias e comunicados oficiais da AD Teotônio Vilela.",
        images: [
            {
                url: "/images/share-cover.png",
                width: 1200,
                height: 630,
                alt: "Notícias da AD Teotônio Vilela",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Notícias | AD Teotônio Vilela",
        description:
            "Veja as últimas notícias e comunicados oficiais da AD Teotônio Vilela.",
        images: ["/images/share-cover.png"],
    },
};

export default async function NoticiasPage() {
    const supabase = createPublicClient();
    const nowIso = new Date().toISOString();
    const { data } = await supabase
        .from("noticias")
        .select("*, categorias(nome)")
        .eq("publicado", true)
        .or(`published_at.is.null,published_at.lte.${nowIso}`)
        .order("published_at", { ascending: false, nullsFirst: false });
    const noticias = (data ?? []) as NewsListItem[];

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Notícias
            </h1>
            <p className="mt-2 text-muted-foreground">
                Acompanhe as últimas notícias da AD Teotônio Vilela.
            </p>

            {noticias && noticias.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {noticias.map((noticia) => (
                        <Link
                            key={noticia.id}
                            href={`/noticias/${noticia.slug}`}
                            className="group overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-sm"
                        >
                            <div className="aspect-[16/9] bg-surface">
                                {noticia.imagem_capa_url && (
                                    <img
                                        src={noticia.imagem_capa_url}
                                        alt={noticia.titulo}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="p-4">
                                {noticia.categorias?.nome && (
                                    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {noticia.categorias.nome}
                                    </span>
                                )}
                                <h3 className="mt-2 font-semibold text-foreground group-hover:text-primary">
                                    {noticia.titulo}
                                </h3>
                                {noticia.resumo && (
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {noticia.resumo}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {noticia.published_at
                                        ? new Date(noticia.published_at).toLocaleDateString("pt-BR")
                                        : new Date(noticia.created_at).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-8 rounded-lg border border-border p-8 text-center">
                    <p className="text-muted-foreground">
                        Nenhuma notícia publicada ainda.
                    </p>
                </div>
            )}
        </div>
    );
}
