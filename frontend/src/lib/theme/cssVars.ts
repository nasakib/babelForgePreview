/**
 * Flatten the design palette into CSS custom properties so any styled rule
 * (globals.css, inline styles, third-party CSS) can read the same source of
 * truth Tailwind and TS components use.
 *
 * Mounted once at the top of <body> by app/layout.tsx as a <style> block.
 * Doing it at the document root (not :root via a stylesheet) means a single
 * runtime hot-swap can rebrand the entire app — useful if we ever add a
 * "low-stim" or "high-contrast" theme variant.
 */

import { palette } from "./palette";
import { alpha } from "./color";

export function cssVarBlock(): string {
  const a = palette.accent[500];
  const lines = [
    `--bg-canvas: ${palette.canvas};`,
    `--bg-surface: ${palette.surface[50]};`,
    `--bg-elevated: ${palette.surface[100]};`,
    `--border: ${palette.line.DEFAULT};`,
    `--border-strong: ${palette.line.strong};`,
    `--ink: ${palette.ink.DEFAULT};`,
    `--ink-subtle: ${palette.ink.subtle};`,
    `--ink-muted: ${palette.ink.muted};`,
    `--ink-dim: ${palette.ink.dim};`,
    `--accent: ${a};`,
    `--accent-50: ${palette.accent[50]};`,
    `--accent-400: ${palette.accent[400]};`,
    `--accent-600: ${palette.accent[600]};`,
    `--accent-700: ${palette.accent[700]};`,
    `--accent-glow: ${alpha(a, 0.32)};`,
    `--accent-tint: ${alpha(a, 0.06)};`,
    `--accent-tint-strong: ${alpha(a, 0.18)};`,
    `--ok: ${palette.ok};`,
    `--warn: ${palette.warn};`,
    `--crit: ${palette.crit};`,
    `--info: ${palette.info};`,
    `--band-delta: ${palette.bands.delta};`,
    `--band-theta: ${palette.bands.theta};`,
    `--band-alpha: ${palette.bands.alpha};`,
    `--band-beta: ${palette.bands.beta};`,
    `--band-gamma: ${palette.bands.gamma};`,
  ];
  return `:root{${lines.join("")}}`;
}
