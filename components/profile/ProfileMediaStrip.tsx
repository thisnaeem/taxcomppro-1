"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { File01Icon, Image01Icon, PlayIcon, Video01Icon } from "hugeicons-react";
import { mediaFileName, mediaKind, type MediaKind } from "@/lib/mediaType";

export interface FeedMedia { url: string; postId: string; type?: "photo" | "video" }

type Item = { url: string; kind: MediaKind; postId?: string };
type Filter = "all" | MediaKind;

const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photos" },
  { id: "video", label: "Videos" },
  { id: "document", label: "Documents" },
];

/** View-only media strip for the profile Overview, with All / Photos / Videos / Documents filters. */
export default function ProfileMediaStrip({
  uploads,
  feed,
  action,
  emptyText = "No media yet.",
}: {
  uploads: string[];
  feed: FeedMedia[];
  action?: React.ReactNode;
  emptyText?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo<Item[]>(() => {
    const seen = new Set(uploads);
    return [
      ...uploads.map((url) => ({ url, kind: mediaKind(url) })),
      ...feed.filter((f) => !seen.has(f.url)).map((f) => ({ url: f.url, kind: f.type ?? mediaKind(f.url), postId: f.postId })),
    ];
  }, [uploads, feed]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, photo: 0, video: 0, document: 0 };
    items.forEach((it) => { c[it.kind]++; });
    return c;
  }, [items]);

  const shown = filter === "all" ? items : items.filter((it) => it.kind === filter);

  return (
    <div className="profile-overview-media rounded-3xl bg-white dark:bg-[#172135] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-xs font-black text-[#0A1628] dark:text-white uppercase tracking-widest flex items-center gap-2 mr-2">
          <Image01Icon className="w-4 h-4 text-amber-500" />
          MEDIA GALLERY
        </h3>
        <div role="tablist" aria-label="Filter media" className="profile-media-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={filter === tab.id ? "is-active" : ""}
            >
              {tab.label}
              {counts[tab.id] > 0 && <span>{counts[tab.id]}</span>}
            </button>
          ))}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </div>

      {shown.length > 0 ? (
        <div className="profile-media-strip">
          {shown.map((it) => {
            const key = `${it.postId ?? "upload"}-${it.url}`;
            const inner = (
              <>
                {it.kind === "photo" && <img src={it.url} alt="" loading="lazy" />}
                {it.kind === "video" && (
                  <>
                    <video src={`${it.url}#t=0.5`} preload="metadata" muted playsInline />
                    <span className="profile-media-play"><PlayIcon size={20} /></span>
                  </>
                )}
                {it.kind === "document" && (
                  <span className="profile-media-doc">
                    <File01Icon size={30} />
                    <span>{mediaFileName(it.url)}</span>
                  </span>
                )}
                {it.postId && <span className="profile-media-tag">Feed</span>}
              </>
            );
            return it.postId ? (
              <Link key={key} href={`/feed?post=${it.postId}`} className="profile-media-tile" title="Open feed post">{inner}</Link>
            ) : (
              <a key={key} href={it.url} target="_blank" rel="noopener noreferrer" className="profile-media-tile">{inner}</a>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-2 flex items-center gap-2">
          {filter === "video" ? <Video01Icon size={16} /> : filter === "document" ? <File01Icon size={16} /> : <Image01Icon size={16} />}
          {filter === "all" ? emptyText : `No ${TABS.find((t) => t.id === filter)?.label.toLowerCase()} yet.`}
        </p>
      )}
    </div>
  );
}
