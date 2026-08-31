import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import './IslamicCalendar.css';

const ISLAMIC_EVENTS = [
  { month: 1, day: 1, name: 'یوم الہجرہ (اسلامی نیا سال)', nameEn: 'Islamic New Year' },
  { month: 1, day: 10, name: 'یوم عاشوراء', nameEn: 'Day of Ashura' },
  { month: 3, day: 12, name: 'عید میلاد النبی ﷺ', nameEn: 'Mawlid al-Nabi ﷺ' },
  { month: 7, day: 27, name: 'شب معراج', nameEn: 'Shab-e-Meraj' },
  { month: 8, day: 15, name: 'شب برات', nameEn: 'Shab-e-Barat' },
  { month: 9, day: 1, name: 'رمضان المبارک شروع', nameEn: 'Ramadan Begins' },
  { month: 9, day: 27, name: 'شب قدر (متوقع)', nameEn: 'Laylat al-Qadr (expected)' },
  { month: 10, day: 1, name: 'عید الفطر', nameEn: 'Eid ul-Fitr' },
  { month: 12, day: 8, name: 'حج شروع', nameEn: 'Hajj Begins' },
  { month: 12, day: 9, name: 'یوم عرفہ', nameEn: 'Day of Arafah' },
  { month: 12, day: 10, name: 'عید الاضحیٰ', nameEn: 'Eid ul-Adha' },
];

export default function IslamicCalendar({ language }) {
  const [hijriData, setHijriData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthData, setMonthData] = useState(null);

  useEffect(() => {
    fetchHijriDate();
  }, []);

  const fetchHijriDate = async () => {
    try {
      const today = new Date();
      const res = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`);
      const data = await res.json();
      if (data.code === 200) {
        setHijriData(data.data.hijri);
        fetchMonthCalendar(data.data.hijri.month.number, data.data.hijri.year);
      }
    } catch (err) {
      console.error('Error fetching Hijri date:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthCalendar = async (month, year) => {
    try {
      const res = await fetch(`https://api.aladhan.com/v1/hToGCalendar/${month}/${year}`);
      const data = await res.json();
      if (data.code === 200) {
        setMonthData(data.data);
      }
    } catch (err) {
      console.error('Error fetching month calendar:', err);
    }
  };

  const getUpcomingEvents = () => {
    if (!hijriData) return [];
    const currentMonth = parseInt(hijriData.month.number);
    const currentDay = parseInt(hijriData.day);
    
    return ISLAMIC_EVENTS
      .filter(e => e.month > currentMonth || (e.month === currentMonth && e.day >= currentDay))
      .slice(0, 5);
  };

  const upcomingEvents = getUpcomingEvents();

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="calendar-loading">
          <Loader2 size={40} className="spin" />
          <p className="urdu-text">{language === 'ur' ? 'اسلامی کیلنڈر لوڈ ہو رہا ہے...' : 'Loading Islamic Calendar...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">📅 {language === 'ur' ? 'اسلامی کیلنڈر' : 'Islamic Calendar'}</h2>
      </div>

      {/* Today's Hijri Date */}
      {hijriData && (
        <div className="hijri-hero-card">
          <div className="hijri-day-number">{hijriData.day}</div>
          <div className="hijri-month-name urdu-text">
            {language === 'ur' ? hijriData.month.ar : hijriData.month.en}
          </div>
          <div className="hijri-year">{hijriData.year} AH</div>
          <div className="hijri-weekday urdu-text">
            {language === 'ur' ? hijriData.weekday.ar : hijriData.weekday.en}
          </div>
          <div className="hijri-designation">
            {hijriData.designation?.abbreviated || 'AH'}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="events-section">
        <h3 className="events-title urdu-text">
          🎉 {language === 'ur' ? 'آنے والے اسلامی ایام' : 'Upcoming Islamic Events'}
        </h3>
        <div className="events-list">
          {upcomingEvents.length > 0 ? upcomingEvents.map((event, idx) => (
            <div key={idx} className="event-card">
              <div className="event-date-badge">
                <span className="event-day">{event.day}</span>
                <span className="event-month-num">{event.month}</span>
              </div>
              <div className="event-info">
                <span className="event-name urdu-text">{language === 'ur' ? event.name : event.nameEn}</span>
              </div>
            </div>
          )) : (
            <p className="urdu-text" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              {language === 'ur' ? 'اس سال کے تمام اہم ایام گذر چکے ہیں' : 'All major events for this year have passed'}
            </p>
          )}
        </div>
      </div>

      {/* Month Grid */}
      {monthData && (
        <div className="month-grid-section">
          <h3 className="events-title urdu-text">
            📆 {language === 'ur' ? `${hijriData?.month?.ar || ''} کا کیلنڈر` : `${hijriData?.month?.en || ''} Calendar`}
          </h3>
          <div className="month-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="month-grid-header">{d}</div>
            ))}
            {monthData.slice(0, 35).map((day, idx) => {
              const isToday = hijriData && day.hijri.day === hijriData.day;
              const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(day.gregorian.weekday.en);
              return (
                <div key={idx} className={`month-grid-cell ${isToday ? 'today' : ''}`} style={{ gridColumn: idx === 0 ? dayOfWeek + 1 : 'auto' }}>
                  <span className="grid-hijri-day">{day.hijri.day}</span>
                  <span className="grid-greg-day">{day.gregorian.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
