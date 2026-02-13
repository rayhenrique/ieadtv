import { createClient } from "@/lib/supabase/server";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

export default async function EventosPage() {
    const supabase = await createClient();
    const { data: eventos } = await supabase
        .from("eventos")
        .select("*")
        .order("data_inicio", { ascending: true });

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Eventos
            </h1>
            <p className="mt-2 text-muted-foreground">
                Confira a agenda de eventos da AD Teotônio Vilela.
            </p>

            {eventos && eventos.length > 0 ? (
                <div className="mt-8 space-y-4">
                    {eventos.map((evento) => {
                        const dataInicio = new Date(evento.data_inicio);
                        const dia = dataInicio.getDate();
                        const mes = dataInicio
                            .toLocaleDateString("pt-BR", { month: "short" })
                            .replace(".", "")
                            .toUpperCase();

                        return (
                            <div
                                key={evento.id}
                                className="flex items-start gap-4 rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-sm"
                            >
                                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5">
                                    <span className="text-xl font-bold text-primary">
                                        {dia}
                                    </span>
                                    <span className="text-[10px] font-semibold uppercase text-primary">
                                        {mes}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground">
                                        {evento.titulo}
                                    </h3>
                                    {evento.descricao && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {evento.descricao}
                                        </p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {dataInicio.toLocaleDateString(
                                                "pt-BR",
                                                {
                                                    weekday: "long",
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                }
                                            )}
                                            {" às "}
                                            {dataInicio.toLocaleTimeString(
                                                "pt-BR",
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </span>
                                        {evento.local && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {evento.local}
                                            </span>
                                        )}
                                        {evento.link && (
                                            <a
                                                href={evento.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:text-primary-hover"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Acessar link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="mt-8 rounded-lg border border-border p-8 text-center">
                    <p className="text-muted-foreground">
                        Nenhum evento agendado no momento.
                    </p>
                </div>
            )}
        </div>
    );
}
