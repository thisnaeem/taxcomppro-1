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
  if (data === null && me?.id !== memberId) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-[100px] h-[46px] rounded-xl profile-skeleton" />
        <div className="w-16 h-3 rounded-full profile-skeleton" />
      </div>
    );
  }

  return <div className="flex flex-col items-center gap-1">
    {me?.id !== memberId && <button type="button" onClick={toggle} disabled={busy || !data} aria-pressed={data?.following ?? false}
      title={data?.following ? "Unfollow this member" : "Follow public posts without sending a connection request"}
      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
      {data?.following ? <Tick02Icon size={18} aria-hidden /> : <UserAdd01Icon size={18} aria-hidden />}
      {busy ? "Saving…" : data?.following ? "Following" : "Follow"}
    </button>}
    {data && <span className="text-xs text-slate-500 dark:text-slate-300">{data.followerCount} follower{data.followerCount === 1 ? "" : "s"}</span>}
    {error && <span className="text-xs text-red-600 dark:text-red-300 max-w-48" role="alert">{error}{!data && <button className="ml-1 underline cursor-pointer" onClick={() => setRetry(n => n + 1)}>Retry</button>}</span>}
  </div>;
}
