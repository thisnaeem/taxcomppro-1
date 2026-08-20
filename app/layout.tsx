import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import AtlasWidgetLoader from "@/components/AtlasWidgetLoader";
import { ThemeProvider } from "@/components/ThemeProvider";


const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaxCompPro — Professional Tax Community",
  description:
    "Join TaxCompPro — the premier professional community for tax experts, CPAs, and taxpayers. Access the marketplace, Pro Hub communities, training, and expert networking.",
  keywords: "tax professionals, CPA community, tax marketplace, tax training, IRS help",
  icons: {
    icon: [
      { url: "/fevicon.webp", type: "image/webp" },
    ],
    apple: "/fevicon.webp",
    shortcut: "/fevicon.webp",
  },
  openGraph: {
    title: "TaxCompPro — Professional Tax Community",
    description: "The premier platform for tax professionals and taxpayers to connect, learn, and grow.",
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
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

