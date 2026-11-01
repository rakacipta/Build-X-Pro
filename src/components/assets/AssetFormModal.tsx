import React, { useState } from 'react';
import { X, Save, AlertCircle, Sparkles, Building2, Calendar, DollarSign, Tag, Wrench } from 'lucide-react';
import {
  FixedAsset,
  FixedAssetCategory,
  FixedAssetStatus,
  FixedAssetCondition,
  DepreciationMethod,
  Project,
} from '../../types';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: FixedAsset) => void;
  assetToEdit?: FixedAsset | null;
  projects: Project[];
}

const CATEGORIES: FixedAssetCategory[] = [
  'Peralatan Kantor & IT',
  'Peralatan Proyek & Lapangan',
  'Kendaraan & Transportasi',
  'Fasilitas & Bangunan Site',
  'Mesin & Workshop',
  'Lainnya',
];

const STATUSES: FixedAssetStatus[] = [
  'Aktif Digunakan',
  'Tersedia di Gudang',
  'Dalam Perbaikan',
  'Dipinjam / Mutasi Proyek',
  'Rusak / Afkir',
];

const CONDITIONS: FixedAssetCondition[] = [
  'Sangat Baik',
  'Baik / Normal',
  'Perlu Servis Minor',
  'Rusak Ringan',
  'Rusak Berat',
];

const DEPRECIATION_METHODS: DepreciationMethod[] = [
  'Garis Lurus (Straight Line)',
  'Saldo Menurun (Declining Balance)',
  'Tanpa Penyusutan (Non-Depreciable)',
];

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assetToEdit,
  projects,
}) => {
  if (!isOpen) return null;

  const isEditing = !!assetToEdit;

  const generateCode = (cat: FixedAssetCategory) => {
    const prefixMap: Record<FixedAssetCategory, string> = {
      'Peralatan Kantor & IT': 'AST-OFF',
      'Peralatan Proyek & Lapangan': 'AST-PRJ',
      'Kendaraan & Transportasi': 'AST-VEH',
      'Fasilitas & Bangunan Site': 'AST-FAC',
      'Mesin & Workshop': 'AST-MCH',
      'Lainnya': 'AST-GEN',
    };
    const prefix = prefixMap[cat] || 'AST-GEN';
    const randNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randNum}`;
  };

  const [assetCode, setAssetCode] = useState(assetToEdit?.assetCode || generateCode('Peralatan Proyek & Lapangan'));
  const [name, setName] = useState(assetToEdit?.name || '');
  const [category, setCategory] = useState<FixedAssetCategory>(
    assetToEdit?.category || 'Peralatan Proyek & Lapangan'
  );
  const [brand, setBrand] = useState(assetToEdit?.brand || '');
  const [modelNumber, setModelNumber] = useState(assetToEdit?.modelNumber || '');
  const [serialNumber, setSerialNumber] = useState(assetToEdit?.serialNumber || '');
  const [locationType, setLocationType] = useState<
    'Kantor Pusat' | 'Proyek' | 'Gudang Utama' | 'Workshop Fabrikasi'
  >(assetToEdit?.locationType || 'Proyek');
  const [projectId, setProjectId] = useState(assetToEdit?.projectId || '');
  const [specificLocation, setSpecificLocation] = useState(assetToEdit?.specificLocation || '');
  const [personInCharge, setPersonInCharge] = useState(assetToEdit?.personInCharge || '');
  const [picRole, setPicRole] = useState(assetToEdit?.picRole || '');
  const [purchaseDate, setPurchaseDate] = useState(
    assetToEdit?.purchaseDate || new Date().toISOString().split('T')[0]
  );
  const [purchasePrice, setPurchasePrice] = useState<number>(assetToEdit?.purchasePrice || 0);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(assetToEdit?.usefulLifeYears || 5);
  const [salvageValue, setSalvageValue] = useState<number>(assetToEdit?.salvageValue || 0);
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>(
    assetToEdit?.depreciationMethod || 'Garis Lurus (Straight Line)'
  );
  const [coaAccount, setCoaAccount] = useState(assetToEdit?.coaAccount || '1-1320 Peralatan Proyek & Lapangan');
  const [status, setStatus] = useState<FixedAssetStatus>(assetToEdit?.status || 'Aktif Digunakan');
  const [condition, setCondition] = useState<FixedAssetCondition>(assetToEdit?.condition || 'Baik / Normal');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(assetToEdit?.lastMaintenanceDate || '');
  const [nextCalibrationDate, setNextCalibrationDate] = useState(assetToEdit?.nextCalibrationDate || '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(assetToEdit?.warrantyExpiry || '');
  const [photoUrl, setPhotoUrl] = useState(assetToEdit?.photoUrl || '');
  const [notes, setNotes] = useState(assetToEdit?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCategoryChange = (newCat: FixedAssetCategory) => {
    setCategory(newCat);
    if (!isEditing) {
      setAssetCode(generateCode(newCat));
      // Auto-suggest COA
      if (newCat === 'Peralatan Kantor & IT') {
        setCoaAccount('1-1310 Peralatan Kantor & IT');
        setUsefulLifeYears(4);
      } else if (newCat === 'Peralatan Proyek & Lapangan') {
        setCoaAccount('1-1320 Peralatan Proyek & Lapangan');
        setUsefulLifeYears(5);
      } else if (newCat === 'Kendaraan & Transportasi') {
        setCoaAccount('1-1330 Kendaraan Operasional');
        setUsefulLifeYears(8);
      } else if (newCat === 'Fasilitas & Bangunan Site') {
        setCoaAccount('1-1350 Fasilitas Modular Proyek');
        setUsefulLifeYears(5);
      } else if (newCat === 'Mesin & Workshop') {
        setCoaAccount('1-1340 Mesin & Peralatan Workshop');
        setUsefulLifeYears(6);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama aset wajib diisi!');
      return;
    }
    if (!assetCode.trim()) {
      setErrorMsg('Kode aset wajib diisi!');
      return;
    }
    if (purchasePrice < 0) {
      setErrorMsg('Harga perolehan tidak valid!');
      return;
    }

    const selectedProj = projects.find((p) => p.id === projectId);

    const assetData: FixedAsset = {
      id: assetToEdit?.id || `ast-${Date.now()}`,
      assetCode: assetCode.trim().toUpperCase(),
      name: name.trim(),
      category,
      brand: brand.trim(),
      modelNumber: modelNumber.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      locationType,
      projectId: locationType === 'Proyek' ? projectId : undefined,
      projectName: locationType === 'Proyek' ? selectedProj?.name : undefined,
      specificLocation: specificLocation.trim() || undefined,
      personInCharge: personInCharge.trim() || 'Tim Logistik Proyek',
      picRole: picRole.trim() || undefined,
      purchaseDate,
      purchasePrice: Number(purchasePrice),
      usefulLifeYears: Number(usefulLifeYears) || 5,
      salvageValue: Number(salvageValue) || 0,
      depreciationMethod,
      coaAccount: coaAccount.trim(),
      status,
      condition,
      lastMaintenanceDate: lastMaintenanceDate || undefined,
      nextCalibrationDate: nextCalibrationDate || undefined,
      warrantyExpiry: warrantyExpiry || undefined,
      photoUrl: photoUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      maintenanceHistory: assetToEdit?.maintenanceHistory || [],
      transferHistory: assetToEdit?.transferHistory || [],
      createdAt: assetToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(assetData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
              <Tag className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? 'Edit Data Aktiva Tetap (Asset)' : 'Pendaftaran Aset Tetap Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Peralatan Kantor & IT, Alat Proyek/Surveyor, Kendaraan, dan Fasilitas Konstruksi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Identifikasi Aset */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Tag className="w-4 h-4 text-blue-600" /> Identitas & Klasifikasi Aset
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Aset <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as FixedAssetCategory)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Tag Aset (Bar/QR) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: AST-PRJ-001"
                    className="w-full text-sm font-mono font-bold uppercase rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAssetCode(generateCode(category))}
                    title="Generate kode unik otomatis"
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Operasional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FixedAssetStatus)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Aset & Spesifikasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Total Station Topcon GM-55 Dual Display Reflectorless 500m"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merek / Brand <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Contoh: Topcon / Asus / Toyota / Yanmar"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe / Model
                  </label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="GM-55"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serial Number (S/N)
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="SN-9988220"
                    className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Lokasi & Penanggung Jawab */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building2 className="w-4 h-4 text-emerald-600" /> Penempatan Lokasi & Penanggung Jawab (PIC)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Lokasi
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Kantor Pusat">Kantor Pusat</option>
                  <option value="Proyek">Proyek Konstruksi</option>
                  <option value="Gudang Utama">Gudang Utama</option>
                  <option value="Workshop Fabrikasi">Workshop Fabrikasi</option>
                </select>
              </div>

              {locationType === 'Proyek' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proyek Terkait <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required={locationType === 'Proyek'}
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Spesifik / Ruangan
                  </label>
                  <input
                    type="text"
                    value={specificLocation}
                    onChange={(e) => setSpecificLocation(e.target.value)}
                    placeholder="Contoh: Lt. 8 Ruang Direksi / Gudang A Rak 4"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kondisi Fisik
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as FixedAssetCondition)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penanggung Jawab (PIC)
                </label>
                <input
                  type="text"
                  value={personInCharge}
                  onChange={(e) => setPersonInCharge(e.target.value)}
                  placeholder="Contoh: Hendra Setiawan / Tim Surveyor"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Unit Kerja PIC
                </label>
                <input
                  type="text"
                  value={picRole}
                  onChange={(e) => setPicRole(e.target.value)}
                  placeholder="Contoh: Chief Surveyor / Site Manager / Driver"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Finansial & Kalkulasi Penyusutan */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <DollarSign className="w-4 h-4 text-amber-600" /> Nilai Finansial & Penyusutan (Depresiasi)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Perolehan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Perolehan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-sm font-mono font-bold rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Umur Ekonomis (Tahun)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={usefulLifeYears}
                  onChange={(e) => setUsefulLifeYears(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Residu / Sisa (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Penyusutan
                </label>
                <select
                  value={depreciationMethod}
                  onChange={(e) => setDepreciationMethod(e.target.value as DepreciationMethod)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {DEPRECIATION_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Akun Buku Besar (COA)
                </label>
                <input
                  type="text"
                  value={coaAccount}
                  onChange={(e) => setCoaAccount(e.target.value)}
                  placeholder="Contoh: 1-1320 Peralatan Proyek & Lapangan"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance & Kalibrasi */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Wrench className="w-4 h-4 text-purple-600" /> Servis, Kalibrasi & Garansi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jatuh Tempo Kalibrasi Berikutnya
                </label>
                <input
                  type="date"
                  value={nextCalibrationDate}
                  onChange={(e) => setNextCalibrationDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500">Khusus alat ukur/surveyor/uji lapangan</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masa Berlaku Garansi Pabrik
                </label>
                <input
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Aset (URL)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Teknis / Kelengkapan Aksesoris
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Kelengkapan: 2 unit prisma pole, 1 tripod aluminium, charger, sertifikat kalibrasi..."
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Simpan Perubahan Aset' : 'Daftarkan Aset Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
