import { Text, View } from "react-native";
import { Brand } from "../../constants/brand";
import { hostFormStyles as s } from "./screen-header";

type Props = { value: Date; onChange: (date: Date) => void };
const pad = (value: number) => String(value).padStart(2, "0");

export function EventDateTimeField({ value, onChange }: Props) {
  const dateValue = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const timeValue = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  const inputStyle = {
    flex: 1,
    minWidth: 0,
    boxSizing: "border-box" as const,
    border: `1.5px solid ${Brand.greyLight}`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: Brand.white,
    color: Brand.dark,
    fontSize: 14,
    fontFamily: "inherit",
  };

  return (
    <View>
      <Text style={s.label}>Start date & time *</Text>
      <View style={[s.row, { gap: 8 }]}>
        <input
          aria-label="Event start date"
          type="date"
          value={dateValue}
          style={inputStyle}
          onChange={(event) => {
            const [year, month, day] = event.target.value.split("-").map(Number);
            if (!year || !month || !day) return;
            const next = new Date(value);
            next.setFullYear(year, month - 1, day);
            onChange(next);
          }}
        />
        <input
          aria-label="Event start time"
          type="time"
          value={timeValue}
          style={inputStyle}
          onChange={(event) => {
            const [hours, minutes] = event.target.value.split(":").map(Number);
            if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
            const next = new Date(value);
            next.setHours(hours, minutes, 0, 0);
            onChange(next);
          }}
        />
      </View>
    </View>
  );
}
