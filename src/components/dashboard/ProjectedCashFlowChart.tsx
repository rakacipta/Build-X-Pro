import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Project, PurchaseOrder, FinanceTransaction, ApprovalRequest } from '../../types';
import { formatRupiah, formatCompactNumber } from '../../utils/formatters';

interface ProjectedCashFlowChartProps {
  projects: Project[];
  purchaseOrders?: PurchaseOrder[];
  financeTransactions: FinanceTransaction[];
  approvals: ApprovalRequest[];
  onNavigate: (module: string) => void;
}

export const ProjectedCashFlowChart: React.FC<ProjectedCashFlowChartProps> = ({
  projects,
  purchaseOrders = [],
  financeTransactions,
  approvals,
  onNavigate,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<6 | 12>(6);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // 1. Compute current liquid cash balance from finance transactions
  const currentCashBalance = useMemo(() => {
    const cashIn = financeTransactions
      .filter((t) => t.type === 'Cash In')
      .reduce((acc, t) => acc + t.amount, 0);
    const cashOut = financeTransactions
      .filter((t) => t.type === 'Cash Out')
      .reduce((acc, t) => acc + t.amount, 0);
    return cashIn - cashOut;
  }, [financeTransactions]);

  // 2. Derive upcoming milestones from projects
  const upcomingMilestones = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.status === 'In Progress' || p.status === 'Planning'
    );

    const milestones: {
      id: string;
      projectId: string;
      projectName: string;
      client: string;
      milestoneName: string;
      projectedDate: string; // YYYY-MM
      amount: number;
      percentage: number;
    }[] = [];

    const now = new Date(2026, 7, 1); // Current date baseline (Aug 2026)

    activeProjects.forEach((prj) => {
      const remainingProgress = 100 - prj.progressPct;
      const contractVal = prj.contractValue;

      // Project milestones schedule (Termin Progress)
      if (prj.progressPct < 25) {
        // Milestone 1: Termin DP / Mobilisasi 20%
        const dateM1 = new Date(now);
        dateM1.setMonth(dateM1.getMonth() + 0);
        milestones.push({
          id: `ms-${prj.id}-1`,
          projectId: prj.id,
          projectName: prj.name,
          client: prj.client,
          milestoneName: 'Termin I - Uang Muka / Mobilisasi (20%)',
          projectedDate: `${dateM1.getFullYear()}-${String(dateM1.getMonth() + 1).padStart(2, '0')}`,
          amount: contractVal * 0.2,
          percentage: 20,
        });
      }

      if (prj.progressPct < 50) {
        // Milestone 2: Termin Prestasi 50%
        const dateM2 = new Date(now);
        dateM2.setMonth(dateM2.getMonth() + 1);
        milestones.push({
          id: `ms-${prj.id}-2`,
          projectId: prj.id,
          projectName: prj.name,
          client: prj.client,
          milestoneName: 'Termin II - Kemajuan Pekerjaan 50%',
          projectedDate: `${dateM2.getFullYear()}-${String(dateM2.getMonth() + 1).padStart(2, '0')}`,
          amount: contractVal * 0.3,
          percentage: 30,
        });
      }

      if (prj.progressPct < 85) {
        // Milestone 3: Termin Prestasi 80%
        const dateM3 = new Date(now);
        dateM3.setMonth(dateM3.getMonth() + 2);
        milestones.push({
          id: `ms-${prj.id}-3`,
          projectId: prj.id,
          projectName: prj.name,
          client: prj.client,
          milestoneName: 'Termin III - Kemajuan Pekerjaan 80%',
          projectedDate: `${dateM3.getFullYear()}-${String(dateM3.getMonth() + 1).padStart(2, '0')}`,
          amount: contractVal * 0.3,
          percentage: 30,
        });
      }

      if (remainingProgress > 0) {
        // Milestone 4: Termin Serah Terima (BAST) & Retensi (20%)
        const dateM4 = new Date(now);
        dateM4.setMonth(dateM4.getMonth() + 3);
        milestones.push({
          id: `ms-${prj.id}-4`,
          projectId: prj.id,
          projectName: prj.name,
          client: prj.client,
          milestoneName: 'Termin IV - BAST 100% & Retensi (20%)',
          projectedDate: `${dateM4.getFullYear()}-${String(dateM4.getMonth() + 1).padStart(2, '0')}`,
          amount: contractVal * 0.2,
          percentage: 20,
        });
      }
    });

    return milestones;
  }, [projects]);

  // 3. Derive pending & upcoming Purchase Orders (outflows)
  const pendingPOs = useMemo(() => {
    // Include active purchase orders that represent upcoming cash outflow
    const posFromState = purchaseOrders.filter(
      (po) => po.status === 'Pending Approval' || po.status === 'Approved' || po.status === 'Draft'
    );

    // Also collect PO approval requests from approvals list
    const poApprovals = approvals
      .filter((a) => a.type === 'Purchase Order' && a.status === 'Pending')
      .map((a) => ({
        id: a.id,
        poNumber: a.reqNo,
        vendorName: 'Supplier / Subkontraktor Material',
        date: a.requestDate,
        deliveryDate: a.requestDate,
        totalAmount: a.amount,
        status: 'Pending Approval' as const,
        items: [],
        requestedBy: a.requestedBy,
      }));

    // Combine & remove duplicate PO numbers if any
    const poMap = new Map<string, PurchaseOrder>();
    posFromState.forEach((po) => poMap.set(po.poNumber || po.id, po));
    poApprovals.forEach((po) => {
      if (!poMap.has(po.poNumber)) {
        poMap.set(po.poNumber, po);
      }
    });

    return Array.from(poMap.values());
  }, [purchaseOrders, approvals]);

  // 4. Build monthly projected cash flow dataset for Recharts
  const monthlyProjectionData = useMemo(() => {
    const result = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    const currentYear = 2026;
    const currentMonthIndex = 7; // August (0-indexed = 7)

    let runningCash = currentCashBalance;

    for (let i = 0; i < timeHorizon; i++) {
      const monthOffset = currentMonthIndex + i;
      const year = currentYear + Math.floor(monthOffset / 12);
      const mIdx = monthOffset % 12;
      const monthKey = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[mIdx]} ${year}`;

      // Inflow from project milestones due in monthKey
      const milestoneInflow = upcomingMilestones
        .filter((m) => m.projectedDate === monthKey)
        .reduce((sum, m) => sum + m.amount, 0);

      // Baseline sales/operational collections estimate for active projects
      const baselineCollection = projects.filter((p) => p.status === 'In Progress').length * 250000000;
      const totalInflow = milestoneInflow + (i === 0 ? 0 : baselineCollection * 0.4);

      // Outflow from pending POs in monthKey
      const poOutflow = pendingPOs
        .filter((po) => {
          const poDate = po.deliveryDate || po.date;
          return poDate.startsWith(monthKey) || (i === 0 && !poDate.includes('-'));
        })
        .reduce((sum, po) => sum + po.totalAmount, 0);

      // Estimated operational & RAB material disbursement for active projects
      const activeRabTotal = projects
        .filter((p) => p.status === 'In Progress')
        .reduce((sum, p) => sum + (p.rabTotal - p.actualCost), 0);
      const monthlyRabDisbursement = (activeRabTotal / 12) * 0.35;

      const totalOutflow = poOutflow + monthlyRabDisbursement + (i === 0 ? 150000000 : 0);
      const netCashflow = totalInflow - totalOutflow;

      runningCash += netCashflow;

      result.push({
        monthKey,
        monthLabel,
        inflow: totalInflow,
        outflow: totalOutflow,
        netCashflow,
        cumulativeBalance: runningCash,
        milestoneInflow,
        poOutflow,
        inflowM: Math.round((totalInflow / 1000000000) * 100) / 100,
        outflowM: Math.round((totalOutflow / 1000000000) * 100) / 100,
        netM: Math.round((netCashflow / 1000000000) * 100) / 100,
        cumulativeM: Math.round((runningCash / 1000000000) * 100) / 100,
      });
    }

    return result;
  }, [timeHorizon, currentCashBalance, upcomingMilestones, pendingPOs, projects]);

  // Totals for summary badges
  const totalProjectedInflow = useMemo(
    () => monthlyProjectionData.reduce((sum, d) => sum + d.inflow, 0),
    [monthlyProjectionData]
  );
  const totalProjectedOutflow = useMemo(
    () => monthlyProjectionData.reduce((sum, d) => sum + d.outflow, 0),
    [monthlyProjectionData]
  );
  const totalNetProjected = totalProjectedInflow - totalProjectedOutflow;
  const endingProjectedBalance =
    monthlyProjectionData[monthlyProjectionData.length - 1]?.cumulativeBalance || 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-4 rounded-xl shadow-xl text-xs space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" /> {data.monthLabel}
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded">
              Proyeksi
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Inflow (Milestone & Kas):
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatRupiah(data.inflow)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Outflow (Pending PO & Cost):
              </span>
              <span className="font-bold text-rose-400 font-mono">
                {formatRupiah(data.outflow)}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800 pt-1.5">
              <span className="text-slate-300 font-bold">Arus Kas Bersih:</span>
              <span
                className={`font-black font-mono ${
                  data.netCashflow >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {formatRupiah(data.netCashflow)}
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-lg mt-2">
              <span className="text-slate-300 text-[11px] font-semibold">Proyeksi Saldo Kumulatif:</span>
              <span className="font-black text-blue-300 font-mono text-xs">
                {formatRupiah(data.cumulativeBalance)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
                Proyeksi Cash Flow & Likuiditas Perusahaan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi estimasi arus kas masuk (Termin Proyek) & kas keluar (Pending Purchase Orders & Biaya Operasional).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setTimeHorizon(6)}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeHorizon === 6
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Bulan Ke Depan
            </button>
            <button
              onClick={() => setTimeHorizon(12)}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeHorizon === 12
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Bulan Ke Depan
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'chart'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grafik Recharts
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rincian Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projected Inflow */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Proyeksi Kas Masuk ({timeHorizon} Bln)
            </span>
            <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
              {formatCompactNumber(totalProjectedInflow)}
            </p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Based on {upcomingMilestones.length} Milestone Proyek
            </p>
          </div>
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Projected Outflow */}
        <div className="bg-rose-50/60 border border-rose-200/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
              Proyeksi Kas Keluar ({timeHorizon} Bln)
            </span>
            <p className="text-xl font-black text-rose-700 mt-1 font-mono">
              {formatCompactNumber(totalProjectedOutflow)}
            </p>
            <p className="text-[10px] text-rose-600 mt-0.5 font-medium flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Incl. {pendingPOs.length} Pending PO & RAB
            </p>
          </div>
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Net Cashflow Horizon */}
        <div className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Proyeksi Net Cashflow
            </span>
            <p className={`text-xl font-black mt-1 font-mono ${totalNetProjected >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
              {formatCompactNumber(totalNetProjected)}
            </p>
            <p className="text-[10px] text-blue-600 mt-0.5 font-medium">
              Surplus Operasional
            </p>
          </div>
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Ending Cumulative Balance */}
        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Proyeksi Saldo Kas Akhir
            </span>
            <p className="text-xl font-black text-emerald-400 mt-1 font-mono">
              {formatCompactNumber(endingProjectedBalance)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Baseline Saat Ini: {formatCompactNumber(currentCashBalance)}
            </p>
          </div>
          <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      {viewMode === 'chart' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Inflow (Termin Proyek)
              <span className="w-3 h-3 rounded-sm bg-rose-500 ml-3"></span> Outflow (PO & Operasional)
              <span className="w-3 h-3 rounded-full bg-indigo-600 ml-3"></span> Saldo Kumulatif
            </span>
            <span className="text-slate-400 font-mono">Skala Dalam Miliar Rupiah (M)</span>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyProjectionData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickFormatter={(v) => `Rp ${v}M`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#6366f1' }}
                  axisLine={false}
                  tickFormatter={(v) => `Rp ${v}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => (
                    <span className="text-slate-700 font-semibold">{value}</span>
                  )}
                />
                <Bar
                  yAxisId="left"
                  dataKey="inflowM"
                  name="Kas Masuk (Inflow)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  yAxisId="left"
                  dataKey="outflowM"
                  name="Kas Keluar (Outflow)"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeM"
                  name="Saldo Kumulatif"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Detailed Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold text-[10px]">
                <th className="p-3">Bulan</th>
                <th className="p-3 text-right">Inflow Proyeksi (Miliar)</th>
                <th className="p-3 text-right">Outflow PO & Cost (Miliar)</th>
                <th className="p-3 text-right">Net Cashflow (Miliar)</th>
                <th className="p-3 text-right">Saldo Kumulatif</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {monthlyProjectionData.map((d) => (
                <tr key={d.monthKey} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {d.monthLabel}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-bold">
                    {formatRupiah(d.inflow)}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-600 font-bold">
                    {formatRupiah(d.outflow)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono font-black ${
                      d.netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatRupiah(d.netCashflow)}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-700 font-extrabold">
                    {formatRupiah(d.cumulativeBalance)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedMonth(selectedMonth === d.monthKey ? null : d.monthKey)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-[10px] font-bold transition"
                    >
                      {selectedMonth === d.monthKey ? 'Tutup Rincian' : 'Rincian Data'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Two-Column Breakdown: Upcoming Project Milestones vs Pending Purchase Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Upcoming Project Milestones (Inflow Sources) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Upcoming Project Milestones ({upcomingMilestones.length})
            </h4>
            <button
              onClick={() => onNavigate('project')}
              className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
            >
              Lihat Proyek <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {upcomingMilestones.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Tidak ada milestone proyek mendatang.
              </p>
            ) : (
              upcomingMilestones.map((ms) => (
                <div
                  key={ms.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-300 transition"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                      {ms.projectName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Klien: {ms.client} • <span className="font-semibold text-emerald-700">{ms.milestoneName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Est. Tagih: {ms.projectedDate}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-emerald-600 font-mono block">
                      {formatRupiah(ms.amount)}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                      Inflow
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Pending Purchase Orders (Outflow Commitments) */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-rose-600" />
              Pending Purchase Orders & PO Approvals ({pendingPOs.length})
            </h4>
            <button
              onClick={() => onNavigate('purchasing')}
              className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
            >
              Lihat Purchasing <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {pendingPOs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Tidak ada Purchase Order pending saat ini.
              </p>
            ) : (
              pendingPOs.map((po) => (
                <div
                  key={po.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-rose-300 transition"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{po.poNumber}</span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                        {po.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Vendor: <span className="font-semibold text-slate-800">{po.vendorName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Pengiriman: {po.deliveryDate || po.date}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-rose-600 font-mono block">
                      {formatRupiah(po.totalAmount)}
                    </span>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                      Outflow
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
