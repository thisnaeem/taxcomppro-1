"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, GraduationCap, Users, Plus, Copy, Check, Download, X, Ban,
  CreditCard,
} from "lucide-react";
import { STATUS_COLORS } from "@/lib/training";

const inp = "w-full font-[inherit] text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all bg-white";
const lbl = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5";

interface Staff {
  id: string; name: string; email: string; status: string; statusLabel: string; versionLabel: string;
  invitedAt: string; registeredAt: string | null; trainingStartedAt: string | null;
  videoFurthestSeconds: number; videoDurationSeconds: number; videoCompletedAt: string | null;
  latestAttempt: { score: number; attemptNumber: number; passed: boolean } | null;
  acknowledgedAt: string | null; certificate: { number: string; issuedAt: string; pdfUrl: string | null } | null;
  revocable: boolean;
}
interface License {
  id: string; toolkitId: string; toolkitName: string; officeName: string | null;
  totalSeats: number; usedSeats: number; availableSeats: number; purchasedAt: string; expiresAt: string;
  staff: Staff[];
}

function InviteModal({ toolkitId, onClose, onInvited }: { toolkitId: string; onClose: () => void; onInvited: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    setError("");
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/training-center/invite", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolkitId, name, email }),
      });
      const data = await res.json() as { inviteUrl?: string; error?: string };
      if (!res.ok) { setError(data.error || "Could not send invitation."); return; }
      setInviteUrl(data.inviteUrl ?? null);
      onInvited();
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-[#0a1628] text-base">Invite Staff Member</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {!inviteUrl ? (
          <div className="space-y-3">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">{error}</div>}
            <div><label className={lbl}>Full Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className={inp} /></div>
            <div><label className={lbl}>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className={inp} /></div>
            <button onClick={submit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0a1628] text-white font-bold text-sm py-3 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              We don&apos;t send email invitations yet — copy this link and send it to {name} yourself (email, text, etc.).
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate">{inviteUrl}</code>
              <button onClick={async () => { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
            <button onClick={onClose} className="w-full text-xs font-bold text-slate-500 py-2">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function BuySeatsModal({ toolkitId, onClose }: { toolkitId: string; onClose: () => void }) {
  const [seats, setSeats] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buy = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/stripe/training-seats-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toolkitId, seats }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else { setError(data.error || "Could not start checkout."); setLoading(false); }
    } catch { setError("Something went wrong."); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-[#0a1628] text-base">Purchase Additional Seats</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs mb-3">{error}</div>}
        <label className={lbl}>Number of Seats</label>
        <input type="number" min={1} max={100} value={seats} onChange={e => setSeats(Number(e.target.value))} className={inp} />
        <p className="text-xs text-slate-400 mt-2 mb-4">$25 per seat (placeholder pricing) — {seats} seat{seats !== 1 ? "s" : ""} = ${(seats * 25).toFixed(2)}</p>
        <button onClick={buy} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm py-3 rounded-full disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue to Checkout"}
        </button>
      </div>
    </div>
  );
}

function fmtPct(s: number, d: number) { return d > 0 ? `${Math.min(100, Math.round((s / d) * 100))}%` : "—"; }

export default function TrainingCenterPage() {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [buySeatsFor, setBuySeatsFor] = useState<string | null>(null);
  const [officeDrafts, setOfficeDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const d = await fetch("/api/training-center").then(r => r.json()) as { licenses: License[] };
    setLicenses(d.licenses ?? []);
    setOfficeDrafts(Object.fromEntries((d.licenses ?? []).map(l => [l.id, l.officeName ?? ""])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveOfficeName = async (licenseId: string) => {
    await fetch("/api/training-center", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseId, officeName: officeDrafts[licenseId] }),
    });
    await load();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this staff member's training access and free up their seat?")) return;
    await fetch(`/api/training-center/invitations/${id}/revoke`, { method: "POST" });
    await load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]"><Loader2 className="w-8 h-8 animate-spin text-[#0a1628]" /></div>;

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-16">
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <h1 className="text-xl font-black text-[#0a1628]">ERO Training Center</h1>
        </div>
        <p className="text-sm text-slate-500 mb-8">Invite your staff, track completion, and document your office's due-diligence training.</p>

        {licenses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <p className="font-black text-[#0a1628] mb-2">No training license yet</p>
            <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">Purchase the IRS Fine Defense Toolkit to unlock 5 staff training seats and your Training Center.</p>
            <Link href="/toolkits" className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] transition-all">Browse Toolkits</Link>
          </div>
        )}

        {licenses.map(lic => (
          <div key={lic.id} className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-black text-[#0a1628] text-base">{lic.toolkitName}</h2>
                <p className="text-xs text-slate-400 mt-0.5">License expires {new Date(lic.expiresAt).toLocaleDateString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <input value={officeDrafts[lic.id] ?? ""} onChange={e => setOfficeDrafts(d => ({ ...d, [lic.id]: e.target.value }))}
                    placeholder="Office name" className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 w-48" />
                  <button onClick={() => saveOfficeName(lic.id)} className="text-[10px] font-bold text-slate-500 hover:text-[#0a1628]">Save</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/api/training-center/report?toolkitId=${lic.toolkitId}&format=pdf`} className="flex items-center gap-1.5 text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" />PDF Report
                </a>
                <a href={`/api/training-center/report?toolkitId=${lic.toolkitId}&format=csv`} className="flex items-center gap-1.5 text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" />CSV
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-[#0a1628]">{lic.totalSeats}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Total Seats</p></div>
              <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-[#0a1628]">{lic.usedSeats}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Assigned</p></div>
              <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-emerald-600">{lic.availableSeats}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Available</p></div>
            </div>

            <div className="flex gap-2 mb-5">
              <button onClick={() => setInviteFor(lic.toolkitId)} disabled={lic.availableSeats === 0}
                className="flex items-center gap-1.5 bg-[#0a1628] text-white font-bold text-xs px-4 py-2.5 rounded-full hover:bg-[#1a3a6b] disabled:opacity-40 transition-all">
                <Plus className="w-3.5 h-3.5" />Invite Staff
              </button>
              <button onClick={() => setBuySeatsFor(lic.toolkitId)}
                className="flex items-center gap-1.5 border-2 border-[#0a1628] text-[#0a1628] font-bold text-xs px-4 py-2.5 rounded-full hover:bg-[#0a1628] hover:text-white transition-all">
                <CreditCard className="w-3.5 h-3.5" />Buy More Seats
              </button>
            </div>

            {lic.staff.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 flex flex-col items-center gap-2">
                <Users className="w-6 h-6 text-slate-300" />No staff invited yet.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="pb-2 pr-3">Staff Member</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Video</th>
                      <th className="pb-2 pr-3">Score</th><th className="pb-2 pr-3">Ack.</th><th className="pb-2 pr-3">Certificate</th><th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lic.staff.map(s => (
                      <tr key={s.id} className="border-b border-slate-50">
                        <td className="py-2.5 pr-3"><p className="font-bold text-[#0a1628]">{s.name}</p><p className="text-slate-400">{s.email}</p></td>
                        <td className="py-2.5 pr-3"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_COLORS[s.status] ?? "bg-slate-100 text-slate-600"}`}>{s.statusLabel}</span></td>
                        <td className="py-2.5 pr-3 text-slate-600">{fmtPct(s.videoFurthestSeconds, s.videoDurationSeconds)}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{s.latestAttempt ? `${s.latestAttempt.score}%` : "—"}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{s.acknowledgedAt ? "Signed" : "—"}</td>
                        <td className="py-2.5 pr-3">
                          {s.certificate ? <span className="text-emerald-600 font-bold">Issued</span> : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          {s.revocable && (
                            <button onClick={() => revoke(s.id)} title="Revoke access" className="text-slate-400 hover:text-red-500"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {inviteFor && <InviteModal toolkitId={inviteFor} onClose={() => setInviteFor(null)} onInvited={load} />}
      {buySeatsFor && <BuySeatsModal toolkitId={buySeatsFor} onClose={() => setBuySeatsFor(null)} />}
    </div>
  );
}
