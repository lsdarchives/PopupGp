import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Pressable,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Location from "expo-location";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Camera, type CameraRef, Map, Marker } from "@maplibre/maplibre-react-native";

import { useAuth } from "../../../contexts/AuthContext";
import { getApprovedEvents } from "../../../services/events";
import { Brand, Radius } from "../../../constants/brand";
import type { EventWithId } from "../../../types";
import { useSavedEvents } from "../../../hooks/use-saved-events";

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
  const { user, profile } = useAuth();
  const { savedEventIds, loadingSavedEvents, savingEventId, toggleSavedEvent } = useSavedEvents(user?.uid);
  const cameraRef = useRef<CameraRef>(null);
  const [previewTranslateY] = useState(() => new Animated.Value(320));
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    getApprovedEvents()
      .then((items) => {
        setEvents(items);
        setEventLoadError(null);
      })
      .catch((error) => {
        setEventLoadError(error instanceof Error ? error.message : "Could not load approved events.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loadUserLocation = async () => {
      setLocationLoading(true);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setLocationError("Allow location access to center the map near you.");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation([position.coords.longitude, position.coords.latitude]);
      } catch (error) {
        setLocationError(error instanceof Error ? error.message : "Could not get your location.");
      } finally {
        setLocationLoading(false);
      }
    };

    loadUserLocation();
  }, []);

  useEffect(() => {
    Animated.timing(previewTranslateY, {
      toValue: isPreviewVisible ? 0 : 320,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [isPreviewVisible, previewTranslateY]);

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

  const selectedEvent = useMemo(() => {
    return (
      filteredEvents.find((event) => event.id === selectedEventId) ??
      filteredEvents[0] ??
      null
    );
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
  }, [selectedEvent]);

  const openEvent = (eventId: string) => {
    router.push({ pathname: "/(user)/event/[id]", params: { id: eventId } } as any);
  };

  const toggleSelectedEventSave = async () => {
    if (!selectedEvent || !user) {
      setSavedMessage("Sign in to save events.");
      return;
    }
    setSavedMessage(null);
    try {
      const saved = await toggleSavedEvent(selectedEvent.id);
      setSavedMessage(saved ? "Saved for later." : "Removed from saved events.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Could not update saved events.");
    }
  };

  const closePreview = useCallback(() => {
    Animated.timing(previewTranslateY, {
      toValue: 320,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setIsPreviewVisible(false));
  }, [previewTranslateY]);

  const recenterToUser = async () => {
    setLocationError(null);
    if (userLocation) {
      cameraRef.current?.flyTo({
        center: userLocation,
        zoom: 14,
        duration: 650,
        pitch: 20,
        bearing: 0,
      });
      return;
    }

    setLocationLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationError("Allow location access to center the map near you.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
      setUserLocation(nextLocation);
      cameraRef.current?.flyTo({
        center: nextLocation,
        zoom: 14,
        duration: 650,
        pitch: 20,
        bearing: 0,
      });
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Could not get your location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const previewPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            previewTranslateY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 0.8) {
            closePreview();
            return;
          }

          Animated.spring(previewTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [closePreview, previewTranslateY]
  );

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
        ) : eventLoadError || events.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {eventLoadError ? "Could not load events" : "No approved events yet"}
            </Text>
            <Text style={styles.emptyText}>
              {eventLoadError ?? "Once admins approve events, they will appear on this map."}
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

              {userLocation ? (
                <Marker lngLat={userLocation}>
                  <View style={styles.userDotOuter}>
                    <View style={styles.userDotInner} />
                  </View>
                </Marker>
              ) : null}
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
                      onPress={() => {
                        setActiveFilter("all");
                        setIsPreviewVisible(false);
                      }}
                    />
                    <FilterChip
                      label="Free"
                      active={activeFilter === "free"}
                      onPress={() => {
                        setActiveFilter("free");
                        setIsPreviewVisible(false);
                      }}
                    />
                    <FilterChip
                      label="Paid"
                      active={activeFilter === "paid"}
                      onPress={() => {
                        setActiveFilter("paid");
                        setIsPreviewVisible(false);
                      }}
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
                      onPress={() => {
                        setSelectedCategory("all");
                        setIsPreviewVisible(false);
                      }}
                    />
                    {categoryOptions.map((category) => (
                      <CategoryChip
                        key={category}
                        label={category}
                        active={selectedCategory === category}
                        onPress={() => {
                          setSelectedCategory(category);
                          setIsPreviewVisible(false);
                        }}
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

            <TouchableOpacity
              style={styles.locationButton}
              activeOpacity={0.85}
              onPress={recenterToUser}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={Brand.red} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" color={Brand.red} size={22} />
              )}
            </TouchableOpacity>
            {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}

            {isPreviewVisible && selectedEvent ? (
              <Pressable style={styles.previewScrim} onPress={closePreview} />
            ) : null}

            {isPreviewVisible && selectedEvent ? (
              <Animated.View
                style={[styles.previewSheet, { transform: [{ translateY: previewTranslateY }] }]}
                {...previewPanResponder.panHandlers}
              >
                <View style={styles.sheetHandle} />
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
                    <View style={styles.previewActions}>
                      <Text style={styles.previewPrice}>
                        {(selectedEvent.ticketPrice ?? 0) > 0
                          ? `R${selectedEvent.ticketPrice}`
                          : "Free"}
                      </Text>
                      <TouchableOpacity
                        style={styles.previewSaveButton}
                        onPress={toggleSelectedEventSave}
                        disabled={loadingSavedEvents || savingEventId === selectedEvent.id}
                        accessibilityRole="button"
                        accessibilityLabel={savedEventIds.has(selectedEvent.id) ? "Remove from saved events" : "Save event"}
                      >
                        {savingEventId === selectedEvent.id ? (
                          <ActivityIndicator size="small" color={Brand.red} />
                        ) : (
                          <MaterialCommunityIcons
                            name={savedEventIds.has(selectedEvent.id) ? "bookmark" : "bookmark-outline"}
                            size={19}
                            color={Brand.red}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {selectedEvent.title}
                  </Text>
                  <Text style={styles.previewMeta} numberOfLines={2}>
                    {selectedEventDate} · {selectedEvent.location.address}
                  </Text>
                  {savedMessage ? (
                    <Text style={styles.previewSavedMessage} accessibilityLiveRegion="polite" accessibilityRole="alert">
                      {savedMessage}
                    </Text>
                  ) : null}

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
              </Animated.View>
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
  userDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(47, 128, 237, 0.2)",
    borderWidth: 2,
    borderColor: Brand.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  userDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2F80ED",
  },
  locationButton: {
    position: "absolute",
    right: 18,
    bottom: 112,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 12,
  },
  locationError: {
    position: "absolute",
    right: 16,
    bottom: 76,
    maxWidth: 220,
    color: Brand.red,
    backgroundColor: Brand.white,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    textAlign: "right",
  },
  previewScrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
    zIndex: 18,
  },
  previewSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 7,
    zIndex: 20,
    paddingBottom: 22,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.greyLight,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  previewImageWrap: {
    height: 170,
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Brand.bg,
  },
  previewImage: { width: "100%", height: "100%" },
  previewPlaceholder: {
    flex: 1,
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
  previewBody: { paddingHorizontal: 18, paddingTop: 14 },
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
  previewActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewSaveButton: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Brand.greyLight,
    backgroundColor: Brand.white, alignItems: "center", justifyContent: "center",
  },
  previewSavedMessage: { fontSize: 12, color: Brand.greyMid, marginTop: 4 },
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
    backgroundColor: Brand.red,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  previewButtonText: { color: Brand.white, fontSize: 13, fontWeight: "700" },
});
