import React, { useState } from 'react';
import QuranHome from './QuranHome';
import JuzzIndex from './JuzzIndex';
import SurahIndex from './SurahIndex';
import QuranReadingView from './QuranReadingView';
import GotoPage from './GotoPage';
import Bookmarks from './Bookmarks';
import HifzTracker from './HifzTracker';
import SmartSearch from './SmartSearch';
import EmotionDuas from './EmotionDuas';
import Duas from './Duas';
import { useSettings } from '../contexts/SettingsContext.jsx';

// --- NEW: onReadingStateChange prop added ---
const QuranSection = ({ onExit, onReadingStateChange }) => {
  const { palette } = useSettings();
  const [currentView, setCurrentView] = useState('home');
  const [readingContext, setReadingContext] = useState(null);
  const [smartSearchQuery, setSmartSearchQuery] = useState('');

  const handleNavigate = (view) => {
    setCurrentView(view);
    // Agar view 'reading', 'mushaf' ya 'page' hai, tou App.jsx ko true bhejo taake menu chup jaye
    if (onReadingStateChange) {
      onReadingStateChange(view === 'reading' || view === 'mushaf' || view === 'page');
    }
  };

  const handleOpenReading = (data) => {
    setReadingContext(data);
    setCurrentView('reading');
    // Reading mode on, App.jsx ko batao ke global menu chup jaye
    if (onReadingStateChange) {
      onReadingStateChange(true);
    }
  };

  return (
    <div
      key={currentView}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        overflowY: 'auto',
        animation: 'viewFadeIn 180ms ease',
        paddingBottom: '80px'
      }}
    >

      {currentView === 'home' && (
        <QuranHome
          onNavigate={handleNavigate}
          onExit={onExit}
          onOpenReading={handleOpenReading}
          onOpenSmartSearch={(initialQuery) => {
            setSmartSearchQuery(initialQuery || '');
            setCurrentView('search');
          }}
        />
      )}

      {currentView === 'juzz' && <JuzzIndex onBack={() => handleNavigate('home')} onOpenReading={handleOpenReading} />}

      {currentView === 'surah' && <SurahIndex onBack={() => handleNavigate('home')} onOpenReading={handleOpenReading} />}

      {currentView === 'page' && <GotoPage onBack={() => handleNavigate('home')} onOpenReading={handleOpenReading} />}

      {currentView === 'bookmarks' && <Bookmarks onBack={() => handleNavigate('home')} onOpenReading={handleOpenReading} />}

      {currentView === 'reading' && <QuranReadingView contextData={readingContext} onBack={() => handleNavigate('home')} onOpenReading={handleOpenReading} />}

      {currentView === 'mushaf' && (
        <QuranReadingView
          contextData={{ type: 'page', id: 1, defaultView: 'mushaf' }}
          onBack={() => handleNavigate('home')}
          onOpenReading={handleOpenReading}
        />
      )}

      {currentView === 'hifz' && <HifzTracker onBack={() => handleNavigate('home')} />}

      {currentView === 'search' && (
        <SmartSearch
          onBack={() => handleNavigate('home')}
          onOpenReading={handleOpenReading}
          initialQuery={smartSearchQuery}
        />
      )}

      {currentView === 'emotions' && <EmotionDuas onBack={() => handleNavigate('home')} />}

      {currentView === 'duas' && <Duas onBack={() => handleNavigate('home')} />}

    </div>
  );
};

export default QuranSection;