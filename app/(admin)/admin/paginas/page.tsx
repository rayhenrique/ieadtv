import { getAdminStaticPages } from "@/lib/actions/paginas";
import { StaticPagesManager } from "./components/StaticPagesManager";

export const dynamic = "force-dynamic";

export default async function AdminPaginasPage() {
    const { pages, error } = await getAdminStaticPages();

    return <StaticPagesManager initialPages={pages} initialError={error} />;
}
