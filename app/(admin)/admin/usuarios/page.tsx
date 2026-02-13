import { getAdminUsers } from "@/lib/actions/usuarios";
import { UserCreateForm } from "./components/UserCreateForm";

function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default async function AdminUsersPage() {
    const { users, error } = await getAdminUsers();

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Usuários
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Gerencie os usuários com acesso ao painel administrativo.
                </p>
            </div>

            <UserCreateForm />

            <div className="rounded-lg border border-border bg-white">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Usuários Cadastrados</h2>
                </div>

                {error ? (
                    <div className="px-6 py-8 text-sm text-red-600">{error}</div>
                ) : users.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-muted-foreground">
                        Nenhum usuário encontrado.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-surface">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Nome</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">E-mail</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Criado Em</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Último Acesso</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-t border-border">
                                        <td className="px-6 py-3 text-foreground">
                                            {user.nome || "—"}
                                        </td>
                                        <td className="px-6 py-3 text-foreground">{user.email}</td>
                                        <td className="px-6 py-3 text-muted-foreground">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-3 text-muted-foreground">
                                            {formatDate(user.last_sign_in_at)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    user.email_confirmed_at
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {user.email_confirmed_at ? "Ativo" : "Pendente"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
