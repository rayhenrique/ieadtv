import { createClient } from "@/lib/supabase/server";

export default async function LgpdPage() {
    const supabase = await createClient();
    const { data: pagina } = await supabase
        .from("paginas_estaticas")
        .select("*")
        .eq("slug", "lgpd")
        .single();

    return (
        <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {pagina?.titulo || "Política de Privacidade (LGPD)"}
            </h1>
            <div className="mt-6 border-t border-border pt-6">
                {pagina?.conteudo ? (
                    <div
                        className="prose prose-gray max-w-none text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: pagina.conteudo }}
                    />
                ) : (
                    <p className="text-muted-foreground">
                        Política de privacidade em breve.
                    </p>
                )}
            </div>
        </div>
    );
}
