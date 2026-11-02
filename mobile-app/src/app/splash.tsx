import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function SplashScreen() {
  const [opacity] = useState(() => new Animated.Value(1));
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]);

    animation.start(({ finished }) => {
      if (!finished || !active) return;

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!active) return;
        if (!user) {
          router.replace("/(auth)/roles" as any);
          return;
        }
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (!active) return;
          const role = snap.data()?.role;
          if (role === "host") {
            router.replace("/(host)/dashboard");
          } else {
            router.replace("/(user)/(tabs)/map");
          }
        } catch (error) {
          console.error("Could not load the signed-in profile during app startup.", error);
          if (active) router.replace("/(auth)/roles" as any);
        }
      });
    });

    return () => {
      active = false;
      unsubscribe?.();
      animation.stop();
    };
  }, [opacity, router]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../../assets/images/popupgp-splash.png")}
        style={[styles.logo, { opacity }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8152A",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: '100%',
    height: '100%',
    position: 'absolute',

  },
});
