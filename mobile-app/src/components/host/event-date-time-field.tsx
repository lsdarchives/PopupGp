import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { hostFormStyles as s } from "./screen-header";

type Props = { value: Date; onChange: (date: Date) => void };

export function EventDateTimeField({ value, onChange }: Props) {
  const [mode, setMode] = useState<"date" | "time">("date");
  const [visible, setVisible] = useState(false);

  const open = (nextMode: "date" | "time") => {
    setMode(nextMode);
    setVisible(true);
  };

  return (
    <View>
      <Text style={s.label}>Start date & time *</Text>
      <View style={s.row}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Choose date, ${value.toLocaleDateString("en-ZA")}`}
          style={[s.pickerBtn, { flex: 1, marginRight: 8 }]}
          onPress={() => open("date")}
        >
          <Text style={s.pickerBtnText}>Date · {value.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Choose time, ${value.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`}
          style={[s.pickerBtn, { flex: 1 }]}
          onPress={() => open("time")}
        >
          <Text style={s.pickerBtnText}>Time · {value.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</Text>
        </TouchableOpacity>
      </View>
      {visible && Platform.OS !== "web" && (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            if (event.type === "dismissed") {
              setVisible(false);
              return;
            }
            if (selected) {
              const next = new Date(value);
              if (mode === "date") {
                next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
              } else {
                next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
              }
              onChange(next);
            }
            if (Platform.OS !== "ios") setVisible(false);
          }}
        />
      )}
    </View>
  );
}
