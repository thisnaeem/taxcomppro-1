"use client";

import React from "react";

interface TcpShieldEmblemProps {
  className?: string;
  size?: number;
}

export default function TcpShieldEmblem({ className = "", size = 260 }: TcpShieldEmblemProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size * 0.9 }}>
      {/* Background ambient gold glow */}
      <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full transform scale-75 -z-10" />

      <svg
        viewBox="0 0 320 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_15px_30px_rgba(10,22,40,0.35)]"
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="30%" stopColor="#E2B143" />
            <stop offset="55%" stopColor="#F9D776" />
            <stop offset="85%" stopColor="#B37E1C" />
            <stop offset="100%" stopColor="#8A5B0B" />
          </linearGradient>

          <linearGradient id="goldBevel" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFEAA7" />
            <stop offset="25%" stopColor="#D4A017" />
            <stop offset="50%" stopColor="#FFF9DF" />
            <stop offset="75%" stopColor="#966708" />
            <stop offset="100%" stopColor="#4A3203" />
          </linearGradient>

          <linearGradient id="goldAccent" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#966708" />
            <stop offset="35%" stopColor="#F9D776" />
            <stop offset="70%" stopColor="#FFFDF0" />
            <stop offset="100%" stopColor="#B37E1C" />
          </linearGradient>

          {/* Navy Luxury Shield Gradients */}
          <linearGradient id="navyBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F2445" />
            <stop offset="40%" stopColor="#0B1A32" />
            <stop offset="100%" stopColor="#050C18" />
          </linearGradient>

          <radialGradient id="navyHighlight" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#1E3A6D" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0F2445" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#050C18" stopOpacity="0" />
          </radialGradient>

          {/* Ribbon Gradients */}
          <linearGradient id="ribbonDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0E2342" />
            <stop offset="100%" stopColor="#071222" />
          </linearGradient>

          {/* Filters */}
          <filter id="goldDrop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer Angled Luxury Wings & Frame */}
        <g opacity="0.95">
          {/* Left Wing Ribbon */}
          <path
            d="M 50 15 L 20 80 L 120 260 L 140 230 L 70 80 Z"
            fill="url(#ribbonDark)"
            stroke="url(#goldLight)"
            strokeWidth="3"
          />
          {/* Right Wing Ribbon */}
          <path
            d="M 270 15 L 300 80 L 200 260 L 180 230 L 250 80 Z"
            fill="url(#ribbonDark)"
            stroke="url(#goldLight)"
            strokeWidth="3"
          />
          {/* Top connecting ribbon accent */}
          <path
            d="M 35 45 L 160 5 L 285 45 L 260 55 L 160 20 L 60 55 Z"
            fill="url(#goldBevel)"
            opacity="0.8"
          />
        </g>

        {/* Outer Gold Shield Border */}
        <path
          d="M 160 20 C 220 20 250 35 250 120 C 250 195 160 255 160 255 C 160 255 70 195 70 120 C 70 35 100 20 160 20 Z"
          fill="url(#goldBevel)"
          filter="url(#goldDrop)"
        />

        {/* Inner Shield Bevel Gold Line */}
        <path
          d="M 160 26 C 214 26 242 40 242 120 C 242 188 160 244 160 244 C 160 244 78 188 78 120 C 78 40 106 26 160 26 Z"
          fill="url(#goldLight)"
        />

        {/* Shield Navy Interior */}
        <path
          d="M 160 33 C 208 33 234 45 234 120 C 234 182 160 234 160 234 C 160 234 86 182 86 120 C 86 45 112 33 160 33 Z"
          fill="url(#navyBg)"
        />

        {/* Inner Shield Subtle Radial Lighting */}
        <path
          d="M 160 33 C 208 33 234 45 234 120 C 234 182 160 234 160 234 C 160 234 86 182 86 120 C 86 45 112 33 160 33 Z"
          fill="url(#navyHighlight)"
        />

        {/* Fine Inner Gold Inlay Pinstripe */}
        <path
          d="M 160 42 C 200 42 222 52 222 120 C 222 174 160 220 160 220 C 160 220 98 174 98 120 C 98 52 120 42 160 42 Z"
          fill="none"
          stroke="url(#goldLight)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.6"
        />

        {/* 5-Point Gold Star on Top */}
        <g transform="translate(160, 68) scale(1.15)">
          <polygon
            points="0,-16 4.7,-4.9 16.8,-4.9 7.1,2.1 10.8,13.7 0,6.7 -10.8,13.7 -7.1,2.1 -16.8,-4.9 -4.7,-4.9"
            fill="url(#goldBevel)"
            stroke="url(#goldLight)"
            strokeWidth="0.8"
            filter="url(#goldDrop)"
          />
          {/* Star Core Highlight */}
          <polygon
            points="0,-10 3,-3 10,-3 4.5,1.5 7,9 0,4.5 -7,9 -4.5,1.5 -10,-3 -3,-3"
            fill="url(#goldLight)"
            opacity="0.8"
          />
        </g>

        {/* Center Interlocking TCP Monogram */}
        <g id="TCP-Monogram" filter="url(#goldDrop)">
          {/* 'T' Character */}
          <path
            d="M 112 92 L 208 92 L 208 108 L 168 108 L 168 190 L 152 190 L 152 108 L 112 108 Z"
            fill="url(#goldBevel)"
          />
          <path
            d="M 115 95 L 205 95 L 205 105 L 165 105 L 165 187 L 155 187 L 155 105 L 115 105 Z"
            fill="url(#goldLight)"
            opacity="0.9"
          />

          {/* 'C' Character (Embossed & Interlocking Left) */}
          <path
            d="M 148 118 C 130 118 116 130 116 150 C 116 170 130 182 148 182 C 158 182 165 178 168 174 L 168 160 C 163 165 156 168 148 168 C 138 168 130 160 130 150 C 130 140 138 132 148 132 C 156 132 163 135 168 140 L 168 126 C 165 122 158 118 148 118 Z"
            fill="url(#goldLight)"
          />

          {/* 'P' Character (Embossed & Interlocking Right) */}
          <path
            d="M 166 118 L 194 118 C 206 118 214 126 214 138 C 214 150 206 158 194 158 L 180 158 L 180 190 L 166 190 Z M 180 132 L 180 144 L 192 144 C 197 144 200 141 200 138 C 200 135 197 132 192 132 Z"
            fill="url(#goldBevel)"
          />
        </g>

        {/* Subtle Horizontal Gold Accent Bars */}
        <line x1="105" y1="205" x2="215" y2="205" stroke="url(#goldAccent)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="160" cy="205" r="3.5" fill="url(#goldLight)" />
      </svg>
    </div>
  );
}
