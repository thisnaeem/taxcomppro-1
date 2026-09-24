import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Networks | Tax Compliance Pro",
  description:
    "Join private professional networks, connect with leading tax professionals, and access exclusive live training, resources, and masterminds.",
  openGraph: {
    title: "Pro Networks | Tax Compliance Pro",
    description:
      "Join private professional networks, connect with leading tax professionals, and access exclusive live training, resources, and masterminds.",
    url: "https://taxcomppro.com/pro-networks",
    siteName: "Tax Compliance Pro",
    images: [
      {
        url: "/protalk.png",
        width: 1200,
        height: 800,
        alt: "Pro Networks - Tax Compliance Pro",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Networks | Tax Compliance Pro",
    description:
      "Join private professional networks, connect with leading tax professionals, and access exclusive live training, resources, and masterminds.",
    images: ["/protalk.png"],
  },
};

export default function ProNetworksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
