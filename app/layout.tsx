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

export const metadata: Metadata = {
  title: "Biruk.ai - Offline Learning Engine",
  description: "An open-source, fully offline RAG learning system running entirely in your Machine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Fixes extension attributes injected at the html level
    >
      <body 
        className="min-h-full flex flex-col" 
        suppressHydrationWarning // Fixes Grammarly/extension attributes injected at the body level
      >
        {children}
      </body>
    </html>
  );
}