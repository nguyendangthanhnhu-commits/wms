import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WMS — Pin NLMT",
  description: "Warehouse Management System — Nhà máy Pin NLMT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader
          color="#0ea5e9"
          height={2}
          shadow="0 0 6px #0ea5e9, 0 0 4px #0ea5e9"
          showSpinner={false}
          crawl
          easing="ease"
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
