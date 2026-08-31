
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, BookOpen, Loader2, Sparkles } from 'lucide-react';
import './QuranAdvanced.css';

export default function SurahList({ onSurahClick, language }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  
  const isUr = language === 'ur';

  useEffect(() => {
    const fetchChapters = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('https://api.quran.com/api/v4/chapters?language=' + (isUr ? 'ur' : 'en'));
        if (response.data && response.data.chapters) {
          setChapters(response.data.chapters);
        } else {
          throw new Error("Invalid API response");
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setError(isUr ? "ڈیٹا لوڈ کرنے میں دشواری ہو رہی ہے۔" : "Error loading dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, [isUr]);

  const filteredChapters = chapters.filter(c => 
    c.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toString() === searchQuery
  );

  if (loading) {
    return (
      <div className="qa-surah-grid" style={{ padding: '0 10px' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="qa-shimmer" style={{ height: '90px', marginBottom: '12px', borderRadius: '20px' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#ff4d4d' }}>
        <p className="urdu-text">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ background: 'var(--qa-gold)', border: 'none', padding: '10px 20px', borderRadius: '10px', marginTop: '10px', fontWeight: 'bold' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="qa-list-wrapper">
      {/* Featured Card */}
      <div style={{
        background: 'var(--qa-gradient)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)'
      }}>
        <Sparkles style={{ position: 'absolute', right: -10, top: -10, opacity: 0.2, width: 100, height: 100 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 className="urdu-text" style={{ color: '#000', margin: 0, fontSize: '20px', fontWeight: 800 }}>
            {isUr ? 'آخری تلاوت' : 'Last Read'}
          </h3>
          <p style={{ color: 'rgba(0,0,0,0.7)', margin: '4px 0 16px', fontSize: '14px', fontWeight: 500 }}>
            Surah Al-Fatiha • Ayah 1
          </p>
          <button style={{
            background: 'rgba(0,0,0,0.1)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#000'
          }}>
            {isUr ? 'جاری رکھیں' : 'Continue Reading'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          position: 'relative',
          background: '#151515',
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          transition: 'all 0.3s'
        }}>
          <Search size={20} color="var(--qa-gold)" />
          <input 
            type="text" 
            placeholder={isUr ? 'سورت تلاش کریں...' : 'Search Surah...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '18px 12px',
              flex: 1,
              outline: 'none',
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      <div className="qa-surah-grid">
        {filteredChapters.map((chapter) => (
          <div 
            key={chapter.id} 
            className="qa-surah-card" 
            onClick={() => onSurahClick(chapter)}
            style={{
              padding: '18px',
              borderRadius: '20px',
              background: '#111',
              marginBottom: '4px'
            }}
          >
            <div className="qa-surah-num" style={{ width: '42px', height: '42px', borderRadius: '14px', fontSize: '13px' }}>
              {chapter.id}
            </div>
            
            <div className="qa-surah-main">
              <div className="qa-surah-name-en" style={{ fontSize: '16px', letterSpacing: '0.3px' }}>
                {chapter.name_simple}
              </div>
              <div className="qa-surah-meta">
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {chapter.revelation_place === 'makkah' ? (isUr ? 'مکہ' : 'Makkah') : (isUr ? 'مدینہ' : 'Madinah')}
                </span>
                <span style={{ opacity: 0.3 }}>•</span>
                <span>{chapter.verses_count} {isUr ? 'آیات' : 'Ayahs'}</span>
              </div>
            </div>

            <div className="qa-surah-name-ar" style={{ fontSize: '26px' }}>{chapter.name_arabic}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
