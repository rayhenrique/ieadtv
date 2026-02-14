import { redirect } from "next/navigation";
import { getCurrentUserWithRole } from "@/lib/auth/roles";
import { UserProfileForm } from "./components/UserProfileForm";

export default async function AdminProfilePage() {
    const auth = await getCurrentUserWithRole();
    const user = auth.user;

    if (!user || !auth.role) {
        redirect("/login");
    }

    const nome =
        (user.user_metadata?.nome as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        "";

    return (
        <div className="mx-auto max-w-[900px] space-y-6 px-4 py-8 sm:px-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Perfil do Usuário
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Atualize suas informações e senha de acesso.
                </p>
            </div>

            <UserProfileForm email={user.email || ""} initialNome={nome} />
        </div>
    );
}
