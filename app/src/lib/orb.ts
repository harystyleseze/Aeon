// The companion "orb" visual — a hue-driven radial gradient with glow.
// Ported from the Aeon design reference.
export interface OrbStyle {
  bg: string;
  glow: string;
  glowSm: string;
}

export function orb(hue: number): OrbStyle {
  return {
    bg: `radial-gradient(circle at 34% 28%, hsl(${hue} 92% 75%), hsl(${hue} 80% 55%) 55%, hsl(${hue} 74% 42%))`,
    glow: `0 0 55px hsl(${hue} 88% 60% / .45), inset 0 -8px 22px hsl(${hue} 80% 35% / .45)`,
    glowSm: `0 0 18px hsl(${hue} 88% 60% / .4)`,
  };
}

// Brand orb hue (terracotta-ish).
export const BRAND_HUE = 28;
