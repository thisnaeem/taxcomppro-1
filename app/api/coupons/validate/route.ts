import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToolkit } from "@/lib/toolkits";

const TIER_PRICES: Record<string, number> = {
  VIP: 39.99,
  MARKETPLACE: 59.99,
  MARKETPLACE_PLUS: 79.99,
};

export async function POST(req: NextRequest) {
  try {
    const { code, listingId, courseSlug, tier, toolkitId } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "Please enter a promo code" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    // 1. Resolve product context and base price
    let targetListing = null;
    let targetCourse = null;
    let targetToolkit = null;
    let basePrice = 0;
    let sellerId = "";
    let productCategory: "MEMBERSHIP" | "COURSE" | "TOOLKIT" | "MARKETPLACE" | "OTHER" = "OTHER";

    if (tier) {
      basePrice = TIER_PRICES[tier] || 0;
      productCategory = "MEMBERSHIP";
    } else if (toolkitId) {
      targetToolkit = getToolkit(toolkitId);
      basePrice = targetToolkit?.price || 0;
      productCategory = "TOOLKIT";
    } else if (listingId) {
      targetListing = await prisma.marketplaceListing.findFirst({
        where: { OR: [{ id: listingId }, { slug: listingId }] },
      });
      if (targetListing) {
        basePrice = targetListing.price || 0;
        sellerId = targetListing.userId;
        productCategory = "MARKETPLACE";
      }
    } else if (courseSlug) {
      targetCourse = await prisma.course.findUnique({
        where: { slug: courseSlug },
      });
      if (targetCourse) {
        basePrice = targetCourse.isFree ? 0 : (targetCourse.price || 0);
        sellerId = targetCourse.instructorId;
        productCategory = "COURSE";
      }
    }

    if (basePrice <= 0) {
      return NextResponse.json({ valid: false, error: "This item is already free" }, { status: 400 });
    }

    // 2. Find coupon in database
    const coupon = await prisma.marketplaceCoupon.findFirst({
      where: {
        code: cleanCode,
        isActive: true,
      },
      include: {
        seller: {
          select: { id: true, role: true, name: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid or inactive promo code" }, { status: 404 });
    }

    // Check expiration date
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ valid: false, error: "This promo code has expired" }, { status: 400 });
    }

    // Check maximum redemptions
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "This promo code has reached its maximum usage limit" }, { status: 400 });
    }

    // Check applicability permissions
    const isAdminCoupon = coupon.seller?.role === "ADMIN";

    if (isAdminCoupon) {
      // Admin coupons can target ALL, MEMBERSHIP, COURSES, TOOLKITS, MARKETPLACE, or a specific listing/course
      if (coupon.listingId) {
        const target = coupon.listingId.toUpperCase();
        if (target === "ALL" || target === "PLATFORM") {
          // Allowed everywhere
        } else if (target === "MEMBERSHIP" || target === "UPGRADE") {
          if (productCategory !== "MEMBERSHIP") {
            return NextResponse.json({ valid: false, error: "This code is only valid for Membership Upgrades" }, { status: 400 });
          }
        } else if (target === "COURSES" || target === "COURSE") {
          if (productCategory !== "COURSE") {
            return NextResponse.json({ valid: false, error: "This code is only valid for Academy Courses" }, { status: 400 });
          }
        } else if (target === "TOOLKITS" || target === "TOOLKIT") {
          if (productCategory !== "TOOLKIT") {
            return NextResponse.json({ valid: false, error: "This code is only valid for Success Toolkits" }, { status: 400 });
          }
        } else if (target === "MARKETPLACE") {
          if (productCategory !== "MARKETPLACE") {
            return NextResponse.json({ valid: false, error: "This code is only valid for Marketplace Items" }, { status: 400 });
          }
        } else {
          // Specific ID check
          const matchesListing = targetListing && targetListing.id === coupon.listingId;
          const matchesCourse = targetCourse && (targetCourse.id === coupon.listingId || targetCourse.slug === coupon.listingId);
          const matchesToolkit = targetToolkit && targetToolkit.id === coupon.listingId;
          if (!matchesListing && !matchesCourse && !matchesToolkit) {
            return NextResponse.json({ valid: false, error: "This promo code is not applicable to this item" }, { status: 400 });
          }
        }
      }
    } else {
      // Seller coupon: only applicable to that seller's items
      if (sellerId && coupon.sellerId !== sellerId) {
        return NextResponse.json({ valid: false, error: "This promo code cannot be used for this creator's items" }, { status: 400 });
      }
      if (coupon.listingId) {
        const matchesListing = targetListing && targetListing.id === coupon.listingId;
        const matchesCourse = targetCourse && targetCourse.slug === (targetListing?.slug ?? "");
        if (!matchesListing && !matchesCourse) {
          return NextResponse.json({ valid: false, error: "This promo code is not applicable to this item" }, { status: 400 });
        }
      }
    }

    // 3. Calculate discounted amount
    let discountedPrice = basePrice;
    let savings = 0;

    if (coupon.discountType === "PERCENT") {
      savings = (basePrice * coupon.discountValue) / 100;
      discountedPrice = Math.max(0, basePrice - savings);
    } else {
      savings = Math.min(basePrice, coupon.discountValue);
      discountedPrice = Math.max(0, basePrice - coupon.discountValue);
    }

    discountedPrice = Math.round(discountedPrice * 100) / 100;
    savings = Math.round(savings * 100) / 100;

    return NextResponse.json({
      valid: true,
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalPrice: basePrice,
      discountedPrice,
      savings,
      label: coupon.discountType === "PERCENT" ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`,
    });
  } catch (err: any) {
    console.error("Coupon validation error:", err);
    return NextResponse.json({ valid: false, error: err.message || "Failed to validate coupon" }, { status: 500 });
  }
}
