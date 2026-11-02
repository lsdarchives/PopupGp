import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Brand, Radius, Typography } from "../../constants/brand";

export default function RolesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.brand}>PopUpGp</Text>
        <Text style={styles.title}>Find your place in the city</Text>
        <Text style={styles.subtitle}>Choose how you want to use PopUpGp.</Text>
      </View>

      <TouchableOpacity
        style={styles.option}
        activeOpacity={0.86}
        onPress={() => router.push("/(auth)/login?role=user" as any)}
        accessibilityRole="button"
      >
        <View style={styles.iconBubble}>
          <MaterialCommunityIcons name="ticket-confirmation-outline" size={25} color={Brand.red} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>I’m here to explore</Text>
          <Text style={styles.optionText}>Discover events, RSVP, and save favourites.</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={21} color={Brand.red} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, styles.hostOption]}
        activeOpacity={0.86}
        onPress={() => router.push("/(auth)/login?role=host" as any)}
        accessibilityRole="button"
      >
        <View style={styles.iconBubble}>
          <MaterialCommunityIcons name="storefront-outline" size={25} color={Brand.red} />
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>I’m hosting an event</Text>
          <Text style={styles.optionText}>Create a popup and manage your guest list.</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={21} color={Brand.red} />
      </TouchableOpacity>

      <Text style={styles.footer}>Local events. Real connections.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, backgroundColor: Brand.bg },
  intro: { marginBottom: 28 },
  brand: { color: Brand.red, fontFamily: Typography.heading, fontSize: 14, fontWeight: "800", letterSpacing: 0.7, marginBottom: 10 },
  title: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 30, fontWeight: "800", lineHeight: 37, maxWidth: 360 },
  subtitle: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 15, lineHeight: 22, marginTop: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 13, padding: 17, backgroundColor: Brand.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Brand.greyLight, marginBottom: 12 },
  hostOption: { borderColor: "#F0C2C8" },
  iconBubble: { width: 48, height: 48, borderRadius: 24, backgroundColor: Brand.redLight, alignItems: "center", justifyContent: "center" },
  optionCopy: { flex: 1 },
  optionTitle: { color: Brand.dark, fontFamily: Typography.heading, fontWeight: "800", fontSize: 16 },
  optionText: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 13, lineHeight: 18, marginTop: 4 },
  footer: { color: Brand.grey, fontFamily: Typography.body, textAlign: "center", fontSize: 12, marginTop: 24 },
});
