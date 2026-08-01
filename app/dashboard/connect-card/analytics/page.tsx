"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Card analytics are shown inline in the "Connect Card" tab.
export default function DashboardConnectCardAnalyticsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/profile?tab=card"); }, [router]);
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-[#0a1628]" /></div>;
}
