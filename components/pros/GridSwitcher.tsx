"use client";

import React from "react";

export type GridViewType = "grid-3" | "grid-2" | "list";

interface GridSwitcherProps {
  currentView: GridViewType;
  onViewChange: (view: GridViewType) => void;
}

export function GridSwitcher({ currentView, onViewChange }: GridSwitcherProps) {
  const views: {
    id: GridViewType;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "grid-3",
      label: "3 Columns",
      tooltip: "3-Column Standard Grid",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <rect x="2" y="2.5" width="4.5" height="6.5" rx="1.2" />
          <rect x="7.75" y="2.5" width="4.5" height="6.5" rx="1.2" />
          <rect x="13.5" y="2.5" width="4.5" height="6.5" rx="1.2" />
          <rect x="2" y="11" width="4.5" height="6.5" rx="1.2" />
          <rect x="7.75" y="11" width="4.5" height="6.5" rx="1.2" />
          <rect x="13.5" y="11" width="4.5" height="6.5" rx="1.2" />
        </svg>
      ),
    },
    {
      id: "grid-2",
      label: "2 Columns",
      tooltip: "2-Column Showcase Grid",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <rect x="2" y="2.5" width="7.2" height="6.5" rx="1.5" />
          <rect x="10.8" y="2.5" width="7.2" height="6.5" rx="1.5" />
          <rect x="2" y="11" width="7.2" height="6.5" rx="1.5" />
          <rect x="10.8" y="11" width="7.2" height="6.5" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "list",
      label: "List View",
      tooltip: "Horizontal Card List",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <rect x="2" y="2.5" width="4.5" height="4" rx="1" />
          <rect x="8" y="2.5" width="10" height="1.8" rx="0.9" />
          <rect x="8" y="5" width="7" height="1.3" rx="0.65" opacity="0.65" />

          <rect x="2" y="8" width="4.5" height="4" rx="1" />
          <rect x="8" y="8" width="10" height="1.8" rx="0.9" />
          <rect
            x="8"
            y="10.5"
            width="7"
            height="1.3"
            rx="0.65"
            opacity="0.65"
          />

          <rect x="2" y="13.5" width="4.5" height="4" rx="1" />
          <rect x="8" y="13.5" width="10" height="1.8" rx="0.9" />
          <rect x="8" y="16" width="7" height="1.3" rx="0.65" opacity="0.65" />
        </svg>
      ),
    },
  ];

  return (
    <div
      role="group"
      aria-label="Card grid display options"
      className="fp-grid-switcher"
    >
      {views.map((v) => {
        const active = currentView === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewChange(v.id)}
            title={v.tooltip}
            aria-pressed={active}
            aria-label={v.label}
            className={active ? "active" : ""}
          >
            {v.icon}
          </button>
        );
      })}
    </div>
  );
}
