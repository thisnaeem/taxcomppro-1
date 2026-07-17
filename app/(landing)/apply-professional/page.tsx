"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { BadgeCheck, Loader2, CheckCircle, Clock, X } from "lucide-react";

type AppStatus = "PENDING" | "APPROVED" | "REJECTED";
interface Application { id: string; status: AppStatus; specialty: string; credentials: string; reason: string; note: string | null; createdAt: string; }

export default function ApplyProfessionalPage() {
  const router  = useRouter();
  const user    = useAppSelector(s => s.auth.user);

  const [app,          setApp]          = useState<Application | null | undefined>(undefined);
  const [specialty,    setSpecialty]    = useState("");
  const [credentials,  setCredentials]  = useState("");
  const [reason,       setReason]       = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    fetch("/api/professional-application").then(r => r.json()).then(setApp);
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Please sign in to apply.</p>
    </div>
  );

  if (user.role === "PROFESSIONAL") return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BadgeCheck className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-black text-[#0a1628] mb-2">You&apos;re already a Professional!</h1>
        <p className="text-slate-500 mb-6">Your profile appears in the Pros directory.</p>
        <button onClick={() => router.push(`/find-a-pro/${user.id}`)}
          className="px-6 py-3 bg-[#0a1628] text-white font-bold rounded-full hover:bg-[#1a3a6b] transition-all">
          View My Profile
        </button>
      </div>
    </div>
  );

  if (app === undefined) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#0a1628]" />
    </div>
  );

  const inputCls = "w-full font-[inherit] text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all bg-white";
  const labelCls = "block text-xs font-black uppercase tracking-widest text-slate-400 mb-2";

  const submit = async () => {
    setError("");
    if (!specialty.trim() || !credentials.trim() || !reason.trim()) { setError("All fields are required."); return; }
    setSubmitting(true);
    const res = await fetch("/api/professional-application", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialty, credentials, reason }),
    });
    if (res.ok) {
      const data = await res.json() as Application;
      setApp(data);
    } else {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BadgeCheck className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-[#0a1628] mb-2">Become a Professional</h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Join the verified professionals directory and connect with clients across the platform.</p>
        </div>

        {/* Already applied */}
        {app && app.status === "PENDING" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-black text-[#0a1628] text-lg mb-1">Application Under Review</h2>
            <p className="text-slate-500 text-sm">Submitted for <strong>{app.specialty}</strong>. An admin will review your application shortly.</p>
            <p className="text-xs text-slate-400 mt-3">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        {app && app.status === "APPROVED" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h2 className="font-black text-[#0a1628] text-lg mb-1">Application Approved!</h2>
            <p className="text-slate-500 text-sm mb-4">You are now a verified professional.</p>
            <button onClick={() => router.push("/profile")}
              className="px-6 py-2.5 bg-[#0a1628] text-white font-bold rounded-full hover:bg-[#1a3a6b] transition-all text-sm">
              Go to My Profile
            </button>
          </div>
        )}

        {app && app.status === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <X className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="font-black text-[#0a1628] text-lg mb-1">Application Not Approved</h2>
            {app.note && <p className="text-slate-500 text-sm">{app.note}</p>}
            <p className="text-xs text-slate-400 mt-2">Contact support to reapply.</p>
          </div>
        )}

        {/* Form — only show if no application yet */}
        {!app && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            {/* Benefits */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                { emoji: "🏆", label: "Verified Badge" },
                { emoji: "🔍", label: "Pro Directory" },
                { emoji: "📨", label: "Direct Messages" },
              ].map(b => (
                <div key={b.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{b.emoji}</div>
                  <p className="text-[10px] font-bold text-slate-600">{b.label}</p>
                </div>
              ))}
            </div>

            <hr className="border-slate-100" />

            <div>
              <label className={labelCls}>Primary Specialty *</label>
              <input value={specialty} onChange={e => setSpecialty(e.target.value)}
                placeholder="e.g. Tax Resolution, IRS Audit Defense, Tax Planning"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Credentials & Certifications *</label>
              <input value={credentials} onChange={e => setCredentials(e.target.value)}
                placeholder="e.g. EA (Enrolled Agent), CPA, 10 years experience"
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Why do you want to become a Professional? *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={5}
                placeholder="Describe your background, expertise, and what value you bring to the TaxCompPro community…"
                className={`${inputCls} resize-none`} maxLength={800} />
              <p className="text-[11px] text-slate-400 mt-1 text-right">{reason.length}/800</p>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button onClick={submit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold py-3.5 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-40 text-sm">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit Application <BadgeCheck className="w-4 h-4" /></>}
            </button>

            <p className="text-xs text-center text-slate-400">Applications are reviewed within 1-2 business days.</p>
          </div>
        )}
      </div>
    </div>
  );
}
