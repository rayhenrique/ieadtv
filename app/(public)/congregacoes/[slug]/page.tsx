import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, User } from "lucide-react";

export default async function CongregacaoDetalhePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: congregacao } = await supabase
        .from("congregacoes")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!congregacao) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
            <Link
                href="/congregacoes"
                className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Congregações
            </Link>

            {congregacao.imagem_url && (
                <div className="mb-6 overflow-hidden rounded-lg">
                    <img
                        src={congregacao.imagem_url}
                        alt={congregacao.nome}
                        className="w-full object-cover"
                    />
                </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {congregacao.nome}
            </h1>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {congregacao.dirigente && (
                    <span className="inline-flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        Dirigente: {congregacao.dirigente}
                    </span>
                )}
                {congregacao.endereco && (
                    <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {congregacao.endereco}
                    </span>
                )}
            </div>

            {congregacao.historico && (
                <div className="mt-8 border-t border-border pt-8">
                    <h2 className="mb-4 text-xl font-semibold text-foreground">
                        Histórico
                    </h2>
                    <div
                        className="prose prose-gray max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{
                            __html: congregacao.historico,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
