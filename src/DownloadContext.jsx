import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as localforageModule from 'localforage';
const localforage = localforageModule.default || localforageModule;
import { Download, CheckCircle, CircleX as XCircle, Pause, Play, X } from 'lucide-react';
import { BackgroundTask } from '@capawesome/capacitor-background-task';

// 🌟 VIP: NOTIFICATION PLUGIN IMPORT 🌟
import { LocalNotifications } from '@capacitor/local-notifications';

const DownloadContext = createContext();
export const useDownload = () => useContext(DownloadContext);

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

export const DownloadProvider = ({ children, language = 'ur' }) => {
  const [activeDownloads, setActiveDownloads] = useState({});
  const [visibleDownloads, setVisibleDownloads] = useState({}); // Tracking UI visibility
  const abortControllers = useRef({});
  const downloadBuffers = useRef({});
  const isUr = language === 'ur';

  const pdfStore = localforage.createInstance({ name: 'SmartEMadarsa', storeName: 'offline_books' });
  const metaStore = localforage.createInstance({ name: 'SmartEMadarsa', storeName: 'books_metadata' });

  // 🌟 PERMISSION CHECK 🌟
  useEffect(() => {
    const requestNotifPermission = async () => {
      if (Capacitor.isNativePlatform()) {
        const check = await LocalNotifications.checkPermissions();
        if (check.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      }
    };
    requestNotifPermission();
  }, []);

  const sendNotification = async (id, title, body) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: id,
              schedule: { at: new Date(Date.now() + 100) },
            }
          ]
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
    }
  };

  const startDownload = async (book, volIndex) => {
    const downloadId = `${book.id}_v${volIndex}`;
    
    if (activeDownloads[downloadId]?.status === 'downloading') return;
    if (activeDownloads[downloadId]?.status === 'paused') {
      return resumeDownload(downloadId);
    }

    let parsedVolumes = book.volumes;
    if (!parsedVolumes && book.description) {
      try {
        const parsed = JSON.parse(book.description);
        if (Array.isArray(parsed)) parsedVolumes = parsed;
      } catch (e) {}
    }
    if (Array.isArray(parsedVolumes)) {
      let linkCount = 0;
      parsedVolumes = parsedVolumes.map(item => {
        if (typeof item === 'string') {
          let title = 'Link';
          const lowerUrl = item.toLowerCase();
          if (lowerUrl.includes('/stream/') || lowerUrl.includes('/details/') || lowerUrl.includes('mode/1up')) {
            title = 'Read Online';
          } else {
            linkCount++;
            title = `Link ${linkCount}`;
          }
          return { title, url: item };
        }
        return item;
      });
    }
    const volumes = parsedVolumes && parsedVolumes.length > 0 ? parsedVolumes : [{ url: book.pdf_url, title: book.title }];

    let targetUrl = volumes[volIndex]?.url;

    if (!targetUrl || targetUrl === '#' || targetUrl === 'pending') {
      alert(isUr ? 'لنک دستیاب نہیں' : 'Link not available');
      return;
    }

    let fetchUrl = targetUrl;

    if (fetchUrl.includes('archive.org')) {
      fetchUrl = fetchUrl.replace('http://', 'https://');
    }

    if (fetchUrl.includes('archive.org/download/') && !fetchUrl.toLowerCase().split('?')[0].endsWith('.pdf')) {
      fetchUrl = fetchUrl + '.pdf';
    }

    const isDirectPdf = fetchUrl.toLowerCase().split('?')[0].endsWith('.pdf');
    const isLandingPage = fetchUrl.includes('mediafire.com') || fetchUrl.includes('drive.google.com') || fetchUrl.includes('dropbox.com');

    if (!isDirectPdf || isLandingPage) {
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: targetUrl });
      } else {
        window.open(targetUrl, '_blank');
      }
      return;
    }

    if (!Capacitor.isNativePlatform() && fetchUrl.includes('archive.org')) {
      fetchUrl = fetchUrl.replace('https://archive.org', '/api/archive');
    }

    setActiveDownloads(prev => ({
      ...prev,
      [downloadId]: { 
        progress: 0, 
        status: 'downloading', 
        title: book.title, 
        volTitle: volumes[volIndex].title,
        author: book.author,
        cover_url: book.cover_url,
        book,
        volIndex
      }
    }));
    
    setVisibleDownloads(prev => ({ ...prev, [downloadId]: true }));

    const controller = new AbortController();
    abortControllers.current[downloadId] = controller;

    const buffer = {
      chunks: [],
      loaded: 0,
      total: 0,
      book,
      volIndex,
      volumes,
      fetchUrl,
      targetUrl,
      notifId: Math.floor(Math.random() * 100000)
    };
    downloadBuffers.current[downloadId] = buffer;

    sendNotification(buffer.notifId, isUr ? 'ڈاؤنلوڈ شروع ہو گیا' : 'Download Started', book.title);

    let taskId;
    if (Capacitor.isNativePlatform()) {
      taskId = await BackgroundTask.beforeExit(async () => {
        BackgroundTask.finish({ taskId });
      });
    }

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf,application/octet-stream,*/*' },
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Network error');

      const contentType = response.headers.get('Content-Type');
      if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        if (Capacitor.isNativePlatform()) {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: targetUrl });
        } else {
          window.open(targetUrl, '_blank');
        }
        
        setActiveDownloads(prev => ({
          ...prev,
          [downloadId]: { ...prev[downloadId], status: 'diverted' }
        }));
        
        setTimeout(() => {
          setActiveDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
          setVisibleDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
        }, 3000);
        
        return;
      }

      const contentLength = response.headers.get('Content-Length');
      buffer.total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer.chunks.push(value);
        buffer.loaded += value.length;
        
        const currentProgress = buffer.total > 0 ? Math.round((buffer.loaded / buffer.total) * 100) : Math.min(99, Math.round(buffer.loaded / 100000));
        
        setActiveDownloads(prev => {
          if (!prev[downloadId] || prev[downloadId].status === 'paused') return prev;
          return {
            ...prev,
            [downloadId]: { ...prev[downloadId], progress: currentProgress, status: 'downloading' }
          };
        });
      }

      const blob = new Blob(buffer.chunks, { type: 'application/pdf' });

      if (Capacitor.isNativePlatform()) {
        const filePath = `books/${downloadId}.pdf`;
        try { await Filesystem.mkdir({ path: 'books', directory: Directory.Data, recursive: true }); } catch (e) {}
        const base64Data = await blobToBase64(blob);
        await Filesystem.writeFile({ path: filePath, data: base64Data, directory: Directory.Data });
      } else {
        await pdfStore.setItem(`pdf_${downloadId}`, blob);
      }

      await metaStore.setItem(`meta_${book.id}`, {
        id: book.id, title: book.title, author: book.author,
        cover_url: book.cover_url, category: book.category, volumes: volumes
      });

      delete downloadBuffers.current[downloadId];

      setActiveDownloads(prev => ({
        ...prev,
        [downloadId]: { ...prev[downloadId], progress: 100, status: 'done' }
      }));

      sendNotification(buffer.notifId + 1, isUr ? 'ڈاؤنلوڈ مکمل' : 'Download Complete', book.title);

      setTimeout(() => {
        setActiveDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
        setVisibleDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
      }, 4000);

    } catch (err) {
      if (err.name === 'AbortError' || controller.signal?.aborted) {
        return;
      }

      try {
        if (Capacitor.isNativePlatform()) {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: targetUrl });
        } else {
          window.open(targetUrl, '_blank');
        }
        
        setActiveDownloads(prev => ({
          ...prev,
          [downloadId]: { ...prev[downloadId], status: 'diverted' }
        }));
        
        setTimeout(() => {
          setActiveDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
          setVisibleDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
        }, 3000);
        
        return;
      } catch (e) {}

      setActiveDownloads(prev => ({
        ...prev,
        [downloadId]: { ...prev[downloadId], status: 'error' }
      }));
      
      sendNotification(buffer.notifId + 2, isUr ? 'ڈاؤنلوڈ ناکام' : 'Download Failed', book.title);

      setTimeout(() => {
        setActiveDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
        setVisibleDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
      }, 5000);
    } finally {
      if (Capacitor.isNativePlatform() && taskId !== undefined) {
        BackgroundTask.finish({ taskId });
      }
    }
  };

  const pauseDownload = (downloadId) => {
    if (abortControllers.current[downloadId]) {
      abortControllers.current[downloadId].abort('paused');
      delete abortControllers.current[downloadId];
    }
    setActiveDownloads(prev => {
      if (!prev[downloadId]) return prev;
      return {
        ...prev,
        [downloadId]: { ...prev[downloadId], status: 'paused' }
      };
    });
    setVisibleDownloads(prev => ({ ...prev, [downloadId]: true }));
  };

  const resumeDownload = async (downloadId) => {
    const buffer = downloadBuffers.current[downloadId];
    const data = activeDownloads[downloadId];
    if (!buffer || !data) return;

    setActiveDownloads(prev => ({
      ...prev,
      [downloadId]: { ...prev[downloadId], status: 'downloading' }
    }));
    setVisibleDownloads(prev => ({ ...prev, [downloadId]: true }));

    const controller = new AbortController();
    abortControllers.current[downloadId] = controller;

    let taskId;
    if (Capacitor.isNativePlatform()) {
      taskId = await BackgroundTask.beforeExit(async () => {
        BackgroundTask.finish({ taskId });
      });
    }

    try {
      const headers = { 'Accept': 'application/pdf,application/octet-stream,*/*' };
      if (buffer.loaded > 0) {
        headers['Range'] = `bytes=${buffer.loaded}-`;
      }

      const response = await fetch(buffer.fetchUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      if (!response.ok && response.status !== 206) throw new Error('Network error on resume');

      if (response.status === 200 && buffer.loaded > 0) {
        // Server doesn't support HTTP Range header, restart stream from byte 0
        buffer.chunks = [];
        buffer.loaded = 0;
      }

      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        buffer.total = buffer.loaded + parseInt(contentLength, 10);
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer.chunks.push(value);
        buffer.loaded += value.length;

        const currentProgress = buffer.total > 0 ? Math.round((buffer.loaded / buffer.total) * 100) : Math.min(99, Math.round(buffer.loaded / 100000));

        setActiveDownloads(prev => {
          if (!prev[downloadId] || prev[downloadId].status === 'paused') return prev;
          return {
            ...prev,
            [downloadId]: { ...prev[downloadId], progress: currentProgress, status: 'downloading' }
          };
        });
      }

      const blob = new Blob(buffer.chunks, { type: 'application/pdf' });

      if (Capacitor.isNativePlatform()) {
        const filePath = `books/${downloadId}.pdf`;
        try { await Filesystem.mkdir({ path: 'books', directory: Directory.Data, recursive: true }); } catch (e) {}
        const base64Data = await blobToBase64(blob);
        await Filesystem.writeFile({ path: filePath, data: base64Data, directory: Directory.Data });
      } else {
        await pdfStore.setItem(`pdf_${downloadId}`, blob);
      }

      await metaStore.setItem(`meta_${buffer.book.id}`, {
        id: buffer.book.id, title: buffer.book.title, author: buffer.book.author,
        cover_url: buffer.book.cover_url, category: buffer.book.category, volumes: buffer.volumes
      });

      delete downloadBuffers.current[downloadId];

      setActiveDownloads(prev => ({
        ...prev,
        [downloadId]: { ...prev[downloadId], progress: 100, status: 'done' }
      }));

      sendNotification(buffer.notifId + 1, isUr ? 'ڈاؤنلوڈ مکمل' : 'Download Complete', buffer.book.title);

      setTimeout(() => {
        setActiveDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
        setVisibleDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
      }, 4000);

    } catch (err) {
      if (err.name === 'AbortError' || controller.signal?.aborted) {
        return;
      }

      setActiveDownloads(prev => ({
        ...prev,
        [downloadId]: { ...prev[downloadId], status: 'error' }
      }));

      setTimeout(() => {
        setActiveDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
        setVisibleDownloads(prev => { const next = { ...prev }; delete next[downloadId]; return next; });
      }, 5000);
    } finally {
      if (Capacitor.isNativePlatform() && taskId !== undefined) {
        BackgroundTask.finish({ taskId });
      }
    }
  };

  const cancelDownload = (downloadId) => {
    if (abortControllers.current[downloadId]) {
      abortControllers.current[downloadId].abort('cancelled');
      delete abortControllers.current[downloadId];
    }
    delete downloadBuffers.current[downloadId];
    setActiveDownloads(prev => {
      const next = { ...prev };
      delete next[downloadId];
      return next;
    });
    setVisibleDownloads(prev => {
      const next = { ...prev };
      delete next[downloadId];
      return next;
    });
  };

  return (
    <DownloadContext.Provider value={{ activeDownloads, startDownload, pauseDownload, resumeDownload, cancelDownload }}>
      {children}
      
      {/* Floating Download Bar */}
      <div style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 99999, width: '90%', maxWidth: '400px', pointerEvents: 'none'
      }}>
        {Object.entries(activeDownloads).filter(([id]) => visibleDownloads[id]).map(([id, data]) => (
          <div key={id} style={{
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--gold-color, #d4af37)',
            borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: '8px', backdropFilter: 'blur(10px)', pointerEvents: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="urdu-text" style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                {data.title}
              </span>
              {(data.status === 'downloading' || data.status === 'paused') && (
                <span style={{ color: data.status === 'paused' ? '#3b82f6' : 'var(--gold-color, #d4af37)', fontSize: '12px', fontWeight: 'bold' }}>
                  {data.status === 'paused' ? (isUr ? 'روکا گیا' : 'Paused') : `${data.progress}%`}
                </span>
              )}
              {data.status === 'done' && <CheckCircle size={16} color="#4ade80" />}
              {data.status === 'error' && <XCircle size={16} color="#ef4444" />}
            </div>
            
            {(data.status === 'downloading' || data.status === 'paused') && (
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${data.progress}%`, 
                  transition: 'width 0.3s ease',
                  background: data.status === 'paused' ? '#3b82f6' : 'repeating-linear-gradient(45deg, #d4af37, #d4af37 10px, #b8962e 10px, #b8962e 20px)',
                  backgroundSize: '28px 100%',
                  animation: data.status === 'paused' ? 'none' : 'moveStripes 1s linear infinite'
                }} />
              </div>
            )}

            {/* Download action buttons (Pause / Resume / Cancel) */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              {data.status === 'downloading' && (
                <button
                  onClick={() => pauseDownload(id)}
                  style={{
                    flex: 1, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid #3b82f6',
                    borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <Pause size={14} /> {isUr ? 'روکیں (Pause)' : 'Pause'}
                </button>
              )}
              {data.status === 'paused' && (
                <button
                  onClick={() => resumeDownload(id)}
                  style={{
                    flex: 1, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #22c55e',
                    borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <Play size={14} /> {isUr ? 'شروع کریں (Resume)' : 'Resume'}
                </button>
              )}
              {(data.status === 'downloading' || data.status === 'paused') && (
                <button
                  onClick={() => cancelDownload(id)}
                  style={{
                    flex: 1, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444',
                    borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <X size={14} /> {isUr ? 'منسوخ (Cancel)' : 'Cancel'}
                </button>
              )}
            </div>

            <style>{`
              @keyframes moveStripes {
                from { background-position: 0 0; }
                to { background-position: 28px 0; }
              }
            `}</style>
            {data.status === 'error' && <span className="urdu-text" style={{ color: '#ef4444', fontSize: '11px' }}>{isUr ? 'ڈاؤنلوڈ ناکام ہو گیا' : 'Download failed'}</span>}
            {data.status === 'diverted' && <span className="urdu-text" style={{ color: 'var(--gold-color)', fontSize: '11px' }}>{isUr ? 'لنک براہِ راست نہیں ہے، براؤزر میں کھولا جا رہا ہے...' : 'Direct link not found, opening in browser...'}</span>}
            {data.status === 'done' && <span className="urdu-text" style={{ color: '#4ade80', fontSize: '11px' }}>{isUr ? 'ڈاؤنلوڈ مکمل' : 'Download complete'}</span>}
          </div>
        ))}
      </div>
    </DownloadContext.Provider>
  );
};