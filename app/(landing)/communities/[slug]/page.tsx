"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { Loader2 } from "lucide-react";
import {
  ArrowLeft01Icon, UserGroupIcon, Message01Icon, LockIcon, GlobeIcon,
  MailSend01Icon, ThumbsUpIcon, Clock01Icon, Tick02Icon, UserCircleIcon,
} from "hugeicons-react";

interface CommunityDetail {
  id: string; name: string; slug: string; description: string;
  icon: string | null; isPublic: boolean; memberCount: number; createdAt: string;
  isMember: boolean;
  creator: { id: string; name: string; image: string | null };
  _count: { members: number; posts: number };
  members: { user: { id: string; name: string; image: string | null } }[];
}

interface Post {
  id: string; content: string; createdAt: string;
  author: { id: string; name: string; image: string | null; headline: string | null };
  _count: { comments: number; likes: number };
}

const PALETTE = [
  "from-blue-600 to-indigo-700", "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600", "from-purple-600 to-violet-700",
];

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

/* ─── Skeleton post ────────────────────────────────────────── */
function SkeletonPost() {
  return (
    <div className="bg-white rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-5/6" />
        <div className="h-3 bg-slate-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const user     = useAppSelector(s => s.auth.user);

  const [community,    setCommunity]    = useState<CommunityDetail | null>(null);
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isNotFound,   setIsNotFound]  = useState(false);
  const [isMember,     setIsMember]     = useState(false);
  const [joining,      setJoining]      = useState(false);
  const [leaving,      setLeaving]      = useState(false);
  const [draft,        setDraft]        = useState("");
  const [posting,      setPosting]      = useState(false);
  const [activeTab,    setActiveTab]    = useState<"posts"|"members"|"about">("posts");
  const [likedPosts,   setLikedPosts]   = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`/api/communities/${slug}`)
      .then(r => { if (!r.ok) { setIsNotFound(true); return null; } return r.json(); })
      .then((data: CommunityDetail | null) => {
        if (data) { setCommunity(data); setIsMember(data.isMember); }
      })
      .catch(() => setIsNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    setPostsLoading(true);
    fetch(`/api/communities/${slug}/posts`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [slug]);

  const handleJoin = async () => {
    if (!user) { window.location.href = `/login?redirect=/communities/${slug}`; return; }
    setJoining(true);
    try {
      const res = await fetch("/api/communities/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: community?.id }),
      });
      if (res.ok || res.status === 409) {
        setIsMember(true);
        if (res.ok) setCommunity(c => c ? { ...c, memberCount: c.memberCount + 1 } : c);
      }
    } catch { /* ignore */ } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!user || !community) return;
    setLeaving(true);
    try {
      const res = await fetch("/api/communities/join", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: community.id }),
      });
      if (res.ok) {
        setIsMember(false);
        setCommunity(c => c ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c);
      }
    } catch { /* ignore */ } finally { setLeaving(false); }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/communities/${slug}/posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...prev]);
        setDraft("");
        setCommunity(c => c ? { ...c, _count: { ...c._count, posts: c._count.posts + 1 } } : c);
      }
    } catch { /* ignore */ } finally { setPosting(false); }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const wasLiked = likedPosts[postId];
    setLikedPosts(p => ({ ...p, [postId]: !wasLiked }));
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, _count: { ...p._count, likes: p._count.likes + (wasLiked ? -1 : 1) } }
      : p));
    try { await fetch(`/api/feed/${postId}/like`, { method: "POST" }); }
    catch { /* ignore */ }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-36 bg-slate-200 rounded-2xl animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
          <div className="space-y-4">
            {[1,2,3].map(i => <SkeletonPost key={i} />)}
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 animate-pulse h-32" />
            <div className="bg-white rounded-2xl p-4 animate-pulse h-24" />
          </div>
        </div>
      </div>
    </div>
  );

  if (isNotFound || !community) {
    notFound();
  }

  const gradient = PALETTE[community.name.charCodeAt(0) % PALETTE.length];
  const isEmoji  = community.icon && community.icon.length <= 4;

  return (
    <div className="min-h-screen bg-slate-100 pt-4 pb-12">
      <div className="max-w-5xl mx-auto px-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link href="/communities" className="hover:text-[#0a1628] transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft01Icon className="w-3.5 h-3.5" /> Communities
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-medium">{community.name}</span>
        </div>

        {/* Hero banner */}
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl h-36 relative mb-5`}>
          {/* Community icon */}
          <div className="absolute -bottom-7 left-5 w-20 h-20 rounded-2xl border-4 border-white bg-white shadow flex items-center justify-center overflow-hidden">
            {isEmoji
              ? <span className="text-3xl">{community.icon}</span>
              : community.icon
                ? <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                : <span className="text-[#0a1628] font-black text-3xl">{community.name[0]}</span>}
          </div>
          {/* Private badge */}
          {!community.isPublic && (
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/30 text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
              <LockIcon className="w-3 h-3" /> Private
            </div>
          )}
        </div>

        {/* Community meta */}
        <div className="flex items-start justify-between gap-4 mb-5 pt-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-[#0a1628]">{community.name}</h1>
              {community.isPublic
                ? <GlobeIcon className="w-4 h-4 text-slate-400" />
                : <LockIcon className="w-4 h-4 text-slate-400" />}
            </div>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">{community.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <UserGroupIcon className="w-3.5 h-3.5" />{community.memberCount.toLocaleString()} members
              </span>
              <span className="flex items-center gap-1">
                <Message01Icon className="w-3.5 h-3.5" />{community._count.posts} posts
              </span>
            </div>
          </div>

          {/* Single Join/Member button */}
          {isMember ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                <Tick02Icon className="w-4 h-4" /> Member
              </span>
              <button onClick={handleLeave} disabled={leaving}
                className="flex items-center gap-1.5 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all disabled:opacity-60">
                {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {leaving ? "Leaving…" : "Leave"}
              </button>
            </div>
          ) : (
            <button onClick={handleJoin} disabled={joining}
              className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-60 shrink-0">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserGroupIcon className="w-4 h-4" />}
              {joining ? "Joining…" : "Join"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-5">
          {(["posts","members","about"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab ? "border-[#0a1628] text-[#0a1628]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              {tab === "posts"
                ? `Posts${community._count.posts > 0 ? ` (${community._count.posts})` : ""}`
                : tab === "members"
                  ? `Members (${community.memberCount})`
                  : "About"}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

          {/* ── Main column ── */}
          <div className="space-y-4">

            {/* Posts tab */}
            {activeTab === "posts" && (
              <>
                {/* Composer — only if member */}
                {isMember ? (
                  <form onSubmit={handlePost} className="bg-white rounded-2xl p-4">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
                        {user?.image
                          ? <img src={user.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          : <span className="text-white font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>}
                      </div>
                      <div className="flex-1">
                        <textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)} rows={2}
                          placeholder={`Share something with ${community.name}…`}
                          className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-[inherit] outline-none resize-none border border-slate-100 focus:border-slate-300 transition-all" />
                        <div className="flex justify-end mt-2">
                          <button type="submit" disabled={posting || !draft.trim()}
                            className="flex items-center gap-1.5 bg-[#0a1628] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-50">
                            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailSend01Icon className="w-3.5 h-3.5" />}
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Non-members: soft gate, no extra join button */
                  <div className="bg-white rounded-2xl px-5 py-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <UserCircleIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600">Join to participate in discussions</p>
                      <p className="text-xs text-slate-400 mt-0.5">Members can post and like.</p>
                    </div>
                    <button onClick={handleJoin} disabled={joining}
                      className="flex items-center gap-2 bg-[#0a1628] text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#1a3a6b] transition-all disabled:opacity-60 shrink-0">
                      {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      {joining ? "Joining…" : "Join"}
                    </button>
                  </div>
                )}

                {/* Posts list */}
                {postsLoading ? (
                  <>{[1,2].map(i => <SkeletonPost key={i} />)}</>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-2xl py-16 text-center">
                    <Message01Icon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="font-semibold text-slate-400">No posts yet — be the first!</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="bg-white rounded-2xl p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center shrink-0">
                          {post.author.image
                            ? <img src={post.author.image} alt={post.author.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            : <span className="text-white font-bold text-sm">{post.author.name?.[0]?.toUpperCase()}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#0a1628] text-sm">{post.author.name}</div>
                          {post.author.headline && <div className="text-xs text-slate-400">{post.author.headline}</div>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                          <Clock01Icon className="w-3 h-3" />{timeAgo(post.createdAt)}
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-3">{post.content}</p>
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                        <button onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${likedPosts[post.id] ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50 hover:text-blue-600"}`}>
                          <ThumbsUpIcon className="w-3.5 h-3.5" />{post._count.likes + (likedPosts[post.id] ? 0 : 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 px-3 py-1.5 rounded-xl transition-all">
                          <Message01Icon className="w-3.5 h-3.5" />{post._count.comments} {post._count.comments === 1 ? "Comment" : "Comments"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Members tab */}
            {activeTab === "members" && (
              <div className="bg-white rounded-2xl p-5">
                <h2 className="font-black text-[#0a1628] mb-4">Members ({community.memberCount.toLocaleString()})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {community.members.map(m => (
                    <div key={m.user.id} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl p-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center">
                        {m.user.image
                          ? <img src={m.user.image} alt={m.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          : <span className="text-white font-bold text-sm">{m.user.name?.[0]?.toUpperCase()}</span>}
                      </div>
                      <div className="text-xs font-semibold text-[#0a1628] line-clamp-1">{m.user.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About tab */}
            {activeTab === "about" && (
              <div className="bg-white rounded-2xl p-5 space-y-4">
                <h2 className="font-black text-[#0a1628]">About {community.name}</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{community.description}</p>
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {[
                    { label: "Created by",  value: community.creator.name },
                    { label: "Visibility",  value: community.isPublic ? "Public" : "Private" },
                    { label: "Members",     value: community.memberCount.toLocaleString() },
                    { label: "Posts",       value: community._count.posts },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="font-bold text-[#0a1628]">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky right sidebar ── */}
          <div className="hidden lg:block self-start sticky top-[100px] space-y-3">

            {/* Stats */}
            <div className="bg-white rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Community</p>
              {[
                { Icon: UserGroupIcon, label: "Members",     val: community.memberCount.toLocaleString() },
                { Icon: Message01Icon, label: "Discussions", val: community._count.posts },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5 text-xs">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                  <span className="font-black text-[#0a1628]">{val}</span>
                </div>
              ))}
            </div>

            {/* Members avatars — no join button here */}
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Members</p>
              <div className="flex flex-wrap gap-2">
                {community.members.slice(0,10).map(m => (
                  <div key={m.user.id} title={m.user.name}
                    className="w-9 h-9 rounded-full bg-[#0a1628] overflow-hidden flex items-center justify-center border-2 border-white">
                    {m.user.image
                      ? <img src={m.user.image} alt={m.user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-xs">{m.user.name?.[0]?.toUpperCase()}</span>}
                  </div>
                ))}
                {community.memberCount > 10 && (
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    +{community.memberCount - 10}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
