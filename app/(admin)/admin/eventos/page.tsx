import { getEvents } from "@/lib/actions/eventos";
import { PlusCircle, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import { EventActions } from "./components/EventActions";

export const dynamic = "force-dynamic";

export default async function AdminEventosPage() {
    const events = await getEvents();

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Eventos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie a agenda de eventos e programações da igreja.
                    </p>
                </div>
                <Link
                    href="/admin/eventos/new"
                    className="flex items-center gap-2 bg-[#004080] text-white px-4 py-2.5 rounded-lg hover:bg-[#003366] transition-colors shadow-sm font-medium text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Novo Evento
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <CalendarDays className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Nenhum evento encontrado
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-sm">
                            Crie o primeiro evento para preencher a agenda pública.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">
                                        Início
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">
                                        Fim
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Local
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                                        Link
                                    </th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {events.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col max-w-md">
                                                <span className="font-medium text-gray-900 truncate">
                                                    {event.titulo}
                                                </span>
                                                {event.descricao && (
                                                    <span className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {event.descricao}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-700">
                                            {new Date(event.data_inicio).toLocaleString(
                                                "pt-BR",
                                                {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-700">
                                            {event.data_fim
                                                ? new Date(event.data_fim).toLocaleString(
                                                      "pt-BR",
                                                      {
                                                          day: "2-digit",
                                                          month: "2-digit",
                                                          year: "numeric",
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      }
                                                  )
                                                : "—"}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-700">
                                            {event.local || "—"}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-700">
                                            {event.link ? (
                                                <a
                                                    href={event.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                                >
                                                    Abrir
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <EventActions
                                                id={event.id}
                                                titulo={event.titulo}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
