import { createClient } from "@/lib/supabase/server";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

type PublicEvent = {
    id: string;
    titulo: string;
    descricao: string | null;
    local: string | null;
    link: string | null;
    data_inicio: string;
    data_fim: string | null;
};

function isOngoing(evento: PublicEvent, now: Date) {
    const start = new Date(evento.data_inicio);
    const end = evento.data_fim ? new Date(evento.data_fim) : null;

    if (Number.isNaN(start.getTime())) {
        return false;
    }

    if (end && !Number.isNaN(end.getTime())) {
        return start.getTime() <= now.getTime() && end.getTime() >= now.getTime();
    }

    // When no end date is provided, treat only same-day started events as ongoing.
    return (
        start.getTime() <= now.getTime() &&
        start.toDateString() === now.toDateString()
    );
}

function EventCard({
    evento,
    badge,
}: {
    evento: PublicEvent;
    badge?: string;
}) {
    const dataInicio = new Date(evento.data_inicio);
    const dia = dataInicio.getDate();
    const mes = dataInicio
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "")
        .toUpperCase();

    return (
        <div className="flex items-start gap-4 rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-sm">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5">
                <span className="text-xl font-bold text-primary">{dia}</span>
                <span className="text-[10px] font-semibold uppercase text-primary">
                    {mes}
                </span>
            </div>
            <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{evento.titulo}</h3>
                    {badge && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            {badge}
                        </span>
                    )}
                </div>
                {evento.descricao && (
                    <p className="mt-1 text-sm text-muted-foreground">{evento.descricao}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {dataInicio.toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                        {" às "}
                        {dataInicio.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
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
}

export default async function EventosPage() {
    const supabase = await createClient();
    const { data: eventos } = await supabase
        .from("eventos")
        .select("*")
        .order("data_inicio", { ascending: true });
    const eventList = (eventos ?? []) as PublicEvent[];
    const now = new Date();

    const eventosEmAndamento = eventList.filter((evento) => isOngoing(evento, now));
    const proximosEventos = eventList.filter((evento) => {
        const start = new Date(evento.data_inicio);
        if (Number.isNaN(start.getTime())) {
            return false;
        }

        return start.getTime() > now.getTime();
    });

    const hasAnyEvent = eventosEmAndamento.length > 0 || proximosEventos.length > 0;

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Eventos
            </h1>
            <p className="mt-2 text-muted-foreground">
                Confira os eventos em andamento e os próximos da AD Teotônio Vilela.
            </p>

            {hasAnyEvent ? (
                <div className="mt-8 space-y-10">
                    <section>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Em andamento
                        </h2>
                        {eventosEmAndamento.length > 0 ? (
                            <div className="mt-4 space-y-4">
                                {eventosEmAndamento.map((evento) => (
                                    <EventCard key={evento.id} evento={evento} badge="Em andamento" />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-lg border border-border p-6 text-sm text-muted-foreground">
                                Nenhum evento em andamento no momento.
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                            Próximos
                        </h2>
                        {proximosEventos.length > 0 ? (
                            <div className="mt-4 space-y-4">
                                {proximosEventos.map((evento) => (
                                    <EventCard key={evento.id} evento={evento} />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-lg border border-border p-6 text-sm text-muted-foreground">
                                Nenhum próximo evento agendado.
                            </div>
                        )}
                    </section>
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
