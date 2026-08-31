import {
  Building2,
  Cog,
  Droplets,
  Fuel,
  Gem,
  Package,
  Pickaxe,
  Route,
  TreePine,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  Pickaxe,
  Gem,
  Building2,
  Route,
  Droplets,
  Cog,
  Zap,
  Fuel,
  TreePine,
  Package,
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
