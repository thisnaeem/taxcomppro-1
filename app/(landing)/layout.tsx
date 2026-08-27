import { Urbanist } from "next/font/google";
import "../globals.css";
import LandingLayoutClient from "@/components/landing/LandingLayoutClient";

const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${urbanist.variable} font-[var(--font-urbanist,Urbanist),sans-serif] min-h-screen flex flex-col`}>
      <LandingLayoutClient>{children}</LandingLayoutClient>
    </div>
  );
}
