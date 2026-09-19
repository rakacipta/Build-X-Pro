import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Layers,
  Sparkles,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  List,
  CheckCircle2,
  Star,
  Camera,
  PenTool,
  CheckSquare,
  HelpCircle,
  Eye,
  Settings,
  AlertCircle,
} from 'lucide-react';
import {
  CustomForm,
  CustomFormField,
  FormCategory,
  FormFieldType,
  Project,
  SystemUser,
} from '../../types';

interface FormBuilderModalProps {
  initialForm?: CustomForm | null;
  projects: Project[];
  currentUser?: SystemUser | null;
  onClose: () => void;
  onSave: (form: CustomForm) => void;
}

export const FormBuilderModal: React.FC<FormBuilderModalProps> = ({
  initialForm,
  projects,
  currentUser,
  onClose,
  onSave,
}) => {
  const isEdit = !!initialForm;

  // Metadata state
  const [code, setCode] = useState<string>(
    initialForm?.code || `FRM-NEW-${Math.floor(100 + Math.random() * 900)}`
  );
  const [title, setTitle] = useState<string>(initialForm?.title || '');
  const [category, setCategory] = useState<FormCategory>(
    initialForm?.category || 'K3 & Keselamatan Kerja'
  );
  const [description, setDescription] = useState<string>(
    initialForm?.description || ''
  );
  const [projectId, setProjectId] = useState<string>(initialForm?.projectId || '');
  const [requireSignature, setRequireSignature] = useState<boolean>(
    initialForm?.requireSignature ?? true
  );
  const [requirePhoto, setRequirePhoto] = useState<boolean>(
    initialForm?.requirePhoto ?? false
  );
  const [targetApproverRole, setTargetApproverRole] = useState<string>(
    initialForm?.targetApproverRole || 'Site Manager'
  );

  // Field list state
  const [fields, setFields] = useState<CustomFormField[]>(() => {
    if (initialForm && initialForm.fields && initialForm.fields.length > 0) {
      return JSON.parse(JSON.stringify(initialForm.fields));
    }
    return [
      {
        id: 'fld_heading_1',
        label: 'Informasi Umum Lapangan',
        type: 'heading',
        required: false,
      },
      {
        id: 'fld_tgl',
        label: 'Tanggal Pelaksanaan',
        type: 'date',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0],
      },
      {
        id: 'fld_area',
        label: 'Area / Zona Lapangan',
        type: 'text',
        placeholder: 'Contoh: Lantai 5 Zona Utara',
        required: true,
      },
      {
        id: 'fld_catatan',
        label: 'Uraian Catatan Lapangan',
        type: 'textarea',
        placeholder: 'Rincian deskripsi kondisi lapangan...',
        required: false,
      },
      {
        id: 'fld_ttd',
        label: 'Tanda Tangan Pengawas',
        type: 'signature',
        required: true,
      },
    ];
  });

  // Active editing tab: 'editor' | 'preview'
  const [viewTab, setViewTab] = useState<'editor' | 'preview'>('editor');
  const [newOptionInput, setNewOptionInput] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string>('');

  // Add field handler
  const handleAddField = (type: FormFieldType) => {
    const newId = `fld_${Date.now()}`;
    let defaultLabel = 'Bidang Baru';
    let options: string[] | undefined = undefined;

    switch (type) {
      case 'text':
        defaultLabel = 'Teks Singkat';
        break;
      case 'textarea':
        defaultLabel = 'Catatan Paragraf';
        break;
      case 'number':
        defaultLabel = 'Jumlah / Kuantitas';
        break;
      case 'currency':
        defaultLabel = 'Estimasi Nilai Biaya (Rp)';
        break;
      case 'date':
        defaultLabel = 'Tanggal';
        break;
      case 'time':
        defaultLabel = 'Waktu / Jam';
        break;
      case 'select':
        defaultLabel = 'Pilihan Kategori';
        options = ['Opsi 1', 'Opsi 2', 'Opsi 3'];
        break;
      case 'condition':
        defaultLabel = 'Evaluasi Kondisi / Kelayakan';
        options = ['Sesuai Standar (Pass)', 'Perlu Perbaikan', 'Ditolak (Fail)'];
        break;
      case 'rating':
        defaultLabel = 'Skor Penilaian Kualitas (1-5 Bintang)';
        break;
      case 'photo':
        defaultLabel = 'Foto Bukti Lapangan';
        break;
      case 'signature':
        defaultLabel = 'Tanda Tangan Digital Otorisasi';
        break;
      case 'heading':
        defaultLabel = 'Bagian Baru / Seksi Pemeriksaan';
        break;
    }

    const newField: CustomFormField = {
      id: newId,
      label: defaultLabel,
      type,
      required: type !== 'heading',
      options,
    };

    setFields((prev) => [...prev, newField]);
  };

  // Field change
  const handleFieldPropertyChange = (
    index: number,
    key: keyof CustomFormField,
    val: any
  ) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  // Add option to select / condition field
  const handleAddOption = (fieldIndex: number, optionVal: string) => {
    if (!optionVal.trim()) return;
    setFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIndex];
      const existing = field.options || [];
      if (!existing.includes(optionVal.trim())) {
        copy[fieldIndex] = {
          ...field,
          options: [...existing, optionVal.trim()],
        };
      }
      return copy;
    });
    setNewOptionInput((prev) => ({ ...prev, [fields[fieldIndex].id]: '' }));
  };

  const handleRemoveOption = (fieldIndex: number, optionIdx: number) => {
    setFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIndex];
      const existing = [...(field.options || [])];
      existing.splice(optionIdx, 1);
      copy[fieldIndex] = { ...field, options: existing };
      return copy;
    });
  };

  // Reorder fields
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    setFields((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Delete field
  const handleDeleteField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Save form
  const handleSaveForm = () => {
    if (!title.trim()) {
      setValidationError('Judul formulir tidak boleh kosong');
      return;
    }
    if (!code.trim()) {
      setValidationError('Kode formulir tidak boleh kosong');
      return;
    }
    if (fields.length === 0) {
      setValidationError('Tambahkan minimal 1 bidang dalam formulir');
      return;
    }

    setValidationError('');

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now
      .toTimeString()
      .slice(0, 5)}`;

    const savedForm: CustomForm = {
      id: initialForm?.id || `frm-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      category,
      description: description.trim(),
      projectId: projectId || undefined,
      version: initialForm ? (initialForm.version || 1) + 1 : 1,
      status: initialForm?.status || 'Active',
      createdBy:
        initialForm?.createdBy ||
        `${currentUser?.name || 'Administrator'} (${currentUser?.role || 'Super Admin'})`,
      createdAt: initialForm?.createdAt || formattedDate,
      updatedAt: formattedDate,
      fields,
      requireSignature,
      requirePhoto,
      targetApproverRole,
    };

    onSave(savedForm);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-950/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                  {isEdit ? 'EDIT FORMULIR' : 'FORM BUILDER DINAMIS'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEdit ? `Ubah Formulir: ${initialForm.title}` : 'Buat Formulir Kustom Baru'}
              </h2>
            </div>
          </div>

          {/* Toggle View Tabs */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewTab('editor')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  viewTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Konfigurasi Fields
              </button>
              <button
                type="button"
                onClick={() => setViewTab('preview')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  viewTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Live Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Tutup Form Builder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Validation Banner */}
          {validationError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {validationError}
            </div>
          )}

          {/* Top Form Meta Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Identitas & Spesifikasi Formulir
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor / Kode Form <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: FRM-K3-005"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Judul Lengkap Formulir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Checklist Inspeksi K3 & Safety Patrol Harian"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Formulir
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FormCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="K3 & Keselamatan Kerja">K3 & Keselamatan Kerja</option>
                  <option value="Mutu & Quality Control">Mutu & Quality Control</option>
                  <option value="Operasional & Laporan Lapangan">
                    Operasional & Laporan Lapangan
                  </option>
                  <option value="Logistik & Material">Logistik & Material</option>
                  <option value="Alat Berat & Fleet">Alat Berat & Fleet</option>
                  <option value="HRD & Personalia">HRD & Personalia</option>
                  <option value="Keuangan & Kas Bon">Keuangan & Kas Bon</option>
                  <option value="Umum & Administrasi">Umum & Administrasi</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lingkup Proyek
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Semua Proyek (Master Template)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Reviewer / Penyetuju
                </label>
                <input
                  type="text"
                  value={targetApproverRole}
                  onChange={(e) => setTargetApproverRole(e.target.value)}
                  placeholder="Contoh: Site Manager, QC Lead, PM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi & Petunjuk Pengisian Formulir
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan tujuan formulir ini dibuat dan aturan pengisiannya..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick Settings Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireSignature}
                  onChange={(e) => setRequireSignature(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  Wajibkan Tanda Tangan Digital Pelapor
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requirePhoto}
                  onChange={(e) => setRequirePhoto(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  Wajibkan Lampiran Foto Lapangan
                </span>
              </label>
            </div>
          </div>

          {/* VIEW: EDITOR MODE */}
          {viewTab === 'editor' && (
            <div className="space-y-4">
              {/* Field Adder Toolbar */}
              <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-300" /> Tambah Bidang Baru (Field Types)
                  </span>
                  <span className="text-[11px] text-indigo-300">
                    Klik untuk menyisipkan ke daftar formulir
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddField('text')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <Type className="w-3.5 h-3.5" /> Teks Pendek
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('textarea')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <AlignLeft className="w-3.5 h-3.5" /> Paragraf Catatan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('number')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <Hash className="w-3.5 h-3.5" /> Angka / Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('currency')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Rupiah / Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('date')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Tanggal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('time')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <Clock className="w-3.5 h-3.5" /> Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('select')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <List className="w-3.5 h-3.5" /> Pilihan Dropdown
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('condition')}
                    className="px-2.5 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-emerald-400/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ceklis Mutu (Baik/Rusak)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('rating')}
                    className="px-2.5 py-1.5 bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-amber-400/30"
                  >
                    <Star className="w-3.5 h-3.5" /> Rating 1-5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('photo')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <Camera className="w-3.5 h-3.5" /> Foto Bukti
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('signature')}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Tanda Tangan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddField('heading')}
                    className="px-2.5 py-1.5 bg-indigo-700/60 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-indigo-400/30"
                  >
                    <Layers className="w-3.5 h-3.5" /> Pemisah Bagian (Header)
                  </button>
                </div>
              </div>

              {/* List of Configured Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                  <span>Daftar Bidang Formulir ({fields.length} item)</span>
                  <span>Gunakan panah untuk mengubah urutan</span>
                </div>

                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className={`bg-white rounded-xl border p-4 shadow-sm transition space-y-3 ${
                      field.type === 'heading'
                        ? 'border-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Field Header & Controls */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center border border-slate-200">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {field.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Geser ke Atas"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, 'down')}
                          disabled={idx === fields.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Geser ke Bawah"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 ml-1"
                          title="Hapus Bidang Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Field Config Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Label Pertanyaan / Judul Bidang
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            handleFieldPropertyChange(idx, 'label', e.target.value)
                          }
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {field.type !== 'heading' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Placeholder / Contoh
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) =>
                              handleFieldPropertyChange(
                                idx,
                                'placeholder',
                                e.target.value
                              )
                            }
                            placeholder="Contoh isian..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                          />
                        </div>
                      )}

                      {field.type === 'number' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Satuan Unit
                          </label>
                          <input
                            type="text"
                            value={field.unit || ''}
                            onChange={(e) =>
                              handleFieldPropertyChange(idx, 'unit', e.target.value)
                            }
                            placeholder="m3, kg, zak, jam..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                          />
                        </div>
                      )}

                      {field.type !== 'heading' && (
                        <div className="flex items-center pt-5">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                handleFieldPropertyChange(
                                  idx,
                                  'required',
                                  e.target.checked
                                )
                              }
                              className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-700">
                              Wajib Diisi (Required)
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Option Manager for Select / Condition */}
                    {(field.type === 'select' || field.type === 'condition') && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">
                          Daftar Opsi Pilihan:
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {(field.options || []).map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-medium border border-slate-200"
                            >
                              {opt}
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx, optIdx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                &times;
                              </button>
                            </span>
                          ))}

                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newOptionInput[field.id] || ''}
                              onChange={(e) =>
                                setNewOptionInput((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOption(
                                    idx,
                                    newOptionInput[field.id] || ''
                                  );
                                }
                              }}
                              placeholder="Tambah opsi..."
                              className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 w-32"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleAddOption(
                                  idx,
                                  newOptionInput[field.id] || ''
                                )
                              }
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md text-xs border border-indigo-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: LIVE PREVIEW MODE */}
          {viewTab === 'preview' && (
            <div className="bg-white rounded-xl border border-slate-300 shadow-md p-6 space-y-6">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    {code || 'FRM-DRAFT'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {title || 'Judul Formulir'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
                    {category}
                  </span>
                </div>
              </div>

              {/* Mock Rendered Form Fields */}
              <div className="space-y-4">
                {fields.map((f, i) => {
                  if (f.type === 'heading') {
                    return (
                      <div
                        key={i}
                        className="pt-3 pb-1 border-b border-slate-200 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {f.label}
                        </h4>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        {f.label}
                        {f.required && (
                          <span className="text-rose-500 font-bold">*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        disabled
                        placeholder={f.placeholder || `[Kolom tipe ${f.type}]`}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {fields.length} bidang dikonfigurasi dalam template
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Simpan Template Formulir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
