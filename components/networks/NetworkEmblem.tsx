"use client";

import { useId } from "react";

/** Emblem-style network badge (shield or hexagon) used in the profile "My Badges" row. */
export interface NetworkEmblemProps {
  name: string;
  image?: string | null;
  initials?: string | null;
  role?: string;
  shape?: string; // "hexagon" renders a hexagon; everything else a shield
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  size?: number;
}

const SHIELD = "M50 3 L93 17 V55 C93 84 73 103 50 113 C27 103 7 84 7 55 V17 Z";
const HEXAGON = "M50 3 L94 28 V88 L50 113 L6 88 V28 Z";

export default function NetworkEmblem({
  name,
  image,
  initials,
  role = "MEMBER",
  shape = "shield",
  bgColor = "#0a1628",
  textColor = "#ffbe24",
  borderColor = "#ffbe24",
  size = 88,
}: NetworkEmblemProps) {
  const id = useId().replace(/:/g, "");
  const path = shape === "hexagon" ? HEXAGON : SHIELD;
  const isOwner = role === "OWNER";
  const label = (initials || name.slice(0, 4)).toUpperCase();

  return (
    <svg
      width={size}
      height={size * 1.16}
      viewBox="0 0 100 116"
      role="img"
      aria-label={`${name} badge — ${isOwner ? "Owner" : "Member"}`}
      className="drop-shadow-md transition-transform group-hover:scale-105"
    >
      <defs>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={borderColor} />
          <stop offset="1" stopColor={borderColor} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`face-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bgColor} stopOpacity="0.85" />
          <stop offset="1" stopColor={bgColor} />
        </linearGradient>
        <clipPath id={`logo-${id}`}>
          <circle cx="50" cy="50" r="24" />
        </clipPath>
      </defs>

      {/* Rim + face */}
      <path d={path} fill={`url(#rim-${id})`} />
      <path d={path} fill={`url(#face-${id})`} transform="translate(50 58) scale(0.86) translate(-50 -58)" />
      <path d={path} fill="none" stroke={borderColor} strokeOpacity="0.35" strokeWidth="1.2" transform="translate(50 58) scale(0.78) translate(-50 -58)" />

      {/* Logo or initials */}
      <circle cx="50" cy="50" r="26" fill="#fff" stroke={borderColor} strokeWidth="2" />
      {image ? (
        <image href={image} x="26" y="26" width="48" height="48" preserveAspectRatio="xMidYMid slice" clipPath={`url(#logo-${id})`} />
      ) : (
        <text x="50" y="55" textAnchor="middle" fontSize="15" fontWeight="900" fill={bgColor} letterSpacing="0.5">
          {label}
        </text>
      )}

      {/* Role ribbon */}
      <g>
        <path d="M14 82 H86 L80 90 L86 98 H14 L20 90 Z" fill={isOwner ? "#ffbe24" : "#1E56A0"} />
        <text x="50" y="93.5" textAnchor="middle" fontSize="9" fontWeight="900" letterSpacing="1.2" fill={isOwner ? "#0a1628" : "#fff"}>
          {isOwner ? "OWNER" : "MEMBER"}
        </text>
      </g>
      {/* Star crest */}
      <path d="M50 8 l2.4 4.9 5.4.8-3.9 3.8.9 5.4L50 20.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill={textColor} />
    </svg>
  );
}
