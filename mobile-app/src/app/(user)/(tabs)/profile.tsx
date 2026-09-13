import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuth } from "../../../contexts/AuthContext";
import { LogoutButton } from "../../../components/logout-button";
import { Brand, Radius } from "../../../constants/brand";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  const initials = useMemo(() => {
    if (!profile?.displayName) return "PG";
    return profile.displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  const joinedAt = useMemo(() => {
    if (!profile?.createdAt) return "";
    return profile.createdAt instanceof Date
      ? profile.createdAt.toLocaleDateString("en-ZA")
      : String(profile.createdAt);
  }, [profile]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>PopUpGp</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>{loading ? <Text style={styles.avatarText}>...</Text> : <Text style={styles.avatarText}>{initials}</Text>}</View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{loading ? "Loading..." : profile?.displayName ?? "Unknown User"}</Text>
            <Text style={styles.profileRole}>{loading ? "Loading role" : profile?.role ?? "user"}</Text>
            <Text style={styles.profileEmail}>{loading ? "Loading email" : profile?.email ?? "no-email@example.com"}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.sectionSubtitle}>Manage your profile, security, and app preferences.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Joined</Text>
          <Text style={styles.value}>{joinedAt || "Not available"}</Text>
        </View>

        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => {}}>
          <Text style={styles.label}>Settings</Text>
          <Text style={styles.value}>Privacy, notifications, and preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/(user)/(tabs)/browse") }>
          <Text style={styles.label}>Events</Text>
          <Text style={styles.value}>Browse available pop-up activities</Text>
        </TouchableOpacity>

        <View style={styles.logoutWrap}>
          <LogoutButton inline />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.white },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  header: { marginBottom: 20 },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 18,
    marginBottom: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Brand.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: { color: Brand.white, fontSize: 24, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "800", color: Brand.dark },
  profileRole: { fontSize: 13, color: Brand.red, marginTop: 4 },
  profileEmail: { fontSize: 13, color: Brand.greyMid, marginTop: 2 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Brand.dark },
  sectionSubtitle: { fontSize: 13, color: Brand.greyMid, marginTop: 4, lineHeight: 20 },
  card: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: Brand.grey,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: { fontSize: 15, fontWeight: "600", color: Brand.dark },
  logoutWrap: { marginTop: 12, alignItems: "flex-start" },
});
