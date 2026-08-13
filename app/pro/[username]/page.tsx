"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface CardLookup { proId: string; name: string; image: string | null; }

// Gate between the public Tap Card and the full Marketplace profile.
// Logged in  -> log the click, then hand off to the existing /find-a-pro/[id] page.
// Logged out -> Join Free / Log In / Not Now prompt, per the NFC Connect Card spec.
export default function ProProfileGatePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [card, setCard] = useState<CardLookup | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/connect/${username}`)
      .then(r => r.ok ? r.json() as Promise<CardLookup> : Promise.reject())
      .then(setCard)
      .catch(() => setCard(null));
  }, [username]);

  useEffect(() => {
    if (isPending || card === undefined || card === null) return;
    if (session) {
      fetch(`/api/connect/${username}/event`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "FULL_PROFILE_CLICK" }),
      }).catch(() => {});
      router.replace(`/find-a-pro/${card.proId}`);
    }
  }, [isPending, session, card, username, router]);

  if (card === undefined || isPending || (card && session)) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]" /></div>;
  }

  if (card === null) {
    notFound();
  }

  // Logged out — show the join/login prompt, per spec, without trapping the visitor.
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb] px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center shadow-lg border border-slate-100">
        {card.image && <img src={card.image} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-slate-100" />}
        <div className="w-12 h-12 rounded-2xl bg-[#0a1628] flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-lg font-black text-[#0a1628] mb-1.5">Join Tax Compliance Pro — Free</h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create a free profile to view {card.name}&apos;s complete professional profile, connect with
          members, save professionals, and access the Tax Compliance Pro community.
        </p>
        <div className="space-y-2">
          <Link href={`/register?next=/pro/${username}`}
            className="block w-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3 rounded-full hover:shadow-lg transition-all">
            Create Free Profile
          </Link>
          <Link href={`/login?next=/pro/${username}`}
            className="block w-full border-2 border-[#0a1628] text-[#0a1628] font-bold text-sm py-3 rounded-full hover:bg-[#0a1628] hover:text-white transition-all">
            Log In
          </Link>
          <Link href={`/connect/${username}`} className="block w-full text-slate-400 font-semibold text-xs py-2 hover:text-slate-600">
            Not Now
          </Link>
        </div>
      </div>
    </div>
  );
}
