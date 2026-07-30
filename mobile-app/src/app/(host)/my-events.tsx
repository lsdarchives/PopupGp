import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { getHostEvents } from "../../services/events";
import { LogoutButton } from "../../components/logout-button";
import { StatusBadge } from "../../components/host/status-badge";
import { Brand, Radius } from "../../constants/brand";
import type { EventWithId } from "../../types";

export default function MyEvents() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    const hostEvents = await getHostEvents(user.uid);
    setEvents(hostEvents);
  }, [user]);

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.brand}>PopUpGp</Text>
            <Text style={styles.title}>My Events</Text>
            {profile && <Text style={styles.greeting}>Hello, {profile.displayName}</Text>}
          </View>
          <LogoutButton inline />
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/(host)/create-event")}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>+ Create Event</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Brand.red} />
          </View>
        )}

        {!loading && events.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎪</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>
              Create your first popup event and share it with Gauteng.
            </Text>
          </View>
        )}

        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.red} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/(host)/event/[id]", params: { id: item.id } } as any)
              }
              activeOpacity={0.75}
            >
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <Text style={styles.cardDate}>
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
    marginBottom: 20,
  },
  headerText: { flex: 1, marginRight: 8 },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  createButton: {
    backgroundColor: Brand.red,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginBottom: 20,
  },
  createButtonText: { color: Brand.white, fontWeight: "700", fontSize: 15 },
  loadingWrap: { paddingTop: 48, alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Brand.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Brand.grey, textAlign: "center", lineHeight: 20 },
  listContent: { paddingBottom: 32 },
  card: {
    flexDirection: "row",
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: { width: 4, backgroundColor: Brand.red },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Brand.dark, flex: 1 },
  cardCategory: {
    color: Brand.grey,
    fontSize: 13,
    marginTop: 6,
    textTransform: "capitalize",
  },
  cardDate: { color: Brand.greyMid, fontSize: 13, marginTop: 4 },
});
