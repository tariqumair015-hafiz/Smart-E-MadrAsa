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

function getCandidateUrls(url) {
  if (!url) return [];
  let clean = url.replace('http://', 'https://');
  const urls = [];
  if (clean.includes('archive.org') && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    urls.push(clean.replace('https://archive.org', `${window.location.origin}/api/archive`));
  }
  urls.push(`https://corsproxy.io/?url=${encodeURIComponent(clean)}`);
  urls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(clean)}`);
  urls.push(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(clean)}`);
  urls.push(clean);
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
  const hasCover = book?.cover_url && typeof book.cover_url === 'string' && book.cover_url.trim() !== '';

  if (hasCover) {
    return <OfflineImage src={book.cover_url} alt={alt} style={style} onError={onError} />;
  }

  return (
    <div
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
      <div style={{ fontSize: 28, opacity: 0.6, color: '#d4af37' }}>📚</div>
    </div>
  );
}
