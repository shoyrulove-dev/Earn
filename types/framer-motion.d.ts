declare module "framer-motion" {
  import type { ComponentType, HTMLAttributes } from "react";
  export const motion: Record<string, ComponentType<HTMLAttributes<HTMLElement> & { whileTap?: unknown; initial?: unknown; animate?: unknown; layoutId?: string }>>;
}
