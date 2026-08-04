import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  UserCheck,
  ShieldCheck,
  FileCheck,
  X,
  Award,
  Info,
  RefreshCw,
  Users,
  Link2,
} from 'lucide-react';
import { DocumentSignatory } from '../../types';
import { PrintSignature } from '../common/PrintSignature';
import { getStoredData, setStoredData } from '../../services/firestoreService';
import { INITIAL_SIGNATORIES } from '../../lib/seedData';
import {
  getRegisteredPeople,
  determineRoleType,
  syncSignatoriesWithEmployees,
  RegisteredPerson,
} from '../../utils/signatorySync';

interface SignatoriesSettingsProps {
  onNotify?: (msg: string) => void;
}

export const SignatoriesSettings: React.FC<SignatoriesSettingsProps> = ({
  onNotify = (_msg: string) => {},
}) => {
  const [signatories, setSignatories] = useState<DocumentSignatory[]>(() =>
    getStoredData('document_signatories', INITIAL_SIGNATORIES)
  );

  const [registeredPeople, setRegisteredPeople] = useState<RegisteredPerson[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<DocumentSignatory | null>(null);

  const [formData, setFormData] = useState<Omit<DocumentSignatory, 'id'>>({
    name: '',
    title: '',
    roleType: 'Disetujui',
    division: '',
    nipOrNik: '',
    isDefault: false,
    employeeId: '',
  });

  useEffect(() => {
    setRegisteredPeople(getRegisteredPeople());
  }, [signatories]);

  const saveToStorage = (updated: DocumentSignatory[]) => {
    setSignatories(updated);
    setStoredData('document_signatories', updated);
  };

  const handleSyncEmployees = () => {
    const { signatories: updated, addedCount, updatedCount } = syncSignatoriesWithEmployees();
    setSignatories(updated);
    if (addedCount === 0 && updatedCount === 0) {
      onNotify('Daftar penandatangan sudah 100% selaras dengan Master Karyawan & User.');
    } else {
      onNotify(
        `Sinkronisasi Berhasil! ${addedCount} penandatangan ditambahkan & ${updatedCount} diperbarui dari Master Karyawan.`
      );
    }
  };

  const handleOpenAddModal = () => {
    setEditingSignatory(null);
    setFormData({
      name: '',
      title: '',
      roleType: 'Disiapkan',
      division: 'Operasional',
      nipOrNik: '',
      isDefault: false,
      employeeId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sig: DocumentSignatory) => {
    setEditingSignatory(sig);
    setFormData({
      name: sig.name,
      title: sig.title,
      roleType: sig.roleType,
      division: sig.division || '',
      nipOrNik: sig.nipOrNik || '',
      isDefault: !!sig.isDefault,
      employeeId: sig.employeeId || '',
    });
    setIsModalOpen(true);
  };

  const handleSelectEmployee = (personId: string) => {
    if (!personId) return;
    const person = registeredPeople.find((p) => p.id === personId);
    if (person) {
      setFormData({
        ...formData,
        name: person.name,
        title: person.title,
        division: person.division,
        nipOrNik: person.nipOrNik,
        employeeId: person.id,
        roleType: determineRoleType(person.title),
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus penandatangan "${name}"?`)) {
      const updated = signatories.filter((s) => s.id !== id);
      saveToStorage(updated);
      onNotify(`Penandatangan "${name}" berhasil dihapus.`);
    }
  };

  const handleSetDefault = (sigToSet: DocumentSignatory) => {
    const updated = signatories.map((s) => {
      if (s.roleType === sigToSet.roleType) {
        return { ...s, isDefault: s.id === sigToSet.id };
      }
      return s;
    });
    saveToStorage(updated);
    onNotify(`"${sigToSet.name}" diset sebagai penandatangan utama untuk kategori ${sigToSet.roleType}.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.title.trim()) {
      alert('Nama lengkap dan Jabatan wajib diisi.');
      return;
    }

    let updatedList: DocumentSignatory[] = [];

    if (editingSignatory) {
      updatedList = signatories.map((s) => {
        if (s.id === editingSignatory.id) {
          return {
            ...s,
            name: formData.name,
            title: formData.title,
            roleType: formData.roleType,
            division: formData.division,
            nipOrNik: formData.nipOrNik,
            isDefault: formData.isDefault,
            employeeId: formData.employeeId,
          };
        }
        if (formData.isDefault && s.roleType === formData.roleType) {
          return { ...s, isDefault: false };
        }
        return s;
      });
      onNotify(`Data penandatangan "${formData.name}" berhasil diperbarui.`);
    } else {
      const newSig: DocumentSignatory = {
        id: `sig-${Date.now()}`,
        name: formData.name,
        title: formData.title,
        roleType: formData.roleType,
        division: formData.division,
        nipOrNik: formData.nipOrNik,
        isDefault: formData.isDefault,
        employeeId: formData.employeeId,
      };

      if (formData.isDefault) {
        updatedList = signatories.map((s) =>
          s.roleType === formData.roleType ? { ...s, isDefault: false } : s
        );
        updatedList.push(newSig);
      } else {
        updatedList = [...signatories, newSig];
      }
      onNotify(`Penandatangan baru "${formData.name}" berhasil ditambahkan.`);
    }

    saveToStorage(updatedList);
    setIsModalOpen(false);
  };

  const filteredSignatories = signatories.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.division || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.nipOrNik || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || s.roleType === roleFilter;
    return matchSearch && matchRole;
  });

  const preparedCount = signatories.filter((s) => s.roleType === 'Disiapkan').length;
  const verifiedCount = signatories.filter((s) => s.roleType === 'Diverifikasi').length;
  const approvedCount = signatories.filter((s) => s.roleType === 'Disetujui').length;
  const syncedWithEmpCount = signatories.filter(
    (s) => s.employeeId || registeredPeople.some((p) => p.name.toLowerCase() === s.name.toLowerCase())
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner Notice */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-md text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
            <PenTool className="w-3.5 h-3.5" /> Manajemen Otorisasi PDF & Laporan
          </div>
          <h3 className="text-lg font-bold">Pengaturan Penandatangan Dokumen Resmi</h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Atur dan kelola daftar pejabat / staf penandatangan untuk dokumen PDF (Kop Surat, Purchase Order, Penawaran, Laporan Proyek, Slip Gaji, dll). Tersinkronisasi penuh dengan Daftar Master Karyawan terdaftar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncEmployees}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            title="Tarik data nama dan jabatan dari Master Karyawan secara otomatis"
          >
            <RefreshCw className="w-4 h-4" /> Sinkronkan Karyawan
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" /> Tambah Manual
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Penandatangan</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{signatories.length}</span>
              <span className="text-[10px] text-emerald-600 font-bold">({syncedWithEmpCount} Terhubung Karyawan)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pembuat (Disiapkan)</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{preparedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verifikator Keuangan</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{verifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Penyetuju (Direksi)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, jabatan, NIP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'Disiapkan', 'Diverifikasi', 'Disetujui', 'Lainnya'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === role
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role === 'ALL' ? 'Semua Role' : role}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Nama Pejabat / Penandatangan</th>
                <th className="p-3">Jabatan & Divisi</th>
                <th className="p-3">Role Otorisasi</th>
                <th className="p-3">NIP / Kode</th>
                <th className="p-3 text-center">Status Master Karyawan</th>
                <th className="p-3 text-center">Status Default</th>
                <th className="p-3 text-right">Aksi Modifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredSignatories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Tidak ada data penandatangan dokumen yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSignatories.map((sig) => {
                  const isLinkedToEmployee =
                    !!sig.employeeId ||
                    registeredPeople.some((p) => p.name.toLowerCase() === sig.name.toLowerCase());

                  return (
                    <tr key={sig.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                            {sig.name.charAt(0)}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{sig.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{sig.nipOrNik || 'NIP: -'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{sig.title}</p>
                        <p className="text-[10px] text-slate-500">{sig.division || 'Umum'}</p>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sig.roleType === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : sig.roleType === 'Diverifikasi'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : sig.roleType === 'Disiapkan'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {sig.roleType}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-slate-600 text-[11px]">
                        {sig.nipOrNik || '-'}
                      </td>

                      <td className="p-3 text-center">
                        {isLinkedToEmployee ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terhubung Karyawan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-medium">
                            Eksternal / Manual
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {sig.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold border border-amber-300">
                            <CheckCircle2 className="w-3 h-3 text-amber-600" /> Utama (Default)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(sig)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-700 underline"
                            title="Klik untuk menjadikan default untuk kategori ini"
                          >
                            Atur sbg Utama
                          </button>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(sig)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ubah Penandatangan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sig.id, sig.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Penandatangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live PDF Signature Preview Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Pratinjau Live Blok Tanda Tangan PDF</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tampilan Otomatis Pada Dokumen Cetak
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Setiap perubahan nama dan jabatan di atas akan langsung disinkronkan ke seluruh blok cetak dokumen PDF resmi (Laporan, PO, Invoice, Slip Gaji, Penawaran, dll).
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <PrintSignature note="Contoh Tampilan Pengesahan Dokumen Resmi" />
        </div>
      </div>

      {/* MODAL EDIT / TAMBAH PENANDATANGAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingSignatory ? 'Ubah Penandatangan' : 'Tambah Penandatangan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi profil pejabat / staf penandatangan dokumen PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* SELECT FROM REGISTERED EMPLOYEES */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5">
                <label className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Pilih Dari Daftar Master Karyawan Terdaftar:</span>
                </label>
                <select
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  defaultValue=""
                  className="w-full border border-blue-300 rounded-lg p-2 font-medium text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                >
                  <option value="">-- Pilih Karyawan Terdaftar (Otomatis Isi Data) --</option>
                  {registeredPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.title} ({p.division})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-700 italic">
                  *Memilih karyawan akan otomatis mengisi nama lengkap, jabatan, divisi, NIK, dan role penandatangan.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pejabat & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ir. Hendra Wijaya, MM"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Direktur Utama"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Role PDF
                  </label>
                  <select
                    value={formData.roleType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleType: e.target.value as 'Disiapkan' | 'Diverifikasi' | 'Disetujui' | 'Lainnya',
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Disiapkan">Disiapkan (Pembuat / Staff)</option>
                    <option value="Diverifikasi">Diverifikasi (Manajer Keuangan)</option>
                    <option value="Disetujui">Disetujui (Direktur / Direksi)</option>
                    <option value="Lainnya">Lainnya (Saksi / Pihak Ketiga)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Divisi / Departemen
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Keuangan & Akuntansi"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP / NIK / Kode Pegawai
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: DIR-2018-001"
                    value={formData.nipOrNik}
                    onChange={(e) => setFormData({ ...formData, nipOrNik: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 flex items-start gap-2 text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <label className="flex items-center gap-2 font-bold text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Jadikan sebagai penandatangan UTAMA (Default) untuk kategori "{formData.roleType}"</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2 rounded-xl shadow transition"
                >
                  {editingSignatory ? 'Simpan Perubahan' : 'Tambah Penandatangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
