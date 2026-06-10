import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "700", color: "#208AEF", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 32 },
  link: { textAlign: "center", color: "#208AEF", fontSize: 14 },
});
