import { getBanner } from "@/lib/actions/banners";
import { BannerForm } from "../../components/BannerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditBannerPageProps {
    params: {
        id: string;
    };
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
    const { id } = await params
    const banner = await getBanner(id);

    if (!banner) {
        notFound();
    }

    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/banners"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Editar Banner
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Editando banner: <span className="font-medium text-gray-900">{banner.titulo}</span>
                </p>
            </div>

            <div className="max-w-3xl">
                <BannerForm initialData={banner} />
            </div>
        </div>
    );
}
