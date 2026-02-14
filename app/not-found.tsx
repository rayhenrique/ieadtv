import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-[70vh] bg-surface">
            <div className="mx-auto flex max-w-[900px] flex-col items-center px-4 py-16 text-center sm:px-6">
                <p className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    Erro 404
                </p>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Página não encontrada
                </h1>

                <p className="mt-4 max-w-[640px] text-sm text-muted-foreground sm:text-base">
                    O endereço acessado não existe ou foi removido. Use os atalhos abaixo para
                    continuar navegando no portal.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                    >
                        Voltar ao início
                    </Link>
                    <Link
                        href="/noticias"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                    >
                        Ver notícias
                    </Link>
                    <Link
                        href="/eventos"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                    >
                        Ver eventos
                    </Link>
                    <Link
                        href="/congregacoes"
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                    >
                        Congregações
                    </Link>
                </div>
            </div>
        </main>
    );
}
