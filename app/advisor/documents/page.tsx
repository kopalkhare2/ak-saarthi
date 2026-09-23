'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/contexts/app-context';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import EmptyState from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import {
  FolderOpen, Search, Upload, FileText, Download, Trash2,
  RotateCcw, AlertTriangle, X, File, Image as ImageIcon, FileSpreadsheet,
  CheckCircle, XCircle,
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  pan: 'PAN', aadhaar: 'Aadhaar', policy: 'Policy', kyc: 'KYC',
  income_proof: 'Income Proof', passport: 'Passport', driving_license: 'DL', other: 'Other',
};

function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return <FileText size={18} className="text-slate-500" />;
  if (mimeType.startsWith('image/')) return <ImageIcon size={18} className="text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText size={18} className="text-red-400" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return <FileSpreadsheet size={18} className="text-emerald-400" />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText size={18} className="text-blue-500" />;
  return <File size={18} className="text-slate-400" />;
}

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function DocumentsPage() {
  const {
    documents, trashedDocuments, clients,
    uploadDocument, deleteDocument, restoreDocument, permanentDeleteDocument,
  } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState<'vault' | 'trash'>('vault');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPermanent, setConfirmPermanent] = useState<string | null>(null);

  // Upload form state
  const [selectedClient, setSelectedClient] = useState('');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('other');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocuments = activeTab === 'vault' ? documents : trashedDocuments;

  let filtered = activeDocuments;
  if (search) {
    filtered = filtered.filter((d) =>
      `${d.clientName} ${d.name} ${d.fileName}`.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (filterType !== 'all') filtered = filtered.filter((d) => d.type === filterType);

  // Group by client
  const grouped = filtered.reduce((acc, d) => {
    (acc[d.clientName] = acc[d.clientName] || []).push(d);
    return acc;
  }, {} as Record<string, typeof activeDocuments>);

  const resetUploadForm = () => {
    setSelectedClient('');
    setDocName('');
    setDocType('other');
    setSelectedFile(null);
    setUploadError('');
    setUploadSuccess('');
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedClient || !docName) {
      setUploadError('Please fill all fields and select a file.');
      return;
    }

    const client = clients.find((c) => c.id === selectedClient);
    if (!client) {
      setUploadError('Selected client not found.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('clientId', selectedClient);
      formData.append('clientName', `${client.firstName} ${client.lastName}`);
      formData.append('type', docType);
      formData.append('name', docName);

      await uploadDocument(formData);
      setUploadSuccess(`"${docName}" uploaded successfully!`);
      setTimeout(() => {
        setShowUpload(false);
        resetUploadForm();
      }, 1500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleDownload = (docId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/documents/${docId}`;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-sm text-slate-400 mt-1">
            {documents.length} documents stored
            {trashedDocuments.length > 0 && (
              <span className="text-amber-400"> · {trashedDocuments.length} in trash</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/backup"
            className="btn btn-secondary text-xs"
            title="Download a backup of the entire database"
          >
            💾 Backup DB
          </a>
          <button className="btn btn-primary" onClick={() => { resetUploadForm(); setShowUpload(true); }}>
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('vault')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'vault' ? 'bg-yellow-500/10 text-yellow-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderOpen size={14} className="inline mr-1.5 -mt-0.5" />
          Vault ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'trash' ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trash2 size={14} className="inline mr-1.5 -mt-0.5" />
          Trash ({trashedDocuments.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Trash info banner */}
      {activeTab === 'trash' && trashedDocuments.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertTriangle size={16} />
          <span>Items in trash are preserved until you permanently delete them. Files remain on disk.</span>
        </div>
      )}

      {/* Document List */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={activeTab === 'vault' ? <FolderOpen size={28} /> : <Trash2 size={28} />}
          title={activeTab === 'vault' ? 'No documents found' : 'Trash is empty'}
          description={activeTab === 'vault' ? 'Upload client documents to get started.' : 'No deleted documents.'}
        />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {Object.entries(grouped).map(([clientName, docs]) => (
            <div key={clientName} className="card overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <FolderOpen size={16} className="text-yellow-400" />
                  {clientName}
                  <Badge label={`${docs.length}`} variant="neutral" dot={false} />
                </h3>
              </div>
              <div className="divide-y divide-slate-800/50">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-slate-800/30 transition-colors">
                    {getFileIcon(d.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-slate-500">
                        {d.fileName}
                        {d.size ? ` · ${formatSize(d.size)}` : ''}
                        {d.mimeType ? ` · ${d.mimeType.split('/')[1]?.toUpperCase()}` : ''}
                      </p>
                    </div>
                    <Badge label={typeLabels[d.type] || d.type} variant="gold" dot={false} />
                    <span className="text-xs text-slate-500">{formatDate(d.uploadedAt)}</span>

                    {/* Actions */}
                    <div className="flex gap-1">
                      {activeTab === 'vault' ? (
                        <>
                          {d.filePath && (
                            <button
                              onClick={() => handleDownload(d.id, d.fileName)}
                              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Download"
                            >
                              <Download size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDelete(d.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                            title="Move to trash"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => restoreDocument(d.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Restore"
                          >
                            <RotateCcw size={15} />
                          </button>
                          <button
                            onClick={() => setConfirmPermanent(d.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                            title="Permanently delete"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Upload Modal ─── */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); resetUploadForm(); }} title="Upload Document">
        <div className="space-y-4">
          {uploadSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-emerald-400">
              <CheckCircle size={48} />
              <p className="font-medium">{uploadSuccess}</p>
            </div>
          ) : (
            <>
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="label">Client</label>
                <select className="input" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Document Name</label>
                <input className="input" placeholder="e.g. PAN Card — Rajesh Sharma" value={docName} onChange={(e) => setDocName(e.target.value)} />
              </div>

              <div>
                <label className="label">Document Type</label>
                <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Drop zone */}
              <div>
                <label className="label">File</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-yellow-400 bg-yellow-500/5'
                      : selectedFile
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <CheckCircle size={20} />
                      <div className="text-left">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{formatSize(selectedFile.size)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="ml-2 text-slate-500 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <Upload size={24} className="mx-auto mb-2 text-slate-500" />
                      <p className="text-sm">Drag & drop or click to choose file</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, Images, Word, Excel · Max 10 MB</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedClient || !docName}
                className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* ─── Delete Confirmation Modal ─── */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Move to Trash?">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            This document will be moved to trash. The file will be preserved on disk and can be restored at any time.
          </p>
          <div className="flex gap-3 justify-end">
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirmDelete) deleteDocument(confirmDelete);
                setConfirmDelete(null);
              }}
            >
              <Trash2 size={14} /> Move to Trash
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Permanent Delete Confirmation Modal ─── */}
      <Modal isOpen={!!confirmPermanent} onClose={() => setConfirmPermanent(null)} title="Permanently Delete?">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertTriangle size={16} />
            <span><strong>This action is irreversible.</strong> The file will be removed from disk and the database record permanently deleted.</span>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn btn-secondary" onClick={() => setConfirmPermanent(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirmPermanent) permanentDeleteDocument(confirmPermanent);
                setConfirmPermanent(null);
              }}
            >
              <XCircle size={14} /> Permanently Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
