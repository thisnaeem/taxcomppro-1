"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserAdd01Icon, Tick02Icon } from "hugeicons-react";
import { useAppSelector } from "@/store/hooks";

export default function FollowButton({ memberId }: { memberId: string }) {
  const me = useAppSelector(s => s.auth.user);
  const router = useRouter();
  const [data, setData] = useState<{ following: boolean; followerCount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/users/${memberId}/follow`, { signal: controller.signal, cache: "no-store" })
      .then(async res => { if (!res.ok) throw Error(); return res.json(); })
      .then(value => { setData(value); setError(""); })
      .catch(() => { if (!controller.signal.aborted) setError("Couldn’t load follow status."); });
    return () => controller.abort();
  }, [memberId, me?.id, retry]);
  async function toggle() {
    if (!me) { router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
    if (!data || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/users/${memberId}/follow`, { method: data.following ? "DELETE" : "POST" });
      const result = await res.json();
      if (!res.ok) throw Error(result.error || "Couldn’t save. Try again.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t save. Try again."); }
    finally { setBusy(false); }
  }
  if (me?.id === memberId) return null;

  if (data === null) {
    return <div className="w-[110px] h-[46px] rounded-xl profile-skeleton shrink-0" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !data}
      aria-pressed={data?.following ?? false}
      title={data?.following ? "Unfollow this member" : "Follow public posts without sending a connection request"}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm border transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-wait shrink-0 ${
        data?.following
          ? "border-blue-400/40 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20"
          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-[#0a1628] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-xs"
      }`}
    >
      {data?.following ? <Tick02Icon size={16} aria-hidden /> : <UserAdd01Icon size={16} aria-hidden />}
      <span>{busy ? "Saving…" : data?.following ? "Following" : "Follow"}</span>
      {data && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 ml-0.5">
          {data.followerCount}
        </span>
      )}
    </button>
  );
}
