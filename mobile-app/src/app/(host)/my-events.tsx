import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { getHostEvents } from "../../services/events";
import { LogoutButton } from "../../components/logout-button";
import { StatusBadge } from "../../components/host/status-badge";
import { Brand, Radius, Typography } from "../../constants/brand";
import type { EventWithId } from "../../types";

export default function MyEvents() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const hostId = user?.uid;
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loadedHostId, setLoadedHostId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const loading = !hostId || loadedHostId !== hostId;
  const visibleEvents = statusFilter === "all" ? events : events.filter((event) => event.status === statusFilter);

  const loadEvents = useCallback(async () => {
    if (!hostId) {
      setEvents([]);
      return;
    }

    try {
      const hostEvents = await getHostEvents(hostId);
      setEvents(hostEvents);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your events.");
    }
  }, [hostId]);

  useEffect(() => {
    let active = true;

    if (!hostId) {
      return () => {
        active = false;
      };
    }

    getHostEvents(hostId)
      .then((hostEvents) => {
        if (active) {
          setEvents(hostEvents);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load your events.");
        }
      })
      .finally(() => {
        if (active) setLoadedHostId(hostId);
      });

    return () => {
      active = false;
    };
  }, [hostId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
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

        <View style={styles.intro}>
          <Text style={styles.introTitle}>Your events, in one place</Text>
          <Text style={styles.introText}>Check approval status, update a draft, or start your next popup.</Text>
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

        {loadError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={() => void onRefresh()}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && events.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {["all", "pending", "approved", "rejected", "cancelled"].map((status) => (
              <TouchableOpacity
                key={status}
                accessibilityRole="tab"
                accessibilityState={{ selected: statusFilter === status }}
                onPress={() => setStatusFilter(status)}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                  {status === "all" ? `All (${events.length})` : `${status[0].toUpperCase()}${status.slice(1)} (${events.filter((item) => item.status === status).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {!loading && !loadError && events.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎪</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>
              Create your first popup event and share it with Gauteng.
            </Text>
          </View>
        )}

        {!loading && !loadError && events.length > 0 && visibleEvents.length === 0 && (
          <View style={styles.empty}><Text style={styles.emptyText}>No {statusFilter} events yet.</Text></View>
        )}

        <FlatList
          data={visibleEvents}
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
                  })} · {item.startAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Text style={styles.cardAddress} numberOfLines={1}>⌖ {item.location.address}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12, backgroundColor: Brand.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerText: { flex: 1, marginRight: 8 },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontFamily: Typography.heading, fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  createButton: {
    backgroundColor: Brand.red,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginBottom: 20,
  },
  createButtonText: { color: Brand.white, fontWeight: "700", fontSize: 15 },
  intro: { marginBottom: 14 },
  introTitle: { fontFamily: Typography.heading, fontSize: 16, color: Brand.dark, fontWeight: "700" },
  introText: { fontSize: 13, color: Brand.grey, lineHeight: 19, marginTop: 4 },
  filters: { flexDirection: "row", gap: 6, marginBottom: 14 },
  filterChip: { borderRadius: 18, borderWidth: 1, borderColor: Brand.greyLight, paddingVertical: 7, paddingHorizontal: 10 },
  filterChipActive: { backgroundColor: Brand.redLight, borderColor: Brand.red },
  filterText: { color: Brand.grey, fontSize: 11, fontWeight: "600" },
  filterTextActive: { color: Brand.red },
  loadingWrap: { paddingTop: 48, alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Typography.heading, fontSize: 18, fontWeight: "700", color: Brand.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Brand.grey, textAlign: "center", lineHeight: 20 },
  errorCard: { backgroundColor: Brand.redLight, padding: 14, borderRadius: Radius.md, marginBottom: 12 },
  errorText: { color: "#8F1020", fontSize: 13, lineHeight: 19 },
  retryText: { color: Brand.red, fontSize: 13, fontWeight: "700", marginTop: 8 },
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
  cardTitle: { fontFamily: Typography.heading, fontSize: 16, fontWeight: "700", color: Brand.dark, flex: 1 },
  cardCategory: {
    color: Brand.grey,
    fontSize: 13,
    marginTop: 6,
    textTransform: "capitalize",
  },
  cardDate: { color: Brand.greyMid, fontSize: 13, marginTop: 4 },
  cardAddress: { color: Brand.grey, fontSize: 12, marginTop: 6 },
});
