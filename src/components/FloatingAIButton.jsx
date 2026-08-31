import React, { useState, useRef, useEffect, useCallback } from 'react';
import AnimatedLogo from './AnimatedLogo';

const GOLD = '#d4af37';
const WIDTH = 64; 
const HEIGHT = 76; // Taller for Mehrab shape

export default function FloatingAIButton({ onOpen, visible = true }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [pulse, setPulse] = useState(true);
  const dragStart = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const snapToEdge = useCallback((x) => {
    const screenW = window.innerWidth;
    const mid = screenW / 2;
    return x + WIDTH / 2 < mid ? 12 : screenW - WIDTH - 12;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (hasMoved) {
        setPos(prev => {
          const screenW = window.innerWidth;
          const mid = screenW / 2;
          const newX = prev.x + WIDTH / 2 < mid ? 12 : screenW - WIDTH - 12;
          const newY = Math.max(80, Math.min(window.innerHeight - HEIGHT - 80, prev.y));
          return { x: newX, y: newY };
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasMoved]);

  const onTouchStart = useCallback((e) => {
    if (!btnRef.current) return;
    const t = e.touches[0];
    const rect = btnRef.current.getBoundingClientRect();
    dragStart.current = { clientX: t.clientX, clientY: t.clientY, posX: rect.left, posY: rect.top };
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.clientX;
    const dy = t.clientY - dragStart.current.clientY;
    
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setHasMoved(true);
    }
    
    const newX = Math.max(0, Math.min(window.innerWidth - WIDTH, dragStart.current.posX + dx));
    const newY = Math.max(80, Math.min(window.innerHeight - HEIGHT - 80, dragStart.current.posY + dy));
    setPos({ x: newX, y: newY });
    
    if (e.cancelable) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (hasMoved) {
      setPos(prev => ({ x: snapToEdge(prev.x), y: prev.y }));
    }
    dragStart.current = null;
  }, [hasMoved, snapToEdge]);

  const onMouseDown = useCallback((e) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    dragStart.current = { clientX: e.clientX, clientY: e.clientY, posX: rect.left, posY: rect.top };
    setIsDragging(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.clientX;
      const dy = e.clientY - dragStart.current.clientY;
      
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setHasMoved(true);
      }
      
      const newX = Math.max(0, Math.min(window.innerWidth - WIDTH, dragStart.current.posX + dx));
      const newY = Math.max(80, Math.min(window.innerHeight - HEIGHT - 80, dragStart.current.posY + dy));
      setPos({ x: newX, y: newY });
    };
    const onMouseUp = () => {
      setIsDragging(false);
      if (hasMoved) {
        setPos(prev => ({ x: snapToEdge(prev.x), y: prev.y }));
      }
      dragStart.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, hasMoved, snapToEdge]);

  const handleClick = useCallback(() => {
    if (!hasMoved) onOpen();
  }, [hasMoved, onOpen]);

  if (!visible) return null;

  return (
    <div
      ref={btnRef}
      id="floating-ai-btn"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onClick={handleClick}
      style={{
        position: 'fixed',
        width: WIDTH,
        height: HEIGHT,
        zIndex: 99998,
        cursor: isDragging ? 'grabbing' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'left 0.35s cubic-bezier(0.34,1.56,0.64,1), top 0.1s, right 0.35s, bottom 0.35s',
        ...(hasMoved ? {
          left: pos.x,
          top: pos.y,
        } : {
          right: 18,
          bottom: 90,
        })
      }}
    >
      {/* Pulse ring (Mehrab shape) */}
      {pulse && (
        <div style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '35px 35px 12px 12px',
          border: `2px solid ${GOLD}`,
          opacity: 0,
          animation: 'fab-pulse 1.8s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Main button (Mehrab shape) */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '35px 35px 12px 12px',
        background: `radial-gradient(circle at 50% 30%, #15221b, #050a07)`,
        border: `2.5px solid ${GOLD}`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 16px ${GOLD}33`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        position: 'relative',
        paddingTop: 4,
      }}>
        {/* Animated Logo inside Mehrab */}
        <div style={{
          width: 52,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <AnimatedLogo size={46} />
        </div>

        {/* Small Golden Glowing AI badge at the bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(212,175,55,0.2), rgba(0,0,0,0.8))',
          borderTop: '1px solid rgba(212,175,55,0.3)',
          padding: '2px 0 3px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            color: GOLD,
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: 1.5,
            fontFamily: 'Arial, sans-serif',
            textShadow: `0 0 4px ${GOLD}`,
          }}>AI CHAT</span>
        </div>

        {/* Shimmer */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '40%',
          height: '200%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          transform: 'rotate(25deg)',
          animation: 'fab-shimmer 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      </div>

      <style>{`
        @keyframes fab-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
        @keyframes fab-shimmer {
          0%   { left: -80%; }
          60%  { left: 140%; }
          100% { left: 140%; }
        }
      `}</style>
    </div>
  );
}
