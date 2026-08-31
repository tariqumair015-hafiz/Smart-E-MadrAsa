import { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';
import AnimatedLogo from './AnimatedLogo';

export default function SplashScreen({ onComplete }) {
  const [stage, setStage] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Stage 1: Fade in logo (0-1s)
    const t1 = setTimeout(() => setStage(1), 100);
    // Stage 2: Show text (1-2s)
    const t2 = setTimeout(() => setStage(2), 1000);
    // Stage 3: Fade out everything (2.5-3s)
    const t3 = setTimeout(() => setStage(3), 2500);
    // Complete
    const t4 = setTimeout(() => onCompleteRef.current(), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className={`splash-screen ${stage === 3 ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className={`splash-logo ${stage >= 1 ? 'animate-in' : ''}`}>
          <AnimatedLogo size={140} />
        </div>
        <div className={`splash-text-container ${stage >= 2 ? 'animate-in' : ''}`}>
          <h1 className="splash-title">سمارٹ ای مدرسہ</h1>
          <div className="splash-divider">
             <div className="diamond"></div>
          </div>
          <p className="splash-subtitle urdu-text" style={{fontSize: '14px', letterSpacing: '1px'}}>اسلامی علوم کا عظیم ڈیجیٹل خزانہ</p>
        </div>
      </div>
    </div>
  );
}
