import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/roles";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = await getCurrentUserWithRole();

    if (!auth.user) {
        redirect("/login");
    }

    if (!auth.role) {
        redirect("/login");
    }

    return <AdminShell role={auth.role}>{children}</AdminShell>;
}