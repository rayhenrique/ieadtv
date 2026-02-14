import { getCampanhasAdmin } from "@/lib/actions/campanhas";
import { CampaignManager } from "./components/CampaignManager";

export const dynamic = "force-dynamic";

export default async function AdminCampanhasPage() {
    const { campanhas, error } = await getCampanhasAdmin();

    return (
        <CampaignManager
            initialCampanhas={campanhas}
            initialError={error}
        />
    );
}
