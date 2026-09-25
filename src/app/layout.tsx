import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { NetlifyBadgeRemover } from "@/components/tropa/NetlifyBadgeRemover";

export const metadata: Metadata = {
  title: "TROPA DA SORTE - Ações e Sorteios Oficiais 🍀",
  description: "Plataforma oficial da Tropa da Sorte. Participe das melhores ações numeradas com total transparência e apuração pela Loteria Federal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NetlifyBadgeRemover />
        {children}
      </body>
    </html>
  );
}
