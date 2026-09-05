import React, { useState, useEffect, useRef } from 'react';
import './FeaturesCarousel.css';
import { User, BookOpenText, Star } from 'lucide-react';
import { scholarsData as scholars } from '../data/scholars';
import OfflineImage from '../OfflineImage';

const ScholarAvatar = ({ scholar }) => {
  const [imgError, setImgError] = useState(false);

  const initials = scholar.nameEn
    ? scholar.nameEn.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('')
    : '★';

  return (
    <div className="scholar-img-wrapper">
      {scholar.image && !imgError ? (
        <OfflineImage
          src={scholar.image}
          alt={scholar.nameEn}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="scholar-fallback" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a3a2a, #0d2018)',
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#d4af37',
            lineHeight: 1,
            letterSpacing: '1px',
            textShadow: '0 2px 10px rgba(212,175,55,0.4)',
          }}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

const FeaturesCarousel = ({ language, onScholarClick }) => {
  // 🌟 VIP FIX: Ab yeh index hamesha yaad rakhega ke aakhri dafa kon sa scholar screen par tha!
  const [activeIdx, setActiveIdx] = useState(() => {
    const savedIdx = sessionStorage.getItem('features_carousel_active_idx');
    return savedIdx !== null ? parseInt(savedIdx, 10) : 0;
  });

  const intervalRef = useRef(null);

  // 🌟 MEMORY SAVE: Jab bhi activeIdx change ho, usay chupke se memory mein save kar lo
  useEffect(() => {
    sessionStorage.setItem('features_carousel_active_idx', activeIdx.toString());
  }, [activeIdx]);

  const startAutoPlay = () => {
    intervalRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % scholars.length);
    }, 3000);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, []);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    stopAutoPlay();
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setActiveIdx(prev => (prev + 1) % scholars.length);
    } else if (isRightSwipe) {
      setActiveIdx(prev => (prev - 1 + scholars.length) % scholars.length);
    }
    
    // Resume autoplay after a delay of manual interaction
    setTimeout(startAutoPlay, 5000);
  };

  const onMouseDown = (e) => {
    touchStartX.current = e.clientX;
    stopAutoPlay();
  };

  const onMouseUp = (e) => {
    touchEndX.current = e.clientX;
    onTouchEnd();
  };

  const handleScholarClick = (scholarId) => {
    onScholarClick(scholarId);
    stopAutoPlay();
  };

  return (
    <div 
      className="coverflow-wrapper"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <div className="coverflow-scene">
        {scholars.map((scholar, index) => {
          // Calculate 3D position based on active index
          const offset = index - activeIdx;
          const absOffset = Math.abs(offset);

          // Logic for 3D stacking
          const isActive = index === activeIdx;
          const style = {
            transform: `translateX(${offset * 80}px) scale(${1 - absOffset * 0.15}) rotateY(${offset * -25}deg)`,
            zIndex: 10 - absOffset,
            opacity: absOffset > 2 ? 0 : 1,
            display: absOffset > 2 ? 'none' : 'flex'
          };

          return (
            <div
              key={scholar.id}
              className={`coverflow-card ${isActive ? 'active' : ''} ${language === 'ur' ? 'urdu-text' : ''}`}
              style={style}
              onClick={() => setActiveIdx(index)}
            >
              <div className="coverflow-shine" />

              <ScholarAvatar scholar={scholar} />

              <div className="card-info">
                <div className="card-rating">
                  <Star size={10} fill="#d4af37" />
                  <span>Scholar</span>
                </div>
                <h3 className="card-title">
                  {language === 'ur' ? scholar.nameUr : scholar.nameEn}
                </h3>
                <p className="card-subtitle">
                  {language === 'ur' ? scholar.roleUr : scholar.roleEn}
                </p>
              </div>

              {isActive && (
                <button
                  className="scholar-profile-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScholarClick(scholar.id);
                  }}
                >
                  {language === 'ur' ? 'پروفائل دیکھیں' : 'View Profile'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturesCarousel;