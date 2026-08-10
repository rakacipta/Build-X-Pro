import React from 'react';
import {
  TrendingUp,
  Building2,
  DollarSign,
  PieChart as PieIcon,
  AlertCircle,
  Truck,
  Users,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Activity,
  FileText,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import {
  Project,
  FinanceTransaction,
  Equipment,
  Employee,
  ApprovalRequest,
  Material,
  PurchaseOrder,
  ProjectInvoice,
  ChartOfAccount,
  Tender,
} from '../../types';
import { ProjectedCashFlowChart } from './ProjectedCashFlowChart';
import { TenderVsProjectChart } from './TenderVsProjectChart';
import { MonthlyCashFlowChart } from './MonthlyCashFlowChart';
import { formatRupiah, formatCompactNumber } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardModuleProps {
  projects: Project[];
  financeTransactions: FinanceTransaction[];
  equipment: Equipment[];
  employees: Employee[];
  approvals: ApprovalRequest[];
  materials: Material[];
  purchaseOrders?: PurchaseOrder[];
  invoices?: ProjectInvoice[];
  coaList?: ChartOfAccount[];
  tenders?: Tender[];
  onNavigate: (mod: any) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  projects,
  financeTransactions,
  equipment,
  employees,
  approvals,
  materials,
  purchaseOrders = [],
  invoices = [],
  coaList = [],
  tenders = [],
  onNavigate,
}) => {
  // Dynamic calculation for Piutang Proyek & Hutang Supplier
  const coaPiutang = coaList.find(
    (c) => c.code === '103-001' || c.name.toLowerCase().includes('piutang')
  )?.balance || 0;

  const coaHutang = coaList.find(
    (c) => c.code === '201-001' || c.name.toLowerCase().includes('hutang')
  )?.balance || 0;

  // Invoice Piutang: include active issued invoices that are NOT Paid, NOT Closed, NOT Cancelled, NOT Draft
  const invoicesPiutang = invoices
    .filter((inv) => {
      const status = (inv.status || '').toString();
      return status !== 'Paid' && status !== 'Closed' && status !== 'Cancelled' && status !== 'Draft';
    })
    .reduce((acc, inv) => {
      const total = inv.totalAmount || inv.subtotal || 0;
      const paid = (inv as any).paidAmount || (inv as any).amountPaid || 0;
      return acc + Math.max(0, total - paid);
    }, 0);

  // PO Hutang: include active Purchase Orders that are NOT Paid, NOT Closed, NOT Rejected, NOT Draft
  const poHutang = purchaseOrders
    .filter((po) => {
      const status = (po.status || '').toString();
      return status !== 'Paid' && status !== 'Closed' && status !== 'Rejected' && status !== 'Draft';
    })
    .reduce((acc, po) => {
      const total = po.totalAmount || 0;
      const paid = (po as any).paidAmount || 0;
      return acc + Math.max(0, total - paid);
    }, 0);

  const totalPiutang = coaPiutang > 0 ? coaPiutang : invoicesPiutang;
  const totalHutang = coaHutang > 0 ? coaHutang : poHutang;

  // Calculated KPIs
  const activeProjects = projects.filter((p) => p.status === 'In Progress');
  const totalContractValue = projects.reduce((acc, p) => acc + p.contractValue, 0);
  const totalRab = projects.reduce((acc, p) => acc + p.rabTotal, 0);
  const totalActualCost = projects.reduce((acc, p) => acc + p.actualCost, 0);
  const totalProjectProfit = totalContractValue - totalActualCost;

  const cashIn = financeTransactions
    .filter((t) => t.type === 'Cash In')
    .reduce((acc, t) => acc + t.amount, 0);
  const cashOut = financeTransactions
    .filter((t) => t.type === 'Cash Out')
    .reduce((acc, t) => acc + t.amount, 0);
  const netCashflow = cashIn - cashOut;

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');

  const equipmentInUse = equipment.filter((e) => e.status === 'In Use').length;
  const equipmentUtilization =
    equipment.length > 0 ? Math.round((equipmentInUse / equipment.length) * 100) : 0;

  const avgAttendance = 96; // %
  const minStockAlerts = materials.filter((m) => m.stockQty <= m.minStock);

  // Chart Data Preparation
  const monthlyData = [
    { month: 'Jan', Penjualan: 4.2, Pengeluaran: 3.1, Profit: 1.1 },
    { month: 'Feb', Penjualan: 5.5, Pengeluaran: 3.8, Profit: 1.7 },
    { month: 'Mar', Penjualan: 6.8, Pengeluaran: 4.9, Profit: 1.9 },
    { month: 'Apr', Penjualan: 7.2, Pengeluaran: 5.2, Profit: 2.0 },
    { month: 'Mei', Penjualan: 8.5, Pengeluaran: 6.0, Profit: 2.5 },
    { month: 'Jun', Penjualan: 9.1, Pengeluaran: 6.5, Profit: 2.6 },
    { month: 'Jul', Penjualan: 12.4, Pengeluaran: 8.1, Profit: 4.3 },
  ];

  const projectProgressData = projects.map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    Progress: p.progressPct,
  }));

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

  return (
    <div id="dashboard-module" className="p-8 space-y-6 bg-slate-50">
      <PrintHeader
        title="DASHBOARD EXECUTIVE & LAPORAN KPI REALTIME"
        subtitle="Laporan Ringkasan Performa Operasional Proyek, Keuangan, Material & SDM Perusahaan"
      />

      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border border-blue-500/30 mb-2">
              <Activity className="w-3.5 h-3.5" /> Ringkasan Operasional Perusahaan
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight uppercase">
              Dashboard Executive & KPI Realtime
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Monitoring proyek konstruksi, suplai material, arus kas, dan approval dalam satu tampilan terpadu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <CetakPdfButton
              elementId="dashboard-module"
              filename="Dashboard_Executive_KPI_Build_X_Pro.pdf"
              title="Dashboard Executive & KPI Realtime"
              variant="emerald"
            />
            <button
              onClick={() => onNavigate('project')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 shadow-lg shadow-blue-900/30 transition"
            >
              <Building2 className="w-4 h-4" /> Kelola Proyek
            </button>
            <button
              onClick={() => onNavigate('approvals')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition"
            >
              <CheckSquare className="w-4 h-4 text-blue-400" /> Approval ({pendingApprovals.length})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Pendapatan / Kontrak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Total Kontrak Proyek
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-slate-900">
              {formatCompactNumber(totalContractValue)}
            </p>
            <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
              <span className="font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12%
              </span>{' '}
              vs kuartal lalu
            </p>
          </div>
        </div>

        {/* Card 2: Estimasi Laba Proyek */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Estimasi Laba Kotor
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-emerald-600">
              {formatCompactNumber(totalProjectProfit)}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Margin Rata-rata:{' '}
              <span className="font-bold text-slate-800">
                {((totalProjectProfit / totalContractValue) * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Arus Kas Bersih */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Net Cashflow Bulan Ini
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-blue-600">
              {formatCompactNumber(netCashflow)}
            </p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2 font-medium">
              <span>In: {formatCompactNumber(cashIn)}</span>
              <span>•</span>
              <span>Out: {formatCompactNumber(cashOut)}</span>
            </p>
          </div>
        </div>

        {/* Card 4: Equipment Utilization */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Equipment Utilization
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-slate-900">{equipmentUtilization}%</p>
            <p className="text-xs text-blue-600 font-medium mt-2">
              {equipmentInUse} dari {equipment.length} unit aktif beroperasi
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Proyek Berjalan</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{activeProjects.length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Piutang Proyek</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            {totalPiutang > 0 ? `Rp ${formatCompactNumber(totalPiutang)}` : 'Rp 0'}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hutang Supplier</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {totalHutang > 0 ? `Rp ${formatCompactNumber(totalHutang)}` : 'Rp 0'}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Absensi Karyawan</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{avgAttendance}%</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stok Kritis</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{minStockAlerts.length} Item</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Approval</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{pendingApprovals.length}</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales, Expenses & Profit Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Cashflow & Revenue Analysis (Year to Date)</h3>
              <p className="text-xs text-slate-500">Dalam Miliar Rupiah (M) - Tahun 2026</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Penjualan</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Pengeluaran</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Profit</span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`Rp ${val} M`, '']}
                  contentStyle={{ borderRadius: '8px', borderColor: '#e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="Penjualan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Progress Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 mb-1">Progress Proyek Aktif (%)</h3>
            <p className="text-xs text-slate-500 mb-4">Realisasi Fisik Lapangan vs Target</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgressData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Progress']} />
                  <Bar dataKey="Progress" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <button
            onClick={() => onNavigate('project')}
            className="w-full mt-4 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white py-2.5 rounded-md transition text-center uppercase tracking-wider"
          >
            Lihat Detail Manajemen Proyek →
          </button>
        </div>
      </div>

      {/* Real-time Target Tender vs Project Achievement Visualization */}
      <TenderVsProjectChart
        tenders={tenders}
        projects={projects}
        onNavigate={onNavigate}
      />

      {/* Monthly Cash Flow In vs Out Visualization */}
      <MonthlyCashFlowChart
        financeTransactions={financeTransactions}
        invoices={invoices}
        purchaseOrders={purchaseOrders}
        onNavigate={onNavigate}
      />

      {/* Projected Cash Flow Visualization Component (Recharts) */}
      <ProjectedCashFlowChart
        projects={projects}
        purchaseOrders={purchaseOrders}
        financeTransactions={financeTransactions}
        approvals={approvals}
        onNavigate={onNavigate}
      />

      {/* Bottom Row: Pending Approvals & Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approval Widget */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Upcoming Approvals ({pendingApprovals.length})
            </h3>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-blue-600 text-xs font-bold uppercase hover:underline"
            >
              View All
            </button>
          </div>
          <div className="flex-1 divide-y divide-slate-100">
            {pendingApprovals.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                  {app.type.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{app.title}</div>
                  <div className="text-[10px] text-slate-500 tracking-wide uppercase mt-0.5">
                    Oleh: {app.requestedBy} • {app.requestDate}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="font-bold text-xs text-slate-900 block">
                    {formatRupiah(app.amount)}
                  </span>
                  <button
                    onClick={() => onNavigate('approvals')}
                    className="px-3 py-1 bg-slate-100 text-[10px] font-bold uppercase rounded hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning Widget */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Peringatan Stok Minimum ({minStockAlerts.length})
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-blue-600 text-xs font-bold uppercase hover:underline"
            >
              Ke Gudang
            </button>
          </div>
          <div className="flex-1 p-4 divide-y divide-slate-100">
            {minStockAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Semua stok material dalam kondisi aman di atas batas minimum.
              </p>
            ) : (
              minStockAlerts.map((mat) => (
                <div
                  key={mat.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900">{mat.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                      Gudang: {mat.warehouse} • SKU: {mat.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-rose-600 block">
                      Stok: {mat.stockQty} {mat.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Min: {mat.minStock} {mat.unit}
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
