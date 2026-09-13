import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { getApprovedEvents } from "../../../services/events";
import { LogoutButton } from "../../../components/logout-button";
import { StatusBadge } from "../../../components/host/status-badge";
import { Brand, Radius } from "../../../constants/brand";
import type { EventWithId } from "../../../types";

export default function Browse() {
  const router = useRouter();
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

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

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const text = `${event.title} ${event.category} ${event.location.address}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      }),
    [events, query],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.brand}>PopUpGp</Text>
              <Text style={styles.title}>Browse</Text>
              {profile && <Text style={styles.greeting}>Hello, {profile.displayName}</Text>}
            </View>
            <LogoutButton inline />
          </View>

          <Text style={styles.subtitle}>
            Search and explore approved popup events with curated details and images.
          </Text>

          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, categories, or places"
              placeholderTextColor={Brand.grey}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{filteredEvents.length} events</Text>
            </View>
            <View style={styles.badgePillAlt}>
              <Text style={styles.badgePillAltText}>Approved only</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Brand.red} />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyText}>
              Try another search term or refresh to load the latest approved events.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
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
                <View style={styles.imageWrap}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.cardImagePlaceholderText}>No image</Text>
                    </View>
                  )}
                </View>
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
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {item.location.suburb ?? item.location.address}
                    </Text>
                    <Text style={styles.cardMeta}>{item.rsvpCount} going</Text>
                  </View>
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
  container: { flex: 1, backgroundColor: Brand.white },
  hero: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  subtitle: { fontSize: 14, color: Brand.greyMid, lineHeight: 20, marginBottom: 14 },
  searchWrapper: { marginBottom: 12 },
  searchInput: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  badgePill: {
    backgroundColor: Brand.red,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgePillText: { color: Brand.white, fontSize: 12, fontWeight: "700" },
  badgePillAlt: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Brand.greyLight,
  },
  badgePillAltText: { color: Brand.dark, fontSize: 12, fontWeight: "700" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Brand.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Brand.grey, textAlign: "center", lineHeight: 20 },
  listContent: { paddingBottom: 32 },
  card: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    marginHorizontal: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrap: { width: "100%", height: 170, backgroundColor: Brand.bg },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.bg,
  },
  cardImagePlaceholderText: { color: Brand.grey, fontSize: 13 },
  cardBody: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Brand.dark, flex: 1 },
  cardCategory: { color: Brand.grey, fontSize: 13, marginTop: 8, textTransform: "capitalize" },
  cardDate: { color: Brand.greyMid, fontSize: 13, marginTop: 10, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  cardLocation: { color: Brand.dark, fontSize: 13, fontWeight: "600", flex: 1 },
  cardMeta: { color: Brand.greyMid, fontSize: 13 },
});
