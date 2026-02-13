import { getPublicNewsItem } from "@/lib/actions/noticias";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowLeft, ExternalLink, Image as ImageIcon } from "lucide-react";
import { NewsGalleryCarousel } from "@/components/news/NewsGalleryCarousel";

interface NewsDetailPageProps {
    params: {
        slug: string;
    };
}

export const revalidate = 60;

export async function generateMetadata({ params }: NewsDetailPageProps) {
    const { slug } = await params
    const newsItem = await getPublicNewsItem(slug);

    if (!newsItem) {
        return {
            title: "Notícia não encontrada",
        };
    }

    return {
        title: `${newsItem.titulo} - AD Teotônio Vilela`,
        description: newsItem.resumo,
    };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
    const { slug } = await params
    const newsItem = await getPublicNewsItem(slug);

    if (!newsItem) {
        notFound();
    }

    const renderedContent = newsItem.conteudo.includes("<")
        ? newsItem.conteudo
        : newsItem.conteudo.replace(/\n/g, "<br/>");

    return (
        <article className="min-h-screen bg-gray-50 pb-16">
            {/* Header / Cover */}
            <div className="w-full bg-white border-b border-gray-200">
                <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-12">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar para Home
                    </Link>

                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                {newsItem.categorias?.nome || "Geral"}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
                            {newsItem.titulo}
                        </h1>

                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            {newsItem.resumo}
                        </p>

                        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(newsItem.published_at || newsItem.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {newsItem.autor || "ADTV"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Image */}
            {newsItem.imagem_capa_url && (
                <div className="mx-auto max-w-[1000px] px-4 sm:px-6 -mt-8 sm:-mt-12 relative z-10">
                    <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden shadow-xl border border-white/20">
                        <Image
                            src={newsItem.imagem_capa_url}
                            alt={newsItem.titulo}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-12">
                <div
                    className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                />

                {/* External Link Button */}
                {newsItem.link_fotos && (
                    <div className="mt-12 text-center">
                        <a
                            href={newsItem.link_fotos}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Ver Mais Fotos (Google Drive)
                        </a>
                    </div>
                )}

                {/* Galeria de Fotos em carrossel com ampliação */}
                {newsItem.galeria_fotos && newsItem.galeria_fotos.length > 0 && (
                    <div className="mt-16 pt-16 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-6">
                            <ImageIcon className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Galeria de Fotos</h2>
                        </div>

                        <NewsGalleryCarousel images={newsItem.galeria_fotos} />
                    </div>
                )}
            </div>
        </article>
    );
}
