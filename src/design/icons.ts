/**
 * Kuratert ikonsett for blokker (cardGrid m.fl.). Navngitte importer gir tree-shaking;
 * `import * as icons` ville dratt hele lucide inn i bundelen (~80 KiB ubrukt JS i Lighthouse).
 * Legg til ikoner her når designet trenger dem, ikke i komponentene.
 */
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Code2,
  Compass,
  Eye,
  Globe,
  Layers,
  Lightbulb,
  Lock,
  Mail,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const icons = {
  "arrow-right": ArrowRight,
  "bar-chart": BarChart3,
  bot: Bot,
  check: Check,
  code: Code2,
  compass: Compass,
  eye: Eye,
  globe: Globe,
  layers: Layers,
  lightbulb: Lightbulb,
  lock: Lock,
  mail: Mail,
  "message-square": MessageSquare,
  palette: Palette,
  rocket: Rocket,
  search: Search,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  users: Users,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

/** Tåler både "bar-chart", "barChart" og "BarChart". */
export function resolveIcon(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  const kebab = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
  return (icons as Record<string, LucideIcon>)[kebab] ?? null;
}
