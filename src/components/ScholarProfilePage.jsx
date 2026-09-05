import { useScrollRestoration } from './useScrollRestoration';
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { scholarsData } from '../data/scholars';
import { ArrowLeft, User, BookOpen, MapPin, Calendar, Search } from 'lucide-react';
import * as localforageModule from 'localforage';
const localforage = localforageModule.default || localforageModule;
import BookCard from './BookCard';
import OfflineImage from '../OfflineImage';
import './ScholarProfilePage.css';

// Scholar bios — bilingual
const scholarBios = {
  "allama-shibli-nomani": {
    bioEn: "Allama Shibli Nomani (1857–1914) was a renowned Islamic scholar, historian and literary critic from India. He authored 'Sirat-un-Nabi', 'Al-Mamoon', 'Al-Farooq' and many other classical works on Islamic history.",
    bioUr: "علامہ شبلی نعمانی (1857–1914) ہندوستان کے مشہور اسلامی مؤرخ، ادیب اور نقاد تھے۔ سیرت النبیؐ، المامون، الفاروق اور دیگر کتب آپ کی معروف تصانیف ہیں۔"
  },
  "dr-mahmood-ahmad-ghazi": {
    bioEn: "Dr. Mahmood Ahmad Ghazi (1950–2010) was a distinguished Pakistani Islamic scholar, jurist, and academic. He served as president of the International Islamic University, Islamabad.",
    bioUr: "ڈاکٹر محمود احمد غازی (1950–2010) پاکستان کے ممتاز اسلامی سکالر، ماہر قانون اور ماہر تعلیم تھے۔ آپ بین الاقوامی اسلامی یونیورسٹی اسلام آباد کے صدر رہے۔"
  },
  "hafiz-akbar-shah-bukhari": {
    bioEn: "Hafiz Muhammad Akbar Shah Bukhari was a respected Islamic scholar known for his contributions to Islamic education and literature.",
    bioUr: "حافظ محمد اکبر شاہ بخاری ایک معزز عالم دین تھے جو اسلامی تعلیم اور ادب میں اپنی خدمات کے لیے جانے جاتے ہیں۔"
  },
  "maulana-abdul-majid-daryabadi": {
    bioEn: "Maulana Abdul Majid Daryabadi (1892–1977) was a famous Indian Islamic scholar, Quranic commentator and journalist. His Tafsir-e-Majidi is widely acclaimed.",
    bioUr: "مولانا عبد الماجد دریابادی (1892–1977) مشہور ہندوستانی عالم دین، مفسر قرآن اور صحافی تھے۔ آپ کی تفسیر ماجدی بہت مقبول ہے۔"
  },
  "maulana-abdur-rasheed-nomani": {
    bioEn: "Maulana Abdur Rasheed Nomani was a distinguished hadith scholar and author of several important works on Islamic jurisprudence.",
    bioUr: "مولانا عبد الرشید نعمانی ایک ممتاز عالم حدیث تھے اور فقہ اسلامی پر کئی اہم کتب کے مصنف تھے۔"
  },
  "maulana-abul-hasan-ali-nadvi": {
    bioEn: "Maulana Abul Hasan Ali Nadvi (1914–1999) was one of the most influential Islamic scholars of the 20th century. Author of 'What Has the World Lost by the Decline of Muslims' and many other classics.",
    bioUr: "مولانا ابو الحسن علی ندوی (1914–1999) بیسویں صدی کے بااثر ترین اسلامی علما میں سے تھے۔ 'اسلام اور مغرب'، 'مسلمانوں کے زوال سے دنیا کو کیا نقصان ہوا' آپ کی شہرہ آفاق تصانیف ہیں۔"
  },
  "maulana-abul-kalam-azad": {
    bioEn: "Maulana Abul Kalam Azad (1888–1958) was a senior political leader and Islamic scholar. He served as the first Education Minister of independent India.",
    bioUr: "مولانا ابوالکلام آزاد (1888–1958) ایک سینئر سیاسی رہنما اور عظیم عالم دین تھے۔ آپ آزاد ہندوستان کے پہلے وزیر تعلیم رہے۔"
  },
  "maulana-arsalan-bin-akhtar": {
    bioEn: "Maulana Arsalan Bin Akhtar is a contemporary Islamic author and scholar known for his works on Dars-e-Nizami curriculum.",
    bioUr: "مولانا ارسلان بن اختر ایک ہم عصر اسلامی مصنف اور عالم ہیں جو درس نظامی نصاب پر اپنی تصانیف کے لیے جانے جاتے ہیں۔"
  },
  "maulana-ashraf-ali-thanvi": {
    bioEn: "Maulana Ashraf Ali Thanvi (1863–1943), known as Hakeem ul Ummat, was one of the most prolific Islamic scholars. His magnum opus 'Bahishti Zewar' remains widely read.",
    bioUr: "مولانا اشرف علی تھانوی (1863–1943) جو حکیم الامت کے نام سے مشہور ہیں، سب سے زیادہ تصانیف لکھنے والے علما میں سے تھے۔ ان کی شہرہ آفاق کتاب 'بہشتی زیور' آج بھی وسیع پیمانے پر پڑھی جاتی ہے۔"
  },
  "maulana-ashiq-ilahi": {
    bioEn: "Maulana Ashiq Ilahi  (1925–2001) was a renowned scholar, Mufassir and author of 'Anwar ul Bayan', a famous Quran commentary.",
    bioUr: "مولانا عاشق الہی  (1925–2001) مشہور عالم دین، مفسر اور 'انوار البیان' کے مصنف تھے جو قرآن کی مشہور تفسیر ہے۔"
  },
  "maulana-ala-ud-din-qasmi": {
    bioEn: "Maulana Ala ud Din Qasmi is a distinguished Islamic scholar affiliated with the Deoband school of thought.",
    bioUr: "مولانا علاء الدین قاسمی مکتبہ دیوبند سے وابستہ ایک ممتاز عالم دین ہیں۔"
  },
  "maulana-ijaz-ahmad-azmi": {
    bioEn: "Maulana Ijaz Ahmad Azmi is an Islamic scholar and prolific author known for his scholarly contributions.",
    bioUr: "مولانا اعجاز احمد اعظمی ایک اسلامی عالم اور مصنف ہیں جو اپنی علمی خدمات کے لیے جانے جاتے ہیں۔"
  },
  "maulana-ilyas-gadhvi": {
    bioEn: "Maulana Ilyas Abdullah Gadhvi is a scholar and author who has contributed to Islamic educational literature.",
    bioUr: "مولانا الیاس بن عبداللہ گڈھوی ایک عالم اور مصنف ہیں جنہوں نے اسلامی تعلیمی ادب میں خدمات انجام دی ہیں۔"
  },
  "maulana-imdadullah-anwar": {
    bioEn: "Maulana Imdadullah Anwar is an Islamic scholar and writer known for his contributions to religious discourse.",
    bioUr: "مولانا امداداللہ انور ایک عالم دین اور مصنف ہیں جو دینی مباحث میں اپنی خدمات کے لیے جانے جاتے ہیں۔"
  },
  "maulana-khalid-saifullah": {
    bioEn: "Maulana Khalid Saifullah Rahmani is a prominent Fiqh scholar and General Secretary of All India Muslim Personal Law Board.",
    bioUr: "مولانا خالد سیف اللہ رحمانی ایک ممتاز فقیہ اور آل انڈیا مسلم پرسنل لا بورڈ کے جنرل سیکرٹری ہیں۔"
  },
  "maulana-manazir-gilani": {
    bioEn: "Maulana Manazir Ahsan Gilani (1892–1956) was a philosopher, historian and author of 'Tadween-e-Hadith' and 'Hindustan mein Musalmano ka Nizam-e-Taleem'.",
    bioUr: "مولانا مناظر احسن گیلانی (1892–1956) فلسفی، مؤرخ اور 'تدوین حدیث' اور 'ہندوستان میں مسلمانوں کا نظام تعلیم' کے مصنف تھے۔"
  },
  "maulana-manzoor-nomani": {
    bioEn: "Maulana Manzoor Nomani (1905–1997) was a prominent scholar and founder of the monthly journal 'Al-Furqan'. Author of 'Ma'arif ul Hadith'.",
    bioUr: "مولانا منظور نعمانی (1905–1997) ایک ممتاز عالم دین اور ماہنامہ 'الفرقان' کے بانی تھے۔ 'معارف الحدیث' آپ کی مشہور تصنیف ہے۔"
  },
  "maulana-yusuf-ludhianvi": {
    bioEn: "Maulana Muhammad Yusuf Ludhianvi (1932–2000) was a renowned Mufti and author of 'Aap ke Masail aur un ka Hal'.",
    bioUr: "مولانا محمد یوسف لدھیانوی (1932–2000) مشہور مفتی اور 'آپ کے مسائل اور ان کا حل' کے مصنف تھے۔"
  },
  "maulana-idrees-kandhalvi": {
    bioEn: "Maulana Muhammad Idrees Kandhalvi (1899–1974) was a famous Mufassir and author of 'Ma'arif ul Quran' and 'Seerat ul Mustafa'.",
    bioUr: "مولانا محمد ادریس کاندھلوی (1899–1974) مشہور مفسر اور 'معارف القرآن' اور 'سیرت المصطفیٰ' کے مصنف تھے۔"
  },
  "maulana-qari-tayyab": {
    bioEn: "Maulana Qari Muhammad Tayyab (1897–1983) served as the Chancellor of Darul Uloom Deoband for over 50 years.",
    bioUr: "مولانا قاری محمد طیب (1897–1983) دارالعلوم دیوبند کے مہتمم کے طور پر 50 سال سے زائد عرصے تک خدمات انجام دیتے رہے۔"
  },
  "maulana-qasim-nanotvi": {
    bioEn: "Maulana Muhammad Qasim Nanotvi (1833–1880) was the co-founder of Darul Uloom Deoband, one of the most influential Islamic seminaries in the world.",
    bioUr: "مولانا محمد قاسم نانوتوی (1833–1880) دارالعلوم دیوبند کے شریک بانی تھے جو دنیا کے سب سے بااثر اسلامی مدارس میں سے ایک ہے۔"
  },
  "maulana-roohullah-naqshbandi": {
    bioEn: "Maulana Roohullah Naqshbandi is a Sufi scholar and spiritual guide from the Naqshbandi order.",
    bioUr: "مولانا روح اللہ نقشبندی سلسلہ نقشبندیہ سے وابستہ صوفی عالم اور روحانی مرشد ہیں۔"
  },
  "maulana-saeed-palanpuri": {
    bioEn: "Maulana Saeed Ahmad Palanpuri (1940–2020) was the Shaykh ul Hadith of Darul Uloom Deoband. He was known for his vast knowledge of Hadith sciences.",
    bioUr: "مولانا سعید احمد پالن پوری (1940–2020) دارالعلوم دیوبند کے شیخ الحدیث تھے۔ آپ علم حدیث میں اپنے وسیع علم کے لیے مشہور تھے۔"
  },
  "maulana-sarfaraz-safdar": {
    bioEn: "Maulana Sarfaraz Khan Safdar (1914–2009) was a prominent Pakistani Muhaddith, debater and author of over 100 books.",
    bioUr: "مولانا سرفراز خان صفدر (1914–2009) پاکستان کے ممتاز محدث، مناظر اور 100 سے زائد کتب کے مصنف تھے۔"
  },
  "maulana-tariq-jameel": {
    bioEn: "Maulana Tariq Jameel (born 1953) is one of the most influential contemporary Islamic preachers. His lectures are watched by millions worldwide.",
    bioUr: "مولانا طارق جمیل (پیدائش 1953) ہم عصر دور کے سب سے بااثر اسلامی مبلغین میں سے ہیں۔ آپ کے بیانات دنیا بھر میں لاکھوں لوگ سنتے ہیں۔"
  },
  "maulana-zahid-ur-rashdi": {
    bioEn: "Maulana Zahid Ur Rashdi is a well-known Pakistani scholar, columnist and chairman of Pakistan Shariat Council.",
    bioUr: "مولانا زاہد الراشدی پاکستان کے معروف عالم دین، کالم نگار اور پاکستان شریعت کونسل کے چیئرمین ہیں۔"
  },
  "maulana-zakariyya-kandhelvi": {
    bioEn: "Maulana Muhammad Zakariyya Kandhelvi (1898–1982), known as Shaykh ul Hadith, authored 'Fazail-e-Amaal', one of the most widely read Islamic books in the world.",
    bioUr: "مولانا محمد زکریا کاندھلوی (1898–1982) جو شیخ الحدیث کے نام سے مشہور ہیں، 'فضائل اعمال' کے مصنف تھے جو دنیا میں سب سے زیادہ پڑھی جانے والی اسلامی کتابوں میں سے ایک ہے۔"
  },
  "maulana-zulfiqar-naqshbandi": {
    bioEn: "Maulana Zulfiqar Ahmad Naqshbandi is a renowned Sufi scholar and spiritual guide who conducts spiritual gatherings worldwide.",
    bioUr: "مولانا ذوالفقار احمد نقشبندی ایک مشہور صوفی عالم اور روحانی مرشد ہیں جو دنیا بھر میں اصلاحی مجالس منعقد کراتے ہیں۔"
  },
  "mufti-abu-lubaba": {
    bioEn: "Mufti Abu Lubaba Shah Mansoor is a Mufti and prolific Islamic author from Pakistan.",
    bioUr: "مفتی ابولبابہ شاہ منصور پاکستان کے مفتی اور کثیر التصانیف اسلامی مصنف ہیں۔"
  },
  "mufti-akhtar-imam-adil": {
    bioEn: "Mufti Akhtar Imam Adil Qasmi is a Mufti and scholar associated with the Deoband tradition.",
    bioUr: "مفتی اختر امام عادل قاسمی مکتبہ دیوبند سے وابستہ مفتی اور عالم ہیں۔"
  },
  "mufti-inam-ul-haq": {
    bioEn: "Mufti Inam ul Haq Qasmi is a respected Mufti known for his expertise in Islamic jurisprudence.",
    bioUr: "مفتی انعام الحق قاسمی ایک معزز مفتی ہیں جو فقہ اسلامی میں اپنی مہارت کے لیے جانے جاتے ہیں۔"
  },
  "mufti-muhammad-shafi": {
    bioEn: "Mufti Muhammad Shafi Usmani (1897–1976) was the Grand Mufti of Pakistan and author of 'Maariful Quran', one of the most comprehensive Quran commentaries in Urdu.",
    bioUr: "مفتی محمد شفیع عثمانی (1897–1976) پاکستان کے مفتی اعظم اور 'معارف القرآن' کے مصنف تھے جو اردو میں قرآن کی سب سے جامع تفسیروں میں سے ایک ہے۔"
  },
  "mufti-muhammad-taqi-usmani": {
    bioEn: "Mufti Muhammad Taqi Usmani (born 1943) is one of the leading Islamic scholars of the present era. He is an expert in Islamic finance, Hadith, and Fiqh.",
    bioUr: "مفتی محمد تقی عثمانی (پیدائش 1943) موجودہ دور کے سرکردہ اسلامی علما میں سے ہیں۔ آپ اسلامی مالیات، حدیث اور فقہ کے ماہر ہیں۔"
  },
  "mufti-jafar-milly": {
    bioEn: "Mufti Muhammad Jafar Milly Rahmani is an Islamic scholar and Mufti known for his religious scholarship.",
    bioUr: "مفتی محمد جعفر ملی رحمانی ایک اسلامی عالم اور مفتی ہیں جو اپنی دینی خدمات کے لیے جانے جاتے ہیں۔"
  },
  "mufti-rasheed-ludhianvi": {
    bioEn: "Mufti Rasheed Ahmad Ludhianvi (1922–2002) was a Grand Mufti and founder of Jamia tur Rasheed. His fatwa collections are widely referenced.",
    bioUr: "مفتی رشید احمد لدھیانوی (1922–2002) مفتی اعظم اور جامعۃ الرشید کے بانی تھے۔ ان کے فتاویٰ کے مجموعے وسیع پیمانے پر حوالے کے طور پر استعمال کیے جاتے ہیں۔"
  },
  "mufti-shoaibullah-miftahi": {
    bioEn: "Mufti Shoaibullah Khan Miftahi is a scholar and author who has authored several important Islamic books.",
    bioUr: "مفتی شعیب اللہ خان مفتاحی ایک عالم اور مصنف ہیں جنہوں نے کئی اہم اسلامی کتب تصنیف کی ہیں۔"
  },
  "muhammad-ishaq-multani": {
    bioEn: "Maulana Muhammad Ishaq Multani is a scholar known for his educational contributions from Multan, Pakistan.",
    bioUr: "مولانا محمد اسحاق ملتانی ملتان، پاکستان سے تعلق رکھنے والے عالم ہیں جو اپنی تعلیمی خدمات کے لیے جانے جاتے ہیں۔"
  }
};


const ScholarProfilePage = ({ scholarId, language, onBack, onBookClick }) => {
  // 🌟 VIP SCROLL MEMORY HOOK 🌟
  // 'true' pass kiya hai kyunke yeh scroll left-right wala hai. 
  // ID lagai hai taake har scholar ka apna scroll alag yaad rakha jaye.
  const worksScrollRef = useScrollRestoration(`scholar_books_${scholarId}`, true);

  const [imgError, setImgError] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const scholar = scholarsData.find(s => s.id === scholarId);
  const bio = scholarBios[scholarId] || {};

  React.useEffect(() => {
    async function fetchScholarBooks() {
      setLoading(true);
      try {
        const CACHE_KEY = 'cached_books_jsondata_v2';
        let allBooks = await localforage.getItem(CACHE_KEY) || [];
        
        if (!allBooks || allBooks.length === 0) {
          try {
            const res = await fetch('https://smart-e-madrasa.pakdigitalz.com/books_metadata.json?v=' + Date.now());
            if (res.ok) {
              allBooks = await res.json();
            }
          } catch (err) {
            console.warn("Cloudflare books fetch failed in ScholarProfilePage:", err);
          }
        }

        const filtered = (allBooks || []).filter(b => 
          b.sub_category && 
          b.sub_category.toLowerCase().includes(scholarId.toLowerCase()) &&
          b.sub_category !== 'pending' && 
          b.sub_category !== 'pending_approval'
        );

        // Deduplicate WITHIN the current scholar by fuzzy title (lowercase, no extra spaces)
        const dedupedMap = filtered.reduce((acc, cur) => {
          const fuzzyKey = (cur.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
          let volCount = 0;
          try {
            const arr = JSON.parse(cur.description || '[]');
            volCount = Array.isArray(arr) ? arr.length : 0;
          } catch (e) { }

          // Choice score: higher volume count > smaller ID
          const score = volCount * 1000000 - (cur.id || 0);

          if (!acc[fuzzyKey] || score > acc[fuzzyKey].score) {
            acc[fuzzyKey] = { ...cur, score };
          }
          return acc;
        }, {});

        // Convert map to list and remove score property
        setBooks(Object.values(dedupedMap).map(({ score, ...b }) => b));
      } catch (e) {
        console.error("Error fetching scholar books:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchScholarBooks();
  }, [scholarId]);

  if (!scholar) {
    return (
      <div className="scholar-page">
        <button className="scholar-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <p style={{ color: '#ccc', textAlign: 'center', padding: '40px' }}>
          {language === 'ur' ? 'عالم نہیں ملا' : 'Scholar not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="scholar-page">
      {/* === Header Bar === */}
      <div className="scholar-header-bar">
        <button className="scholar-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="scholar-header-title">
          {language === 'ur' ? 'تعارف' : 'Profile'}
        </span>
      </div>

      {/* === Profile Hero === */}
      <div className="scholar-hero">
        <div className="scholar-profile-img-wrap">
          {!imgError && scholar.image ? (
            <OfflineImage
              src={scholar.image}
              alt={scholar.nameEn}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="scholar-profile-fallback">
              <span style={{
                fontSize: '56px',
                fontWeight: '700',
                color: '#d4af37',
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 2px 10px rgba(212,175,55,0.4)',
              }}>
                {scholar.nameEn.split(' ').slice(-2).map(w => w[0]).join('')}
              </span>
            </div>
          )}
        </div>

        <div className="scholar-hero-info">
          <h1 className="scholar-name-main">
            {language === 'ur' ? scholar.nameUr : scholar.nameEn}
          </h1>
          <div className="scholar-role-badge">
            {language === 'ur' ? scholar.roleUr : scholar.roleEn}
          </div>
        </div>
      </div>

      {/* === Bio === */}
      <div className="scholar-bio-section">
        <h3 className="section-label">
          {language === 'ur' ? 'مختصر تعارف' : 'Introduction'}
        </h3>
        <p className={`scholar-bio ${language === 'ur' ? 'urdu-text' : ''}`}>
          {language === 'ur' ? (bio.bioUr || 'تعارف دستیاب نہیں') : (bio.bioEn || 'Biography not available.')}
        </p>
      </div>

      {/* === Books section === */}
      <div className="dars-section-glow" style={{ margin: '0 16px 24px' }}>
        <div className="scholar-books-section dars-section-inner" style={{ padding: '24px 20px', border: 'none', margin: 0 }}>
          <h3 className="section-label" style={{ margin: '0 0 12px 0' }}>
            {language === 'ur' ? 'تصانیف' : 'Books & Works'}
          </h3>

          {loading ? (
            <div className="loading-scholar-books" style={{ textAlign: 'center', padding: '20px' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : books.length > 0 ? (
            <div
              ref={worksScrollRef} // 🌟 VIP REF: Memory Hook yahan fit kar diya!
              className="scholar-books-grid"
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '16px',
                padding: '10px 4px 20px',
                scrollbarWidth: 'none'
              }}
            >
              {books.map(book => (
                <BookCard key={book.id} book={book} onBookClick={onBookClick} />
              ))}
            </div>
          ) : (
            <div className="no-books-msg">
              <BookOpen size={32} strokeWidth={1} opacity={0.4} />
              <p className="urdu-text">{language === 'ur' ? 'کتابیں جلد آرہی ہیں' : 'Coming Soon'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScholarProfilePage;