import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLKITS, BUNDLES, getToolkit, getBundle } from "@/lib/toolkits";
import { COURSES } from "@/lib/courses";
import type { SubscriptionTier } from "@prisma/client";

async function requireAdmin(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return session;
}

const COURSE_ALIAS_MAP: Record<string, string[]> = {
  "30-day-launch": ["30-day-launch", "30-day-tax-office-launch", "30-day-tax-office", "30daylaunch", "cmooyt4qz000004l2hgvycccx"],
  "30-day-tax-office-launch": ["30-day-launch", "30-day-tax-office-launch", "30-day-tax-office", "30daylaunch", "cmooyt4qz000004l2hgvycccx"],
  "irs-fine-defense": ["irs-fine-defense", "irs-fine-defense-masterclass", "irsfinedefense", "cmop0lsdi000304jyzlcpvi78"],
  "irs-fine-defense-masterclass": ["irs-fine-defense", "irs-fine-defense-masterclass", "irsfinedefense", "cmop0lsdi000304jyzlcpvi78"],
  "schedule-c-reconstruction": ["schedule-c-reconstruction", "schedule-c-reconstruction-course", "schedule-c", "schedulecrecon", "mastering-schedule-c-reconstruction", "cmop0nigi000004kzll8bo7dj"],
  "schedule-c-reconstruction-course": ["schedule-c-reconstruction", "schedule-c-reconstruction-course", "schedule-c", "schedulecrecon", "mastering-schedule-c-reconstruction", "cmop0nigi000004kzll8bo7dj"],
  "irs-audit-playbook": ["irs-audit-playbook", "irs-audit-playbook-course", "audit-playbook", "auditplaybook", "audit-ready-playbook", "cmop0j4m9000004jyr7orpyav"],
  "irs-audit-playbook-course": ["irs-audit-playbook", "irs-audit-playbook-course", "audit-playbook", "auditplaybook", "audit-ready-playbook", "cmop0j4m9000004jyr7orpyav"],
  "credits-filing-status": ["credits-filing-status", "credits-filing-status-course", "credits", "credits-filing-status-explained"],
  "credits-filing-status-course": ["credits-filing-status", "credits-filing-status-course", "credits", "credits-filing-status-explained"],
  "due-diligence": ["due-diligence", "due-diligence-course", "staff-audit-ready", "staff-audit-ready-due-diligence"],
  "staff-audit-ready-due-diligence": ["due-diligence", "due-diligence-course", "staff-audit-ready", "staff-audit-ready-due-diligence"],
};

const TOOLKIT_ALIAS_MAP: Record<string, string[]> = {
  "30-day-tax-office": ["30-day-tax-office", "30-day-tax-office-launch", "30-day-launch", "30daylaunch"],
  "due-diligence-course": ["due-diligence-course", "due-diligence", "staff-audit-ready", "staff-audit-ready-due-diligence"],
  "irs-fine-defense": ["irs-fine-defense", "irsfinedefense", "irs-fine-defense-masterclass"],
  "schedule-c-reconstruction": ["schedule-c-reconstruction", "schedule-c", "schedulecrecon"],
  "audit-playbook": ["audit-playbook", "irs-audit-playbook", "auditplaybook", "audit-ready-playbook"],
  "credits-filing-status": ["credits-filing-status", "credits", "credits-filing-status-explained"],
};

async function ensureDbCourse(slugOrId: string, adminId: string) {
  const canonical = COURSES.find((c) => c.id === slugOrId || c.slug === slugOrId);
  const aliases = canonical
    ? Array.from(
        new Set([
          canonical.slug,
          canonical.id,
          ...(COURSE_ALIAS_MAP[canonical.slug] || []),
          ...(COURSE_ALIAS_MAP[canonical.id] || []),
        ])
      )
    : [slugOrId];

  let dbCourse = await prisma.course.findFirst({
    where: {
      OR: [
        { id: slugOrId },
        { slug: slugOrId },
        ...(canonical ? [{ id: canonical.id }, { slug: canonical.slug }] : []),
        ...aliases.map((a) => ({ id: a })),
        ...aliases.map((a) => ({ slug: a })),
      ],
    },
  });

  if (!dbCourse) {
    if (!canonical) {
      throw new Error(`Course definition not found for ${slugOrId}`);
    }

    dbCourse = await prisma.course.create({
      data: {
        id: canonical.id,
        slug: canonical.slug,
        title: canonical.title,
        description: canonical.description,
        thumbnail: canonical.thumbnail,
        category: canonical.category,
        level: canonical.level,
        status: "PUBLISHED",
        price: canonical.price,
        isFree: canonical.isFree,
        totalDuration: canonical.totalDurationSeconds,
        instructorId: adminId,
      },
    });
  }

  return dbCourse;
}

/**
 * POST /api/admin/users/bulk-access
 * Batch grants or revokes access for multiple selected users
 */
export async function POST(req: NextRequest) {
  const adminSession = await requireAdmin(req);
  if (!adminSession) {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    userIds,
    action = "GRANT", // "GRANT" | "REVOKE"
    itemType,         // "toolkit" | "course" | "bundle"
    itemId,
    grantMembershipBonus = true,
    membershipMonths = 2,
    membershipTier = "MARKETPLACE_PLUS",
    staffSeats = 5,
    notifyUsers = true,
  } = body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds array is required." }, { status: 400 });
  }

  if (!itemType || !itemId) {
    return NextResponse.json({ error: "itemType and itemId are required." }, { status: 400 });
  }

  const results = {
    total: userIds.length,
    successful: [] as string[],
    failed: [] as { userId: string; error: string }[],
  };

  for (const userId of userIds) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      if (!targetUser) {
        results.failed.push({ userId, error: "User not found" });
        continue;
      }

      if (action === "GRANT") {
        const grantDateTag = Date.now();
        const randomSuffix = Math.random().toString(36).slice(2, 7);

        // 1. BUNDLE
        if (itemType === "bundle") {
          const bundle = getBundle(itemId);
          const isBundlePlus = itemId === "ultimate-bundle-plus";
          const bundleName = bundle?.name || (isBundlePlus ? "Ultimate Bundle PLUS" : "Ultimate Bundle");

          const bundleSessionId = `admin_bulk_grant_${itemId}_${grantDateTag}_${randomSuffix}`;
          await prisma.toolkitPurchase.upsert({
            where: { stripeSessionId: bundleSessionId },
            create: {
              userId: targetUser.id,
              toolkitId: `bundle:${itemId}`,
              stripeSessionId: bundleSessionId,
              membershipGranted: grantMembershipBonus,
              membershipTier: membershipTier as SubscriptionTier,
              membershipMonths: grantMembershipBonus ? membershipMonths : 0,
            },
            update: {},
          });

          for (const tk of TOOLKITS) {
            const existingPurchase = await prisma.toolkitPurchase.findFirst({
              where: { userId: targetUser.id, toolkitId: tk.id },
            });
            if (!existingPurchase) {
              await prisma.toolkitPurchase.create({
                data: {
                  userId: targetUser.id,
                  toolkitId: tk.id,
                  stripeSessionId: `admin_bundle_included_${itemId}_${tk.id}_${grantDateTag}`,
                  membershipGranted: false,
                  membershipTier: tk.membershipTier,
                  membershipMonths: 0,
                },
              });
            }

            const seats = isBundlePlus ? Math.max(staffSeats, 10) : 5;
            const licExpires = new Date();
            licExpires.setFullYear(licExpires.getFullYear() + 1);

            await prisma.trainingLicense.upsert({
              where: { eroId_toolkitId: { eroId: targetUser.id, toolkitId: tk.id } },
              create: {
                eroId: targetUser.id,
                toolkitId: tk.id,
                totalSeats: seats,
                expiresAt: licExpires,
              },
              update: {},
            });
          }

          if (isBundlePlus) {
            for (const c of COURSES) {
              try {
                const dbCourse = await ensureDbCourse(c.id, adminSession.user.id);
                const existingEnrollment = await prisma.enrollment.findUnique({
                  where: { userId_courseId: { userId: targetUser.id, courseId: dbCourse.id } },
                });
                if (!existingEnrollment) {
                  await prisma.enrollment.create({
                    data: { userId: targetUser.id, courseId: dbCourse.id },
                  });
                }
              } catch (e) {}
            }
          }

          if (grantMembershipBonus && membershipMonths > 0) {
            let newPeriodEnd = new Date();
            if (targetUser.subscription?.currentPeriodEnd && new Date(targetUser.subscription.currentPeriodEnd) > new Date()) {
              newPeriodEnd = new Date(targetUser.subscription.currentPeriodEnd);
            }
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + membershipMonths);

            await prisma.subscription.upsert({
              where: { userId: targetUser.id },
              create: {
                userId: targetUser.id,
                plan: membershipTier as SubscriptionTier,
                status: "active",
                currentPeriodEnd: newPeriodEnd,
              },
              update: {
                plan: membershipTier as SubscriptionTier,
                status: "active",
                currentPeriodEnd: newPeriodEnd,
              },
            });

            await prisma.user.update({
              where: { id: targetUser.id },
              data: { tier: membershipTier as SubscriptionTier },
            });
          }

          if (notifyUsers) {
            await prisma.notification.create({
              data: {
                userId: targetUser.id,
                type: "SYSTEM",
                title: `🏆 ${bundleName} Unlocked!`,
                message: `You've been granted full lifetime access to ${bundleName} by an administrator.`,
                link: "/toolkits",
              },
            }).catch(() => {});
          }
        }

        // 2. TOOLKIT
        if (itemType === "toolkit") {
          const toolkit = getToolkit(itemId);
          const tkName = toolkit?.name || itemId;
          const tkSessionId = `admin_bulk_grant_tk_${itemId}_${grantDateTag}_${randomSuffix}`;

          const existing = await prisma.toolkitPurchase.findFirst({
            where: { userId: targetUser.id, toolkitId: itemId },
          });

          if (!existing) {
            await prisma.toolkitPurchase.create({
              data: {
                userId: targetUser.id,
                toolkitId: itemId,
                stripeSessionId: tkSessionId,
                membershipGranted: grantMembershipBonus,
                membershipTier: (toolkit?.membershipTier || membershipTier) as SubscriptionTier,
                membershipMonths: grantMembershipBonus ? (toolkit?.membershipMonths || membershipMonths) : 0,
              },
            });
          }

          const licExpires = new Date();
          licExpires.setFullYear(licExpires.getFullYear() + 1);

          await prisma.trainingLicense.upsert({
            where: { eroId_toolkitId: { eroId: targetUser.id, toolkitId: itemId } },
            create: {
              eroId: targetUser.id,
              toolkitId: itemId,
              totalSeats: Math.max(staffSeats, 5),
              expiresAt: licExpires,
            },
            update: {},
          });

          if (notifyUsers) {
            await prisma.notification.create({
              data: {
                userId: targetUser.id,
                type: "SYSTEM",
                title: `📦 Toolkit Access Granted: ${tkName}`,
                message: `You now have full access to ${tkName}.`,
                link: "/toolkits",
              },
            }).catch(() => {});
          }
        }

        // 3. COURSE
        if (itemType === "course") {
          const canonical = COURSES.find((c) => c.id === itemId || c.slug === itemId);
          const courseTitle = canonical?.title || itemId;
          const dbCourse = await ensureDbCourse(itemId, adminSession.user.id);

          const existingEnrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: targetUser.id, courseId: dbCourse.id } },
          });

          if (!existingEnrollment) {
            await prisma.enrollment.create({
              data: { userId: targetUser.id, courseId: dbCourse.id },
            });
          }

          const toolkitEquivalent =
            canonical?.slug === "30-day-launch" || canonical?.id === "30-day-tax-office-launch"
              ? "30-day-tax-office"
              : canonical?.slug === "due-diligence" || canonical?.id === "staff-audit-ready-due-diligence"
              ? "due-diligence-course"
              : canonical?.slug === "irs-audit-playbook" || canonical?.id === "irs-audit-playbook-course"
              ? "audit-playbook"
              : canonical?.slug || itemId;

          const licExpires = new Date();
          licExpires.setFullYear(licExpires.getFullYear() + 1);

          await prisma.trainingLicense.upsert({
            where: { eroId_toolkitId: { eroId: targetUser.id, toolkitId: toolkitEquivalent } },
            create: {
              eroId: targetUser.id,
              toolkitId: toolkitEquivalent,
              totalSeats: Math.max(staffSeats, 5),
              expiresAt: licExpires,
            },
            update: {},
          });

          if (notifyUsers) {
            await prisma.notification.create({
              data: {
                userId: targetUser.id,
                type: "SYSTEM",
                title: `🎓 Course Access Granted: ${courseTitle}`,
                message: `You've been enrolled in "${courseTitle}".`,
                link: `/courses/${dbCourse.slug}`,
              },
            }).catch(() => {});
          }
        }

        results.successful.push(userId);
      } else if (action === "REVOKE") {
        if (itemType === "bundle") {
          await prisma.toolkitPurchase.deleteMany({
            where: {
              userId,
              OR: [
                { toolkitId: `bundle:${itemId}` },
                { toolkitId: itemId },
                { stripeSessionId: { startsWith: `admin_bundle_included_${itemId}` } },
                { stripeSessionId: { startsWith: `admin_grant_bundle_${itemId}` } },
                { stripeSessionId: { startsWith: `admin_bulk_grant_${itemId}` } },
              ],
            },
          });
        } else if (itemType === "toolkit") {
          const aliases = TOOLKIT_ALIAS_MAP[itemId] || [itemId];
          const allTkIds = Array.from(new Set([itemId, ...aliases, ...aliases.map((a) => `toolkit:${a}`)]));
          await prisma.toolkitPurchase.deleteMany({
            where: { userId, toolkitId: { in: allTkIds } },
          });
          await prisma.trainingLicense.deleteMany({
            where: { eroId: userId, toolkitId: { in: allTkIds } },
          });
        } else if (itemType === "course") {
          const canonical = COURSES.find((c) => c.id === itemId || c.slug === itemId);
          const aliases = canonical
            ? Array.from(
                new Set([
                  canonical.slug,
                  canonical.id,
                  ...(COURSE_ALIAS_MAP[canonical.slug] || []),
                  ...(COURSE_ALIAS_MAP[canonical.id] || []),
                ])
              )
            : [itemId];

          const courses = await prisma.course.findMany({
            where: {
              OR: [
                { id: itemId },
                { slug: itemId },
                ...aliases.map((a) => ({ id: a })),
                ...aliases.map((a) => ({ slug: a })),
              ],
            },
            select: { id: true },
          });

          const courseIds = Array.from(new Set([itemId, ...courses.map((c) => c.id), ...aliases]));

          await prisma.enrollment.deleteMany({
            where: { userId, courseId: { in: courseIds } },
          });

          const toolkitEquivalent =
            canonical?.slug === "30-day-launch" || canonical?.id === "30-day-tax-office-launch"
              ? "30-day-tax-office"
              : canonical?.slug === "due-diligence" || canonical?.id === "staff-audit-ready-due-diligence"
              ? "due-diligence-course"
              : canonical?.slug === "irs-audit-playbook" || canonical?.id === "irs-audit-playbook-course"
              ? "audit-playbook"
              : canonical?.slug || itemId;

          await prisma.trainingLicense.deleteMany({
            where: {
              eroId: userId,
              toolkitId: { in: [toolkitEquivalent, itemId, ...(canonical ? [canonical.slug, canonical.id] : [])] },
            },
          });
        }
        results.successful.push(userId);
      }
    } catch (err: any) {
      results.failed.push({ userId, error: err.message || "Operation failed" });
    }
  }

  return NextResponse.json({
    success: true,
    action,
    itemType,
    itemId,
    results,
  });
}
