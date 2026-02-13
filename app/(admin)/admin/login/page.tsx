export default function AdminLoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-white p-8">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                        <span className="text-lg font-bold text-white">AD</span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Painel Administrativo
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Faça login para gerenciar o portal
                    </p>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    Formulário de login será implementado aqui.
                </p>
            </div>
        </div>
    );
}
