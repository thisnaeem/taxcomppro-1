"use client";

import React from "react";
import {
  Star,
  Shield,
  Crown,
  Zap,
  Flame,
  Award,
  CheckCircle2,
  Gem,
  Rocket,
  Sparkles,
} from "lucide-react";

export type BadgeIconType =
  | "Star"
  | "Shield"
  | "Crown"
  | "Zap"
  | "Flame"
  | "Award"
  | "CheckCircle"
  | "Gem"
  | "Rocket"
  | "Sparkles";

export interface NetworkBadgeProps {
  shape?: string; // "rounded" | "shield" | "hexagon" | "circle" | "pill"
  initials?: string | null;
  text?: string;
  icon?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  customImage?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Star,
  Shield,
  Crown,
  Zap,
  Flame,
  Award,
  CheckCircle: CheckCircle2,
  Gem,
  Rocket,
  Sparkles,
};

export default function NetworkBadge({
  shape = "rounded",
  initials,
  text = "MEMBER",
  icon = "Star",
  bgColor = "#0a1628",
  textColor = "#f0c040",
  borderColor = "#d4a017",
  customImage,
  size = "md",
  className = "",
}: NetworkBadgeProps) {
  if (customImage) {
    const sizeClasses = {
      sm: "h-5 w-auto object-contain",
      md: "h-7 w-auto object-contain",
      lg: "h-10 w-auto object-contain",
    };
    return (
      <img
        src={customImage}
        alt="Network Badge"
        className={`inline-block ${sizeClasses[size]} ${className}`}
      />
    );
  }

  const IconComponent = iconMap[icon] || Star;

  const shapeClasses: Record<string, string> = {
    rounded: "rounded-lg",
    pill: "rounded-full",
    circle: "rounded-full",
    shield: "rounded-b-2xl rounded-t-sm",
    hexagon: "rounded-md",
  };

  const sizeClasses: Record<string, { container: string; icon: string; text: string }> = {
    sm: {
      container: "px-2 py-0.5 text-[10px] gap-1",
      icon: "w-3 h-3",
      text: "text-[10px] tracking-wider",
    },
    md: {
      container: "px-2.5 py-1 text-xs gap-1.5",
      icon: "w-3.5 h-3.5",
      text: "text-xs tracking-wider",
    },
    lg: {
      container: "px-3.5 py-1.5 text-sm gap-2",
      icon: "w-4 h-4",
      text: "text-sm tracking-wider font-extrabold",
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const currentShape = shapeClasses[shape] || shapeClasses.rounded;

  return (
    <span
      className={`inline-flex items-center font-black uppercase shadow-sm border transition-all ${currentShape} ${currentSize.container} ${className}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: borderColor,
      }}
    >
      <IconComponent className={`${currentSize.icon} shrink-0`} style={{ color: textColor }} />
      {initials && (
        <span className="font-black opacity-90">{initials}</span>
      )}
      {text && (
        <span className={`font-black ${currentSize.text}`}>{text}</span>
      )}
    </span>
  );
}
