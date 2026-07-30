import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  QrCode,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  Edit2,
  Warehouse,
  Printer,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { Material } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface InventoryModuleProps {
  materials: Material[];
  onSaveMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  materials,
  onSaveMaterial,
  onDeleteMaterial,
}) => {
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase());
    const matchesWh = selectedWarehouse === 'All' || m.warehouse === selectedWarehouse;
    return matchesSearch && matchesWh;
  });

  const totalStockValuation = materials.reduce(
    (acc, m) => acc + m.stockQty * m.buyPrice,
    0
  );

  const handleOpenAdd = () => {
    setEditingMaterial({
      id: 'mat-' + Date.now(),
      sku: 'MAT-' + Math.floor(100 + Math.random() * 900),
      name: '',
      category: 'Semen & Beton',
      unit: 'm3',
      stockQty: 100,
      minStock: 20,
      buyPrice: 0,
      sellPrice: 0,
      warehouse: 'Gudang Utama Cikande',
      qrCode: 'QR-' + Date.now(),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial && editingMaterial.name) {
      onSaveMaterial(editingMaterial as Material);
      setIsModalOpen(false);
      setEditingMaterial(null);
    }
  };

  return (
    <div id="inventory-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN INVENTARIS MATERIAL & STOCK OPNAME GUDANG"
        subtitle="Daftar Material Konstruksi, Valuasi Stok, Minimum Safety Stock & Lokasi Gudang"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Manajemen Inventory & Gudang</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengawasan stok material konstruksi, Stock Opname, Peringatan Minimum Stock, & QR Code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="inventory-module"
            filename="Laporan_Inventaris_Material_Build_X_Pro.pdf"
            title="Laporan Inventaris Material & Stock Opname"
            variant="emerald"
          />
          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Tambah Stok Material
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Valuasi Total Stok</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {formatRupiah(totalStockValuation)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total SKU Material</span>
          <p className="text-xl font-black text-slate-900 mt-1">{materials.length} Jenis</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Batas Stok Kritis</span>
          <p className="text-xl font-black text-rose-600 mt-1">
            {materials.filter((m) => m.stockQty <= m.minStock).length} Item Peringatan
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari SKU atau Nama Material..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Gudang Utama Cikande', 'Depo Pasir Marunda', 'Batching Plant Proyek'].map((wh) => (
            <button
              key={wh}
              onClick={() => setSelectedWarehouse(wh)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                selectedWarehouse === wh
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {wh === 'All' ? 'Semua Gudang' : wh}
            </button>
          ))}
        </div>
      </div>

      {/* Material Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-3.5">SKU / QR</th>
                <th className="p-3.5">Nama Material</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Lokasi Gudang</th>
                <th className="p-3.5 text-center">Jumlah Stok</th>
                <th className="p-3.5 text-right">Harga Beli (HPP)</th>
                <th className="p-3.5 text-right">Harga Jual Trading</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => {
                const isLow = mat.stockQty <= mat.minStock;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-amber-600">{mat.sku}</div>
                      <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <QrCode className="w-3 h-3 text-slate-400" /> {mat.qrCode || 'QR-GENERATED'}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{mat.name}</td>
                    <td className="p-3.5 text-slate-600">{mat.category}</td>
                    <td className="p-3.5 text-slate-600 flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-amber-500" /> {mat.warehouse}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`font-black px-2.5 py-1 rounded-full text-xs inline-block ${
                          isLow
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {mat.stockQty.toLocaleString('id-ID')} {mat.unit}
                      </span>
                      {isLow && (
                        <span className="block text-[9px] font-bold text-rose-600 mt-0.5">
                          Min Stok: {mat.minStock}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-slate-800">
                      {formatRupiah(mat.buyPrice)}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-amber-600">
                      {formatRupiah(mat.sellPrice)}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingMaterial(mat);
                          setIsModalOpen(true);
                        }}
                        className="text-amber-600 hover:text-amber-700 font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteMaterial(mat.id)}
                        className="text-rose-600 hover:text-rose-700 font-bold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PrintSignature note="Laporan Stock Opname, Mutasi & Inventaris Gudang Material Proyek" />

      {/* Modal Add / Edit Material */}
      {isModalOpen && editingMaterial && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {editingMaterial.id ? 'Edit Material Gudang' : 'Tambah Material Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Barang</label>
                  <input
                    type="text"
                    required
                    value={editingMaterial.sku || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, sku: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Material</label>
                  <select
                    value={editingMaterial.category || 'Semen & Beton'}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, category: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Semen & Beton">Semen & Beton</option>
                    <option value="Besi & Baja">Besi & Baja</option>
                    <option value="Kayu & Papan">Kayu & Papan</option>
                    <option value="Batu & Pasir">Batu & Pasir</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Pipa & Plambing">Pipa & Plambing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Material / Spesifikasi</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.name || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={editingMaterial.unit || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    required
                    value={editingMaterial.stockQty || 0}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        stockQty: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Stok</label>
                  <input
                    type="number"
                    required
                    value={editingMaterial.minStock || 0}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        minStock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli HPP (Rp)</label>
                  <input
                    type="number"
                    value={editingMaterial.buyPrice || 0}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        buyPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual Trading (Rp)</label>
                  <input
                    type="number"
                    value={editingMaterial.sellPrice || 0}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        sellPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi Gudang</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.warehouse || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, warehouse: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
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
                  Simpan Stok Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
