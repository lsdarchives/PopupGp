import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useAuth } from "../../../contexts/AuthContext";
import { getApprovedEvents } from "../../../services/events";
import { LogoutButton } from "../../../components/logout-button";
import { StatusBadge } from "../../../components/host/status-badge";
import { Brand, Radius, Typography } from "../../../constants/brand";
import { useSavedEvents } from "../../../hooks/use-saved-events";
import type { EventWithId } from "../../../types";

export default function MapScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { savedEventIds, loadingSavedEvents, savingEventId, toggleSavedEvent } = useSavedEvents(user?.uid);
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const approvedEvents = await getApprovedEvents();
      setEvents(approvedEvents);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load approved events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void loadEvents(); }, 0);
    return () => clearTimeout(timer);
  }, [loadEvents]);

  const openEvent = (eventId: string) => {
    router.push({ pathname: "/(user)/event/[id]", params: { id: eventId } } as any);
  };

  const handleSave = async (eventId: string) => {
    try {
      const saved = await toggleSavedEvent(eventId);
      setSavedMessage(saved ? "Event saved." : "Event removed from saved events.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Could not update saved events.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PopUpGp</Text>
            <Text style={styles.title}>Explore events</Text>
            {profile && <Text style={styles.greeting}>Hello, {profile.displayName}</Text>}
          </View>
          <LogoutButton inline />
        </View>

        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <MaterialCommunityIcons name="map-marker-radius" color={Brand.red} size={21} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>Map view is available in the mobile app</Text>
            <Text style={styles.noticeText}>
              Browse the same approved local events here, then open one for its full location and details.
            </Text>
          </View>
        </View>

        {savedMessage ? (
          <Text style={styles.feedback} accessibilityLiveRegion="polite" accessibilityRole="alert">
            {savedMessage}
          </Text>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Brand.red} />
            <Text style={styles.loadingText}>Loading approved events…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>We couldn’t load the events</Text>
            <Text style={styles.stateText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setLoadError(null); setLoading(true); void loadEvents(); }}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.stateCard}>
            <MaterialCommunityIcons name="calendar-search" size={32} color={Brand.red} />
            <Text style={styles.stateTitle}>No approved events yet</Text>
            <Text style={styles.stateText}>New events will appear here after they are approved.</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={loadEvents}
            refreshing={loading}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardOpenArea}
                  activeOpacity={0.88}
                  onPress={() => openEvent(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title} event details`}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <MaterialCommunityIcons name="image-outline" size={28} color={Brand.grey} />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeading}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    <Text style={styles.cardMeta} numberOfLines={2}>
                      {item.startAt.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}{item.startAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{item.location.address}
                    </Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardPrice}>
                        {(item.ticketPrice ?? 0) > 0 ? `R${item.ticketPrice}` : "Free entry"}
                      </Text>
                      <Text style={styles.cardGoing}>{item.rsvpCount} going</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  disabled={loadingSavedEvents || savingEventId === item.id}
                  onPress={() => void handleSave(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={savedEventIds.has(item.id) ? `Remove ${item.title} from saved events` : `Save ${item.title}`}
                >
                  {savingEventId === item.id ? (
                    <ActivityIndicator size="small" color={Brand.red} />
                  ) : (
                    <MaterialCommunityIcons
                      name={savedEventIds.has(item.id) ? "bookmark" : "bookmark-outline"}
                      size={21}
                      color={Brand.red}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12, backgroundColor: Brand.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  brand: { fontSize: 13, fontWeight: "700", color: Brand.red, letterSpacing: 0.5 },
  title: { fontFamily: Typography.heading, fontSize: 27, fontWeight: "800", color: Brand.dark, marginTop: 2 },
  greeting: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  notice: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: Brand.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Brand.greyLight, padding: 14, marginBottom: 14 },
  noticeIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: Brand.redLight },
  noticeCopy: { flex: 1 },
  noticeTitle: { fontFamily: Typography.heading, fontSize: 14, fontWeight: "800", color: Brand.dark },
  noticeText: { fontSize: 12, color: Brand.greyMid, marginTop: 4, lineHeight: 17 },
  feedback: { color: Brand.greyMid, fontSize: 13, marginBottom: 10 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: Brand.grey, fontSize: 13 },
  stateCard: { backgroundColor: Brand.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Brand.greyLight, padding: 22, alignItems: "flex-start", gap: 8 },
  stateTitle: { fontFamily: Typography.heading, fontSize: 17, fontWeight: "800", color: Brand.dark },
  stateText: { color: Brand.greyMid, fontSize: 14, lineHeight: 20 },
  retryButton: { backgroundColor: Brand.red, borderRadius: Radius.md, paddingHorizontal: 15, paddingVertical: 10, marginTop: 6 },
  retryText: { color: Brand.white, fontSize: 13, fontWeight: "700" },
  listContent: { paddingBottom: 28 },
  card: { position: "relative", marginBottom: 12, borderRadius: Radius.lg, backgroundColor: Brand.white, borderWidth: 1, borderColor: Brand.greyLight, overflow: "hidden" },
  cardOpenArea: { flexDirection: "row", minHeight: 126, paddingRight: 50 },
  cardImage: { width: 118, minHeight: 126, backgroundColor: Brand.redLight },
  cardImagePlaceholder: { width: 118, minHeight: 126, alignItems: "center", justifyContent: "center", backgroundColor: Brand.redLight },
  cardBody: { flex: 1, padding: 14, justifyContent: "center" },
  cardHeading: { flexDirection: "row", gap: 8, alignItems: "flex-start", justifyContent: "space-between" },
  cardTitle: { flex: 1, fontFamily: Typography.heading, fontSize: 15, lineHeight: 20, fontWeight: "800", color: Brand.dark },
  cardCategory: { color: Brand.red, fontSize: 11, fontWeight: "700", textTransform: "capitalize", marginTop: 5 },
  cardMeta: { fontSize: 12, color: Brand.greyMid, lineHeight: 17, marginTop: 7 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cardPrice: { color: Brand.dark, fontWeight: "700", fontSize: 12 },
  cardGoing: { color: Brand.grey, fontSize: 11 },
  saveButton: { position: "absolute", right: 10, top: 10, width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: Brand.redLight },
});
