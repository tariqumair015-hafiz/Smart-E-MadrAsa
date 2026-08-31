import React, { useState, useEffect, useRef } from 'react';
import { Copy, Share2, Trash2, Send, Search, BookOpen, Sparkles, ChevronDown, Zap, Mic, Volume2, RotateCw, ArrowLeft } from 'lucide-react';
import './AIChat.css';
import { supabase } from './supabaseClient';
import * as localforageModule from 'localforage';
const localforage = localforageModule.default || localforageModule;

// ── Config ────────────────────────────────────────────────
const GROQ_API_KEY = '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';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// ── Config ────────────────────────────────────────────────
const GROQ_API_KEY = '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';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCfQPS2TT54s6dx8HRxkThLg8ZceEQhrYI';

const SYSTEM_PROMPT = `Aap Smart e-Madarsa ke AI Islamic Scholar hain.

STRICT MANDATORY RULES FOR RAG RESPONSE:
1. Aapko sirf aur sirf neeche diye gaye "متعلقہ کتابوں سے اقتباسات" (Retrieved Book Context) ki roshni mein jawab dena hai.
2. Agar maangay gaye maslay ka jawab retrieved context mein maujood NAHI hai ya context khali hai, to STRICTLY bilkul saaf yeh alfaaz likhein:
"یہ مسئلہ ہماری دستیاب کتب میں تلاش نہیں ہو سکا۔"
3. Apni taraf se ya apni general AI knowledge se koi jawab hargiz na banayein.
4. Har jawab ke sath kitab ka naam (book_title) aur safha number (page_number) zaroor mention karein.
5. Arabic ayaat aur Ahadith ke text mein koi bhi English/Latin transliterated characters shamil na karein. Sirf pure Arabic script (Harakat ke sath) likhein.`;

// Expanded suggestions pool
const SUGGESTED_POOL = [
  { text: 'نماز کے مسائل', icon: '🕌' },
  { text: 'زکوٰۃ کا حکم',  icon: '💰' },
  { text: 'روزے کی اہمیت', icon: '🌙' },
  { text: 'توبہ کا طریقہ', icon: '🤲' },
  { text: 'حلال و حرام',  icon: '⚖️' },
  { text: 'والدین کے حقوق', icon: '👨‍👩‍👧' },
  { text: 'وضو کا طریقہ', icon: '💧' },
  { text: 'صدقہ کے فضائل', icon: '🤲' },
  { text: 'حقوق العباد', icon: '🤝' },
  { text: 'قرآن پڑھنے کی فضیلت', icon: '📖' },
  { text: 'حسد کا علاج', icon: '❤️' },
  { text: 'صبر کی اہمیت', icon: '⏳' },
  { text: 'سود کا گناہ', icon: '🚫' },
  { text: 'حج کے احکام', icon: '🕋' },
  { text: 'سچ بولنے کے فائدے', icon: '🗣️' },
  { text: 'دعاؤں کی قبولیت', icon: '✨' },
  { text: 'اخلاقِ حسنہ', icon: '🌸' },
  { text: 'علم کی اہمیت', icon: '📚' }
];

// ── Gemini embedding ──────────────────────────────────────
async function getEmbedding(text) {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    );
    const d = await res.json();
    return d?.embedding?.values || null;
  } catch (err) {
    console.error('getEmbedding error:', err);
    return null;
  }
}

// ── Supabase RAG search ───────────────────────────────────
async function searchBooks(question) {
  try {
    const embedding = await getEmbedding(question);
    if (!embedding) return [];
    const { data, error } = await supabase.rpc('search_books', {
      query_embedding: embedding,
      match_count: 5,
      match_threshold: 0.25,
    });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('searchBooks RPC error:', err);
    return [];
  }
}

// ── Build context from chunks ─────────────────────────────
function buildContext(chunks) {
  if (!chunks || !chunks.length) return '';
  return chunks
    .map(c => `[کتاب: ${c.book_title || 'نامعلوم'} | صفحہ: ${c.page_number}]\n${c.content}`)
    .join('\n\n---\n\n');
}

function formatMessage(content) {
  if (!content) return '';

  let parsed = content;
  
  // Escape HTML entities to prevent script injection
  parsed = parsed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold formatting
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Lists formatting
  parsed = parsed.split('\n').map(line => {
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return `• ${line.trim().substring(2)}`;
    }
    return line;
  }).join('<br />');

  return <span dangerouslySetInnerHTML={{ __html: parsed }} />;
}

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function AIChatPage({ onBookClick, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [ragMode, setRagMode] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested questions shuffler
  const [displayedSuggestions, setDisplayedSuggestions] = useState([]);
  
  // Speech-to-Text states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Text-to-Speech states
  const [activeTtsIndex, setActiveTtsIndex] = useState(null);
  const synthRef = useRef(window.speechSynthesis);

  // Shuffler Logic
  const shuffleSuggestions = () => {
    const shuffled = [...SUGGESTED_POOL].sort(() => 0.5 - Math.random());
    setDisplayedSuggestions(shuffled.slice(0, 6));
  };

  useEffect(() => {
    shuffleSuggestions();
  }, []);

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'ur-PK';
      rec.interimResults = false;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput(prev => (prev ? prev + ' ' : '') + transcript);
          // Focus textarea and adjust height
          if (inputRef.current) {
            inputRef.current.focus();
            setTimeout(() => {
              inputRef.current.style.height = 'auto';
              inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + 'px';
            }, 100);
          }
        }
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Stop Speech on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("معذرت، آپ کا براؤزر وائس ٹائپنگ کو سپورٹ نہیں کرتا۔ (Speech Recognition not supported)");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text, index) => {
    if (!synthRef.current) return;
    
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      if (activeTtsIndex === index) {
        setActiveTtsIndex(null);
        return;
      }
    }

    const cleanText = text.replace(/\*\*|\*|-/g, ''); // strip markdown markup
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synthRef.current.getVoices();
    const urduVoice = voices.find(v => v.lang.startsWith('ur'));
    if (urduVoice) utterance.voice = urduVoice;
    
    utterance.onstart = () => setActiveTtsIndex(index);
    utterance.onend = () => setActiveTtsIndex(null);
    utterance.onerror = () => setActiveTtsIndex(null);

    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_chat_v2');
      if (saved) setMessages(JSON.parse(saved));
    } catch { }
  }, []);

  useEffect(() => {
    if (messages.length > 0)
      localStorage.setItem('ai_chat_v2', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('ai_chat_v2');
    if (synthRef.current) synthRef.current.cancel();
  };

  const ts = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const copy = t => navigator.clipboard.writeText(t).catch(() => { });
  const share = t => navigator.share ? navigator.share({ text: t }).catch(() => { }) : copy(t);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || isLoading) return;

    // Stop speaking on new message
    if (synthRef.current) synthRef.current.cancel();

    const userMessage = { role: 'user', content: userMsg, time: ts() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    let chunks = [];
    let context = '';

    if (ragMode) {
      setIsSearching(true);
      chunks = await searchBooks(userMsg);
      context = buildContext(chunks);
      setIsSearching(false);
    }

    try {
      const history = updated.slice(-8).map(m => ({ role: m.role, content: m.content }));

      const systemWithContext = context
        ? `${SYSTEM_PROMPT}\n\nمتعلقہ کتابوں سے اقتباسات (Retrieved Book Context):\n${context}\n\nان اقتباسات کی روشنی میں جواب دیں اور کتاب کا نام اور صفحہ نمبر ضرور بتائیں۔`
        : `${SYSTEM_PROMPT}\n\nمتعلقہ کتابوں سے اقتباسات:\n(کوئی متعلقہ مواد نہیں ملا)\n\nSTRICT MANDATORY INSTRUCTION: Chunke koi context nahi mila, aapko BILKUL SAF SAF sirf yeh jawab dena hai:\n"یہ مسئلہ ہماری دستیاب کتب میں تلاش نہیں ہو سکا۔"`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemWithContext },
            ...history,
          ],
          max_tokens: 700,
        }),
      });

      if (!res.ok) throw new Error('API failed');

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || 'معذرت، جواب نہیں مل سکا۔';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        time: ts(),
        sources: chunks.length ? chunks : null,
      }]);
    } catch (err) {
      console.error("AI Chat API Execution Failure:", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'معذرت، دوبارہ کوشش کریں 🙏',
        time: ts(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="ai-chat-container">

      {/* ── HEADER ── */}
      <div className="ai-chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button 
              onClick={onBack} 
              className="header-btn" 
              style={{ marginRight: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="پیچھے جائیں (Back)"
            >
              <ArrowLeft size={16} color="#fff" />
            </button>
          )}
          <div className="ai-scholar-info">
          {/* Avatar with animated rings */}
          <div className="ai-avatar-wrap">
            <div className="ai-avatar">
              <img src="./app_icon.png" alt="AI Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div className="ai-avatar-ring" />
            <div className="ai-avatar-ring2" />
            <div className="online-dot" />
          </div>
          <div>
            <div className="ai-name">
              AI Islamic Scholar
              <span className="model-badge"><Zap size={8} />Llama 3.8B</span>
            </div>
            <div className="ai-status">
              {isSearching
                ? '📚 کتابوں میں تلاش جاری...'
                : isLoading
                  ? '⌛ سوچ رہا ہوں...'
                  : 'آن لائن • Smart e-Madarsa'}
              </div>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {/* RAG toggle */}
          <button
            onClick={() => setRagMode(p => !p)}
            className={`header-btn${ragMode ? ' rag-active' : ''}`}
            title={ragMode ? 'RAG on — kitab search active' : 'RAG off — direct AI'}
          >
            <BookOpen size={14} color={ragMode ? '#c9a84c' : '#555'} />
          </button>
          <button onClick={clearChat} className="header-btn" title="Chat saaf karein">
            <Trash2 size={14} color="#666" />
          </button>
        </div>
      </div>

      {/* RAG badge */}
      {ragMode && (
        <div className="rag-badge">
          <Sparkles size={10} />
          <span>کتاب سرچ موڈ فعال — 3,220+ کتابوں سے جواب</span>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="ai-chat-messages">

        {/* Welcome Screen */}
        {messages.length === 0 && (
          <div className="ai-welcome">
            {/* Animated Orb */}
            <div className="welcome-orb-wrap">
              <div className="welcome-orb-ring3" />
              <div className="welcome-orb-ring2" />
              <div className="welcome-orb-ring1" />
              <div className="welcome-orb">
                <img src="./app_icon.png" alt="AI Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
            </div>

            <div className="welcome-title">السلام علیکم!</div>
            <div className="welcome-sub">
              میں آپ کا AI Islamic Scholar ہوں{'\n'}
              {ragMode ? '3,220+ کتابوں سے جواب دوں گا۔' : 'کوئی بھی سوال پوچھیں۔'}
            </div>

            {/* ⚠️ Experimental/Notice Warning Note Card */}
            <div style={{
              margin: '16px 24px 8px 24px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04))',
              border: '1px dashed rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '1.6',
              direction: 'rtl',
              maxWidth: '340px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
            }} className="urdu-text">
              ⚠️ <strong>اہم نوٹ:</strong> سمارٹ AI ابھی مکمل طور پر کام نہیں کر رہا ہے، اس لیے براہِ مہربانی زیادہ سوال نہ پوچھیں کیونکہ اس پر کام ابھی جاری ہے۔
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-number">3,220+</span>
                <span className="stat-label">کتابیں</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">50+</span>
                <span className="stat-label">علماء</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">AI</span>
                <span className="stat-label">RAG Powered</span>
              </div>
            </div>

            {/* Suggestions Divider */}
            <div className="suggestions-divider">
              <div className="suggestions-divider-line" />
              <span className="suggestions-divider-text">تجویز کردہ سوالات</span>
              <button className="shuffle-btn" onClick={shuffleSuggestions} title="سوالات بدلیں">
                <RotateCw size={11} />
              </button>
              <div className="suggestions-divider-line" />
            </div>

            {/* Suggestion Grid */}
            <div className="ai-suggestions-grid">
              {displayedSuggestions.map((q, i) => (
                <button
                  key={i}
                  className="suggestion-card"
                  onClick={() => sendMessage(q.text)}
                >
                  <span className="suggestion-card-icon">{q.icon}</span>
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg-row ${msg.role === 'user' ? 'msg-user-row' : 'msg-ai-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="msg-ai-avatar">
                <img src="./app_icon.png" alt="AI Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
            )}

            <div className="msg-bubble-wrap">
              <div className={`msg-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}${msg.isError ? ' bubble-error' : ''}`}>
                
                {/* Styled Message text */}
                <p className="msg-text" dir="rtl">{formatMessage(msg.content)}</p>

                {/* Sources */}
                {msg.sources?.length > 0 && (
                  <SourcesPanel sources={msg.sources} onBookClick={onBookClick} />
                )}

                <div className="msg-footer">
                  <span className="msg-time">{msg.time}</span>
                  <div className="msg-actions">
                    {/* Speak Button */}
                    {msg.role === 'assistant' && !msg.isError && (
                      <button 
                        className={`speaker-btn${activeTtsIndex === i ? ' tts-active' : ''}`} 
                        onClick={() => speakText(msg.content, i)} 
                        title="سنیں (Listen)"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                    <button className="msg-action-btn" onClick={() => copy(msg.content)} title="Copy">
                      <Copy size={11} color="#888" />
                    </button>
                    {msg.role === 'assistant' && !msg.isError && (
                      <button className="msg-action-btn" onClick={() => share(msg.content)} title="Share">
                        <Share2 size={11} color="#888" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="msg-user-avatar">👤</div>
            )}
          </div>
        ))}

        {/* Loading */}
        {isLoading && (
          <div className="chat-msg-row msg-ai-row">
            <div className="msg-ai-avatar">
              <img src="./app_icon.png" alt="AI Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div className="msg-bubble-wrap">
              <div className="msg-bubble bubble-ai">
                {isSearching ? <SearchingIndicator /> : <TypingDots />}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div className="ai-input-bar">
        <div className="ai-input-wrap">
          {/* Microphone button */}
          <button 
            onClick={toggleListening} 
            className={`mic-btn${isListening ? ' mic-active' : ''}`}
            title={isListening ? 'بولna بند کریں (Stop Listening)' : 'بول کر لکھیں (Speak Urdu)'}
          >
            <Mic size={16} />
          </button>
          
          <textarea
            ref={inputRef}
            className="ai-input"
            dir="rtl"
            placeholder={isListening ? "بولیں، میں سن رہا ہوں..." : "سوال لکھیں... (Enter = بھیجیں، Shift+Enter = نئی لائن)"}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            disabled={isLoading || isListening}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || isListening || !input.trim()}
            className={`ai-send-btn${input.trim() && !isLoading ? ' btn-active' : ''}`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sources panel ─────────────────────────────────────────
function SourcesPanel({ sources, onBookClick }) {
  const [open, setOpen] = useState(true);
  const [loadingBookId, setLoadingBookId] = useState(null);

  const handleSourceClick = async (s) => {
    if (!onBookClick || loadingBookId) return;
    setLoadingBookId(s.book_id);
    try {
      const CACHE_KEY = 'cached_books_jsondata_v2';
      let allBooks = await localforage.getItem(CACHE_KEY) || [];
      if (!allBooks || allBooks.length === 0) {
        const res = await fetch('https://smart-e-madrasa.pakdigitalz.com/books_metadata.json');
        if (res.ok) allBooks = await res.json();
      }
      const data = (allBooks || []).find(b => String(b.id) === String(s.book_id));
      if (data) {
        onBookClick(data, s.page_number);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookId(null);
    }
  };

  return (
    <div className="sources-wrap">
      <button onClick={() => setOpen(p => !p)} className="sources-toggle">
        <BookOpen size={10} color="#c9a84c" />
        <span>{sources.length} کتابوں سے تصدیق شدہ حوالہ جات</span>
        <ChevronDown size={10} color="#c9a84c" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </button>
      {open && (
        <div className="sources-list">
          {sources.map((s, i) => (
            <div
              key={i}
              className="source-item"
              style={{ cursor: onBookClick ? 'pointer' : 'default' }}
              onClick={() => handleSourceClick(s)}
              title="کتاب میں اس صفحہ پر جانے کے لیے کلک کریں"
            >
              <div className="source-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={12} color="#c9a84c" />
                  <span className="source-book-name" style={{ fontWeight: 'bold' }}>{s.book_title || 'نامعلوم'}</span>
                </div>
                <span className="source-page" style={{ background: '#c9a84c', color: '#000', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                  {loadingBookId === s.book_id ? 'لوڈ ہو رہا ہے...' : `صفحہ ${s.page_number} کھولیں 📖`}
                </span>
              </div>
              <p className="source-excerpt" dir="rtl" style={{ marginTop: '6px', fontSize: '12px', opacity: 0.85 }}>{s.content?.slice(0, 150)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Typing Dots ───────────────────────────────────────────
function TypingDots() {
  return (
    <div className="typing-bubble">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

// ── Searching Indicator ───────────────────────────────────
function SearchingIndicator() {
  return (
    <div className="searching-indicator">
      <Search size={13} color="#c9a84c" style={{ animation: 'dotBounce 1.2s ease-in-out infinite' }} />
      <span>کتابوں میں تلاش جاری...</span>
    </div>
  );
}
