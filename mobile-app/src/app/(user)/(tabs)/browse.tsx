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
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { getApprovedEvents } from "../../../services/events";
import { LogoutButton } from "../../../components/logout-button";
import { StatusBadge } from "../../../components/host/status-badge";
import { Brand, Radius, Typography } from "../../../constants/brand";
import type { EventWithId } from "../../../types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSavedEvents } from "../../../hooks/use-saved-events";

export default function Browse() {
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const { user, profile } = useAuth();
  const {
    savedEventIds,
    loadingSavedEvents,
    savingEventId,
    savedEventsError,
    toggleSavedEvent,
  } = useSavedEvents(user?.uid);
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [referenceTime, setReferenceTime] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setReferenceTime(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveEvent = async (eventId: string) => {
    try {
      const saved = await toggleSavedEvent(eventId);
      setSavedMessage(saved ? "Event saved." : "Event removed from saved events.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Could not update saved events.");
    }
  };

  const loadEvents = useCallback(async () => {
    try {
      const approvedEvents = await getApprovedEvents();
      setEvents(approvedEvents);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load approved events.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    getApprovedEvents()
      .then((approvedEvents) => {
        if (active) {
          setEvents(approvedEvents);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load approved events.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const text = `${event.title} ${event.category} ${event.location.address}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      }),
    [events, query],
  );
  const featuredEvents = useMemo(
    () => events
      .filter((event) => event.startAt.getTime() > referenceTime && Boolean(event.imageUrl))
      .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
      .slice(0, 5),
    [events, referenceTime],
  );
  const featureWidth = Math.min(Math.max(viewportWidth - 48, 250), 440);

  const openEvent = (eventId: string) => {
    router.push({ pathname: "/(user)/event/[id]", params: { id: eventId } } as any);
  };

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
            Find your next local experience.
          </Text>

          <View style={styles.featureSection}>
            <View style={styles.featureHeadingRow}>
              <Text style={styles.featureHeading}>Coming up</Text>
              <Text style={styles.featureCount}>
                {featuredEvents.length ? `${featuredEvents.length} featured` : "Discover nearby"}
              </Text>
            </View>
            {featuredEvents.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={featureWidth + 12}
                contentContainerStyle={styles.featureList}
              >
                {featuredEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.featureCard, { width: featureWidth }]}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${event.title}, ${event.startAt.toLocaleDateString("en-ZA")}`}
                    onPress={() => openEvent(event.id)}
                  >
                    <Image source={{ uri: event.imageUrl }} style={styles.featureImage} contentFit="cover" />
                    <View style={styles.featureShade} />
                    <View style={styles.featureCopy}>
                      <Text style={styles.featureEyebrow}>
                        {event.startAt.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
                        {"  ·  "}{(event.ticketPrice ?? 0) > 0 ? `R${event.ticketPrice}` : "Free"}
                      </Text>
                      <Text style={styles.featureTitle} numberOfLines={2}>{event.title}</Text>
                      <Text style={styles.featureLocation} numberOfLines={1}>
                        {event.location.suburb ?? event.location.address}
                      </Text>
                    </View>
                    <View style={styles.featureArrow}>
                      <MaterialCommunityIcons name="arrow-up-right" size={19} color={Brand.dark} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.staticFeature}>
                <View style={styles.staticFeatureIcon}>
                  <MaterialCommunityIcons name="calendar-star" size={24} color={Brand.red} />
                </View>
                <View style={styles.staticFeatureCopy}>
                  <Text style={styles.staticFeatureTitle}>Your next great find is close</Text>
                  <Text style={styles.staticFeatureText}>Approved events with photos will be featured here.</Text>
                </View>
              </View>
            )}
          </View>

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
          {savedMessage || savedEventsError ? (
            <Text style={styles.savedMessage} accessibilityLiveRegion="polite" accessibilityRole="alert">
              {savedMessage ?? savedEventsError}
            </Text>
          ) : null}
        </View>

        {loadError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Could not load events</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : loading ? (
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
                onPress={() => openEvent(item.id)}
              >
                <View style={styles.imageWrap}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.cardImagePlaceholderText}>No image</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    activeOpacity={0.75}
                    disabled={loadingSavedEvents || savingEventId === item.id}
                    accessibilityRole="button"
                    accessibilityLabel={savedEventIds.has(item.id) ? `Remove ${item.title} from saved events` : `Save ${item.title}`}
                    onPress={(pressEvent) => {
                      pressEvent.stopPropagation();
                      void handleSaveEvent(item.id);
                    }}
                  >
                    <MaterialCommunityIcons
                      name={savedEventIds.has(item.id) ? "bookmark" : "bookmark-outline"}
                      size={23}
                      color={Brand.red}
                    />
                  </TouchableOpacity>
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
  featureSection: { marginBottom: 16, marginHorizontal: -24 },
  featureHeadingRow: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  featureHeading: { fontFamily: Typography.heading, fontSize: 17, fontWeight: "800", color: Brand.dark },
  featureCount: { fontSize: 12, fontWeight: "600", color: Brand.grey },
  featureList: { paddingHorizontal: 24, gap: 12 },
  featureCard: { height: 148, borderRadius: Radius.lg, overflow: "hidden", backgroundColor: Brand.dark },
  featureImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  featureShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(18,20,24,0.42)" },
  featureCopy: { position: "absolute", left: 16, right: 58, bottom: 14 },
  featureEyebrow: { color: Brand.white, fontSize: 11, fontWeight: "700", marginBottom: 5 },
  featureTitle: { fontFamily: Typography.heading, color: Brand.white, fontSize: 19, lineHeight: 23, fontWeight: "800" },
  featureLocation: { color: "#F4F2F0", fontSize: 12, marginTop: 4 },
  featureArrow: {
    position: "absolute", right: 14, bottom: 14, width: 34, height: 34,
    borderRadius: 17, backgroundColor: Brand.white, alignItems: "center", justifyContent: "center",
  },
  staticFeature: {
    minHeight: 92, marginHorizontal: 24, padding: 16, flexDirection: "row", alignItems: "center",
    gap: 12, borderRadius: Radius.lg, borderWidth: 1, borderColor: Brand.greyLight, backgroundColor: Brand.redLight,
  },
  staticFeatureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.white, alignItems: "center", justifyContent: "center" },
  staticFeatureCopy: { flex: 1 },
  staticFeatureTitle: { fontFamily: Typography.heading, color: Brand.dark, fontSize: 14, fontWeight: "800" },
  staticFeatureText: { color: Brand.greyMid, fontSize: 12, lineHeight: 17, marginTop: 3 },
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
  bookmarkButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: Brand.white,
    elevation: 2,
  },
  savedMessage: { color: Brand.greyMid, fontSize: 13, marginTop: -4, marginBottom: 8 },
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
