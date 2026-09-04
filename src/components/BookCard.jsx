import React, { useState } from 'react';
import { BookOpen, Download, Star } from 'lucide-react';
import PdfCoverImage from './PdfCoverImage';

const BookCard = ({ book, onBookClick }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div
            onClick={() => onBookClick && onBookClick(book)}
            style={{
                minWidth: '130px',
                maxWidth: '130px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0,
            }}
        >
            {/* Cover */}
            <div style={{
                width: '130px',
                height: '175px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(212,175,55,0.2)',
                background: 'linear-gradient(145deg, #1a3a2a, #0d2018)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            }}>
                <PdfCoverImage
                    book={book}
                    alt={book.title}
                    onError={() => setImgError(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />

                {/* Free badge */}
                {book.is_free && (
                    <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(212,175,55,0.9)',
                        color: '#0d2818',
                        fontSize: '9px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '6px',
                    }}>
                        FREE
                    </div>
                )}
            </div>

            {/* Title */}
            <p style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontFamily: "'Amiri', serif",
                direction: 'rtl',
                textAlign: 'right',
            }}>
                {book.title}
            </p>

            {/* Author */}
            {book.author && (
                <p style={{
                    margin: 0,
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    fontFamily: "'Amiri', serif",
                    direction: 'rtl',
                    textAlign: 'right',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {/best\s*urdu\s*books(\.net)?/i.test(book.author) ? 'Smart E Madarsa' : book.author}
                </p>
            )}

            {/* Rating + Downloads */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            }}>
                {book.rating > 0 && (
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '10px',
                        color: 'var(--gold-color)',
                    }}>
                        <Star size={10} fill="currentColor" />
                        {book.rating}
                    </span>
                )}
                {book.downloads > 0 && (
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                    }}>
                        <Download size={10} />
                        {book.downloads}
                    </span>
                )}
            </div>
        </div>
    );
};

export default BookCard;