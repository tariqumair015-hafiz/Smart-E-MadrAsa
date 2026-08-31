import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';

const GotoPage = ({ onBack, onOpenReading }) => {
  const { palette, quranQari } = useSettings();
  const [pageNumber, setPageNumber] = useState('');

  const handleGo = () => {
    const page = parseInt(pageNumber);
    if (page >= 1 && page <= 604) {
      onOpenReading({ type: 'page', pageId: page, reciter: 'ar.alafasy' });
    } else {
      alert('براہ کرم 1 سے 604 کے درمیان کوئی درست صفحہ نمبر درج کریں۔');
    }
  };

  return (
    <div style={{ backgroundColor: palette.bg, minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: palette.surface, borderBottom: `1px solid ${palette.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} color={palette.text} />
        </button>
        <h2 style={{ margin: '0 0 0 16px', fontSize: '20px', fontWeight: 'bold', color: palette.text }}>Goto Page</h2>
      </div>

      {/* ── Input Section ── */}
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, paddingBottom: '20vh' }}>
        <h3 style={{ color: palette.gold, marginBottom: '24px', fontSize: '18px', textAlign: 'center' }}>Enter Page Number<br/><span style={{ fontSize: '14px', color: palette.muted }}>(1 - 604)</span></h3>
        
        <input 
          type="number" 
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          placeholder="e.g. 25"
          style={{ 
            width: '100%', maxWidth: '250px', padding: '16px', borderRadius: '16px', 
            backgroundColor: 'rgba(255,255,255,0.02)', color: palette.text, border: '2px solid rgba(212, 175, 55, 0.3)', 
            fontSize: '32px', textAlign: 'center', outline: 'none', marginBottom: '32px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
        />

        <button 
          onClick={handleGo}
          style={{ 
            backgroundColor: palette.gold, color: '#000', border: 'none', 
            borderRadius: '24px', padding: '16px 48px', fontSize: '16px', 
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)'
          }}
        >
          Open Page
        </button>
      </div>
    </div>
  );
};

export default GotoPage;
