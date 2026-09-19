"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading } from "@/store/slices/authSlice";
import AdminShell from "@/components/layout/AdminShell";
import "./admin-ui.css";
import type { AuthUser } from "@/store/slices/authSlice";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetch("/api/user/me")
      .then(r => r.ok ? r.json() : null)
      .then((u: AuthUser | null) => {
        if (!u) { router.push("/login"); return; }
        if (u.role !== "ADMIN") { router.push("/"); return; }
        setAuthorized(true);
        dispatch(setUser({
          id:       u.id,
          email:    u.email,
          name:     u.name,
          phone:    u.phone   ?? null,
          role:     u.role    ?? "MEMBER",
          tier:     u.tier    ?? "FREE",
          image:    u.image   ?? null,
          bio:      u.bio     ?? null,
          headline: u.headline ?? null,
        }));
      })
      .catch(() => { setAuthorized(false); router.push("/login"); });
    dispatch(setLoading(false));
  }, [session, isPending, dispatch, router]);

  if (isPending || (session && !authorized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060f1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#ffbe24] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <Suspense fallback={<p>Loading workspace…</p>}><AdminShell>{children}</AdminShell></Suspense>;
}
