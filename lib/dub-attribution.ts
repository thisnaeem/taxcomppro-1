import type Stripe from "stripe";
import type { NextRequest } from "next/server";

const DUB_COOKIE_NAME = "dub_id";
const MAX_CLICK_ID_LENGTH = 200;

/**
 * Read the click ID saved by Dub Analytics. Stripe expects the
 * `client_reference_id` value to be prefixed with `dub_id_`, while Dub's
 * customer metadata expects the raw click ID.
 */
export function getDubClickId(req: NextRequest): string | null {
  const cookieValue = req.cookies.get(DUB_COOKIE_NAME)?.value?.trim();
  if (!cookieValue) return null;

  const clickId = cookieValue.startsWith("dub_id_")
    ? cookieValue.slice("dub_id_".length)
    : cookieValue;

  if (
    !clickId ||
    clickId.length > MAX_CLICK_ID_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(clickId)
  ) {
    return null;
  }

  return clickId;
}

export function getDubCheckoutFields(req: NextRequest, userId: string) {
  const clickId = getDubClickId(req);

  return {
    clickId,
    clientReferenceId: clickId ? `dub_id_${clickId}` : undefined,
    metadata: {
      dubCustomerExternalId: userId,
    },
  };
}

/**
 * Associate a platform-owned Stripe customer with the Dub referral click so
 * recurring membership invoices remain attributable during the reward window.
 */
export async function syncDubStripeCustomer({
  stripe,
  customerId,
  email,
  name,
  userId,
  clickId,
}: {
  stripe: Stripe;
  customerId: string | null;
  email: string;
  name?: string | null;
  userId: string;
  clickId: string | null;
}) {
  const metadata: Stripe.MetadataParam = {
    dubCustomerExternalId: userId,
    ...(clickId ? { dubClickId: clickId } : {}),
  };

  if (customerId) {
    await stripe.customers.update(customerId, { metadata });
    return customerId;
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? "",
    metadata,
  });

  return customer.id;
}
