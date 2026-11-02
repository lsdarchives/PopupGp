import { Platform } from "react-native";

import MapNative from "./map.native";
import MapWeb from "./map.web";

export default function UserMapRoute() {
  if (Platform.OS === "web") {
    return <MapWeb />;
  }

  return <MapNative />;
}
