import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';

const SmartSearch = ({ onBack, onOpenReading, initialQuery = '' }) => {
  const { palette } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (typeof initialQuery === 'string' && initialQuery.trim()) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Smart Dictionary for Roman Urdu to Proper Urdu/Arabic
  const romanToUrduDict = {
    "sabar": "صبر",
    "jannat": "جنت",
    "jahannam": "جہنم",
    "dozakh": "جہنم",
    "namaz": "نماز",
    "salah": "صلوۃ",
    "roza": "روزہ",
    "zakat": "زکوۃ",
    "hajj": "حج",
    "dua": "دعا",
    "tawakkul": "توکل",
    "sach": "سچ",
    "jhoot": "جھوٹ",
    "zina": "زنا",
    "shirk": "شرک",
    "tauba": "توبہ",
    "maghfirat": "مغفرت",
    "shukar": "شکر",
    "ilm": "علم",
    "mout": "موت",
    "qayamat": "قیامت",
    "azab": "عذاب",
    "rehmat": "رحمت"
  };

  const performSearch = async (raw) => {
    let originalQuery = (raw || '').trim().toLowerCase();
    if (originalQuery.length < 2) return;

    // Intercept and translate if word exists in dictionary
    let searchQuery = romanToUrduDict[originalQuery] || originalQuery;

    setSearching(true);
    setHasSearched(true);
    
    try {
      // 1. Search in Urdu Translation
      const urduRes = await fetch(`https://api.alquran.cloud/v1/search/${searchQuery}/all/ur.jalandhry`);
      const urduData = await urduRes.json();

      // 2. Search in Arabic Text
      const script = localStorage.getItem('quran_script_type') || 'quran-indo-pak';
      const arabicRes = await fetch(`https://api.alquran.cloud/v1/search/${searchQuery}/all/${script}`);
      const arabicData = await arabicRes.json();

      let foundResults = [];

      if (urduData.code === 200 && urduData.data.matches) {
        foundResults = [...foundResults, ...urduData.data.matches.map(m => ({
          surahId: m.surah.number,
          surahName: m.surah.englishName,
          ayahNum: m.numberInSurah,
          text: m.text,
          type: 'Urdu Tarjuma'
        }))];
      }

      if (arabicData.code === 200 && arabicData.data.matches) {
        foundResults = [...foundResults, ...arabicData.data.matches.map(m => ({
          surahId: m.surah.number,
          surahName: m.surah.englishName,
          ayahNum: m.numberInSurah,
          text: m.text,
          type: 'Arabic Text'
        }))];
      }

      setResults(foundResults);
    } catch (error) {
      console.error("Search Error:", error);
    }
    setSearching(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault(); 
    await performSearch(query);
  };

  // Auto-run search when we land here with an initialQuery (e.g. from Quran Home Fast Search)
  useEffect(() => {
    if (typeof initialQuery === 'string' && initialQuery.trim()) {
      performSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div style={{ backgroundColor: palette.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '16px 20px', backgroundColor: palette.surface, borderBottom: `1px solid ${palette.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none' }}><ArrowLeft color={palette.text} /></button>
          
          <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color={palette.gold} style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              autoFocus
              placeholder="Urdu ya Arabic mein likhein (e.g. صبر)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: `1px solid ${palette.gold}`, backgroundColor: 'rgba(255,255,255,0.05)', color: palette.text, outline: 'none' }}
            />
            <button type="submit" style={{ display: 'none' }}>Search</button>
          </form>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        
        {/* Helper Note for Keyboard */}
        {!hasSearched && (
           <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '12px', border: '1px solid #3b82f6', display: 'flex', gap: '10px', marginBottom: '20px' }}>
             <AlertCircle color="#3b82f6" />
             <p style={{ color: '#bfdbfe', fontSize: '14px', margin: 0 }}>
               Sahi nateeja hasil karne ke liye <b>Urdu Keyboard</b> (jaise: نماز, صبر, جنت) ya <b>Arabic Keyboard</b> ka istemal karein. Roman English (Namaz) par results nahi milenge.
             </p>
           </div>
        )}

        {searching && <div style={{ textAlign: 'center', marginTop: '20px' }}><Loader2 className="spinner" color="#d4af37" size={30} style={{ animation: 'spin 1s linear infinite' }} /></div>}
        
        {!searching && results.map((res, i) => (
          <div key={i} onClick={() => onOpenReading({type:'surah', surahId: res.surahId, targetAyah: res.ayahNum})} style={{ backgroundColor: '#0b1220', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: '1px solid rgba(212,175,55,0.1)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold' }}>{res.surahName} (Ayah: {res.ayahNum})</span>
              <span style={{ color: '#94a3b8', fontSize: '11px', border: '1px solid #334155', padding: '2px 8px', borderRadius: '10px' }}>{res.type}</span>
            </div>
            <p style={{ textAlign: 'right', fontSize: res.type === 'Arabic Text' ? '24px' : '18px', marginBottom: '5px', lineHeight: '1.6', color: '#fff' }}>
              {res.text}
            </p>
          </div>
        ))}

        {!searching && hasSearched && results.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>"{query}" ke liye koi result nahi mila.</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '10px' }}>Yaqeen kar lein ke aap ne Urdu ya Arabic font mein hi likha hai.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSearch;
