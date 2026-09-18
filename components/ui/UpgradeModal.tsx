"use client";

import Link from "next/link";
import { X, Crown, ArrowRight } from "lucide-react";

interface Props {
  onClose: () => void;
  feature?: string;
}

export default function UpgradeModal({ onClose, feature = "This feature" }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffbe24] to-[#ffbe24] flex items-center justify-center shadow-md">
              <Crown className="w-5 h-5 text-[#0a1628]" />
            </div>
            <div>
              <div className="font-black text-[#0a1628] text-base leading-tight">Upgrade to VIP</div>
              <div className="text-xs text-slate-400">$39.99/month</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-5">
          <span className="font-semibold text-[#0a1628]">{feature}</span> is available for VIP members.
          Upgrade for <span className="font-bold">$39.99/mo</span> to unlock posting, liking,
          commenting, messaging, connections, and more.
        </p>

        <Link
          href="/upgrade"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ffbe24] to-[#ffbe24] text-[#0a1628] font-black py-3.5 rounded-xl hover:shadow-lg hover:shadow-amber-200/50 transition-all text-sm"
        >
          Upgrade Now <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={onClose}
          className="w-full mt-2.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
