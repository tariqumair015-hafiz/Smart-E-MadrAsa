import React, { useState } from 'react';
import { ArrowLeft, Smile, Frown, Zap, Heart, CloudRain, Sun } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext.jsx';

const emotions = [
  { id: 'sad', label: 'Udasi', emoji: <Frown />, color: '#3b82f6', dua: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", trans: "Tere siwa koi mabood nahi, Tu pak hai, beshak main hi qasoorwar hoon." },
  { id: 'angry', label: 'Gussa', emoji: <Zap />, color: '#ef4444', dua: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", trans: "Main pannah mangta hoon Allah ki shaitan mardood se." },
  { id: 'anxious', label: 'Pareshani', emoji: <CloudRain />, color: '#8b5cf6', dua: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", trans: "Humein Allah hi kafi hai aur wo behtareen kar-saaz hai." },
  { id: 'grateful', label: 'Shukar', emoji: <Sun />, color: '#10b981', dua: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", trans: "Tamam tareefein Allah ke liye hain jo tamam jahanon ka Rab hai." }
];

const EmotionDuas = ({ onBack }) => {
  const { palette } = useSettings();
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ backgroundColor: palette.bg, minHeight: '100vh', padding: '20px', color: palette.text, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none' }}><ArrowLeft color={palette.text} /></button>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Aap kaisa mehsoos kar rahe hain?</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {emotions.map(e => (
          <div key={e.id} onClick={() => setSelected(e)} style={{ backgroundColor: e.id === selected?.id ? e.color : 'rgba(255,255,255,0.05)', border: `1px solid ${e.color}`, padding: '20px', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}>
            <div style={{ color: e.id === selected?.id ? '#fff' : e.color, marginBottom: '8px' }}>{e.emoji}</div>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{e.label}</span>
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: '30px', padding: '24px', backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: '20px', border: `1px solid ${palette.gold}`, textAlign: 'center' }}>
          <h3 style={{ color: palette.gold, marginBottom: '15px' }}>Masnoon Dua</h3>
          <p style={{ fontSize: '28px', lineHeight: '1.6', marginBottom: '15px' }}>{selected.dua}</p>
          <p style={{ color: palette.muted, fontSize: '15px' }}>{selected.trans}</p>
        </div>
      )}
    </div>
  );
};
export default EmotionDuas;
