import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Brand, Radius } from "../../constants/brand";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function HostScreenHeader({ title, subtitle, showBack = false }: Props) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: Brand.red, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: Brand.red },
  subtitle: { fontSize: 13, color: Brand.grey, marginTop: 4, letterSpacing: 0.3 },
});

export const hostFormStyles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Brand.dark,
    marginBottom: 6,
    marginTop: 4,
  },
  hint: { fontSize: 12, color: Brand.grey, marginTop: -4, marginBottom: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: Brand.greyLight,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: Brand.dark,
    backgroundColor: Brand.bg,
  },
  row: { flexDirection: "row" },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Brand.greyLight,
    backgroundColor: Brand.bg,
  },
  categoryChipActive: { backgroundColor: Brand.red, borderColor: Brand.red },
  categoryText: { color: Brand.greyMid, fontSize: 13, textTransform: "capitalize" },
  categoryTextActive: { color: Brand.white, fontWeight: "600" },
  pickerBtn: {
    borderWidth: 1.5,
    borderColor: Brand.greyLight,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
    backgroundColor: Brand.bg,
    alignItems: "center",
  },
  pickerBtnText: { fontSize: 14, color: Brand.dark, fontWeight: "500" },
  button: {
    backgroundColor: Brand.red,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  buttonText: { color: Brand.white, fontSize: 16, fontWeight: "700" },
});
