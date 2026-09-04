"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function LandingLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = pathname === "/profile" || pathname === "/my-profile";

  return (
    <>
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {!isProfile && <Footer />}
      <MobileBottomNav />
    </>
  );
}
