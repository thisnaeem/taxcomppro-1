"use client";

import { Fragment, useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostComposer from "@/components/feed/PostComposer";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import FeedLeftPanel from "@/components/feed/FeedLeftPanel";
import FeedRightPanel from "@/components/feed/FeedRightPanel";
import ScheduledPostsPanel from "@/components/feed/ScheduledPostsPanel";
import { PostSkeleton, LeftPanelSkeleton, RightPanelSkeleton } from "@/components/feed/FeedSkeletons";
import { RefreshCw, MonitorPlay, ExternalLink, Sparkles, X } from "lucide-react";
import { NoteEditIcon } from "hugeicons-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";

function FeedContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isWelcome = searchParams.get("welcome") === "1" || searchParams.get("registered") === "1" || searchParams.get("upgraded") === "1";
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(isWelcome);
  const user = useAppSelector(s => s.auth.user);
  const [posts, setPosts]             = useState<FeedPost[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [hasNew, setHasNew]           = useState(false);
  const [centerAds, setCenterAds]     = useState<{id:string;title:string;description:string|null;imageUrl:string;linkUrl:string;user:{name:string}}[]>([]);

  // Always re-sync fresh user profile from DB on feed mount to avoid stale tier cache
  useEffect(() => {
    fetch("/api/user/me", { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" } })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u?.id) {
          dispatch(setUser({
            id: u.id, email: u.email, name: u.name,
            role: u.role ?? "MEMBER", tier: u.tier ?? "FREE",
            image: u.image ?? null, coverImage: u.coverImage ?? null,
            bio: u.bio ?? null, headline: u.headline ?? null,
            hasDueDiligenceBadge: u.hasDueDiligenceBadge ?? false,
          }));
        }
      })
      .catch(() => {});
  }, [dispatch]);

  // Handle Stripe checkout return with session_id
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    window.history.replaceState({}, "", "/feed");

    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then((data: { tier?: string }) => {
        if (data.tier && data.tier !== "FREE") {
          setShowWelcomeBanner(true);
          fetch("/api/user/me", { cache: "no-store", headers: { "Cache-Control": "no-cache, no-store" } })
            .then(r => r.ok ? r.json() : null)
            .then(u => {
              if (u?.id) {
                dispatch(setUser({
                  id: u.id, email: u.email, name: u.name,
                  role: u.role ?? "MEMBER", tier: u.tier ?? "FREE",
                  image: u.image ?? null, coverImage: u.coverImage ?? null,
                  bio: u.bio ?? null, headline: u.headline ?? null,
                  hasDueDiligenceBadge: u.hasDueDiligenceBadge ?? false,
                }));
              }
            });
        }
      })
      .catch(() => {});
  }, [searchParams, dispatch]);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const loaderRef    = useRef<HTMLDivElement>(null);
  const pollingRef   = useRef<NodeJS.Timeout | null>(null);
  const latestIdRef  = useRef<string | null>(null);

  const fetchFeed = useCallback(async (cursor?: string) => {
    const url = cursor ? `/api/feed?cursor=${cursor}` : "/api/feed";
    const res = await fetch(url);
    const data = await res.json() as { posts?: FeedPost[]; nextCursor?: string | null };
    return {
      posts: Array.isArray(data.posts) ? data.posts : [],
      nextCursor: data.nextCursor ?? null,
    };
  }, []);

  // Initial load
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchFeed()
      .then(({ posts: p, nextCursor: nc }) => {
        setPosts(p);
        setNextCursor(nc);
        if (p[0]) latestIdRef.current = p[0].id;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Fetch center column ads
    fetch("/api/pro-ads/active?placement=CENTER_COLUMN")
      .then(r => r.json()).then(d => setCenterAds(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [fetchFeed]);

  // Poll every 30s for new posts
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const { posts: fresh } = await fetchFeed();
        if (fresh[0] && fresh[0].id !== latestIdRef.current) setHasNew(true);
      } catch { /* ignore */ }
    }, 30_000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchFeed]);

  const refreshFeed = async () => {
    setHasNew(false);
    setLoading(true);
    const { posts: p, nextCursor: nc } = await fetchFeed();
    setPosts(p);
    setNextCursor(nc);
    if (p[0]) latestIdRef.current = p[0].id;
    setLoading(false);
  };

  // Infinite scroll (Facebook / LinkedIn style with threshold & rootMargin)
  useEffect(() => {
    if (!loaderRef.current || !nextCursor) return;
    const obs = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && nextCursor && !loadingMore) {
        setLoadingMore(true);
        try {
          const { posts: more, nextCursor: nc } = await fetchFeed(nextCursor);
          setPosts(prev => [...prev, ...more]);
          setNextCursor(nc);
        } catch { /* ignore */ }
        finally { setLoadingMore(false); }
      }
    }, { rootMargin: "300px" });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [fetchFeed, nextCursor, loadingMore]);

  const handlePostCreated = (post: FeedPost) => {
    setPosts(prev => [post, ...prev]);
    latestIdRef.current = post.id;
  };

  const handlePostUpdate = (updated: FeedPost) =>
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));

  const handlePostDelete = (id: string) =>
    setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <div className="min-h-screen bg-slate-100 pt-5 pb-12">
      <div className="max-w-[1320px] mx-auto px-4">
        {/* Welcome Celebration Banner */}
        {showWelcomeBanner && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 via-[#f0c040] to-amber-600 rounded-3xl p-5 sm:p-6 text-[#0a1628] shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0a1628] text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black leading-tight">
                  Welcome to Tax Compliance Pro! 🎉
                </h2>
                <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5 max-w-2xl">
                  Your membership is activated. You now have full access to professional tax feeds, due diligence toolkits, directory networking, and discussions.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="p-2 rounded-xl bg-[#0a1628]/10 hover:bg-[#0a1628]/20 transition-all text-[#0a1628] shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">

          {/* LEFT — profile panel */}
          <div className="hidden lg:block self-start sticky top-[100px] h-fit max-h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading || !user ? <LeftPanelSkeleton /> : <FeedLeftPanel />}
          </div>

          {/* CENTER — feed */}
          <div className="space-y-4">
            {/* Post Composer starts showing immediately at top for logged-in users */}
            {user && <PostComposer onPostCreated={handlePostCreated} onScheduled={() => setScheduleRefreshKey(k => k + 1)} />}

            {/* Scheduled posts snippet — only for logged-in users */}
            {user && <ScheduledPostsPanel refreshKey={scheduleRefreshKey} />}

            {/* New posts banner */}
            {hasNew && (
              <button onClick={refreshFeed}
                className="w-full flex items-center justify-center gap-2 bg-[#0a1628] text-white text-sm font-bold py-3 rounded-2xl hover:bg-[#1a3a6b] transition-all">
                <RefreshCw className="w-4 h-4" /> New posts — click to refresh
              </button>
            )}

            {/* Main feed list / skeleton */}
            {loading ? (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-[#0c182b] border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-400/10 border border-amber-200/80 dark:border-amber-400/20 flex items-center justify-center mb-4 text-[#d4a017] dark:text-[#f0c040] shadow-sm">
                  <NoteEditIcon className="w-8 h-8" />
                </div>
                <h3 className="font-black text-[#0a1628] dark:text-white text-xl mb-2">Nothing in the feed yet</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">Be the first to share a tax insight with the community!</p>
              </div>
            ) : (
              <>
                {posts.map((post, idx) => {
                  const adIdx = Math.floor(idx / 5);
                  const showAd = idx > 0 && idx % 5 === 0 && centerAds.length > 0;
                  const ad = showAd ? centerAds[adIdx % centerAds.length] : null;
                  return (
                    <Fragment key={post.id}>
                      {ad && (
                        <div className="relative">
                          {/* Sponsored badge — above the card */}
                          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                            <MonitorPlay className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Sponsored</span>
                            <span className="text-[10px] text-slate-400 ml-auto mr-1">by {ad.user.name}</span>
                          </div>
                          {/* Banner card */}
                          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                            className="block relative rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg transition-all">
                            {/* Image */}
                            <div className="w-full aspect-[16/9] overflow-hidden">
                              <img src={ad.imageUrl} alt={ad.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                            </div>
                            {/* Hover overlay — title + desc slide up from bottom */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 py-3
                              translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                              <p className="font-bold text-white text-sm leading-tight">{ad.title}</p>
                              {ad.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{ad.description}</p>}
                              <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold mt-1">
                                <ExternalLink className="w-3 h-3" /> Visit →
                              </span>
                            </div>
                          </a>
                        </div>
                      )}
                      <PostCard post={post} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
                    </Fragment>
                  );
                })}

                {/* Infinite Scroll Trigger & Skeleton loader on scroll */}
                {nextCursor && (
                  <div ref={loaderRef} className="pt-2">
                    {loadingMore && <PostSkeleton />}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT — sidebar */}
          <div className="hidden lg:block self-start sticky top-[100px] h-fit max-h-[calc(100vh-100px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading ? <RightPanelSkeleton /> : <FeedRightPanel />}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
