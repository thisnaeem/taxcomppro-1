"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Convenience alias for the suggested /dashboard/connect-card URL — the
// actual editor lives in the "Connect Card" tab on the member's profile page.
export default function DashboardConnectCardRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/profile?tab=card"); }, [router]);
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-[#0a1628]" /></div>;
}
