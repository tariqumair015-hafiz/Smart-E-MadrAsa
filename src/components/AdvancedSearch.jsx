import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, X, SlidersHorizontal, BookOpen, Download,
    Star, Sparkles, Grid3X3, List, ChevronDown, ChevronUp,
    Loader2, Bot, Filter, Tag, User, Gift, Zap
} from 'lucide-react';

// ─── Constants (same as App.jsx) ─────────────────────────────────────────────
const BOYS_CATEGORIES = [
    { label: 'درجہ اولیٰ', en: '1st Year' },
    { label: 'درجہ ثانیہ (2nd Year)', en: '2nd Year' },
    { label: 'درجہ ثالثہ', en: '3rd Year' },
    { label: 'درجہ رابعہ', en: '4th Year' },
    { label: 'درجہ خامسہ', en: '5th Year' },
    { label: 'درجہ سادسہ', en: '6th Year' },
    { label: 'درجہ سابعہ', en: '7th Year' },
    { label: 'دورہ حدیث', en: 'Daura Hadith (8th Year)' },
];
const GIRLS_CATEGORIES = [
    { label: 'ثانویہ خاصہ سال اول', en: 'Khasa Year 1' },
    { label: 'ثانویہ خاصہ سال دوم', en: 'Khasa Year 2' },
    { label: 'عالیہ بنات سال اول', en: 'Aliya Year 1' },
    { label: 'عالیہ بنات سال دوم', en: 'Aliya Year 2' },
    { label: 'عالمیہ بنات سال اول', en: 'Alamiyya Year 1' },
    { label: 'عالمیہ بنات سال دوم', en: 'Alamiyya Year 2' },
];
const EXTRA_CATEGORIES = [
    { label: 'قرآن مجید', en: 'Quran Majeed' },
    { label: 'تفسیر القرآن', en: 'Tafseer ul Quran' },
    { label: 'احادیث', en: 'Ahadith' },
    { label: 'فقہ و فتاویٰ', en: 'Fiqh & Fatawa' },
    { label: 'سیرت و تاریخ', en: 'Seerat & History' },
    { label: 'عقائد', en: 'Aqeedah' },
    { label: 'تصوف', en: 'Tasawwuf' },
    { label: 'نماز', en: 'Salah' },
    { label: 'زکوٰۃ', en: 'Zakat' },
    { label: 'حج و عمرہ', en: 'Hajj & Umrah' },
    { label: 'لغت', en: 'Dictionaries' },
    { label: 'متفرقات', en: 'Miscellaneous' },
];
const ALL_CATEGORIES = [...BOYS_CATEGORIES, ...GIRLS_CATEGORIES, ...EXTRA_CATEGORIES];

const isNewBook = (createdAt) => {
    if (!createdAt) return false;
    const diff = Math.ceil((Date.now() - new Date(createdAt)) / 86400000);
    return diff <= 15;
};

// ─── AI Masail Search (Anthropic API) ────────────────────────────────────────
async function callAIMasailSearch(masala, relevantBooks) {
    const bookContext = relevantBooks.slice(0, 12).map(b =>
        `کتاب: ${b.title}${b.author ? ' | مصنف: ' + b.author : ''}${b.category ? ' | موضوع: ' + b.category : ''}`
    ).join('\n');

    const prompt = `آپ ایک اسلامی عالم اور کتب خانے کے ماہر ہیں۔ صارف نے یہ مسئلہ پوچھا ہے:

"${masala}"

ہمارے کتب خانے میں یہ متعلقہ کتابیں موجود ہیں:
${bookContext}

براہ کرم:
1. اس مسئلے کا مختصر اور جامع جواب دیں (اردو میں)
2. بتائیں کہ کون سی کتابوں میں اس مسئلے کی تفصیل ملے گی
3. جواب کو واضح نکات میں لکھیں

جواب JSON فارمیٹ میں دیں:
{
  "jawab": "مسئلے کا جواب یہاں",
  "nakat": ["نکتہ 1", "نکتہ 2", "نکتہ 3"],
  "mutalliqaKutub": ["کتاب 1", "کتاب 2", "کتاب 3"]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    try {
        const clean = text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return { jawab: text, nakat: [], mutalliqaKutub: [] };
    }
}

// ─── Book Card (Grid) ─────────────────────────────────────────────────────────
function BookCardGrid({ book, onBookClick, highlighted }) {
    const [imgErr, setImgErr] = useState(false);
    const isNew = isNewBook(book.created_at);

    return (
        <div
            onClick={() => onBookClick && onBookClick(book)}
            style={{
                width: 110, flexShrink: 0, cursor: 'pointer',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: highlighted
                    ? '0 0 0 2px #d4af37, 0 8px 24px rgba(212,175,55,0.3)'
                    : '0 4px 12px rgba(0,0,0,0.25)',
                background: 'var(--card-color)',
                border: highlighted ? '1px solid #d4af37' : '1px solid var(--divider-color)',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
            }}
        >
            {isNew && (
                <div style={{ position: 'absolute', top: 5, left: 5, background: '#ef4444', color: '#fff', fontSize: 8, padding: '2px 6px', borderRadius: 4, zIndex: 10, fontWeight: 'bold' }}>NEW</div>
            )}
            {book.is_free && (
                <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(212,175,55,0.9)', color: '#0d2818', fontSize: 8, padding: '2px 6px', borderRadius: 4, zIndex: 10, fontWeight: 700 }}>FREE</div>
            )}
            {book.cover_url && !imgErr ? (
                <img src={book.cover_url} alt={book.title} onError={() => setImgErr(true)} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
            ) : (
                <div style={{ width: '100%', height: 140, background: 'linear-gradient(160deg,#064e3b,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={32} color="rgba(212,175,55,0.6)" />
                </div>
            )}
            <div style={{ padding: '8px' }}>
                <p className="urdu-text" style={{ color: 'var(--text-primary)', fontSize: 11, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</p>
                {book.author && <p className="urdu-text" style={{ color: 'var(--text-secondary)', fontSize: 10, margin: '4px 0 0', lineHeight: 1.3 }}>{/best\s*urdu\s*books(\.net)?/i.test(book.author) ? 'Smart E Madarsa' : book.author}</p>}
            </div>
        </div>
    );
}

// ─── Book Card (List) ─────────────────────────────────────────────────────────
function BookCardList({ book, onBookClick, highlighted }) {
    const [imgErr, setImgErr] = useState(false);
    const isNew = isNewBook(book.created_at);

    return (
        <div
            onClick={() => onBookClick && onBookClick(book)}
            style={{
                display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer',
                borderRadius: 14,
                background: highlighted ? 'rgba(212,175,55,0.08)' : 'var(--card-color)',
                border: highlighted ? '1px solid rgba(212,175,55,0.4)' : '1px solid var(--divider-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
                marginBottom: 10,
            }}
        >
            {book.cover_url && !imgErr ? (
                <img src={book.cover_url} alt={book.title} onError={() => setImgErr(true)} style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ) : (
                <div style={{ width: 60, height: 80, background: 'linear-gradient(160deg,#064e3b,#047857)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={20} color="rgba(212,175,55,0.6)" />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    {isNew && <span style={{ background: '#ef4444', color: '#fff', fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 'bold' }}>NEW</span>}
                    {book.is_free && <span style={{ background: 'rgba(212,175,55,0.9)', color: '#000', fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>FREE</span>}
                    {highlighted && <span style={{ background: 'rgba(212,175,55,0.2)', color: '#d4af37', fontSize: 8, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>✦ متعلقہ</span>}
                </div>
                <p className="urdu-text" style={{ color: 'var(--text-primary)', fontSize: 13, margin: '0 0 4px', lineHeight: 1.5, fontWeight: 600, direction: 'rtl' }}>{book.title}</p>
                {book.author && <p className="urdu-text" style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '0 0 6px', direction: 'rtl' }}>{/best\s*urdu\s*books(\.net)?/i.test(book.author) ? 'Smart E Madarsa' : book.author}</p>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {book.category && (
                        <span style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-color)', fontSize: 9, padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(212,175,55,0.2)' }} className="urdu-text">{book.category}</span>
                    )}
                    {book.rating > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#d4af37', fontSize: 10 }}>
                            <Star size={10} fill="currentColor" />{book.rating}
                        </span>
                    )}
                    {book.downloads > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text-secondary)', fontSize: 10 }}>
                            <Download size={10} />{book.downloads}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main AdvancedSearch Component ───────────────────────────────────────────
const AdvancedSearch = ({ books = [], language = 'ur', onBookClick }) => {
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false); // closed by default
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [aiMode, setAiMode] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiHighlighted, setAiHighlighted] = useState([]);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Click outside handler to close filters
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Filters state
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSubCat, setFilterSubCat] = useState('');
    const [filterAuthor, setFilterAuthor] = useState('');
    const [filterFree, setFilterFree] = useState(false);
    const [filterNew, setFilterNew] = useState(false);

    const hasActiveFilters = filterCategory || filterSubCat || filterAuthor || filterFree || filterNew;
    const activeFilterCount = [filterCategory, filterSubCat, filterAuthor, filterFree, filterNew].filter(Boolean).length;

    // Unique authors from books
    const uniqueAuthors = [...new Set(books.map(b => b.author).filter(Boolean))].sort();
    const uniqueSubCats = [...new Set(books.map(b => b.sub_category).filter(Boolean))].sort();

    // ── Filter books ──────────────────────────────────────────────────────────
    const filteredBooks = useCallback(() => {
        let result = books;
        const term = query.toLowerCase().trim();

        if (term) {
            result = result.filter(b =>
                (b.title || '').toLowerCase().includes(term) ||
                (b.author || '').toLowerCase().includes(term) ||
                (b.category || '').toLowerCase().includes(term) ||
                (b.sub_category || '').toLowerCase().includes(term)
            );
        }
        if (filterCategory) result = result.filter(b => b.category === filterCategory);
        if (filterSubCat) result = result.filter(b => b.sub_category === filterSubCat);
        if (filterAuthor) result = result.filter(b => b.author === filterAuthor);
        if (filterFree) result = result.filter(b => b.is_free);
        if (filterNew) result = result.filter(b => isNewBook(b.created_at));

        return result;
    }, [books, query, filterCategory, filterSubCat, filterAuthor, filterFree, filterNew]);

    const results = filteredBooks();
    const hasQuery = query.trim().length > 0 || hasActiveFilters;

    // ── AI Masail Search ──────────────────────────────────────────────────────
    const handleAISearch = async () => {
        if (!query.trim() || aiLoading) return;
        setAiLoading(true);
        setAiResult(null);
        setAiHighlighted([]);

        // Find relevant books by keyword match
        const term = query.toLowerCase();
        const relevant = books.filter(b =>
            (b.title || '').toLowerCase().includes(term) ||
            (b.category || '').toLowerCase().includes(term) ||
            (b.author || '').toLowerCase().includes(term)
        );

        // If no keyword match, send top fiqh/hadith books
        const toSend = relevant.length > 0 ? relevant : books.filter(b =>
            ['فقہ', 'احادیث', 'قرآن', 'نماز'].some(k => (b.category || '').includes(k))
        ).slice(0, 12);

        try {
            const result = await callAIMasailSearch(query, toSend);
            setAiResult(result);
            // Highlight books mentioned in AI response
            const mentioned = (result.mutalliqaKutub || []);
            const highlightedIds = books
                .filter(b => mentioned.some(title => (b.title || '').includes(title) || title.includes(b.title || '')))
                .map(b => b.id);
            setAiHighlighted(highlightedIds);
        } catch (err) {
            setAiResult({ jawab: 'معذرت، جواب حاصل نہیں ہو سکا۔ دوبارہ کوشش کریں۔', nakat: [], mutalliqaKutub: [] });
        }
        setAiLoading(false);
    };

    const clearAll = () => {
        setQuery('');
        setFilterCategory('');
        setFilterSubCat('');
        setFilterAuthor('');
        setFilterFree(false);
        setFilterNew(false);
        setAiResult(null);
        setAiHighlighted([]);
        setShowFilters(false);
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const pillBtn = (active) => ({
        padding: '6px 14px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontWeight: 600,
        background: active ? 'var(--gold-color)' : 'rgba(212,175,55,0.08)',
        color: active ? '#000' : 'var(--gold-color)',
        border: active ? 'none' : '1px solid rgba(212,175,55,0.25)',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 4,
    });

    const selectStyle = {
        background: 'var(--card-color)',
        color: 'var(--text-primary)',
        border: '1px solid var(--divider-color)',
        borderRadius: 10, padding: '8px 12px', fontSize: 12,
        width: '100%', maxWidth: '100%', outline: 'none', appearance: 'none',
        WebkitAppearance: 'none', fontFamily: 'inherit',
        direction: 'rtl', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>

            {/* ── Search Bar ───────────────────────────────────────────────────── */}
            <div style={{ padding: '0 16px', marginBottom: showFilters ? 0 : 8 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--card-color)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: showFilters ? '14px 14px 0 0' : 14,
                    padding: '10px 14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    transition: 'border-radius 0.2s',
                }}>
                    <Search size={16} color="#d4af37" style={{ flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setAiResult(null); }}
                        onKeyDown={e => { if (e.key === 'Enter' && aiMode) handleAISearch(); }}
                        onFocus={() => setShowFilters(true)}
                        placeholder={language === 'ur'
                            ? aiMode ? 'مسئلہ لکھیں جیسے: غسل کی سنتیں...' : 'کتاب / مصنف / موضوع تلاش کریں...'
                            : aiMode ? 'Write a masla e.g. Sunnat of Ghusl...' : 'Search book / author / topic...'}
                        className="urdu-text"
                        style={{
                            flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text-primary)', fontSize: 13, direction: 'rtl',
                        }}
                    />
                    {/* Clear */}
                    {(query || hasActiveFilters) && (
                        <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                            <X size={14} color="var(--text-secondary)" />
                        </button>
                    )}
                    {/* AI toggle */}
                    <button
                        onClick={() => { setAiMode(m => !m); setAiResult(null); }}
                        title={language === 'ur' ? 'AI مسائل سرچ' : 'AI Masail Search'}
                        style={{
                            ...pillBtn(aiMode),
                            padding: '4px 10px', fontSize: 10,
                        }}
                    >
                        <Bot size={12} />
                        {language === 'ur' ? 'AI' : 'AI'}
                    </button>
                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4 }}
                    >
                        <SlidersHorizontal size={18} color={hasActiveFilters ? '#d4af37' : 'var(--text-secondary)'} />
                        {activeFilterCount > 0 && (
                            <span style={{ position: 'absolute', top: -2, right: -2, background: '#d4af37', color: '#000', fontSize: 8, width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {/* View toggle */}
                    <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        {viewMode === 'grid'
                            ? <List size={18} color="var(--text-secondary)" />
                            : <Grid3X3 size={18} color="var(--text-secondary)" />}
                    </button>
                </div>

                {/* ── AI Search Button ──────────────────────────────────────────── */}
                {aiMode && (
                    <button
                        onClick={handleAISearch}
                        disabled={!query.trim() || aiLoading}
                        style={{
                            marginTop: 8, width: '100%', padding: '10px', borderRadius: 12,
                            background: (!query.trim() || aiLoading)
                                ? 'rgba(212,175,55,0.15)'
                                : 'linear-gradient(135deg, #d4af37, #b4831f)',
                            color: (!query.trim() || aiLoading) ? 'var(--text-secondary)' : '#000',
                            border: 'none', fontWeight: 'bold', fontSize: 13, cursor: (!query.trim() || aiLoading) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s',
                        }}
                        className="urdu-text"
                    >
                        {aiLoading
                            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {language === 'ur' ? 'جواب ڈھونڈا جا رہا ہے...' : 'Searching...'}</>
                            : <><Sparkles size={14} /> {language === 'ur' ? 'AI سے جواب لیں' : 'Get AI Answer'}</>}
                    </button>
                )}

                {/* ── Filters Panel (Dropdown) ──────────────────────────────────── */}
                {showFilters && (
                    <div style={{
                        background: 'var(--card-color)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderTop: 'none',
                        borderRadius: '0 0 14px 14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        animation: 'slideDown 0.2s ease',
                        width: '100%',
                        boxSizing: 'border-box',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: '70vh',
                    }}>
                        {/* Quick toggles */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => setFilterFree(f => !f)} style={pillBtn(filterFree)}>
                                <Gift size={11} />
                                {language === 'ur' ? 'مفت کتب' : 'Free Only'}
                            </button>
                            <button onClick={() => setFilterNew(f => !f)} style={pillBtn(filterNew)}>
                                <Zap size={11} />
                                {language === 'ur' ? 'نئی کتابیں' : 'New Books'}
                            </button>
                        </div>

                        {/* Category select */}
                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <Tag size={12} color="#d4af37" />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }} className="urdu-text">
                                    {language === 'ur' ? 'زمرہ (Category)' : 'Category'}
                                </span>
                            </div>
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
                                <option value="">{language === 'ur' ? '— تمام زمرے —' : '— All Categories —'}</option>
                                <optgroup label={language === 'ur' ? 'بنین (Boys)' : 'Boys'}>
                                    {BOYS_CATEGORIES.map(c => <option key={c.label} value={c.label}>{language === 'ur' ? c.label : c.en}</option>)}
                                </optgroup>
                                <optgroup label={language === 'ur' ? 'بنات (Girls)' : 'Girls'}>
                                    {GIRLS_CATEGORIES.map(c => <option key={c.label} value={c.label}>{language === 'ur' ? c.label : c.en}</option>)}
                                </optgroup>
                                <optgroup label={language === 'ur' ? 'متفرق کتب' : 'General'}>
                                    {EXTRA_CATEGORIES.map(c => <option key={c.label} value={c.label}>{language === 'ur' ? c.label : c.en}</option>)}
                                </optgroup>
                            </select>
                        </div>

                        {/* Sub-category select */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <Filter size={12} color="#d4af37" />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }} className="urdu-text">
                                    {language === 'ur' ? 'ذیلی زمرہ (Sub-Category)' : 'Sub-Category'}
                                </span>
                            </div>
                            <select value={filterSubCat} onChange={e => setFilterSubCat(e.target.value)} style={selectStyle}>
                                <option value="">{language === 'ur' ? '— تمام —' : '— All —'}</option>
                                {uniqueSubCats.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Author select */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <User size={12} color="#d4af37" />
                                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }} className="urdu-text">
                                    {language === 'ur' ? 'مصنف (Author)' : 'Author'}
                                </span>
                            </div>
                            <select value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)} style={selectStyle}>
                                <option value="">{language === 'ur' ? '— تمام مصنفین —' : '— All Authors —'}</option>
                                {uniqueAuthors.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        {/* Clear filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={() => { setFilterCategory(''); setFilterSubCat(''); setFilterAuthor(''); setFilterFree(false); setFilterNew(false); }}
                                style={{ ...pillBtn(false), justifyContent: 'center', padding: '8px' }}
                            >
                                <X size={12} />
                                {language === 'ur' ? 'تمام فلٹر ہٹائیں' : 'Clear All Filters'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── AI Result Panel ───────────────────────────────────────────────── */}
            {aiResult && (
                <div style={{ margin: '0 16px 16px', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)', animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', padding: '14px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <Bot size={16} color="#d4af37" />
                            <span style={{ color: '#d4af37', fontSize: 13, fontWeight: 'bold' }} className="urdu-text">
                                {language === 'ur' ? 'AI کا جواب' : 'AI Answer'}
                            </span>
                        </div>
                        <p className="urdu-text" style={{ color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.8, margin: 0, direction: 'rtl' }}>
                            {aiResult.jawab}
                        </p>
                    </div>
                    {aiResult.nakat?.length > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                            <p style={{ color: '#d4af37', fontSize: 11, margin: '0 0 8px', fontWeight: 'bold' }} className="urdu-text">📌 {language === 'ur' ? 'اہم نکات' : 'Key Points'}</p>
                            {aiResult.nakat.map((n, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, direction: 'rtl' }}>
                                    <span style={{ color: '#d4af37', fontSize: 11 }}>•</span>
                                    <p className="urdu-text" style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{n}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {aiResult.mutalliqaKutub?.length > 0 && (
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px 16px' }}>
                            <p style={{ color: '#d4af37', fontSize: 11, margin: '0 0 8px', fontWeight: 'bold' }} className="urdu-text">📚 {language === 'ur' ? 'متعلقہ کتابیں' : 'Relevant Books'}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {aiResult.mutalliqaKutub.map((k, i) => (
                                    <span key={i} className="urdu-text" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-color)', fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.25)' }}>
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Results ───────────────────────────────────────────────────────── */}
            {hasQuery && (
                <div style={{ padding: '0 16px' }}>
                    {/* Result count + sort */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 11 }} className="urdu-text">
                            {language === 'ur' ? `${results.length} کتابیں ملیں` : `${results.length} books found`}
                        </span>
                        {aiHighlighted.length > 0 && (
                            <span style={{ color: '#d4af37', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }} className="urdu-text">
                                <Sparkles size={10} />
                                {language === 'ur' ? 'سنہری = AI متعلقہ' : 'Gold = AI Relevant'}
                            </span>
                        )}
                    </div>

                    {results.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <Search size={32} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: 12 }} />
                            <p className="urdu-text" style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
                                {language === 'ur' ? 'کوئی کتاب نہیں ملی' : 'No books found'}
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                            {results.map(book => (
                                <BookCardGrid
                                    key={book.id}
                                    book={book}
                                    onBookClick={onBookClick}
                                    highlighted={aiHighlighted.includes(book.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div>
                            {/* AI-highlighted books first in list view */}
                            {aiHighlighted.length > 0 && results.some(b => aiHighlighted.includes(b.id)) && (
                                <>
                                    <p className="urdu-text" style={{ color: '#d4af37', fontSize: 11, marginBottom: 8, fontWeight: 'bold' }}>
                                        <Sparkles size={11} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                                        {language === 'ur' ? 'AI کی تجویز کردہ کتابیں' : 'AI Recommended Books'}
                                    </p>
                                    {results.filter(b => aiHighlighted.includes(b.id)).map(book => (
                                        <BookCardList key={`ai-${book.id}`} book={book} onBookClick={onBookClick} highlighted={true} />
                                    ))}
                                    {results.some(b => !aiHighlighted.includes(b.id)) && (
                                        <p className="urdu-text" style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '12px 0 8px', fontWeight: 'bold' }}>
                                            {language === 'ur' ? 'دیگر نتائج' : 'Other Results'}
                                        </p>
                                    )}
                                </>
                            )}
                            {results.filter(b => !aiHighlighted.includes(b.id)).map(book => (
                                <BookCardList key={book.id} book={book} onBookClick={onBookClick} highlighted={false} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes spin      { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default AdvancedSearch;
