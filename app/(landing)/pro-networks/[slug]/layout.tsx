import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const network = await prisma.proNetwork.findUnique({
      where: { slug },
      include: {
        owner: { select: { name: true } },
      },
    });

    if (!network) {
      return {
        title: "Pro Network | Tax Compliance Pro",
        description: "Join professional networks on Tax Compliance Pro.",
        openGraph: {
          title: "Pro Network | Tax Compliance Pro",
          description: "Join professional networks on Tax Compliance Pro.",
          images: [{ url: "/protalk.png", width: 1200, height: 800, alt: "Pro Networks" }],
        },
      };
    }

    const title = `${network.name} | Pro Network · Tax Compliance Pro`;
    const description =
      network.tagline ||
      network.description ||
      `Join ${network.name} hosted by ${network.owner?.name || "Tax Pro"} on Tax Compliance Pro.`;
    const ogUrl = `https://taxcomppro.com/pro-networks/${network.slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: ogUrl,
        siteName: `${network.name} · Tax Compliance Pro`,
        type: "website",
        images: [
          {
            url: "/protalk.png",
            width: 1200,
            height: 800,
            alt: `${network.name} - Pro Network`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/protalk.png"],
      },
    };
  } catch {
    return {
      title: "Pro Network | Tax Compliance Pro",
      openGraph: {
        images: [{ url: "/protalk.png" }],
      },
    };
  }
}

export default function ProNetworkDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
