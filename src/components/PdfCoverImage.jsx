/**
 * PdfCoverImage.jsx
 *
 * Smart cover component:
 * - If book has cover_url → show it via OfflineImage (with Supabase→R2 rewrite)
 * - If cover_url is empty  → render the PDF's first page using pdf.js as the cover
 *   and cache it in IndexedDB so it never loads twice.
 *
 * CORS notes:
 * - R2 PDFs: served with Access-Control-Allow-Origin: * → loads fine
 * - Archive.org PDFs: uses corsproxy.io as fallback for pdf.js fetch
 */

import React, { useState, useEffect, useRef } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import localforage from 'localforage';
import OfflineImage from '../OfflineImage';

// Use the same pdf.js worker already configured for PDFViewer
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js`;
}

// Separate IndexedDB store for generated PDF covers
const pdfCoverStore = localforage.createInstance({
  name: 'SmartEMadarsa',
  storeName: 'pdf_first_page_covers',
});

// In-memory cache for already-rendered covers (avoid repeated IndexedDB reads per session)
const memPdfCache = {};

const BOYS_CATS = ['درجہ اولیٰ', 'درجہ ثانیہ', 'درجہ ثالثہ', 'درجہ رابعہ', 'درجہ خامسہ', 'درجہ سادسہ', 'درجہ سابعہ', 'دورہ حدیث'];
const GIRLS_CATS = ['درجہ اولیٰ (بنات)', 'درجہ ثانیہ (بنات)', 'درجہ ثالثہ (بنات)', 'درجہ رابعہ (بنات)', 'درجہ خامسہ (بنات)'];

function getCoverGradient(cat = '') {
  if (BOYS_CATS.some(c => cat.includes(c))) {
    return ['#064e3b', '#047857'];
  }
  if (GIRLS_CATS.some(c => cat.includes(c))) {
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
}

function getCandidateUrls(url) {
  if (!url) return [];
  let clean = url.replace('http://', 'https://');
  const urls = [clean];
  if (clean.includes('archive.org') && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    urls.push(clean.replace('https://archive.org', `${window.location.origin}/api/archive`));
  }
  urls.push(`https://corsproxy.io/?url=${encodeURIComponent(clean)}`);
  urls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(clean)}`);
  urls.push(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(clean)}`);
  return Array.from(new Set(urls));
}

/**
 * Render first page of a PDF URL to a JPEG data URI.
 * Returns null on failure.
 */
async function renderFirstPageAsDataUrl(pdfUrl) {
  const urls = getCandidateUrls(pdfUrl);
  for (const url of urls) {
    try {
      const loadingTask = getDocument({
        url,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/cmaps/',
        cMapPacked: true,
        withCredentials: false,
        disableAutoFetch: true,
        disableStream: false,
      });
      loadingTask.onPassword = () => { throw new Error('password protected'); };
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 0.6 }); // small for thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      pdf.destroy();
      return dataUrl;
    } catch (e) {
      // Try next URL variant
      continue;
    }
  }
  return null;
}

/**
 * PdfCoverImage — drop-in replacement for OfflineImage on BookCard.
 *
 * Props:
 *   book      – the book object (needs .cover_url, .pdf_url, .id, .volumes)
 *   alt       – img alt text
 *   style     – container style (width/height from parent)
 *   onError   – error callback
 */
export default function PdfCoverImage({ book, alt, style, onError }) {
  const [coverError, setCoverError] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(() => (book?.id ? memPdfCache[book.id] : null));
  const [loadingPdf, setLoadingPdf] = useState(false);

  const hasExplicitCover = book?.cover_url && typeof book.cover_url === 'string' && book.cover_url.trim() !== '' && !coverError;

  const pdfUrl = book?.pdf_url || (Array.isArray(book?.volumes) && book.volumes.length > 0 ? book.volumes[0].url : null);

  useEffect(() => {
    if (hasExplicitCover || generatedUrl || !pdfUrl || !book?.id) return;

    let isMounted = true;
    const fetchOrRenderPdfCover = async () => {
      try {
        setLoadingPdf(true);
        // 1. Check IndexedDB
        const cached = await pdfCoverStore.getItem(String(book.id));
        if (cached && typeof cached === 'string') {
          memPdfCache[book.id] = cached;
          if (isMounted) {
            setGeneratedUrl(cached);
            setLoadingPdf(false);
          }
          return;
        }

        // 2. Render first page of PDF as Data URL
        const dataUrl = await renderFirstPageAsDataUrl(pdfUrl);
        if (dataUrl && isMounted) {
          memPdfCache[book.id] = dataUrl;
          await pdfCoverStore.setItem(String(book.id), dataUrl).catch(() => {});
          setGeneratedUrl(dataUrl);
        }
      } catch (err) {
        console.warn(`PDF cover generation failed for book ${book.id}:`, err);
      } finally {
        if (isMounted) setLoadingPdf(false);
      }
    };

    fetchOrRenderPdfCover();
    return () => { isMounted = false; };
  }, [book?.id, pdfUrl, hasExplicitCover, generatedUrl]);

  // Case 1: Explicit cover_url exists and hasn't errored out
  if (hasExplicitCover) {
    return (
      <OfflineImage
        src={book.cover_url}
        alt={alt}
        style={style}
        onError={() => setCoverError(true)}
      />
    );
  }

  // Case 2: PDF first-page cover generated
  if (generatedUrl) {
    return (
      <img
        src={generatedUrl}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  // Case 3: Loading PDF cover
  if (loadingPdf) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <div style={{ fontSize: 24, opacity: 0.3, color: '#d4af37' }}>📚</div>
      </div>
    );
  }



  // Case 4: Custom Islamic Cover Template Card
  const [color1, color2] = getCoverGradient(book?.category || '');
  const titleText = alt || book?.title || '';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(160deg, ${color1} 0%, ${color2} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 6px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Outer & Inner Gold Borders */}
      <div style={{ position: 'absolute', inset: 3, border: '1px solid rgba(212,175,55,0.45)', borderRadius: 6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 6, border: '0.5px solid rgba(212,175,55,0.2)', borderRadius: 4, pointerEvents: 'none' }} />
      
      {/* Top Islamic Motif Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, zIndex: 1, marginTop: 2 }}>
        <span style={{ color: '#d4af37', fontSize: 10, opacity: 0.85 }}>☽</span>
        <span style={{ color: '#d4af37', fontSize: 7, opacity: 0.6 }}>✦</span>
        <span style={{ color: '#d4af37', fontSize: 10, opacity: 0.85 }}>☾</span>
      </div>

      {/* Middle Urdu Title */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 4px', zIndex: 1 }}>
        <p
          className="urdu-text"
          style={{
            color: '#d4af37',
            fontSize: titleText.length > 25 ? 8 : titleText.length > 15 ? 9 : 10,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            direction: 'rtl',
            fontWeight: 'bold',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)'
          }}
        >
          {titleText}
        </p>
      </div>

      {/* Bottom Gold Line */}
      <div style={{ width: '65%', height: 1, background: 'rgba(212,175,55,0.45)', marginBottom: 2, zIndex: 1 }} />
    </div>
  );
}
