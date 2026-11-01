import React from 'react';
import { X, Printer, Building2, Tag, Calendar, DollarSign, Wrench, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FixedAsset, CompanyProfile, LetterheadSettings } from '../../types';

interface PrintAssetCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FixedAsset;
  companyProfile: CompanyProfile;
  letterhead: LetterheadSettings;
}

export const PrintAssetCardModal: React.FC<PrintAssetCardModalProps> = ({
  isOpen,
  onClose,
  asset,
  companyProfile,
  letterhead,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Straight line depreciation calculations
  const pDate = new Date(asset.purchaseDate);
  const now = new Date();
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth())
  );
  const totalMonths = (asset.usefulLifeYears || 5) * 12;
  const depreciableAmount = Math.max(0, asset.purchasePrice - (asset.salvageValue || 0));
  const monthlyDepreciation = totalMonths > 0 ? depreciableAmount / totalMonths : 0;
  const effectiveMonths = Math.min(monthsElapsed, totalMonths);
  const accumulatedDepreciation = Math.round(monthlyDepreciation * effectiveMonths);
  const currentBookValue = Math.max(asset.salvageValue || 0, asset.purchasePrice - accumulatedDepreciation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[92vh]">
        {/* Header - Screen Only */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 print:hidden shrink-0">
          <div>
            <h2 className="text-base font-bold">Kartu Inventaris Aktiva Tetap (Asset Master Card)</h2>
            <p className="text-xs text-slate-400">Dokumen verifikasi fisik, nilai perolehan, depresiasi & riwayat servis</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu Aset (PDF)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div className="p-8 overflow-y-auto bg-white print:p-0 flex-1 text-slate-900 text-sm">
          {/* Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-700 text-white rounded-xl flex items-center justify-center font-black text-2xl print:border print:border-black">
                BX
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {companyProfile.name || 'PT. RAKA CIPTA SERAYA'}
                </h1>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                  {companyProfile.address || 'Gedung Wisma Perkasa Lt. 8, Jl. Jend. Sudirman Kav. 45, Jakarta Selatan'}
                </p>
                <p className="text-xs text-slate-500">
                  Telp: {companyProfile.phone || '(021) 5290-8800'} | Email: {companyProfile.email || 'corporate@rakaciptaseraya.co.id'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold uppercase rounded print:border print:border-black">
                KARTU AKTIVA TETAP
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-2">
                NO: {asset.assetCode}
              </p>
            </div>
          </div>

          {/* Section: Asset Title & Basic Specs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded">
                  {asset.category}
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded">
                  Status: {asset.status}
                </span>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded">
                  Kondisi: {asset.condition}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {asset.name}
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>Merek / Pabrikan: <strong>{asset.brand || '-'}</strong></div>
                <div>Model / Tipe: <strong>{asset.modelNumber || '-'}</strong></div>
                <div>Serial Number: <strong className="font-mono">{asset.serialNumber || '-'}</strong></div>
                <div>Akun COA: <strong>{asset.coaAccount || '-'}</strong></div>
                <div>Lokasi Penempatan: <strong>{asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType}</strong></div>
                <div>Detail Ruang/Rak: <strong>{asset.specificLocation || 'Utama'}</strong></div>
                <div>Penanggung Jawab (PIC): <strong>{asset.personInCharge}</strong></div>
                <div>Jabatan PIC: <strong>{asset.picRole || '-'}</strong></div>
              </div>
            </div>

            {/* QR Code and Tag Preview */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              <QRCodeSVG
                value={JSON.stringify({
                  code: asset.assetCode,
                  name: asset.name,
                  cat: asset.category,
                  pic: asset.personInCharge,
                })}
                size={110}
                level="M"
              />
              <span className="text-[11px] font-mono font-bold mt-2 text-slate-800">{asset.assetCode}</span>
              <span className="text-[9px] text-slate-500 uppercase">Scan Verifikasi Fisik</span>
            </div>
          </div>

          {/* Section: Financial & Depreciation Schedule */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" /> Nilai Perolehan & Depresiasi Buku
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Tanggal Perolehan:</span>
                <strong className="text-sm">{asset.purchaseDate}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Harga Perolehan (Cost):</span>
                <strong className="text-sm text-blue-700">{formatRupiah(asset.purchasePrice)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Umur Ekonomis / Residu:</span>
                <strong>{asset.usefulLifeYears} Tahun ({totalMonths} Bln) / {formatRupiah(asset.salvageValue)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Metode Penyusutan:</span>
                <strong>{asset.depreciationMethod}</strong>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                <span className="text-[11px] text-blue-700 block font-medium">Beban Penyusutan / Bulan</span>
                <span className="text-sm font-bold text-blue-900">{formatRupiah(monthlyDepreciation)}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <span className="text-[11px] text-amber-700 block font-medium">Akumulasi Penyusutan ({effectiveMonths} Bln)</span>
                <span className="text-sm font-bold text-amber-900">{formatRupiah(accumulatedDepreciation)}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                <span className="text-[11px] text-emerald-700 block font-medium">Nilai Buku Saat Ini (Net Book Value)</span>
                <span className="text-sm font-bold text-emerald-900">{formatRupiah(currentBookValue)}</span>
              </div>
            </div>
          </div>

          {/* Section: Maintenance & Calibration */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-purple-700" /> Riwayat Kalibrasi & Servis Terakhir
            </h3>
            {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? (
              <table className="w-full text-xs border border-slate-200 text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r">Tanggal</th>
                    <th className="p-2 border-r">Tipe Pemeliharaan</th>
                    <th className="p-2 border-r">Deskripsi / No. Sertifikat</th>
                    <th className="p-2 border-r">Pelaksana / Lab</th>
                    <th className="p-2 border-r text-right">Biaya</th>
                    <th className="p-2">Jatuh Tempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {asset.maintenanceHistory.map((m) => (
                    <tr key={m.id}>
                      <td className="p-2 border-r font-mono">{m.date}</td>
                      <td className="p-2 border-r font-semibold">{m.type}</td>
                      <td className="p-2 border-r">{m.description}</td>
                      <td className="p-2 border-r">{m.performedBy}</td>
                      <td className="p-2 border-r text-right font-mono">{formatRupiah(m.cost)}</td>
                      <td className="p-2 font-mono">{m.nextDueDate || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">
                Belum ada riwayat perbaikan atau kalibrasi khusus yang tercatat.
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs break-inside-avoid">
            <div>
              <p className="text-slate-500 mb-16">Pengelola Logistik & Aset</p>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">
                {asset.personInCharge || '( ................................... )'}
              </p>
              <p className="text-[10px] text-slate-500">Asset & Inventory Officer</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Finance & Akuntansi</p>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">
                Novia Rahmawati, SE
              </p>
              <p className="text-[10px] text-slate-500">Head of Finance & Accounting</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Mengetahui Direksi</p>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">
                Ir. Budi Santoso, MT
              </p>
              <p className="text-[10px] text-slate-500">Direktur Operasional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
