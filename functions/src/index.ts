import { createHash } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";

initializeApp();

async function removeStoredEventImage(
  imagePath: unknown,
  eventId: string,
  hostId: unknown,
): Promise<void> {
  if (typeof imagePath !== "string" || typeof hostId !== "string") return;
  const segments = imagePath.split("/");
  if (
    segments.length !== 4 ||
    segments[0] !== "events" ||
    segments[1] !== eventId ||
    segments[2] !== hostId ||
    !/^cover\.(jpg|png|webp)$/.test(segments[3])
  ) return;
  await getStorage().bucket().file(imagePath).delete({ ignoreNotFound: true });
}

export const cleanReplacedEventImage = onDocumentUpdated("events/{eventId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const beforePath = before?.imagePath;
  const afterPath = after?.imagePath;
  if (beforePath && beforePath !== afterPath) {
    await removeStoredEventImage(beforePath, event.params.eventId, before?.hostId);
  }
});

export const cleanDeletedEventImage = onDocumentDeleted("events/{eventId}", async (event) => {
  const deletedEvent = event.data?.data();
  await removeStoredEventImage(deletedEvent?.imagePath, event.params.eventId, deletedEvent?.hostId);
});

const isFunctionsEmulator = process.env.FUNCTIONS_EMULATOR === "true";
const stripeSecretKey = isFunctionsEmulator ? undefined : defineSecret("STRIPE_SECRET_KEY");
const stripePublishableKey = isFunctionsEmulator
  ? undefined
  : defineSecret("STRIPE_PUBLISHABLE_KEY");
const stripeSecrets =
  stripeSecretKey && stripePublishableKey
    ? [stripeSecretKey, stripePublishableKey]
    : [];

function getStripeSecretKey(): string {
  const secretKey = stripeSecretKey?.value() ?? process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new HttpsError("failed-precondition", "Stripe is not configured for this environment.");
  }

  return secretKey;
}

function getStripePublishableKey(): string {
  const publishableKey = stripePublishableKey?.value() ?? process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new HttpsError("failed-precondition", "Stripe is not configured for this environment.");
  }

  return publishableKey;
}

type CreateTicketPaymentInput = {
  eventId?: string;
  requestId?: string;
  paymentIntentId?: string;
};

type ConfirmTicketPaymentInput = {
  eventId?: string;
  paymentIntentId?: string;
  requestId?: string;
};

type ToggleFreeRsvpInput = {
  eventId?: string;
};

function assertString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${name} is required.`);
  }

  const result = value.trim();
  if (result.length > 128) {
    throw new HttpsError("invalid-argument", `${name} is too long.`);
  }

  return result;
}

function centsFromRand(price: unknown): number {
  const numericPrice = Number(price ?? 0);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw new HttpsError("failed-precondition", "This event does not require payment.");
  }

  const scaledPrice = numericPrice * 100;
  const cents = Math.round(scaledPrice);
  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    Math.abs(scaledPrice - cents) > 1e-8
  ) {
    throw new HttpsError("failed-precondition", "This event has an invalid ticket price.");
  }

  return cents;
}

export const createTicketPayment = onCall(
  { region: "us-central1", secrets: stripeSecrets },
  async (request) => {
    const userId = request.auth?.uid;
    if (!userId) {
      throw new HttpsError("unauthenticated", "Sign in before buying a ticket.");
    }

    const { eventId, requestId, paymentIntentId } = request.data as CreateTicketPaymentInput;
    const safeEventId = assertString(eventId, "eventId");
    const safeRequestId = assertString(requestId, "requestId");
    const safePaymentIntentId = paymentIntentId ? assertString(paymentIntentId, "paymentIntentId") : undefined;
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-02-24.acacia",
    });
    let paymentIntent: Stripe.PaymentIntent | undefined;
    if (safePaymentIntentId) {
      paymentIntent = await stripe.paymentIntents.retrieve(safePaymentIntentId);
      if (
        paymentIntent.metadata.eventId !== safeEventId ||
        paymentIntent.metadata.userId !== userId ||
        paymentIntent.metadata.requestId !== safeRequestId
      ) {
        throw new HttpsError("permission-denied", "Payment does not match this checkout.");
      }
      if (paymentIntent.status === "succeeded") {
        if (!paymentIntent.client_secret) {
          throw new HttpsError("internal", "Stripe did not return checkout credentials.");
        }
        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          paymentIntentStatus: paymentIntent.status,
          publishableKey: getStripePublishableKey(),
        };
      }
    }

    const db = getFirestore();
    const eventRef = db.collection("events").doc(safeEventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }

    const event = eventSnap.data();
    if (!event || event.status !== "approved") {
      throw new HttpsError("failed-precondition", "This event is not available.");
    }

    const existingRsvpQuery = await db
      .collection("rsvps")
      .where("eventId", "==", safeEventId)
      .where("userId", "==", userId)
      .get();

    if (existingRsvpQuery.docs.some((rsvp) => rsvp.data().ticketPurchased)) {
      throw new HttpsError("already-exists", "You already have a ticket for this event.");
    }

    const currentCount = Number(event.rsvpCount ?? 0);
    if (
      !safePaymentIntentId &&
      existingRsvpQuery.empty &&
      typeof event.capacity === "number" &&
      currentCount >= event.capacity
    ) {
      throw new HttpsError("failed-precondition", "This event is full.");
    }

    const amount = centsFromRand(event.ticketPrice);
    const idempotencyHash = createHash("sha256")
      .update(`${safeEventId}:${userId}:${safeRequestId}:${amount}`)
      .digest("hex");
    if (paymentIntent) {
      if (
        paymentIntent.status !== "succeeded" &&
        paymentIntent.status !== "canceled" &&
        (paymentIntent.currency !== "zar" || paymentIntent.amount !== amount)
      ) {
        paymentIntent = await stripe.paymentIntents.cancel(paymentIntent.id);
      }
    } else {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: "zar",
          automatic_payment_methods: { enabled: true },
          metadata: {
            eventId: safeEventId,
            userId,
            requestId: safeRequestId,
          },
        },
        {
          idempotencyKey: `ticket-v2-${idempotencyHash}`,
        }
      );
    }

    if (!paymentIntent.client_secret) {
      throw new HttpsError("internal", "Stripe did not return checkout credentials.");
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentIntentStatus: paymentIntent.status,
      publishableKey: getStripePublishableKey(),
    };
  }
);

export const toggleFreeRsvp = onCall({ region: "us-central1" }, async (request) => {
  const userId = request.auth?.uid;
  if (!userId) {
    throw new HttpsError("unauthenticated", "Sign in before RSVPing.");
  }

  const { eventId } = request.data as ToggleFreeRsvpInput;
  const safeEventId = assertString(eventId, "eventId");
  const db = getFirestore();
  const eventRef = db.collection("events").doc(safeEventId);

  const isGoing = await db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }

    const event = eventSnap.data();
    if (!event || event.status !== "approved") {
      throw new HttpsError("failed-precondition", "This event is not available.");
    }

    const rsvpQuery = db
      .collection("rsvps")
      .where("eventId", "==", safeEventId)
      .where("userId", "==", userId);
    const existingRsvpQuery = await transaction.get(rsvpQuery);
    const existingRsvps = existingRsvpQuery.docs;

    if (existingRsvps.some((rsvp) => rsvp.data().ticketPurchased)) {
      throw new HttpsError("failed-precondition", "Paid tickets cannot be cancelled through RSVP.");
    }

    if (Number(event.ticketPrice ?? 0) > 0) {
      throw new HttpsError("failed-precondition", "Paid events require checkout.");
    }

    const currentCount = Number(event.rsvpCount ?? 0);

    if (existingRsvps.length > 0) {
      existingRsvps.forEach((rsvp) => transaction.delete(rsvp.ref));
      transaction.update(eventRef, {
        rsvpCount: Math.max(0, currentCount - existingRsvps.length),
      });
      return false;
    }

    if (typeof event.capacity === "number" && currentCount >= event.capacity) {
      throw new HttpsError("failed-precondition", "This event is full.");
    }

    transaction.create(db.collection("rsvps").doc(), {
      eventId: safeEventId,
      userId,
      status: "going",
      ticketPurchased: false,
      paymentStatus: "free",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(eventRef, { rsvpCount: currentCount + 1 });
    return true;
  });

  return { isGoing };
});

export const confirmTicketPayment = onCall(
  {
    region: "us-central1",
    secrets: stripeSecretKey ? [stripeSecretKey] : [],
  },
  async (request) => {
    const userId = request.auth?.uid;
    if (!userId) {
      throw new HttpsError("unauthenticated", "Sign in before confirming a ticket.");
    }

    const { eventId, paymentIntentId, requestId } = request.data as ConfirmTicketPaymentInput;
    const safeEventId = assertString(eventId, "eventId");
    const safePaymentIntentId = assertString(paymentIntentId, "paymentIntentId");
    const safeRequestId = assertString(requestId, "requestId");
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-02-24.acacia",
    });
    const paymentIntent = await stripe.paymentIntents.retrieve(safePaymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new HttpsError("failed-precondition", "Payment is not complete.");
    }

    if (
      paymentIntent.metadata.eventId !== safeEventId ||
      paymentIntent.metadata.userId !== userId ||
      paymentIntent.metadata.requestId !== safeRequestId
    ) {
      throw new HttpsError("permission-denied", "Payment does not match this ticket.");
    }

    const db = getFirestore();
    const eventRef = db.collection("events").doc(safeEventId);

    const confirmation = await db.runTransaction(async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) {
        return { confirmed: false, reason: "This event no longer exists." };
      }

      const event = eventSnap.data();
      if (!event || event.status !== "approved") {
        return { confirmed: false, reason: "This event is no longer available." };
      }

      let expectedAmount: number;
      try {
        expectedAmount = centsFromRand(event.ticketPrice);
      } catch {
        return { confirmed: false, reason: "This event is no longer accepting paid tickets." };
      }

      if (paymentIntent.currency !== "zar" || paymentIntent.amount !== expectedAmount) {
        return { confirmed: false, reason: "The event ticket price changed during checkout." };
      }

      const currentCount = Number(event?.rsvpCount ?? 0);
      const existingRsvpQuery = await transaction.get(
        db.collection("rsvps").where("eventId", "==", safeEventId).where("userId", "==", userId)
      );
      const existingRsvps = existingRsvpQuery.docs;
      const existingTicket = existingRsvps.find((rsvp) => rsvp.data().ticketPurchased);

      if (existingTicket) {
        return existingTicket.data().paymentIntentId === safePaymentIntentId
          ? { confirmed: true }
          : { confirmed: false, reason: "A ticket is already confirmed for this event." };
      }

      if (existingRsvps.length === 0 && typeof event.capacity === "number" && currentCount >= event.capacity) {
        return { confirmed: false, reason: "This event is full." };
      }

      const rsvpData = {
        eventId: safeEventId,
        userId,
        status: "going",
        ticketPurchased: true,
        paymentStatus: "paid",
        paymentIntentId: safePaymentIntentId,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const freeRsvp = existingRsvps.find((rsvp) => !rsvp.data().ticketPurchased);
      if (freeRsvp) {
        transaction.update(freeRsvp.ref, rsvpData);
        existingRsvps
          .filter((rsvp) => rsvp.id !== freeRsvp.id)
          .forEach((rsvp) => transaction.delete(rsvp.ref));
        if (existingRsvps.length > 1) {
          transaction.update(eventRef, {
            rsvpCount: Math.max(1, currentCount - existingRsvps.length + 1),
          });
        }
      } else {
        transaction.create(db.collection("rsvps").doc(), {
          ...rsvpData,
          createdAt: FieldValue.serverTimestamp(),
        });
        transaction.update(eventRef, { rsvpCount: currentCount + 1 });
      }

      return { confirmed: true };
    });

    if (!confirmation.confirmed) {
      let refundMessage: string;
      try {
        const refund = await stripe.refunds.create(
          { payment_intent: safePaymentIntentId },
          { idempotencyKey: `ticket-refund-${safePaymentIntentId}` }
        );
        refundMessage =
          refund.status === "succeeded"
            ? "The payment has been refunded."
            : "The refund is processing and will appear on your payment method.";
      } catch (error) {
        console.error("Could not automatically refund an unfulfilled ticket payment.", error);
        throw new HttpsError(
          "internal",
          "Payment succeeded but the ticket could not be confirmed or automatically refunded. Contact support with your payment receipt."
        );
      }

      throw new HttpsError(
        "failed-precondition",
        `${confirmation.reason} ${refundMessage}`
      );
    }

    return { hasTicket: true };
  }
);
