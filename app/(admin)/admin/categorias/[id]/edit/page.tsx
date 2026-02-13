import { getCategory } from "@/lib/actions/categorias";
import { CategoryForm } from "../../components/CategoryForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditCategoryPageProps {
    params: {
        id: string;
    };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
    const { id } = await params
    const category = await getCategory(id);

    if (!category) {
        notFound();
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/categorias"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Editar Categoria
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Editando categoria: <span className="font-medium text-gray-900">{category.nome}</span>
                </p>
            </div>

            <div className="max-w-3xl">
                <CategoryForm initialData={category} />
            </div>
        </div>
    );
}
