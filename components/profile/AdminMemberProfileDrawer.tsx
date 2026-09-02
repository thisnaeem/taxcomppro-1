"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  Calendar,
  Globe,
  MapPin,
  Briefcase,
  Shield,
  Crown,
  CreditCard,
  Gift,
  KeyRound,
  Trash2,
  ExternalLink,
  DollarSign,
  UserCheck,
  Award,
  BookOpen,
  MessageSquare,
  Activity,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  TrendingUp,
  Wallet,
  Sparkles,
  Radio,
  FileText,
  Loader2,
} from "lucide-react";
import { getToolkit } from "@/lib/toolkits";

interface AdminMemberProfileDrawerProps {
  userId: string | null;
  onClose: () => void;
  onGiftMembership: (user: any) => void;
  onResetPassword: (user: any) => void;
  onUpdateRoleTier: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

const roleBadges: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  MEMBER:       { label: "Member",       className: "bg-slate-800 text-slate-300 border-slate-700", icon: Shield },
  PROFESSIONAL: { label: "Professional", className: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Briefcase },
  ADMIN:        { label: "Admin",        className: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Crown },
};

const tierBadges: Record<string, { label: string; className: string }> = {
  FREE:             { label: "Free Plan",        className: "bg-slate-800 text-slate-400 border-slate-700" },
  VIP:              { label: "VIP Member",       className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  MARKETPLACE:      { label: "Marketplace",      className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  MARKETPLACE_PLUS: { label: "Marketplace Plus", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

export function AdminMemberProfileDrawer({
  userId,
  onClose,
  onGiftMembership,
  onResetPassword,
  onDeleteUser,
}: AdminMemberProfileDrawerProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "membership" | "affiliate" | "payments" | "courses" | "card"
  >("overview");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user details");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => setError(err.message || "Failed to load user"))
      .finally(() => setLoading(false));
  }, [userId]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!userId) return null;

  const role = user?.role || "MEMBER";
  const tier = user?.tier || "FREE";
  const rc = roleBadges[role] || roleBadges.MEMBER;
  const tc = tierBadges[tier] || tierBadges.FREE;
  const RoleIcon = rc.icon;

  const card = user?.digitalCard;
  const hasCard = card?.isPurchased || card?.isActivated;
  const aff = user?.affiliateProfile;
  const sub = user?.subscription;

  const copyAffiliateLink = () => {
    if (!aff?.code) return;
    const link = `${window.location.origin}/upgrade?ref=${aff.code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-3xl bg-[#081220] border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col text-slate-200 animate-in slide-in-from-right duration-300">
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-[#081220]/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Member Profile
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-slate-400">ID: {user?.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGiftMembership(user)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Gift Months</span>
            </button>

            <button
              onClick={() => onResetPassword(user)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-center">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-400">Loading member profile...</p>
          </div>
        ) : error || !user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Failed to load member</h3>
            <p className="text-xs text-slate-400 mb-4">{error || "User not found"}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Profile Hero Header */}
            <div className="relative bg-gradient-to-b from-slate-900 via-[#0a182c] to-[#081220] px-6 pt-6 pb-5 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Avatar */}
                <div className="relative w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border-2 border-slate-700 shadow-xl">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl font-black text-amber-400">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
                    {user.emailVerified && (
                      <span title="Verified email" className="text-emerald-400">
                        <UserCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>

                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {/* Role Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${rc.className}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {rc.label}
                    </span>

                    {/* Tier Badge */}
                    <span
                      className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tc.className}`}
                    >
                      {tc.label}
                    </span>

                    {/* Expiration Note */}
                    {sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd) > new Date() && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Valid until {new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      </span>
                    )}

                    {/* Joined Date */}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-[#060f1e] overflow-x-auto">
              {[
                { id: "overview", label: "Overview & Contact", icon: UserCheck },
                { id: "membership", label: "Membership", icon: Crown },
                { id: "affiliate", label: "Affiliate", icon: TrendingUp },
                { id: "payments", label: `Payments (${user.toolkitPurchases?.length + user.marketplacePurchases?.length + user.proAds?.length})`, icon: DollarSign },
                { id: "courses", label: `Courses (${user.enrollments?.length || 0})`, icon: BookOpen },
                { id: "card", label: "Connect Card", icon: CreditCard },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                      active
                        ? "border-amber-500 text-amber-400 bg-amber-500/5 font-bold"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-6 space-y-6">
              {/* TAB 1: OVERVIEW & CONTACT */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posts</div>
                      <div className="text-xl font-bold text-white mt-1">{user._count?.posts || 0}</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Communities</div>
                      <div className="text-xl font-bold text-white mt-1">{user._count?.communityMembers || 0}</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Courses</div>
                      <div className="text-xl font-bold text-amber-400 mt-1">{user._count?.enrollments || 0}</div>
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toolkits</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">{user.toolkitPurchases?.length || 0}</div>
                    </div>
                  </div>

                  {/* Contact & Bio Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      <span>Contact & Profile Details</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email Address</span>
                        <span className="text-white font-medium select-all">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Phone Number</span>
                        <span className="text-white font-medium select-all">{user.phone || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Location</span>
                        <span className="text-slate-200">{user.location || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Years of Experience</span>
                        <span className="text-slate-200">{user.yearsExperience ? `${user.yearsExperience} years` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Website</span>
                        {user.website ? (
                          <a
                            href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{user.website}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </div>

                    {user.headline && (
                      <div className="pt-3 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 block mb-1">Headline</span>
                        <p className="text-slate-200 italic font-medium">"{user.headline}"</p>
                      </div>
                    )}

                    {user.bio && (
                      <div className="pt-3 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 block mb-1">Bio</span>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Specialties & Languages */}
                  {((user.specialties && user.specialties.length > 0) ||
                    (user.certifications && user.certifications.length > 0) ||
                    (user.languages && user.languages.length > 0)) && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Specialties & Credentials</span>
                      </h4>

                      {user.specialties?.length > 0 && (
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1.5">Specialties</span>
                          <div className="flex flex-wrap gap-1.5">
                            {user.specialties.map((s: string) => (
                              <span
                                key={s}
                                className="text-xs bg-slate-800 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-lg"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.certifications?.length > 0 && (
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1.5">Certifications</span>
                          <div className="flex flex-wrap gap-1.5">
                            {user.certifications.map((c: string) => (
                              <span
                                key={c}
                                className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.languages?.length > 0 && (
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1.5">Languages</span>
                          <div className="flex flex-wrap gap-1.5">
                            {user.languages.map((l: string) => (
                              <span
                                key={l}
                                className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-lg"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Active Sessions */}
                  {user.sessions?.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Recent Active Sessions</span>
                      </h4>
                      <div className="space-y-2">
                        {user.sessions.map((s: any, idx: number) => (
                          <div
                            key={s.id || idx}
                            className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <span className="text-slate-300 truncate max-w-xs">
                              {s.userAgent || "Web Session"}
                            </span>
                            <span className="text-slate-400">
                              Expires {new Date(s.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEMBERSHIP */}
              {activeTab === "membership" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Status Banner */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                        Active Membership Tier
                      </div>
                      <div className="text-2xl font-black text-white flex items-center gap-2">
                        <span>{tc.label}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${tc.className}`}>
                          {user.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {sub?.currentPeriodEnd
                          ? `Valid until ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                          : "No expiration set (Free Tier / Perpetual)"}
                      </p>
                    </div>

                    <button
                      onClick={() => onGiftMembership(user)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Add Free Months</span>
                    </button>
                  </div>

                  {/* Membership Details */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Subscription Identifiers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px] mb-1">Stripe Customer ID</span>
                        <span className="font-mono text-slate-200">{user.stripeCustomerId || "None"}</span>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px] mb-1">Stripe Subscription ID</span>
                        <span className="font-mono text-slate-200">{sub?.stripeSubscriptionId || "None"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Granted Membership Grants / Toolkits */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Membership Grants & Toolkit Purchases</span>
                    </h4>

                    {user.toolkitPurchases?.length === 0 ? (
                      <p className="text-xs text-slate-400">No toolkit purchases or manual grants yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {user.toolkitPurchases.map((tp: any) => {
                          const tk = getToolkit(tp.toolkitId);
                          return (
                            <div
                              key={tp.id}
                              className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">{tk?.emoji || "📦"}</span>
                                <div>
                                  <div className="font-bold text-white">{tk?.name || tp.toolkitId}</div>
                                  <div className="text-[11px] text-slate-400">
                                    Granted {tp.membershipMonths} mo ({tp.membershipTier}) · {new Date(tp.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                                {tp.stripeSessionId?.startsWith("admin_") ? "Admin Grant" : "Stripe Purchase"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: AFFILIATE */}
              {activeTab === "affiliate" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {aff ? (
                    <>
                      {/* Financial Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Earned
                          </div>
                          <div className="text-2xl font-black text-emerald-400 mt-1">
                            ${aff.totalEarned?.toFixed(2) || "0.00"}
                          </div>
                        </div>

                        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Pending Balance
                          </div>
                          <div className="text-2xl font-black text-amber-400 mt-1">
                            ${aff.pendingBalance?.toFixed(2) || "0.00"}
                          </div>
                        </div>

                        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Paid
                          </div>
                          <div className="text-2xl font-black text-slate-200 mt-1">
                            ${aff.totalPaid?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                      </div>

                      {/* Affiliate Link Box */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Referral Link (Code: {aff.code})
                        </span>
                        <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between font-mono text-xs text-amber-400">
                          <span className="truncate pr-2">{`${typeof window !== "undefined" ? window.location.origin : ""}/upgrade?ref=${aff.code}`}</span>
                          <button
                            onClick={copyAffiliateLink}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Referrals Table */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Referred Members ({aff.referrals?.length || 0})</span>
                        </h4>

                        {aff.referrals?.length === 0 ? (
                          <p className="text-xs text-slate-400 py-3">No member referrals yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {aff.referrals.map((ref: any) => (
                              <div
                                key={ref.id}
                                className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="font-semibold text-white">
                                    {ref.referredUser?.name || "Member"}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {ref.referredUser?.email} · {new Date(ref.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-emerald-400">+${ref.commission?.toFixed(2)}</div>
                                  <div className="text-[10px] text-slate-400">{ref.tier}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payouts Table */}
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Payout Requests ({aff.payouts?.length || 0})
                        </h4>

                        {aff.payouts?.length === 0 ? (
                          <p className="text-xs text-slate-400 py-3">No payouts requested yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {aff.payouts.map((pay: any) => (
                              <div
                                key={pay.id}
                                className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="font-bold text-white">${pay.amount?.toFixed(2)}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {pay.method?.toUpperCase()} · {new Date(pay.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    pay.status === "PAID"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : pay.status === "REJECTED"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}
                                >
                                  {pay.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                      <TrendingUp className="w-10 h-10 text-slate-400 mx-auto opacity-50 mb-2" />
                      <h4 className="text-sm font-bold text-white">Affiliate Account Not Activated</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        This member has not yet activated their affiliate referral link or earnings dashboard.
                      </p>
                    </div>
                  )}

                  {/* Referred By Section */}
                  {user.referredBy?.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs">
                      <span className="text-slate-400 block mb-1 font-bold uppercase tracking-wider text-[10px]">
                        Referred By
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold">
                          {user.referredBy[0]?.affiliate?.user?.name || "Affiliate"}
                        </span>
                        <span className="text-slate-400">
                          ({user.referredBy[0]?.affiliate?.user?.email})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PAYMENTS */}
              {activeTab === "payments" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Toolkits */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Toolkits & Bundles ({user.toolkitPurchases?.length || 0})</span>
                    </h4>

                    {user.toolkitPurchases?.length === 0 ? (
                      <p className="text-xs text-slate-400">No toolkit purchases found.</p>
                    ) : (
                      <div className="space-y-2">
                        {user.toolkitPurchases.map((p: any) => {
                          const tk = getToolkit(p.toolkitId);
                          return (
                            <div
                              key={p.id}
                              className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">{tk?.emoji || "📦"}</span>
                                <div>
                                  <div className="font-bold text-white">{tk?.name || p.toolkitId}</div>
                                  <div className="text-[11px] text-slate-400">
                                    {new Date(p.createdAt).toLocaleDateString()} · {p.membershipMonths} mo {p.membershipTier}
                                  </div>
                                </div>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                                {p.stripeSessionId}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Marketplace Purchases */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Marketplace Purchases ({user.marketplacePurchases?.length || 0})
                    </h4>

                    {user.marketplacePurchases?.length === 0 ? (
                      <p className="text-xs text-slate-400">No marketplace purchases.</p>
                    ) : (
                      <div className="space-y-2">
                        {user.marketplacePurchases.map((m: any) => (
                          <div
                            key={m.id}
                            className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">{m.listing?.title || "Item"}</div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(m.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <span className="font-bold text-emerald-400">${m.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pro Ads */}
                  {user.proAds?.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Pro Ads Campaigns ({user.proAds.length})
                      </h4>
                      <div className="space-y-2">
                        {user.proAds.map((ad: any) => (
                          <div
                            key={ad.id}
                            className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">{ad.title}</div>
                              <div className="text-[11px] text-slate-400">
                                {ad.placement} · {ad.durationMonths} mo · {new Date(ad.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-400">${ad.priceUsd}</div>
                              <span className="text-[10px] text-slate-400">{ad.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: COURSES & LEARNING */}
              {activeTab === "courses" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Enrolled Academy Courses ({user.enrollments?.length || 0})</span>
                    </h4>

                    {user.enrollments?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No course enrollments found.</p>
                    ) : (
                      <div className="space-y-3">
                        {user.enrollments.map((enr: any) => {
                          const isComplete = !!enr.completedAt;
                          const progressCount = enr.progress?.length || 0;
                          return (
                            <div
                              key={enr.id}
                              className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-bold text-white text-sm">
                                  {enr.course?.title || "Course"}
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isComplete
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  {isComplete ? "Completed" : "In Progress"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Completed Lessons: {progressCount}</span>
                                <span>Enrolled {new Date(enr.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: CONNECT CARD */}
              {activeTab === "card" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {hasCard ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              {card.businessName || card.professionalTitle || "Digital Connect Card"}
                            </h4>
                            <p className="text-xs text-emerald-400 font-mono">@{card.username}</p>
                          </div>
                        </div>

                        {card.username && (
                          <Link
                            href={`/connect/${card.username}`}
                            target="_blank"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>View Live</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      {/* Card Analytics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                          <div className="text-lg font-bold text-white">{card.pageViews || 0}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Views</div>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                          <div className="text-lg font-bold text-emerald-400">{card.nfcTaps || 0}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">NFC Taps</div>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                          <div className="text-lg font-bold text-amber-400">{card.qrScans || 0}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">QR Scans</div>
                        </div>
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                          <div className="text-lg font-bold text-blue-400">{card.contactSaves || 0}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Saves</div>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[11px] mb-0.5">Theme</span>
                          <span className="font-semibold text-slate-200 capitalize">{card.theme}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px] mb-0.5">Status</span>
                          <span className="font-semibold text-emerald-400">
                            {card.isActivated ? "Activated & Active" : "Pending Setup"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                      <CreditCard className="w-10 h-10 text-slate-400 mx-auto opacity-50 mb-2" />
                      <h4 className="text-sm font-bold text-white">No Connect Card</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        This user has not yet purchased or activated a Digital Connect Card.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
