import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";

export default async function CongregacoesPage() {
    const supabase = await createClient();
    const { data: congregacoes } = await supabase
        .from("congregacoes")
        .select("*")
        .order("nome", { ascending: true });

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Congregações
            </h1>
            <p className="mt-2 text-muted-foreground">
                Encontre uma congregação perto de você.
            </p>

            {congregacoes && congregacoes.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {congregacoes.map((congregacao) => (
                        <Link
                            key={congregacao.id}
                            href={`/congregacoes/${congregacao.slug}`}
                            className="group overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-sm"
                        >
                            <div className="aspect-[16/9] bg-surface">
                                {congregacao.imagem_url && (
                                    <img
                                        src={congregacao.imagem_url}
                                        alt={congregacao.nome}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-foreground group-hover:text-primary">
                                    {congregacao.nome}
                                </h3>
                                {congregacao.dirigente && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Dirigente: {congregacao.dirigente}
                                    </p>
                                )}
                                {congregacao.endereco && (
                                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {congregacao.endereco}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="mt-8 rounded-lg border border-border p-8 text-center">
                    <p className="text-muted-foreground">
                        Nenhuma congregação cadastrada ainda.
                    </p>
                </div>
            )}
        </div>
    );
}
