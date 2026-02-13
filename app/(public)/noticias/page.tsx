import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NoticiasPage() {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();
    const { data: noticias } = await supabase
        .from("noticias")
        .select("*, categorias(nome)")
        .eq("publicado", true)
        .or(`published_at.is.null,published_at.lte.${nowIso}`)
        .order("published_at", { ascending: false, nullsFirst: false });

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
