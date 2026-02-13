import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Heart, Target } from "lucide-react";

export default async function CampanhasPage() {
    const supabase = await createClient();
    const { data: campanhas } = await supabase
        .from("campanhas")
        .select("*")
        .eq("ativa", true)
        .order("created_at", { ascending: false });

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Campanhas
            </h1>
            <p className="mt-2 text-muted-foreground">
                Projetos sociais e de construção da AD Teotônio Vilela.
            </p>

            {campanhas && campanhas.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {campanhas.map((campanha) => {
                        const progresso =
                            campanha.meta_valor && campanha.meta_valor > 0
                                ? Math.min(
                                    (campanha.valor_arrecadado /
                                        campanha.meta_valor) *
                                    100,
                                    100
                                )
                                : null;

                        return (
                            <div
                                key={campanha.id}
                                className="overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-sm"
                            >
                                <div className="aspect-[16/9] bg-surface">
                                    {campanha.imagem_url ? (
                                        <img
                                            src={campanha.imagem_url}
                                            alt={campanha.titulo}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            {campanha.tipo === "social" ? (
                                                <Heart className="h-10 w-10 text-muted-foreground/30" />
                                            ) : (
                                                <Target className="h-10 w-10 text-muted-foreground/30" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {campanha.tipo === "social"
                                            ? "Projeto Social"
                                            : campanha.tipo === "construcao"
                                                ? "Construção"
                                                : campanha.tipo}
                                    </span>
                                    <h3 className="mt-2 font-semibold text-foreground">
                                        {campanha.titulo}
                                    </h3>
                                    {campanha.descricao && (
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                            {campanha.descricao}
                                        </p>
                                    )}

                                    {progresso !== null && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    R${" "}
                                                    {Number(
                                                        campanha.valor_arrecadado
                                                    ).toLocaleString("pt-BR", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                <span>
                                                    Meta: R${" "}
                                                    {Number(
                                                        campanha.meta_valor
                                                    ).toLocaleString("pt-BR", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{
                                                        width: `${progresso}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-8 rounded-lg border border-border p-8 text-center">
                    <p className="text-muted-foreground">
                        Nenhuma campanha ativa no momento.
                    </p>
                </div>
            )}
        </div>
    );
}
