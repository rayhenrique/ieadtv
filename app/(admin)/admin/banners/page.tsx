import { getBanners } from "@/lib/actions/banners";
import { PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BannerActions } from "./components/BannerActions";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
    const banners = await getBanners();

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Banners
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie os banners destaques da página inicial.
                    </p>
                </div>
                <Link
                    href="/admin/banners/new"
                    className="flex items-center gap-2 bg-[#004080] text-white px-4 py-2.5 rounded-lg hover:bg-[#003366] transition-colors shadow-sm font-medium text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Novo Banner
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {banners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Nenhum banner encontrado
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-sm">
                            Comece adicionando um novo banner para destacar conteúdo na página
                            inicial.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Imagem
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Detalhes
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                                        Ordem
                                    </th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {banners.map((banner) => (
                                    <tr
                                        key={banner.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="relative w-32 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                                <Image
                                                    src={banner.imagem_url}
                                                    alt={banner.titulo}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {banner.titulo}
                                                </span>
                                                {banner.link_destino && (
                                                    <span className="text-xs text-gray-500 mt-0.5 font-mono truncate max-w-[200px]">
                                                        {banner.link_destino}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400 mt-1">
                                                    Adicionado em {new Date(banner.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                                                {banner.ordem}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <BannerActions
                                                id={banner.id}
                                                imagemUrl={banner.imagem_url}
                                                ativo={banner.ativo}
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
