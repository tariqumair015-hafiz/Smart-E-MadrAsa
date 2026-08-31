import React, { useState, useEffect } from 'react';
import * as localforageModule from 'localforage';
const localforage = localforageModule.default || localforageModule;
import { Trash2, BookOpen, Download, AlertCircle, Search } from 'lucide-react';
import './App.css';
import DownloadCard from './components/DownloadCard';
import { useDownload } from './DownloadContext';

const Library = ({ language, onBookClick, books }) => {
  const [downloadedBooks, setDownloadedBooks] = useState([]);
  const { activeDownloads, pauseDownload, resumeDownload, cancelDownload } = useDownload();
  
  const downloadingBooks = Object.entries(activeDownloads || {})
    .filter(([_, data]) => data.status === 'downloading' || data.status === 'paused')
    .map(([id, data]) => ({ id, ...data }));

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const pdfStore = localforage.createInstance({
    name: 'SmartEMadarsa',
    storeName: 'offline_books'
  });

  useEffect(() => {
    fetchDownloadedBooks();
  }, []);

  const fetchDownloadedBooks = async () => {
    setLoading(true);
    try {
      const metaStore = localforage.createInstance({
        name: 'SmartEMadarsa',
        storeName: 'books_metadata'
      });
      
      const keys = await metaStore.keys();
      const list = [];
      
      for (const key of keys) {
        if (key.startsWith('meta_')) {
          const metadata = await metaStore.getItem(key);
          if (metadata) {
            list.push(metadata);
          }
        }
      }
      
      setDownloadedBooks(list);
    } catch (err) {
      console.error("Error fetching library", err);
    } finally {
      setLoading(false);
    }
  };

  const isUr = language === 'ur';

  return (
    <div className="library-container" style={{ padding: '20px', paddingBottom: '100px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="urdu-text" style={{ color: 'var(--gold-color)', margin: 0 }}>
          {isUr ? 'آپ کی لائبریری' : 'Your Library'}
        </h2>
        <div style={{ background: 'rgba(212,175,55,0.1)', padding: '4px 12px', borderRadius: '20px', color: 'var(--gold-color)', fontSize: '12px', fontWeight: 'bold' }}>
          {downloadedBooks.length} {isUr ? 'کتابیں' : 'Books'}
        </div>
      </div>

      {/* Downloading books progress cards */}
      {downloadingBooks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {downloadingBooks.map(item => (
            <DownloadCard
              key={item.id}
              coverUrl={item.cover_url}
              title={item.title}
              author={item.author}
              progress={item.progress}
              status={item.status}
              onPause={() => pauseDownload(item.id)}
              onResume={() => resumeDownload(item.id)}
              onCancel={() => cancelDownload(item.id)}
            />
          ))}
        </div>
      )}

      {downloadedBooks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', opacity: 0.5 }}>
          <Download size={48} color="var(--gold-color)" style={{ marginBottom: '16px' }} />
          <p className="urdu-text" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
            {isUr ? 'آپ کی لائبریری خالی ہے۔' : 'Your library is empty.'}
          </p>
          <p className="urdu-text" style={{ fontSize: '12px', color: '#888' }}>
            {isUr ? 'مطالعہ کے لیے کتابیں ڈاؤنلوڈ کریں۔' : 'Download books to read them offline.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {downloadedBooks.map(item => (
            <div 
              key={item.id}
              onClick={() => onBookClick(item)}
              style={{
                background: 'var(--card-color)', borderRadius: '16px', padding: '12px',
                border: '1px solid var(--divider-color)', display: 'flex', alignItems: 'center', gap: '14px',
                cursor: 'pointer', transition: 'transform 0.2s active',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
              }}
            >
              {/* Specialized Cover Thumbnail */}
              <div style={{ 
                width: '64px', height: '90px', borderRadius: '10px',
                overflow: 'hidden', flexShrink: 0, 
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.title} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1a2a3a, #101820)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={24} color="rgba(255,255,255,0.3)" />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 className="urdu-text" style={{ color: 'var(--text-primary)', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{item.title}</h4>
                <p className="urdu-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>{item.author}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold-color)', borderRadius: '10px', fontWeight: 'bold' }}>
                    {item.volumes?.length || 1} {isUr ? 'جلدیں' : 'Volumes'}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: '10px', fontWeight: 'bold' }}>
                    {isUr ? 'آف لائن' : 'Offline'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-color)' }}>
                  <BookOpen size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
