import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface Props {
  params: Promise<{ cardId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { cardId } = await params;
  return {
    title: "TaxCompPro - Loading Profile...",
    description: "Loading TaxCompPro professional profile for card " + cardId,
  };
}

export default async function NfcCardRedirectPage({ params }: Props) {
  const { cardId } = await params;

  const card = await prisma.nfcCard.findUnique({
    where: { cardId: cardId.toUpperCase() },
    select: { username: true, status: true },
  });

  if (!card || card.status === "DEACTIVATED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6fb] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0a1628] flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
        </div>
        <p className="text-xl font-black text-[#0a1628] mb-2">Card Not Found</p>
        <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
          This NFC card has not been activated yet, or it may have been deactivated.
        </p>
        <Link
          href="/connect"
          className="bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] transition-colors"
        >
          Get Your Own TaxCompPro Card
        </Link>
      </div>
    );
  }

  redirect(`/connect/${card.username}?src=nfc`);
}