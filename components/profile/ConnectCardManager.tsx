"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, Copy, Check, Share2, Download, CreditCard, Plus, X, GripVertical,
  Eye, EyeOff, Trash2, ExternalLink, BarChart3, Camera, Wallet,
} from "lucide-react";
import { CARD_THEMES, VISIBILITY_OPTIONS, cardPublicUrl, qrCodeUrl, type Visibility } from "@/lib/connectCard";

const inp = "w-full font-[inherit] text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all bg-white";
const lbl = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5";

interface CardData {
  id: string; username: string; isActivated: boolean; activatedAt: string | null;
  professionalTitle: string | null; businessName: string | null; businessDescription: string | null;
  phone: string | null; bookingUrl: string | null; businessAddress: string | null; logoUrl: string | null;
  theme: string; accentColor: string; cardUrl: string;
  phoneVisibility: Visibility; emailVisibility: Visibility; addressVisibility: Visibility;
  bookingVisibility: Visibility; websiteVisibility: Visibility; socialVisibility: Visibility; servicesVisibility: Visibility;
}
interface LinkRow {
  id: string; label: string; url: string; icon: string | null; color: string | null;
  order: number; isActive: boolean; clickCount: number;
}
interface Analytics {
  pageViews: number; nfcTaps: number; qrScans: number; contactSaves: number;
  shareClicks: number; fullProfileClicks: number; totalLinkClicks: number;
  links: { id: string; label: string; clickCount: number; isActive: boolean }[];
}

const VIS_FIELDS = [
  ["phone", "phoneVisibility"], ["email", "emailVisibility"], ["address", "addressVisibility"],
  ["booking", "bookingVisibility"], ["website", "websiteVisibility"], ["social", "socialVisibility"],
  ["services", "servicesVisibility"],
] as const;

export default function ConnectCardManager() {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    professionalTitle: "", businessName: "", businessDescription: "", phone: "",
    bookingUrl: "", businessAddress: "", theme: "classic", accentColor: "#0a1628",
  });
  const [visibility, setVisibility] = useState<Record<string, Visibility>>({});
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/dashboard/connect-card").then(r => r.json()) as { card: CardData | null; links: LinkRow[] };
    setCard(d.card);
    setLinks(d.links ?? []);
    if (d.card) {
      setF({
        professionalTitle: d.card.professionalTitle ?? "", businessName: d.card.businessName ?? "",
        businessDescription: d.card.businessDescription ?? "", phone: d.card.phone ?? "",
        bookingUrl: d.card.bookingUrl ?? "", businessAddress: d.card.businessAddress ?? "",
        theme: d.card.theme, accentColor: d.card.accentColor,
      });
      setVisibility({
        phone: d.card.phoneVisibility, email: d.card.emailVisibility, address: d.card.addressVisibility,
        booking: d.card.bookingVisibility, website: d.card.websiteVisibility, social: d.card.socialVisibility,
        services: d.card.servicesVisibility,
      });
      fetch("/api/dashboard/connect-card/analytics").then(r => r.json()).then(setAnalytics).catch(() => {});
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/dashboard/connect-card", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, visibility }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); await load(); }
    setSaving(false);
  };

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    const fd = new FormData(); fd.append("files", file); fd.append("type", "logo");
    const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
    if (res.ok) {
      const { urls } = await res.json() as { urls: string[] };
      await fetch("/api/dashboard/connect-card", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logoUrl: urls[0] }),
      });
      await load();
    }
    setLogoUploading(false);
  };

  const addLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    const res = await fetch("/api/dashboard/connect-card/links", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newLink),
    });
    if (res.ok) { setNewLink({ label: "", url: "" }); await load(); }
  };

  const updateLink = async (id: string, data: Partial<LinkRow>) => {
    await fetch(`/api/dashboard/connect-card/links/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    await load();
  };

  const deleteLink = async (id: string) => {
    await fetch(`/api/dashboard/connect-card/links/${id}`, { method: "DELETE" });
    await load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const arr = [...links];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    setLinks(arr);
    await fetch("/api/dashboard/connect-card/links/reorder", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: arr.map(l => l.id) }),
    });
  };

  const copyLink = async () => {
    if (!card) return;
    await navigator.clipboard.writeText(card.cardUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!card) return;
    if (navigator.share) { try { await navigator.share({ title: "My Connect Card", url: card.cardUrl }); return; } catch { /* cancelled */ } }
    copyLink();
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-slate-300" /></div>;

  if (!card) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0a1628] flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-black text-[#0a1628] text-base mb-1.5">Activate Your Connect Card</h2>
        <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
          Set up your NFC business card, public Tap Card page, and Marketplace profile — all from one
          short setup.
        </p>
        <Link href="/connect" className="inline-flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] transition-all">
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Preview + share */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-full sm:w-36 shrink-0 rounded-2xl overflow-hidden" style={{ background: CARD_THEMES.find(t => t.value === f.theme)?.bg }}>
            <div className="p-4 text-center" style={{ color: CARD_THEMES.find(t => t.value === f.theme)?.text }}>
              {card.logoUrl && <img src={card.logoUrl} alt="" className="w-8 h-8 object-contain mx-auto mb-1 rounded bg-white/90 p-0.5" />}
              <div className="w-10 h-10 rounded-full bg-white/20 mx-auto mb-1" />
              <p className="text-[10px] font-black truncate">{f.businessName || "Your Card"}</p>
            </div>
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.isActivated ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {card.isActivated ? "● Active" : "Inactive"}
              </span>
              {card.activatedAt && <span className="text-[10px] text-slate-400">since {new Date(card.activatedAt).toLocaleDateString()}</span>}
            </div>
            <p className="text-xs text-slate-400 mb-2">Public URL</p>
            <div className="flex items-center gap-2 mb-3">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate">{card.cardUrl}</code>
              <button onClick={copyLink} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
              <button onClick={shareLink} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <Share2 className="w-4 h-4 text-slate-500" />
              </button>
              <Link href={card.cardUrl.replace(/^https?:\/\/[^/]+/, "")} target="_blank" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50">
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={qrCodeUrl(card.cardUrl, 512)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
                <Download className="w-3.5 h-3.5" />Download QR Code
              </a>
              <button disabled title="Requires Apple Developer signing — coming soon"
                className="flex items-center gap-1.5 text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg text-slate-400 cursor-not-allowed">
                <Wallet className="w-3.5 h-3.5" />Apple Wallet <span className="text-[9px]">(soon)</span>
              </button>
              <button disabled title="Requires Google Wallet Issuer credentials — coming soon"
                className="flex items-center gap-1.5 text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg text-slate-400 cursor-not-allowed">
                <Wallet className="w-3.5 h-3.5" />Google Wallet <span className="text-[9px]">(soon)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" />Card Analytics
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {([
              ["Page Views", analytics.pageViews], ["NFC Taps", analytics.nfcTaps], ["QR Scans", analytics.qrScans],
              ["Link Clicks", analytics.totalLinkClicks], ["Contact Saves", analytics.contactSaves], ["Profile Clicks", analytics.fullProfileClicks],
            ] as const).map(([label, value]) => (
              <div key={label} className="text-center bg-slate-50 rounded-xl py-3">
                <p className="text-lg font-black text-[#0a1628]">{value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact info */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Edit Contact Information</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
            onClick={() => logoInputRef.current?.click()}>
            {card.logoUrl ? <img src={card.logoUrl} alt="" className="w-full h-full object-contain" /> : (logoUploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Camera className="w-4 h-4 text-slate-400" />)}
          </div>
          <div className="text-xs text-slate-400">Business logo<br /><span className="text-[10px]">Click the square to upload</span></div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Professional Title</label><input value={f.professionalTitle} onChange={e => setF(p => ({ ...p, professionalTitle: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Business Name</label><input value={f.businessName} onChange={e => setF(p => ({ ...p, businessName: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Phone</label><input value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Business Address</label><input value={f.businessAddress} onChange={e => setF(p => ({ ...p, businessAddress: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Booking Link</label><input value={f.bookingUrl} onChange={e => setF(p => ({ ...p, bookingUrl: e.target.value }))} className={inp} /></div>
        </div>
        <div><label className={lbl}>Short Business Description</label><textarea value={f.businessDescription} onChange={e => setF(p => ({ ...p, businessDescription: e.target.value }))} rows={3} maxLength={280} className={`${inp} resize-none`} /></div>
      </div>

      {/* Design */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-3">Page Design</h2>
        <div className="grid grid-cols-5 gap-2 max-w-xs">
          {CARD_THEMES.map(t => (
            <button key={t.value} type="button" onClick={() => setF(p => ({ ...p, theme: t.value }))}
              className={`h-12 rounded-lg border-2 transition-all ${f.theme === t.value ? "border-[#d4a017] scale-105" : "border-transparent"}`}
              style={{ background: t.bg }} title={t.label} />
          ))}
        </div>
      </div>

      {/* Custom links */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Manage Custom Links</h2>
        <p className="text-xs text-slate-400 mb-4">Add, reorder, and track clicks on Linktree-style buttons.</p>
        <div className="space-y-2 mb-4">
          {links.map((l, i) => (
            <div key={l.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <div className="flex flex-col shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><GripVertical className="w-3.5 h-3.5 rotate-0" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <input value={l.label} onChange={e => setLinks(ls => ls.map(x => x.id === l.id ? { ...x, label: e.target.value } : x))}
                  onBlur={e => updateLink(l.id, { label: e.target.value })} className="w-full text-xs font-bold bg-transparent outline-none" />
                <input value={l.url} onChange={e => setLinks(ls => ls.map(x => x.id === l.id ? { ...x, url: e.target.value } : x))}
                  onBlur={e => updateLink(l.id, { url: e.target.value })} className="w-full text-[10px] text-slate-400 bg-transparent outline-none" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 shrink-0">{l.clickCount} clicks</span>
              <button onClick={() => updateLink(l.id, { isActive: !l.isActive })} className="shrink-0 text-slate-400 hover:text-slate-700">
                {l.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteLink(l.id)} className="shrink-0 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        {links.length < 12 && (
          <div className="flex gap-2">
            <input value={newLink.label} onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))} placeholder="Label" className={`${inp} flex-1`} />
            <input value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} placeholder="https://…" className={`${inp} flex-1`} />
            <button onClick={addLink} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#0a1628] text-white"><Plus className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Privacy Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Control who can see each field on your public card.</p>
        <div className="space-y-1.5">
          {VIS_FIELDS.map(([field]) => (
            <div key={field} className="flex items-center justify-between gap-2 text-xs">
              <span className="capitalize font-semibold text-slate-600 w-20 shrink-0">{field}</span>
              <div className="flex gap-1 flex-1 max-w-xs">
                {VISIBILITY_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={() => setVisibility(v => ({ ...v, [field]: o.value }))}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${visibility[field] === o.value ? "bg-[#0a1628] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Replace / reassign */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-black text-[#0a1628] text-sm uppercase tracking-widest mb-1">Replace or Reassign Card</h2>
        <p className="text-xs text-slate-400 mb-3">
          Change the username your public card and profile use. Your old link will stop working immediately.
        </p>
        <div className="flex items-center gap-2 max-w-sm">
          <span className="text-xs text-slate-400 shrink-0">/connect/</span>
          <input defaultValue={card.username} id="cc-username" className={inp} />
          <button onClick={async () => {
            const val = (document.getElementById("cc-username") as HTMLInputElement).value;
            const res = await fetch("/api/dashboard/connect-card", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: val }) });
            if (res.ok) await load(); else { const d = await res.json(); alert(d.error ?? "Could not update username"); }
          }} className="shrink-0 text-xs font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl">Save</button>
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-50 shadow-lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (saved ? <Check className="w-4 h-4" /> : null)}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
