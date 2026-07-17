"use client";

import Link from "next/link";
import { Wrench, ArrowRight, Sparkles, FileText, Bot, Calculator, Lock } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  tag: string;
  isAvailable: boolean;
  color: string;
  badgeColor: string;
}

const TOOLS: Tool[] = [
  {
    id: "pdf-fillable",
    name: "Atlas AI PDF Fillable",
    description: "Transform static PDFs into fillable forms. Place interactive text inputs, checkboxes, custom digital signatures, and image upload blocks instantly in your browser.",
    href: "/tools/atlas-ai-pdf-fillable",
    icon: FileText,
    tag: "Available Now",
    isAvailable: true,
    color: "from-blue-500/10 to-indigo-500/10 hover:shadow-indigo-500/10 border-indigo-200 dark:border-[#243550]",
    badgeColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  },
  {
    id: "ai-tax-assistant",
    name: "AI Tax Assistant",
    description: "Consult our advanced AI assistant specialized in tax codes. Get instant answers to complex regulations, complete with official IRS citations and publications.",
    href: "#",
    icon: Bot,
    tag: "Coming Soon",
    isAvailable: false,
    color: "from-slate-100 to-slate-200/50 dark:from-slate-800/10 dark:to-slate-900/10 border-slate-200 dark:border-slate-800 opacity-75",
    badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },
  {
    id: "tax-calculator",
    name: "Tax Bracket Calculator",
    description: "Instantly estimate federal marginal tax brackets, tax liability, and effective tax rates based on filing status, income level, and deductions.",
    href: "#",
    icon: Calculator,
    tag: "Coming Soon",
    isAvailable: false,
    color: "from-slate-100 to-slate-200/50 dark:from-slate-800/10 dark:to-slate-900/10 border-slate-200 dark:border-slate-800 opacity-75",
    badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },
];

export default function ToolsLandingPage() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#0f172a] transition-colors duration-300">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-[#0a1628] via-[#1a3a6b] to-[#0d2a50] text-white overflow-hidden py-20 border-b border-slate-200 dark:border-[#243550]">
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", 
            backgroundSize: "28px 28px" 
          }} 
        />
        {/* Glow Effects */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center lg:text-left flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Professional Toolbox
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
              Tax Professional <span className="text-amber-400">Tools</span>
            </h1>
            <p className="text-slate-200 text-lg max-w-2xl leading-relaxed">
              Explore our collection of utility tools designed specifically for tax professionals. 
              Draft fillable forms, automate calculations, and simplify complex client workflows.
            </p>
          </div>
          <div className="lg:w-1/3 w-full flex justify-center">
            <div className="w-40 h-40 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl relative rotate-3 hover:rotate-0 transition-all duration-300">
              <Wrench className="w-20 h-20 text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`group flex flex-col bg-white dark:bg-[#172135] rounded-3xl border ${tool.color} transition-all duration-300 shadow-sm hover:-translate-y-1.5 hover:shadow-xl`}
              >
                {/* Header Info */}
                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#0a1628]/5 dark:bg-white/5 flex items-center justify-center text-[#1a3a6b] dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border tracking-wide uppercase ${tool.badgeColor}`}>
                      {tool.tag}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xl text-[#0a1628] dark:text-white mb-3">
                    {tool.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="p-8 pt-0 border-t border-slate-100 dark:border-[#243550]">
                  {tool.isAvailable ? (
                    <Link
                      href={tool.href}
                      className="w-full flex items-center justify-center gap-2 bg-[#0a1628] hover:bg-[#1a3a6b] text-white dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-[#0a1628] font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 group-hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-[#0a1628]/10"
                    >
                      Launch Editor
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-extrabold py-3 rounded-2xl text-xs uppercase tracking-wider cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Promo Info */}
        <div className="mt-16 bg-gradient-to-br from-[#0a1628] to-[#1a3a6b] rounded-3xl p-8 text-white grid md:grid-cols-3 gap-8 shadow-lg">
          {[
            { 
              icon: "🔒", 
              title: "100% Client-Side", 
              desc: "Files are processed directly in your browser. Your sensitive documents never touch our servers." 
            },
            { 
              icon: "⚡", 
              title: "Instant Processing", 
              desc: "Render pages, place form elements, and compile interactive PDFs in real time without lag." 
            },
            { 
              icon: "🎓", 
              title: "Professional Standards", 
              desc: "Generated documents are fully compliant with IRS e-file formats and Standard PDF AcroForm rules." 
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="text-3xl shrink-0 select-none">{item.icon}</span>
              <div>
                <h4 className="font-extrabold text-base mb-1 text-amber-400">{item.title}</h4>
                <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
