import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useAuth } from "../../../contexts/AuthContext";
import { getApprovedEvents } from "../../../services/events";
import { LogoutButton } from "../../../components/logout-button";
import { Brand, Radius } from "../../../constants/brand";
import type { EventWithId } from "../../../types";

export default function MapScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApprovedEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PopUpGp</Text>
            <Text style={styles.title}>Map</Text>
            {profile && <Text style={styles.greeting}>Hello, {profile.displayName}</Text>}
          </View>
          <LogoutButton inline />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Map preview on web</Text>
          <Text style={styles.noticeText}>
            The native map is available on mobile devices. Use this list to review the same events
            in the browser for now.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Brand.red} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No approved events yet</Text>
            <Text style={styles.emptyText}>
              Once admins approve events, they will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({ pathname: "/(user)/event/[id]", params: { id: item.id } } as any)
                }
              >
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={2}>
                    {item.startAt.toLocaleDateString("en-ZA", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {item.location.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.white },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  notice: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 14,
    marginBottom: 16,
  },
  noticeTitle: { fontSize: 15, fontWeight: "700", color: Brand.dark },
  noticeText: { fontSize: 13, color: Brand.greyMid, marginTop: 4, lineHeight: 18 },
  loadingWrap: { paddingTop: 48, alignItems: "center" },
  empty: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Brand.dark, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Brand.greyMid, lineHeight: 20 },
  listContent: { paddingBottom: 32 },
  card: {
    flexDirection: "row",
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    overflow: "hidden",
  },
  cardAccent: { width: 4, backgroundColor: Brand.red },
  cardBody: { flex: 1, padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Brand.dark },
  cardMeta: { fontSize: 13, color: Brand.greyMid, marginTop: 4, lineHeight: 18 },
});
