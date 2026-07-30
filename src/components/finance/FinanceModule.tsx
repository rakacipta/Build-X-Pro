import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Building,
  CreditCard,
  FileSpreadsheet,
  Trash2,
  Printer,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { FinanceTransaction } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface FinanceModuleProps {
  transactions: FinanceTransaction[];
  onSaveTransaction: (trx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  transactions,
  onSaveTransaction,
  onDeleteTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<Partial<FinanceTransaction>>({
    id: 'trx-' + Date.now(),
    trxNo: `TRX/${new Date().getFullYear()}/0${transactions.length + 1}`,
    type: 'Cash In',
    account: 'Bank BCA',
    amount: 0,
    category: 'Pembayaran Proyek',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const filteredTrx = transactions.filter((t) => {
    const matchesSearch =
      t.trxNo.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesAcc = accountFilter === 'All' || t.account === accountFilter;
    return matchesSearch && matchesAcc;
  });

  const totalIn = transactions
    .filter((t) => t.type === 'Cash In')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'Cash Out')
    .reduce((acc, t) => acc + t.amount, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrx && editingTrx.description) {
      onSaveTransaction(editingTrx as FinanceTransaction);
      setIsModalOpen(false);
    }
  };

  return (
    <div id="finance-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN ARUS KAS, PETTY CASH & TRANSAKSI BANK"
        subtitle="Rincian Transaksi Kas Masuk (Cash In), Kas Keluar (Cash Out) & Saldo Kas/Bank Perusahaan"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Finance, Kas & Bank</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan voucher Kas Masuk (Cash In), Kas Keluar (Cash Out), Petty Cash Proyek, & Rekonsiliasi Bank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="finance-module"
            filename="Laporan_Kas_Bank_Build_X_Pro.pdf"
            title="Laporan Arus Kas, Petty Cash & Bank"
            variant="emerald"
          />

          <button
            onClick={() => {
              setEditingTrx({
                id: 'trx-' + Date.now(),
                trxNo: `TRX/${new Date().getFullYear()}/0${transactions.length + 1}`,
                type: 'Cash In',
                account: 'Bank BCA',
                amount: 0,
                category: 'Pembayaran Proyek',
                description: '',
                date: new Date().toISOString().split('T')[0],
              });
              setIsModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Transaksi Kas/Bank Baru
          </button>
        </div>
      </div>

      {/* Account Balances Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Penerimaan (Cash In)</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{formatRupiah(totalIn)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Pengeluaran (Cash Out)</span>
          <p className="text-xl font-black text-rose-600 mt-1">{formatRupiah(totalOut)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Net Surplus Cashflow</span>
          <p className="text-xl font-black text-blue-600 mt-1">{formatRupiah(totalIn - totalOut)}</p>
        </div>
      </div>

      {/* Search & Account Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No TRX / Keterangan Transaksi..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Bank BCA', 'Bank Mandiri', 'Kas Utama', 'Petty Cash'].map((acc) => (
            <button
              key={acc}
              onClick={() => setAccountFilter(acc)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                accountFilter === acc
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {acc}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-3.5">Nomor TRX</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Jenis TRX</th>
                <th className="p-3.5">Akun Kas / Bank</th>
                <th className="p-3.5">Kategori & Keterangan</th>
                <th className="p-3.5 text-right">Jumlah (Rp)</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrx.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-mono font-bold text-amber-600">{trx.trxNo}</td>
                  <td className="p-3.5 text-slate-500">{trx.date}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        trx.type === 'Cash In'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {trx.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{trx.account}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{trx.category}</div>
                    <div className="text-[11px] text-slate-500">{trx.description}</div>
                  </td>
                  <td
                    className={`p-3.5 text-right font-extrabold text-sm ${
                      trx.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {trx.type === 'Cash In' ? '+' : '-'}{formatRupiah(trx.amount)}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onDeleteTransaction(trx.id)}
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

      {/* Modal Add TRX */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Input Voucher Transaksi Kas / Bank</h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Transaksi</label>
                  <input
                    type="text"
                    required
                    value={editingTrx.trxNo || ''}
                    onChange={(e) => setEditingTrx({ ...editingTrx, trxNo: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
                  <select
                    value={editingTrx.type || 'Cash In'}
                    onChange={(e) =>
                      setEditingTrx({ ...editingTrx, type: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Cash In">Cash In (Kas Masuk)</option>
                    <option value="Cash Out">Cash Out (Kas Keluar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Akun Kas / Bank</label>
                  <select
                    value={editingTrx.account || 'Bank BCA'}
                    onChange={(e) =>
                      setEditingTrx({ ...editingTrx, account: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Bank BCA">Bank BCA</option>
                    <option value="Bank Mandiri">Bank Mandiri</option>
                    <option value="Kas Utama">Kas Utama</option>
                    <option value="Petty Cash">Petty Cash Proyek</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingTrx.amount || 0}
                    onChange={(e) =>
                      setEditingTrx({
                        ...editingTrx,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Pengeluaran / Penerimaan</label>
                <select
                  value={editingTrx.category || 'Pembayaran Proyek'}
                  onChange={(e) => setEditingTrx({ ...editingTrx, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="Pembayaran Proyek">Pembayaran Proyek (Termijn)</option>
                  <option value="Pembelian Material">Pembelian Material</option>
                  <option value="Gaji & Payroll">Gaji & Payroll</option>
                  <option value="Sewa Alat">Sewa Alat</option>
                  <option value="Operasional">Operasional Lapangan / Kantor</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan Transaksi</label>
                <textarea
                  rows={2}
                  required
                  value={editingTrx.description || ''}
                  onChange={(e) => setEditingTrx({ ...editingTrx, description: e.target.value })}
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
                  Simpan Voucher TRX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
