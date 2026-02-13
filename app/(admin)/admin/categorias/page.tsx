import { getCategories } from "@/lib/actions/categorias";
import { PlusCircle, Search, Tag } from "lucide-react";
import Link from "next/link";
import { CategoryActions } from "./components/CategoryActions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Categorias
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Organize o conteúdo do site (Notícias, Eventos, etc).
                    </p>
                </div>
                <Link
                    href="/admin/categorias/new"
                    className="flex items-center gap-2 bg-[#004080] text-white px-4 py-2.5 rounded-lg hover:bg-[#003366] transition-colors shadow-sm font-medium text-sm"
                >
                    <PlusCircle className="w-4 h-4" />
                    Nova Categoria
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Tag className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Nenhuma categoria encontrada
                        </h3>
                        <p className="text-gray-500 mt-1 max-w-sm">
                            Crie categorias para organizar suas publicações.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                        Criado em
                                    </th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="group hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="font-medium text-gray-900">
                                                {category.nome}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                                                {category.slug}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs text-gray-500">
                                                {new Date(category.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <CategoryActions
                                                id={category.id}
                                                nome={category.nome}
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
