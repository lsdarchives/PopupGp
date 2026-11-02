import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ImagePickerAsset } from "expo-image-picker";
import { getEvent, updateEvent } from "../../services/events";
import { EVENT_CATEGORIES, validateEventForm } from "../../utils/event-form";
import { HostScreenHeader, hostFormStyles as s } from "../../components/host/screen-header";
import { Brand } from "../../constants/brand";
import { EventImageField } from "../../components/host/event-image-field";
import { deleteEventImage, uploadEventImage } from "../../services/event-images";
import { EventDateTimeField } from "../../components/host/event-date-time-field";
import { EventLocationField } from "../../components/host/event-location-field";

export default function EditEvent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [startAt, setStartAt] = useState(new Date());
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hostId, setHostId] = useState("");
  const [imageAsset, setImageAsset] = useState<ImagePickerAsset | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) return () => {
      active = false;
    };

    getEvent(id)
      .then((event) => {
        if (!active) return;
        if (!event) {
          setLoadError("Event not found.");
          return;
        }
        if (event.status !== "pending" && event.status !== "rejected") {
          setLoadError("Only pending or rejected events can be edited.");
          return;
        }
        setTitle(event.title);
        setDescription(event.description);
        setCategory(event.category);
        setAddress(event.location.address);
        setLat(String(event.location.lat));
        setLng(String(event.location.lng));
        setStartAt(event.startAt);
        setCapacity(event.capacity != null ? String(event.capacity) : "");
        setTicketPrice(event.ticketPrice != null ? String(event.ticketPrice) : "");
        setImageUrl(event.imageUrl ?? null);
        setHostId(event.hostId);
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load this event.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, router]);

  const handleSave = async () => {
    if (!id) return;
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
      setFormSuccess(null);
      return;
    }
    setFormError(null);
    setFormSuccess(null);

    setSaving(true);
    let uploadedImage: { imageUrl: string; imagePath: string } | undefined;
    let eventUpdated = false;
    try {
      const event = validation.value;
      if (imageAsset) {
        if (!hostId) throw new Error("The event owner could not be verified.");
        uploadedImage = await uploadEventImage(hostId, id, imageAsset);
      }
      await updateEvent(id, {
        ...event,
        ...(uploadedImage ? uploadedImage : {}),
        clearImage: imageRemoved && !uploadedImage,
      });
      eventUpdated = true;
      setFormSuccess("Your changes are saved. The event is pending admin approval again.");
    } catch (error) {
      if (uploadedImage && !eventUpdated) {
        await deleteEventImage(uploadedImage.imagePath).catch(() => undefined);
      }
      setFormError(error instanceof Error ? error.message : "Could not update the event. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text accessibilityRole="alert" style={s.error}>This event link is missing its event ID.</Text>
        <TouchableOpacity style={s.button} onPress={() => router.back()}>
          <Text style={s.buttonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Brand.red} />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text accessibilityRole="alert" style={s.error}>{loadError}</Text>
        <TouchableOpacity style={s.button} onPress={() => router.back()}>
          <Text style={s.buttonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          <HostScreenHeader title="Edit Event" subtitle="Update your event details" showBack />

          {formSuccess ? (
            <View style={s.successBox}>
              <Text accessibilityRole="alert" style={s.successText}>{formSuccess}</Text>
              <TouchableOpacity
                onPress={() => router.replace({ pathname: "/(host)/event/[id]", params: { id } } as any)}
                style={s.successAction}
              >
                <Text style={s.successActionText}>View updated event</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
            imageUri={imageAsset?.uri ?? (imageRemoved ? null : imageUrl)}
            onSelect={(asset) => {
              setImageAsset(asset);
              setImageRemoved(false);
            }}
            onRemove={() => {
              setImageAsset(null);
              setImageRemoved(true);
            }}
          />

          {formError ? <Text accessibilityRole="alert" style={s.error}>{formError}</Text> : null}

          <TouchableOpacity
            style={[s.button, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.buttonText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
