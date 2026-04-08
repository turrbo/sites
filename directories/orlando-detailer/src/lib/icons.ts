/** Maps icon name strings (from Google Sheets) to emoji characters */
const ICON_MAP: Record<string, string> = {
  sparkles: "\u2728",
  sun: "\u2600\uFE0F",
  paintbrush: "\uD83C\uDFA8",
  car: "\uD83D\uDE97",
  shield: "\uD83D\uDEE1\uFE0F",
  wrench: "\uD83D\uDD27",
  window: "\uD83E\uDE9F",
  star: "\u2B50",
  diamond: "\uD83D\uDC8E",
  droplet: "\uD83D\uDCA7",
};

export function resolveIcon(icon: string | undefined): string | undefined {
  if (!icon) return undefined;
  return ICON_MAP[icon.toLowerCase()] || icon;
}
