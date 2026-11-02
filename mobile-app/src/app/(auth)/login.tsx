import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { getUserProfile } from "../../services/users";
import { getHomeRoute } from "../../utils/navigation";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Brand, Radius, Typography } from "../../constants/brand";

function authErrorMessage(error: unknown, action: "login" | "register") {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";

  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Email or password is incorrect. Check your details and try again.";
  }
  if (code.includes("email-already-in-use")) return "An account already uses this email. Try logging in.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  if (code.includes("weak-password")) return "Choose a password with at least 6 characters.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a moment and try again.";
  if (code.includes("network-request-failed")) return "Can't reach the server. Check your connection and try again.";
  return action === "login"
    ? "We couldn't log you in. Check your connection and try again."
    : "We couldn't create your account. Check your details and try again.";
}

export default function AuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedRole = role === "host" ? "host" : "user";

  const handleLogin = async () => {
    setErrorMessage("");
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        await signOut(auth);
        setErrorMessage("We couldn't find a profile for this account. Register again or contact support.");
        return;
      }

      if (profile.role !== selectedRole) {
        await signOut(auth);
        const accountRole = profile.role === "host" ? "Host" : profile.role === "user" ? "User" : "Admin";
        setErrorMessage(`This account is registered as a ${accountRole}. Go back and choose the matching option.`);
        return;
      }

      const route = getHomeRoute(profile.role);
      if (route) {
        router.replace(route);
      } else {
        await signOut(auth);
        setErrorMessage("This account doesn't have an app role. Please contact support.");
      }
    } catch (error) {
      setErrorMessage(authErrorMessage(error, "login"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage("");
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("Fill in your name, email, and password to continue.");
      return;
    }
    if (name.trim().length > 60) {
      setErrorMessage("Your name must be 60 characters or fewer.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Choose a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim();
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: name.trim(),
        email: normalizedEmail,
        role: selectedRole,
        createdAt: serverTimestamp(),
      });
      const route = getHomeRoute(selectedRole);
      if (route) router.replace(route);
    } catch (error) {
      setErrorMessage(authErrorMessage(error, "register"));
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (nextTab: "login" | "register") => {
    setTab(nextTab);
    setErrorMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.authLayout}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>P</Text></View>
            <Text style={styles.brand}>PopUpGp <Text style={styles.brandDivider}>/</Text> {selectedRole === "host" ? "Host" : "Explore"}</Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.cardHeading}>
              <Text style={styles.eyebrow}>{selectedRole === "host" ? "Host workspace" : "Event community"}</Text>
              <Text style={styles.title}>{tab === "login" ? "Welcome back" : "Create your account"}</Text>
              <Text style={styles.tagline}>
                {tab === "login"
                  ? selectedRole === "host" ? "Sign in to manage your events." : "Sign in to discover and save local events."
                  : "Join Gauteng’s local event community."}
              </Text>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, tab === "login" && styles.tabActive]}
                onPress={() => changeTab("login")}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === "login" }}
              >
                <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>Sign in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === "register" && styles.tabActive]}
                onPress={() => changeTab("register")}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ selected: tab === "register" }}
              >
                <Text style={[styles.tabText, tab === "register" && styles.tabTextActive]}>Sign up</Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View accessibilityRole="alert" style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {tab === "register" && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor={Brand.grey}
                  maxLength={61}
                  editable={!loading}
                  autoComplete="name"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <TextInput
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor={Brand.grey}
                editable={!loading}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                placeholder={tab === "login" ? "Enter your password" : "At least 6 characters"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                style={styles.input}
                placeholderTextColor={Brand.grey}
                editable={!loading}
                onSubmitEditing={tab === "login" ? handleLogin : handleRegister}
              />
            </View>

            {tab === "register" && (
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>
                  Creating an account as {selectedRole === "host" ? "a Host" : "an Event goer"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={tab === "login" ? handleLogin : handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              <Text style={styles.buttonText}>
                {loading ? "Please wait…" : tab === "login" ? "Sign in to continue" : "Create account"}
              </Text>
              {!loading && <Text style={styles.buttonArrow}>→</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/(auth)/roles")} style={styles.backLink} disabled={loading}>
              <Text style={styles.backLinkText}>← Back to role selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.bg },
  container: {
    flexGrow: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: Brand.bg,
  },
  authLayout: { width: "100%", maxWidth: 440, alignSelf: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18, paddingHorizontal: 4 },
  brandMark: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: Brand.red },
  brandMarkText: { color: Brand.white, fontFamily: Typography.heading, fontSize: 18, fontWeight: "800" },
  brand: {
    fontFamily: Typography.heading,
    fontSize: 15,
    fontWeight: "800",
    color: Brand.dark,
  },
  brandDivider: { color: "#AAA39C", fontWeight: "500" },
  authCard: {
    width: "100%",
    padding: 28,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    borderRadius: 18,
    backgroundColor: Brand.white,
    shadowColor: "#202124",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeading: { marginBottom: 22 },
  eyebrow: { color: Brand.red, fontFamily: Typography.body, fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 },
  title: { color: Brand.dark, fontFamily: Typography.heading, fontWeight: "800", fontSize: 29, letterSpacing: -0.8 },
  tagline: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Brand.greyMid,
    marginTop: 6,
    lineHeight: 21,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, minHeight: 40, paddingVertical: 10, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.greyLight },
  tabText: { fontFamily: Typography.body, fontSize: 13, fontWeight: "600", color: Brand.grey },
  tabTextActive: { color: Brand.red },
  field: { marginBottom: 14 },
  fieldLabel: { color: Brand.dark, fontFamily: Typography.body, fontSize: 13, fontWeight: "600", marginBottom: 7 },
  input: {
    fontFamily: Typography.body,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Brand.dark,
    backgroundColor: Brand.white,
  },
  roleTag: {
    backgroundColor: Brand.redLight,
    borderRadius: Radius.sm,
    padding: 11,
    marginBottom: 14,
    alignItems: "center",
  },
  roleTagText: { fontFamily: Typography.body, color: Brand.red, fontSize: 12, fontWeight: "600" },
  button: {
    backgroundColor: Brand.red,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: Typography.body, color: Brand.white, fontSize: 14, fontWeight: "700" },
  buttonArrow: { color: Brand.white, fontSize: 18, lineHeight: 20 },
  backLink: { alignItems: "center" },
  backLinkText: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 12, fontWeight: "600" },
  errorBox: {
    backgroundColor: Brand.redLight,
    borderColor: Brand.red,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: Typography.body, color: "#8F1020", fontSize: 14, lineHeight: 20 },
});
