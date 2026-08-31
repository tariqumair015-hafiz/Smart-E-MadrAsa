import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MessageSquare, Plus, Check, Trash2, Loader2, Send, Clock, User, FileText } from 'lucide-react';

export default function BookRequestsTab({ language, onUploadRequest, isAdmin = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [userName, setUserName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('BookRequests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(language === 'ur' ? 'درخواستیں لوڈ کرنے میں ناکامی ہوئی' : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookTitle.trim() || !userName.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase.from('BookRequests').insert([
        {
          book_title: bookTitle.trim(),
          user_name: userName.trim(),
          description: `${authorName.trim() ? `مصنف: ${authorName.trim()}` : ''} ${description.trim() ? `| تفصیل: ${description.trim()}` : ''}`.trim(),
          resolved: false
        }
      ]);

      if (error) throw error;

      // Reset & refresh
      setBookTitle('');
      setAuthorName('');
      setDescription('');
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(language === 'ur' ? 'درخواست جمع کرانے میں ناکامی' : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'ur' ? 'کیا آپ واقعی یہ درخواست حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this request?')) return;
    try {
      const { error } = await supabase.from('BookRequests').delete().eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting request:', err);
      alert(language === 'ur' ? 'حذف کرنے میں خرابی آئی' : 'Failed to delete request');
    }
  };

  const handleResolve = async (id, currentVal) => {
    try {
      const { error } = await supabase.from('BookRequests').update({ resolved: !currentVal }).eq('id', id);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, resolved: !currentVal } : r));
    } catch (err) {
      console.error('Error resolving request:', err);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', color: 'var(--text-primary, #fff)', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 className="urdu-text" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--gold-color, #d4af37)', margin: 0 }}>
            {language === 'ur' ? 'درخواست شدہ کتب' : 'Requested Books'}
          </h2>
          <p className="urdu-text" style={{ fontSize: '11px', color: '#a0aec0', margin: '2px 0 0 0' }}>
            {language === 'ur' ? 'جو کتابیں دستیاب نہیں ہیں ان کے لیے یہاں لکھیں' : 'Request books you need or upload requested ones'}
          </p>
        </div>
        
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #d4af37, #b4831f)',
              color: '#000',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={16} />
            <span className="urdu-text" style={{ fontSize: '13px' }}>{language === 'ur' ? 'درخواست ڈالیں' : 'Add Request'}</span>
          </button>
        )}
      </div>

      {/* Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: '18px',
          padding: '18px',
          marginBottom: '20px',
          animation: 'slideDown 0.3s ease'
        }}>
          <h3 className="urdu-text" style={{ fontSize: '15px', color: 'var(--gold-color)', marginTop: 0, marginBottom: '14px' }}>
            {language === 'ur' ? 'نئی کتاب کی درخواست کریں' : 'Request a New Book'}
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <label className="urdu-text" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>
              {language === 'ur' ? 'کتاب کا نام (لازمی)' : 'Book Title (Required)'}
            </label>
            <input 
              type="text" 
              value={bookTitle} 
              onChange={(e) => setBookTitle(e.target.value)} 
              required 
              style={inputStyle}
              placeholder={language === 'ur' ? 'کتاب کا نام درج کریں' : 'e.g. Al-Hidayah'}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="urdu-text" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>
              {language === 'ur' ? 'مصنف کا نام (اختیاری)' : 'Author Name (Optional)'}
            </label>
            <input 
              type="text" 
              value={authorName} 
              onChange={(e) => setAuthorName(e.target.value)} 
              style={inputStyle}
              placeholder={language === 'ur' ? 'مصنف کا نام درج کریں' : 'e.g. Imam Al-Marghinani'}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="urdu-text" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>
              {language === 'ur' ? 'آپ کا نام (لازمی)' : 'Your Name (Required)'}
            </label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              required 
              style={inputStyle}
              placeholder={language === 'ur' ? 'اپنا نام درج کریں' : 'Your name'}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="urdu-text" style={{ display: 'block', fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>
              {language === 'ur' ? 'مزید تفصیل (جلد، درجہ وغیرہ - اختیاری)' : 'Additional Details (Optional)'}
            </label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              style={{ ...inputStyle, height: '60px', resize: 'none' }}
              placeholder={language === 'ur' ? 'جلد نمبر یا درجہ درج کریں' : 'Volume, Edition etc.'}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #d4af37, #b4831f)',
                color: '#000',
                border: 'none',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="urdu-text" style={{ fontSize: '13px' }}>{language === 'ur' ? 'درخواست بھیجیں' : 'Submit'}</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}
            >
              <span className="urdu-text" style={{ fontSize: '13px' }}>{language === 'ur' ? 'کینسل' : 'Cancel'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ padding: '12px', background: 'rgba(229,62,62,0.1)', borderRadius: '12px', border: '1px solid rgba(229,62,62,0.2)', color: '#e53e3e', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
          <Loader2 size={36} color="var(--gold-color)" className="animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <MessageSquare size={32} color="#a0aec0" style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p className="urdu-text" style={{ color: '#a0aec0', fontSize: '14px', margin: 0 }}>
            {language === 'ur' ? 'ابھی تک کوئی درخواست نہیں کی گئی' : 'No requests yet. Be the first to ask!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((request) => (
            <div key={request.id} style={{
              background: request.resolved ? 'rgba(72,187,120,0.03)' : 'rgba(255,255,255,0.02)',
              border: request.resolved ? '1px solid rgba(72,187,120,0.2)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '16px',
              position: 'relative',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <h4 className="urdu-text" style={{ fontSize: '15px', fontWeight: 'bold', color: request.resolved ? '#48bb78' : '#fff', margin: 0 }}>
                      {request.book_title}
                    </h4>
                    {request.resolved && (
                      <span className="urdu-text" style={{ background: 'rgba(72,187,120,0.15)', color: '#48bb78', padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold' }}>
                        {language === 'ur' ? 'اپلوڈ ہو گئی' : 'Uploaded'}
                      </span>
                    )}
                  </div>
                  
                  {request.description && (
                    <p className="urdu-text" style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {request.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11px', color: '#718096' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} />
                      <span className="urdu-text">{request.user_name}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="urdu-text">
                      <span>{language === 'ur' ? 'تاریخ: ' : 'Date: '}</span>
                      <span>{formatDate(request.created_at)}</span>
                    </span>
                  </div>
                </div>

                {/* Right side Actions */}
                <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
                  {isAdmin ? (
                    <>
                      <button 
                        onClick={() => handleResolve(request.id, request.resolved)}
                        style={{
                          background: request.resolved ? 'rgba(72,187,120,0.2)' : 'rgba(255,255,255,0.05)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: request.resolved ? '#48bb78' : '#718096'
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(request.id)}
                        style={{
                          background: 'rgba(229,62,62,0.1)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          color: '#e53e3e'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    !request.resolved && (
                      <button 
                        onClick={() => onUploadRequest(request.book_title)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(212,175,55,0.1)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          color: 'var(--gold-color, #d4af37)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(212,175,55,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                        }}
                      >
                        <Plus size={12} />
                        <span className="urdu-text">{language === 'ur' ? 'اپلوڈ کریں' : 'Upload'}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.02)',
  color: '#fff',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box'
};
