// Smart e-Madarsa Web Application - Live Production Build
import { App as CapApp } from '@capacitor/app';
import OfflineImage from './OfflineImage';
import React, { useEffect, useState, useRef, useMemo } from 'react'
import * as localforageModule from 'localforage'
const localforage = localforageModule.default || localforageModule
import { Search, Download, BookOpen, GraduationCap, BookDashed, BookDashed as BookPlaceholder, Sun, Moon, User, Library, BookText, ScrollText, Sparkles, BookMarked, Languages, Users, CheckCircle, Bookmark, Upload, MessageSquare } from 'lucide-react'
import LibraryComp from './Library'
import BookReader from './BookReader'
import AdminPanel from './AdminPanel'
import BookUploadModal from './components/BookUploadModal'
import BookRequestsTab from './components/BookRequestsTab'
import SuggestBookPage from './SuggestBookPage'
import AIChatPage from './AIChatPage'
import Tasbeeh from './Tasbeeh'
import QiblaTimes from './QiblaTimes'
import DataSync from './DataSync'
import DailyDuas from './DailyDuas'
import QuranSection from './components/QuranSection'
import IslamicCalendar from './IslamicCalendar'
import BottomNav from './components/BottomNav'
import AnimatedLogo from './components/AnimatedLogo'
import SplashScreen from './components/SplashScreen'
import HeroSlider from './components/HeroSlider'
import AnimatedHeaderText from './components/AnimatedHeaderText'
import { scholarsData } from './data/scholars'
import FeaturesCarousel from './components/FeaturesCarousel'
import ScholarProfilePage from './components/ScholarProfilePage'
import { strings } from './translations'
import './App.css'
import { useSettings } from './contexts/SettingsContext.jsx'
import { useScrollRestoration } from './components/useScrollRestoration'
import { DarsVipIcon, MutafarriqVipIcon } from './components/VipIcons'
import AdvancedSearch from './components/AdvancedSearch'
import FloatingAIButton from './components/FloatingAIButton'
import HeaderMenu from './components/HeaderMenu'

const BOYS_CATEGORIES = [
  { label: 'درجہ اولیٰ', en: '1st Year' },
  { label: 'درجہ ثانیہ', en: '2nd Year' },
  { label: 'درجہ ثالثہ', en: '3rd Year' },
  { label: 'درجہ رابعہ', en: '4th Year' },
  { label: 'درجہ خامسہ', en: '5th Year' },
  { label: 'درجہ سادسہ', en: '6th Year' },
  { label: 'درجہ سابعہ', en: '7th Year' },
  { label: 'دورہ حدیث', en: 'Daura Hadith (8th Year)' },
];

const GIRLS_CATEGORIES = [
  { label: 'ثانویہ خاصہ سال اول', en: 'Khasa Year 1' },
  { label: 'ثانویہ خاصہ سال دوم', en: 'Khasa Year 2' },
  { label: 'عالیہ بنات سال اول', en: 'Aliya Year 1' },
  { label: 'عالیہ بنات سال دوم', en: 'Aliya Year 2' },
  { label: 'عالمیہ بنات سال اول', en: 'Alamiyya Year 1' },
  { label: 'عالمیہ بنات سال دوم', en: 'Alamiyya Year 2' },
];

const EXTRA_CATEGORIES = [
  { label: 'قرآن مجید', en: 'Quran Majeed' },
  { label: 'تفسیر القرآن', en: 'Tafseer ul Quran' },
  { label: 'علوم قرآن', en: 'Uloom ul Quran' },
  { label: 'تجوید و قراءت', en: 'Tajweed & Qiraat' },
  { label: 'احادیث', en: 'Ahadith' },
  { label: 'اصول حدیث', en: 'Usool Hadith' },
  { label: 'فقہ و فتاویٰ', en: 'Fiqh & Fatawa' },
  { label: 'اصول فقہ', en: 'Usool Fiqh' },
  { label: 'جدید فقہ', en: 'Modern Jurisprudence' },
  { label: 'احکام و مسائل', en: 'Ahkam & Masail' },
  { label: 'نماز', en: 'Salah (Prayers)' },
  { label: 'زکوٰۃ', en: 'Zakat' },
  { label: 'حج و عمرہ', en: 'Hajj & Umrah' },
  { label: 'روزہ', en: 'Fasting (Roza)' },
  { label: 'نکاح و طلاق', en: 'Marriage & Divorce' },
  { label: 'سیرت و تاریخ', en: 'Seerat & History' },
  { label: 'سیرتِ صحابہ و صحابیات', en: 'Seerat ul Sahaba' },
  { label: 'تصوف', en: 'Tasawwuf' },
  { label: 'اسلام', en: 'Islam' },
  { label: 'عقائد', en: 'Aqeedah' },
  { label: 'ختم نبوت', en: 'Khatm e Nubuwwat' },
  { label: 'تقابل ادیان', en: 'Taqabul e Adyan' },
  { label: 'فرق ضاله', en: 'Deviant Sects' },
  { label: 'فلکیات', en: 'Astronomy' },
  { label: 'تاریخ', en: 'History' },
  { label: 'خواب و تعبیر', en: 'Dream Interpretation' },
  { label: 'قیامت', en: 'Judgment Day' },
  { label: 'اصلاحی نصاب', en: 'Islahi Nisab' },
  { label: 'دائرۃ المعارف', en: 'Encyclopedias' },
  { label: 'دراسات دینیہ کورس', en: 'Dirasaat-e-Deenia' },
  { label: 'بخاری شریف کی شروحات', en: 'Bukhari Sharuhat' },
  { label: 'ترمذی شریف کی شروحات', en: 'Tirmidhi Sharuhat' },
  { label: 'ہدایہ کی شروحات', en: 'Hedaya Sharuhat' },
  { label: 'مشکوٰۃ شریف کی شروحات', en: 'Mishkat Sharuhat' },
  { label: 'جلالین کی شروحات', en: 'Jalalain Sharuhat' },
  { label: 'لغت', en: 'Dictionaries' },
  { label: 'متفرقات', en: 'Miscellaneous' },
  { label: 'خطبات / مقالات / محاضرات', en: 'Khutbaat o Maqalaat' },
  { label: 'عملیات / طب / ادعیہ', en: 'Dua ow Darood' },
  { label: 'تبلیغ و دعوت', en: 'Tableegh' },
  { label: 'سیاست', en: 'Siyasat' },
  { label: 'خواتین', en: 'Khawateen' },
  { label: 'بچوں کی کتب', en: 'Children Books' },
  { label: 'اکابرین', en: 'Islamic Scholars' },
  { label: 'حل شدہ پرچے', en: 'Solved Papers' },
  { label: 'منطق و فلسفہ', en: 'Logic & Philosophy' },
  { label: 'مختصر المعانی مع شروحات', en: 'Mukhtasar ul Maani' },
  { label: 'نور الانوار مع شروحات', en: 'Noor ul Anwaar' },
  { label: 'شرح جامی مع شروحات', en: 'Sharah Jami' },
  { label: 'کافیہ مع شروحات', en: 'Kafiya Ibn e Hajib' },
  { label: 'عقیدہ طحاویہ مع شروحات', en: 'Al Aqeedah Al Tahawiyyah' },
];

function ComingSoonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 110, height: 155, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))', border: '1px dashed rgba(212,175,55,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <BookPlaceholder size={32} style={{ opacity: 0.3 }} />
          <p className="urdu-text" style={{ color: 'rgba(212,175,55,0.35)', fontSize: 10, textAlign: 'center', margin: 0, lineHeight: 1.4, maxWidth: 85 }}>جلد آ رہی ہے</p>
        </div>
      ))}
    </>
  );
}

function SectionStatsRow({ language }) {
  const stats = [
    {
      icon: <Library size={18} color="var(--gold-color)" />,
      labelUr: "3000+ کتب",
      labelEn: "3000+ Books",
    },
    {
      icon: <GraduationCap size={18} color="var(--gold-color)" />,
      labelUr: "8 سالہ نصاب",
      labelEn: "8 Years",
    },
    {
      icon: <Languages size={18} color="var(--gold-color)" />,
      labelUr: "اردو اور عربی زبانیں",
      labelEn: "Urdu & Arabic Languages",
    }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '0 16px',
      marginBottom: '20px',
      justifyContent: 'space-between'
    }}>
      {stats.map((stat, idx) => (
        <div key={idx} style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: '12px',
          padding: '12px 8px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          minHeight: '65px'
        }}>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stat.icon}
          </div>
          <span className="urdu-text" style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            lineHeight: '1.2'
          }}>
            {language === 'ur' ? stat.labelUr : stat.labelEn}
          </span>
        </div>
      ))}
    </div>
  );
}

const getCategoryIcon = (label) => {
  if (label.includes('اولیٰ') || label.includes('ثانیہ') || label.includes('ثالثہ')) return { icon: <Library size={22} />, color: '#4ade80' };
  if (label.includes('رابعہ') || label.includes('خامسہ')) return { icon: <BookText size={22} />, color: '#22d3ee' };
  if (label.includes('سادسہ') || label.includes('سابعہ')) return { icon: <ScrollText size={22} />, color: '#fb923c' };
  if (label.includes('حدیث')) return { icon: <Sparkles size={22} />, color: '#f472b6' };
  if (label.includes('قرآن') || label.includes('تفسیر')) return { icon: <BookOpen size={22} />, color: '#4ade80' };
  if (label.includes('فقہ')) return { icon: <ScrollText size={22} />, color: '#6366f1' };
  if (label.includes('عقائد') || label.includes('سیرت')) return { icon: <BookMarked size={22} />, color: '#fb7185' };
  if (label.includes('شروحات')) return { icon: <Languages size={22} />, color: '#38bdf8' };
  if (label.includes('اکابرین')) return { icon: <Users size={22} />, color: '#d4af37' };
  return { icon: <GraduationCap size={22} />, color: '#a78bfa' };
};

const CategorySection = React.memo(function CategorySection({ cat, books, onViewAll, language, onBookClick, isDars }) {
  const [mainFilter, setMainFilter] = useState('Darsi');
  const [subFilter, setSubFilter] = useState('All');
  const allCatBooks = books;
  let sortedBooks = [...allCatBooks];
  if (cat.label === 'درجہ اولیٰ') {
    const priorityKeywords = ['نحو میر', 'Nahw Meer', 'میزان', 'Mizan', 'ارشاد الصرف', 'Irshad us Sarf', 'جمال القرآن', 'Jamal ul Quran', 'صفوۃ المصادر', 'Safwatul Masadir', 'تیسیر الابواب', 'Taisir ul Abwab', 'الطریقہ العصریہ', 'Tariqat ul Asria', 'تسہیل النحو', 'Tasheel un Nahw', 'شرح مائۃ عامل', 'Sharh Miata Amil', 'علم النحو', 'Ilmun Nahw', 'جوامع الکلم', 'Jawami ul Kalim'];
    sortedBooks.sort((a, b) => { const aI = priorityKeywords.findIndex(k => (a.title || '').toLowerCase().includes(k.toLowerCase())); const bI = priorityKeywords.findIndex(k => (b.title || '').toLowerCase().includes(k.toLowerCase())); if (aI !== -1 && bI !== -1) return aI - bI; if (aI !== -1) return -1; if (bI !== -1) return 1; return 0; });
  } else if (cat.label === 'درجہ ثانیہ') {
    const priorityKeywords = ['مختصر القدوری', 'Qudori', 'Quduri', 'زاد الطالبین', 'Zad ul Talibeen', 'ہدایۃ النحو', 'Hidayat un Nahw', 'علم الصیغہ', 'Ilm us Seegha', 'القراءۃ الراشدہ', 'Qiraat ur Rashida', 'معلم الانشاء', 'Moalim ul Insha', 'مرقات', 'Mirqat', 'النحو الواضح', 'Nahw ul Wazih'];
    sortedBooks.sort((a, b) => { const aI = priorityKeywords.findIndex(k => (a.title || '').toLowerCase().includes(k.toLowerCase())); const bI = priorityKeywords.findIndex(k => (b.title || '').toLowerCase().includes(k.toLowerCase())); if (aI !== -1 && bI !== -1) return aI - bI; if (aI !== -1) return -1; if (bI !== -1) return 1; return 0; });
  }

  let filteredBooks = sortedBooks;
  if (isDars) {
    if (mainFilter === 'Darsi') {
      filteredBooks = sortedBooks.filter(b => {
        if (!b.sub_category) return true;
        const sub = b.sub_category.trim().toLowerCase();
        return sub.includes('درسی') || sub.includes('darsi') || sub.includes('textbook') || 
               (!sub.includes('شرح') && !sub.includes('شروحات') && !sub.includes('commentary'));
      });
    } else if (mainFilter === 'Sharah') {
      filteredBooks = sortedBooks.filter(b => {
        if (!b.sub_category) return false;
        const sub = b.sub_category.trim().toLowerCase();
        const isSharah = sub.includes('شرح') || sub.includes('شروحات') || sub.includes('commentary') || sub.includes('اردو') || sub.includes('عربی');
        if (!isSharah) return false;
        if (subFilter === 'Urdu') return sub.includes('اردو') || sub.includes('urdu');
        if (subFilter === 'Arabic') return sub.includes('عربی') || sub.includes('arabic');
        return true;
      });
    }
  }

  const displayBooks = filteredBooks.length > 0 ? filteredBooks : sortedBooks;

  const handleMainFilter = (filter) => { setMainFilter(filter); setSubFilter('All'); };
  const { icon, color } = getCategoryIcon(cat.label);
  const iconWithFixedSize = React.cloneElement(icon, { size: 18 });
  const categoryScrollRef = useScrollRestoration(`category_${cat.label}`, true);

  return (
    <div className="dars-section-glow">
      <div className="dars-section-inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: color, display: 'flex', alignItems: 'center', filter: `drop-shadow(0 0 3px ${color}44)` }}>{iconWithFixedSize}</span>
            <span className="urdu-text" style={{ color: 'var(--gold-color)', fontSize: 15, fontWeight: 700 }}>{language === 'ur' ? cat.label : cat.en}</span>
          </div>
          {allCatBooks.length > 0 && (
            <button onClick={() => onViewAll(cat.label, mainFilter, subFilter)} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer', padding: '2px 12px', borderRadius: '10px', transition: 'all 0.2s', fontWeight: 500 }}>
              {language === 'ur' ? 'سب دیکھیں' : 'View All'}
            </button>
          )}
        </div>

        {isDars && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px 12px' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              padding: '4px',
              border: '1px solid rgba(212,175,55,0.1)',
              width: 'fit-content'
            }}>
              <button
                onClick={() => handleMainFilter('Darsi')}
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  background: mainFilter === 'Darsi' ? 'var(--gold-color)' : 'transparent',
                  color: mainFilter === 'Darsi' ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 11,
                  transition: 'all 0.2s'
                }}
                className="urdu-text"
              >
                {language === 'ur' ? 'درسی کتب' : 'Textbooks'}
              </button>
              <button
                onClick={() => handleMainFilter('Sharah')}
                style={{
                  padding: '5px 14px',
                  borderRadius: '8px',
                  background: mainFilter === 'Sharah' ? 'var(--gold-color)' : 'transparent',
                  color: mainFilter === 'Sharah' ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 11,
                  transition: 'all 0.2s'
                }}
                className="urdu-text"
              >
                {language === 'ur' ? 'شروحات' : 'Commentaries'}
              </button>
            </div>
            {mainFilter === 'Sharah' && (
              <div style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '3px',
                width: 'fit-content',
                animation: 'fadeIn 0.3s ease'
              }}>
                {['All', 'Urdu', 'Arabic'].map((subOpt) => {
                  const label = subOpt === 'All' ? (language === 'ur' ? 'تمام' : 'All') : subOpt === 'Urdu' ? (language === 'ur' ? 'اردو' : 'Urdu') : (language === 'ur' ? 'عربی' : 'Arabic');
                  const isActive = subFilter === subOpt;
                  return (
                    <button
                      key={subOpt}
                      onClick={() => setSubFilter(subOpt)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(212,175,55,0.2)' : 'transparent',
                        color: isActive ? 'var(--gold-color)' : 'var(--text-secondary)',
                        border: isActive ? '1px solid rgba(212,175,55,0.4)' : '1px solid transparent',
                        cursor: 'pointer',
                        fontSize: 10,
                        transition: 'all 0.2s'
                      }}
                      className="urdu-text"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div ref={categoryScrollRef} className="horizontal-scroll" style={{ padding: '0 16px 8px' }}>
          {displayBooks.length === 0
            ? <ComingSoonCard count={3} />
            : displayBooks.slice(0, 15).map(book => <BookCard key={book.id} book={book} language={language} onBookClick={onBookClick} />)
          }
        </div>
      </div>
    </div>
  );
});

const getLocalizedTitle = (title, lang = 'en') => {
  if (!title) return '';
  const urduRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
  if (!urduRegex.test(title)) return title;

  const words = title.split(/\s+/);
  const urduWords = [];
  const englishWords = [];

  for (const word of words) {
    if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(word)) {
      urduWords.push(word);
    } else {
      englishWords.push(word);
    }
  }

  if (lang === 'ur') {
    return urduWords.join(' ').trim() || title;
  } else {
    return englishWords.join(' ').trim() || title;
  }
};

const isNewBook = (createdAt) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 15;
};

const getCleanAuthor = (author) => {
  if (!author) return '';
  if (/best\s*urdu\s*books(\.net)?/i.test(author)) {
    return 'Smart E Madarsa';
  }
  return author;
};

const BookCard = React.memo(function BookCard({ book, onBookClick, language }) {
  const [imgError, setImgError] = useState(false);
  const [generatedCover, setGeneratedCover] = useState(null);
  const activeLang = language || localStorage.getItem('smart_lang') || 'en';
  const localizedTitle = getLocalizedTitle(book.title, activeLang);
  
  useEffect(() => {
    if (book.cover_url) return;

    const cacheKey = `pdf_cover_v1_${book.id}`;
    localforage.getItem(cacheKey).then((cachedVal) => {
      if (cachedVal) {
        setGeneratedCover(cachedVal);
      } else if (book.pdf_url) {
        const generate = async () => {
          try {
            const pdfjsLib = await import('pdfjs-dist');
            const pdfWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

            const loadingTask = pdfjsLib.getDocument(book.pdf_url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            
            setGeneratedCover(dataUrl);
            await localforage.setItem(cacheKey, dataUrl);
          } catch (e) {
            console.error("Cover extraction failed for", book.pdf_url, e);
          }
        };
        
        // Delay extraction to let main UI mount smoothly
        const timer = setTimeout(generate, 1500);
        return () => clearTimeout(timer);
      }
    });
  }, [book.cover_url, book.pdf_url, book.id]);

  const displayCover = book.cover_url || generatedCover;
  const showPlaceholder = !displayCover || imgError;
  const isNew = isNewBook(book.created_at);

  const getCoverColor = () => {
    const cat = book.category || '';

    const isBoyCategory = BOYS_CATEGORIES.some(c => c.label === cat || c.en === cat);
    if (isBoyCategory) {
      return ['#064e3b', '#047857'];
    }

    const isGirlCategory = GIRLS_CATEGORIES.some(c => c.label === cat || c.en === cat);
    if (isGirlCategory) {
      return ['#4c0519', '#881337'];
    }

    const extraGradients = [
      ['#0f172a', '#1e3a8a'],
      ['#3f1619', '#7f1d1d'],
      ['#451a03', '#92400e'],
      ['#3b0764', '#6b21a8'],
      ['#083344', '#0e7490'],
      ['#14532d', '#15803d'],
      ['#4c1d95', '#6d28d9'],
      ['#111827', '#374151'],
      ['#7c2d12', '#9a3412'],
      ['#0f766e', '#0d9488'],
    ];

    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
      hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % extraGradients.length;
    return extraGradients[index];
  };

  const [color1, color2] = getCoverColor();

  return (
    <div
      onClick={() => onBookClick && onBookClick(book)}
      style={{
        width: 100,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        background: 'var(--card-color)',
        border: '1px solid var(--divider-color)',
        position: 'relative',
        scrollSnapAlign: 'start',
      }}
      className="book-card-hover"
    >
      {isNew && (
        <div style={{ position: 'absolute', top: 4, left: 4, background: '#ef4444', color: '#fff', fontSize: '7px', padding: '2px 5px', borderRadius: '4px', zIndex: 10, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>NEW</div>
      )}
      {!showPlaceholder ? (
        <OfflineImage src={displayCover} alt={localizedTitle} onError={() => setImgError(true)} style={{ width: '100%', height: 135, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: 135, background: `linear-gradient(160deg, ${color1} 0%, ${color2} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '6px 5px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 3, border: '1px solid rgba(212,175,55,0.4)', borderRadius: 6, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 6, border: '0.5px solid rgba(212,175,55,0.15)', borderRadius: 4, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, zIndex: 1, marginTop: 3 }}>
            <span style={{ color: '#d4af37', fontSize: 10, opacity: 0.8 }}>☽</span>
            <span style={{ color: '#d4af37', fontSize: 7, opacity: 0.5 }}>✦</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px 5px', zIndex: 1 }}>
            <p className="urdu-text" style={{ color: '#d4af37', fontSize: localizedTitle?.length > 20 ? 8 : 10, textAlign: 'center', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', direction: 'rtl', fontWeight: 'bold' }}>{localizedTitle}</p>
          </div>
          <div style={{ width: '70%', height: 1, background: 'rgba(212,175,55,0.4)', marginBottom: 3, zIndex: 1 }} />
        </div>
      )}
      <div style={{ padding: '6px 7px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: 'var(--card-color)' }}>
        <p className="urdu-text" style={{ color: 'var(--text-primary)', fontSize: 12, margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', direction: 'rtl', textAlign: 'right' }}>{localizedTitle}</p>
        {book.author && (
          <p className="urdu-text" style={{ color: 'var(--text-secondary)', fontSize: 11, margin: 0, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', direction: 'rtl', textAlign: 'right' }}>{getCleanAuthor(book.author)}</p>
        )}
      </div>
    </div>
  );
});

function CategoryFullView({ category, categoryEn, initialFilter, initialSubFilter, language, books, onBack, onBookClick }) {
  const [mainFilter, setMainFilter] = useState(initialFilter && initialFilter !== 'All' ? initialFilter : 'Darsi');
  const [subFilter, setSubFilter] = useState(initialSubFilter || 'All');
  const fullViewScrollRef = useScrollRestoration(`category_full_view_${category}`);
  const allCats = [...BOYS_CATEGORIES, ...GIRLS_CATEGORIES, ...EXTRA_CATEGORIES];
  const matchedCat = allCats.find(c => c.label === category || c.en === category || category.includes(c.label) || (c.en && category.toLowerCase().includes(c.en.toLowerCase())));
  const catBooks = books.filter(b => {
    if (!b.category) return false;
    const bc = b.category.trim();
    return bc === category || bc === (matchedCat?.en) || bc === (matchedCat?.label) || bc.includes(category) || (matchedCat && bc.includes(matchedCat.label));
  });
  const isDars = BOYS_CATEGORIES.some(c => c.label === category || c.en === category || (matchedCat && c.label === matchedCat.label)) || GIRLS_CATEGORIES.some(c => c.label === category || c.en === category || (matchedCat && c.label === matchedCat.label));
  let filteredBooks = catBooks;
  if (isDars && mainFilter !== 'All') {
    if (mainFilter === 'Darsi') {
      filteredBooks = catBooks.filter(b => {
        if (!b.sub_category) return true;
        const sub = b.sub_category.trim().toLowerCase();
        return sub.includes('درسی') || sub.includes('darsi') || sub.includes('textbook') || 
               (!sub.includes('شرح') && !sub.includes('شروحات') && !sub.includes('commentary'));
      });
    } else if (mainFilter === 'Sharah') {
      filteredBooks = catBooks.filter(b => {
        if (!b.sub_category) return false;
        const sub = b.sub_category.trim().toLowerCase();
        const isSharah = sub.includes('شرح') || sub.includes('شروحات') || sub.includes('commentary') || sub.includes('اردو') || sub.includes('عربی');
        if (!isSharah) return false;
        if (subFilter === 'Urdu') return sub.includes('اردو') || sub.includes('urdu');
        if (subFilter === 'Arabic') return sub.includes('عربی') || sub.includes('arabic');
        return true;
      });
    }
  }

  const displayBooks = filteredBooks.length > 0 ? filteredBooks : catBooks;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)' }}>
      <header className="top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '16px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 24, cursor: 'pointer', marginRight: 16 }}>←</button>
        <h2 className="urdu-text" style={{ margin: 0, color: 'var(--gold-color)' }}>{language === 'ur' ? category : categoryEn || category}</h2>
      </header>
      {isDars && (
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            <TabBtn active={mainFilter === 'Darsi'} onClick={() => { setMainFilter('Darsi'); setSubFilter('All'); }} labelUr="درسی کتب" labelEn="Textbooks" lang={language} />
            <TabBtn active={mainFilter === 'Sharah'} onClick={() => { setMainFilter('Sharah'); setSubFilter('All'); }} labelUr="شروحات" labelEn="Commentaries" lang={language} />
          </div>
          {mainFilter === 'Sharah' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', animation: 'fadeIn 0.3s ease' }}>
              <SubTabBtn active={subFilter === 'All'} onClick={() => setSubFilter('All')} labelUr="تمام" labelEn="All" lang={language} />
              <SubTabBtn active={subFilter === 'Urdu'} onClick={() => setSubFilter('Urdu')} labelUr="اردو" labelEn="Urdu" lang={language} />
              <SubTabBtn active={subFilter === 'Arabic'} onClick={() => setSubFilter('Arabic')} labelUr="عربی" labelEn="Arabic" lang={language} />
            </div>
          )}
        </div>
      )}
      <div ref={fullViewScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignContent: 'flex-start', justifyContent: 'center' }}>
        {displayBooks.length > 0 ? displayBooks.map(book => <BookCard key={book.id} book={book} language={language} onBookClick={onBookClick} />) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }} className="urdu-text">
            {language === 'ur' ? 'اس حصے میں ابھی کتابیں شامل نہیں کی گئیں۔' : 'No books found in this section yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, labelUr, labelEn, lang }) {
  return <button onClick={onClick} style={{ padding: '8px 20px', borderRadius: '24px', whiteSpace: 'nowrap', background: active ? 'var(--gold-color)' : 'transparent', color: active ? '#000' : 'var(--text-primary)', border: active ? 'none' : '1px solid var(--divider-color)', fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', fontSize: '14px' }} className="urdu-text">{lang === 'ur' ? labelUr : labelEn}</button>;
}

function SubTabBtn({ active, onClick, labelUr, labelEn, lang }) {
  return <button onClick={onClick} style={{ padding: '6px 16px', borderRadius: '8px', whiteSpace: 'nowrap', background: active ? 'rgba(212,175,55,0.15)' : 'var(--nav-color)', color: active ? 'var(--gold-color)' : 'var(--text-secondary)', border: active ? '1px solid rgba(212,175,55,0.5)' : '1px solid var(--divider-color)', fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', fontSize: '13px', marginTop: 8 }} className="urdu-text">{lang === 'ur' ? labelUr : labelEn}</button>;
}

function App() {
  const mainAppScrollRef = useScrollRestoration('main_app_scroll');
  const adminTapRef = useRef(0);
  const adminTapTimerRef = useRef(null);
  const [showSplash, setShowSplash] = useState(true);
  const [books, setBooks] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPrefilledTitle, setUploadPrefilledTitle] = useState('');

  // Pre-group books by category once to avoid running O(N) filters on 3000+ items
  const booksByCategory = useMemo(() => {
    const map = {};
    const allCats = [...BOYS_CATEGORIES, ...GIRLS_CATEGORIES, ...EXTRA_CATEGORIES];
    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      if (!b.category) continue;
      const bCat = b.category.trim();
      if (!map[bCat]) map[bCat] = [];
      map[bCat].push(b);

      const matched = allCats.find(c => 
        c.label === bCat || 
        c.en === bCat ||
        bCat.includes(c.label) ||
        c.label.includes(bCat) ||
        (c.en && bCat.toLowerCase().includes(c.en.toLowerCase()))
      );
      if (matched) {
        if (!map[matched.label]) map[matched.label] = [];
        if (!map[matched.label].includes(b)) map[matched.label].push(b);

        if (matched.en) {
          if (!map[matched.en]) map[matched.en] = [];
          if (!map[matched.en].includes(b)) map[matched.en].push(b);
        }
      }
    }
    return map;
  }, [books]);

  // ── Featured Books: Random rotating selection ──
  const FEATURED_COUNT = 12; // how many to show at once
  const ROTATE_EVERY_MS = 6000; // swap 3 books every 6 sec
  const BADGES = ['Must Read', 'Popular', 'Knowledge', 'Classic', 'Special', 'Trending', 'Top Pick', 'Rare Find'];

  const [featuredBooks, setFeaturedBooks] = useState([]);
  const featuredPoolRef = useRef([]); // full shuffled pool to rotate from
  const featuredOffsetRef = useRef(0);

  // Build pool once when books load, seeded by date so it changes daily
  useEffect(() => {
    if (books.length === 0) return;
    try {
      const withCovers = books.filter(b => b.cover_url);
      const pool = withCovers.length >= FEATURED_COUNT ? withCovers : books;

      // Seeded random — seed = today's date, changes daily
      const seed = new Date().toDateString();
      let rng = seed.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
      const seededRand = () => { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return (rng >>> 0) / 0xFFFFFFFF; };

      // Fisher-Yates shuffle (no ID charCodeAt — safe for numeric IDs)
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      featuredPoolRef.current = shuffled;
      featuredOffsetRef.current = 0;
      setFeaturedBooks(shuffled.slice(0, FEATURED_COUNT).map((b, i) => ({ ...b, badge: BADGES[i % BADGES.length] })));
    } catch (e) {
      console.warn('Featured books init error:', e);
    }
  }, [books]);

  // Rotate 3 books every ROTATE_EVERY_MS
  useEffect(() => {
    if (featuredPoolRef.current.length === 0) return;
    const interval = setInterval(() => {
      const pool = featuredPoolRef.current;
      const SWAP = 3;
      featuredOffsetRef.current = (featuredOffsetRef.current + SWAP) % pool.length;
      setFeaturedBooks(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        for (let i = 0; i < SWAP; i++) {
          const idx = (featuredOffsetRef.current + i) % pool.length;
          const newBook = { ...pool[idx], badge: BADGES[Math.floor(Math.random() * BADGES.length)] };
          // Replace a random slot
          const slot = Math.floor(Math.random() * next.length);
          next[slot] = newBook;
        }
        return next;
      });
    }, ROTATE_EVERY_MS);
    return () => clearInterval(interval);
  }, [books]);

  const [libraryCount, setLibraryCount] = useState(0);
  const [readingBook, setReadingBook] = useState(null);
  const [readingBookPage, setReadingBookPage] = useState(1);
  const [currentTab, setCurrentTab] = useState('home');
  const { theme, setTheme } = useSettings();
  const [language, setLanguage] = useState(localStorage.getItem('smart_lang') || 'en');
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollTop = useRef(0);
  const [selectedScholar, setSelectedScholar] = useState(null);
  const [selectedCategoryView, setSelectedCategoryView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(true);
  const [isQuranReadingMode, setIsQuranReadingMode] = useState(false);
  const hideTimerRef = useRef(null);
  const navRef = useRef(null);
  const menuTimerRef = useRef(null);

  const triggerMenuVisibility = (visible) => {
    setShowMenu(visible);
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
      menuTimerRef.current = null;
    }
    if (visible) {
      menuTimerRef.current = setTimeout(() => {
        setShowMenu(false);
        menuTimerRef.current = null;
      }, 2000);
    }
  };
  const [syncStatus, setSyncStatus] = useState(null); // { current: 0, total: 0 }
  const [showSyncUI, setShowSyncUI] = useState(false);
  const [syncFinished, setSyncFinished] = useState(false);
  const [activeMainSection, setActiveMainSection] = useState('dars'); // 'dars' or 'mutafarriq'
  const [activeSubSection, setActiveSubSection] = useState('boys'); // 'boys' or 'girls'
  const [selectedMutafarriqCat, setSelectedMutafarriqCat] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const t = strings[language];

  useEffect(() => { fetchBooks(); updateLibraryCount(); }, []);

  // 🌟 VIP: BACKGROUND COVER PRE-CACHING (Aula to Akidat Sequential) 🌟
  useEffect(() => {
    if (!books || books.length === 0) return;

    // Wait 2 seconds after app start to avoid slowing down initial load
    const timer = setTimeout(() => {
      // 🌟 CORS bypass check: background pre-caching is only needed/allowed on native mobile platforms
      if (!Capacitor.isNativePlatform()) {
        console.log('📦 Skipping Background Cover Sync on Web/Browser.');
        return;
      }

      const preCacheAllCovers = async () => {
        console.log('📦 Starting Background Cover Sync...');
        try {
          const { Capacitor, CapacitorHttp } = await import('@capacitor/core');
          const imageStore = localforage.createInstance({
            name: 'SmartEMadarsa',
            storeName: 'cached_covers'
          });

          // Definitive Category Order (Aula -> Sania -> ... -> Girls -> Extra)
          const categoryOrder = [
            'درجہ اولیٰ', 'درجہ ثانیہ (2nd Year)', 'درجہ ثالثہ', 'درجہ رابعہ',
            'درجہ خامسہ', 'درجہ سادسہ', 'درجہ سابعہ', 'دورہ حدیث',
            ...GIRLS_CATEGORIES.map(c => c.label),
            ...EXTRA_CATEGORIES.map(c => c.label)
          ];

          const sortedBooks = [...books].sort((a, b) => {
            const idxA = categoryOrder.indexOf(a.category);
            const idxB = categoryOrder.indexOf(b.category);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });

          const totalToSync = sortedBooks.filter(b => b.cover_url).length;
          let syncCount = 0;
          let alreadyCached = 0;

          for (const book of sortedBooks) {
            if (!book.cover_url) continue;

            try {
              const cached = await imageStore.getItem(book.cover_url);
              if (!cached) {
                setSyncStatus({ current: syncCount + alreadyCached + 1, total: totalToSync });
                // Download if not in cache
                if (Capacitor.isNativePlatform()) {
                  const res = await CapacitorHttp.get({ url: book.cover_url, responseType: 'blob' });
                  if (res.status === 200 && res.data) {
                    let blob = res.data;
                    if (typeof blob === 'string') {
                      const dataUri = blob.startsWith('data:') ? blob : `data:image/jpeg;base64,${blob}`;
                      await imageStore.setItem(book.cover_url, dataUri);
                    } else {
                      await imageStore.setItem(book.cover_url, blob);
                    }
                    syncCount++;
                  }
                } else {
                  const res = await fetch(book.cover_url);
                  if (res.ok) {
                    const blob = await res.blob();
                    await imageStore.setItem(book.cover_url, blob);
                    syncCount++;
                  }
                }

                // Delay 50ms between each book - fast but respectful
                await new Promise(r => setTimeout(r, 50));
              } else {
                alreadyCached++;
              }
            } catch (e) {
              // Silently continue on single image fail
            }
          }
          console.log(`✅ Background Cover Sync Completed! Total new: ${syncCount}, Total in cache: ${alreadyCached + syncCount}`);
          setSyncFinished(true);
          setShowSyncUI(true);
          setTimeout(() => {
            setShowSyncUI(false);
            setSyncStatus(null);
          }, 4000);
        } catch (err) {
          console.error('❌ Sync failed:', err);
          setSyncStatus(null);
          setShowSyncUI(false);
        }
      };

      // Initial visibility
      setShowSyncUI(true);
      setTimeout(() => setShowSyncUI(false), 6000); // Hide after 6 seconds but keep syncing

      preCacheAllCovers();
    }, 2000);

    return () => clearTimeout(timer);
  }, [books]);

  const updateLibraryCount = async () => {
    try {
      const pdfStore = localforage.createInstance({ name: 'SmartEMadarsa', storeName: 'offline_books' });
      const keys = await pdfStore.keys();
      const bookIds = new Set(keys.filter(k => k.startsWith('pdf_')).map(k => k.split('_')[1]));
      setLibraryCount(bookIds.size);
    } catch (e) { console.error(e); }
  };

  async function fetchBooks() {
    try {
      const CACHE_KEY = 'cached_books_jsondata_v6';
      
      // 1. Pehle localforage local cache se load karein (fast instant render ke liye)
      const cached = await localforage.getItem(CACHE_KEY);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('📚 Instant load from local cache:', cached.length);
        setBooks(cached.filter(b => b.sub_category !== 'pending' && b.sub_category !== 'pending_approval'));
      }

      // 2. Data Cloudflare /books_metadata.json se fetch ho — pehle relative path try karein
      let fetchedBooks = [];
      try {
        const resRel = await fetch('/books_metadata.json?v=' + Date.now());
        if (resRel.ok) {
          fetchedBooks = await resRel.json();
          console.log('✅ Fetched books_metadata.json via relative path:', fetchedBooks.length);
        } else {
          const resAbs = await fetch('https://smart-e-madrasa.pakdigitalz.com/books_metadata.json?v=' + Date.now());
          if (resAbs.ok) {
            fetchedBooks = await resAbs.json();
            console.log('✅ Fetched books_metadata.json via absolute domain:', fetchedBooks.length);
          }
        }
      } catch (err) {
        console.warn("Relative fetch error, attempting absolute Cloudflare domain fetch:", err);
        try {
          const resAbs = await fetch('https://smart-e-madrasa.pakdigitalz.com/books_metadata.json?v=' + Date.now());
          if (resAbs.ok) {
            fetchedBooks = await resAbs.json();
          }
        } catch (e2) {
          console.warn("Absolute books fetch also failed:", e2);
        }
      }

      if (fetchedBooks && fetchedBooks.length > 0) {
        const approvedBooks = fetchedBooks.filter(b => b.sub_category !== 'pending' && b.sub_category !== 'pending_approval');
        console.log('🎉 Setting books in React state:', approvedBooks.length);
        setBooks(approvedBooks);
        await localforage.setItem(CACHE_KEY, approvedBooks);
      } else if (!cached || cached.length === 0) {
        setBooks([]);
      }
    } catch (e) { 
      console.error("Cloudflare Books Fetch failure:", e);
      const cached = await localforage.getItem('cached_books_jsondata_v3');
      if (cached && cached.length > 0) {
        setBooks(cached);
      } else {
        setBooks([]);
      }
    }
  }

  useEffect(() => {
    const handleScroll = (e) => {
      if (e.target) {
        setIsScrolled(e.target.scrollTop > 20);
      }
    };
    const container = document.getElementById('main-app-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentTab]);
  // Handle Deep Linking & Web Fallback Book Routing
  useEffect(() => {
    if (!books || books.length === 0) return;

    // 1. Web browser fallback routing (e.g. ?bookId=123)
    const urlParams = new URLSearchParams(window.location.search);
    const webBookId = urlParams.get('bookId') || urlParams.get('id');
    if (webBookId) {
      const foundBook = books.find(b => String(b.id) === String(webBookId));
      if (foundBook) {
        setReadingBook(foundBook);
        // Clear query parameters from URL without page reload to keep it clean
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // 2. Native App Deep Linking routing (smartemadarsa://book?id=123)
    const handleNativeDeepLink = (url) => {
      try {
        if (!url) return;
        const parsedUrl = new URL(url.replace('smartemadarsa://', 'https://dummy.com/'));
        const linkBookId = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('bookId');
        if (linkBookId) {
          const foundBook = books.find(b => String(b.id) === String(linkBookId));
          if (foundBook) {
            setReadingBook(foundBook);
          }
        }
      } catch (e) {
        console.error("Native deep link handling error:", e);
      }
    };

    // Listen for deep links while the app is already open
    const appUrlOpenListener = CapApp.addListener('appUrlOpen', (event) => {
      handleNativeDeepLink(event.url);
    });

    // Check if the app was launched by clicking a deep link from cold start
    CapApp.getLaunchUrl().then((launchUrl) => {
      if (launchUrl && launchUrl.url) {
        handleNativeDeepLink(launchUrl.url);
      }
    });

    return () => {
      appUrlOpenListener.then(h => h.remove());
    };
  }, [books]);

  useEffect(() => {
    const backHandler = CapApp.addListener('backButton', () => {
      if (readingBook) { setReadingBook(null); return; }
      if (selectedScholar) { setSelectedScholar(null); return; }
      if (selectedCategoryView) { setSelectedCategoryView(null); return; }
      if (searchTerm) { setSearchTerm(''); return; }
      if (currentTab !== 'home') { setCurrentTab('home'); return; }
      CapApp.exitApp();
    });
    return () => { backHandler.then(h => h.remove()); };
  }, [readingBook, selectedScholar, selectedCategoryView, searchTerm, currentTab]);

  useEffect(() => {
    if (showSplash || isQuranReadingMode || readingBook) {
      setShowMenu(false);
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
        menuTimerRef.current = null;
      }
      return;
    }

    // Default show on load, with auto-hide timer
    triggerMenuVisibility(true);

    const isInteractiveElement = (el) => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      if (['button', 'input', 'select', 'textarea', 'a', 'option', 'label', 'svg', 'path'].includes(tag)) {
        return true;
      }
      if (el.closest('button') || el.closest('a') || el.closest('select') || el.closest('input')) {
        return true;
      }
      if (el.closest('.horizontal-scroll') || el.closest('.marquee-container') || el.closest('.features-carousel') || el.closest('.hero-slider') || el.closest('.carousel') || el.closest('.swiper')) {
        return true;
      }
      if (el.closest('.search-container') || el.closest('[data-search]') || el.closest('input[type="text"]') || el.closest('.search-input-wrapper')) {
        return true;
      }
      if (el.closest('.book-card-hover') || el.closest('.featured-card') || el.closest('.scholar-tag') || el.closest('.dars-card') || el.closest('.category-pill') || el.closest('.ulama-course-card')) {
        return true;
      }
      if (el.closest('.top-bar')) {
        return true;
      }
      const style = window.getComputedStyle(el);
      if (style.cursor === 'pointer') {
        return true;
      }
      return false;
    };

    const handleGlobalClick = (e) => {
      if (showSplash || isQuranReadingMode || readingBook) return;
      
      // If clicking inside the bottom nav itself, keep it open and reset timer
      if (navRef.current && navRef.current.contains(e.target)) {
        if (menuTimerRef.current) {
          clearTimeout(menuTimerRef.current);
          menuTimerRef.current = null;
        }
        return;
      }

      // If clicking on any interactive element (buttons, carousel, search bar, etc.), do nothing
      if (isInteractiveElement(e.target)) {
        return;
      }

      // Toggle menu visibility (and start 2s timer if showing)
      setShowMenu(prev => {
        const next = !prev;
        if (menuTimerRef.current) {
          clearTimeout(menuTimerRef.current);
          menuTimerRef.current = null;
        }
        if (next) {
          menuTimerRef.current = setTimeout(() => {
            setShowMenu(false);
            menuTimerRef.current = null;
          }, 2000);
        }
        return next;
      });
    };

    let lastTime = 0;
    const hideMenuThrottled = () => {
      const now = Date.now();
      if (now - lastTime < 150) return;
      lastTime = now;
      setShowMenu(false);
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
        menuTimerRef.current = null;
      }
    };

    window.addEventListener('scroll', hideMenuThrottled, { capture: true, passive: true });
    window.addEventListener('touchmove', hideMenuThrottled, { capture: true, passive: true });
    window.addEventListener('wheel', hideMenuThrottled, { capture: true, passive: true });
    window.addEventListener('click', handleGlobalClick, { capture: true });

    return () => {
      window.removeEventListener('scroll', hideMenuThrottled, { capture: true });
      window.removeEventListener('touchmove', hideMenuThrottled, { capture: true });
      window.removeEventListener('wheel', hideMenuThrottled, { capture: true });
      window.removeEventListener('click', handleGlobalClick, { capture: true });
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
    };
  }, [currentTab, isQuranReadingMode, showSplash, readingBook, selectedScholar, selectedCategoryView]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => { const next = language === 'ur' ? 'en' : 'ur'; setLanguage(next); localStorage.setItem('smart_lang', next); };

  if (readingBook) {
    // Read last saved page from localStorage (set by PDFViewer automatically)
    const savedPage = parseInt(localStorage.getItem(`rp_${readingBook.id}_v0`) || localStorage.getItem(`rp_${readingBook.id}`) || '1', 10);
    const lastPage = !isNaN(savedPage) && savedPage > 1 ? savedPage : readingBookPage;
    return <BookReader book={readingBook} onBack={() => { setReadingBook(null); setReadingBookPage(1); }} language={language} initialPage={lastPage} />;
  }
  if (selectedScholar) return <ScholarProfilePage scholarId={selectedScholar} language={language} onBack={() => setSelectedScholar(null)} onBookClick={(book) => setReadingBook(book)} />;
  if (selectedCategoryView) {
    const categoryName = typeof selectedCategoryView === 'string' ? selectedCategoryView : selectedCategoryView.name;
    const initialFilter = typeof selectedCategoryView === 'string' ? 'All' : selectedCategoryView.filter;
    const initialSubFilter = typeof selectedCategoryView === 'object' ? (selectedCategoryView.subFilter || 'AllSharah') : 'AllSharah';
    const allCats = [...BOYS_CATEGORIES, ...GIRLS_CATEGORIES, ...EXTRA_CATEGORIES];
    const cat = allCats.find(c => c.label === categoryName);
    return <CategoryFullView category={categoryName} categoryEn={cat?.en} initialFilter={initialFilter} initialSubFilter={initialSubFilter} language={language} books={books} onBack={() => setSelectedCategoryView(null)} onBookClick={(book) => setReadingBook(book)} />;
  }
  if (currentTab === 'ai') {
    return <AIChatPage onBack={() => setCurrentTab('home')} onBookClick={(book, page) => { setReadingBook(book); setReadingBookPage(page || 1); }} />;
  }

  return (
    <div id="main-app-container" ref={mainAppScrollRef} className="app-container" style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      {showSplash && <SplashScreen onComplete={() => {
        setShowSplash(false);
        const hasSeen = localStorage.getItem('has_seen_welcome_popup');
        if (!hasSeen) {
          setShowWelcomePopup(true);
        }
      }} language={language} />}
      {!isQuranReadingMode && (
        <header className={`top-bar ${isScrolled ? 'scrolled' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="top-bar-left" onClick={() => { adminTapRef.current += 1; if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current); adminTapTimerRef.current = setTimeout(() => { adminTapRef.current = 0; }, 1500); if (adminTapRef.current >= 5) { setCurrentTab('admin'); adminTapRef.current = 0; } }} style={{ cursor: 'pointer' }}>
            <AnimatedLogo size={isScrolled ? 38 : 52} />
            <AnimatedHeaderText language={language} appName={t.appName} />
          </div>
          <div className="top-bar-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <HeaderMenu
              language={language}
              toggleLanguage={toggleLanguage}
              theme={theme}
              toggleTheme={toggleTheme}
              setCurrentTab={setCurrentTab}
            />
          </div>
        </header>
      )}

      {/* 🚀 Sync Progress Indicator */}
      {syncStatus && showSyncUI && !showSplash && !readingBook && (
        <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', background: syncFinished ? 'rgba(74, 222, 128, 0.95)' : 'rgba(212,175,55,0.95)', color: '#000', padding: '6px 15px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideDown 0.3s ease' }}>
          {syncFinished ? <CheckCircle size={14} color="#000" /> : <div className="sync-spinner" style={{ width: '12px', height: '12px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
          <span>
            {syncFinished
              ? (language === 'ur' ? 'تمام کور محفوظ کر لیے گئے!' : 'All covers synced successfully!')
              : (language === 'ur' ? `کتابوں کے کور محفوظ ہو رہے ہیں: ${syncStatus.current} / ${syncStatus.total}` : `Syncing Covers: ${syncStatus.current} / ${syncStatus.total}`)}
          </span>
        </div>
      )}

      <div className="main-content-wrapper" style={{ paddingTop: '85px' }}>
        {currentTab === 'home' && !isQuranReadingMode && <HeroSlider language={language} appName={t.appName} />}

        {/* ── CHANGE 1: Advanced Search replaces old search-container ── */}
        {currentTab === 'home' && !isQuranReadingMode && (
          <div onClick={(e) => e.stopPropagation()}>
            <AdvancedSearch
              books={books}
              language={language}
              onBookClick={(book) => setReadingBook(book)}
            />
          </div>
        )}

        {currentTab === 'admin' ? <AdminPanel />
          : currentTab === 'suggest' ? <SuggestBookPage language={language} onBack={() => setCurrentTab('home')} />
          /* ── CHANGE 2: searchTerm check removed — AdvancedSearch handles it internally ── */
          : currentTab === 'ai' ? <AIChatPage onBookClick={(book, page) => { setReadingBook(book); setReadingBookPage(page || 1); }} />
            : currentTab === 'tasbeeh' ? <Tasbeeh language={language} />
              : currentTab === 'qibla' ? <QiblaTimes language={language} />
                : currentTab === 'library' ? <LibraryComp language={language} onBookClick={(b) => setReadingBook(b)} books={books} />
                  : currentTab === 'sync' ? <DataSync language={language} />
                    : currentTab === 'duas' ? <DailyDuas language={language} />
                      : currentTab === 'quran' ? <QuranSection onExit={() => setCurrentTab('home')} onReadingStateChange={(isReading) => setIsQuranReadingMode(isReading)} />
                        : currentTab === 'calendar' ? <IslamicCalendar language={language} />
                          : currentTab === 'requests' ? (
                              <BookRequestsTab 
                                language={language} 
                                onUploadRequest={(title) => {
                                  setUploadPrefilledTitle(title);
                                  setShowUploadModal(true);
                                }}
                              />
                            )
                            : (
                              <section className="books-section">
                              {/* ⭐ My Favorites Section */}
                              {JSON.parse(localStorage.getItem('smart_bookmarks') || '[]').length > 0 && (
                                <>
                                  <div className="section-divider" style={{ marginTop: 20, marginBottom: 8 }}>
                                    <div className="section-divider-line" />
                                    <span className="section-divider-text urdu-text" style={{ fontSize: '18px', padding: '0 10px' }}><Bookmark size={20} /> {language === 'ur' ? 'میری پسندیدہ کتب' : 'My Favorites'}</span>
                                    <div className="section-divider-line" />
                                  </div>
                                  <div className="horizontal-scroll" style={{ paddingBottom: 10 }}>
                                    {JSON.parse(localStorage.getItem('smart_bookmarks') || '[]').map(book => (
                                      <BookCard key={book.id} book={book} language={language} onBookClick={(b) => setReadingBook(b)} />
                                    ))}
                                  </div>
                                </>
                              )}

                              <div className="section-divider" style={{ marginTop: 32, marginBottom: 8 }}>
                                <div className="section-divider-line" />
                                <span className="section-divider-text urdu-text" style={{ fontSize: '18px', padding: '0 10px' }}><Sparkles size={20} /> {language === 'ur' ? 'منتخب کتابیں' : 'Featured Books'}</span>
                                <div className="section-divider-line" />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px', marginBottom: 16 }}>
                                <button onClick={() => onViewAll('منتخب کتابیں', 'All', 'All')} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer', padding: '2px 12px', borderRadius: '10px', fontWeight: 500 }}>{language === 'ur' ? 'سب دیکھیں' : 'View All'}</button>
                              </div>
                              <div className="horizontal-scroll" style={{ paddingBottom: 10, minHeight: '50px' }}>
                                {featuredBooks.length === 0 ? (
                                  <div className="urdu-text" style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    {language === 'ur' ? 'کتب لوڈ ہو رہی ہیں...' : 'Loading books...'}
                                  </div>
                                ) : (
                                  featuredBooks.map((book, idx) => (
                                    <div key={`${book.id}_${book.badge}_${idx}`} className="featured-card" onClick={() => setReadingBook(book)} style={{ cursor: 'pointer', width: 110, height: 155, animation: 'featuredFadeIn 0.5s ease' }}>
                                      <div className="book-badge" style={{ background: 'linear-gradient(135deg, #d4af37, #b4831f)', border: '1px solid #000' }}>{book.badge}</div>
                                      {book.cover_url ? <OfflineImage src={book.cover_url} alt={getLocalizedTitle(book.title, language)} className="featured-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="featured-emoji">📚</div>}
                                      <div className="featured-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)' }}><p className="featured-title urdu-text" style={{ fontSize: 11, color: '#f8e5a7' }}>{getLocalizedTitle(book.title, language)}</p></div>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="section-divider" style={{ marginTop: 32, marginBottom: 16 }}>
                                <div className="section-divider-line" />
                                <span className="section-divider-text urdu-text" style={{ fontSize: '22px' }}><User size={26} /> {language === 'ur' ? 'ہمارے معزز علماء کرام' : 'Our Respected Scholars'}</span>
                                <div className="section-divider-line" />
                              </div>
                              <FeaturesCarousel language={language} onScholarClick={(id) => setSelectedScholar(id)} />
                              <div className="section-divider" style={{ marginTop: 32, marginBottom: 16 }}>
                                <div className="section-divider-line" />
                                <span className="section-divider-text urdu-text" style={{ fontSize: '22px' }}><GraduationCap size={26} /> {language === 'ur' ? 'علماء کرام کے کورسز' : 'Ulama Specialist Courses'}</span>
                                <div className="section-divider-line" />
                              </div>
                              <div style={{ padding: '0 16px', marginBottom: 24 }}>
                                <div className="dars-section-glow" style={{ borderRadius: '20px', margin: 0 }}>
                                  <div className="ulama-course-card dars-section-inner" style={{ background: 'linear-gradient(135deg, var(--gold-light) -50%, var(--card-color) 100%)', borderRadius: '19px', padding: '20px', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                      <div style={{ backgroundColor: 'rgba(212,175,55,0.15)', padding: '10px', borderRadius: '12px' }}><Library size={24} color="#d4af37" /></div>
                                      <div>
                                        <h3 className="urdu-text" style={{ color: 'var(--text-primary)', fontSize: '18px', margin: 0 }}>{language === 'ur' ? 'منتخب علماء کرام' : 'Selected Scholars List'}</h3>
                                        <p className="urdu-text" style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>{language === 'ur' ? 'ہمارے معزز اساتذہ کی فہرست' : 'List of our respected teachers'}</p>
                                      </div>
                                    </div>
                                    <div className="marquee-container">
                                      <div className="marquee-content">
                                        {[...scholarsData, ...scholarsData, ...scholarsData].map((scholar, idx) => (
                                          <div key={`${scholar.id}-${idx}`} className="scholar-tag" onClick={() => setSelectedScholar(scholar.id)}>
                                            <User size={12} color="#d4af37" />
                                            <span className="urdu-text">{language === 'ur' ? scholar.nameUr : scholar.nameEn}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
                                  </div>
                                </div>
                              </div>
                              {/* 🧭 Optimized Navigation Section */}
                              <div style={{ padding: '0 16px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                  <button
                                    onClick={() => setActiveMainSection('dars')}
                                    style={{
                                      flex: 1, padding: '10px 8px', borderRadius: '16px',
                                      background: activeMainSection === 'dars' ? 'linear-gradient(135deg, #d4af37, #b4831f)' : 'rgba(212,175,55,0.05)',
                                      color: activeMainSection === 'dars' ? '#000' : 'var(--gold-color)',
                                      border: '1px solid var(--gold-color)',
                                      fontWeight: 'bold', fontSize: '14px', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                      boxShadow: activeMainSection === 'dars' ? '0 8px 16px rgba(212,175,55,0.2), inset 0 0 5px rgba(255,255,255,0.2)' : 'none',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                      transform: activeMainSection === 'dars' ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                    className="urdu-text"
                                  >
                                    <DarsVipIcon size={24} active={activeMainSection === 'dars'} />
                                    <span>{language === 'ur' ? 'درسِ نظامی' : 'Dars-e-Nizami'}</span>
                                  </button>
                                  <button
                                    onClick={() => setActiveMainSection('mutafarriq')}
                                    style={{
                                      flex: 1, padding: '10px 8px', borderRadius: '16px',
                                      background: activeMainSection === 'mutafarriq' ? 'linear-gradient(135deg, #d4af37, #b4831f)' : 'rgba(212,175,55,0.05)',
                                      color: activeMainSection === 'mutafarriq' ? '#000' : 'var(--gold-color)',
                                      border: '1px solid var(--gold-color)',
                                      fontWeight: 'bold', fontSize: '14px', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                      boxShadow: activeMainSection === 'mutafarriq' ? '0 8px 16px rgba(212,175,55,0.2), inset 0 0 5px rgba(255,255,255,0.2)' : 'none',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                      transform: activeMainSection === 'mutafarriq' ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                    className="urdu-text"
                                  >
                                    <MutafarriqVipIcon size={24} active={activeMainSection === 'mutafarriq'} />
                                    <span>{language === 'ur' ? 'متفرق کتب' : 'General Books'}</span>
                                  </button>
                                </div>

                                {/* Dars-e-Nizami Sub-Selection */}
                                {activeMainSection === 'dars' && (
                                  <div style={{ display: 'flex', gap: '10px', animation: 'fadeIn 0.4s ease' }}>
                                    <button
                                      onClick={() => setActiveSubSection('boys')}
                                      style={{
                                        flex: 1, padding: '10px', borderRadius: '12px',
                                        background: activeSubSection === 'boys' ? 'rgba(212,175,55,0.15)' : 'transparent',
                                        color: activeSubSection === 'boys' ? 'var(--gold-color)' : 'var(--text-secondary)',
                                        border: `1px solid ${activeSubSection === 'boys' ? 'var(--gold-color)' : 'var(--divider-color)'}`,
                                        fontWeight: '600', fontSize: '13px', transition: 'all 0.2s'
                                      }}
                                      className="urdu-text"
                                    >
                                      بنین (Boys)
                                    </button>
                                    <button
                                      onClick={() => setActiveSubSection('girls')}
                                      style={{
                                        flex: 1, padding: '10px', borderRadius: '12px',
                                        background: activeSubSection === 'girls' ? 'rgba(212,175,55,0.15)' : 'transparent',
                                        color: activeSubSection === 'girls' ? 'var(--gold-color)' : 'var(--text-secondary)',
                                        border: `1px solid ${activeSubSection === 'girls' ? 'var(--gold-color)' : 'var(--divider-color)'}`,
                                        fontWeight: '600', fontSize: '13px', transition: 'all 0.2s'
                                      }}
                                      className="urdu-text"
                                    >
                                      بنات (Girls)
                                    </button>
                                  </div>
                                )}

                                {/* Mutafarriq Kutub Category Scroller */}
                                {activeMainSection === 'mutafarriq' && (
                                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', animation: 'fadeIn 0.4s ease' }}>
                                    <button
                                      onClick={() => setSelectedMutafarriqCat(null)}
                                      style={{
                                        padding: '8px 18px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '12px',
                                        background: selectedMutafarriqCat === null ? 'rgba(212,175,55,0.15)' : 'var(--nav-color)',
                                        color: selectedMutafarriqCat === null ? 'var(--gold-color)' : 'var(--text-secondary)',
                                        border: `1px solid ${selectedMutafarriqCat === null ? 'var(--gold-color)' : 'var(--divider-color)'}`,
                                        transition: 'all 0.2s'
                                      }}
                                      className="urdu-text"
                                    >
                                      تمام کتب
                                    </button>
                                    {EXTRA_CATEGORIES.map(cat => (
                                      <button
                                        key={cat.label}
                                        onClick={() => setSelectedMutafarriqCat(cat.label)}
                                        style={{
                                          padding: '8px 18px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '12px',
                                          background: selectedMutafarriqCat === cat.label ? 'rgba(212,175,55,0.15)' : 'var(--nav-color)',
                                          color: selectedMutafarriqCat === cat.label ? 'var(--gold-color)' : 'var(--text-secondary)',
                                          border: `1px solid ${selectedMutafarriqCat === cat.label ? 'var(--gold-color)' : 'var(--divider-color)'}`,
                                          transition: 'all 0.2s'
                                        }}
                                        className="urdu-text"
                                      >
                                        {language === 'ur' ? cat.label : cat.en}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* --- CONDITIONAL SECTIONS --- */}

                              {/* Darsi Boys */}
                              {activeMainSection === 'dars' && activeSubSection === 'boys' && (
                                <div style={{ animation: 'slideUp 0.5s ease' }}>
                                  <div className="section-divider" style={{ marginBottom: 16 }}>
                                    <div className="section-divider-line" />
                                    <span className="section-divider-text urdu-text" style={{ fontSize: '22px' }}><BookOpen size={26} /> {t.boysSection}</span>
                                    <div className="section-divider-line" />
                                  </div>
                                  <SectionStatsRow language={language} />

                                  {/* 📤 💬 Dual Action: Upload Book & Request Book Side-by-Side */}
                                  <div style={{
                                    margin: '0 16px 24px 16px',
                                    display: 'flex',
                                    gap: '12px',
                                    flexWrap: 'nowrap'
                                  }}>
                                    {/* Card 1: Upload Book */}
                                    <div 
                                      onClick={() => setShowUploadModal(true)}
                                      style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
                                        border: '1px dashed rgba(212,175,55,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        minWidth: 0
                                      }}
                                    >
                                      <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #d4af37, #b4831f)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, boxShadow: '0 4px 8px rgba(212,175,55,0.2)'
                                      }}>
                                        <Upload size={16} color="#000" />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="urdu-text" style={{ 
                                          margin: 0, fontSize: '13px', fontWeight: 'bold',
                                          color: 'var(--gold-color, #d4af37)',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'کتاب اپلوڈ کریں' : 'Upload Book'}
                                        </p>
                                        <p className="urdu-text" style={{ 
                                          margin: '2px 0 0 0', fontSize: '10px',
                                          color: 'var(--text-secondary, #a0aec0)',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'پی ڈی ایف شیئر کریں' : 'Share PDF files'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Card 2: Request Book */}
                                    <div 
                                      onClick={() => setCurrentTab('requests')}
                                      style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(72,187,120,0.12), rgba(72,187,120,0.04))',
                                        border: '1px dashed rgba(72,187,120,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        minWidth: 0
                                      }}
                                    >
                                      <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #48bb78, #38a169)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, boxShadow: '0 4px 8px rgba(72,187,120,0.2)'
                                      }}>
                                        <MessageSquare size={16} color="#000" />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="urdu-text" style={{ 
                                          margin: 0, fontSize: '13px', fontWeight: 'bold',
                                          color: '#48bb78',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'کتاب کی درخواست' : 'Request Book'}
                                        </p>
                                        <p className="urdu-text" style={{ 
                                          margin: '2px 0 0 0', fontSize: '10px',
                                          color: 'var(--text-secondary, #a0aec0)',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'دیگر صارفین سے مانگیں' : 'Ask community'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {BOYS_CATEGORIES.map(cat => (
                                    <CategorySection key={cat.label} cat={cat} isDars={true} books={booksByCategory[cat.label] || []} onViewAll={(name, filter, subFilter) => setSelectedCategoryView({ name, filter, subFilter })} language={language} onBookClick={(book) => setReadingBook(book)} />
                                  ))}
                                </div>
                              )}

                              {/* Darsi Girls */}
                              {activeMainSection === 'dars' && activeSubSection === 'girls' && (
                                <div style={{ animation: 'slideUp 0.5s ease' }}>
                                  <div className="section-divider" style={{ marginBottom: 16 }}>
                                    <div className="section-divider-line" />
                                    <span className="section-divider-text urdu-text" style={{ fontSize: '22px' }}><GraduationCap size={26} /> {t.girlsSection}</span>
                                    <div className="section-divider-line" />
                                  </div>
                                  <SectionStatsRow language={language} />

                                  {/* 📤 💬 Dual Action: Upload Book & Request Book Side-by-Side (Girls) */}
                                  <div style={{
                                    margin: '0 16px 24px 16px',
                                    display: 'flex',
                                    gap: '12px',
                                    flexWrap: 'nowrap'
                                  }}>
                                    {/* Card 1: Upload Book */}
                                    <div 
                                      onClick={() => setShowUploadModal(true)}
                                      style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
                                        border: '1px dashed rgba(212,175,55,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        minWidth: 0
                                      }}
                                    >
                                      <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #d4af37, #b4831f)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, boxShadow: '0 4px 8px rgba(212,175,55,0.2)'
                                      }}>
                                        <Upload size={16} color="#000" />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="urdu-text" style={{ 
                                          margin: 0, fontSize: '13px', fontWeight: 'bold',
                                          color: 'var(--gold-color, #d4af37)',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'کتاب اپلوڈ کریں' : 'Upload Book'}
                                        </p>
                                        <p className="urdu-text" style={{ 
                                          margin: '2px 0 0 0', fontSize: '10px',
                                          color: 'var(--text-secondary, #a0aec0)',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'پی ڈی ایف شیئر کریں' : 'Share PDF files'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Card 2: Request Book */}
                                    <div 
                                      onClick={() => setCurrentTab('requests')}
                                      style={{
                                        flex: 1,
                                        padding: '14px 12px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(72,187,120,0.12), rgba(72,187,120,0.04))',
                                        border: '1px dashed rgba(72,187,120,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        minWidth: 0
                                      }}
                                    >
                                      <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #48bb78, #38a169)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, boxShadow: '0 4px 8px rgba(72,187,120,0.2)'
                                      }}>
                                        <MessageSquare size={16} color="#000" />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p className="urdu-text" style={{ 
                                          margin: 0, fontSize: '13px', fontWeight: 'bold',
                                          color: '#48bb78',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'کتاب کی درخواست' : 'Request Book'}
                                        </p>
                                        <p className="urdu-text" style={{ 
                                          margin: '2px 0 0 0', fontSize: '10px',
                                          color: 'var(--text-secondary, #a0aec0)',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {language === 'ur' ? 'دیگر صارفین سے مانگیں' : 'Ask community'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {GIRLS_CATEGORIES.map(cat => (
                                    <CategorySection key={cat.label} cat={cat} isDars={true} books={booksByCategory[cat.label] || []} onViewAll={(name, filter, subFilter) => setSelectedCategoryView({ name, filter, subFilter })} language={language} onBookClick={(book) => setReadingBook(book)} />
                                  ))}
                                </div>
                              )}

                              {/* Mutafarriq Sections */}
                              {activeMainSection === 'mutafarriq' && (
                                <div style={{ animation: 'slideUp 0.5s ease' }}>
                                  {EXTRA_CATEGORIES
                                    .filter(cat => selectedMutafarriqCat === null || cat.label === selectedMutafarriqCat)
                                    .map(cat => (
                                      <CategorySection key={cat.label} cat={cat} isDars={false} books={booksByCategory[cat.label] || []} onViewAll={(name, filter) => setSelectedCategoryView({ name, filter })} language={language} onBookClick={(book) => setReadingBook(book)} />
                                    ))
                                  }
                                </div>
                              )}
                            </section>
                          )}
      </div>
      {/* Floating AI Button (visible on all screens except splash/reading mode/AI screen) */}
      {!showSplash && !isQuranReadingMode && currentTab !== 'ai' && (
        <FloatingAIButton
          onOpen={() => setCurrentTab('ai')}
          visible={currentTab !== 'ai'}
        />
      )}

      {!showSplash && (
        <div ref={navRef} style={{ position: 'fixed', left: 0, right: 0, bottom: (showMenu && !isQuranReadingMode) ? '0px' : '-120px', opacity: (showMenu && !isQuranReadingMode) ? 1 : 0, pointerEvents: (showMenu && !isQuranReadingMode) ? 'auto' : 'none', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 99999 }}>
          <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} language={language} libraryCount={libraryCount} />
        </div>
      )}

      {/* Book Upload Modal */}
      <BookUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadPrefilledTitle('');
        }}
        language={language}
        categories={[...BOYS_CATEGORIES.map(c => c.label), ...GIRLS_CATEGORIES.map(c => c.label), ...EXTRA_CATEGORIES.map(c => c.label)]}
        prefilledTitle={uploadPrefilledTitle}
      />
      {/* Welcome & Navigation Tips Popup Modal */}
      {showWelcomePopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100005,
          padding: '24px',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #111a14, #0a0e0b)',
            border: '2px solid var(--gold-color, #d4af37)',
            borderRadius: '24px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.15)',
            position: 'relative',
            animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            textAlign: 'center',
            direction: 'rtl',
          }}>
            {/* Islamic Header Emblem */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #b4831f)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 6px 12px rgba(212,175,55,0.3)',
            }}>
              <span style={{ fontSize: '24px', color: '#000' }}>📚</span>
            </div>

            <h3 className="urdu-text" style={{
              color: 'var(--gold-color, #d4af37)',
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1.4'
            }}>
              السلام علیکم ورحمتہ اللہ وبرکاتہ! 🌸
            </h3>

            <p className="urdu-text" style={{
              color: '#e2e8f0',
              fontSize: '13px',
              lineHeight: '1.8',
              margin: '0 0 20px 0',
              textAlign: 'justify',
            }}>
              اگر آپ کو کوئی کتاب <strong>درسی کتب یا زمرہ جات (Categories)</strong> میں نہ ملے، تو اسے اوپر موجود <strong>تلاش بار (Search Bar)</strong> میں <u>اردو</u> میں سرچ کریں۔
              <br /><br />
              اگر پھر بھی کتاب نہ ملے تو پریشان نہ ہوں! آپ کمیونٹی سے <strong>کتاب کی درخواست (Request Book)</strong> کر سکتے ہیں یا اگر آپ کے پاس اس کی پی ڈی ایف موجود ہے تو <strong>کتاب اپلوڈ (Upload Book)</strong> کر کے دوسروں کے ساتھ شیئر بھی کر سکتے ہیں۔ جزاکم اللہ خیرا!
            </p>

            <button
              onClick={() => {
                localStorage.setItem('has_seen_welcome_popup', 'true');
                setShowWelcomePopup(false);
              }}
              className="urdu-text"
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #d4af37, #b4831f)',
                color: '#000',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(212,175,55,0.25)',
                transition: 'all 0.2s',
              }}
            >
              سمجھ گیا (Understood)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
