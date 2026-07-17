"use client";

import { useEffect, useState } from "react";  
import { Loader2 } from "lucide-react";
import {
  Settings01Icon, UserGroupIcon, DollarCircleIcon, Tick02Icon,
  Cancel01Icon, Clock01Icon, ToggleOnIcon, ToggleOffIcon,
} from "hugeicons-react";

interface Settings { id:string; commissionVip:number; commissionMarketplace:number; commissionPlus:number; minPayoutAmount:number; cookieDays:number; programEnabled:boolean; }
interface Affiliate { id:string; code:string; isActive:boolean; totalEarned:number; pendingBalance:number; totalPaid:number; user:{name:string;email:string;image:string|null;}; _count:{referrals:number;payouts:number;}; }
interface Payout { id:string; amount:number; method:string; details:string; status:string; note:string|null; createdAt:string; affiliate:{user:{name:string;email:string;}}; }

const statusColors:Record<string,string>={ PENDING:"bg-amber-100 text-amber-700", APPROVED:"bg-blue-100 text-blue-700", REJECTED:"bg-red-100 text-red-600", PAID:"bg-emerald-100 text-emerald-700" };
function ago(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; }

export default function AdminAffiliatePage() {
  const [settings,    setSettings]    = useState<Settings|null>(null);
  const [affiliates,  setAffiliates]  = useState<Affiliate[]>([]);
  const [payouts,     setPayouts]     = useState<Payout[]>([]);
  const [tab,         setTab]         = useState<"settings"|"affiliates"|"payouts">("settings");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [payoutNotes, setPayoutNotes] = useState<Record<string,string>>({});
  const [processing,  setProcessing]  = useState<string|null>(null);

  useEffect(()=>{
    Promise.all([
      fetch("/api/admin/affiliate").then(r=>r.json()),
      fetch("/api/admin/affiliate/affiliates").then(r=>r.json()),
      fetch("/api/admin/affiliate/payouts").then(r=>r.json()),
    ]).then(([s,a,p])=>{ setSettings(s); setAffiliates(a); setPayouts(p); }).finally(()=>setLoading(false));
  },[]);

  const saveSettings=async()=>{
    if(!settings) return;
    setSaving(true);
    const r=await fetch("/api/admin/affiliate",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(settings)});
    if(r.ok){ setSaved(true); setTimeout(()=>setSaved(false),2000); }
    setSaving(false);
  };

  const updatePayout=async(id:string,status:string)=>{
    setProcessing(id);
    const r=await fetch(`/api/admin/affiliate/payouts/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,note:payoutNotes[id]??""})});
    if(r.ok){ setPayouts(p=>p.map(x=>x.id===id?{...x,status,note:payoutNotes[id]??x.note}:x)); }
    setProcessing(null);
  };

  if(loading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#d4a017] animate-spin"/></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      <div><h1 className="text-2xl font-black text-[#0a1628]">Affiliate Management</h1><p className="text-slate-500 text-sm mt-0.5">Configure the program and manage payouts.</p></div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 w-fit">
        {(["settings","affiliates","payouts"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab===t?"bg-[#0a1628] text-white":"text-slate-500 hover:text-[#0a1628]"}`}>{t}</button>
        ))}
      </div>

      {/* Settings tab */}
      {tab==="settings" && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <h2 className="font-black text-[#0a1628] flex items-center gap-2"><Settings01Icon className="w-4 h-4"/>Program Settings</h2>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div><div className="font-bold text-[#0a1628] text-sm">Program Enabled</div><div className="text-xs text-slate-400">Allow users to join the affiliate program</div></div>
              <button onClick={()=>setSettings(s=>s?{...s,programEnabled:!s.programEnabled}:s)}>
                {settings.programEnabled?<ToggleOnIcon className="w-8 h-8 text-emerald-500"/>:<ToggleOffIcon className="w-8 h-8 text-slate-300"/>}
              </button>
            </div>
            {[
              {key:"minPayoutAmount",label:"Min Payout ($)",       min:1,   max:500,  step:1   },
              {key:"cookieDays",     label:"Cookie Duration (days)",min:1,   max:365,  step:1   },
            ].map(f=>(
              <div key={f.key}>
                <label className="text-xs font-bold text-slate-500 mb-1 block">{f.label}</label>
                <input type="number" min={f.min} max={f.max} step={f.step}
                  value={(settings as unknown as Record<string,number|boolean|string>)[f.key] as number}
                  onChange={e=>setSettings(s=>s?{...s,[f.key]:parseFloat(e.target.value)}:s)}
                  className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-bold text-[#0a1628] outline-none focus:ring-2 focus:ring-[#0a1628]/20"/>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <h2 className="font-black text-[#0a1628] flex items-center gap-2"><DollarCircleIcon className="w-4 h-4"/>Commission Rates (%)</h2>
            {[
              {key:"commissionVip",         label:"VIP (10% default)",              price:39.99 },
              {key:"commissionMarketplace",  label:"Marketplace (15% default)",      price:79.99 },
              {key:"commissionPlus",         label:"Marketplace Plus (20% default)", price:109.99},
            ].map(f=>(
              <div key={f.key} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-[#0a1628]">{f.label}</label>
                  <span className="text-xs text-slate-400">${f.price}/mo → <strong className="text-emerald-500">${(f.price*((settings as unknown as Record<string,number>)[f.key]??10)/100).toFixed(2)}</strong></span>
                </div>
                <input type="range" min={1} max={50} step={0.5}
                  value={(settings as unknown as Record<string,number>)[f.key]}
                  onChange={e=>setSettings(s=>s?{...s,[f.key]:parseFloat(e.target.value)}:s)}
                  className="w-full accent-[#d4a017]"/>
                <div className="text-right text-sm font-black text-[#d4a017] mt-1">{(settings as unknown as Record<string,number>)[f.key]}%</div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button onClick={saveSettings} disabled={saving}
              className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${saved?"bg-emerald-500 text-white":"bg-[#0a1628] text-white hover:bg-[#1a3a6b]"} disabled:opacity-60`}>
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:saved?<><Tick02Icon className="w-4 h-4"/>Saved!</>:null}
              {!saving&&!saved?"Save Settings":saving?"Saving…":null}
            </button>
          </div>
        </div>
      )}

      {/* Affiliates tab */}
      {tab==="affiliates" && (
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-black text-[#0a1628] mb-4 flex items-center gap-2"><UserGroupIcon className="w-4 h-4"/>All Affiliates ({affiliates.length})</h2>
          {affiliates.length===0 ? <p className="text-center text-slate-400 py-8 text-sm">No affiliates yet.</p> : (
            <div className="space-y-2">
              {affiliates.map(a=>(
                <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-[#0a1628] text-white font-bold text-sm flex items-center justify-center shrink-0">{a.user.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#0a1628] text-sm truncate">{a.user.name}</div>
                    <div className="text-xs text-slate-400">{a.user.email} · <span className="font-mono">{a.code}</span></div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div><div className="text-xs text-slate-400">Referrals</div><div className="font-black text-[#0a1628] text-sm">{a._count.referrals}</div></div>
                    <div><div className="text-xs text-slate-400">Earned</div><div className="font-black text-emerald-500 text-sm">${a.totalEarned.toFixed(2)}</div></div>
                    <div><div className="text-xs text-slate-400">Pending</div><div className="font-black text-amber-500 text-sm">${a.pendingBalance.toFixed(2)}</div></div>
                    <div><div className="text-xs text-slate-400">Paid</div><div className="font-black text-[#0a1628] text-sm">${a.totalPaid.toFixed(2)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payouts tab */}
      {tab==="payouts" && (
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-black text-[#0a1628] mb-4 flex items-center gap-2"><DollarCircleIcon className="w-4 h-4"/>Payout Requests ({payouts.length})</h2>
          {payouts.length===0 ? <p className="text-center text-slate-400 py-8 text-sm">No payout requests.</p> : (
            <div className="space-y-3">
              {payouts.map(p=>(
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0a1628] text-white font-bold text-sm flex items-center justify-center shrink-0">{p.affiliate.user.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#0a1628] text-sm">{p.affiliate.user.name} · <span className="text-emerald-600">${p.amount.toFixed(2)}</span> via {p.method}</div>
                      <div className="text-xs text-slate-400">{p.details} · <Clock01Icon className="w-3 h-3 inline"/>{ago(p.createdAt)}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusColors[p.status]??"bg-slate-100 text-slate-500"}`}>{p.status}</span>
                  </div>
                  {p.status==="PENDING" && (
                    <div className="flex gap-2 items-center">
                      <input type="text" placeholder="Optional note…" value={payoutNotes[p.id]??""} onChange={e=>setPayoutNotes(n=>({...n,[p.id]:e.target.value}))}
                        className="flex-1 bg-white rounded-xl px-3 py-2 text-xs outline-none border border-slate-200"/>
                      <button onClick={()=>updatePayout(p.id,"APPROVED")} disabled={processing===p.id} className="flex items-center gap-1 text-xs font-bold bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-60">
                        {processing===p.id?<Loader2 className="w-3 h-3 animate-spin"/>:<Tick02Icon className="w-3 h-3"/>} Approve
                      </button>
                      <button onClick={()=>updatePayout(p.id,"REJECTED")} disabled={processing===p.id} className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-500 px-3 py-2 rounded-xl hover:bg-red-100 transition-all disabled:opacity-60">
                        <Cancel01Icon className="w-3 h-3"/> Reject
                      </button>
                    </div>
                  )}
                  {p.status==="APPROVED" && (
                    <button onClick={()=>updatePayout(p.id,"PAID")} disabled={processing===p.id} className="flex items-center gap-1 text-xs font-bold bg-[#0a1628] text-white px-3 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-60">
                      {processing===p.id?<Loader2 className="w-3 h-3 animate-spin"/>:<Tick02Icon className="w-3 h-3"/>} Mark as Paid
                    </button>
                  )}
                  {p.note && <p className="text-xs text-slate-400 italic">{p.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
