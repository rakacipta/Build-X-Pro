import React, { useState } from 'react';
import { X, Wrench, Calendar, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FixedAsset, AssetMaintenanceLog } from '../../types';

interface AssetMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FixedAsset;
  onSaveMaintenance: (updatedAsset: FixedAsset) => void;
}

export const AssetMaintenanceModal: React.FC<AssetMaintenanceModalProps> = ({
  isOpen,
  onClose,
  asset,
  onSaveMaintenance,
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<
    'Servis Rutin' | 'Perbaikan Kerusakan' | 'Kalibrasi Uji' | 'Penggantian Suku Cadang'
  >('Kalibrasi Uji');
  const [description, setDescription] = useState<string>('');
  const [cost, setCost] = useState<number>(0);
  const [performedBy, setPerformedBy] = useState<string>('');
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [conditionAfter, setConditionAfter] = useState(asset.condition);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: AssetMaintenanceLog = {
      id: `mnt-${Date.now()}`,
      assetId: asset.id,
      date,
      type,
      description: description.trim() || `${type} berkala`,
      cost: Number(cost) || 0,
      performedBy: performedBy.trim() || 'Vendor Servis Resmi',
      nextDueDate: nextDueDate || undefined,
      notes: notes.trim() || undefined,
    };

    const updatedAsset: FixedAsset = {
      ...asset,
      lastMaintenanceDate: date,
      nextCalibrationDate: type === 'Kalibrasi Uji' && nextDueDate ? nextDueDate : asset.nextCalibrationDate,
      condition: conditionAfter,
      status: asset.status === 'Dalam Perbaikan' ? 'Aktif Digunakan' : asset.status,
      maintenanceHistory: [newLog, ...(asset.maintenanceHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    onSaveMaintenance(updatedAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Catat Servis / Kalibrasi</h2>
              <p className="text-xs text-slate-400">Pemeliharaan & Sertifikasi Akurasi Instrumen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex justify-between font-semibold text-slate-500 mb-0.5">
              <span>{asset.assetCode}</span>
              <span className="text-blue-600">{asset.brand}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Pemeliharaan
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="Kalibrasi Uji">Kalibrasi Uji (Sertifikasi)</option>
                <option value="Servis Rutin">Servis Rutin / Berkala</option>
                <option value="Perbaikan Kerusakan">Perbaikan Kerusakan</option>
                <option value="Penggantian Suku Cadang">Penggantian Suku Cadang</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengerjaan
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Pekerjaan / No. Sertifikat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Kalibrasi prisma & kompensator, sertifikat No. KAL/2026/041"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biaya Pengerjaan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teknisi / Laboratorium Kalibrasi
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="Contoh: Lab Kalibrasi B4T Bandung"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jatuh Tempo Kalibrasi Berikutnya
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
              />
              <span className="text-[10px] text-slate-500">Masa berlaku biasanya 6-12 bulan</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Fisik Setelah Servis
              </label>
              <select
                value={conditionAfter}
                onChange={(e) => setConditionAfter(e.target.value as any)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="Sangat Baik">Sangat Baik</option>
                <option value="Baik / Normal">Baik / Normal</option>
                <option value="Perlu Servis Minor">Perlu Servis Minor</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Hasil Inspeksi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Toleransi sudut masih dalam batas aman +/- 2 detik..."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Riwayat Pemeliharaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
