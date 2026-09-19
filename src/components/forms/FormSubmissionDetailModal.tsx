import React, { useState } from 'react';
import {
  X,
  Printer,
  FileCheck2,
  Calendar,
  Building2,
  MapPin,
  User,
  Star,
  Camera,
  PenTool,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import {
  CustomForm,
  FormSubmission,
  CompanyProfile,
  LetterheadSettings,
  SystemUser,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  generatePdfFromElement,
  triggerPrintFallback,
} from '../../utils/pdfGenerator';

interface FormSubmissionDetailModalProps {
  submission: FormSubmission;
  formTemplate?: CustomForm;
  companyProfile?: CompanyProfile;
  letterhead?: LetterheadSettings;
  currentUser?: SystemUser | null;
  onClose: () => void;
  onUpdateStatus: (
    submissionId: string,
    newStatus: 'Approved' | 'Rejected' | 'In Review',
    notes?: string
  ) => void;
}

export const FormSubmissionDetailModal: React.FC<
  FormSubmissionDetailModalProps
> = ({
  submission,
  formTemplate,
  companyProfile,
  currentUser,
  onClose,
  onUpdateStatus,
}) => {
  const [reviewNotes, setReviewNotes] = useState<string>(
    submission.reviewNotes || ''
  );
  const [showReviewBox, setShowReviewBox] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  // Generate & Download real PDF file
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const sanitizedTitle = submission.formTitle.replace(/[/\\?%*:|"<>]/g, '_');
      const sanitizedNum = submission.submissionNumber.replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `Formulir_${sanitizedTitle}_${sanitizedNum}.pdf`;

      const isSuccess = await generatePdfFromElement({
        elementId: 'printable-form-area',
        filename,
        title: `Dokumen Formulir - ${submission.formTitle} (${submission.submissionNumber})`,
      });

      if (isSuccess) {
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 3000);
      }
    } catch (err) {
      console.error('Failed to generate form PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Browser print with iframe sandbox fallback
  const handleBrowserPrint = () => {
    const el = document.getElementById('printable-form-area');
    triggerPrintFallback(
      `Dokumen Formulir - ${submission.formTitle} (${submission.submissionNumber})`,
      el
    );
  };

  const handleStatusChange = (status: 'Approved' | 'Rejected' | 'In Review') => {
    onUpdateStatus(submission.id, status, reviewNotes.trim());
    setShowReviewBox(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print-visible">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none print:w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  {submission.submissionNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    submission.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : submission.status === 'Rejected'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {submission.status.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {submission.formTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Real PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-500/30 disabled:opacity-60"
              title="Generate dan unduh berkas dokumen PDF resmi"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Membuat PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>PDF Berhasil!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            {/* Browser Print / Fallback */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
              title="Cetak melalui dialog printer browser / pop-up cetak"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Cetak Printer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Canvas */}
        <div
          id="printable-form-area"
          className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 printable-document print-container print:p-0 print:overflow-visible relative"
        >
          {/* Approved Official Stamp Overlay (Print & Screen) */}
          {submission.status === 'Approved' && (
            <div className="hidden sm:block absolute right-8 top-28 pointer-events-none opacity-85 rotate-[-10deg] border-4 border-emerald-600 text-emerald-700 rounded-2xl px-4 py-2 text-center uppercase tracking-widest bg-white/90 print:bg-transparent print:opacity-100 shadow-sm z-10">
              <p className="text-[9px] font-black tracking-widest text-emerald-800">PT RAKA CIPTA SERAYA</p>
              <p className="text-sm font-black tracking-tight text-emerald-700">VERIFIED & APPROVED</p>
              <p className="text-[9px] font-bold text-emerald-800">
                {submission.reviewedAt ? `TGL: ${submission.reviewedAt}` : 'SISTEM ERP TERVALIDASI'}
              </p>
            </div>
          )}
          {/* Official Company Letterhead / Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl tracking-tight shadow-sm">
                BX
              </div>
              <div>
                <h1 className="text-base font-black uppercase text-slate-900 tracking-tight">
                  {companyProfile?.name || 'PT RAKA CIPTA SERAYA'}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {companyProfile?.address ||
                    'Graha Pratama Lt. 8, Jl. M.T. Haryono Kav. 15, Jakarta Selatan'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Telp: {companyProfile?.phone || '(021) 7919-8800'} | Email:{' '}
                  {companyProfile?.email || 'admin@rakaciptaseraya.co.id'}
                </p>
              </div>
            </div>

            <div className="text-right border-l border-slate-200 pl-4">
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 inline-block mb-1">
                KODE: {submission.formCode}
              </span>
              <p className="text-xs font-bold text-slate-800 font-mono">
                No: {submission.submissionNumber}
              </p>
              <p className="text-[10px] text-slate-500">
                Diajukan: {submission.submittedAt}
              </p>
            </div>
          </div>

          {/* Form Title Banner */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
              {submission.formTitle}
            </h2>
            <p className="text-xs text-indigo-700 font-semibold mt-0.5">
              Kategori: {submission.formCategory}
            </p>
          </div>

          {/* Project & Submitter Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-500">Proyek:</span>
                <span className="font-bold text-slate-900">
                  {submission.projectName || 'Formulir Umum / Site Kantor'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-500">Lokasi/Zona:</span>
                <span className="font-semibold text-slate-800">
                  {submission.location || 'Semua Area'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-500">Pelapor:</span>
                <span className="font-bold text-slate-900">
                  {submission.submittedBy} ({submission.submittedByRole})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-500">Status Formulir:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    submission.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : submission.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {submission.status}
                </span>
              </div>
            </div>
          </div>

          {/* Form Values Presentation */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" /> Isian Formulir & Hasil Verifikasi
            </h3>

            {formTemplate?.fields ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {formTemplate.fields.map((f) => {
                  if (f.type === 'heading') {
                    return (
                      <div
                        key={f.id}
                        className="bg-indigo-50/40 px-4 py-2 text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2"
                      >
                        <div className="w-1.5 h-3.5 bg-indigo-600 rounded-full"></div>
                        {f.label}
                      </div>
                    );
                  }

                  const rawVal = submission.values[f.id];

                  return (
                    <div
                      key={f.id}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition text-xs"
                    >
                      <span className="font-semibold text-slate-600 sm:w-1/2">
                        {f.label}
                      </span>
                      <div className="sm:w-1/2 text-left sm:text-right font-medium text-slate-900">
                        {/* Rating format */}
                        {f.type === 'rating' ? (
                          <div className="flex items-center sm:justify-end gap-1 text-amber-500 font-bold">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  (rawVal || 0) >= s
                                    ? 'fill-current'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-slate-700 ml-1">
                              ({rawVal || 0}/5)
                            </span>
                          </div>
                        ) : f.type === 'currency' ? (
                          <span className="font-mono font-bold text-indigo-700">
                            {formatRupiah(rawVal || 0)}
                          </span>
                        ) : f.type === 'condition' ? (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              String(rawVal).toLowerCase().includes('pass') ||
                              String(rawVal).toLowerCase().includes('patuh') ||
                              String(rawVal).toLowerCase().includes('lengkap') ||
                              String(rawVal).toLowerCase().includes('aman') ||
                              String(rawVal).toLowerCase().includes('baik')
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : String(rawVal).toLowerCase().includes('fail') ||
                                  String(rawVal).toLowerCase().includes('rusak') ||
                                  String(rawVal).toLowerCase().includes('kritis')
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {rawVal || '-'}
                          </span>
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {rawVal !== undefined && rawVal !== null && rawVal !== ''
                              ? `${rawVal} ${f.unit || ''}`
                              : '-'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback if template fields not provided
              <div className="border border-slate-200 rounded-xl p-4 divide-y divide-slate-100 text-xs">
                {Object.entries(submission.values).map(([k, v]) => (
                  <div key={k} className="py-2 flex justify-between gap-4">
                    <span className="font-semibold text-slate-600">{k}</span>
                    <span className="font-bold text-slate-900">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Gallery Evidence */}
          {submission.photos && submission.photos.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Camera className="w-4 h-4 text-indigo-600" /> Foto Dokumentasi Lapangan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {submission.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || 'Foto Bukti'}
                      className="w-full h-36 object-cover"
                    />
                    {photo.caption && (
                      <p className="p-2 text-[11px] font-medium text-slate-700">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Row */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-indigo-600" /> Pengesahan & Tanda Tangan Resmi
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {submission.signatures && submission.signatures.length > 0 ? (
                submission.signatures.map((sig, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col justify-between h-44"
                  >
                    <p className="text-[11px] font-bold text-slate-500 uppercase">
                      {sig.role}
                    </p>
                    <div className="my-auto flex items-center justify-center">
                      {sig.signatureDataUrl ? (
                        <img
                          src={sig.signatureDataUrl}
                          alt="Tanda Tangan"
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <div className="py-2 text-indigo-700 font-serif italic text-sm font-bold border-b border-dashed border-slate-300">
                          [Tervalidasi Sistem]
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 underline">
                        {sig.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {sig.title || sig.role} • {sig.signedAt}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col justify-between h-44">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">
                    Pelapor Lapangan
                  </p>
                  <div className="my-auto text-indigo-700 font-serif italic text-sm font-bold">
                    [Tervalidasi Sistem]
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 underline">
                      {submission.submittedBy}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {submission.submittedByRole}
                    </p>
                  </div>
                </div>
              )}

              {/* Reviewer signature block */}
              <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 flex flex-col justify-between h-44">
                <p className="text-[11px] font-bold text-slate-500 uppercase">
                  Penyetuju / Site Manager
                </p>
                <div className="my-auto flex items-center justify-center">
                  {submission.status === 'Approved' ? (
                    <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" /> DISETUJUI
                    </div>
                  ) : submission.status === 'Rejected' ? (
                    <div className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200 text-xs font-bold">
                      <XCircle className="w-4 h-4" /> PERLU REVISI
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Menunggu Persetujuan
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {submission.reviewedBy || '(_________________)'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {submission.reviewedAt ? `Disetujui: ${submission.reviewedAt}` : 'Penanggung Jawab Proyek'}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Notes banner if exists */}
            {submission.reviewNotes && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">Catatan Peninjau / Supervisor:</span>{' '}
                {submission.reviewNotes}
              </div>
            )}
          </div>
        </div>

        {/* Review Action Box (Visible for review / approve) (Hidden on Print) */}
        <div className="print:hidden px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>
              Kelola status formulir dan tambahkan catatan review supervisi.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              title="Generate dan unduh berkas dokumen PDF resmi"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfDownloaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Proses...' : pdfDownloaded ? 'Tersimpan!' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-slate-700"
              title="Cetak formulir via printer browser"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" /> Cetak Printer
            </button>
            {!showReviewBox ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowReviewBox(true)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Catatan Review
                </button>
                {submission.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Approved')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Formulir
                  </button>
                )}
                {submission.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Rejected')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Revisi / Tolak
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Tuliskan catatan supervisi / revisi..."
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-64"
                />
                <button
                  type="button"
                  onClick={() => handleStatusChange('Approved')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Setujui
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('Rejected')}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
                >
                  Tolak
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewBox(false)}
                  className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
