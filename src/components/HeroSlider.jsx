import React, { useState, useEffect } from 'react';
import './HeroSlider.css';

const HeroSlider = ({ language, appName }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title_en: appName,
      title_ur: appName,
      subtitle_en: "Digital Treasury of Islamic Knowledge",
      subtitle_ur: "اسلامی علوم کا عظیم ڈیجیٹل خزانہ",
      bgClass: "gradient-green-gold"
    },
    {
      id: 2,
      title_en: "Dars-e-Nizami Books",
      title_ur: "درس نظامی کتب",
      subtitle_en: "Thousands of books with Urdu & Arabic Explanations",
      subtitle_ur: "ہزاروں کتب مع اردو و عربی شروحات",
      bgClass: "gradient-dark-emerald"
    },
    {
      id: 3,
      title_en: "Quran, Hadith & Bayanat",
      title_ur: "قرآن، حدیث اور بیانات",
      subtitle_en: "Listen to Live Bayanat & Explore Islamic Sciences",
      subtitle_ur: "لائیو بیانات سنیں اور علوم اسلامیہ کو دریافت کریں",
      bgClass: "gradient-deep-teal"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // 4 seconds interval

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hero-slider-container">
      {slides.map((slide, index) => (
        <div 
          key={slide.id} 
          className={`hero-slide ${slide.bgClass} ${index === currentSlide ? 'active' : ''}`}
        >
          <div className="hero-slide-content">
            <h2 className="hero-title">{language === 'ur' ? slide.title_ur : slide.title_en}</h2>
            <p className="hero-subtitle urdu-text">
              {language === 'ur' ? slide.subtitle_ur : slide.subtitle_en}
            </p>
          </div>
          <div className="hero-overlay-pattern"></div>
        </div>
      ))}
      
      {/* Slide Indicators */}
      <div className="hero-slider-dots">
        {slides.map((_, index) => (
          <button 
            key={index}
            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
