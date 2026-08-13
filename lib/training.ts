// Client-safe constants and pure helpers for the ERO Training Center.
// IMPORTANT: this file must never import `@/lib/prisma` or Node built-ins
// (crypto, dns, etc.) — it's imported from client components. Server-only
// helpers (DB access, crypto) live in `@/lib/trainingServer` instead.

// Toolkits that include a staff due-diligence training license. Extend this
// list when other toolkits (Audit Playbook, Schedule C Reconstruction, etc.)
// get their own ERO Training Center in a later phase.
export const TRAINING_TOOLKIT_IDS = new Set(["irs-fine-defense"]);

export const DEFAULT_SEATS = 5;
export const LICENSE_MONTHS = 12;
// Placeholder price for additional seats — flagged for the user to confirm/replace.
export const ADDITIONAL_SEAT_PRICE_USD = 25;

export const DEFAULT_VERSION_LABEL = "2026 Filing Season Due-Diligence Staff Training";

export const ACKNOWLEDGMENT_STATEMENTS = [
  "I acknowledge that I completed The Staff's Audit Ready Due Diligence Playbook training.",
  "I understand that completing Form 8867 alone does not satisfy all paid-preparer due-diligence requirements.",
  "I agree to follow office procedures, ask reasonable additional questions, document client responses, escalate unresolved inconsistencies, protect taxpayer information, and refuse to prepare or file information I know — or have reason to know — is false.",
];

export const CERTIFICATE_DISCLAIMER =
  "This certificate documents completion of a Tax Compliance Pro educational program. It does not represent IRS certification, licensing, endorsement, or a determination that the participant has satisfied every legal requirement.";

export const STATUS_LABELS: Record<string, string> = {
  INVITED: "Invitation Sent",
  REGISTERED: "Registered",
  TRAINING_STARTED: "Training Started",
  VIDEO_COMPLETED: "Video Completed",
  ASSESSMENT_REQUIRED: "Assessment Required",
  PASSED: "Passed",
  FAILED_RETAKE_REQUIRED: "Failed — Retake Required",
  TRAINING_COMPLETED: "Training Completed",
  ACCESS_REVOKED: "Access Revoked",
};

export const STATUS_COLORS: Record<string, string> = {
  INVITED: "bg-slate-100 text-slate-600",
  REGISTERED: "bg-blue-100 text-blue-700",
  TRAINING_STARTED: "bg-indigo-100 text-indigo-700",
  VIDEO_COMPLETED: "bg-purple-100 text-purple-700",
  ASSESSMENT_REQUIRED: "bg-amber-100 text-amber-700",
  PASSED: "bg-emerald-100 text-emerald-700",
  FAILED_RETAKE_REQUIRED: "bg-red-100 text-red-700",
  TRAINING_COMPLETED: "bg-emerald-100 text-emerald-700",
  ACCESS_REVOKED: "bg-slate-200 text-slate-500",
};

export type TrainingStatusValue =
  | "INVITED" | "REGISTERED" | "TRAINING_STARTED" | "VIDEO_COMPLETED" | "ASSESSMENT_REQUIRED"
  | "PASSED" | "FAILED_RETAKE_REQUIRED" | "TRAINING_COMPLETED" | "ACCESS_REVOKED";

// Statuses that represent forward progress through the training. Applying an
// earlier status than the current one is a no-op — a preparer's status
// should never regress just because of an out-of-order event. FAILED_RETAKE
// and ACCESS_REVOKED are special-cased outside this order.
const PROGRESS_ORDER: TrainingStatusValue[] = [
  "INVITED", "REGISTERED", "TRAINING_STARTED", "VIDEO_COMPLETED", "ASSESSMENT_REQUIRED", "PASSED", "TRAINING_COMPLETED",
];

export function advanceStatus(current: string, next: TrainingStatusValue): TrainingStatusValue {
  const ci = PROGRESS_ORDER.indexOf(current as TrainingStatusValue);
  const ni = PROGRESS_ORDER.indexOf(next);
  if (ci === -1 || ni === -1) return next;
  return ni > ci ? next : (current as TrainingStatusValue);
}

// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
