import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../contexts/AuthContext";
import { removeSavedEvent, getUpcomingSavedEvents } from "../../services/saved-events";
import { Brand, Radius, Typography } from "../../constants/brand";
import type { EventWithId } from "../../types";

export default function SavedEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSavedEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setEvents(await getUpcomingSavedEvents(user.uid));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load saved events.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadSavedEvents();
    }, [loadSavedEvents])
  );

  const removeEvent = async (eventId: string) => {
    if (!user) return;
    setRemovingId(eventId);
    setError(null);
    try {
      await removeSavedEvent(user.uid, eventId);
      setEvents((current) => current.filter((event) => event.id !== eventId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove saved event.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Brand.red} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>PopUpGp</Text>
        <Text style={styles.title}>Saved Events</Text>
        <Text style={styles.subtitle}>Upcoming approved events you saved.</Text>

        {error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void loadSavedEvents()}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Brand.red} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bookmark-outline" size={42} color={Brand.grey} />
            <Text style={styles.emptyTitle}>No saved events yet</Text>
            <Text style={styles.emptyText}>Save an event from Browse or its detail page to find it here.</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(event) => event.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(user)/event/[id]", params: { id: item.id } })}
              >
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.eventDate}>
                    {item.startAt.toLocaleDateString("en-ZA", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                  <Text style={styles.eventLocation} numberOfLines={1}>{item.location.address}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title} from saved events`}
                  disabled={removingId === item.id}
                  onPress={(pressEvent) => {
                    pressEvent.stopPropagation();
                    void removeEvent(item.id);
                  }}
                >
                  {removingId === item.id ? (
                    <ActivityIndicator color={Brand.red} />
                  ) : (
                    <MaterialCommunityIcons name="bookmark-remove-outline" size={22} color={Brand.red} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
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
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 18 },
  backText: { color: Brand.red, fontSize: 14, fontWeight: "700" },
  brand: { color: Brand.red, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  title: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 28, fontWeight: "800", marginTop: 2 },
  subtitle: { color: Brand.greyMid, fontSize: 14, marginTop: 6, marginBottom: 18 },
  list: { paddingBottom: 32 },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
  },
  eventInfo: { flex: 1, paddingRight: 12 },
  eventTitle: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 16, fontWeight: "700" },
  eventDate: { color: Brand.red, fontSize: 13, fontWeight: "600", marginTop: 8 },
  eventLocation: { color: Brand.greyMid, fontSize: 13, marginTop: 4 },
  removeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  emptyTitle: { color: Brand.dark, fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptyText: { color: Brand.greyMid, fontSize: 14, textAlign: "center", lineHeight: 20, marginTop: 6 },
  messageBox: { marginBottom: 12 },
  errorText: { color: Brand.red, fontSize: 13 },
  retryText: { color: Brand.red, fontSize: 13, fontWeight: "700", marginTop: 5 },
});
