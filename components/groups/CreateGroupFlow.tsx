"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft01Icon, ArrowRight01Icon, UserGroupIcon, ImageUploadIcon, GlobeIcon, LockIcon, Tick02Icon, Loading03Icon, Delete02Icon } from "hugeicons-react";
import { groupCreateSchema } from "@/lib/group-create-schema";
import "./groups.css";

const steps = [
  { title: "The essentials", description: "Name and purpose" },
  { title: "Make it yours", description: "Cover and visibility" },
  { title: "Ready to connect", description: "Review and create" },
];

export default function CreateGroupFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const busy = uploading || saving;

  function goTo(next: number) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image."); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB."); return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "taxcomppro/group-covers");
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") throw new Error(data.error || "The cover could not be uploaded. Please try again.");
      setCoverImage(data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed. Please try again.");
    } finally { setUploading(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || submitting.current) return;
    const result = groupCreateSchema.safeParse({ name, description, coverImage, isPublic });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    if (step < 2) { goTo(step + 1); return; }
    submitting.current = true;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/communities", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.data),
      });
      const data = await response.json();
      if (!response.ok || typeof data.slug !== "string") throw new Error(data.error || "We couldn’t create your group. Please try again.");
      router.push(`/groups/${encodeURIComponent(data.slug)}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn’t create your group. Please try again.");
      setSaving(false); submitting.current = false;
    }
  }

  return (
    <div className="gp-page gp-create-page">
      <div className="gp-container">
        <Link className="gp-back" href="/groups"><ArrowLeft01Icon size={17} /> Back to groups</Link>
        <div className="gp-create-layout">
          <aside className="gp-create-guide">
            <span className="gp-eyebrow">BRING YOUR PEOPLE TOGETHER</span>
            <h1>A shared interest.<br /><em>A new beginning.</em></h1>
            <p>Create a place for conversations, fresh ideas, and people who understand your world.</p>
            <ol className="gp-steps" aria-label="Creation progress">
              {steps.map((item, index) => <li key={item.title} aria-current={step === index ? "step" : undefined}>
                <span>{index < step ? <Tick02Icon size={18} /> : index + 1}</span>
                <div><strong>{item.title}</strong><p>{item.description}</p></div>
              </li>)}
            </ol>
            <div className="gp-live-preview">
              <div className="gp-preview-cover">
                {coverImage ? <Image src={coverImage} alt="Group cover preview" fill unoptimized sizes="420px" /> : <UserGroupIcon size={42} />}
              </div>
              <div><span className="gp-eyebrow">YOUR GROUP AT A GLANCE</span><h2>{name.trim() || "Your group name"}</h2><p>{description.trim() || "A place for your people and their next great conversation."}</p><span className="gp-visibility">{isPublic ? <GlobeIcon size={14} /> : <LockIcon size={14} />}{isPublic ? "Public group" : "Private group"}</span></div>
            </div>
          </aside>
          <form className="gp-create-form" onSubmit={submit}>
            <span className="gp-eyebrow">STEP {step + 1} OF {steps.length}</span>
            <h2 ref={heading} tabIndex={-1}>{steps[step].title}</h2>
            <p className="gp-form-intro">{step === 0 ? "Start with a clear name and a reason to come together." : step === 1 ? "Give your group a familiar face and choose who can discover it." : "Take a final look. Your first conversation starts here."}</p>
            {error && <div className="gp-form-error" role="alert">{error}</div>}
            {step === 0 && <div className="gp-form-fields">
              <label htmlFor="group-name">Group name<input id="group-name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100} placeholder="e.g. Tax practice owners" autoComplete="off" /></label>
              <label htmlFor="group-description">What brings your group together?<textarea id="group-description" value={description} onChange={e => setDescription(e.target.value)} required minLength={10} maxLength={2000} rows={6} placeholder="Tell people what they can discuss, learn, and share here." /></label>
              <p className="gp-field-hint">A specific name and a welcoming description help the right people find you.</p>
            </div>}
            {step === 1 && <div className="gp-form-fields">
              <div><h3>Group cover</h3><p className="gp-field-hint">Recommended size: 1200 × 400 px (3:1 aspect ratio) • JPG, PNG, or WebP up to 10 MB. Optional.</p></div>
              <label className="gp-upload">
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-label="Upload group cover (Recommended: 1200 × 400 px)" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
                {coverImage ? <Image src={coverImage} alt="Selected cover" fill unoptimized sizes="650px" /> : <ImageUploadIcon size={36} />}
                <span>{uploading ? "Uploading your cover…" : coverImage ? "Change cover image" : "Choose a cover image"}</span>
                <small className="text-[11px] text-slate-400 font-normal">1200 × 400 px recommended</small>
              </label>
              <div aria-live="polite">{uploading && <p className="gp-upload-status"><Loading03Icon size={18} className="animate-spin" /> Uploading…</p>}</div>
              {coverImage && <button className="gp-remove-cover" type="button" disabled={busy} onClick={() => setCoverImage(null)}><Delete02Icon size={16} /> Remove cover</button>}
              <fieldset className="gp-visibility-options"><legend>Group visibility</legend>
                {[{ value: true, title: "Public", text: "Listed in the directory for people to discover.", Icon: GlobeIcon }, { value: false, title: "Private", text: "Listed for you and existing members.", Icon: LockIcon }].map(({ value, title, text, Icon }) => <label key={title} data-selected={isPublic === value}>
                  <input type="radio" name="visibility" checked={isPublic === value} onChange={() => setIsPublic(value)} /><Icon size={22} /><span><strong>{title}</strong><small>{text}</small></span>
                </label>)}
              </fieldset>
            </div>}
            {step === 2 && <div className="gp-review">
              <UserGroupIcon size={32} /><h3>{name}</h3><p>{description}</p>
              <dl><div><dt>Visibility</dt><dd>{isPublic ? "Public" : "Private"}</dd></div><div><dt>Cover image</dt><dd>{coverImage ? "Uploaded and ready" : "Default group artwork"}</dd></div><div><dt>Your role</dt><dd>Group admin</dd></div></dl>
              <p className="gp-field-hint">You’ll be added as the first member and taken to your group after creation.</p>
            </div>}
            <footer className="gp-create-actions">
              {step > 0 ? <button type="button" className="gp-back" disabled={busy} onClick={() => goTo(step - 1)}><ArrowLeft01Icon size={17} /> Back</button> : <Link className="gp-back" href="/groups">Cancel</Link>}
              <button type="submit" className="gp-join" disabled={busy}>{saving ? <><Loading03Icon size={17} className="animate-spin" /> Creating group…</> : <>{step === 2 ? "Create group" : "Continue"}<ArrowRight01Icon size={17} /></>}</button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
