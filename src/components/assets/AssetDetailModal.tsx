import React, { useState } from 'react';
import {
  X,
  Tag,
  Building2,
  Calendar,
  DollarSign,
  Wrench,
  ArrowRightLeft,
  Printer,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Edit,
  Clock,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FixedAsset, CompanyProfile, LetterheadSettings, Project } from '../../types';
import { AssetTransferModal } from './AssetTransferModal';
import { AssetMaintenanceModal } from './AssetMaintenanceModal';
import { PrintAssetCardModal } from './PrintAssetCardModal';
import { AssetQrTagPrintModal } from './AssetQrTagPrintModal';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FixedAsset;
  onEdit: (asset: FixedAsset) => void;
  onUpdateAsset: (asset: FixedAsset) => void;
  projects: Project[];
  companyProfile: CompanyProfile;
  letterhead: LetterheadSettings;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onUpdateAsset,
  projects,
  companyProfile,
  letterhead,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'transfers'>('overview');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isPrintCardOpen, setIsPrintCardOpen] = useState(false);
  const [isPrintQrTagOpen, setIsPrintQrTagOpen] = useState(false);

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
  const percentDepreciated = Math.min(
    100,
    Math.round((accumulatedDepreciation / (asset.purchasePrice || 1)) * 100)
  );

  // Calibration alert check
  let calibrationStatus: 'valid' | 'warning' | 'expired' | 'none' = 'none';
  let daysToCalibration = 0;
  if (asset.nextCalibrationDate) {
    const calDate = new Date(asset.nextCalibrationDate);
    const diffTime = calDate.getTime() - now.getTime();
    daysToCalibration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysToCalibration < 0) {
      calibrationStatus = 'expired';
    } else if (daysToCalibration <= 30) {
      calibrationStatus = 'warning';
    } else {
      calibrationStatus = 'valid';
    }
  }

  const qrPayload = JSON.stringify({
    code: asset.assetCode,
    name: asset.name,
    cat: asset.category,
    loc: asset.projectName || asset.locationType,
    pic: asset.personInCharge,
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                <Tag className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700">
                    {asset.assetCode}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">| {asset.category}</span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug line-clamp-1 mt-0.5">
                  {asset.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintQrTagOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                title="Cetak Label QR Barcode"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                Label QR
              </button>
              <button
                onClick={() => setIsPrintCardOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                title="Cetak Kartu Inventaris Resmi"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                Kartu Aset
              </button>
              <button
                onClick={() => onEdit(asset)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" /> Ikhtisar & Nilai Buku
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'maintenance'
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4" /> Servis & Kalibrasi ({asset.maintenanceHistory?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'transfers'
                  ? 'border-amber-600 text-amber-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" /> Mutasi & BAST ({asset.transferHistory?.length || 0})
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Calibration Notice if applicable */}
                {calibrationStatus === 'expired' && (
                  <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between text-red-800 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <strong className="block font-bold">Kalibrasi Kedaluwarsa!</strong>
                        <span>Masa berlaku sertifikat kalibrasi telah lewat sejak {asset.nextCalibrationDate}. Segera lakukan uji kalibrasi ulang untuk menjamin akurasi alat di proyek.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMaintenanceModalOpen(true)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shrink-0 ml-3"
                    >
                      Catat Kalibrasi
                    </button>
                  </div>
                )}

                {calibrationStatus === 'warning' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <strong className="font-bold block">Kalibrasi Segera Jatuh Tempo ({daysToCalibration} hari lagi)</strong>
                        <span>Jatuh tempo pada {asset.nextCalibrationDate}. Siapkan jadwal pengiriman instrumen ke laboratorium kalibrasi.</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMaintenanceModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 shrink-0 ml-3"
                    >
                      Catat Kalibrasi
                    </button>
                  </div>
                )}

                {/* Top Section: Photo + Key Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Image / QR display */}
                  <div className="space-y-3">
                    <div className="relative aspect-4/3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                      {asset.photoUrl ? (
                        <img
                          src={asset.photoUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-slate-400">
                          <Tag className="w-12 h-12 stroke-[1.5]" />
                          <span className="text-xs mt-1">Tidak ada foto</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                        {asset.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="bg-white p-1.5 rounded-lg border border-slate-200 shrink-0">
                        <QRCodeSVG value={qrPayload} size={54} level="M" />
                      </div>
                      <div className="text-xs min-w-0">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tag Barcode</span>
                        <span className="font-mono font-bold text-slate-900 truncate block">{asset.assetCode}</span>
                        <span className="text-[10px] text-blue-600 cursor-pointer hover:underline" onClick={() => setIsPrintQrTagOpen(true)}>
                          Cetak Stiker Tag
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specification & Physical Attributes */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Merek / Pabrikan</span>
                        <strong className="text-slate-900 text-sm">{asset.brand || '-'}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Model / Nomor Seri</span>
                        <strong className="text-slate-900 font-mono text-sm">
                          {asset.modelNumber || ''} {asset.serialNumber ? `(S/N: ${asset.serialNumber})` : ''}
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Lokasi Penempatan</span>
                        <strong className="text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType}
                        </strong>
                        <span className="text-slate-500 text-[11px] block mt-0.5">
                          Ruang/Rak: {asset.specificLocation || 'Utama'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold uppercase">Penanggung Jawab (PIC)</span>
                        <strong className="text-slate-900 text-sm block mt-0.5">{asset.personInCharge}</strong>
                        <span className="text-slate-500 text-[11px] block mt-0.5">{asset.picRole || 'Operasional'}</span>
                      </div>
                    </div>

                    {/* Financial Value Cards */}
                    <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-xs text-slate-400 font-medium">Buku Nilai Aktiva Tetap</span>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-800">
                          {asset.coaAccount || '1-1320 Aktiva'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-left">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Harga Perolehan</span>
                          <span className="text-sm font-bold text-slate-100">{formatRupiah(asset.purchasePrice)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 block">Akumulasi Depr.</span>
                          <span className="text-sm font-bold text-amber-300">-{formatRupiah(accumulatedDepreciation)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block">Nilai Buku Saat Ini</span>
                          <span className="text-sm font-bold text-emerald-300">{formatRupiah(currentBookValue)}</span>
                        </div>
                      </div>

                      {/* Depreciation Progress */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Depresiasi Berjalan ({monthsElapsed} dari {totalMonths} bulan)</span>
                          <span>{percentDepreciated}% terdepresiasi</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentDepreciated}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {asset.notes && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Catatan / Kelengkapan Aksesoris</span>
                        <p>{asset.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar Bottom */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                    Pindahkan / Mutasi Lokasi
                  </button>
                  <button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Wrench className="w-4 h-4 text-purple-600" />
                    Catat Servis / Kalibrasi
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Maintenance & Calibration History */}
            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Histori Pemeliharaan & Kalibrasi</h3>
                    <p className="text-xs text-slate-500">Log servis berkala, penggantian spare part, dan sertifikasi uji akurasi</p>
                  </div>
                  <button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Wrench className="w-4 h-4" />
                    + Tambah Servis
                  </button>
                </div>

                {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? (
                  <div className="space-y-3">
                    {asset.maintenanceHistory.map((m) => (
                      <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[11px]">
                              {m.type}
                            </span>
                            {m.description}
                          </span>
                          <span className="font-mono font-bold text-slate-700 text-sm">{formatRupiah(m.cost)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                          <div>Tanggal Servis: <strong>{m.date}</strong></div>
                          <div>Vendor / Pelaksana: <strong>{m.performedBy}</strong></div>
                          <div>Jatuh Tempo Berikutnya: <strong className="text-purple-700">{m.nextDueDate || '-'}</strong></div>
                        </div>
                        {m.notes && <p className="text-[11px] text-slate-500 italic">Catatan: {m.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    Belum ada riwayat servis tercatat untuk aset ini.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Transfer & Movement History */}
            {activeTab === 'transfers' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Histori Mutasi Antar Proyek</h3>
                    <p className="text-xs text-slate-500">Daftar pemindahan fisik aset dan nomor BAST serah terima</p>
                  </div>
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    + Buat Mutasi Baru
                  </button>
                </div>

                {asset.transferHistory && asset.transferHistory.length > 0 ? (
                  <div className="space-y-3">
                    {asset.transferHistory.map((t) => (
                      <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            {t.bastDocNo || 'BAST-MUTASI'}
                          </span>
                          <span className="font-semibold text-slate-500">{t.transferDate}</span>
                        </div>
                        <div className="flex items-center gap-3 py-1 font-semibold text-slate-800">
                          <span className="px-2.5 py-1 bg-slate-200 rounded text-slate-700">{t.fromLocation}</span>
                          <ArrowRightLeft className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded">{t.toLocation}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                          <div>Diserahkan Oleh: <strong>{t.handoverBy}</strong></div>
                          <div>Diterima Oleh (PIC Baru): <strong>{t.receivedBy}</strong></div>
                        </div>
                        {t.notes && <p className="text-[11px] text-slate-500 italic">Kondisi Fisik: {t.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    Belum ada riwayat mutasi / pemindahan untuk unit aset ini.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {isTransferModalOpen && (
        <AssetTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          asset={asset}
          projects={projects}
          onConfirmTransfer={(updated) => {
            onUpdateAsset(updated);
            setIsTransferModalOpen(false);
          }}
        />
      )}

      {isMaintenanceModalOpen && (
        <AssetMaintenanceModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          asset={asset}
          onSaveMaintenance={(updated) => {
            onUpdateAsset(updated);
            setIsMaintenanceModalOpen(false);
          }}
        />
      )}

      {isPrintCardOpen && (
        <PrintAssetCardModal
          isOpen={isPrintCardOpen}
          onClose={() => setIsPrintCardOpen(false)}
          asset={asset}
          companyProfile={companyProfile}
          letterhead={letterhead}
        />
      )}

      {isPrintQrTagOpen && (
        <AssetQrTagPrintModal
          isOpen={isPrintQrTagOpen}
          onClose={() => setIsPrintQrTagOpen(false)}
          assets={[asset]}
          selectedAsset={asset}
        />
      )}
    </>
  );
};
