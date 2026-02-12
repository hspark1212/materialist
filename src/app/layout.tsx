import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { RightSidebarSkeleton } from "@/components/layout/right-sidebar-skeleton"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Toaster } from "sonner"
import "./globals.css";

function HeaderFallback() {
  return (
    <header className="bg-card fixed inset-x-0 top-0 z-50 h-[var(--header-height)] border-b border-border" />
  )
}

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export const metadata: Metadata = {
  title: "Materialist — Materials Science + AI Community",
  description:
    "A community platform for materials science and AI researchers. Discuss papers, share tools, and connect with fellow researchers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <div className="pt-[var(--header-height)]">
            <ThreeColumnLayout
              leftSidebar={<Suspense><LeftSidebar /></Suspense>}
              rightSidebar={
                <Suspense fallback={<RightSidebarSkeleton />}>
                  <RightSidebar hideOnMobile />
                </Suspense>
              }
            >
              {children}
            </ThreeColumnLayout>
          </div>
          <BottomNav />
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
