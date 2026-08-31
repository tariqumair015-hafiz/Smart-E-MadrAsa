import React from 'react';
import './AnimatedLogo.css';

const AnimatedLogo = ({ size = 64 }) => {
  return (
    <div className="animated-logo-container" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" className="premium-logo">
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a1f0a" />
            <stop offset="100%" stopColor="#0a0700" />
          </radialGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8e5a7" />
            <stop offset="25%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#b4831f" />
            <stop offset="75%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#f8e5a7" />
          </linearGradient>
          <linearGradient id="goldGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8a610f" />
          </linearGradient>
          <filter id="premiumGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Base dark circular background with soft glow */}
        <circle cx="80" cy="80" r="76" fill="url(#bgGlow)" stroke="url(#goldGradientDark)" strokeWidth="1" />

        {/* Very intricate slow rotating sunburst / rays */}
        <g className="spin-slow" stroke="url(#goldGradient)" strokeWidth="0.5" fill="none" opacity="0.25">
          {[...Array(36)].map((_, i) => (
             <line key={`ray-${i}`} x1="80" y1="4" x2="80" y2="156" transform={`rotate(${i * 10} 80 80)`} />
          ))}
          <circle cx="80" cy="80" r="70" />
          <circle cx="80" cy="80" r="66" strokeDasharray="2 3" strokeWidth="1" />
        </g>

        {/* Rub el Hizb (8-pointed Islamic geometrical star) - Static base */}
        <g fill="none" stroke="url(#goldGradient)" strokeWidth="1.5" opacity="0.9" filter="url(#subtleGlow)">
          <rect x="30" y="30" width="100" height="100" rx="3" />
          <rect x="30" y="30" width="100" height="100" rx="3" transform="rotate(45 80 80)" />
        </g>

        {/* Sub-layer intricate octagons */}
        <g fill="none" stroke="url(#goldGradientDark)" strokeWidth="1" opacity="0.6">
          <rect x="38" y="38" width="84" height="84" rx="2" />
          <rect x="38" y="38" width="84" height="84" rx="2" transform="rotate(45 80 80)" />
        </g>

        {/* Reverse fast spinning decorative dashed ring */}
        <g className="spin-reverse" stroke="url(#goldGradient)" fill="none" strokeWidth="2" filter="url(#subtleGlow)">
          <circle cx="80" cy="80" r="48" strokeDasharray="12 6 3 6" />
          <circle cx="80" cy="80" r="52" strokeWidth="0.5" opacity="0.5" />
        </g>

        {/* Central Mehrab (Arch) background */}
        <path d="M 52,95 L 52,65 Q 52,48 80,38 Q 108,48 108,65 L 108,95 Z" fill="#120c02" stroke="url(#goldGradient)" strokeWidth="1.5" filter="url(#premiumGlow)" />

        {/* Inner Mehrab glowing lines */}
        <path d="M 57,95 L 57,67 Q 57,53 80,45 Q 103,53 103,67 L 103,95 Z" fill="none" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.5" />

        {/* Rihal (Wooden Book stand) */}
        <g stroke="url(#goldGradientDark)" strokeWidth="2.5" strokeLinecap="round">
          {/* Stand crosses */}
          <line x1="62" y1="102" x2="98" y2="88" />
          <line x1="98" y1="102" x2="62" y2="88" />
          {/* Stand base legs */}
          <line x1="62" y1="102" x2="62" y2="108" strokeWidth="2" />
          <line x1="98" y1="102" x2="98" y2="108" strokeWidth="2" />
          {/* Tassel hanging down */}
          <path d="M 80,95 L 80,105 L 78,110 L 82,110 Z" fill="url(#goldGradientDark)" stroke="none" />
        </g>

        {/* Premium Open Book */}
        <g filter="url(#premiumGlow)">
          {/* Left Page block to give 3D depth */}
          <path d="M 80,85 Q 65,75 50,78 L 50,83 Q 65,80 80,90 Z" fill="#8a610f" />
          {/* Right Page block */}
          <path d="M 80,85 Q 95,75 110,78 L 110,83 Q 95,80 80,90 Z" fill="#8a610f" />

          {/* Left Page face */}
          <path d="M 80,85 Q 65,75 52,78 L 47,60 Q 65,56 80,70 Z" fill="#ebc875" />
          {/* Right Page face */}
          <path d="M 80,85 Q 95,75 108,78 L 113,60 Q 95,56 80,70 Z" fill="#fcf0c2" />
          
          {/* Spine Binding line and curve */}
          <line x1="80" y1="70" x2="80" y2="87" stroke="#684605" strokeWidth="2" strokeLinecap="round" />
          <path d="M 78,85 Q 80,88 82,85" stroke="url(#goldGradientDark)" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Detailed Golden Page text lines (Left) */}
          <path d="M 55,73 Q 65,68 76,75" fill="none" stroke="#a47214" strokeWidth="0.8" opacity="0.8" />
          <path d="M 53,68 Q 65,63 76,70" fill="none" stroke="#a47214" strokeWidth="0.8" opacity="0.8" />
          <path d="M 51,63 Q 65,58 76,65" fill="none" stroke="#a47214" strokeWidth="0.8" opacity="0.6" />
          
          {/* Detailed Golden Page text lines (Right) */}
          <path d="M 105,73 Q 95,68 84,75" fill="none" stroke="#a47214" strokeWidth="0.8" opacity="0.8" />
          <path d="M 107,68 Q 95,63 84,70" fill="none" stroke="#a47214" strokeWidth="0.8" opacity="0.8" />
          <path d="M 109,63 Q 95,58 84,65" fill="none" stroke="#a47214" strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* Elegant Arabic Calligraphy Placeholder - "اقرأ" (Iqra - Read) inside radiant burst above the book */}
        <g transform="translate(80, 52)" filter="url(#premiumGlow)">
          <circle cx="0" cy="-2" r="10" fill="#2a1f0a" opacity="0.6" />
          <text x="0" y="3" fontSize="16" fill="url(#goldGradient)" fontFamily="'Amiri', 'Scheherazade', serif" fontWeight="bold" textAnchor="middle">
            اقرأ
          </text>
        </g>

        {/* Floating Glowing Crescent and Star at the top peak of the Mehrab */}
        <g className="float-tilt" filter="url(#premiumGlow)">
          <path d="M 84,28 A 12,12 0 1,1 78,13 A 14,14 0 1,0 84,28 Z" fill="url(#goldGradient)" />
          {/* Multi-pointed 5-star */}
          <polygon points="88,16 90,21 95,21 91,24 93,29 88,26 83,29 85,24 81,21 86,21" fill="url(#goldGradient)" />
        </g>

        {/* Dynamic Multi-layered Floating Sparkles */}
        <g className="sparkle pulse-1" fill="url(#goldGradient)">
           {/* 4-point thick sparkle */}
           <polygon points="40,35 42,42 49,44 42,46 40,53 38,46 31,44 38,42" />
        </g>
        <g className="sparkle pulse-2" fill="url(#goldGradient)">
           <polygon points="120,40 121,44 125,45 121,46 120,50 119,46 115,45 119,44" />
        </g>
        <g className="sparkle pulse-3" fill="url(#goldGradient)">
           <polygon points="45,110 46,114 50,115 46,116 45,120 44,116 40,115 44,114" />
        </g>
        <g className="sparkle pulse-4" fill="url(#goldGradientDark)">
           <circle cx="120" cy="110" r="2" />
           <circle cx="40" cy="80" r="1.5" />
           <circle cx="122" cy="75" r="2.5" />
        </g>
        <g className="sparkle pulse-1" fill="url(#goldGradient)">
           <polygon points="115,100 117,106 123,108 117,110 115,116 113,110 107,108 113,106" />
        </g>

        {/* Enhanced Bottom Text Arc */}
        <g className="logo-text-group">
          <path id="curveBottom" d="M 20,120 Q 80,154 140,120" fill="transparent" />
          <text fontSize="9" fill="url(#goldGradient)" fontWeight="800" letterSpacing="1.5" filter="url(#subtleGlow)">
            <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
              SMART E-MADARSA
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
};

export default AnimatedLogo;
