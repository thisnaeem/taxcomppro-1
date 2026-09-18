"use client";

import { Children, isValidElement, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

/**
 * Two-column card layout that never leaves a hole under the shorter column.
 * It measures every card, picks the left/right split whose column heights are
 * closest (keeping each card's relative order), then lets the last card of the
 * shorter column absorb the few pixels that are left.
 *
 * Usage: <BalancedColumns><Column>…cards…</Column><Column>…cards…</Column></BalancedColumns>
 * The two <Column>s are the preferred placement; single-column screens keep that order.
 */
export function Column({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const GAP = 16;

export default function BalancedColumns({ children }: { children: ReactNode }) {
  const cols = Children.toArray(children).filter(isValidElement) as ReactElement<{ children: ReactNode }>[];
  const items = cols.flatMap((col, side) =>
    Children.toArray(col.props.children).filter(Boolean).map((node, i) => ({ node, key: `${side}-${i}`, preferred: side })),
  );
  const count = items.length;

  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [sides, setSides] = useState<number[]>(() => items.map((it) => it.preferred));
  const signature = items.map((it) => it.preferred).join("");

  useLayoutEffect(() => {
    const preferred = signature.split("").map(Number);
    const measure = () => {
      if (window.matchMedia("(max-width: 1100px)").matches) return;
      // Read natural heights: switch off the "fill" on last cards for this synchronous read only.
      const root = rootRef.current;
      root?.classList.add("is-measuring");
      const heights = refs.current.slice(0, count).map((el) => (el ? el.offsetHeight : 0));
      root?.classList.remove("is-measuring");
      let best = preferred;
      let bestScore = Infinity;
      // ≤ 10 cards → at most 1024 splits; cheap to check them all.
      for (let mask = 0; mask < 1 << count; mask++) {
        let left = 0, right = 0, nLeft = 0, nRight = 0, moves = 0;
        for (let i = 0; i < count; i++) {
          const side = (mask >> i) & 1;
          if (side) { right += heights[i]; nRight++; } else { left += heights[i]; nLeft++; }
          if (side !== preferred[i]) moves++;
        }
        if (!nLeft || !nRight) continue;
        const diff = Math.abs(left + GAP * (nLeft - 1) - (right + GAP * (nRight - 1)));
        const score = diff + moves * 24; // prefer the designed placement unless moving clearly helps
        if (score < bestScore) { bestScore = score; best = Array.from({ length: count }, (_, i) => (mask >> i) & 1); }
      }
      setSides((current) => (current.join("") === best.join("") ? current : best));
    };
    measure();
    const observer = new ResizeObserver(measure);
    refs.current.slice(0, count).forEach((el) => el && observer.observe(el));
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [count, signature]);

  const placed = items.map((it, i) => ({ ...it, index: i, side: sides[i] ?? it.preferred }));
  const column = (side: number) => placed.filter((it) => it.side === side);

  return (
    <div ref={rootRef} className="balanced-columns">
      {[0, 1].map((side) => {
        const list = column(side);
        return (
          <div key={side} className="balanced-column">
            {list.map((it, n) => (
              <div
                key={it.key}
                ref={(el) => { refs.current[it.index] = el; }}
                className={`balanced-item${n === list.length - 1 ? " is-last" : ""}`}
                style={{ order: it.index }}
              >
                {it.node}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
