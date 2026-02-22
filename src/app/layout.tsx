import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { RightSidebar } from "@/components/layout/right-sidebar"
import { RightSidebarSkeleton } from "@/components/layout/right-sidebar-skeleton"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { BottomNav } from "@/components/layout/bottom-nav"
import { FeedbackFab } from "@/components/feedback/feedback-fab"
import { Toaster } from "sonner"
import "./globals.css"

function HeaderFallback() {
  return <header className="bg-card border-border fixed inset-x-0 top-0 z-50 h-[var(--header-height)] border-b" />
}

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Materials Science + AI Community`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} — Materials Science + AI Community`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Materials Science + AI Community`,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <div className="pt-[var(--header-height)]">
            <ThreeColumnLayout
              leftSidebar={
                <Suspense>
                  <LeftSidebar />
                </Suspense>
              }
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
          <FeedbackFab />
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  )
}
