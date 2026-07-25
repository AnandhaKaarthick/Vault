import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, FileText, Upload, RefreshCw, Settings, Lock, Star, Clock, Layers, Folder, CheckCircle2, Search, X, Tag, ExternalLink, Download, FileCheck, Info, Plus, Edit2, Check, User, LogOut, ShieldCheck
} from 'lucide-react';
import Dropzone from './components/Dropzone';
import DocumentCard from './components/DocumentCard';
import AlertBanner from './components/AlertBanner';
import PinModal from './components/PinModal';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import { 
  uploadDocument, checkJobStatus, listDocuments, getDocument, toggleStarDocument, deleteDocument, searchDocuments, getSettings, renameDocument
} from './services/api';

const CATEGORIES = [
  "All",
  "Academic & Marksheets",
  "Certificates & Courses",
  "Tax",
  "Financial & Bank",
  "Identity & Official",
  "Utility & Bills",
  "Travel & Tickets",
  "Medical & Health",
  "Receipts & Invoices",
  "Other / Unsorted"
];

const SEARCH_PLACEHOLDERS = [
  "find my 12th marksheet...",
  "python course certificate...",
  "how much was my electricity bill...",
  "when does my passport expire...",
  "semester 6 transcript..."
];

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('vault_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Document State
  const [documents, setDocuments] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showDropzone, setShowDropzone] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isExpiringOnly, setIsExpiringOnly] = useState(false);
  const [isStarredOnly, setIsStarredOnly] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Modals & Auth State
  const [selectedDocForPin, setSelectedDocForPin] = useState(null);
  const [pinVerifiedDoc, setPinVerifiedDoc] = useState(null);
  const [verifiedPin, setVerifiedPin] = useState('1234');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal Editing Title State
  const [isEditingModalTitle, setIsEditingModalTitle] = useState(false);
  const [modalTitleInput, setModalTitleInput] = useState('');

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);

  // Background Job Tracking
  const pendingJobIds = useRef(new Set());

  // Global ESC Key Listener for Modal Dismissal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPinVerifiedDoc(null);
        setSelectedDocForPin(null);
        setIsSettingsOpen(false);
        setIsEditingModalTitle(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchDocs = async (quiet = false) => {
    try {
      if (!quiet) setIsLoading(true);
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        starred: isStarredOnly ? true : undefined,
        expiring_soon: isExpiringOnly ? true : undefined,
        page: 1,
        limit: 50
      };
      const data = await listDocuments(params);
      setDocuments(data.documents || []);
      setTotalDocs(data.total || 0);

      (data.documents || []).forEach(doc => {
        if ((doc.status === 'pending' || doc.status === 'processing') && doc.id) {
          pendingJobIds.current.add(doc.id);
        }
      });
    } catch (err) {
      console.error('Error fetching documents:', err);
    } fontally {
      if (!quiet) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDocs();
    }
  }, [selectedCategory, isExpiringOnly, isStarredOnly, currentUser]);

  // Polling loop for active extraction workers
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!currentUser) return;
      const hasProcessingDocs = documents.some(d => d.status === 'pending' || d.status === 'processing');
      if (pendingJobIds.current.size > 0 || hasProcessingDocs) {
        fetchDocs(true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, currentUser]);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    showToast(`Welcome back, ${user.full_name || user.username}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    setCurrentUser(null);
    setDocuments([]);
    setTotalDocs(0);
    showToast('Logged out of vault.', 'info');
  };

  const handleUpload = async (files) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsUploading(true);
    let dupCount = 0;
    let newCount = 0;

    for (const file of files) {
      try {
        const res = await uploadDocument(file);
        if (res.is_duplicate) {
          dupCount++;
          showToast(res.message, 'warning');
        } else {
          newCount++;
          if (res.job_id) {
            pendingJobIds.current.add(res.job_id);
          }
        }
      } catch (err) {
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }

    setIsUploading(false);
    setShowDropzone(true);
    fetchDocs();

    if (newCount > 0) {
      showToast(`Uploaded ${newCount} document(s). AI worker is analyzing OCR & categorization...`, 'success');
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery || !searchQuery.trim()) {
      fetchDocs();
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchDocuments(searchQuery.trim());
      setDocuments(data.results || []);
      setTotalDocs(data.results ? data.results.length : 0);
    } catch (err) {
      showToast('Semantic vector search failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStar = async (docId) => {
    try {
      await toggleStarDocument(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, is_starred: !d.is_starred } : d));
    } catch (err) {
      showToast('Could not update star status', 'error');
    }
  };

  const handleRename = async (docId, newFilename) => {
    try {
      const updated = await renameDocument(docId, newFilename);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, suggested_filename: newFilename, generated_filename: newFilename } : d));
      if (pinVerifiedDoc && pinVerifiedDoc.id === docId) {
        setPinVerifiedDoc(prev => ({ ...prev, suggested_filename: newFilename, generated_filename: newFilename }));
      }
      showToast(`Renamed file to '${newFilename}'`, 'success');
    } catch (err) {
      showToast('Could not rename file', 'error');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from your vault?')) return;
    try {
      await deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      showToast('Document deleted from vault', 'info');
    } catch (err) {
      showToast('Could not delete document', 'error');
    }
  };

  const handleOpenDocumentCard = async (doc) => {
    if (['Identity & Official', 'Tax', 'Financial & Bank'].includes(doc.category)) {
      setSelectedDocForPin(doc);
    } else {
      setPinVerifiedDoc(doc);
    }
  };

  const handlePinSuccess = async (pin) => {
    const targetDoc = selectedDocForPin;
    setSelectedDocForPin(null);
    setVerifiedPin(pin);
    try {
      const fullDoc = await getDocument(targetDoc.id, pin);
      setPinVerifiedDoc(fullDoc);
    } catch (err) {
      showToast('PIN verification failed', 'error');
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setIsExpiringOnly(false);
    setIsStarredOnly(false);
    fetchDocs();
  };

  // Compute Stats
  const expiringDocs = documents.filter(d => {
    if (!d.expiry_date) return false;
    const today = new Date();
    const exp = new Date(d.expiry_date);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  const getFileUrl = (docId) => {
    return `/api/documents/${docId}/file?pin=${encodeURIComponent(verifiedPin || '1234')}`;
  };

  const isImageFile = (doc) => {
    if (!doc) return false;
    const fn = (doc.suggested_filename || doc.original_filename || '').toLowerCase();
    return /\.(png|jpg|jpeg|webp)$/i.test(fn);
  };

  return (
    <div className="min-h-screen bg-[#f8faf4] text-[#1C2620] font-sans">
      
      {/* Stitch Clean Top Header Navbar */}
      <header className="sticky top-0 w-full bg-[#FFFFFF] border-b border-[#1C2620]/15 py-3.5 z-40 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl font-semibold text-[#28493F] tracking-tight shrink-0">
                Vault
              </h1>
              
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-[#28493F]/10 text-[#28493F] font-mono text-[11px] uppercase font-semibold shrink-0">
                Archival Records Office
              </span>
            </div>

            {/* Header Action Buttons (Mobile View) */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setShowDropzone(!showDropzone)}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-white" />
                <span>Upload</span>
              </button>

              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[#B4402F] hover:bg-[#B4402F]/10 rounded border border-[#B4402F]/30"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="btn-primary px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* High-Contrast Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1C2620]">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
              className="w-full pl-10 pr-24 py-2 bg-[#FFFFFF] border border-[#1C2620]/25 rounded text-[#1C2620] font-sans text-xs italic placeholder:text-[#1C2620]/60 focus:outline-none focus:border-[#28493F] focus:ring-1 focus:ring-[#28493F] shadow-sm transition-all"
            />

            <div className="absolute inset-y-0 right-0 pr-1 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[#1C2620]/60 hover:text-[#1C2620] p-1 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="btn-primary px-3 py-1 font-mono text-[11px] uppercase tracking-wider rounded shadow-sm"
              >
                SEARCH
              </button>
            </div>
          </form>

          {/* Header Action Buttons & User Profile Badge (Desktop View) */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowDropzone(!showDropzone)}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>UPLOAD RECORD</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-[#1C2620] hover:bg-[#1C2620]/5 rounded border border-[#1C2620]/25 transition-colors bg-white"
              title="Developer Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => fetchDocs()}
              className="p-2 text-[#1C2620] hover:bg-[#1C2620]/5 rounded border border-[#1C2620]/25 transition-colors bg-white"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#28493F]' : ''}`} />
            </button>

            {/* Logged-in User Profile Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#1C2620]/20">
                <div className="flex items-center gap-2 bg-[#f8faf4] px-3 py-1.5 rounded border border-[#1C2620]/20">
                  <User className="w-4 h-4 text-[#28493F]" />
                  <span className="font-mono text-xs font-bold text-[#1C2620]">
                    {currentUser.full_name || currentUser.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#B4402F] hover:bg-[#B4402F]/10 rounded border border-[#B4402F]/30 transition-colors bg-white"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider shadow-sm"
              >
                <User className="w-4 h-4 text-white" />
                <span>SIGN IN</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Single-Column Clean Container */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className={`p-4 rounded border text-sm font-medium flex items-center justify-between shadow-sm animate-fadeIn ${
            toastMessage.type === 'success' ? 'bg-[#28493F]/10 border-[#28493F] text-[#28493F]' :
            toastMessage.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-900' :
            toastMessage.type === 'error' ? 'bg-[#B4402F]/10 border-[#B4402F] text-[#B4402F]' :
            'bg-[#1C2620]/5 border-[#1C2620]/20 text-[#1C2620]'
          }`}>
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {toastMessage.text}
            </span>
          </div>
        )}

        {/* Dedicated Master Categories Filter Bar (Includes Student Categories) */}
        <div className="w-full overflow-x-auto scroll-hide pb-2 border-b border-[#1C2620]/15">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsExpiringOnly(false);
                  setIsStarredOnly(false);
                  setSearchQuery('');
                }}
                className={`
                  px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-150 shrink-0 select-none font-bold
                  ${selectedCategory === cat && !isExpiringOnly && !isStarredOnly
                    ? 'btn-primary shadow-sm' 
                    : 'bg-white text-[#1C2620] hover:bg-[#28493F] hover:text-white border border-[#1C2620]/20'
                  }
                `}
              >
                {cat === 'All' ? 'All Documents' : cat}
              </button>
            ))}

            {/* Expiring Soon Pill */}
            <button
              type="button"
              onClick={() => {
                setIsExpiringOnly(!isExpiringOnly);
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`
                px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 shrink-0 select-none font-bold
                ${isExpiringOnly 
                  ? 'bg-[#B4402F] text-white border border-[#B4402F] shadow-sm' 
                  : 'bg-white text-[#1C2620] hover:bg-[#B4402F] hover:text-white border border-[#1C2620]/20'
                }
              `}
            >
              <span>Expiring Soon</span>
              <span className="w-1.5 h-1.5 bg-[#B4402F] rounded-full"></span>
            </button>

            {/* Starred Pill */}
            <button
              type="button"
              onClick={() => {
                setIsStarredOnly(!isStarredOnly);
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`
                px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 shrink-0 select-none font-bold
                ${isStarredOnly 
                  ? 'bg-yellow-600 text-white border border-yellow-600 shadow-sm' 
                  : 'bg-white text-[#1C2620] hover:bg-yellow-600 hover:text-white border border-[#1C2620]/20'
                }
              `}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Starred</span>
            </button>
          </div>
        </div>

        {/* Dropzone Intake Container */}
        {showDropzone && (
          <div className="relative">
            <Dropzone onUpload={handleUpload} isUploading={isUploading} />
          </div>
        )}

        {/* Expiration Urgent Alert Banner */}
        <AlertBanner 
          expiringDocs={expiringDocs} 
          onSelectDoc={handleOpenDocumentCard}
        />

        {/* Document Grid Header & Content */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold text-[#1C2620]">
                Archival Records ({documents.length})
              </h2>

              {!showDropzone && (
                <button
                  onClick={() => setShowDropzone(true)}
                  className="btn-primary flex items-center gap-1 px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider font-bold"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Upload File</span>
                </button>
              )}
            </div>

            {(selectedCategory !== 'All' || isExpiringOnly || isStarredOnly || searchQuery) && (
              <button
                onClick={resetAllFilters}
                className="font-mono text-xs text-[#28493F] font-bold hover:underline uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#28493F]" />
              <p className="text-sm font-sans text-[#1C2620]/70 font-medium">Fetching vault documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#1C2620]/20 rounded-lg p-8 bg-[#FFFFFF] space-y-3">
              <Folder className="w-12 h-12 text-[#1C2620]/30 mx-auto" />
              <h3 className="font-serif text-xl font-semibold text-[#1C2620]">No Records Found</h3>
              <p className="text-xs text-[#1C2620]/70 max-w-sm mx-auto">
                No documents match your current filter selection. Try clearing filters or uploading new files.
              </p>
              <button
                onClick={resetAllFilters}
                className="btn-primary px-4 py-2 font-mono text-xs uppercase tracking-wider rounded shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id || doc.original_filename}
                  document={doc}
                  onOpen={handleOpenDocumentCard}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* User Login & Registration Modal */}
      {(isLoginModalOpen || !currentUser) && (
        <LoginModal 
          onLoginSuccess={handleLoginSuccess}
          onClose={currentUser ? () => setIsLoginModalOpen(false) : undefined}
        />
      )}

      {/* Developer Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          onSaveSuccess={() => {
            fetchDocs();
          }}
        />
      )}

      {/* Security PIN Modal */}
      {selectedDocForPin && (
        <PinModal 
          document={selectedDocForPin}
          onSuccess={handlePinSuccess}
          onClose={() => setSelectedDocForPin(null)}
        />
      )}

      {/* Document Detail Viewer Modal */}
      {pinVerifiedDoc && (
        <div 
          onClick={() => {
            setPinVerifiedDoc(null);
            setIsEditingModalTitle(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C2620]/60 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#FFFFFF] border border-[#1C2620]/20 rounded-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1C2620]/15 pb-4">
              <div className="pr-4 flex-1">
                <span className="stamp-badge stamp-general">
                  {pinVerifiedDoc.category || 'Other / Unsorted'}
                </span>
                
                {/* Modal Title Inline Editing */}
                {isEditingModalTitle ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={modalTitleInput}
                      onChange={(e) => setModalTitleInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          await handleRename(pinVerifiedDoc.id, modalTitleInput.trim());
                          setIsEditingModalTitle(false);
                        }
                        if (e.key === 'Escape') setIsEditingModalTitle(false);
                      }}
                      autoFocus
                      className="w-full px-3 py-1.5 bg-white border-2 border-[#28493F] rounded text-lg font-serif font-bold text-[#1C2620] focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        await handleRename(pinVerifiedDoc.id, modalTitleInput.trim());
                        setIsEditingModalTitle(false);
                      }}
                      className="p-2 bg-[#28493F] text-white rounded hover:bg-[#1E372F] shrink-0"
                      title="Save Title"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingModalTitle(false)}
                      className="p-2 bg-[#1C2620]/10 text-[#1C2620] rounded hover:bg-[#1C2620]/20 shrink-0"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2 group/title">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C2620] break-all">
                      {pinVerifiedDoc.suggested_filename || pinVerifiedDoc.generated_filename || pinVerifiedDoc.original_filename}
                    </h3>
                    <button
                      onClick={() => {
                        setModalTitleInput(pinVerifiedDoc.suggested_filename || pinVerifiedDoc.generated_filename || pinVerifiedDoc.original_filename);
                        setIsEditingModalTitle(true);
                      }}
                      className="p-1.5 text-[#1C2620]/40 hover:text-[#28493F] hover:bg-[#1C2620]/5 rounded transition-colors shrink-0"
                      title="Edit File Name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={getFileUrl(pinVerifiedDoc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider rounded shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                  <span>Open File</span>
                </a>

                <button 
                  onClick={() => {
                    setPinVerifiedDoc(null);
                    setIsEditingModalTitle(false);
                  }}
                  title="Close Viewer (ESC)"
                  className="p-1.5 text-[#B4402F] hover:bg-[#B4402F]/10 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content View / Archival Record Card */}
            <div className="w-full bg-[#f8faf4] border border-[#1C2620]/15 rounded-lg p-5 space-y-5 shadow-inner">
              {isImageFile(pinVerifiedDoc) ? (
                <div className="flex justify-center bg-white p-4 rounded border border-[#1C2620]/15">
                  <img 
                    src={getFileUrl(pinVerifiedDoc.id)}
                    alt={pinVerifiedDoc.original_filename}
                    className="max-h-80 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1C2620]/15 pb-3">
                    <div className="flex items-center gap-2 text-[#28493F]">
                      <FileCheck className="w-5 h-5" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider">Archival Record Paper</span>
                    </div>
                    <span className="font-mono text-xs text-[#1C2620]/70">
                      Issuer: <strong>{pinVerifiedDoc.vendor_or_issuer || 'Vault Office'}</strong>
                    </span>
                  </div>

                  {/* 2-Sentence Synopsis */}
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C2620]/70 mb-1.5">AI 2-Sentence Synopsis</h4>
                    <p className="text-sm font-sans italic text-[#1C2620] bg-white p-4 rounded border border-[#1C2620]/15 leading-relaxed shadow-sm">
                      "{pinVerifiedDoc.summary || 'Synopsis unavailable.'}"
                    </p>
                  </div>

                  {/* Tags */}
                  {pinVerifiedDoc.tags && pinVerifiedDoc.tags.length > 0 && (
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C2620]/70 mb-1.5">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {pinVerifiedDoc.tags.map((t, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded bg-[#28493F]/10 text-[#28493F] font-mono text-xs uppercase font-semibold">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Metadata Schema Table */}
                  {pinVerifiedDoc.extracted_metadata && Object.keys(pinVerifiedDoc.extracted_metadata).length > 0 && (
                    <div>
                      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1C2620]/70 mb-2">Targeted Metadata Schema</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded border border-[#1C2620]/15">
                        {Object.entries(pinVerifiedDoc.extracted_metadata).map(([k, v]) => v !== null && v !== undefined && String(v).trim() !== '' && (
                          <div key={k} className="space-y-0.5">
                            <p className="font-mono text-[10px] text-[#1C2620]/50 uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
                            <p className="font-mono text-xs font-semibold text-[#28493F] truncate">{String(v)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#1C2620]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={getFileUrl(pinVerifiedDoc.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#28493F] font-bold hover:underline font-mono text-xs uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open / Download Raw File</span>
              </a>

              <button
                onClick={() => {
                  setPinVerifiedDoc(null);
                  setIsEditingModalTitle(false);
                }}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 font-mono text-xs uppercase tracking-wider rounded shadow-sm font-bold transition-all active:scale-95"
              >
                CLOSE VIEWER (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
