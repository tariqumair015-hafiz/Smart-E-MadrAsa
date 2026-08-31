import React, { useState } from 'react';
import { ArrowLeft, Calculator, Receipt } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';

const ZakatCalculator = ({ onBack }) => {
  const { palette } = useSettings();
  const [cash, setCash] = useState('');
  const [gold, setGold] = useState('');
  const [result, setResult] = useState(0);

  const calculate = () => {
    const total = (Number(cash) || 0) + (Number(gold) || 0);
    setResult((total * 0.025).toFixed(2));
  };

  return (
    <div style={{ backgroundColor: palette.bg, minHeight: '100vh', padding: '20px', color: palette.text, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none' }}><ArrowLeft color={palette.text} /></button>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Zakat Calculator</h2>
      </div>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: palette.muted }}>Total Cash / Savings (Rs)</label>
        <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: palette.surface, border: `1px solid ${palette.gold}`, color: palette.text, marginBottom: '20px' }} />
        <label style={{ display: 'block', marginBottom: '8px', color: palette.muted }}>Gold / Silver Value (Rs)</label>
        <input type="number" value={gold} onChange={(e) => setGold(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: palette.surface, border: `1px solid ${palette.gold}`, color: palette.text, marginBottom: '20px' }} />
        <button onClick={calculate} style={{ width: '100%', padding: '15px', backgroundColor: palette.gold, color: '#000', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>Calculate Zakat</button>
      </div>
      {result > 0 && (
        <div style={{ marginTop: '25px', padding: '20px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '16px', textAlign: 'center' }}>
          <p style={{ color: '#10b981', fontWeight: 'bold' }}>Aap ki Zakat banti hai:</p>
          <h2 style={{ fontSize: '32px', margin: '10px 0' }}>Rs {result}</h2>
        </div>
      )}
    </div>
  );
};
export default ZakatCalculator;
