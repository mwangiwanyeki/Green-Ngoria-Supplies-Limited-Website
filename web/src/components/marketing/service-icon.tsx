import {
  BadgeCheck,
  BookOpen,
  Building2,
  Camera,
  ClipboardCheck,
  Cog,
  Droplets,
  Factory,
  Fuel,
  Gem,
  HardHat,
  Landmark,
  Package,
  Pickaxe,
  Route,
  TrendingUp,
  TreePine,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  BadgeCheck,
  BookOpen,
  Building2,
  Camera,
  ClipboardCheck,
  Cog,
  Droplets,
  Factory,
  Fuel,
  Gem,
  HardHat,
  Landmark,
  Package,
  Pickaxe,
  Route,
  TrendingUp,
  TreePine,
  Users,
  Wrench,
  Zap,
};

/** Resolve the lucide icon named in `@/config/services`. */
export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = icons[name] ?? Cog;
  return <Icon className={className} aria-hidden="true" />;
}
