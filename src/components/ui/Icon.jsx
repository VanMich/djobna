// src/components/ui/Icon.jsx
// Composant centralisé pour les icônes Phosphor.
// Utilise un mapping par nom → permet d'utiliser des strings dans les props.
//
// Usage :
//   <Icon name="wrench" size={20} color="#1D9E75" />
//   <Icon name="pencil-simple" weight="fill" />

import React from "react";
import {
  Wrench,
  Scissors,
  Lightning,
  PaintBrush,
  Hammer,
  Needle,
  Broom,
  CookingPot,
  Key,
  Package,
  ShieldCheck,
  Plant,
  Flame,
  Snowflake,
  Wall,
  Drop,
  // UI / Menu / Profile
  PencilSimple,
  FileText,
  ClipboardText,
  Star,
  ChatCircle,
  Bell,
  Question,
  Info,
  Lock,
  Trash,
  SignOut,
  Gear,
  MapPin,
  CurrencyDollarSimple,
  ChartBar,
  HandWaving,
  UserSwitch,
  HourglassSimple,
  CheckCircle,
  XCircle,
  Warning,
  Clock,
  Sparkle,
  Timer,
  HandCoins,
  Megaphone,
  Compass,
  Heart,
  CalendarBlank,
  Envelope,
  // Provider setup / recap
  Globe,
  Translate,
  Camera,
  Image,
  IdentificationCard,
  // Chat / messaging
  ChatCircleDots,
  PaperPlane,
  // Empty states
  TrayArrowDown,
  ChatTeardropDots,
  MagnifyingGlass,
  // Other
  CaretRight,
  ArrowLeft,
  Phone,
  Flag,
} from "phosphor-react-native";

const ICON_MAP = {
  // ── Services ──
  "wrench": Wrench,
  "scissors": Scissors,
  "lightning": Lightning,
  "paint-brush": PaintBrush,
  "hammer": Hammer,
  "needle": Needle,
  "broom": Broom,
  "cooking-pot": CookingPot,
  "key": Key,
  "package": Package,
  "shield-check": ShieldCheck,
  "plant": Plant,
  "flame": Flame,
  "snowflake": Snowflake,
  "wall": Wall,
  "drop": Drop,

  // ── Menu / Profile ──
  "pencil-simple": PencilSimple,
  "file-text": FileText,
  "clipboard-text": ClipboardText,
  "star": Star,
  "chat-circle": ChatCircle,
  "bell": Bell,
  "question": Question,
  "info": Info,
  "lock": Lock,
  "trash": Trash,
  "sign-out": SignOut,
  "gear": Gear,
  "map-pin": MapPin,
  "currency-dollar": CurrencyDollarSimple,
  "chart-bar": ChartBar,
  "hand-waving": HandWaving,
  "user-switch": UserSwitch,
  "hourglass": HourglassSimple,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  "warning": Warning,
  "clock": Clock,
  "sparkle": Sparkle,
  "timer": Timer,
  "hand-coins": HandCoins,
  "megaphone": Megaphone,
  "compass": Compass,
  "heart": Heart,
  "calendar": CalendarBlank,
  "envelope": Envelope,

  // ── Provider / setup ──
  "globe": Globe,
  "translate": Translate,
  "camera": Camera,
  "image": Image,
  "identification-card": IdentificationCard,

  // ── Chat / messaging ──
  "chat-circle-dots": ChatCircleDots,
  "paper-plane": PaperPlane,

  // ── Empty states ──
  "tray-arrow-down": TrayArrowDown,
  "chat-teardrop-dots": ChatTeardropDots,
  "magnifying-glass": MagnifyingGlass,

  // ── Navigation ──
  "caret-right": CaretRight,
  "arrow-left": ArrowLeft,
  "phone": Phone,
  "flag": Flag,
};

export default function Icon({
  name,
  size = 20,
  color = "#111",
  weight = "duotone",
  style,
}) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} weight={weight} style={style} />;
}

// Export pour usage conditionnel (ex: vérifier si un nom existe)
export { ICON_MAP };
