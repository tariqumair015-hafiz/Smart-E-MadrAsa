import React, { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const imageStore = localforage.createInstance({
  name: 'SmartEMadarsa',
  storeName: 'cached_covers'
});

// Fast in-memory cache to bypass IndexedDB reads for already-resolved images
const memoryCache = {};

export default function OfflineImage({ src, alt, style, onError }) {
  const [imgSrc, setImgSrc] = useState(() => (src ? memoryCache[src] : null));
  const [loading, setLoading] = useState(() => !(src && memoryCache[src]));
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!src) return;
    if (memoryCache[src]) {
      setImgSrc(memoryCache[src]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadImage = async () => {
      try {
        // Step 1: Check Cache First (Hamesha check karo, visible hone se pehle bhi takay tayyar rahe)
        const cached = await imageStore.getItem(src);
        
        if (cached) {
          // Agar Blob hai
          if (cached instanceof Blob) {
            const url = URL.createObjectURL(cached);
            memoryCache[src] = url; // cache in memory
            if (isMounted) {
              setImgSrc(url);
              setLoading(false);
              return;
            }
          } 
          // Agar Base64 string/data URI hai
          else if (typeof cached === 'string') {
            memoryCache[src] = cached; // cache in memory
            if (isMounted) {
              setImgSrc(cached);
              setLoading(false);
              return;
            }
          }
        }

        // Agar cache mein nahi hai, aur visible hai, tab download karo
        if (!isVisible) return;

        // Step 2: Download Image
        if (Capacitor.isNativePlatform()) {
          // Mobile par CORS bypass karne ke liye CapacitorHttp use karein
          const options = {
            url: src,
            responseType: 'blob'
          };
          const response = await CapacitorHttp.get(options);
          
          if (response.status === 200 && response.data) {
            // Capacitor returns base64 or blob depending on version/config
            // We'll handle it carefully
            let blob = response.data;
            
            // Convert to proper Blob if it's not already
            // Convert to proper Blob if it's a base64 string
            if (typeof response.data === 'string') {
              const dataUri = response.data.startsWith('data:') ? response.data : `data:image/jpeg;base64,${response.data}`;
              await imageStore.setItem(src, dataUri);
              memoryCache[src] = dataUri; // cache in memory
              if (isMounted) {
                setImgSrc(dataUri);
                setLoading(false);
              }
            } else if (response.data instanceof Blob) {
              await imageStore.setItem(src, response.data);
              const url = URL.createObjectURL(response.data);
              memoryCache[src] = url; // cache in memory
              if (isMounted) {
                setImgSrc(url);
                setLoading(false);
              }
            } else {
              throw new Error('Unknown response format');
            }
          } else {
            throw new Error('Download failed');
          }
        } else {
          // Web/Browser par CORS issue se bachne ke liye direct load karein bina fetch fetch cache ke
          memoryCache[src] = src;
          if (isMounted) {
            setImgSrc(src);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('Offline image cache load failed:', err);
        // Fallback to direct src if fetching/caching fails
        if (isMounted) {
          setImgSrc(src);
          setLoading(false);
        }
      }
    };

    loadImage();
    return () => { isMounted = false; };
  }, [src, isVisible]);

  if (error || !src) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'linear-gradient(145deg, #1a3a2a, #0d2018)', color: '#d4af37', 
        opacity: 0.5, ...style 
      }}>
        <div style={{ fontSize: '24px' }}>📚</div>
      </div>
    );
  }

  return (
    <div ref={imgRef} style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#1a1a1a', ...style }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #111 25%, #222 50%, #111 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          zIndex: 1
        }} />
      )}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onLoad={() => setLoading(false)}
          onError={() => {
            // If the failing imgSrc was a cache/blob URL, fall back to the direct src
            if (imgSrc !== src) {
              console.warn('Cached image failed to load, falling back to direct URL:', src);
              setImgSrc(src);
              // Also try to remove the corrupted entry from cache
              imageStore.removeItem(src).catch(() => {});
            } else {
              setError(true);
              if (onError) onError();
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
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