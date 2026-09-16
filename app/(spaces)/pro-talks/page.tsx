"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useSession } from "@/lib/auth-client";
import {
  Add01Icon,
  ArrowRight01Icon,
  Radio01Icon,
  Calendar03Icon,
  Search01Icon,
  Cancel01Icon,
  GridViewIcon,
  StarIcon,
  FireIcon,
  Mic01Icon,
  UserGroupIcon,
  Shield01Icon,
  AiBrain01Icon,
  CourtLawIcon,
  Briefcase01Icon,
  Copy01Icon,
  Tick01Icon,
  ArrowDown01Icon,
} from "hugeicons-react";
import { PRO_TALK_CATEGORIES } from "@/lib/proTalks";
import {
  HostTalkDialog,
  HostingAccessDialog,
} from "@/components/spaces/HostTalkDialog";

export interface Talk {
  id: string;
  name: string;
  description: string | null;
  category: string;
  mediaType: string;
  visibility: "PUBLIC" | "PRIVATE";
  isLive: boolean;
  scheduledAt: string | null;
  shareToken: string | null;
  totalAttendees: number;
  endedAt: string | null;
  createdAt: string;
  host: {
    id: string;
    name: string;
    image: string | null;
    headline?: string | null;
  };
  _count: { rsvps: number };
  isRsvped?: boolean;
}
const subscribeToMount = () => () => {};
type View = "all" | "live" | "upcoming" | "following" | "popular";
const views = [
  { id: "all", label: "Discover", icon: GridViewIcon },
  { id: "live", label: "Live now", icon: Radio01Icon },
  { id: "upcoming", label: "Upcoming", icon: Calendar03Icon },
  { id: "following", label: "Following", icon: StarIcon },
  { id: "popular", label: "Popular", icon: FireIcon },
] as const;
const topics = [
  {
    category: "Tax Law & Updates",
    title: "Stay ahead of the changes.",
    label: "Tax law & updates",
    icon: CourtLawIcon,
    color: "sage",
  },
  {
    category: "AI & Automation",
    title: "Meet your next advantage.",
    label: "AI & automation",
    icon: AiBrain01Icon,
    color: "violet",
  },
  {
    category: "Schedule C & Business Returns",
    title: "Get down to business.",
    label: "Business returns",
    icon: Briefcase01Icon,
    color: "peach",
  },
  {
    category: "Expert Q&A",
    title: "Good questions welcome.",
    label: "Expert Q&A",
    icon: UserGroupIcon,
    color: "blue",
  },
];
const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
function ArrowBadge() {
  return (
    <span className="pt-arrow">
      <ArrowRight01Icon size={17} />
    </span>
  );
}
function Waveform({ small = false }: { small?: boolean }) {
  return (
    <div className={`pt-wave ${small ? "is-small" : ""}`} aria-hidden="true">
      {[
        12, 23, 34, 19, 48, 67, 42, 82, 55, 98, 74, 48, 84, 64, 100, 59, 79, 45,
        65, 34, 50, 23, 36, 18, 10,
      ].map((height, i) => (
        <i
          key={i}
          style={{ height: `${height}%`, animationDelay: `${i * 65}ms` }}
        />
      ))}
    </div>
  );
}
function TalkCard({ talk, userId }: { talk: Talk; userId?: string }) {
  const router = useRouter();
  const [rsvped, setRsvped] = useState(!!talk.isRsvped);
  const [count, setCount] = useState(talk._count?.rsvps || 0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  async function rsvp() {
    if (!userId) {
      router.push("/login?next=/pro-talks");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/spaces/${talk.id}/rsvp`, {
        method: rsvped ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: rsvped ? undefined : "{}",
      });
      if (!response.ok)
        throw new Error("Your RSVP couldn’t be saved. Please try again.");
      setRsvped(!rsvped);
      setCount((value) => Math.max(0, value + (rsvped ? -1 : 1)));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/pro-talks/${talk.shareToken ? `invite/${talk.shareToken}` : talk.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Couldn’t copy the link. Open the talk and copy its address.");
    }
  }
  return (
    <article className={`pt-talk-shell ${talk.isLive ? "is-live" : ""}`}>
      <div className="pt-talk-card">
        <div className="pt-card-top">
          <span className={`pt-badge ${talk.isLive ? "live" : ""}`}>
            {talk.isLive ? (
              <>
                <span className="pt-dot" /> LIVE
              </>
            ) : (
              <>
                <Calendar03Icon size={13} />{" "}
                {talk.scheduledAt ? formatDate(talk.scheduledAt) : "Upcoming"}
              </>
            )}
          </span>
          <button
            className="pt-icon-button"
            onClick={share}
            aria-label={copied ? "Link copied" : `Copy invite for ${talk.name}`}
          >
            {copied ? <Tick01Icon size={18} /> : <Copy01Icon size={18} />}
          </button>
        </div>
        <div className="pt-card-category">
          {talk.category}
          {talk.visibility === "PRIVATE" && <span> · Invite only</span>}
        </div>
        <Link className="pt-card-title" href={`/pro-talks/${talk.id}`}>
          <h3>{talk.name}</h3>
        </Link>
        <p className="pt-card-description">
          {talk.description ||
            "Join the conversation and exchange ideas with your professional community."}
        </p>
        <div className="pt-host">
          <span className="pt-avatar">
            {talk.host.image ? (
              <Image
                src={talk.host.image}
                alt=""
                width={38}
                height={38}
                unoptimized
              />
            ) : (
              talk.host.name.charAt(0)
            )}
          </span>
          <div>
            <strong>{talk.host.name}</strong>
            <span>
              Host ·{" "}
              {talk.mediaType === "AUDIO" ? "Audio room" : "Audio & video"}
            </span>
          </div>
          {talk.isLive && <Waveform small />}
        </div>
        <div className="pt-card-footer">
          <span>
            <UserGroupIcon size={15} />
            {talk.isLive
              ? `${talk.totalAttendees || 0} joined`
              : `${count} going`}
          </span>
          {talk.isLive ? (
            <Link
              className="pt-button pt-primary pt-small"
              href={`/pro-talks/${talk.id}`}
            >
              Join conversation <ArrowBadge />
            </Link>
          ) : (
            <button
              className={`pt-button pt-small ${rsvped ? "pt-saved" : "pt-secondary"}`}
              disabled={busy}
              onClick={rsvp}
            >
              {busy ? (
                "Saving…"
              ) : rsvped ? (
                <>
                  <Tick01Icon size={16} /> You’re on the list
                </>
              ) : (
                "RSVP to attend"
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="pt-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
function ProTalksHub() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: session, isPending } = useSession();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const authLoading = !mounted || isPending || (!!session && !user);
  const userId = user?.id;
  const router = useRouter();
  const params = useSearchParams();
  const paidSession =
    params.get("host_paid") === "1"
      ? params.get("session_id") || undefined
      : undefined;
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [spaces, setSpaces] = useState<Talk[]>([]);
  const [following, setFollowing] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [hostMode, setHostMode] = useState<"now" | "schedule" | null>(
    paidSession ? "now" : null,
  );
  const [showAccess, setShowAccess] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const canHost =
    user?.role === "ADMIN" ||
    user?.tier === "MARKETPLACE_PLUS" ||
    !!paidSession;
  const followingView = view === "following";
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const responses = await Promise.all([
          fetch("/api/spaces", { signal: controller.signal }),
          ...(followingView && userId
            ? [
                fetch("/api/spaces?tab=following", {
                  signal: controller.signal,
                }),
              ]
            : []),
        ]);
        if (responses.some((response) => !response.ok))
          throw new Error(
            "We couldn’t load the conversations. Please try again.",
          );
        const data = await Promise.all(
          responses.map((response) => response.json()),
        );
        if (!controller.signal.aborted) {
          setSpaces(data[0]);
          setFollowing(data[1] || []);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load Pro Talks.",
          );
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refreshKey, followingView, userId]);
  function host(mode: "now" | "schedule" = "now") {
    if (authLoading) return;
    if (!user) {
      router.push("/login?next=/pro-talks");
      return;
    }
    if (canHost) setHostMode(mode);
    else setShowAccess(true);
  }
  function chooseTopic(value: string) {
    setCategory(value);
    setView("all");
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const liveCount = spaces.filter((talk) => talk.isLive).length;
  const upcomingCount = spaces.filter(
    (talk) => !talk.isLive && !talk.endedAt,
  ).length;
  const normalizedQuery = query.toLowerCase().trim();
  const filtered = (followingView ? following : spaces)
    .filter(
      (talk) =>
        (category === "all" || talk.category === category) &&
        (!normalizedQuery ||
          `${talk.name} ${talk.description || ""} ${talk.category} ${talk.host.name}`
            .toLowerCase()
            .includes(normalizedQuery)) &&
        (view !== "live" || talk.isLive) &&
        (view !== "upcoming" || (!talk.isLive && !talk.endedAt)),
    )
    .sort((a, b) =>
      view === "popular"
        ? b.totalAttendees - a.totalAttendees
        : Number(b.isLive) - Number(a.isLive) ||
          new Date(a.scheduledAt || a.createdAt).getTime() -
            new Date(b.scheduledAt || b.createdAt).getTime(),
    );
  const hasFilters = category !== "all" || !!normalizedQuery;
  const title = hasFilters
    ? "Your conversations"
    : view === "all"
      ? "The conversation starts here"
      : view === "live"
        ? "On air, right now"
        : view === "upcoming"
          ? "Make room in your calendar"
          : view === "following"
            ? "From familiar voices"
            : "Conversations with momentum";
  function resetFilters() {
    setCategory("all");
    setQuery("");
  }
  return (
    <div className="pt-hub">
      <div className="pt-workspace">
        <aside className="pt-sidebar">
          <Link
            href="/pro-talks"
            className="pt-brand"
            aria-label="Pro Talks home"
          >
            <span className="pt-brand-icon">
              <Mic01Icon size={23} />
            </span>
            <span>
              pro<span className="pt-brand-light">talks</span>
              <small>THE COMMUNITY LOUNGE</small>
            </span>
          </Link>
          <span className="pt-nav-caption">YOUR FRONT ROW</span>
          <nav className="pt-nav" aria-label="Browse Pro Talks">
            {views.map((item) => (
              <button
                key={item.id}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => setView(item.id)}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
                {item.id === "live" && <small>{liveCount}</small>}
                {item.id === "upcoming" && upcomingCount > 0 && (
                  <small>{upcomingCount}</small>
                )}
              </button>
            ))}
          </nav>
          <div className="pt-sidebar-topics">
            <span className="pt-nav-caption">EXPLORE YOUR INTERESTS</span>
            {topics.map((topic) => (
              <button
                key={topic.category}
                className={category === topic.category ? "selected" : ""}
                onClick={() => chooseTopic(topic.category)}
              >
                <span className={`pt-topic-dot ${topic.color}`} />
                {topic.label}
              </button>
            ))}
            <details className="pt-more-topics">
              <summary>
                All {PRO_TALK_CATEGORIES.length} topics{" "}
                <ArrowDown01Icon size={14} />
              </summary>
              {PRO_TALK_CATEGORIES.filter(
                (item) => !topics.some((topic) => topic.category === item.name),
              ).map((item) => (
                <button key={item.id} onClick={() => chooseTopic(item.name)}>
                  {item.name}
                </button>
              ))}
            </details>
          </div>
          <div className="pt-sidebar-note">
            <span className="pt-note-icon">
              <Shield01Icon size={20} />
            </span>
            <strong>
              A little respect.
              <br />A better conversation.
            </strong>
            <p>Listen, share, and make everyone feel welcome.</p>
            <Link href="/community-guidelines">
              Our community guidelines <ArrowRight01Icon size={14} />
            </Link>
          </div>
          <span className="pt-sidebar-bottom">
            A TAX COMPLIANCE PRO EXPERIENCE
          </span>
        </aside>
        <div className="pt-content">
          <div className="pt-topbar">
            <div>
              <span className="pt-overline">CONNECT. LEARN. GROW.</span>
              <span className="pt-topbar-sub">
                Your people. Your perspective.
              </span>
            </div>
            <button
              className="pt-button pt-primary"
              onClick={() => host()}
              disabled={authLoading}
            >
              <Add01Icon size={17} /> Host a talk <ArrowBadge />
            </button>
          </div>
          <section className="pt-hero" aria-labelledby="pt-title">
            <div className="pt-hero-copy">
              <div className="pt-eyebrow">
                <span className="pt-dot" /> REAL PEOPLE. REAL CONVERSATIONS.
              </div>
              <h1 id="pt-title">
                Big ideas.
                <br />
                Better <span>conversations.</span>
              </h1>
              <p>
                The room for tax professionals to think out loud.
                <br className="pt-desktop-break" /> Trade insights, ask the good
                questions, and find your people.
              </p>
              <div className="pt-hero-actions">
                <button
                  className="pt-button pt-white"
                  onClick={() => {
                    setView("all");
                    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                    searchRef.current?.focus({ preventScroll: true });
                  }}
                >
                  Explore conversations <ArrowBadge />
                </button>
                <span>
                  <Mic01Icon size={15} /> Audio & video, together.
                </span>
              </div>
            </div>
            <div className="pt-studio-shell">
              <div className="pt-studio">
                <div className="pt-studio-top">
                  <span>PRO TALKS / ON THE AIR</span>
                  <span className="pt-studio-symbol">↗</span>
                </div>
                <div className="pt-studio-art" aria-hidden="true">
                  <div className="pt-orbit orbit-one" />
                  <div className="pt-orbit orbit-two" />
                  <Waveform />
                  <div className="pt-studio-mic">
                    <Mic01Icon size={68} strokeWidth={1.1} />
                  </div>
                  <span className="pt-art-label">A SPACE FOR YOUR VOICE</span>
                </div>
                <div className="pt-studio-bottom">
                  <div>
                    <strong>
                      Great minds.
                      <br />
                      Open mics.
                    </strong>
                    <span>Your next idea is a conversation away.</span>
                  </div>
                  <button
                    className="pt-studio-button"
                    onClick={() => host()}
                    aria-label="Start your own Pro Talk"
                  >
                    <ArrowRight01Icon size={23} />
                  </button>
                </div>
              </div>
            </div>
          </section>
          <div className="pt-status-strip">
            <span>
              <span
                className={`pt-status-indicator ${liveCount ? "active" : ""}`}
              />
              <strong>{liveCount}</strong> live{" "}
              {liveCount === 1 ? "conversation" : "conversations"}
            </span>
            <span>
              <Calendar03Icon size={16} />
              <strong>{upcomingCount}</strong> coming up
            </span>
            <span>
              <GridViewIcon size={16} />
              <strong>{PRO_TALK_CATEGORIES.length}</strong> topics to explore
            </span>
            <span className="pt-strip-end">Come curious. Leave inspired.</span>
          </div>
          <div ref={resultsRef} className="pt-discovery" id="conversations">
            <div className="pt-search-row">
              <div className="pt-search">
                <Search01Icon size={21} />
                <input
                  ref={searchRef}
                  aria-label="Search conversations"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find your next conversation…"
                />
                {query && (
                  <button
                    className="pt-icon-button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <Cancel01Icon size={17} />
                  </button>
                )}
              </div>
              <label className="pt-topic-select">
                <GridViewIcon size={17} />
                <select
                  aria-label="Filter by topic"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">All topics</option>
                  {PRO_TALK_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="pt-results-heading">
              <div>
                <span className="pt-overline">
                  {hasFilters
                    ? "MADE FOR YOUR CURIOSITY"
                    : views
                        .find((item) => item.id === view)
                        ?.label.toUpperCase()}
                </span>
                <h2>{title}</h2>
              </div>
              {hasFilters ? (
                <button className="pt-text-button" onClick={resetFilters}>
                  Reset filters <Cancel01Icon size={14} />
                </button>
              ) : (
                <span className="pt-results-note">
                  {view === "popular"
                    ? "Most attended first"
                    : "Live first · then by date"}
                </span>
              )}
            </div>
            {hasFilters && (
              <div className="pt-active-filters">
                {category !== "all" && (
                  <button onClick={() => setCategory("all")}>
                    {category}
                    <Cancel01Icon size={12} />
                  </button>
                )}
                {normalizedQuery && <span>Results for “{query}”</span>}
              </div>
            )}
            {loading ? (
              <div className="pt-loading" role="status">
                <div className="pt-loader" />
                <span>Finding your next conversation…</span>
              </div>
            ) : error ? (
              <div className="pt-empty pt-error-state" role="alert">
                <Radio01Icon size={30} />
                <h3>Let’s reconnect.</h3>
                <p>{error}</p>
                <button
                  className="pt-button pt-secondary"
                  onClick={() => setRefreshKey((value) => value + 1)}
                >
                  Try again
                </button>
              </div>
            ) : filtered.length ? (
              <div className="pt-talk-grid" aria-live="polite">
                {filtered.map((talk) => (
                  <TalkCard key={talk.id} talk={talk} userId={user?.id} />
                ))}
              </div>
            ) : (
              <div className="pt-empty-shell">
                <div className="pt-empty">
                  <div className="pt-empty-art">
                    <span />
                    <Waveform />
                    <span />
                  </div>
                  <span className="pt-overline">
                    {hasFilters
                      ? "KEEP EXPLORING"
                      : view === "upcoming"
                        ? "GOOD THINGS TAKE A LITTLE PLANNING"
                        : "BETWEEN CONVERSATIONS"}
                  </span>
                  <h3>
                    {hasFilters
                      ? "Your next conversation is out there."
                      : view === "following"
                        ? "Make a few connections."
                        : view === "upcoming"
                          ? "Something to look forward to."
                          : "A little quiet. A lot of possibility."}
                  </h3>
                  <p>
                    {hasFilters
                      ? "Try another topic or a broader search. There’s always more to talk about."
                      : view === "following"
                        ? "Connect with professionals you’d love to learn from. Their next talks will appear here."
                        : view === "upcoming"
                          ? "There are no scheduled talks yet. Put your idea on the calendar and give your community a seat."
                          : "No talks are happening here yet. Bring a question or a fresh perspective. You could start something great."}
                  </p>
                  {hasFilters ? (
                    <button
                      className="pt-button pt-white"
                      onClick={resetFilters}
                    >
                      Explore all topics <ArrowBadge />
                    </button>
                  ) : view === "following" ? (
                    <Link
                      className="pt-button pt-white"
                      href={user ? "/find-a-pro" : "/login?next=/pro-talks"}
                    >
                      {user ? "Find your people" : "Sign in to connect"}
                      <ArrowBadge />
                    </Link>
                  ) : (
                    <button
                      className="pt-button pt-white"
                      onClick={() =>
                        host(view === "upcoming" ? "schedule" : "now")
                      }
                    >
                      {view === "upcoming"
                        ? "Schedule a talk"
                        : "Start a conversation"}
                      <ArrowBadge />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <section className="pt-topics-section">
            <div className="pt-results-heading">
              <div>
                <span className="pt-overline">FOLLOW YOUR CURIOSITY</span>
                <h2>What’s on your mind?</h2>
              </div>
              <span className="pt-results-note">
                Find a room that feels like you.
              </span>
            </div>
            <div className="pt-topic-grid">
              {topics.map((topic, index) => (
                <button
                  key={topic.category}
                  className={`pt-topic-card ${topic.color}`}
                  onClick={() => chooseTopic(topic.category)}
                >
                  <div className="pt-topic-card-top">
                    <topic.icon size={25} />
                    <span>0{index + 1}</span>
                  </div>
                  <span className="pt-topic-label">{topic.label}</span>
                  <strong>{topic.title}</strong>
                  <span className="pt-topic-link">
                    Explore topic <ArrowRight01Icon size={16} />
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="pt-host-banner">
            <div className="pt-banner-symbol">
              <Mic01Icon size={34} />
            </div>
            <div>
              <span className="pt-overline">
                DON’T JUST JOIN THE CONVERSATION. START ONE.
              </span>
              <h2>You know something worth sharing.</h2>
              <p>
                Host a public room or keep it personal with an invite-only talk.
              </p>
            </div>
            <button
              className="pt-button pt-primary"
              onClick={() => host("schedule")}
            >
              Plan your Pro Talk <ArrowBadge />
            </button>
          </section>
          <footer className="pt-footer">
            <span>
              PRO TALKS <span>by Tax Compliance Pro</span>
            </span>
            <Link href="/community-guidelines">
              Built on good conversation. And mutual respect.{" "}
              <ArrowRight01Icon size={13} />
            </Link>
          </footer>
        </div>
      </div>
      {showAccess && (
        <HostingAccessDialog onClose={() => setShowAccess(false)} />
      )}
      {hostMode && (
        <HostTalkDialog
          initialMode={hostMode}
          hostSessionId={paidSession}
          onClose={() => setHostMode(null)}
          onCreated={(talk) => {
            setSpaces((previous) => [talk, ...previous]);
            if (talk.isLive) router.push(`/pro-talks/${talk.id}`);
          }}
        />
      )}
    </div>
  );
}
export default function ProTalksPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-hub pt-loading">
          <div className="pt-loader" /> Loading Pro Talks…
        </div>
      }
    >
      <ProTalksHub />
    </Suspense>
  );
}
