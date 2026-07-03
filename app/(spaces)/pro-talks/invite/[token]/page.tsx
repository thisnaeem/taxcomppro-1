"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Radio01Icon } from "hugeicons-react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router    = useRouter();
  const [error,   setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/spaces/invite/${token}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Invite link not found");
          return;
        }
        // Redirect to the actual Pro Talk page
        router.replace(`/pro-talks/${data.id}`);
      })
      .catch(() => setError("Failed to resolve invite link."));
  }, [token, router]);

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-8 h-8 text-white/30" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Invite Not Found</h1>
        <p className="text-white/40 text-sm mb-6">{error}</p>
        <Link href="/pro-talks" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all">
          Browse Pro Talks
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06091a] via-[#0d1635] to-[#0a0e26] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-violet-500/30">
          <Radio01Icon className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Opening Pro Talk…</p>
      </div>
    </div>
  );
}
