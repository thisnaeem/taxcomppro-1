"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AtlasWidget = dynamic(() => import("./AtlasWidget"), { ssr: false });

export default function AtlasWidgetLoader() {
  const pathname = usePathname();
  // Do not render floating Atlas AI widget on admin pages
  if (pathname?.startsWith("/admin")) return null;
  return <AtlasWidget />;
}
