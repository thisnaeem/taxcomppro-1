import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Talks | Live & Upcoming Stages · Tax Compliance Pro",
  description:
    "Real-time audio & video stages with tax masters, EAs, CPAs, and industry leaders. Join live discussions, ask questions, or host your own stage.",
  openGraph: {
    title: "Pro Talks | Live & Upcoming Stages · Tax Compliance Pro",
    description:
      "Real-time audio & video stages with tax masters, EAs, CPAs, and industry leaders. Join live discussions, ask questions, or host your own stage.",
    url: "https://taxcomppro.com/pro-talks",
    siteName: "Tax Compliance Pro",
    images: [
      {
        url: "/protalk.png",
        width: 1200,
        height: 800,
        alt: "Tax Compliance Pro Talks",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Talks | Live & Upcoming Stages · Tax Compliance Pro",
    description:
      "Real-time audio & video stages with tax masters, EAs, CPAs, and industry leaders. Join live discussions, ask questions, or host your own stage.",
    images: ["/protalk.png"],
  },
};

export default function ProTalksRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
