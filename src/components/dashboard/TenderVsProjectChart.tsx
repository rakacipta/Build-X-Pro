import React, { useState, useMemo } from 'react';
import {
  Target,
  TrendingUp,
  Award,
  Building2,
  CheckCircle2,
  BarChart2,
  ArrowRight,
  Filter,
  Activity,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Tender, Project } from '../../types';
import { formatRupiah, formatCompactNumber } from '../../utils/formatters';

interface TenderVsProjectChartProps {
  tenders?: Tender[];
  projects: Project[];
  onNavigate: (mod: string) => void;
}

export const TenderVsProjectChart: React.FC<TenderVsProjectChartProps> = ({
  tenders = [],
  projects = [],
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<'category' | 'status'>('category');

  // Overall KPI Calculations
  const totalTargetTender = useMemo(() => {
    return tenders.reduce((acc, t) => acc + (t.budgetEstimate || t.boqTotal || 0), 0);
  }, [tenders]);

  const totalContractValue = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.contractValue || 0), 0);
  }, [projects]);

  const totalRealizedValue = useMemo(() => {
    return projects.reduce(
      (acc, p) => acc + (p.contractValue || 0) * ((p.progressPct || 0) / 100),
      0
    );
  }, [projects]);

  const achievementRate = useMemo(() => {
    if (totalTargetTender <= 0) return totalContractValue > 0 ? 100 : 0;
    return Math.round((totalContractValue / totalTargetTender) * 100);
  }, [totalTargetTender, totalContractValue]);

  const winningTendersCount = useMemo(() => {
    return tenders.filter((t) => t.status === 'Winner').length;
  }, [tenders]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const categories = ['Gedung', 'Infrastruktur', 'Jalan & Jembatan', 'Perumahan', 'Lainnya'];

    return categories.map((cat) => {
      const catTenders = tenders.filter(
        (t) => (t.category || 'Lainnya').toLowerCase() === cat.toLowerCase()
      );
      const catProjects = projects.filter(
        (p) => (p.category || 'Lainnya').toLowerCase() === cat.toLowerCase()
      );

      const targetTenderMb = catTenders.reduce(
        (acc, t) => acc + (t.budgetEstimate || t.boqTotal || 0),
        0
      );
      const nilaiKontrakMb = catProjects.reduce((acc, p) => acc + (p.contractValue || 0), 0);
      const pencapaianRealMb = catProjects.reduce(
        (acc, p) => acc + (p.contractValue || 0) * ((p.progressPct || 0) / 100),
        0
      );

      const targetInM = +(targetTenderMb / 1000000000).toFixed(2);
      const kontrakInM = +(nilaiKontrakMb / 1000000000).toFixed(2);
      const pencapaianInM = +(pencapaianRealMb / 1000000000).toFixed(2);

      const pct = targetInM > 0 ? Math.min(200, Math.round((kontrakInM / targetInM) * 100)) : 0;

      return {
        category: cat,
        'Target Tender (Pagu HPS)': targetInM,
        'Nilai Kontrak Proyek': kontrakInM,
        'Pencapaian Fisik (Rp)': pencapaianInM,
        targetRaw: targetTenderMb,
        kontrakRaw: nilaiKontrakMb,
        pencapaianRaw: pencapaianRealMb,
        pctPencapaian: pct,
      };
    });
  }, [tenders, projects]);

  // Status Breakdown Data
  const statusData = useMemo(() => {
    const draftTenders = tenders.filter((t) => t.status === 'Draft');
    const submittedTenders = tenders.filter((t) => t.status === 'Submitted');
    const winnerTenders = tenders.filter((t) => t.status === 'Winner');

    const inProgressProjects = projects.filter((p) => p.status === 'In Progress');
    const completedProjects = projects.filter((p) => p.status === 'Completed');

    return [
      {
        stage: 'Tahap 1: Evaluasi & Draft Tender',
        'Target Tender (Pagu HPS)': +(
          draftTenders.reduce((a, t) => a + (t.budgetEstimate || 0), 0) / 1000000000
        ).toFixed(2),
        'Nilai Kontrak Proyek': 0,
        'Pencapaian Fisik (Rp)': 0,
        itemCount: `${draftTenders.length} Tender Draft`,
      },
      {
        stage: 'Tahap 2: Pembukaan Lelang (Submitted)',
        'Target Tender (Pagu HPS)': +(
          submittedTenders.reduce((a, t) => a + (t.budgetEstimate || 0), 0) / 1000000000
        ).toFixed(2),
        'Nilai Kontrak Proyek': 0,
        'Pencapaian Fisik (Rp)': 0,
        itemCount: `${submittedTenders.length} Lelang Aktif`,
      },
      {
        stage: 'Tahap 3: Pemenang Lelang (Winner)',
        'Target Tender (Pagu HPS)': +(
          winnerTenders.reduce((a, t) => a + (t.budgetEstimate || 0), 0) / 1000000000
        ).toFixed(2),
        'Nilai Kontrak Proyek': +(
          winnerTenders.reduce((a, t) => a + (t.boqTotal || t.budgetEstimate || 0), 0) / 1000000000
        ).toFixed(2),
        'Pencapaian Fisik (Rp)': 0,
        itemCount: `${winnerTenders.length} Tender Menang`,
      },
      {
        stage: 'Tahap 4: Proyek Berjalan (In Progress)',
        'Target Tender (Pagu HPS)': +(
          inProgressProjects.reduce((a, p) => a + (p.rabTotal || 0), 0) / 1000000000
        ).toFixed(2),
        'Nilai Kontrak Proyek': +(
          inProgressProjects.reduce((a, p) => a + p.contractValue, 0) / 1000000000
        ).toFixed(2),
        'Pencapaian Fisik (Rp)': +(
          inProgressProjects.reduce((a, p) => a + p.contractValue * (p.progressPct / 100), 0) /
          1000000000
        ).toFixed(2),
        itemCount: `${inProgressProjects.length} Proyek On-Site`,
      },
      {
        stage: 'Tahap 5: Proyek Selesai & Serah Terima',
        'Target Tender (Pagu HPS)': +(
          completedProjects.reduce((a, p) => a + p.contractValue, 0) / 1000000000
        ).toFixed(2),
        'Nilai Kontrak Proyek': +(
          completedProjects.reduce((a, p) => a + p.contractValue, 0) / 1000000000
        ).toFixed(2),
        'Pencapaian Fisik (Rp)': +(
          completedProjects.reduce((a, p) => a + p.contractValue, 0) / 1000000000
        ).toFixed(2),
        itemCount: `${completedProjects.length} Proyek Selesai`,
      },
    ];
  }, [tenders, projects]);

  const activeData = viewMode === 'category' ? categoryData : statusData;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-lg shadow-xl text-slate-100 text-xs min-w-[240px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30 font-mono">
              REALTIME
            </span>
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  {entry.name}:
                </span>
                <span className="font-bold font-mono text-white">
                  Rp {entry.value} Miliar
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-indigo-200 mb-1.5">
            <Target className="w-3.5 h-3.5" /> Analisis Real-Time Bidding vs Eksekusi
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Perbandingan Real-time: Target Tender vs Pencapaian Proyek
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi efisiensi konversi nilai penawaran lelang (Pagu HPS) menjadi nilai kontrak dan progres realisasi fisik di lapangan.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'category'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Kategori
            </button>
            <button
              onClick={() => setViewMode('status')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === 'status'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Tahap Status
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Target Tender */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Target Pagu Tender
            </span>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            Rp {formatCompactNumber(totalTargetTender)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {tenders.length} Berkas Tender Terdaftar
          </span>
        </div>

        {/* KPI 2: Realisasi Kontrak Proyek */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Nilai Kontrak Proyek
            </span>
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-700 mt-2">
            Rp {formatCompactNumber(totalContractValue)}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {projects.length} Proyek Dalam Database
          </span>
        </div>

        {/* KPI 3: Pencapaian Fisik Lapangan */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pencapaian Fisik Real (Rp)
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2">
            Rp {formatCompactNumber(totalRealizedValue)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
            Nilai Bobot Progres Terkonfirmasi
          </span>
        </div>

        {/* KPI 4: Achievement Rate */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Rasio Konversi Target
            </span>
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-blue-600 mt-2">{achievementRate}%</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {winningTendersCount} Tender Menang & Terkonversi
          </span>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            Grafik Komparasi Nilai Pagu vs Kontrak vs Pencapaian Fisik (Miliar Rp)
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500"></span> Target Tender (Pagu)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500"></span> Nilai Kontrak
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> Pencapaian Fisik
            </span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={activeData}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey={viewMode === 'category' ? 'category' : 'stage'}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                unit=" M"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="Target Tender (Pagu HPS)"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="Nilai Kontrak Proyek"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="Pencapaian Fisik (Rp)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Details & Action Navigation */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Data disinkronisasi secara otomatis dengan modul <strong>Tender & Bidding</strong> dan{' '}
            <strong>Manajemen Proyek</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('tender')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition flex items-center gap-1.5"
          >
            Modul Tender <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('project')}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            Modul Proyek <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
