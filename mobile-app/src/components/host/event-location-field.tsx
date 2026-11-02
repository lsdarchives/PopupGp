import { useState } from "react";
import { ActivityIndicator, Linking, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Brand } from "../../constants/brand";
import { geocodeAddress } from "../../utils/geocode-address";
import { hostFormStyles as s } from "./screen-header";

type Props = {
  address: string;
  onAddressChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

export function EventLocationField({ address, onAddressChange, onLatitudeChange, onLongitudeChange }: Props) {
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState("");

  const findVenue = async () => {
    if (!address.trim()) {
      setMessage("Enter a venue name or address first.");
      return;
    }
    setLookingUp(true);
    setMessage("");
    try {
      const coordinates = await geocodeAddress(address);
      onLatitudeChange(String(coordinates.latitude));
      onLongitudeChange(String(coordinates.longitude));
      setMessage("Venue location found. Check the address before publishing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not find this venue. Try a more complete address.");
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <View>
      <Text style={s.label}>Venue address *</Text>
      <TextInput
        accessibilityLabel="Event address"
        placeholder="Venue name, street, suburb and city"
        placeholderTextColor={Brand.grey}
        value={address}
        onChangeText={onAddressChange}
        style={s.input}
      />
      <TouchableOpacity
        accessibilityRole="button"
        onPress={findVenue}
        disabled={lookingUp}
        style={{ minHeight: 46, borderRadius: 12, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", backgroundColor: Brand.redLight, marginBottom: 8 }}
      >
        {lookingUp ? <ActivityIndicator color={Brand.red} /> : <Text style={{ color: Brand.red, fontWeight: "700", fontSize: 13 }}>Find venue</Text>}
      </TouchableOpacity>
      {message ? <Text accessibilityRole="alert" style={[s.hint, { marginTop: 0 }]}>{message}</Text> : (
        <Text style={s.hint}>Enter the venue name or address and find it to set the map location. You don&apos;t need coordinates.</Text>
      )}
      {Platform.OS === "web" && (
        <Text
          accessibilityRole="link"
          onPress={() => Linking.openURL("https://www.openstreetmap.org/copyright")}
          style={[s.hint, { textDecorationLine: "underline" }]}
        >
          © OpenStreetMap contributors
        </Text>
      )}
    </View>
  );
}
