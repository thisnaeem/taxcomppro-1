"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  BadgeCheck, Loader2, CheckCircle, Clock, X, Shield,
  Search, Send, Building, Star, Briefcase, Award, Calendar,
  User, Globe, MapPin, Monitor, MessageSquare, Mail, Phone,
  FileText, UploadCloud, Edit3, Check
} from "lucide-react";

type AppStatus = "PENDING" | "APPROVED" | "REJECTED";
interface Application {
  id: string;
  status: AppStatus;
  specialty: string;
  credentials: string;
  reason: string;
  note: string | null;
  createdAt: string;
}

const CATEGORIES = [
  "Tax Professional (EA, Tax Strategist, Preparer)",
  "CPA / Certified Public Accountant",
  "Bookkeeper & Financial Controller",
  "Attorney / Legal Counsel (Tax, Corporate, Estate)",
  "Financial Planner & Wealth Advisor (CFP)",
  "Business Consultant & Advisory",
  "Payroll Specialist",
  "IRS Audit & Defense Specialist",
  "Other Professional Services",
];

const POPULAR_SERVICES = [
  "Tax Preparation & Filing",
  "IRS Audit Defense & Resolution",
  "Bookkeeping & Financials",
  "Payroll Processing",
  "Entity Formation & Structuring",
  "Estate & Trust Planning",
  "Fractional CFO & Advisory",
  "Sales Tax & Compliance",
  "Legal Representation",
  "Business Consulting",
];

export default function ApplyProfessionalPage() {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);

  const [app, setApp] = useState<Application | null | undefined>(undefined);

  // Form State
  const [category, setCategory] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [credentials, setCredentials] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [isInPerson, setIsInPerson] = useState(true);
  const [isVirtual, setIsVirtual] = useState(true);
  const [languages, setLanguages] = useState("English");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [reason, setReason] = useState("");

  // File upload state
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/professional-application")
      .then(r => r.json())
      .then(setApp)
      .catch(() => setApp(null));
  }, []);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.name && !businessName) {
      setBusinessName(user.name);
    }
  }, [user, email, businessName]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070f1e] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#0a1628] border border-amber-400/50 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
          <Shield className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-black text-[#0a1628] dark:text-white mb-2">Sign in to Apply</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          Please sign in or create an account to submit your application for the verified professional directory.
        </p>
        <button
          onClick={() => router.push("/login?redirect=/apply-professional")}
          className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a1628] font-black rounded-full hover:shadow-lg transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (user.role === "PROFESSIONAL") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070f1e] flex items-center justify-center px-4 py-16">
        <div className="bg-white dark:bg-[#111c30] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-400/40">
            <BadgeCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-[#0a1628] dark:text-white mb-2">You&apos;re already a Professional!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Your profile is verified and active in the Find a Professional directory.
          </p>
          <button
            onClick={() => router.push(`/find-a-pro/${user.id}`)}
            className="w-full py-3.5 bg-[#0a1628] text-white font-black rounded-xl hover:bg-[#1a3a6b] transition-all text-sm shadow-md"
          >
            View My Public Pro Profile
          </button>
        </div>
      </div>
    );
  }

  if (app === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a1628] dark:text-amber-400" />
      </div>
    );
  }

  const toggleService = (srv: string) => {
    setSelectedServices(prev =>
      prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }
    setLicenseFile(file);
    setUploadingFile(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "licenses");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setLicenseUrl(data.url ?? (Array.isArray(data.urls) ? data.urls[0] : null));
      } else {
        const errData = await res.json();
        setError(errData.error ?? "Failed to upload file to Cloudinary");
      }
    } catch {
      setError("Failed to upload file to Cloudinary");
    } finally {
      setUploadingFile(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!category.trim()) { setError("Please select your professional category."); return; }
    if (!specialty.trim()) { setError("Please provide your primary specialty."); return; }
    if (!credentials.trim()) { setError("Please enter your credentials & certifications."); return; }
    if (!yearsExperience.trim()) { setError("Please enter your years of experience."); return; }
    if (!businessName.trim()) { setError("Please enter your business or professional name."); return; }
    if (!serviceArea.trim()) { setError("Please provide your service area."); return; }
    if (!email.trim()) { setError("Please provide your business email."); return; }
    if (!phone.trim()) { setError("Please provide your phone number."); return; }
    if (!reason.trim()) { setError("Please explain why clients should choose you."); return; }

    const serviceModes = [
      isInPerson ? "In-Person" : null,
      isVirtual ? "Virtual" : null,
    ].filter(Boolean) as string[];

    setSubmitting(true);
    try {
      const res = await fetch("/api/professional-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          specialty,
          services: selectedServices,
          credentials,
          yearsExperience,
          businessName,
          website,
          serviceArea,
          serviceModes,
          languages,
          email,
          phone,
          businessAddress,
          reason,
          licenseUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json() as Application;
        setApp(data);
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Failed to submit application. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] dark:from-[#070f1e] dark:via-[#0a1628] dark:to-[#0f223f] py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Top Floating Badge */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#0a1628] border-2 border-amber-400/90 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-400/10">
            <div className="relative flex items-center justify-center">
              <Shield className="w-8 h-8 text-amber-400 fill-amber-400/10" />
              <Check className="w-4 h-4 text-amber-300 absolute stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Header Titles */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-[#0a1628] dark:text-white tracking-tight mb-2">
            Get Listed on <span className="text-amber-500 dark:text-amber-400">Find a Professional</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
            Join our professional directory and connect with clients looking for trusted experts like you.
          </p>
        </div>

        {/* Existing Application Status Card */}
        {app && app.status === "PENDING" && (
          <div className="bg-white dark:bg-[#111c30] border-2 border-amber-400/50 rounded-3xl p-8 text-center shadow-xl mb-8">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-pulse" />
            <h2 className="font-black text-2xl text-[#0a1628] dark:text-white mb-2">Application Under Review</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Your application for <strong>{app.specialty}</strong> is currently being reviewed by our administrative team.
            </p>
            <div className="mt-4 inline-block bg-amber-50 dark:bg-amber-400/10 border border-amber-300 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full">
              Submitted on {new Date(app.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {app && app.status === "APPROVED" && (
          <div className="bg-white dark:bg-[#111c30] border-2 border-emerald-500/50 rounded-3xl p-8 text-center shadow-xl mb-8">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="font-black text-2xl text-[#0a1628] dark:text-white mb-2">Application Approved!</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
              Congratulations! You are now a verified professional on TaxCompPro.
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="px-8 py-3.5 bg-[#0a1628] text-white font-bold rounded-xl hover:bg-[#1a3a6b] transition-all text-sm shadow-md"
            >
              Go to My Profile
            </button>
          </div>
        )}

        {app && app.status === "REJECTED" && (
          <div className="bg-white dark:bg-[#111c30] border-2 border-red-500/40 rounded-3xl p-8 text-center shadow-xl mb-8">
            <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="font-black text-2xl text-[#0a1628] dark:text-white mb-2">Application Not Approved</h2>
            {app.note && <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 max-w-md mx-auto">{app.note}</p>}
            <button
              onClick={() => setApp(null)}
              className="px-6 py-2.5 bg-[#0a1628] text-white font-bold rounded-full hover:bg-[#1a3a6b] transition-all text-sm"
            >
              Submit a New Application
            </button>
          </div>
        )}

        {/* Main Application Form Container */}
        {(!app || app.status === "REJECTED") && (
          <div className="bg-white dark:bg-[#111c30] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-10">

            {/* Top 3 Benefit Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-400/10 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0a1628] dark:text-white">Verified Profile</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Build trust with a verified badge.</p>
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-400/10 flex items-center justify-center shrink-0 border border-blue-400/30">
                  <Search className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0a1628] dark:text-white">Get Discovered</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Increase visibility and reach more clients.</p>
                </div>
              </div>

              <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-400/10 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <Send className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0a1628] dark:text-white">Connect With Clients</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Receive inquiries and grow your business.</p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-6">

              {/* Row 1: Professional Category & Primary Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Professional Category <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Building className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full pl-10 pr-8 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white appearance-none"
                    >
                      <option value="">Select your category</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Speciality <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Star className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      placeholder="e.g. Tax Resolution, Bookkeeping"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Services Offered */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Services Offered <span className="text-amber-500">*</span>
                </label>
                <div className="p-3.5 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    <span>Select all services that apply to your practice:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SERVICES.map(srv => {
                      const selected = selectedServices.includes(srv);
                      return (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => toggleService(srv)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            selected
                              ? "bg-amber-400/20 text-amber-600 dark:text-amber-300 border-amber-400/50 shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}{srv}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 3: Credentials & Years of Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Credentials & Certifications <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Award className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={credentials}
                      onChange={e => setCredentials(e.target.value)}
                      placeholder="e.g. CPA, EA, Attorney, CFP"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Years of Experience <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={yearsExperience}
                      onChange={e => setYearsExperience(e.target.value)}
                      placeholder="e.g. 5+ years"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Business / Professional Name & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Business / Professional Name <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="Enter your business name"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Website / Booking Link
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Service Area & Mode Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Service Area <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={serviceArea}
                      onChange={e => setServiceArea(e.target.value)}
                      placeholder="City, State or Nationwide"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInPerson(v => !v)}
                    className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                      isInPerson
                        ? "bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border-amber-400 shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500" /> In-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVirtual(v => !v)}
                    className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                      isVirtual
                        ? "bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border-amber-400 shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-blue-500" /> Virtual
                  </button>
                </div>
              </div>

              {/* Row 6: Languages & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Languages Spoken
                  </label>
                  <div className="relative flex items-center">
                    <MessageSquare className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={languages}
                      onChange={e => setLanguages(e.target.value)}
                      placeholder="e.g. English, Spanish"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="youremail@email.com"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7: Phone Number & Business Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(123) 456-7890"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Business Address
                  </label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={businessAddress}
                      onChange={e => setBusinessAddress(e.target.value)}
                      placeholder="Street, City, State, ZIP"
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 8: Why Should Clients Choose You? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Why Should Clients Choose You? <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <Edit3 className="w-4 h-4 text-amber-500 absolute top-3.5 left-3.5 pointer-events-none" />
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    maxLength={800}
                    placeholder="Tell clients about your expertise, experience, and the value you bring..."
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-all text-[#0a1628] dark:text-white placeholder-slate-400 resize-none"
                  />
                  <div className="text-[11px] text-slate-400 text-right mt-1">
                    {reason.length}/800
                  </div>
                </div>
              </div>

              {/* Row 9: Upload Credentials / License */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-900/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-[#0a1628] dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {uploadingFile ? (
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : licenseUrl ? (
                      <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                    ) : (
                      <UploadCloud className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-[#0a1628] dark:text-white">
                        Upload Credentials / License <span className="text-slate-400 font-normal">(if applicable)</span>
                      </h4>
                      {licenseUrl && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Uploaded to Cloudinary
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {uploadingFile
                        ? "Uploading to Cloudinary…"
                        : licenseFile
                        ? `Selected: ${licenseFile.name}`
                        : "PDF, JPG or PNG (Max. 5MB)"}
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-[#0a1628] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shrink-0 shadow-sm disabled:opacity-50"
                >
                  {uploadingFile ? "Uploading…" : licenseFile ? "Change File" : "Choose File"}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* Submit Application Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-[#0a1628] hover:bg-[#15233c] text-white font-black text-sm sm:text-base py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    Submitting Application…
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <Shield className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  </>
                )}
              </button>

              {/* Footer Notice */}
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Applications are reviewed within 1-2 business days.
              </p>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
