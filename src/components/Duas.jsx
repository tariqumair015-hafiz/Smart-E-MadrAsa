import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, BookOpen, Copy, Pause, Play, Search, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { urduDictionary, categoryTranslations } from './UrduDuasData'; 

// Load authentic duas from Hisnul Muslim database (with audio filenames)
const HISNUL_DB_URL = 'https://raw.githubusercontent.com/sheikhhanif/Hisnul_Muslim_Database/master/hisnul_database.csv';
const HISNUL_GROUPS_URL = 'https://raw.githubusercontent.com/sheikhhanif/Hisnul_Muslim_Database/master/dua_group.csv';
const HISNUL_AUDIO_BASE = 'https://raw.githubusercontent.com/sheikhhanif/Hisnul_Muslim_Database/master/audio/';
const QURAN_AUDIO_EDITION = 'ar.alafasy';

const parseCsvLine = (line) => {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
};

const parseCsv = (raw) => {
  const lines = (raw || '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map(h => (h || '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j += 1) obj[header[j]] = cols[j] ?? '';
    rows.push(obj);
  }
  return rows;
};

const safeCopy = async (text, dua) => {
  try {
    if (navigator?.clipboard?.writeText) {
      const copyText = dua ? `${dua.title}\n\n${dua.urduTitle || ''}\n\n${dua.arabic}\n\n${dua.translation}\n\nTransliteration: ${dua.transliteration}` : text;
      await navigator.clipboard.writeText(copyText);
      return true;
    }
  } catch {}
  return false;
};

const Duas = ({ onBack }) => {
  const { theme, quranQari, setQuranQari } = useSettings();
  const c = {
    bg: theme === 'dark' ? '#080d16' : '#f1f5f9',
    surface: theme === 'dark' ? '#0b1220' : '#ffffff',
    text: theme === 'dark' ? '#fff' : '#0f172a',
    muted: theme === 'dark' ? '#94a3b8' : '#64748b',
    border: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
    gold: theme === 'dark' ? '#d4af37' : '#b48600'
  };

  const [query, setQuery] = useState('');
  const [duas, setDuas] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingDuas, setLoadingDuas] = useState(true);
  const [duasError, setDuasError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [speakingId, setSpeakingId] = useState(null);
  const voicesReadyRef = useRef(false);
  const ttsRef = useRef(null); 
  const audioRef = useRef(null); 
  const lastSpeechUtterRef = useRef(null);
  const nativeTtsTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingDuas(true);
      setDuasError(null);
      try {
        const cacheKey = 'hisnul_muslim_db_v1';
        const cacheGroupsKey = 'hisnul_muslim_groups_v1';
        const cachedDb = localStorage.getItem(cacheKey);
        const cachedGroups = localStorage.getItem(cacheGroupsKey);

        let dbRaw = cachedDb;
        let groupsRaw = cachedGroups;

        try {
          const [dbRes, gRes] = await Promise.all([fetch(HISNUL_DB_URL), fetch(HISNUL_GROUPS_URL)]);
          if (dbRes.ok) dbRaw = await dbRes.text();
          if (gRes.ok) groupsRaw = await gRes.text();
          try {
            if (dbRaw) localStorage.setItem(cacheKey, dbRaw);
            if (groupsRaw) localStorage.setItem(cacheGroupsKey, groupsRaw);
          } catch {}
        } catch (e) {
          console.error('[Duas] Fetch error:', e);
        }

        const groupRows = parseCsv(groupsRaw || '');
        const groupMap = new Map(
          groupRows.map(r => [String(r.id || '').trim(), String(r.title || '').trim()]).filter(([id]) => id)
        );

        const rows = parseCsv(dbRaw || '');
        
        const normalized = rows
          .map((r, index) => {
            const id = String(r.id || '').trim();
            const groupId = String(r.group_id || '').trim();
            const arabic = String(r.ar_dua || '').trim();
            if (!id || !arabic) return null;
            
            const audioFile = String(r.audio || '').trim();
            const audioUrl = audioFile ? `${HISNUL_AUDIO_BASE}${encodeURIComponent(audioFile)}` : null;
            const englishTitle = String(r.subtitle || '').trim() || (groupMap.get(groupId) ? `${groupMap.get(groupId)}` : `Dua ${id}`);
            
            const urduData = urduDictionary[id] || {};
            const urduTitle = urduData.title || '';
            const urduText = urduData.text || '';
            const romanTitle = urduData.roman || ''; // NEW: Add Roman tag
            
            return {
              id: `hm_${id}`,
              sourceId: id,
              groupId,
              category: groupMap.get(groupId) || `Group ${groupId || '?'}`,
              title: englishTitle,
              urduTitle: urduTitle, 
              romanTitle: romanTitle, // NEW: Pass Roman to filter
              arabic,
              urdu: urduText, 
              translation: String(r.en_translation || '').trim(),
              reference: String(r.en_reference || '').trim(),
              audioUrl
            };
          })
          .filter(Boolean);
        
        if (cancelled) return;
        setGroups(groupRows);
        setDuas(normalized);
        setOpenId(normalized[0]?.id || null);
      } catch (e) {
        if (cancelled) return;
        setDuasError('Duas load nahi ho saken. Internet check karein.');
      } finally {
        if (!cancelled) setLoadingDuas(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const load = () => {
      try {
        const v = window?.speechSynthesis?.getVoices?.() || [];
        if (v.length) voicesReadyRef.current = true;
      } catch {}
    };
    load();
    try {
      window?.speechSynthesis?.addEventListener?.('voiceschanged', load);
    } catch {}
    return () => {
      try {
        window?.speechSynthesis?.cancel?.();
      } catch {}
      try {
        window?.speechSynthesis?.removeEventListener?.('voiceschanged', load);
      } catch {}
    };
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set((duas || []).map(d => d.category).filter(Boolean)));
    return ['All', ...cats];
  }, [duas]);

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const base = activeCategory === 'All' ? (duas || []) : (duas || []).filter(d => d.category === activeCategory);
    if (!q) return base;
    return base.filter(d => {
      // NEW: Include romanTitle in the searchable text block
      const hay = `${d.title} ${d.urduTitle || ''} ${d.romanTitle || ''} ${d.arabic} ${d.translation || ''} ${d.urdu || ''} ${d.reference || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeCategory, duas]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const d of filtered) {
      const k = d.category || 'Other';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(d);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const stopWebAudio = () => {
    try {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    } catch {}
  };

  const stopWebSpeech = () => {
    try {
      window?.speechSynthesis?.cancel?.();
    } catch {}
    lastSpeechUtterRef.current = null;
  };

  const clearNativeTtsTimer = () => {
    if (nativeTtsTimerRef.current) {
      clearTimeout(nativeTtsTimerRef.current);
      nativeTtsTimerRef.current = null;
    }
  };

  const getDuaAudioUrl = (dua) => {
    if (!dua?.audio) return null;
    return `${HISNUL_AUDIO_BASE}${dua.audio}`;
  };

  const speakArabic = async (dua) => {
    try {
      if (speakingId === dua.id) {
        stopWebAudio();
        stopWebSpeech();
        clearNativeTtsTimer();
        try { await ttsRef.current?.stop?.(); } catch {}
        setSpeakingId(null);
        return;
      }

      stopWebAudio();
      stopWebSpeech();
      clearNativeTtsTimer();
      try { await ttsRef.current?.stop?.(); } catch {}

      let url = getDuaAudioUrl(dua);
      
      if (!url && typeof dua.audioUrl === 'string') {
        url = dua.audioUrl;
      }

      if (url) {
        const audio = new Audio(url); 
        audioRef.current = audio;
        setSpeakingId(dua.id);
        audio.onended = () => {
          if (audioRef.current === audio) audioRef.current = null;
          setSpeakingId(null);
        };
        audio.onerror = () => {
          if (audioRef.current === audio) audioRef.current = null;
          setSpeakingId(null);
        };
        audio.play().catch(() => {
          if (audioRef.current === audio) audioRef.current = null;
          setSpeakingId(null);
        });
        return;
      }

      try {
        if (!ttsRef.current) {
          const mod = await import('@capacitor-community/text-to-speech');
          ttsRef.current = mod?.TextToSpeech || null;
        }
        if (ttsRef.current && Capacitor?.isNativePlatform?.()) {
          setSpeakingId(dua.id);
          await ttsRef.current.speak({
            text: dua.arabic,
            lang: 'ar-SA',
            rate: 0.85,
            pitch: 1.0,
            volume: 1.0,
            category: 'playback'
          });
          const chars = (dua.arabic || '').length;
          const estMs = Math.min(45000, Math.max(2500, Math.round((chars / 10) * 1000 / 0.85)));
          nativeTtsTimerRef.current = setTimeout(() => {
            setSpeakingId((cur) => (cur === dua.id ? null : cur));
            nativeTtsTimerRef.current = null;
          }, estMs);
          return;
        }
      } catch {}

      const synth = window?.speechSynthesis;
      if (!synth) {
        setSpeakingId(null);
        alert('Audio is not supported on this device right now.');
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(dua.arabic);
      lastSpeechUtterRef.current = utter;
      utter.lang = 'ar-SA';
      utter.rate = 0.9;
      utter.pitch = 1;
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      setSpeakingId(dua.id);
      synth.speak(utter);
    } catch {
      setSpeakingId(null);
    }
  };

  const card = {
    backgroundColor: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: '18px',
    padding: '16px',
    boxShadow: '0 6px 22px rgba(0,0,0,0.25)'
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'sans-serif' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: c.surface, position: 'sticky', top: 0, zIndex: 10, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={24} color={c.text} />
        </button>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: c.gold, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} color={c.gold} /> Makhsoos Duaein
        </h2>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ padding: '20px', paddingBottom: '40px' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '10px 12px', marginBottom: '16px' }}>
          <Search size={18} color={c.muted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dua (e.g., sone ki dua, namaz, wuzu...)"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: c.text, fontSize: '14px' }}
          />
        </div>

        {/* Categories (Auto Translates to Urdu if in dictionary) */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
          {categories.map((cat) => {
            const active = cat === activeCategory;
            const displayCat = categoryTranslations[cat] || cat; 
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  whiteSpace: 'nowrap',
                  backgroundColor: active ? c.gold : 'rgba(255,255,255,0.03)',
                  color: active ? '#000' : c.text,
                  border: `1px solid ${active ? 'transparent' : c.border}`,
                  padding: '10px 16px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: '900',
                  fontSize: '14px',
                  fontFamily: "'Noto Nastaliq Urdu', sans-serif"
                }}
              >
                {displayCat}
              </button>
            );
          })}
        </div>

        {loadingDuas ? (
          <div style={{ ...card, textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ margin: 0, color: c.muted, fontWeight: '800' }}>Loading authentic duas…</p>
          </div>
        ) : duasError ? (
          <div style={{ ...card, textAlign: 'center', padding: '28px 16px', borderColor: 'rgba(239,68,68,0.35)' }}>
            <p style={{ margin: 0, color: '#ef4444', fontWeight: '900' }}>Error</p>
            <p style={{ margin: '10px 0 0 0', color: c.muted, fontWeight: '700' }}>{duasError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ margin: 0, color: c.muted, fontWeight: '800' }}>کوئی دعا نہیں ملی۔</p>
          </div>
        ) : (
          grouped.map(([cat, items]) => {
            const displayCat = categoryTranslations[cat] || cat;
            return (
              <div key={cat} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '6px 2px 10px 2px' }}>
                  <p style={{ margin: 0, color: c.muted, fontSize: '15px', fontWeight: '900', fontFamily: "'Noto Nastaliq Urdu', sans-serif" }}>
                    {displayCat}
                  </p>
                  <div style={{ height: 1, flex: 1, marginLeft: 10, backgroundColor: c.border }} />
                </div>

                {items.map((d) => {
                  const isOpen = openId === d.id;
                  const isSpeaking = speakingId === d.id;
                  return (
                    <div key={d.id} style={{ ...card, marginBottom: '12px' }}>
                      <button
                        onClick={() => setOpenId(isOpen ? null : d.id)}
                        style={{
                          width: '100%', background: 'transparent', border: 'none', padding: 0,
                          color: c.text, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', gap: '12px'
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          {/* ENGLISH TITLE (ORIGINAL) */}
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: c.text }}>{d.title}</p>
                          
                          {/* URDU TITLE (ONLY IF FOUND IN DICTIONARY) */}
                          {d.urduTitle && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: c.gold, lineHeight: '1.5', fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                              {d.urduTitle}
                            </p>
                          )}
                          
                          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: c.muted }}>
                            {isOpen ? 'Tap to collapse' : 'Tap to view'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ backgroundColor: `${c.gold}12`, border: `1px solid ${c.border}`, color: c.gold, padding: '8px 10px', borderRadius: '999px', fontWeight: '900', fontSize: '12px' }}>
                            Dua
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div style={{ marginTop: '14px' }}>
                          {/* ARABIC TEXT (ORIGINAL) */}
                          <div style={{ textAlign: 'right', fontSize: '32px', lineHeight: '2.0', color: c.gold, fontWeight: '800', fontFamily: "'Scheherazade New', serif" }}>
                            {d.arabic}
                          </div>

                          <div style={{ marginTop: '10px', borderTop: `1px dashed ${c.border}`, paddingTop: '10px' }}>
                            
                            {/* URDU TRANSLATION (ONLY IF FOUND IN DICTIONARY) */}
                            {d.urdu && (
                              <p style={{ margin: '0 0 12px 0', color: c.text, fontSize: '15px', lineHeight: '2.0', fontFamily: "'Noto Nastaliq Urdu', serif", textAlign: 'right', direction: 'rtl' }}>
                                <span style={{ color: c.gold, fontWeight: '900' }}>ترجمہ: </span> 
                                {d.urdu}
                              </p>
                            )}

                            {/* ENGLISH TRANSLATION (ORIGINAL) */}
                            {d.translation && (
                              <p style={{ margin: '0', color: c.muted, fontSize: '12px', lineHeight: '1.8' }}>
                                <span style={{ color: c.gold, fontWeight: '900' }}>Translation:</span> {d.translation}
                              </p>
                            )}

                            {/* REFERENCE (ORIGINAL) */}
                            {d.reference && (
                              <p style={{ margin: '8px 0 0 0', color: c.muted, fontSize: '12px', lineHeight: '1.8' }}>
                                <span style={{ color: c.gold, fontWeight: '900' }}>Reference:</span> {d.reference}
                              </p>
                            )}
                          </div>

                          {/* ACTIONS (ORIGINAL AUDIO LOGIC) */}
                          <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: '10px', marginTop: '14px' }}>
                            <button
                              onClick={() => speakArabic(d)}
                              style={{
                                width: window.innerWidth < 768 ? '100%' : 52, height: 44,
                                backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
                                color: c.text, borderRadius: '14px', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                              }}
                              aria-label={isSpeaking ? 'Pause audio' : 'Play audio'}
                              title={isSpeaking ? 'Stop' : 'Play'}
                            >
                              {isSpeaking ? <Pause size={18} color={c.gold} fill={c.gold} /> : <Play size={18} color={c.gold} fill={c.gold} style={{ marginLeft: 2 }} />}
                            </button>

                            <button
                              onClick={async () => {
                                const ok = await safeCopy(d.title, d);
                                if (!ok) return;
                                setCopiedId(d.id);
                                setTimeout(() => setCopiedId(null), 900);
                              }}
                              style={{
                                width: window.innerWidth < 768 ? '100%' : 'auto',
                                backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
                                color: c.text, padding: '12px 12px', borderRadius: '14px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '900'
                              }}
                            >
                              <Copy size={16} color={c.gold} /> {copiedId === d.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>

                          {!window?.speechSynthesis && !d.audioUrl && (
                            <p style={{ margin: '10px 0 0 0', color: c.muted, fontSize: '12px' }}>
                              Audio not supported on this device.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Duas;