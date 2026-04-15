import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { localeCookieName, localeToHtmlLang, normalizeLocale } from "@/i18n/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://uniskill.online"),
  title: {
    default: "UniSkill",
    template: "%s | UniSkill",
  },
  description:
    "Bilingual AI skill marketplace for university students.",
  keywords: [
    "UniSkill",
    "AI academic tools",
    "Claude Code",
    "SKILL.md",
    "student skills",
    "bilingual skills",
  ],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "UniSkill",
    title: "UniSkill",
    description:
      "Bilingual AI skill marketplace for university students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniSkill",
    description:
      "Bilingual AI skill marketplace for university students.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(localeCookieName)?.value);

  return (
    <html
      lang={localeToHtmlLang(locale)}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5351543782524348"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <Header />
        <main className="flex-grow pt-16">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
