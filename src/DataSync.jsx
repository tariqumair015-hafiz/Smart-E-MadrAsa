import React, { useState, useRef } from 'react';
import { DownloadCloud, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { strings } from './translations';
import './DataSync.css';

const DataSync = ({ language }) => {
  const t = strings[language];
  const fileInputRef = useRef(null);
  
  const [status, setStatus] = useState({ type: '', message: '' }); // type: 'success' | 'error'

  const handleExport = () => {
    try {
      // Collect all relevant data from localStorage
      const dataToExport = {
        smart_library: localStorage.getItem('smart_library'),
        smart_bookmarks: localStorage.getItem('smart_bookmarks'),
        smart_tasbeeh_count: localStorage.getItem('smart_tasbeeh_count'),
        smart_tasbeeh_target: localStorage.getItem('smart_tasbeeh_target'),
        smart_theme: localStorage.getItem('smart_theme'),
        smart_lang: localStorage.getItem('smart_lang'),
        exportDate: new Date().toISOString(),
        version: '1.1'
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmarteMadarsa_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ 
        type: 'success', 
        message: language === 'ur' ? 'ڈیٹا کامیابی سے ایکسپورٹ ہوگیا ہے' : 'Data exported successfully!' 
      });
      
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      
    } catch (error) {
      console.error("Export error:", error);
      setStatus({ 
        type: 'error', 
        message: language === 'ur' ? 'بیک اپ بنانے میں مسئلہ پیش آیا' : 'Failed to create backup.' 
      });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        // Basic validation
        if (!importedData.version && !importedData.smart_library && !importedData.hafiz_library) {
           throw new Error("Invalid backup file format");
        }

        // Write back to localStorage (support migration from hafiz_ if detected)
        Object.keys(importedData).forEach(key => {
          if ((key.startsWith('smart_') || key.startsWith('hafiz_')) && importedData[key] !== null) {
            const newKey = key.replace('hafiz_', 'smart_');
            localStorage.setItem(newKey, importedData[key]);
          }
        });

        setStatus({ 
          type: 'success', 
          message: language === 'ur' ? 'ڈیٹا امپورٹ ہوگیا ہے، ایپ ری اسٹارٹ ہو رہی ہے...' : 'Data restored successfully! Restarting app...' 
        });

        // Delay reload so user sees success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error("Import error:", error);
        setStatus({ 
          type: 'error', 
          message: language === 'ur' ? 'فائل پڑھنے میں مسئلہ یا غلط فائل' : 'Invalid backup file or read error.' 
        });
        if (fileInputRef.current) fileInputRef.current.value = ''; // reset
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="datasync-container">
      <div className="datasync-header">
        <h2 className="datasync-title urdu-text">
          🔄 {t.dataSyncTitle || (language === 'ur' ? 'بیک اپ اور ری اسٹور' : 'Backup & Restore')}
        </h2>
      </div>

      <div className="datasync-content">
        {status.message && (
          <div className={status.type === 'success' ? 'success-message urdu-text' : 'error-message urdu-text'}>
            {status.type === 'success' ? <CheckCircle2 size={16} style={{marginRight:'8px', verticalAlign:'middle'}}/> : <AlertCircle size={16} style={{marginRight:'8px', verticalAlign:'middle'}}/>}
            {status.message}
          </div>
        )}

        {/* Export Card */}
        <div className="sync-card">
          <div className="sync-icon-wrapper">
            <DownloadCloud size={32} />
          </div>
          <h3 className="urdu-text">{t.exportTitle || (language === 'ur' ? 'ڈیٹا محفوظ کریں (بیک اپ)' : 'Backup Data')}</h3>
          <p className="urdu-text">
            {language === 'ur' 
              ? 'اپنی کتب، نشانات (Bookmarks)، اور تسبیح کا ریکارڈ اپنے موبائل کی میموری میں محفوظ کریں۔ تاکہ ایپ ڈیلیٹ ہونے پر ڈیٹا ضائع نہ ہو۔' 
              : 'Save your downloaded books list, bookmarks, and Tasbeeh count to a secure file on your device.'}
          </p>
          <button className="sync-action-btn urdu-text" onClick={handleExport}>
            <DownloadCloud size={20} />
            {t.exportBtn || (language === 'ur' ? 'بیک اپ ڈاؤنلوڈ کریں' : 'Download Backup')}
          </button>
        </div>

        {/* Import Card */}
        <div className="sync-card">
          <div className="sync-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <UploadCloud size={32} />
          </div>
          <h3 className="urdu-text">{t.importTitle || (language === 'ur' ? 'ڈیٹا واپس لائیں (ری اسٹور)' : 'Restore Data')}</h3>
          <p className="urdu-text">
            {language === 'ur' 
              ? 'اگر آپ نے پہلے بیک اپ فائل ڈاؤنلوڈ کی تھی، تو اسے یہاں اپلوڈ کر کے اپنا پرانا ڈیٹا واپس لا سکتے ہیں۔ (موجودہ ڈیٹا بدل جائے گا)' 
              : 'Upload a previously saved backup file to restore your library and settings. This will overwrite current offline data.'}
          </p>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="file-input-hidden" 
          />
          <button className="sync-action-btn secondary urdu-text" onClick={handleImportClick}>
            <UploadCloud size={20} />
            {t.importBtn || (language === 'ur' ? 'بیک اپ فائل منتخب کریں' : 'Select Backup File')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSync;
