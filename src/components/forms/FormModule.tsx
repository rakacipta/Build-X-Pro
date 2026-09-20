import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  Layers,
  Calendar,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  PenTool,
  Camera,
  Trash2,
  Copy,
  Edit3,
  Download,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BarChart3,
  Send,
  FileText,
  User,
  Printer,
} from 'lucide-react';
import {
  CustomForm,
  FormCategory,
  FormSubmission,
  Project,
  CompanyProfile,
  LetterheadSettings,
  SystemUser,
} from '../../types';
import { INITIAL_CUSTOM_FORMS, INITIAL_FORM_SUBMISSIONS } from '../../lib/formSeedData';
import { FormFillModal } from './FormFillModal';
import { FormBuilderModal } from './FormBuilderModal';
import { FormSubmissionDetailModal } from './FormSubmissionDetailModal';
import { PrintBlankFormModal } from './PrintBlankFormModal';
import { PrintSubmissionsRecapModal } from './PrintSubmissionsRecapModal';

interface FormModuleProps {
  projects: Project[];
  currentUser?: SystemUser | null;
  companyProfile?: CompanyProfile;
  letterhead?: LetterheadSettings;
  customForms?: CustomForm[];
  setCustomForms?: React.Dispatch<React.SetStateAction<CustomForm[]>>;
  formSubmissions?: FormSubmission[];
  setFormSubmissions?: React.Dispatch<React.SetStateAction<FormSubmission[]>>;
  onSaveForm?: (form: CustomForm) => void;
  onDeleteForm?: (id: string) => void;
  onSaveSubmission?: (submission: FormSubmission) => void;
  onDeleteSubmission?: (id: string) => void;
}

export const FormModule: React.FC<FormModuleProps> = ({
  projects,
  currentUser,
  companyProfile,
  letterhead,
  customForms: externalForms,
  setCustomForms: externalSetForms,
  formSubmissions: externalSubmissions,
  setFormSubmissions: externalSetSubmissions,
  onSaveForm,
  onDeleteForm,
  onSaveSubmission,
  onDeleteSubmission,
}) => {
  // Local or external state
  const [internalForms, setInternalForms] = useState<CustomForm[]>(
    INITIAL_CUSTOM_FORMS
  );
  const [internalSubmissions, setInternalSubmissions] = useState<
    FormSubmission[]
  >(INITIAL_FORM_SUBMISSIONS);

  const forms = externalForms || internalForms;
  const setForms = externalSetForms || setInternalForms;

  const submissions = externalSubmissions || internalSubmissions;
  const setSubmissions = externalSetSubmissions || setInternalSubmissions;

  // Active Tab: 'catalog' | 'submissions' | 'analytics'
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'submissions' | 'analytics'
  >('catalog');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('Semua');

  // Modals state
  const [activeFillForm, setActiveFillForm] = useState<CustomForm | null>(null);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [viewingSubmission, setViewingSubmission] =
    useState<FormSubmission | null>(null);
  const [blankFormToPrint, setBlankFormToPrint] = useState<CustomForm | null>(null);
  const [isRecapPrintOpen, setIsRecapPrintOpen] = useState<boolean>(false);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Categories list
  const categories: ('Semua' | FormCategory)[] = [
    'Semua',
    'K3 & Keselamatan Kerja',
    'Mutu & Quality Control',
    'Operasional & Laporan Lapangan',
    'Logistik & Material',
    'Alat Berat & Fleet',
    'Keuangan & Kas Bon',
    'HRD & Personalia',
    'Umum & Administrasi',
  ];

  // Stats
  const totalTemplates = forms.length;
  const totalSubmissions = submissions.length;
  const approvedSubmissions = submissions.filter(
    (s) => s.status === 'Approved'
  ).length;
  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'Submitted' || s.status === 'In Review'
  ).length;

  // Filtered Templates
  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const matchSearch =
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === 'Semua' || form.category === selectedCategory;
      const matchProject =
        selectedProjectFilter === 'Semua' ||
        !form.projectId ||
        form.projectId === selectedProjectFilter;
      return matchSearch && matchCat && matchProject;
    });
  }, [forms, searchQuery, selectedCategory, selectedProjectFilter]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        sub.submissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.formTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.projectName &&
          sub.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat =
        selectedCategory === 'Semua' || sub.formCategory === selectedCategory;
      const matchStatus =
        statusFilter === 'Semua' || sub.status === statusFilter;
      const matchProject =
        selectedProjectFilter === 'Semua' ||
        !sub.projectId ||
        sub.projectId === selectedProjectFilter;
      return matchSearch && matchCat && matchStatus && matchProject;
    });
  }, [submissions, searchQuery, selectedCategory, statusFilter, selectedProjectFilter]);

  // Category counts for analytics
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { templates: number; submissions: number }> = {};
    categories.forEach((cat) => {
      if (cat !== 'Semua') {
        counts[cat] = {
          templates: forms.filter((f) => f.category === cat).length,
          submissions: submissions.filter((s) => s.formCategory === cat).length,
        };
      }
    });
    return counts;
  }, [forms, submissions]);

  // Handlers
  const handleSaveNewForm = (savedForm: CustomForm) => {
    setForms((prev) => {
      const exists = prev.some((f) => f.id === savedForm.id);
      if (exists) {
        return prev.map((f) => (f.id === savedForm.id ? savedForm : f));
      }
      return [savedForm, ...prev];
    });
    if (onSaveForm) {
      onSaveForm(savedForm);
    }
    setIsBuilderOpen(false);
    setEditingForm(null);
    showToast(`Template formulir '${savedForm.title}' berhasil disimpan!`);
  };

  const handleDuplicateForm = (form: CustomForm) => {
    const duplicate: CustomForm = {
      ...form,
      id: `frm-${Date.now()}`,
      code: `${form.code}-COPY`,
      title: `${form.title} (Salinan)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      version: 1,
    };
    setForms((prev) => [duplicate, ...prev]);
    if (onSaveForm) {
      onSaveForm(duplicate);
    }
    showToast(`Template '${form.title}' berhasil diduplikasi.`);
  };

  const handleDeleteForm = (formId: string, formTitle: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus template formulir '${formTitle}'?`
      )
    ) {
      setForms((prev) => prev.filter((f) => f.id !== formId));
      if (onDeleteForm) {
        onDeleteForm(formId);
      }
      showToast(`Template '${formTitle}' telah dihapus.`);
    }
  };

  const handleFormSubmit = (newSubmission: FormSubmission) => {
    setSubmissions((prev) => [newSubmission, ...prev]);
    if (onSaveSubmission) {
      onSaveSubmission(newSubmission);
    }
    setActiveFillForm(null);
    showToast(
      `Formulir '${newSubmission.formTitle}' (${newSubmission.submissionNumber}) berhasil dikirim!`
    );
  };

  const handleUpdateSubmissionStatus = (
    subId: string,
    newStatus: 'Approved' | 'Rejected' | 'In Review',
    notes?: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now
      .toTimeString()
      .slice(0, 5)}`;

    let updatedSubmission: FormSubmission | undefined;
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === subId) {
          updatedSubmission = {
            ...s,
            status: newStatus,
            reviewNotes: notes || s.reviewNotes,
            reviewedBy:
              currentUser?.name || 'Hendra Setiawan, ST (Site Manager)',
            reviewedAt: formattedDate,
          };
          return updatedSubmission;
        }
        return s;
      })
    );

    if (updatedSubmission && onSaveSubmission) {
      onSaveSubmission(updatedSubmission);
    }

    if (viewingSubmission && viewingSubmission.id === subId) {
      setViewingSubmission((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              reviewNotes: notes || prev.reviewNotes,
              reviewedBy:
                currentUser?.name || 'Hendra Setiawan, ST (Site Manager)',
              reviewedAt: formattedDate,
            }
          : null
      );
    }

    showToast(`Status pengajuan berhasil diperbarui menjadi ${newStatus}`);
  };

  const handleDeleteSubmission = (subId: string, num: string) => {
    if (window.confirm(`Hapus pengajuan formulir ${num}?`)) {
      setSubmissions((prev) => prev.filter((s) => s.id !== subId));
      if (onDeleteSubmission) {
        onDeleteSubmission(subId);
      }
      showToast(`Pengajuan ${num} telah dihapus.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Manajemen Formulir & Form Builder Dinamis</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Formulir Lapangan & Audit Proyek
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Buat berbagai macam formulir kustom (K3, Mutu/QC, Laporan Harian,
            Logistik, Kas Bon, Alat Berat) dengan tanda tangan digital, foto
            bukti, dan alur persetujuan terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingForm(null);
              setIsBuilderOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Buat Formulir Baru
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Template Formulir
            </p>
            <p className="text-lg font-black text-slate-900">{totalTemplates}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Pengajuan
            </p>
            <p className="text-lg font-black text-slate-900">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Disetujui (Approved)
            </p>
            <p className="text-lg font-black text-emerald-600">
              {approvedSubmissions}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Menunggu Review
            </p>
            <p className="text-lg font-black text-amber-600">
              {pendingSubmissions}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Filters Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" /> Katalog & Isi Formulir ({forms.length})
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'submissions'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4" /> Data Respon & Pengajuan (
              {submissions.length})
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Analitik & Distribusi
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Pengguna Aktif:{' '}
            <span className="font-bold text-slate-800">
              {currentUser?.name || 'Novia / Siska'}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari formulir, kode, topik, pelapor, atau proyek..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Semua' ? 'Semua Kategori Formulir' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Project or Status Filter */}
          {activeTab === 'submissions' ? (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Status Respon</option>
                <option value="Submitted">Submitted (Baru)</option>
                <option value="In Review">In Review (Dalam Telaah)</option>
                <option value="Approved">Approved (Disetujui)</option>
                <option value="Rejected">Rejected (Ditolak / Revisi)</option>
                <option value="Draft">Draft (Draf)</option>
              </select>
            </div>
          ) : (
            <div>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Semua">Semua Proyek Lapangan</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: FORM TEMPLATES CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              Menampilkan {filteredForms.length} dari {forms.length} master template
              formulir
            </span>
            <span>Klik "Isi Formulir" untuk membuat laporan baru</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map((form) => {
              const submissionCount = submissions.filter(
                (s) => s.formId === form.id
              ).length;

              return (
                <div
                  key={form.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {form.code}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        v{form.version}.0
                      </span>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {form.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug mt-0.5">
                        {form.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {form.description || 'Tidak ada deskripsi tambahan.'}
                    </p>

                    {/* Features Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {form.fields.length} Bidang
                      </span>
                      {form.requireSignature && (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold flex items-center gap-1">
                          <PenTool className="w-3 h-3" /> TTD Wajib
                        </span>
                      )}
                      {form.requirePhoto && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-semibold flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Foto Bukti
                        </span>
                      )}
                      {submissionCount > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-semibold">
                          {submissionCount} Respon Masuk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingForm(form);
                          setIsBuilderOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Template Formulir"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateForm(form)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Duplikat Template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteForm(form.id, form.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBlankFormToPrint(form)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                        title="Cetak Blanko Formulir Kosong (PDF / Browser)"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" /> Cetak Blanko
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFillForm(form)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Isi Formulir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredForms.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Tidak ada template formulir yang sesuai
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau kategori filter, atau buat
                formulir kustom baru menggunakan tombol di bawah.
              </p>
              <button
                onClick={() => {
                  setEditingForm(null);
                  setIsBuilderOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                + Buat Formulir Kustom
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMISSIONS & RESPONSES TABLE */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-800 text-sm">
                Daftar Isian Formulir Masuk ({filteredSubmissions.length} Data)
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Buka lembar formulir resmi untuk verifikasi status, bubuhkan tanda tangan, atau cetak lembar dokumen.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecapPrintOpen(true)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Cetak Laporan Rekapitulasi Respon ke PDF / Browser"
              >
                <Printer className="w-4 h-4 text-indigo-400" /> Cetak Rekap Respon (PDF)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. Pengajuan</th>
                  <th className="py-3 px-4">Formulir & Kategori</th>
                  <th className="py-3 px-4">Proyek & Lokasi</th>
                  <th className="py-3 px-4">Pelapor Lapangan</th>
                  <th className="py-3 px-4">Tanggal Diajukan</th>
                  <th className="py-3 px-4 text-center">Bukti / TTD</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const formTemplate = forms.find((f) => f.id === sub.formId);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {sub.submissionNumber}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">
                          {sub.formTitle}
                        </p>
                        <p className="text-[10px] text-indigo-600 font-medium">
                          {sub.formCategory}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">
                          {sub.projectName || 'Formulir Umum'}
                        </p>
                        {sub.location && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {sub.location}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">
                          {sub.submittedBy}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {sub.submittedByRole}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {sub.submittedAt}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {sub.photos && sub.photos.length > 0 && (
                            <span
                              className="p-1 rounded bg-amber-50 text-amber-700 font-mono text-[10px] border border-amber-200"
                              title={`${sub.photos.length} Foto`}
                            >
                              📷 {sub.photos.length}
                            </span>
                          )}
                          {sub.signatures && sub.signatures.length > 0 && (
                            <span
                              className="p-1 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] border border-indigo-200"
                              title="Tertandatangani"
                            >
                              ✍️ {sub.signatures.length}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sub.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : sub.status === 'In Review'
                              ? 'bg-blue-100 text-blue-800'
                              : sub.status === 'Draft'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingSubmission(sub)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-indigo-200"
                            title="Buka Lembar Detail Formulir"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingSubmission(sub)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                            title="Buka Dokumen Resmi & Cetak / Unduh PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" /> Cetak / PDF
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSubmission(sub.id, sub.submissionNumber)
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus Respon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Belum ada respon formulir</p>
              <p className="text-xs text-slate-400">
                Pilih salah satu template di tab Katalog untuk mengisi dan mengirim formulir.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS & BREAKDOWN */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Distribution Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" /> Distribusi Kategori Formulir
                </h3>
                <span className="text-xs text-slate-400">Respon vs Template</span>
              </div>

              <div className="space-y-3">
                {Object.entries(categoryCounts).map(([cat, counts]: [string, { templates: number; submissions: number }]) => (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-800 font-semibold">{cat}</span>
                      <span className="text-slate-500 font-mono">
                        {counts.submissions} respon • {counts.templates} template
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            totalSubmissions > 0
                              ? Math.max(
                                  6,
                                  (counts.submissions / totalSubmissions) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Approval Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Kepatuhan & Status Persetujuan
                </h3>
                <span className="text-xs text-slate-400">Total {submissions.length} Dokumen</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                  <p className="text-xs font-bold text-emerald-700">Disetujui (Approved)</p>
                  <p className="text-2xl font-black mt-1">
                    {submissions.filter((s) => s.status === 'Approved').length}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Laporan siap arsip & audit
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                  <p className="text-xs font-bold text-amber-700">Menunggu Review</p>
                  <p className="text-2xl font-black mt-1">
                    {submissions.filter((s) => s.status === 'Submitted').length}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-1">
                    Memerlukan paraf pengawas
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
                  <p className="text-xs font-bold text-blue-700">Dalam Penelaahan</p>
                  <p className="text-2xl font-black mt-1">
                    {submissions.filter((s) => s.status === 'In Review').length}
                  </p>
                  <p className="text-[11px] text-blue-600 mt-1">
                    Sedang diverifikasi tim MK
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                  <p className="text-xs font-bold text-rose-700">Perlu Revisi / Ditolak</p>
                  <p className="text-2xl font-black mt-1">
                    {submissions.filter((s) => s.status === 'Rejected').length}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    Terdapat temuan unverified
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">
                  Keunggulan Formulir Digital Build X Pro:
                </span>
                <p>
                  Seluruh formulir tersimpan secara real-time dengan jejak audit
                  digital, penanda waktu otomatis, koordinat lokasi/proyek, dan tanda
                  tangan canvas digital yang sah untuk pertanggungjawaban proyek.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORM FILL & SUBMIT */}
      {activeFillForm && (
        <FormFillModal
          form={activeFillForm}
          projects={projects}
          currentUser={currentUser}
          companyProfile={companyProfile}
          letterhead={letterhead}
          onClose={() => setActiveFillForm(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* MODAL: FORM BUILDER (CREATE / EDIT TEMPLATE) */}
      {isBuilderOpen && (
        <FormBuilderModal
          initialForm={editingForm}
          projects={projects}
          currentUser={currentUser}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingForm(null);
          }}
          onSave={handleSaveNewForm}
        />
      )}

      {/* MODAL: SUBMISSION DETAILS & PRINT */}
      {viewingSubmission && (
        <FormSubmissionDetailModal
          submission={viewingSubmission}
          formTemplate={forms.find((f) => f.id === viewingSubmission.formId)}
          companyProfile={companyProfile}
          letterhead={letterhead}
          currentUser={currentUser}
          onClose={() => setViewingSubmission(null)}
          onUpdateStatus={handleUpdateSubmissionStatus}
        />
      )}

      {/* MODAL: PRINT BLANK FORM (BLANKO LAPANGAN KOSONG) */}
      {blankFormToPrint && (
        <PrintBlankFormModal
          form={blankFormToPrint}
          companyProfile={companyProfile}
          letterhead={letterhead}
          onClose={() => setBlankFormToPrint(null)}
        />
      )}

      {/* MODAL: PRINT SUBMISSIONS RECAP SUMMARY */}
      {isRecapPrintOpen && (
        <PrintSubmissionsRecapModal
          submissions={filteredSubmissions}
          projects={projects}
          selectedCategory={selectedCategory}
          statusFilter={statusFilter}
          selectedProjectFilter={selectedProjectFilter}
          companyProfile={companyProfile}
          letterhead={letterhead}
          onClose={() => setIsRecapPrintOpen(false)}
        />
      )}
    </div>
  );
};
