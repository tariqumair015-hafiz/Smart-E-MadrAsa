import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { quranService } from '../utils/fetchQuran.js';

const SettingsContext = createContext(null);

const readLS = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLS = (key, value) => {
  try {
    if (value === undefined) return;
    localStorage.setItem(key, String(value));
  } catch { }
};

const parseNum = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function SettingsProvider({ children }) {
  // Theme: unify app + quran theme (keep backward compatibility)
  const initialTheme =
    readLS('smart_theme') ||
    readLS('quran_theme') ||
    'dark';

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Quran preferences
  const [quranFontSize, setQuranFontSize] = useState(21);
  const [quranScriptType, setQuranScriptType] = useState(readLS('quran_script_type') || 'quran-indo-pak');
  const [quranTranslation, setQuranTranslation] = useState(readLS('quran_translation') || 'ur.jalandhry');
  const [quranShowTranslation, setQuranShowTranslation] = useState(
    (readLS('quran_show_translation') ?? 'true') === 'true'
  );
  const [quranQari, setQuranQari] = useState(readLS('quran_qari') || readLS('quran_reciter') || 'ar.alafasy');

  // Offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineStats, setOfflineStats] = useState({ surahsAvailable: 0, totalAyahs: 0, percentageComplete: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 114 });

  // Persist on every change (immediate)
  useEffect(() => {
    writeLS('smart_theme', theme);
    writeLS('quran_theme', theme);
    document.body.classList.toggle('light-theme', theme === 'light');

    // Add a short transition class for premium feel
    try {
      document.body.classList.add('theme-transition');
      const t = setTimeout(() => document.body.classList.remove('theme-transition'), 350);
      return () => clearTimeout(t);
    } catch { }
  }, [theme]);

  useEffect(() => {
    writeLS('quran_font_size', quranFontSize);
  }, [quranFontSize]);

  useEffect(() => {
    writeLS('quran_script_type', quranScriptType);
  }, [quranScriptType]);

  useEffect(() => {
    writeLS('quran_translation', quranTranslation);
  }, [quranTranslation]);

  useEffect(() => {
    writeLS('quran_show_translation', quranShowTranslation ? 'true' : 'false');
  }, [quranShowTranslation]);

  useEffect(() => {
    writeLS('quran_qari', quranQari);
    writeLS('quran_reciter', quranQari); // backward compat for older code paths
  }, [quranQari]);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline stats on mount
    const loadOfflineStats = async () => {
      const stats = await quranService.getOfflineStats();
      setOfflineStats(stats);
    };
    loadOfflineStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Download all surahs for offline
  const downloadAllSurahs = async (onProgress) => {
    if (!isOnline) return { success: false, error: 'Internet connection required' };

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 114 });

    const progressCallback = (current, total) => {
      setDownloadProgress({ current, total });
      if (onProgress) onProgress(current, total);
    };

    try {
      const result = await quranService.downloadAllSurahs(progressCallback);
      const stats = await quranService.getOfflineStats();
      setOfflineStats(stats);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsDownloading(false);
    }
  };

  // Clear all offline data
  const clearOfflineData = async () => {
    const result = await quranService.clearAllData();
    if (result.success) {
      setOfflineStats({ surahsAvailable: 0, totalAyahs: 0, percentageComplete: 0 });
    }
    return result;
  };

  // Refresh offline stats
  const refreshOfflineStats = async () => {
    const stats = await quranService.getOfflineStats();
    setOfflineStats(stats);
    return stats;
  };

  const palette = useMemo(() => ({
    bg: 'var(--bg-color)',
    surface: 'var(--nav-color)',
    card: 'var(--card-color)',
    text: 'var(--text-primary)',
    muted: 'var(--text-secondary)',
    border: 'var(--divider-color)',
    gold: 'var(--gold-color)',
    green: 'var(--green-color)'
  }), []);

  const value = useMemo(() => ({
    theme,
    setTheme,
    palette,

    quranFontSize,
    setQuranFontSize,

    quranScriptType,
    setQuranScriptType,

    quranTranslation,
    setQuranTranslation,

    quranShowTranslation,
    setQuranShowTranslation,

    quranQari,
    setQuranQari,

    // Offline features
    isOnline,
    offlineStats,
    isDownloading,
    downloadProgress,
    downloadAllSurahs,
    clearOfflineData,
    refreshOfflineStats,
    quranService
  }), [theme, palette, quranFontSize, quranScriptType, quranTranslation, quranShowTranslation, quranQari, isOnline, offlineStats, isDownloading, downloadProgress]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

