import { dbService } from './indexedDB.js';

const API_BASE = 'https://api.alquran.cloud/v1';

class QuranDataService {
  constructor() {
    this.db = dbService;
  }

  // Check if user is online
  isOnline() {
    return navigator.onLine;
  }

  // Fetch Surah with offline support
  async fetchSurah(surahNumber, scriptType = 'quran-indo-pak', translation = 'ur.jalandhry') {
    const cacheKey = `surah_${surahNumber}`;
    
    try {
      // Try to get from IndexedDB first
      const cachedData = await this.db.getQuranData(surahNumber);
      
      if (cachedData && cachedData.ayahs) {
        console.log(`[Offline] Loaded Surah ${surahNumber} from IndexedDB`);
        return {
          success: true,
          data: cachedData,
          source: 'indexeddb',
          name: cachedData.name,
          ayahs: cachedData.ayahs
        };
      }

      // If online, fetch from API
      if (this.isOnline()) {
        const [arabicRes, transRes] = await Promise.all([
          fetch(`${API_BASE}/surah/${surahNumber}/${scriptType}`),
          fetch(`${API_BASE}/surah/${surahNumber}/${translation}`)
        ]);

        const arabicData = await arabicRes.json();
        const transData = await transRes.json();

        if (arabicData.code === 200 && transData.code === 200) {
          // Merge data
          const mergedAyahs = arabicData.data.ayahs.map((ayah, i) => ({
            ...ayah,
            arabicText: ayah.text,
            transText: transData.data.ayahs[i]?.text || ''
          }));

          const surahData = {
            number: surahNumber,
            name: arabicData.data.name,
            englishName: arabicData.data.englishName,
            ayahs: mergedAyahs,
            type: arabicData.data.revelationType
          };

          // Save to IndexedDB for offline use
          await this.db.saveQuranData(surahNumber, surahData);
          console.log(`[Online] Fetched and cached Surah ${surahNumber}`);

          return {
            success: true,
            data: surahData,
            source: 'api',
            name: surahData.name,
            ayahs: mergedAyahs
          };
        }
      }

      // No cached data and offline
      return {
        success: false,
        error: 'No offline data available. Please connect to internet.',
        source: 'none'
      };

    } catch (error) {
      console.error('Error fetching surah:', error);
      
      // Try to get from cache as fallback
      const cachedData = await this.db.getQuranData(surahNumber);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          source: 'indexeddb-fallback',
          name: cachedData.name,
          ayahs: cachedData.ayahs
        };
      }

      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  // Fetch Juzz with offline support
  async fetchJuzz(juzzNumber, scriptType = 'quran-indo-pak', translation = 'ur.jalandhry') {
    try {
      // Try to get from IndexedDB first
      const cachedData = await this.db.getJuzzData(juzzNumber);
      
      if (cachedData && cachedData.ayahs) {
        console.log(`[Offline] Loaded Juzz ${juzzNumber} from IndexedDB`);
        return {
          success: true,
          data: cachedData,
          source: 'indexeddb',
          ayahs: cachedData.ayahs
        };
      }

      // If online, fetch from API
      if (this.isOnline()) {
        const [arabicRes, transRes] = await Promise.all([
          fetch(`${API_BASE}/juz/${juzzNumber}/${scriptType}`),
          fetch(`${API_BASE}/juz/${juzzNumber}/${translation}`)
        ]);

        const arabicData = await arabicRes.json();
        const transData = await transRes.json();

        if (arabicData.code === 200 && transData.code === 200) {
          const mergedAyahs = arabicData.data.ayahs.map((ayah, i) => ({
            ...ayah,
            arabicText: ayah.text,
            transText: transData.data.ayahs[i]?.text || ''
          }));

          const juzzData = {
            number: juzzNumber,
            ayahs: mergedAyahs
          };

          // Save to IndexedDB
          await this.db.saveJuzzData(juzzNumber, juzzData);
          console.log(`[Online] Fetched and cached Juzz ${juzzNumber}`);

          return {
            success: true,
            data: juzzData,
            source: 'api',
            ayahs: mergedAyahs
          };
        }
      }

      // NEW: Try to construct juzz data from available surah data (offline fallback)
      console.log(`[Offline] Trying to construct Juzz ${juzzNumber} from surah data...`);
      const juzzAyahs = await this.constructJuzzFromSurahs(juzzNumber);
      
      if (juzzAyahs && juzzAyahs.length > 0) {
        console.log(`[Offline] Successfully constructed Juzz ${juzzNumber} from surah data`);
        const juzzData = {
          number: juzzNumber,
          ayahs: juzzAyahs
        };
        return {
          success: true,
          data: juzzData,
          source: 'constructed-from-surahs',
          ayahs: juzzAyahs
        };
      }

      return {
        success: false,
        error: 'No offline data available. Please connect to internet.',
        source: 'none'
      };

    } catch (error) {
      console.error('Error fetching juzz:', error);
      
      // Try fallback to cached juzz data
      const cachedData = await this.db.getJuzzData(juzzNumber);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          source: 'indexeddb-fallback',
          ayahs: cachedData.ayahs
        };
      }

      // NEW: Try to construct from surahs as final fallback
      const juzzAyahs = await this.constructJuzzFromSurahs(juzzNumber);
      if (juzzAyahs && juzzAyahs.length > 0) {
        return {
          success: true,
          data: { number: juzzNumber, ayahs: juzzAyahs },
          source: 'constructed-fallback',
          ayahs: juzzAyahs
        };
      }

      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  // NEW: Helper method to construct juzz data from available surah data
  async constructJuzzFromSurahs(juzzNumber) {
    try {
      // Correct Juzz to Surah mapping based on actual Quran structure (30 juzz only)
      const juzzToSurahMapping = {
        1: { start: 1, end: 1 },      // Al-Fatiha
        2: { start: 2, end: 2 },      // Al-Baqarah (1st part)
        3: { start: 2, end: 2 },      // Al-Baqarah (2nd part)
        4: { start: 3, end: 3 },      // Al-Imran
        5: { start: 4, end: 4 },      // An-Nisa
        6: { start: 5, end: 5 },      // Al-Ma'idah
        7: { start: 6, end: 6 },      // Al-An'am
        8: { start: 7, end: 7 },      // Al-A'raf
        9: { start: 8, end: 8 },      // Al-Anfal
        10: { start: 8, end: 8 },     // At-Tawbah (remaining of Al-Baqarah region)
        11: { start: 9, end: 9 },      // Yunus
        12: { start: 10, end: 10 },    // Hud
        13: { start: 11, end: 11 },    // Yusuf
        14: { start: 12, end: 12 },    // Ar-Ra'd
        15: { start: 13, end: 13 },    // Ibrahim
        16: { start: 14, end: 14 },    // An-Nahl
        17: { start: 15, end: 15 },    // Al-Hijr
        18: { start: 16, end: 16 },    // An-Nahl
        19: { start: 17, end: 17 },    // Al-Isra
        20: { start: 18, end: 18 },    // Al-Kahf
        21: { start: 19, end: 19 },    // Maryam
        22: { start: 20, end: 20 },    // Ta-Ha
        23: { start: 21, end: 21 },    // Al-Anbiya
        24: { start: 22, end: 22 },    // Al-Hajj
        25: { start: 23, end: 23 },    // Al-Mu'minun
        26: { start: 24, end: 24 },    // An-Nur
        27: { start: 25, end: 25 },    // Al-Furqan
        28: { start: 26, end: 26 },    // Ash-Shu'ara
        29: { start: 27, end: 27 },    // An-Naml
        30: { start: 28, end: 28 },    // Al-Qasas
      };

      const mapping = juzzToSurahMapping[juzzNumber];
      if (!mapping) {
        console.log(`[Juzz] No mapping found for juzz ${juzzNumber} - Quran only has 30 juzz`);
        return null;
      }

      console.log(`[Juzz] Juzz ${juzzNumber} -> Surah ${mapping.start}-${mapping.end}`);

      // Get all surahs
      const allSurahs = await this.db.getAllSurahs();
      
      if (!allSurahs || allSurahs.length === 0) {
        return null;
      }

      // Filter surahs for this juzz
      const juzzSurahs = allSurahs.filter(surah => {
        return surah.number >= mapping.start && surah.number <= mapping.end;
      });

      if (juzzSurahs.length === 0) {
        return null;
      }

      // Collect all ayahs from these surahs
      const juzzAyahs = [];
      juzzSurahs.forEach(surah => {
        if (surah.ayahs && Array.isArray(surah.ayahs)) {
          surah.ayahs.forEach(ayah => {
            juzzAyahs.push({
              ...ayah,
              juz: juzzNumber,
              surah: { 
                number: surah.number, 
                name: surah.name, 
                englishName: surah.englishName 
              }
            });
          });
        }
      });

      console.log(`[Juzz] Juzz ${juzzNumber} constructed with ${juzzAyahs.length} ayahs from ${juzzSurahs.length} surahs`);
      return juzzAyahs.length > 0 ? juzzAyahs : null;
    } catch (error) {
      console.error('Error constructing juzz from surahs:', error);
      return null;
    }
  }

  // Fetch Page with offline support
  async fetchPage(pageNumber, scriptType = 'quran-indo-pak', translation = 'ur.jalandhry') {
    try {
      // Try to get from IndexedDB first
      const cachedData = await this.db.getPageData(pageNumber);
      
      if (cachedData && cachedData.ayahs) {
        console.log(`[Offline] Loaded Page ${pageNumber} from IndexedDB`);
        return {
          success: true,
          data: cachedData,
          source: 'indexeddb',
          ayahs: cachedData.ayahs
        };
      }

      // If online, fetch from API
      if (this.isOnline()) {
        const [arabicRes, transRes] = await Promise.all([
          fetch(`${API_BASE}/page/${pageNumber}/${scriptType}`),
          fetch(`${API_BASE}/page/${pageNumber}/${translation}`)
        ]);

        const arabicData = await arabicRes.json();
        const transData = await transRes.json();

        if (arabicData.code === 200 && transData.code === 200) {
          const mergedAyahs = arabicData.data.ayahs.map((ayah, i) => ({
            ...ayah,
            arabicText: ayah.text,
            transText: transData.data.ayahs[i]?.text || ''
          }));

          const pageData = {
            number: pageNumber,
            ayahs: mergedAyahs
          };

          // Save to IndexedDB
          await this.db.savePageData(pageNumber, pageData);
          console.log(`[Online] Fetched and cached Page ${pageNumber}`);

          return {
            success: true,
            data: pageData,
            source: 'api',
            ayahs: mergedAyahs
          };
        }
      }

      // NEW: Try to construct page data from available surah data (offline fallback)
      console.log(`[Offline] Trying to construct Page ${pageNumber} from surah data...`);
      const pageAyahs = await this.constructPageFromSurahs(pageNumber);
      
      if (pageAyahs && pageAyahs.length > 0) {
        console.log(`[Offline] Successfully constructed Page ${pageNumber} from surah data`);
        const pageData = {
          number: pageNumber,
          ayahs: pageAyahs
        };
        return {
          success: true,
          data: pageData,
          source: 'constructed-from-surahs',
          ayahs: pageAyahs
        };
      }

      return {
        success: false,
        error: 'No offline data available. Please connect to internet.',
        source: 'none'
      };

    } catch (error) {
      console.error('Error fetching page:', error);
      
      // Try fallback to cached page data
      const cachedData = await this.db.getPageData(pageNumber);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          source: 'indexeddb-fallback',
          ayahs: cachedData.ayahs
        };
      }

      // NEW: Try to construct from surahs as final fallback
      const pageAyahs = await this.constructPageFromSurahs(pageNumber);
      if (pageAyahs && pageAyahs.length > 0) {
        return {
          success: true,
          data: { number: pageNumber, ayahs: pageAyahs },
          source: 'constructed-fallback',
          ayahs: pageAyahs
        };
      }

      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  // NEW: Helper method to construct page data from available surah data
  async constructPageFromSurahs(pageNumber) {
    try {
      // Pages 1-604 mapping to approximate ayah ranges
      // Quran has ~6236 ayahs spread across 604 pages = ~10-11 ayahs per page
      const allSurahs = await this.db.getAllSurahs();
      
      if (!allSurahs || allSurahs.length === 0) {
        return null;
      }

      // Calculate approximate ayah range for this page
      const estimatedAyahsPerPage = 10;
      const startAyahIndex = (pageNumber - 1) * estimatedAyahsPerPage;
      const endAyahIndex = pageNumber * estimatedAyahsPerPage;

      // Collect ayahs from all surahs
      let currentAyahIndex = 0;
      const pageAyahs = [];

      for (const surah of allSurahs) {
        if (!surah.ayahs || !Array.isArray(surah.ayahs)) continue;
        
        for (const ayah of surah.ayahs) {
          if (currentAyahIndex >= startAyahIndex && currentAyahIndex < endAyahIndex) {
            // Add page number and surah info to ayah
            pageAyahs.push({
              ...ayah,
              page: pageNumber,
              surah: { number: surah.number, name: surah.name, englishName: surah.englishName }
            });
          }
          currentAyahIndex++;
          
          // Stop if we've collected enough for this page
          if (currentAyahIndex >= endAyahIndex) break;
        }
        
        if (currentAyahIndex >= endAyahIndex) break;
      }

      return pageAyahs.length > 0 ? pageAyahs : null;
    } catch (error) {
      console.error('Error constructing page from surahs:', error);
      return null;
    }
  }

  // Get ayah audio URL with offline support
  async getAyahAudio(ayahNumber, qariId = 'ar.alafasy', surahId = null, ayahInSurah = null) {
    const audioKey = `audio_${qariId}_${ayahNumber}`;
    
    try {
      // Try to get cached audio blob
      const cachedAudio = await this.db.getAudio(audioKey);
      if (cachedAudio) {
        const url = URL.createObjectURL(cachedAudio);
        return { success: true, url, source: 'indexeddb' };
      }

      // If online, use everyayah.com - CORS-friendly audio
      if (this.isOnline() && surahId && ayahInSurah) {
        // Map qari IDs to everyayah.com folder names (verified from directory listing)
        const qariFolderMap = {
          'ar.alafasy': 'Alafasy_128kbps',
          'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
          'ar.mahermuaiqly': 'MaherAlMuaiqly128kbps',
          'ar.yasseraldossari': 'Yasser_Ad-Dussary_128kbps',
          'ar.husary': 'Husary_128kbps',
          'ar.shaatree': 'Abu_Bakr_Ash-Shaatree_128kbps',
          'ar.muhammadayyoub': 'Muhammad_Ayyoub_128kbps',
          'ar.minshawi': 'Minshawy_Mujawwad_192kbps',
          'ar.abdulsamad': 'Abdul_Basit_Mujawwad_128kbps',
          'ar.hudhaify': 'Hudhaify_128kbps',
          'ar.muhammadjibreel': 'Muhammad_Jibreel_128kbps',
          'ar.abdullahbasfar': 'Abdullah_Basfar_192kbps',
          'ar.saoodshuraym': 'Saood_ash-Shuraym_128kbps'
        };
        
        const folder = qariFolderMap[qariId] || 'Alafasy_128kbps';
        const surahPadded = String(surahId).padStart(3, '0');
        const ayahPadded = String(ayahInSurah).padStart(3, '0');
        
        const everyayahUrl = `https://everyayah.com/data/${folder}/${surahPadded}${ayahPadded}.mp3`;
        console.log(`[Audio] Using everyayah.com: ${everyayahUrl}`);
        
        return { 
          success: true, 
          url: everyayahUrl, 
          source: 'everyayah',
          ayah: { number: ayahNumber }
        };
      }

      return {
        success: false,
        error: 'Audio not available',
        source: 'none'
      };
    } catch (error) {
      console.error('Error getting ayah audio:', error);
      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  // Alias for compatibility with QuranReadingView.jsx
  async getAyahAudioUrl(qariId, surahId, ayahNumber, ayahInSurah) {
    // Pass all parameters including surah and ayah in surah for Yasser Al-Dosari
    const result = await this.getAyahAudio(ayahNumber, qariId, surahId, ayahInSurah);
    return result.success ? result.url : null;
  }

  // Download and cache audio file
  async cacheAudioFile(url, ayahNumber, qariId) {
    try {
      if (!this.isOnline()) {
        return { success: false, error: 'Must be online to download audio' };
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download audio');
      
      const blob = await response.blob();
      const audioKey = `audio_${qariId}_${ayahNumber}`;
      
      await this.db.saveAudio(audioKey, blob);
      console.log(`Cached audio for ayah ${ayahNumber}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error caching audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Pre-download all surahs for complete offline access
  async downloadAllSurahs(onProgress = null) {
    if (!this.isOnline()) {
      return { success: false, error: 'Must be online to download all surahs' };
    }

    try {
      const surahList = [];
      
      for (let i = 1; i <= 114; i++) {
        const result = await this.fetchSurah(i);
        if (result.success) {
          surahList.push(result.data);
          if (onProgress) {
            onProgress(i, 114);
          }
        }
      }

      // Mark as fully downloaded
      localStorage.setItem('full_quran_downloaded_v2', 'true');
      localStorage.setItem('quran_download_date', new Date().toISOString());
      
      return { success: true, count: surahList.length };
    } catch (error) {
      console.error('Error downloading all surahs:', error);
      return { success: false, error: error.message };
    }
  }

  // Pre-download specific juzz
  async downloadJuzz(juzzNumber) {
    if (!this.isOnline()) {
      return { success: false, error: 'Must be online to download juzz' };
    }

    try {
      const result = await this.fetchJuzz(juzzNumber);
      if (result.success) {
        return { success: true, ayahCount: result.data.ayahs.length };
      }
      return { success: false, error: 'Failed to download juzz' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get download status
  getDownloadStatus() {
    return {
      isFullyDownloaded: localStorage.getItem('full_quran_downloaded_v2') === 'true',
      downloadDate: localStorage.getItem('quran_download_date'),
      hasPartialData: localStorage.getItem('full_quran_downloaded_v1') === 'true'
    };
  }

  // Clear all Quran data
  async clearAllData() {
    try {
      await this.db.clearOldData(0); // Clear all data
      localStorage.removeItem('full_quran_downloaded_v2');
      localStorage.removeItem('quran_download_date');
      localStorage.removeItem('full_quran_downloaded_v1');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if specific surah is available offline
  async isSurahAvailableOffline(surahNumber) {
    const data = await this.db.getQuranData(surahNumber);
    return !!data;
  }

  // Get offline availability stats
  async getOfflineStats() {
    try {
      const allSurahs = await this.db.getAllSurahs();
      const totalAyahs = allSurahs.reduce((sum, surah) => sum + (surah.ayahs?.length || 0), 0);
      
      return {
        surahsAvailable: allSurahs.length,
        totalAyahs: totalAyahs,
        percentageComplete: Math.round((allSurahs.length / 114) * 100)
      };
    } catch (error) {
      return { surahsAvailable: 0, totalAyahs: 0, percentageComplete: 0 };
    }
  }
}

export const quranService = new QuranDataService();
export default quranService;
