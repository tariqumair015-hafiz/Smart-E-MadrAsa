import { useState, useEffect, useRef } from 'react';
import { Loader2, Play, Pause, ChevronRight, WifiOff } from 'lucide-react';
import { quranService } from './utils/fetchQuran.js';
import './QuranReader.css';

const SURAH_LIST = [
  {number:1,name:"الفاتحة",englishName:"Al-Fatiha",ayahs:7,type:"Meccan"},
  {number:2,name:"البقرة",englishName:"Al-Baqarah",ayahs:286,type:"Medinan"},
  {number:3,name:"آل عمران",englishName:"Aal-e-Imran",ayahs:200,type:"Medinan"},
  {number:4,name:"النساء",englishName:"An-Nisa",ayahs:176,type:"Medinan"},
  {number:5,name:"المائدة",englishName:"Al-Ma'idah",ayahs:120,type:"Medinan"},
  {number:6,name:"الأنعام",englishName:"Al-An'am",ayahs:165,type:"Meccan"},
  {number:7,name:"الأعراف",englishName:"Al-A'raf",ayahs:206,type:"Meccan"},
  {number:8,name:"الأنفال",englishName:"Al-Anfal",ayahs:75,type:"Medinan"},
  {number:9,name:"التوبة",englishName:"At-Tawbah",ayahs:129,type:"Medinan"},
  {number:10,name:"يونس",englishName:"Yunus",ayahs:109,type:"Meccan"},
  {number:11,name:"هود",englishName:"Hud",ayahs:123,type:"Meccan"},
  {number:12,name:"يوسف",englishName:"Yusuf",ayahs:111,type:"Meccan"},
  {number:13,name:"الرعد",englishName:"Ar-Ra'd",ayahs:43,type:"Medinan"},
  {number:14,name:"إبراهيم",englishName:"Ibrahim",ayahs:52,type:"Meccan"},
  {number:15,name:"الحجر",englishName:"Al-Hijr",ayahs:99,type:"Meccan"},
  {number:16,name:"النحل",englishName:"An-Nahl",ayahs:128,type:"Meccan"},
  {number:17,name:"الإسراء",englishName:"Al-Isra",ayahs:111,type:"Meccan"},
  {number:18,name:"الكهف",englishName:"Al-Kahf",ayahs:110,type:"Meccan"},
  {number:19,name:"مريم",englishName:"Maryam",ayahs:98,type:"Meccan"},
  {number:20,name:"طه",englishName:"Taha",ayahs:135,type:"Meccan"},
  {number:21,name:"الأنبياء",englishName:"Al-Anbiya",ayahs:112,type:"Meccan"},
  {number:22,name:"الحج",englishName:"Al-Hajj",ayahs:78,type:"Medinan"},
  {number:23,name:"المؤمنون",englishName:"Al-Mu'minun",ayahs:118,type:"Meccan"},
  {number:24,name:"النور",englishName:"An-Nur",ayahs:64,type:"Medinan"},
  {number:25,name:"الفرقان",englishName:"Al-Furqan",ayahs:77,type:"Meccan"},
  {number:26,name:"الشعراء",englishName:"Ash-Shu'ara",ayahs:227,type:"Meccan"},
  {number:27,name:"النمل",englishName:"An-Naml",ayahs:93,type:"Meccan"},
  {number:28,name:"القصص",englishName:"Al-Qasas",ayahs:88,type:"Meccan"},
  {number:29,name:"العنكبوت",englishName:"Al-Ankabut",ayahs:69,type:"Meccan"},
  {number:30,name:"الروم",englishName:"Ar-Rum",ayahs:60,type:"Meccan"},
  {number:31,name:"لقمان",englishName:"Luqman",ayahs:34,type:"Meccan"},
  {number:32,name:"السجدة",englishName:"As-Sajdah",ayahs:30,type:"Meccan"},
  {number:33,name:"الأحزاب",englishName:"Al-Ahzab",ayahs:73,type:"Medinan"},
  {number:34,name:"سبأ",englishName:"Saba",ayahs:54,type:"Meccan"},
  {number:35,name:"فاطر",englishName:"Fatir",ayahs:45,type:"Meccan"},
  {number:36,name:"يس",englishName:"Ya-Sin",ayahs:83,type:"Meccan"},
  {number:37,name:"الصافات",englishName:"As-Saffat",ayahs:182,type:"Meccan"},
  {number:38,name:"ص",englishName:"Sad",ayahs:88,type:"Meccan"},
  {number:39,name:"الزمر",englishName:"Az-Zumar",ayahs:75,type:"Meccan"},
  {number:40,name:"غافر",englishName:"Ghafir",ayahs:85,type:"Meccan"},
  {number:41,name:"فصلت",englishName:"Fussilat",ayahs:54,type:"Meccan"},
  {number:42,name:"الشورى",englishName:"Ash-Shura",ayahs:53,type:"Meccan"},
  {number:43,name:"الزخرف",englishName:"Az-Zukhruf",ayahs:89,type:"Meccan"},
  {number:44,name:"الدخان",englishName:"Ad-Dukhan",ayahs:59,type:"Meccan"},
  {number:45,name:"الجاثية",englishName:"Al-Jathiyah",ayahs:37,type:"Meccan"},
  {number:46,name:"الأحقاف",englishName:"Al-Ahqaf",ayahs:35,type:"Meccan"},
  {number:47,name:"محمد",englishName:"Muhammad",ayahs:38,type:"Medinan"},
  {number:48,name:"الفتح",englishName:"Al-Fath",ayahs:29,type:"Medinan"},
  {number:49,name:"الحجرات",englishName:"Al-Hujurat",ayahs:18,type:"Medinan"},
  {number:50,name:"ق",englishName:"Qaf",ayahs:45,type:"Meccan"},
  {number:51,name:"الذاريات",englishName:"Adh-Dhariyat",ayahs:60,type:"Meccan"},
  {number:52,name:"الطور",englishName:"At-Tur",ayahs:49,type:"Meccan"},
  {number:53,name:"النجم",englishName:"An-Najm",ayahs:62,type:"Meccan"},
  {number:54,name:"القمر",englishName:"Al-Qamar",ayahs:55,type:"Meccan"},
  {number:55,name:"الرحمن",englishName:"Ar-Rahman",ayahs:78,type:"Medinan"},
  {number:56,name:"الواقعة",englishName:"Al-Waqi'ah",ayahs:96,type:"Meccan"},
  {number:57,name:"الحديد",englishName:"Al-Hadid",ayahs:29,type:"Medinan"},
  {number:58,name:"المجادلة",englishName:"Al-Mujadilah",ayahs:22,type:"Medinan"},
  {number:59,name:"الحشر",englishName:"Al-Hashr",ayahs:24,type:"Medinan"},
  {number:60,name:"الممتحنة",englishName:"Al-Mumtahanah",ayahs:13,type:"Medinan"},
  {number:61,name:"الصف",englishName:"As-Saff",ayahs:14,type:"Medinan"},
  {number:62,name:"الجمعة",englishName:"Al-Jumu'ah",ayahs:11,type:"Medinan"},
  {number:63,name:"المنافقون",englishName:"Al-Munafiqun",ayahs:11,type:"Medinan"},
  {number:64,name:"التغابن",englishName:"At-Taghabun",ayahs:18,type:"Medinan"},
  {number:65,name:"الطلاق",englishName:"At-Talaq",ayahs:12,type:"Medinan"},
  {number:66,name:"التحريم",englishName:"At-Tahrim",ayahs:12,type:"Medinan"},
  {number:67,name:"الملك",englishName:"Al-Mulk",ayahs:30,type:"Meccan"},
  {number:68,name:"القلم",englishName:"Al-Qalam",ayahs:52,type:"Meccan"},
  {number:69,name:"الحاقة",englishName:"Al-Haqqah",ayahs:52,type:"Meccan"},
  {number:70,name:"المعارج",englishName:"Al-Ma'arij",ayahs:44,type:"Meccan"},
  {number:71,name:"نوح",englishName:"Nuh",ayahs:28,type:"Meccan"},
  {number:72,name:"الجن",englishName:"Al-Jinn",ayahs:28,type:"Meccan"},
  {number:73,name:"المزمل",englishName:"Al-Muzzammil",ayahs:20,type:"Meccan"},
  {number:74,name:"المدثر",englishName:"Al-Muddathir",ayahs:56,type:"Meccan"},
  {number:75,name:"القيامة",englishName:"Al-Qiyamah",ayahs:40,type:"Meccan"},
  {number:76,name:"الإنسان",englishName:"Al-Insan",ayahs:31,type:"Medinan"},
  {number:77,name:"المرسلات",englishName:"Al-Mursalat",ayahs:50,type:"Meccan"},
  {number:78,name:"النبأ",englishName:"An-Naba",ayahs:40,type:"Meccan"},
  {number:79,name:"النازعات",englishName:"An-Nazi'at",ayahs:46,type:"Meccan"},
  {number:80,name:"عبس",englishName:"Abasa",ayahs:42,type:"Meccan"},
  {number:81,name:"التكوير",englishName:"At-Takwir",ayahs:29,type:"Meccan"},
  {number:82,name:"الإنفطار",englishName:"Al-Infitar",ayahs:19,type:"Meccan"},
  {number:83,name:"المطففين",englishName:"Al-Mutaffifin",ayahs:36,type:"Meccan"},
  {number:84,name:"الإنشقاق",englishName:"Al-Inshiqaq",ayahs:25,type:"Meccan"},
  {number:85,name:"البروج",englishName:"Al-Buruj",ayahs:22,type:"Meccan"},
  {number:86,name:"الطارق",englishName:"At-Tariq",ayahs:17,type:"Meccan"},
  {number:87,name:"الأعلى",englishName:"Al-A'la",ayahs:19,type:"Meccan"},
  {number:88,name:"الغاشية",englishName:"Al-Ghashiyah",ayahs:26,type:"Meccan"},
  {number:89,name:"الفجر",englishName:"Al-Fajr",ayahs:30,type:"Meccan"},
  {number:90,name:"البلد",englishName:"Al-Balad",ayahs:20,type:"Meccan"},
  {number:91,name:"الشمس",englishName:"Ash-Shams",ayahs:15,type:"Meccan"},
  {number:92,name:"الليل",englishName:"Al-Layl",ayahs:21,type:"Meccan"},
  {number:93,name:"الضحى",englishName:"Ad-Duha",ayahs:11,type:"Meccan"},
  {number:94,name:"الشرح",englishName:"Ash-Sharh",ayahs:8,type:"Meccan"},
  {number:95,name:"التين",englishName:"At-Tin",ayahs:8,type:"Meccan"},
  {number:96,name:"العلق",englishName:"Al-Alaq",ayahs:19,type:"Meccan"},
  {number:97,name:"القدر",englishName:"Al-Qadr",ayahs:5,type:"Meccan"},
  {number:98,name:"البينة",englishName:"Al-Bayyinah",ayahs:8,type:"Medinan"},
  {number:99,name:"الزلزلة",englishName:"Az-Zalzalah",ayahs:8,type:"Medinan"},
  {number:100,name:"العاديات",englishName:"Al-Adiyat",ayahs:11,type:"Meccan"},
  {number:101,name:"القارعة",englishName:"Al-Qari'ah",ayahs:11,type:"Meccan"},
  {number:102,name:"التكاثر",englishName:"At-Takathur",ayahs:8,type:"Meccan"},
  {number:103,name:"العصر",englishName:"Al-Asr",ayahs:3,type:"Meccan"},
  {number:104,name:"الهمزة",englishName:"Al-Humazah",ayahs:9,type:"Meccan"},
  {number:105,name:"الفيل",englishName:"Al-Fil",ayahs:5,type:"Meccan"},
  {number:106,name:"قريش",englishName:"Quraysh",ayahs:4,type:"Meccan"},
  {number:107,name:"الماعون",englishName:"Al-Ma'un",ayahs:7,type:"Meccan"},
  {number:108,name:"الكوثر",englishName:"Al-Kawthar",ayahs:3,type:"Meccan"},
  {number:109,name:"الكافرون",englishName:"Al-Kafirun",ayahs:6,type:"Meccan"},
  {number:110,name:"النصر",englishName:"An-Nasr",ayahs:3,type:"Medinan"},
  {number:111,name:"المسد",englishName:"Al-Masad",ayahs:5,type:"Meccan"},
  {number:112,name:"الإخلاص",englishName:"Al-Ikhlas",ayahs:4,type:"Meccan"},
  {number:113,name:"الفلق",englishName:"Al-Falaq",ayahs:5,type:"Meccan"},
  {number:114,name:"الناس",englishName:"An-Nas",ayahs:6,type:"Meccan"}
];

// Famous Qari options available on Al-Quran Cloud API
const QARI_LIST = [
  { id: 'ar.alafasy', name: 'مشاری العفاسی', nameEn: 'Mishary Alafasy' },
  { id: 'ar.abdulbasitmurattal', name: 'عبدالباسط عبدالصمد', nameEn: 'Abdul Basit (Murattal)' },
  { id: 'ar.abdurrahmaansudais', name: 'عبدالرحمٰن السدیس', nameEn: 'Abdurrahman As-Sudais' },
  { id: 'ar.saaboringhanem', name: 'سعود الشریم', nameEn: 'Saud Ash-Shuraim' },
  { id: 'ar.hudhaify', name: 'علی الحذیفی', nameEn: 'Ali Al-Hudhaify' },
  { id: 'ar.minshawi', name: 'محمد المنشاوی', nameEn: 'Muhammad Al-Minshawi' },
  { id: 'ar.maaboralmueaqly', name: 'ماہر المعیقلی', nameEn: 'Maher Al-Muaiqly' },
];

export default function QuranReader({ language }) {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAyah, setPlayingAyah] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedQari, setSelectedQari] = useState('ar.alafasy');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const audioRef = useRef(null);

  // Network status listener
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

  const filteredSurahs = SURAH_LIST.filter(s =>
    s.name.includes(searchQuery) ||
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString() === searchQuery
  );

  const fetchSurah = async (number, qariId) => {
    setLoading(true);
    setSelectedSurah(number);
    setPlayingAyah(null);
    setIsAutoPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    
    try {
      // Use quranService for offline/online fetching
      const result = await quranService.fetchSurah(number);
      
      if (result.success && result.ayahs) {
        // Add audio URLs from selected qari
        const qari = qariId || selectedQari;
        const ayahsWithAudio = result.ayahs.map((ayah, i) => ({
          number: ayah.numberInSurah || i + 1,
          arabic: ayah.arabicText || ayah.text || '',
          urdu: ayah.transText || '',
          audio: ayah.audio || ''
        }));
        setAyahs(ayahsWithAudio);
      } else {
        throw new Error(result.error || 'Failed to load surah');
      }
    } catch (err) {
      console.error('Error fetching surah:', err);
      // Fallback to original API if service fails
      await fetchSurahFallback(number, qariId);
    } finally {
      setLoading(false);
    }
  };

  // Fallback to original API
  const fetchSurahFallback = async (number, qariId) => {
    const qari = qariId || selectedQari;
    try {
      const [arRes, urRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${number}/${qari}`),
        fetch(`https://api.alquran.cloud/v1/surah/${number}/ur.jalandhry`)
      ]);
      const arData = await arRes.json();
      const urData = await urRes.json();

      if (arData.code === 200 && urData.code === 200) {
        const merged = arData.data.ayahs.map((ayah, i) => ({
          number: ayah.numberInSurah,
          arabic: ayah.text,
          urdu: urData.data.ayahs[i]?.text || '',
          audio: ayah.audio
        }));
        setAyahs(merged);
        
        // Save to IndexedDB for future offline use
        await quranService.saveQuranData(number, {
          number,
          name: arData.data.name,
          englishName: arData.data.englishName,
          ayahs: merged,
          type: arData.data.revelationType
        });
      }
    } catch (fallbackErr) {
      console.error('Fallback fetch also failed:', fallbackErr);
    }
  };

  const handleQariChange = (e) => {
    const newQari = e.target.value;
    setSelectedQari(newQari);
    if (selectedSurah) {
      fetchSurah(selectedSurah, newQari);
    }
  };

  // Auto-play: when current ayah ends, play the next one
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (playingAyah !== null && ayahs.length > 0) {
        const currentIndex = ayahs.findIndex(a => a.number === playingAyah);
        const nextIndex = currentIndex + 1;
        if (nextIndex < ayahs.length) {
          // Auto-play next ayah
          const nextAyah = ayahs[nextIndex];
          audio.src = nextAyah.audio;
          audio.play();
          setPlayingAyah(nextAyah.number);
          setIsAutoPlaying(true);
          // Scroll the next ayah into view
          const el = document.getElementById(`ayah-${nextAyah.number}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // End of surah
          setPlayingAyah(null);
          setIsAutoPlaying(false);
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [playingAyah, ayahs]);

  const playAudio = (ayah) => {
    if (playingAyah === ayah.number) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      setIsAutoPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = ayah.audio;
        audioRef.current.play();
        setPlayingAyah(ayah.number);
        setIsAutoPlaying(true);
      }
    }
  };

  const stopAll = () => {
    audioRef.current?.pause();
    setPlayingAyah(null);
    setIsAutoPlaying(false);
  };

  if (selectedSurah) {
    const surahInfo = SURAH_LIST.find(s => s.number === selectedSurah);
    return (
      <div className="quran-container">
        <audio ref={audioRef} />
        <div className="quran-header">
          <button className="quran-back-btn" onClick={() => { stopAll(); setSelectedSurah(null); setAyahs([]); }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 className="quran-surah-title">{surahInfo.name}</h2>
              <span className="quran-surah-subtitle">{surahInfo.englishName} • {surahInfo.ayahs} {language === 'ur' ? 'آیات' : 'Ayahs'}</span>
            </div>
            {!isOnline && <WifiOff size={16} color="#ef4444" title="Offline Mode" />}
          </div>
        </div>

        {/* Qari Selector */}
        <div className="qari-selector">
          <label className="qari-label urdu-text">{language === 'ur' ? '🎙️ قاری منتخب کریں:' : '🎙️ Select Qari:'}</label>
          <select className="qari-dropdown urdu-text" value={selectedQari} onChange={handleQariChange}>
            {QARI_LIST.map(q => (
              <option key={q.id} value={q.id}>{language === 'ur' ? q.name : q.nameEn}</option>
            ))}
          </select>
        </div>

        {/* Now Playing Bar */}
        {isAutoPlaying && playingAyah && (
          <div className="now-playing-bar">
            <span className="now-playing-text urdu-text">
              ▶️ {language === 'ur' ? `آیت ${playingAyah} چل رہی ہے...` : `Playing Ayah ${playingAyah}...`}
            </span>
            <button className="stop-btn" onClick={stopAll}>
              {language === 'ur' ? '⏹ رکیں' : '⏹ Stop'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="quran-loading">
            <Loader2 size={40} className="spin" />
            <p className="urdu-text">{language === 'ur' ? 'سورت لوڈ ہو رہی ہے...' : 'Loading Surah...'}</p>
          </div>
        ) : (
          <div className="quran-ayahs-list">
            {selectedSurah !== 9 && selectedSurah !== 1 && (
              <div className="bismillah-card">
                بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
              </div>
            )}
            {ayahs.map((ayah) => (
              <div key={ayah.number} id={`ayah-${ayah.number}`} className={`ayah-card ${playingAyah === ayah.number ? 'ayah-active' : ''}`}>
                <div className="ayah-header">
                  <span className="ayah-number">{ayah.number}</span>
                  <button
                    className={`ayah-play-btn ${playingAyah === ayah.number ? 'playing' : ''}`}
                    onClick={() => playAudio(ayah)}
                  >
                    {playingAyah === ayah.number ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
                <p className="ayah-arabic">{ayah.arabic}</p>
                <div className="ayah-divider"></div>
                <p className="ayah-urdu urdu-text">{ayah.urdu}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="quran-container">
      <div className="quran-header">
        <h2 className="quran-title">📖 {language === 'ur' ? 'قرآن مجید' : 'Holy Quran'}</h2>
      </div>

      <div className="quran-search">
        <input
          type="text"
          placeholder={language === 'ur' ? 'سورت تلاش کریں...' : 'Search Surah...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="quran-search-input urdu-text"
        />
      </div>

      <div className="quran-surah-list">
        {filteredSurahs.map((surah) => (
          <div
            key={surah.number}
            className="surah-card"
            onClick={() => fetchSurah(surah.number)}
          >
            <div className="surah-number">{surah.number}</div>
            <div className="surah-info">
              <div className="surah-name">{surah.name}</div>
              <div className="surah-english">{surah.englishName}</div>
            </div>
            <div className="surah-meta">
              <span className="surah-ayahs">{surah.ayahs} {language === 'ur' ? 'آیات' : 'Ayahs'}</span>
              <span className="surah-type">{surah.type === 'Meccan' ? '🕋' : '🕌'}</span>
            </div>
            <ChevronRight size={18} className="surah-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}
