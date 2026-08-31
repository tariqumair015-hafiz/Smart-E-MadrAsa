import { useState } from 'react';
import './DailyDuas.css';

const duasData = [
  {
    category: 'صبح و شام',
    categoryEn: 'Morning & Evening',
    icon: '🌅',
    duas: [
      {
        title: 'صبح کی دعا',
        titleEn: 'Morning Dua',
        arabic: 'اَللّٰهُمَّ بِكَ اَصْبَحْنَا وَبِكَ اَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوْتُ وَاِلَيْكَ النُّشُوْرُ',
        urdu: 'اے اللہ! تیری مہربانی سے ہم نے صبح کی اور تیری مہربانی سے ہم نے شام کی، تیری مہربانی سے ہم زندہ ہیں اور تیری مہربانی سے ہم مریں گے اور تیری ہی طرف اُٹھ کر جانا ہے۔',
        reference: 'ترمذی: 3391'
      },
      {
        title: 'شام کی دعا',
        titleEn: 'Evening Dua',
        arabic: 'اَللّٰهُمَّ بِكَ اَمْسَيْنَا وَبِكَ اَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوْتُ وَاِلَيْكَ الْمَصِيْرُ',
        urdu: 'اے اللہ! تیرے نام سے ہم نے شام کی اور تیرے نام سے صبح کی، تیرے نام سے ہم جیتے ہیں اور تیرے نام سے مریں گے اور تیری طرف لوٹ کر جانا ہے۔',
        reference: 'ترمذی: 3391'
      },
      {
        title: 'آیت الکرسی',
        titleEn: 'Ayatul Kursi',
        arabic: 'اَللّٰهُ لَآ اِلٰهَ اِلَّا هُوَ ۚ اَلْحَيُّ الْقَيُّوْمُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَّلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمٰوٰتِ وَمَا فِي الْاَرْضِ ۗ مَنْ ذَا الَّذِيْ يَشْفَعُ عِنْدَهُ اِلَّا بِاِذْنِهِ ۗ يَعْلَمُ مَا بَيْنَ اَيْدِيْهِمْ وَمَا خَلْفَهُمْ ۚ وَلَا يُحِيْطُوْنَ بِشَيْءٍ مِّنْ عِلْمِهِ اِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمٰوٰتِ وَالْاَرْضَ ۚ وَلَا يَئُوْدُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيْمُ',
        urdu: 'اللہ، اس کے سوا کوئی معبود نہیں، وہ زندہ ہے ہمیشہ سے قائم رہنے والا۔ نہ اُسے اونگھ آتی ہے نہ نیند۔',
        reference: 'البقرہ: 255'
      },
      {
        title: 'تین قل',
        titleEn: 'Three Quls',
        arabic: 'قُلْ هُوَ اللّٰهُ اَحَدٌ ۝ اَللّٰهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُوْلَدْ ۝ وَلَمْ يَكُنْ لَّهُ كُفُوًا اَحَدٌ',
        urdu: 'کہو: وہ اللہ ایک ہے، اللہ بے نیاز ہے، نہ اس کی اولاد ہے نہ وہ کسی کی اولاد ہے، اور نہ کوئی اس کا ہمسر ہے۔',
        reference: 'سورۃ الاخلاص'
      }
    ]
  },
  {
    category: 'کھانے کی دعائیں',
    categoryEn: 'Food Duas',
    icon: '🍽️',
    duas: [
      {
        title: 'کھانے سے پہلے',
        titleEn: 'Before Eating',
        arabic: 'بِسْمِ اللّٰهِ وَعَلٰی بَرَکَةِ اللّٰهِ',
        urdu: 'اللہ کے نام سے اور اللہ کی برکت پر۔',
        reference: 'ابو داؤد'
      },
      {
        title: 'کھانے کے بعد',
        titleEn: 'After Eating',
        arabic: 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ اَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِيْنَ',
        urdu: 'تمام تعریفیں اللہ کے لیے ہیں جس نے ہمیں کھلایا اور پلایا اور ہمیں مسلمانوں میں سے بنایا۔',
        reference: 'ترمذی: 3457'
      },
      {
        title: 'پانی پینے کے بعد',
        titleEn: 'After Drinking Water',
        arabic: 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ سَقَانَا عَذْبًا فُرَاتًا بِرَحْمَتِهِ وَلَمْ يَجْعَلْهُ مِلْحًا اُجَاجًا بِذُنُوْبِنَا',
        urdu: 'تمام تعریفیں اللہ کے لیے ہیں جس نے اپنی رحمت سے ہمیں میٹھا پانی پلایا اور ہمارے گناہوں کی وجہ سے اسے کھارا نہیں بنایا۔',
        reference: 'تفسیر قرطبی'
      }
    ]
  },
  {
    category: 'نیند کی دعائیں',
    categoryEn: 'Sleep Duas',
    icon: '🌙',
    duas: [
      {
        title: 'سونے سے پہلے',
        titleEn: 'Before Sleeping',
        arabic: 'اَللّٰهُمَّ بِاسْمِكَ اَمُوْتُ وَاَحْيَا',
        urdu: 'اے اللہ! تیرے نام سے مرتا ہوں اور جیتا ہوں۔',
        reference: 'بخاری: 6314'
      },
      {
        title: 'جاگنے کے بعد',
        titleEn: 'After Waking Up',
        arabic: 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ اَحْيَانَا بَعْدَ مَا اَمَاتَنَا وَاِلَيْهِ النُّشُوْرُ',
        urdu: 'تمام تعریفیں اللہ کے لیے ہیں جس نے ہمیں مارنے کے بعد زندہ کیا اور اُسی کی طرف اُٹھ کر جانا ہے۔',
        reference: 'بخاری: 6312'
      }
    ]
  },
  {
    category: 'سفر کی دعائیں',
    categoryEn: 'Travel Duas',
    icon: '✈️',
    duas: [
      {
        title: 'سفر کی دعا',
        titleEn: 'Travel Dua',
        arabic: 'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَاِنَّآ اِلٰی رَبِّنَا لَمُنْقَلِبُوْنَ',
        urdu: 'پاک ہے وہ ذات جس نے اس سواری کو ہمارے لیے مسخر کیا اور ہم اسے قابو میں نہیں لا سکتے تھے اور ہم اپنے رب کی طرف لوٹ کر جانے والے ہیں۔',
        reference: 'مسلم: 1342'
      },
      {
        title: 'گھر سے نکلتے وقت',
        titleEn: 'Leaving Home',
        arabic: 'بِسْمِ اللّٰهِ تَوَکَّلْتُ عَلَی اللّٰهِ لَا حَوْلَ وَلَا قُوَّةَ اِلَّا بِاللّٰهِ',
        urdu: 'اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا، اللہ کے بغیر نہ کوئی طاقت ہے نہ کوئی قوت۔',
        reference: 'ترمذی: 3426'
      }
    ]
  },
  {
    category: 'مسجد کی دعائیں',
    categoryEn: 'Masjid Duas',
    icon: '🕌',
    duas: [
      {
        title: 'مسجد میں داخل ہوتے وقت',
        titleEn: 'Entering Masjid',
        arabic: 'اَللّٰهُمَّ افْتَحْ لِيْ اَبْوَابَ رَحْمَتِكَ',
        urdu: 'اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔',
        reference: 'مسلم: 713'
      },
      {
        title: 'مسجد سے نکلتے وقت',
        titleEn: 'Leaving Masjid',
        arabic: 'اَللّٰهُمَّ اِنِّيْ اَسْئَلُكَ مِنْ فَضْلِكَ',
        urdu: 'اے اللہ! میں تجھ سے تیرے فضل کا سوال کرتا ہوں۔',
        reference: 'مسلم: 713'
      }
    ]
  },
  {
    category: 'عام دعائیں',
    categoryEn: 'General Duas',
    icon: '🤲',
    duas: [
      {
        title: 'استغفار',
        titleEn: 'Istighfar',
        arabic: 'اَسْتَغْفِرُ اللّٰهَ الْعَظِيْمَ الَّذِيْ لَآ اِلٰهَ اِلَّا هُوَ الْحَيُّ الْقَيُّوْمُ وَاَتُوْبُ اِلَيْهِ',
        urdu: 'میں اللہ عظیم سے مغفرت چاہتا ہوں جس کے سوا کوئی معبود نہیں، وہ زندہ ہے قائم رہنے والا اور میں اس کی طرف رجوع کرتا ہوں۔',
        reference: 'ترمذی: 3577'
      },
      {
        title: 'درود ابراہیمی',
        titleEn: 'Durood Ibrahimi',
        arabic: 'اَللّٰهُمَّ صَلِّ عَلٰی مُحَمَّدٍ وَعَلٰی آلِ مُحَمَّدٍ کَمَا صَلَّيْتَ عَلٰٓی اِبْرَاهِيْمَ وَعَلٰی آلِ اِبْرَاهِيْمَ اِنَّكَ حَمِيْدٌ مَجِيْدٌ',
        urdu: 'اے اللہ! رحمت نازل فرما محمد ﷺ پر اور آل محمد پر جیسا کہ تو نے رحمت نازل فرمائی ابراہیم علیہ السلام اور آل ابراہیم پر۔ بے شک تو تعریف والا بزرگی والا ہے۔',
        reference: 'بخاری: 3370'
      },
      {
        title: 'مشکل میں پڑھنے والی دعا',
        titleEn: 'Dua in Distress',
        arabic: 'لَآ اِلٰهَ اِلَّآ اَنْتَ سُبْحَانَكَ اِنِّيْ كُنْتُ مِنَ الظَّالِمِيْنَ',
        urdu: 'تیرے سوا کوئی معبود نہیں، تو پاک ہے، بے شک میں ظالموں میں سے تھا۔',
        reference: 'الانبیاء: 87'
      }
    ]
  }
];

export default function DailyDuas({ language }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedDua, setExpandedDua] = useState(null);

  if (selectedCategory !== null) {
    const cat = duasData[selectedCategory];
    return (
      <div className="duas-container">
        <div className="duas-header">
          <button className="duas-back-btn" onClick={() => { setSelectedCategory(null); setExpandedDua(null); }}>←</button>
          <h2 className="duas-title urdu-text">{cat.icon} {language === 'ur' ? cat.category : cat.categoryEn}</h2>
        </div>
        <div className="duas-list">
          {cat.duas.map((dua, idx) => (
            <div
              key={idx}
              className={`dua-card ${expandedDua === idx ? 'expanded' : ''}`}
              onClick={() => setExpandedDua(expandedDua === idx ? null : idx)}
            >
              <div className="dua-card-header">
                <span className="dua-title urdu-text">{language === 'ur' ? dua.title : dua.titleEn}</span>
                <span className="dua-expand-icon">{expandedDua === idx ? '▲' : '▼'}</span>
              </div>
              {expandedDua === idx && (
                <div className="dua-card-body">
                  <p className="dua-arabic">{dua.arabic}</p>
                  <div className="dua-divider"></div>
                  <p className="dua-urdu urdu-text">{dua.urdu}</p>
                  <span className="dua-reference">📖 {dua.reference}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="duas-container">
      <div className="duas-header">
        <h2 className="duas-title urdu-text">🤲 {language === 'ur' ? 'مسنون دعائیں' : 'Daily Duas'}</h2>
      </div>
      <div className="duas-categories-grid">
        {duasData.map((cat, idx) => (
          <div
            key={idx}
            className="duas-category-card"
            onClick={() => setSelectedCategory(idx)}
          >
            <div className="duas-cat-icon">{cat.icon}</div>
            <div className="duas-cat-title urdu-text">{language === 'ur' ? cat.category : cat.categoryEn}</div>
            <div className="duas-cat-count">{cat.duas.length} {language === 'ur' ? 'دعائیں' : 'duas'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
