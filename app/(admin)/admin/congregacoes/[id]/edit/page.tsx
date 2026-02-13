import { getCongregation } from "@/lib/actions/congregacoes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CongregationForm } from "../../components/CongregationForm";

export default async function EditCongregationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const congregation = await getCongregation(id);

    if (!congregation) {
        notFound();
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/congregacoes"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Editar Congregação
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Editando:{" "}
                    <span className="font-medium text-gray-900">
                        {congregation.nome}
                    </span>
                </p>
            </div>

            <CongregationForm initialData={congregation} />
        </div>
    );
}
