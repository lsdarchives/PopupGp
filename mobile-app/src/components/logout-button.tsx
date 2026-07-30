import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Brand } from "../constants/brand";

type Props = {
  inline?: boolean;
};

export function LogoutButton({ inline = false }: Props) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <TouchableOpacity style={inline ? styles.inline : styles.floating} onPress={handleLogout}>
      <Text style={styles.text}>Log out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
    top: 48,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: { color: Brand.red, fontSize: 14, fontWeight: "600" },
});
