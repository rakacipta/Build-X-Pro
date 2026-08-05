import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  User,
  MapPin,
  TrendingUp,
  FileText,
  AlertTriangle,
  Layers,
  CheckCircle,
  PlusCircle,
  Edit2,
  Trash2,
  Clock,
  Building2,
  Printer,
  Scale,
  PieChart,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { BudgetVsActualWidget } from './BudgetVsActualWidget';
import { Project, RABItem, FinanceTransaction, PurchaseOrder, VariationOrder, DailyReport, AppNotification } from '../../types';
import { formatRupiah, formatCompactNumber } from '../../utils/formatters';

interface ProjectModuleProps {
  projects: Project[];
  rabItems?: RABItem[];
  financeTransactions?: FinanceTransaction[];
  purchases?: PurchaseOrder[];
  onSaveProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onTriggerNotification?: (notif: Partial<AppNotification>) => void;
}

export const ProjectModule: React.FC<ProjectModuleProps> = ({
  projects,
  rabItems = [],
  financeTransactions = [],
  purchases = [],
  onSaveProject,
  onDeleteProject,
  onTriggerNotification,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'budget-vs-actual' | 'vo' | 'reports'>('overview');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [deletingProject, setDeletingProject] = useState<{ id: string; name: string } | null>(null);

  // Mock variation orders & daily reports
  const [voList, setVoList] = useState<VariationOrder[]>([
    {
      id: 'vo-001',
      projectId: 'prj-001',
      voNumber: 'VO/2026/001',
      title: 'Pekerjaan Tambahan Bore Pile Diameter 80cm (4 Titik)',
      description: 'Penyesuaian struktur akibat kondisi tanah lempung basah di kedalaman 18m',
      amount: 420000000,
      status: 'Approved',
      requestedDate: '2026-06-15',
    },
    {
      id: 'vo-002',
      projectId: 'prj-001',
      voNumber: 'VO/2026/002',
      title: 'Upgrade Spesifikasi Fasad Kaca Double Glazing Low-E',
      description: 'Penggantian tipe kaca luar untuk efisiensi energi gedung',
      amount: 850000000,
      status: 'Pending',
      requestedDate: '2026-07-20',
    },
  ]);

  const [dailyReports, setDailyReports] = useState<DailyReport[]>([
    {
      id: 'dr-001',
      projectId: 'prj-001',
      date: '2026-07-28',
      weather: 'Cerah',
      activities: 'Pengecoran plat lantai 8 zone A (Vol 120m3). Pembesian kolom zone B.',
      workersCount: 42,
      equipmentUsed: 'Tower Crane, Concrete Pump, Mixer Truck (6 Unit)',
      supervisor: 'Hendra Setiawan, ST',
    },
  ]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingProject({
      id: 'prj-' + Date.now(),
      code: `PRJ-${new Date().getFullYear()}-00${projects.length + 1}`,
      name: '',
      client: '',
      contractValue: 0,
      rabTotal: 0,
      actualCost: 0,
      progressPct: 0,
      status: 'Planning',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-06-30',
      projectManager: 'Ir. Budi Santoso, MT',
      siteManager: 'Hendra Setiawan, ST',
      location: 'Jakarta',
      category: 'Gedung',
      retentionPct: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (projectToEdit: Project) => {
    setEditingProject({ ...projectToEdit });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingProject({ id, name });
  };

  const confirmDeleteProject = () => {
    if (deletingProject) {
      const idToDelete = deletingProject.id;
      const nameToDelete = deletingProject.name;

      onDeleteProject(idToDelete);

      const remaining = projects.filter((p) => p.id !== idToDelete);
      if (remaining.length > 0) {
        setSelectedProjectId(remaining[0].id);
      } else {
        setSelectedProjectId('');
      }

      if (onTriggerNotification) {
        onTriggerNotification({
          type: 'SYSTEM',
          title: 'Proyek Dihapus',
          message: `Proyek "${nameToDelete}" telah berhasil dihapus dari sistem.`,
          priority: 'high',
        });
      }

      setDeletingProject(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject && editingProject.name) {
      const isExisting = projects.some((p) => p.id === editingProject.id);
      const projectToSave: Project = {
        id: editingProject.id || 'prj-' + Date.now(),
        code: editingProject.code || `PRJ-${new Date().getFullYear()}-001`,
        name: editingProject.name.trim(),
        client: editingProject.client || '-',
        contractValue: Number(editingProject.contractValue) || 0,
        rabTotal: Number(editingProject.rabTotal) || 0,
        actualCost: Number(editingProject.actualCost) || 0,
        progressPct: Number(editingProject.progressPct) || 0,
        status: editingProject.status || 'Planning',
        startDate: editingProject.startDate || new Date().toISOString().split('T')[0],
        endDate: editingProject.endDate || '2027-12-31',
        projectManager: editingProject.projectManager || '-',
        siteManager: editingProject.siteManager || '-',
        location: editingProject.location || '-',
        category: editingProject.category || 'Gedung',
        retentionPct: Number(editingProject.retentionPct) || 5,
      };

      onSaveProject(projectToSave);
      setSelectedProjectId(projectToSave.id);
      setIsModalOpen(false);
      setEditingProject(null);

      if (onTriggerNotification) {
        onTriggerNotification({
          type: 'SYSTEM',
          title: isExisting ? 'Proyek Diperbarui' : 'Proyek Baru Ditambahkan',
          message: `Data proyek "${projectToSave.name}" (${projectToSave.code}) telah berhasil disimpan ke database.`,
          priority: 'medium',
        });
      }
    }
  };

  return (
    <div id="project-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN MANAJEMEN & PROGRESS FISIK PROYEK"
        subtitle="Monitoring Progress Proyek, Kurva S, Laporan Harian & Variation Order"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">Project Control & Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring fisik proyek, Kurva S, WBS, Laporan Harian, Variation Order (VO), dan Serah Terima.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <CetakPdfButton
            elementId="project-module"
            filename="Laporan_Manajemen_Proyek_Build_X_Pro.pdf"
            title="Laporan Manajemen & Progress Fisik Proyek"
            variant="emerald"
          />
          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Proyek Baru
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Project List Sidebar + Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects Selector List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama proyek / client..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredProjects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{p.code}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(p);
                        }}
                        className="p-1 hover:bg-slate-200/80 text-slate-600 hover:text-amber-700 rounded transition"
                        title="Edit Proyek"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id, p.name);
                        }}
                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Hapus Proyek"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                          p.status === 'In Progress'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 line-clamp-2">{p.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">{p.client}</p>

                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Progress Fisik</span>
                      <span className="text-amber-600">{p.progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-500"
                        style={{ width: `${p.progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Project Comprehensive View */}
        {selectedProject && (
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    {selectedProject.code} • {selectedProject.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    {selectedProject.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>Client: <strong className="text-slate-200">{selectedProject.client}</strong></span>
                    <span>•</span>
                    <span>Lokasi: <strong className="text-slate-200">{selectedProject.location}</strong></span>
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Nilai Kontrak</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatRupiah(selectedProject.contractValue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedProject)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Proyek</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedProject.id, selectedProject.name)}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-500/30 transition shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress & Financial Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">RAB Target Cost</span>
                  <span className="font-bold text-slate-200">
                    {formatRupiah(selectedProject.rabTotal)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Realisasi Biaya Lapangan</span>
                  <span className="font-bold text-emerald-400">
                    {formatRupiah(selectedProject.actualCost)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Tim Penanggung Jawab</span>
                  <span className="font-bold text-slate-200">{selectedProject.projectManager}</span>
                </div>
              </div>
            </div>

            {/* Subtabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Ringkasan Progress & WBS
              </button>
              <button
                onClick={() => setActiveTab('budget-vs-actual')}
                className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === 'budget-vs-actual'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-blue-900" />
                <span>Budget vs Actual (Kinerja RAB)</span>
              </button>
              <button
                onClick={() => setActiveTab('vo')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'vo'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Variation Order (VO)
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-xl transition ${
                  activeTab === 'reports'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Laporan Harian Lapangan
              </button>
            </div>

            {/* Subtab Content */}
            {activeTab === 'budget-vs-actual' && (
              <BudgetVsActualWidget
                project={selectedProject}
                rabItems={rabItems}
                financeTransactions={financeTransactions}
                purchases={purchases}
                onSyncActualCost={(newActual) => {
                  onSaveProject({
                    ...selectedProject,
                    actualCost: newActual,
                  });
                }}
              />
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Budget vs Actual Preview Banner */}
                <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl border border-blue-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/30 text-blue-300 rounded-xl border border-blue-500/30">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">
                        Real-time Finance & RAB Sync
                      </span>
                      <h4 className="font-bold text-sm text-white">
                        Dashboard Budget vs Actual (Profitability Monitor)
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Target RAB: <strong>{formatRupiah(selectedProject.rabTotal)}</strong> • Realisasi Ledger: <strong className="text-emerald-300">{formatRupiah(selectedProject.actualCost)}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('budget-vs-actual')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shrink-0 transition"
                  >
                    Buka Dashboard Budget vs Actual →
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Rincian WBS & Milestones Proyek</h3>
                  <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">1. Pekerjaan Mobilisasi & Persiapan</span>
                      <p className="text-[11px] text-slate-500">Pemberihan lahan, direksi keet, pagar proyek</p>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      100% Done
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">2. Pekerjaan Struktur Bawah (Substructure)</span>
                      <p className="text-[11px] text-slate-500">Bore pile, pile cap, galian tanah, tie beam</p>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      100% Done
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">3. Pekerjaan Struktur Atas (Superstructure)</span>
                      <p className="text-[11px] text-slate-500">Kolom, balok, pelat lantai 1 - 12</p>
                    </div>
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      68.5% In Progress
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">4. Pekerjaan Arsitektur & Finishing</span>
                      <p className="text-[11px] text-slate-500">Pasangan bata hebel, plesteran, fasad, keramik</p>
                    </div>
                    <span className="font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      0% Not Started
                    </span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'vo' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Pengajuan Variation Order (Pekerjaan Tambah/Kurang)</h3>
                </div>

                <div className="space-y-3 text-xs">
                  {voList.map((vo) => (
                    <div key={vo.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-600">{vo.voNumber}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            vo.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {vo.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900">{vo.title}</h4>
                      <p className="text-slate-600 text-[11px]">{vo.description}</p>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                        <span>Nilai VO:</span>
                        <span className="text-amber-600">{formatRupiah(vo.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Laporan Harian Supervisor (Daily Log)</h3>
                <div className="space-y-3 text-xs">
                  {dailyReports.map((dr) => (
                    <div key={dr.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{dr.date}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                          Cuaca: {dr.weather}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{dr.activities}</p>
                      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex flex-wrap gap-4">
                        <span>Tenaga Kerja: <strong className="text-slate-800">{dr.workersCount} orang</strong></span>
                        <span>Alat: <strong className="text-slate-800">{dr.equipmentUsed}</strong></span>
                        <span>Supervisor: <strong className="text-slate-800">{dr.supervisor}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal Add / Edit Project */}
      {isModalOpen && editingProject && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {projects.some((p) => p.id === editingProject.id)
                ? 'Edit Data Proyek'
                : 'Tambah Proyek Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Proyek</label>
                  <input
                    type="text"
                    required
                    value={editingProject.code || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingProject.category || 'Gedung'}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, category: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Gedung">Gedung</option>
                    <option value="Infrastruktur">Infrastruktur</option>
                    <option value="Jalan & Jembatan">Jalan & Jembatan</option>
                    <option value="Perumahan">Perumahan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pekerjaan Proyek</label>
                <input
                  type="text"
                  required
                  value={editingProject.name || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Client / Owner</label>
                  <input
                    type="text"
                    required
                    value={editingProject.client || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Proyek</label>
                  <input
                    type="text"
                    required
                    value={editingProject.location || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nilai Kontrak (Rp)</label>
                  <input
                    type="number"
                    value={editingProject.contractValue || 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        contractValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RAB Target (Rp)</label>
                  <input
                    type="number"
                    value={editingProject.rabTotal || 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        rabTotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Realisasi Biaya / Actual (Rp)</label>
                  <input
                    type="number"
                    value={editingProject.actualCost || 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        actualCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retensi (%)</label>
                  <input
                    type="number"
                    value={editingProject.retentionPct || 5}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        retentionPct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Progress Fisik (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingProject.progressPct || 0}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        progressPct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Proyek</label>
                  <select
                    value={editingProject.status || 'Planning'}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, status: e.target.value as any })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Manager (PM)</label>
                  <input
                    type="text"
                    value={editingProject.projectManager || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, projectManager: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                    placeholder="Ir. Budi Santoso, MT"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Manager (SM)</label>
                  <input
                    type="text"
                    value={editingProject.siteManager || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, siteManager: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                    placeholder="Hendra Setiawan, ST"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={editingProject.startDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai (Target)</label>
                  <input
                    type="date"
                    value={editingProject.endDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  {projects.some((p) => p.id === editingProject.id) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleDelete(editingProject.id!, editingProject.name || 'Proyek');
                      }}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Proyek</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
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
                    Simpan Proyek
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmation Delete */}
      {deletingProject && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Konfirmasi Hapus Proyek</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              Apakah Anda yakin ingin menghapus proyek <strong className="text-slate-900 font-bold">"{deletingProject.name}"</strong>? Seluruh data overview dan kualifikasi proyek ini akan dihapus dari sistem ERP.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Proyek</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
