import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  FileSpreadsheet,
  Layers,
  Scale,
  TrendingUp,
  DollarSign,
  Printer,
} from 'lucide-react';
import { ChartOfAccount, JournalEntry } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';

interface AccountingModuleProps {
  coaList: ChartOfAccount[];
  journals: JournalEntry[];
  onSaveJournal: (jrn: JournalEntry) => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  coaList,
  journals,
  onSaveJournal,
}) => {
  const [activeTab, setActiveTab] = useState<'coa' | 'journal' | 'income' | 'balance'>(
    'journal'
  );
  const [search, setSearch] = useState('');

  // Calculations for Financial Statements
  const totalPendapatan = coaList
    .filter((c) => c.type === 'Pendapatan')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalBeban = coaList
    .filter((c) => c.type === 'Beban')
    .reduce((acc, c) => acc + c.balance, 0);

  const labaKotor = totalPendapatan - totalBeban;

  const totalAktiva = coaList
    .filter((c) => c.type === 'Aktiva')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalKewajiban = coaList
    .filter((c) => c.type === 'Kewajiban')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalEkuitas = coaList
    .filter((c) => c.type === 'Ekuitas')
    .reduce((acc, c) => acc + c.balance, 0);

  return (
    <div id="accounting-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN AKUNTANSI, JURNAL UMUM & FINANCIAL STATEMENTS"
        subtitle="Chart of Accounts (COA), Buku Besar Jurnal, Laporan Laba Rugi (P&L) & Neraca Keuangan Perusahaan"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Accounting, Buku Besar & Laporan Keuangan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chart of Accounts (COA), Jurnal Umum Double-Entry, Laporan Laba Rugi (P&L), & Neraca Keseimbangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'journal'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Jurnal Umum
            </button>
            <button
              onClick={() => setActiveTab('coa')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'coa'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Chart of Accounts (COA)
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'income'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Laba Rugi (P&L)
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'balance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Neraca Keseimbangan
            </button>
          </div>

          <CetakPdfButton
            elementId="accounting-module"
            filename="Laporan_Keuangan_Akuntansi_Construx.pdf"
            title="Laporan Akuntansi, Jurnal Umum & Financial Statements"
            variant="emerald"
            label="Cetak PDF"
          />
        </div>
      </div>

      {activeTab === 'journal' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
            Jurnal Umum Akuntansi (Double-Entry Log)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3.5">No Jurnal</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Kode Akun</th>
                  <th className="p-3.5">Nama Akun COA</th>
                  <th className="p-3.5">Keterangan</th>
                  <th className="p-3.5 text-right">Debit (Rp)</th>
                  <th className="p-3.5 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-600">{j.journalNo}</td>
                    <td className="p-3.5 text-slate-500">{j.date}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{j.accountCode}</td>
                    <td className="p-3.5 font-bold text-slate-900">{j.accountName}</td>
                    <td className="p-3.5 text-slate-600">{j.description}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">
                      {j.debit > 0 ? formatRupiah(j.debit) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">
                      {j.credit > 0 ? formatRupiah(j.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'coa' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
            Chart of Accounts (Daftar Kode Akun Master)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3.5">Kode Akun</th>
                  <th className="p-3.5">Nama Akun COA</th>
                  <th className="p-3.5">Klasifikasi Tipe</th>
                  <th className="p-3.5 text-right">Saldo Saat Ini (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coaList.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-600">{c.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{c.type}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">
                      {formatRupiah(c.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="text-center border-b pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 uppercase">
              LAPORAN LABA RUGI PERUSAHAAN (P&L)
            </h3>
            <p className="text-xs text-slate-500">PT GRAHA MULTI KONSTRUKSI & TRADING • TAHUN 2026</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 uppercase border-b pb-1">PENDAPATAN USAHA</h4>
              {coaList
                .filter((c) => c.type === 'Pendapatan')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700">
                    <span>{c.name}</span>
                    <span className="font-bold">{formatRupiah(c.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t">
                <span>TOTAL PENDAPATAN OPERASIONAL:</span>
                <span className="text-emerald-600">{formatRupiah(totalPendapatan)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 uppercase border-b pb-1">BEBAN OPERASIONAL (HPP & GAJI)</h4>
              {coaList
                .filter((c) => c.type === 'Beban')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700">
                    <span>{c.name}</span>
                    <span className="font-bold">{formatRupiah(c.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t">
                <span>TOTAL BEBAN OPERASIONAL:</span>
                <span className="text-rose-600">{formatRupiah(totalBeban)}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl flex justify-between font-black text-slate-900 text-base">
              <span>ESTIMASI LABA BERSIH TAHUN BERJALAN:</span>
              <span className="text-amber-700">{formatRupiah(labaKotor)}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'balance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b pb-4">
            <h3 className="font-extrabold text-lg text-slate-900 uppercase">
              LAPORAN NERACA KESEIMBANGAN (BALANCE SHEET)
            </h3>
            <p className="text-xs text-slate-500">PT GRAHA MULTI KONSTRUKSI & TRADING • TAHUN 2026</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* AKTIVA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 uppercase border-b pb-1">AKTIVA (ASET)</h4>
              {coaList
                .filter((c) => c.type === 'Aktiva')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700">
                    <span>{c.name}</span>
                    <span className="font-bold">{formatRupiah(c.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-4 border-t">
                <span>TOTAL AKTIVA:</span>
                <span className="text-amber-600">{formatRupiah(totalAktiva)}</span>
              </div>
            </div>

            {/* KEWAJIBAN & EKUITAS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 uppercase border-b pb-1">PASSIVA (KEWAJIBAN & EKUITAS)</h4>
              <div className="font-semibold text-slate-500 mt-1">Kewajiban (Hutang Usaha)</div>
              {coaList
                .filter((c) => c.type === 'Kewajiban')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700">
                    <span>{c.name}</span>
                    <span className="font-bold">{formatRupiah(c.balance)}</span>
                  </div>
                ))}

              <div className="font-semibold text-slate-500 mt-3">Ekuitas (Modal Saham)</div>
              {coaList
                .filter((c) => c.type === 'Ekuitas')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700">
                    <span>{c.name}</span>
                    <span className="font-bold">{formatRupiah(c.balance)}</span>
                  </div>
                ))}

              <div className="flex justify-between font-black text-slate-900 text-sm pt-4 border-t">
                <span>TOTAL PASSIVA:</span>
                <span className="text-amber-600">{formatRupiah(totalKewajiban + totalEkuitas)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
