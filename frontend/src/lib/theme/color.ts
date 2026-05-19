/**
 * babelForge — color math primitives.
 *
 * Pure functions only. No DOM, no React, no side effects, no allocations
 * beyond return values. Safe to import from anywhere (tailwind config,
 * server components, web workers, three.js shaders).
 *
 * Color space: sRGB hex in, sRGB hex out. Operations are performed in HSL
 * because we need perceptually-stable shade ramps and alpha overlays — not
 * because HSL is the "best" color space, but because the palette already
 * speaks in hue/saturation/lightness terms and the math is unambiguous.
 */

export interface HSL {
  /** Hue in degrees, 0..360. */
  h: number;
  /** Saturation, 0..1. */
  s: number;
  /** Lightness, 0..1. */
  l: number;
}

export interface RGB {
  /** Red, 0..255. */
  r: number;
  /** Green, 0..255. */
  g: number;
  /** Blue, 0..255. */
  b: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const clamp255 = (x: number): number => Math.round(x < 0 ? 0 : x > 255 ? 255 : x);
const mod360 = (x: number): number => ((x % 360) + 360) % 360;

// ---------------------------------------------------------------------------
// hex <-> rgb
// ---------------------------------------------------------------------------

export function hexToRgb(hex: string): RGB {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (v.length !== 6) throw new Error(`hexToRgb: invalid hex "${hex}"`);
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (x: number) => clamp255(x).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

// ---------------------------------------------------------------------------
// rgb <-> hsl (per CSS Color Module Level 3)
// ---------------------------------------------------------------------------

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case R:
        h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
        break;
      case G:
        h = ((B - R) / d + 2) * 60;
        break;
      default:
        h = ((R - G) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const H = mod360(h) / 360;
  const S = clamp01(s);
  const L = clamp01(l);
  if (S === 0) {
    const v = L * 255;
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const hue2rgb = (t: number): number => {
    let T = t;
    if (T < 0) T += 1;
    if (T > 1) T -= 1;
    if (T < 1 / 6) return p + (q - p) * 6 * T;
    if (T < 1 / 2) return q;
    if (T < 2 / 3) return p + (q - p) * (2 / 3 - T) * 6;
    return p;
  };
  return {
    r: hue2rgb(H + 1 / 3) * 255,
    g: hue2rgb(H) * 255,
    b: hue2rgb(H - 1 / 3) * 255,
  };
}

// ---------------------------------------------------------------------------
// hex <-> hsl
// ---------------------------------------------------------------------------

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

// ---------------------------------------------------------------------------
// transforms
// ---------------------------------------------------------------------------

/** Returns a new HSL with lightness shifted by `dL` (absolute, in 0..1). */
export function shade(c: HSL, dL: number): HSL {
  return { h: c.h, s: c.s, l: clamp01(c.l + dL) };
}

/** Returns a new HSL with saturation shifted by `dS` (absolute, in 0..1). */
export function tone(c: HSL, dS: number): HSL {
  return { h: c.h, s: clamp01(c.s + dS), l: c.l };
}

/** Returns a new HSL with hue rotated by `dH` degrees. */
export function spin(c: HSL, dH: number): HSL {
  return { h: mod360(c.h + dH), s: c.s, l: c.l };
}

/** Convert a hex color to `rgba(r,g,b,a)` for inline styling. */
export function alpha(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${clamp01(a)})`;
}

/**
 * Linear interpolation in sRGB between two hex colors.
 * `t=0` returns `a`, `t=1` returns `b`. Not gamma-correct but adequate for
 * UI tints; if you need perceptual mixing we'd swap in OKLab later.
 */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const k = clamp01(t);
  return rgbToHex({
    r: A.r + (B.r - A.r) * k,
    g: A.g + (B.g - A.g) * k,
    b: A.b + (B.b - A.b) * k,
  });
}

/**
 * WCAG relative luminance (sRGB → linear → weighted sum). Used to pick
 * legible foreground for arbitrary backgrounds.
 */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Returns the dark-ink or light-ink token hex with higher contrast against `bg`. */
export function readableOn(bg: string, light = "#d4dae5", dark = "#0d1117"): string {
  return luminance(bg) > 0.45 ? dark : light;
}

/**
 * Build a tonal ramp from a base HSL anchor. Mirrors Tailwind's 50..900 scale
 * by mapping each step to an absolute lightness target — independent of where
 * the base sits — so every accent ramp ends up visually consistent.
 *
 * The lightness targets below were tuned to match Carbon Gray on a dark UI
 * (50 = brightest tint, 900 = deepest shade), preserving the base color's
 * hue and saturation throughout.
 */
const RAMP_L: Record<number, number> = {
  50: 0.94,
  100: 0.86,
  200: 0.74,
  300: 0.62,
  400: 0.54,
  500: 0.46,
  600: 0.38,
  700: 0.30,
  800: 0.22,
  900: 0.14,
};

export function ramp(base: HSL, steps: number[] = [50, 100, 200, 400, 500, 600, 700]): Record<number, string> {
  const out: Record<number, string> = {};
  for (const s of steps) {
    const targetL = RAMP_L[s];
    if (targetL === undefined) throw new Error(`ramp: unsupported step ${s}`);
    // Saturation drops slightly at the extremes for a more refined feel.
    const sShift = s <= 100 || s >= 800 ? -0.15 : 0;
    out[s] = hslToHex({ h: base.h, s: clamp01(base.s + sShift), l: targetL });
  }
  return out;
}
