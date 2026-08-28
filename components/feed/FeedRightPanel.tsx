"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, ExternalLink, Users, ShoppingBag,
  CheckCircle2, RefreshCw, Newspaper, ChevronRight,
  Briefcase, Star, Radio, Mic, Calendar, Sparkles,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface SpaceHost {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
}

interface SpaceItem {
  id: string;
  name: string;
  description: string | null;
  isLive: boolean;
  scheduledAt: string | null;
  createdAt: string;
  host: SpaceHost;
  _count: { rsvps: number };
}

interface IrsItem {
  id: string; title: string; link: string;
  description: string; pubDate: string; irNumber: string;
}

interface Community {
  id: string; name: string; description: string;
  memberCount: number; slug: string; isMember: boolean;
}

interface Pro {
  id: string; name: string; image: string | null;
  headline: string | null; specialties: string[];
}

interface Listing {
  id: string; title: string; category: string;
  price: number | null; user: { name: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const BG = ["from-blue-600 to-blue-800", "from-amber-500 to-orange-600",
            "from-violet-600 to-purple-800", "from-emerald-500 to-teal-700",
            "from-rose-500 to-pink-700"];

const catColors: Record<string, string> = {
  SERVICE: "bg-blue-100 text-blue-700", PRODUCT: "bg-purple-100 text-purple-700",
  NETWORK: "bg-emerald-100 text-emerald-700", TRAINING: "bg-amber-100 text-amber-700",
};
const catLabels: Record<string, string> = {
  SERVICE: "Service", PRODUCT: "Product", NETWORK: "Network", TRAINING: "Course",
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatScheduledShort(d: string) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today at ${timeStr}`;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${timeStr}`;
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, icon: Icon, href, linkLabel, children }: {
  title: string; icon: React.ElementType;
  href?: string; linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0a1628]/8 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#d4a017]" />
          </div>
          <h3 className="font-black text-[#0a1628] text-sm">{title}</h3>
        </div>
        {href && (
          <Link href={href}
            className="text-[11px] font-bold text-[#d4a017] hover:text-amber-600 flex items-center gap-0.5 transition-colors">
            {linkLabel ?? "See all"} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SkeletonRow({ lines = 2 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-1.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-100 rounded ${i === 0 ? "w-3/4" : "w-1/2"}`} />
      ))}
    </div>
  );
}

// ── Live Pro Talks ───────────────────────────────────────────────────────────

function LiveProTalksSection() {
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spaces")
      .then(r => (r.ok ? r.json() : []))
      .then((d: SpaceItem[]) => {
        setSpaces(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const liveSpaces = spaces.filter(s => s.isLive);
  const upcomingSpaces = spaces.filter(s => !s.isLive && s.scheduledAt);

  return (
    <div className="bg-gradient-to-b from-[#0a1628] to-[#0f213d] text-white rounded-2xl overflow-hidden shadow-md border border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            {liveSpaces.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
            )}
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-white text-sm">Live Pro Talks</h3>
            {liveSpaces.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> LIVE
              </span>
            )}
          </div>
        </div>
        <Link
          href="/pro-talks"
          className="text-[11px] font-bold text-[#f0c040] hover:text-amber-300 flex items-center gap-0.5 transition-colors"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-2.5 animate-pulse">
            <div className="h-14 bg-white/5 rounded-xl" />
            <div className="h-14 bg-white/5 rounded-xl" />
          </div>
        ) : liveSpaces.length > 0 ? (
          <div className="space-y-2.5">
            {liveSpaces.slice(0, 3).map((space) => (
              <div
                key={space.id}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-emerald-500/40">
                      {space.host?.image ? (
                        <img src={space.host.image} alt={space.host.name} className="w-full h-full object-cover" />
                      ) : (
                        space.host?.name?.[0]?.toUpperCase() ?? "P"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{space.name}</p>
                      <p className="text-[10px] text-white/60 truncate">Host: {space.host?.name ?? "Tax Pro"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Happening Now</span>
                  </div>

                  <Link
                    href={`/spaces/${space.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#060e1a] text-xs font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all group-hover:scale-105"
                  >
                    <Radio className="w-3 h-3" /> Join Talk
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : upcomingSpaces.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#f0c040]" />
              <span>Upcoming Pro Talks</span>
            </div>
            {upcomingSpaces.slice(0, 2).map((space) => (
              <div
                key={space.id}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all"
              >
                <p className="text-xs font-bold text-white truncate mb-1">{space.name}</p>
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>{space.scheduledAt ? formatScheduledShort(space.scheduledAt) : "Upcoming"}</span>
                  <Link
                    href="/pro-talks"
                    className="text-[#f0c040] hover:text-amber-300 font-bold flex items-center gap-0.5"
                  >
                    RSVP <ChevronRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3.5 px-2 bg-white/5 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 text-white/60">
              <Radio className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white mb-0.5">No Live Talks Right Now</p>
            <p className="text-[11px] text-white/50 mb-3">Join or host live audio & video sessions with fellow tax pros.</p>
            <Link
              href="/pro-talks"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] text-xs font-extrabold shadow-sm hover:opacity-95 transition-all"
            >
              <Mic className="w-3.5 h-3.5" /> Explore Pro Talks
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── IRS News ─────────────────────────────────────────────────────────────────

function IrsNewsSection() {
  const [news, setNews]     = useState<IrsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale]   = useState(false);

  useEffect(() => {
    fetch("/api/irs-news")
      .then(r => r.json())
      .then((d: IrsItem[]) => {
        const arr = Array.isArray(d) ? d : [];
        setNews(arr.slice(0, 5));
        setStale(arr.length === 0);
      })
      .catch(() => setStale(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section title="IRS Tax News" icon={Newspaper} href="https://www.irs.gov/newsroom" linkLabel="IRS.gov">
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonRow key={i} lines={3} />)}
        </div>
      ) : stale || news.length === 0 ? (
        <div className="text-center py-4">
          <RefreshCw className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Could not load news. <a href="https://www.irs.gov/newsroom" target="_blank" rel="noreferrer" className="text-[#d4a017] underline">Visit IRS.gov →</a></p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {news.map((item, i) => (
            <a key={item.id} href={item.link} target="_blank" rel="noreferrer"
              className="group flex items-start gap-2.5 hover:opacity-80 transition-opacity">
              <span className="text-[11px] font-black text-slate-300 w-4 shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0a1628] leading-snug line-clamp-2 group-hover:text-[#1a3a6b] transition-colors">
                  {item.title}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {item.irNumber && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                      {item.irNumber}
                    </span>
                  )}
                  {item.pubDate && (
                    <span className="text-[10px] text-slate-400">{item.pubDate}</span>
                  )}
                  <ExternalLink className="w-2.5 h-2.5 text-slate-300 ml-auto shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Communities ───────────────────────────────────────────────────────────────

function CommunitiesSection() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedMap, setJoinedMap]     = useState<Record<string, boolean>>({});
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch("/api/communities")
      .then(r => r.json())
      .then((c: Community[]) => {
        const comms = Array.isArray(c) ? c.slice(0, 4) : [];
        setCommunities(comms);
        const init: Record<string, boolean> = {};
        comms.forEach(x => { if (x.isMember) init[x.id] = true; });
        setJoinedMap(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (id: string) => {
    try {
      const res = await fetch("/api/communities/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: id }),
      });
      if (res.ok || res.status === 409) setJoinedMap(p => ({ ...p, [id]: true }));
    } catch { /* ignore */ }
  };

  if (!loading && communities.length === 0) return null;

  return (
    <Section title="Communities" icon={Users} href="/communities">
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : (
          communities.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${BG[i % 5]} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0a1628] truncate">{c.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />{c.memberCount.toLocaleString()} members
                </div>
              </div>
              {joinedMap[c.id] ? (
                <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Joined
                </span>
              ) : (
                <button onClick={() => handleJoin(c.id)}
                  className="text-[10px] font-black text-[#0a1628] border border-[#0a1628]/30 px-2 py-1 rounded-full hover:bg-[#0a1628] hover:text-white transition-all shrink-0">
                  + Join
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Section>
  );
}

// ── Top Professionals ─────────────────────────────────────────────────────────

function TopProsSection() {
  const [pros, setPros]       = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pros")
      .then(r => r.json())
      .then((d: Pro[]) => setPros(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && pros.length === 0) return null;

  return (
    <Section title="Top Tax Professionals" icon={Star} href="/find-a-pro" linkLabel="Find a Pro">
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          pros.map((p, i) => (
            <Link key={p.id} href={`/find-a-pro`}
              className="flex items-center gap-2.5 group">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${BG[i % 5]} flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden ring-2 ring-white shadow-sm`}>
                {p.image
                  ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  : p.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#0a1628] truncate group-hover:text-[#1a3a6b] transition-colors">
                  {p.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {p.headline ?? (p.specialties[0] ?? "Tax Professional")}
                </div>
              </div>
              <Briefcase className="w-3 h-3 text-slate-300 shrink-0" />
            </Link>
          ))
        )}
      </div>
    </Section>
  );
}

// ── Marketplace ───────────────────────────────────────────────────────────────

function MarketplaceSection() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/marketplace")
      .then(r => r.json())
      .then((d: Listing[]) => setListings(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && listings.length === 0) return null;

  return (
    <Section title="Marketplace" icon={ShoppingBag} href="/marketplace">
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-2.5 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-2.5 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : (
          listings.map(l => (
            <Link key={l.id} href={`/marketplace`}
              className="flex items-start gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#0a1628] line-clamp-2 leading-snug group-hover:text-[#1a3a6b] transition-colors">
                  {l.title}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${catColors[l.category] ?? "bg-slate-100 text-slate-500"}`}>
                    {catLabels[l.category] ?? l.category}
                  </span>
                  <span className="text-[10px] font-black text-[#0a1628]">
                    {l.price != null ? `$${l.price}` : "Free"}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function FeedRightPanel() {
  return (
    <aside className="w-full space-y-3">
      <LiveProTalksSection />
      <IrsNewsSection />
      <TopProsSection />
      <CommunitiesSection />
      <MarketplaceSection />

      {/* Footer */}
      <div className="px-2 pb-2">
        <p className="text-[10px] text-slate-400 leading-relaxed text-center">
          TaxCompPro · <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link> · © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
