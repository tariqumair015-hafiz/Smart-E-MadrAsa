import React, { useState, useEffect } from 'react';
import './AnimatedHeaderText.css';

const AnimatedHeaderText = ({ language, appName }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animated-header-text" style={{
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      position: 'relative',
      height: '42px',
      display: 'flex',
      alignItems: 'center'
    }}>

      {/* Title Slide */}
      <div className={`text-slide ${stage === 0 ? 'active' : 'hidden-up'}`} style={{ width: '100%', position: 'absolute' }}>
        <h1 className="urdu-text header-title-text" style={{
          fontSize: language === 'ur' ? 'clamp(13px, 3.8vw, 20px)' : 'clamp(12px, 3.5vw, 18px)',
          margin: 0,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          color: 'var(--gold-color)'
        }}>
          {appName}
        </h1>
        <p className="header-subtitle-text" style={{
          fontSize: 'clamp(9px, 2.2vw, 12px)',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'var(--text-secondary)'
        }}>
          {language === 'ur' ? 'اسلامی کتب خانہ' : 'Islamic Library'}
        </p>
      </div>

      {/* Welcome Slide */}
      <div className={`text-slide ${stage === 1 ? 'active' : 'hidden-down'}`} style={{ width: '100%', position: 'absolute' }}>
        <p className="welcome-title-text" style={{
          fontSize: 'clamp(11px, 3.2vw, 16px)',
          margin: 0,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          color: 'var(--gold-color)',
          fontWeight: 'bold',
        }}>
          {language === 'ur' ? 'ہزاروں مستند کتابیں' : 'Welcome to vast collection'}
        </p>
        <p className="header-subtitle-text" style={{
          fontSize: 'clamp(9px, 2.2vw, 12px)',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'var(--text-secondary)'
        }}>
          {language === 'ur' ? 'ہر موضوع پر کتابیں دستیاب' : 'thousands of authentic books'}
        </p>
      </div>

    </div>
  );
};

export default AnimatedHeaderText;
