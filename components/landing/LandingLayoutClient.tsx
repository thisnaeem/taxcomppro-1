"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function LandingLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = pathname === "/profile" || pathname === "/my-profile";

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {!isProfile && <Footer />}
    </>
  );
}
