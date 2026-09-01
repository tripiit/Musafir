import { Icon, type IconName } from "./Icon";
import type { TravelMode } from "@/lib/constants";
import type { LucideProps } from "lucide-react";

const MODE_ICONS: Record<TravelMode, IconName> = {
  bike: "directions_bike",
  car: "directions_car",
  cab: "local_taxi",
  bus: "directions_bus",
};

// LucideProps inherits SVG's own `name` attribute, which would otherwise widen
// the icon name back to string when the rest of the props are spread through.
type TravelModeIconProps = { mode: TravelMode } & Omit<LucideProps, "ref" | "name">;

/** Shared by the create-trip selector, browse cards and the trip detail badge. */
export function TravelModeIcon({ mode, ...props }: TravelModeIconProps) {
  return <Icon name={MODE_ICONS[mode]} {...props} />;
}
