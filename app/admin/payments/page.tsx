"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  RefreshCw,
  BarChart3,
  Calendar,
  Eye,
  Gift,
  KeyRound,
  Shield,
  Briefcase,
  Crown,
  Check,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Lock,
  EyeOff,
  Copy,
  User as UserIcon,
} from "lucide-react";
import { AdminMemberProfileDrawer } from "@/components/profile/AdminMemberProfileDrawer";

const PLAN_PRICE: Record<string, number> = {
  FREE: 0,
  VIP: 29,
  MARKETPLACE: 49,
  MARKETPLACE_PLUS: 99,
};

const PLAN_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  FREE:             { bg: "bg-slate-700/50",     text: "text-slate-300",   dot: "bg-slate-400" },
  VIP:              { bg: "bg-amber-400/15",      text: "text-amber-300",   dot: "bg-amber-400" },
  MARKETPLACE:      { bg: "bg-blue-400/15",       text: "text-blue-300",    dot: "bg-blue-400" },
  MARKETPLACE_PLUS: { bg: "bg-emerald-400/15",    text: "text-emerald-300", dot: "bg-emerald-400" },
};

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-emerald-400/15 text-emerald-300",
  canceled: "bg-red-400/15 text-red-300",
  past_due: "bg-amber-400/15 text-amber-300",
  paid:     "bg-emerald-400/15 text-emerald-300",
};

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  nextBilling: string | null;
  createdAt: string;
  stripeSubscriptionId: string | null;
  user: { id: string; name: string; email: string; image: string | null; tier: string };
}

interface Transaction {
  id: string;
  userId: string;
  toolkitId: string;
  productName: string;
  amount: number;
  status: string;
  stripeSessionId: string | null;
  membershipGranted: boolean;
  membershipTier: string | null;
  membershipMonths: number | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null; tier: string };
}

interface PaymentData {
  subscriptions: Subscription[];
  transactions: Transaction[];
  tierBreakdown: { plan: string; count: number; monthlyRevenue: number }[];
  totalMRR: number;
  totalARR: number;
  activeCount: number;
  canceledCount: number;
  totalCount: number;
  monthlyRevenue: { month: string; revenue: number; count: number }[];
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatBillingDate(d: string | null) {
  if (!d) return { date: "Monthly Renewal", rel: "Active" };
  const target = new Date(d);
  if (isNaN(target.getTime())) return { date: "Monthly Renewal", rel: "Active" };

  const dateStr = target.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const diffDays = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { date: dateStr, rel: "Due today" };
  if (diffDays === 1) return { date: dateStr, rel: "Tomorrow" };
  if (diffDays < 30) return { date: dateStr, rel: `in ${diffDays} days` };
  const months = Math.round(diffDays / 30);
  return { date: dateStr, rel: `in ${months} mo${months > 1 ? "s" : ""}` };
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  badge,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  gradient: string;
  badge?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${gradient} relative overflow-hidden shadow-lg`}>
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/15 rounded-xl p-2.5">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <span className="bg-white/20 text-white/80 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-white/60 text-xs mt-0.5">{label}</div>
      <div className="text-white/35 text-[11px] mt-1">{sub}</div>
    </div>
  );
}

function ConfirmCancelModal({
  name,
  plan,
  onConfirm,
  onClose,
  loading,
}: {
  name: string;
  plan: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1e33] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-white font-black text-lg mb-1">Cancel Subscription</h3>
        <p className="text-slate-400 text-sm mb-2">
          You're about to cancel <strong className="text-white">{name}</strong>'s{" "}
          <strong className="text-amber-300">{plan}</strong> subscription.
        </p>
        <p className="text-slate-500 text-xs mb-5">
          Their account will be downgraded to <strong className="text-white">FREE</strong> immediately.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all"
          >
            Keep Active
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-black transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {loading ? "Canceling…" : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "transactions">("subscriptions");
  const [subFilter, setSubFilter] = useState<"all" | "active" | "canceled">("all");
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Detailed profile drawer state
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  // Membership Gifting state
  const [userToAddMembership, setUserToAddMembership] = useState<any>(null);
  const [giftMonths, setGiftMonths] = useState<number>(1);
  const [giftTier, setGiftTier] = useState<string>("VIP");
  const [giftingMembership, setGiftingMembership] = useState(false);
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);
  const [giftError, setGiftError] = useState<string | null>(null);

  // Password reset state
  const [userToResetPassword, setUserToResetPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    const res = await fetch(`/api/admin/payments/${cancelTarget.id}/cancel`, { method: "PATCH" });
    if (res.ok) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              subscriptions: prev.subscriptions.map((s) =>
                s.id === cancelTarget.id ? { ...s, status: "canceled", user: { ...s.user, tier: "FREE" } } : s
              ),
              activeCount: prev.activeCount - 1,
              canceledCount: prev.canceledCount + 1,
              totalMRR: prev.totalMRR - (PLAN_PRICE[cancelTarget.plan] ?? 0),
              totalARR: prev.totalARR - (PLAN_PRICE[cancelTarget.plan] ?? 0) * 12,
            }
          : prev
      );
    }
    setCancelLoading(false);
    setCancelTarget(null);
  };

  const handleOpenGiftModal = (u: any) => {
    setUserToAddMembership(u);
    setGiftMonths(1);
    setGiftTier(u?.tier !== "FREE" ? u?.tier : "VIP");
    setGiftSuccess(null);
    setGiftError(null);
  };

  const handleGiftMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToAddMembership) return;
    setGiftingMembership(true);
    setGiftError(null);
    setGiftSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userToAddMembership.id}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: giftMonths, tier: giftTier }),
      });
      const resData = await res.json();
      if (res.ok) {
        setGiftSuccess(resData.message || "Free membership months added successfully!");
        fetchData();
      } else {
        setGiftError(resData.error || "Failed to add free membership months.");
      }
    } catch {
      setGiftError("Network error while adding free membership months.");
    } finally {
      setGiftingMembership(false);
    }
  };

  const handleOpenResetModal = (u: any) => {
    setUserToResetPassword(u);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setResetSuccess(null);
    setResetError(null);
    setCopiedCredentials(false);
  };

  const generateRandomPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%&*";
    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];
    const all = upper + lower + digits + symbols;
    for (let i = 4; i < 12; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    const shuffled = pwd
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
    setNewPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowPassword(true);
    setResetError(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPassword) return;
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResettingPassword(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userToResetPassword.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const resData = await res.json();
      if (res.ok) {
        setResetSuccess(resData.message || "Password has been successfully updated!");
      } else {
        setResetError(resData.error || "Failed to reset password.");
      }
    } catch {
      setResetError("Network error while resetting password.");
    } finally {
      setResettingPassword(false);
    }
  };

  const filteredSubs = (data?.subscriptions ?? []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.user.name?.toLowerCase().includes(q) ||
      s.user.email?.toLowerCase().includes(q) ||
      s.plan?.toLowerCase().includes(q);
    const matchFilter = subFilter === "all" || s.status === subFilter;
    return matchSearch && matchFilter;
  });

  const filteredTx = (data?.transactions ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.user.name?.toLowerCase().includes(q) ||
      t.user.email?.toLowerCase().includes(q) ||
      t.productName?.toLowerCase().includes(q) ||
      t.toolkitId?.toLowerCase().includes(q)
    );
  });

  const maxRevenue = Math.max(...(data?.monthlyRevenue ?? []).map((m) => m.revenue), 1);

  return (
    <div className="max-w-[1200px] mx-auto space-y-7 pb-12">
      {/* ── Slide-over Member Profile Drawer ── */}
      <AdminMemberProfileDrawer
        userId={selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
        onGiftMembership={(u) => handleOpenGiftModal(u)}
        onResetPassword={(u) => handleOpenResetModal(u)}
        onUpdateRoleTier={() => fetchData()}
        onDeleteUser={() => fetchData()}
      />

      {/* ── Cancel Confirmation Modal ── */}
      {cancelTarget && (
        <ConfirmCancelModal
          name={cancelTarget.user.name}
          plan={cancelTarget.plan}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}

      {/* ── Gift Membership Modal ── */}
      {userToAddMembership && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setUserToAddMembership(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gift Free Membership Months</h3>
                <p className="text-xs text-slate-400">
                  Add complimentary access for <span className="text-emerald-400 font-semibold">{userToAddMembership.name}</span>
                </p>
              </div>
            </div>

            {giftSuccess ? (
              <div className="space-y-4 py-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-xs flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{giftSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUserToAddMembership(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleGiftMembership} className="space-y-4">
                {giftError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{giftError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Tier
                  </label>
                  <select
                    value={giftTier}
                    onChange={(e) => setGiftTier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VIP">VIP ($29/mo tier)</option>
                    <option value="MARKETPLACE">Marketplace ($49/mo tier)</option>
                    <option value="MARKETPLACE_PLUS">Marketplace Plus ($99/mo tier)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Number of Months
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={giftMonths}
                    onChange={(e) => setGiftMonths(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserToAddMembership(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={giftingMembership}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2"
                  >
                    {giftingMembership ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                    <span>Grant Months</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Password Reset Modal ── */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setUserToResetPassword(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset User Password</h3>
                <p className="text-xs text-slate-400">
                  Update password for <span className="text-amber-400 font-semibold">{userToResetPassword.name}</span>
                </p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-xs flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">New Login Credentials</div>
                  <div className="text-xs text-slate-300 font-mono flex justify-between items-center">
                    <span>Email: {userToResetPassword.email}</span>
                  </div>
                  <div className="text-xs text-amber-300 font-mono font-bold flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span>Password: {newPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Email: ${userToResetPassword.email}\nPassword: ${newPassword}`
                        );
                        setCopiedCredentials(true);
                        setTimeout(() => setCopiedCredentials(false), 2500);
                      }}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserToResetPassword(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">New Password</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserToResetPassword(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2"
                  >
                    {resettingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Payments &amp; Revenue</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
            Active subscriptions, recurring revenue metrics, and full toolkit transaction logs
          </p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto flex items-center gap-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all border border-white/8 shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="rounded-2xl h-[130px] bg-slate-800 animate-pulse" />)
        ) : (
          <>
            <KpiCard
              label="Monthly Recurring Revenue"
              value={`$${(data?.totalMRR ?? 0).toLocaleString()}`}
              sub="From all active paid subscriptions"
              icon={DollarSign}
              gradient="bg-gradient-to-br from-emerald-600 to-teal-800"
              badge="MRR"
            />
            <KpiCard
              label="Annual Recurring Revenue"
              value={`$${(data?.totalARR ?? 0).toLocaleString()}`}
              sub={`${data?.activeCount ?? 0} active subscribers × 12`}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-blue-600 to-blue-900"
              badge="ARR"
            />
            <KpiCard
              label="Active Subscribers"
              value={String(data?.activeCount ?? 0)}
              sub={`${data?.canceledCount ?? 0} canceled · ${data?.totalCount ?? 0} total records`}
              icon={Users}
              gradient="bg-gradient-to-br from-purple-600 to-violet-900"
            />
            <KpiCard
              label="Avg Revenue / Subscriber"
              value={`$${data?.activeCount ? Math.round((data.totalMRR) / data.activeCount) : 0}`}
              sub="Per paid member per month"
              icon={CreditCard}
              gradient="bg-gradient-to-br from-amber-500 to-orange-700"
              badge="ARPU"
            />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Revenue Chart */}
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-white text-base">Revenue Over Time</h2>
              <p className="text-slate-400 text-xs mt-0.5">Subscriptions revenue trend by month</p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-500" />
          </div>
          {loading ? (
            <div className="h-40 bg-slate-700/50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-3 h-40">
              {(data?.monthlyRevenue ?? []).map((m) => {
                const pct = (m.revenue / maxRevenue) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-slate-400 text-[10px] font-bold">
                      {m.revenue > 0 ? `$${m.revenue}` : "—"}
                    </div>
                    <div className="w-full flex items-end" style={{ height: "96px" }}>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 min-h-[4px]"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <div className="text-slate-500 text-[10px]">{m.month}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tier Breakdown */}
        <div className="bg-slate-800/60 border border-white/8 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-white text-base">Plan Breakdown</h2>
                <p className="text-slate-400 text-xs mt-0.5">Subscribers by active tier</p>
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-700/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.tierBreakdown ?? [])
                  .filter((t) => t.plan !== "FREE")
                  .map((t) => {
                    const clr = PLAN_COLORS[t.plan] ?? PLAN_COLORS.FREE;
                    const maxCount = Math.max(...(data?.tierBreakdown ?? []).map((x) => x.count), 1);
                    const pct = Math.round((t.count / maxCount) * 100);
                    return (
                      <div key={t.plan}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${clr.dot}`} />
                            <span className="text-slate-300 font-semibold">{t.plan.replace("_", " ")}</span>
                          </div>
                          <span className="text-slate-400">
                            {t.count} · <span className="text-white font-bold">${t.monthlyRevenue}/mo</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${clr.dot} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-white/8">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Paid MRR</span>
              <span className="text-white font-black">${data?.totalMRR ?? 0}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscribers / Transactions Table ── */}
      <div className="bg-slate-800/60 border border-white/8 rounded-2xl backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Table header & Tab bar */}
        <div className="p-5 border-b border-white/8 flex items-center gap-4 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "subscriptions"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                  : "bg-slate-700/50 text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Active Subscriptions ({data?.subscriptions?.length ?? 0})</span>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "transactions"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                  : "bg-slate-700/50 text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Toolkit &amp; Course Orders ({data?.transactions?.length ?? 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter pills for subscriptions */}
            {activeTab === "subscriptions" && (
              <div className="flex gap-1.5">
                {(["all", "active", "canceled"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSubFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      subFilter === f
                        ? "bg-[#f0c040] text-[#0a1628]"
                        : "bg-slate-700/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "subscriptions" ? "Search subscribers…" : "Search orders…"}
                className="bg-slate-700/50 border border-white/8 text-white text-sm placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2 w-56 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── Subscriptions Table View ── */}
        {activeTab === "subscriptions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-3">
                    Subscriber
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Plan
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Revenue
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Next Billing
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Joined
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="h-9 bg-slate-700/50 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="font-semibold">No subscribers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((s) => {
                    const clr = PLAN_COLORS[s.plan] ?? PLAN_COLORS.FREE;
                    const monthlyAmt = PLAN_PRICE[s.plan] ?? 0;
                    const isActive = s.status === "active";
                    const nextBill = formatBillingDate(s.nextBilling);

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedProfileUserId(s.user.id)}
                        className="border-b border-white/5 hover:bg-slate-700/30 transition-colors group cursor-pointer"
                      >
                        {/* Subscriber */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                              {s.user.image ? (
                                <img src={s.user.image} alt={s.user.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-black text-xs">{s.user.name?.[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-white font-semibold text-sm truncate max-w-[170px] group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                <span>{s.user.name}</span>
                                <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-slate-500 text-xs truncate max-w-[170px]">{s.user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${clr.bg} ${clr.text}`}>
                            {s.plan.replace("_", " ")}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                              STATUS_STYLES[s.status] ?? "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>

                        {/* Revenue */}
                        <td className="px-4 py-3.5">
                          <span className="text-white font-bold text-sm">
                            {monthlyAmt > 0 ? `$${monthlyAmt}/mo` : <span className="text-slate-500">Free</span>}
                          </span>
                        </td>

                        {/* Next Billing */}
                        <td className="px-4 py-3.5">
                          <div>
                            <div className="text-slate-200 text-xs font-semibold flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-amber-400/80" />
                              <span>{nextBill.date}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">{nextBill.rel}</div>
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3.5 text-slate-400 text-xs">{timeAgo(s.createdAt)}</td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedProfileUserId(s.user.id)}
                              className="text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 border border-white/5"
                              title="View Full Profile"
                            >
                              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                              <span>Profile</span>
                            </button>

                            {isActive && (
                              <button
                                onClick={() => setCancelTarget(s)}
                                className="flex items-center gap-1 text-xs font-bold bg-red-500/15 hover:bg-red-500/30 text-red-400 px-2.5 py-1.5 rounded-lg transition-all border border-red-500/20"
                                title="Cancel Subscription"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Toolkit & Course Transactions Table View ── */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-3">
                    Customer
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Product / Toolkit
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Amount
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-3">
                    Order ID
                  </th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="h-9 bg-slate-700/50 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="font-semibold">No toolkit or course orders found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedProfileUserId(t.user.id)}
                      className="border-b border-white/5 hover:bg-slate-700/30 transition-colors group cursor-pointer"
                    >
                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            {t.user.image ? (
                              <img src={t.user.image} alt={t.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-black text-xs">{t.user.name?.[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold text-sm truncate max-w-[170px] group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                              <span>{t.user.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-slate-500 text-xs truncate max-w-[170px]">{t.user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <div className="text-white font-semibold text-xs">{t.productName}</div>
                        {t.membershipGranted && (
                          <div className="text-amber-400/80 text-[10px] font-bold mt-0.5">
                            + {t.membershipMonths || 2} Months {t.membershipTier || "VIP"} Included
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className="text-emerald-400 font-bold text-sm">
                          {t.amount > 0 ? `$${t.amount.toFixed(2)}` : <span className="text-slate-400">Free / Gift</span>}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 capitalize">
                          {t.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-400 text-xs">{timeAgo(t.createdAt)}</td>

                      {/* Order ID */}
                      <td className="px-4 py-3.5">
                        {t.stripeSessionId ? (
                          <span className="text-slate-500 text-[10px] font-mono bg-slate-700/50 px-2 py-0.5 rounded truncate max-w-[120px] block">
                            {t.stripeSessionId.slice(0, 18)}…
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProfileUserId(t.user.id);
                          }}
                          className="text-xs font-semibold bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto border border-white/5"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
