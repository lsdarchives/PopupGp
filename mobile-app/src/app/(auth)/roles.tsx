import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function RolesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>I am a...</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(auth)/login?role=user" as any)}
      >
        <Text style={styles.buttonText}>User</Text>
        <Text style={styles.buttonSub}>Discover popup events near me</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonOutline]}
        onPress={() => router.push("/(auth)/login?role=host" as any)}
      >
        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Host</Text>
        <Text style={[styles.buttonSub, styles.buttonSubOutline]}>
          Create and manage my events
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  button: {
    width: "100%",
    backgroundColor: "#E8152A",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  buttonOutline: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E8152A",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  buttonTextOutline: {
    color: "#E8152A",
  },
  buttonSub: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.85,
    marginTop: 4,
  },
  buttonSubOutline: {
    color: "#E8152A",
    opacity: 0.7,
  },
});