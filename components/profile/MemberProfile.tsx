"use client";
import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import Link from "next/link";
import { Loader2, BadgeCheck, Clock, X, CreditCard, Camera, Download } from "lucide-react";
import { UserCircleIcon, Mail01Icon, Briefcase01Icon, NoteIcon, Tick02Icon, BookOpen01Icon, UserGroupIcon, Rocket01Icon, ShoppingBag01Icon, Add01Icon } from "hugeicons-react";
import DueDiligenceBadge from "@/components/badges/DueDiligenceBadge";
import { VoiceMemoEditor } from "@/components/profile/VoiceMemo";

interface Purchase {
  id: string; toolkitId: string; name: string; emoji: string;
  membershipTier: string; membershipMonths: number;
  createdAt: string; downloadUrl: string | null;
}
const TIER_LABELS: Record<string, string> = {
  MARKETPLACE: "Marketplace", MARKETPLACE_PLUS: "Marketplace Plus", VIP: "VIP",
};

type AppStatus = "PENDING"|"APPROVED"|"REJECTED";
interface App { status: AppStatus; note: string|null; createdAt: string; }
const inp = "w-full font-[inherit] text-sm px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all";

export default function MemberProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.auth.user);
  const [name, setName] = useState(user?.name ?? "");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coverImage, setCoverImage] = useState<string|null>(user?.coverImage ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarImage, setAvatarImage] = useState<string|null>(user?.image ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [app, setApp] = useState<App | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [appSpec, setAppSpec] = useState(""); const [appCreds, setAppCreds] = useState(""); const [appReason, setAppReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "badges" | "purchases">("profile");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [voiceMemoUrl, setVoiceMemoUrl] = useState<string | null>(null);

  const openPortal = async () => {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    else { alert(data.error ?? "Could not open portal"); setPortalLoading(false); }
  };

  useEffect(() => {
    fetch("/api/user/me").then(r => r.json()).then((u: Record<string,unknown>) => {
      setName((u.name as string) ?? ""); setHeadline((u.headline as string) ?? ""); setBio((u.bio as string) ?? "");
      setCoverImage((u.coverImage as string|null) ?? null);
      setVoiceMemoUrl((u.voiceMemoUrl as string|null) ?? null);
    });
    fetch("/api/professional-application").then(r => r.json()).then(setApp);
  }, []);

  // Load purchases when the tab is activated
  useEffect(() => {
    if (activeTab !== "purchases" || purchases.length > 0) return;
    setPurchasesLoading(true);
    fetch("/api/user/purchases")
      .then(r => r.json())
      .then((d: Purchase[]) => setPurchases(Array.isArray(d) ? d : []))
      .finally(() => setPurchasesLoading(false));
  }, [activeTab]); // eslint-disable-line

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    fd.append("type", "avatar");
    const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
    if (res.ok) {
      const { urls } = await res.json() as { urls: string[] };
      const url = urls[0];
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      setAvatarImage(url);
      dispatch(setUser({ ...user!, image: url }));
    }
    setAvatarUploading(false);
    e.target.value = "";
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    fd.append("type", "cover");
    const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
    if (res.ok) {
      const { urls } = await res.json() as { urls: string[] };
      const url = urls[0];
      // Persist to DB so it survives refresh
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: url }),
      });
      setCoverImage(url);
      dispatch(setUser({ ...user!, coverImage: url }));
    }
    setCoverUploading(false);
    e.target.value = "";
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/user/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({name, headline, bio, coverImage}) });
    if (res.ok && user) { dispatch(setUser({...user, name, bio, headline, coverImage})); setSaved(true); setTimeout(()=>setSaved(false),3000); }
    setSaving(false);
  };

  const submitApp = async () => {
    setSubmitting(true);
    const res = await fetch("/api/professional-application", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({reason:appReason, specialty:appSpec, credentials:appCreds}) });
    if (res.ok) { const d = await res.json() as App; setApp(d); setShowForm(false); }
    setSubmitting(false);
  };

  const tierColors: Record<string,string> = { FREE:"bg-slate-100 text-slate-600", VIP:"bg-amber-100 text-amber-700", MARKETPLACE:"bg-indigo-100 text-indigo-700", MARKETPLACE_PLUS:"bg-emerald-100 text-emerald-700" };
  const tierLabels: Record<string,string> = { FREE:"Free Member", VIP:"VIP Member", MARKETPLACE:"Marketplace", MARKETPLACE_PLUS:"Marketplace Plus" };
  const tier = user?.tier ?? "FREE";

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Banner — full-width, same layout as original */}
      <div className="relative h-36 overflow-hidden cursor-pointer group"
        onClick={() => bannerInputRef.current?.click()}>
        {coverImage
          ? <img src={coverImage} alt="" className="w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0d2a50]" />
        }
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
          {coverUploading
            ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <div className="flex flex-col items-center gap-2 text-white">
                <Camera className="w-7 h-7" />
                <span className="text-xs font-bold">Change Banner</span>
              </div>
          }
        </div>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
      </div>
      <div className="max-w-4xl mx-auto px-4 -mt-14 relative z-10">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="relative -mt-10 shrink-0">
              {/* Avatar — click to change (supports photo, GIF, short video) */}
              <div
                className="w-20 h-20 rounded-2xl bg-[#0a1628] border-4 border-white overflow-hidden flex items-center justify-center shadow-lg cursor-pointer group/av relative"
                onClick={() => avatarInputRef.current?.click()}>
                {avatarImage
                  ? avatarImage.endsWith(".gif")
                    ? <img src={avatarImage} alt="" className="w-full h-full object-cover" />
                    : <img src={avatarImage} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  : <span className="text-white font-black text-3xl">{user?.name?.[0]}</span>}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/av:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                  {avatarUploading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Camera className="w-5 h-5 text-white" /><span className="text-[9px] text-white font-bold">Change</span></>}
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xl font-black text-[#0a1628]">{user?.name}</span>
                {user?.hasDueDiligenceBadge && <DueDiligenceBadge size={26} />}
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tierColors[tier]}`}>{tierLabels[tier]}</span>
              </div>
              {headline ? <p className="text-sm text-slate-500">{headline}</p> : <p className="text-sm text-slate-400 italic">No headline yet</p>}
              <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              {tier !== "FREE" && (
                <button onClick={openPortal} disabled={portalLoading}
                  className="flex items-center gap-1.5 text-xs font-bold border-2 border-[#0a1628] text-[#0a1628] px-4 py-2 rounded-full hover:bg-[#0a1628] hover:text-white transition-all">
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  Manage Plan
                </button>
              )}
              {/* Only show Upgrade for free members */}
              {tier === "FREE" && (
                <Link href="/upgrade" className="text-xs font-bold bg-[#0a1628] text-white px-4 py-2 rounded-full hover:bg-[#1a3a6b] transition-all shrink-0">Upgrade</Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 mb-5 border border-slate-100 shadow-sm">
          {(["profile", "badges", "purchases"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-[#0a1628] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab === "profile" ? "✏️  Profile" : tab === "badges" ? "🏅  My Badges" : "📦  My Purchases"}
            </button>
          ))}
        </div>

        {activeTab === "purchases" ? (
          /* ── Purchases Tab ── */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-black text-[#0a1628] text-base mb-1">My Purchases</h2>
            <p className="text-xs text-slate-400 mb-6">Your toolkit downloads are always available here.</p>
            {purchasesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl mb-3 block">📦</span>
                <p className="font-black text-slate-400">No purchases yet</p>
                <p className="text-xs text-slate-300 mt-1 mb-4">Buy a toolkit to get professional resources + membership access.</p>
                <a href="/toolkits" className="inline-flex items-center gap-2 bg-[#0a1628] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
                  Browse Toolkits
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-3xl shrink-0">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0a1628] text-sm truncate">{p.name}</p>
                      <p className="text-xs text-emerald-600 font-semibold">
                        {p.membershipMonths}mo {TIER_LABELS[p.membershipTier] ?? p.membershipTier} membership included
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Purchased {new Date(p.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {p.downloadUrl ? (
                      <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-[#0a1628] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all shrink-0">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 px-3 py-2 bg-slate-100 rounded-xl shrink-0">Coming soon</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "badges" ? (
          /* ── Badges Tab ── */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-black text-[#0a1628] text-base mb-1">My Achievements</h2>
            <p className="text-xs text-slate-400 mb-6">Complete activities to unlock badges. They appear next to your name across the platform.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Due Diligence Badge */}
              {(() => {
                const earned = user?.hasDueDiligenceBadge ?? false;
                return (
                  <div className={`relative rounded-2xl border-2 p-5 flex items-center gap-4 transition-all ${
                    earned
                      ? "border-amber-300 bg-amber-50/40"
                      : "border-slate-100 bg-slate-50/50 opacity-60 grayscale"
                  }`}>
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${
                      earned ? "bg-amber-100" : "bg-slate-100"
                    }`}>
                      <img
                        src="/due_dilligence_badge.png"
                        alt="Due Diligence Badge"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#0a1628] text-sm">Due Diligence</span>
                        {earned && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                            ✓ Earned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {earned
                          ? "You've earned this badge! It now shows next to your name on all your posts."
                          : "Complete any course or purchase any toolkit to unlock this badge."}
                      </p>
                    </div>
                    {!earned && (
                      <div className="absolute top-3 right-3 text-slate-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Placeholder for future badges */}
              {["Course Creator", "Community Leader", "Top Contributor"].map(name => (
                <div key={name} className="relative rounded-2xl border-2 border-slate-100 bg-slate-50/50 opacity-40 grayscale p-5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-2xl">🏆</div>
                  <div className="flex-1">
                    <div className="font-black text-[#0a1628] text-sm">{name}</div>
                    <p className="text-xs text-slate-400 mt-0.5">Coming soon</p>
                  </div>
                  <div className="absolute top-3 right-3 text-slate-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
        <div className="grid sm:grid-cols-3 gap-5">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Links</p>
              {[{icon:BookOpen01Icon,label:"My Courses",href:"/my-courses",c:"text-indigo-500 bg-indigo-50"},{icon:UserGroupIcon,label:"Connections",href:"/connections",c:"text-emerald-500 bg-emerald-50"},{icon:ShoppingBag01Icon,label:"Marketplace",href:"/marketplace",c:"text-amber-500 bg-amber-50"},{icon:Rocket01Icon,label:"Upgrade Plan",href:"/upgrade",c:"text-purple-500 bg-purple-50"}].map(l=>(
                <Link key={l.href} href={l.href} className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.c}`}><l.icon className="w-4 h-4"/></span>{l.label}
                </Link>
              ))}
            </div>

            {/* Pro application — only show for non-marketplace users */}
            {user?.tier !== "MARKETPLACE" && user?.tier !== "MARKETPLACE_PLUS" && (
            <div className="bg-white rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Professional Status</p>
              {app === undefined && <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />}
              {app === null && !showForm && (
                <>
                  <p className="text-xs text-slate-500 mb-3">Become a verified professional and appear in the Pros directory.</p>
                  <button onClick={()=>setShowForm(true)} className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-[#0a1628] text-white py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all">
                    <Add01Icon className="w-3.5 h-3.5"/>Apply Now
                  </button>
                </>
              )}
              {app?.status==="PENDING" && <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-3 py-2 text-xs font-semibold"><Clock className="w-3.5 h-3.5 shrink-0"/>Pending review</div>}
              {app?.status==="REJECTED" && <div className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{app.note ? `Not approved: ${app.note}` : "Not approved"}</div>}
            </div>
            )}
          </div>

          {/* Edit form */}
          <div className="sm:col-span-2 space-y-5">
            {showForm ? (
              <div className="bg-white rounded-2xl p-6 border-2 border-[#0a1628]/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-[#0a1628]">Apply to Become a Professional</h2>
                  <button onClick={()=>setShowForm(false)}><X className="w-4 h-4 text-slate-400"/></button>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Primary Specialty *</label><input value={appSpec} onChange={e=>setAppSpec(e.target.value)} placeholder="e.g. Tax Resolution" className={inp}/></div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Credentials *</label><input value={appCreds} onChange={e=>setAppCreds(e.target.value)} placeholder="e.g. EA, 10 years experience" className={inp}/></div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Why become a professional? *</label><textarea value={appReason} onChange={e=>setAppReason(e.target.value)} rows={3} className={`${inp} resize-none`}/></div>
                  <button onClick={submitApp} disabled={submitting||!appReason.trim()||!appSpec.trim()||!appCreds.trim()} className="flex items-center gap-2 bg-[#0a1628] text-white text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-40 hover:bg-[#1a3a6b] transition-all">
                    {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:null}Submit Application
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-[#0a1628]">Edit Profile</h2>
                  {saved && <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><Tick02Icon className="w-3.5 h-3.5"/>Saved!</span>}
                </div>
                <div className="space-y-4">
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                    <div className="relative"><UserCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={name} onChange={e=>setName(e.target.value)} className={`${inp} pl-10`}/></div>
                  </div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
                    <div className="relative"><Mail01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"/><input value={user?.email??""} disabled className={`${inp} pl-10 bg-slate-50 text-slate-400 cursor-not-allowed`}/></div>
                  </div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Headline</label>
                    <div className="relative"><Briefcase01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="e.g. Tax Professional | IRS Specialist" className={`${inp} pl-10`} maxLength={100}/></div>
                  </div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Bio</label>
                    <div className="relative"><NoteIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400"/><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} placeholder="Tell the community about yourself…" className={`${inp} pl-10 resize-none`} maxLength={500}/></div>
                  </div>
                  {/* Voice Memo */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Voice Intro</label>
                    <p className="text-xs text-slate-400 mb-3">Record a short voice intro (max 4 minutes). It plays on your public profile so others can hear from you directly.</p>
                    <VoiceMemoEditor currentUrl={voiceMemoUrl} onSaved={setVoiceMemoUrl} />
                  </div>
                  <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#1a3a6b] transition-all disabled:opacity-40">
                    {saving?<><Loader2 className="w-4 h-4 animate-spin"/>Saving…</>:<><Tick02Icon className="w-4 h-4"/>Save Changes</>}
                  </button>
                </div>
              </div>
            )}

            {/* Become a Pro CTA — only show if user is NOT on marketplace plans */}
            {user?.tier !== "MARKETPLACE" && user?.tier !== "MARKETPLACE_PLUS" && (
            <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2"><BadgeCheck className="w-5 h-5 text-amber-400"/><span className="font-black text-sm">Become a Pro</span></div>
              <p className="text-white/60 text-xs mb-4">Get verified, appear in the Pros directory, and connect with clients directly.</p>
              <Link href="/apply-professional" className="block text-center text-xs font-bold bg-amber-400 text-[#0a1628] py-2 rounded-lg hover:bg-amber-300 transition-all">Apply Now</Link>
            </div>
            )}
            {/* Marketplace Plus badge display */}
            {user?.tier === "MARKETPLACE_PLUS" && (
            <div className="bg-gradient-to-br from-[#d4a017] to-[#f0c040] rounded-2xl p-5 text-[#0a1628]">
              <div className="flex items-center gap-2 mb-2"><BadgeCheck className="w-5 h-5 text-[#0a1628]"/><span className="font-black text-sm">Marketplace Plus Member</span></div>
              <p className="text-[#0a1628]/70 text-xs">You have full access to all platform features including marketplace listings and Pro Talk hosting.</p>
            </div>
            )}
          </div>
        </div>
        )} {/* end activeTab === profile */}
      </div>
    </div>
  );
}
