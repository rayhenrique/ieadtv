import { BannerForm } from "../components/BannerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBannerPage() {
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
                    Novo Banner
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Adicione um novo banner para destaque na página inicial.
                </p>
            </div>

            <div className="max-w-3xl">
                <BannerForm />
            </div>
        </div>
    );
}
