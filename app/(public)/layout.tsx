import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient(); // Use new auth strategy awaiting client

    // Fetch site settings
    const { data: settings } = await supabase
        .from("site_settings")
        .select("key, value");

    // helper to get value
    const getValue = (key: string) =>
        settings?.find((s) => s.key === key)?.value || "#";

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
