import { getNewsItem } from "@/lib/actions/noticias";
import { getCategories } from "@/lib/actions/categorias";
import { NewsForm } from "../../components/NewsForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditNewsPageProps {
    params: {
        id: string;
    };
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
    const { id } = await params
    const [newsItem, categories] = await Promise.all([
        getNewsItem(id),
        getCategories(),
    ]);

    if (!newsItem) {
        notFound();
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/noticias"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Editar Notícia
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Editando: <span className="font-medium text-gray-900">{newsItem.titulo}</span>
                </p>
            </div>

            <div className="max-w-4xl">
                <NewsForm initialData={newsItem} categories={categories} />
            </div>
        </div>
    );
}
