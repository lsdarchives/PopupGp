import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useAuth } from "../../../contexts/AuthContext";
import { LogoutButton } from "../../../components/logout-button";
import { Brand, Radius, Typography } from "../../../constants/brand";
import { updateProfileName } from "../../../services/users";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

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

  const saveName = async () => {
    const displayName = nameDraft.trim();
    if (!displayName || displayName.length > 60) {
      setProfileMessage("Enter a name between 1 and 60 characters.");
      return;
    }
    if (!user) {
      setProfileMessage("Sign in again before updating your profile.");
      return;
    }

    setSavingName(true);
    setProfileMessage(null);
    try {
      await updateProfileName(user.uid, displayName);
      await refreshProfile();
      setEditingName(false);
      setProfileMessage("Your name has been updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not update your name.");
    } finally {
      setSavingName(false);
    }
  };

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
            {editingName ? (
              <>
                <TextInput
                  style={styles.nameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  maxLength={60}
                  autoCapitalize="words"
                  accessibilityLabel="Profile name"
                  editable={!savingName}
                />
                <View style={styles.nameActions}>
                  <TouchableOpacity onPress={saveName} disabled={savingName} style={styles.smallPrimaryButton}>
                    {savingName ? <ActivityIndicator color={Brand.white} /> : <Text style={styles.smallPrimaryText}>Save</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingName(false);
                      setProfileMessage(null);
                    }}
                    disabled={savingName}
                    style={styles.smallSecondaryButton}
                  >
                    <Text style={styles.smallSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.profileName}>{loading ? "Loading..." : profile?.displayName ?? "Unknown User"}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setNameDraft(profile?.displayName ?? "");
                    setProfileMessage(null);
                    setEditingName(true);
                  }}
                  disabled={loading || !profile}
                  accessibilityRole="button"
                >
                  <Text style={styles.editName}>Edit name</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.profileRole}>{loading ? "Loading role" : profile?.role ?? "user"}</Text>
            <Text style={styles.profileEmail}>{loading ? "Loading email" : profile?.email ?? "no-email@example.com"}</Text>
          </View>
        </View>
        {profileMessage ? (
          <Text style={styles.profileMessage} accessibilityLiveRegion="polite" accessibilityRole="alert">
            {profileMessage}
          </Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.sectionSubtitle}>Manage your profile, security, and app preferences.</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Joined</Text>
          <Text style={styles.value}>{joinedAt || "Not available"}</Text>
        </View>

        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/(user)/saved-events" as any)}>
          <View style={styles.linkIcon}><MaterialCommunityIcons name="bookmark-outline" size={21} color={Brand.red} /></View>
          <View style={styles.linkCopy}>
            <Text style={styles.label}>Saved Events</Text>
            <Text style={styles.value}>Revisit events you want to attend</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Brand.grey} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/(user)/(tabs)/browse") }>
          <View style={styles.linkIcon}><MaterialCommunityIcons name="compass-outline" size={21} color={Brand.red} /></View>
          <View style={styles.linkCopy}>
            <Text style={styles.label}>Browse Events</Text>
            <Text style={styles.value}>Find pop-ups happening nearby</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={Brand.grey} />
        </TouchableOpacity>

        <View style={styles.logoutWrap}>
          <LogoutButton inline />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12, backgroundColor: Brand.bg },
  header: { marginBottom: 20 },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontFamily: Typography.heading, fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
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
  profileName: { fontFamily: Typography.heading, fontSize: 18, fontWeight: "800", color: Brand.dark },
  editName: { color: Brand.red, fontSize: 13, fontWeight: "700", marginTop: 5 },
  nameInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    borderRadius: Radius.sm,
    backgroundColor: Brand.white,
    paddingHorizontal: 10,
    color: Brand.dark,
    fontSize: 15,
    fontWeight: "600",
  },
  nameActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  smallPrimaryButton: { minWidth: 66, minHeight: 34, alignItems: "center", justifyContent: "center", backgroundColor: Brand.red, borderRadius: Radius.sm, paddingHorizontal: 10 },
  smallPrimaryText: { color: Brand.white, fontWeight: "700", fontSize: 13 },
  smallSecondaryButton: { minWidth: 66, minHeight: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Brand.greyLight, borderRadius: Radius.sm, paddingHorizontal: 10 },
  smallSecondaryText: { color: Brand.dark, fontWeight: "700", fontSize: 13 },
  profileMessage: { color: Brand.greyMid, fontSize: 13, marginTop: -8, marginBottom: 12 },
  profileRole: { fontSize: 13, color: Brand.red, marginTop: 4 },
  profileEmail: { fontSize: 13, color: Brand.greyMid, marginTop: 2 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Brand.dark },
  sectionSubtitle: { fontSize: 13, color: Brand.greyMid, marginTop: 4, lineHeight: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 16,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Brand.white,
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
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: Brand.redLight, marginRight: 12 },
  linkCopy: { flex: 1 },
  logoutWrap: { marginTop: 12, alignItems: "flex-start" },
});
