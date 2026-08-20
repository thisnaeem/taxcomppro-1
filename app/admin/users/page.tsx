"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Shield,
  Briefcase,
  Crown,
  Check,
  Loader2,
  Trash2,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
  Gift,
  CalendarPlus,
  CalendarCheck,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { AdminMemberProfileDrawer } from "@/components/profile/AdminMemberProfileDrawer";

type Role = "MEMBER" | "PROFESSIONAL" | "ADMIN";
type Tier = "FREE" | "VIP" | "MARKETPLACE" | "MARKETPLACE_PLUS";

interface DigitalCardInfo {
  isPurchased?: boolean;
  isActivated?: boolean;
  username?: string | null;
}

interface UserSubscription {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tier: Tier;
  image: string | null;
  createdAt: string;
  digitalCard?: DigitalCardInfo | null;
  subscription?: UserSubscription | null;
}

const roleConfig: Record<Role, { label: string; className: string; icon: React.ElementType }> = {
  MEMBER:       { label: "Member",       className: "bg-slate-800/60 text-slate-400 border border-slate-700/30",    icon: Shield },
  PROFESSIONAL: { label: "Professional", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",      icon: Briefcase },
  ADMIN:        { label: "Admin",        className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",    icon: Crown },
};

const tierConfig: Record<Tier, { label: string; className: string }> = {
  FREE:             { label: "Free",        className: "bg-slate-850 text-slate-500 border border-slate-800" },
  VIP:              { label: "VIP",         className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  MARKETPLACE:      { label: "Marketplace", className: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
  MARKETPLACE_PLUS: { label: "Plus",        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

/** Dropdown rendered into document.body via portal — escapes any overflow:hidden container */
function UserEditDropdown({
  userId,
  currentRole,
  currentTier,
  anchor,
  onClose,
  onSelectRole,
  onSelectTier,
  onRequestViewProfile,
  onRequestAddMembership,
  onRequestResetPassword,
  onRequestDelete,
}: {
  userId: string;
  currentRole: Role;
  currentTier: Tier;
  anchor: DOMRect;
  onClose: () => void;
  onSelectRole: (role: Role) => void;
  onSelectTier: (tier: Tier) => void;
  onRequestViewProfile: () => void;
  onRequestAddMembership: () => void;
  onRequestResetPassword: () => void;
  onRequestDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "fixed",
    top: anchor.bottom + 6,
    right: window.innerWidth - anchor.right,
    zIndex: 9999,
    minWidth: 210,
  };

  return createPortal(
    <div
      ref={ref}
      style={style}
      className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 flex flex-col gap-3 text-slate-200"
    >
      {/* View Full Profile */}
      <div>
        <button
          onClick={() => {
            onClose();
            onRequestViewProfile();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/10 border-0 bg-transparent text-left cursor-pointer transition-all"
        >
          <UserIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>View Member Profile</span>
        </button>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Role Section */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2">Assign Role</p>
        <div className="flex flex-col gap-0.5">
          {(["MEMBER", "PROFESSIONAL", "ADMIN"] as Role[]).map((r) => {
            const rc = roleConfig[r];
            const Icon = rc.icon;
            return (
              <button
                key={r}
                onClick={() => {
                  onSelectRole(r);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-slate-800 text-slate-300 border-0 bg-transparent text-left cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <span className="flex-1">{rc.label}</span>
                {currentRole === r && <Check className="w-3 h-3 text-emerald-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-800" />

      {/* Tier Section */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2">Assign Tier</p>
        <div className="flex flex-col gap-0.5">
          {(["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"] as Tier[]).map((t) => {
            const tc = tierConfig[t];
            return (
              <button
                key={t}
                onClick={() => {
                  onSelectTier(t);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-slate-800 text-slate-300 border-0 bg-transparent text-left cursor-pointer"
              >
                <span className="flex-1">{tc.label}</span>
                {currentTier === t && <Check className="w-3 h-3 text-emerald-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-800" />

      {/* Add Free Membership Months */}
      <div>
        <button
          onClick={() => {
            onClose();
            onRequestAddMembership();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border-0 bg-transparent text-left cursor-pointer transition-all"
        >
          <Gift className="w-3.5 h-3.5 text-emerald-400" />
          <span>Gift Free Membership</span>
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-800" />

      {/* Reset Password */}
      <div>
        <button
          onClick={() => {
            onClose();
            onRequestResetPassword();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 border-0 bg-transparent text-left cursor-pointer transition-all"
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset Password</span>
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-800" />

      {/* Danger Zone: Delete User */}
      <div>
        <button
          onClick={() => {
            onClose();
            onRequestDelete();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/15 border-0 bg-transparent text-left cursor-pointer transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Delete User</span>
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]                     = useState<User[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState("");
  const [query, setQuery]                     = useState("");
  const [roleFilter, setRoleFilter]           = useState<Role | "ALL" | "CONNECT_CARD">("ALL");
  const [loadingId, setLoadingId]             = useState<string | null>(null);
  const [openDropdown, setOpenDropdown]       = useState<{ id: string; rect: DOMRect } | null>(null);
  const [userToDelete, setUserToDelete]       = useState<User | null>(null);
  const [deleting, setDeleting]               = useState(false);
  const [actionError, setActionError]         = useState<string | null>(null);

  // Detailed profile drawer state
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);

  // Membership Gifting state
  const [userToAddMembership, setUserToAddMembership] = useState<User | null>(null);
  const [giftMonths, setGiftMonths]                   = useState<number>(1);
  const [giftTier, setGiftTier]                       = useState<Tier>("VIP");
  const [giftingMembership, setGiftingMembership]     = useState(false);
  const [giftSuccess, setGiftSuccess]                 = useState<string | null>(null);
  const [giftError, setGiftError]                     = useState<string | null>(null);

  // Password reset state
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword]                 = useState("");
  const [confirmPassword, setConfirmPassword]         = useState("");
  const [showPassword, setShowPassword]               = useState(false);
  const [resettingPassword, setResettingPassword]     = useState(false);
  const [resetSuccess, setResetSuccess]               = useState<string | null>(null);
  const [resetError, setResetError]                   = useState<string | null>(null);
  const [copiedCredentials, setCopiedCredentials]     = useState(false);

  const handleOpenGiftModal = (user: User) => {
    setUserToAddMembership(user);
    setGiftMonths(1);
    setGiftTier(user.tier !== "FREE" ? user.tier : "VIP");
    setGiftSuccess(null);
    setGiftError(null);
  };

  const handleCloseGiftModal = () => {
    setUserToAddMembership(null);
    setGiftMonths(1);
    setGiftSuccess(null);
    setGiftError(null);
  };

  const handleGiftMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToAddMembership) return;
    if (!giftMonths || giftMonths < 1) {
      setGiftError("Please enter at least 1 month.");
      return;
    }

    setGiftingMembership(true);
    setGiftError(null);
    setGiftSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userToAddMembership.id}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: giftMonths, tier: giftTier }),
      });
      const data = await res.json();
      if (res.ok) {
        setGiftSuccess(data.message || "Free membership months added successfully!");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userToAddMembership.id
              ? { ...u, tier: data.user?.tier ?? giftTier, subscription: data.subscription }
              : u
          )
        );
      } else {
        setGiftError(data.error || "Failed to add free membership months.");
      }
    } catch {
      setGiftError("Network error while adding free membership months.");
    } finally {
      setGiftingMembership(false);
    }
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
    // Shuffle
    const shuffled = pwd.split("").sort(() => 0.5 - Math.random()).join("");
    setNewPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowPassword(true);
    setResetError(null);
  };

  const handleOpenResetModal = (user: User) => {
    setUserToResetPassword(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setResetSuccess(null);
    setResetError(null);
    setCopiedCredentials(false);
  };

  const handleCloseResetModal = () => {
    setUserToResetPassword(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetSuccess(null);
    setResetError(null);
    setCopiedCredentials(false);
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
      const data = await res.json();
      if (res.ok) {
        setResetSuccess(data.message || "Password updated successfully!");
      } else {
        setResetError(data.error || "Failed to reset password.");
      }
    } catch {
      setResetError("Network error while resetting password.");
    } finally {
      setResettingPassword(false);
    }
  };

  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("search", query);
    if (roleFilter !== "ALL" && roleFilter !== "CONNECT_CARD") p.set("role", roleFilter);
    setLoading(true);
    fetch(`/api/admin/users?${p}`)
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [query, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleDropdown = useCallback((userId: string, btn: HTMLButtonElement) => {
    if (openDropdown?.id === userId) {
      setOpenDropdown(null);
      return;
    }
    setOpenDropdown({ id: userId, rect: btn.getBoundingClientRect() });
  }, [openDropdown]);

  const updateUser = async (userId: string, updates: { role?: Role; tier?: Tier }) => {
    setLoadingId(userId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to update user");
      }
    } catch {
      setActionError("Failed to update user");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
      } else {
        setActionError(data.error || "Failed to delete user");
      }
    } catch {
      setActionError("Network error while deleting user");
    } finally {
      setDeleting(false);
    }
  };

  // Filter for Connect Card owners if that tab is selected
  const displayedUsers = roleFilter === "CONNECT_CARD"
    ? users.filter((u) => u.digitalCard?.isPurchased || u.digitalCard?.isActivated)
    : users;

  const connectCardCount = users.filter((u) => u.digitalCard?.isPurchased || u.digitalCard?.isActivated).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">User Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          View and manage all platform members, Connect Card buyers, roles, and subscriptions
        </p>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3.5 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#060f1e] text-slate-100 text-sm pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all font-[inherit]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "CONNECT_CARD", "MEMBER", "PROFESSIONAL", "ADMIN"] as const).map((r) => {
            const isCardTab = r === "CONNECT_CARD";
            const label =
              r === "ALL"
                ? "All Users"
                : isCardTab
                ? `💳 Connect Cards (${connectCardCount})`
                : r.charAt(0) + r.slice(1).toLowerCase();

            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  roleFilter === r
                    ? isCardTab
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black"
                      : "bg-amber-500 text-[#0a1628] shadow-lg shadow-amber-500/10"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <span>
          <strong className="text-white">{displayedUsers.length}</strong> users shown
        </span>
        <span>·</span>
        <span>
          <strong className="text-emerald-400">{connectCardCount}</strong> Connect Card buyers
        </span>
        <span>·</span>
        <span>
          <strong className="text-white">{users.filter((u) => u.role === "MEMBER").length}</strong> members
        </span>
        <span>·</span>
        <span>
          <strong className="text-white">{users.filter((u) => u.role === "PROFESSIONAL").length}</strong> professionals
        </span>
        <span>·</span>
        <span>
          <strong className="text-white">{users.filter((u) => u.role === "ADMIN").length}</strong> admins
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-slate-900/60 border-b border-slate-800">
              <tr>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">
                  Connect Card
                </th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayedUsers.map((u) => {
                const rc = roleConfig[u.role] || roleConfig.MEMBER;
                const tc = tierConfig[u.tier] || tierConfig.FREE;
                const RoleIcon = rc.icon;
                const card = u.digitalCard;
                const hasCard = card?.isPurchased || card?.isActivated;

                return (
                  <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                    <td
                      className="px-5 py-4 cursor-pointer group"
                      onClick={() => setSelectedProfileUserId(u.id)}
                      title="Click to view detailed member profile"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/50 group-hover:border-amber-500/50 transition-all">
                          {u.image ? (
                            <img
                              src={u.image}
                              alt={u.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">
                              {u.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-sm group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                            <span>{u.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity text-amber-400" />
                          </div>
                          <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Connect Card Column */}
                    <td className="px-5 py-4">
                      {hasCard ? (
                        card?.isActivated && card?.username ? (
                          <Link
                            href={`/connect/${card.username}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                          >
                            <CreditCard className="w-3 h-3 text-emerald-400" />
                            <span>Active</span>
                            <span className="text-emerald-500/70 font-mono text-[10px]">@{card.username}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <CreditCard className="w-3 h-3 text-amber-400" />
                            <span>Purchased (Pending Setup)</span>
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-600 font-medium">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${rc.className}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {rc.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${tc.className}`}
                        >
                          {tc.label}
                        </span>
                        {u.subscription?.currentPeriodEnd && new Date(u.subscription.currentPeriodEnd) > new Date() && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/90 font-medium">
                            <Clock className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Valid till {new Date(u.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400">{timeAgo(u.createdAt)}</td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => toggleDropdown(u.id, e.currentTarget)}
                        disabled={loadingId === u.id}
                        className="flex items-center gap-1.5 text-xs font-semibold border border-slate-800 bg-[#060f1e] text-slate-300 px-3 py-1.5 rounded-lg hover:border-amber-500/50 hover:text-amber-500 transition-all disabled:opacity-50 ml-auto cursor-pointer"
                      >
                        {loadingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Manage"}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {displayedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Portal dropdown — renders outside overflow:hidden container */}
      {openDropdown && (
        <UserEditDropdown
          userId={openDropdown.id}
          currentRole={users.find((u) => u.id === openDropdown.id)?.role ?? "MEMBER"}
          currentTier={users.find((u) => u.id === openDropdown.id)?.tier ?? "FREE"}
          anchor={openDropdown.rect}
          onClose={() => setOpenDropdown(null)}
          onSelectRole={(role) => updateUser(openDropdown.id, { role })}
          onSelectTier={(tier) => updateUser(openDropdown.id, { tier })}
          onRequestViewProfile={() => {
            const targetId = openDropdown.id;
            setSelectedProfileUserId(targetId);
          }}
          onRequestAddMembership={() => {
            const target = users.find((u) => u.id === openDropdown.id);
            if (target) handleOpenGiftModal(target);
          }}
          onRequestResetPassword={() => {
            const target = users.find((u) => u.id === openDropdown.id);
            if (target) handleOpenResetModal(target);
          }}
          onRequestDelete={() => {
            const target = users.find((u) => u.id === openDropdown.id);
            if (target) setUserToDelete(target);
          }}
        />
      )}

      {/* Gift Free Membership Modal */}
      {userToAddMembership && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Add Free Membership Months</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Grant complimentary membership months to <strong className="text-white">{userToAddMembership.name}</strong> (
              <span className="text-slate-300">{userToAddMembership.email}</span>).
            </p>

            {giftSuccess ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free Membership Granted!</span>
                  </div>
                  <p className="text-slate-200">{giftSuccess}</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCloseGiftModal}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGiftMembership} className="space-y-4">
                {giftError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{giftError}</span>
                  </div>
                )}

                {/* Select Tier */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Membership Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["VIP", "MARKETPLACE", "MARKETPLACE_PLUS"] as Tier[]).map((t) => {
                      const tc = tierConfig[t];
                      const selected = giftTier === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setGiftTier(t)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                            selected
                              ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                              : "bg-[#060f1e] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          {tc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Select Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Duration (Months)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    {[1, 2, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGiftMonths(m)}
                        className={`py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          giftMonths === m
                            ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                            : "bg-[#060f1e] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        +{m} {m === 1 ? "Mo" : "Mos"}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={giftMonths || ""}
                      onChange={(e) => setGiftMonths(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      placeholder="Custom number of months"
                      className="w-full bg-[#060f1e] text-slate-100 text-sm px-3.5 py-2 border border-slate-800 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      months
                    </span>
                  </div>
                </div>

                {/* Summary / Preview Box */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current Tier:</span>
                    <span className="font-semibold text-slate-200">{userToAddMembership.tier}</span>
                  </div>
                  {userToAddMembership.subscription?.currentPeriodEnd && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Current Expiry:</span>
                      <span className="font-mono text-slate-300">
                        {new Date(userToAddMembership.subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>New Expiration:</span>
                    </span>
                    <span className="font-mono font-bold">
                      {(() => {
                        const now = new Date();
                        const existing = userToAddMembership.subscription?.currentPeriodEnd
                          ? new Date(userToAddMembership.subscription.currentPeriodEnd)
                          : null;
                        const base = existing && existing > now ? new Date(existing) : new Date(now);
                        base.setMonth(base.getMonth() + (giftMonths || 1));
                        return base.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseGiftModal}
                    disabled={giftingMembership}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={giftingMembership || !giftMonths}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {giftingMembership ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Gift className="w-3.5 h-3.5" />
                    )}
                    <span>{giftingMembership ? "Adding Months..." : `Grant +${giftMonths} Mo ${giftTier}`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Set / Reset Password</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Directly set a new password for <strong className="text-white">{userToResetPassword.name}</strong> (
              <span className="text-slate-300">{userToResetPassword.email}</span>).
            </p>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Password Updated Successfully</span>
                  </div>
                  <p className="text-slate-300">
                    The user can now sign in using their email and this new password:
                  </p>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-sm text-amber-400">
                    <span>{newPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Email: ${userToResetPassword.email}\nPassword: ${newPassword}`
                        );
                        setCopiedCredentials(true);
                        setTimeout(() => setCopiedCredentials(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCredentials ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Strong Password</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="w-full bg-[#060f1e] text-slate-100 text-sm pl-10 pr-10 py-2.5 border border-slate-800 rounded-xl outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      minLength={8}
                      className="w-full bg-[#060f1e] text-slate-100 text-sm pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseResetModal}
                    disabled={resettingPassword}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword || !newPassword}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {resettingPassword ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>{resettingPassword ? "Saving..." : "Set Password"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1.5">Delete User Account</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-white">{userToDelete.name}</strong> (
              <span className="text-slate-300">{userToDelete.email}</span>)? This will permanently remove their
              account, sessions, Connect Card, and all related records.
            </p>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{deleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detailed Member Profile Drawer */}
      {selectedProfileUserId && (
        <AdminMemberProfileDrawer
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
          onGiftMembership={(target) => {
            if (target) handleOpenGiftModal(target);
          }}
          onResetPassword={(target) => {
            if (target) handleOpenResetModal(target);
          }}
          onUpdateRoleTier={() => {}}
          onDeleteUser={(target) => {
            if (target) {
              setUserToDelete(target);
              setSelectedProfileUserId(null);
            }
          }}
        />
      )}
    </div>
  );
}
