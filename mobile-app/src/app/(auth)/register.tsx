import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../services/firebase";
import { createUserProfile } from "../../services/users";
import { getHomeRoute } from "../../utils/navigation";

type RegisterRole = "user" | "host";

export default function Register() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("user");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      return Alert.alert("Please fill in all fields");
    }
    if (password.length < 6) {
      return Alert.alert("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await createUserProfile(cred.user.uid, email.trim(), displayName.trim(), role);

      const route = getHomeRoute(role);
      if (route) router.replace(route);
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "code" in e && e.code === "auth/email-already-in-use"
          ? "An account with this email already exists"
          : "Registration failed. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join PopupGP — Gauteng events</Text>

      <TextInput
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Text style={styles.label}>I am a...</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleButton, role === "user" && styles.roleButtonActive]}
          onPress={() => setRole("user")}
        >
          <Text style={[styles.roleText, role === "user" && styles.roleTextActive]}>
            Event goer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === "host" && styles.roleButtonActive]}
          onPress={() => setRole("host")}
        >
          <Text style={[styles.roleText, role === "host" && styles.roleTextActive]}>
            Event host
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Creating account..." : "Register"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "700", color: "#208AEF", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  label: { fontSize: 14, color: "#666", marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  roleButtonActive: { borderColor: "#208AEF", backgroundColor: "#E6F4FE" },
  roleText: { fontSize: 14, color: "#666" },
  roleTextActive: { color: "#208AEF", fontWeight: "600" },
  button: {
    backgroundColor: "#208AEF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", color: "#208AEF", fontSize: 14 },
});
