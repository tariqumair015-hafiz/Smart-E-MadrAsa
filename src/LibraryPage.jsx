import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, FolderOpen } from 'lucide-react';
import './Library.css';

const LibraryPage = ({ onReadBook, onGoHome }) => {
  const [library, setLibrary] = useState([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = () => {
    const savedLibrary = localStorage.getItem('smart_library');
    if (savedLibrary) {
      try {
        let parsed = JSON.parse(savedLibrary);
        
        // --- Auto-fix: Remove corrupted books from cache ---
        const originalLength = parsed.length;
        parsed = parsed.filter(b => b.pdf_url && b.pdf_url !== '#' && b.pdf_url !== 'pending');
        
        if (parsed.length < originalLength) {
          localStorage.setItem('smart_library', JSON.stringify(parsed));
          console.log(`Auto-cleaned ${originalLength - parsed.length} cached books with broken URLs.`);
        }
        
        setLibrary(parsed);
      } catch (e) {
        console.error("Error parsing library data", e);
      }
    }
  };

  const removeBook = (e, bookId) => {
    e.stopPropagation();
    const currentLibString = localStorage.getItem('smart_library');
    if (currentLibString) {
      let currentLib = JSON.parse(currentLibString);
      currentLib = currentLib.filter(b => b.id !== bookId);
      localStorage.setItem('smart_library', JSON.stringify(currentLib));
      setLibrary(currentLib);
    }
  };

  // Generate a random emoji for books without a cover emoji saved
  const getEmoji = (book) => {
    if (book.cover_emoji) return book.cover_emoji;
    const emojis = ['📗', '📘', '📙', '🤍', '🕋', '📖'];
    return emojis[(book.id || 0) % emojis.length];
  };

  if (library.length === 0) {
    return (
      <div className="library-empty">
        <FolderOpen size={64} className="empty-icon" />
        <h2 className="urdu-text">Library خالی ہے</h2>
        <p>You haven't downloaded any books yet.</p>
        <button className="browse-btn" onClick={onGoHome}>
          Browse Books
        </button>
      </div>
    );
  }

  return (
    <div className="library-container">
      <h2 className="page-title">My Library ({library.length})</h2>
      
      <div className="books-list">
        {library.map((book) => {
          const progressPercentage = book.totalPages && book.lastPage
            ? Math.round((book.lastPage / book.totalPages) * 100)
            : (book.lastPage ? 10 : 0); // Fake progress if totalPages unknown

          return (
            <div key={book.id} className="book-card lib-card" onClick={() => onReadBook(book)}>
              <div className="book-cover">
                {getEmoji(book)}
              </div>
              <div className="book-info">
                <div className="lib-header">
                  <h3 className="book-title urdu-text">{book.title}</h3>
                  <button className="delete-btn" onClick={(e) => removeBook(e, book.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="book-author urdu-text">{book.author}</p>
                
                {/* Reading Progress */}
                <div className="progress-section">
                  <div className="progress-text-row">
                    <span className="progress-label">Reading Progress</span>
                    <span className="progress-percent gold-text">{progressPercentage}% Complete</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="book-actions lib-actions">
                  <button className="download-btn read-btn" onClick={(e) => { e.stopPropagation(); onReadBook(book); }}>
                    <BookOpen size={14} /> Continue Reading
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryPage;
