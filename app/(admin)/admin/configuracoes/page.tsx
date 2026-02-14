import { getSiteSettings } from "@/lib/actions/configuracoes";
import { SettingsManager } from "./components/SettingsManager";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
    const { settings, error } = await getSiteSettings();

    return <SettingsManager initialSettings={settings} initialError={error} />;
}
