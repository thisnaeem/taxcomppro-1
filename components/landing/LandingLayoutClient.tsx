"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import Footer from "@/components/landing/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function LandingLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = pathname === "/profile" || pathname === "/my-profile";

  const isGroups = pathname === "/groups" || pathname.startsWith("/groups/");

  const isNetworkInterior = pathname.startsWith("/pro-networks/") && pathname !== "/pro-networks/create";

  const isMarketplace = pathname === "/marketplace" || pathname.startsWith("/marketplace/");

  return (
    <>
      {!isNetworkInterior && <Navbar />}
      <main className={`flex-1 ${isNetworkInterior ? "p-0" : "pb-24 md:pb-0"}`}>{children}</main>
      {!isProfile && !isGroups && !isMarketplace && !isNetworkInterior && pathname !== "/connections" && pathname !== "/messages" && pathname !== "/seller-dashboard" && <Footer />}
      {!isNetworkInterior && <MobileBottomNav />}
      {!isProfile && !isNetworkInterior && <ProfileCompletion />}
    </>
  );
}
