import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { X, Upload, CheckCircle, Loader2, FileText } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function BookUploadModal({ isOpen, onClose, language, categories, prefilledTitle = '' }) {
  const [title, setTitle] = useState(prefilledTitle);
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(categories[0] || 'قرآن');
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // '', 'extracting', 'cover', 'pdf', 'saving', 'done', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTitle(prefilledTitle);
    }
  }, [isOpen, prefilledTitle]);

  if (!isOpen) return null;

  // Extract first page of PDF and convert to Blob
  const extractCoverBlob = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const loadingTask = pdfjs.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);

          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          await page.render(renderContext).promise;

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob from canvas'));
          }, 'image/jpeg', 0.85);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !pdfFile) {
      alert(language === 'ur' ? 'براہ کرم تمام معلومات فراہم کریں!' : 'Please provide all information!');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setProgress(10);

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

      // 1. Extract cover
      setUploadStep('extracting'); // "کتاب کا سرورق تیار ہو رہا ہے..."
      let coverBlob = null;
      try {
        coverBlob = await extractCoverBlob(pdfFile);
      } catch (err) {
        console.error("Cover extraction failed", err);
      }
      setProgress(30);

      // 2. Upload cover if extracted
      let coverUrl = '';
      if (coverBlob) {
        setUploadStep('cover'); // "کور اپلوڈ ہو رہا ہے..."
        const coverPath = `covers/user_${Date.now()}_cover.jpg`;
        const { error: coverErr } = await supabase.storage
          .from('books-covers')
          .upload(coverPath, coverBlob, { contentType: 'image/jpeg' });
        
        if (coverErr) throw coverErr;

        coverUrl = supabase.storage
          .from('books-covers')
          .getPublicUrl(coverPath).data.publicUrl;
      }
      setProgress(50);

      // 3. Upload PDF
      setUploadStep('pdf'); // "پی ڈی ایف اپلوڈ ہو رہی ہے..."
      const pdfPath = `pdfs/user_${Date.now()}_${pdfFile.name}`;
      
      // Fake progress increment for smoother experience during large upload
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 3, 90));
      }, 300);

      const { error: pdfErr } = await supabase.storage
        .from('books-pdfs')
        .upload(pdfPath, pdfFile);

      clearInterval(progressInterval);

      if (pdfErr) throw pdfErr;
      setProgress(90);

      const pdfUrl = supabase.storage
        .from('books-pdfs')
        .getPublicUrl(pdfPath).data.publicUrl;

      // 4. Save to Database with pending_approval status
      setUploadStep('saving'); // "محفوظ کیا جا رہا ہے..."
      const { error: dbErr } = await supabase.from('Books').insert([{
        title: title.trim(),
        author: author.trim(),
        category,
        sub_category: 'pending_approval',
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        pages: 0,
        is_free: true,
        downloads: 0,
        rating: 0
      }]);

      if (dbErr) throw dbErr;

      setProgress(100);
      setUploadStep('done');

      // Reset form
      setTitle('');
      setAuthor('');
      setPdfFile(null);

      // Close modal after success delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadStep('');
        onClose();
      }, 2000);

    } catch (err) {
      console.error(err);
      let errMsg = err.message || 'Upload failed';
      if (errMsg.includes('row-level security') || errMsg.includes('violates row-level security policy') || errMsg.includes('403')) {
        errMsg = language === 'ur'
          ? 'سٹوریج RLS پالیسی کی وجہ سے اپلوڈ ناکام ہو گیا۔ سپابیس ڈیش بورڈ میں storage policies کو public (anon) اپلوڈ کے لیے ترتیب دیں یا Anonymous Sign-ins آن کریں۔'
          : 'Upload failed due to storage RLS policies. Configure storage policies in Supabase to allow public uploads, or enable Anonymous Sign-ins in your project settings.';
      }
      setErrorMsg(errMsg);
      setUploadStep('error');
      setIsUploading(false);
    }
  };

  const getStepText = () => {
    if (language === 'ur') {
      switch (uploadStep) {
        case 'auth': return 'تصدیق کی جا رہی ہے...';
        case 'extracting': return 'کتاب کا سرورق تیار ہو رہا ہے...';
        case 'cover': return 'کور اپلوڈ ہو رہا ہے...';
        case 'pdf': return 'کتاب (PDF) اپلوڈ ہو رہی ہے...';
        case 'saving': return 'ڈیٹا بیس میں محفوظ ہو رہا ہے...';
        case 'done': return 'کتاب کامیابی سے اپلوڈ ہو گئی! منظوری کا انتظار کریں۔';
        case 'error': return `خرابی: ${errorMsg}`;
        default: return 'اپلوڈ ہو رہا ہے...';
      }
    } else {
      switch (uploadStep) {
        case 'auth': return 'Authenticating...';
        case 'extracting': return 'Generating cover page...';
        case 'cover': return 'Uploading cover page...';
        case 'pdf': return 'Uploading PDF file...';
        case 'saving': return 'Saving details...';
        case 'done': return 'Uploaded successfully! Waiting for admin approval.';
        case 'error': return `Error: ${errorMsg}`;
        default: return 'Uploading...';
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 10000,
      padding: '16px', backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-color, #111318)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        color: 'var(--text-primary, #fff)',
        animation: 'scaleUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="urdu-text" style={{ margin: 0, fontSize: '20px', color: 'var(--gold-color, #d4af37)' }}>
            {language === 'ur' ? 'کتاب اپلوڈ کریں' : 'Upload Book'}
          </h2>
          {!isUploading && (
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'var(--text-secondary, #a0aec0)',
              cursor: 'pointer', padding: '4px'
            }}><X size={24} /></button>
          )}
        </div>

        {isUploading || uploadStep === 'done' ? (
          /* Loading / Progress State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', textAlign: 'center' }}>
            {uploadStep === 'done' ? (
              <CheckCircle size={60} color="#4ade80" style={{ marginBottom: '20px' }} />
            ) : (
              <Loader2 size={60} color="var(--gold-color, #d4af37)" className="spin" style={{ marginBottom: '20px', animation: 'spin 1s linear infinite' }} />
            )}
            
            <p className="urdu-text" style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              {getStepText()}
            </p>

            {uploadStep !== 'done' && (
              <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, backgroundColor: 'var(--gold-color, #d4af37)', height: '100%', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="urdu-text" style={{ fontSize: '13px', color: 'var(--text-secondary, #a0aec0)' }}>
                {language === 'ur' ? 'کتاب کا نام (Title)' : 'Book Title'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                className="urdu-text"
                placeholder={language === 'ur' ? 'مثال: صحیح البخاری' : 'e.g. Sahih al-Bukhari'}
              />
            </div>

            {/* Author */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="urdu-text" style={{ fontSize: '13px', color: 'var(--text-secondary, #a0aec0)' }}>
                {language === 'ur' ? 'مصنف کا نام (Author)' : 'Author Name'}
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                style={{
                  padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                className="urdu-text"
                placeholder={language === 'ur' ? 'مثال: امام بخاری' : 'e.g. Imam Bukhari'}
              />
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="urdu-text" style={{ fontSize: '13px', color: 'var(--text-secondary, #a0aec0)' }}>
                {language === 'ur' ? 'درجہ / کیٹیگری (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                className="urdu-text"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* PDF File */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="urdu-text" style={{ fontSize: '13px', color: 'var(--text-secondary, #a0aec0)' }}>
                {language === 'ur' ? 'پی ڈی ایف فائل منتخب کریں' : 'Select PDF File'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  required
                  style={{ display: 'none' }}
                  id="user-pdf-upload-input"
                />
                <label
                  htmlFor="user-pdf-upload-input"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '20px 16px', borderRadius: '12px', border: '2px dashed rgba(212,175,55,0.3)',
                    backgroundColor: 'rgba(212,175,55,0.02)', cursor: 'pointer', textAlign: 'center'
                  }}
                  className="urdu-text"
                >
                  <FileText color="var(--gold-color, #d4af37)" />
                  <span style={{ fontSize: '13px', color: pdfFile ? '#4ade80' : 'var(--text-secondary, #a0aec0)' }}>
                    {pdfFile ? pdfFile.name : (language === 'ur' ? 'فائل منتخب کریں (صرف PDF)' : 'Select PDF (Max 50MB)')}
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {uploadStep === 'error' && (
              <p className="urdu-text" style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>
                {getStepText()}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%', padding: '14px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #d4af37, #b4831f)',
                color: '#000', border: 'none', fontWeight: 'bold', fontSize: '15px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', marginTop: '8px'
              }}
              className="urdu-text"
            >
              <Upload size={18} />
              <span>{language === 'ur' ? 'کتاب اپلوڈ کریں' : 'Upload Book'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
