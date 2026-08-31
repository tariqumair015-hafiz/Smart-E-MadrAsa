
import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid, Heart } from 'lucide-react';
import SurahList from './SurahList';
import './QuranAdvanced.css';

export default function QuranAdvanced({ language, onBack }) {
  const isUr = language === 'ur';

  const handleSurahClick = (surah) => {
    // Current requirement: Just an alert for the dashboard step.
    alert(isUr ? `${surah.name_simple} کا مطالعہ جلد شروع ہوگا (فیز 2 میں)۔` : `Reading view for ${surah.name_simple} coming soon (Phase 2)!`);
  };

  return (
    <div className="qa-container">
      {/* Premium Header */}
      <header className="qa-header" style={{ padding: '16px 20px', border: 'none' }}>
        <div className="qa-header-left">
          <button className="qa-back-btn" onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'white' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ marginLeft: '4px' }}>
            <div className="qa-header-title" style={{ fontSize: '22px' }}>
              {isUr ? 'قرآن مجید' : 'Holy Quran'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--qa-gold)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {isUr ? 'القرآن ڈیش بورڈ' : 'Al-Quran Dashboard'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
           <Heart size={22} color="var(--qa-text-muted)" />
           <LayoutGrid size={22} color="var(--qa-text-muted)" />
        </div>
      </header>

      <div className="qa-content" style={{ paddingTop: '10px' }}>
        <SurahList 
          onSurahClick={handleSurahClick} 
          language={language} 
        />
      </div>
    </div>
  );
}
