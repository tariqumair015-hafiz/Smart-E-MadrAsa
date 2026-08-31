import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, Volume2, Layers, Bookmark, Clock, ArrowLeft, FileText, Sparkles, MapPin, Loader2, DownloadCloud, Brain, Search, Flame, Trophy, Target, User, Heart, ScrollText, CheckCircle, X, Sun, Moon } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { quranService } from '../utils/fetchQuran.js';

// --- HELPER: Add or Subtract Minutes ---
const addMinutes = (timeStr, minsToAdd) => {
  if (!timeStr) return "00:00";
  const [h, m] = timeStr.split(':').map(Number);
  let date = new Date();
  date.setHours(h, m + minsToAdd, 0);
  return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
};

// --- 100% OFFLINE GLOBAL PRAYER TIME CALCULATOR ---
const getDynamicPrayerTimes = (date, lat, lng, tz) => {
  const toRad = x => x * Math.PI / 180;
  const toDeg = x => x * 180 / Math.PI;
  const fixAngle = a => { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; };
  const fixHour = a => { a = a - 24 * Math.floor(a / 24); return a < 0 ? a + 24 : a; };

  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const JD = (1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4 +
             (367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12 -
             (3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4 +
             d - 32075.5;

  const d_day = JD - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d_day);
  const q = fixAngle(280.459 + 0.98564736 * d_day);
  const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
  
  const e = 23.439 - 0.00000036 * d_day;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const eq_t = q / 15 - fixHour(RA);
  const decl = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));

  const calcTime = (angle, dir) => {
    const cosTerm = (Math.sin(toRad(angle)) - Math.sin(toRad(decl)) * Math.sin(toRad(lat))) / (Math.cos(toRad(decl)) * Math.cos(toRad(lat)));
    if (cosTerm < -1 || cosTerm > 1) return NaN;
    const timeDiff = toDeg(Math.acos(cosTerm)) / 15;
    return fixHour(12 + eq_t - lng / 15 + tz + (dir * timeDiff));
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    let h = Math.floor(time);
    let mins = Math.floor((time - h) * 60 + 0.5);
    if (mins === 60) { h += 1; mins = 0; }
    if (h >= 24) h -= 24;
    return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const dhuhr = fixHour(12 + eq_t - lng / 15 + tz);
  const fajr = calcTime(-18, -1);
  const sunrise = calcTime(-0.833, -1);
  const isha = calcTime(-18, 1);
  const maghrib = calcTime(-0.833, 1); 
  const asrAngle = toDeg(Math.atan(1 / (1 + Math.tan(toRad(Math.abs(lat - decl)))))); 
  const asr = calcTime(asrAngle, 1);

  const strFajr = formatTime(fajr);
  const strSunrise = formatTime(sunrise);
  
  // NAWAFIL CALCULATIONS
  const strIshraq = addMinutes(strSunrise, 15);
  const strChasht = addMinutes(strSunrise, 45); 
  const strTahajjud = addMinutes(strFajr, -90); 

  return {
    Tahajjud: strTahajjud,
    Fajr: strFajr,
    Sunrise: strSunrise,
    Ishraq: strIshraq,
    Chasht: strChasht,
    Dhuhr: formatTime(dhuhr),
    Asr: formatTime(asr),
    Maghrib: formatTime(maghrib),
    Isha: formatTime(isha)
  };
};
// ------------------------------------------------------------------------

const QuranHome = ({ onNavigate, onExit, onOpenReading, onOpenSmartSearch }) => {
  const { theme } = useSettings();
  const [time, setTime] = useState(new Date());
  const [lastRead, setLastRead] = useState({ title: 'سُورَةُ الفَاتِحَة', surahId: 1, type: 'surah', reciter: 'ar.alafasy', ayahNumber: 1 });
  
  const [surahJump, setSurahJump] = useState('');
  const [jumpPage, setJumpPage] = useState('');
  const [fastQuery, setFastQuery] = useState('');

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: 'Fajr', time: '', remaining: '00:00:00' });
  const [locationName, setLocationName] = useState(localStorage.getItem('user_city') || 'Karachi, PK');
  const [showAllPrayers, setShowAllPrayers] = useState(false);
  
  // --- NEW STATE: Location Error Warning ---
  const [locationError, setLocationError] = useState(false);
  
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || '');
  const [tempName, setTempName] = useState('');
  const [showSetup, setShowSetup] = useState(!localStorage.getItem('user_name'));

  const [streak, setStreak] = useState(0);
  const [streakMessage, setStreakMessage] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('Initializing Setup...');

  const [showDownloadOption, setShowDownloadOption] = useState(false);
  const [isTextDownloading, setIsTextDownloading] = useState(false);
  const [textDownloadProgress, setTextDownloadProgress] = useState(0);
  const [isQuranTextDownloaded, setIsQuranTextDownloaded] = useState(() => {
    return localStorage.getItem('quran_text_downloaded_v2') === 'true';
  });

  const dailyAyahs = [
    { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", urdu: "پس بے شک مشکل کے ساتھ آسانی ہے۔", ref: "Surah Ash-Sharh • Ayah 5" },
    { arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", urdu: "اور وہ تمہارے ساتھ ہے جہاں کہیں بھی تم ہو۔", ref: "Surah Al-Hadid • Ayah 4" },
    { arabic: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", urdu: "غم نہ کرو بے شک اللہ ہمارے ساتھ ہے۔", ref: "Surah At-Tawbah • Ayah 40" },
    { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", urdu: "پس تم مجھے یاد رکھو، میں تمہیں یاد رکھوں گا۔", ref: "Surah Al-Baqarah • Ayah 152" },
    { arabic: "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", urdu: "اور اللہ احسان کرنے والوں سے محبت کرتا ہے۔", ref: "Surah Aal-E-Imran • Ayah 134" },
    { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", urdu: "بے شک اللہ صبر کرنے والوں کے ساتھ ہے۔", ref: "Surah Al-Baqarah • Ayah 153" },
    { arabic: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", urdu: "اور صبر اور نماز سے مدد مانگو۔", ref: "Surah Al-Baqarah • Ayah 45" }
  ];

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const todayAyah = dailyAyahs[dayOfYear % dailyAyahs.length];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const setupNotificationsAndPrayers = async () => {
      try {
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
        await LocalNotifications.createChannel({
          id: 'azan_channel',
          name: 'Namaz Azan Alerts',
          description: 'Namaz ke waqt Azan ki awaz aayegi',
          sound: 'azan.mp3', 
          importance: 5,
          visibility: 1
        });
      } catch (e) {
        console.log("Notification setup skipped or failed");
      }

      let lat = parseFloat(localStorage.getItem('user_lat')) || 24.8607; 
      let lng = parseFloat(localStorage.getItem('user_lng')) || 67.0011;
      let tz = parseFloat(localStorage.getItem('user_tz')) || 5;
      let city = localStorage.getItem('user_city') || 'Karachi, PK';

      const applyPrayerTimes = (latitude, longitude, timezone, locName) => {
        const pts = getDynamicPrayerTimes(new Date(), latitude, longitude, timezone);
        setPrayerTimes(pts);
        scheduleAllNotifications(pts);
        setLocationName(locName);
      };

      // Fauran times set kardo
      applyPrayerTimes(lat, lng, tz, city);

      // --- ASK FOR LOCATION PERMISSION PROMPT ---
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            setLocationError(false); // Success par error hata do
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;
            const newTz = -(new Date().getTimezoneOffset() / 60);

            localStorage.setItem('user_lat', newLat);
            localStorage.setItem('user_lng', newLng);
            localStorage.setItem('user_tz', newTz);

            if (navigator.onLine) {
              try {
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${newLat}&longitude=${newLng}&localityLanguage=en`);
                const data = await res.json();
                city = `${data.city || data.locality}, ${data.countryCode}`;
                localStorage.setItem('user_city', city);
              } catch(e) {}
            }
            applyPrayerTimes(newLat, newLng, newTz, city); 
          },
          (err) => {
            console.log("Location Permission Denied or Timeout.");
            setLocationError(true); // Agar deny kar diya tou Warning on kardo!
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
        );
      } else {
        setLocationError(true); // Agar GPS supported nahi hai
      }
    };
    setupNotificationsAndPrayers();

    const updateStreak = () => {
      const today = new Date().toDateString();
      const lastVisit = localStorage.getItem('last_visit_date');
      let currentStreak = parseInt(localStorage.getItem('streak_count') || '0');

      if (lastVisit === today) {
        setStreak(currentStreak);
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastVisit === yesterday.toDateString()) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
        
        localStorage.setItem('streak_count', currentStreak.toString());
        localStorage.setItem('last_visit_date', today);
        setStreak(currentStreak);
      }

      const displayUserName = userName || 'Brother';
      if (currentStreak >= 5) {
        setStreakMessage(`Mubarak ho ${displayUserName}! Aap ne lagatar ${currentStreak} din se tilawat ki hai 🔥`);
      } else {
        setStreakMessage(`MaashaAllah ${displayUserName}! Aaj aapka ${currentStreak} din hai. Jari rakhein! ✨`);
      }
    };

    updateStreak();
    
    const savedLastRead = localStorage.getItem('quran_last_read');
    if (savedLastRead) setLastRead(JSON.parse(savedLastRead));

  }, [userName]); 

  useEffect(() => {
    const initializeFullOfflineData = async () => {
      const isDownloaded = localStorage.getItem('full_quran_downloaded_v1');
      if (!isDownloaded) {
        setIsDownloading(true);
        try {
          const cache = await caches.open('quran-offline-data');
          setDownloadText('Fetching Index...');
          const surahRes = await fetch('https://api.alquran.cloud/v1/surah');
          const surahData = await surahRes.json();
          if (surahData.code === 200) localStorage.setItem('offline_surah_index', JSON.stringify(surahData.data));

          for (let i = 1; i <= 114; i++) {
            setDownloadText(`Downloading Surah ${i} of 114...`);
            const arabicUrl = `https://api.alquran.cloud/v1/surah/${i}/quran-indo-pak`;
            const transUrl = `https://api.alquran.cloud/v1/surah/${i}/ur.jalandhry`;
            await Promise.all([
              fetch(arabicUrl).then(res => { if(res.ok) cache.put(arabicUrl, res.clone()); }),
              fetch(transUrl).then(res => { if(res.ok) cache.put(transUrl, res.clone()); })
            ]);
            setDownloadProgress(Math.round((i / 114) * 100));
          }
          localStorage.setItem('full_quran_downloaded_v1', 'true');
          setIsDownloading(false);
        } catch (error) {
          console.error("Download failed:", error);
          setIsDownloading(false);
        }
      }
    };
    initializeFullOfflineData();
  }, []);

  const scheduleAllNotifications = async (pts) => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 100 }] });
      
      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const notices = prayers.map((p, i) => {
        const [h, m] = pts[p].split(':').map(Number);
        const date = new Date(); 
        date.setHours(h, m, 0);
        if (date < new Date()) date.setDate(date.getDate() + 1);
        
        return {
          title: `Namaz ka Waqt: ${p}`,
          body: `Aap ke ilaqay mein ${p} ki namaz ka waqt shuru ho chuka hai.`,
          id: i + 1,
          channelId: 'azan_channel', 
          sound: 'azan.mp3', 
          schedule: { at: date, allowWhileIdle: true }
        };
      });

      const ayahDate = new Date(); 
      ayahDate.setHours(9, 0, 0);
      if (ayahDate < new Date()) ayahDate.setDate(ayahDate.getDate() + 1);
      
      notices.push({
        title: "Ayah of the Day ✨",
        body: "Aaj ki aayat parhein aur apna din roshan karein.",
        id: 100,
        schedule: { at: ayahDate, allowWhileIdle: true }
      });

      await LocalNotifications.schedule({ notifications: notices });
    } catch (e) {
      console.error("Error scheduling notifications:", e);
    }
  };

  useEffect(() => {
    if (!prayerTimes) return;
    try {
      const prayers = [
        { name: 'Tahajjud', time: prayerTimes.Tahajjud },
        { name: 'Fajr', time: prayerTimes.Fajr }, 
        { name: 'Ishraq', time: prayerTimes.Ishraq },
        { name: 'Chasht', time: prayerTimes.Chasht },
        { name: 'Dhuhr', time: prayerTimes.Dhuhr },
        { name: 'Asr', time: prayerTimes.Asr }, 
        { name: 'Maghrib', time: prayerTimes.Maghrib },
        { name: 'Isha', time: prayerTimes.Isha }
      ];
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      let upcomingPrayer = prayers[0]; 
      for (const prayer of prayers) {
        const cleanTime = (prayer.time || "00:00").split(' ')[0]; 
        const [hours, mins] = cleanTime.split(':').map(Number);
        if (hours * 60 + mins > currentTime) { upcomingPrayer = prayer; break; }
      }
      
      const cleanUpTime = (upcomingPrayer.time || "00:00").split(' ')[0];
      const [pUrlHours, pUrlMins] = cleanUpTime.split(':').map(Number);
      let targetTime = new Date();
      targetTime.setHours(pUrlHours, pUrlMins, 0, 0);
      
      if (currentTime >= pUrlHours * 60 + pUrlMins) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const diffMs = targetTime - now;
      const hrs = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const mins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
      const secs = Math.max(0, Math.floor((diffMs % (1000 * 60)) / 1000));
      
      setNextPrayer({ 
        name: upcomingPrayer.name, 
        remaining: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
      });
    } catch(err) {
      console.error("Prayer timer error", err);
    }
  }, [time, prayerTimes]);

  const handleStart = () => {
    if (tempName.trim()) {
      localStorage.setItem('user_name', tempName.trim());
      setUserName(tempName.trim());
      setShowSetup(false);
      if (!isQuranTextDownloaded) {
        setShowDownloadOption(true);
      }
    } else {
      alert("Pehle apna pyara sa naam likhen!");
    }
  };

  const downloadCompleteQuran = async () => {
    if (!navigator.onLine) {
      alert("Internet connection required for download. Please connect and try again.");
      return;
    }
    setIsTextDownloading(true);
    setTextDownloadProgress(0);
    try {
      let totalItems = 114 + 30; 
      let completedItems = 0;
      for (let i = 1; i <= 114; i++) {
        await quranService.fetchSurah(i, 'quran-indo-pak', 'ur.jalandhry');
        completedItems++;
        setTextDownloadProgress(Math.round((completedItems / totalItems) * 100));
      }
      for (let i = 1; i <= 30; i++) {
        await quranService.fetchJuzz(i, 'quran-indo-pak', 'ur.jalandhry');
        completedItems++;
        setTextDownloadProgress(Math.round((completedItems / totalItems) * 100));
      }
      localStorage.setItem('quran_text_downloaded_v2', 'true');
      localStorage.setItem('full_quran_downloaded_v2', 'true');
      setIsQuranTextDownloaded(true);
      setShowDownloadOption(false);
    } catch (error) {
      alert('Download failed. Please try again.');
    } finally {
      setIsTextDownloading(false);
    }
  };

  const downloadQuranText = async () => {
    if (!navigator.onLine) {
      alert("Internet connection required for download.");
      return;
    }
    setIsTextDownloading(true);
    setTextDownloadProgress(0);
    try {
      const totalSurahs = 114;
      for (let i = 1; i <= totalSurahs; i++) {
        await quranService.fetchSurah(i, 'quran-indo-pak', 'ur.jalandhry');
        setTextDownloadProgress(Math.round((i / totalSurahs) * 100));
      }
      localStorage.setItem('quran_text_downloaded_v2', 'true');
      setIsQuranTextDownloaded(true);
      setShowDownloadOption(false);
    } catch (error) {
      alert('Download failed. Please try again.');
    } finally {
      setIsTextDownloading(false);
    }
  };

  const skipDownload = () => setShowDownloadOption(false);

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const formatAmPm = (timeStr) => {
    if (!timeStr) return '';
    let [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  if (showSetup) {
    return (
      <div style={{ backgroundColor: '#080d16', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'var(--nav-color)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
          <User size={50} color="var(--gold-color)" />
        </div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', textAlign: 'center', marginBottom: '10px' }}>Assalamu Alaikum!</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '30px', lineHeight: '1.6' }}>App ko mazeed behtar banane ke liye humein aapka naam janna hai.</p>
        
        <input 
          type="text" 
          placeholder="Apna naam likhen..." 
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          style={{ width: '100%', maxWidth: '300px', padding: '15px', borderRadius: '12px', border: '1px solid #d4af37', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none', marginBottom: '20px', textAlign: 'center' }}
        />
        <button 
          onClick={handleStart}
          style={{ width: '100%', maxWidth: '300px', padding: '15px', borderRadius: '12px', backgroundColor: '#d4af37', color: '#000', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}
        >
          Bismillah (Start Journey)
        </button>
      </div>
    );
  }

  if (showDownloadOption) {
    return (
      <div style={{ backgroundColor: '#080d16', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
          <DownloadCloud size={50} color="#d4af37" />
        </div>
        
        {isTextDownloading ? (
          <>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '22px', textAlign: 'center', marginBottom: '10px' }}>Downloading Quran...</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '30px', lineHeight: '1.6' }}>
              Surah {Math.round((textDownloadProgress / 100) * 114)} of 114 downloaded
            </p>
            <div style={{ width: '100%', maxWidth: '300px', backgroundColor: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${textDownloadProgress}%`, height: '100%', backgroundColor: '#d4af37', transition: 'width 0.3s ease' }}></div>
            </div>
            <p style={{ color: '#d4af37', fontSize: '18px', fontWeight: 'bold' }}>{textDownloadProgress}%</p>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '30px', textAlign: 'center' }}>
              Please do not close the app. Text only download to save storage.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', textAlign: 'center', marginBottom: '10px' }}>Welcome, {userName}!</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '30px', lineHeight: '1.6' }}>
              Download the complete Quran text for offline reading. No internet required afterwards!
            </p>
            <button onClick={downloadCompleteQuran} style={{ width: '100%', maxWidth: '320px', padding: '16px', borderRadius: '12px', backgroundColor: '#d4af37', color: '#000', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(212,175,55,0.3)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <DownloadCloud size={20} /> Download Complete Quran (Surahs + Juzz)
            </button>
            <button onClick={downloadQuranText} style={{ width: '100%', maxWidth: '320px', padding: '14px', borderRadius: '12px', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: '600', fontSize: '14px', border: '1px solid #475569', cursor: 'pointer', marginBottom: '12px' }}>
              Download Only Surahs (Smaller)
            </button>
            <button onClick={skipDownload} style={{ width: '100%', maxWidth: '320px', padding: '14px', borderRadius: '12px', backgroundColor: 'transparent', color: '#94a3b8', fontWeight: '500', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Skip for Now
            </button>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '20px', textAlign: 'center' }}>Text only (Arabic + Urdu Translation) • ~5 MB</p>
          </>
        )}
      </div>
    );
  }

  if (isDownloading) {
    return (
      <div style={{ backgroundColor: '#080d16', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
        <DownloadCloud size={64} color="#d4af37" style={{ marginBottom: '24px' }} />
        <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '22px' }}>Setting Up App</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>{downloadText}</p>
        <div style={{ width: '100%', maxWidth: '300px', backgroundColor: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: '#d4af37', transition: 'width 0.3s ease' }}></div>
        </div>
        <p style={{ color: '#d4af37', fontSize: '18px', fontWeight: 'bold', marginTop: '16px' }}>{downloadProgress}%</p>
        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '40px', textAlign: 'center', opacity: 0.8 }}>Please do not close the app. This only happens once.</p>
      </div>
    );
  }

  const palette = theme === 'light'
    ? { bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', gold: '#b48600' }
    : { bg: '#080d16', surface: '#0b1220', text: '#fff', muted: '#94a3b8', gold: '#d4af37' };

  return (
  <div style={{ backgroundColor: palette.bg, minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      {/* ALL PRAYERS MODAL */}
      {showAllPrayers && prayerTimes && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#0b1220', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', borderTop: '1px solid #d4af37', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--gold-color)" /> Today's Timetable
              </h3>
              <button onClick={() => setShowAllPrayers(false)} style={{ background: 'var(--divider-color)', border: 'none', borderRadius: '50%', padding: '6px', color: 'var(--text-primary)', display: 'flex', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
              <PrayerRow name="Tahajjud" time={prayerTimes.Tahajjud} icon={<Moon size={16}/>} isNafil />
              <PrayerRow name="Fajr" time={prayerTimes.Fajr} />
              <PrayerRow name="Sunrise" time={prayerTimes.Sunrise} icon={<Sun size={16}/>} isNafil />
              <PrayerRow name="Ishraq" time={prayerTimes.Ishraq} isNafil />
              <PrayerRow name="Chasht (Duha)" time={prayerTimes.Chasht} isNafil />
              <PrayerRow name="Dhuhr" time={prayerTimes.Dhuhr} />
              <PrayerRow name="Asr" time={prayerTimes.Asr} />
              <PrayerRow name="Maghrib" time={prayerTimes.Maghrib} />
              <PrayerRow name="Isha" time={prayerTimes.Isha} />
            </div>
            <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '16px', fontStyle: 'italic' }}>
              Nawafil times are approximate. Validated for {locationName}.
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onExit} style={{ background: 'var(--nav-color)', border: '1px solid var(--divider-color)', borderRadius: '12px', padding: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <button onClick={() => onNavigate('search')} style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '10px', color: '#d4af37', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Search size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>{formattedDate}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <MapPin size={12} color="#d4af37" />
            <span style={{ fontSize: '12px', color: '#d4af37' }}>{locationName}</span>
          </div>
        </div>
      </div>

      {/* --- WARNING BANNER IF LOCATION DENIED --- */}
      {locationError && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px dashed rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="#ef4444" />
            <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>Namaz k sahih waqt janne k liye location zaruri hai.</span>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px 12px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = fastQuery.trim();
            if (!q) return;
            if (typeof onOpenSmartSearch === 'function') {
              onOpenSmartSearch(q);
            } else {
              onNavigate && onNavigate('search');
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15,23,42,0.9)', borderRadius: '16px', padding: '10px 14px', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}
        >
          <Search size={18} color="#d4af37" />
          <input type="text" placeholder="Fast Search — Urdu / Arabic / Roman..." value={fastQuery} onChange={(e) => setFastQuery(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: '14px' }} />
          <button type="submit" style={{ backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(212,175,55,0.4)' }}>Go</button>
        </form>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        
        {isQuranTextDownloaded && (
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '16px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(34,197,94,0.15)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} color="#22c55e" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#22c55e', fontSize: '14px', fontWeight: 'bold' }}>Quran Available Offline ✅</p>
              <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>Read without internet connection</p>
            </div>
          </div>
        )}
        
        <div style={{ background: streak >= 5 ? 'linear-gradient(135deg, #d4af37 0%, #926d00 100%)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: streak >= 5 ? 'rgba(0,0,0,0.2)' : 'rgba(212,175,55,0.1)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={24} color={streak >= 5 ? '#fff' : '#d4af37'} fill={streak >= 5 ? '#fff' : 'none'} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: streak >= 5 ? '#fff' : '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>{streakMessage}</p>
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: day <= (streak % 8 === 0 && streak > 0 ? 7 : streak % 8) ? (streak >= 5 ? '#fff' : '#d4af37') : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>
          {streak >= 10 && <Trophy size={20} color="#fff" />}
        </div>

        {/* --- PRAYER CARD WITH "VIEW ALL" BUTTON --- */}
        <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '20px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', opacity: 0.1 }}><Clock size={120} color="#d4af37" /></div>
          
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Next Prayer</p>
            <h2 style={{ margin: '4px 0 8px 0', color: 'var(--text-primary)', fontSize: '24px', fontWeight: 'bold' }}>{nextPrayer.name}</h2>
            
            <button onClick={() => setShowAllPrayers(true)} style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
               View All Nawafil <ChevronRight size={12} />
            </button>
          </div>

          <div style={{ zIndex: 1, textAlign: 'right' }}>
            <p style={{ margin: 0, color: '#d4af37', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>{nextPrayer.remaining}</p>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>Remaining</p>
          </div>
        </div>

        <div style={{ backgroundColor: '#d4af37', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(212,175,55,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '12px' }}>
              <BookOpen color="#000" size={24} />
            </div>
            <div>
              <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Last Read</p>
              <h3 style={{ color: '#000', margin: 0, fontSize: '20px', fontFamily: 'Scheherazade New, serif' }}>{lastRead.title}</h3>
              <p style={{ color: 'rgba(0,0,0,0.7)', fontSize: '13px', margin: '4px 0 0 0' }}>Ayah {lastRead.ayahNumber}</p>
            </div>
          </div>
          <button onClick={() => onOpenReading(lastRead)} style={{ backgroundColor: '#0b1220', color: '#d4af37', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
            Continue
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div onClick={() => onNavigate('juzz')} style={gridCardStyle}><div style={iconWrapperStyle}><BookOpen size={24} color="#d4af37" /></div><span style={cardTitleStyle}>Juzz Index</span></div>
          <div onClick={() => onNavigate('surah')} style={gridCardStyle}><div style={iconWrapperStyle}><Volume2 size={24} color="#d4af37" /></div><span style={cardTitleStyle}>Surah Index</span></div>
          <div onClick={() => onNavigate('bookmarks')} style={gridCardStyle}><div style={iconWrapperStyle}><Bookmark size={24} color="#d4af37" /></div><span style={cardTitleStyle}>Bookmarks</span></div>
          <div onClick={() => onNavigate('hifz')} style={gridCardStyle}>
            <div style={iconWrapperStyle}><Brain size={24} color="#d4af37" /></div>
            <span style={cardTitleStyle}>Hifz Tracker</span>
          </div>
          <div onClick={() => onNavigate('mushaf')} style={gridCardStyle}>
            <div style={iconWrapperStyle}><FileText size={24} color="#d4af37" /></div>
            <span style={cardTitleStyle}>Mushaf Quran</span>
          </div>
          <div onClick={() => onNavigate('emotions')} style={gridCardStyle}>
            <div style={iconWrapperStyle}><Heart size={24} color="#d4af37" /></div>
            <span style={cardTitleStyle}>Emotion Duas</span>
          </div>
          <div onClick={() => onNavigate('duas')} style={gridCardStyle}>
            <div style={iconWrapperStyle}><ScrollText size={24} color="#d4af37" /></div>
            <span style={cardTitleStyle}>Masnoon Duaein</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>Quick Jump</p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" min="1" max="604" placeholder="Page No (1-604)" value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} style={inputStyle} />
            <button onClick={() => { const pNum = parseInt(jumpPage); if(pNum >= 1 && pNum <= 604) { onOpenReading({ type: 'page', id: pNum }); } }} style={btnStyle}>Go</button>
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="var(--gold-color)" />
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold' }}>Ayah of the Day</h3>
          </div>
          <p className="urdu-text" style={{ margin: 0, color: '#d4af37', fontSize: '26px', lineHeight: '1.8', textAlign: 'right', fontWeight: 'bold' }}>{todayAyah.arabic}</p>
          <p style={{ margin: '12px 0 0 0', color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', textAlign: 'right' }}>{todayAyah.urdu}</p>
          <p style={{ margin: '16px 0 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 'bold' }}>{todayAyah.ref}</p>
        </div>

      </div>
    </div>
  );
};

const PrayerRow = ({ name, time, isNafil, icon }) => {
  const formatAmPm = (timeStr) => {
    if (!timeStr) return '';
    let [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: isNafil ? 'transparent' : 'rgba(255,255,255,0.03)', border: isNafil ? '1px dashed rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <span style={{ color: isNafil ? 'var(--gold-color)' : 'var(--text-primary)', fontWeight: isNafil ? 'normal' : 'bold', fontSize: '15px' }}>{name}</span>
        {isNafil && <span style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--gold-color)', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nafil</span>}
      </div>
      <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px' }}>{formatAmPm(time)}</span>
    </div>
  );
};

const gridCardStyle = {
  backgroundColor: 'var(--card-color)',
  borderRadius: '20px',
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--divider-color)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
};
const iconWrapperStyle = { marginBottom: '12px', backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: '12px', borderRadius: '50%' };
const cardTitleStyle = { color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' };

const inputStyle = {
  flex: 1,
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none'
};

const btnStyle = {
  backgroundColor: '#d4af37',
  color: '#000',
  border: 'none',
  borderRadius: '10px',
  padding: '0 20px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

export default QuranHome;