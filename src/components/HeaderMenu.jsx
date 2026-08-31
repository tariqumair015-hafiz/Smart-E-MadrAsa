import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Download, Globe, Sun, Moon, BookText, Sparkles } from 'lucide-react';
import './HeaderMenu.css';

export default function HeaderMenu({
  language,
  toggleLanguage,
  theme,
  toggleTheme,
  setCurrentTab
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const isUrdu = language === 'ur';

  const handleAction = (callback) => {
    setIsOpen(false);
    if (callback) callback();
  };

  return (
    <div className="header-menu-container" ref={menuRef}>
      <button
        className={`hamburger-menu-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isUrdu ? 'مینو کھولیں' : 'Open Menu'}
        title={isUrdu ? 'مینو' : 'Menu'}
      >
        {isOpen ? <X size={20} /> : <Menu size={22} />}
      </button>

      {isOpen && (
        <div className={`header-menu-dropdown ${isUrdu ? 'rtl' : 'ltr'}`}>
          <div className="menu-header">
            <span className="menu-header-title urdu-text">{isUrdu ? 'مینو اور ترتیبات' : 'Menu & Settings'}</span>
            <button className="menu-close-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="menu-divider" />

          <div className="menu-items-list">
            {/* Download / Saved Books */}
            <button
              className="menu-item-btn"
              onClick={() => handleAction(() => setCurrentTab('library'))}
            >
              <div className="menu-item-icon download-icon">
                <Download size={18} />
              </div>
              <div className="menu-item-content">
                <span className="menu-item-label urdu-text">{isUrdu ? 'ڈاؤنلوڈ شدہ کتب' : 'Downloaded Books'}</span>
                <span className="menu-item-sub urdu-text">{isUrdu ? 'آف لائن مطالعہ کریں' : 'Read offline books'}</span>
              </div>
            </button>

            {/* Language Toggle */}
            <button
              className="menu-item-btn"
              onClick={() => {
                toggleLanguage();
              }}
            >
              <div className="menu-item-icon lang-icon">
                <Globe size={18} />
              </div>
              <div className="menu-item-content">
                <span className="menu-item-label urdu-text">{isUrdu ? 'زبان تبدیل کریں' : 'Change Language'}</span>
                <span className="menu-item-sub urdu-text">{isUrdu ? 'موجودہ: اردو' : 'Current: English'}</span>
              </div>
              <span className="menu-badge-pill urdu-text">{isUrdu ? 'EN' : 'اردو'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              className="menu-item-btn"
              onClick={() => {
                toggleTheme();
              }}
            >
              <div className="menu-item-icon theme-icon">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <div className="menu-item-content">
                <span className="menu-item-label urdu-text">{isUrdu ? 'تھیم تبدیل کریں' : 'Toggle Theme'}</span>
                <span className="menu-item-sub urdu-text">
                  {theme === 'dark'
                    ? (isUrdu ? 'نائٹ موڈ فعال ہے' : 'Dark Mode Active')
                    : (isUrdu ? 'ڈے موڈ فعال ہے' : 'Light Mode Active')}
                </span>
              </div>
              <span className="menu-badge-pill urdu-text">
                {theme === 'dark' ? (isUrdu ? 'روشن' : 'Light') : (isUrdu ? 'تاریک' : 'Dark')}
              </span>
            </button>

            <div className="menu-divider" />

            {/* Suggest Book */}
            <button
              className="menu-item-btn"
              onClick={() => handleAction(() => setCurrentTab('suggest'))}
            >
              <div className="menu-item-icon suggest-icon">
                <BookText size={18} />
              </div>
              <div className="menu-item-content">
                <span className="menu-item-label urdu-text">{isUrdu ? 'کتاب کی فرمائش' : 'Suggest a Book'}</span>
                <span className="menu-item-sub urdu-text">{isUrdu ? 'نئی کتاب کا مطلع کریں' : 'Request a book'}</span>
              </div>
            </button>

            {/* Data Sync & Backup */}
            <button
              className="menu-item-btn"
              onClick={() => handleAction(() => setCurrentTab('sync'))}
            >
              <div className="menu-item-icon sync-icon">
                <Sparkles size={18} />
              </div>
              <div className="menu-item-content">
                <span className="menu-item-label urdu-text">{isUrdu ? 'ڈیٹا بیک اپ و ری اسٹور' : 'Backup & Sync'}</span>
                <span className="menu-item-sub urdu-text">{isUrdu ? 'ڈیٹا محفوظ اور سنک کریں' : 'Sync your local data'}</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
