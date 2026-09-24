import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ token: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  try {
    const space = await prisma.space.findUnique({
      where: { shareToken: token },
      include: {
        host: { select: { name: true } },
      },
    });

    if (!space) {
      return {
        title: "Pro Talk Invitation | Tax Compliance Pro",
        description: "You've been invited to join a Pro Talk stage.",
        openGraph: {
          title: "Pro Talk Invitation | Tax Compliance Pro",
          description: "You've been invited to join a Pro Talk stage.",
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
    const stageType = isScheduled ? "scheduled session" : "live stage";

    const title = `Invitation: ${space.name} | ${networkName} · Pro Talks`;
    const description = space.description?.trim()
      ? `${space.description} — You're invited by ${hostName} on ${networkName}.`
      : `You've been invited by ${hostName} to join the ${stageType} "${space.name}" on ${networkName}.`;

    const ogUrl = `https://taxcomppro.com/pro-talks/invite/${token}`;

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
      title: "Pro Talk Invitation | Tax Compliance Pro",
      openGraph: {
        images: [{ url: "/protalk.png" }],
      },
    };
  }
}

export default function ProTalkInviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
