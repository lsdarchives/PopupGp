import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { cancelEvent, deleteEvent, getEvent } from "../../../services/events";
import { StatusBadge } from "../../../components/host/status-badge";
import { Brand, Radius } from "../../../constants/brand";
import type { EventStatus, EventWithId } from "../../../types";

function canManage(status: EventStatus) {
  return status === "pending" || status === "rejected";
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEvent(id)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = () => {
    if (!event) return;
    Alert.alert(
      "Cancel event?",
      "This will mark the event as cancelled. You can create a new one anytime.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Event",
          style: "destructive",
          onPress: async () => {
            setActing(true);
            try {
              await cancelEvent(event.id);
              router.replace("/(host)/my-events");
            } catch (e: any) {
              Alert.alert("Failed to cancel", e.message);
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!event) return;
    Alert.alert(
      "Delete event?",
      "This permanently removes the event. This cannot be undone.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActing(true);
            try {
              await deleteEvent(event.id);
              router.replace("/(host)/my-events");
            } catch (e: any) {
              Alert.alert("Failed to delete", e.message);
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Brand.red} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (user && event.hostId !== user.uid) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>You don't have access to this event</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const manageable = canManage(event.status);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{event.title}</Text>
          <StatusBadge status={event.status} />
        </View>

        <Text style={styles.category}>{event.category}</Text>

        {event.status === "pending" && (
          <View style={[styles.banner, styles.bannerPending]}>
            <Text style={styles.bannerText}>Awaiting admin approval</Text>
          </View>
        )}
        {event.status === "rejected" && (
          <View style={[styles.banner, styles.bannerRejected]}>
            <Text style={styles.bannerTextRejected}>
              Rejected — edit and resubmit, or delete
            </Text>
          </View>
        )}

        <InfoCard label="Description">
          <Text style={styles.body}>{event.description}</Text>
        </InfoCard>

        <InfoCard label="When">
          <Text style={styles.body}>
            {event.startAt.toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={styles.meta}>
            {event.startAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </InfoCard>

        <InfoCard label="Location">
          <Text style={styles.body}>{event.location.address}</Text>
          <Text style={styles.meta}>
            {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
          </Text>
        </InfoCard>

        {(event.capacity != null || event.ticketPrice != null) && (
          <InfoCard label="Details">
            {event.capacity != null && (
              <Text style={styles.body}>Capacity: {event.capacity} attendees</Text>
            )}
            {event.ticketPrice != null && event.ticketPrice > 0 && (
              <Text style={styles.body}>Ticket: R{event.ticketPrice}</Text>
            )}
            {event.ticketPrice === 0 && <Text style={styles.body}>Free entry</Text>}
          </InfoCard>
        )}

        {manageable && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() =>
                router.push({ pathname: "/(host)/edit-event", params: { id: event.id } } as any)
              }
              disabled={acting}
            >
              <Text style={styles.primaryBtnText}>Edit Event</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancel} disabled={acting}>
              <Text style={styles.secondaryBtnText}>
                {acting ? "Working..." : "Cancel Event"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerBtn} onPress={handleDelete} disabled={acting}>
              <Text style={styles.dangerBtnText}>Delete Permanently</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.white },
  content: { padding: 24, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Brand.white,
  },
  backBtn: { marginBottom: 16 },
  backLink: { color: Brand.red, fontSize: 14, fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 6,
  },
  title: { fontSize: 26, fontWeight: "800", color: Brand.dark, flex: 1, lineHeight: 32 },
  category: {
    color: Brand.grey,
    fontSize: 14,
    textTransform: "capitalize",
    marginBottom: 16,
  },
  banner: {
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  bannerPending: { backgroundColor: "#FFF8EE" },
  bannerRejected: { backgroundColor: Brand.redLight },
  bannerText: { color: "#B8860B", fontSize: 13, fontWeight: "600", textAlign: "center" },
  bannerTextRejected: { color: Brand.red, fontSize: 13, fontWeight: "600", textAlign: "center" },
  infoCard: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.greyLight,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Brand.grey,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  body: { fontSize: 15, color: Brand.dark, lineHeight: 22 },
  meta: { fontSize: 13, color: Brand.grey, marginTop: 4 },
  actions: { marginTop: 12, gap: 10 },
  primaryBtn: {
    backgroundColor: Brand.red,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  primaryBtnText: { color: Brand.white, fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: Brand.red,
    padding: 14,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  secondaryBtnText: { color: Brand.red, fontWeight: "600", fontSize: 15 },
  dangerBtn: { padding: 14, alignItems: "center" },
  dangerBtnText: { color: "#D9453D", fontWeight: "600", fontSize: 14 },
  errorText: { fontSize: 16, color: Brand.grey, marginBottom: 12 },
});
