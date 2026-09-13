import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Camera, type CameraRef, Map, Marker } from "@maplibre/maplibre-react-native";

import { useAuth } from "../../../contexts/AuthContext";
import { getApprovedEvents } from "../../../services/events";
import { Brand, Radius } from "../../../constants/brand";
import type { EventWithId } from "../../../types";

const GAUTENG_CENTER: [number, number] = [28.0473, -26.2041];
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

type SearchFilter = "all" | "free" | "paid";

const CATEGORY_EMOJI: Record<string, string> = {
  music: "🎵",
  food: "🍔",
  sports: "🏅",
  arts: "🎨",
  markets: "🛍️",
  nightlife: "🌙",
  other: "✨",
};

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.categoryChip, active && styles.categoryChipActive]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
        {CATEGORY_EMOJI[label] ? `${CATEGORY_EMOJI[label]} ` : ""}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const cameraRef = useRef<CameraRef>(null);
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  useEffect(() => {
    getApprovedEvents()
      .then((items) => {
        setEvents(items);
        setSelectedEventId(items[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const price = event.ticketPrice ?? 0;

      if (activeFilter === "free" && price > 0) {
        return false;
      }

      if (activeFilter === "paid" && price <= 0) {
        return false;
      }

      if (selectedCategory !== "all" && event.category.toLowerCase() !== selectedCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchText = [
        event.title,
        event.category,
        event.description,
        event.location.address,
        event.location.suburb,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, [events, query, activeFilter, selectedCategory]);

  useEffect(() => {
    if (filteredEvents.length === 0) {
      setSelectedEventId(null);
      setIsPreviewVisible(false);
      return;
    }

    setSelectedEventId((currentSelection) => {
      const currentMatch = filteredEvents.some((event) => event.id === currentSelection);
      return currentMatch ? currentSelection : filteredEvents[0].id;
    });
  }, [filteredEvents]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) {
      return filteredEvents[0] ?? null;
    }

    return filteredEvents.find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? null;
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (!selectedEvent) {
      return;
    }

    cameraRef.current?.flyTo({
      center: [selectedEvent.location.lng, selectedEvent.location.lat],
      zoom: 13,
      duration: 650,
      pitch: 20,
      bearing: 0,
    });
  }, [selectedEvent?.id]);

  const openEvent = (eventId: string) => {
    router.push({ pathname: "/(user)/event/[id]", params: { id: eventId } } as any);
  };

  const cameraCenter: [number, number] = selectedEvent
    ? [selectedEvent.location.lng, selectedEvent.location.lat]
    : GAUTENG_CENTER;

  const searchLabel = query.trim()
    ? `${filteredEvents.length} result${filteredEvents.length === 1 ? "" : "s"} for "${query.trim()}"`
    : `${events.length} events available`;

  const categoryOptions = useMemo(() => {
    const counts = new globalThis.Map<string, number>();

    events.forEach((event) => {
      const category = event.category.toLowerCase().trim();
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([category]) => category);
  }, [events]);

  const selectedEventDate = selectedEvent
    ? selectedEvent.startAt.toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Brand.red} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No approved events yet</Text>
            <Text style={styles.emptyText}>
              Once admins approve events, they will appear on this map.
            </Text>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <Map
              style={styles.map}
              mapStyle={MAP_STYLE}
              logo={false}
              attribution={false}
              compass={false}
              scaleBar={false}
            >
              <Camera
                ref={cameraRef}
                initialViewState={{
                  center: cameraCenter,
                  zoom: 12,
                  pitch: 15,
                  bearing: 0,
                }}
              />

              {filteredEvents.map((event) => (
                <Marker
                  key={event.id}
                  lngLat={[event.location.lng, event.location.lat]}
                  onPress={() => {
                    setSelectedEventId(event.id);
                    setIsPreviewVisible(true);
                  }}
                >
                  <View style={[styles.pin, selectedEvent?.id === event.id && styles.pinSelected]}>
                    <View style={styles.pinInner} />
                  </View>
                </Marker>
              ))}
            </Map>

            <View style={styles.mapHeaderOverlay}>
              <View style={styles.brandRow}>
                <View style={styles.brandBlock}>
                  <Text style={styles.brand}>PopUpGp</Text>
                  <Text style={styles.title}>Discover nearby popups</Text>
                  {profile && <Text style={styles.greeting}>Hello, {profile.displayName}</Text>}
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{filteredEvents.length} live</Text>
                </View>
              </View>

              <View style={styles.searchCard}>
                <View style={styles.searchInputRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search events, categories, or address"
                    placeholderTextColor={Brand.grey}
                    value={query}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onChangeText={(text) => {
                      setQuery(text);
                      setIsPreviewVisible(false);
                    }}
                    returnKeyType="search"
                  />
                  {isSearchFocused && query.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      activeOpacity={0.85}
                      onPress={() => {
                        setQuery("");
                        setIsPreviewVisible(false);
                      }}
                    >
                      <Text style={styles.clearButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isSearchFocused && (
                  <View style={styles.filterRow}>
                    <FilterChip
                      label="All"
                      active={activeFilter === "all"}
                      onPress={() => setActiveFilter("all")}
                    />
                    <FilterChip
                      label="Free"
                      active={activeFilter === "free"}
                      onPress={() => setActiveFilter("free")}
                    />
                    <FilterChip
                      label="Paid"
                      active={activeFilter === "paid"}
                      onPress={() => setActiveFilter("paid")}
                    />
                  </View>
                )}

                {isSearchFocused && categoryOptions.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                  >
                    <CategoryChip
                      label="all"
                      active={selectedCategory === "all"}
                      onPress={() => setSelectedCategory("all")}
                    />
                    {categoryOptions.map((category) => (
                      <CategoryChip
                        key={category}
                        label={category}
                        active={selectedCategory === category}
                        onPress={() => setSelectedCategory(category)}
                      />
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.searchHint}>{searchLabel}</Text>

                {isSearchFocused && query.trim() !== "" && (
                  <View style={styles.resultsList}>
                    {filteredEvents.length === 0 ? (
                      <View style={styles.noResultsInline}>
                        <Text style={styles.noResultsTitle}>No matching events</Text>
                        <Text style={styles.noResultsText}>
                          Try a different name, suburb, or category.
                        </Text>
                      </View>
                    ) : (
                      filteredEvents.slice(0, 4).map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.resultRow,
                            selectedEvent?.id === event.id && styles.resultRowActive,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => {
                            setSelectedEventId(event.id);
                            setIsPreviewVisible(true);
                          }}
                        >
                          <View style={styles.resultTextWrap}>
                            <Text style={styles.resultTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.resultMeta} numberOfLines={1}>
                              {event.category} · {event.location.address}
                            </Text>
                          </View>
                          <Text style={styles.resultPrice}>
                            {(event.ticketPrice ?? 0) > 0 ? `R${event.ticketPrice}` : "Free"}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            </View>

            {isPreviewVisible && selectedEvent ? (
              <View style={styles.previewCard}>
                <View style={styles.previewImageWrap}>
                  {selectedEvent.imageUrl ? (
                    <Image
                      source={{ uri: selectedEvent.imageUrl }}
                      style={styles.previewImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Text style={styles.previewPlaceholderText}>{selectedEvent.category}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.previewBody}>
                  <View style={styles.previewTopRow}>
                    <Text style={styles.previewBadge}>Selected event</Text>
                    <Text style={styles.previewPrice}>
                      {(selectedEvent.ticketPrice ?? 0) > 0
                        ? `R${selectedEvent.ticketPrice}`
                        : "Free"}
                    </Text>
                  </View>

                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {selectedEvent.title}
                  </Text>
                  <Text style={styles.previewMeta} numberOfLines={2}>
                    {selectedEventDate} · {selectedEvent.location.address}
                  </Text>

                  <TouchableOpacity
                    style={styles.previewButton}
                    activeOpacity={0.85}
                    onPress={() => openEvent(selectedEvent.id)}
                  >
                    <Text style={styles.previewButtonText}>
                      {(selectedEvent.ticketPrice ?? 0) > 0 ? "View & Buy" : "View Event"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.white },
  container: { flex: 1, backgroundColor: Brand.white },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Brand.dark, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Brand.greyMid, textAlign: "center", lineHeight: 20 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapHeaderOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 12,
  },
  brandRow: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  brandBlock: { flex: 1, paddingRight: 12 },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "800", color: Brand.dark, marginTop: 2, lineHeight: 28 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  countPill: {
    backgroundColor: Brand.red,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  countPillText: { color: Brand.white, fontSize: 12, fontWeight: "700" },
  searchCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Brand.dark,
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.greyLight,
  },
  clearButtonText: {
    fontSize: 20,
    lineHeight: 20,
    color: Brand.greyMid,
    marginTop: -2,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingRight: 4,
  },
  filterChip: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: Brand.dark,
    borderColor: Brand.dark,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.greyMid,
  },
  filterChipTextActive: {
    color: Brand.white,
  },
  categoryChip: {
    backgroundColor: Brand.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: Brand.red,
    borderColor: Brand.red,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.greyMid,
    textTransform: "capitalize",
  },
  categoryChipTextActive: {
    color: Brand.white,
  },
  searchHint: {
    marginTop: 5,
    fontSize: 12,
    color: Brand.greyMid,
  },
  resultsList: {
    marginTop: 8,
    gap: 8,
  },
  noResultsInline: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    padding: 10,
  },
  noResultsTitle: { fontSize: 15, fontWeight: "700", color: Brand.dark },
  noResultsText: { fontSize: 13, color: Brand.greyMid, marginTop: 4, lineHeight: 18 },
  resultRow: {
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultRowActive: {
    borderColor: Brand.red,
  },
  resultTextWrap: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: "700", color: Brand.dark },
  resultMeta: { fontSize: 12, color: Brand.greyMid, marginTop: 3 },
  resultPrice: { fontSize: 12, fontWeight: "700", color: Brand.red },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Brand.dark,
    borderWidth: 2,
    borderColor: Brand.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pinSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.red,
    borderColor: Brand.white,
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.white,
  },
  previewCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 104,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 7,
  },
  previewImageWrap: { width: 118, backgroundColor: Brand.bg },
  previewImage: { width: "100%", height: "100%" },
  previewPlaceholder: {
    flex: 1,
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: Brand.bg,
  },
  previewPlaceholderText: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.greyMid,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewBody: { flex: 1, padding: 14 },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  previewBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: Brand.red,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  previewPrice: { fontSize: 12, fontWeight: "700", color: Brand.greyMid },
  previewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Brand.dark,
    marginTop: 6,
    lineHeight: 20,
  },
  previewMeta: { fontSize: 13, color: Brand.greyMid, marginTop: 6, lineHeight: 18 },
  previewButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: Brand.red,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewButtonText: { color: Brand.white, fontSize: 13, fontWeight: "700" },
});
