import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createPublicClient } from "@/lib/supabase/public";

type SiteSetting = {
    key: string;
    value: string | null;
};

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createPublicClient();

    // Fetch site settings
    const { data } = await supabase
        .from("site_settings")
        .select("key, value");
    const settings = (data ?? []) as SiteSetting[];

    // helper to get value
    const getValue = (key: string) =>
        settings.find((setting) => setting.key === key)?.value || "#";

    const socialLinks = {
        facebook: getValue("social_facebook"),
        instagram: getValue("social_instagram"),
        youtube: getValue("social_youtube"),
        whatsapp: getValue("social_whatsapp"),
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Header socialLinks={socialLinks} />
            <main className="flex-1">{children}</main>
            <Footer socialLinks={socialLinks} />
        </div>
    );
}
