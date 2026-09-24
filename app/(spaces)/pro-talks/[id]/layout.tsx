import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        host: { select: { name: true } },
      },
    });

    if (!space) {
      return {
        title: "Pro Talk | Tax Compliance Pro",
        description: "Live stage on Tax Compliance Pro.",
        openGraph: {
          title: "Pro Talk | Tax Compliance Pro",
          description: "Live stage on Tax Compliance Pro.",
          images: [{ url: "/protalk.png", width: 1200, height: 800, alt: "Pro Talks" }],
        },
      };
    }

    const [networkEvent, hostNetwork] = await Promise.all([
      prisma.proNetworkEvent.findFirst({
        where: { roomName: space.roomName },
        include: { network: { select: { name: true } } },
      }),
      prisma.proNetwork.findFirst({
        where: { ownerId: space.hostId },
        select: { name: true },
      }),
    ]);

    const networkName = networkEvent?.network?.name || hostNetwork?.name || "Pro Network";
    const hostName = space.host?.name || "Tax Pro";
    const isScheduled = Boolean(space.scheduledAt && !space.isLive && !space.endedAt);
    const stageType = isScheduled ? "Scheduled Pro Talk" : space.isLive ? "Live Pro Talk" : "Pro Talk";

    const title = `${space.name} | ${networkName} · Pro Talks`;
    const description = space.description?.trim()
      ? `${space.description} — ${stageType} hosted by ${hostName} on ${networkName}.`
      : `Join ${hostName} for "${space.name}" on the ${networkName} live stage.`;

    const ogUrl = `https://taxcomppro.com/pro-talks/${space.id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: ogUrl,
        siteName: `${networkName} · Tax Compliance Pro`,
        type: "video.other",
        images: [
          {
            url: "/protalk.png",
            width: 1200,
            height: 800,
            alt: `${space.name} - ${networkName}`,
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
      title: "Pro Talk | Tax Compliance Pro",
      openGraph: {
        images: [{ url: "/protalk.png" }],
      },
    };
  }
}

export default function ProTalkDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
