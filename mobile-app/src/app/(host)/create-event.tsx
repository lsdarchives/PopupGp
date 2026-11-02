import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { ImagePickerAsset } from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { createEvent, updateEventImage } from "../../services/events";
import { deleteEventImage, uploadEventImage } from "../../services/event-images";
import { EVENT_CATEGORIES, validateEventForm } from "../../utils/event-form";
import { HostScreenHeader, hostFormStyles as s } from "../../components/host/screen-header";
import { Brand, Radius, Typography } from "../../constants/brand";
import { EventImageField } from "../../components/host/event-image-field";
import { EventDateTimeField } from "../../components/host/event-date-time-field";
import { EventLocationField } from "../../components/host/event-location-field";

const getSuggestedEventDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date;
};

interface CreatedEventReceipt {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  startAt: Date;
  capacity?: number;
  ticketPrice: number;
}

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [startAt, setStartAt] = useState(getSuggestedEventDate);
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageUploadWarning, setImageUploadWarning] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<CreatedEventReceipt | null>(null);
  const [imageAsset, setImageAsset] = useState<ImagePickerAsset | null>(null);

  const handleCreate = async () => {
    if (!user) {
      setFormError("Sign in again before creating an event.");
      return;
    }
    const validation = validateEventForm({
      title,
      description,
      category,
      address,
      latitude: lat,
      longitude: lng,
      startAt,
      capacity,
      ticketPrice,
    });
    if ("error" in validation) {
      setFormError(validation.error);
      return;
    }
    setFormError(null);
    setImageUploadWarning(null);

    setLoading(true);
    try {
      const event = validation.value;
      const eventId = await createEvent(
        user.uid,
        event.title,
        event.description,
        event.category,
        event.location,
        event.geohash,
        event.startAt,
        event.endAt,
        event.capacity,
        event.ticketPrice,
      );
      const receipt: CreatedEventReceipt = {
        id: eventId,
        title: event.title,
        description: event.description,
        category: event.category,
        address: event.location.address,
        startAt: event.startAt,
        capacity: event.capacity,
        ticketPrice: event.ticketPrice,
      };
      if (imageAsset) {
        try {
          const uploaded = await uploadEventImage(user.uid, eventId, imageAsset);
          try {
            await updateEventImage(eventId, uploaded);
          } catch (error) {
            await deleteEventImage(uploaded.imagePath).catch(() => undefined);
            throw error;
          }
        } catch (error) {
          setImageUploadWarning(
            `${error instanceof Error ? error.message : "The image could not be uploaded."} The event was created, but it is still pending approval. You can add the image later from the event editor.`
          );
          setCreatedEvent(receipt);
          return;
        }
      }
      setCreatedEvent(receipt);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create the event. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, flexGrow: 1, backgroundColor: Brand.bg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HostScreenHeader
            title={createdEvent ? "Event Created" : "Create Event"}
            subtitle={createdEvent ? "Your event has been submitted" : "Where the city comes alive"}
            showBack={!createdEvent}
          />

          {createdEvent ? (
            <View style={styles.receipt}>
              <View style={styles.receiptHeading}>
                <MaterialCommunityIcons name="check-circle" size={30} color="#217A50" />
                <View style={styles.receiptHeadingCopy}>
                  <Text style={styles.receiptTitle}>Your event is created</Text>
                  <Text style={styles.receiptSubtitle}>It is now waiting for admin approval.</Text>
                </View>
              </View>

              {imageUploadWarning ? (
                <Text accessibilityRole="alert" style={s.error}>{imageUploadWarning}</Text>
              ) : null}

              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{createdEvent.title}</Text>
                <Text style={styles.eventCategory}>{createdEvent.category}</Text>
                <Text style={styles.eventDescription}>{createdEvent.description}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Venue</Text>
                  <Text style={styles.detailValue}>{createdEvent.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & time</Text>
                  <Text style={styles.detailValue}>{createdEvent.startAt.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Capacity</Text>
                  <Text style={styles.detailValue}>{createdEvent.capacity ?? "Not specified"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ticket price</Text>
                  <Text style={styles.detailValue}>R {createdEvent.ticketPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.statusValue}>Pending approval</Text>
                </View>
                <View style={styles.eventIdBlock}>
                  <Text style={styles.detailLabel}>Event ID</Text>
                  <Text selectable style={styles.eventId}>{createdEvent.id}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.replace("/(host)/my-events")}
                style={styles.primaryAction}
                accessibilityRole="button"
              >
                <Text style={styles.primaryActionText}>Go to My Events</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.replace("/(host)/dashboard")}
                style={styles.secondaryAction}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryActionText}>Go to Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!createdEvent ? <>
          <Text style={s.label}>Title *</Text>
          <TextInput
            placeholder="e.g. Sunset Rooftop Jazz Night"
            placeholderTextColor={Brand.grey}
            value={title}
            onChangeText={setTitle}
            style={s.input}
          />

          <Text style={s.label}>Description *</Text>
          <TextInput
            placeholder="What's happening, who's it for, what to expect..."
            placeholderTextColor={Brand.grey}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[s.input, { height: 100, textAlignVertical: "top" }]}
          />

          <Text style={s.label}>Category *</Text>
          <View style={s.categoryRow}>
            {EVENT_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.categoryChip, category === c && s.categoryChipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[s.categoryText, category === c && s.categoryTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <EventLocationField
            address={address}
            onAddressChange={(value) => {
              setAddress(value);
              setLat("");
              setLng("");
            }}
            onLatitudeChange={setLat}
            onLongitudeChange={setLng}
          />

          <EventDateTimeField value={startAt} onChange={setStartAt} />
          <Text style={s.label}>Capacity & ticket price (optional)</Text>
          <View style={s.row}>
            <TextInput
              placeholder="Max attendees"
              placeholderTextColor={Brand.grey}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              style={[s.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Price (ZAR)"
              placeholderTextColor={Brand.grey}
              value={ticketPrice}
              onChangeText={setTicketPrice}
              keyboardType="numeric"
              style={[s.input, { flex: 1 }]}
            />
          </View>

          <EventImageField
            imageUri={imageAsset?.uri}
            onSelect={setImageAsset}
            onRemove={() => setImageAsset(null)}
          />

          {formError ? <Text accessibilityRole="alert" style={s.error}>{formError}</Text> : null}

          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={s.buttonText}>
              {loading ? "Creating..." : "Create Event"}
            </Text>
          </TouchableOpacity>
          </> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  receipt: {
    padding: 20,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    borderRadius: Radius.lg,
    backgroundColor: Brand.white,
  },
  receiptHeading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  receiptHeadingCopy: { flex: 1 },
  receiptTitle: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 18, fontWeight: "800" },
  receiptSubtitle: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 13, lineHeight: 19, marginTop: 3 },
  eventDetails: { padding: 16, borderRadius: Radius.md, backgroundColor: Brand.bg },
  eventTitle: { color: Brand.dark, fontFamily: Typography.heading, fontSize: 20, fontWeight: "800" },
  eventCategory: { color: Brand.red, fontFamily: Typography.body, fontSize: 12, fontWeight: "700", textTransform: "capitalize", marginTop: 4 },
  eventDescription: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 13, lineHeight: 19, marginTop: 10, marginBottom: 6 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Brand.greyLight },
  detailLabel: { color: Brand.greyMid, fontFamily: Typography.body, fontSize: 12, fontWeight: "600" },
  detailValue: { flex: 1, color: Brand.dark, fontFamily: Typography.body, fontSize: 12, textAlign: "right" },
  statusRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Brand.greyLight },
  statusValue: { color: "#865700", fontFamily: Typography.body, fontSize: 12, fontWeight: "700" },
  eventIdBlock: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Brand.greyLight },
  eventId: { color: Brand.dark, fontFamily: Typography.body, fontSize: 12, marginTop: 5 },
  primaryAction: { minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 18, borderRadius: Radius.md, backgroundColor: Brand.red },
  primaryActionText: { color: Brand.white, fontFamily: Typography.body, fontSize: 14, fontWeight: "700" },
  secondaryAction: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Brand.greyLight },
  secondaryActionText: { color: Brand.dark, fontFamily: Typography.body, fontSize: 14, fontWeight: "600" },
});
