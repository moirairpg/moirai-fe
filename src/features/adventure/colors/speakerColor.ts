export type Rgb = { r: number; g: number; b: number };

export type SpeakerColor = {
  hue: number;
  saturation: number;
  lightness: number;
  css: string;
};

const CONTRAST_THRESHOLD = 4.5;
const MIN_HUE_SEPARATION = 30;
const MAX_ATTEMPTS = 32;
const FALLBACK_BACKGROUND: Rgb = { r: 255, g: 255, b: 255 };

function hslToRgb(h: number, s: number, l: number): Rgb {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = lightness - chroma / 2;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ][sector];

  return {
    r: Math.round((r + match) * 255),
    g: Math.round((g + match) * 255),
    b: Math.round((b + match) * 255),
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

export function readBackgroundRgb(): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
  const [h, s, l] = raw.split(/\s+/).map((part) => Number.parseFloat(part));

  if (![h, s, l].every(Number.isFinite)) return FALLBACK_BACKGROUND;

  return hslToRgb(h, s, l);
}

function hueDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

export function isReadable(color: SpeakerColor, background: Rgb): boolean {
  const rgb = hslToRgb(color.hue, color.saturation, color.lightness);
  return contrastRatio(rgb, background) >= CONTRAST_THRESHOLD;
}

export function pickSpeakerColor(background: Rgb, taken: SpeakerColor[]): SpeakerColor {
  let best: SpeakerColor | null = null;
  let bestContrast = -1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const hue = Math.random() * 360;
    const saturation = 60 + Math.random() * 35;
    const lightness = Math.random() * 100;
    const candidate: SpeakerColor = {
      hue,
      saturation,
      lightness,
      css: `hsl(${hue.toFixed(1)} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`,
    };
    const ratio = contrastRatio(hslToRgb(hue, saturation, lightness), background);

    if (ratio > bestContrast) {
      best = candidate;
      bestContrast = ratio;
    }

    const isDistinct = taken.every((other) => hueDistance(other.hue, hue) >= MIN_HUE_SEPARATION);

    if (ratio >= CONTRAST_THRESHOLD && isDistinct) return candidate;
  }

  return best as SpeakerColor;
}
