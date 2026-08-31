import React from 'react';

const GoldGradient = ({ id, active }) => (
  <defs>
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={active ? "#1a1a1a" : "#f8e5a7"} />
      <stop offset="25%" stopColor={active ? "#333333" : "#d4af37"} />
      <stop offset="50%" stopColor={active ? "#000000" : "#b4831f"} />
      <stop offset="75%" stopColor={active ? "#333333" : "#d4af37"} />
      <stop offset="100%" stopColor={active ? "#1a1a1a" : "#f8e5a7"} />
    </linearGradient>
    <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
);

export const DarsVipIcon = ({ size = 24, active = false }) => {
  const gradientId = `gold-dars-${active ? 'active' : 'inactive'}`;
  const strokeColor = active ? "rgba(0,0,0,0.6)" : `url(#${gradientId})`;
  const fillColor = active ? "#1a1200" : `url(#${gradientId})`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <GoldGradient id={gradientId} active={active} />
      {/* Rehal (Book Stand) */}
      <path d="M12 48L32 40L52 48" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 40V56" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
      <path d="M20 56H44" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
      
      {/* Open Book */}
      <path d="M32 36C24 28 12 30 12 30V14C12 14 24 12 32 20C40 12 52 14 52 14V30C52 30 40 28 32 36Z" fill={fillColor} filter={active ? "" : `url(#glow-${gradientId})`} />
      <path d="M32 20V36" stroke={active ? "#d4af37" : "#5d4037"} strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Sparkles */}
      {!active && (
        <>
          <circle cx="10" cy="15" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="54" cy="20" r="1" fill={`url(#${gradientId})`} />
          <circle cx="32" cy="10" r="2" fill={`url(#${gradientId})`} />
        </>
      )}
    </svg>
  );
};

export const MutafarriqVipIcon = ({ size = 24, active = false }) => {
  const gradientId = `gold-mutafarriq-${active ? 'active' : 'inactive'}`;
  const fillColor = active ? "#1a1200" : `url(#${gradientId})`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <GoldGradient id={gradientId} active={active} />
      {/* Stacked Books */}
      <rect x="14" y="38" width="36" height="10" rx="2" fill={fillColor} filter={active ? "" : `url(#glow-${gradientId})`} />
      <rect x="18" y="28" width="28" height="8" rx="2" fill={fillColor} opacity="0.8" />
      <rect x="22" y="20" width="20" height="6" rx="2" fill={fillColor} opacity="0.6" />
      
      {/* Side binding details */}
      <line x1="18" y1="38" x2="18" y2="48" stroke={active ? "#d4af37" : "#5d4037"} strokeWidth="1" />
      <line x1="22" y1="28" x2="22" y2="36" stroke={active ? "#d4af37" : "#5d4037"} strokeWidth="1" />
      
      {/* Magic/Stars */}
      <path d="M48 15L50 20L55 22L50 24L48 29L46 24L41 22L46 20L48 15Z" fill={fillColor} filter={active ? "" : `url(#glow-${gradientId})`} />
      {!active && (
        <>
          <circle cx="12" cy="25" r="1.5" fill={`url(#${gradientId})`} />
          <circle cx="55" cy="40" r="1" fill={`url(#${gradientId})`} />
        </>
      )}
    </svg>
  );
};
