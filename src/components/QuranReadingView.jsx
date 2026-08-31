import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Bookmark, Settings, Loader2, X, Mic, Sun, Moon, CheckCircle, Repeat, Wifi, WifiOff, Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { quranService } from '../utils/fetchQuran.js';

// --- FINAL BULLETPROOF FIX: Official Quran.com CDN for missing 5 + TVQuran for working 8 ---
const qarisList = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', img: 'https://tvquran.com/uploads/authors/images/%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%20%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A.jpg' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdur-Rahman as-Sudais', img: 'https://static.qurancdn.com/images/reciters/3/abdur-rahman-as-sudais-profile.jpeg' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly', img: 'https://tvquran.com/uploads/authors/images/%D9%85%D8%A7%D9%87%D8%B1%20%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D9%82%D9%84%D9%8A.jpg' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', img: 'https://tvquran.com/uploads/authors/images/%D9%85%D8%AD%D9%85%D9%88%D8%AF%20%D8%AE%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A.jpg' },
  { id: 'ar.yasseraldossari', name: 'Yasser Al-Dosari', img: 'https://tvquran.com/uploads/authors/images/%D9%8A%D8%A7%D8%B3%D8%B1%20%D8%A7%D9%84%D8%AF%D9%88%D8%B3%D8%B1%D9%8A.jpg' },
  { id: 'ar.shaatree', name: 'Abu Bakr Al-Shatri', img: 'https://static.qurancdn.com/images/reciters/4/abu-bakr-al-shatri-profile.jpeg' },
  { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', img: 'https://tvquran.com/uploads/authors/images/%D9%85%D8%AD%D9%85%D8%AF%20%D8%A3%D9%8A%D9%88%D8%A8.jpg' },
  { id: 'ar.minshawi', name: 'Mohamed Al-Minshawi', img: 'https://static.qurancdn.com/images/reciters/6/minshawi-profile.jpeg' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit Abdul Samad', img: 'https://static.qurancdn.com/images/reciters/1/abdulbaset-profile.jpeg' },
  { id: 'ar.hudhaify', name: 'Ali Al Hudhaify', img: 'https://tvquran.com/uploads/authors/images/%D8%B9%D9%84%D9%8A%20%D8%A7%D9%84%D8%AD%D8%B0%D9%8A%D9%81%D9%8A.jpg' },
  { id: 'ar.muhammadjibreel', name: 'Muhammad Jibreel', img: 'https://tvquran.com/uploads/authors/images/%D9%85%D8%AD%D9%85%D8%AF%20%D8%AC%D8%A8%D8%B1%D9%8A%D9%84.jpg' },
  { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', img: 'https://static.qurancdn.com/images/reciters/12/abdullah-basfar-profile.jpeg' },
  { id: 'ar.saoodshuraym', name: 'Saood Ash-Shuraim', img: 'https://tvquran.com/uploads/authors/images/%D8%B3%D8%B9%D9%88%D8%AF%20%D8%A7%D9%84%D8%B4%D8%B1%D9%8A%D9%85.jpg' },
].map(q => ({ ...q }));

const normalizeQariId = (id) => {
  const raw = String(id || '').trim();
  if (!raw) return 'ar.alafasy';
  if (raw === 'ar.ayyoub') return 'ar.muhammadayyoub';
  if (raw === 'ar.abdulbasitmurattal') return 'ar.abdulsamad';
  if (raw === 'ar.ahmedibnaliajami') return 'ar.ahmedajamy';
  return raw;
};

const QuranReadingView = ({ contextData, onBack, onOpenReading }) => {
  const globalAudioRef = useRef(null);

  const [localContext, setLocalContext] = useState(contextData);

  useEffect(() => {
    setLocalContext(contextData);
  }, [contextData]);

  const initializeAudio = () => {
    if (!globalAudioRef.current) {
      globalAudioRef.current = new Audio();
      globalAudioRef.current.crossOrigin = 'anonymous';
    }
    return globalAudioRef.current;
  };

  const stopAllAudio = () => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
      globalAudioRef.current.currentTime = 0;
      globalAudioRef.current.src = '';
    }
    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach(audio => {
      if (audio !== globalAudioRef.current) {
        audio.pause();
        audio.src = '';
        audio.remove();
      }
    });
  };

  const {
    theme, setTheme,
    quranFontSize, setQuranFontSize,
    quranScriptType, setQuranScriptType,
    quranTranslation, setQuranTranslation,
    quranShowTranslation, setQuranShowTranslation,
    quranQari, setQuranQari
  } = useSettings();

  const [ayahs, setAyahs] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQariModal, setShowQariModal] = useState(false);

  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let hideTimer;
    if (isPlaying && showControls) {
      hideTimer = setTimeout(() => { setShowControls(false); }, 3500);
    }
    return () => clearTimeout(hideTimer);
  }, [isPlaying, showControls]);

  // AYAH BOOKMARKS
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quran_bookmarks') || '[]'); } catch { return []; }
  });

  // --- NEW: SURAH / JUZZ FAVORITES ---
  const [favoriteSurahs, setFavoriteSurahs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quran_favorite_surahs') || '[]'); } catch { return []; }
  });

  const [readingMode, setReadingMode] = useState('mushaf');
  const fontSize = quranFontSize;
  const scriptType = quranScriptType;
  const translation = quranTranslation;
  const selectedQari = normalizeQariId(quranQari || localContext?.reciter || 'ar.alafasy');
  const [sliderSize, setSliderSize] = useState(quranFontSize);
  const [currentPage, setCurrentPage] = useState(0);

  const groupedPages = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];
    const pagesMap = new Map();
    ayahs.forEach((ayah, idx) => {
      const p = ayah.page || Math.floor(idx / 15) + 1;
      if (!pagesMap.has(p)) pagesMap.set(p, []);
      pagesMap.get(p).push({ ayah, index: idx });
    });
    return Array.from(pagesMap.values());
  }, [ayahs]);

  const mushafScrollRef = useRef(null);
  const mushafPageRefs = useRef([]);
  const ayahRefs = useRef([]);

  const goToNextPage = () => {
    if (currentPage < groupedPages.length - 1) {
      setCurrentPage(currentPage + 1);
      mushafPageRefs.current[currentPage + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      mushafPageRefs.current[currentPage - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScroll = () => {
    if (mushafScrollRef.current && readingMode === 'mushaf') {
      let newPage = currentPage;
      mushafPageRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            newPage = index;
          }
        }
      });
      if (newPage !== currentPage) setCurrentPage(newPage);
    }
  };

  const type = localContext?.type || 'surah';
  const effectiveId = localContext?.id ?? localContext?.pageId ?? (type === 'surah' ? localContext?.surahId : undefined) ?? 1;

  const themeColors = {
    dark: { bg: '#080d16', surface: '#0b1220', text: '#fff', muted: '#94a3b8', border: 'rgba(255,255,255,0.06)', gold: '#d4af37', pageBg: '#09131a' },
    light: { bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', border: 'rgba(0,0,0,0.1)', gold: '#b48600', pageBg: '#fefcf8' }
  };
  const c = themeColors[theme];

  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'online' : 'offline');

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => { setSliderSize(quranFontSize); }, [quranFontSize]);

  useEffect(() => {
    const fetchQuranData = async () => {
      if (!localContext || !effectiveId) return;
      setLoading(true); setError(null);
      try {
        let result;
        if (localContext.type === 'juzz') { result = await quranService.fetchJuzz(effectiveId, scriptType, translation); }
        else if (localContext.type === 'page') { result = await quranService.fetchPage(effectiveId, scriptType, translation); }
        else { result = await quranService.fetchSurah(effectiveId, scriptType, translation); }

        if (result.success) {
          setTitle(localContext.type === 'juzz' ? `Juzz ${effectiveId}` : (localContext.type === 'page' ? `Page ${effectiveId}` : result.name || `Surah ${effectiveId}`));

          setCurrentAyahIndex(0);
          setAyahs(result.ayahs);

          const autoPlayFlag = localStorage.getItem('auto_play_next_surah');
          if (autoPlayFlag === 'true') {
            localStorage.removeItem('auto_play_next_surah');
            setTimeout(() => {
              setIsPlaying(true);
              setShowControls(false);
            }, 800);
          }
        } else { throw new Error(result.error || 'Failed to load Quran data'); }
      } catch (err) { setError("Data load nahi ho saka. Internet connection check karein ya dobara koshish karein."); }
      finally { setLoading(false); }
    };
    fetchQuranData();
  }, [localContext, translation, effectiveId, scriptType]);

  useEffect(() => {
    try { localStorage.setItem('quran_script_type', scriptType); } catch { }
  }, [scriptType]);

  // AUDIO LOGIC 
  useEffect(() => {
    let isComponentMounted = true;
    const audioUrlCache = new Map();

    if (isPlaying && ayahs.length > 0) {
      const ayah = ayahs[currentAyahIndex];
      if (ayah) {
        const qariId = selectedQari || 'ar.alafasy';

        const playFromUrl = (audioUrl) => {
          if (!isComponentMounted) return;
          if (!audioUrl) { setIsPlaying(false); return; }
          const currentAudio = initializeAudio();
          stopAllAudio();
          currentAudio.oncanplay = () => { currentAudio.play().catch(() => setIsPlaying(false)); };
          currentAudio.onerror = () => setIsPlaying(false);
          currentAudio.onended = () => {
            if (isRepeat) {
              currentAudio.currentTime = 0; currentAudio.play().catch(console.error);
            } else if (currentAyahIndex < ayahs.length - 1) {
              setCurrentAyahIndex(currentAyahIndex + 1); setIsPlaying(true);
            } else {
              setIsPlaying(false);

              if (localContext?.type === 'juzz') {
                const currentJuz = parseInt(localContext.id || effectiveId);
                if (currentJuz < 30) {
                  localStorage.setItem('auto_play_next_surah', 'true');
                  setLocalContext({ type: 'juzz', id: currentJuz + 1 });
                  if (onOpenReading) onOpenReading({ type: 'juzz', id: currentJuz + 1 });
                } else { setShowControls(true); }
              } else {
                const actualSurahId = ayah?.surah?.number || parseInt(effectiveId);
                if (actualSurahId && actualSurahId < 114) {
                  localStorage.setItem('auto_play_next_surah', 'true');
                  setLocalContext({ type: 'surah', id: actualSurahId + 1 });
                  if (onOpenReading) onOpenReading({ type: 'surah', id: actualSurahId + 1 });
                } else { setShowControls(true); }
              }
            }
          };
          currentAudio.src = audioUrl; currentAudio.load();
        }

        const getAyahAudioUrl = async () => {
          if (!ayah) return null;
          const globalAyahNumber = ayah?.number;
          const ayahNumberInSurah = ayah?.numberInSurah;

          const actualSurahId = ayah?.surah?.number || (localContext?.type === 'surah' ? effectiveId : null) || localContext?.surahId || 1;

          if (!actualSurahId || !globalAyahNumber) return null;
          const key = `${qariId}:${globalAyahNumber}`;
          if (audioUrlCache.has(key)) return audioUrlCache.get(key);
          const url = await quranService.getAyahAudioUrl(qariId, actualSurahId, globalAyahNumber, ayahNumberInSurah);
          audioUrlCache.set(key, url);
          return url;
        };

        getAyahAudioUrl().then(playFromUrl);
      }
    }
    return () => { isComponentMounted = false; stopAllAudio(); };
  }, [isPlaying, currentAyahIndex, selectedQari, ayahs, isRepeat, localContext, onOpenReading]);

  // AYAH BOOKMARK TOGGLE
  const isAyahBookmarked = (ayah) => {
    if (!ayah) return false;
    const surahId = ayah?.surah?.number || effectiveId;
    const ayahNumber = ayah?.numberInSurah;
    if (!surahId || !ayahNumber) return false;
    return Array.isArray(bookmarks) && bookmarks.some(b => b?.surahId === surahId && b?.ayahNumber === ayahNumber);
  };

  const toggleBookmark = (ayah) => {
    if (!ayah) return;
    const bm = { surahId: effectiveId, surahName: title || 'Surah', ayahNumber: ayah?.numberInSurah, globalAyahNumber: ayah?.number || null, juz: ayah?.juz || null, page: ayah?.page || null, createdAt: new Date().toISOString() };
    if (!bm.surahId || !bm.ayahNumber) return;
    setBookmarks(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some(b => b?.surahId === bm.surahId && b?.ayahNumber === bm.ayahNumber);
      const next = exists ? list.filter(b => !(b?.surahId === bm.surahId && b?.ayahNumber === bm.ayahNumber)) : [bm, ...list];
      try { localStorage.setItem('quran_bookmarks', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  // SURAH FAVORITE TOGGLE
  const isSurahFavorited = () => {
    return Array.isArray(favoriteSurahs) && favoriteSurahs.some(s => s.id === effectiveId && s.type === (localContext?.type || 'surah'));
  };

  const toggleSurahFavorite = (e) => {
    e.stopPropagation();
    const fav = {
      id: effectiveId,
      type: localContext?.type || 'surah',
      name: title || 'Unknown',
      addedAt: new Date().toISOString()
    };

    setFavoriteSurahs(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some(s => s.id === fav.id && s.type === fav.type);
      const next = exists ? list.filter(s => !(s.id === fav.id && s.type === fav.type)) : [fav, ...list];
      try { localStorage.setItem('quran_favorite_surahs', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  useEffect(() => {
    if (!localContext) return;
    const ayah = ayahs?.[currentAyahIndex] || ayahs?.[0] || null;
    const surahName = (ayah && ayah.surah && typeof ayah.surah.name === 'string' && ayah.surah.name) || (typeof title === 'string' && title) || '';
    const surahIdFromAyah = ayah?.surah?.number;
    const juzFromAyah = ayah?.juz;
    let lastReadTitle = '';

    if (localContext.type === 'page') { lastReadTitle = surahName ? `Page ${localContext.id} (${surahName})` : `Page ${localContext.id}`; }
    else if (localContext.type === 'juzz') { lastReadTitle = surahName ? `Juzz ${juzFromAyah || localContext.id} (${surahName})` : `Juzz ${juzFromAyah || localContext.id}`; }
    else { lastReadTitle = surahName || `Surah ${localContext.id || localContext.surahId || ''}`.trim(); }

    localStorage.setItem('quran_last_read', JSON.stringify({
      title: lastReadTitle,
      type: localContext.type,
      id: localContext.id || juzFromAyah || surahIdFromAyah,
      surahId: surahIdFromAyah || localContext.surahId || localContext.id,
      surahName: surahName || null,
      juz: juzFromAyah || null,
      page: localContext.type === 'page' ? localContext.id : null,
      ayahNumber: ayah?.numberInSurah || currentAyahIndex + 1,
      globalAyahNumber: ayah?.number || null,
      targetAyah: ayah?.number
    }));
  }, [currentAyahIndex, localContext, ayahs, title]);

  useEffect(() => {
    if (!loading && ayahs.length > 0) {
      let targetIndex = 0; let shouldScroll = false;
      if (localContext?.targetAyah) {
        const foundIndex = ayahs.findIndex(a => (a.numberInSurah || a.number) === localContext.targetAyah);
        if (foundIndex !== -1) { targetIndex = foundIndex; shouldScroll = true; }
      } else if (localContext?.quarter && localContext.quarter !== 'start') {
        const juzzNum = parseInt(localContext.id); let targetHizbQuarter = 0;
        if (localContext.quarter === '1/4') targetHizbQuarter = (juzzNum - 1) * 8 + 3;
        else if (localContext.quarter === '1/2') targetHizbQuarter = (juzzNum - 1) * 8 + 5;
        else if (localContext.quarter === '3/4') targetHizbQuarter = (juzzNum - 1) * 8 + 7;
        const foundIndex = ayahs.findIndex(a => a.hizbQuarter === targetHizbQuarter);
        if (foundIndex !== -1) { targetIndex = foundIndex; shouldScroll = true; }
      }
      if (shouldScroll && targetIndex >= 0 && targetIndex < ayahs.length) {
        setCurrentAyahIndex(targetIndex);
        setTimeout(() => { ayahRefs.current[targetIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 500);
      }
    }
  }, [loading, ayahs, localContext]);

  const arabicFontFamily = "'Scheherazade New', serif";

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Noto+Nastaliq+Urdu:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap');
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        
        .hafizi-text {
          text-align: justify;
          text-justify: inter-word;
          white-space: pre-wrap;
        }
        @media (max-width: 480px) {
          .hafizi-text {
            text-align: center;
            text-align-last: center;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: c.surface,
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: `1px solid ${c.border}`,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
        transform: showControls ? 'translateY(0)' : 'translateY(-100%)',
        opacity: showControls ? 1 : 0,
        pointerEvents: showControls ? 'auto' : 'none'
      }}>
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} style={{ background: 'none', border: 'none' }}><ArrowLeft color={c.text} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: c.gold, margin: 0 }}>
            {(typeof title === 'string' && title.trim()) ? title : 'Loading...'}
          </h2>
          {networkStatus === 'offline' && <WifiOff size={16} color="#ef4444" title="Offline Mode" />}
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={toggleSurahFavorite} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="Favorite Surah">
            <Heart size={22} color={isSurahFavorited() ? '#ef4444' : c.gold} fill={isSurahFavorited() ? '#ef4444' : 'none'} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Settings size={22} color={c.gold} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        onClick={() => setShowControls(prev => !prev)}
        ref={mushafScrollRef}
        onScroll={handleScroll}
        style={{
          padding: '20px', paddingTop: '80px', paddingBottom: '120px',
          minHeight: '100vh', cursor: 'pointer', overflowY: 'auto'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}><Loader2 className="spinner" color="#d4af37" size={40} /></div>
        ) : error ? (
          <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold' }}>Offline Error</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px' }}>{error}</p>
            <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: 'var(--gold-color)', color: '#000', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Wapas Jayen</button>
          </div>
        ) : (
          (!loading && !error && ayahs && Array.isArray(ayahs) && ayahs.length > 0) && (
            readingMode === 'mushaf' ? (
              groupedPages.map((pageGroup, pageIdx) => {
                const firstAyah = pageGroup[0]?.ayah;
                const pageSurahName = firstAyah?.surah?.name || title;
                const pageJuz = firstAyah?.juz || localContext?.id || 1;
                const actualPageNum = firstAyah?.page || pageIdx + 1;

                return (
                  <div
                    key={pageIdx} ref={el => mushafPageRefs.current[pageIdx] = el}
                    style={{
                      backgroundColor: c.pageBg, border: `2px solid ${c.gold}`, borderRadius: '12px',
                      padding: '3px', marginBottom: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{
                      border: `1px solid ${c.gold}`, borderRadius: '8px', padding: '10px 15px 25px 15px',
                      direction: 'rtl', minHeight: '60vh'
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: `2px solid ${c.gold}`, paddingBottom: '8px', marginBottom: '15px',
                        fontFamily: arabicFontFamily, fontSize: '18px', color: c.gold, fontWeight: 'bold'
                      }}>
                        <span style={{ flex: 1, textAlign: 'right' }}>الجزء {pageJuz}</span>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: '16px', color: c.text }}>{actualPageNum}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{pageSurahName}</span>
                      </div>

                      <div className="hafizi-text" style={{ lineHeight: '2.5' }}>
                        {pageGroup.map(({ ayah, index }) => {
                          const bookmarked = isAyahBookmarked(ayah);
                          return (
                            <span
                              key={index} ref={el => (ayahRefs.current[index] = el)}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!showControls) { setShowControls(true); }
                                else { setCurrentAyahIndex(index); setIsPlaying(true); setShowControls(false); }
                              }}
                              style={{ color: currentAyahIndex === index ? c.gold : c.text, fontSize: `${fontSize + 6}px`, fontFamily: arabicFontFamily, transition: 'color 0.2s ease', display: 'inline' }}
                            >
                              {ayah?.text || ayah?.arabicText || ''}
                              <span style={{ color: c.gold, fontSize: '0.8em', margin: '0 6px', fontWeight: 'bold' }}>﴿{ayah?.numberInSurah || ayah?.number}﴾</span>
                              <button onClick={(e) => { e.stopPropagation(); toggleBookmark(ayah); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: '0 4px', verticalAlign: 'middle' }} title="Bookmark">
                                <Bookmark size={fontSize * 0.7} color={bookmarked ? c.gold : 'rgba(148, 163, 184, 0.5)'} fill={bookmarked ? c.gold : 'none'} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              ayahs.map((ayah, i) => (
                <div
                  key={i} ref={el => ayahRefs.current[i] = el}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!showControls) { setShowControls(true); }
                    else { setCurrentAyahIndex(i); setIsPlaying(true); setShowControls(false); }
                  }}
                  style={{ marginBottom: '30px', padding: '15px', borderRadius: '12px', backgroundColor: currentAyahIndex === i ? `${c.gold}15` : 'transparent', border: `1px solid ${currentAyahIndex === i ? c.gold : 'transparent'}`, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ textAlign: 'right', fontSize: `${fontSize}px`, lineHeight: '1.8', fontFamily: arabicFontFamily, color: 'var(--text-primary)', flex: 1 }}>{ayah?.arabicText || ayah?.text || ''}</div>
                    <button onClick={(e) => { e.stopPropagation(); toggleBookmark(ayah); }} style={{ background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '12px', padding: '8px', cursor: 'pointer', flexShrink: 0 }}>
                      <Bookmark size={18} color={isAyahBookmarked(ayah) ? c.gold : c.muted} fill={isAyahBookmarked(ayah) ? c.gold : 'none'} />
                    </button>
                  </div>
                  {quranShowTranslation ? (
                    <div style={{ textAlign: 'right', fontSize: `${fontSize - 10}px`, color: c.muted, marginTop: '12px', lineHeight: '2.2', borderTop: `1px dashed ${c.border}`, paddingTop: '10px', fontFamily: "'Noto Nastaliq Urdu', serif" }}>{ayah?.transText || ''}</div>
                  ) : null}
                </div>
              ))
            )
          )
        )}
      </div>

      {/* Settings Modals */}
      {showQariModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: c.surface, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3 style={{ margin: 0 }}>Select Qari</h3><button onClick={() => setShowQariModal(false)} style={{ background: 'none', border: 'none' }}><X color={c.muted} /></button></div>
            {qarisList.map(q => {
              const initials = q.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div key={q.id} onClick={() => { setQuranQari(q.id); setShowQariModal(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderRadius: '12px', marginBottom: '8px', backgroundColor: selectedQari === q.id ? `${c.gold}20` : 'transparent', border: `1px solid ${selectedQari === q.id ? c.gold : c.border}` }}>
                  <img src={q.img} onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt={q.name} />
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: c.gold, display: 'none', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#000' }}>{initials}</div>
                  <span style={{ fontWeight: selectedQari === q.id ? 'bold' : 'normal', color: c.text }}>{q.name}</span>
                  {selectedQari === q.id && <CheckCircle size={20} color={c.gold} style={{ marginLeft: 'auto' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: c.surface, padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 100, borderTop: `1px solid ${c.gold}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h3 style={{ margin: 0 }}>Settings</h3><button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none' }}><X color={c.muted} /></button></div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Reading Mode</label>
            <select value={readingMode} onChange={(e) => setReadingMode(e.target.value)} style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', outline: 'none' }}>
              <option value="translation" style={{ color: '#000' }}>Tarjuma ke Sath (Ayah View)</option><option value="mushaf" style={{ color: '#000' }}>Bina Tarjuma (Mushaf View)</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Arabic Script</label>
            <select value={scriptType} onChange={(e) => setQuranScriptType(e.target.value)} style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${c.border}`, color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', outline: 'none' }}>
              <option value="quran-indo-pak" style={{ color: '#000' }}>Indo-Pak</option><option value="quran-uthmani" style={{ color: '#000' }}>Uthmani</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}><span>Font Size</span><span>{fontSize}px</span></div>
            <input type="range" min="20" max="50" value={sliderSize} onChange={(e) => setSliderSize(Number(e.target.value))} onMouseUp={() => setQuranFontSize(sliderSize)} onTouchEnd={() => setQuranFontSize(sliderSize)} style={{ width: '100%', accentColor: '#d4af37' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: c.muted, marginBottom: '8px' }}>Reciter</p>
            <div onClick={() => { setShowSettings(false); setShowQariModal(true); }} style={{ padding: '12px', borderRadius: '12px', border: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: c.text }}>{qarisList.find(q => q.id === selectedQari)?.name}</span><Mic size={18} color={c.gold} /></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ flex: 1, backgroundColor: 'var(--text-primary)', color: 'var(--bg-color)', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {theme === 'dark' ? <><Sun size={20} /> Light Mode</> : <><Moon size={20} /> Dark Mode</>}
            </button>
          </div>
        </div>
      )}

      {/* Audio Player Controls */}
      {ayahs.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, width: '100%', padding: '16px 0', backgroundColor: c.surface, borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
          transform: showControls ? 'translateY(0)' : 'translateY(100%)',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          zIndex: 50
        }}>
          {readingMode === 'mushaf' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goToPrevPage(); }} disabled={currentPage === 0} style={{ background: 'none', border: 'none', opacity: currentPage === 0 ? 0.5 : 1 }}><SkipBack color={currentPage === 0 ? c.muted : c.text} /></button>
              <div style={{ color: c.muted, fontSize: '14px', minWidth: '80px', textAlign: 'center' }}>Page {currentPage + 1} / {groupedPages.length}</div>
              <button onClick={(e) => { e.stopPropagation(); goToNextPage(); }} disabled={currentPage >= groupedPages.length - 1} style={{ background: 'none', border: 'none', opacity: currentPage >= groupedPages.length - 1 ? 0.5 : 1 }}><SkipForward color={currentPage >= groupedPages.length - 1 ? c.muted : c.text} /></button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); currentAyahIndex > 0 && setCurrentAyahIndex(currentAyahIndex - 1); }} style={{ background: 'none', border: 'none' }}><SkipBack color={c.text} /></button>
          <button onClick={(e) => {
            e.stopPropagation();
            if (isPlaying) {
              setIsPlaying(false); setShowControls(true);
              if (globalAudioRef.current) { globalAudioRef.current.pause(); }
            } else {
              setIsPlaying(true); setShowControls(false);
            }
          }} style={{ 
            width: '60px', 
            height: '60px', 
            minWidth: '60px',     /* Naya Izafa: Button ko patla hone se rokega */
            minHeight: '60px',    /* Naya Izafa: Button ko chota hone se rokega */
            flexShrink: 0,        /* Naya Izafa: Mobile par pichakne (squeeze hone) nahi dega */
            border: 'none',       /* Naya Izafa: Default border hatane ke liye */
            borderRadius: '50%', 
            backgroundColor: c.gold, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {isPlaying ? <Pause color="#000" fill="#000" /> : <Play color="#000" fill="#000" style={{ marginLeft: '4px' }} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); currentAyahIndex < ayahs.length - 1 && setCurrentAyahIndex(currentAyahIndex + 1); }} style={{ background: 'none', border: 'none' }}><SkipForward color={c.text} /></button>
          <button onClick={(e) => { e.stopPropagation(); setIsRepeat(v => !v); }} style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Repeat color={isRepeat ? c.gold : c.muted} /></button>
        </div>
      )}
    </div>
  );
};

export default QuranReadingView;