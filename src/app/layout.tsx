import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KO-Mart | Professional Retail Tool",
  description: "Fast, offline-resilient product verification and inventory for retail owners.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KO-Mart",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import PWARegister from "@/components/PWARegister";
import InstallPrompt from "@/components/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans select-none overflow-x-hidden">
        <PWARegister />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
