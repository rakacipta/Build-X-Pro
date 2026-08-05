import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  PieChart,
  Filter,
  Trash2,
  Layers,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Briefcase,
  CheckCircle2,
  FileText,
  DollarSign,
  X,
  AlertCircle,
  Calendar,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { FinanceTransaction, Project } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface FinanceModuleProps {
  transactions: FinanceTransaction[];
  projects?: Project[];
  onSaveTransaction: (trx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  transactions,
  projects = [],
  onSaveTransaction,
  onDeleteTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'project_cashflow' | 'project_summary'>('project_cashflow');
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Cash In' | 'Cash Out'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

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
    projectId: projects.length > 0 ? projects[0].id : '',
    refNo: '',
  });

  // Calculate General Summaries
  const totalIn = transactions
    .filter((t) => t.type === 'Cash In')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === 'Cash Out')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashflow = totalIn - totalOut;

  // Calculate Per-Project Aggregates
  const projectFinancials = projects.map((prj) => {
    const prjTrx = transactions.filter((t) => t.projectId === prj.id);
    const prjIn = prjTrx
      .filter((t) => t.type === 'Cash In')
      .reduce((acc, t) => acc + t.amount, 0);
    const prjOut = prjTrx
      .filter((t) => t.type === 'Cash Out')
      .reduce((acc, t) => acc + t.amount, 0);
    const prjNet = prjIn - prjOut;
    const marginPct = prjIn > 0 ? ((prjIn - prjOut) / prjIn) * 100 : 0;
    const rabRealizationPct = prj.rabTotal > 0 ? (prjOut / prj.rabTotal) * 100 : 0;

    return {
      project: prj,
      totalIn: prjIn,
      totalOut: prjOut,
      netCashflow: prjNet,
      marginPct,
      rabRealizationPct,
      transactionCount: prjTrx.length,
    };
  });

  // Filtered Transactions for "All Transactions" Tab
  const filteredAllTrx = transactions.filter((t) => {
    const matchesSearch =
      t.trxNo.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.refNo || '').toLowerCase().includes(search.toLowerCase());
    const matchesAcc = accountFilter === 'All' || t.account === accountFilter;
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesProject = selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    return matchesSearch && matchesAcc && matchesType && matchesProject;
  });

  // Selected Project for "Project Cashflow" Tab
  const currentSelectedProject = projects.find((p) => p.id === selectedProjectId);
  const currentProjectStats = projectFinancials.find((p) => p.project.id === selectedProjectId);

  // Category breakdown for selected project
  const projectTrxList = selectedProjectId === 'ALL'
    ? transactions.filter((t) => !!t.projectId)
    : transactions.filter((t) => t.projectId === selectedProjectId);

  const filteredProjectTrx = projectTrxList.filter((t) => {
    const matchesSearch =
      t.trxNo.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.refNo || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCat;
  });

  // Calculate Category Breakdowns for Project
  const categoriesIn = Array.from(
    new Set(projectTrxList.filter((t) => t.type === 'Cash In').map((t) => t.category))
  );
  const categoriesOut = Array.from(
    new Set(projectTrxList.filter((t) => t.type === 'Cash Out').map((t) => t.category))
  );

  const handleOpenAddModal = (defaultType: 'Cash In' | 'Cash Out' = 'Cash In', prjId?: string) => {
    const targetPrjId = prjId || (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.id || '');
    setEditingTrx({
      id: 'trx-' + Date.now(),
      trxNo: `TRX/${new Date().getFullYear()}/0${transactions.length + 1}`,
      type: defaultType,
      account: 'Bank BCA',
      amount: 0,
      category: defaultType === 'Cash In' ? 'Pembayaran Proyek' : 'Pembelian Material',
      description: '',
      date: new Date().toISOString().split('T')[0],
      projectId: targetPrjId,
      refNo: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrx && editingTrx.description && editingTrx.amount) {
      onSaveTransaction(editingTrx as FinanceTransaction);
      setIsModalOpen(false);
    } else {
      alert('Mohon isi semua field wajib (Nominal & Keterangan).');
    }
  };

  return (
    <div id="finance-module" className="p-6 space-y-6">
      <PrintHeader
        title={
          selectedProjectId !== 'ALL' && currentSelectedProject
            ? `LAPORAN ARUS KAS PROYEK: ${currentSelectedProject.name.toUpperCase()}`
            : 'LAPORAN ARUS KAS, PEMASUKAN & PENGELUARAN PER PROYEK'
        }
        subtitle={
          selectedProjectId !== 'ALL' && currentSelectedProject
            ? `Kode Proyek: ${currentSelectedProject.code} | Klien: ${currentSelectedProject.client} | Lokasi: ${currentSelectedProject.location}`
            : 'Rincian Realisasi Penerimaan Termijn, Biaya Operasional, Pengeluaran Material, & Subkon Per Proyek'
        }
      />

      {/* Main Module Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Keuangan & Kas Proyek</h2>
              <p className="text-xs text-slate-500">
                Pencatatan Pemasukan (Termijn / DP) & Pengeluaran Kas/Bank Per Proyek Konstruksi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CetakPdfButton
            elementId="finance-module"
            filename={
              selectedProjectId !== 'ALL' && currentSelectedProject
                ? `Laporan_Keuangan_${currentSelectedProject.code}.pdf`
                : 'Laporan_Keuangan_Per_Proyek.pdf'
            }
            title="Laporan Keuangan Proyek"
            variant="emerald"
          />

          <button
            onClick={() => handleOpenAddModal('Cash In')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <ArrowDownLeft className="w-4 h-4" /> + Pemasukan Proyek
          </button>

          <button
            onClick={() => handleOpenAddModal('Cash Out')}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <ArrowUpRight className="w-4 h-4" /> + Pengeluaran Proyek
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab('project_cashflow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'project_cashflow'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4 text-amber-400" />
          Arus Kas Per Proyek
        </button>

        <button
          onClick={() => setActiveTab('project_summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'project_summary'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Rekapitulasi Keuangan Antar Proyek
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          Semua Transaksi Kas & Bank
        </button>
      </div>

      {/* TAB 1: ARUS KAS PER PROYEK */}
      {activeTab === 'project_cashflow' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                <FolderOpen className="w-3.5 h-3.5" /> Pilih Proyek Utama
              </div>
              <h3 className="text-base font-bold">Filter Laporan Pengeluaran & Pemasukan Proyek</h3>
            </div>

            <div className="w-full sm:w-96">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-800 text-white font-bold border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="ALL">🔍 Semua Proyek Terdaftar (Konsolidasi)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Project Summary Cards */}
          {selectedProjectId !== 'ALL' && currentSelectedProject && currentProjectStats ? (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      {currentSelectedProject.code}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {currentSelectedProject.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Klien: <strong className="text-slate-800">{currentSelectedProject.client}</strong> | Lokasi:{' '}
                      <strong className="text-slate-800">{currentSelectedProject.location}</strong> | PM:{' '}
                      <strong className="text-slate-800">{currentSelectedProject.projectManager}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        currentProjectStats.netCashflow >= 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Cashflow: {currentProjectStats.netCashflow >= 0 ? 'SURPLUS' : 'DEFISIT'}
                    </span>
                  </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Kontrak</p>
                    <p className="text-base font-black text-slate-900 mt-1">
                      {formatRupiah(currentSelectedProject.contractValue)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nilai awal proyek</p>
                  </div>

                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                      Total Pemasukan <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    </p>
                    <p className="text-base font-black text-emerald-700 mt-1">
                      {formatRupiah(currentProjectStats.totalIn)}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      {((currentProjectStats.totalIn / currentSelectedProject.contractValue) * 100).toFixed(1)}% dari Kontrak
                    </p>
                  </div>

                  <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
                    <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center justify-between">
                      Total Pengeluaran <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    </p>
                    <p className="text-base font-black text-rose-700 mt-1">
                      {formatRupiah(currentProjectStats.totalOut)}
                    </p>
                    <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                      Realisasi vs RAB: {currentProjectStats.rabRealizationPct.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Sisa Cashflow Kas</p>
                    <p className={`text-base font-black mt-1 ${currentProjectStats.netCashflow >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                      {formatRupiah(currentProjectStats.netCashflow)}
                    </p>
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                      Margin Realisasi: {currentProjectStats.marginPct.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Anggaran RAB</p>
                    <p className="text-base font-black text-amber-900 mt-1">
                      {formatRupiah(currentSelectedProject.rabTotal)}
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      Progress Fisik: {currentSelectedProject.progressPct}%
                    </p>
                  </div>
                </div>

                {/* Progress bar Realisasi vs RAB */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Realisasi Biaya Kas ({formatRupiah(currentProjectStats.totalOut)}) vs Budget RAB ({formatRupiah(currentSelectedProject.rabTotal)})</span>
                    <span className={currentProjectStats.rabRealizationPct > 100 ? 'text-rose-600' : 'text-emerald-600'}>
                      {currentProjectStats.rabRealizationPct.toFixed(1)}% Terpakai
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentProjectStats.rabRealizationPct > 100
                          ? 'bg-rose-500'
                          : currentProjectStats.rabRealizationPct > 85
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(currentProjectStats.rabRealizationPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Consolidated Summary Card for ALL Projects
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan Semua Proyek</p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  {formatRupiah(
                    transactions
                      .filter((t) => t.type === 'Cash In' && !!t.projectId)
                      .reduce((a, b) => a + b.amount, 0)
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Pencairan termijn & DP client</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran Semua Proyek</p>
                <p className="text-xl font-black text-rose-600 mt-1">
                  {formatRupiah(
                    transactions
                      .filter((t) => t.type === 'Cash Out' && !!t.projectId)
                      .reduce((a, b) => a + b.amount, 0)
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Material, Subkon, Alat & Ops</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Surplus Kas Proyek</p>
                <p className="text-xl font-black text-blue-600 mt-1">
                  {formatRupiah(
                    transactions
                      .filter((t) => !!t.projectId)
                      .reduce((a, b) => a + (b.type === 'Cash In' ? b.amount : -b.amount), 0)
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Selisih Kas Masuk - Keluar Proyek</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proyek Aktif</p>
                <p className="text-xl font-black text-slate-900 mt-1">{projects.length} Proyek</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tercatat dalam sistem ERP</p>
              </div>
            </div>
          )}

          {/* Transaction Search & Type Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari No TRX, Keterangan, No Ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Jenis
                </button>
                <button
                  onClick={() => setTypeFilter('Cash In')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'Cash In'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 inline mr-1" /> Pemasukan (Cash In)
                </button>
                <button
                  onClick={() => setTypeFilter('Cash Out')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    typeFilter === 'Cash Out'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" /> Pengeluaran (Cash Out)
                </button>

                {/* Category Filter Select */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 outline-none"
                >
                  <option value="ALL">Semua Kategori</option>
                  {[...categoriesIn, ...categoriesOut].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table of Transactions for Selected Project */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                    <th className="p-3.5">Nomor TRX & Tanggal</th>
                    <th className="p-3.5">Proyek Terkait</th>
                    <th className="p-3.5">Jenis TRX</th>
                    <th className="p-3.5">Akun Kas / Bank</th>
                    <th className="p-3.5">Kategori & Keterangan</th>
                    <th className="p-3.5 text-right">Nominal (Rp)</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProjectTrx.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada catatan pengeluaran/pemasukan yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProjectTrx.map((trx) => {
                      const matchedPrj = projects.find((p) => p.id === trx.projectId);
                      return (
                        <tr key={trx.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5">
                            <p className="font-mono font-bold text-amber-600">{trx.trxNo}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{trx.date}</p>
                            {trx.refNo && (
                              <p className="text-[10px] text-blue-600 font-mono">Ref: {trx.refNo}</p>
                            )}
                          </td>

                          <td className="p-3.5">
                            {matchedPrj ? (
                              <div>
                                <p className="font-bold text-slate-900 max-w-xs truncate">
                                  {matchedPrj.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {matchedPrj.code}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Non-Proyek / Kantor</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                trx.type === 'Cash In'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {trx.type === 'Cash In' ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              {trx.type === 'Cash In' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </td>

                          <td className="p-3.5 font-bold text-slate-800">{trx.account}</td>

                          <td className="p-3.5 max-w-md">
                            <div className="font-bold text-slate-900">{trx.category}</div>
                            <div className="text-[11px] text-slate-600">{trx.description}</div>
                          </td>

                          <td
                            className={`p-3.5 text-right font-black text-sm ${
                              trx.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {trx.type === 'Cash In' ? '+' : '-'}{formatRupiah(trx.amount)}
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Apakah Anda yakin ingin menghapus transaksi "${trx.trxNo}"?`
                                  )
                                ) {
                                  onDeleteTransaction(trx.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI KEUANGAN ANTA PROYEK */}
      {activeTab === 'project_summary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Matriks Perbandingan Keuangan & Arus Kas Antar Proyek
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan Nilai Kontrak, Total Penerimaan, Realisasi Pengeluaran, & Profit Margin Kas Per Proyek
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase">
                  <tr>
                    <th className="p-3.5">Kode & Nama Proyek</th>
                    <th className="p-3.5">Klien & Lokasi</th>
                    <th className="p-3.5 text-right">Nilai Kontrak</th>
                    <th className="p-3.5 text-right">Pemasukan (Cash In)</th>
                    <th className="p-3.5 text-right">Pengeluaran (Cash Out)</th>
                    <th className="p-3.5 text-right">Sisa Kas (Surplus)</th>
                    <th className="p-3.5 text-center">Status Cashflow</th>
                    <th className="p-3.5 text-center">Aksi Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {projectFinancials.map((item) => (
                    <tr key={item.project.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-amber-600 text-[11px]">
                          {item.project.code}
                        </span>
                        <p className="font-bold text-slate-900 max-w-xs">{item.project.name}</p>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">{item.project.client}</p>
                        <p className="text-[10px] text-slate-500">{item.project.location}</p>
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {formatRupiah(item.project.contractValue)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-emerald-600">
                        +{formatRupiah(item.totalIn)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-rose-600">
                        -{formatRupiah(item.totalOut)}
                      </td>

                      <td
                        className={`p-3.5 text-right font-black ${
                          item.netCashflow >= 0 ? 'text-blue-600' : 'text-rose-600'
                        }`}
                      >
                        {formatRupiah(item.netCashflow)}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.netCashflow >= 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {item.netCashflow >= 0 ? 'SURPLUS' : 'DEFISIT'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedProjectId(item.project.id);
                            setActiveTab('project_cashflow');
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition"
                        >
                          Lihat Arus Kas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEMUA TRANSAKSI KAS & BANK (GENERAL) */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* General Cashflow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Penerimaan Kas (Cash In)</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{formatRupiah(totalIn)}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pengeluaran Kas (Cash Out)</span>
              <p className="text-xl font-black text-rose-600 mt-1">{formatRupiah(totalOut)}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Net Surplus Cashflow</span>
              <p className="text-xl font-black text-blue-600 mt-1">{formatRupiah(netCashflow)}</p>
            </div>
          </div>

          {/* Account Filter & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari No TRX / Keterangan Transaksi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {['All', 'Bank BCA', 'Bank Mandiri', 'Kas Utama', 'Petty Cash'].map((acc) => (
                  <button
                    key={acc}
                    onClick={() => setAccountFilter(acc)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition ${
                      accountFilter === acc
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {acc}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase">
                    <th className="p-3.5">Nomor TRX & Tanggal</th>
                    <th className="p-3.5">Jenis TRX</th>
                    <th className="p-3.5">Akun Kas / Bank</th>
                    <th className="p-3.5">Proyek Terkait</th>
                    <th className="p-3.5">Kategori & Keterangan</th>
                    <th className="p-3.5 text-right">Jumlah (Rp)</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAllTrx.map((trx) => {
                    const matchedPrj = projects.find((p) => p.id === trx.projectId);
                    return (
                      <tr key={trx.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <p className="font-mono font-bold text-amber-600">{trx.trxNo}</p>
                          <p className="text-[10px] text-slate-500">{trx.date}</p>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              trx.type === 'Cash In'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {trx.type}
                          </span>
                        </td>

                        <td className="p-3.5 font-bold text-slate-800">{trx.account}</td>

                        <td className="p-3.5 font-semibold text-slate-700">
                          {matchedPrj ? matchedPrj.code : '-'}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{trx.category}</div>
                          <div className="text-[11px] text-slate-500">{trx.description}</div>
                        </td>

                        <td
                          className={`p-3.5 text-right font-black text-sm ${
                            trx.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {trx.type === 'Cash In' ? '+' : '-'}{formatRupiah(trx.amount)}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus transaksi ${trx.trxNo}?`)) {
                                onDeleteTransaction(trx.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PrintSignature note="Laporan Arus Kas (Cash Flow), Penerimaan Termijn & Transaksi Operasional Proyek" />

      {/* MODAL INPUT VOUCHER TRANSAKSI PROYEK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white font-bold ${editingTrx.type === 'Cash In' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {editingTrx.type === 'Cash In' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Input Voucher {editingTrx.type === 'Cash In' ? 'Pemasukan' : 'Pengeluaran'} Proyek
                  </h3>
                  <p className="text-xs text-slate-500">Pencatatan kas masuk / keluar per proyek konstruksi</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Proyek Terkait <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingTrx.projectId || ''}
                  onChange={(e) => setEditingTrx({ ...editingTrx, projectId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Non-Proyek (Kantor / Umum) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Voucher TRX</label>
                  <input
                    type="text"
                    required
                    value={editingTrx.trxNo || ''}
                    onChange={(e) => setEditingTrx({ ...editingTrx, trxNo: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-amber-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi</label>
                  <select
                    value={editingTrx.type || 'Cash In'}
                    onChange={(e) => {
                      const newType = e.target.value as 'Cash In' | 'Cash Out';
                      setEditingTrx({
                        ...editingTrx,
                        type: newType,
                        category: newType === 'Cash In' ? 'Pembayaran Proyek' : 'Pembelian Material',
                      });
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Cash In">Cash In (Pemasukan Proyek)</option>
                    <option value="Cash Out">Cash Out (Pengeluaran Proyek)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Akun Kas / Bank</label>
                  <select
                    value={editingTrx.account || 'Bank BCA'}
                    onChange={(e) =>
                      setEditingTrx({ ...editingTrx, account: e.target.value as any })
                    }
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Bank BCA">Bank BCA Operasional</option>
                    <option value="Bank Mandiri">Bank Mandiri Giro Proyek</option>
                    <option value="Kas Utama">Kas Utama Kantor</option>
                    <option value="Petty Cash">Petty Cash Proyek</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingTrx.amount || 0}
                    onChange={(e) =>
                      setEditingTrx({
                        ...editingTrx,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-black text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Transaksi</label>
                  <select
                    value={editingTrx.category || 'Pembayaran Proyek'}
                    onChange={(e) => setEditingTrx({ ...editingTrx, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {editingTrx.type === 'Cash In' ? (
                      <>
                        <option value="Pembayaran Proyek">Pembayaran Termijn Proyek</option>
                        <option value="Pencairan Down Payment (DP)">Pencairan Down Payment (DP)</option>
                        <option value="Klaim Variation Order">Klaim Variation Order (VO)</option>
                        <option value="Pengembalian Dana Kas Proyek">Pengembalian Dana Kas Proyek</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Pembelian Material">Pembelian Material Proyek</option>
                        <option value="Gaji & Payroll">Upah Pekerja / Subkon / Payroll</option>
                        <option value="Sewa Alat">Sewa Alat Berat & Equipment</option>
                        <option value="Operasional">Operasional Lapangan & K3</option>
                        <option value="Lainnya">Pengeluaran Lainnya</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal & No. Ref (Inv / PO)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      required
                      value={editingTrx.date || ''}
                      onChange={(e) => setEditingTrx({ ...editingTrx, date: e.target.value })}
                      className="border border-slate-200 rounded-xl p-2 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="No. PO / Inv"
                      value={editingTrx.refNo || ''}
                      onChange={(e) => setEditingTrx({ ...editingTrx, refNo: e.target.value })}
                      className="border border-slate-200 rounded-xl p-2 font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan Lengkap Transaksi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pembayaran Termijn #3 Proyek Wisma Utama (65% Progress)"
                  value={editingTrx.description || ''}
                  onChange={(e) => setEditingTrx({ ...editingTrx, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-extrabold text-white rounded-xl shadow transition ${
                    editingTrx.type === 'Cash In' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Simpan Voucher {editingTrx.type === 'Cash In' ? 'Pemasukan' : 'Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
