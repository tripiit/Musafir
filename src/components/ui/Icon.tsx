import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Ban,
  Bell,
  Bike,
  Briefcase,
  Bus,
  Calendar,
  CalendarDays,
  Car,
  CarTaxiFront,
  ChevronLeft,
  ChevronRight,
  CigaretteOff,
  CircleCheck,
  CirclePlus,
  CircleUserRound,
  Compass,
  Footprints,
  Heart,
  ImagePlus,
  Info,
  Layers,
  ListChecks,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Minus,
  MountainSnow,
  Music,
  House,
  Plus,
  RotateCcwClock,
  Search,
  Send,
  SquarePen,
  Settings,
  Share2,
  Shield,
  TriangleAlert,
  User,
  Users,
  X,
  type LucideProps,
} from "lucide-react";

/**
 * The Stitch export drew every icon with the Material Symbols web font
 * (`<span class="material-symbols-outlined">directions_bike</span>`). That font
 * is ~940KB per fill instance for the ~40 glyphs we use, so this maps those
 * Material Symbols names onto tree-shakeable Lucide SVGs. Call sites keep the
 * mockup's names, which keeps them traceable back to design-ref/.
 */
const ICONS = {
  account_circle: CircleUserRound,
  add: Plus,
  add_a_photo: ImagePlus,
  add_circle: CirclePlus,
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,
  calendar_month: Calendar,
  calendar_today: CalendarDays,
  chat: MessageSquare,
  chat_bubble: MessageCircle,
  cancel: Ban,
  check_circle: CircleCheck,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  close: X,
  directions_bike: Bike,
  directions_bus: Bus,
  directions_car: Car,
  edit: SquarePen,
  explore: Compass,
  favorite: Heart,
  forum: MessagesSquare,
  group: Users,
  hiking: Footprints,
  history: RotateCcwClock,
  home: House,
  info: Info,
  list_alt: ListChecks,
  local_taxi: CarTaxiFront,
  location_on: MapPin,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  mark_email_read: MailCheck,
  menu: Menu,
  mountain: MountainSnow,
  music_note: Music,
  notifications: Bell,
  person: User,
  progress_activity: LoaderCircle,
  remove: Minus,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shield: Shield,
  smoke_free: CigaretteOff,
  swipe: Layers,
  travel_explore: Compass,
  warning: TriangleAlert,
  work: Briefcase,
} as const;

export type IconName = keyof typeof ICONS;

// LucideProps inherits SVG's own `name` attribute; omit it so the union below wins.
type IconProps = Omit<LucideProps, "ref" | "name"> & {
  name: IconName;
  /** Material Symbols' FILL axis: filled icons use no stroke and a solid fill. */
  filled?: boolean;
};

export function Icon({ name, filled = false, size = 24, ...props }: IconProps) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      size={size}
      aria-hidden="true"
      focusable="false"
      {...(filled ? { fill: "currentColor", strokeWidth: 0 } : {})}
      {...props}
    />
  );
}
