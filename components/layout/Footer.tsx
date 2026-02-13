import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, MapPin, MessageCircle } from "lucide-react";

const quickLinks = [
    { href: "/", label: "Início" },
    { href: "/institucional", label: "Institucional" },
    { href: "/noticias", label: "Notícias" },
    { href: "/congregacoes", label: "Congregações" },
    { href: "/eventos", label: "Eventos" },
    { href: "/campanhas", label: "Campanhas" },
    { href: "/lgpd", label: "LGPD" },
];

interface FooterProps {
    socialLinks?: {
        facebook: string;
        instagram: string;
        youtube: string;
        whatsapp: string;
    };
}

export function Footer({ socialLinks }: FooterProps) {
    const currentYear = new Date().getFullYear();

    const links = socialLinks || {
        facebook: "#",
        instagram: "#",
        youtube: "#",
        whatsapp: "#",
    };

    const socialItems = [
        {
            href: links.facebook,
            label: "Facebook",
            icon: Facebook,
        },
        {
            href: links.instagram,
            label: "Instagram",
            icon: Instagram,
        },
        {
            href: links.youtube,
            label: "YouTube",
            icon: Youtube,
        },
        {
            href: links.whatsapp,
            label: "WhatsApp",
            icon: MessageCircle,
        },
    ];

    return (
        <footer className="border-t border-border bg-foreground text-gray-300">
            <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Logo & About */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="relative h-12 w-10 shrink-0">
                                <Image
                                    src="/images/logo.png"
                                    alt="Logo ADTV"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold leading-tight text-white">
                                    AD Teotônio Vilela
                                </span>
                                <span className="text-[11px] leading-tight text-gray-400">
                                    Assembleia de Deus
                                </span>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-400">
                            Portal oficial da Assembleia de Deus em Teotônio
                            Vilela. Notícias, eventos, cultos e informações das
                            congregações.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-white">
                            Links Rápidos
                        </h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-white">
                            Redes Sociais
                        </h3>
                        <div className="flex gap-3">
                            {socialItems.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-white">
                            Sede
                        </h3>
                        <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <p className="text-sm leading-relaxed text-gray-400">
                                Teotônio Vilela - AL
                                <br />
                                Assembleia de Deus
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="text-center text-xs text-gray-500">
                        © {currentYear} Assembleia de Deus — Teotônio Vilela/AL.
                        Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
