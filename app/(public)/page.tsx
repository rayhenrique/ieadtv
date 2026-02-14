import { BannerSlider } from "@/components/home/BannerSlider";
import { getPublicBanners } from "@/lib/actions/banners";
import { getPublicNews } from "@/lib/actions/noticias";
import { getPublicEvents } from "@/lib/actions/eventos";
import { createPublicClient } from "@/lib/supabase/public";
import {
    getYoutubeChannelUrl,
    getYoutubePrimaryStreamVideo,
    getYoutubeLiveEmbedUrl,
    getYoutubeRecentVideos,
    resolveYoutubeChannelId,
} from "@/lib/youtube";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, FileText, MapPin, Radio } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

type StaticPageSection = {
    titulo: string | null;
    conteudo: string | null;
};

type SiteSettingValue = {
    value: string | null;
};

const HOME_ADDRESS_SLUG = "home-templo-endereco";
const HOME_SCHEDULE_SLUG = "home-templo-horarios";

const DEFAULT_HOME_ADDRESS_TITLE = "Templo Sede";
const DEFAULT_HOME_ADDRESS_CONTENT = `
<p><strong>Igreja Evangélica Assembleia de Deus - Templo Sede</strong></p>
<p>Av. Moreira e Silva, nº 406, Farol</p>
`;

const DEFAULT_HOME_SCHEDULE_TITLE = "Horário de Cultos";
const DEFAULT_HOME_SCHEDULE_CONTENT = `
<ul>
  <li>Aos Domingos 09:00h - Escola Dominical</li>
  <li>Aos Domingos 18:30h - Culto Evangelístico</li>
  <li>As Terças-feiras 18:30h - Culto de Doutrina</li>
  <li>As Quarta-feiras 10:00h às 17:00h - Círculo de Oração</li>
  <li>As Sextas-feiras 18:30h - Culto de Oração</li>
</ul>
`;

export default async function HomePage() {
    const [banners, news, events, homeAddressPage, homeSchedulePage, youtubeData] =
        await Promise.all([
            getPublicBanners(),
            getPublicNews(3),
            getPublicEvents(4),
            (async () => {
                const supabase = createPublicClient();
                const { data } = await supabase
                    .from("paginas_estaticas")
                    .select("titulo, conteudo")
                    .eq("slug", HOME_ADDRESS_SLUG)
                    .maybeSingle();
                return data as StaticPageSection | null;
            })(),
            (async () => {
                const supabase = createPublicClient();
                const { data } = await supabase
                    .from("paginas_estaticas")
                    .select("titulo, conteudo")
                    .eq("slug", HOME_SCHEDULE_SLUG)
                    .maybeSingle();
                return data as StaticPageSection | null;
            })(),
            (async () => {
                const supabase = createPublicClient();
                const { data } = await supabase
                    .from("site_settings")
                    .select("value")
                    .eq("key", "social_youtube")
                    .maybeSingle();
                const youtubeSetting = data as SiteSettingValue | null;

                const youtubeUrl =
                    youtubeSetting?.value &&
                    /^https?:\/\//i.test(youtubeSetting.value.trim())
                        ? youtubeSetting.value.trim()
                        : null;
                const channelId = await resolveYoutubeChannelId(youtubeUrl);
                const videos = await getYoutubeRecentVideos({
                    channelId,
                    maxResults: 3,
                });
                const featuredVideo = await getYoutubePrimaryStreamVideo({
                    channelId,
                    recentVideos: videos,
                });

                return {
                    channelId,
                    channelUrl: getYoutubeChannelUrl(youtubeUrl, channelId),
                    featuredVideo,
                    videos,
                };
            })(),
        ]);

    return (
        <div className="home-page">
            {/* Hero / Banners */}
            <section className="home-section home-section-surface w-full bg-surface">
                {banners && banners.length > 0 ? (
                    <BannerSlider banners={banners} />
                ) : (
                    <div className="home-section-container mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
                        <div className="home-lift-card flex h-[400px] items-center justify-center rounded-lg border border-border bg-white shadow-sm">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    AD Teotônio Vilela
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    Bem-vindo ao nosso portal.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Últimas Notícias */}
            <section className="home-section home-section-white py-16 bg-white">
                <div className="home-section-container mx-auto max-w-[1200px] px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            Últimas Notícias
                        </h2>
                        <Link
                            href="/noticias"
                            className="text-sm font-medium text-primary hover:text-primary-hover"
                        >
                            Ver todas →
                        </Link>
                    </div>
                    <div className="home-title-accent" />

                    {news.length === 0 ? (
                        <div className="home-lift-card mt-6 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-muted-foreground">Nenhuma notícia publicada ainda.</p>
                        </div>
                    ) : (
                        <div className="stagger-grid mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {news.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/noticias/${item.slug}`}
                                    className="home-lift-card group overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md block h-full flex flex-col"
                                >
                                    <div className="relative aspect-[16/9] bg-surface overflow-hidden">
                                        {item.imagem_capa_url ? (
                                            <Image
                                                src={item.imagem_capa_url}
                                                alt={item.titulo}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-300">
                                                <FileText className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <div className="mb-2">
                                            <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                {item.categorias?.nome || "Geral"}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {item.titulo}
                                        </h3>
                                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                            {item.resumo}
                                        </p>
                                        <div className="mt-auto pt-4 text-xs text-gray-400">
                                            {new Date(item.published_at || item.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Culto Online */}
            <section className="home-section home-section-surface py-16 bg-surface">
                <div className="home-section-container mx-auto max-w-[1200px] px-4 sm:px-6">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Culto Online
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Acompanhe a transmissão ao vivo e veja os vídeos recentes.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
                        <div className="home-lift-card overflow-hidden rounded-lg border border-border bg-white shadow-sm">
                            <div className="aspect-video">
                                <iframe
                                    src={
                                        youtubeData.featuredVideo?.embedUrl ||
                                        getYoutubeLiveEmbedUrl(youtubeData.channelId)
                                    }
                                    title="Transmissão ao vivo AD Teotônio Vilela"
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {youtubeData.videos.length > 0 ? (
                                youtubeData.videos.map((video) => (
                                    <a
                                        key={video.videoId}
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="home-lift-card flex items-center gap-3 rounded-lg border border-border bg-white p-3 transition-shadow hover:shadow-md"
                                    >
                                        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-surface">
                                            <Image
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <p className="line-clamp-2 text-sm font-medium text-foreground">
                                            {video.title}
                                        </p>
                                    </a>
                                ))
                            ) : (
                                <div className="home-lift-card rounded-lg border border-border bg-white p-4 text-sm text-muted-foreground">
                                    Não foi possível carregar os vídeos agora.
                                </div>
                            )}

                            <a
                                href={youtubeData.channelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
                            >
                                <Radio className="h-4 w-4" />
                                Ver canal no YouTube
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Próximos Eventos */}
            <section className="home-section home-section-white py-16 bg-white">
                <div className="home-section-container mx-auto max-w-[1200px] px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            Próximos Eventos
                        </h2>
                        <Link
                            href="/eventos"
                            className="text-sm font-medium text-primary hover:text-primary-hover"
                        >
                            Ver agenda completa →
                        </Link>
                    </div>
                    <div className="home-title-accent" />

                    {events.length === 0 ? (
                        <div className="home-lift-card mt-6 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-muted-foreground">Nenhum evento agendado no momento.</p>
                        </div>
                    ) : (
                        <div className="stagger-grid mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {events.map((event) => {
                                const startDate = new Date(event.data_inicio);
                                const day = startDate.getDate().toString().padStart(2, "0");
                                const month = startDate
                                    .toLocaleDateString("pt-BR", { month: "short" })
                                    .replace(".", "")
                                    .toUpperCase();

                                return (
                                    <div
                                        key={event.id}
                                        className="home-lift-card flex items-start gap-4 rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/5">
                                            <span className="text-xl font-bold text-primary">{day}</span>
                                            <span className="text-[10px] font-semibold uppercase text-primary">{month}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground">{event.titulo}</h3>
                                            {event.descricao && (
                                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                    {event.descricao}
                                                </p>
                                            )}
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {startDate.toLocaleDateString("pt-BR", {
                                                        weekday: "short",
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })}{" "}
                                                    às{" "}
                                                    {startDate.toLocaleTimeString("pt-BR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {event.local && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {event.local}
                                                    </span>
                                                )}
                                                {event.link && (
                                                    <a
                                                        href={event.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:text-primary-hover font-medium"
                                                    >
                                                        Acessar link
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Congregações */}
            <section className="home-section home-section-surface py-16 bg-surface">
                <div className="home-section-container mx-auto max-w-[1200px] px-4 sm:px-6">
                    <div className="home-lift-card home-cta-card rounded-lg border border-border bg-white p-8 text-center sm:p-12 shadow-sm">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            Encontre uma congregação perto de você
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Conheça as congregações da AD em Teotônio Vilela e
                            encontre a mais próxima.
                        </p>
                        <Link
                            href="/congregacoes"
                            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                        >
                            Ver Congregações
                        </Link>
                    </div>
                </div>
            </section>

            {/* Informações do Templo Sede */}
            <section className="home-section home-section-white py-16 bg-white">
                <div className="home-section-container mx-auto max-w-[1200px] px-4 sm:px-6">
                    <div className="rounded-lg border border-border bg-surface p-8 sm:p-10">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                            Informações da Sede
                        </h2>
                        <div className="home-title-accent" />

                        <div className="stagger-grid mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="home-lift-card rounded-md border border-border bg-white p-6">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {homeAddressPage?.titulo || DEFAULT_HOME_ADDRESS_TITLE}
                                </h3>
                                <div
                                    className="prose prose-gray mt-3 max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            homeAddressPage?.conteudo ||
                                            DEFAULT_HOME_ADDRESS_CONTENT.trim(),
                                    }}
                                />
                            </div>

                            <div className="home-lift-card rounded-md border border-border bg-white p-6">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {homeSchedulePage?.titulo || DEFAULT_HOME_SCHEDULE_TITLE}
                                </h3>
                                <div
                                    className="prose prose-gray mt-3 max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            homeSchedulePage?.conteudo ||
                                            DEFAULT_HOME_SCHEDULE_CONTENT.trim(),
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
