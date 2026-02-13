"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Newspaper,
    CalendarDays,
    Church,
    Image,
    Tag,
    FileText,
    Heart,
    House,
    LogOut,
    Menu,
    UserCircle2,
    Users,
    X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const sidebarLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/banners", label: "Banners", icon: Image },
    { href: "/admin/categorias", label: "Categorias", icon: Tag },
    { href: "/admin/noticias", label: "Notícias", icon: Newspaper },
    { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
    { href: "/admin/congregacoes", label: "Congregações", icon: Church },
    { href: "/admin/campanhas", label: "Campanhas", icon: Heart },
    { href: "/admin/paginas", label: "Páginas", icon: FileText },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/perfil", label: "Perfil", icon: UserCircle2 },
    { href: "/admin/configuracoes", label: "Configurações", icon: Menu },
];

function AdminSidebar({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const [isSigningOut, startSignOutTransition] = useTransition();

    const handleSignOut = () => {
        startSignOutTransition(async () => {
            try {
                const supabase = createClient();
                await supabase.auth.signOut();
            } catch (error) {
                console.error("Sign out error:", error);
            } finally {
                window.location.href = "/login";
            }
        });
    };

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-border bg-white transition-transform lg:static lg:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <span className="text-xs font-bold text-white">
                                AD
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                            Admin
                        </span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {sidebarLinks.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/5 text-primary"
                                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="space-y-2 border-t border-border p-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                    >
                        <House className="h-4 w-4" />
                        Voltar ao site
                    </Link>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogOut className="h-4 w-4" />
                        {isSigningOut ? "Saindo..." : "Sair"}
                    </button>
                </div>
            </aside>
        </>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-surface">
            <AdminSidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex flex-1 flex-col">
                {/* Top bar (mobile) */}
                <div className="flex h-16 items-center border-b border-border bg-white px-4 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded p-2 text-muted-foreground hover:text-foreground"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="ml-3 text-sm font-semibold text-foreground">
                        AD Admin
                    </span>
                </div>

                {/* Main content */}
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
