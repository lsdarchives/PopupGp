import { Linking } from "react-native";
import { handleURLCallback } from "@stripe/stripe-react-native";

async function forwardStripeUrl(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await handleURLCallback(url);
  } catch (error) {
    console.warn("Could not resume Stripe redirect.", error);
  }
}

export function listenForStripeRedirects(): () => void {
  const subscription = Linking.addEventListener("url", ({ url }) => {
    void forwardStripeUrl(url);
  });
  void Linking.getInitialURL().then(forwardStripeUrl);
  return () => subscription.remove();
}
