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

const CORSPROXY = 'https://corsproxy.io/?url=';

function getProxiedUrl(url) {
  if (!url) return url;
  if (url.includes('archive.org')) return `${CORSPROXY}${encodeURIComponent(url)}`;
  return url;
}

/**
 * Render first page of a PDF URL to a JPEG data URI.
 * Returns null on failure.
 */
async function renderFirstPageAsDataUrl(pdfUrl) {
  const urls = [pdfUrl, getProxiedUrl(pdfUrl)];
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
  const hasCover = book?.cover_url && book.cover_url.trim() !== '';

  // Determine the PDF URL to render (first volume's URL if multi-volume, else root pdf_url)
  const pdfUrl = (() => {
    if (!book) return null;
    // prefer first volume url
    if (Array.isArray(book.volumes) && book.volumes.length > 0) {
      const v = book.volumes[0];
      return v.pdf_url || v.url || book.pdf_url || null;
    }
    return book.pdf_url || null;
  })();

  const cacheKey = `pdf_cover_${book?.id}`;

  const [generatedSrc, setGeneratedSrc] = useState(() => memPdfCache[cacheKey] || null);
  const [state, setState] = useState(generatedSrc ? 'done' : 'idle'); // idle | loading | done | error
  const containerRef = useRef(null);
  const isVisible = useRef(false);
  const attempted = useRef(false);

  // Intersection Observer: only render when card is in viewport (saves CPU)
  useEffect(() => {
    if (hasCover || !pdfUrl) return;
    if (memPdfCache[cacheKey]) return; // already in memory

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !attempted.current) {
          isVisible.current = true;
          attempted.current = true;
          observer.disconnect();

          setState('loading');

          // 1. Try IndexedDB cache first
          try {
            const cached = await pdfCoverStore.getItem(cacheKey);
            if (cached && typeof cached === 'string') {
              memPdfCache[cacheKey] = cached;
              setGeneratedSrc(cached);
              setState('done');
              return;
            }
          } catch (_) {}

          // 2. Render from PDF
          const dataUrl = await renderFirstPageAsDataUrl(pdfUrl);
          if (dataUrl) {
            memPdfCache[cacheKey] = dataUrl;
            setGeneratedSrc(dataUrl);
            setState('done');
            // Save to IndexedDB for next sessions
            pdfCoverStore.setItem(cacheKey, dataUrl).catch(() => {});
          } else {
            setState('error');
            if (onError) onError();
          }
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasCover, pdfUrl, cacheKey, onError]);

  // ─── Case 1: Book has a real cover → OfflineImage handles everything ────────
  if (hasCover) {
    return <OfflineImage src={book.cover_url} alt={alt} style={style} onError={onError} />;
  }

  // ─── Case 2: No cover, show PDF first-page thumbnail ───────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #1a3a2a, #0d2018)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Shimmer while loading */}
      {state === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #111 25%, #222 50%, #111 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            zIndex: 2,
          }}
        />
      )}

      {/* Rendered PDF thumbnail */}
      {state === 'done' && generatedSrc && (
        <img
          src={generatedSrc}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Fallback emblem when render fails or pdf_url missing */}
      {(state === 'error' || (!pdfUrl && state === 'idle')) && (
        <div style={{ fontSize: 28, opacity: 0.6, color: '#d4af37' }}>📚</div>
      )}

      {/* Idle before entering viewport */}
      {state === 'idle' && pdfUrl && (
        <div style={{ fontSize: 28, opacity: 0.4, color: '#d4af37' }}>📚</div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
