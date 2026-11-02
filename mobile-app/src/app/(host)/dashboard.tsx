import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../contexts/AuthContext";
import { getHostEvents } from "../../services/events";
import { StatusBadge } from "../../components/host/status-badge";
import { LogoutButton } from "../../components/logout-button";
import { Brand, Radius, Typography } from "../../constants/brand";
import type { EventWithId } from "../../types";

export default function HostDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loading = Boolean(user && loadedUserId !== user.uid);

  const loadEvents = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setEvents(await getHostEvents(user.uid));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load your events.");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };

    getHostEvents(user.uid)
      .then((hostEvents) => {
        if (active) {
          setEvents(hostEvents);
          setErrorMessage(null);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load your events.");
        }
      })
      .finally(() => {
        if (active) setLoadedUserId(user.uid);
      });

    return () => { active = false; };
  }, [user]);

  const pendingCount = events.filter((event) => event.status === "pending").length;
  const approvedCount = events.filter((event) => event.status === "approved").length;
  const totalRsvps = events.reduce((total, event) => total + event.rsvpCount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.brand}>PopUpGp · HOST</Text>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.greeting}>
              {profile?.displayName ? `Welcome back, ${profile.displayName}` : "Your events at a glance"}
            </Text>
          </View>
          <LogoutButton inline />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadEvents();
              }}
              tintColor={Brand.red}
            />
          }
          contentContainerStyle={styles.content}
        >
          <View style={styles.metrics}>
            <MetricCard label="Total events" value={events.length} icon="calendar-multiple" />
            <MetricCard label="Awaiting review" value={pendingCount} icon="clock-outline" />
            <MetricCard label="Approved" value={approvedCount} icon="check-circle-outline" />
            <MetricCard label="Guest RSVPs" value={totalRsvps} icon="account-group-outline" />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.createButton}
            onPress={() => router.push("/(host)/create-event")}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={23} color={Brand.white} />
            <Text style={styles.createButtonText}>Create an event</Text>
            <MaterialCommunityIcons name="arrow-right" size={21} color={Brand.white} />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recent events</Text>
              <Text style={styles.sectionSubtitle}>Track approvals and guest interest.</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(host)/my-events")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {!user ? (
            <View style={styles.emptyCard}>
              <Text style={styles.errorText}>Sign in again to view your host dashboard.</Text>
            </View>
          ) : loading ? (
            <ActivityIndicator style={styles.loading} size="large" color={Brand.red} />
          ) : errorMessage ? (
            <View style={styles.emptyCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => void loadEvents()}>
                <Text style={styles.retry}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-plus" size={34} color={Brand.red} />
              <Text style={styles.emptyTitle}>Your first event starts here</Text>
              <Text style={styles.emptyCopy}>Create a popup and track its approval right from your dashboard.</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={[...events].sort((a, b) => b.startAt.getTime() - a.startAt.getTime()).slice(0, 3)}
              keyExtractor={(event) => event.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.eventCard}
                  onPress={() => router.push({ pathname: "/(host)/event/[id]", params: { id: item.id } })}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.eventMeta}>
                      {item.startAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      {" · "}{item.rsvpCount} RSVPs
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </TouchableOpacity>
              )}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: "calendar-multiple" | "clock-outline" | "check-circle-outline" | "account-group-outline" }) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={21} color={Brand.red} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  container: { flex: 1, backgroundColor: Brand.bg, paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  headerCopy: { flex: 1, marginRight: 8 },
  brand: { color: Brand.red, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 28, fontWeight: "800", marginTop: 3 },
  greeting: { color: Brand.grey, fontSize: 13, marginTop: 4 },
  content: { paddingBottom: 24 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  metricCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 112,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    backgroundColor: Brand.white,
  },
  metricValue: { color: Brand.dark, fontSize: 25, fontWeight: "800", marginTop: 6 },
  metricLabel: { color: Brand.grey, fontSize: 12, marginTop: 2 },
  createButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: Brand.red,
    marginBottom: 24,
  },
  createButtonText: { flex: 1, color: Brand.white, fontSize: 15, fontWeight: "700", marginLeft: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: Brand.grey, fontSize: 12, marginTop: 3 },
  seeAll: { color: Brand.red, fontSize: 13, fontWeight: "700" },
  loading: { marginTop: 28 },
  emptyCard: { alignItems: "center", padding: 22, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.greyLight, backgroundColor: Brand.white },
  emptyTitle: { color: Brand.dark, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyCopy: { color: Brand.grey, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  errorText: { color: Brand.red, fontSize: 13, textAlign: "center" },
  retry: { color: Brand.red, fontWeight: "700", marginTop: 10 },
  eventCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, marginBottom: 9, backgroundColor: Brand.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.greyLight },
  eventInfo: { flex: 1 },
  eventTitle: { color: Brand.dark, fontSize: 14, fontWeight: "700" },
  eventMeta: { color: Brand.grey, fontSize: 12, marginTop: 5 },
});
