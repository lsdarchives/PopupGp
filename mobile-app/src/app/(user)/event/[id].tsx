import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { getEvent, getUserRsvpForEvent, toggleRsvp } from "../../../services/events";
import { startTicketCheckout } from "../../../services/payments";
import { StatusBadge } from "../../../components/host/status-badge";
import { Brand, Radius, Typography } from "../../../constants/brand";
import type { EventWithId } from "../../../types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSavedEvents } from "../../../hooks/use-saved-events";

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
  const {
    savedEventIds,
    loadingSavedEvents,
    savingEventId,
    savedEventsError,
    toggleSavedEvent,
  } = useSavedEvents(user?.uid);
  const [event, setEvent] = useState<EventWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const isPaidEvent = Boolean(event?.ticketPrice && event.ticketPrice > 0);

  useEffect(() => {
    let active = true;

    const loadEvent = async () => {
      setLoading(true);
      setLoadError(null);
      setActionMessage(null);

      try {
        if (!id) {
          throw new Error("This event link is missing its event ID.");
        }

        const loadedEvent = await getEvent(id);
        if (!active) return;
        setEvent(loadedEvent);

        if (user && loadedEvent) {
          const rsvp = await getUserRsvpForEvent(id, user.uid);
          if (!active) return;
          setIsGoing(Boolean(rsvp));
          setHasTicket(Boolean(rsvp?.ticketPurchased));
        } else {
          setIsGoing(false);
          setHasTicket(false);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load this event."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadEvent();
    return () => {
      active = false;
    };
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
        <Text style={styles.errorText}>{loadError ?? "Event not found"}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleRsvp = async () => {
    if (!event || !user) {
      setActionMessage("Please sign in to RSVP for this event.");
      return;
    }

    setActing(true);
    setActionMessage(null);
    try {
      const result = await toggleRsvp(event.id);
      setIsGoing(result.isGoing);
      setActionMessage(
        result.isGoing ? "You’re on the guest list." : "Your RSVP has been removed."
      );
      try {
        const refreshed = await getEvent(event.id);
        setEvent(refreshed);
      } catch (error) {
        console.error("RSVP changed, but the event count could not be refreshed.", error);
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to update your RSVP."
      );
    } finally {
      setActing(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!event || !user) {
      setSavedMessage("Sign in to save events.");
      return;
    }
    try {
      const saved = await toggleSavedEvent(event.id);
      setSavedMessage(saved ? "Event saved." : "Event removed from saved events.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Could not update saved events.");
    }
  };

  const handleTicketAction = async () => {
    if (!event || !user) {
      setActionMessage("Please sign in to reserve a ticket.");
      return;
    }

    if (!isPaidEvent) {
      await handleRsvp();
      return;
    }

    if (hasTicket) {
      setActionMessage("Your paid ticket is already confirmed for this event.");
      return;
    }

    setActing(true);
    setActionMessage(null);
    try {
      const result = await startTicketCheckout(event.id);
      if (!result.hasTicket) {
        throw new Error(
          "Payment completed, but ticket confirmation did not succeed. Please contact support before trying again."
        );
      }

      setHasTicket(true);
      setIsGoing(true);
      setActionMessage("Payment confirmed. Your ticket is saved.");
      try {
        const refreshed = await getEvent(event.id);
        setEvent(refreshed);
      } catch (error) {
        console.error("Ticket confirmed, but the event count could not be refreshed.", error);
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to complete ticket checkout."
      );
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

        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.heroImage} contentFit="cover" />
        ) : null}

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
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSaveEvent}
            disabled={loadingSavedEvents || savingEventId === event.id}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={savedEventIds.has(event.id) ? "bookmark" : "bookmark-outline"}
              size={20}
              color={Brand.red}
            />
            <Text style={styles.secondaryBtnText}>
              {savingEventId === event.id
                ? "Saving..."
                : savedEventIds.has(event.id)
                  ? "Remove from saved events"
                  : "Save event"}
            </Text>
          </TouchableOpacity>
          {savedMessage || savedEventsError ? (
            <Text style={styles.actionMessage} accessibilityLiveRegion="polite" accessibilityRole="alert">
              {savedMessage ?? savedEventsError}
            </Text>
          ) : null}
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {isGoing
                ? hasTicket
                  ? "You have a confirmed ticket for this event."
                  : "You’re on the guest list for this event."
                : isPaidEvent
                  ? "Buy a ticket to join this event."
                  : "Tap RSVP to join this event."}
            </Text>
            <Text style={styles.meta}>Guests: {event.rsvpCount}</Text>
          </View>

          {actionMessage ? (
            <Text
              style={styles.actionMessage}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {actionMessage}
            </Text>
          ) : null}

          {isPaidEvent ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleTicketAction} disabled={acting || hasTicket}>
              <Text style={styles.primaryBtnText}>
                {acting ? "Opening checkout..." : hasTicket ? "Ticket Purchased" : `Buy Ticket - R${event.ticketPrice}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRsvp} disabled={acting}>
              <Text style={styles.primaryBtnText}>{acting ? "Working..." : isGoing ? "Cancel RSVP" : "RSVP"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
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
  title: { fontFamily: Typography.heading, fontSize: 26, fontWeight: "800", color: Brand.dark, flex: 1, lineHeight: 32 },
  heroImage: { width: "100%", height: 210, borderRadius: Radius.lg, marginBottom: 18, backgroundColor: Brand.redLight },
  category: {
    color: Brand.grey,
    fontSize: 14,
    textTransform: "capitalize",
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Brand.white,
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
  actionMessage: { fontSize: 14, color: Brand.dark, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: Brand.red,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  primaryBtnText: { color: Brand.white, fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 2,
    borderColor: Brand.red,
    padding: 14,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  secondaryBtnText: { color: Brand.red, fontWeight: "600", fontSize: 15 },
  errorText: { fontSize: 16, color: Brand.grey, marginBottom: 12 },
});
