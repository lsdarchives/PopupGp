import { Stack, usePathname, useRouter, type Href } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ComponentProps } from "react";
import { Brand } from "../../constants/brand";

type HostTab = {
  label: string;
  path: Href;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
};

const tabs: HostTab[] = [
  { label: "Dashboard", path: "/(host)/dashboard", icon: "view-dashboard-outline" },
  { label: "My Events", path: "/(host)/my-events", icon: "calendar-multiple" },
  { label: "Create", path: "/(host)/create-event", icon: "plus-circle-outline" },
  { label: "Profile", path: "/(host)/profile", icon: "account-outline" },
];

export default function HostLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = pathname.includes("create-event") || pathname.includes("edit-event")
    ? "Create"
    : pathname.includes("my-events") || pathname.includes("/event/")
      ? "My Events"
      : pathname.includes("profile")
        ? "Profile"
        : "Dashboard";

  return (
    <View style={styles.screen}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Brand.white },
        }}
      />
      <SafeAreaView edges={["bottom"]} style={styles.navSafe}>
        <View style={styles.nav}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.label;
            return (
              <TouchableOpacity
                key={tab.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={tab.label}
                style={styles.navItem}
                onPress={() => router.replace(tab.path)}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={21}
                  color={selected ? Brand.red : Brand.grey}
                />
                <Text style={[styles.navText, selected && styles.navTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  navSafe: {
    flexShrink: 0,
    backgroundColor: Brand.white,
    borderTopWidth: 1,
    borderTopColor: Brand.greyLight,
  },
  nav: {
    minHeight: 60,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: { flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", gap: 3 },
  navText: { color: Brand.grey, fontSize: 10, fontWeight: "600" },
  navTextActive: { color: Brand.red },
});
