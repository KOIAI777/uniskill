import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/layout/page-transition";
import { Analytics } from "@vercel/analytics/next";

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
    default: "UniSkill - 大学生的 AI 学术工具箱",
    template: "%s | UniSkill",
  },
  description:
    "免费下载学校专属 AI Skill，即装即用。作业格式化、引用检查、学术邮件等实用工具，为你的学校定制。",
  keywords: [
    "UniSkill",
    "AI学术工具",
    "Claude Code",
    "SKILL.md",
    "学术格式化",
    "引用检查",
    "大学工具",
    "免费学术工具",
  ],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "UniSkill",
    title: "UniSkill - 大学生的 AI 学术工具箱",
    description:
      "免费下载学校专属 AI Skill，即装即用。作业格式化、引用检查、学术邮件等实用工具。",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniSkill - 大学生的 AI 学术工具箱",
    description:
      "免费下载学校专属 AI Skill，即装即用。作业格式化、引用检查、学术邮件等实用工具。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <Header />
        <main className="flex-grow pt-16">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
