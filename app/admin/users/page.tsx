"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Shield, Briefcase, Crown, Check, Loader2 } from "lucide-react";

type Role = "MEMBER" | "PROFESSIONAL" | "ADMIN";
type Tier = "FREE" | "VIP" | "MARKETPLACE" | "MARKETPLACE_PLUS";

interface User {
  id: string; name: string; email: string;
  role: Role; tier: Tier; image: string | null; createdAt: string;
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
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(d).toLocaleDateString();
}

/** Dropdown rendered into document.body via portal — escapes any overflow:hidden container */
function UserEditDropdown({
  userId, currentRole, currentTier, anchor, onClose, onSelectRole, onSelectTier
}: {
  userId: string;
  currentRole: Role;
  currentTier: Tier;
  anchor: DOMRect;
  onClose: () => void;
  onSelectRole: (role: Role) => void;
  onSelectTier: (tier: Tier) => void;
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
    minWidth: 200,
  };

  return createPortal(
    <div ref={ref} style={style}
      className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 flex flex-col gap-3 text-slate-200">
      
      {/* Role Section */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2">Assign Role</p>
        <div className="flex flex-col gap-0.5">
          {(["MEMBER", "PROFESSIONAL", "ADMIN"] as Role[]).map(r => {
            const rc = roleConfig[r];
            const Icon = rc.icon;
            return (
              <button key={r} onClick={() => { onSelectRole(r); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-slate-800 text-slate-300 border-0 bg-transparent text-left cursor-pointer">
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
          {(["FREE", "VIP", "MARKETPLACE", "MARKETPLACE_PLUS"] as Tier[]).map(t => {
            const tc = tierConfig[t];
            return (
              <button key={t} onClick={() => { onSelectTier(t); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-slate-800 text-slate-300 border-0 bg-transparent text-left cursor-pointer">
                <span className="flex-1">{tc.label}</span>
                {currentTier === t && <Check className="w-3 h-3 text-emerald-500 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [query, setQuery]           = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [loadingId, setLoadingId]   = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<{ id: string; rect: DOMRect } | null>(null);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("search", query);
    if (roleFilter !== "ALL") p.set("role", roleFilter);
    setLoading(true);
    fetch(`/api/admin/users?${p}`)
      .then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([])).finally(() => setLoading(false));
  }, [query, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleDropdown = useCallback((userId: string, btn: HTMLButtonElement) => {
    if (openDropdown?.id === userId) { setOpenDropdown(null); return; }
    setOpenDropdown({ id: userId, rect: btn.getBoundingClientRect() });
  }, [openDropdown]);

  const updateUser = async (userId: string, updates: { role?: Role; tier?: Tier }) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
      }
    } catch { /* ignore */ }
    finally { setLoadingId(null); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">User Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">View and manage all platform members, roles, and subscription tiers</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search by name or email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#060f1e] text-slate-100 text-sm pl-10 pr-4 py-2.5 border border-slate-800 rounded-xl outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all font-[inherit]" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL","MEMBER","PROFESSIONAL","ADMIN"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                roleFilter === r 
                  ? "bg-amber-500 text-[#0a1628] shadow-lg shadow-amber-500/10" 
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
              }`}>
              {r === "ALL" ? "All Roles" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm text-slate-400">
        <span><strong className="text-white">{users.length}</strong> users shown</span>
        <span>·</span>
        <span><strong className="text-white">{users.filter(u => u.role === "MEMBER").length}</strong> members</span>
        <span>·</span>
        <span><strong className="text-white">{users.filter(u => u.role === "PROFESSIONAL").length}</strong> professionals</span>
        <span>·</span>
        <span><strong className="text-white">{users.filter(u => u.role === "ADMIN").length}</strong> admins</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-slate-900/60 border-b border-slate-800">
              <tr>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">User</th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Role</th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Tier</th>
                <th className="text-left text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Joined</th>
                <th className="text-right text-xs font-bold text-slate-400 px-5 py-3.5 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(u => {
                const rc = roleConfig[u.role] || roleConfig.MEMBER;
                const tc = tierConfig[u.tier] || tierConfig.FREE;
                const RoleIcon = rc.icon;
                return (
                  <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/50">
                          {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            : <span className="text-white font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-sm">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${rc.className}`}>
                        <RoleIcon className="w-3 h-3" />{rc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${tc.className}`}>{tc.label}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{timeAgo(u.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={e => toggleDropdown(u.id, e.currentTarget)}
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
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Portal dropdown — renders outside overflow:hidden container */}
      {openDropdown && (
        <UserEditDropdown
          userId={openDropdown.id}
          currentRole={users.find(u => u.id === openDropdown.id)?.role ?? "MEMBER"}
          currentTier={users.find(u => u.id === openDropdown.id)?.tier ?? "FREE"}
          anchor={openDropdown.rect}
          onClose={() => setOpenDropdown(null)}
          onSelectRole={role => updateUser(openDropdown.id, { role })}
          onSelectTier={tier => updateUser(openDropdown.id, { tier })}
        />
      )}
    </div>
  );
}
