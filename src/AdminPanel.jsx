import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as localforageModule from 'localforage';
const localforage = localforageModule.default || localforageModule;
import { Upload, Image as ImageIcon, FileText, CheckCircle, Trash2, Loader2, Database, Pencil, Save, X, TrendingUp, Layers, MessageSquare, BookOpen } from 'lucide-react';
import BookRequestsTab from './components/BookRequestsTab';
import './AdminPanel.css';

const UserUploadsTab = ({ books, categories, onUpdate }) => {
  const [approvingId, setApprovingId] = useState(null);
  const [subCategory, setSubCategory] = useState('');
  const [customSubCategory, setCustomSubCategory] = useState('');
  const [editBookId, setEditBookId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', category: '' });

  const handleApprove = async (book) => {
    setApprovingId(book.id);
    const finalSubCategory = subCategory === 'custom' ? customSubCategory : subCategory;
    
    const { error } = await supabase.from('Books').update({
      sub_category: finalSubCategory,
      title: editBookId === book.id ? editForm.title : book.title,
      author: editBookId === book.id ? editForm.author : book.author,
      category: editBookId === book.id ? editForm.category : book.category,
    }).match({ id: book.id });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setEditBookId(null);
      onUpdate();
    }
    setApprovingId(null);
  };

  const handleDelete = async (id, coverUrl, pdfUrl) => {
    if (!window.confirm('کیا آپ واقعی یہ کتاب مسترد اور حذف کرنا چاہتے ہیں؟ (Are you sure you want to reject and delete this book?)')) return;
    const { error } = await supabase.from('Books').delete().match({ id });
    if (!error) {
      try {
        if (coverUrl && coverUrl.includes('books-covers/')) {
          const path = coverUrl.split('books-covers/')[1];
          await supabase.storage.from('books-covers').remove([path]);
        }
        if (pdfUrl && pdfUrl.includes('books-pdfs/')) {
          const path = pdfUrl.split('books-pdfs/')[1];
          await supabase.storage.from('books-pdfs').remove([path]);
        }
      } catch (e) {
        console.error("Storage cleanup failed", e);
      }
      onUpdate();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
      <h3 className="urdu-text" style={{ color: 'var(--gold-color)', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>👤 صارفین کی اپلوڈ کردہ کتابیں (User Uploaded Books)</h3>
      
      {books.length === 0 ? (
        <p className="urdu-text" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', fontSize: '14px' }}>کوئی بھی نئی کتاب منظوری کے لیے پینڈنگ نہیں ہے۔</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {books.map(book => (
            <div key={book.id} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '80px', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {book.cover_url ? (
                  <img src={book.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: '#222' }}>📚</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {editBookId === book.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input className="admin-input urdu-text" placeholder="کتاب کا نام" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ padding: '6px 12px', fontSize: '13px', margin: 0 }} />
                    <input className="admin-input urdu-text" placeholder="مصنف" value={editForm.author} onChange={e => setEditForm({...editForm, author: e.target.value})} style={{ padding: '6px 12px', fontSize: '13px', margin: 0 }} />
                    <select className="admin-input urdu-text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ padding: '6px 12px', fontSize: '13px', margin: 0 }}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <h4 className="urdu-text" style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{book.title}</h4>
                    <p className="urdu-text" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>مصنف: {book.author}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                      <span className="admin-badge">{book.category}</span>
                      <a href={book.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--gold-color)', textDecoration: 'underline' }}>View PDF (فائل دیکھیں)</a>
                    </div>
                  </>
                )}

                {/* Approval inputs */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <label className="urdu-text" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ذیلی کیٹیگری (Sub-Category) منتخب کریں:</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select 
                      className="admin-input urdu-text" 
                      value={subCategory} 
                      onChange={e => setSubCategory(e.target.value)}
                      style={{ padding: '8px', fontSize: '13px', margin: 0, flex: 1, minWidth: '150px' }}
                    >
                      <option value="">کوئی ذیلی کیٹیگری نہیں (None)</option>
                      <option value="درسی کتب">درسی کتب</option>
                      <option value="اردو شروحات">اردو شروحات</option>
                      <option value="عربی شروحات">عربی شروحات</option>
                      <option value="منتخب">منتخب کتب (Featured)</option>
                      <option value="custom">کسٹم لکھیں (Custom...)</option>
                    </select>
                    
                    {subCategory === 'custom' && (
                      <input 
                        type="text" 
                        className="admin-input urdu-text" 
                        placeholder="کسٹم سب کیٹیگری لکھیں..." 
                        value={customSubCategory} 
                        onChange={e => setCustomSubCategory(e.target.value)}
                        style={{ padding: '8px', fontSize: '13px', margin: 0, flex: 1 }}
                      />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleApprove(book)}
                    disabled={approvingId === book.id}
                    style={{ flex: 1, minWidth: '160px', background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    className="urdu-text"
                  >
                    {approvingId === book.id ? 'منظور کیا جا رہا ہے...' : '✅ منظور اور پبلش کریں'}
                  </button>

                  {editBookId !== book.id ? (
                    <button 
                      onClick={() => { setEditBookId(book.id); setEditForm({ title: book.title, author: book.author, category: book.category }); }}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                      className="urdu-text"
                    >
                      ✏️ ترمیم (Edit)
                    </button>
                  ) : (
                    <button 
                      onClick={() => setEditBookId(null)}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                      className="urdu-text"
                    >
                      منسوخ (Cancel)
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(book.id, book.cover_url, book.pdf_url)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                    className="urdu-text"
                  >
                    ❌ مسترد (Reject)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalBooks: 0,
    pendingBooks: 0,
    unresolvedRequests: 0,
    topDownloaded: []
  });

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('قرآن');
  const [pages, setPages] = useState('');
  const [isFree, setIsFree] = useState(true);
  
  // File State
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  
  // Upload State
  const [uploadMode, setUploadMode] = useState('single'); // 'single', 'bulk', 'folder'
  const [uploadStep, setUploadStep] = useState(''); // '', 'cover', 'pdf', 'data', 'done'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Books List
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Bulk / Folder Queue State
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Edit State
  const [editingBook, setEditingBook] = useState(null); // book id being edited
  const [editForm, setEditForm] = useState({ title: '', author: '', category: '', cover_url: '', pdf_url: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [dbSearchTerm, setDbSearchTerm] = useState('');
  const [dbPage, setDbPage] = useState(0);
  const [dbCategory, setDbCategory] = useState('all');
  const PAGE_SIZE = 50;

  const categories = [
    'قرآن', 'حدیث', 'فقہ', 'سیرت', 'تفسیر',
    'تجوید', 'عقیدہ', 'نحو', 'صرف', 'لغات', 'امتحانی پرچے', 'متفرق', 'علمائے کرام'
  ];

  const startEdit = (book) => {
    setEditingBook(book.id);
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      category: book.category || '',
      cover_url: book.cover_url || '',
      pdf_url: book.pdf_url || ''
    });
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setEditForm({ title: '', author: '', category: '', cover_url: '', pdf_url: '' });
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    const { error } = await supabase.from('Books').update({
      title: editForm.title,
      author: editForm.author,
      category: editForm.category,
      cover_url: editForm.cover_url,
      pdf_url: editForm.pdf_url
    }).match({ id: editingBook });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setEditingBook(null);
      fetchBooks();
    }
    setSavingEdit(false);
  };

  const handleEditCoverUpload = async (e, bookId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSavingEdit(true);
    try {
      const coverPath = `covers/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage
        .from('books-covers')
        .upload(coverPath, file);
        
      if (error) throw error;
      
      const coverUrl = supabase.storage
        .from('books-covers')
        .getPublicUrl(coverPath).data.publicUrl;
        
      // Delete old cover from storage if it exists
      if (editForm.cover_url && editForm.cover_url.includes('books-covers/')) {
        const oldPath = editForm.cover_url.split('books-covers/')[1];
        await supabase.storage.from('books-covers').remove([oldPath]);
      }
      
      setEditForm(prev => ({ ...prev, cover_url: coverUrl }));
      alert('Cover uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Cover upload failed: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditPdfUpload = async (e, bookId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSavingEdit(true);
    try {
      const pdfPath = `pdfs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage
        .from('books-pdfs')
        .upload(pdfPath, file);
        
      if (error) throw error;
      
      const pdfUrl = supabase.storage
        .from('books-pdfs')
        .getPublicUrl(pdfPath).data.publicUrl;
        
      // Delete old pdf from storage if it exists
      if (editForm.pdf_url && editForm.pdf_url.includes('books-pdfs/')) {
        const oldPath = editForm.pdf_url.split('books-pdfs/')[1];
        await supabase.storage.from('books-pdfs').remove([oldPath]);
      }
      
      setEditForm(prev => ({ ...prev, pdf_url: pdfUrl }));
      alert('PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('PDF upload failed: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ---------------- AUTO-PROCESSING UTILITIES ---------------- */
  const guessCategory = (filename, folderName = '') => {
    const lowerStr = `${filename} ${folderName}`.toLowerCase();
    const map = {
      'quran': 'قرآن', 'قرآن': 'قرآن', 'qurani': 'قرآن',
      'tafsir': 'تفسیر', 'تفسیر': 'تفسیر', 'kathir': 'تفسیر', 'jalalayn': 'تفسیر',
      'hadith': 'حدیث', 'حدیث': 'حدیث', 'bukhari': 'حدیث', 'muslim': 'حدیث', 'tirmizi': 'حدیث', 'doraehadith': 'حدیث',
      'fiqh': 'فقہ', 'فقہ': 'فقہ', 'fatawa': 'فقہ',
      'seerat': 'سیرت', 'سیرت': 'سیرت', 'prophet': 'سیرت',
      'tajweed': 'تجوید', 'تجوید': 'تجوید',
      'aqeedah': 'عقیدہ', 'عقیدہ': 'عقیدہ', 'tawheed': 'عقیدہ',
      'nahw': 'نحو', 'نحو': 'نحو', 'arabic': 'نحو',
      'sarf': 'صرف', 'صرف': 'صرف',
      'tasawwuf': 'تصوف', 'تصوف': 'تصوف',
      'lughat': 'لغات', 'لغات': 'لغات', 'dictionary': 'لغات', 'qamoos': 'لغات',
      'papers': 'امتحانی پرچے', 'past papers': 'امتحانی پرچے', 'wifaq': 'امتحانی پرچے'
    };
    for (const [key, value] of Object.entries(map)) {
      if (lowerStr.includes(key)) return value;
    }
    return 'متفرق';
  };

  const cleanTitle = (filename) => {
    let name = filename.replace(/\.[^/.]+$/, ""); // Remove extension
    name = name.replace(/[-_()]/g, " "); // Replace separators
    return name.replace(/\b\w/g, l => l.toUpperCase()).trim();
  };

  const handleBulkSelect = (e, isFolder = false) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newQueue = files.filter(f => f.type === 'application/pdf').map((file) => {
      // For folder upload, webkitRelativePath contains "FolderName/Subfolder/file.pdf"
      const folderPath = file.webkitRelativePath || '';
      const parts = folderPath.split('/');
      const folderName = parts.length > 1 ? parts[0] : '';
      
      return {
        id: Math.random().toString(36).substring(7),
        file,
        title: cleanTitle(file.name),
        author: 'نامعلوم (Unknown)',
        category: guessCategory(file.name, folderName),
        folderName,
        status: 'pending', // pending, uploading, success, error
        progress: 0,
        errorMsg: ''
      };
    });

    setUploadQueue(prev => [...prev, ...newQueue]);
    
    // Clear input to allow selecting same files/folder again if needed
    e.target.value = null;
  };

  const chunkArray = (array, size) => {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
      chunked_arr.push(array.slice(i, i + size));
    }
    return chunked_arr;
  };

  const processUploadQueue = async () => {
    const pendingItems = uploadQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;
    
    setIsBatchUploading(true);
    setBatchProgress(prev => ({ ...prev, total: uploadQueue.length }));

    // Mark pending as uploading visually
    setUploadQueue(prev => prev.map(item => item.status === 'pending' ? { ...item, status: 'uploading' } : item));

    const chunks = chunkArray(pendingItems, 3); // Max 3 concurrent uploads
    let completedCount = uploadQueue.filter(item => item.status === 'success' || item.status === 'error').length;

    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (item) => {
        try {
          // 1. Upload PDF
          const pdfPath = `pdfs/${Date.now()}_${item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage
            .from('books-pdfs')
            .upload(pdfPath, item.file);

          if (uploadError) throw uploadError;

          const pdfUrl = supabase.storage
            .from('books-pdfs')
            .getPublicUrl(pdfPath).data.publicUrl;

          // 2. Insert DB Record
          const { error: dbError } = await supabase.from('Books').insert([{
            title: item.title,
            author: item.author,
            category: item.category,
            cover_url: '', // Empty cover for bulk docs initially
            pdf_url: pdfUrl,
            pages: 0, 
            is_free: true,
            downloads: 0,
            rating: 0
          }]);

          if (dbError) throw dbError;

          // Success
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success', progress: 100 } : q));
        } catch (error) {
          console.error("Batch item error", error);
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', errorMsg: error.message } : q));
        } finally {
          completedCount++;
          setBatchProgress({ current: completedCount, total: uploadQueue.length });
        }
      }));
    }

    setIsBatchUploading(false);
    fetchBooks(dbPage, dbSearchTerm, dbCategory);
    fetchStats();
  };

  const removeQueueItem = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const updateQueueItem = (id, field, value) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  /* --------------------------------------------------------- */

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data }) => {
        const session = data?.session;
        setIsAuthenticated(!!session);
        if (session) {
          fetchStats();
        }
      }).catch(err => console.warn("Supabase auth session check warning:", err));

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
        if (session) {
          fetchStats();
        } else {
          setBooks([]);
        }
      });
      const subscription = data?.subscription;

      return () => { if (subscription) subscription.unsubscribe(); };
    } catch (e) {
      console.warn("Supabase auth listener setup warning:", e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const delayDebounceFn = setTimeout(() => {
        fetchBooks(dbPage, dbSearchTerm, dbCategory);
      }, dbSearchTerm ? 300 : 0);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [dbPage, dbSearchTerm, dbCategory, isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message === 'Invalid login credentials' ? 'غلط ای میل یا پاس ورڈ' : error.message);
      } else {
        setDbPage(0);
        fetchStats();
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const fetchStats = async () => {
    try {
      const CACHE_KEY = 'cached_books_jsondata_v2';
      let fetchedBooks = await localforage.getItem(CACHE_KEY) || [];
      if (!fetchedBooks || fetchedBooks.length === 0) {
        try {
          const res = await fetch('https://smart-e-madrasa.pakdigitalz.com/books_metadata.json?v=' + Date.now());
          if (res.ok) fetchedBooks = await res.json();
        } catch (err) {
          console.warn("Cloudflare stats fetch failed:", err);
        }
      }

      const approvedCount = (fetchedBooks || []).filter(b => b.sub_category !== 'pending_approval' && b.sub_category !== 'pending').length;
      const pendingCount = (fetchedBooks || []).filter(b => b.sub_category === 'pending_approval' || b.sub_category === 'pending').length;

      let requestsCount = 0;
      try {
        const { count } = await supabase
          .from('BookRequests')
          .select('*', { count: 'exact', head: true })
          .eq('resolved', false);
        requestsCount = count || 0;
      } catch (e) {}

      const topDownloaded = [...(fetchedBooks || [])]
        .filter(b => b.sub_category !== 'pending_approval' && b.sub_category !== 'pending')
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 5)
        .map(b => ({ title: b.title, downloads: b.downloads || 0 }));

      setStats({
        totalBooks: approvedCount,
        pendingBooks: pendingCount,
        unresolvedRequests: requestsCount,
        topDownloaded: topDownloaded
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchBooks = async (page = 0, search = '', categoryFilter = 'all') => {
    setLoadingBooks(true);
    const from = page * PAGE_SIZE;
    
    try {
      const CACHE_KEY = 'cached_books_jsondata_v2';
      let fetchedBooks = await localforage.getItem(CACHE_KEY) || [];
      if (!fetchedBooks || fetchedBooks.length === 0) {
        const res = await fetch('https://smart-e-madrasa.pakdigitalz.com/books_metadata.json?v=' + Date.now());
        if (res.ok) {
          fetchedBooks = await res.json();
          await localforage.setItem(CACHE_KEY, fetchedBooks);
        }
      }
      
      let filtered = (fetchedBooks || []).filter(b => b.sub_category !== 'pending_approval');
      
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(b => b.category === categoryFilter);
      }
      
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter(b => 
          (b.title && b.title.toLowerCase().includes(s)) ||
          (b.author && b.author.toLowerCase().includes(s))
        );
      }
      
      filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
      const pagedData = filtered.slice(from, from + PAGE_SIZE);
      setBooks(pagedData);
    } catch (e) {
      console.error("Error fetching admin books:", e);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleDelete = async (id, coverUrl, pdfUrl) => {
    if (!window.confirm('کیا آپ واقعی یہ کتاب حذف کرنا چاہتے ہیں؟ (Are you sure you want to delete this book?)')) return;
    
    // First delete from DB
    const { error } = await supabase.from('Books').delete().match({ id });
    
    if (!error) {
      // Optional: Delete files from storage
      // If we extract path from URL we can delete from bucket
      try {
        if (coverUrl && coverUrl.includes('books-covers/')) {
          const path = coverUrl.split('books-covers/')[1];
          await supabase.storage.from('books-covers').remove([path]);
        }
        if (pdfUrl && pdfUrl.includes('books-pdfs/')) {
          const path = pdfUrl.split('books-pdfs/')[1];
          await supabase.storage.from('books-pdfs').remove([path]);
        }
      } catch (e) {
        console.error("Storage cleanup failed", e);
      }
      
      fetchBooks(dbPage, dbSearchTerm, dbCategory);
      fetchStats();
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !author || !pages) {
      alert("براہ کرم تمام بنیادی معلومات فراہم کریں۔ (Provide all basic info)");
      return;
    }

    if (!coverFile || !pdfFile) {
      alert("براہ کرم Cover Image اور PDF File دونوں منتخب کریں۔ (Provide both Cover and PDF)");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload Cover
      setUploadStep('cover'); // "📸 Cover upload ہو رہی ہے..."
      
      // Simulate progress for smooth UI (Supabase standard JS client doesn't return nice progress events easily)
      const coverProgressInterval = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
      
      const coverPath = `covers/${Date.now()}_${coverFile.name}`;
      const coverUpload = await supabase.storage
        .from('books-covers')
        .upload(coverPath, coverFile);
        
      clearInterval(coverProgressInterval);
      setUploadProgress(100);
      
      if (coverUpload.error) throw coverUpload.error;

      const coverUrl = supabase.storage
        .from('books-covers')
        .getPublicUrl(coverPath).data.publicUrl;

      // 2. Upload PDF
      setTimeout(() => {
        setUploadStep('pdf'); // "📄 PDF upload ہو رہی ہے..."
        setUploadProgress(0);
      }, 500);
      
      // small delay to let UI text update
      await new Promise(r => setTimeout(r, 600));

      const pdfProgressInterval = setInterval(() => setUploadProgress(p => Math.min(p + 5, 95)), 300);

      const pdfPath = `pdfs/${Date.now()}_${pdfFile.name}`;
      const pdfUpload = await supabase.storage
        .from('books-pdfs')
        .upload(pdfPath, pdfFile);
        
      clearInterval(pdfProgressInterval);
      setUploadProgress(100);

      if (pdfUpload.error) throw pdfUpload.error;

      const pdfUrl = supabase.storage
        .from('books-pdfs')
        .getPublicUrl(pdfPath).data.publicUrl;

      // 3. Save Data to Database
      setTimeout(() => {
        setUploadStep('data'); // "💾 Data save ہو رہا ہے..."
      }, 500);
      
      await new Promise(r => setTimeout(r, 600));

      const { error: insertError } = await supabase.from('Books').insert([{
        title, 
        author, 
        category,
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        pages: parseInt(pages, 10),
        is_free: isFree,
        downloads: 0,
        rating: 0
      }]);

      if (insertError) throw insertError;

      // 4. Success
      setUploadStep('done'); // "✅ Book successfully publish ہوگئی!"
      
      // Reset form
      setTimeout(() => {
        setTitle('');
        setAuthor('');
        setCategory('قرآن');
        setPages('');
        setIsFree(true);
        setCoverFile(null);
        setCoverPreview(null);
        setPdfFile(null);
        setUploadStep('');
        setUploadProgress(0);
        setIsUploading(false);
        fetchBooks(dbPage, dbSearchTerm, dbCategory);
        fetchStats();
      }, 3000);

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const getStepText = () => {
    switch(uploadStep) {
      case 'cover': return '📸 Cover upload ہو رہی ہے...';
      case 'pdf': return '📄 PDF upload ہو رہی ہے...';
      case 'data': return '💾 Data save ہو رہا ہے...';
      case 'done': return '✅ Book successfully publish ہوگئی!';
      default: return '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h2 style={{ color: 'var(--gold-color)', marginBottom: '20px' }}>Admin Access</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="email" 
              placeholder="Email..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              required
              autoFocus
            />
            <input 
              type="password" 
              placeholder="Password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              required
            />
            {authError && <p className="error-text urdu-text" style={{ margin: '4px 0', color: '#ef4444', fontSize: '13px' }}>{authError}</p>}
            <button type="submit" className="admin-btn" style={{ background: 'linear-gradient(135deg, #d4af37, #b4831f)', color: '#000', fontWeight: 'bold' }}>Enter کریں</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-header">
        <h2 className="admin-title urdu-text">📤 Book Upload کریں</h2>
        <button className="logout-btn" onClick={logout}>Exit</button>
      </header>

      {/* 📊 Dashboard Stats */}
      <div style={{
        margin: '0 0 24px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        animation: 'fadeIn 0.5s ease'
      }}>
        {/* Stat 1: Total Books */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.02))',
          border: '1px solid rgba(212,175,55,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #d4af37, #b4831f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(212,175,55,0.2)'
          }}>
            <BookOpen size={20} color="#000" />
          </div>
          <div>
            <p className="urdu-text" style={{ margin: 0, fontSize: '11px', color: '#a0aec0' }}>كل کتابیں (Total Books)</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{stats.totalBooks}</h3>
          </div>
        </div>

        {/* Stat 2: Pending Approval */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(246,173,85,0.12), rgba(246,173,85,0.02))',
          border: '1px solid rgba(246,173,85,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f6ad55, #dd6b20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(246,173,85,0.2)'
          }}>
            <Layers size={20} color="#000" />
          </div>
          <div>
            <p className="urdu-text" style={{ margin: 0, fontSize: '11px', color: '#a0aec0' }}>منظوری کا انتظار (Pending Approval)</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{stats.pendingBooks}</h3>
          </div>
        </div>

        {/* Stat 3: Unresolved Requests */}
        <div style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(72,187,120,0.12), rgba(72,187,120,0.02))',
          border: '1px solid rgba(72,187,120,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #48bb78, #38a169)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(72,187,120,0.2)'
          }}>
            <MessageSquare size={20} color="#000" />
          </div>
          <div>
            <p className="urdu-text" style={{ margin: 0, fontSize: '11px', color: '#a0aec0' }}>درخواستیں (Pending Requests)</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{stats.unresolvedRequests}</h3>
          </div>
        </div>

        {/* Stat 4: Top Downloaded */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(66,153,225,0.12), rgba(66,153,225,0.02))',
          border: '1px solid rgba(66,153,225,0.2)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '88px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <TrendingUp size={14} style={{ color: '#4299e1' }} />
            <span className="urdu-text" style={{ fontSize: '10px', color: '#a0aec0', fontWeight: 'bold' }}>زیادہ ڈاؤنلوڈ (Top Downloads)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {stats.topDownloaded.slice(0, 2).map((book, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#e2e8f0' }}>
                <span className="urdu-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{book.title}</span>
                <span style={{ color: '#4299e1', fontWeight: 'bold' }}>{book.downloads} ⬇️</span>
              </div>
            ))}
            {stats.topDownloaded.length === 0 && (
              <span style={{ fontSize: '10px', color: '#718096' }}>No downloads recorded</span>
            )}
          </div>
        </div>
      </div>

      <div className="admin-mode-tabs">
        <button className={`mode-tab ${uploadMode === 'single' ? 'active' : ''}`} onClick={() => setUploadMode('single')}>📄 Single</button>
        <button className={`mode-tab ${uploadMode === 'bulk' ? 'active' : ''}`} onClick={() => setUploadMode('bulk')}>📚 Bulk</button>
        <button className={`mode-tab ${uploadMode === 'folder' ? 'active' : ''}`} onClick={() => setUploadMode('folder')}>📁 Folder</button>
        <button className={`mode-tab ${uploadMode === 'user_uploads' ? 'active' : ''}`} onClick={() => setUploadMode('user_uploads')}>👤 User Uploads</button>
      </div>

      <div className="admin-content">
        {uploadMode === 'user_uploads' && (
          <UserUploadsTab 
            books={books.filter(b => b.sub_category === 'pending_approval')}
            categories={categories}
            onUpdate={fetchBooks}
          />
        )}
        {uploadMode === 'single' && (
          <form className="upload-form" onSubmit={handleSubmit}>
            {/* Main Info */}
            <div className="form-group">
              <label className="urdu-text">کتاب کا نام (Title)</label>
            <input 
              type="text" 
              className="admin-input urdu-text" 
              dir="rtl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="urdu-text">مصنف (Author)</label>
            <input 
              type="text" 
              className="admin-input urdu-text" 
              dir="rtl"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Category</label>
              <select 
                className="admin-input urdu-text" 
                dir="rtl"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group half">
              <label className="urdu-text">صفحات (Pages)</label>
              <input 
                type="number" 
                className="admin-input" 
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Access Type</label>
            <div className="toggle-switch-container" onClick={() => setIsFree(!isFree)}>
              <span className={`toggle-label ${isFree ? 'active' : ''}`}>Free</span>
              <div className={`toggle-track ${!isFree ? 'paid' : ''}`}>
                <div className="toggle-thumb"></div>
              </div>
              <span className={`toggle-label ${!isFree ? 'active paid-text' : ''}`}>Paid</span>
            </div>
          </div>

          {/* Files */}
          <div className="file-upload-section">
            <div className="upload-box cover-upload" onClick={() => document.getElementById('cover-input').click()}>
              {coverPreview ? (
                <div className="preview-container">
                  <img src={coverPreview} alt="Cover Preview" className="cover-preview" />
                  <div className="upload-overlay">
                    <ImageIcon size={24} />
                    <span>Change Cover</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <ImageIcon size={32} className="gold-text" />
                  <span className="urdu-text mt-2">Cover Image Upload کریں</span>
                </div>
              )}
              <input 
                type="file" 
                id="cover-input" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={handleCoverSelect}
              />
              {uploadStep === 'cover' && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>

            <div className="upload-box pdf-upload" onClick={() => document.getElementById('pdf-input').click()}>
              <div className="upload-placeholder">
                <FileText size={32} className="gold-text" />
                <span className="urdu-text mt-2">
                  {pdfFile ? pdfFile.name : 'PDF File Upload کریں'}
                </span>
                {pdfFile && <span className="file-size">{(pdfFile.size / (1024*1024)).toFixed(2)} MB</span>}
              </div>
              <input 
                type="file" 
                id="pdf-input" 
                accept=".pdf" 
                style={{ display: 'none' }}
                onChange={handlePdfSelect}
              />
              {uploadStep === 'pdf' && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
          </div>

          {/* Status Text & Submit */}
          {uploadStep && (
            <div className={`upload-status-text urdu-text ${uploadStep === 'done' ? 'success' : ''}`}>
              {uploadStep !== 'done' && <Loader2 size={16} className="spin" />}
              {uploadStep === 'done' && <CheckCircle size={16} />}
              {getStepText()}
              {uploadStep !== 'done' && uploadStep !== 'data' && ` (${uploadProgress}%)`}
            </div>
          )}

            <button 
              type="submit" 
              className="publish-btn"
              disabled={isUploading}
            >
              {isUploading ? 'Publishing...' : '🚀 Publish کریں'}
            </button>
          </form>
        )}

        {uploadMode !== 'single' && (
          <div className="upload-form batch-mode">
            
            {/* Folder Mode / Bulk Mode specialized drag and drop area */}
            <div className="upload-box pdf-upload batch-upload-zone" style={{padding: '40px'}} onClick={() => document.getElementById('batch-input').click()}>
              <div className="upload-placeholder">
                <FileText size={48} className="gold-text" />
                <span className="urdu-text mt-2" style={{fontSize: '18px', display: 'block'}}>
                  {uploadMode === 'folder' ? '📁 فولڈر منتخب کریں (Select Folder)' : '📚 فائلیں چنیں (Select PDFs)'}
                </span>
                <span className="file-size">click یہاں کلک کریں</span>
              </div>
              <input 
                type="file" 
                id="batch-input" 
                accept=".pdf" 
                multiple
                webkitdirectory={uploadMode === 'folder' ? "true" : undefined}
                style={{ display: 'none' }}
                onChange={(e) => handleBulkSelect(e, uploadMode === 'folder')}
              />
            </div>

            {/* Queue List UI */}
            {uploadQueue.length > 0 && (
              <div className="batch-queue-container" style={{marginTop: '24px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <h3 className="urdu-text" style={{color: 'var(--gold-color)', margin: 0}}>کتابوں کی فہرست ({uploadQueue.length})</h3>
                  {uploadQueue.length > 0 && (
                    <button 
                      className="logout-btn" 
                      onClick={() => setUploadQueue([])}
                      disabled={isBatchUploading}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="queue-list" style={{maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {uploadQueue.map(item => (
                    <div key={item.id} className="queue-item" style={{
                      display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', 
                      padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                      opacity: item.status === 'success' ? 0.6 : 1
                    }}>
                      <div className="queue-icon">
                        {item.status === 'pending' && <FileText size={20} color="var(--text-secondary)" />}
                        {item.status === 'uploading' && <Loader2 size={20} className="spin gold-text" />}
                        {item.status === 'success' && <CheckCircle size={20} color="#4ade80" />}
                        {item.status === 'error' && <Trash2 size={20} color="#ef4444" />}
                      </div>
                      
                      <div className="queue-inputs" style={{flex: 1, display: 'flex', gap: '8px'}}>
                        <input 
                          type="text" 
                          value={item.title}
                          onChange={(e) => updateQueueItem(item.id, 'title', e.target.value)}
                          className="admin-input urdu-text" 
                          style={{margin: 0, padding: '6px', fontSize: '13px'}}
                          disabled={isBatchUploading || item.status === 'success'}
                          placeholder="کتاب کا نام"
                        />
                        <select 
                          className="admin-input urdu-text" 
                          value={item.category}
                          onChange={(e) => updateQueueItem(item.id, 'category', e.target.value)}
                          style={{margin: 0, padding: '4px', fontSize: '13px', width: '120px'}}
                          disabled={isBatchUploading || item.status === 'success'}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {item.status !== 'success' && !isBatchUploading && (
                        <button className="admin-delete-btn" style={{width: '32px', height: '32px'}} onClick={() => removeQueueItem(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isBatchUploading && (
                  <div className="batch-progress" style={{marginTop: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--gold-color)'}}>
                      <span>Uploading...</span>
                      <span>{batchProgress.current} / {batchProgress.total}</span>
                    </div>
                    <div className="upload-progress-bar" style={{position: 'relative', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden'}}>
                      <div className="upload-progress-fill" style={{width: `${(batchProgress.current / batchProgress.total) * 100}%`}}></div>
                    </div>
                  </div>
                )}

                <button 
                  type="button" 
                  className="publish-btn"
                  style={{marginTop: '20px'}}
                  onClick={processUploadQueue}
                  disabled={isBatchUploading || uploadQueue.filter(q => q.status === 'pending').length === 0}
                >
                  {isBatchUploading ? 'Uploading Batch...' : `🚀 Start Batch Upload (${uploadQueue.filter(q => q.status === 'pending').length} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Books List Database */}
        <div className="admin-database">
          <h3 className="db-title">
            <Database size={18} /> 
            Database Books (Page {dbPage + 1})
          </h3>
          
          {/* 🔍 Database Search Bar & 📂 Category Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="کتاب یا مصنف کا نام تلاش کریں... (Search by title or author)" 
              value={dbSearchTerm}
              onChange={e => {
                setDbSearchTerm(e.target.value);
                setDbPage(0); // Reset page on search change
              }}
              className="admin-input urdu-text"
              style={{ padding: '10px 14px', fontSize: '13px', margin: 0, flex: 2, minWidth: '200px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
            />
            
            <select
              value={dbCategory}
              onChange={e => {
                setDbCategory(e.target.value);
                setDbPage(0); // Reset page on category filter change
              }}
              className="admin-input urdu-text"
              style={{ padding: '10px 14px', fontSize: '13px', margin: 0, flex: 1, minWidth: '150px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
            >
              <option value="all">{language === 'ur' ? 'تمام کیٹیگریز' : 'All Categories'}</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          {loadingBooks ? (
            <div className="loading-books">Loading database...</div>
          ) : (
            <>
            <div className="admin-book-list">
              {books.map(book => (
                <div key={book.id} className="admin-book-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  {editingBook === book.id ? (
                    /* ===== EDIT MODE ===== */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--gold-color)', fontWeight: 'bold', fontSize: '13px' }}>✏️ Edit Mode</span>
                        <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                      </div>
                      <input className="admin-input urdu-text" placeholder="کتاب کا نام" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ margin: 0, padding: '8px', fontSize: '13px' }} />
                      <input className="admin-input urdu-text" placeholder="مصنف" value={editForm.author} onChange={e => setEditForm({...editForm, author: e.target.value})} style={{ margin: 0, padding: '8px', fontSize: '13px' }} />
                      <select className="admin-input urdu-text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ margin: 0, padding: '8px', fontSize: '13px' }}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input className="admin-input" placeholder="Cover Image URL" value={editForm.cover_url} onChange={e => setEditForm({...editForm, cover_url: e.target.value})} style={{ margin: 0, padding: '8px', fontSize: '12px', direction: 'ltr' }} />
                      
                      {/* Upload New Cover directly */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Upload New Cover Image (نیا سرورق اپلوڈ کریں):</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleEditCoverUpload(e, book.id)}
                          style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                        />
                      </div>

                      <input className="admin-input" placeholder="PDF Direct Link (.pdf)" value={editForm.pdf_url} onChange={e => setEditForm({...editForm, pdf_url: e.target.value})} style={{ margin: 0, padding: '8px', fontSize: '12px', direction: 'ltr' }} />
                      
                      {/* Upload New PDF directly */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Upload New PDF (نئی پی ڈی ایف اپلوڈ کریں):</span>
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={(e) => handleEditPdfUpload(e, book.id)}
                          style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                        />
                      </div>

                      {editForm.cover_url && (
                        <div style={{ width: '60px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={editForm.cover_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <button onClick={saveEdit} disabled={savingEdit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--gold-color)', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Save size={16} /> {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    /* ===== NORMAL VIEW ===== */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      <div className="admin-book-thumb">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt="cover" referrerPolicy="no-referrer" />
                        ) : (
                          book.cover_emoji || '📖'
                        )}
                      </div>
                      <div className="admin-book-info">
                        <h4 className="urdu-text">{book.title}</h4>
                        <p className="urdu-text">{book.author}</p>
                        <div className="admin-book-meta">
                          <span className="admin-badge">{book.category}</span>
                          <span className="admin-stats">Downloads: {book.downloads || 0}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: book.pdf_url && book.pdf_url.endsWith('.pdf') ? '#4ade80' : '#ef4444', marginTop: '4px' }}>
                          {book.pdf_url && book.pdf_url.endsWith('.pdf') ? '✅ Direct PDF' : '⚠️ No Direct PDF'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                        <button 
                          onClick={() => startEdit(book)}
                          title="Edit Book"
                          style={{ background: 'transparent', color: 'var(--gold-color)', border: '1px solid rgba(212,175,55,0.3)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="admin-delete-btn"
                          onClick={() => handleDelete(book.id, book.cover_url, book.pdf_url)}
                          title="Delete Book"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {books.length === 0 && <p className="empty-db">No books in database yet.</p>}
            </div>
            
            {/* 📄 Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => setDbPage(p => Math.max(0, p - 1))}
                disabled={dbPage === 0}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: dbPage === 0 ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #d4af37, #b4831f)',
                  color: dbPage === 0 ? 'rgba(255,255,255,0.2)' : '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: dbPage === 0 ? 'not-allowed' : 'pointer'
                }}
                className="urdu-text"
              >
                ← سابقہ (Prev)
              </button>
              
              <span className="urdu-text" style={{ fontSize: '14px', color: 'var(--gold-color)' }}>
                صفحہ (Page) {dbPage + 1}
              </span>
              
              <button 
                onClick={() => setDbPage(p => p + 1)}
                disabled={books.length < PAGE_SIZE}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: books.length < PAGE_SIZE ? 'rgba(255,255,255,0.02)' : 'linear-gradient(135deg, #d4af37, #b4831f)',
                  color: books.length < PAGE_SIZE ? 'rgba(255,255,255,0.2)' : '#000',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: books.length < PAGE_SIZE ? 'not-allowed' : 'pointer'
                }}
                className="urdu-text"
              >
                اگla (Next) →
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
