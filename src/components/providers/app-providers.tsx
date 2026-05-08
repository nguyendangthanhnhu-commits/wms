"use client";

import { SWRConfig } from "swr";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { fetcher, swrConfig } from "@/lib/swr-config";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig value={{ ...swrConfig, fetcher }}>
        {children}
        <Toaster richColors closeButton />
      </SWRConfig>
    </ThemeProvider>
  );
}
