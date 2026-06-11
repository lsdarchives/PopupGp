import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { getUserProfile } from "../../services/users";
import { getHomeRoute } from "../../utils/navigation";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function AuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRole = role === "host" ? "host" : "user";

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Please fill in all fields");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(cred.user.uid);
      if (!profile) return Alert.alert("Profile not found", "Please register first.");
      const route = getHomeRoute(profile.role);
      if (route) router.replace(route as any);
    } catch {
      Alert.alert("Login failed", "Check your email and password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert("Please fill in all fields");
    if (password.length < 6) return Alert.alert("Password must be at least 6 characters");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: name,
        email,
        role: selectedRole,
        createdAt: serverTimestamp(),
      });
      const route = getHomeRoute(selectedRole);
      if (route) router.replace(route as any);
    } catch {
      Alert.alert("Registration failed", "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={styles.brand}>PopUpGp</Text>
        <Text style={styles.tagline}>Where the city comes alive</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === "login" && styles.tabActive]}
            onPress={() => setTab("login")}
          >
            <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "register" && styles.tabActive]}
            onPress={() => setTab("register")}
          >
            <Text style={[styles.tabText, tab === "register" && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {tab === "register" && (
          <TextInput
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#999"
          />
        )}

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#999"
        />

        {tab === "register" && (
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>
              Signing up as {selectedRole === "host" ? "a Host 🎪" : "a User 🗺️"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={tab === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Please wait..." : tab === "login" ? "Login" : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/roles" as any)} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back to role selection</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  brand: {
    fontSize: 36,
    fontWeight: "800",
    color: "#E8152A",
    textAlign: "center",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 36,
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#E8152A",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999",
  },
  tabTextActive: {
    color: "#fff",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#ECECEC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  roleTag: {
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  roleTagText: {
    color: "#E8152A",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#E8152A",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backLink: {
    alignItems: "center",
  },
  backLinkText: {
    color: "#999",
    fontSize: 13,
  },
});