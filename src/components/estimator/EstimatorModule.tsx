import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Percent,
  Layers,
  Sparkles,
  Printer,
  Check,
} from 'lucide-react';
import { AHSPItem, RABItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';

interface EstimatorModuleProps {
  ahspList: AHSPItem[];
  rabItems: RABItem[];
  onSaveRabItem: (item: RABItem) => void;
  onDeleteRabItem: (id: string) => void;
  onSaveAhsp: (item: AHSPItem) => void;
}

export const EstimatorModule: React.FC<EstimatorModuleProps> = ({
  ahspList,
  rabItems,
  onSaveRabItem,
  onDeleteRabItem,
  onSaveAhsp,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rab' | 'ahsp'>('rab');
  const [overheadPct, setOverheadPct] = useState<number>(5);
  const [profitPct, setProfitPct] = useState<number>(10);
  const [ppnPct, setPpnPct] = useState<number>(11);

  const [isRabModalOpen, setIsRabModalOpen] = useState(false);
  const [editingRab, setEditingRab] = useState<Partial<RABItem> | null>(null);

  // Calculations
  const totalDirectCost = rabItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const overheadAmount = totalDirectCost * (overheadPct / 100);
  const profitAmount = totalDirectCost * (profitPct / 100);
  const subtotalBeforeTax = totalDirectCost + overheadAmount + profitAmount;
  const ppnAmount = subtotalBeforeTax * (ppnPct / 100);
  const grandTotalRAB = subtotalBeforeTax + ppnAmount;

  const handleOpenAddRab = () => {
    setEditingRab({
      id: 'rab-' + Date.now(),
      section: 'Pekerjaan Struktur',
      itemCode: `RAB-0${rabItems.length + 1}.01`,
      description: '',
      unit: 'm3',
      volume: 1,
      unitPrice: 0,
      totalPrice: 0,
    });
    setIsRabModalOpen(true);
  };

  const handleSaveRab = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRab && editingRab.description) {
      const vol = editingRab.volume || 0;
      const price = editingRab.unitPrice || 0;
      const itemToSave: RABItem = {
        ...(editingRab as RABItem),
        totalPrice: vol * price,
      };
      onSaveRabItem(itemToSave);
      setIsRabModalOpen(false);
      setEditingRab(null);
    }
  };

  return (
    <div id="estimator-module" className="p-6 space-y-6 print:p-0">
      <PrintHeader
        title="DOKUMEN RENCANA ANGGARAN BIAYA (RAB) & ANALISA AHSP"
        subtitle="Rencana Anggaran Biaya Konstruksi, Analisa Harga Satuan Pekerjaan (AHSP) PUPR & Margin Profit"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Modul Estimator (RAB & AHSP Pekerjaan)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisa Harga Satuan Pekerjaan (AHSP), kalkulasi biaya langsung, overhead, margin profit, dan PPN.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('rab')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'rab'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RAB / BOQ Proyek
            </button>
            <button
              onClick={() => setActiveSubTab('ahsp')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'ahsp'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Database AHSP PUPR
            </button>
          </div>

          <CetakPdfButton
            elementId="estimator-module"
            filename="Laporan_RAB_AHSP_Build_X_Pro.pdf"
            title="Dokumen Rencana Anggaran Biaya (RAB) & AHSP"
            variant="emerald"
            label="Cetak RAB (PDF)"
          />
        </div>
      </div>

      {activeSubTab === 'rab' ? (
        <div className="space-y-6">
          {/* Summary Financial Parameter Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 print:bg-none print:text-black print:border">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">
                Biaya Langsung (Direct Cost)
              </span>
              <span className="text-xl font-extrabold text-amber-400 mt-1 block">
                {formatRupiah(totalDirectCost)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">
                Overhead ({overheadPct}%) & Profit ({profitPct}%)
              </span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                {formatRupiah(overheadAmount + profitAmount)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">
                PPN ({ppnPct}%)
              </span>
              <span className="text-xl font-extrabold text-blue-400 mt-1 block">
                {formatRupiah(ppnAmount)}
              </span>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl print:border-none">
              <span className="text-xs text-amber-300 font-bold uppercase block">
                Grand Total RAB Kontrak
              </span>
              <span className="text-2xl font-black text-amber-400 mt-0.5 block">
                {formatRupiah(grandTotalRAB)}
              </span>
            </div>
          </div>

          {/* Controls & Percentage Parameters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Overhead:</span>
                <input
                  type="number"
                  value={overheadPct}
                  onChange={(e) => setOverheadPct(parseFloat(e.target.value) || 0)}
                  className="w-16 border border-slate-300 rounded-lg p-1 text-center font-bold"
                />
                <span className="text-slate-500">%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Profit Margin:</span>
                <input
                  type="number"
                  value={profitPct}
                  onChange={(e) => setProfitPct(parseFloat(e.target.value) || 0)}
                  className="w-16 border border-slate-300 rounded-lg p-1 text-center font-bold"
                />
                <span className="text-slate-500">%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">PPN:</span>
                <input
                  type="number"
                  value={ppnPct}
                  onChange={(e) => setPpnPct(parseFloat(e.target.value) || 0)}
                  className="w-16 border border-slate-300 rounded-lg p-1 text-center font-bold"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>

            <button
              onClick={handleOpenAddRab}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow"
            >
              <Plus className="w-4 h-4" /> Tambah Item Pekerjaan RAB
            </button>
          </div>

          {/* RAB Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">Kode</th>
                    <th className="p-3.5">Uraian Pekerjaan</th>
                    <th className="p-3.5">Kategori / Section</th>
                    <th className="p-3.5 text-center">Satuan</th>
                    <th className="p-3.5 text-right">Volume</th>
                    <th className="p-3.5 text-right">Harga Satuan (Rp)</th>
                    <th className="p-3.5 text-right">Jumlah Harga (Rp)</th>
                    <th className="p-3.5 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rabItems.map((rab) => (
                    <tr key={rab.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono text-slate-500">{rab.itemCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{rab.description}</td>
                      <td className="p-3.5 text-slate-600">{rab.section}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-700">{rab.unit}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {rab.volume.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3.5 text-right text-slate-800">
                        {formatRupiah(rab.unitPrice)}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-amber-600">
                        {formatRupiah(rab.totalPrice)}
                      </td>
                      <td className="p-3.5 text-center print:hidden space-x-1">
                        <button
                          onClick={() => {
                            setEditingRab(rab);
                            setIsRabModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRabItem(rab.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={6} className="p-3.5 text-right uppercase text-slate-600">
                      Subtotal Biaya Langsung:
                    </td>
                    <td className="p-3.5 text-right text-slate-900 text-sm">
                      {formatRupiah(totalDirectCost)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-3.5 text-right uppercase text-slate-600">
                      Overhead ({overheadPct}%) & Profit ({profitPct}%):
                    </td>
                    <td className="p-3.5 text-right text-emerald-600 text-sm">
                      {formatRupiah(overheadAmount + profitAmount)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-3.5 text-right uppercase text-slate-600">
                      PPN ({ppnPct}%):
                    </td>
                    <td className="p-3.5 text-right text-blue-600 text-sm">
                      {formatRupiah(ppnAmount)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr className="bg-amber-100/60 text-slate-900 text-base">
                    <td colSpan={6} className="p-3.5 text-right uppercase font-black">
                      TOTAL RAB PENAWARAN (TERMASUK PAJAK):
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-700">
                      {formatRupiah(grandTotalRAB)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* AHSP Database View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Analisa Harga Satuan Pekerjaan (AHSP)
              </h3>
              <p className="text-xs text-slate-500">
                Standar perhitungan rincian Biaya Material + Upah Pekerja + Biaya Sewa Alat Berat.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3">Kode AHSP</th>
                  <th className="p-3">Uraian Analisa</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3 text-right">Material (Rp)</th>
                  <th className="p-3 text-right">Upah (Rp)</th>
                  <th className="p-3 text-right">Alat (Rp)</th>
                  <th className="p-3 text-right">Harga Satuan Total (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ahspList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-amber-600">{item.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="p-3 font-bold text-slate-700">{item.unit}</td>
                    <td className="p-3 text-right text-slate-700">
                      {formatRupiah(item.materialCost)}
                    </td>
                    <td className="p-3 text-right text-slate-700">
                      {formatRupiah(item.laborCost)}
                    </td>
                    <td className="p-3 text-right text-slate-700">
                      {formatRupiah(item.equipmentCost)}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {formatRupiah(item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add RAB Item */}
      {isRabModalOpen && editingRab && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {editingRab.id ? 'Edit Item Pekerjaan RAB' : 'Tambah Item Pekerjaan RAB'}
            </h3>
            <form onSubmit={handleSaveRab} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Item</label>
                  <input
                    type="text"
                    required
                    value={editingRab.itemCode || ''}
                    onChange={(e) =>
                      setEditingRab({ ...editingRab, itemCode: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori / Section</label>
                  <input
                    type="text"
                    required
                    value={editingRab.section || ''}
                    onChange={(e) =>
                      setEditingRab({ ...editingRab, section: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian Pekerjaan</label>
                <input
                  type="text"
                  required
                  value={editingRab.description || ''}
                  onChange={(e) =>
                    setEditingRab({ ...editingRab, description: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={editingRab.unit || ''}
                    onChange={(e) =>
                      setEditingRab({ ...editingRab, unit: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume</label>
                  <input
                    type="number"
                    required
                    value={editingRab.volume || 0}
                    onChange={(e) =>
                      setEditingRab({
                        ...editingRab,
                        volume: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingRab.unitPrice || 0}
                    onChange={(e) =>
                      setEditingRab({
                        ...editingRab,
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold flex justify-between">
                <span>Total Estimasi Harga:</span>
                <span>{formatRupiah((editingRab.volume || 0) * (editingRab.unitPrice || 0))}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRabModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Simpan RAB Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
