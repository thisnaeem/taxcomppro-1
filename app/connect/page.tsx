"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Camera,
  Briefcase, Phone, MapPin, Globe, Calendar, Plus, X, Check, CreditCard,
} from "lucide-react";
import { signUp, useSession } from "@/lib/auth-client";
import { CARD_THEMES, VISIBILITY_OPTIONS, type Visibility } from "@/lib/connectCard";

const inp = "w-full font-[inherit] text-sm pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#0a1628] focus:ring-2 focus:ring-[#0a1628]/10 transition-all bg-white";
const lbl = "block text-xs font-bold text-[#0a1628] mb-1.5";
const STEP_LABELS = ["About You", "Contact", "Social & Services", "Design & Privacy", "Finish"];

interface LinkRow { label: string; url: string }

async function uploadImage(file: File, type: "avatar" | "logo"): Promise<string | null> {
  const fd = new FormData();
  fd.append("files", file);
  fd.append("type", type);
  const res = await fetch("/api/upload/profile", { method: "POST", body: fd });
  if (!res.ok) return null;
  const { urls } = await res.json() as { urls: string[] };
  return urls[0] ?? null;
}

// Anyone — no account required — can fill in every card detail below.
// An account (email + password) is only created at the very last step, right
// before activation, exactly like signing a form at the end instead of a
// gate at the door. Photos are held locally and uploaded once the account
// exists (uploads require a session), then everything is saved in one shot.
function ConnectWizard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const loggedIn = !!session;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [biz, setBiz] = useState({ professionalTitle: "", businessName: "", businessDescription: "" });
  const [contact, setContact] = useState({ phone: "", businessAddress: "", website: "", bookingUrl: "" });
  const [social, setSocial] = useState({ linkedIn: "", twitter: "", facebook: "" });
  const [serviceInput, setServiceInput] = useState("");
  const [services, setServices] = useState<string[]>([]);

  const [theme, setTheme] = useState("classic");
  const [visibility, setVisibility] = useState<Record<string, Visibility>>({
    phone: "PUBLIC", email: "PUBLIC", address: "PRIVATE", booking: "PUBLIC",
    website: "PUBLIC", social: "PUBLIC", services: "PUBLIC",
  });
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [linkDraft, setLinkDraft] = useState<LinkRow>({ label: "", url: "" });

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [account, setAccount] = useState({ email: "", password: "", confirmPassword: "" });

  // If already logged in with an activated card (e.g. re-tapping their own card), skip straight to it.
  useEffect(() => {
    if (isPending || !loggedIn) return;
    setName(n => n || session!.user.name || "");
    fetch("/api/dashboard/connect-card")
      .then(r => r.json())
      .then((d: { card: { username: string; isActivated: boolean } | null }) => {
        if (d.card?.isActivated) router.replace(`/connect/${d.card.username}`);
      })
      .catch(() => {});
  }, [isPending, loggedIn, session, router]);

  const checkUsername = useCallback(async (value: string) => {
    if (value.trim().length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/connect/check-username?username=${encodeURIComponent(value)}`);
      const data = await res.json() as { available: boolean };
      setUsernameStatus(data.available ? "ok" : "taken");
    } catch { setUsernameStatus("idle"); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (username) checkUsername(username); }, 400);
    return () => clearTimeout(t);
  }, [username, checkUsername]);

  const addLink = () => {
    if (!linkDraft.label.trim() || !linkDraft.url.trim()) return;
    if (links.length >= 6) return;
    setLinks([...links, linkDraft]);
    setLinkDraft({ label: "", url: "" });
  };

  const activate = async () => {
    setError("");
    if (usernameStatus !== "ok") { setError("Choose an available username first."); return; }
    if (!name.trim()) { setError("Please enter your name."); return; }

    if (!loggedIn) {
      if (!account.email.trim()) { setError("Please enter your email address."); return; }
      if (account.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (account.password !== account.confirmPassword) { setError("Passwords do not match."); return; }
    }

    setLoading(true);
    try {
      // Create the account only now, right before activation — not as a gate up front.
      let currentUserId = session?.user?.id;
      if (!loggedIn) {
        const res = await signUp.email({ email: account.email, password: account.password, name });
        if (res.error) { setError(res.error.message || "Could not create your account."); setLoading(false); return; }
        const me = await fetch("/api/user/me").then(r => r.ok ? r.json() as Promise<{ id?: string }> : null).catch(() => null);
        currentUserId = me?.id;
      }

      // Photos are uploaded now that a session exists.
      const [image, logoUrl] = await Promise.all([
        imageFile ? uploadImage(imageFile, "avatar") : Promise.resolve(null),
        logoFile ? uploadImage(logoFile, "logo") : Promise.resolve(null),
      ]);

      const res = await fetch("/api/connect/activate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username, name,
          image, logoUrl,
          headline: biz.professionalTitle,
          professionalTitle: biz.professionalTitle,
          businessName: biz.businessName,
          businessDescription: biz.businessDescription,
          phone: contact.phone,
          businessAddress: contact.businessAddress,
          website: contact.website,
          bookingUrl: contact.bookingUrl,
          linkedIn: social.linkedIn, twitter: social.twitter, facebook: social.facebook,
          theme,
          visibility,
          links,
        }),
      });
      const data = await res.json() as { username?: string; error?: string };
      if (!res.ok) { setError(data.error || "Could not activate your card."); setLoading(false); return; }

      // Best-effort: add quick services as ProService rows (used elsewhere on the full profile)
      if (currentUserId && services.length > 0) {
        await Promise.all(services.map(title =>
          fetch(`/api/pros/${currentUserId}/services`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          }).catch(() => {})
        ));
      }

      router.push(`/connect/${data.username}`);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const Nav = ({ back, next, nextLabel = "Continue" }: { back?: () => void; next?: () => void; nextLabel?: string }) => (
    <div className="flex justify-between pt-2">
      {back ? <button onClick={back} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 px-4 py-2.5"><ArrowLeft className="w-3.5 h-3.5" />Back</button> : <span />}
      {next && <button onClick={next} className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#1a3a6b] transition-all">{nextLabel} <ArrowRight className="w-4 h-4" /></button>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-[var(--font-urbanist,Urbanist),sans-serif] px-4 py-12">
      <div className="w-full max-w-[520px]">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image src="/logo.webp" alt="TaxCompPro" width={150} height={56} className="object-contain" style={{ width: "auto", height: "auto" }} loading="eager" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-[#d4a017]" />
            <h1 className="text-xl font-black text-[#0a1628]">Activate Your Connect Card</h1>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Fill in your card below — you'll only set up your login at the very last step.
          </p>

          <div className="flex items-center gap-1.5 mb-8">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-[#0a1628]" : "bg-slate-200"}`} />
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

          {/* Step 0: About You & Your Business */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative cursor-pointer"
                    onClick={() => document.getElementById("connect-avatar-input")?.click()}>
                    {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <Camera className="w-5 h-5 text-slate-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Profile photo</p>
                  <input id="connect-avatar-input" type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); }} />
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative cursor-pointer"
                    onClick={() => document.getElementById("connect-logo-input")?.click()}>
                    {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain" /> : <Briefcase className="w-5 h-5 text-slate-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Company logo</p>
                  <input id="connect-logo-input" type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }} />
                </div>
              </div>
              <div>
                <label className={lbl}>Full Name</label>
                <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className={inp} /></div>
              </div>
              <div>
                <label className={lbl}>Professional Title</label>
                <div className="relative"><Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={biz.professionalTitle} onChange={e => setBiz(b => ({ ...b, professionalTitle: e.target.value }))} placeholder="Enrolled Agent | Tax Resolution Expert" className={inp} /></div>
              </div>
              <div>
                <label className={lbl}>Business Name</label>
                <input value={biz.businessName} onChange={e => setBiz(b => ({ ...b, businessName: e.target.value }))} placeholder="Smith Tax Advisors" className={`${inp} pl-4`} />
              </div>
              <div>
                <label className={lbl}>Short Business Description</label>
                <textarea value={biz.businessDescription} onChange={e => setBiz(b => ({ ...b, businessDescription: e.target.value }))} rows={3} maxLength={280}
                  placeholder="What you do, who you help…" className={`${inp} pl-4 resize-none`} />
              </div>
              <Nav next={() => setStep(1)} />
            </div>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Phone</label>
                <div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} placeholder="(555) 123-4567" className={inp} /></div>
              </div>
              <div>
                <label className={lbl}>Business Address</label>
                <div className="relative"><MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={contact.businessAddress} onChange={e => setContact(c => ({ ...c, businessAddress: e.target.value }))} placeholder="City, State" className={inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Website</label>
                  <div className="relative"><Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={contact.website} onChange={e => setContact(c => ({ ...c, website: e.target.value }))} placeholder="https://…" className={inp} /></div>
                </div>
                <div>
                  <label className={lbl}>Booking Link</label>
                  <div className="relative"><Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={contact.bookingUrl} onChange={e => setContact(c => ({ ...c, bookingUrl: e.target.value }))} placeholder="https://calendly.com/…" className={inp} /></div>
                </div>
              </div>
              <Nav back={() => setStep(0)} next={() => setStep(2)} />
            </div>
          )}

          {/* Step 2: Social & Services */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Social Media Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={social.linkedIn} onChange={e => setSocial(s => ({ ...s, linkedIn: e.target.value }))} placeholder="LinkedIn URL" className={`${inp} pl-4 text-xs`} />
                  <input value={social.twitter} onChange={e => setSocial(s => ({ ...s, twitter: e.target.value }))} placeholder="Twitter / X" className={`${inp} pl-4 text-xs`} />
                  <input value={social.facebook} onChange={e => setSocial(s => ({ ...s, facebook: e.target.value }))} placeholder="Facebook URL" className={`${inp} pl-4 text-xs`} />
                </div>
              </div>
              <div>
                <label className={lbl}>Services You Offer</label>
                <div className="flex gap-2">
                  <input value={serviceInput} onChange={e => setServiceInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (serviceInput.trim()) { setServices([...services, serviceInput.trim()]); setServiceInput(""); } } }}
                    placeholder="e.g. Tax Resolution — press Enter" className={`${inp} pl-4`} />
                </div>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {services.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs font-semibold bg-[#0a1628]/8 text-[#0a1628] px-2.5 py-1 rounded-full">
                        {s}<button type="button" onClick={() => setServices(services.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Nav back={() => setStep(1)} next={() => setStep(3)} />
            </div>
          )}

          {/* Step 3: Design, Privacy & Links */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={lbl}>Page Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {CARD_THEMES.map(t => (
                    <button key={t.value} type="button" onClick={() => setTheme(t.value)}
                      className={`h-12 rounded-lg border-2 transition-all ${theme === t.value ? "border-[#d4a017] scale-105" : "border-transparent"}`}
                      style={{ background: t.bg }} title={t.label} />
                  ))}
                </div>
              </div>

              <div>
                <label className={lbl}>Who Can See What</label>
                <div className="space-y-1.5">
                  {(["phone", "email", "address", "booking", "website", "social", "services"] as const).map(field => (
                    <div key={field} className="flex items-center justify-between gap-2 text-xs">
                      <span className="capitalize font-semibold text-slate-600 w-20 shrink-0">{field}</span>
                      <div className="flex gap-1 flex-1">
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

              <div>
                <label className={lbl}>Custom Links (optional, Linktree-style)</label>
                <div className="space-y-1.5 mb-2">
                  {links.map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-[#0a1628]">{l.label}</span>
                      <button onClick={() => setLinks(links.filter((_, j) => j !== i))}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
                {links.length < 6 && (
                  <div className="flex gap-2">
                    <input value={linkDraft.label} onChange={e => setLinkDraft(d => ({ ...d, label: e.target.value }))} placeholder="Label" className={`${inp} pl-3 flex-1`} />
                    <input value={linkDraft.url} onChange={e => setLinkDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://…" className={`${inp} pl-3 flex-1`} />
                    <button type="button" onClick={addLink} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#0a1628] text-white"><Plus className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <Nav back={() => setStep(2)} next={() => setStep(4)} />
            </div>
          )}

          {/* Step 4: Username, account (if needed), Activate */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Choose Your Public Profile URL</label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0a1628] focus-within:ring-2 focus-within:ring-[#0a1628]/10">
                  <span className="pl-4 pr-1 text-sm text-slate-400 shrink-0">taxcomppro.com/connect/</span>
                  <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="jane-smith" className="flex-1 text-sm py-3 pr-3 outline-none min-w-0" />
                </div>
                <p className="text-xs mt-1.5 h-4">
                  {usernameStatus === "checking" && <span className="text-slate-400">Checking availability…</span>}
                  {usernameStatus === "ok" && <span className="text-emerald-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Available</span>}
                  {usernameStatus === "taken" && <span className="text-red-500">Already taken — try another</span>}
                </p>
              </div>

              {!loggedIn && (
                <>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-[#0a1628] mb-3">Set up your login (created only now, not before)</p>
                    <div className="space-y-3">
                      <div>
                        <label className={lbl}>Email Address</label>
                        <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="email" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} placeholder="you@example.com" className={inp} /></div>
                      </div>
                      <div>
                        <label className={lbl}>Password</label>
                        <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type={showPw ? "text" : "password"} value={account.password} onChange={e => setAccount(a => ({ ...a, password: e.target.value }))} placeholder="At least 8 characters" className={inp} />
                          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Confirm Password</label>
                        <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type={showPw ? "text" : "password"} value={account.confirmPassword} onChange={e => setAccount(a => ({ ...a, confirmPassword: e.target.value }))} placeholder="Repeat your password" className={inp} /></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Already have a TaxCompPro account? <Link href={`/login?next=/connect`} className="text-[#d4a017] font-bold hover:underline">Log in</Link> first — your details above will still be here.
                  </p>
                </>
              )}

              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                Activating creates your public Tap Card at <strong>/connect/{username || "your-username"}</strong> and
                a basic Marketplace profile at <strong>/pro/{username || "your-username"}</strong> — both from this
                one setup.
              </div>

              <Nav back={() => setStep(3)} />
              <div className="flex justify-end">
                <button onClick={activate} disabled={loading || usernameStatus !== "ok"}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] font-bold text-sm px-6 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(212,160,23,0.4)] transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Activate Card <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConnectActivationPage() {
  return (
    <Suspense>
      <ConnectWizard />
    </Suspense>
  );
}
