import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
    getYoutubeChannelUrl,
    getYoutubePrimaryStreamVideo,
    getYoutubeLiveEmbedUrl,
    getYoutubeRecentVideos,
    resolveYoutubeChannelId,
} from "@/lib/youtube";
import { ExternalLink, Radio } from "lucide-react";

export const revalidate = 300;

export default async function VideosPage() {
    const supabase = await createClient();
    const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "social_youtube")
        .maybeSingle();

    const youtubeUrl =
        data?.value && /^https?:\/\//i.test(data.value.trim())
            ? data.value.trim()
            : null;
    const channelId = await resolveYoutubeChannelId(youtubeUrl);
    const videos = await getYoutubeRecentVideos({ channelId, maxResults: 24 });
    const featuredVideo = await getYoutubePrimaryStreamVideo({
        channelId,
        recentVideos: videos,
    });
    const channelUrl = getYoutubeChannelUrl(youtubeUrl, channelId);

    return (
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Vídeos
            </h1>
            <p className="mt-2 text-muted-foreground">
                Assista às transmissões e aos vídeos publicados da AD Teotônio Vilela.
            </p>

            <section className="mt-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        Transmissão Ao Vivo
                    </h2>
                    <a
                        href={channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
                    >
                        <Radio className="h-4 w-4" />
                        Canal no YouTube
                    </a>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                    <div className="aspect-video">
                        <iframe
                            src={featuredVideo?.embedUrl || getYoutubeLiveEmbedUrl(channelId)}
                            title="Transmissão ao vivo AD Teotônio Vilela"
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>

            <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Vídeos Publicados
                </h2>

                {videos.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
                        Não foi possível carregar os vídeos agora. Tente novamente em instantes.
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {videos.map((video) => (
                            <a
                                key={video.videoId}
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
                            >
                                <div className="relative aspect-video overflow-hidden bg-surface">
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                                        {video.title}
                                    </h3>
                                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {video.publishedAt
                                                ? new Date(video.publishedAt).toLocaleDateString("pt-BR")
                                                : "Sem data"}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-primary">
                                            Assistir
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
