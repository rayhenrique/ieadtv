export default function AdminDashboardPage() {
    return (
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Visão geral do portal.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["Notícias", "Eventos", "Congregações", "Banners"].map(
                    (item) => (
                        <div
                            key={item}
                            className="rounded-lg border border-border bg-white p-6"
                        >
                            <p className="text-sm text-muted-foreground">
                                Total de {item}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-foreground">
                                0
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
