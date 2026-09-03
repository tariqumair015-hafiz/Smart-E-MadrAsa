import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bookmark, ArrowLeft, Download, BookOpen, CheckCircle, CircleX as XCircle, Trash2, Library, Share2, Pause, Play, X } from 'lucide-react';
import * as localforageModule from 'localforage';
const localforage = localforageModule.default || localforageModule;
import PDFViewer from './PDFViewer';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useDownload } from './DownloadContext';

// ✅ FIX #3: pdfStore component ke bahar — ek baar banta hai
const pdfStore = localforage.createInstance({
  name: 'SmartEMadarsa',
  storeName: 'offline_books'
});

const backBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer'
};

const Stat = ({ icon, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
      {icon} <span>{label}</span>
    </div>
    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>{value}</span>
  </div>
);

const BookReader = ({ book, onBack, language, initialPage = 1 }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewMode, setViewMode] = useState(initialPage > 1 ? 'read' : 'choose');
  const [isOfflineAvailable, setIsOfflineAvailable] = useState({});
  const [offlinePdfUrls, setOfflinePdfUrls] = useState({});
  const [activeVolIndex, setActiveVolIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // ✅ FIX #2: Blob URLs track karne ke liye — cleanup ke liye
  const blobUrlsRef = useRef({});

  const { startDownload, activeDownloads, pauseDownload, resumeDownload, cancelDownload } = useDownload();

  // Volumes parse karna — ek jagah
  const getVolumes = useCallback(() => {
    let parsedVolumes = book.volumes;
    if (!parsedVolumes && book.description) {
      try {
        const parsed = JSON.parse(book.description);
        if (Array.isArray(parsed)) parsedVolumes = parsed;
      } catch (e) { }
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
    return parsedVolumes && parsedVolumes.length > 0
      ? parsedVolumes
      : [{ url: book.pdf_url, title: language === 'ur' ? 'کتاب ڈاؤنلوڈ کریں' : 'Download Book' }];
  }, [book, language]);

  const volumes = getVolumes();
  const isUr = language === 'ur';

  const splitTitle = (fullTitle) => {
    if (!fullTitle) return { en: '', ur: '' };
    const urduMatch = fullTitle.match(/[\u0600-\u06FF]/);
    if (!urduMatch) return { en: fullTitle, ur: '' };
    const urduIndex = urduMatch.index;
    const enPart = fullTitle.substring(0, urduIndex).replace(/by\s+/gi, '').replace(/از\s+/gi, '').trim();
    const urPart = fullTitle.substring(urduIndex).trim();
    return { en: enPart, ur: urPart };
  };

  const { en: enTitle, ur: urTitle } = splitTitle(book.title);
  const displayTitle = isUr ? (urTitle || enTitle) : (enTitle || urTitle);

  const getDisplayAuthor = () => {
    let a = book.author;
    if (!a || a === 'نامعلوم' || a === 'Unknown') {
      const parts = book.title.split(/By|by|از/);
      if (parts.length > 1) a = parts[1].split(/[\n\r]/)[0].trim();
      else return isUr ? 'حضرت مولانا' : 'Respected Scholar';
    }
    if (/best\s*urdu\s*books(\.net)?/i.test(a)) {
      return 'Smart E Madarsa';
    }
    return a;
  };

  const checkOfflineAvailability = useCallback(async () => {
    try {
      const availability = {};
      const urls = {};

      for (let i = 0; i < volumes.length; i++) {
        const id = `${book.id}_v${i}`;
        let found = false;
        let finalUrl = null;

        if (Capacitor.isNativePlatform()) {
          try {
            const filePath = `books/${id}.pdf`;
            const stat = await Filesystem.stat({ path: filePath, directory: Directory.Data });
            if (stat) {
              const uriResult = await Filesystem.getUri({ path: filePath, directory: Directory.Data });
              found = true;
              finalUrl = Capacitor.convertFileSrc(uriResult.uri);
            }
          } catch (e) { }
        }

        if (!found) {
          const blob = await pdfStore.getItem(`pdf_${id}`);
          if (blob) {
            found = true;
            // ✅ FIX #2: Purani blob URL revoke karo pehle
            if (blobUrlsRef.current[i]) {
              URL.revokeObjectURL(blobUrlsRef.current[i]);
            }
            finalUrl = URL.createObjectURL(blob);
            blobUrlsRef.current[i] = finalUrl;
          }
        }

        availability[i] = found;
        urls[i] = finalUrl;
      }

      setIsOfflineAvailable(availability);
      setOfflinePdfUrls(urls);
    } catch (err) {
      console.error("Error checking offline:", err);
    }
  }, [book.id, volumes]);

  useEffect(() => {
    if (book?.id) {
      const bookmarks = JSON.parse(localStorage.getItem('smart_bookmarks') || '[]');
      if (bookmarks.some(b => b.id === book.id)) setIsBookmarked(true);
      checkOfflineAvailability();
    }

    // ✅ FIX #2: Component unmount pe saari blob URLs revoke karo
    return () => {
      Object.values(blobUrlsRef.current).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [book?.id]);

  // ✅ FIX #2: Interval sirf tab — aur sirf ek baar check karo jab download complete ho
  useEffect(() => {
    if (viewMode !== 'choose') return;

    // Dekho koi active download hai?
    const hasActiveDownload = Object.values(activeDownloads).some(
      job => job?.status === 'downloading'
    );

    if (!hasActiveDownload) return;

    // Sirf tab interval chalao jab koi download ho raha ho
    const interval = setInterval(checkOfflineAvailability, 2000);
    return () => clearInterval(interval);
  }, [viewMode, activeDownloads, checkOfflineAvailability]);

  const toggleBookmark = () => {
    let bookmarks = JSON.parse(localStorage.getItem('smart_bookmarks') || '[]');
    if (isBookmarked) {
      bookmarks = bookmarks.filter(b => b.id !== book.id);
      setIsBookmarked(false);
    } else {
      bookmarks.push({
        id: book.id, title: book.title, author: book.author,
        cover_url: book.cover_url, category: book.category
      });
      setIsBookmarked(true);
    }
    localStorage.setItem('smart_bookmarks', JSON.stringify(bookmarks));
  };

  const handleShare = async () => {
    const shareText = isUr
      ? `السلام علیکم! میں "سمارٹ ای مدرسہ" ایپ پر یہ کتاب پڑھ رہا ہوں: "${book.title}"\n\nآپ بھی ڈاؤنلوڈ کریں:`
      : `Assalam-o-Alaikum! I am reading "${book.title}" on Smart e-Madarsa App.\n\nDownload here:`;
    const shareUrl = `${window.location.origin}/share.html?id=${book.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: displayTitle, text: shareText, url: shareUrl });
      } catch (e) {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`);
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`);
    }
  };

  const handleDeleteOffline = async (volIndex) => {
    try {
      const volId = `${book.id}_v${volIndex}`;
      if (Capacitor.isNativePlatform()) {
        try { await Filesystem.deleteFile({ path: `books/${volId}.pdf`, directory: Directory.Data }); } catch (e) { }
      }
      await pdfStore.removeItem(`pdf_${volId}`);

      // ✅ Blob URL bhi revoke karo
      if (blobUrlsRef.current[volIndex]) {
        URL.revokeObjectURL(blobUrlsRef.current[volIndex]);
        delete blobUrlsRef.current[volIndex];
      }

      setIsOfflineAvailable(prev => ({ ...prev, [volIndex]: false }));
      setOfflinePdfUrls(prev => { const next = { ...prev }; delete next[volIndex]; return next; });

      const keys = await pdfStore.keys();
      const stillHasVols = keys.some(k => k.startsWith(`pdf_${book.id}_`));
      if (!stillHasVols) {
        const metaStore = localforage.createInstance({ name: 'SmartEMadarsa', storeName: 'books_metadata' });
        await metaStore.removeItem(`meta_${book.id}`);
      }
    } catch (err) {
      console.error("Error deleting offline file", err);
    }
  };

  // ✅ FIX #4: URL theek se banao
  const getViewerUrl = (index) => {
    if (isOfflineAvailable[index] && offlinePdfUrls[index]) {
      return offlinePdfUrls[index];
    }

    let url = volumes[index]?.url || book.pdf_url;
    if (!url) return null;

    if (url.includes('archive.org')) {
      if (!url.includes('/download/')) {
        url = url.replace('/details/', '/download/').replace(/\/$/, '') + '.pdf';
      }
      if (!Capacitor.isNativePlatform()) {
        url = url.replace('https://archive.org', '/api/archive').replace('http://archive.org', '/api/archive');
      }
    }

    return url;
  };

  const handleRead = (index) => {
    const url = getViewerUrl(index);
    if (!url) {
      alert(isUr ? 'کتاب کی لنک دستیاب نہیں ہے' : 'Book URL is not available');
      return;
    }
    setActiveVolIndex(index);
    setViewMode('read');
  };

  return (
    <div style={{
      height: "100vh", background: "#080d16", display: "flex", flexDirection: "column",
      position: "absolute", top: 0, left: 0, width: "100%", zIndex: 1000
    }}>
      {viewMode !== 'read' && (
        <div style={{
          background: "#0b1220", padding: "12px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0
        }}>
          <button onClick={onBack} style={backBtnStyle}>
            <ArrowLeft size={16} />
            <span className="urdu-text" style={{ fontSize: '13px' }}>{isUr ? 'واپس' : 'Back'}</span>
          </button>
          <span className="urdu-text" style={{ color: "#d4af37", fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40%", textAlign: "center", fontSize: 14 }}>
            {displayTitle}
          </span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleShare} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
              <Share2 size={20} />
            </button>
            <button onClick={toggleBookmark} style={{ background: "transparent", border: "none", cursor: "pointer", color: isBookmarked ? "#d4af37" : "rgba(255,255,255,0.25)" }}>
              <Bookmark size={20} fill={isBookmarked ? "#d4af37" : "none"} />
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', background: '#080d16' }}>
        {viewMode === 'choose' ? (
          <div style={{ paddingBottom: 40 }}>
            <div style={{
              height: 220, width: '100%', position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: imgError || !book.cover_url ? 'linear-gradient(135deg, #1a3a2a, #0d2018)' : 'transparent'
            }}>
              {!imgError && book.cover_url && (
                <div style={{
                  position: 'absolute', inset: 0, backgroundImage: `url(${book.cover_url})`,
                  backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.3)', transform: 'scale(1.2)'
                }} />
              )}
              {!imgError && book.cover_url ? (
                <img src={book.cover_url} alt={book.title} onError={() => setImgError(true)}
                  style={{ height: 180, width: 125, borderRadius: 12, zIndex: 2, boxShadow: '0 15px 35px rgba(0,0,0,0.6)', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div style={{ height: 180, width: 125, borderRadius: 12, zIndex: 2, background: 'linear-gradient(135deg, #1a4d2e, #0d2818)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <BookOpen size={48} color="rgba(212,175,55,0.5)" />
                </div>
              )}
            </div>

            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <h2 className="urdu-text" style={{ color: 'var(--gold-color)', fontSize: 28, margin: '0 0 8px 0', fontWeight: 800, lineHeight: 1.3 }}>{displayTitle}</h2>
                <p className="urdu-text" style={{ color: '#fff', fontSize: 21, margin: 0, opacity: 0.9 }}>{getDisplayAuthor()}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '16px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Stat icon={<BookOpen size={16} />} label={isUr ? 'زمرہ' : 'Category'} value={book.category || 'Dars'} />
                <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <Stat icon={<Library size={16} />} label={isUr ? 'سائز' : 'Size'} value={book.size || '15 MB'} />
                <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <Stat icon={<CheckCircle size={16} />} label={isUr ? 'ذریعہ' : 'Source'} value={book.source || 'Archive'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 className="urdu-text" style={{ color: '#fff', fontSize: 18, margin: '8px 0 4px', borderRight: '3px solid var(--gold-color)', paddingRight: 10 }}>
                  {isUr ? 'ڈاؤنلوڈ اور مطالعہ' : 'Download & Read'}
                </h3>

                {volumes.map((vol, idx) => {
                  const volId = `${book.id}_v${idx}`;
                  const isDone = isOfflineAvailable[idx];
                  const activeJob = activeDownloads[volId];
                  const isDownloading = activeJob?.status === 'downloading';
                  const isPaused = activeJob?.status === 'paused';
                  const downloadProgress = activeJob?.progress || 0;

                  return (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '16px',
                      border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="urdu-text" style={{ color: '#fff', fontWeight: 700 }}>{vol.title || (isUr ? `جلد ${idx + 1}` : `Volume ${idx + 1}`)}</span>
                        {isDone && <span className="urdu-text" style={{ color: '#4ade80', fontSize: 11, background: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: 20 }}>آف لائن دستیاب</span>}
                        {isDownloading && <span className="urdu-text" style={{ color: 'var(--gold-color)', fontSize: 11, background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: 20 }}>ڈاؤنلوڈ ہو رہا ہے: {downloadProgress}%</span>}
                        {isPaused && <span className="urdu-text" style={{ color: '#60a5fa', fontSize: 11, background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 20 }}>روکا گیا: {downloadProgress}%</span>}
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        {!isDone && !isDownloading && !isPaused && (
                          <button
                            onClick={() => startDownload(book, idx)}
                            style={{
                              flex: 1, background: 'rgba(22, 163, 74, 0.1)',
                              color: '#4ade80', border: '1px solid currentColor',
                              borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                            }}>
                            <Download size={18} />
                            <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'ڈاؤنلوڈ کریں' : 'Download'}</span>
                          </button>
                        )}

                        {isDownloading && (
                          <>
                            <button
                              onClick={() => pauseDownload(volId)}
                              style={{
                                flex: 1, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid #3b82f6',
                                borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                              }}>
                              <Pause size={18} />
                              <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'روکیں (Pause)' : 'Pause'}</span>
                            </button>
                            <button
                              onClick={() => cancelDownload(volId)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444',
                                borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                              }}>
                              <X size={18} />
                              <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'منسوخ' : 'Cancel'}</span>
                            </button>
                          </>
                        )}

                        {isPaused && (
                          <>
                            <button
                              onClick={() => resumeDownload(volId)}
                              style={{
                                flex: 1, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid #22c55e',
                                borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                              }}>
                              <Play size={18} />
                              <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'شروع (Resume)' : 'Resume'}</span>
                            </button>
                            <button
                              onClick={() => cancelDownload(volId)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444',
                                borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                              }}>
                              <X size={18} />
                              <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'منسوخ' : 'Cancel'}</span>
                            </button>
                          </>
                        )}

                        {!isDone && !isDownloading && !isPaused && (
                          <button
                            onClick={() => handleRead(idx)}
                            style={{
                              flex: 1,
                              background: 'rgba(212, 175, 55, 0.1)',
                              color: 'var(--gold-color)',
                              border: '1px solid var(--gold-color)',
                              borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                            }}>
                            <BookOpen size={18} />
                            <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'آن لائن پڑھیں' : 'Read Online'}</span>
                          </button>
                        )}

                        {isDone && (
                          <button
                            onClick={() => handleRead(idx)}
                            style={{
                              flex: 1,
                              background: 'var(--gold-color)',
                              color: '#000',
                              border: 'none',
                              borderRadius: 12, padding: '14px', fontWeight: 'bold', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
                            }}>
                            <BookOpen size={18} />
                            <span className="urdu-text" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{isUr ? 'آف لائن پڑھیں' : 'Read Offline'}</span>
                          </button>
                        )}

                        {isDone && (
                          <button
                            onClick={() => handleDeleteOffline(idx)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid currentColor',
                              borderRadius: 12, padding: '12px', cursor: 'pointer'
                            }}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <PDFViewer
            pdfUrl={getViewerUrl(activeVolIndex)}
            shareUrl={`${window.location.origin}/share.html?id=${book.id}`}
            bookId={`${book.id}_v${activeVolIndex}`}
            textUrl={book.text_url}
            title={`${book.title} - ${volumes[activeVolIndex]?.title || ''}`}
            language={language}
            isOffline={!!isOfflineAvailable[activeVolIndex]}
            onBack={() => setViewMode('choose')}
            initialPage={initialPage}
          />
        )}
      </div>
    </div>
  );
};

export default BookReader;