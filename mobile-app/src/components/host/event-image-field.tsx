import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { Brand, Radius, Typography } from "../../constants/brand";
import { MAX_EVENT_IMAGE_BYTES } from "../../services/event-images";

interface EventImageFieldProps {
  imageUri?: string | null;
  onSelect: (asset: ImagePickerAsset) => void;
  onRemove: () => void;
}

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function EventImageField({ imageUri, onSelect, onRemove }: EventImageFieldProps) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseImage = async () => {
    setError(null);
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;
      if (!asset.mimeType || !imageTypes.has(asset.mimeType.toLowerCase())) {
        setError("Choose a JPEG, PNG, or WebP image.");
        return;
      }
      if (asset.fileSize != null && asset.fileSize > MAX_EVENT_IMAGE_BYTES) {
        setError("Choose an image that is 5 MB or smaller.");
        return;
      }
      onSelect(asset);
    } catch {
      setError("Could not open your photos. Please try again.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Event image (optional)</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Add a photo to your event</Text>
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.button}
          disabled={picking}
          onPress={chooseImage}
        >
          <Text style={styles.buttonText}>{picking ? "Opening photos..." : imageUri ? "Choose another" : "Choose image"}</Text>
        </TouchableOpacity>
        {imageUri ? (
          <TouchableOpacity accessibilityRole="button" style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.hint}>JPEG, PNG, or WebP. Maximum 5 MB.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 18, marginBottom: 8 },
  label: { fontFamily: Typography.body, fontSize: 14, fontWeight: "700", color: Brand.dark, marginBottom: 8 },
  preview: { width: "100%", height: 190, borderRadius: Radius.md, backgroundColor: Brand.redLight },
  placeholder: {
    width: "100%",
    height: 120,
    borderRadius: Radius.md,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.greyLight,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: Brand.grey, fontFamily: Typography.body, fontSize: 14 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  button: { backgroundColor: Brand.dark, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: Brand.white, fontWeight: "700", fontSize: 13 },
  removeButton: { paddingHorizontal: 12, paddingVertical: 10 },
  removeText: { color: Brand.red, fontWeight: "700", fontSize: 13 },
  hint: { color: Brand.grey, fontFamily: Typography.body, fontSize: 12, marginTop: 8 },
  error: { color: Brand.red, fontSize: 13, marginTop: 6 },
});
