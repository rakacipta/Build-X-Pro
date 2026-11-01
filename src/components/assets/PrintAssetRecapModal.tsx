import React from 'react';
import { X, Printer, FileSpreadsheet, Building2, Layers } from 'lucide-react';
import { FixedAsset, CompanyProfile } from '../../types';

interface PrintAssetRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: FixedAsset[];
  categoryFilter?: string;
  companyProfile: CompanyProfile;
}

export const PrintAssetRecapModal: React.FC<PrintAssetRecapModalProps> = ({
  isOpen,
  onClose,
  assets,
  categoryFilter,
  companyProfile,
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

  const now = new Date();

  // Calculate depreciation and net book values for each asset
  const calculatedAssets = assets.map((asset) => {
    const pDate = new Date(asset.purchaseDate);
    const monthsElapsed = Math.max(
      0,
      (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth())
    );
    const totalMonths = (asset.usefulLifeYears || 5) * 12;
    const depreciableAmount = Math.max(0, asset.purchasePrice - (asset.salvageValue || 0));
    const monthlyDepreciation = totalMonths > 0 ? depreciableAmount / totalMonths : 0;
    const effectiveMonths = Math.min(monthsElapsed, totalMonths);
    const accumulatedDepreciation = Math.round(monthlyDepreciation * effectiveMonths);
    const currentBookValue = Math.max(
      asset.salvageValue || 0,
      asset.purchasePrice - accumulatedDepreciation
    );

    return {
      ...asset,
      monthlyDepreciation,
      accumulatedDepreciation,
      currentBookValue,
      monthsElapsed: effectiveMonths,
    };
  });

  const totalAcquisition = calculatedAssets.reduce((sum, a) => sum + a.purchasePrice, 0);
  const totalAccumulatedDepreciation = calculatedAssets.reduce(
    (sum, a) => sum + a.accumulatedDepreciation,
    0
  );
  const totalBookValue = calculatedAssets.reduce((sum, a) => sum + a.currentBookValue, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[92vh]">
        {/* Header - Screen Only */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 print:hidden shrink-0">
          <div>
            <h2 className="text-base font-bold">Laporan Rekapitulasi Aktiva Tetap (Fixed Asset Register)</h2>
            <p className="text-xs text-slate-400">
              Kompilasi nilai perolehan, umur ekonomis, akumulasi penyusutan, dan nilai buku aktiva
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto bg-white print:p-0 flex-1 text-slate-900 text-xs">
          {/* Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-700 text-white rounded-xl flex items-center justify-center font-black text-xl">
                BX
              </div>
              <div>
                <h1 className="text-lg font-black uppercase text-slate-900">
                  {companyProfile.name || 'PT. RAKA CIPTA SERAYA'}
                </h1>
                <p className="text-[11px] text-slate-600">
                  {companyProfile.address || 'Gedung Wisma Perkasa Lt. 8, Jl. Jend. Sudirman Kav. 45, Jakarta Selatan'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
                REKAPITULASI DAFTAR AKTIVA TETAP
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Per Tanggal: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              {categoryFilter && categoryFilter !== 'Semua' && (
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] mt-1">
                  Kategori: {categoryFilter}
                </span>
              )}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Total Unit Terdata</span>
              <span className="text-base font-bold text-slate-900">{calculatedAssets.length} Unit</span>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
              <span className="text-[10px] text-blue-700 uppercase block">Total Nilai Perolehan</span>
              <span className="text-sm font-bold text-blue-900">{formatRupiah(totalAcquisition)}</span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <span className="text-[10px] text-amber-700 uppercase block">Total Akumulasi Depresiasi</span>
              <span className="text-sm font-bold text-amber-900">{formatRupiah(totalAccumulatedDepreciation)}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <span className="text-[10px] text-emerald-700 uppercase block">Total Nilai Buku Bersih (NBV)</span>
              <span className="text-sm font-bold text-emerald-900">{formatRupiah(totalBookValue)}</span>
            </div>
          </div>

          {/* Asset Register Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                  <th className="p-2 border border-slate-300 text-left">Kode Tag</th>
                  <th className="p-2 border border-slate-300 text-left">Nama Aset & Spesifikasi</th>
                  <th className="p-2 border border-slate-300 text-left">Kategori</th>
                  <th className="p-2 border border-slate-300 text-left">Lokasi / Proyek</th>
                  <th className="p-2 border border-slate-300 text-left">PIC</th>
                  <th className="p-2 border border-slate-300 text-center">Tgl Beli</th>
                  <th className="p-2 border border-slate-300 text-right">Harga Perolehan</th>
                  <th className="p-2 border border-slate-300 text-right">Akumulasi Depr.</th>
                  <th className="p-2 border border-slate-300 text-right">Nilai Buku</th>
                  <th className="p-2 border border-slate-300 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calculatedAssets.map((asset, idx) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-mono text-[10px]">
                      {idx + 1}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">
                      {asset.assetCode}
                    </td>
                    <td className="p-1.5 border border-slate-300">
                      <div className="font-semibold text-slate-900">{asset.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {asset.brand && `${asset.brand} `}
                        {asset.modelNumber && `(${asset.modelNumber})`}
                        {asset.serialNumber && ` • S/N: ${asset.serialNumber}`}
                      </div>
                    </td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">{asset.category}</td>
                    <td className="p-1.5 border border-slate-300">
                      <span className="font-medium">
                        {asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType}
                      </span>
                    </td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">{asset.personInCharge}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-mono text-[10px]">
                      {asset.purchaseDate}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold">
                      {formatRupiah(asset.purchasePrice)}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono text-amber-800">
                      {formatRupiah(asset.accumulatedDepreciation)}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-emerald-800">
                      {formatRupiah(asset.currentBookValue)}
                    </td>
                    <td className="p-1.5 border border-slate-300 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-800">
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <tr>
                  <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase">
                    Total Keseluruhan:
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono text-blue-900">
                    {formatRupiah(totalAcquisition)}
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono text-amber-900">
                    {formatRupiah(totalAccumulatedDepreciation)}
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono text-emerald-900">
                    {formatRupiah(totalBookValue)}
                  </td>
                  <td className="p-2 border border-slate-300"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs break-inside-avoid">
            <div>
              <p className="text-slate-500 mb-14">Petugas Inventarisasi Lapangan</p>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">
                Hendra Setiawan, ST
              </p>
              <p className="text-[10px] text-slate-500">Asset & Logistics Coordinator</p>
            </div>
            <div>
              <p className="text-slate-500 mb-14">Diverifikasi Bagian Akuntansi</p>
              <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">
                Novia Rahmawati, SE
              </p>
              <p className="text-[10px] text-slate-500">Accounting Supervisor</p>
            </div>
            <div>
              <p className="text-slate-500 mb-14">Menyetujui Direktur Operasional</p>
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
