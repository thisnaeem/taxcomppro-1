"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AtlasWidget = dynamic(() => import("./AtlasWidget"), { ssr: false });

export default function AtlasWidgetLoader() {
  const pathname = usePathname();
  
  // Only show Atlas widget on home (/feed or /), courses, and toolkits pages
  const allowedPaths = ["/", "/feed", "/courses", "/toolkits"];
  const isAllowedPage = allowedPaths.some(path => {
    if (path === "/") return pathname === "/";
    if (path === "/feed") return pathname === "/feed";
    // For courses and toolkits, allow the main page and sub-pages
    return pathname?.startsWith(path);
  });

  if (!isAllowedPage) return null;
  
  return <AtlasWidget />;
}
