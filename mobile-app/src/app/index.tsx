import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function Index() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (hasNavigated.current) return;

      if (!user) {
        hasNavigated.current = true;
        router.replace("/(auth)/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.data()?.role;

        hasNavigated.current = true;
        if (role === "host") {
          router.replace("/(host)/my-events");
        } else {
          router.replace("/(user)/browse");
        }
      } catch (e) {
        hasNavigated.current = true;
        router.replace("/(auth)/login");
      }
    });

    return () => unsub();
  }, []);

  return null;
}