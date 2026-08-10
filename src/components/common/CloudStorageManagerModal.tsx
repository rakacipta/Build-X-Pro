import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  HardDrive,
  X,
  CheckCircle2,
  Lock,
  Download,
  ExternalLink,
  Copy,
  Trash2,
  Search,
  Filter,
  FileCode,
  Image as ImageIcon,
  Archive,
  ShieldCheck,
  Check,
  Tag,
} from 'lucide-react';
import { CloudLargeAttachment, ModuleType } from '../../types';

interface CloudStorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: CloudLargeAttachment[];
  onUploadAttachment?: (
    attachment: Omit<CloudLargeAttachment, 'id' | 'uploadedAt'>
  ) => void;
  onDeleteAttachment?: (id: string) => void;
  currentUserName?: string;
  defaultModule?: ModuleType;
}

export const CloudStorageManagerModal: React.FC<CloudStorageManagerModalProps> = ({
  isOpen,
  onClose,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
  currentUserName = 'Siska (Mktg & Proyek)',
  defaultModule = 'tender',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New file upload state form
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSizeMb, setFileSizeMb] = useState<number>(15.5);
  const [fileType, setFileType] = useState<'pdf' | 'dwg' | 'xlsx' | 'jpg' | 'png' | 'zip' | 'doc'>('pdf');
  const [category, setCategory] = useState<CloudLargeAttachment['category']>('PDF Tender');
  const [relatedEntityName, setRelatedEntityName] = useState('');
  const [storageProvider, setStorageProvider] = useState<'Firebase Storage' | 'Google Cloud Storage'>('Firebase Storage');

  if (!isOpen) return null;

  // Filter attachments
  const filtered = attachments.filter((att) => {
    const matchesSearch =
      att.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.relatedEntityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || att.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Capacity calculation
  const totalUsedMb = attachments.reduce((sum, item) => sum + item.fileSizeMb, 0);
  const totalCapacityMb = 50 * 1024; // 50 GB
  const usedPct = ((totalUsedMb / totalCapacityMb) * 100).toFixed(2);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const newAtt: Omit<CloudLargeAttachment, 'id' | 'uploadedAt'> = {
      fileName: fileName.endsWith('.' + fileType) ? fileName : `${fileName}.${fileType}`,
      fileSizeMb,
      fileType,
      category,
      uploadedBy: currentUserName,
      downloadUrl: `https://storage.googleapis.com/buildx-erp-vault/${category.toLowerCase().replace(/\s+/g, '_')}/${fileName.replace(/\s+/g, '_')}`,
      storageProvider,
      relatedModule: defaultModule as ModuleType,
      relatedEntityId: 'rel-' + Date.now(),
      relatedEntityName: relatedEntityName.trim() || 'Dokumen ' + category,
      isEncrypted: true,
    };

    if (onUploadAttachment) {
      onUploadAttachment(newAtt);
    }
    setFileName('');
    setRelatedEntityName('');
    setShowUploadForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Cloud Storage & Large File Media Vault (&gt;10MB)
                </h2>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> ENCRYPTED VAULT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyimpanan terenkripsi berkas ukuran besar (PDF Tender, Gambar CAD DWG, Foto Opname, & BAST Signed).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quota & Storage Bar */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kapasitas Storage Terpakai:</span>
                <strong className="text-white font-mono">{(totalUsedMb / 1024).toFixed(2)} GB</strong> / 50 GB
              </span>
              <span className="text-cyan-400 font-mono font-bold">{usedPct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(parseFloat(usedPct), 2)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-600/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{showUploadForm ? 'Tutup Form Upload' : 'Unggah Berkas Baru'}</span>
          </button>
        </div>

        {/* Upload Form Modal Area */}
        {showUploadForm && (
          <form
            onSubmit={handleFormSubmit}
            className="p-4 bg-slate-950 border-b border-cyan-500/30 space-y-3 shrink-0 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" /> Form Simulasi Upload Berkas Cloud (&gt; 10MB)
              </h3>
              <span className="text-[10px] text-slate-400">Pemberian Tautan Presigned & Enkripsi AES-256</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama File Dokumen</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. BAST_Proyek_Selesai_2026.pdf"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kategori Dokumen</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="PDF Tender">PDF Tender & DED</option>
                  <option value="Bukti Pembayaran">Bukti Pembayaran Bank</option>
                  <option value="Foto Opname Fisik">Foto Fisik Opname Lapangan</option>
                  <option value="Gambar Kerja CAD">Gambar Kerja CAD (.dwg)</option>
                  <option value="Dokumen Kontrak">Dokumen Kontrak & BAST</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ukuran File (MB)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={fileSizeMb}
                  onChange={(e) => setFileSizeMb(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Layanan Cloud Vault</label>
                <select
                  value={storageProvider}
                  onChange={(e) => setStorageProvider(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Firebase Storage">Firebase Storage (Firestore Linked)</option>
                  <option value="Google Cloud Storage">Google Cloud Storage (GCS Vault)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Nama Proyek / Tender Terkait</label>
                <input
                  type="text"
                  value={relatedEntityName}
                  onChange={(e) => setRelatedEntityName(e.target.value)}
                  placeholder="e.g. Tender Pembangunan Gedung Olahraga"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan ke Cloud Vault</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl w-full">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berkas berdasarkan nama file, proyek, atau pengunggah..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 w-full"
            >
              <option value="All">Semua Kategori ({attachments.length})</option>
              <option value="PDF Tender">PDF Tender & DED</option>
              <option value="Bukti Pembayaran">Bukti Pembayaran</option>
              <option value="Foto Opname Fisik">Foto Opname Lapangan</option>
              <option value="Gambar Kerja CAD">Gambar CAD (.dwg)</option>
              <option value="Dokumen Kontrak">Dokumen Kontrak & BAST</option>
            </select>
          </div>
        </div>

        {/* List of files */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <HardDrive className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">Belum ada lampiran berkas cloud yang ditemukan.</p>
              <p className="text-xs text-slate-600">Klik tombol "Unggah Berkas Baru" untuk menambah berkas.</p>
            </div>
          ) : (
            filtered.map((att) => (
              <div
                key={att.id}
                className="p-4 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    {att.fileType === 'pdf' ? (
                      <FileText className="w-5 h-5 text-rose-400" />
                    ) : att.fileType === 'dwg' ? (
                      <FileCode className="w-5 h-5 text-indigo-400" />
                    ) : att.fileType === 'jpg' || att.fileType === 'png' ? (
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Archive className="w-5 h-5 text-amber-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white truncate max-w-md">
                        {att.fileName}
                      </span>
                      <span className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {att.fileSizeMb.toFixed(1)} MB
                      </span>
                      <span className="bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Tag className="w-2.5 h-2.5" />
                        {att.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 truncate">
                      Terkait: <strong className="text-slate-200">{att.relatedEntityName}</strong> • Ditingkatkan oleh{' '}
                      <span className="text-slate-300">{att.uploadedBy}</span> ({att.uploadedAt})
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-0.5">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Enkripsi SHA-256
                      </span>
                      <span>•</span>
                      <span>Provider: {att.storageProvider}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(att.downloadUrl, att.id)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
                    title="Salin Tautan Presigned"
                  >
                    {copiedId === att.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tautan</span>
                      </>
                    )}
                  </button>

                  <a
                    href={att.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>

                  {onDeleteAttachment && (
                    <button
                      type="button"
                      onClick={() => onDeleteAttachment(att.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 rounded-lg transition"
                      title="Hapus Berkas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mendukung upload berkas CAD (.dwg), PDF High-Res, & Foto HD Lapangan.</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Vault Engine: Google Cloud Storage AP-Southeast1
          </span>
        </div>
      </div>
    </div>
  );
};
