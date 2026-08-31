import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { strings } from './translations';
import './Tasbeeh.css';

const AZKAR_LIST = [
  {
    id: 'subhanallah',
    labelUr: 'سبحان اللہ',
    labelEn: 'SubhanAllah',
    arabic: 'سُبْحَانَ اللَّهِ',
    translationUr: 'اللہ پاک ہے (ہر عیب سے پاک ہے)',
    translationEn: 'Glory be to Allah',
    defaultTarget: 33
  },
  {
    id: 'alhamdulillah',
    labelUr: 'الحمد للہ',
    labelEn: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translationUr: 'تمام تعریفیں اللہ ہی کے لیے ہیں',
    translationEn: 'Praise be to Allah',
    defaultTarget: 33
  },
  {
    id: 'allahubakbar',
    labelUr: 'اللہ اکبر',
    labelEn: 'Allahu Akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    translationUr: 'اللہ سب سے بڑا ہے',
    translationEn: 'Allah is the Greatest',
    defaultTarget: 34
  },
  {
    id: 'astaghfirullah',
    labelUr: 'استغفر اللہ',
    labelEn: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    translationUr: 'میں اللہ سے بخشش مانگتا ہوں',
    translationEn: 'I seek forgiveness from Allah',
    defaultTarget: 100
  },
  {
    id: 'kalimah_taiyabah',
    labelUr: 'کلمہ طیبہ',
    labelEn: 'Kalimah Taiyabah',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ',
    translationUr: 'اللہ کے سوا کوئی معبود نہیں، محمد اللہ کے رسول ہیں',
    translationEn: 'There is no god but Allah, Muhammad is His Messenger',
    defaultTarget: 100
  },
  {
    id: 'durood',
    labelUr: 'درود شریف',
    labelEn: 'Durood Shareef',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    translationUr: 'اے اللہ! محمد ﷺ اور آلِ محمد ﷺ پر رحمت نازل فرما',
    translationEn: 'O Allah, send blessings upon Muhammad and his family',
    defaultTarget: 100
  },
  {
    id: 'third_kalimah',
    labelUr: 'تیسرا کلمہ',
    labelEn: 'Third Kalimah',
    arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللَّهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    translationUr: 'اللہ پاک ہے، اور سب تعریفیں اللہ ہی کے لیے ہیں، اور اللہ کے سوا کوئی معبود نہیں، اور اللہ سب سے بڑا ہے، اور گناہوں سے بچنے کی طاقت اور نیک کام کرنے کی قوت اللہ ہی کی طرف سے ہے جو عالی شان اور بڑا عظمت والا ہے۔',
    translationEn: 'Glory be to Allah, and all praise is due to Allah, and there is no god but Allah, and Allah is the Greatest, and there is no power or might except with Allah, the Most High, the Most Great.',
    defaultTarget: 100
  },
  {
    id: 'lahawla',
    labelUr: 'لا حول ولا قوة',
    labelEn: 'La Hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    translationUr: 'گناہوں سے بچنے کی طاقت اور نیک کام کرنے کی قوت اللہ ہی کی طرف سے ہے جو عالی شان اور بڑا عظمت والا ہے۔',
    translationEn: 'There is no power or might except with Allah, the Most High, the Most Great.',
    defaultTarget: 100
  },
  {
    id: 'subhanallahi_wa_bihamdihi',
    labelUr: 'سبحان اللہ وبحمدہ',
    labelEn: 'SubhanAllahi wa Bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    translationUr: 'پاک ہے اللہ اپنی تعریفوں کے ساتھ، اور پاک ہے اللہ جو بہت عظمت والا ہے۔',
    translationEn: 'Glory be to Allah and praise be to Him, Glory be to Allah the Supreme.',
    defaultTarget: 100
  },
  {
    id: 'kalimah_tauheed',
    labelUr: 'چوتھا کلمہ',
    labelEn: 'Fourth Kalimah',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِیکَ لَهُ لَهُ الْمُلْکُ وَلَهُ الْحَمْدُ وَهُوَ عَلَی کُلِّ شَیْءٍ قَدِیرٌ',
    translationUr: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں، اسی کی بادشاہی ہے، اور اسی کے لیے سب تعریفیں ہیں، اور وہ ہر چیز پر قادر ہے۔',
    translationEn: 'There is no god but Allah, alone, without partner. His is the sovereignty, and His is the praise, and He has power over all things.',
    defaultTarget: 100
  },
  {
    id: 'hasbunallah',
    labelUr: 'حسبنا اللہ',
    labelEn: 'Hasbunallahu',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    translationUr: 'ہمیں اللہ ہی کافی ہے اور وہ بہترین کارساز ہے۔',
    translationEn: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
    defaultTarget: 100
  },
  {
    id: 'ayat_ul_kursi',
    labelUr: 'آیۃ الکرسی',
    labelEn: 'Ayat-ul-Kursi',
    arabic: 'اللَّهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    translationUr: 'اللہ ہی معبودِ برحق ہے جس کے سوا کوئی معبود نہیں، وہ زندہ ہے اور سب کا نگہبان ہے، اسے نہ اونگھ آتی ہے نہ نیند، جو کچھ آسمانوں میں ہے اور جو کچھ زمین میں ہے سب اسی کا ہے۔',
    translationEn: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth.',
    defaultTarget: 7
  },
  {
    id: 'yunus_dua',
    labelUr: 'آیت کریمہ',
    labelEn: 'Ayat-e-Kareema',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    translationUr: 'تیرے سوا کوئی معبود نہیں، تو پاک ہے، بے شک میں ہی قصوروار ہوں۔',
    translationEn: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    defaultTarget: 100
  },
  {
    id: 'custom',
    labelUr: 'متفرقات / دیگر',
    labelEn: 'Custom / Other',
    arabic: 'ذِکْرِ خَاصّ',
    translationUr: 'اپنا منتخب کردہ ذکر یا دعا پڑھیں',
    translationEn: 'Recite your custom remembrance',
    defaultTarget: 100
  }
];

const Tasbeeh = ({ language }) => {
  const t = strings[language];
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [selectedZikrId, setSelectedZikrId] = useState('subhanallah');

  useEffect(() => {
    const savedCount = localStorage.getItem('smart_tasbeeh_count');
    const savedTarget = localStorage.getItem('smart_tasbeeh_target');
    const savedSound = localStorage.getItem('smart_tasbeeh_sound');
    const savedVibrate = localStorage.getItem('smart_tasbeeh_vibrate');
    const savedZikrId = localStorage.getItem('smart_tasbeeh_zikr_id');
    
    if (savedCount) setCount(parseInt(savedCount, 10));
    if (savedTarget) setTarget(parseInt(savedTarget, 10));
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedVibrate !== null) setVibrateEnabled(savedVibrate === 'true');
    if (savedZikrId) setSelectedZikrId(savedZikrId);
  }, []);

  const saveState = (newCount, newTarget) => {
    localStorage.setItem('smart_tasbeeh_count', newCount.toString());
    localStorage.setItem('smart_tasbeeh_target', newTarget.toString());
  };

  const handleZikrSelect = (zikrId) => {
    setSelectedZikrId(zikrId);
    localStorage.setItem('smart_tasbeeh_zikr_id', zikrId);
    
    const zikr = AZKAR_LIST.find(z => z.id === zikrId);
    if (zikr && zikr.id !== 'custom') {
      setTarget(zikr.defaultTarget);
      saveState(0, zikr.defaultTarget);
    } else {
      saveState(0, target);
    }
    setCount(0);
    if (vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('smart_tasbeeh_sound', newVal.toString());
    if (newVal) {
      setTimeout(() => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }
        } catch(e){}
      }, 50);
    }
  };

  const toggleVibrate = () => {
    const newVal = !vibrateEnabled;
    setVibrateEnabled(newVal);
    localStorage.setItem('smart_tasbeeh_vibrate', newVal.toString());
    if (newVal && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const playSound = (type = 'click') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'complete') {
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(1300, ctx.currentTime + 0.10);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.10);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc2.start(ctx.currentTime + 0.10);
        osc2.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIncrement = () => {
    let newCount = count + 1;
    let isComplete = newCount === target;
    
    if (newCount > target) {
      newCount = 1; // reset cycle
      isComplete = false;
    }
    
    if (isComplete) {
      if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate([150, 100, 150]);
      }
      playSound('complete');
    } else {
      if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate(40);
      }
      playSound('click');
    }
    
    setCount(newCount);
    saveState(newCount, target);
  };

  const handleReset = () => {
    if (window.confirm(language === 'ur' ? 'کیا آپ تسبیح کاؤنٹر صفر کرنا چاہتے ہیں؟' : 'Are you sure you want to reset the counter?')) {
      setCount(0);
      saveState(0, target);
      if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate(100);
      }
      if (soundEnabled) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          }
        } catch(e){}
      }
    }
  };

  const handleTargetChange = (e) => {
    const newTarget = parseInt(e.target.value, 10);
    setTarget(newTarget);
    saveState(count, newTarget);
  };

  const activeZikr = AZKAR_LIST.find(z => z.id === selectedZikrId) || AZKAR_LIST[0];

  const radius = 66;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (count / target) * circumference;

  return (
    <div className="tasbeeh-container">
      <div className="tasbeeh-header">
        <h2 className="tasbeeh-title urdu-text">📿 {t.tasbeeh || (language === 'ur' ? 'تسبیح' : 'Tasbeeh')}</h2>
      </div>

      <div className="tasbeeh-card">
        {/* Horizontal Azkar list */}
        <div className="tasbeeh-azkar-scroll">
          {AZKAR_LIST.map(zikr => (
            <button
              key={zikr.id}
              className={`tasbeeh-azkar-pill ${selectedZikrId === zikr.id ? 'active' : ''}`}
              onClick={() => handleZikrSelect(zikr.id)}
            >
              <span className="urdu-text" style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                {language === 'ur' ? zikr.labelUr : zikr.labelEn}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Dua Arabic & Translation Display */}
        <div className="tasbeeh-dua-display">
          <div className="tasbeeh-dua-arabic urdu-text">
            {activeZikr.arabic}
          </div>
          <div className="tasbeeh-dua-translation urdu-text">
            {language === 'ur' ? activeZikr.translationUr : activeZikr.translationEn}
          </div>
        </div>

        <div className="tasbeeh-control-info-row">
          <div className="tasbeeh-target-info urdu-text">
            <span>{t.target || (language === 'ur' ? 'ہدف' : 'Target')}: </span>
            <select className="tasbeeh-target-select" value={target} onChange={handleTargetChange}>
              <option value={33}>33</option>
              <option value={100}>100</option>
              <option value={1000}>1000</option>
            </select>
          </div>

          {/* Toggles for Sound and Vibration */}
          <div className="tasbeeh-settings-row">
            <button className={`tasbeeh-settings-btn ${soundEnabled ? 'active' : ''}`} onClick={toggleSound}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="urdu-text" style={{ fontSize: '12px' }}>{language === 'ur' ? 'صدا' : 'Sound'}</span>
            </button>
            <button className={`tasbeeh-settings-btn ${vibrateEnabled ? 'active' : ''}`} onClick={toggleVibrate}>
              {vibrateEnabled ? <Smartphone size={16} /> : <SmartphoneOff size={16} />}
              <span className="urdu-text" style={{ fontSize: '12px' }}>{language === 'ur' ? 'تھرتھراہٹ' : 'Vibe'}</span>
            </button>
          </div>
        </div>

        <div className="tasbeeh-count-display">
          {count}
        </div>

        <div className="tasbeeh-circle-container">
          <svg className="progress-ring" viewBox="0 0 150 150">
            {/* Background Track Circle */}
            <circle
              className="progress-ring-track"
              stroke="var(--gold-color)"
              strokeWidth="6"
              fill="transparent"
              r={radius}
              cx="75"
              cy="75"
              style={{ opacity: 0.15 }}
            />
            {/* Active Progress Circle */}
            <circle
              className="progress-ring-circle"
              stroke="var(--gold-color)"
              strokeWidth="6"
              fill="transparent"
              r={radius}
              cx="75"
              cy="75"
              style={{
                strokeDasharray: `${circumference} ${circumference}`,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          <button className="tasbeeh-main-btn" onClick={handleIncrement}>
            <div className="tasbeeh-main-btn-inner"></div>
          </button>
        </div>

        <button className="tasbeeh-reset-btn urdu-text" onClick={handleReset}>
          <RotateCcw size={18} /> {t.reset || (language === 'ur' ? 'صفر کریں' : 'Reset')}
        </button>
      </div>
    </div>
  );
};

export default Tasbeeh;
