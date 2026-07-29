import React, { useState } from 'react';
import { Printer, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { generatePdfFromElement } from '../../utils/pdfGenerator';

interface CetakPdfButtonProps {
  elementId: string;
  filename?: string;
  title?: string;
  className?: string;
  variant?: 'emerald' | 'dark' | 'blue' | 'amber';
  label?: string;
}

export const CetakPdfButton: React.FC<CetakPdfButtonProps> = ({
  elementId,
  filename = 'Laporan_Construx_ERP.pdf',
  title = 'Laporan Resmi Construx ERP',
  className = '',
  variant = 'emerald',
  label = 'Cetak PDF',
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePrintPdf = async () => {
    if (loading) return;
    setLoading(true);
    setSuccess(false);

    try {
      const isDownloaded = await generatePdfFromElement({
        elementId,
        filename,
        title,
      });

      if (isDownloaded) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[Cetak PDF] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-900/20 active:scale-[0.98] border border-emerald-500/30';
      case 'dark':
        return 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-white shadow-md shadow-slate-900/30 active:scale-[0.98] border border-slate-700/50';
      case 'blue':
        return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-900/30 active:scale-[0.98] border border-blue-500/30';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-md shadow-amber-900/20 active:scale-[0.98] border border-amber-400/40';
      default:
        return 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-500/30';
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrintPdf}
      disabled={loading}
      className={`font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition disabled:opacity-60 print:hidden cursor-pointer ${getVariantClasses()} ${className}`}
      title="Cetak & Unduh Dokumen PDF Resmi"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Membuat PDF...</span>
        </>
      ) : success ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>PDF Berhasil!</span>
        </>
      ) : (
        <>
          <Printer className="w-4 h-4 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
