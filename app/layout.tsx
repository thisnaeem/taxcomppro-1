import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import AtlasWidgetLoader from "@/components/AtlasWidgetLoader";
import GhlChatWidget from "@/components/GhlChatWidget";
import { ThemeProvider } from "@/components/ThemeProvider";
import SitePreferences from "@/components/SitePreferences";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://taxcomppro.com"),
  title: "Tax Compliance Pro | Connect & Grow",
  description:
    "The premier community for tax professionals, CPA, and EA practitioners.",
  icons: {
    icon: "/fevicon.webp",
  },
  openGraph: {
    title: "Tax Compliance Pro | Connect & Grow",
    description:
      "The premier community for tax professionals, CPA, and EA practitioners.",
    images: [{ url: "/fevicon.webp", width: 512, height: 512 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${urbanist.variable} dark:bg-[#0f172a]`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="bg-white dark:bg-[#0f172a] dark:text-slate-100" suppressHydrationWarning>
        <ThemeProvider>
          <ReduxProvider>
            <Suspense>
              {children}
            </Suspense>
            <AtlasWidgetLoader />
            <GhlChatWidget />
            <SitePreferences />
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
