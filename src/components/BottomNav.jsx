import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Home, Library, Compass, MoreHorizontal, X,
  MessageSquare, Mic, Disc, Database, BookHeart, BookOpen
} from 'lucide-react';
import { strings } from '../translations';

const VW = 560;
const VH = 68;
const R  = 24; // Border radius of nav bar

/* 🌟 PERFECTED UPTCL CURVE MATH 🌟 */
function buildPillPath(cx) {
  // dipWidth: gaddha kitna chora hoga
  // dipDepth: gaddha kitna gehra hoga
  const dipWidth = 44; 
  const dipDepth = 36; 

  const safeCx = Math.max(R + dipWidth + 4, Math.min(VW - R - dipWidth - 4, cx));
  const p1 = safeCx - dipWidth;
  const p2 = safeCx + dipWidth;

  // Monotonic Bezier coordinates to prevent self-intersection/cracking in the curve
  return `
    M ${R} 0
    L ${p1} 0
    C ${safeCx - 32} 0, ${safeCx - 16} ${dipDepth}, ${safeCx} ${dipDepth}
    C ${safeCx + 16} ${dipDepth}, ${safeCx + 32} 0, ${p2} 0
    L ${VW - R} 0
    Q ${VW} 0, ${VW} ${R}
    L ${VW} ${VH - R}
    Q ${VW} ${VH}, ${VW - R} ${VH}
    L ${R} ${VH}
    Q 0 ${VH}, 0 ${VH - R}
    L 0 ${R}
    Q 0 0, ${R} 0
    Z
  `;
}

/* 🌟 EXACT TOPOGRAPHY LINES 🌟 */
function TopoCircle() {
  return (
    <svg className="bnav-topo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="topoBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--nav-color)" />
          <stop offset="100%" stopColor="var(--bg-color)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#topoBg)" />
      <path d="M-10 30 Q 20 10, 50 30 T 110 30" fill="none" stroke="var(--gold-color)" strokeWidth="1" opacity="0.4" />
      <path d="M-10 45 Q 25 25, 50 45 T 110 45" fill="none" stroke="var(--gold-color)" strokeWidth="1.5" opacity="0.6" />
      <path d="M-10 60 Q 30 40, 50 60 T 110 60" fill="none" stroke="var(--gold-color)" strokeWidth="1.5" opacity="0.5" />
      <path d="M-10 75 Q 35 55, 50 75 T 110 75" fill="none" stroke="var(--gold-color)" strokeWidth="1" opacity="0.3" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="var(--gold-color)" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

/* 🌟 GOLDEN TRAIL ROAD (WINDING DOWN EXACTLY LIKE TARGET) 🌟 */
function WindingTrail({ tabIndex }) {
  const leftPercent = tabIndex * 20 + 10; 
  return (
    <span className="bnav-trail" style={{ left: `${leftPercent}%` }} aria-hidden="true">
      <svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <defs>
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--gold-color, #d4af37)" stopOpacity="1" />
            <stop offset="40%" stopColor="var(--gold-color, #d4af37)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--gold-color, #d4af37)" stopOpacity="0" />
          </linearGradient>
          <filter id="trailBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {/* Glow Layer */}
        <path d="M 60 5 C 55 25, 35 35, 45 50 C 55 65, 85 55, 120 70" fill="none" stroke="var(--gold-color, #d4af37)" strokeWidth="4" strokeLinecap="round" filter="url(#trailBlur)" opacity="0.6" />
        {/* Sharp Layer */}
        <path d="M 60 5 C 55 25, 35 35, 45 50 C 55 65, 85 55, 120 70" fill="none" stroke="url(#trailGrad)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function BottomNavComponent({ currentTab, setCurrentTab, language, libraryCount }) {
  const t = strings[language];
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = useMemo(() => [
    { id: 'home',    icon: <Home />,      label: t.home     || 'Home'          },
    { id: 'quran',   icon: <BookHeart />, label: language === 'ur' ? 'قرآن' : 'Quran' },
    { id: 'library', icon: <Library />,   label: t.library  || 'Library', badge: libraryCount },
    { id: 'qibla',   icon: <Compass />,   label: t.qiblaTab || 'Qibla & Times' },
  ], [language, libraryCount, t]);

  const moreTabs = useMemo(() => [
    { id: 'duas',     icon: <BookHeart />,     label: language === 'ur' ? 'دعائیں'  : 'Duas'      },
    { id: 'calendar', icon: <Disc />,          label: language === 'ur' ? 'کیلنڈر' : 'Calendar'  },
    { id: 'audio',    icon: <Mic />,           label: t.audio    || 'Audio'     },
    { id: 'tasbeeh',  icon: <Disc />,          label: t.tasbeeh  || 'Tasbeeh'   },
    { id: 'sync',     icon: <Database />,      label: t.syncTab  || 'Data & Sync'},
    { id: 'suggest',  icon: <BookOpen />,      label: language === 'ur' ? 'کتاب اپلوڈ کریں' : 'Upload Book' },
  ], [language, t]);

  let activeIdx = mainTabs.findIndex(tab => tab.id === currentTab);
  if (activeIdx === -1 || isMoreOpen) activeIdx = 4;

  const tabCx = (i) => (VW / 5) * i + VW / 10;
  const pathEl = useRef(null);
  const currCx = useRef(tabCx(activeIdx));
  const targCx = useRef(tabCx(activeIdx));
  const rafId  = useRef(null);

  const tick = useCallback(() => {
    const diff = targCx.current - currCx.current;
    if (Math.abs(diff) < 0.5) {
      currCx.current = targCx.current;
      pathEl.current?.setAttribute('d', buildPillPath(currCx.current));
      return;
    }
    currCx.current += diff * 0.45; // Snappier sliding curve (was 0.25)
    pathEl.current?.setAttribute('d', buildPillPath(currCx.current));
    rafId.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    targCx.current = tabCx(activeIdx);
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [activeIdx, tick]);

  const go = (id) => { setCurrentTab(id); setIsMoreOpen(false); };
  const moreIsActive = isMoreOpen || moreTabs.some(mt => mt.id === currentTab);

  return (
    <>
      <div className="bnav-shell">
        <WindingTrail key={activeIdx} tabIndex={activeIdx} />
        
        <svg className="bnav-bg" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path ref={pathEl} d={buildPillPath(currCx.current)} 
            fill="var(--nav-color)" 
            stroke="var(--divider-color)" 
            strokeWidth="1.5" 
            style={{ opacity: 0.94 }}
          />
        </svg>

        <div className="bnav-row">
          {mainTabs.map((tab) => {
            const isActive = tab.id === currentTab && !isMoreOpen;
            return (
              <button key={tab.id} type="button" className={`bnav-item${isActive ? ' bnav-item--on' : ''}`} onClick={() => go(tab.id)}>
                <span className="bnav-circle">
                  {isActive && <TopoCircle />}
                  <span className="bnav-icon-inner">{tab.icon}</span>
                  {tab.badge > 0 && <span className="bnav-badge">{tab.badge}</span>}
                </span>
                <span className="bnav-lbl urdu-text">{tab.label}</span>
              </button>
            );
          })}

          <button type="button" className={`bnav-item${moreIsActive ? ' bnav-item--on' : ''}`} onClick={() => setIsMoreOpen(true)}>
            <span className="bnav-circle">
              {moreIsActive && <TopoCircle />}
              <span className="bnav-icon-inner"><MoreHorizontal /></span>
            </span>
            <span className="bnav-lbl urdu-text">{language === 'ur' ? 'مزید' : 'More'}</span>
          </button>
        </div>
      </div>

      {isMoreOpen && (
        <div className="more-drawer-overlay" onClick={() => setIsMoreOpen(false)}>
          <div className="more-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="urdu-text" style={{ margin: 0, color: 'var(--gold-color)' }}>
                {language === 'ur' ? 'مزید فیچرز' : 'More Features'}
              </h3>
              <button type="button" className="close-drawer-btn" onClick={() => setIsMoreOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="drawer-grid">
              {moreTabs.map((tab) => (
                <div key={tab.id} className={`drawer-item${currentTab === tab.id ? ' active' : ''}`} onClick={() => go(tab.id)}>
                  <div className="drawer-icon">{tab.icon}</div>
                  <span className="drawer-label urdu-text">{tab.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(BottomNavComponent);