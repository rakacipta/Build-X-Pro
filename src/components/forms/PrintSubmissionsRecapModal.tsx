import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download,
  Loader2,
} from 'lucide-react';
import { FormSubmission, CompanyProfile, LetterheadSettings, Project } from '../../types';
import {
  generatePdfFromElement,
  triggerPrintFallback,
} from '../../utils/pdfGenerator';

interface PrintSubmissionsRecapModalProps {
  submissions: FormSubmission[];
  projects: Project[];
  selectedCategory: string;
  statusFilter: string;
  selectedProjectFilter: string;
  companyProfile?: CompanyProfile;
  letterhead?: LetterheadSettings;
  onClose: () => void;
}

export const PrintSubmissionsRecapModal: React.FC<PrintSubmissionsRecapModalProps> = ({
  submissions,
  projects,
  selectedCategory,
  statusFilter,
  selectedProjectFilter,
  companyProfile,
  onClose,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  // Generate real PDF file download
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const sanitizedCat = selectedCategory.replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `Rekap_Formulir_${sanitizedCat}_${new Date().toISOString().slice(0, 10)}.pdf`;

      const isSuccess = await generatePdfFromElement({
        elementId: 'printable-submissions-recap',
        filename,
        title: `Rekapitulasi Respon Formulir - ${selectedCategory}`,
        landscape: true,
      });

      if (isSuccess) {
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 3000);
      }
    } catch (err) {
      console.error('Failed to generate submissions recap PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Browser print with fallback
  const handleBrowserPrint = () => {
    const el = document.getElementById('printable-submissions-recap');
    triggerPrintFallback(
      `Rekapitulasi Respon Formulir - ${selectedCategory}`,
      el
    );
  };

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectFilter);
  const projectNameDisplay =
    selectedProjectFilter === 'Semua'
      ? 'Semua Proyek Aktif'
      : selectedProjectObj
      ? `${selectedProjectObj.code} - ${selectedProjectObj.name}`
      : selectedProjectFilter;

  // Compute stats
  const totalCount = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length;
  const inReviewCount = submissions.filter((s) => s.status === 'In Review' || s.status === 'Submitted').length;
  const rejectedCount = submissions.filter((s) => s.status === 'Rejected').length;
  const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print-visible">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none print:w-full">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  REKAPITULASI RESMI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {submissions.length} DATA DOKUMEN
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Cetak Rekapitulasi Respon Formulir Lapangan
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-500/30 disabled:opacity-60"
              title="Unduh laporan rekapitulasi dalam format PDF"
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

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
              title="Cetak via dialog printer browser"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Cetak Printer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div
          id="printable-submissions-recap"
          className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 printable-document print-container print:p-0 print:overflow-visible"
        >
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-2xl tracking-tight shadow-sm border border-slate-800">
                BX
              </div>
              <div>
                <h1 className="text-base font-black uppercase text-slate-900 tracking-tight">
                  {companyProfile?.name || 'PT RAKA CIPTA SERAYA'}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  Divisi Manajemen Proyek, Pengendalian Mutu & K3 Konstruksi (QHSE)
                </p>
                <p className="text-[10px] text-slate-500">
                  {companyProfile?.address ||
                    'Graha Pratama Lt. 8, Jl. M.T. Haryono Kav. 15, Jakarta Selatan'}
                  {' '}| Telp: {companyProfile?.phone || '(021) 7919-8800'}
                </p>
              </div>
            </div>

            <div className="text-right border-l-2 border-slate-300 pl-4 shrink-0">
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-300 inline-block mb-1">
                DOKUMEN AUDIT RESMI
              </span>
              <p className="text-[11px] font-bold text-slate-800">
                Tanggal: {currentDateStr}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Sistem ERP Build X Pro
              </p>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2.5 bg-slate-100 rounded-xl border border-slate-300">
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
              Laporan Rekapitulasi Respon Formulir & Inspeksi Lapangan
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-indigo-800 font-bold mt-0.5">
              <span>Proyek: {projectNameDisplay}</span>
              <span>•</span>
              <span>Kategori: {selectedCategory.toUpperCase()}</span>
              <span>•</span>
              <span>Status: {statusFilter.toUpperCase()}</span>
            </div>
          </div>

          {/* Executive Summary Stats */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
            <div className="border-r border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Pengajuan</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</p>
            </div>
            <div className="border-r border-slate-200">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Disetujui (Approved)</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{approvedCount}</p>
            </div>
            <div className="border-r border-slate-200">
              <p className="text-[10px] font-bold text-amber-700 uppercase">Dalam Review</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{inReviewCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-700 uppercase">Tingkat Persetujuan</p>
              <p className="text-xl font-black text-indigo-700 mt-0.5">{approvalRate}%</p>
            </div>
          </div>

          {/* Table Data */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs border border-slate-300 rounded-xl overflow-hidden border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">No. Registrasi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nama Formulir</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Proyek & Lokasi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Pelapor Lapangan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Tanggal</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {submissions.map((sub, idx) => (
                  <tr key={sub.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                      {sub.submissionNumber}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <p className="font-bold text-slate-900 leading-tight">{sub.formTitle}</p>
                      <p className="text-[9px] text-indigo-600 font-medium">{sub.formCategory}</p>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <p className="font-semibold text-slate-800 leading-tight">
                        {sub.projectName || 'Formulir Umum'}
                      </p>
                      {sub.location && (
                        <p className="text-[10px] text-slate-500 leading-tight">{sub.location}</p>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                      <p className="font-bold text-slate-900 leading-tight">{sub.submittedBy}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{sub.submittedByRole}</p>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap font-mono text-[10px] text-slate-600">
                      {sub.submittedAt.split(' ')[0]}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : sub.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Executive Sign-off Block */}
          <div className="pt-4 border-t border-slate-300">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-32">
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  Dipersiapkan Oleh: Staff Administrasi Proyek / Dokumen Kontrol
                </p>
                <div className="my-auto text-slate-400 italic text-[11px]">
                  (Paraf & Nama Tertera)
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Administrator Proyek</p>
                  <p className="text-[10px] text-slate-500">PT Raka Cipta Seraya</p>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-32">
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  Mengetahui & Menyetujui: Project Manager / Direksi Proyek
                </p>
                <div className="my-auto text-slate-400 italic text-[11px]">
                  (Tanda Tangan & Cap Stempel Proyek)
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Ir. H. Raka Pratama, M.T.</p>
                  <p className="text-[10px] text-slate-500">Project Director / Kuasa Direksi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Sistem Informasi Terintegrasi Build X Pro • {companyProfile?.name || 'PT RAKA CIPTA SERAYA'}</span>
            <span>Dicetak pada: {currentDateStr}</span>
          </div>
        </div>

        {/* Bottom Bar (Hidden on Print) */}
        <div className="print:hidden px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Ekspor rekapitulasi ke berkas dokumen PDF resmi atau kirim langsung ke printer fisik.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              title="Unduh berkas PDF rekapitulasi"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfDownloaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Membuat PDF...' : pdfDownloaded ? 'Tersimpan!' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" /> Cetak Printer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
