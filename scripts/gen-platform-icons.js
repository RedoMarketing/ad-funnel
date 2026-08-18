// Regenerates src/lib/platform-icons.ts from simple-icons.
//   node scripts/gen-platform-icons.js > src/lib/platform-icons.ts
//
// Only the marks the app needs are inlined, so the full package (3,000+
// icons) never reaches the browser. simple-icons is a devDependency.
const si = require("simple-icons");

const byTitle = new Map();
for (const k of Object.keys(si)) {
  const i = si[k];
  if (i && i.title) byTitle.set(i.title.toLowerCase(), i);
}

// Platform names as stored in funnel_platforms, plus likely additions.
const WANT = [
  ["meta", "Meta"], ["facebook", "Facebook"], ["instagram", "Instagram"],
  ["google ads", "Google Ads"], ["google", "Google"],
  ["tiktok", "TikTok"], ["reddit", "Reddit"], ["x", "X"], ["twitter", "X"],
  ["youtube", "YouTube"], ["pinterest", "Pinterest"], ["snapchat", "Snapchat"],
  ["amazon", "Amazon"], ["spotify", "Spotify"],
];

// Brand colours that vanish against a light or dark ground are dropped, so
// those marks inherit currentColor and stay visible in both themes.
function usableColor(hex) {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.06 && luminance < 0.75;
}

const entries = [];
for (const [key, title] of WANT) {
  const icon = byTitle.get(title.toLowerCase());
  if (icon) entries.push([key, icon.path, usableColor(icon.hex) ? `#${icon.hex}` : null]);
  else console.error(`no icon for ${title}`);
}

console.log(`// Generated from simple-icons. Only the marks actually needed are
// inlined, so the 3,000-icon package is not shipped to the browser.
//
// LinkedIn and Microsoft are deliberately absent: both brands had their
// icons removed from simple-icons, so those platforms fall back to initials.
//
// Regenerate: node scripts/gen-platform-icons.js > src/lib/platform-icons.ts

export interface PlatformIcon {
  /** SVG path data on a 24x24 viewBox. */
  path: string;
  /** Brand colour, or null where it would disappear against the background. */
  color: string | null;
}

/** Lowercased platform name -> its mark. */
export const PLATFORM_ICONS: Record<string, PlatformIcon> = {`);
for (const [k, p, c] of entries) {
  console.log(`  ${JSON.stringify(k)}: { path: ${JSON.stringify(p)}, color: ${c ? JSON.stringify(c) : "null"} },`);
}
console.log(`};

/** Matches a platform name to a mark, tolerating case and stray spacing. */
export function platformIcon(name: string): PlatformIcon | undefined {
  return PLATFORM_ICONS[name.trim().toLowerCase()];
}`);
