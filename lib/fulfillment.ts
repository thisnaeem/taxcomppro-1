import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";
import { DEFAULT_SEATS, LICENSE_MONTHS } from "@/lib/training";
import { ensureActiveTrainingVersion } from "@/lib/trainingServer";
import { notifyAdminPurchase } from "@/lib/email";

export interface FulfillOptions {
  userId: string;
  session: Stripe.Checkout.Session;
  membershipBonus?: { sessionId: string } | null;
}

const ALL_6_TOOLKITS = [
  "30-day-tax-office",
  "due-diligence-course",
  "irs-fine-defense",
  "schedule-c-reconstruction",
  "audit-playbook",
  "credits-filing-status",
] as const;

const CANONICAL_DOMAINS: Record<
  string,
  {
    canonicalToolkitId: string;
    courseSlugs: string[];
    defaultTitle: string;
  }
> = {
  "30-day-launch": {
    canonicalToolkitId: "30-day-tax-office",
    courseSlugs: ["30-day-tax-office-launch", "30-day-launch", "30daylaunch"],
    defaultTitle: "30 Day Tax Office Launch",
  },
  "irs-fine-defense": {
    canonicalToolkitId: "irs-fine-defense",
    courseSlugs: ["irs-fine-defense", "irs-fine-defense-toolkit-masterclass"],
    defaultTitle: "IRS Fine Defense",
  },
  "schedule-c-reconstruction": {
    canonicalToolkitId: "schedule-c-reconstruction",
    courseSlugs: ["schedule-c-reconstruction", "mastering-schedule-c-reconstruction"],
    defaultTitle: "Schedule C Reconstruction",
  },
  "audit-playbook": {
    canonicalToolkitId: "audit-playbook",
    courseSlugs: ["audit-playbook", "irs-audit-playbook", "audit-ready-playbook"],
    defaultTitle: "IRS Audit Playbook",
  },
  "credits-filing-status": {
    canonicalToolkitId: "credits-filing-status",
    courseSlugs: ["credits-filing-status", "credits-filing-status-explained"],
    defaultTitle: "Credits & Filing Status Explained",
  },
  "staff-audit-ready": {
    canonicalToolkitId: "due-diligence-course",
    courseSlugs: ["staff-audit-ready", "due-diligence-course", "due-diligence"],
    defaultTitle: "The Staff's Audit Ready Due Diligence",
  },
};

export function resolveDomainKey(input?: string | null): string {
  if (!input) return "";
  const clean = input.toLowerCase().replace(/^(course|toolkit|bundle|training):/, "").trim();

  if (clean.includes("schedule-c") || clean.includes("schedulec")) return "schedule-c-reconstruction";
  if (clean.includes("30-day") || clean.includes("30day") || clean.includes("launch")) return "30-day-launch";
  if (clean.includes("fine-defense") || clean.includes("finedefense")) return "irs-fine-defense";
  if (clean.includes("audit") && (clean.includes("playbook") || clean.includes("defense"))) return "audit-playbook";
  if (clean.includes("credit")) return "credits-filing-status";
  if (clean.includes("staff") || clean.includes("due-diligence") || clean.includes("audit-ready")) return "staff-audit-ready";

  return clean;
}

export async function fulfillStripePurchase({
  userId,
  session,
  membershipBonus,
}: FulfillOptions): Promise<{ enrolledCourseSlug?: string | null }> {
  const { type, toolkitId, bundleId, courseId, slug, productKey, product } = session.metadata ?? {};
  const mTier = "MARKETPLACE_PLUS" as SubscriptionTier;
  const isMembershipGranted = membershipBonus?.sessionId === session.id;
  const membershipMonths = isMembershipGranted ? 2 : 0;
  let enrolledCourseSlug: string | null = null;

  const rawKey = productKey || toolkitId || bundleId || slug || courseId || product || "";
  const isUltimatePlus = rawKey.includes("ultimate-bundle-plus") || bundleId?.includes("ultimate-bundle-plus");
  const isUltimate = rawKey.includes("ultimate-bundle") || bundleId?.includes("ultimate-bundle");

  // ── 1. ULTIMATE BUNDLE / ULTIMATE BUNDLE PLUS ───────────────────────────
  if (isUltimate || isUltimatePlus) {
    const seats = isUltimatePlus ? 10 : 5;
    const months = isUltimatePlus ? 24 : 12;

    for (const tk of ALL_6_TOOLKITS) {
      await prisma.toolkitPurchase.upsert({
        where: { stripeSessionId: `${session.id}_${tk}` },
        create: {
          userId,
          toolkitId: tk,
          stripeSessionId: `${session.id}_${tk}`,
          membershipGranted: isMembershipGranted,
          membershipTier: mTier,
          membershipMonths,
        },
        update: {},
      }).catch(async () => {
        const exists = await prisma.toolkitPurchase.findFirst({ where: { userId, toolkitId: tk } });
        if (!exists) {
          await prisma.toolkitPurchase.create({
            data: {
              userId,
              toolkitId: tk,
              stripeSessionId: `${session.id}_${tk}`,
              membershipGranted: isMembershipGranted,
              membershipTier: mTier,
              membershipMonths,
            },
          }).catch(() => {});
        }
      });

      try {
        await ensureActiveTrainingVersion(tk);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);
        await prisma.trainingLicense.upsert({
          where: { eroId_toolkitId: { eroId: userId, toolkitId: tk } },
          create: { eroId: userId, toolkitId: tk, totalSeats: seats, expiresAt },
          update: { totalSeats: seats, expiresAt },
        });
      } catch (e) {
        console.error(`[Fulfillment] Failed to upsert training license for ${tk}:`, e);
      }
    }

    // Also record the master bundle purchase
    await prisma.toolkitPurchase.upsert({
      where: { stripeSessionId: session.id },
      create: {
        userId,
        toolkitId: `bundle:${isUltimatePlus ? "ultimate-bundle-plus" : "ultimate-bundle"}`,
        stripeSessionId: session.id,
        membershipGranted: isMembershipGranted,
        membershipTier: mTier,
        membershipMonths,
      },
      update: {},
    }).catch(() => {});

    // Enroll in all available courses
    const allCourses = await prisma.course.findMany({ select: { id: true, slug: true, title: true } });
    for (const c of allCourses) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: c.id } },
        create: { userId, courseId: c.id },
        update: {},
      }).catch(() => {});
    }

    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: isUltimatePlus ? "🌟 Ultimate Bundle PLUS Unlocked!" : "🌟 Ultimate Bundle Unlocked!",
        message: "All 6 toolkits, courses, and staff training licenses are now active in your account.",
        link: "/toolkits",
      },
    }).catch(() => {});

    await notifyAdminPurchase({
      userId,
      itemType: "bundle",
      itemName: isUltimatePlus
        ? "Ultimate Bundle PLUS (All 6 Toolkits + 10 Seats + 24 Mo)"
        : "Ultimate Bundle (All 6 Toolkits + 5 Seats + 12 Mo)",
      amountTotal: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
    }).catch((err) => console.error("[Fulfillment] Admin purchase notify error:", err));

    return { enrolledCourseSlug: "schedule-c-reconstruction" };
  }

  // ── 2. SINGLE PRODUCT BUNDLE ─────────────────────────────────────────────
  if (type === "bundle" || rawKey.startsWith("bundle:")) {
    const domainKey = resolveDomainKey(rawKey);
    const domain = CANONICAL_DOMAINS[domainKey];
    const resolvedTkId = domain?.canonicalToolkitId || toolkitId || domainKey;

    await prisma.toolkitPurchase.upsert({
      where: { stripeSessionId: session.id },
      create: {
        userId,
        toolkitId: resolvedTkId,
        stripeSessionId: session.id,
        membershipGranted: isMembershipGranted,
        membershipTier: mTier,
        membershipMonths,
      },
      update: {},
    }).catch(() => {});

    // Create 5-seat training license
    if (resolvedTkId) {
      try {
        await ensureActiveTrainingVersion(resolvedTkId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + LICENSE_MONTHS);
        await prisma.trainingLicense.upsert({
          where: { eroId_toolkitId: { eroId: userId, toolkitId: resolvedTkId } },
          create: { eroId: userId, toolkitId: resolvedTkId, totalSeats: DEFAULT_SEATS, expiresAt },
          update: { totalSeats: DEFAULT_SEATS, expiresAt },
        });
      } catch (e) {
        console.error(`[Fulfillment] Training license error for bundle ${resolvedTkId}:`, e);
      }
    }

    // Enroll in course
    if (domain?.courseSlugs) {
      const course = await prisma.course.findFirst({
        where: { OR: domain.courseSlugs.map((s) => ({ slug: s })) },
        select: { id: true, slug: true, title: true },
      });
      if (course) {
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId, courseId: course.id } },
          create: { userId, courseId: course.id },
          update: {},
        }).catch(() => {});
        enrolledCourseSlug = course.slug;
      }
    }

    await notifyAdminPurchase({
      userId,
      itemType: "bundle",
      itemName: domain?.defaultTitle ? `${domain.defaultTitle} Bundle` : `Bundle: ${resolvedTkId}`,
      amountTotal: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
    }).catch((err) => console.error("[Fulfillment] Admin purchase alert error:", err));

    return { enrolledCourseSlug: enrolledCourseSlug || domain?.courseSlugs?.[0] || null };
  }

  // ── 3. TOOLKIT ONE-TIME PURCHASE ─────────────────────────────────────────
  if (type === "toolkit" || rawKey.startsWith("toolkit:")) {
    const domainKey = resolveDomainKey(rawKey);
    const domain = CANONICAL_DOMAINS[domainKey];
    const resolvedTkId = domain?.canonicalToolkitId || toolkitId || domainKey;

    const alreadyRecorded = await prisma.toolkitPurchase.findFirst({ where: { stripeSessionId: session.id } });
    if (!alreadyRecorded && resolvedTkId) {
      await prisma.toolkitPurchase.create({
        data: {
          userId,
          toolkitId: resolvedTkId,
          stripeSessionId: session.id,
          membershipGranted: isMembershipGranted,
          membershipTier: mTier,
          membershipMonths,
        },
      });
    }

    // Auto-grant a 5-seat, 12-month staff training license
    if (resolvedTkId) {
      try {
        await ensureActiveTrainingVersion(resolvedTkId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + LICENSE_MONTHS);
        await prisma.trainingLicense.upsert({
          where: { eroId_toolkitId: { eroId: userId, toolkitId: resolvedTkId } },
          create: { eroId: userId, toolkitId: resolvedTkId, totalSeats: DEFAULT_SEATS, expiresAt },
          update: {},
        });
      } catch (e) {
        console.error(`[Fulfillment] Training license error for toolkit ${resolvedTkId}:`, e);
      }
    }

    await notifyAdminPurchase({
      userId,
      itemType: "toolkit",
      itemName: domain?.defaultTitle ? `${domain.defaultTitle} Toolkit` : `Toolkit: ${resolvedTkId}`,
      amountTotal: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
    }).catch((err) => console.error("[Fulfillment] Admin purchase alert error:", err));

    return { enrolledCourseSlug: null };
  }

  // ── 4. COURSE ONE-TIME PURCHASE ──────────────────────────────────────────
  if (type === "course" || rawKey.startsWith("course:")) {
    const domainKey = resolveDomainKey(rawKey);
    const domain = CANONICAL_DOMAINS[domainKey];
    const resolvedTkId = domain?.canonicalToolkitId || toolkitId || domainKey;

    // Resolve course by ID or slug
    let targetCourse: { id: string; slug: string; title: string; instructorId: string } | null = null;

    if (courseId) {
      targetCourse = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, slug: true, title: true, instructorId: true },
      });
    }

    if (!targetCourse && domain?.courseSlugs) {
      targetCourse = await prisma.course.findFirst({
        where: {
          OR: [
            ...(slug ? [{ slug }] : []),
            ...domain.courseSlugs.map((s) => ({ slug: s })),
          ],
        },
        select: { id: true, slug: true, title: true, instructorId: true },
      });
    }

    if (targetCourse) {
      const alreadyEnrolled = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: targetCourse.id } },
      });

      if (!alreadyEnrolled) {
        await prisma.enrollment.create({
          data: { userId, courseId: targetCourse.id },
        });

        await prisma.notification.create({
          data: {
            userId: targetCourse.instructorId,
            type: "ENROLLMENT",
            title: "New Paid Enrollment",
            message: `Someone purchased your course: ${targetCourse.title}`,
            link: `/courses/${targetCourse.slug}`,
          },
        }).catch(() => {});

        await prisma.notification.create({
          data: {
            userId,
            type: "SYSTEM",
            title: "🎉 Course Purchase Complete!",
            message: `You are now enrolled in "${targetCourse.title}". Start learning now!`,
            link: `/courses/${targetCourse.slug}/learn`,
          },
        }).catch(() => {});
      }
      enrolledCourseSlug = targetCourse.slug;
    }

    // Auto-grant 5-seat, 12-month staff training license for the domain
    if (resolvedTkId) {
      try {
        await ensureActiveTrainingVersion(resolvedTkId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + LICENSE_MONTHS);
        await prisma.trainingLicense.upsert({
          where: { eroId_toolkitId: { eroId: userId, toolkitId: resolvedTkId } },
          create: { eroId: userId, toolkitId: resolvedTkId, totalSeats: DEFAULT_SEATS, expiresAt },
          update: { totalSeats: DEFAULT_SEATS, expiresAt },
        });
      } catch (e) {
        console.error(`[Fulfillment] Training license error for course ${resolvedTkId}:`, e);
      }
    }

    // Record course purchase in toolkitPurchase for idempotency and access tracking
    const coursePurchaseTkId = `course:${domainKey || resolvedTkId}`;
    const alreadyRecorded = await prisma.toolkitPurchase.findFirst({ where: { stripeSessionId: session.id } });
    if (!alreadyRecorded) {
      await prisma.toolkitPurchase.create({
        data: {
          userId,
          toolkitId: coursePurchaseTkId,
          stripeSessionId: session.id,
          membershipGranted: isMembershipGranted,
          membershipTier: mTier,
          membershipMonths,
        },
      }).catch(() => {});
    }

    await notifyAdminPurchase({
      userId,
      itemType: "course",
      itemName: targetCourse?.title || domain?.defaultTitle || `Course: ${domainKey || resolvedTkId}`,
      amountTotal: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
    }).catch((err) => console.error("[Fulfillment] Admin purchase alert error:", err));

    return { enrolledCourseSlug: enrolledCourseSlug || domain?.courseSlugs?.[0] || null };
  }

  return { enrolledCourseSlug: null };
}
