import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Printer,
  QrCode,
  Building2,
  Calendar,
  DollarSign,
  Wrench,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  Eye,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Warehouse,
  HardHat,
  Monitor,
  Truck,
  Flame,
} from 'lucide-react';
import {
  FixedAsset,
  FixedAssetCategory,
  FixedAssetStatus,
  FixedAssetCondition,
  Project,
  CompanyProfile,
  LetterheadSettings,
} from '../../types';
import { AssetFormModal } from './AssetFormModal';
import { AssetDetailModal } from './AssetDetailModal';
import { AssetTransferModal } from './AssetTransferModal';
import { AssetMaintenanceModal } from './AssetMaintenanceModal';
import { AssetQrTagPrintModal } from './AssetQrTagPrintModal';
import { PrintAssetCardModal } from './PrintAssetCardModal';
import { PrintAssetRecapModal } from './PrintAssetRecapModal';

interface FixedAssetsModuleProps {
  assets: FixedAsset[];
  projects: Project[];
  companyProfile: CompanyProfile;
  letterhead: LetterheadSettings;
  onSaveAsset: (asset: FixedAsset) => void;
  onDeleteAsset: (id: string) => void;
}

export const FixedAssetsModule: React.FC<FixedAssetsModuleProps> = ({
  assets,
  projects,
  companyProfile,
  letterhead,
  onSaveAsset,
  onDeleteAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'depreciation' | 'maintenance' | 'transfers'>('inventory');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<FixedAsset | null>(null);
  const [assetForDetail, setAssetForDetail] = useState<FixedAsset | null>(null);
  const [assetForTransfer, setAssetForTransfer] = useState<FixedAsset | null>(null);
  const [assetForMaintenance, setAssetForMaintenance] = useState<FixedAsset | null>(null);
  const [assetForCardPrint, setAssetForCardPrint] = useState<FixedAsset | null>(null);
  const [assetForQrPrint, setAssetForQrPrint] = useState<FixedAsset | null>(null);
  const [isBatchQrModalOpen, setIsBatchQrModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);

  const formatRupiah = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const now = new Date();

  // Calculate depreciation and net book values for every asset
  const enrichedAssets = useMemo(() => {
    return assets.map((asset) => {
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

      // Calibration status
      let calibrationDueDays: number | null = null;
      let calibrationUrgency: 'expired' | 'urgent' | 'ok' | 'none' = 'none';

      if (asset.nextCalibrationDate) {
        const calDate = new Date(asset.nextCalibrationDate);
        const diffDays = Math.ceil((calDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        calibrationDueDays = diffDays;
        if (diffDays < 0) {
          calibrationUrgency = 'expired';
        } else if (diffDays <= 30) {
          calibrationUrgency = 'urgent';
        } else {
          calibrationUrgency = 'ok';
        }
      }

      return {
        ...asset,
        calculatedMonthlyDepreciation: monthlyDepreciation,
        calculatedAccumulatedDepreciation: accumulatedDepreciation,
        calculatedCurrentBookValue: currentBookValue,
        monthsElapsed: effectiveMonths,
        totalMonths,
        calibrationDueDays,
        calibrationUrgency,
      };
    });
  }, [assets]);

  // Overall Financial & Count KPI Metrics
  const totalAssetsCount = enrichedAssets.length;
  const totalAcquisitionCost = enrichedAssets.reduce((sum, a) => sum + a.purchasePrice, 0);
  const totalAccumulatedDepr = enrichedAssets.reduce((sum, a) => sum + a.calculatedAccumulatedDepreciation, 0);
  const totalNetBookValue = enrichedAssets.reduce((sum, a) => sum + a.calculatedCurrentBookValue, 0);
  const totalCalibrationAttention = enrichedAssets.filter(
    (a) => a.calibrationUrgency === 'expired' || a.calibrationUrgency === 'urgent'
  ).length;

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return enrichedAssets.filter((asset) => {
      const matchSearch =
        searchQuery === '' ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.brand && asset.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        asset.personInCharge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.projectName && asset.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'Semua' || asset.category === selectedCategory;
      const matchLocation = selectedLocation === 'Semua' || asset.locationType === selectedLocation;
      const matchStatus = selectedStatus === 'Semua' || asset.status === selectedStatus;

      return matchSearch && matchCategory && matchLocation && matchStatus;
    });
  }, [enrichedAssets, searchQuery, selectedCategory, selectedLocation, selectedStatus]);

  // Aggregate all transfer logs for Tab 4
  const allTransferLogs = useMemo(() => {
    const list: {
      logId: string;
      assetId: string;
      assetCode: string;
      assetName: string;
      category: string;
      transferDate: string;
      fromLocation: string;
      toLocation: string;
      handoverBy: string;
      receivedBy: string;
      bastDocNo?: string;
      notes?: string;
    }[] = [];

    assets.forEach((asset) => {
      if (asset.transferHistory && asset.transferHistory.length > 0) {
        asset.transferHistory.forEach((t) => {
          list.push({
            logId: t.id,
            assetId: asset.id,
            assetCode: asset.assetCode,
            assetName: asset.name,
            category: asset.category,
            transferDate: t.transferDate,
            fromLocation: t.fromLocation,
            toLocation: t.toLocation,
            handoverBy: t.handoverBy,
            receivedBy: t.receivedBy,
            bastDocNo: t.bastDocNo,
            notes: t.notes,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
  }, [assets]);

  // Calibration alert items for Tab 3
  const calibrationItems = useMemo(() => {
    return enrichedAssets
      .filter((a) => a.nextCalibrationDate || (a.maintenanceHistory && a.maintenanceHistory.length > 0))
      .sort((a, b) => {
        if (!a.nextCalibrationDate) return 1;
        if (!b.nextCalibrationDate) return -1;
        return new Date(a.nextCalibrationDate).getTime() - new Date(b.nextCalibrationDate).getTime();
      });
  }, [enrichedAssets]);

  const handleDeletePrompt = (id: string, name: string) => {
    if (window.confirm(`Hapus pencatatan aktiva tetap "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      onDeleteAsset(id);
    }
  };

  const getCategoryIcon = (cat: FixedAssetCategory) => {
    switch (cat) {
      case 'Peralatan Kantor & IT':
        return <Monitor className="w-4 h-4 text-blue-500" />;
      case 'Peralatan Proyek & Lapangan':
        return <HardHat className="w-4 h-4 text-amber-500" />;
      case 'Kendaraan & Transportasi':
        return <Truck className="w-4 h-4 text-emerald-500" />;
      case 'Fasilitas & Bangunan Site':
        return <Building2 className="w-4 h-4 text-indigo-500" />;
      case 'Mesin & Workshop':
        return <Flame className="w-4 h-4 text-red-500" />;
      default:
        return <Tag className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
              Aktiva Tetap Perusahaan
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Enterprise Asset & Equipment Registry
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-blue-400" />
            Fixed Assets & Manajemen Aktiva
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Pengelolaan inventaris peralatan kantor & IT, peralatan proyek & instrumen surveyor, kendaraan operasional, serta otomasi penyusutan nilai buku dan jadwal kalibrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBatchQrModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm transition"
            title="Cetak Stiker Label Barcode/QR untuk seluruh aset"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            Label QR Aset
          </button>
          <button
            onClick={() => setIsRecapModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm transition"
            title="Cetak Laporan Rekapitulasi Lengkap (PDF)"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Rekap Aset (PDF)
          </button>
          <button
            onClick={() => {
              setAssetToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-blue-600/30 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Tambah Aset Baru
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Aset</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalAssetsCount} Unit</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-bold">
                {enrichedAssets.filter((a) => a.status === 'Aktif Digunakan').length} Aktif
              </span>
              <span>•</span>
              <span>{enrichedAssets.filter((a) => a.status === 'Tersedia di Gudang').length} Gudang</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Acquisition Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Nilai Perolehan (Cost)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {formatRupiah(totalAcquisitionCost)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Modal kapitalisasi aktiva</div>
          </div>
        </div>

        {/* Metric 3: Accumulated Depreciation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Akumulasi Penyusutan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-700 font-mono">
              -{formatRupiah(totalAccumulatedDepr)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Beban amortisasi & depresiasi</div>
          </div>
        </div>

        {/* Metric 4: Net Book Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Nilai Buku Bersih (NBV)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-700 font-mono">
              {formatRupiah(totalNetBookValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Nilai sisa buku saat ini</div>
          </div>
        </div>

        {/* Metric 5: Calibration / Service Alert */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Perlu Kalibrasi</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalCalibrationAttention > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
            }`}>
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black ${totalCalibrationAttention > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {totalCalibrationAttention} Unit
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalCalibrationAttention > 0 ? 'Mendekati / lewat jatuh tempo' : 'Seluruh instrumen valid'}
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Daftar Inventaris Aset ({filteredAssets.length})
          </button>
          <button
            onClick={() => setActiveTab('depreciation')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'depreciation'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Penyusutan & Nilai Buku (Depreciation)
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'maintenance'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Servis & Kalibrasi Instrumen
            {totalCalibrationAttention > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                {totalCalibrationAttention}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'transfers'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Mutasi Antar Proyek ({allTransferLogs.length})
          </button>
        </div>

        {/* View toggle (Grid / List) for inventory tab */}
        {activeTab === 'inventory' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: INVENTORY & LIST */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode aset, nama alat, merek, serial number, atau nama proyek..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="w-full md:w-56">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="Semua">Semua Kategori Aset</option>
                  <option value="Peralatan Kantor & IT">Peralatan Kantor & IT</option>
                  <option value="Peralatan Proyek & Lapangan">Peralatan Proyek & Lapangan</option>
                  <option value="Kendaraan & Transportasi">Kendaraan & Transportasi</option>
                  <option value="Fasilitas & Bangunan Site">Fasilitas & Bangunan Site</option>
                  <option value="Mesin & Workshop">Mesin & Workshop</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Location Dropdown */}
              <div className="w-full md:w-44">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="Semua">Semua Lokasi</option>
                  <option value="Kantor Pusat">Kantor Pusat</option>
                  <option value="Proyek">Proyek Konstruksi</option>
                  <option value="Gudang Utama">Gudang Utama</option>
                  <option value="Workshop Fabrikasi">Workshop Fabrikasi</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="w-full md:w-44">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif Digunakan">Aktif Digunakan</option>
                  <option value="Tersedia di Gudang">Tersedia di Gudang</option>
                  <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                  <option value="Dipinjam / Mutasi Proyek">Dipinjam / Mutasi Proyek</option>
                  <option value="Rusak / Afkir">Rusak / Afkir</option>
                </select>
              </div>
            </div>

            {/* Category Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
              <span className="text-slate-400 text-[11px] font-semibold shrink-0">Filter Cepat:</span>
              {[
                'Semua',
                'Peralatan Kantor & IT',
                'Peralatan Proyek & Lapangan',
                'Kendaraan & Transportasi',
                'Fasilitas & Bangunan Site',
                'Mesin & Workshop',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Kode Aset</th>
                      <th className="py-3 px-4">Nama Aset & Spesifikasi</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Lokasi & PIC</th>
                      <th className="py-3 px-4 text-right">Harga Perolehan</th>
                      <th className="py-3 px-4 text-right">Nilai Buku</th>
                      <th className="py-3 px-4 text-center">Status & Kondisi</th>
                      <th className="py-3 px-4 text-center">Kalibrasi</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-blue-50/40 transition group"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-800 border border-slate-200">
                              {asset.assetCode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {asset.photoUrl ? (
                                <img
                                  src={asset.photoUrl}
                                  alt={asset.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                  {getCategoryIcon(asset.category)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div
                                  onClick={() => setAssetForDetail(asset)}
                                  className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                                >
                                  {asset.name}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  {asset.brand && <span>{asset.brand}</span>}
                                  {asset.serialNumber && (
                                    <span>• S/N: <strong className="font-mono">{asset.serialNumber}</strong></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                              {getCategoryIcon(asset.category)}
                              {asset.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">
                              {asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              PIC: {asset.personInCharge}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                            {formatRupiah(asset.purchasePrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {formatRupiah(asset.calculatedCurrentBookValue)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap space-y-1">
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  asset.status === 'Aktif Digunakan'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : asset.status === 'Tersedia di Gudang'
                                    ? 'bg-blue-100 text-blue-800'
                                    : asset.status === 'Dalam Perbaikan'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {asset.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Kondisi: {asset.condition}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {asset.nextCalibrationDate ? (
                              <div className="space-y-0.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    asset.calibrationUrgency === 'expired'
                                      ? 'bg-red-100 text-red-800'
                                      : asset.calibrationUrgency === 'urgent'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {asset.calibrationUrgency === 'expired'
                                    ? 'KEDALUWARSA'
                                    : asset.calibrationUrgency === 'urgent'
                                    ? `${asset.calibrationDueDays} Hari Lagi`
                                    : 'Valid'}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {asset.nextCalibrationDate}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setAssetForDetail(asset)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Lihat Detail Lengkap & Histori"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAssetForTransfer(asset)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Mutasi / Pindahkan Lokasi"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAssetForMaintenance(asset)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                title="Catat Servis / Kalibrasi"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAssetForQrPrint(asset)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Cetak Label Barcode/QR"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAssetForCardPrint(asset)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Cetak Kartu Aset Resmi"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAssetToEdit(asset);
                                  setIsFormModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Data"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePrompt(asset.id, asset.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Hapus Aset"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400">
                          Tidak ada aset yang sesuai kriteria pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-blue-300 transition"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {asset.assetCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asset.status === 'Aktif Digunakan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {asset.photoUrl ? (
                        <img
                          src={asset.photoUrl}
                          alt={asset.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                          {getCategoryIcon(asset.category)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3
                          onClick={() => setAssetForDetail(asset)}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                        >
                          {asset.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          {getCategoryIcon(asset.category)}
                          <span className="truncate">{asset.category}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Lokasi</span>
                        <strong className="text-slate-800 truncate block">
                          {asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">PIC</span>
                        <strong className="text-slate-800 truncate block">{asset.personInCharge}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Harga Beli:</span>
                        <strong className="font-mono text-slate-900">{formatRupiah(asset.purchasePrice)}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 block">Nilai Buku:</span>
                        <strong className="font-mono text-emerald-700 font-bold">
                          {formatRupiah(asset.calculatedCurrentBookValue)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setAssetForDetail(asset)}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      Detail & Riwayat <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAssetForTransfer(asset)}
                        className="p-1.5 text-slate-500 hover:text-amber-600"
                        title="Mutasi"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setAssetForQrPrint(asset)}
                        className="p-1.5 text-slate-500 hover:text-blue-600"
                        title="Cetak Label QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setAssetToEdit(asset);
                          setIsFormModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPRECIATION SCHEDULE & NET BOOK VALUES */}
      {activeTab === 'depreciation' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                Jadwal & Kalkulasi Depresiasi Garis Lurus (Straight-Line)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rumus: (Harga Perolehan - Nilai Residu) / (Umur Ekonomis × 12 Bulan). Nilai buku dihitung otomatis per bulan berjalan.
              </p>
            </div>
            <button
              onClick={() => setIsRecapModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan Depresiasi (PDF)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Kode & Nama Aset</th>
                    <th className="py-3 px-4 text-center">Tgl Beli</th>
                    <th className="py-3 px-4 text-center">Umur (Thn)</th>
                    <th className="py-3 px-4 text-right">Harga Perolehan</th>
                    <th className="py-3 px-4 text-right">Nilai Residu</th>
                    <th className="py-3 px-4 text-right">Depr / Bulan</th>
                    <th className="py-3 px-4 text-center">Bulan Berlalu</th>
                    <th className="py-3 px-4 text-right">Akumulasi Depr.</th>
                    <th className="py-3 px-4 text-right">Nilai Buku (NBV)</th>
                    <th className="py-3 px-4">Akun Buku Besar (COA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrichedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{asset.assetCode}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">{asset.name}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                        {asset.purchaseDate}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {asset.usefulLifeYears} Thn
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatRupiah(asset.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatRupiah(asset.salvageValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 font-medium">
                        {formatRupiah(asset.calculatedMonthlyDepreciation)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">
                        {asset.monthsElapsed} / {asset.totalMonths} bln
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                        -{formatRupiah(asset.calculatedAccumulatedDepreciation)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        {formatRupiah(asset.calculatedCurrentBookValue)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {asset.coaAccount || '1-1300 Aktiva Tetap'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right uppercase">
                      Total Keseluruhan:
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900">
                      {formatRupiah(totalAcquisitionCost)}
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="py-3 px-4 text-right font-mono text-amber-800">
                      -{formatRupiah(totalAccumulatedDepr)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-800">
                      {formatRupiah(totalNetBookValue)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CALIBRATION & MAINTENANCE SCHEDULE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600" />
                Jadwal Kalibrasi & Servis Instrumen Surveyor / Lapangan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring berkala akurasi alat ukur konstruksi (Total Station, Theodolite, Waterpass) & servis mesin proyek.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calibrationItems.map((asset) => (
              <div
                key={asset.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 ${
                  asset.calibrationUrgency === 'expired'
                    ? 'border-red-300 bg-red-50/20'
                    : asset.calibrationUrgency === 'urgent'
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {asset.assetCode}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">{asset.name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asset.calibrationUrgency === 'expired'
                        ? 'bg-red-500 text-white'
                        : asset.calibrationUrgency === 'urgent'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {asset.calibrationUrgency === 'expired'
                      ? 'KEDALUWARSA'
                      : asset.calibrationUrgency === 'urgent'
                      ? 'SEGERA JATUH TEMPO'
                      : 'TERKALIBRASI'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Jatuh Tempo:</span>
                    <strong className="text-slate-900">{asset.nextCalibrationDate || 'Belum diatur'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Servis Terakhir:</span>
                    <strong className="text-slate-900">{asset.lastMaintenanceDate || '-'}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Lokasi / PIC:</span>
                    <span className="font-semibold text-slate-800">
                      {asset.projectName ? `Proyek ${asset.projectName}` : asset.locationType} ({asset.personInCharge})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setAssetForDetail(asset)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Lihat Sertifikat & Histori
                  </button>
                  <button
                    onClick={() => setAssetForMaintenance(asset)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Catat Servis Baru
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TRANSFERS & MOVEMENTS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                Histori Mutasi & Pemindahan Fisik Antar Proyek (BAST)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pergerakan aset dari Gudang Pusat ke Site Proyek maupun rotasi antar site konstruksi.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">No. BAST</th>
                    <th className="py-3 px-4 text-center">Tanggal Mutasi</th>
                    <th className="py-3 px-4">Kode & Nama Aset</th>
                    <th className="py-3 px-4">Dari Lokasi</th>
                    <th className="py-3 px-4">Tujuan Lokasi</th>
                    <th className="py-3 px-4">Diserahkan Oleh</th>
                    <th className="py-3 px-4">Diterima Oleh</th>
                    <th className="py-3 px-4">Kondisi & Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTransferLogs.length > 0 ? (
                    allTransferLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {log.bastDocNo || 'BAST-MUTASI'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                          {log.transferDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{log.assetCode}</span>
                          <span className="text-[11px] text-slate-600 line-clamp-1">{log.assetName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                            {log.fromLocation}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-medium">
                            {log.toLocation}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{log.handoverBy}</td>
                        <td className="py-3 px-4 font-semibold text-emerald-800">{log.receivedBy}</td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                          {log.notes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        Belum ada riwayat mutasi aset yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isFormModalOpen && (
        <AssetFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setAssetToEdit(null);
          }}
          onSave={onSaveAsset}
          assetToEdit={assetToEdit}
          projects={projects}
        />
      )}

      {assetForDetail && (
        <AssetDetailModal
          isOpen={!!assetForDetail}
          onClose={() => setAssetForDetail(null)}
          asset={assetForDetail}
          onEdit={(asset) => {
            setAssetForDetail(null);
            setAssetToEdit(asset);
            setIsFormModalOpen(true);
          }}
          onUpdateAsset={(updated) => {
            onSaveAsset(updated);
            setAssetForDetail(updated);
          }}
          projects={projects}
          companyProfile={companyProfile}
          letterhead={letterhead}
        />
      )}

      {assetForTransfer && (
        <AssetTransferModal
          isOpen={!!assetForTransfer}
          onClose={() => setAssetForTransfer(null)}
          asset={assetForTransfer}
          projects={projects}
          onConfirmTransfer={(updated) => {
            onSaveAsset(updated);
            setAssetForTransfer(null);
          }}
        />
      )}

      {assetForMaintenance && (
        <AssetMaintenanceModal
          isOpen={!!assetForMaintenance}
          onClose={() => setAssetForMaintenance(null)}
          asset={assetForMaintenance}
          onSaveMaintenance={(updated) => {
            onSaveAsset(updated);
            setAssetForMaintenance(null);
          }}
        />
      )}

      {assetForCardPrint && (
        <PrintAssetCardModal
          isOpen={!!assetForCardPrint}
          onClose={() => setAssetForCardPrint(null)}
          asset={assetForCardPrint}
          companyProfile={companyProfile}
          letterhead={letterhead}
        />
      )}

      {assetForQrPrint && (
        <AssetQrTagPrintModal
          isOpen={!!assetForQrPrint}
          onClose={() => setAssetForQrPrint(null)}
          assets={[assetForQrPrint]}
          selectedAsset={assetForQrPrint}
        />
      )}

      {isBatchQrModalOpen && (
        <AssetQrTagPrintModal
          isOpen={isBatchQrModalOpen}
          onClose={() => setIsBatchQrModalOpen(false)}
          assets={filteredAssets}
          selectedAsset={null}
        />
      )}

      {isRecapModalOpen && (
        <PrintAssetRecapModal
          isOpen={isRecapModalOpen}
          onClose={() => setIsRecapModalOpen(false)}
          assets={filteredAssets}
          categoryFilter={selectedCategory}
          companyProfile={companyProfile}
        />
      )}
    </div>
  );
};
