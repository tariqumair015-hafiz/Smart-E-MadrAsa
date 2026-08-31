import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, Clock, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';

const STORAGE_KEY = 'quran_hifz_tracker_v2';

const toISODate = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date();
    // yyyy-mm-dd
    return dt.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const safeParseJSON = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const HifzTracker = ({ onBack }) => {
  const { theme } = useSettings();
  const [entries, setEntries] = useState([]);
  const [toast, setToast] = useState(null); // { title, body }

  // Sabaq (single "today's new lesson" card)
  const [sabaqDraft, setSabaqDraft] = useState({
    date: toISODate(new Date()),
    reference: '',
    ayatRange: '',
    done: false
  });

  // Sabaqi / Manzil add sheets
  const [showSabaqiAdd, setShowSabaqiAdd] = useState(false);
  const [showManzilAdd, setShowManzilAdd] = useState(false);
  const [sabaqiForm, setSabaqiForm] = useState({
    date: toISODate(new Date()),
    reference: '',
    ayatRange: ''
  });
  const [manzilForm, setManzilForm] = useState({
    date: toISODate(new Date()),
    reference: '',
    pace: '' // e.g. "1 Juz/day" / "10 pages" / "Surah Yaseen"
  });
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? safeParseJSON(saved, []) : [];
    setEntries(Array.isArray(parsed) ? parsed : []);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Load/keep sabaq draft separately (so "Done ring" doesn't depend on entries list)
  useEffect(() => {
    const raw = localStorage.getItem('quran_sabaq_today_v1');
    const v = raw ? safeParseJSON(raw, null) : null;
    if (v && typeof v === 'object') {
      setSabaqDraft({
        date: typeof v.date === 'string' ? v.date : toISODate(new Date()),
        reference: typeof v.reference === 'string' ? v.reference : '',
        ayatRange: typeof v.ayatRange === 'string' ? v.ayatRange : '',
        done: Boolean(v.done)
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('quran_sabaq_today_v1', JSON.stringify(sabaqDraft));
  }, [sabaqDraft]);

  const c = {
    bg: theme === 'dark' ? '#080d16' : '#f1f5f9',
    surface: theme === 'dark' ? '#0b1220' : '#ffffff',
    text: theme === 'dark' ? '#fff' : '#0f172a',
    muted: theme === 'dark' ? '#94a3b8' : '#64748b',
    border: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
    gold: theme === 'dark' ? '#d4af37' : '#b48600'
  };

  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toISODate(d);
  };

  const sabaqiRecent = useMemo(() => {
    const minDate = daysAgo(7); // last 7 days
    return entries
      .filter(e => e?.type === 'sabaqi' && typeof e.date === 'string' && e.date >= minDate)
      .sort((a, b) => `${b.date || ''}`.localeCompare(`${a.date || ''}`) || `${b.createdAt || ''}`.localeCompare(`${a.createdAt || ''}`));
  }, [entries]);

  const manzilList = useMemo(() => {
    return entries
      .filter(e => e?.type === 'manzil')
      .sort((a, b) => `${b.date || ''}`.localeCompare(`${a.date || ''}`) || `${b.createdAt || ''}`.localeCompare(`${a.createdAt || ''}`));
  }, [entries]);

  const sabaqProgress = sabaqDraft.done ? 100 : 0;

  const saveSabaqToHistory = () => {
    const date = (sabaqDraft.date || '').trim();
    const reference = (sabaqDraft.reference || '').trim();
    if (!date || !reference) return;
    setEntries(prev => [
      {
        id: uid(),
        type: 'sabaq',
        date,
        reference,
        range: (sabaqDraft.ayatRange || '').trim() || null,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const markSabaqDone = () => {
    const date = (sabaqDraft.date || '').trim();
    const reference = (sabaqDraft.reference || '').trim();
    if (!date || !reference) return;
    if (!sabaqDraft.done) {
      saveSabaqToHistory();
      setToast({ title: 'مبارک ہو!', body: 'Sabaq mukammal — aaj ka target complete.' });
      setTimeout(() => setToast(null), 1600);
    }
    setSabaqDraft(prev => ({ ...prev, done: true }));
  };

  const resetSabaq = () => {
    setSabaqDraft({
      date: toISODate(new Date()),
      reference: '',
      ayatRange: '',
      done: false
    });
  };

  const addSabaqi = () => {
    const date = (sabaqiForm.date || '').trim();
    const reference = (sabaqiForm.reference || '').trim();
    if (!date || !reference) return;
    setEntries(prev => [
      {
        id: uid(),
        type: 'sabaqi',
        date,
        reference,
        range: (sabaqiForm.ayatRange || '').trim() || null,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
    setShowSabaqiAdd(false);
    setSabaqiForm({ date: toISODate(new Date()), reference: '', ayatRange: '' });
  };

  const addManzil = () => {
    const date = (manzilForm.date || '').trim();
    const reference = (manzilForm.reference || '').trim();
    if (!date || !reference) return;
    setEntries(prev => [
      {
        id: uid(),
        type: 'manzil',
        date,
        reference,
        pace: (manzilForm.pace || '').trim() || null,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
    setShowManzilAdd(false);
    setManzilForm({ date: toISODate(new Date()), reference: '', pace: '' });
  };

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: c.surface, position: 'sticky', top: 0, zIndex: 10, borderBottom: `1px solid ${c.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ArrowLeft size={24} color={c.text} />
        </button>
        <h2 style={{ margin: '0 0 0 16px', fontSize: '20px', fontWeight: 'bold', color: c.gold }}>Hifz Tracker</h2>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Top banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,1) 0%, rgba(11,18,32,1) 110%)', borderRadius: '20px', padding: '18px', marginBottom: '16px', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 10px 25px rgba(0,0,0,0.35)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -35, opacity: 0.12 }}>
            <ClipboardList size={140} color="#fff" />
          </div>
          <p style={{ margin: 0, color: 'rgba(0,0,0,0.75)', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.4px' }}>
            Sabaq · Sabaqi · Manzil
          </p>
          <h3 style={{ margin: '8px 0 0 0', color: '#000', fontSize: '22px', fontWeight: '900' }}>
            Hifz Tracker (Daily System)
          </h3>
          <p style={{ margin: '8px 0 0 0', color: 'rgba(0,0,0,0.75)', fontSize: '13px', fontWeight: '700' }}>
            Apna sabaq likhein, sabaqi ko 7 din tak track karein, aur manzil (revision) ko consistent rakhein.
          </p>
        </div>

        {/* Sabaq Card */}
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '16px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, color: c.muted, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Sabaq (New Lesson)</p>
              <h4 style={{ margin: '6px 0 0 0', color: c.gold, fontSize: '18px', fontWeight: '900' }}>Aaj ka naya sabaq</h4>
            </div>
            <ProgressRing percent={sabaqProgress} size={56} stroke={7} color={c.gold} track={c.border} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
            <div style={{ backgroundColor: 'var(--bg-color)', border: `1px solid ${c.border}`, borderRadius: '14px', padding: '10px 12px' }}>
              <label style={{ display: 'block', color: c.muted, fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>Date</label>
              <input
                type="date"
                value={sabaqDraft.date}
                onChange={(e) => setSabaqDraft(prev => ({ ...prev, date: e.target.value, done: false }))}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: c.text, fontWeight: '800' }}
              />
            </div>
            <div style={{ backgroundColor: 'var(--bg-color)', border: `1px solid ${c.border}`, borderRadius: '14px', padding: '10px 12px' }}>
              <label style={{ display: 'block', color: c.muted, fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>Aayat</label>
              <input
                value={sabaqDraft.ayatRange}
                onChange={(e) => setSabaqDraft(prev => ({ ...prev, ayatRange: e.target.value, done: false }))}
                placeholder="1-10"
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: c.text, fontWeight: '800' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '10px', backgroundColor: 'var(--bg-color)', border: `1px solid ${c.border}`, borderRadius: '14px', padding: '10px 12px' }}>
            <label style={{ display: 'block', color: c.muted, fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>Sabaq (Reference)</label>
            <input
              value={sabaqDraft.reference}
              onChange={(e) => setSabaqDraft(prev => ({ ...prev, reference: e.target.value, done: false }))}
              placeholder="Surah Baqarah"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: c.text, fontWeight: '800' }}
            />
          </div>

          {sabaqDraft.done && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: c.gold, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color={c.gold} />
              Mubarak ho! Aaj ka Sabaq mukammal.
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              onClick={markSabaqDone}
              disabled={sabaqDraft.done}
              style={{
                flex: 1,
                backgroundColor: sabaqDraft.done ? 'var(--bg-color)' : c.gold,
                color: sabaqDraft.done ? c.muted : '#000',
                border: sabaqDraft.done ? `1px solid ${c.border}` : 'none',
                padding: '12px 12px',
                borderRadius: '14px',
                cursor: sabaqDraft.done ? 'not-allowed' : 'pointer',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <CheckCircle2 size={18} color={sabaqDraft.done ? c.muted : '#000'} />
              Done
            </button>
            <button
              onClick={resetSabaq}
              style={{
                backgroundColor: 'var(--bg-color)',
                border: `1px solid ${c.border}`,
                color: c.text,
                padding: '12px 14px',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: '900'
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sabaqi Card */}
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '16px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, color: c.muted, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Sabaqi (Recent Lessons)</p>
              <h4 style={{ margin: '6px 0 0 0', color: c.gold, fontSize: '18px', fontWeight: '900' }}>Last 7 din ka revision</h4>
            </div>
            <button onClick={() => setShowSabaqiAdd(true)} style={{ backgroundColor: 'var(--divider-color)', border: `1px solid ${c.border}`, color: c.gold, padding: '10px 12px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add
            </button>
          </div>

          <div style={{ marginTop: '12px' }}>
            {sabaqiRecent.length === 0 ? (
              <div style={{ padding: '14px', borderRadius: '14px', border: `1px dashed ${c.border}`, color: c.muted, fontWeight: '800' }}>
                Abhi koi sabaqi record nahi. Add karke 5-7 din ka cycle maintain karein.
              </div>
            ) : (
              sabaqiRecent.slice(0, 20).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', padding: '12px 12px', borderRadius: '14px', border: `1px solid ${c.border}`, backgroundColor: 'var(--bg-color)', marginBottom: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, color: c.muted, fontSize: '12px', fontWeight: '800' }}>{item.date}</p>
                    <p style={{ margin: '6px 0 0 0', color: c.text, fontWeight: '900', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.reference}
                    </p>
                    {item.range ? (
                      <p style={{ margin: '6px 0 0 0', color: c.gold, fontWeight: '900', fontSize: '13px' }}>
                        Aayat: {item.range}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => deleteEntry(item.id)}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manzil Card */}
        <div style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: '18px', padding: '16px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, color: c.muted, fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Manzil (Revision)</p>
              <h4 style={{ margin: '6px 0 0 0', color: c.gold, fontSize: '18px', fontWeight: '900' }}>Purana hifz ka revision</h4>
            </div>
            <button onClick={() => setShowManzilAdd(true)} style={{ backgroundColor: 'var(--divider-color)', border: `1px solid ${c.border}`, color: c.gold, padding: '10px 12px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add
            </button>
          </div>

          <div style={{ marginTop: '12px' }}>
            {manzilList.length === 0 ? (
              <div style={{ padding: '14px', borderRadius: '14px', border: `1px dashed ${c.border}`, color: c.muted, fontWeight: '800' }}>
                Manzil revision add karein (example: Juz 1-2, 10 pages, etc).
              </div>
            ) : (
              manzilList.slice(0, 20).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', padding: '12px 12px', borderRadius: '14px', border: `1px solid ${c.border}`, backgroundColor: 'var(--bg-color)', marginBottom: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, color: c.muted, fontSize: '12px', fontWeight: '800' }}>{item.date}</p>
                    <p style={{ margin: '6px 0 0 0', color: c.text, fontWeight: '900', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.reference}
                    </p>
                    {item.pace ? (
                      <p style={{ margin: '6px 0 0 0', color: c.gold, fontWeight: '900', fontSize: '13px' }}>
                        Raftar: {item.pace}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => deleteEntry(item.id)}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', left: 16, right: 16, bottom: 18, backgroundColor: '#0b1220', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '16px', padding: '14px 14px', zIndex: 200, boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color={c.gold} />
            <div>
              <p style={{ margin: 0, color: c.gold, fontWeight: '900' }}>{toast.title}</p>
              <p style={{ margin: '4px 0 0 0', color: c.muted, fontSize: '13px', fontWeight: '700' }}>{toast.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Sabaqi Sheet */}
      {showSabaqiAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 120, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: c.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', borderTop: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: c.gold, fontSize: '16px', fontWeight: '900' }}>Add Sabaqi</h3>
              <button onClick={() => setShowSabaqiAdd(false)} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontWeight: '900' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="date" value={sabaqiForm.date} onChange={(e) => setSabaqiForm(prev => ({ ...prev, date: e.target.value }))} style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '12px', borderRadius: '12px', outline: 'none' }} />
              <input value={sabaqiForm.ayatRange} onChange={(e) => setSabaqiForm(prev => ({ ...prev, ayatRange: e.target.value }))} placeholder="Aayat (e.g., 1-10)" style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '12px', borderRadius: '12px', outline: 'none' }} />
            </div>
            <input value={sabaqiForm.reference} onChange={(e) => setSabaqiForm(prev => ({ ...prev, reference: e.target.value }))} placeholder="Reference (e.g., Surah Baqarah)" style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '12px', borderRadius: '12px', outline: 'none', marginBottom: '12px' }} />
            <button onClick={addSabaqi} style={{ width: '100%', backgroundColor: c.gold, color: '#000', border: 'none', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 18px rgba(212,175,55,0.18)' }}>
              <Save size={18} /> Save
            </button>
          </div>
        </div>
      )}

      {/* Add Manzil Sheet */}
      {showManzilAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 120, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: c.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '20px', borderTop: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: c.gold, fontSize: '16px', fontWeight: '900' }}>Add Manzil</h3>
              <button onClick={() => setShowManzilAdd(false)} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontWeight: '900' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="date" value={manzilForm.date} onChange={(e) => setManzilForm(prev => ({ ...prev, date: e.target.value }))} style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '12px', borderRadius: '12px', outline: 'none' }} />
              <input value={manzilForm.pace} onChange={(e) => setManzilForm(prev => ({ ...prev, pace: e.target.value }))} placeholder="Raftar (e.g., 10 pages)" style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '12px', borderRadius: '12px', outline: 'none' }} />
            </div>
            <input value={manzilForm.reference} onChange={(e) => setManzilForm(prev => ({ ...prev, reference: e.target.value }))} placeholder="Reference (e.g., Juz 1-2 / Surah Yaseen)" style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: c.text, padding: '12px', borderRadius: '12px', outline: 'none', marginBottom: '12px' }} />
            <button onClick={addManzil} style={{ width: '100%', backgroundColor: c.gold, color: '#000', border: 'none', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 18px rgba(212,175,55,0.18)' }}>
              <Save size={18} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HifzTracker;

function RotatePillIcon({ color = '#d4af37' }) {
  // Lightweight premium-looking icon (no new deps) — avoids adding another package.
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 4v6h-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ProgressRing({ percent = 0, size = 56, stroke = 7, color = '#d4af37', track = 'rgba(255,255,255,0.1)' }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  const gap = c - dash;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Progress ${p}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" textAnchor="middle" fill={color} fontSize="12" fontWeight="900" dominantBaseline="middle">
        {p}%
      </text>
    </svg>
  );
}
