const DB_NAME = 'QuranDB';
const DB_VERSION = 2; // Incremented from 1 to 2 to force fresh database
const STORE_NAME = 'quran_data';
const DUA_STORE = 'duas_data';
const AUDIO_STORE = 'audio_cache';

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log(`[IndexedDB] Upgrading database from version ${event.oldVersion} to ${DB_VERSION}`);
        const db = event.target.result;
        
        // Delete old object stores if they exist (fresh start)
        if (db.objectStoreNames.contains(STORE_NAME)) {
          console.log(`[IndexedDB] Deleting old store: ${STORE_NAME}`);
          db.deleteObjectStore(STORE_NAME);
        }
        if (db.objectStoreNames.contains(DUA_STORE)) {
          console.log(`[IndexedDB] Deleting old store: ${DUA_STORE}`);
          db.deleteObjectStore(DUA_STORE);
        }
        if (db.objectStoreNames.contains(AUDIO_STORE)) {
          console.log(`[IndexedDB] Deleting old store: ${AUDIO_STORE}`);
          db.deleteObjectStore(AUDIO_STORE);
        }
        
        // Create fresh object stores
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          console.log(`[IndexedDB] Created store: ${STORE_NAME}`);
        }
        if (!db.objectStoreNames.contains(DUA_STORE)) {
          db.createObjectStore(DUA_STORE, { keyPath: 'id' });
          console.log(`[IndexedDB] Created store: ${DUA_STORE}`);
        }
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
          console.log(`[IndexedDB] Created store: ${AUDIO_STORE}`);
        }
      };
    });
  }

  async saveQuranData(surahId, data) {
    console.log(`[IndexedDB] Saving surah ${surahId}...`, data);
    if (!this.db) {
      console.log('[IndexedDB] Database not initialized, initializing...');
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const item = {
          id: surahId, // Use plain number as key
          ...data,
          timestamp: Date.now()
        };
        console.log(`[IndexedDB] Putting item:`, item);
        
        const request = store.put(item);

        request.onsuccess = () => {
          console.log(`[IndexedDB] Surah ${surahId} saved successfully`);
          resolve(request.result);
        };
        
        request.onerror = () => {
          console.error(`[IndexedDB] Error saving surah ${surahId}:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`[IndexedDB] Exception in saveQuranData:`, error);
        reject(error);
      }
    });
  }

  async getQuranData(surahId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      // Try plain number key first (new format)
      const request1 = store.get(surahId);
      
      request1.onsuccess = () => {
        if (request1.result) {
          resolve(request1.result);
        } else {
          // Try old format 'surah_X' as fallback
          const request2 = store.get(`surah_${surahId}`);
          request2.onsuccess = () => resolve(request2.result);
          request2.onerror = () => reject(request2.error);
        }
      };
      request1.onerror = () => reject(request1.error);
    });
  }

  async saveJuzzData(juzzId, data) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        id: `juzz_${juzzId}`,
        ...data,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getJuzzData(juzzId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`juzz_${juzzId}`);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePageData(pageId, data) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        id: `page_${pageId}`,
        ...data,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPageData(pageId) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(`page_${pageId}`);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAllSurahs(surahs) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      surahs.forEach(surah => {
        store.put({
          id: `surah_${surah.number}`,
          ...surah,
          timestamp: Date.now()
        });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllSurahs() {
    if (!this.db) {
      console.log('[IndexedDB] Database not initialized, initializing...');
      await this.initDB();
    }
    
    return new Promise((resolve, reject) => {
      try {
        console.log('[IndexedDB] Getting all surahs from store:', STORE_NAME);
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          console.log('[IndexedDB] Raw data count:', request.result?.length || 0);
          console.log('[IndexedDB] First item sample:', request.result?.[0]);
          
          // Filter for surah data (both old 'surah_X' and new plain number formats)
          const data = request.result.filter(item => {
            if (!item || !item.id) {
              console.log('[IndexedDB] Filtered out - no id:', item);
              return false;
            }
            const idStr = item.id.toString();
            const isSurah = idStr.startsWith('surah_') || (typeof item.id === 'number' && item.id >= 1 && item.id <= 114);
            console.log('[IndexedDB] Item id:', item.id, 'isSurah:', isSurah);
            return isSurah;
          });
          
          console.log('[IndexedDB] Filtered surah count:', data.length);
          
          const sorted = data.sort((a, b) => {
            // Extract number for sorting
            const aNum = typeof a.id === 'number' ? a.id : parseInt(a.id.toString().replace('surah_', ''));
            const bNum = typeof b.id === 'number' ? b.id : parseInt(b.id.toString().replace('surah_', ''));
            return aNum - bNum;
          });
          
          console.log('[IndexedDB] Returning', sorted.length, 'surahs');
          resolve(sorted);
        };
        
        request.onerror = () => {
          console.error('[IndexedDB] Error getting all surahs:', request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error('[IndexedDB] Exception in getAllSurahs:', error);
        reject(error);
      }
    });
  }

  async saveDua(dua) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DUA_STORE], 'readwrite');
      const store = transaction.objectStore(DUA_STORE);
      
      const request = store.put({
        ...dua,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDuas() {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([DUA_STORE], 'readonly');
      const store = transaction.objectStore(DUA_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAudio(id, audioBlob) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      
      const request = store.put({
        id,
        audioBlob,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAudio(id) {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result?.audioBlob);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldData(daysOld = 30) {
    if (!this.db) await this.initDB();
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const stores = [STORE_NAME, DUA_STORE, AUDIO_STORE];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            store.delete(cursor.primaryKey);
          }
          cursor.continue();
        }
      };
    }
  }
}

export const dbService = new IndexedDBService();
export default dbService;
