import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ad Funnel Tracker",
  description: "Paid ad campaigns by cloud, product, and platform",
  applicationName: "Ads",
  // iOS reads these for Add to Home Screen; it ignores the web manifest there.
  appleWebApp: {
    capable: true,
    title: "Ads",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <AuthProvider>
          <AuthGate>
            <StoreProvider>
              <SiteHeader />
              <main className="flex-1">{children}</main>
            </StoreProvider>
          </AuthGate>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
