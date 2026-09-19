import React from 'react';
import { X, Printer, FileText, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { FormSubmission, CompanyProfile, LetterheadSettings, Project } from '../../types';

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
  const handlePrint = () => {
    window.print();
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
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
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
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Cetak via browser atau simpan ke PDF"
            >
              <Printer className="w-4 h-4" /> Cetak / Simpan PDF (Ctrl+P)
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
        <div className="print:hidden px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Gunakan opsi peramban (Ctrl+P / Simpan sebagai PDF) untuk mengunduh rekap ini dalam format PDF resmi.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak Rekap (PDF / Browser)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
