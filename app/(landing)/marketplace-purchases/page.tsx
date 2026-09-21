"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplacePurchasesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/marketplace?view=purchases");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] dark:bg-[#0c1527]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#ffbe24] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading your purchases…</p>
      </div>
    </div>
  );
}
