import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { getApprovedEvents } from "../../services/events";
import { LogoutButton } from "../../components/logout-button";
import { StatusBadge } from "../../components/host/status-badge";
import { Brand, Radius } from "../../constants/brand";
import type { EventWithId } from "../../types";

export default function Browse() {
  const router = useRouter();
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    const approvedEvents = await getApprovedEvents();
    setEvents(approvedEvents);
  }, []);

  useEffect(() => {
    loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PopUpGp</Text>
            <Text style={styles.title}>Browse events</Text>
            {profile && <Text style={styles.greeting}>Hello, {profile.displayName}</Text>}
          </View>
          <LogoutButton inline />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Brand.red} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No approved events yet</Text>
            <Text style={styles.emptyText}>
              Approved popup events will appear here once an admin signs them off.
            </Text>
          </View>
        ) : (
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
                activeOpacity={0.85}
                onPress={() =>
                  router.push({ pathname: "/(user)/event/[id]", params: { id: item.id } } as any)
                }
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
                  <Text style={styles.cardDate} numberOfLines={2}>
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
    marginBottom: 20,
  },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
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
  cardCategory: { color: Brand.grey, fontSize: 13, marginTop: 6, textTransform: "capitalize" },
  cardDate: { color: Brand.greyMid, fontSize: 13, marginTop: 4 },
});
