import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getEvent, updateEvent } from "../../services/events";
import { getGeohash } from "../../utils/geohash";
import { HostScreenHeader, hostFormStyles as s } from "../../components/host/screen-header";
import { Brand } from "../../constants/brand";

const CATEGORIES = ["music", "food", "sports", "arts", "markets", "nightlife", "other"];

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
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getEvent(id).then((event) => {
      if (!event) {
        Alert.alert("Event not found");
        router.back();
        return;
      }
      if (event.status !== "pending" && event.status !== "rejected") {
        Alert.alert("Cannot edit", "Only pending or rejected events can be edited.");
        router.back();
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
      setLoading(false);
    });
  }, [id, router]);

  const openPicker = (mode: "date" | "time") => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onPickerChange = (_: any, selected?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selected) {
      const updated = new Date(startAt);
      if (pickerMode === "date") {
        updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      } else {
        updated.setHours(selected.getHours(), selected.getMinutes());
      }
      setStartAt(updated);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    if (!title || !description || !address || !lat || !lng) {
      return Alert.alert("Please fill in all required fields");
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      return Alert.alert("Latitude and longitude must be numbers");
    }

    const endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);

    setSaving(true);
    try {
      await updateEvent(id, {
        title,
        description,
        category,
        location: { lat: latNum, lng: lngNum, address },
        geohash: getGeohash(latNum, lngNum),
        startAt,
        endAt,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        ticketPrice: ticketPrice ? parseFloat(ticketPrice) : undefined,
      });
      Alert.alert("Event updated!", "Your event is pending admin approval again.");
      router.replace({ pathname: "/(host)/event/[id]", params: { id } } as any);
    } catch (e: any) {
      Alert.alert("Failed to update event", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Brand.white, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Brand.red} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Brand.white }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HostScreenHeader title="Edit Event" subtitle="Update your event details" showBack />

          <Text style={s.label}>Title *</Text>
          <TextInput
            placeholder="e.g. Sunset Rooftop Jazz Night"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
            style={s.input}
          />

          <Text style={s.label}>Description *</Text>
          <TextInput
            placeholder="What's happening, who's it for, what to expect..."
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[s.input, { height: 100, textAlignVertical: "top" }]}
          />

          <Text style={s.label}>Category *</Text>
          <View style={s.categoryRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.categoryChip, category === c && s.categoryChipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[s.categoryText, category === c && s.categoryTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Address *</Text>
          <TextInput
            placeholder="e.g. 44 Stanley Ave, Milpark, Johannesburg"
            placeholderTextColor="#aaa"
            value={address}
            onChangeText={setAddress}
            style={s.input}
          />

          <Text style={s.label}>Coordinates *</Text>
          <View style={s.row}>
            <TextInput
              placeholder="Latitude e.g. -26.2041"
              placeholderTextColor="#aaa"
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
              style={[s.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Longitude e.g. 28.0473"
              placeholderTextColor="#aaa"
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
              style={[s.input, { flex: 1 }]}
            />
          </View>

          <Text style={s.label}>Start date & time *</Text>
          <View style={s.row}>
            <TouchableOpacity
              style={[s.pickerBtn, { flex: 1, marginRight: 8 }]}
              onPress={() => openPicker("date")}
            >
              <Text style={s.pickerBtnText}>
                📅{" "}
                {startAt.toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pickerBtn, { flex: 1 }]}
              onPress={() => openPicker("time")}
            >
              <Text style={s.pickerBtnText}>
                🕐 {startAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={startAt}
              mode={pickerMode}
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onPickerChange}
            />
          )}

          <Text style={s.label}>Capacity & ticket price (optional)</Text>
          <View style={s.row}>
            <TextInput
              placeholder="Max attendees"
              placeholderTextColor="#aaa"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              style={[s.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Price (ZAR)"
              placeholderTextColor="#aaa"
              value={ticketPrice}
              onChangeText={setTicketPrice}
              keyboardType="numeric"
              style={[s.input, { flex: 1 }]}
            />
          </View>

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
