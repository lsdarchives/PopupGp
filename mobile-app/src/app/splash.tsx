import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.replace("/(auth)/roles" as any);
          return;
        }
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const role = snap.data()?.role;
          if (role === "host") {
            router.replace("/(host)/my-events");
          } else {
            router.replace("/(user)/browse");
          }
        } catch {
          router.replace("/(auth)/roles" as any);
        }
      });
    });
  }, []);

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