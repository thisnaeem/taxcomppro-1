"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import {
  BubbleChatIcon as MessageSquare, Add01Icon as Plus, Loading03Icon as Loader2,
  LockIcon as Lock, PinIcon as Pin, Edit01Icon as Pencil, Delete02Icon as Trash2,
  Cancel01Icon as X, Tick02Icon as Check, Search01Icon, ArrowRight01Icon,
  Building03Icon, UserGroupIcon, BookOpen01Icon, Idea01Icon,
} from "hugeicons-react";
import "@/components/pro-hub/pro-hub.css";

interface Forum {
  id: string; name: string; slug: string; description: string | null;
  image: string | null; isAdminOnly: boolean; isPinned: boolean; badge: string | null;
  createdBy: { name: string; image: string | null };
  _count: { posts: number };
  posts: { createdAt: string }[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

/* ─── Create/Edit Forum Modal ─── */
function ForumModal({ initial, onSave, onClose }: {
  initial?: Forum | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [name,        setName]        = useState(initial?.name ?? "");
  const [slug,        setSlug]        = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image,       setImage]       = useState(initial?.image ?? "");
  const [badge,       setBadge]       = useState(initial?.badge ?? "");
  const [isAdminOnly, setIsAdminOnly] = useState(initial?.isAdminOnly ?? false);
  const [isPinned,    setIsPinned]    = useState(initial?.isPinned ?? false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLInputElement>("input")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, select, a[href]'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keyboard); previous?.focus(); };
  }, [onClose]);

  const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const handleNameChange = (v: string) => { setName(v); if (!initial) setSlug(autoSlug(v)); };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) { setError("Name and slug are required"); return; }
    setSaving(true); setError("");
    try {
      await onSave({ name, slug, description, image, badge, isAdminOnly, isPinned });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="forum-dialog-title" className="hub-dialog bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="forum-dialog-title" className="font-black text-[#0a1628] text-lg">{initial ? "Edit Forum" : "Create Forum"}</h2>
          <button aria-label="Close forum editor" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
          {image && <div className="h-28 rounded-xl overflow-hidden bg-slate-100"><img src={image} alt="" className="w-full h-full object-cover" /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="forum-name" className="block text-xs font-bold text-slate-600 mb-1">Forum Name *</label>
              <input id="forum-name" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. IRS Updates"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]" />
            </div>
            <div className="col-span-2">
              <label htmlFor="forum-slug" className="block text-xs font-bold text-slate-600 mb-1">Slug *</label>
              <input id="forum-slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="irs-updates"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#0a1628]" />
            </div>
            <div className="col-span-2">
              <label htmlFor="forum-description" className="block text-xs font-bold text-slate-600 mb-1">Description</label>
              <textarea id="forum-description" value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="What is this forum about?"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0a1628]" />
            </div>
            <div className="col-span-2">
              <label htmlFor="forum-image" className="block text-xs font-bold text-slate-600 mb-1">Cover Image URL</label>
              <input id="forum-image" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Badge Label
                <span className="text-slate-400 font-normal ml-1">(use &quot;IRS&quot; to enable news sync)</span>
              </label>
              <input aria-label="Badge label" value={badge} onChange={e => setBadge(e.target.value)} placeholder="e.g. IRS"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a1628]" />
            </div>
            <div className="flex flex-col gap-2 justify-end">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                <input type="checkbox" checked={isAdminOnly} onChange={e => setIsAdminOnly(e.target.checked)} className="rounded" />
                Admin posts only
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="rounded" />
                Pin to top
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="text-sm font-semibold text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="hub-primary disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Forum"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_FORUM_IMAGE = "/prohub/LATEST%20UPDATES.png";

const FORUM_IMAGE_FALLBACKS: Record<string, string> = {
  // IRS & Updates
  "irs-news-room": "/prohub/LATEST%20UPDATES.png",
  "irs-newsroom": "/prohub/LATEST%20UPDATES.png",
  "irs-updates": "/prohub/LATEST%20UPDATES.png",
  "industry-updates--regulatory-changes": "/prohub/LATEST%20UPDATES.png",
  "industry-updates": "/prohub/LATEST%20UPDATES.png",

  // Audits & Due Diligence
  "irs-audits--due-diligence": "/prohub/IRS%20AUDITS%20_%20DUE.png",
  "irs-audits-due-diligence": "/prohub/IRS%20AUDITS%20_%20DUE.png",
  "irs-audits": "/prohub/IRS%20AUDITS%20_%20DUE.png",
  "audit-defense--irs-notices": "/prohub/Marketplace%20Announcements%20(6).png",
  "audit-defense-irs-notices": "/prohub/Marketplace%20Announcements%20(6).png",
  "audit-defense": "/prohub/Marketplace%20Announcements%20(6).png",

  // Operations & Workflow
  "tax-office-operations--workflow": "/prohub/TAX%20OFFICE%20OPERATIONS.png",
  "tax-office-operations-workflow": "/prohub/TAX%20OFFICE%20OPERATIONS.png",
  "tax-office-operations": "/prohub/TAX%20OFFICE%20OPERATIONS.png",

  // Compliance & Record Retention
  "compliance--record-retention": "/prohub/RECORD%20RETENSION.png",
  "compliance-record-retention": "/prohub/RECORD%20RETENSION.png",
  "compliance--record-retension": "/prohub/RECORD%20RETENSION.png",
  "due-diligence--compliance": "/prohub/DUE%20DILIGENCE.png",
  "due-diligence-compliance": "/prohub/DUE%20DILIGENCE.png",
  "due-diligence": "/prohub/DUE%20DILIGENCE.png",

  // Marketplace Announcements
  "marketplace-announcements": "/prohub/Marketplace%20Announcements%20(3).png",
  "marketplace": "/prohub/Marketplace%20Announcements%20(3).png",

  // Marketing & Client Acquisition
  "marketing--client-acquisition": "/prohub/MARKETING.png",
  "marketing-client-acquisition": "/prohub/MARKETING.png",
  "marketing": "/prohub/MARKETING.png",

  // Hiring, Training & Staff Management
  "hiring-training--staff-management": "/prohub/HIRING%20TRAINING.png",
  "hiring-training-staff-management": "/prohub/HIRING%20TRAINING.png",
  "hiring-training": "/prohub/HIRING%20TRAINING.png",

  // Tax Software & Technology
  "tax-software--technology": "/prohub/TAX%20SOFTWARE.png",
  "tax-software-technology": "/prohub/TAX%20SOFTWARE.png",
  "tax-software": "/prohub/TAX%20SOFTWARE.png",

  // Banking & Refund Products
  "banking--refund-products": "/prohub/BAKING%20_%20REFUND.png",
  "banking-refund-products": "/prohub/BAKING%20_%20REFUND.png",
  "baking--refund-products": "/prohub/BAKING%20_%20REFUND.png",

  // Business Growth & Expansion
  "business-growth--expansion": "/prohub/BUSINESS%20GROWTH).png",
  "business-growth-expansion": "/prohub/BUSINESS%20GROWTH).png",
  "business-growth": "/prohub/BUSINESS%20GROWTH).png",

  // Schedule C & Self Employment
  "schedule-c--self-employment-returns": "/prohub/SCHEDULE%20C(12).png",
  "schedule-c-self-employment-returns": "/prohub/SCHEDULE%20C(12).png",
  "schedule-c": "/prohub/SCHEDULE%20C(12).png",

  // Forms
  "new-forms": "/prohub/FORMS.png",
  "forms": "/prohub/FORMS.png",
};

function getForumImageUrl(forum: { slug?: string; name?: string; image?: string | null }): string {
  if (forum.slug && FORUM_IMAGE_FALLBACKS[forum.slug]) {
    return FORUM_IMAGE_FALLBACKS[forum.slug];
  }
  if (
    forum.image &&
    forum.image.trim() &&
    !forum.image.includes("taxcomppro.com/wp-content") &&
    !forum.image.includes("pexels.com")
  ) {
    return forum.image;
  }
  return DEFAULT_FORUM_IMAGE;
}

const IRS_FORUM: Forum = {
  id: "irs-updates", slug: "irs-updates", name: "IRS Updates",
  description: "Latest IRS news releases, tax guidance, and announcements. Auto-synced from the official IRS Newsroom.",
  image: "/prohub/LATEST%20UPDATES.png", isAdminOnly: false, isPinned: true, badge: "IRS",
  createdBy: { name: "Tax Compliance Pro", image: null }, _count: { posts: 0 }, posts: [],
};

function ForumCard({ forum, isAdmin, onEdit, onDelete }: {
  forum: Forum; isAdmin: boolean; onEdit: (forum: Forum) => void; onDelete: (id: string) => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isNews = forum.id === IRS_FORUM.id;
  const lastActivity = forum.posts[0]?.createdAt;
  return <article className="hub-card">
    <Link href={`/pro-hub/${forum.slug}`} className="hub-card-core" onClick={isNews ? () => { void fetch("/api/pro-hub/irs-updates/auto-init").catch(() => {}); } : undefined}>
      <div className="hub-card-cover">
        <img src={imageFailed ? DEFAULT_FORUM_IMAGE : getForumImageUrl(forum)} alt="" loading="lazy" onError={() => setImageFailed(true)} />
        <div className="hub-card-badges">
          {forum.isPinned && <span className="hub-badge-gold"><Pin size={12} /> Pinned</span>}
          {forum.badge && <span>{forum.badge}</span>}
          {forum.isAdminOnly && <span><Lock size={12} /> Admin posts</span>}
        </div>
      </div>
      <div className="hub-card-body">
        <div className="hub-card-category">{isNews ? <Building03Icon size={16} /> : <MessageSquare size={16} />}{isNews ? "Official updates" : "Discussion forum"}</div>
        <h3>{forum.name}</h3>
        <p>{forum.description || "Connect with fellow professionals and join the conversation."}</p>
        <div className="hub-card-meta"><span><MessageSquare size={15} />{isNews ? "Live discussions" : `${forum._count.posts} discussion${forum._count.posts === 1 ? "" : "s"}`}</span>{lastActivity && <span>{timeAgo(lastActivity)}</span>}</div>
        <div className="hub-card-action"><span>{isNews ? "View updates" : "Explore forum"}</span><span className="hub-card-arrow"><ArrowRight01Icon size={19} /></span></div>
      </div>
    </Link>
    {isAdmin && !isNews && <div className="hub-card-admin">
      <button onClick={() => onEdit(forum)} aria-label={`Edit ${forum.name}`} title="Edit forum"><Pencil size={16} /></button>
      <button onClick={() => onDelete(forum.id)} aria-label={`Delete ${forum.name}`} title="Delete forum"><Trash2 size={16} /></button>
    </div>}
  </article>;
}

export default function ProHubPage() {
  const user = useAppSelector(state => state.auth.user);
  const isAdmin = user?.role === "ADMIN";
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "active">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editForum, setEditForum] = useState<Forum | null>(null);
  const reload = () => { setLoading(true); setError(""); setRetry(value => value + 1); };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pro-hub", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("We couldn’t load the forums. Please try again."); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error("The forums are temporarily unavailable.");
        if (!controller.signal.aborted) setForums(data.filter((forum: Forum) => forum.slug !== "irs-updates"));
      })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load forums."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  const handleSave = async (data: Record<string, unknown>) => {
    const response = await fetch(editForum ? `/api/pro-hub/${editForum.slug}` : "/api/pro-hub", {
      method: editForum ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!response.ok) { const error = await response.json(); throw new Error(error.error || "Could not save this forum."); }
    reload();
  };
  const handleDelete = async (id: string) => {
    const forum = forums.find(forum => forum.id === id);
    if (!forum || !confirm(`Delete "${forum.name}"? All discussions will be lost.`)) return;
    try {
      const response = await fetch(`/api/pro-hub/${forum.slug}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this forum. Please try again.");
      setForums(previous => previous.filter(forum => forum.id !== id));
    } catch (error) { setError(error instanceof Error ? error.message : "Could not delete forum."); }
  };
  const allForums = [IRS_FORUM, ...forums];
  const visible = allForums.filter(forum => {
    const matches = `${forum.name} ${forum.description || ""} ${forum.badge || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matches && (filter === "all" || (filter === "pinned" && forum.isPinned) || (filter === "active" && (forum._count.posts > 0 || forum.id === IRS_FORUM.id)));
  });

  return <div className="hub-page">
    <div className="hub-container">
      <header className="hub-hero">
        <div className="hub-hero-copy"><span className="hub-eyebrow"><UserGroupIcon size={17} /> Your professional community</span><h1>Pro Hub<span>.</span></h1><h2>Ask. Learn. Grow.</h2><p>Where Tax Professionals Connect and Learn from Experienced Peers.</p><a className="hub-primary" href="#discussion-forums">Explore discussions <ArrowRight01Icon size={18} /></a></div>
        <div className="hub-hero-panel" aria-hidden="true"><div className="hub-hero-symbols"><span><MessageSquare size={34} /></span><span><BookOpen01Icon size={34} /></span><span><Idea01Icon size={34} /></span></div><strong>A place to ask.<br />A community to grow with.</strong><span className="hub-hero-line" /></div>
      </header>
      <section id="discussion-forums" className="hub-forums" aria-labelledby="hub-forums-title">
        <div className="hub-section-heading"><div><span className="hub-eyebrow">Find your conversation</span><h2 id="hub-forums-title">Discussion Forums</h2><p aria-live="polite">{loading ? "Finding your forums…" : `${visible.length} forum${visible.length === 1 ? "" : "s"} to explore`}</p></div>{isAdmin && <button className="hub-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Create Forum</button>}</div>
        <div className="hub-toolbar"><label className="hub-search"><Search01Icon size={19} /><input aria-label="Search discussion forums" placeholder="Find a topic or conversation…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")} aria-label="Clear forum search"><X size={17} /></button>}</label><div className="hub-filters" aria-label="Filter forums">{([['all','All forums'],['pinned','Pinned'],['active','Active discussions']] as const).map(([value,label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'pinned' && <Pin size={15} />}{label}</button>)}</div></div>
        {error ? <div className="hub-empty" role="alert"><span><MessageSquare size={30} /></span><h3>Something needs another try</h3><p>{error}</p><button className="hub-primary" onClick={reload}>Try again</button></div> : loading ? <div className="hub-grid" role="status" aria-label="Loading forums">{Array.from({length:6},(_,i) => <div key={i} className="hub-card hub-skeleton" aria-hidden="true"><div className="hub-skeleton-cover" /><div className="hub-skeleton-body"><i /><i /><i /><div /><i /></div></div>)}</div> : visible.length ? <div className="hub-grid">{visible.map(forum => <ForumCard key={`${forum.id}-${forum.image}`} forum={forum} isAdmin={isAdmin} onEdit={setEditForum} onDelete={handleDelete} />)}</div> : <div className="hub-empty"><span><Search01Icon size={30} /></span><h3>No conversations found</h3><p>Try another topic or browse all discussion forums.</p><button className="hub-primary" onClick={() => { setQuery(""); setFilter("all"); }}>Show all forums <ArrowRight01Icon size={18} /></button></div>}
      </section>
    </div>
    {showCreate && <ForumModal onSave={handleSave} onClose={() => setShowCreate(false)} />}
    {editForum && <ForumModal initial={editForum} onSave={handleSave} onClose={() => setEditForum(null)} />}
  </div>;
}
