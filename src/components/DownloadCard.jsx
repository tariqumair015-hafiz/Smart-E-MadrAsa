import React from "react";
import styles from "./DownloadCard.module.css";
import { Pause, Play, X } from "lucide-react";

export default function DownloadCard({ coverUrl, title, author, progress, status = 'downloading', onPause, onResume, onCancel }) {
  const displayProgress = progress !== undefined ? progress : 0;

  return (
    <div className={styles.card} aria-label={`Downloading ${title}`}>
      <div className={styles.coverWrapper}>
        {coverUrl ? (
          <img src={coverUrl} alt={`${title} cover`} className={styles.cover} />
        ) : (
          <div className={styles.placeholderCover}>
             <span>📖</span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        <div className={styles.author}>{author}</div>
        
        {/* Zig-zag progress bar */}
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={displayProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${displayProgress}%`, background: status === 'paused' ? '#3b82f6' : undefined }}
          />
          <span className={styles.percentLabel}>
            {status === 'paused' ? 'Paused' : `${Math.round(displayProgress)}%`}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          {status === 'downloading' && onPause && (
            <button
              onClick={onPause}
              style={{
                flex: 1, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid #3b82f6',
                borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer'
              }}
            >
              <Pause size={12} /> Pause
            </button>
          )}
          {status === 'paused' && onResume && (
            <button
              onClick={onResume}
              style={{
                flex: 1, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid #22c55e',
                borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer'
              }}
            >
              <Play size={12} /> Resume
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444',
                borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer'
              }}
            >
              <X size={12} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
