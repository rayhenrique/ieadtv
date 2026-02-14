"use client";

import { useRef, useState, useTransition } from "react";
import {
    Bold,
    FileText,
    Heading2,
    Heading3,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Loader2,
    Save,
    Underline,
    Upload,
} from "lucide-react";
import {
    getAdminStaticPages,
    saveStaticPage,
    uploadStaticPageImage,
    type PaginaEstatica,
} from "@/lib/actions/paginas";

interface UploadResult {
    url?: string;
    error?: string;
}

const HOME_ADDRESS_SLUG = "home-templo-endereco";
const HOME_SCHEDULE_SLUG = "home-templo-horarios";
const LEGACY_HOME_INFO_SLUG = "home-templo-sede";

const DEFAULT_HOME_ADDRESS_CONTENT = `
<p><strong>Igreja Evangélica Assembleia de Deus - Templo Sede</strong></p>
<p>Av. Moreira e Silva, nº 406, Farol</p>
`;

const DEFAULT_HOME_SCHEDULE_CONTENT = `
<ul>
  <li>Aos Domingos 09:00h - Escola Dominical</li>
  <li>Aos Domingos 18:30h - Culto Evangelístico</li>
  <li>As Terças-feiras 18:30h - Culto de Doutrina</li>
  <li>As Quarta-feiras 10:00h às 17:00h - Círculo de Oração</li>
  <li>As Sextas-feiras 18:30h - Culto de Oração</li>
</ul>
`;

const REQUIRED_PAGES: Array<Pick<PaginaEstatica, "slug" | "titulo" | "conteudo">> = [
    {
        slug: HOME_ADDRESS_SLUG,
        titulo: "Home - Templo Sede (Endereço)",
        conteudo: DEFAULT_HOME_ADDRESS_CONTENT.trim(),
    },
    {
        slug: HOME_SCHEDULE_SLUG,
        titulo: "Home - Horários de Cultos",
        conteudo: DEFAULT_HOME_SCHEDULE_CONTENT.trim(),
    },
];

function ToolbarButton({
    onClick,
    title,
    children,
}: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
            {children}
        </button>
    );
}

function RichTextEditor({
    value,
    onChange,
    onUploadImage,
}: {
    value: string;
    onChange: (nextValue: string) => void;
    onUploadImage: (file: File) => Promise<UploadResult>;
}) {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const runCommand = (command: string, commandValue?: string) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, commandValue);
        onChange(editorRef.current.innerHTML);
    };

    const insertLink = () => {
        const url = prompt("Digite a URL do link:");
        if (!url) return;
        runCommand("createLink", url);
    };

    const insertImageByUrl = () => {
        const url = prompt("Digite a URL da imagem:");
        if (!url) return;
        runCommand("insertImage", url);
    };

    const insertImageByUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const result = await onUploadImage(file);
        setUploadingImage(false);

        if (result.error || !result.url) {
            alert(result.error || "Erro ao fazer upload da imagem.");
            event.target.value = "";
            return;
        }

        runCommand("insertImage", result.url);
        event.target.value = "";
    };

    return (
        <div className="rounded-md border border-border bg-white">
            <div className="flex flex-wrap gap-2 border-b border-border p-3">
                <ToolbarButton title="Negrito" onClick={() => runCommand("bold")}>
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton title="Itálico" onClick={() => runCommand("italic")}>
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Sublinhado"
                    onClick={() => runCommand("underline")}
                >
                    <Underline className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Título H2"
                    onClick={() => runCommand("formatBlock", "<h2>")}
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Título H3"
                    onClick={() => runCommand("formatBlock", "<h3>")}
                >
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Lista"
                    onClick={() => runCommand("insertUnorderedList")}
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Lista ordenada"
                    onClick={() => runCommand("insertOrderedList")}
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton title="Inserir link" onClick={insertLink}>
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton title="Imagem por URL" onClick={insertImageByUrl}>
                    <ImageIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    title="Upload de imagem"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                </ToolbarButton>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={insertImageByUpload}
                />
            </div>

            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[380px] w-full p-4 text-sm text-foreground focus:outline-none"
                onInput={(event) =>
                    onChange((event.target as HTMLDivElement).innerHTML)
                }
                onBlur={(event) =>
                    onChange((event.target as HTMLDivElement).innerHTML)
                }
                dangerouslySetInnerHTML={{ __html: value || "" }}
            />
        </div>
    );
}

function mergeRequiredPages(dbPages: PaginaEstatica[]) {
    const merged = dbPages.filter((page) => page.slug !== LEGACY_HOME_INFO_SLUG);
    for (const requiredPage of REQUIRED_PAGES) {
        const exists = merged.some((page) => page.slug === requiredPage.slug);
        if (!exists) {
            merged.push({
                id: requiredPage.slug,
                slug: requiredPage.slug,
                titulo: requiredPage.titulo,
                conteudo: requiredPage.conteudo,
                updated_at: null,
            });
        }
    }
    return merged.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function StaticPagesManager({
    initialPages,
    initialError,
}: {
    initialPages: PaginaEstatica[];
    initialError?: string;
}) {
    const mergedInitialPages = mergeRequiredPages(initialPages);
    const initialSlug =
        mergedInitialPages.find((page) => page.slug === "institucional")?.slug ||
        mergedInitialPages[0]?.slug ||
        "institucional";

    const initialPage =
        mergedInitialPages.find((page) => page.slug === initialSlug) ||
        mergedInitialPages[0] ||
        null;

    const [paginas, setPaginas] = useState<PaginaEstatica[]>(mergedInitialPages);
    const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
    const [titulo, setTitulo] = useState(initialPage?.titulo || "");
    const [conteudo, setConteudo] = useState(initialPage?.conteudo || "");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(initialError ? { type: "error", text: initialError } : null);
    const [isPending, startTransition] = useTransition();

    const reloadPaginas = async () => {
        setLoading(true);
        const result = await getAdminStaticPages();
        if (result.error) {
            setMessage({ type: "error", text: result.error });
            setLoading(false);
            return;
        }

        const merged = mergeRequiredPages(result.pages);
        setPaginas(merged);

        const current = merged.find((p) => p.slug === selectedSlug) || merged[0];
        if (current) {
            setTitulo(current.titulo);
            setConteudo(current.conteudo || "");
            setSelectedSlug(current.slug);
        }
        setLoading(false);
    };

    const selectPagina = (slug: string) => {
        const pagina = paginas.find((p) => p.slug === slug);
        if (!pagina) return;

        setSelectedSlug(pagina.slug);
        setTitulo(pagina.titulo);
        setConteudo(pagina.conteudo || "");
        setMessage(null);
    };

    const handleSave = () => {
        setSaving(true);
        setMessage(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.set("slug", selectedSlug);
            formData.set("titulo", titulo);
            formData.set("conteudo", conteudo);

            const result = await saveStaticPage(formData);

            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else {
                setMessage({ type: "success", text: "Página salva com sucesso!" });
                await reloadPaginas();
            }

            setSaving(false);
        });
    };

    const handleUploadImage = async (file: File): Promise<UploadResult> => {
        const formData = new FormData();
        formData.set("file", file);
        return await uploadStaticPageImage(formData);
    };

    const selectedPagina = paginas.find((p) => p.slug === selectedSlug);
    const ultimaAtualizacao = selectedPagina?.updated_at
        ? new Date(selectedPagina.updated_at).toLocaleString("pt-BR")
        : "—";

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Páginas Estáticas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Edite o conteúdo das páginas institucionais e das seções da Home.
            </p>

            <div className="mt-6 flex gap-2 border-b border-border">
                {paginas.map((pagina) => (
                    <button
                        key={pagina.slug}
                        onClick={() => selectPagina(pagina.slug)}
                        className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                            selectedSlug === pagina.slug
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <FileText className="h-4 w-4" />
                        {pagina.titulo}
                    </button>
                ))}
            </div>

            <div className="mt-6 space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Título da página
                    </label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Conteúdo
                    </label>
                    <RichTextEditor
                        value={conteudo}
                        onChange={setConteudo}
                        onUploadImage={handleUploadImage}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                        O conteúdo é salvo em HTML automaticamente com as formatações aplicadas.
                    </p>
                </div>

                {message && (
                    <div
                        className={`rounded-md px-4 py-3 text-sm ${
                            message.type === "success"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Última atualização: {ultimaAtualizacao}
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving || isPending}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                    >
                        {saving || isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}