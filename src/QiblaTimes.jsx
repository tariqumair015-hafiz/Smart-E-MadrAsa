import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { strings } from './translations';
import './QiblaTimes.css';

const QiblaTimes = ({ language }) => {
  const t = strings[language];
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [prayerData, setPrayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Compass state
  const [heading, setHeading] = useState(0); // Device orientation relative to North
  const [qiblaBearing, setQiblaBearing] = useState(0); // Angle to Qibla from true North

  // Fetch location and data on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Setup device orientation listener once qiblaBearing is known
  useEffect(() => {
    const handleOrientation = (event) => {
      let alpha = event.alpha;
      let webkitAlpha = event.webkitCompassHeading;
      
      // Use webkitCompassHeading for iOS if available (more accurate true north)
      // Otherwise use alpha (which might require calibration or represent relative orientation in some browsers)
      if (webkitAlpha !== undefined && webkitAlpha !== null) {
        setHeading(webkitAlpha);
      } else if (alpha !== null) {
        // alpha is 0 when top of device points East on Android generally, Needs adjustment based on OS/Browser usually.
        // For simple cross-platform compass, typical mapping:
        setHeading(360 - alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError(language === 'ur' ? 'آپ کا براؤزر لوکیشن کو سپورٹ نہیں کرتا' : 'Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        fetchPrayerTimes(latitude, longitude);
        calculateQiblaBearing(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setError(language === 'ur' ? 'لوکیشن کی اجازت درکار ہے' : 'Location permission denied or unavailable');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const calculateQiblaBearing = (lat, lng) => {
    // Kaaba coordinates
    const kaabaLat = 21.422487;
    const kaabaLng = 39.826206;

    // Convert to radians
    const toRad = (value) => (value * Math.PI) / 180;
    const toDeg = (value) => (value * 180) / Math.PI;

    const phi1 = toRad(lat);
    const phi2 = toRad(kaabaLat);
    const deltaLambda = toRad(kaabaLng - lng);

    const y = Math.sin(deltaLambda);
    const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);
    
    let bearing = Math.atan2(y, x);
    bearing = toDeg(bearing);
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    setQiblaBearing(bearing);
  };

  const fetchPrayerTimes = async (lat, lng) => {
    try {
      const date = new Date();
      // Using Aladhan API (free, no key required for basic usage)
      const response = await fetch(`https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=1`);
      
      const data = await response.json();

      if (data && data.code === 200) {
        setPrayerData(data.data);
      } else {
        setError("Failed to fetch timing data");
      }
    } catch (err) {
      console.error(err);
      setError("Network error fetching times");
    } finally {
      setLoading(false);
    }
  };

  // Convert API time (HH:MM) to AM/PM format
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${m} ${language === 'ur' ? (ampm==='AM'?'صبح':'شام') : ampm}`;
  };

  const getNextPrayer = () => {
    if (!prayerData) return null;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { id: 'fajr', key: 'Fajr', name: language === 'ur' ? 'فجر' : 'Fajr' },
      { id: 'dhuhr', key: 'Dhuhr', name: language === 'ur' ? 'ظہر' : 'Dhuhr' },
      { id: 'asr', key: 'Asr', name: language === 'ur' ? 'عصر' : 'Asr' },
      { id: 'maghrib', key: 'Maghrib', name: language === 'ur' ? 'مغرب' : 'Maghrib' },
      { id: 'isha', key: 'Isha', name: language === 'ur' ? 'عشاء' : 'Isha' }
    ];

    for (let p of prayers) {
      const timeStr = prayerData.timings[p.key];
      if (timeStr) {
        const [h, m] = timeStr.split(':');
        const prayerMins = parseInt(h) * 60 + parseInt(m);
        if (prayerMins > currentTime) return p.id;
      }
    }
    return 'fajr'; // Next day's fajr
  };

  const nextPrayerId = getNextPrayer();

  // Compass Logic
  // The compass dial representing North rotates by -heading degrees.
  // The Kaaba marker on that dial is positioned at qiblaBearing relative to the dial's North.
  // Difference between device heading and Qibla bearing
  let difference = Math.abs(qiblaBearing - heading);
  if (difference > 180) difference = 360 - difference;
  const isAligned = difference < 5; // within 5 degrees tolerance

  // Haptic feedback when aligned
  useEffect(() => {
    if (isAligned && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [isAligned]);

  return (
    <div className="qibla-container">
      <div className="qibla-header">
        <h2 className="qibla-title urdu-text">🧭 {t.qiblaTab || (language === 'ur' ? 'قبلہ و اوقات' : 'Qibla & Times')}</h2>
      </div>

      <div className="qibla-content">
        {error && !prayerData && (
          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid #ef4444' }}>
            <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '12px' }} />
            <p className="urdu-text" style={{ color: '#ef4444' }}>{error}</p>
            <button className="permission-btn urdu-text" onClick={requestLocation}>
              {language === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}
            </button>
          </div>
        )}

        {loading && !prayerData && (
          <div className="loading-container">
            <Loader2 size={40} className="spin" />
            <span className="urdu-text">{language === 'ur' ? 'لوکیشن اور اوقات لائے جا رہے ہیں...' : 'Fetching location & times...'}</span>
          </div>
        )}

        {prayerData && (
          <>
            {/* Hijri Date Header */}
            <div className="hijri-date-card">
              <div className="hijri-main urdu-text">
                {prayerData.date.hijri.day} {language === 'ur' ? prayerData.date.hijri.month.ar : prayerData.date.hijri.month.en} {prayerData.date.hijri.year} AH
              </div>
              <div className="gregorian-sub">
                {prayerData.date.readable}
              </div>
              <div className="location-text">
                <MapPin size={14} color="var(--gold-color)" />
                {prayerData.meta.timezone}
              </div>
            </div>

            {/* Qibla Compass */}
            <div className="compass-section">
              <h3 className="urdu-text" style={{ margin: 0, color: 'var(--text-primary)' }}>
                {t.qiblaDirection || (language === 'ur' ? 'سمتِ قبلہ' : 'Qibla Direction')}
              </h3>
              
              <div className="compass-container">
                {/* Needle is fixed, points UP (device heading) */}
                <div className="compass-needle"></div>
                <div className="compass-center-dot"></div>
                
                {/* Dial rotates relative to North */}
                <div 
                  className="compass-dial"
                  style={{ transform: `rotate(${-heading}deg)` }}
                >
                  {/* North Indicator */}
                  <span style={{ position: 'absolute', top: '10px', fontWeight: 'bold', color: 'gray' }}>N</span>
                  
                  {/* Kaaba Position on the rotating dial */}
                  <span 
                    className="kaaba-marker"
                    style={{ 
                      transform: `rotate(${qiblaBearing}deg) translateY(-85px)`, // Positioning it on the edge
                      transformOrigin: '50% 110px' // Center of dial
                    }}
                  >
                    🕋
                  </span>
                </div>
              </div>
              
              <div className={`compass-status urdu-text ${isAligned ? 'aligned' : ''}`}>
                {isAligned 
                  ? (language === 'ur' ? 'آپ قبلہ رخ ہیں!' : 'You are facing Qibla!') 
                  : (language === 'ur' ? 'موبائل کو حرکت دیں' : 'Rotate device to find Qibla')}
              </div>
            </div>

            {/* Prayer Times List */}
            <div className="prayer-times-section">
              <h3 className="urdu-text" style={{ margin: '10px 0', color: 'var(--text-primary)' }}>
                {language === 'ur' ? 'نماز کے اوقات' : 'Prayer Times'}
              </h3>
              
              {[
                { id: 'fajr', key: 'Fajr', name: language === 'ur' ? 'فجر' : 'Fajr' },
                { id: 'sunrise', key: 'Sunrise', name: language === 'ur' ? 'طلوع آفتاب' : 'Sunrise' },
                { id: 'dhuhr', key: 'Dhuhr', name: language === 'ur' ? 'ظہر' : 'Dhuhr' },
                { id: 'asr', key: 'Asr', name: language === 'ur' ? 'عصر' : 'Asr' },
                { id: 'maghrib', key: 'Maghrib', name: language === 'ur' ? 'مغرب' : 'Maghrib' },
                { id: 'isha', key: 'Isha', name: language === 'ur' ? 'عشاء' : 'Isha' }
              ].map((prayer) => (
                <div 
                  key={prayer.id} 
                  className={`prayer-time-card ${nextPrayerId === prayer.id ? 'next-prayer' : ''}`}
                >
                  <span className="prayer-name urdu-text">{prayer.name}</span>
                  <span className="prayer-time">{formatTime(prayerData.timings[prayer.key])}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QiblaTimes;
