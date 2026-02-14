import { getNews } from "@/lib/actions/noticias";
import { PlusCircle, Search, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { NewsActions } from "./components/NewsActions";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
    const news = await getNews();

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Notícias
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie as publicações, artigos e novidades do site.
                    </p>
                </div>
                <Link
                    href="/admin/noticias/new"
                    className="flex items-center gap-2 bg-[#004080] text-white px-4 py-2.5 rounded-lg hover:bg-[#003366] transition-colors shadow-sm font-medium text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Nova Notícia
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {news.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Nenhuma notícia encontrada
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-sm">
                            Comece escrevendo sua primeira notícia para informar a comunidade.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                                        Capa
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Título / Resumo
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                        Categoria
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                                        Status
                                    </th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {news.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="relative w-16 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                {item.imagem_capa_url ? (
                                                    <Image
                                                        src={item.imagem_capa_url}
                                                        alt={item.titulo}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-300">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col max-w-md">
                                                <span className="font-medium text-gray-900 truncate">
                                                    {item.titulo}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {item.resumo}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                {item.categorias?.nome || "Sem Categoria"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {item.publicado ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Publicado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Rascunho
                                                </span>
                                            )}
                                            {item.destaque && (
                                                <span className="ml-2 text-xs text-amber-500 font-bold" title="Destaque">★</span>
                                            )}
                                            <p className="mt-1 text-[11px] text-gray-500">
                                                {item.published_at
                                                    ? new Date(item.published_at).toLocaleString("pt-BR")
                                                    : "Sem data de publicação"}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <NewsActions
                                                id={item.id}
                                                titulo={item.titulo}
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
