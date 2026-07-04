import type { Metadata, Viewport } from "next";
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

// 👇 ADDED MANIFEST LINK & PWA TARGETING TO METADATA
export const metadata: Metadata = {
  title: "Biruk.ai - Offline Learning Engine",
  description: "An open-source, fully offline RAG learning system running entirely in your Machine.",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Biruk.ai",
  },
};

// 👇 ADDED MOBILE INTERACTION VIEWPORT RULES
export const viewport: Viewport = {
  themeColor: "#080c14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents mobile browsers from forcefully zooming layout grids on text input focus
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
      suppressHydrationWarning 
    >
      <head>
        {/* Fallback support icon links */}
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body 
        className="min-h-full flex flex-col" 
        suppressHydrationWarning 
      >
        {children}
      </body>
    </html>
  );
}