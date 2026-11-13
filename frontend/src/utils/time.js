// "2h ago", "3 days ago" — mirrors the relative-time pills in the Figma checklist
export function timeAgo(dateLike) {
  if (!dateLike) return '';
  const diff = Date.now() - new Date(dateLike).getTime();
  if (Number.isNaN(diff)) return '';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return day === 1 ? 'yesterday' : `${day} days ago`;
  return new Date(dateLike).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Split "Main Library - 1st Floor" into building + floor
export function splitLocation(loc = '') {
  const [building, ...rest] = String(loc).split(' - ');
  return { building: building || 'Unknown location', floor: rest.join(' - ') };
}

// Stable tag colour per category (purple / green / red / blue from the Figma tags)
const TAG_TONES = ['purple', 'green', 'red', 'blue'];
export function toneFor(text = '') {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_TONES[h % TAG_TONES.length];
}
