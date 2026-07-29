import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  FileText,
  Truck,
  CheckCircle,
  Clock,
  Printer,
  Trash2,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { SalesOrder } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';

interface TradingModuleProps {
  salesOrders: SalesOrder[];
  onSaveSalesOrder: (so: SalesOrder) => void;
  onDeleteSalesOrder: (id: string) => void;
}

export const TradingModule: React.FC<TradingModuleProps> = ({
  salesOrders,
  onSaveSalesOrder,
  onDeleteSalesOrder,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSo, setEditingSo] = useState<Partial<SalesOrder> | null>(null);

  const filteredOrders = salesOrders.filter(
    (so) =>
      so.soNumber.toLowerCase().includes(search.toLowerCase()) ||
      so.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSo({
      id: 'so-' + Date.now(),
      soNumber: `SO/TRD/${new Date().getFullYear()}/00${salesOrders.length + 1}`,
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      paymentStatus: 'Belum Bayar',
      deliveryStatus: 'Diproses',
      items: [
        {
          productName: 'Semen Tiga Roda PPC 50kg',
          qty: 100,
          unitPrice: 69000,
          subtotal: 6900000,
        },
      ],
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSo && editingSo.customerName) {
      onSaveSalesOrder(editingSo as SalesOrder);
      setIsModalOpen(false);
      setEditingSo(null);
    }
  };

  return (
    <div id="trading-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN TRADING MATERIAL & SALES ORDER"
        subtitle="Penjualan Grosir Bahan Bangunan, Surat Jalan, Invoice, & Rekapitulasi Omset Trading"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Trading Material & Sales Order</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Penjualan grosir bahan bangunan (semen, besi, pasir, hebel), Surat Jalan, Invoice, & Garansi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="trading-module"
            filename="Laporan_Trading_SalesOrder_Construx.pdf"
            title="Laporan Trading Material & Sales Order"
            variant="emerald"
          />

          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Sales Order Trading Baru
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Omset Trading</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {formatRupiah(salesOrders.reduce((acc, s) => acc + s.totalAmount, 0))}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pengiriman Aktif</span>
          <p className="text-xl font-black text-blue-600 mt-1">
            {salesOrders.filter((s) => s.deliveryStatus === 'Dikirim').length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Status Pembayaran Lunas</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {salesOrders.filter((s) => s.paymentStatus === 'Lunas').length} dari {salesOrders.length} Order
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari No SO / Customer Trading..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-3.5">Nomor SO</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Nama Customer / Subkon</th>
                <th className="p-3.5">Detail Barang Trading</th>
                <th className="p-3.5 text-right">Total Nilai (Rp)</th>
                <th className="p-3.5 text-center">Status Bayar</th>
                <th className="p-3.5 text-center">Pengiriman</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((so) => (
                <tr key={so.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-mono font-bold text-amber-600">{so.soNumber}</td>
                  <td className="p-3.5 text-slate-500">{so.date}</td>
                  <td className="p-3.5 font-bold text-slate-900">{so.customerName}</td>
                  <td className="p-3.5 text-slate-600">
                    {so.items.map((i, idx) => (
                      <div key={idx}>
                        • {i.productName} ({i.qty} x {formatRupiah(i.unitPrice)})
                      </div>
                    ))}
                  </td>
                  <td className="p-3.5 text-right font-extrabold text-slate-900">
                    {formatRupiah(so.totalAmount)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        so.paymentStatus === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {so.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        so.deliveryStatus === 'Selesai'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {so.deliveryStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => alert(`Cetak Surat Jalan & Invoice untuk ${so.soNumber}`)}
                      className="text-amber-600 hover:text-amber-700 font-bold"
                    >
                      Surat Jalan
                    </button>
                    <button
                      onClick={() => onDeleteSalesOrder(so.id)}
                      className="text-rose-600 hover:text-rose-700 font-bold"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Sales Order */}
      {isModalOpen && editingSo && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Input Sales Order Trading</h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor SO</label>
                  <input
                    type="text"
                    required
                    value={editingSo.soNumber || ''}
                    onChange={(e) => setEditingSo({ ...editingSo, soNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editingSo.date || ''}
                    onChange={(e) => setEditingSo({ ...editingSo, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Customer / Buyer</label>
                <input
                  type="text"
                  required
                  value={editingSo.customerName || ''}
                  onChange={(e) => setEditingSo({ ...editingSo, customerName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={editingSo.paymentStatus || 'Belum Bayar'}
                    onChange={(e) =>
                      setEditingSo({ ...editingSo, paymentStatus: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="DP / Partial">DP / Partial</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Nilai Order (Rp)</label>
                  <input
                    type="number"
                    value={editingSo.totalAmount || 0}
                    onChange={(e) =>
                      setEditingSo({
                        ...editingSo,
                        totalAmount: parseFloat(e.target.value) || 0,
                      })
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
                  Simpan SO Trading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
