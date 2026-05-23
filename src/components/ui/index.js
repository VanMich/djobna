// src/components/ui/index.js
// Barrel export — importer tous les composants UI partagés
//
// Usage:
//   import { Button, Input, Card, Badge, Avatar, Skeleton } from "../components/ui";

export { default as AnimatedView, AnimatedList } from "./AnimatedView";
export { default as Avatar } from "./Avatar";
export { default as Badge, StatusDot, VerifiedBadge, PremiumBadge } from "./Badge";
export { default as Button } from "./Button";
export { default as Card } from "./Card";
export { default as EmptyState } from "./EmptyState";
export { default as Input } from "./Input";
export { default as Select } from "./Select";
export {
  default as Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonConversation,
  SkeletonConversationList,
  SkeletonChatBubbles,
  SkeletonProfileOwn,
  SkeletonProfilePublic,
} from "./Skeleton";
