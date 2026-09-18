"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowDataTransferHorizontalIcon, ArrowDown01Icon, ArrowRight01Icon, MinusSignIcon, Tick02Icon, UserCheck01Icon } from "hugeicons-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, type AuthUser } from "@/store/slices/authSlice";
import { profileCompletionSteps } from "@/lib/profileCompletion";
import type { ProfileEditTab, ProfileFormData } from "./EditProfileModal";
import "./profile-ui.css";

const EditProfileModal = dynamic(() => import("./EditProfileModal"));
type CompletionProfile = ProfileFormData & { profileSlug: string };
type WidgetPrefs = { side: "left" | "right"; minimized: boolean };
const PREFS_KEY = "profile-completion-widget";

export default function ProfileCompletion() {
  const user = useAppSelector(state => state.auth.user);
  return user ? <CompletionChecklist key={user.id} user={user} /> : null;
}

function CompletionChecklist({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<CompletionProfile | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [editTab, setEditTab] = useState<ProfileEditTab | null>(null);
  const [prefs, setPrefs] = useState<WidgetPrefs>({ side: "left", minimized: false });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null") as Partial<WidgetPrefs> | null;
      if (saved) setPrefs({ side: saved.side === "right" ? "right" : "left", minimized: !!saved.minimized });
    } catch {}
  }, []);
  const updatePrefs = (next: Partial<WidgetPrefs>) => setPrefs(previous => {
    const merged = { ...previous, ...next };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(merged)); } catch {}
    return merged;
  });
  useEffect(() => {
    const controller = new AbortController();
    const update = () => {
      fetch("/api/profile/completion", { signal: controller.signal })
        .then(response => response.ok ? response.json() : null)
        .then(data => {
          if (data && !controller.signal.aborted) setProfile({ ...data, yearsExperience: data.yearsExperience == null ? "" : String(data.yearsExperience), professionalTitle: data.professionalTitle || "" });
        }).catch(() => {});
    };
    update();
    window.addEventListener("profile-updated", update);
    window.addEventListener("focus", update);
    return () => {
      controller.abort();
      window.removeEventListener("profile-updated", update);
      window.removeEventListener("focus", update);
    };
  }, [pathname]);

  if (!profile) return null;
  const steps = profileCompletionSteps(profile);
  const completed = steps.filter(step => step.done).length;
  if (completed === steps.length && !editTab) return null;
  const percentage = Math.round(completed / steps.length * 100);

  const saved = (updated: ProfileFormData) => {
    setProfile({ ...profile, ...updated });
    dispatch(setUser({ ...user, name: updated.name, image: updated.image, headline: updated.headline, bio: updated.bio, professionalTitle: updated.professionalTitle, profileSlug: profile.profileSlug }));
  };

  const sideClass = prefs.side === "right" ? "is-right" : "";
  const otherSide = prefs.side === "right" ? "left" : "right";

  return <>
    {prefs.minimized ? (
      <button
        className={`profile-completion-pill ${sideClass}`}
        onClick={() => updatePrefs({ minimized: false })}
        aria-label={`Show profile completion, ${percentage}% complete`}
        title="Complete your profile"
        style={{ "--pc-progress": `${percentage * 3.6}deg` } as React.CSSProperties}
      >
        <span>{percentage}%</span>
      </button>
    ) : (
    <aside className={`profile-completion ${sideClass} ${expanded ? "is-expanded" : ""}`} aria-label="Profile completion">
      <div className="profile-completion-header">
        <button className="profile-completion-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="profile-completion-steps">
          <span className="profile-completion-icon"><UserCheck01Icon size={22} /></span>
          <span><strong>Complete your profile</strong><small>{percentage}% complete · {steps.length - completed} steps left</small></span>
          <ArrowDown01Icon size={18} className={expanded ? "rotate-180" : ""} />
        </button>
        <div className="profile-completion-actions">
          <button onClick={() => updatePrefs({ side: otherSide })} aria-label={`Move to bottom ${otherSide}`} title={`Move to bottom ${otherSide}`}>
            <ArrowDataTransferHorizontalIcon size={15} />
          </button>
          <button onClick={() => { setExpanded(false); updatePrefs({ minimized: true }); }} aria-label="Minimize" title="Minimize">
            <MinusSignIcon size={15} />
          </button>
        </div>
      </div>
      {expanded && <div id="profile-completion-steps" className="profile-completion-body">
        <p>Help your next connection get to know you.</p>
        <progress value={completed} max={steps.length} aria-label={`${percentage}% of profile complete`} />
        <ul>{steps.map(step => <li key={step.id}>
          <button onClick={() => setEditTab(step.tab)} className={step.done ? "is-complete" : ""} aria-label={`${step.label}${step.done ? ", completed. Edit" : ""}`}>
            <span className="profile-step-check">{step.done && <Tick02Icon size={13} />}</span>
            <span>{step.label}</span><ArrowRight01Icon size={15} />
          </button>
        </li>)}</ul>
        <small>{completed} of {steps.length} complete. Make it yours, at your pace.</small>
      </div>}
    </aside>
    )}
    {editTab && <EditProfileModal isOpen onClose={() => setEditTab(null)} initialData={profile} initialTab={editTab} userId={user.id} role={user.role} onSaveSuccess={saved} />}
  </>;
}
