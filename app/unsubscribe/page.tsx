"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [reason, setReason] = useState("Too many emails");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to process unsubscribe request.");
      }
    } catch {
      setError("A connection error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1a] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black">
            TC
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
              Tax Compliance Pro
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Email Preferences
            </div>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
        >
          Sign In
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0a1628] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-44 h-44 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          {submitted ? (
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-extrabold text-white">
                  You Have Been Unsubscribed
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white">{email}</strong> has been removed from our promotional newsletters and marketing announcements.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 text-left space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Account Security Note
                </div>
                <p>
                  You may still receive essential transactional emails directly related to your account (e.g. login PINs, password resets, and support ticket replies).
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20"
                >
                  Return to Homepage
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-5">
              <div className="space-y-1.5 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  Marketing Opt-Out
                </div>
                <h1 className="text-xl font-extrabold text-white">
                  Unsubscribe from Newsletters
                </h1>
                <p className="text-xs text-slate-400">
                  Confirm your email below to stop receiving marketing campaigns and updates from Tax Compliance Pro.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Reason for unsubscribing (optional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                >
                  <option value="Too many emails">Too many emails received</option>
                  <option value="Content is no longer relevant">Content is no longer relevant</option>
                  <option value="I never signed up for this newsletter">I never signed up for this newsletter</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  "Confirm Unsubscribe"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
                >
                  Cancel and keep my subscription
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Tax Compliance Pro. All rights reserved.
      </footer>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060e1a] text-white flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
