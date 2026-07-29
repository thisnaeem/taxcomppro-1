"use client";

export function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4">
      {/* Header: avatar + name/time */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-150 bg-slate-100 rounded w-1/4" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2 pt-1">
        <div className="h-3.5 bg-slate-200 rounded w-full" />
        <div className="h-3.5 bg-slate-200 rounded w-11/12" />
        <div className="h-3.5 bg-slate-150 bg-slate-100 rounded w-3/4" />
      </div>
      {/* Image placeholder box */}
      <div className="h-48 bg-slate-100 rounded-xl w-full" />
      {/* Action buttons bar */}
      <div className="pt-2 border-t border-slate-100 flex gap-2">
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
      </div>
    </div>
  );
}

export function LeftPanelSkeleton() {
  return (
    <div className="w-full space-y-2.5 animate-pulse">
      {/* Profile card skeleton */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="h-24 bg-slate-200 relative">
          <div className="absolute -bottom-9 left-4 w-[72px] h-[72px] rounded-2xl bg-slate-300 border-[3px] border-white" />
        </div>
        <div className="px-4 pt-12 pb-4 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-12 bg-slate-100 rounded-xl w-full" />
          <div className="h-9 bg-slate-200 rounded-lg w-full" />
        </div>
      </div>
      {/* Nav links skeleton */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl w-full flex items-center px-3 gap-3">
            <div className="w-5 h-5 bg-slate-200 rounded-md shrink-0" />
            <div className="h-3.5 bg-slate-200 rounded flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RightPanelSkeleton() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {[1, 2, 3].map(sec => (
        <div key={sec} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          {/* Section title header */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <div className="w-6 h-6 rounded-lg bg-slate-200 shrink-0" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
          </div>
          {/* Section rows */}
          {[1, 2, 3].map(row => (
            <div key={row} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
