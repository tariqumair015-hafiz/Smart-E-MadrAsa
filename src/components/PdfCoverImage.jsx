/**
 * PdfCoverImage.jsx
 *
 * Smart cover component:
 * - If book has cover_url → show it via OfflineImage (with Supabase→R2 rewrite)
 * - If cover_url is empty  → render the PDF's first page using pdf.js as the cover
 *   and cache it in IndexedDB so it never loads twice.
 * - If no cover/PDF → render Deluxe Islamic Mihrab Book Cover Template with distinct category colors!
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

// In-memory cache for already-rendered covers
const memPdfCache = {};

/**
 * Category-tailored 3D Leather & Gold Foil Gradient Themes
 */
export function getCategoryTheme(cat = '') {
  const c = (cat || '').trim();

  if (c.includes('بنات') || c.includes('Girls') || c.includes('بناتی')) {
    return { bg1: '#3b0616', bg2: '#700927', accent: '#fecdd3', label: 'شعبہ بنات' };
  }
  if (c.includes('اولیٰ') || c.includes('1st') || c.includes('اولى')) {
    return { bg1: '#042f22', bg2: '#065f46', accent: '#a7f3d0', label: 'درجہ اولیٰ' };
  }
  if (c.includes('ثانیہ') || c.includes('2nd') || c.includes('ثانيه')) {
    return { bg1: '#0c2340', bg2: '#1e3a8a', accent: '#bfdbfe', label: 'درجہ ثانیہ' };
  }
  if (c.includes('ثالثہ') || c.includes('3rd') || c.includes('ثالثه')) {
    return { bg1: '#450a18', bg2: '#991b1b', accent: '#fca5a5', label: 'درجہ ثالثہ' };
  }
  if (c.includes('رابعہ') || c.includes('4th') || c.includes('رابعه')) {
    return { bg1: '#2e0a4e', bg2: '#6b21a8', accent: '#e9d5ff', label: 'درجہ رابعہ' };
  }
  if (c.includes('خامسہ') || c.includes('5th') || c.includes('خامسه')) {
    return { bg1: '#3a1705', bg2: '#92400e', accent: '#fde68a', label: 'درجہ خامسہ' };
  }
  if (c.includes('سادسہ') || c.includes('6th') || c.includes('سادسه')) {
    return { bg1: '#062d3e', bg2: '#0e7490', accent: '#a5f3fc', label: 'درجہ سادسہ' };
  }
  if (c.includes('سابعہ') || c.includes('7th') || c.includes('سابعه')) {
    return { bg1: '#181245', bg2: '#3730a3', accent: '#c7d2fe', label: 'درجہ سابعہ' };
  }
  if (c.includes('حدیث') || c.includes('دورہ') || c.includes('Hadith')) {
    return { bg1: '#261700', bg2: '#854d0e', accent: '#fef08a', label: 'دورہ حدیث' };
  }
  if (c.includes('شرح') || c.includes('شروحات') || c.includes('مفاتیح')) {
    return { bg1: '#24140c', bg2: '#5c3a21', accent: '#fed7aa', label: 'اردو شروحات' };
  }
  if (c.includes('اخلاق') || c.includes('تصوف') || c.includes('سلوک')) {
    return { bg1: '#032612', bg2: '#166534', accent: '#bbf7d0', label: 'اخلاقیات و تصوف' };
  }
  if (c.includes('فقہ') || c.includes('فتاوی') || c.includes('Fiqh')) {
    return { bg1: '#230a4e', bg2: '#5b21b6', accent: '#ddd6fe', label: 'فقہ و فتاویٰ' };
  }
  if (c.includes('تفسیر') || c.includes('قرآن') || c.includes('Tafseer')) {
    return { bg1: '#0e2b13', bg2: '#2d6a36', accent: '#c6f6d5', label: 'تفسیر و علوم قرآن' };
  }

  const palettes = [
    { bg1: '#0f172a', bg2: '#1e3a8a', accent: '#93c5fd', label: cat || 'کتب اسلامی' },
    { bg1: '#310d20', bg2: '#831843', accent: '#fbcfe8', label: cat || 'کتب اسلامی' },
    { bg1: '#361c02', bg2: '#a16207', accent: '#fef08a', label: cat || 'کتب اسلامی' },
    { bg1: '#022c22', bg2: '#115e59', accent: '#99f6e4', label: cat || 'کتب اسلامی' },
    { bg1: '#1e1b4b', bg2: '#4338ca', accent: '#c7d2fe', label: cat || 'کتب اسلامی' },
    { bg1: '#431407', bg2: '#9a3412', accent: '#ffedd5', label: cat || 'کتب اسلامی' },
  ];
  let hash = 0;
  for (let i = 0; i < c.length; i++) hash = c.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
}

/**
 * Deluxe Islamic Mihrab Book Cover Template Component
 */
export function IslamicBookCoverTemplate({ book, alt, style }) {
  const cat = book?.category || '';
  const title = alt || book?.title || '';
  const theme = getCategoryTheme(cat);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at 50% 20%, ${theme.bg2} 0%, ${theme.bg1} 90%)`,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '5px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* 3D Book Spine Crease Shadow on Left Edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '7px',
          background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(255,255,255,0.12) 60%, transparent 100%)',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      />

      {/* Gold Foil Mihrab Arch Frame (محراب) */}
      <div
        style={{
          position: 'absolute',
          inset: 3,
          border: '1.5px solid #d4af37',
          borderTopLeftRadius: '22px',
          borderTopRightRadius: '22px',
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 6,
          border: '0.5px solid rgba(212,175,55,0.4)',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          borderBottomLeftRadius: '2px',
          borderBottomRightRadius: '2px',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Top Bismillah Calligraphy Header */}
      <div style={{ zIndex: 3, marginTop: 4, textAlign: 'center' }}>
        <span style={{ color: '#d4af37', fontSize: 10, letterSpacing: 1, opacity: 0.95, textShadow: '0 1px 2px #000' }}>
          ﷽
        </span>
      </div>

      {/* Center Calligraphic Title Box */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 5px',
          zIndex: 3,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ color: '#d4af37', fontSize: 8, opacity: 0.7, marginBottom: 1 }}>❖ ✦ ❖</div>
        <p
          className="urdu-text"
          style={{
            color: '#fef3c7',
            fontSize: title.length > 25 ? 8 : title.length > 15 ? 9 : 10.5,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            direction: 'rtl',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(212,175,55,0.3)',
          }}
        >
          {title}
        </p>
        <div style={{ color: '#d4af37', fontSize: 8, opacity: 0.7, marginTop: 1 }}>❖ ✦ ❖</div>
      </div>

      {/* Bottom Foil Stamp Ribbon */}
      <div style={{ zIndex: 3, marginBottom: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
        <div style={{ width: '55%', height: '1px', background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
        <span style={{ color: '#d4af37', fontSize: 7, opacity: 0.85, fontWeight: 'bold', letterSpacing: 0.3 }}>
          {theme.label}
        </span>
      </div>
    </div>
  );
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

async function renderFirstPageAsDataUrl(pdfUrl) {
  if (!pdfUrl) return null;
  const cleanPdf = pdfUrl.split('#')[0];

  // Step A: Archive.org Page 1 JPEG thumbnail (Instant & High Resolution)
  if (cleanPdf.includes('archive.org')) {
    const match = cleanPdf.match(/archive\.org\/(?:download|details|stream)\/([^\/]+)/i);
    if (match && match[1]) {
      const identifier = match[1];
      return `https://archive.org/download/${identifier}/page/n1_w500.jpg`;
    }
  }

  // Step B: pdfjs-dist Canvas Renderer for R2 & Custom PDFs
  const urls = getCandidateUrls(cleanPdf);
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

      const viewport = page.getViewport({ scale: 0.6 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      pdf.destroy();
      return dataUrl;
    } catch (e) {
      continue;
    }
  }
  return null;
}

/**
 * PdfCoverImage — drop-in replacement for OfflineImage on BookCard.
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

        // 2. Render first page of PDF as Data URL or Archive.org page 1 thumbnail
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

  // Case 2: PDF first-page cover generated / fetched
  if (generatedUrl) {
    return (
      <img
        src={generatedUrl}
        alt={alt}
        onError={() => setGeneratedUrl(null)}
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

  // Case 3 & 4: Deluxe Islamic Mihrab Book Cover Template
  return <IslamicBookCoverTemplate book={book} alt={alt} style={style} />;
}
