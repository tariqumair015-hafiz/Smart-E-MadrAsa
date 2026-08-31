// ── localStorage helpers ──
export const ls = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Themes ──
export const THEMES = [
  { id: 'light', label: 'روشن', bg: '#f8f6f0', pageBg: '#fff', bar: '#1a1a2e', ui: '#1a1a2e', filter: 'none', icon: '☀️' },
  { id: 'sepia', label: 'سیپیا', bg: '#f0e4c8', pageBg: '#fdf6e3', bar: '#3d2b1a', ui: '#3d2b1a', filter: 'none', icon: '📜' },
  { id: 'dark',  label: 'تاریک', bg: '#000000', pageBg: 'white', bar: '#000000', ui: '#0a0d14', filter: 'invert(88%) hue-rotate(180deg)', icon: '🌙' },
];

export const GOLD = '#c9a84c';
export const GOLD_DIM = 'rgba(201,168,76,0.2)';

// ── Button style helper ──
export const iBtn = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
  color: GOLD, width: 36, height: 36, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', fontSize: 17, flexShrink: 0,
  transition: 'background 0.15s', ...extra,
});

// ── Arabic/Urdu detect ──
export const isArabic = (t) => /[\u0600-\u06FF\u0750-\u077F]/.test(t);

// ── Fetch English dictionary ──
export async function fetchEnDict(word) {
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const d = await r.json();
    if (!Array.isArray(d) || !d[0]) return null;
    return {
      word, phonetic: d[0].phonetic || '',
      meanings: d[0].meanings.slice(0, 3).map(m => ({
        pos: m.partOfSpeech,
        def: m.definitions[0]?.definition,
        example: m.definitions[0]?.example
      }))
    };
  } catch { return null; }
}
