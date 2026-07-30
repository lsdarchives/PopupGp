import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { getEvent, getUserRsvpForEvent, purchaseTicket, toggleRsvp } from "../../../services/events";
import { StatusBadge } from "../../../components/host/status-badge";
import { Brand, Radius } from "../../../constants/brand";
import type { EventWithId } from "../../../types";

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
  const [isGoing, setIsGoing] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      const loadedEvent = await getEvent(id);
      setEvent(loadedEvent);

      if (user && loadedEvent) {
        const rsvp = await getUserRsvpForEvent(id, user.uid);
        setIsGoing(Boolean(rsvp));
        setHasTicket(Boolean(rsvp?.ticketPurchased));
      } else {
        setIsGoing(false);
        setHasTicket(false);
      }
    };

    loadEvent().finally(() => setLoading(false));
  }, [id, user]);

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

  const handleRsvp = async () => {
    if (!event || !user) {
      Alert.alert("Sign in required", "Please sign in to RSVP for this event.");
      return;
    }

    setActing(true);
    try {
      const result = await toggleRsvp(event.id, user.uid);
      setIsGoing(result.isGoing);
      const refreshed = await getEvent(event.id);
      setEvent(refreshed);
      Alert.alert(result.isGoing ? "RSVP saved" : "RSVP removed", result.isGoing ? "You’re on the guest list." : "Your RSVP has been removed.");
    } catch (error: any) {
      Alert.alert("Unable to update RSVP", error.message);
    } finally {
      setActing(false);
    }
  };

  const handlePurchase = async () => {
    if (!event || !user) {
      Alert.alert("Sign in required", "Please sign in to reserve a ticket.");
      return;
    }

    setActing(true);
    try {
      const result = await purchaseTicket(event.id, user.uid);
      setHasTicket(result.hasTicket);
      setIsGoing(true);
      const refreshed = await getEvent(event.id);
      setEvent(refreshed);
      Alert.alert(result.hasTicket ? "Ticket reserved" : "Ticket removed", result.hasTicket ? "Your ticket reservation is saved." : "Your reservation has been removed.");
    } catch (error: any) {
      Alert.alert("Unable to reserve ticket", error.message);
    } finally {
      setActing(false);
    }
  };

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

        <View style={styles.actions}>
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {isGoing
                ? hasTicket
                  ? "You have a ticket reservation for this event."
                  : "You’re on the guest list for this event."
                : "Tap RSVP to join this event."}
            </Text>
            <Text style={styles.meta}>Guests: {event.rsvpCount}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleRsvp} disabled={acting}>
            <Text style={styles.primaryBtnText}>{acting ? "Working..." : isGoing ? "Cancel RSVP" : "RSVP"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handlePurchase} disabled={acting}>
            <Text style={styles.secondaryBtnText}>
              {acting ? "Working..." : hasTicket ? "Remove Ticket" : event.ticketPrice && event.ticketPrice > 0 ? "Buy Ticket" : "Reserve Spot"}
            </Text>
          </TouchableOpacity>
        </View>
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
  actions: { marginTop: 18, gap: 12 },
  statusBox: {
    backgroundColor: Brand.bg,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.greyLight,
  },
  statusText: { fontSize: 14, color: Brand.dark, lineHeight: 20 },
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
  errorText: { fontSize: 16, color: Brand.grey, marginBottom: 12 },
});
