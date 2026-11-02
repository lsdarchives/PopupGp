import { httpsCallable } from "firebase/functions";
import { initPaymentSheet, initStripe, presentPaymentSheet } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, functions } from "./firebase";

interface CreateTicketPaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  paymentIntentStatus: string;
  publishableKey: string;
}

interface SavedCheckout {
  requestId: string;
  paymentIntentId?: string;
}

interface ConfirmTicketPaymentResponse {
  hasTicket: boolean;
}

export async function startTicketCheckout(eventId: string): Promise<{ hasTicket: boolean }> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Sign in before buying a ticket.");

  const storageKey = `popupgp.ticket-checkout.${encodeURIComponent(userId)}.${encodeURIComponent(eventId)}`;
  const savedValue = await AsyncStorage.getItem(storageKey);
  let savedCheckout: SavedCheckout | undefined;
  try {
    const parsed: unknown = savedValue ? JSON.parse(savedValue) : undefined;
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      if (typeof record.requestId === "string") {
        savedCheckout = {
          requestId: record.requestId,
          ...(typeof record.paymentIntentId === "string" ? { paymentIntentId: record.paymentIntentId } : {}),
        };
      }
    }
  } catch {
    savedCheckout = undefined;
  }
  let requestId = savedCheckout?.requestId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let paymentIntentId = savedCheckout?.paymentIntentId;
  const saveCheckout = () => AsyncStorage.setItem(storageKey, JSON.stringify({ requestId, paymentIntentId }));
  await saveCheckout();

  const createTicketPayment = httpsCallable<
    { eventId: string; requestId: string; paymentIntentId?: string },
    CreateTicketPaymentResponse
  >(functions, "createTicketPayment");
  const confirmTicketPayment = httpsCallable<
    { eventId: string; paymentIntentId: string; requestId: string },
    ConfirmTicketPaymentResponse
  >(functions, "confirmTicketPayment");

  const getPayment = async () =>
    createTicketPayment({ eventId, requestId, ...(paymentIntentId ? { paymentIntentId } : {}) });
  let payment = await getPayment();
  if (payment.data.paymentIntentStatus === "canceled") {
    requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    paymentIntentId = undefined;
    await saveCheckout();
    payment = await getPayment();
  }

  const { clientSecret, paymentIntentId: returnedPaymentIntentId, publishableKey, paymentIntentStatus } = payment.data;
  if (!clientSecret || !returnedPaymentIntentId || !publishableKey) {
    throw new Error("Ticket checkout is not configured correctly. Please contact support.");
  }
  paymentIntentId = returnedPaymentIntentId;
  await saveCheckout();

  await initStripe({ publishableKey, urlScheme: "mobileapp" });

  if (paymentIntentStatus !== "succeeded") {
    const initializedSheet = await initPaymentSheet({
      merchantDisplayName: "PopUpGp",
      paymentIntentClientSecret: clientSecret,
      returnURL: "mobileapp://stripe-redirect",
    });

    if (initializedSheet.error) {
      throw new Error(initializedSheet.error.message);
    }

    const presentedSheet = await presentPaymentSheet();

    if (presentedSheet.error) {
      if (presentedSheet.error.code === "Canceled") {
        throw new Error("Payment cancelled.");
      }

      throw new Error(presentedSheet.error.message);
    }
  }

  let confirmation;
  for (let attempt = 0; ; attempt += 1) {
    try {
      confirmation = await confirmTicketPayment({ eventId, paymentIntentId, requestId });
      break;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (attempt >= 2 || !["functions/unavailable", "functions/deadline-exceeded", "functions/internal"].includes(code ?? "")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  await AsyncStorage.removeItem(storageKey);
  return { hasTicket: confirmation.data.hasTicket };
}
