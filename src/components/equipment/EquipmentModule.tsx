import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Wrench,
  Fuel,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Printer,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { Equipment } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface EquipmentModuleProps {
  equipmentList: Equipment[];
  onSaveEquipment: (eq: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
}

export const EquipmentModule: React.FC<EquipmentModuleProps> = ({
  equipmentList,
  onSaveEquipment,
  onDeleteEquipment,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Partial<Equipment> | null>(null);

  const filteredEq = equipmentList.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.operator.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingEq({
      id: 'eq-' + Date.now(),
      code: `EQ-ALAT-0${equipmentList.length + 1}`,
      name: '',
      type: 'Excavator',
      operator: '',
      status: 'Ready',
      operatingHours: 1200,
      fuelCostThisMonth: 0,
      hourlyRate: 350000,
      lastServiceDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEq && editingEq.name) {
      onSaveEquipment(editingEq as Equipment);
      setIsModalOpen(false);
      setEditingEq(null);
    }
  };

  return (
    <div id="equipment-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN ALAT BERAT & FLEET MANAGEMENT"
        subtitle="Status Armada Excavator/Crane, Jam Kerja (Hour Meter), Biaya Bahan Bakar & Jadwal Servis"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Alat Berat & Fleet Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan armada excavator, crane, dump truck, jam kerja (HM), BBM, & pemeliharaan berkala.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="equipment-module"
            filename="Laporan_Alat_Berat_Build_X_Pro.pdf"
            title="Laporan Alat Berat & Fleet Management"
            variant="emerald"
          />
          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Registrasi Alat Berat Baru
          </button>
        </div>
      </div>

      {/* Equipment Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredEq.map((eq) => {
          let statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          if (eq.status === 'Maintenance') statusColor = 'bg-amber-100 text-amber-800 border-amber-300';
          if (eq.status === 'Breakdown') statusColor = 'bg-rose-100 text-rose-800 border-rose-300';

          return (
            <div
              key={eq.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {eq.code}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{eq.name}</h3>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                  {eq.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="flex justify-between text-slate-600">
                  <span>Operator Licensed:</span>
                  <strong className="text-slate-900">{eq.operator}</strong>
                </p>
                <p className="flex justify-between text-slate-600">
                  <span>Lokasi Proyek:</span>
                  <strong className="text-slate-900 line-clamp-1">{eq.currentProject || 'Gudang Utama'}</strong>
                </p>
                <p className="flex justify-between text-slate-600">
                  <span>Jam Operasi (HM):</span>
                  <strong className="text-amber-600">{eq.operatingHours} Jam</strong>
                </p>
                <p className="flex justify-between text-slate-600">
                  <span>Tarif Sewa Intern/Jam:</span>
                  <strong className="text-slate-900">{formatRupiah(eq.hourlyRate)}/jam</strong>
                </p>
                <p className="flex justify-between text-slate-600">
                  <span>Biaya BBM Bulan Ini:</span>
                  <strong className="text-blue-600">{formatRupiah(eq.fuelCostThisMonth)}</strong>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Servis Terakhir: {eq.lastServiceDate}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setEditingEq(eq);
                      setIsModalOpen(true);
                    }}
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteEquipment(eq.id)}
                    className="text-rose-600 font-bold hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PrintSignature note="Laporan Status Alat Berat, Maintenance & Hour Meter (HM) Proyek" />

      {/* Modal Add Equipment */}
      {isModalOpen && editingEq && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Registrasi Alat Berat</h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Alat</label>
                  <input
                    type="text"
                    required
                    value={editingEq.code || ''}
                    onChange={(e) => setEditingEq({ ...editingEq, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Unit</label>
                  <select
                    value={editingEq.type || 'Excavator'}
                    onChange={(e) => setEditingEq({ ...editingEq, type: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Excavator">Excavator</option>
                    <option value="Bulldozer">Bulldozer</option>
                    <option value="Tower Crane">Tower Crane</option>
                    <option value="Dump Truck">Dump Truck</option>
                    <option value="Concrete Mixer">Concrete Mixer</option>
                    <option value="Generator">Generator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Unit & Model</label>
                <input
                  type="text"
                  required
                  value={editingEq.name || ''}
                  onChange={(e) => setEditingEq({ ...editingEq, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operator Penanggung Jawab</label>
                  <input
                    type="text"
                    required
                    value={editingEq.operator || ''}
                    onChange={(e) => setEditingEq({ ...editingEq, operator: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Operasional</label>
                  <select
                    value={editingEq.status || 'Ready'}
                    onChange={(e) => setEditingEq({ ...editingEq, status: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Ready">Ready</option>
                    <option value="In Use">In Use (Sedang Bekerja)</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Breakdown">Breakdown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours Meter (HM)</label>
                  <input
                    type="number"
                    value={editingEq.operatingHours || 0}
                    onChange={(e) =>
                      setEditingEq({ ...editingEq, operatingHours: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya BBM Bulan Ini (Rp)</label>
                  <input
                    type="number"
                    value={editingEq.fuelCostThisMonth || 0}
                    onChange={(e) =>
                      setEditingEq({ ...editingEq, fuelCostThisMonth: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Simpan Unit Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
