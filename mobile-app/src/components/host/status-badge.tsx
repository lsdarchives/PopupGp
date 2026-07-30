import { View, Text, StyleSheet } from "react-native";
import { StatusColors } from "../../constants/brand";
import type { EventStatus } from "../../types";

type Props = {
  status: EventStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: StatusColors[status] }]}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  text: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
