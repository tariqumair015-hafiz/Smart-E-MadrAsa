import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Upload, Image as ImageIcon, FileText, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

const SuggestBookPage = ({ language, onBack }) => {
  const isUr = language === 'ur';
  
  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('قرآن');
  const [pages, setPages] = useState('');
  
  // File State
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // 'cover', 'pdf', 'data', 'done'
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = [
    'قرآن', 'حدیث', 'فقہ', 'سیرت', 'تفسیر',
    'تجوید', 'عقیدہ', 'نحو', 'صرف', 'لغات', 'امتحانی پرچے', 'متفرق', 'علمائے کرام'
  ];

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
    
    if (!title.trim() || !author.trim()) {
      alert(isUr ? "براہ کرم کتاب کا نام اور مصنف کا نام درج کریں۔" : "Please provide book title and author.");
      return;
    }

    if (!pdfFile) {
      alert(isUr ? "براہ کرم پی ڈی ایف فائل منتخب کریں۔" : "Please select a PDF file.");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 0. Try to authenticate anonymously if not logged in
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUploadStep('auth'); // "تصدیق کی جا رہی ہے..."
          await supabase.auth.signInAnonymously();
        }
      } catch (authErr) {
        console.warn("Anonymous sign-in skipped or failed. Attempting upload anyway:", authErr.message);
      }

      let coverUrl = '';
      
      // 1. Upload Cover if selected
      if (coverFile) {
        setUploadStep('cover');
        const coverProgressInterval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 90)), 150);
        
        const coverPath = `covers/user_${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: coverError } = await supabase.storage
          .from('books-covers')
          .upload(coverPath, coverFile);
          
        clearInterval(coverProgressInterval);
        setUploadProgress(100);
        
        if (coverError) throw coverError;

        coverUrl = supabase.storage
          .from('books-covers')
          .getPublicUrl(coverPath).data.publicUrl;
      }

      // 2. Upload PDF
      setUploadStep('pdf');
      setUploadProgress(0);
      await new Promise(r => setTimeout(r, 400));
      const pdfProgressInterval = setInterval(() => setUploadProgress(p => Math.min(p + 5, 95)), 250);

      const pdfPath = `pdfs/user_${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: pdfError } = await supabase.storage
        .from('books-pdfs')
        .upload(pdfPath, pdfFile);
        
      clearInterval(pdfProgressInterval);
      setUploadProgress(100);

      if (pdfError) throw pdfError;

      const pdfUrl = supabase.storage
        .from('books-pdfs')
        .getPublicUrl(pdfPath).data.publicUrl;

      // 3. Save Data to DB (sub_category: 'pending' indicates waiting for approval)
      setUploadStep('data');
      await new Promise(r => setTimeout(r, 400));

      const { error: dbError } = await supabase.from('Books').insert([{
        title: title.trim(),
        author: author.trim(),
        category,
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        pages: parseInt(pages, 10) || 0,
        sub_category: 'pending', // Pending approval flag
        is_free: true,
        downloads: 0,
        rating: 0
      }]);

      if (dbError) throw dbError;

      // 4. Success
      setUploadStep('done');
      setTimeout(() => {
        setIsUploading(false);
        onBack();
      }, 3000);

    } catch (error) {
      console.error("Upload error:", error);
      let errMsg = error.message || 'Upload failed';
      if (errMsg.includes('row-level security') || errMsg.includes('violates row-level security policy') || errMsg.includes('403')) {
        errMsg = isUr
          ? 'سٹوریج RLS پالیسی کی وجہ سے اپلوڈ ناکام ہو گیا۔ سپابیس ڈیش بورڈ میں storage policies کو public (anon) اپلوڈ کے لیے ترتیب دیں یا Anonymous Sign-ins آن کریں۔'
          : 'Upload failed due to storage RLS policies. Configure storage policies in Supabase to allow public uploads, or enable Anonymous Sign-ins in your project settings.';
      }
      alert(errMsg);
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const getStepText = () => {
    switch (uploadStep) {
      case 'auth': return isUr ? '🔐 تصدیق ہو رہی ہے...' : '🔐 Authenticating...';
      case 'cover': return isUr ? '📸 کور امیج اپلوڈ ہو رہی ہے...' : '📸 Uploading cover image...';
      case 'pdf': return isUr ? '📄 پی ڈی ایف فائل اپلوڈ ہو رہی ہے...' : '📄 Uploading PDF file...';
      case 'data': return isUr ? '💾 ڈیٹا محفوظ ہو رہا ہے...' : '💾 Saving information...';
      case 'done': return isUr ? '✅ کتاب کامیابی سے اپلوڈ ہو گئی۔ منظوری کا انتظار کریں۔' : '✅ Uploaded successfully. Pending admin approval.';
      default: return '';
    }
  };

  return (
    <div className="admin-panel-container" style={{ padding: '20px', minHeight: '85vh', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={onBack} 
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: '#fff', 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer' 
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="urdu-text" style={{ color: 'var(--gold-color)', margin: 0, fontSize: '20px' }}>
          {isUr ? '📚 کتاب اپلوڈ کریں (Upload Book)' : '📚 Suggest/Upload Book'}
        </h2>
      </header>

      {isUploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
          {uploadStep === 'done' ? (
            <CheckCircle size={52} color="#4ade80" className="mt-4" />
          ) : (
            <Loader2 size={52} className="spin gold-text mt-4" />
          )}
          
          <h3 className="urdu-text" style={{ color: 'var(--gold-color)', marginTop: '20px', fontSize: '18px' }}>
            {getStepText()}
          </h3>
          
          {uploadStep !== 'data' && uploadStep !== 'done' && (
            <div style={{ width: '80%', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--gold-color)', transition: 'width 0.2s' }}></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="urdu-text" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>کتاب کا نام (Book Title) *</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder={isUr ? "کتاب کا نام یہاں لکھیں..." : "Enter book name..."} 
              className="admin-input urdu-text" 
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="urdu-text" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>مصنف (Author) *</label>
            <input 
              type="text" 
              value={author} 
              onChange={e => setAuthor(e.target.value)} 
              placeholder={isUr ? "مصنف کا نام یہاں لکھیں..." : "Enter author name..."} 
              className="admin-input urdu-text" 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="urdu-text" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>کیٹیگری (Category)</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="admin-input urdu-text"
                style={{ padding: '10px' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="urdu-text" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>صفحات (Pages - Optional)</label>
              <input 
                type="number" 
                value={pages} 
                onChange={e => setPages(e.target.value)} 
                placeholder="250" 
                className="admin-input" 
              />
            </div>
          </div>

          {/* Cover Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="urdu-text" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>کتاب کا ٹائٹل/کور امیج (Cover Image - Optional)</label>
            <div 
              onClick={() => document.getElementById('cover-file-input').click()}
              style={{ 
                border: '2px dashed rgba(212,175,55,0.3)', 
                borderRadius: '12px', 
                padding: '20px', 
                textAlign: 'center', 
                cursor: 'pointer',
                background: 'rgba(212,175,55,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {coverPreview ? (
                <div style={{ width: '80px', height: '110px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={coverPreview} alt="cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <>
                  <ImageIcon size={32} className="gold-text" />
                  <span className="urdu-text" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {isUr ? 'ٹائٹل فوٹو منتخب کریں' : 'Select Cover Image'}
                  </span>
                </>
              )}
            </div>
            <input 
              type="file" 
              id="cover-file-input" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleCoverSelect} 
            />
          </div>

          {/* PDF Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="urdu-text" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>پی ڈی ایف فائل (PDF File) *</label>
            <div 
              onClick={() => document.getElementById('pdf-file-input').click()}
              style={{ 
                border: '2px dashed rgba(212,175,55,0.3)', 
                borderRadius: '12px', 
                padding: '20px', 
                textAlign: 'center', 
                cursor: 'pointer',
                background: 'rgba(212,175,55,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {pdfFile ? (
                <>
                  <CheckCircle size={32} color="#4ade80" />
                  <span className="urdu-text" style={{ fontSize: '13px', color: '#4ade80', fontWeight: 'bold' }}>
                    {pdfFile.name}
                  </span>
                </>
              ) : (
                <>
                  <FileText size={32} className="gold-text" />
                  <span className="urdu-text" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {isUr ? 'پی ڈی ایف فائل منتخب کریں' : 'Select PDF File'}
                  </span>
                </>
              )}
            </div>
            <input 
              type="file" 
              id="pdf-file-input" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={handlePdfSelect} 
            />
          </div>

          <button 
            type="submit" 
            className="publish-btn"
            style={{ marginTop: '12px', padding: '14px' }}
          >
            🚀 {isUr ? 'کتاب اپلوڈ کریں' : 'Upload Book'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SuggestBookPage;
