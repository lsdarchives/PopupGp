import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../contexts/AuthContext";
import { LogoutButton } from "../../components/logout-button";
import { updateProfileName } from "../../services/users";
import { Brand, Radius, Typography } from "../../constants/brand";

export default function HostProfile() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initials = useMemo(
    () => profile?.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PG",
    [profile?.displayName],
  );

  const saveName = async () => {
    const displayName = nameDraft.trim();
    if (!displayName || displayName.length > 60) {
      setMessage("Enter a name between 1 and 60 characters.");
      return;
    }
    if (!user) {
      setMessage("Sign in again before updating your profile.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await updateProfileName(user.uid, displayName);
      await refreshProfile();
      setEditing(false);
      setMessage("Your name has been updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PopUpGp · HOST</Text>
            <Text style={styles.title}>Profile</Text>
          </View>
          <LogoutButton inline />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{loading ? "..." : initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            {editing ? (
              <>
                <TextInput
                  accessibilityLabel="Profile name"
                  style={styles.nameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  maxLength={60}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.saveButton} onPress={() => void saveName()} disabled={saving}>
                    {saving ? <ActivityIndicator color={Brand.white} /> : <Text style={styles.saveText}>Save</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditing(false)} disabled={saving}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.name}>{loading ? "Loading..." : profile?.displayName ?? "Host"}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setNameDraft(profile?.displayName ?? "");
                    setMessage(null);
                    setEditing(true);
                  }}
                  disabled={loading || !profile}
                >
                  <Text style={styles.editLink}>Edit name</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.role}>Event host</Text>
            <Text style={styles.email}>{loading ? "Loading email" : profile?.email ?? user?.email ?? ""}</Text>
          </View>
        </View>

        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="calendar-check-outline" size={22} color={Brand.red} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Host account</Text>
            <Text style={styles.infoText}>
              {profile?.createdAt ? `Member since ${profile.createdAt.toLocaleDateString("en-ZA")}` : "Manage your event submissions and profile."}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Brand.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  brand: { color: Brand.red, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 28, fontWeight: "800", marginTop: 3 },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: Brand.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.greyLight, padding: 18, marginBottom: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Brand.red, alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { color: Brand.white, fontSize: 22, fontWeight: "800" },
  profileInfo: { flex: 1 },
  name: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 18, fontWeight: "800" },
  editLink: { color: Brand.red, fontSize: 13, fontWeight: "700", marginTop: 4 },
  role: { color: Brand.dark, fontSize: 12, fontWeight: "700", textTransform: "capitalize", marginTop: 8 },
  email: { color: Brand.grey, fontSize: 12, marginTop: 3 },
  nameInput: { minHeight: 42, borderWidth: 1, borderColor: Brand.greyLight, borderRadius: Radius.sm, paddingHorizontal: 10, color: Brand.dark, fontSize: 15 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  saveButton: { minWidth: 64, minHeight: 32, alignItems: "center", justifyContent: "center", borderRadius: Radius.sm, backgroundColor: Brand.red, paddingHorizontal: 12 },
  saveText: { color: Brand.white, fontSize: 12, fontWeight: "700" },
  cancelText: { color: Brand.grey, fontSize: 12, fontWeight: "600" },
  message: { color: Brand.red, fontSize: 13, marginVertical: 8 },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Brand.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.greyLight, padding: 16 },
  infoCopy: { flex: 1 },
  infoTitle: { color: Brand.dark, fontSize: 14, fontWeight: "700" },
  infoText: { color: Brand.grey, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
