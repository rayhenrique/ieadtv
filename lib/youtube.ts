const DEFAULT_YOUTUBE_CHANNEL_ID = "UCVwhunwquttIw4aGpTvdsrQ";
const DEFAULT_YOUTUBE_HANDLE = "@ADTeot%C3%B4nioVilelaIEADTV";

const YOUTUBE_PAGE_REVALIDATE_SECONDS = 300;

const YOUTUBE_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
};

export interface YoutubeVideo {
    videoId: string;
    title: string;
    description: string;
    publishedAt: string | null;
    url: string;
    embedUrl: string;
    thumbnailUrl: string;
}

function decodeXml(value: string) {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
}

function ensureHandlePrefix(handle: string) {
    const trimmed = handle.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function extractChannelIdFromUrl(value: string | null | undefined) {
    if (!value) return null;
    const match = value.match(/\/channel\/(UC[\w-]{22})/i);
    return match?.[1] ?? null;
}

function isChannelUrl(value: string) {
    return /youtube\.com\/(@|channel\/|c\/|user\/)/i.test(value);
}

function extractHandle(value: string | null | undefined) {
    if (!value) return null;
    const match = value.match(/@([A-Za-z0-9._-]+)/);
    if (!match?.[1]) return null;
    return ensureHandlePrefix(match[1]);
}

function extractChannelIdFromHtml(html: string) {
    const browseMatch = html.match(/"browseId":"(UC[\w-]{22})"/);
    if (browseMatch?.[1]) return browseMatch[1];

    const channelMatch = html.match(/\/channel\/(UC[\w-]{22})/);
    return channelMatch?.[1] ?? null;
}

async function fetchYoutubeText(url: string) {
    const response = await fetch(url, {
        headers: YOUTUBE_HEADERS,
        next: { revalidate: YOUTUBE_PAGE_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
        throw new Error(`YouTube request failed: ${response.status}`);
    }

    return response.text();
}

function parseFeed(xml: string): YoutubeVideo[] {
    const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g));
    const videos: YoutubeVideo[] = [];

    for (const entry of entries) {
        const block = entry[1];

        const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
        if (!videoId) continue;

        const title = decodeXml(
            block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "Sem título"
        );
        const description = decodeXml(
            block.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.trim() || ""
        );
        const publishedAt = block.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;

        videos.push({
            videoId,
            title,
            description,
            publishedAt,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });
    }

    return videos;
}

function extractVideoIdsFromHtml(html: string) {
    const matches = Array.from(html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g));
    const uniqueIds: string[] = [];

    for (const match of matches) {
        const videoId = match[1];
        if (!videoId) continue;
        if (uniqueIds.includes(videoId)) continue;
        uniqueIds.push(videoId);
    }

    return uniqueIds;
}

export async function resolveYoutubeChannelId(youtubeUrl?: string | null) {
    const envChannelId = process.env.YOUTUBE_CHANNEL_ID?.trim();
    if (envChannelId) return envChannelId;

    const fromUrl = extractChannelIdFromUrl(youtubeUrl);
    if (fromUrl) return fromUrl;

    const envHandle = process.env.YOUTUBE_HANDLE?.trim();
    const handleFromUrl = extractHandle(youtubeUrl);
    const handle = ensureHandlePrefix(handleFromUrl || envHandle || DEFAULT_YOUTUBE_HANDLE);

    if (handle) {
        try {
            const html = await fetchYoutubeText(`https://www.youtube.com/${handle}`);
            const channelId = extractChannelIdFromHtml(html);
            if (channelId) return channelId;
        } catch (error) {
            console.error("Failed to resolve YouTube channel id from handle:", error);
        }
    }

    return DEFAULT_YOUTUBE_CHANNEL_ID;
}

export function getYoutubeChannelUrl(youtubeUrl: string | null | undefined, channelId: string) {
    const normalized = youtubeUrl?.trim();
    if (normalized && /^https?:\/\//i.test(normalized) && isChannelUrl(normalized)) {
        return normalized;
    }
    return `https://www.youtube.com/channel/${channelId}`;
}

export function getYoutubeLiveEmbedUrl(channelId: string) {
    return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=0&mute=0`;
}

export async function getYoutubePrimaryStreamVideo(params: {
    channelId: string;
    recentVideos?: YoutubeVideo[];
}) {
    const { channelId, recentVideos = [] } = params;
    if (!channelId) return recentVideos[0] ?? null;

    try {
        const html = await fetchYoutubeText(`https://www.youtube.com/channel/${channelId}/live`);
        const videoIds = extractVideoIdsFromHtml(html);
        const primaryVideoId = videoIds[0];

        if (!primaryVideoId) return recentVideos[0] ?? null;

        const fromRecent = recentVideos.find((video) => video.videoId === primaryVideoId);
        if (fromRecent) return fromRecent;

        return {
            videoId: primaryVideoId,
            title: "Última transmissão",
            description: "",
            publishedAt: null,
            url: `https://www.youtube.com/watch?v=${primaryVideoId}`,
            embedUrl: `https://www.youtube.com/embed/${primaryVideoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${primaryVideoId}/hqdefault.jpg`,
        } satisfies YoutubeVideo;
    } catch (error) {
        console.error("Failed to fetch YouTube live page:", error);
        return recentVideos[0] ?? null;
    }
}

export async function getYoutubeRecentVideos(params: {
    channelId: string;
    maxResults?: number;
}) {
    const { channelId, maxResults = 12 } = params;

    if (!channelId) return [];

    try {
        const xml = await fetchYoutubeText(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
        );
        return parseFeed(xml).slice(0, maxResults);
    } catch (error) {
        console.error("Failed to fetch YouTube feed:", error);
        return [];
    }
}
