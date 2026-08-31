import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Bookmark, X, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';

const Bookmarks = ({ onBack, onOpenReading }) => {
  const { theme } = useSettings();
  const [favorites, setFavorites] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem('quran_favorite_surahs') || '[]'));
      setBookmarks(JSON.parse(localStorage.getItem('quran_bookmarks') || '[]'));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const removeFavorite = (id, type) => {
    const next = favorites.filter(s => !(s.id === id && s.type === type));
    setFavorites(next);
    localStorage.setItem('quran_favorite_surahs', JSON.stringify(next));
  };

  const removeBookmark = (surahId, ayahNumber) => {
    const next = bookmarks.filter(b => !(b.surahId === surahId && b.ayahNumber === ayahNumber));
    setBookmarks(next);
    localStorage.setItem('quran_bookmarks', JSON.stringify(next));
  };

  const themeColors = {
    dark: { bg: '#080d16', surface: '#0b1220', text: '#fff', muted: '#94a3b8', border: 'rgba(255,255,255,0.06)', gold: '#d4af37' },
    light: { bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', border: 'rgba(0,0,0,0.1)', gold: '#b48600' }
  };
  const c = themeColors[theme] || themeColors.dark;

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: c.surface, borderBottom: `1px solid ${c.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: c.text, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <ArrowLeft />
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: c.gold, margin: '0 0 0 15px' }}>
          Bookmarks & Favorites
        </h2>
      </div>

      <div style={{ padding: '20px', paddingBottom: '80px' }}>

        {/* Favorite Surahs Section */}
        <div style={{ marginBottom: '35px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: c.text, fontSize: '18px', marginBottom: '15px' }}>
            <Heart color="#ef4444" fill="#ef4444" size={22} /> Favorite Surahs
          </h3>

          {favorites.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: c.muted, backgroundColor: c.surface, borderRadius: '16px', border: `1px dashed ${c.border}` }}>
              Abhi tak koi Surah pasandida mein shamil nahi ki gayi.
              <br /><span style={{ fontSize: '12px', marginTop: '6px', display: 'inline-block' }}>Surah parhte waqt Dil (Heart) icon par click karein.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {favorites.map((fav, i) => (
                <div key={i} onClick={() => onOpenReading({ type: fav.type, id: fav.id })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: c.surface, borderRadius: '16px', cursor: 'pointer', border: `1px solid ${c.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.gold, fontWeight: 'bold', fontSize: '16px' }}>
                      {fav.id}
                    </div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 'bold', color: c.text }}>{fav.name}</div>
                      <div style={{ fontSize: '12px', color: c.muted, textTransform: 'capitalize', marginTop: '2px' }}>{fav.type}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ChevronRight size={18} color={c.muted} />
                    <button onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id, fav.type); }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#ef4444', display: 'flex', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarked Ayahs Section */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: c.text, fontSize: '18px', marginBottom: '15px' }}>
            <Bookmark color={c.gold} fill={c.gold} size={22} /> Saved Ayahs
          </h3>

          {bookmarks.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: c.muted, backgroundColor: c.surface, borderRadius: '16px', border: `1px dashed ${c.border}` }}>
              Abhi tak koi Ayat bookmark nahi ki gayi.
              <br /><span style={{ fontSize: '12px', marginTop: '6px', display: 'inline-block' }}>Tilawat ke doran Ayat ke sath walay Bookmark icon par click karein.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bookmarks.map((bm, i) => (
                <div key={i} onClick={() => onOpenReading({ type: 'surah', id: bm.surahId, targetAyah: bm.globalAyahNumber || bm.ayahNumber })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: c.surface, borderRadius: '16px', cursor: 'pointer', border: `1px solid ${c.border}`, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.gold }}>
                      <Bookmark size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 'bold', color: c.text }}>{bm.surahName}</div>
                      <div style={{ fontSize: '13px', color: c.gold, marginTop: '4px', fontWeight: '500' }}>Ayah {bm.ayahNumber}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ChevronRight size={18} color={c.muted} />
                    <button onClick={(e) => { e.stopPropagation(); removeBookmark(bm.surahId, bm.ayahNumber); }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#ef4444', display: 'flex', cursor: 'pointer' }}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Bookmarks;