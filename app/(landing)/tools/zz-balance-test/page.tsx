"use client";
import BalancedColumns, { Column } from "@/components/profile/BalancedColumns";
import "@/components/profile/profile-ui.css";
const Card = ({ h, t }: { h: number; t: string }) => (
  <div className="rounded-3xl border border-slate-700 bg-[#172135] text-white p-5" style={{ minHeight: h }}>{t} ({h}px)</div>
);
export default function Page() {
  return (
    <div className="profile-editor max-w-[1100px] mx-auto p-6">
      <BalancedColumns>
        <Column><Card h={380} t="About Me" /><Card h={250} t="Pro Connect Card" /></Column>
        <Column><Card h={230} t="Membership" /><Card h={230} t="My Badges" /><Card h={430} t="My Pro Networks" /><Card h={200} t="Voice Introduction" /></Column>
      </BalancedColumns>
      <div className="mt-4 rounded-3xl border border-slate-700 bg-[#172135] text-white p-5 h-32">Media Gallery</div>
    </div>
  );
}
