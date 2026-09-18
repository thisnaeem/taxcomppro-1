"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown01Icon, CrownIcon, GlobeIcon } from "hugeicons-react";

/** "View All" in the profile's My Pro Networks box — lets the user pick
 *  between their own networks and the full network directory. */
export default function NetworksViewAllMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0A1628] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 text-xs font-bold profile-accent hover:underline"
      >
        View All
        <ArrowDown01Icon className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 z-30 w-56 p-1.5 rounded-xl bg-white dark:bg-[#1e2e45] border border-slate-200 dark:border-slate-700 shadow-xl">
          <Link role="menuitem" href="/pro-networks?filter=mine" className={item} onClick={() => setOpen(false)}>
            <CrownIcon className="w-4 h-4 text-amber-500" />
            My Pro Networks
          </Link>
          <Link role="menuitem" href="/pro-networks" className={item} onClick={() => setOpen(false)}>
            <GlobeIcon className="w-4 h-4 text-amber-500" />
            View All Networks
          </Link>
        </div>
      )}
    </div>
  );
}
