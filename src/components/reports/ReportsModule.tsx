import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  ShoppingBag,
  Wallet,
  BookOpenCheck,
  HardHat,
  RotateCcw,
} from 'lucide-react';
import {
  Project,
  SalesOrder,
  PurchaseOrder,
  FinanceTransaction,
  Employee,
  Material,
  CompanyProfile,
  LetterheadSettings,
} from '../../types';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { formatRupiah, formatCompactNumber } from '../../utils/formatters';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface ReportsModuleProps {
  projects: Project[];
  salesOrders: SalesOrder[];
  purchases: PurchaseOrder[];
  financeTransactions: FinanceTransaction[];
  employees: Employee[];
  materials: Material[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  projects,
  salesOrders,
  purchases,
  financeTransactions,
  employees,
  materials,
}) => {
  const [reportType, setReportType] = useState<
    'project' | 'trading' | 'finance' | 'hr'
  >('project');

  return (
    <div id="reports-module" className="p-6 space-y-6 print:p-0">
      <PrintHeader
        title="PUSAT PELAPORAN EXECUTIVE & AUDIT TRAIL"
        subtitle="Laporan Integrasi Proyek, Trading Material, Finance Cashflow, & HR Payroll"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Pusat Pelaporan Executive & Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan lengkap Proyek, Trading Material, Finance Cashflow, & HR Payroll siap cetak / ekspor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setReportType('project')}
              className={`px-3 py-1.5 rounded-lg transition ${
                reportType === 'project'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600'
              }`}
            >
              Proyek
            </button>
            <button
              onClick={() => setReportType('trading')}
              className={`px-3 py-1.5 rounded-lg transition ${
                reportType === 'trading'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600'
              }`}
            >
              Trading
            </button>
            <button
              onClick={() => setReportType('finance')}
              className={`px-3 py-1.5 rounded-lg transition ${
                reportType === 'finance'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600'
              }`}
            >
              Finance
            </button>
            <button
              onClick={() => setReportType('hr')}
              className={`px-3 py-1.5 rounded-lg transition ${
                reportType === 'hr'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600'
              }`}
            >
              HR & Payroll
            </button>
          </div>

          <CetakPdfButton
            elementId="reports-module"
            filename={`Laporan_Executive_${reportType}_Build_X_Pro.pdf`}
            title={`Laporan Executive & Audit Trail (${reportType.toUpperCase()})`}
            variant="emerald"
            label="Cetak Laporan PDF"
          />
        </div>
      </div>

      {/* Report View Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="font-black text-xl text-slate-900 uppercase tracking-wide">
            {getStoredData<LetterheadSettings>('letterhead', INITIAL_LETTERHEAD).headerTitle || getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE).name}
          </h1>
          <h3 className="font-bold text-sm text-amber-600 mt-1 uppercase">
            {reportType === 'project' && 'LAPORAN REALISASI BIAYA & PROGRESS PROYEK'}
            {reportType === 'trading' && 'LAPORAN REKAPITULASI PENJUALAN TRADING MATERIAL'}
            {reportType === 'finance' && 'LAPORAN ARUS KAS & CASHFLOW STATEMENT'}
            {reportType === 'hr' && 'LAPORAN PRODUKTIVITAS & GAJI KARYAWAN'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">PERIODE TAHUN 2026 • ENTERPRISE AUDIT READY</p>
        </div>

        {reportType === 'project' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3">Kode Proyek</th>
                  <th className="p-3">Nama Proyek</th>
                  <th className="p-3">Client</th>
                  <th className="p-3 text-right">Nilai Kontrak</th>
                  <th className="p-3 text-right">RAB Target</th>
                  <th className="p-3 text-right">Realisasi Biaya</th>
                  <th className="p-3 text-center">Progress %</th>
                  <th className="p-3 text-right">Laba Proyek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono font-bold text-amber-600">{p.code}</td>
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.client}</td>
                    <td className="p-3 text-right font-bold">{formatRupiah(p.contractValue)}</td>
                    <td className="p-3 text-right text-slate-700">{formatRupiah(p.rabTotal)}</td>
                    <td className="p-3 text-right text-emerald-600 font-bold">{formatRupiah(p.actualCost)}</td>
                    <td className="p-3 text-center font-extrabold text-amber-600">{p.progressPct}%</td>
                    <td className="p-3 text-right font-black text-slate-900">
                      {formatRupiah(p.contractValue - p.actualCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'trading' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3">SKU Barang</th>
                  <th className="p-3">Nama Material</th>
                  <th className="p-3">Lokasi Gudang</th>
                  <th className="p-3 text-center">Stok Fisik</th>
                  <th className="p-3 text-right">HPP Beli</th>
                  <th className="p-3 text-right">Harga Jual</th>
                  <th className="p-3 text-right">Total Valuasi Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="p-3 font-mono font-bold text-amber-600">{m.sku}</td>
                    <td className="p-3 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.warehouse}</td>
                    <td className="p-3 text-center font-bold">{m.stockQty} {m.unit}</td>
                    <td className="p-3 text-right">{formatRupiah(m.buyPrice)}</td>
                    <td className="p-3 text-right">{formatRupiah(m.sellPrice)}</td>
                    <td className="p-3 text-right font-black text-amber-600">
                      {formatRupiah(m.stockQty * m.buyPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'finance' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3">Nomor Voucher</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Akun Kas/Bank</th>
                  <th className="p-3">Uraian Transaksi</th>
                  <th className="p-3 text-right">Cash In (Rp)</th>
                  <th className="p-3 text-right">Cash Out (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financeTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-mono font-bold text-amber-600">{t.trxNo}</td>
                    <td className="p-3 text-slate-500">{t.date}</td>
                    <td className="p-3 font-bold">{t.account}</td>
                    <td className="p-3 text-slate-700">{t.description}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {t.type === 'Cash In' ? formatRupiah(t.amount) : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600">
                      {t.type === 'Cash Out' ? formatRupiah(t.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'hr' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3">NIK</th>
                  <th className="p-3">Nama Karyawan</th>
                  <th className="p-3">Jabatan</th>
                  <th className="p-3 text-right">Gaji Pokok</th>
                  <th className="p-3 text-right">Tunjangan</th>
                  <th className="p-3 text-center">Hari Hadir</th>
                  <th className="p-3 text-right">Total THP Est</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3 font-mono font-bold text-amber-600">{e.nik}</td>
                    <td className="p-3 font-bold text-slate-900">{e.name}</td>
                    <td className="p-3 text-slate-600">{e.position}</td>
                    <td className="p-3 text-right">{formatRupiah(e.basicSalary)}</td>
                    <td className="p-3 text-right">{formatRupiah(e.allowance)}</td>
                    <td className="p-3 text-center font-bold">{e.attendanceDays} Hari</td>
                    <td className="p-3 text-right font-black text-amber-600">
                      {formatRupiah(e.basicSalary + e.allowance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PrintSignature note="Laporan Eksekutif Komprehensif Manajemen & Operasional Perusahaan" />
      </div>
    </div>
  );
};
