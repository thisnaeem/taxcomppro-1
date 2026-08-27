"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import {
  Copy01Icon, Tick02Icon, DollarCircleIcon, UserGroupIcon,
  ArrowUp05Icon, Clock01Icon, Cancel01Icon, MoneyReceive01Icon,
  LinkSquare01Icon, ChartBarLineIcon,
} from "hugeicons-react";
import { Gift, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Profile { id:string; code:string; isActive:boolean; totalEarned:number; totalPaid:number; pendingBalance:number; createdAt:string; }
interface Settings { commissionVip:number; commissionMarketplace:number; commissionPlus:number; minPayoutAmount:number; cookieDays:number; programEnabled:boolean; }
interface Referral { id:string; tier:string; commission:number; createdAt:string; referredUser:{ name:string; email:string; }; }
interface Payout  { id:string; amount:number; method:string; status:string; note:string|null; createdAt:string; }

const tierColors: Record<string,string> = { VIP:"bg-amber-100 text-amber-700", MARKETPLACE:"bg-blue-100 text-blue-700", MARKETPLACE_PLUS:"bg-emerald-100 text-emerald-700" };
const statusColors:Record<string,string> = { PENDING:"bg-amber-100 text-amber-700", APPROVED:"bg-blue-100 text-blue-700", REJECTED:"bg-red-100 text-red-600", PAID:"bg-emerald-100 text-emerald-700" };

function ago(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; }

const FAQS = [
  { q:"How do I get paid?", a:"Once your pending balance reaches the minimum payout threshold, you can request a payout via PayPal, bank transfer, or check. Payouts are reviewed within 3–5 business days." },
  { q:"How long does the tracking cookie last?", a:"Your referral cookie lasts 30 days. If someone clicks your link and upgrades within 30 days, you earn the commission even if they don't upgrade immediately." },
  { q:"Who can join the affiliate program?", a:"Any registered TaxCompPro member can join the affiliate program — whether you're a tax professional, student, or community member." },
  { q:"When do commissions become payable?", a:"Commissions are credited after a successful upgrade and a 7-day hold period to account for refunds. They then appear in your pending balance." },
  { q:"Is there a limit to how much I can earn?", a:"No limits! Refer as many people as you want. The more upgrades you drive, the more you earn." },
];

export default function AffiliatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile,   setProfile]   = useState<Profile|null>(null);
  const [settings,  setSettings]  = useState<Settings|null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts,   setPayouts]   = useState<Payout[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activating,setActivating]= useState(false);
  const [copied,    setCopied]    = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [amount,    setAmount]    = useState("");
  const [details,   setDetails]   = useState("");
  const [method,    setMethod]    = useState("paypal");
  const [submitting,setSubmitting]= useState(false);
  const [formError, setFormError] = useState("");
  const [openFaq,   setOpenFaq]   = useState<number|null>(null);

  const refLink = typeof window!=="undefined" && profile ? `${window.location.origin}/upgrade?ref=${profile.code}` : "";

  useEffect(()=>{
    fetch("/api/affiliate").then(r=>r.json()).then(async d=>{
      if (d.settings) setSettings(d.settings);
      if(d.profile){ setProfile(d.profile);
        const [stats,pays]=await Promise.all([fetch("/api/affiliate/stats").then(r=>r.json()),fetch("/api/affiliate/payout").then(r=>r.json())]);
        if(stats?.referrals) setReferrals(stats.referrals);
        if(Array.isArray(pays)) setPayouts(pays);
      }
    }).finally(()=>setLoading(false));
  },[]);

  const activate=async()=>{
    if (!session?.user) {
      router.push("/register?next=/affiliate");
      return;
    }
    setActivating(true);
    const r=await fetch("/api/affiliate",{method:"POST"});
    if(r.ok) setProfile(await r.json());
    setActivating(false);
  };
  const copy=()=>{ navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const submitPayout=async(e:React.FormEvent)=>{ e.preventDefault(); setSubmitting(true); setFormError("");
    const r=await fetch("/api/affiliate/payout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:parseFloat(amount),method,details})});
    const d=await r.json();
    if(r.ok){ setPayouts(p=>[d,...p]); setShowForm(false); setAmount(""); setDetails(""); setProfile(p=>p?{...p,pendingBalance:p.pendingBalance-parseFloat(amount)}:p); }
    else setFormError(d.error??"Failed");
    setSubmitting(false);
  };

  if(loading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#d4a017] animate-spin"/></div>;
  if(!settings?.programEnabled) return (
    <div className="max-w-xl mx-auto text-center py-20">
      <Cancel01Icon className="w-12 h-12 text-slate-200 mx-auto mb-4"/>
      <h1 className="text-2xl font-black text-[#0a1628] mb-2">Program Unavailable</h1>
      <p className="text-slate-500 text-sm">The affiliate program is currently paused.</p>
    </div>
  );

  /* ── LANDING PAGE (not yet activated) ── */
  if (!profile) return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"30px 30px"}}/>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <Gift className="w-4 h-4"/> Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
            Earn Real Money<br/>Sharing TaxCompPro
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
            Refer colleagues, clients, or followers to TaxCompPro and earn up to <span className="text-amber-400 font-black">{settings?.commissionPlus ?? 20}% commission</span> on every successful upgrade — automatically, every month.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
            {[
              { label: "Max Commission", val: `${settings?.commissionPlus ?? 20}%` },
              { label: "Cookie Duration", val: `${settings?.cookieDays ?? 30} days` },
              { label: "Min Payout", val: `$${settings?.minPayoutAmount ?? 50}` },
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-center backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-400">{s.val}</div>
                <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={activate} disabled={activating}
            className="inline-flex items-center gap-2 bg-[#f0c040] text-[#0a1628] font-black px-10 py-4 rounded-2xl hover:bg-[#d4a017] transition-all disabled:opacity-60 text-lg shadow-2xl shadow-amber-900/40">
            {activating?<Loader2 className="w-5 h-5 animate-spin"/>:<ArrowUp05Icon className="w-5 h-5"/>}
            {activating ? "Activating…" : "Activate My Account — It's Free"}
          </button>
          <p className="text-white/40 text-xs mt-4">No fees. No approval needed. Start earning immediately.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* How it works */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#0a1628]">How It Works</h2>
            <p className="text-slate-500 text-sm mt-1">Three simple steps to start earning</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step:"1", icon:"🔗", title:"Get Your Link", desc:"Activate your account and instantly receive a unique referral link tied to your account." },
              { step:"2", icon:"📣", title:"Share It", desc:"Share your link on social media, email newsletters, your website, or directly with clients and colleagues." },
              { step:"3", icon:"💵", title:"Earn Commissions", desc:"When someone upgrades through your link within 30 days, you earn a commission — paid out on request." },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl border border-slate-100 p-6 text-center hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#0a1628] text-white font-black text-lg flex items-center justify-center mx-auto mb-4">{s.step}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-black text-[#0a1628] mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commission rates */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#0a1628]">Commission Structure</h2>
            <p className="text-slate-500 text-sm mt-1">Earn more when your referrals choose higher plans</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { tier:"VIP", price:39.99, rate:settings?.commissionVip??10, color:"from-slate-700 to-slate-900", badge:"bg-slate-100 text-slate-700", features:["Community access","Pro Talk access","Member badge"] },
              { tier:"Marketplace", price:79.99, rate:settings?.commissionMarketplace??15, color:"from-blue-600 to-blue-800", badge:"bg-blue-100 text-blue-700", features:["Everything in VIP","Marketplace listings","Priority support"] },
              { tier:"Marketplace Plus", price:129.99, rate:settings?.commissionPlus??20, color:"from-amber-500 to-orange-600", badge:"bg-amber-100 text-amber-700", features:["Everything in Marketplace","Premium analytics","Dedicated account manager"], highlight:true },
            ].map(p => (
              <div key={p.tier} className={`rounded-2xl overflow-hidden border-2 ${p.highlight?"border-amber-400 shadow-lg shadow-amber-100":"border-slate-100"}`}>
                <div className={`bg-gradient-to-br ${p.color} p-5 text-white`}>
                  {p.highlight && <div className="text-[10px] font-black bg-amber-400 text-[#0a1628] px-2 py-0.5 rounded-full inline-block mb-2">BEST COMMISSION</div>}
                  <div className="text-xl font-black">{p.tier}</div>
                  <div className="text-3xl font-black mt-1">${(p.price*p.rate/100).toFixed(2)}<span className="text-base font-normal opacity-60">/referral</span></div>
                  <div className="text-white/60 text-xs mt-1">{p.rate}% of ${p.price}/mo plan</div>
                </div>
                <div className="p-4 space-y-2">
                  {p.features.map(f=>(
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why join */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-[#0a1628]">Why Affiliates Love Us</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon:"⚡", title:"Instant Activation", desc:"No application process. Activate your link in seconds and start sharing immediately." },
              { icon:"📊", title:"Real-Time Dashboard", desc:"Track every click, conversion, and commission in your personal affiliate dashboard." },
              { icon:"🍪", title:"30-Day Cookie", desc:"Your referral is tracked for 30 days, giving your referrals plenty of time to decide." },
              { icon:"💳", title:"Flexible Payouts", desc:"Cash out via PayPal, bank transfer, or check once you hit the minimum threshold." },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-[#0a1628] text-sm mb-1">{f.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-[#0a1628]">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map((faq,i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-bold text-[#0a1628] text-sm hover:bg-slate-50 transition-all">
                  {faq.q}
                  {openFaq===i?<ChevronUp className="w-4 h-4 text-slate-400 shrink-0"/>:<ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>}
                </button>
                {openFaq===i && <div className="px-6 pb-5 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-3">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-3xl p-10 text-white text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-black mb-3">Ready to Start Earning?</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto text-sm leading-relaxed">Join hundreds of tax professionals already earning passive income by referring clients and colleagues to TaxCompPro.</p>
          <button onClick={activate} disabled={activating}
            className="inline-flex items-center gap-2 bg-[#f0c040] text-[#0a1628] font-black px-10 py-4 rounded-2xl hover:bg-[#d4a017] transition-all disabled:opacity-60 text-lg shadow-xl">
            {activating?<Loader2 className="w-5 h-5 animate-spin"/>:<ArrowUp05Icon className="w-5 h-5"/>}
            {activating?"Activating…":"Activate My Account — Free"}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── ACTIVATED DASHBOARD ── */
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16 pt-8">
      <div><h1 className="text-2xl font-black text-[#0a1628]">Affiliate Program</h1><p className="text-slate-500 text-sm mt-0.5">Earn commissions when anyone upgrades via your link.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Total Earned",    val:`$${profile.totalEarned.toFixed(2)}`,    Icon:DollarCircleIcon,  from:"from-emerald-400", to:"to-emerald-600", sub:"lifetime commissions"},
          {label:"Pending Balance", val:`$${profile.pendingBalance.toFixed(2)}`, Icon:MoneyReceive01Icon, from:"from-amber-400",   to:"to-orange-500",  sub:"awaiting payout"},
          {label:"Referrals",       val:referrals.length.toString(),              Icon:UserGroupIcon,      from:"from-blue-400",   to:"to-blue-600",    sub:"total conversions"},
          {label:"Total Paid Out",  val:`$${profile.totalPaid.toFixed(2)}`,      Icon:ChartBarLineIcon,  from:"from-purple-400", to:"to-purple-600",  sub:"all time paid"},
        ].map(s=>(
          <div key={s.label} className={`bg-gradient-to-br ${s.from} ${s.to} rounded-2xl p-5 flex flex-col justify-between gap-4 min-h-[130px]`}>
            <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center"><s.Icon className="w-5 h-5 text-white"/></div>
            <div>
              <div className="text-2xl font-black text-white">{s.val}</div>
              <div className="text-white/90 text-xs font-semibold mt-0.5">{s.label}</div>
              <div className="text-white/50 text-[10px] mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-black text-[#0a1628] mb-3">Your Referral Link</h2>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 font-mono truncate">{refLink}</div>
              <button onClick={copy} className={`px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${copied?"bg-emerald-500 text-white":"bg-[#0a1628] text-white hover:bg-[#1a3a6b]"}`}>
                {copied?<><Tick02Icon className="w-4 h-4"/>Copied!</>:<><Copy01Icon className="w-4 h-4"/>Copy</>}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Cookie lasts {settings?.cookieDays??30} days.</p>
          </div>
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-black text-[#0a1628] mb-4">Referrals</h2>
            {referrals.length===0?(
              <div className="text-center py-8"><UserGroupIcon className="w-8 h-8 text-slate-200 mx-auto mb-2"/><p className="text-slate-400 text-sm">No referrals yet.</p></div>
            ):(
              <div className="space-y-2">{referrals.map(r=>(
                <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-[#0a1628] text-white font-bold text-sm flex items-center justify-center shrink-0">{r.referredUser.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><div className="font-semibold text-[#0a1628] text-sm truncate">{r.referredUser.name}</div><div className="text-xs text-slate-400">{r.referredUser.email}</div></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierColors[r.tier]??"bg-slate-100 text-slate-500"}`}>{r.tier.replace("_"," ")}</span>
                    <span className="text-sm font-black text-emerald-500">+${r.commission.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">{ago(r.createdAt)}</span>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-black text-[#0a1628] mb-4">Payout History</h2>
            {payouts.length===0?<p className="text-center text-slate-400 text-sm py-6">No payouts yet.</p>:(
              <div className="space-y-2">{payouts.map(p=>(
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#0a1628] text-sm">${p.amount.toFixed(2)} · {p.method}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock01Icon className="w-3 h-3"/>{ago(p.createdAt)}{p.note&&<span className="ml-1">· {p.note}</span>}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[p.status]??"bg-slate-100 text-slate-500"}`}>{p.status}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5">
            <h2 className="font-black text-[#0a1628] mb-4">Commission Rates</h2>
            <div className="space-y-2">
              {[
                {label:"VIP",             rate:settings?.commissionVip??10,         price:39.99},
                {label:"Marketplace",     rate:settings?.commissionMarketplace??15, price:79.99},
                {label:"Marketplace Plus",rate:settings?.commissionPlus??20,        price:129.99},
              ].map(r=>(
                <div key={r.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div><div className="text-sm font-bold text-[#0a1628]">{r.label}</div><div className="text-xs text-slate-400">${r.price}/mo</div></div>
                  <div className="text-right"><div className="text-sm font-black text-emerald-500">{r.rate}%</div><div className="text-xs text-slate-400">~${(r.price*r.rate/100).toFixed(2)}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0a1628] rounded-2xl p-5 text-white">
            <h2 className="font-black mb-1">Request Payout</h2>
            <p className="text-white/60 text-xs mb-4">Min ${settings?.minPayoutAmount??50}. Balance: <strong className="text-[#f0c040]">${profile.pendingBalance.toFixed(2)}</strong></p>
            {!showForm?(
              <button onClick={()=>setShowForm(true)} disabled={profile.pendingBalance<(settings?.minPayoutAmount??50)}
                className="w-full bg-[#f0c040] text-[#0a1628] font-black py-2.5 rounded-xl text-sm hover:bg-[#d4a017] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {profile.pendingBalance<(settings?.minPayoutAmount??50)?`Need $${((settings?.minPayoutAmount??50)-profile.pendingBalance).toFixed(2)} more`:"Request Payout"}
              </button>
            ):(
              <form onSubmit={submitPayout} className="space-y-3">
                {formError&&<p className="text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2">{formError}</p>}
                <input type="number" step="0.01" min="1" max={profile.pendingBalance} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Max $${profile.pendingBalance.toFixed(2)}`} required className="w-full bg-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm outline-none"/>
                <select value={method} onChange={e=>setMethod(e.target.value)} className="w-full bg-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="paypal">PayPal</option><option value="bank">Bank Transfer</option><option value="check">Check</option>
                </select>
                <input type="text" value={details} onChange={e=>setDetails(e.target.value)} placeholder="PayPal email / account info" required className="w-full bg-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm outline-none"/>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="flex-1 bg-[#f0c040] text-[#0a1628] font-black py-2.5 rounded-xl text-sm hover:bg-[#d4a017] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting&&<Loader2 className="w-4 h-4 animate-spin"/>} Submit
                  </button>
                  <button type="button" onClick={()=>{setShowForm(false);setFormError("");}} className="px-4 py-2.5 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-all">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
