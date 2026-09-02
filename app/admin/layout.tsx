"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading } from "@/store/slices/authSlice";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import type { AuthUser } from "@/store/slices/authSlice";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      .catch(() => {
        const u = session.user as unknown as AuthUser & Record<string, unknown>;
        if ((u.role as string) !== "ADMIN") { router.push("/"); return; }
        dispatch(setUser({
          id:       u.id,
          email:    u.email,
          name:     u.name,
          phone:    (u.phone as string) ?? null,
          role:     (u.role as AuthUser["role"]) ?? "MEMBER",
          tier:     (u.tier as AuthUser["tier"]) ?? "FREE",
          image:    u.image as string | null,
          bio:      u.bio as string | null,
          headline: u.headline as string | null,
        }));
      });
    dispatch(setLoading(false));
  }, [session, isPending, dispatch, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#060f1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-100 dark:bg-[#060f1e] font-sans transition-colors duration-200 overflow-hidden">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-slate-50 dark:bg-[#060f1e] text-slate-800 dark:text-slate-100 transition-colors duration-200">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
