import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ls, THEMES, GOLD, iBtn, isArabic, fetchEnDict } from './pdfUtils';
import { ArrowLeft, Search, Bookmark, Share2, Settings, ChevronLeft, ChevronRight, Minus, Plus, Copy, BookOpen, Globe, WifiOff, AlertCircle, X, Loader2, ZoomIn, BookMarked, List } from 'lucide-react';

// CDN Fallback to ensure worker loads correctly even under production bundle paths
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;


const BUF = 10;
// A4 aspect ratio — placeholder height estimate
const pageAspect = 1.414;

export default function PDFViewer({ pdfUrl, shareUrl, bookId, title, language = 'ur', isOffline = false, onBack, initialPage }) {
  const ur = language === 'ur';
  const [pages, setPages] = useState(null);
  const [pg, setPg] = useState(() => {
    if (initialPage && initialPage > 1) return initialPage;
    return ls.get(`rp_${bookId}`, 1);
  });
  const [zoom, setZoom] = useState(() => ls.get(`zm_${bookId}`, 1.0));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [bars, setBars] = useState(true);
  const [themeIdx, setThemeIdx] = useState(() => ls.get('pth', 0));
  const [bright, setBright] = useState(() => ls.get('pbr', 100));
  const [mode, setMode] = useState(() => ls.get('pmd', 'cont')); // cont | single
  const [fitMode, setFitMode] = useState(() => ls.get('pfit', 'width')); // width | page
  const [showSet, setShowSet] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [jumpVal, setJumpVal] = useState('');
  const [showSrch, setShowSrch] = useState(false);
  const [srchQ, setSrchQ] = useState('');
  const [srchRes, setSrchRes] = useState([]);
  const [srchLoading, setSrchLoading] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState([]);
  const [bmarks, setBmarks] = useState(() => ls.get(`bm_${bookId}`, []));
  const [showBmarks, setShowBmarks] = useState(false);
  const [selTxt, setSelTxt] = useState('');
  const [dictData, setDictData] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [pageText, setPageText] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [renderedPages, setRenderedPages] = useState(new Set());
  const [showZoomHint, setShowZoomHint] = useState(false);
  const zoomHintT = useRef(null);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  const scrollRef = useRef(null);
  const pRefs = useRef({});
  const hideT = useRef(null);
  const pdfRef = useRef(null);
  const isJumping = useRef(false);
  const observerRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef({ dist: 0, zoom: 1, active: false });
  const T = THEMES[themeIdx];
  const isLandscape = vw > vh;
  const BAR_H = 54; // top + bottom bar combined height estimate
  // In 'width' fit mode (default): expand page to fill screen width so text is large & full screen.
  // In 'page' fit mode: fit entire page height inside available viewport height.
  let W;
  if (fitMode === 'page') {
    const availH = vh - (bars ? BAR_H * 2 : 20);
    W = Math.round((availH / pageAspect) * zoom);
  } else {
    // Default 'width' mode — full screen width fit
    const maxContainerW = isLandscape ? Math.min(vw - 8, 1400) : Math.min(vw - 4, 820);
    W = Math.round(maxContainerW * zoom);
  }
  const pageH = Math.round(W * pageAspect);

  // persist
  useEffect(() => { if (bookId) ls.set(`rp_${bookId}`, pg); }, [pg, bookId]);
  useEffect(() => { if (bookId) ls.set(`zm_${bookId}`, zoom); }, [zoom, bookId]);
  useEffect(() => { ls.set('pth', themeIdx); }, [themeIdx]);
  useEffect(() => { ls.set('pbr', bright); }, [bright]);
  useEffect(() => { ls.set('pmd', mode); }, [mode]);
  useEffect(() => { ls.set('pfit', fitMode); }, [fitMode]);

  const resetHide = useCallback(() => {
    if (loading || err) return;
    if (bars) {
      // Bars dikh rahe hain → click se CHHUPO
      clearTimeout(hideT.current);
      setBars(false);
    } else {
      // Bars chhupe hain → click se DIKHO + 4 sec baad auto-hide
      setBars(true);
      clearTimeout(hideT.current);
      hideT.current = setTimeout(() => setBars(false), 4000);
    }
  }, [bars, loading, err]);
  // Orientation / resize tracker
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    screen.orientation?.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      screen.orientation?.removeEventListener('change', onResize);
    };
  }, []);

  useEffect(() => () => clearTimeout(hideT.current), []);

  // Native touchmove listener with passive:false so preventDefault works for pinch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (e.touches.length === 2 && pinchStart.current.active) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = dist / pinchStart.current.dist;
        const newZoom = Math.min(3.0, Math.max(0.5, parseFloat((pinchStart.current.zoom * ratio).toFixed(2))));
        setZoom(newZoom);
        setShowZoomHint(true);
        clearTimeout(zoomHintT.current);
        zoomHintT.current = setTimeout(() => setShowZoomHint(false), 1200);
      }
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  // Dynamic page tracking observer
  useEffect(() => {
    if (!pages || mode !== 'cont') return;

    observerRef.current = new IntersectionObserver(entries => {
      if (isJumping.current) return;
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.35) {
          const p = parseInt(e.target.dataset.page);
          if (!isNaN(p)) setPg(p);
        }
      });
    }, { threshold: 0.35 });

    // Re-observe any existing elements in pRefs
    Object.values(pRefs.current).forEach(el => el && observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [pages, mode]);

  // Callback ref to dynamically register/unregister page elements
  const setPageRef = useCallback((el, p) => {
    if (el) {
      pRefs.current[p] = el;
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    } else {
      const oldEl = pRefs.current[p];
      if (oldEl && observerRef.current) {
        observerRef.current.unobserve(oldEl);
      }
      delete pRefs.current[p];
    }
  }, []);

  // text selection
  useEffect(() => {
    const h = () => {
      const s = window.getSelection()?.toString().trim();
      if (s && s.length >= 2 && s.length <= 60) setSelTxt(s);
    };
    document.addEventListener('mouseup', h);
    document.addEventListener('touchend', h);
    return () => { document.removeEventListener('mouseup', h); document.removeEventListener('touchend', h); };
  }, []);
  const handleTouchMove = (e) => {
    // pinch zoom handled natively in event listener to preventDefault
  };

  const visPages = useCallback(() => {
    if (!pages) return [];
    if (mode === 'single') return [pg];
    // Don't render all pages even if offline to prevent OOM / hanging. Use the buffer instead.
    const s = Math.max(1, pg - BUF), e = Math.min(pages, pg + BUF);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }, [pages, pg, mode]);

  const goTo = useCallback((p) => {
    if (!pages || p < 1 || p > pages) return;
    isJumping.current = true;
    setPg(p);
    if (mode === 'cont') {
      const el = pRefs.current[p];
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
    setTimeout(() => {
      isJumping.current = false;
    }, 150);
  }, [pages, mode]);

  const onLoad = useCallback(async ({ numPages: n }) => {
    setPages(n); setLoading(false);
    if (pg <= 1) return; // page 1 pe already hain
    isJumping.current = true;

    // Estimated page height to instantly scroll before real pages render
    const estH = (scrollRef.current?.clientHeight || 800) * 1.4;
    const targetScrollTop = (pg - 1) * (estH + 12); // 12 = margin

    if (scrollRef.current) {
      scrollRef.current.scrollTop = targetScrollTop;
    }

    // Retry with real element once pages have rendered (up to 10 tries)
    let attempts = 0;
    const tryJump = () => {
      const el = pRefs.current[pg];
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        setTimeout(() => { isJumping.current = false; }, 200);
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryJump, 300);
      } else {
        isJumping.current = false;
      }
    };
    setTimeout(tryJump, 400);

    if (pdfRef.current) {
      try { const o = await pdfRef.current.getOutline(); if (o?.length) setToc(o); } catch { }
    }
  }, [pg]);

  const onErr = useCallback((e) => {
    const m = e?.message || '';
    setErr(m.includes('fetch') || m.includes('CORS') || m.includes('network')
      ? (ur ? 'نیٹ ورک مسئلہ — پہلے ڈاؤنلوڈ کریں' : 'Network error — Download first')
      : (ur ? `لوڈ نہیں ہوئی: ${m}` : `Failed: ${m}`));
    setLoading(false);
  }, [ur]);

  const toggleBmark = useCallback(() => {
    setBmarks(prev => {
      const next = prev.includes(pg) ? prev.filter(p => p !== pg) : [...prev, pg].sort((a, b) => a - b);
      ls.set(`bm_${bookId}`, next);
      return next;
    });
  }, [pg, bookId]);

  const handleTocClick = useCallback(async (dest) => {
    if (!dest || !pdfRef.current) return;
    try {
      let pageNum = null;
      if (typeof dest === 'string') {
        const destObj = await pdfRef.current.getDestination(dest);
        if (destObj && destObj.length > 0) {
          const ref = destObj[0];
          const idx = await pdfRef.current.getPageIndex(ref);
          pageNum = idx + 1;
        }
      } else if (Array.isArray(dest) && dest.length > 0) {
        const ref = dest[0];
        if (ref && typeof ref === 'object') {
          const idx = await pdfRef.current.getPageIndex(ref);
          pageNum = idx + 1;
        } else if (typeof ref === 'number') {
          pageNum = ref + 1;
        }
      }
      if (pageNum && pageNum >= 1 && pageNum <= pages) {
        goTo(pageNum);
        setShowSet(false);
      }
    } catch (e) {
      console.error("Error resolving TOC destination:", e);
    }
  }, [pages, goTo]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Pinch gesture start — record starting distance and current zoom
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStart.current = { dist, zoom: zoom, active: true };
      return;
    }
    if (mode !== 'single') return;
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, [mode, zoom]);




  const handleTouchEnd = useCallback((e) => {
    if (pinchStart.current.active) {
      // Pinch just ended — save final zoom and reset
      pinchStart.current = { dist: 0, zoom: zoom, active: false };
      return;
    }
    if (mode !== 'single') return;
    const t = e.changedTouches[0];
    const diffX = t.clientX - touchStart.current.x;
    const diffY = t.clientY - touchStart.current.y;

    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
      if (diffX < 0) {
        goTo(pg + 1);
      } else {
        goTo(pg - 1);
      }
    }
  }, [mode, pg, zoom, goTo]);

  const doSearch = useCallback(async () => {
    if (!srchQ.trim() || !pdfRef.current) return;
    setSrchLoading(true); setSrchRes([]);
    try {
      const res = [];
      for (let i = 1; i <= pdfRef.current.numPages && res.length < 20; i++) {
        const p = await pdfRef.current.getPage(i);
        const c = await p.getTextContent();
        const t = c.items.map(x => x.str).join(' ');
        if (t.toLowerCase().includes(srchQ.toLowerCase())) {
          const idx = t.toLowerCase().indexOf(srchQ.toLowerCase());
          res.push({ page: i, snippet: t.substring(Math.max(0, idx - 25), idx + srchQ.length + 25) });
        }
      }
      setSrchRes(res);
    } catch { }
    setSrchLoading(false);
  }, [srchQ]);

  const lookupDict = useCallback(async (word) => {
    setDictLoading(true); setDictData(null);
    if (isArabic(word)) {
      setDictData({ type: 'arabic', word }); setDictLoading(false); return;
    }
    const d = await fetchEnDict(word);
    setDictData(d ? { type: 'en', ...d } : { type: 'notfound', word });
    setDictLoading(false);
  }, []);

  const share = useCallback(async () => {
    const txt = ur
      ? `السلام علیکم! میں "سمارٹ ای مدرسہ" ایپ پر یہ کتاب پڑھ رہا ہوں: "${title}"\n\nآپ بھی ڈاؤنلوڈ کریں:`
      : `Assalam-o-Alaikum! I am reading "${title}" on Smart e-Madarsa App.\n\nDownload here:`;

    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'Book', text: txt, url: shareUrl });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(txt + ' ' + shareUrl)}`);
      }
    } catch { }
  }, [title, shareUrl, ur]);

  const extractCurrentPageText = useCallback(async () => {
    if (!pdfRef.current || !pg) return;
    setShowTextModal(true);
    setTextLoading(true);
    setCopySuccess(false);
    try {
      const page = await pdfRef.current.getPage(pg);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      setPageText(text.trim() || (ur ? 'اس صفحے سے متنی عبارت حاصل نہیں ہو سکی۔' : 'No text content available on this page.'));
    } catch (e) {
      setPageText(ur ? 'عبارت لوڈ کرنے میں خطا ہوئی۔' : 'Error loading page text.');
    } finally {
      setTextLoading(false);
    }
  }, [pg, ur]);

  const copyFormattedText = useCallback(() => {
    if (!pageText) return;
    const formatted = `📖 ${title || 'کتاب'}\n📄 ${ur ? 'صفحہ' : 'Page'}: ${pg}\n\n${pageText}\n\n-----------------------\n📱 Smart e-Madarsa App`;
    navigator.clipboard.writeText(formatted).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }).catch(() => { });
  }, [pageText, title, pg, ur]);

  const shareFormattedText = useCallback(() => {
    if (!pageText) return;
    const formatted = `📖 ${title || 'کتاب'}\n📄 ${ur ? 'صفحہ' : 'Page'}: ${pg}\n\n${pageText}\n\n-----------------------\n📱 Smart e-Madarsa App`;
    if (navigator.share) {
      navigator.share({ title: title || 'Book Text', text: formatted }).catch(() => { });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(formatted)}`);
    }
  }, [pageText, title, pg, ur]);

  const isBm = bmarks.includes(pg);

  return (
    <div onClick={resetHide} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: T.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>

      {/* Brightness overlay */}
      {bright < 100 && <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000', opacity: (100 - bright) / 125, pointerEvents: 'none' }} />}

      {/* TOP BAR */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200, background: `${T.bar}f0`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${GOLD}18`, padding: isLandscape ? '5px 10px' : '10px 12px', display: 'flex', alignItems: 'center', gap: isLandscape ? 4 : 6, transform: bars ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)' }}>
        <button style={iBtn()} onClick={e => { e.stopPropagation(); onBack(); }}><ArrowLeft size={18} /></button>
        <span style={{ color: GOLD, flex: 1, fontSize: isLandscape ? 11 : 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0.2 }}>{title || 'PDF'}</span>
        <button style={iBtn()} onClick={e => { e.stopPropagation(); setShowSrch(p => !p); }}><Search size={17} /></button>
        <button style={iBtn({ color: showTextModal ? GOLD : '#ccc' })} title={ur ? 'صفحہ کی عبارت کاپی کریں' : 'Copy Page Text'} onClick={e => { e.stopPropagation(); extractCurrentPageText(); }}><Copy size={17} /></button>
        <button style={iBtn({ color: isBm ? GOLD : '#666' })} onClick={e => { e.stopPropagation(); toggleBmark(); }}><Bookmark size={17} fill={isBm ? GOLD : 'none'} /></button>
        <button style={iBtn()} onClick={e => { e.stopPropagation(); share(); }}><Share2 size={17} /></button>
        <button style={iBtn()} onClick={e => { e.stopPropagation(); setShowSet(p => !p); }}><Settings size={17} /></button>
      </div>

      {/* SETTINGS PANEL */}
      {showSet && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 58, right: 0, zIndex: 300, background: `${T.bar}ee`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${GOLD}20`, borderRadius: '0 0 0 18px', padding: 18, minWidth: 230, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{ur ? 'تھیم' : 'Theme'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEMES.map((t, i) => (
                <button key={t.id} onClick={() => setThemeIdx(i)} style={{ background: i === themeIdx ? GOLD : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '6px 10px', color: i === themeIdx ? '#000' : '#aaa', cursor: 'pointer', fontSize: 13 }}>{t.icon}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{ur ? 'روشنی' : 'Brightness'} {bright}%</div>
            <input type="range" min={20} max={100} value={bright} onChange={e => setBright(Number(e.target.value))} style={{ width: '100%', accentColor: GOLD }} />
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{ur ? 'اسکرول موڈ' : 'Scroll Mode'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['cont', ur ? 'مسلسل' : 'Continuous'], ['single', ur ? 'ایک صفحہ' : 'Single Page']].map(([v, l]) => (
                <button key={v} onClick={() => setMode(v)} style={{ background: mode === v ? GOLD : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '6px 10px', color: mode === v ? '#000' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{ur ? 'فٹ موڈ' : 'Fit Mode'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['width', ur ? 'چوڑائی (پورا اسکرین)' : 'Fit Width'], ['page', ur ? 'پورا صفحہ' : 'Fit Page']].map(([v, l]) => (
                <button key={v} onClick={() => setFitMode(v)} style={{ background: fitMode === v ? GOLD : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '6px 10px', color: fitMode === v ? '#000' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{ur ? 'بک مارکس' : 'Bookmarks'} ({bmarks.length})</div>
            {bmarks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bmarks.map(b => (
                  <button key={b} onClick={() => { goTo(b); setShowSet(false); }} style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40`, borderRadius: 6, padding: '4px 8px', color: GOLD, cursor: 'pointer', fontSize: 12 }}>{b}</button>
                ))}
              </div>
            )}
          </div>
          {toc.length > 0 && (
            <div>
              <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{ur ? 'فہرست' : 'Table of Contents'}</div>
              <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                {toc.slice(0, 20).map((item, i) => (
                  <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#ccc', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => handleTocClick(item.dest)}>
                    {item.title}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setShowSet(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} />{ur ? 'بند' : 'Close'}</button>
        </div>
      )}

      {/* SEARCH */}
      {showSrch && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 58, left: 0, right: 0, zIndex: 250, background: `${T.bar}ee`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${GOLD}18`, padding: '10px 12px', display: 'flex', gap: 8 }}>
          <input autoFocus value={srchQ} onChange={e => setSrchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder={ur ? 'تلاش کریں...' : 'Search in PDF...'} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: `1px solid ${GOLD}30`, borderRadius: 8, color: '#fff', padding: '8px 12px', fontSize: 14 }} />
          <button onClick={doSearch} style={{ ...iBtn(), width: 'auto', padding: '0 12px', fontSize: 13, gap: 6, display: 'flex', alignItems: 'center' }}>{srchLoading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={15} />}<span>{ur ? 'تلاش' : 'Go'}</span></button>
          <button onClick={() => { setShowSrch(false); setSrchRes([]); setSrchQ(''); }} style={iBtn()}><X size={16} /></button>
        </div>
      )}
      {srchRes.length > 0 && showSrch && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 112, left: 0, right: 0, zIndex: 249, background: `${T.bar}f5`, maxHeight: '35vh', overflowY: 'auto', borderBottom: `1px solid ${GOLD}18` }}>
          {srchRes.map((r, i) => (
            <div key={i} onClick={() => { goTo(r.page); setShowSrch(false); setSrchRes([]); }} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
              <span style={{ color: GOLD, fontSize: 11 }}>{ur ? `صفحہ ${r.page}` : `Page ${r.page}`}</span>
              <p style={{ color: '#ccc', fontSize: 12, margin: '3px 0 0' }}>...{r.snippet}...</p>
            </div>
          ))}
        </div>
      )}

      {/* DICTIONARY POPUP */}
      {selTxt && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 400, background: `${T.bar}f0`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${GOLD}25`, borderRadius: 18, padding: 16, boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>{selTxt}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { navigator.clipboard?.writeText(selTxt); }} style={{ ...iBtn({ width: 30, height: 30 }) }}><Copy size={14} /></button>
              <button onClick={() => lookupDict(selTxt)} style={{ ...iBtn({ width: 30, height: 30 }) }}><BookOpen size={14} /></button>
              <button onClick={() => { setSelTxt(''); setDictData(null); window.getSelection()?.removeAllRanges(); }} style={{ ...iBtn({ width: 30, height: 30, color: '#888' }) }}><X size={14} /></button>
            </div>
          </div>
          {dictLoading && <p style={{ color: '#888', fontSize: 12 }}>Loading...</p>}
          {dictData?.type === 'en' && (
            <div>{dictData.meanings?.map((m, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ color: GOLD, fontSize: 10 }}>{m.pos}</span>
                <p style={{ color: '#ddd', fontSize: 13, margin: '2px 0 0' }}>{m.def}</p>
              </div>
            ))}</div>
          )}
          {dictData?.type === 'arabic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <p style={{ color: '#ddd', fontSize: 13, margin: 0 }}>
                {ur ? 'منتخب کردہ عربی/اردو لفظ کا ترجمہ دیکھنے کے لیے لنک کھولیں:' : 'Open link to translate the selected Arabic/Urdu word:'}
              </p>
              <button
                onClick={() => {
                  const targetLang = ur ? 'ur' : 'en';
                  const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(selTxt)}&op=translate`;
                  window.open(url, '_blank');
                }}
                style={{
                  background: GOLD,
                  color: '#000',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 13,
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Globe size={14} /> {ur ? 'گوگل ترجمہ کھولیں' : 'Open Google Translate'}
              </button>
            </div>
          )}
          {dictData?.type === 'notfound' && <p style={{ color: '#888', fontSize: 13 }}>{ur ? 'معنی نہیں ملے' : 'Not found'}</p>}
        </div>
      )}

      {/* PDF AREA */}
      <div ref={scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          paddingTop: bars ? (isLandscape ? 40 : 58) : 8,
          paddingBottom: bars ? (isLandscape ? 44 : 68) : 8,
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          background: T.bg,
          scrollBehavior: 'smooth',
          touchAction: 'pan-y',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: fitMode === 'page' && isLandscape && mode === 'single' ? 'center' : 'flex-start',
        }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ width: 52, height: 52, border: `4px solid ${GOLD}20`, borderTop: `4px solid ${GOLD}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <p style={{ color: GOLD, marginTop: 18, fontSize: 14, fontWeight: 500, letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={16} />{ur ? 'کتاب لوڈ ہو رہی ہے...' : 'Loading Book...'}</p>
            <p style={{ color: '#888', marginTop: 6, fontSize: 11 }}>{title || ''}</p>
          </div>
        )}
        {err && (
          <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', zIndex: 10 }}>
            <div style={{ marginBottom: 12 }}><AlertCircle size={48} color="#ef4444" /></div>
            <p style={{ color: '#ef4444', fontSize: 14, lineHeight: 1.8, maxWidth: 300 }}>{err}</p>
            <button onClick={onBack} style={{ background: GOLD, color: '#000', border: 'none', padding: '12px 32px', borderRadius: 12, fontWeight: 'bold', marginTop: 20, cursor: 'pointer', fontSize: 14 }}>{ur ? '↩ واپس جائیں' : '↩ Go Back'}</button>
          </div>
        )}
        <Document file={pdfUrl} onLoadSuccess={onLoad} onLoadError={onErr} loading={null}
          onSourceSuccess={doc => { pdfRef.current = doc; }}>
          {pages && mode === 'cont' && Array.from({ length: pages }, (_, i) => i + 1).map(p => {
            const vis = visPages();
            const isVisible = vis.includes(p);
            const isRendered = renderedPages.has(p);
            return isVisible ? (
              <div key={p} data-page={p} ref={el => setPageRef(el, p)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: T.pageBg || 'white', margin: '6px auto', borderRadius: 4, boxShadow: '0 1px 8px rgba(0,0,0,0.10)', filter: T.filter, maxWidth: '100%', width: W, position: 'relative', opacity: isRendered ? 1 : 0, transition: 'opacity 0.25s ease' }}>
                <Page pageNumber={p} width={W} renderTextLayer={isRendered} renderAnnotationLayer={false}
                  onRenderSuccess={() => setRenderedPages(prev => new Set([...prev, p]))}
                  loading={
                    <div style={{ height: pageH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, width: W }}>
                      <div style={{ width: '60%', height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.06)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                      <div style={{ width: '80%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.04)', animation: 'pulse 1.2s ease-in-out 0.2s infinite' }} />
                      <div style={{ width: '45%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.04)', animation: 'pulse 1.2s ease-in-out 0.4s infinite' }} />
                    </div>
                  } />
                <div style={{ fontSize: 10, color: T.id === 'dark' ? '#555' : '#aaa', padding: '5px 0', width: '100%', textAlign: 'center', borderTop: `1px solid ${T.id === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>— {p} —</div>
              </div>
            ) : (
              <div key={p} data-page={p} ref={el => setPageRef(el, p)}
                style={{ height: pageH + 30, width: W, margin: '6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.id === 'dark' ? '#333' : '#bbb', fontSize: 12 }}>
                {ur ? `صفحہ ${p}` : `Page ${p}`}
              </div>
            );
          })}
          {pages && mode === 'single' && visPages().map(p => {
            const isRendered = renderedPages.has(p);
            return (
              <div key={p} data-page={p} ref={el => pRefs.current[p] = el}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: T.pageBg || 'white', margin: '6px auto', borderRadius: 4, boxShadow: '0 1px 8px rgba(0,0,0,0.10)', filter: T.filter, maxWidth: '100%', width: W, position: 'relative', opacity: isRendered ? 1 : 0, transition: 'opacity 0.25s ease' }}>
                <Page pageNumber={p} width={W} renderTextLayer={isRendered} renderAnnotationLayer={false}
                  onRenderSuccess={() => setRenderedPages(prev => new Set([...prev, p]))}
                  loading={<div style={{ height: pageH, width: W, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '60%', height: 12, borderRadius: 6, background: 'rgba(0,0,0,0.06)', animation: 'pulse 1.2s ease-in-out infinite' }} /></div>} />
                <div style={{ fontSize: 10, color: '#aaa', padding: '5px 0', width: '100%', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.04)' }}>— {p} —</div>
              </div>
            );
          })}
        </Document>
      </div>

      {/* Page badge */}
      {!bars && pages && (
        <div style={{ position: 'fixed', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.65)', color: GOLD, padding: '6px 10px', borderRadius: 16, fontSize: 10, zIndex: 100, pointerEvents: 'none', border: `1px solid ${GOLD}30` }}>{pg}/{pages}</div>
      )}

      {/* Pinch Zoom indicator */}
      {showZoomHint && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.72)', color: GOLD, padding: '10px 22px', borderRadius: 20, fontSize: 20, fontWeight: 700, zIndex: 600, pointerEvents: 'none', border: `1px solid ${GOLD}30`, backdropFilter: 'blur(8px)', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ZoomIn size={20} /> {Math.round(zoom * 100)}%
        </div>
      )}

      {/* BOTTOM BAR */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 200, background: `${T.bar}f0`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: `1px solid ${GOLD}18`, padding: isLandscape ? '3px 10px' : '6px 10px', display: 'flex', flexDirection: 'column', gap: isLandscape ? 2 : 4, transform: bars ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)' }}>
        {/* Progress slider — hidden in landscape to save space */}
        {pages && !isLandscape && <input type="range" min={1} max={pages} value={pg} onChange={e => { e.stopPropagation(); goTo(Number(e.target.value)); }} style={{ width: '100%', height: 3, accentColor: GOLD, cursor: 'pointer', margin: 0 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={iBtn({ opacity: pg <= 1 ? 0.3 : 1 })} onClick={e => { e.stopPropagation(); goTo(pg - 1); }} disabled={pg <= 1}><ChevronLeft size={18} /></button>
          <button onClick={e => { e.stopPropagation(); setJumpVal(''); setShowJump(true); }}
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${GOLD}20`, borderRadius: 10, color: GOLD, padding: isLandscape ? '4px' : '7px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {pg} / {pages || '?'}
          </button>
          <button style={iBtn({ opacity: pg >= (pages || 1) ? 0.3 : 1 })} onClick={e => { e.stopPropagation(); goTo(pg + 1); }} disabled={pg >= (pages || 1)}><ChevronRight size={18} /></button>
          <div style={{ width: 1, height: 20, background: `${GOLD}20` }} />
          <button style={iBtn()} onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(1)))); }}><Minus size={15} /></button>
          <span style={{ color: GOLD, fontSize: 10, minWidth: 32, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button style={iBtn()} onClick={e => { e.stopPropagation(); setZoom(z => Math.min(2.5, parseFloat((z + 0.1).toFixed(1)))); }}><Plus size={15} /></button>
        </div>
      </div>

      {/* JUMP DIALOG */}
      {showJump && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: T.ui, border: `1px solid ${GOLD}40`, borderRadius: 20, padding: 24, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <h3 style={{ color: GOLD, margin: 0 }}>{ur ? 'صفحہ نمبر' : 'Go to Page'}</h3>
            <input autoFocus type="number" value={jumpVal} onChange={e => setJumpVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { goTo(parseInt(jumpVal)); setShowJump(false); } }}
              style={{ width: '80%', padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: `1px solid ${GOLD}40`, color: '#fff', textAlign: 'center', fontSize: 20 }} />
            <p style={{ color: '#666', fontSize: 11, margin: 0 }}>1 — {pages}</p>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button onClick={() => setShowJump(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, color: '#888', padding: 12, cursor: 'pointer' }}>{ur ? 'بند' : 'Cancel'}</button>
              <button onClick={() => { goTo(parseInt(jumpVal)); setShowJump(false); }} style={{ flex: 1, background: GOLD, border: 'none', borderRadius: 10, color: '#000', padding: 12, fontWeight: 'bold', cursor: 'pointer' }}>{ur ? 'جائیں' : 'Go'}</button>
            </div>
          </div>
        </div>
      {/* 📄 Page Text & Copy Modal */}
      {showTextModal && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'linear-gradient(135deg, #111a14, #0a0e0b)', border: `2px solid ${GOLD}`, borderRadius: 20, padding: 20, maxWidth: 460, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.8)', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${GOLD}30`, paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: GOLD, fontSize: 18 }}>📄</span>
                <span className="urdu-text" style={{ color: GOLD, fontWeight: 'bold', fontSize: 15 }}>
                  {ur ? `صفحہ ${pg} کی متنی عبارت` : `Page ${pg} Text`}
                </span>
              </div>
              <button onClick={() => setShowTextModal(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, padding: 14, color: '#e2e8f0', fontSize: 13, lineHeight: 1.8, textAlign: 'justify', userSelect: 'text', WebkitUserSelect: 'text' }} className="urdu-text">
              {textLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, color: GOLD, gap: 10 }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{ur ? 'عبارت نکالی جا رہی ہے...' : 'Extracting text...'}</span>
                </div>
              ) : (
                pageText
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                onClick={copyFormattedText}
                className="urdu-text"
                disabled={textLoading || !pageText}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: copySuccess ? '#22c55e' : `linear-gradient(135deg, ${GOLD}, #b4831f)`, color: copySuccess ? '#fff' : '#000', border: 'none', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Copy size={16} />
                <span>{copySuccess ? (ur ? 'کاپی ہو گیا!' : 'Copied!') : (ur ? 'عبارت کاپی کریں' : 'Copy Text')}</span>
              </button>

              <button
                onClick={shareFormattedText}
                className="urdu-text"
                disabled={textLoading || !pageText}
                style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.15)', color: GOLD, border: `1px solid ${GOLD}40`, fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Share2 size={16} />
                <span>{ur ? 'شیئر کریں' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        .react-pdf__Page__canvas { margin: 0 auto !important; display: block !important; }
        .react-pdf__Page__textContent { user-select: text !important; -webkit-user-select: text !important; }
        input[type=range] { -webkit-appearance: none; background: ${GOLD}15; border-radius: 4px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: ${GOLD}; cursor: pointer; }
      `}</style>
    </div>
  );
}