import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, X, WifiOff, CheckCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { quranService } from '../utils/fetchQuran.js';

const JuzzIndex = ({ onBack, onOpenReading }) => {
  const { palette } = useSettings();
  const juzzList = Array.from({ length: 30 }, (_, i) => i + 1);
  const [selectedJuzz, setSelectedJuzz] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isQuranDownloaded, setIsQuranDownloaded] = useState(false);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if Quran is downloaded
  useEffect(() => {
    const checkDownloadStatus = async () => {
      const stats = await quranService.getOfflineStats();
      setIsQuranDownloaded(stats.totalSurahs > 0);
    };
    checkDownloadStatus();
  }, []);

  const juzzNamesAr = [
    "آلم", "سَيَقُولُ", "تِلْكَ الرُّسُلُ", "لَنْ تَنَالُوا", "وَالْمُحْصَنَاتُ",
    "لَا يُحِبُّ اللَّهُ", "وَإِذَا سَمِعُوا", "وَلَوْ أَنَّنَا", "قَالَ الْمَلَأُ", "وَاعْلَمُوا",
    "يَعْتَذِرُونَ", "وَمَا مِنْ دَابَّةٍ", "وَمَا أُبَرِّئُ", "رُبَمَا", "سُبْحَانَ الَّذِي",
    "قَالَ أَلَمْ", "اقْتَرَبَ لِلنَّاسِ", "قَدْ أَفْلَحَ", "وَقَالَ الَّذِينَ", "أَمَّنْ خَلَقَ",
    "اتْلُ مَا أُوحِيَ", "وَمَنْ يَقْنُتْ", "وَمَا لِيَ", "فَمَنْ أَظْلَمُ", "إِلَيْهِ يُرَدُّ",
    "حم", "ق قَالَ فَمَا خَطْبُكُمْ", "قَدْ سَمِعَ اللَّهُ", "تَبَارَكَ الَّذِي", "عَمَّ يَتَسَاءَلُونَ"
  ];

  const handleQuarterSelect = (quarterStr) => {
    // quarterStr can be 'start', '1/4', '1/2', '3/4'
    onOpenReading({ type: 'juzz', id: selectedJuzz, quarter: quarterStr });
    setSelectedJuzz(null);
  };

  return (
    <div style={{ backgroundColor: palette.bg, minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: palette.surface, borderBottom: `1px solid ${palette.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} color={palette.text} />
          </button>
          <h2 style={{ margin: '0 0 0 16px', fontSize: '20px', fontWeight: 'bold', color: palette.text }}>Juzz Index</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isOnline && <WifiOff size={16} color="#ef4444" />}
          {isQuranDownloaded && <CheckCircle size={16} color="#22c55e" />}
        </div>
      </div>

      {/* ── Juzz List ── */}
      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {juzzList.map(juzzNum => (
            <div
              key={juzzNum}
              onClick={() => setSelectedJuzz(juzzNum)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--card-color)',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '12px',
                border: '1px solid var(--divider-color)',
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-color)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  color: palette.gold,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: '1px solid rgba(212, 175, 55, 0.2)'
                }}>
                  {juzzNum}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: palette.text, fontWeight: '600' }}>Juzz {juzzNum}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: palette.muted, marginTop: '4px' }}>
                    {juzzNamesAr[juzzNum - 1] || 'Juzz'}
                  </p>
                </div>
              </div>
              <div style={{ fontSize: '22px', color: palette.gold, fontWeight: 'bold' }}>
                {juzzNamesAr[juzzNum - 1] || 'Juzz'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Options Popup Modal ── */}
      {selectedJuzz && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: palette.surface, border: `1px solid ${palette.gold}`, borderRadius: '24px', width: '100%', maxWidth: '340px', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setSelectedJuzz(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X color={palette.muted} /></button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <BookOpen color={palette.gold} size={24} />
              </div>
              <h3 style={{ color: palette.text, margin: 0, fontSize: '20px' }}>Juzz {selectedJuzz}</h3>
              <p style={{ color: palette.muted, fontSize: '14px', marginTop: '4px' }}>{juzzNamesAr[selectedJuzz - 1]}</p>
              <p style={{ color: palette.muted, fontSize: '12px', marginTop: '8px' }}>Kahan se shuru karein?</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleQuarterSelect('start')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  color: palette.text,
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center'
                }}
              >
                Start from Beginning
              </button>

              <button
                onClick={() => handleQuarterSelect('1/4')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--divider-color)',
                  border: '1px solid var(--divider-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                From Quarter 1 (Ruku 1)
              </button>

              <button
                onClick={() => handleQuarterSelect('1/2')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: palette.text,
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                From Half (Quarter 2)
              </button>

              <button
                onClick={() => handleQuarterSelect('3/4')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: palette.text,
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                From Quarter 3 (Ruku 2)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JuzzIndex;
