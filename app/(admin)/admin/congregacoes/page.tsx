import { getCongregations } from "@/lib/actions/congregacoes";
import { Church, PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CongregationActions } from "./components/CongregationActions";

export const dynamic = "force-dynamic";

export default async function AdminCongregacoesPage() {
    const congregations = await getCongregations();

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Congregações
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie congregações, dirigentes e histórico.
                    </p>
                </div>
                <Link
                    href="/admin/congregacoes/new"
                    className="flex items-center gap-2 bg-[#004080] text-white px-4 py-2.5 rounded-lg hover:bg-[#003366] transition-colors shadow-sm font-medium text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Nova Congregação
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {congregations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Church className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Nenhuma congregação encontrada
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-sm">
                            Comece cadastrando a primeira congregação para exibição pública.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                                        Imagem
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Nome / Dirigente
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Endereço
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">
                                        Slug
                                    </th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {congregations.map((congregation) => (
                                    <tr
                                        key={congregation.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="relative w-16 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200">
                                                {congregation.imagem_url ? (
                                                    <Image
                                                        src={congregation.imagem_url}
                                                        alt={congregation.nome}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-300">
                                                        <Church className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col max-w-md">
                                                <span className="font-medium text-gray-900 truncate">
                                                    {congregation.nome}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {congregation.dirigente
                                                        ? `Dirigente: ${congregation.dirigente}`
                                                        : "Sem dirigente informado"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-700">
                                            {congregation.endereco || "—"}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 font-mono">
                                                {congregation.slug}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <CongregationActions
                                                id={congregation.id}
                                                nome={congregation.nome}
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
