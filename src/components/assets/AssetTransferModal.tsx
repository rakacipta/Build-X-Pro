import React, { useState } from 'react';
import { X, ArrowRightLeft, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { FixedAsset, AssetTransferLog, Project } from '../../types';

interface AssetTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: FixedAsset;
  projects: Project[];
  onConfirmTransfer: (updatedAsset: FixedAsset) => void;
}

export const AssetTransferModal: React.FC<AssetTransferModalProps> = ({
  isOpen,
  onClose,
  asset,
  projects,
  onConfirmTransfer,
}) => {
  if (!isOpen) return null;

  const [toLocationType, setToLocationType] = useState<
    'Kantor Pusat' | 'Proyek' | 'Gudang Utama' | 'Workshop Fabrikasi'
  >('Proyek');
  const [toProjectId, setToProjectId] = useState<string>('');
  const [specificDestination, setSpecificDestination] = useState<string>('');
  const [handoverBy, setHandoverBy] = useState<string>(asset.personInCharge || '');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [bastDocNo, setBastDocNo] = useState<string>(
    `BAST-MUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [notes, setNotes] = useState<string>('');

  const currentLocationStr =
    asset.locationType === 'Proyek' && asset.projectName
      ? `Proyek: ${asset.projectName} (${asset.specificLocation || 'Site'})`
      : `${asset.locationType} - ${asset.specificLocation || 'Utama'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find((p) => p.id === toProjectId);

    let destinationLocationStr = toLocationType;
    if (toLocationType === 'Proyek' && targetProject) {
      destinationLocationStr = `Proyek: ${targetProject.name} (${specificDestination || 'Site'})`;
    } else if (specificDestination) {
      destinationLocationStr = `${toLocationType} - ${specificDestination}`;
    }

    const newTransferLog: AssetTransferLog = {
      id: `trf-${Date.now()}`,
      assetId: asset.id,
      transferDate,
      fromLocation: currentLocationStr,
      toLocation: destinationLocationStr,
      toProjectId: toLocationType === 'Proyek' ? toProjectId : undefined,
      toProjectName: toLocationType === 'Proyek' ? targetProject?.name : undefined,
      handoverBy: handoverBy.trim() || 'Logistik Pusat',
      receivedBy: receivedBy.trim() || 'PIC Penerima Lapangan',
      bastDocNo: bastDocNo.trim(),
      notes: notes.trim() || undefined,
    };

    const updatedAsset: FixedAsset = {
      ...asset,
      locationType: toLocationType,
      projectId: toLocationType === 'Proyek' ? toProjectId : undefined,
      projectName: toLocationType === 'Proyek' ? targetProject?.name : undefined,
      specificLocation: specificDestination.trim() || undefined,
      personInCharge: receivedBy.trim() || asset.personInCharge,
      status: toLocationType === 'Proyek' ? 'Aktif Digunakan' : 'Tersedia di Gudang',
      transferHistory: [newTransferLog, ...(asset.transferHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    onConfirmTransfer(updatedAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Mutasi & Pemindahan Aset</h2>
              <p className="text-xs text-slate-400">Penerbitan BAST Serah Terima Fisik Alat</p>
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
          {/* Current Asset Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between items-center text-slate-500">
              <span>Kode Tag: <strong className="text-slate-900 font-mono">{asset.assetCode}</strong></span>
              <span className="font-semibold text-blue-600">{asset.category}</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
            <div className="text-slate-600 pt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Lokasi Saat Ini: <strong>{currentLocationStr}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Mutasi Fisik
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. BAST Mutasi
              </label>
              <input
                type="text"
                value={bastDocNo}
                onChange={(e) => setBastDocNo(e.target.value)}
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 uppercase"
                required
              />
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pindah Ke Tipe Lokasi
                </label>
                <select
                  value={toLocationType}
                  onChange={(e) => setToLocationType(e.target.value as any)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="Proyek">Proyek Konstruksi</option>
                  <option value="Gudang Utama">Gudang Utama</option>
                  <option value="Kantor Pusat">Kantor Pusat</option>
                  <option value="Workshop Fabrikasi">Workshop Fabrikasi</option>
                </select>
              </div>

              {toLocationType === 'Proyek' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tujuan Proyek <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={toProjectId}
                    onChange={(e) => setToProjectId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                    required
                  >
                    <option value="">-- Pilih Proyek Tujuan --</option>
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
                    Ruangan / Rak / Area
                  </label>
                  <input
                    type="text"
                    value={specificDestination}
                    onChange={(e) => setSpecificDestination(e.target.value)}
                    placeholder="Contoh: Rak Alat Ukur A-02"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              )}
            </div>

            {toLocationType === 'Proyek' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detail Lokasi Penempatan di Site (Opsional)
                </label>
                <input
                  type="text"
                  value={specificDestination}
                  onChange={(e) => setSpecificDestination(e.target.value)}
                  placeholder="Contoh: Direksi Keet Tower B / Site Office Lantai Dasar"
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            )}
          </div>

          {/* Handover & Receiver */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diserahkan Oleh (Pihak 1)
              </label>
              <input
                type="text"
                value={handoverBy}
                onChange={(e) => setHandoverBy(e.target.value)}
                placeholder="Nama PIC Pengirim"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diterima Oleh (Pihak 2 / PIC Baru)
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Nama PIC Penerima"
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Kondisi Fisik Saat Serah Terima
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kelengkapan box, baterai, kabel charger, lensa bersih..."
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
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Konfirmasi & Cetak Mutasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
