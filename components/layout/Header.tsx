"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
    Search,
    Facebook,
    Youtube,
    Instagram,
    MessageCircle,
    House,
    Building2,
    Newspaper,
    Church,
    HandHelping,
    CalendarDays,
    PlaySquare,
    ShieldCheck,
    HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/", label: "INÍCIO", icon: House },
    { href: "/institucional", label: "INSTITUCIONAL", icon: Building2 },
    { href: "/noticias", label: "NOTÍCIAS", icon: Newspaper },
    { href: "/congregacoes", label: "CONGREGAÇÕES", icon: Church },
    { href: "/missoes", label: "MISSÕES", icon: HandHelping },
    { href: "/eventos", label: "EVENTOS", icon: CalendarDays },
    { href: "/videos", label: "VÍDEOS", icon: PlaySquare },
    { href: "/lgpd", label: "LGPD", icon: ShieldCheck },
    { href: "/campanhas", label: "CAMPANHAS", icon: HeartHandshake },
];

interface HeaderProps {
    socialLinks?: {
        facebook: string;
        instagram: string;
        youtube: string;
        whatsapp: string;
    };
}

export function Header({ socialLinks }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const links = socialLinks || {
        facebook: "#",
        instagram: "#",
        youtube: "#",
        whatsapp: "#",
    };

    return (
        <header className="flex w-full flex-col shadow-lg">
            {/* Top Bar - Area Azul */}
            <div className="relative w-full bg-gradient-to-r from-[#004080] to-[#007bff]">
                {/* Removed background image as requested */}

                <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6">

                    {/* Esquerda: Logo + Texto */}
                    <Link href="/" className="z-10 flex shrink-0 items-center justify-start gap-3 transition-opacity hover:opacity-90">
                        <div className="relative h-12 w-10 md:h-24 md:w-20">
                            <Image
                                src="/images/logo.png"
                                alt="Logo ADTV"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            {/* Mobile: IEADTV */}
                            <span className="block text-2xl font-bold text-white md:hidden">IEADTV</span>

                            {/* Desktop: Full Text */}
                            <div className="hidden flex-col items-start md:flex">
                                <span className="text-[10px] uppercase tracking-wider text-white shadow-black drop-shadow-md">Igreja Evangélica</span>
                                <span className="font-serif text-3xl font-bold uppercase leading-none tracking-wide text-white shadow-black drop-shadow-md">Assembleia de Deus</span>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-white/90 shadow-black drop-shadow-md">Em Teotônio Vilela</span>
                            </div>
                        </div>
                    </Link>

                    {/* Direita: Busca + Redes Sociais */}
                    <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-6">
                        {/* Busca */}
                        <div className="w-[200px] md:w-full md:max-w-sm lg:max-w-md">
                            <form
                                action="/busca"
                                method="get"
                                className="flex w-full overflow-hidden rounded-md shadow-xl"
                                role="search"
                                aria-label="Buscar no site"
                            >
                                <input
                                    name="q"
                                    type="text"
                                    placeholder="Buscar notícias, eventos, congregações..."
                                    className="h-8 w-full bg-white px-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:bg-gray-50 md:h-10 md:px-4 md:text-sm"
                                />
                                <button
                                    type="submit"
                                    className="flex h-8 w-8 items-center justify-center bg-[#003366] text-white transition-colors hover:bg-[#002244] md:h-10 md:w-12"
                                    aria-label="Executar busca"
                                >
                                    <Search className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                            </form>
                        </div>

                        {/* Redes Sociais */}
                        <div className="flex items-center gap-2">
                            <span className="hidden text-[10px] font-light uppercase tracking-wide text-white shadow-black drop-shadow-sm md:block">Siga-nos:</span>
                            <div className="flex gap-2">
                                {/* Youtube */}
                                <a href={links.youtube} target="_blank" rel="noopener noreferrer" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#FF0000] shadow-lg transition-transform hover:scale-110 hover:bg-gray-100 md:h-8 md:w-8">
                                    <Youtube className="h-3 w-3 md:h-4 md:w-4" />
                                </a>
                                {/* Instagram */}
                                <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#E1306C] shadow-lg transition-transform hover:scale-110 hover:bg-gray-100 md:h-8 md:w-8">
                                    <Instagram className="h-3 w-3 md:h-4 md:w-4" />
                                </a>
                                {/* Facebook */}
                                <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-lg transition-transform hover:scale-110 hover:bg-gray-100 md:h-8 md:w-8">
                                    <Facebook className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                                </a>
                                {/* Whatsapp */}
                                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#25D366] shadow-lg transition-transform hover:scale-110 hover:bg-gray-100 md:h-8 md:w-8">
                                    <MessageCircle className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navbar - Area Cinza */}
            <div className="sticky top-0 z-50 w-full border-b border-gray-300 bg-[#e0e0e0] shadow-md">
                <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-center px-4 sm:px-6">

                    {/* Mobile Menu Button - Visible only on mobile */}
                    <div className="flex w-full items-center justify-between lg:hidden">
                        <span className="text-sm font-bold text-[#0f2a4a] uppercase tracking-wide">Menu Principal</span>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-2 text-[#0f2a4a] transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-[#003366]"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden h-full w-full justify-between items-center lg:flex">
                        {navLinks.map((link) => {
                            const isActive =
                                link.href === "/"
                                    ? pathname === "/"
                                    : pathname.startsWith(link.href);
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "flex h-full flex-1 items-center justify-center border-r border-[#cfcfcf] px-2 text-[13px] font-bold uppercase tracking-wide transition-colors last:border-r-0",
                                        isActive
                                            ? "bg-white text-[#003366] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
                                            : "text-[#0f2a4a] hover:bg-gray-300 hover:text-black"
                                    )}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <Icon className="h-3.5 w-3.5" />
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    {/* Backdrop to close */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className="relative mt-44 border-t border-gray-300 bg-[#e0e0e0] shadow-2xl animate-in slide-in-from-top-4">
                        <nav className="mx-auto flex max-w-[1200px] flex-col divide-y divide-gray-300">
                            {navLinks.map((link) => {
                                const isActive =
                                    link.href === "/"
                                        ? pathname === "/"
                                        : pathname.startsWith(link.href);
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "block px-6 py-4 text-sm font-bold uppercase text-[#0f2a4a] transition-colors hover:bg-white active:bg-gray-50",
                                            isActive && "bg-white text-[#003366] border-l-4 border-[#003366]"
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            {link.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
}
