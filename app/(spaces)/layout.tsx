import { Urbanist } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/landing/Navbar";

const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });

export default function SpacesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${urbanist.variable} font-[var(--font-urbanist,Urbanist),sans-serif] min-h-screen flex flex-col bg-[#06091a]`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* No footer — intentional for Spaces hub */}
    </div>
  );
}
