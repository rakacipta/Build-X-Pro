import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Building2,
  MapPin,
  Calendar,
  PenTool,
  Download,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { CustomForm, CompanyProfile, LetterheadSettings } from '../../types';
import {
  generatePdfFromElement,
  triggerPrintFallback,
} from '../../utils/pdfGenerator';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface PrintBlankFormModalProps {
  form: CustomForm;
  companyProfile?: CompanyProfile;
  letterhead?: LetterheadSettings;
  onClose: () => void;
}

export const PrintBlankFormModal: React.FC<PrintBlankFormModalProps> = ({
  form,
  companyProfile: companyProfileProp,
  letterhead: letterheadProp,
  onClose,
}) => {
  const profile =
    companyProfileProp ||
    getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE);
  const letterheadSettings =
    letterheadProp ||
    getStoredData<LetterheadSettings>('letterhead', INITIAL_LETTERHEAD) ||
    getStoredData<LetterheadSettings>('letterhead_settings', INITIAL_LETTERHEAD);

  const effectiveLogo = letterheadSettings?.logoUrl || profile?.logoUrl || '/logo-rcs.svg';
  const headerTitle =
    letterheadSettings?.headerTitle || profile?.name || 'PT RAKA CIPTA SERAYA';
  const headerSubtitle =
    letterheadSettings?.headerSubtitle ||
    profile?.tagline ||
    'General Contractor, Civil Works, Infrastructure & Structural Engineering';
  const addressLine1 =
    letterheadSettings?.addressLine1 ||
    (profile?.address
      ? `${profile.address}${profile.city ? `, ${profile.city}` : ''}`
      : 'Gedung Raka Cipta Tower Lt. 8, Jl. Jend. Sudirman No. 88, Jakarta Selatan');
  const addressLine2 = letterheadSettings?.addressLine2 || '';
  const contactLine =
    letterheadSettings?.contactLine ||
    `Telp: ${profile?.phone || '(021) 5790-1234'} | Email: ${profile?.email || 'admin@rakaciptaseraya.co.id'}`;

  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  // Generate real PDF file download
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const sanitizedCode = form.code.replace(/[/\\?%*:|"<>]/g, '_');
      const sanitizedTitle = form.title.replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `Blanko_Formulir_${sanitizedCode}_${sanitizedTitle}.pdf`;

      const isSuccess = await generatePdfFromElement({
        elementId: 'printable-blank-form',
        filename,
        title: `Blanko Lapangan - ${form.title} (${form.code})`,
      });

      if (isSuccess) {
        setPdfDownloaded(true);
        setTimeout(() => setPdfDownloaded(false), 3000);
      }
    } catch (err) {
      console.error('Failed to generate blank form PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Browser print with fallback
  const handleBrowserPrint = () => {
    const el = document.getElementById('printable-blank-form');
    triggerPrintFallback(`Blanko Lapangan - ${form.title} (${form.code})`, el);
  };

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print-visible">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none print:w-full">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  BLANKO KOSONG LAPANGAN
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  KODE: {form.code}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Cetak Blanko: {form.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-emerald-500/30 disabled:opacity-60"
              title="Unduh berkas PDF resmi lembar blanko ini"
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

        {/* Printable Blank Document Canvas */}
        <div
          id="printable-blank-form"
          className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 printable-document print-container print:p-0 print:overflow-visible"
        >
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4">
            {letterheadSettings?.showDivider !== false && (
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 rounded-full mb-3"></div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {letterheadSettings?.showLogo !== false && (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-200 p-1 bg-white flex items-center justify-center shrink-0 shadow-sm">
                    {effectiveLogo ? (
                      <img
                        src={effectiveLogo}
                        alt={headerTitle}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo-rcs.svg';
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full text-white rounded-lg flex items-center justify-center font-black text-2xl tracking-tight shadow-sm shrink-0"
                        style={{ backgroundColor: letterheadSettings?.logoBgColor || '#1e293b' }}
                      >
                        {letterheadSettings?.logoText || profile?.shortName?.slice(0, 3)?.toUpperCase() || 'RCS'}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight leading-tight">
                    {headerTitle}
                  </h1>
                  {headerSubtitle && (
                    <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mt-0.5">
                      {headerSubtitle}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    {addressLine1}
                    {addressLine2 ? ` • ${addressLine2}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {contactLine}
                  </p>
                </div>
              </div>

              <div className="text-right border-l-2 border-slate-300 pl-4 shrink-0">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-300 inline-block mb-1">
                  KODE: {form.code}
                </span>
                <p className="text-[11px] font-bold text-slate-800 font-mono">
                  Rev: {form.version}.0
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Standar Mutu ISO 9001 / SMK3
                </p>
              </div>
            </div>
          </div>

          {/* Form Banner */}
          <div className="text-center py-2.5 bg-slate-100 rounded-xl border border-slate-300">
            <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
              {form.title}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs text-indigo-800 font-bold mt-0.5">
              <span>KATEGORI: {form.category.toUpperCase()}</span>
              <span>•</span>
              <span>LEMBAR ISIAN LAPANGAN (BLANKO RESMI)</span>
            </div>
          </div>

          {form.description && (
            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold not-italic text-slate-800">Petunjuk Pengisian: </span>
              {form.description}
            </p>
          )}

          {/* Field Metadata Blank Lines (To be filled by hand on site) */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-28">Nama Proyek:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-28">Lokasi / Zona / Grid:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-28">Sub-Kontraktor / Mandor:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-28">Hari / Tanggal:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-28">Waktu / Jam Inspeksi:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 h-4"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-28">Kondisi Cuaca:</span>
                <span className="text-slate-600 font-medium">[ ] Cerah  [ ] Mendung  [ ] Hujan Ringan  [ ] Hujan Deras</span>
              </div>
            </div>
          </div>

          {/* Blank Inspection / Form Fields Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-900 pb-1 flex items-center justify-between">
              <span>Item Pemeriksaan & Parameter Pengisian Lapangan</span>
              <span className="text-[10px] text-slate-500 font-normal">Isi dengan teliti menggunakan pulpen hitam/biru</span>
            </h3>

            <div className="border border-slate-300 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs">
              <div className="bg-slate-100 font-bold text-slate-700 grid grid-cols-12 p-2.5">
                <div className="col-span-1 text-center">NO</div>
                <div className="col-span-6">PARAMETER / ITEM PEMERIKSAAN</div>
                <div className="col-span-3 text-center">KRITERIA / SATUAN</div>
                <div className="col-span-2 text-center">HASIL / PARAF</div>
              </div>

              {form.fields.map((field, idx) => {
                if (field.type === 'heading') {
                  return (
                    <div
                      key={field.id}
                      className="bg-indigo-50/70 p-2 text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      <span>{field.label}</span>
                    </div>
                  );
                }

                return (
                  <div key={field.id} className="grid grid-cols-12 p-2.5 items-center gap-2">
                    <div className="col-span-1 text-center font-bold text-slate-500">
                      {idx + 1}
                    </div>
                    <div className="col-span-6">
                      <p className="font-bold text-slate-900">
                        {field.label}
                        {field.required && <span className="text-rose-600 ml-1">*</span>}
                      </p>
                      {field.placeholder && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          {field.placeholder}
                        </p>
                      )}
                    </div>
                    <div className="col-span-3 text-center text-slate-600 font-medium text-[11px]">
                      {field.type === 'condition' ? (
                        <span className="inline-block border border-slate-300 rounded px-1.5 py-0.5 bg-slate-50 text-[10px]">
                          [ ] Baik  [ ] Rusak  [ ] Perlu Perbaikan
                        </span>
                      ) : field.type === 'rating' ? (
                        <span className="text-[10px] text-slate-500">
                          [ ] 1  [ ] 2  [ ] 3  [ ] 4  [ ] 5
                        </span>
                      ) : field.type === 'currency' ? (
                        <span className="text-[10px] font-mono">Rp ...............................</span>
                      ) : field.unit ? (
                        <span className="font-mono text-indigo-700">({field.unit})</span>
                      ) : field.type === 'textarea' ? (
                        <span className="text-slate-400 italic">Catatan / Uraian</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="border-b border-slate-400 h-5 w-full mx-auto"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes / Catatan Tambahan Lapangan */}
          <div className="border border-slate-300 rounded-xl p-3 bg-white space-y-1">
            <p className="text-[11px] font-bold text-slate-700 uppercase">
              Catatan Lapangan / Kendala / Tindakan Mitigasi yang Diperlukan:
            </p>
            <div className="border-b border-dotted border-slate-400 h-5"></div>
            <div className="border-b border-dotted border-slate-400 h-5"></div>
            <div className="border-b border-dotted border-slate-400 h-5"></div>
          </div>

          {/* Official Signature Boxes */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-36">
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  Dibuat Oleh (Pelapor / Mandor)
                </p>
                <div className="my-auto text-slate-300 italic text-[11px]">
                  (Tanda Tangan & Nama Jelas)
                </div>
                <div>
                  <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
                  <p className="text-[10px] text-slate-500">Tgl: _____ / _____ / 202___</p>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-36">
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  Diperiksa Oleh (Quality / HSE Officer)
                </p>
                <div className="my-auto text-slate-300 italic text-[11px]">
                  (Tanda Tangan & Nama Jelas)
                </div>
                <div>
                  <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
                  <p className="text-[10px] text-slate-500">Tgl: _____ / _____ / 202___</p>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between h-36">
                <p className="text-[11px] font-bold text-slate-700 uppercase">
                  Disetujui Oleh (Site Manager / PM)
                </p>
                <div className="my-auto text-slate-300 italic text-[11px]">
                  (Tanda Tangan & Nama Jelas)
                </div>
                <div>
                  <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
                  <p className="text-[10px] text-slate-500">Tgl: _____ / _____ / 202___</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>{letterheadSettings?.footerText || `Sistem Informasi Manajemen Terintegrasi Build X Pro • ${headerTitle}`}</span>
            <span>Dicetak pada: {currentDateStr}</span>
          </div>
        </div>

        {/* Bottom Bar (Hidden on Print) */}
        <div className="print:hidden px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Unduh file PDF resmi atau kirim ke printer untuk lembar pemeriksaan fisik lapangan.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              title="Unduh berkas PDF blanko"
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
