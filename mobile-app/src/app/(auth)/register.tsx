import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "../../services/firebase";
import { createUserProfile } from "../../services/users";
import { getHomeRoute } from "../../utils/navigation";
import { Brand, Radius, Typography } from "../../constants/brand";

type RegisterRole = "user" | "host";

export default function Register() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    const normalizedName = displayName.trim();
    const normalizedEmail = email.trim();
    if (!normalizedName || !normalizedEmail || !password) {
      setError("Fill in your name, email, and password to continue.");
      return;
    }
    if (normalizedName.length > 60) {
      setError("Your name must be 60 characters or fewer.");
      return;
    }
    if (password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await createUserProfile(cred.user.uid, normalizedEmail, normalizedName, role);
      const route = getHomeRoute(role);
      if (route) router.replace(route);
    } catch (cause: unknown) {
      const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
      setError(code.includes("email-already-in-use")
        ? "An account with this email already exists. Try logging in."
        : code.includes("invalid-email")
          ? "Enter a valid email address."
          : "We couldn't create your account. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>PopUpGp</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Gauteng’s local event community.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <TextInput placeholder="Full name" value={displayName} onChangeText={setDisplayName} maxLength={61} editable={!loading} autoComplete="name" style={styles.input} placeholderTextColor={Brand.grey} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" editable={!loading} style={styles.input} placeholderTextColor={Brand.grey} />
        <TextInput placeholder="Password (at least 6 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" editable={!loading} style={styles.input} placeholderTextColor={Brand.grey} />

        <Text style={styles.label}>Choose your role</Text>
        <View style={styles.roleRow}>
          {(["user", "host"] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.roleButton, role === item && styles.roleButtonActive]}
              onPress={() => setRole(item)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ selected: role === item }}
            >
              <Text style={[styles.roleText, role === item && styles.roleTextActive]}>
                {item === "user" ? "Event goer" : "Event host"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={Brand.white} /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: Brand.bg },
  brand: { color: Brand.red, fontFamily: Typography.heading, fontWeight: "800", fontSize: 14, letterSpacing: 0.6 },
  title: { color: Brand.dark, fontFamily: Typography.heading, fontWeight: "800", fontSize: 29, marginTop: 8 },
  subtitle: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 14, marginTop: 5, marginBottom: 24 },
  error: { color: "#8F1020", backgroundColor: Brand.redLight, borderWidth: 1, borderColor: Brand.red, padding: 12, borderRadius: Radius.md, marginBottom: 14, fontSize: 13, lineHeight: 19 },
  input: { fontFamily: Typography.body, color: Brand.dark, backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.greyLight, borderRadius: Radius.md, padding: 14, marginBottom: 12, fontSize: 15 },
  label: { color: Brand.dark, fontFamily: Typography.body, fontSize: 13, fontWeight: "700", marginTop: 5, marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleButton: { flex: 1, padding: 13, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.greyLight, backgroundColor: Brand.white, alignItems: "center" },
  roleButtonActive: { borderColor: Brand.red, backgroundColor: Brand.redLight },
  roleText: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 14 },
  roleTextActive: { color: Brand.red, fontWeight: "700" },
  button: { backgroundColor: Brand.red, padding: 15, minHeight: 52, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Brand.white, fontFamily: Typography.body, fontSize: 15, fontWeight: "700" },
  link: { textAlign: "center", color: Brand.red, fontFamily: Typography.body, fontSize: 13, fontWeight: "600" },
});
