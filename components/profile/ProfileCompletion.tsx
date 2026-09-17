"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowDown01Icon, ArrowRight01Icon, Tick02Icon, UserCheck01Icon } from "hugeicons-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, type AuthUser } from "@/store/slices/authSlice";
import { profileCompletionSteps } from "@/lib/profileCompletion";
import type { ProfileEditTab, ProfileFormData } from "./EditProfileModal";
import "./profile-ui.css";

const EditProfileModal = dynamic(() => import("./EditProfileModal"));
type CompletionProfile = ProfileFormData & { profileSlug: string };

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

  return <>
    <aside className={`profile-completion ${expanded ? "is-expanded" : ""}`} aria-label="Profile completion">
      <button className="profile-completion-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="profile-completion-steps">
        <span className="profile-completion-icon"><UserCheck01Icon size={22} /></span>
        <span><strong>Complete your profile</strong><small>{percentage}% complete · {steps.length - completed} steps left</small></span>
        <ArrowDown01Icon size={18} className={expanded ? "rotate-180" : ""} />
      </button>
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
    {editTab && <EditProfileModal isOpen onClose={() => setEditTab(null)} initialData={profile} initialTab={editTab} userId={user.id} role={user.role} onSaveSuccess={saved} />}
  </>;
}
