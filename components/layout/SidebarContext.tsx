"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("taxcomppro_admin_sidebar_collapsed");
      if (saved !== null) {
        setCollapsedState(saved === "true");
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem("taxcomppro_admin_sidebar_collapsed", String(v));
    } catch {
      // Ignore localStorage access issues
    }
  };

  const toggleCollapsed = () => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("taxcomppro_admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore localStorage access issues
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return {
      collapsed: false,
      toggleCollapsed: () => {},
      setCollapsed: () => {},
    };
  }
  return ctx;
}
