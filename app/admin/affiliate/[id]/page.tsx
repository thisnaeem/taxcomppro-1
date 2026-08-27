"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Sparkles,
  Loader2,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Send,
  AlertCircle,
  Sliders,
  Check,
} from "lucide-react";

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  tier: string;
  createdAt: string;
}

interface ReferralRecord {
  id: string;
  tier: string;
  commission: number;
  createdAt: string;
  referredUser: ReferredUser;
}

interface PayoutRecord {
  id: string;
  amount: number;
  method: string;
  details: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AffiliateData {
  id: string;
  userId: string;
  code: string;
  isActive: boolean;
  totalEarned: number;
  totalPaid: number;
  pendingBalance: number;
  customCommissionRate: number | null;
  customVip: number | null;
  customMarketplace: number | null;
  customPlus: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    tier: string;
    createdAt: string;
  };
  referrals: ReferralRecord[];
  payouts: PayoutRecord[];
  _count: {
    referrals: number;
    payouts: number;
  };
}

interface GlobalSettings {
  commissionVip: number;
  commissionMarketplace: number;
  commissionPlus: number;
  minPayoutAmount: number;
  cookieDays: number;
  programEnabled: boolean;
}

const statusBadgeStyles: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  APPROVED: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  PAID: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-300 border border-red-500/30",
};

const PRESET_RATES = [10, 15, 20, 25, 30, 35, 40, 50];

export default function AffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const affiliateId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<AffiliateData | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rate Editing State
  const [rateMode, setRateMode] = useState<"MASTER" | "TIER">("MASTER");
  const [rateInput, setRateInput] = useState<number | string>("");
  const [vipInput, setVipInput] = useState<number | string>("");
  const [mktInput, setMktInput] = useState<number | string>("");
  const [plusInput, setPlusInput] = useState<number | string>("");
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  // Manual Payout Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("PayPal");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [markPaidImmediate, setMarkPaidImmediate] = useState(true);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Status & Processing
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchAffiliate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/affiliate/affiliates/${affiliateId}`);
      if (!res.ok) {
        throw new Error("Failed to load affiliate details");
      }
      const json = await res.json();
      setData(json.affiliate);
      setGlobalSettings(json.globalSettings);

      // Initialize rate inputs
      if (json.affiliate.customCommissionRate !== null) {
        setRateInput(json.affiliate.customCommissionRate);
      } else {
        setRateInput("");
      }
      setVipInput(json.affiliate.customVip ?? "");
      setMktInput(json.affiliate.customMarketplace ?? "");
      setPlusInput(json.affiliate.customPlus ?? "");
    } catch (err: any) {
      setError(err.message || "Error loading affiliate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliate();
  }, [affiliateId]);

  // Adjust master rate
  const adjustRate = (delta: number) => {
    const current = typeof rateInput === "number" ? rateInput : parseFloat(rateInput as string) || 15;
    const next = Math.max(0, Math.min(100, parseFloat((current + delta).toFixed(1))));
    setRateInput(next);
  };

  // Save Commission Rates
  const handleSaveCommissionRate = async (resetToDefault = false) => {
    if (!data) return;
    setSavingRate(true);
    setError(null);
    try {
      const payload: Record<string, any> = {};

      if (resetToDefault) {
        payload.customCommissionRate = null;
        payload.customVip = null;
        payload.customMarketplace = null;
        payload.customPlus = null;
      } else if (rateMode === "MASTER") {
        payload.customCommissionRate =
          rateInput === "" || isNaN(Number(rateInput)) ? null : Number(rateInput);
        payload.customVip = null;
        payload.customMarketplace = null;
        payload.customPlus = null;
      } else {
        payload.customCommissionRate = null;
        payload.customVip = vipInput === "" ? null : Number(vipInput);
        payload.customMarketplace = mktInput === "" ? null : Number(mktInput);
        payload.customPlus = plusInput === "" ? null : Number(plusInput);
      }

      const res = await fetch(`/api/admin/affiliate/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update commission rate");
      }

      const updated = await res.json();
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      if (resetToDefault) {
        setRateInput("");
        setVipInput("");
        setMktInput("");
        setPlusInput("");
      }
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || "Failed to save rate");
    } finally {
      setSavingRate(false);
    }
  };

  // Toggle Affiliate Active Status
  const handleToggleActive = async () => {
    if (!data) return;
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/admin/affiliate/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !data.isActive }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData((prev) => (prev ? { ...prev, isActive: updated.isActive } : prev));
      }
    } finally {
      setTogglingStatus(false);
    }
  };

  // Create Manual Payout
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;
    setSubmittingPayout(true);
    try {
      const res = await fetch(`/api/admin/affiliate/affiliates/${affiliateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PAYOUT",
          amount: Number(payoutAmount),
          method: payoutMethod,
          details: payoutDetails || `Admin payout via ${payoutMethod}`,
          note: payoutNote,
          markAsPaid: markPaidImmediate,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to process payout");
      }

      setShowPayoutModal(false);
      setPayoutAmount("");
      setPayoutDetails("");
      setPayoutNote("");
      await fetchAffiliate();
    } catch (err: any) {
      setError(err.message || "Failed to issue payout");
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Update Individual Payout Status
  const handleUpdatePayoutStatus = async (payoutId: string, status: "APPROVED" | "PAID" | "REJECTED") => {
    setProcessingPayoutId(payoutId);
    try {
      const res = await fetch(`/api/admin/affiliate/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchAffiliate();
      }
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const copyReferralLink = () => {
    if (!data) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://taxcomppro.com";
    const link = `${origin}/register?ref=${data.code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 text-[#f0c040] animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Loading affiliate details…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Affiliate Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || "Unable to locate this affiliate account."}</p>
        <Link
          href="/admin/affiliate"
          className="inline-flex items-center gap-2 bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Affiliates
        </Link>
      </div>
    );
  }

  // Rate resolution for display
  const isCustomRate =
    data.customCommissionRate !== null ||
    data.customVip !== null ||
    data.customMarketplace !== null ||
    data.customPlus !== null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* ── TOP HEADER / BREADCRUMB ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/affiliate"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 transition-all shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{data.user.name}</h1>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  data.isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {data.isActive ? "Active Affiliate" : "Disabled"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{data.user.email}</span>
              <span>•</span>
              <span className="font-mono text-amber-400 font-bold">{data.code}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={copyReferralLink}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? "Link Copied!" : "Copy Referral Link"}
          </button>

          <button
            type="button"
            onClick={() => {
              setPayoutAmount(data.pendingBalance > 0 ? data.pendingBalance.toString() : "");
              setShowPayoutModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-400/20"
          >
            <DollarSign className="w-3.5 h-3.5" /> Issue Payout
          </button>

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={togglingStatus}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              data.isActive
                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {togglingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : data.isActive ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-semibold rounded-2xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Earned</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            ${data.totalEarned.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">All-time commissions</p>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Payout</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            ${data.pendingBalance.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ready to be paid out</p>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Paid</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ${data.totalPaid.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Processed payouts</p>
        </div>

        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Referrals</span>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">
            {data._count.referrals}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Paying members referred</p>
        </div>
      </div>

      {/* ── COMMISSION RATE CONTROLLER (INDIVIDUAL AFFILIATE OVERRIDE) ── */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="font-black text-lg text-white">Individual Commission Rate</h2>
              {isCustomRate ? (
                <span className="text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  Custom Override Active
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                  Using Global Program Default
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Increase or decrease the commission percentage specifically for this affiliate. Custom rates override the global default program settings.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRateMode("MASTER")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                rateMode === "MASTER" ? "bg-[#f0c040] text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Master Rate %
            </button>
            <button
              type="button"
              onClick={() => setRateMode("TIER")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                rateMode === "TIER" ? "bg-[#f0c040] text-slate-950 font-black shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Per-Tier Override
            </button>
          </div>
        </div>

        {rateMode === "MASTER" ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-6 bg-slate-900/60 p-5 rounded-2xl border border-white/5">
              {/* Stepper + Input */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustRate(-5)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Decrease 5%"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => adjustRate(-1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Decrease 1%"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    placeholder={
                      globalSettings
                        ? `Default (${globalSettings.commissionVip}%)`
                        : "15"
                    }
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="w-32 text-center text-2xl font-black bg-slate-800 border-2 border-amber-400/50 rounded-xl py-2 px-2 text-white outline-none focus:border-amber-400 transition-all shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-amber-400 text-lg pointer-events-none">
                    %
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustRate(1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Increase 1%"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustRate(5)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Increase 5%"
                >
                  +5%
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_RATES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRateInput(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        Number(rateInput) === p
                          ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimated Per-Sale Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">VIP Referral ($39.99/mo):</span>
                <strong className="text-emerald-400 font-black">
                  $
                  {(
                    (39.99 *
                      (rateInput !== ""
                        ? Number(rateInput)
                        : globalSettings?.commissionVip ?? 10)) /
                    100
                  ).toFixed(2)}{" "}
                  / mo
                </strong>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Marketplace ($79.99/mo):</span>
                <strong className="text-emerald-400 font-black">
                  $
                  {(
                    (79.99 *
                      (rateInput !== ""
                        ? Number(rateInput)
                        : globalSettings?.commissionMarketplace ?? 15)) /
                    100
                  ).toFixed(2)}{" "}
                  / mo
                </strong>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Plus ($129.99/mo):</span>
                <strong className="text-emerald-400 font-black">
                  $
                  {(
                    (129.99 *
                      (rateInput !== ""
                        ? Number(rateInput)
                        : globalSettings?.commissionPlus ?? 20)) /
                    100
                  ).toFixed(2)}{" "}
                  / mo
                </strong>
              </div>
            </div>
          </div>
        ) : (
          /* Per-Tier Override Form */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase">VIP Rate</label>
                <span className="text-[10px] text-slate-400">Global: {globalSettings?.commissionVip}%</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder={`Default (${globalSettings?.commissionVip ?? 10}%)`}
                  value={vipInput}
                  onChange={(e) => setVipInput(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase">Marketplace Rate</label>
                <span className="text-[10px] text-slate-400">Global: {globalSettings?.commissionMarketplace}%</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder={`Default (${globalSettings?.commissionMarketplace ?? 15}%)`}
                  value={mktInput}
                  onChange={(e) => setMktInput(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase">Marketplace Plus</label>
                <span className="text-[10px] text-slate-400">Global: {globalSettings?.commissionPlus}%</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder={`Default (${globalSettings?.commissionPlus ?? 20}%)`}
                  value={plusInput}
                  onChange={(e) => setPlusInput(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl py-2 px-3 text-sm font-black text-white outline-none focus:border-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/8">
          <button
            type="button"
            onClick={() => handleSaveCommissionRate(true)}
            disabled={savingRate || !isCustomRate}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Global Default Rates
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveCommissionRate(false)}
              disabled={savingRate}
              className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg ${
                rateSaved
                  ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                  : "bg-[#f0c040] hover:bg-amber-400 text-slate-950 shadow-amber-400/20"
              } disabled:opacity-60`}
            >
              {savingRate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : rateSaved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {savingRate ? "Saving…" : rateSaved ? "Saved Rate!" : "Save Commission Rate"}
            </button>
          </div>
        </div>
      </div>

      {/* ── REFERRAL CONVERSIONS & EARNINGS HISTORY TABLE ── */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Referred Members &amp; Earnings ({data.referrals.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every paying user referred through affiliate code <span className="font-mono text-amber-300 font-bold">{data.code}</span>
            </p>
          </div>
        </div>

        {data.referrals.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-slate-900/30">
            <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">No referral conversions yet.</p>
            <p className="text-slate-500 text-xs mt-1">When users upgrade with this affiliate code, they will be listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 text-slate-400 font-black uppercase tracking-wider">
                  <th className="pb-3 px-3">Referred User</th>
                  <th className="pb-3 px-3">Plan / Tier</th>
                  <th className="pb-3 px-3 text-right">Commission Earned</th>
                  <th className="pb-3 px-3 text-right">Date Referred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                          {ref.referredUser.image ? (
                            <img src={ref.referredUser.image} alt={ref.referredUser.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            ref.referredUser.name?.[0]?.toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{ref.referredUser.name}</div>
                          <div className="text-[11px] text-slate-400">{ref.referredUser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-700/60 text-slate-200 border border-white/10">
                        {ref.tier.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-emerald-400 font-black text-sm">
                        +${ref.commission.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {new Date(ref.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAYOUT HISTORY & MANAGEMENT TABLE ── */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Payout History ({data.payouts.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track requests, approvals, and processed payouts for this affiliate
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPayoutAmount(data.pendingBalance > 0 ? data.pendingBalance.toString() : "");
              setShowPayoutModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-400/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Record Payout
          </button>
        </div>

        {data.payouts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-slate-900/30">
            <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">No payout records yet.</p>
            <p className="text-slate-500 text-xs mt-1">When payouts are requested or issued, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.payouts.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-slate-900/60 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-black text-white">${p.amount.toFixed(2)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadgeStyles[p.status] || "bg-slate-700 text-slate-300"}`}>
                      {p.status}
                    </span>
                    <span className="text-xs text-slate-400">via {p.method}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span>{p.details}</span>
                    {p.note && <span className="italic ml-2 text-slate-500">({p.note})</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Requested on {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdatePayoutStatus(p.id, "APPROVED")}
                        disabled={processingPayoutId === p.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-500 text-slate-950 font-black text-xs hover:bg-blue-400 transition-all flex items-center gap-1 disabled:opacity-60"
                      >
                        {processingPayoutId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePayoutStatus(p.id, "PAID")}
                        disabled={processingPayoutId === p.id}
                        className="px-3 py-1.5 rounded-lg bg-[#f0c040] text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center gap-1 disabled:opacity-60"
                      >
                        {processingPayoutId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Mark as Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePayoutStatus(p.id, "REJECTED")}
                        disabled={processingPayoutId === p.id}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-bold text-xs hover:bg-red-500/30 border border-red-500/30 transition-all flex items-center gap-1 disabled:opacity-60"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}

                  {p.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdatePayoutStatus(p.id, "PAID")}
                      disabled={processingPayoutId === p.id}
                      className="px-4 py-2 rounded-xl bg-[#f0c040] text-slate-950 font-black text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 disabled:opacity-60 shadow-md shadow-amber-400/20"
                    >
                      {processingPayoutId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Mark as Paid &amp; Deduct Balance
                    </button>
                  )}

                  {p.status === "PAID" && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Paid Out
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ISSUE / CREATE PAYOUT MODAL ── */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white">Issue Affiliate Payout</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payout Amount (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm font-black text-white outline-none focus:border-amber-400"
                  />
                </div>
                {data.pendingBalance > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Current Pending Balance:{" "}
                    <strong className="text-amber-400 font-bold">${data.pendingBalance.toFixed(2)}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-amber-400"
                >
                  <option value="PayPal">PayPal</option>
                  <option value="Stripe">Stripe Direct</option>
                  <option value="Bank Transfer">ACH / Bank Wire</option>
                  <option value="Check">Paper Check</option>
                  <option value="Other">Other / Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Account / Transaction Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. PayPal email or transaction ref"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Admin Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly payout for referrals"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-800/60 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  id="markPaid"
                  checked={markPaidImmediate}
                  onChange={(e) => setMarkPaidImmediate(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#f0c040]"
                />
                <label htmlFor="markPaid" className="text-xs text-slate-300 font-bold cursor-pointer">
                  Mark as Paid immediately and deduct from pending balance
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-6 py-2.5 rounded-xl bg-[#f0c040] hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 disabled:opacity-60"
                >
                  {submittingPayout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {submittingPayout ? "Processing…" : "Submit Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
