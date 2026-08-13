// Server-only training helpers (DB access + crypto). Never import this from
// a client component — import the pure constants from `@/lib/training`
// instead. Splitting these apart is what keeps `pg`/`crypto`/`dns` out of
// the browser bundle.
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { ACKNOWLEDGMENT_STATEMENTS, DEFAULT_VERSION_LABEL } from "@/lib/training";

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `TCP-${year}-${rand}`;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// 30 clearly-labeled placeholder questions covering general due-diligence
// themes. Replace via Admin > Training with the real 30-question bank from
// the playbook before sending this to real preparers.
function placeholderQuestions() {
  const bank = [
    ["Under paid-preparer due-diligence rules, which form must generally be completed and retained when claiming EITC, CTC/ACTC/ODC, AOTC, or Head of Household filing status?", ["Form 8867", "Form 1099-NEC", "Form W-9", "Form 4868"], 0],
    ["What is the general penalty per failure to meet due-diligence requirements on a single return (subject to annual inflation adjustment)?", ["A fixed dollar penalty per failure", "No penalty applies to preparers", "Only the taxpayer is penalized", "A percentage of the refund only"], 0],
    ["If a client's answers seem inconsistent, incomplete, or contradictory, the preparer should:", ["Ask additional reasonable questions and document the responses", "Ignore it and file as instructed", "Refuse all future clients", "Report the client to the IRS immediately"], 0],
    ["How long must a paid preparer generally retain due-diligence records?", ["At least 3 years", "30 days", "1 year", "No retention is required"], 0],
    ["Completing Form 8867 by itself:", ["Does not alone satisfy every due-diligence requirement", "Fully satisfies all due-diligence requirements", "Is optional for EITC claims", "Replaces the need for supporting documentation"], 0],
    ["Which of the following is a knowledge requirement under due diligence?", ["Not knowing, or having reason to know, that information used is incorrect", "Filing as many returns as possible", "Avoiding all client questions", "Relying solely on prior-year returns"], 0],
    ["If a preparer has reason to believe information is false, the preparer should:", ["Make additional inquiries and, if unresolved, decline to prepare or file the return", "File the return anyway to keep the client", "Delete the record of the conversation", "Wait for an IRS audit to raise it"], 0],
    ["Documentation of due-diligence inquiries should be:", ["Contemporaneous and kept in the client file", "Recreated from memory during an audit", "Optional if the preparer trusts the client", "Stored only verbally with staff"], 0],
    ["Which credit(s) are commonly subject to heightened due-diligence requirements?", ["EITC, CTC/ACTC/ODC, AOTC, and Head of Household", "Only the standard deduction", "Only itemized deductions", "Only capital gains treatment"], 0],
    ["An office's written due-diligence procedures should be:", ["Documented, followed consistently, and reviewed periodically", "Kept informal and undocumented", "Only used for new preparers", "Changed for every single client"], 0],
  ] as const;

  const questions: { question: string; options: string[]; correctIndex: number; explanation: string; order: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const [q, opts, correct] = bank[i % bank.length];
    questions.push({
      question: i < bank.length ? q : `[Placeholder ${i + 1}] ${q}`,
      options: [...opts],
      correctIndex: correct,
      explanation: "Review the applicable section of The Staff's Audit Ready Due Diligence Playbook.",
      order: i,
    });
  }
  return questions;
}

// Finds (or lazily creates) the active TrainingVersion for a toolkit, seeding
// 30 placeholder questions the first time so the system works end-to-end
// before real content is uploaded via Admin > Training.
export async function ensureActiveTrainingVersion(toolkitId: string) {
  const existing = await prisma.trainingVersion.findFirst({
    where: { toolkitId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.trainingVersion.create({
    data: {
      toolkitId,
      versionLabel: DEFAULT_VERSION_LABEL,
      isActive: true,
      videoProvider: "youtube",
      videoId: null,
      videoDurationSeconds: 0,
      passingScore: 80,
      questionsToShow: 25,
      maxAttempts: 2,
      acknowledgmentText: ACKNOWLEDGMENT_STATEMENTS.join("\n"),
      questions: { create: placeholderQuestions() },
    },
  });
}
