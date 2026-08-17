import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataMenu } from "@/components/data-menu";
import { TodoWidget } from "@/components/todo-widget";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { IOS_SWITCH_ID } from "@/lib/haptics";

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
        {/*
          Hidden iOS haptic source. Safari has no navigator.vibrate, but a
          checkbox with the `switch` attribute buzzes when its label is
          activated, so lib/haptics.ts clicks this one. Inert to users and AT.
        */}
        <input
          type="checkbox"
          id={IOS_SWITCH_ID}
          {...({ switch: "" } as Record<string, string>)}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none fixed size-px opacity-0"
        />
        <label htmlFor={IOS_SWITCH_ID} aria-hidden="true" className="pointer-events-none fixed size-px opacity-0" />
        <AuthProvider>
          <AuthGate>
            <StoreProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                  {/* Mobile: the existing top nav. Desktop: the sidebar plus this thin bar. */}
                  <SiteHeader />
                  <div className="bg-background/85 sticky top-0 z-30 hidden h-12 items-center gap-2 border-b px-4 backdrop-blur-md md:flex">
                    <SidebarTrigger />
                    <div className="flex-1" />
                    <DataMenu />
                  </div>
                  <main className="flex-1">{children}</main>
                  <TodoWidget />
                </SidebarInset>
              </SidebarProvider>
            </StoreProvider>
          </AuthGate>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
