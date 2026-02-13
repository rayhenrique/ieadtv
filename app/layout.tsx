import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ieadtv.kltecnologia.com";
const SHARE_IMAGE = "/images/share-cover.png";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AD Teotônio Vilela",
    template: "%s | AD Teotônio Vilela",
  },
  description:
    "Portal oficial da Igreja Assembleia de Deus em Teotônio Vilela. Confira notícias, agenda de cultos, congregações e transmissões online.",
  applicationName: "IEADTV",
  keywords: [
    "Assembleia de Deus",
    "AD Teotônio Vilela",
    "Igreja Evangélica",
    "Notícias Evangélicas",
    "Culto Online",
    "Agenda de Cultos",
    "Congregações",
  ],
  authors: [{ name: "Igreja Assembleia de Deus - Teotônio Vilela" }],
  creator: "IEADTV",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "AD Teotônio Vilela",
    title: "AD Teotônio Vilela | Notícias, Cultos e Agenda",
    description:
      "Acompanhe notícias, programação de cultos, eventos e transmissões da Assembleia de Deus em Teotônio Vilela.",
    images: [
      {
        url: SHARE_IMAGE,
        width: 1200,
        height: 630,
        alt: "AD Teotônio Vilela - Portal Oficial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AD Teotônio Vilela | Portal Oficial",
    description:
      "Notícias, agenda de cultos, eventos e transmissões da Assembleia de Deus em Teotônio Vilela.",
    images: [SHARE_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Igreja Assembleia de Deus - Teotônio Vilela",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
  };

  return (
    <html lang="pt-BR" className="light">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {children}
      </body>
    </html>
  );
}
