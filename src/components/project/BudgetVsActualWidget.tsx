import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Receipt,
  Scale,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Project, RABItem, FinanceTransaction, PurchaseOrder } from '../../types';
import { formatRupiah, formatCompactNumber } from '../../utils/formatters';

interface BudgetVsActualWidgetProps {
  project: Project;
  rabItems?: RABItem[];
  financeTransactions?: FinanceTransaction[];
  purchases?: PurchaseOrder[];
  onSyncActualCost?: (newActualCost: number) => void;
}

export const BudgetVsActualWidget: React.FC<BudgetVsActualWidgetProps> = ({
  project,
  rabItems = [],
  financeTransactions = [],
  purchases = [],
  onSyncActualCost,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isSynced, setIsSynced] = useState(false);

  // Filter finance transactions linked to this project
  const projectTransactions = financeTransactions.filter(
    (t) =>
      t.projectId === project.id ||
      t.description.toLowerCase().includes(project.code.toLowerCase()) ||
      (project.name && t.description.toLowerCase().includes(project.name.toLowerCase().slice(0, 12)))
  );

  const cashOutTransactions = projectTransactions.filter((t) => t.type === 'Cash Out');
  const cashInTransactions = projectTransactions.filter((t) => t.type === 'Cash In');

  const totalCashOutFromFinance = cashOutTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCashInFromFinance = cashInTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Dynamic real-time actual cost: use calculated cash out from ledger if available, else project.actualCost
  const realTimeActualCost =
    totalCashOutFromFinance > 0 ? totalCashOutFromFinance : project.actualCost;

  const budgetTotal = project.rabTotal;
  const contractValue = project.contractValue;
  const budgetVariance = budgetTotal - realTimeActualCost;
  const variancePct = budgetTotal > 0 ? (budgetVariance / budgetTotal) * 100 : 0;
  const isUnderBudget = budgetVariance >= 0;

  // Profitability calculations
  const plannedProfit = contractValue - budgetTotal;
  const plannedMarginPct = contractValue > 0 ? (plannedProfit / contractValue) * 100 : 0;

  const realizedProfit = contractValue - realTimeActualCost;
  const realizedMarginPct = contractValue > 0 ? (realizedProfit / contractValue) * 100 : 0;
  const profitMarginDiff = realizedMarginPct - plannedMarginPct;

  // Category Breakdown logic
  const getCategoryActual = (catName: string, fallbackRatio: number) => {
    const matched = cashOutTransactions.filter((t) => {
      if (catName.includes('Material')) return t.category === 'Pembelian Material';
      if (catName.includes('Alat')) return t.category === 'Sewa Alat';
      if (catName.includes('Upah')) return t.category === 'Gaji & Payroll';
      if (catName.includes('Operasional')) return t.category === 'Operasional';
      return t.category === 'Pembayaran Proyek' || t.category === 'Lainnya';
    });
    const sum = matched.reduce((a, b) => a + b.amount, 0);
    return sum > 0 ? sum : Math.round(realTimeActualCost * fallbackRatio);
  };

  const categoriesData = [
    {
      name: 'Struktur & Beton',
      budget: Math.round(budgetTotal * 0.45),
      actual: getCategoryActual('Struktur', 0.44),
    },
    {
      name: 'Upah & Subkontraktor',
      budget: Math.round(budgetTotal * 0.25),
      actual: getCategoryActual('Upah', 0.24),
    },
    {
      name: 'Sewa Alat Berat',
      budget: Math.round(budgetTotal * 0.15),
      actual: getCategoryActual('Alat', 0.16),
    },
    {
      name: 'Material Umum',
      budget: Math.round(budgetTotal * 0.1),
      actual: getCategoryActual('Material', 0.1),
    },
    {
      name: 'Operasional & K3',
      budget: Math.round(budgetTotal * 0.05),
      actual: getCategoryActual('Operasional', 0.06),
    },
  ].map((cat) => {
    const variance = cat.budget - cat.actual;
    const consumptionPct = cat.budget > 0 ? (cat.actual / cat.budget) * 100 : 0;
    return {
      ...cat,
      variance,
      consumptionPct: Math.round(consumptionPct * 10) / 10,
    };
  });

  // Chart data formatted for Recharts
  const chartData = categoriesData.map((c) => ({
    name: c.name,
    'Budget (RAB)': c.budget,
    'Actual (Realisasi)': c.actual,
  }));

  // Handle auto-sync actual cost
  const handleSync = () => {
    if (onSyncActualCost) {
      onSyncActualCost(realTimeActualCost);
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 3000);
    }
  };

  // Filtered transactions table
  const filteredTransactions = cashOutTransactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.trxNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Real-time Profitability & Budget Executive Bar */}
      <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-lg text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-wide">
                Dashboard Monitoring Budget vs Actual
              </h3>
              <p className="text-[11px] text-slate-400">
                Analisis varians biaya RAB dan profitabilitas proyek secara real-time dari ledger keuangan.
              </p>
            </div>
          </div>

          {onSyncActualCost && (
            <button
              onClick={handleSync}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                isSynced
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {isSynced ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Biaya Tersinkronisasi!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronisasi Ke Proyek Master</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total RAB Budget */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Target Cost (Budget RAB)
            </span>
            <div className="text-lg font-black text-amber-400">
              {formatRupiah(budgetTotal)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
              <span>Alokasi Biaya</span>
              <span className="font-mono text-slate-300">
                {formatCompactNumber(budgetTotal)}
              </span>
            </div>
          </div>

          {/* Card 2: Actual Cost Realization */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Realisasi Biaya (Actual)
            </span>
            <div className="text-lg font-black text-white">
              {formatRupiah(realTimeActualCost)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
              <span>Sumber Ledger</span>
              <span className="text-emerald-400 font-bold">
                {totalCashOutFromFinance > 0 ? 'Live Financial Ledger' : 'Project Baseline'}
              </span>
            </div>
          </div>

          {/* Card 3: Budget Variance */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Varians Biaya (Remaining)
            </span>
            <div
              className={`text-lg font-black flex items-center gap-1 ${
                isUnderBudget ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUnderBudget ? '+' : ''}
              {formatRupiah(budgetVariance)}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
              <span>Status Anggaran</span>
              <span
                className={`font-extrabold px-1.5 py-0.2 rounded text-[9px] ${
                  isUnderBudget
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isUnderBudget ? `Under Budget (${variancePct.toFixed(1)}%)` : `Over Budget (${Math.abs(variancePct).toFixed(1)}%)`}
              </span>
            </div>
          </div>

          {/* Card 4: Profitability Margin */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Realized Profit Margin
            </span>
            <div
              className={`text-lg font-black flex items-center gap-1 ${
                realizedMarginPct >= plannedMarginPct ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {realizedMarginPct.toFixed(1)}%
              <span className="text-xs font-normal text-slate-400">
                ({formatCompactNumber(realizedProfit)})
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
              <span>Target Plan</span>
              <span className="font-bold text-slate-300">
                {plannedMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Recharts Comparison + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recharts Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-sm text-slate-900">
                Visual Perbandingan Budget (RAB) vs Realisasi (Actual)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Per Kategori Pekerjaan</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${(val / 1000000000).toFixed(1)}B`}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Budget (RAB)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Actual (Realisasi)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Detailed Metrics Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-sm text-slate-900">
                Detail Konsumsi Biaya Per Kategori
              </h4>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              5 Pos Pekerjaan
            </span>
          </div>

          <div className="space-y-3">
            {categoriesData.map((cat, idx) => {
              const isOver = cat.consumptionPct > 100;
              const isWarning = cat.consumptionPct >= 85 && cat.consumptionPct <= 100;
              return (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span
                      className={`font-black text-[10px] px-2 py-0.5 rounded ${
                        isOver
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {cat.consumptionPct}% Terpakai
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">RAB Budget</span>
                      <strong className="text-slate-800">{formatRupiah(cat.budget)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Realisasi</span>
                      <strong className="text-blue-900">{formatRupiah(cat.actual)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Selisih</span>
                      <strong className={cat.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {cat.variance >= 0 ? '+' : ''}
                        {formatRupiah(cat.variance)}
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar Gauge */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOver
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(cat.consumptionPct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Financial Ledger Audit Trail for this Project */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-sm text-slate-900">
                Audit Trail Transaksi Pengeluaran Kas (Actual Financial Ledger)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar transaksi pengeluaran (Cash Out) terhubung dengan proyek {project.code}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Pembelian Material">Pembelian Material</option>
              <option value="Gaji & Payroll">Gaji & Payroll</option>
              <option value="Sewa Alat">Sewa Alat</option>
              <option value="Operasional">Operasional</option>
              <option value="Pembayaran Proyek">Pembayaran Proyek</option>
            </select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-xs">Belum Ada Transaksi Pengeluaran Terhubung</p>
            <p className="text-[11px] text-slate-400">
              Transaksi pengeluaran kas dengan tag ID proyek `{project.id}` atau kode `{project.code}` akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Tanggal</th>
                  <th className="p-2.5">No. Trx / Ref</th>
                  <th className="p-2.5">Akun Pembayaran</th>
                  <th className="p-2.5">Kategori</th>
                  <th className="p-2.5">Deskripsi</th>
                  <th className="p-2.5 text-right rounded-r-lg">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">{trx.date}</td>
                    <td className="p-2.5 font-bold font-mono text-amber-700">{trx.trxNo}</td>
                    <td className="p-2.5 text-slate-700 font-medium">{trx.account}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[10px]">
                        {trx.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700">{trx.description}</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">
                      -{formatRupiah(trx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={5} className="p-2.5 rounded-l-lg text-right">
                    Total Pengeluaran Realisasi (Financial Ledger):
                  </td>
                  <td className="p-2.5 text-right text-emerald-400 font-black rounded-r-lg">
                    {formatRupiah(totalCashOutFromFinance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
