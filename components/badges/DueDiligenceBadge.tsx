import Image from "next/image";

interface Props {
  /** size in px — defaults to 20 */
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Due Diligence Badge
 * Awarded to users who complete any course or purchase any toolkit.
 * Drop this next to any user name to show their achievement.
 */
export default function DueDiligenceBadge({ size = 20, className = "", showTooltip = true }: Props) {
  return (
    <span
      className={`inline-flex items-center shrink-0 ${showTooltip ? "group/badge relative" : ""} ${className}`}
      aria-label="Due Diligence Badge"
    >
      <Image
        src="/due_dilligence_badge.webp"
        alt="Due Diligence Badge"
        width={size}
        height={size}
        className="object-contain"
        unoptimized
      />
      {showTooltip && (
        <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-lg bg-[#0a1628] text-white text-[10px] font-bold px-2.5 py-1.5 opacity-0 group-hover/badge:opacity-100 transition-opacity z-50 shadow-xl">
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#0a1628]" />
          Due Diligence Award
          <span className="block text-slate-400 font-normal text-[9px] mt-0.5">Completed a course or purchased a toolkit</span>
        </span>
      )}
    </span>
  );
}
