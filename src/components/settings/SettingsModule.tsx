import React, { useState } from 'react';
import {
  Building2,
  FileText,
  Users,
  Sliders,
  History,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Lock,
  RefreshCw,
  Eye,
  CreditCard,
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  Download,
  Search,
  Upload,
  UploadCloud,
  Image as ImageIcon,
  PenTool,
  X,
  Check,
  Printer,
  Smartphone,
  MessageSquare,
  Send,
  ExternalLink,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { SignatoriesSettings } from './SignatoriesSettings';
import {
  DEFAULT_EXTERNAL_NOTIF_CONFIG,
  openWhatsappNotification,
  openEmailNotification,
  generatePoWhatsappMessage,
  generatePoEmailPayload,
} from '../../services/externalNotificationService';
import {
  CompanyProfile,
  LetterheadSettings,
  SystemUser,
  SystemSettings,
  UserRole,
} from '../../types';

interface SettingsModuleProps {
  currentRole: UserRole;
  currentUser?: SystemUser | null;
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  letterhead: LetterheadSettings;
  onUpdateLetterhead: (letterhead: LetterheadSettings) => void;
  users: SystemUser[];
  onSaveUser: (user: SystemUser) => void;
  onDeleteUser: (userId: string) => void;
  systemSettings: SystemSettings;
  onUpdateSystemSettings: (settings: SystemSettings) => void;
}

const ROLES_LIST: UserRole[] = [
  'Super Admin',
  'Direktur Utama',
  'Direktur',
  'Finance',
  'Accounting',
  'Purchasing',
  'Marketing',
  'Estimator',
  'Project Manager',
  'Site Manager',
  'Supervisor',
  'Warehouse',
  'HRD',
  'Equipment',
  'Auditor',
];

const PRESET_LOGOS = [
  {
    id: 'preset-1',
    name: 'Perisai Kontraktor Gold-Blue',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="%231e293b"/><path d="M60 16 L95 32 V64 C95 85 60 104 60 104 C60 104 25 85 25 64 V32 Z" fill="%232563eb" stroke="%2338bdf8" stroke-width="3"/><path d="M42 75 V48 L60 38 L78 48 V75 H66 V58 H54 V75 Z" fill="%23fbbf24"/><circle cx="60" cy="30" r="4" fill="%23ffffff"/></svg>',
  },
  {
    id: 'preset-2',
    name: 'Balok Crane Infra Orange-Navy',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="%230f172a"/><path d="M20 95 H100 V85 H20 Z M30 85 L50 35 H70 L90 85 Z" fill="%23f97316"/><path d="M50 35 H95 V25 H40 Z" fill="%23fb923c"/><circle cx="85" cy="55" r="8" fill="%2338bdf8"/><line x1="85" y1="25" x2="85" y2="75" stroke="%23ffffff" stroke-width="3" stroke-dasharray="4,4"/></svg>',
  },
  {
    id: 'preset-3',
    name: 'Badge Monogram GMK Emerald',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="%23022c22"/><path d="M30 30 H90 V90 H30 Z" fill="none" stroke="%2310b981" stroke-width="6"/><path d="M45 45 H75 V75 H45 Z" fill="%23059669"/><text x="60" y="67" font-family="Arial" font-size="22" font-weight="900" fill="%23ffffff" text-anchor="middle">GMK</text></svg>',
  },
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentRole,
  currentUser,
  companyProfile,
  onUpdateCompanyProfile,
  letterhead,
  onUpdateLetterhead,
  users,
  onSaveUser,
  onDeleteUser,
  systemSettings,
  onUpdateSystemSettings,
}) => {
  const isSuperAdminEmail = currentUser?.email?.toLowerCase().trim() === 'sr.rcs88@gmail.com';

  const [activeTab, setActiveTab] = useState<'company' | 'letterhead' | 'signatories' | 'users' | 'system' | 'audit'>('company');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form Local States
  const [profileForm, setProfileForm] = useState<CompanyProfile>(companyProfile);
  const [letterheadForm, setLetterheadForm] = useState<LetterheadSettings>(letterhead);
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(systemSettings);

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [newUserForm, setNewUserForm] = useState<Omit<SystemUser, 'id' | 'lastLogin'>>({
    name: '',
    email: '',
    role: 'Project Manager',
    department: 'Teknik & Proyek',
    phone: '',
    status: 'Active',
  });

  // Bank Form State inside Company Profile
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({
    bankName: 'Bank Mandiri',
    accountNumber: '',
    accountHolder: profileForm.name,
    branch: '',
    initialBalance: 500000000,
  });

  // Audit Logs Mock
  const [auditLogs] = useState([
    { id: 'log-1', timestamp: 'Hari ini, 09:12:04', user: 'Jaka Dewantara (Super Admin)', action: 'Memperbarui Konfigurasi Kop Surat Dokumen', ip: '192.168.1.102' },
    { id: 'log-2', timestamp: 'Hari ini, 08:30:11', user: 'Ir. Hendra Wijaya (Direktur)', action: 'Menyetujui Purchase Order #PO-2026-044', ip: '180.252.91.4' },
    { id: 'log-3', timestamp: 'Kemarin, 17:05:22', user: 'Jaka Dewantara (Super Admin)', action: 'Menambahkan User Baru: Rina Marlina (HRD)', ip: '192.168.1.102' },
    { id: 'log-4', timestamp: 'Kemarin, 14:20:00', user: 'Sari Rahmawati (Finance)', action: 'Membuat Pencairan Kas Kecil Project PRJ-2026-001', ip: '192.168.1.115' },
  ]);

  const triggerNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleLogoFileUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updatedProfile = { ...profileForm, logoUrl: result };
        const updatedLetterhead = { ...letterheadForm, logoUrl: result };
        setProfileForm(updatedProfile);
        setLetterheadForm(updatedLetterhead);
        onUpdateCompanyProfile(updatedProfile);
        onUpdateLetterhead(updatedLetterhead);
        triggerNotification('Logo perusahaan berhasil diunggah dan disimpan!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetLogo = (url: string) => {
    const updatedProfile = { ...profileForm, logoUrl: url };
    const updatedLetterhead = { ...letterheadForm, logoUrl: url };
    setProfileForm(updatedProfile);
    setLetterheadForm(updatedLetterhead);
    onUpdateCompanyProfile(updatedProfile);
    onUpdateLetterhead(updatedLetterhead);
    triggerNotification('Preset logo perusahaan terpilih & disinkronkan!');
  };

  const handleRemoveLogo = () => {
    const updatedProfile = { ...profileForm, logoUrl: undefined };
    const updatedLetterhead = { ...letterheadForm, logoUrl: undefined };
    setProfileForm(updatedProfile);
    setLetterheadForm(updatedLetterhead);
    onUpdateCompanyProfile(updatedProfile);
    onUpdateLetterhead(updatedLetterhead);
    triggerNotification('Logo resmi perusahaan berhasil dihapus.');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanyProfile(profileForm);
    const updatedLetterhead: LetterheadSettings = {
      ...letterheadForm,
      headerTitle: profileForm.name,
      headerSubtitle: profileForm.tagline || letterheadForm.headerSubtitle,
      addressLine1: profileForm.address ? `${profileForm.address}${profileForm.city ? `, ${profileForm.city}` : ''}` : letterheadForm.addressLine1,
      contactLine: `Telp: ${profileForm.phone || ''} | Email: ${profileForm.email || ''}`,
      logoText: profileForm.shortName || letterheadForm.logoText,
    };
    setLetterheadForm(updatedLetterhead);
    onUpdateLetterhead(updatedLetterhead);
    triggerNotification('Identitas Perusahaan dan Kop Surat berhasil diperbarui dan disinkronkan!');
  };

  const handleSaveLetterhead = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLetterhead(letterheadForm);
    triggerNotification('Desain & Format Kop Surat resmi berhasil disimpan!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemSettings(settingsForm);
    triggerNotification('Konfigurasi Sistem & Approval Rules berhasil disimpan!');
  };

  const handleAddBank = () => {
    if (!newBank.accountNumber) return;
    const bankItem = {
      id: `bank-${Date.now()}`,
      ...newBank,
      initialBalance: Number(newBank.initialBalance) || 0,
    };
    const updatedBanks = [...profileForm.banks, bankItem];
    const updatedProfile = { ...profileForm, banks: updatedBanks };
    setProfileForm(updatedProfile);
    onUpdateCompanyProfile(updatedProfile);
    setNewBank({ bankName: 'Bank BCA', accountNumber: '', accountHolder: profileForm.name, branch: '', initialBalance: 500000000 });
    setShowAddBank(false);
    triggerNotification('Rekening Bank Perusahaan berhasil ditambahkan.');
  };

  const handleRemoveBank = (id: string) => {
    const updatedBanks = profileForm.banks.filter((b) => b.id !== id);
    const updatedProfile = { ...profileForm, banks: updatedBanks };
    setProfileForm(updatedProfile);
    onUpdateCompanyProfile(updatedProfile);
    triggerNotification('Rekening Bank berhasil dihapus.');
  };

  const handleOpenUserModal = (user?: SystemUser) => {
    if (user) {
      setEditingUser(user);
      setNewUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status,
      });
    } else {
      setEditingUser(null);
      setNewUserForm({
        name: '',
        email: '',
        role: 'Project Manager',
        department: 'Teknik & Proyek',
        phone: '',
        status: 'Active',
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const userToSave: SystemUser = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      department: newUserForm.department,
      phone: newUserForm.phone,
      status: newUserForm.status,
      lastLogin: editingUser ? editingUser.lastLogin : 'Belum pernah login',
    };

    onSaveUser(userToSave);
    setIsUserModalOpen(false);
    triggerNotification(`Pengguna ${userToSave.name} (${userToSave.role}) berhasil disimpan.`);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const isSuperAdmin = currentRole === 'Super Admin' || currentRole === 'Direktur Utama';

  if (!isSuperAdminEmail) {
    return (
      <div id="settings-module" className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
          {/* Decorative Lighting */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Pengaturan Super Admin Terkunci</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Hak Akses Pengaturan Terbatas
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Menu Pengaturan Sistem, Konfigurasi Profil Perusahaan, Desain Kop Surat Resmi, dan Pengelolaan Otorisasi Pengguna dikunci secara khusus dan hanya dapat diakses oleh akun utama Super Admin:
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 font-sans">Email Resmi Super Admin:</span>
                <span className="font-bold text-blue-300 text-sm">sr.rcs88@gmail.com</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full font-sans font-bold w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              Otorisasi Utama PT Raka Cipta Seraya
            </span>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
            <div className="space-y-1">
              <div className="text-slate-400">
                <span className="text-slate-500">Email Akun Anda saat ini: </span>
                <strong className="text-white font-mono">{currentUser ? currentUser.email : 'Guest / Tidak Terautentikasi'}</strong>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500">Role Terpasang: </span>
                <span className="bg-slate-800 text-blue-300 px-2 py-0.5 rounded font-semibold text-[11px]">
                  {currentUser ? currentUser.role : currentRole}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Untuk masuk sebagai Super Admin, silakan gunakan tombol Keluar di pojok kanan atas profil akun Anda, lalu masuk dengan email: sr.rcs88@gmail.com');
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Petunjuk Login Super Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="settings-module" className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <PrintHeader
        title="DOKUMEN PROFIL PERUSAHAAN & ATURAN KONFIGURASI ERP"
        subtitle={`Identitas Resmi ${companyProfile.name}, Struktur Pengguna & Parameter Workflow System`}
      />

      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border border-blue-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Modul Khusus Super Admin & Direksi
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight uppercase">
              Pengaturan Sistem & Pengelolaan ERP
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Kelola profil perusahaan, desain kop surat resmi, manajemen pengguna, hak akses, dan aturan workflow approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CetakPdfButton
              elementId="settings-module"
              filename="Profil_dan_Aturan_ERP_Build_X_Pro.pdf"
              title="Profil Perusahaan & Aturan Konfigurasi ERP"
              variant="emerald"
            />
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Role Saat Ini:</span>
              <span className="font-bold text-blue-400">{currentRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Notice Warning if not Super Admin */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Akses Terbatas:</span> Anda saat ini berada dalam simulasi role{' '}
            <span className="underline font-bold">{currentRole}</span>. Hanya <span className="font-bold">Super Admin</span> &{' '}
            <span className="font-bold">Direktur Utama</span> yang memiliki izin mengubah parameter identitas dan hak akses sistem.
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'company'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Identitas Perusahaan
        </button>

        <button
          onClick={() => setActiveTab('letterhead')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'letterhead'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Kop Surat & Dokumen
        </button>

        <button
          onClick={() => setActiveTab('signatories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'signatories'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PenTool className="w-4 h-4" /> Penandatangan Dokumen (PDF)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Users & Hak Akses ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Aturan Sistem & Workflow
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Log Aktivitas & Audit
        </button>
      </div>

      {/* TAB 1: IDENTITAS PERUSAHAAN */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    Upload Logo Perusahaan
                  </h3>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Otomatis Sinkron Ke Kop Surat & Header
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah logo resmi perusahaan dalam format PNG, JPG, WEBP, atau SVG (maksimal 5 MB).
                </p>
              </div>

              {profileForm.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={!isSuperAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Logo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Active Logo Preview */}
              <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
                  Preview Logo Aktif
                </span>

                <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 shadow-md p-3 flex items-center justify-center overflow-hidden mb-3 relative group">
                  {profileForm.logoUrl ? (
                    <img
                      src={profileForm.logoUrl}
                      alt="Logo Resmi"
                      className="max-w-full max-h-full object-contain transition duration-200 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <Building2 className="w-12 h-12 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400">Belum Ada Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800">
                    {profileForm.logoUrl ? 'Logo Resmi Terpasang' : 'Logo Standar Sistem'}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {profileForm.logoUrl
                      ? 'Ditampilkan pada Header Utama & Kop Surat A4'
                      : 'Unggah file logo Anda untuk tampilan profesional'}
                  </p>
                </div>
              </div>

              {/* Upload Dropzone & Sample Presets */}
              <div className="md:col-span-8 space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleLogoFileUpload(file);
                  }}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 rounded-2xl p-6 transition flex flex-col items-center justify-center text-center cursor-pointer group relative"
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    disabled={!isSuperAdmin}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoFileUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    Klik atau Seret & Lepaskan File Logo Di Sini
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    Mendukung file <span className="font-bold text-slate-700">PNG, JPG, WEBP, atau SVG</span> dengan latar transparan (rekomendasi rasio 1:1 atau 4:3).
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Pilih File Dari Komputer
                  </div>
                </div>

                {/* Sample Preset Logos Selection */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Atau Pilih Sample Preset Logo Konstruksi:
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Klik untuk terapkan cepat</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_LOGOS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPresetLogo(preset.url)}
                        disabled={!isSuperAdmin}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition text-left text-xs ${
                          profileForm.logoUrl === preset.url
                            ? 'bg-blue-100/70 border-blue-500 text-blue-900 font-bold shadow-sm'
                            : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-slate-900 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[10px] leading-tight font-medium line-clamp-2">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General Company Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Informasi Umum & Legalitas PT
                </h3>
                <p className="text-xs text-slate-500">
                  Data ini akan ditampilkan di laporan resmi, bukti bayar, faktur, dan kontrak proyek.
                </p>
              </div>

              <button
                type="submit"
                disabled={!isSuperAdmin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Simpan Profil
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Resmi Perusahaan (PT/CV)</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Singkatan / Brand ERP</label>
                <input
                  type="text"
                  value={profileForm.shortName}
                  onChange={(e) => setProfileForm({ ...profileForm, shortName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Slogan / Tagline Usaha</label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Pokok Wajib Pajak (NPWP)</label>
                <input
                  type="text"
                  value={profileForm.npwp}
                  onChange={(e) => setProfileForm({ ...profileForm, npwp: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Induk Berusaha (NIB) / IUJK</label>
                <input
                  type="text"
                  value={profileForm.nib}
                  onChange={(e) => setProfileForm({ ...profileForm, nib: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor Pusat</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Provinsi & Kode Pos</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={profileForm.province}
                    onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Provinsi"
                  />
                  <input
                    type="text"
                    value={profileForm.postalCode}
                    onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="Kode Pos"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Telepon Kantor</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi Perusahaan</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website Resmi</label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Direktur Utama (Penandatangan Dokumen)</label>
                <input
                  type="text"
                  value={profileForm.directorName}
                  onChange={(e) => setProfileForm({ ...profileForm, directorName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Rekening Bank Perusahaan */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Daftar Rekening Bank Perusahaan
                </h3>
                <p className="text-xs text-slate-500">
                  Digunakan sebagai tujuan pembayaran di Sales Order & Invoice Trading / Proyek.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBank(!showAddBank)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> Tambah Rekening
              </button>
            </div>

            {/* Form Add Bank inline */}
            {showAddBank && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Form Tambah Rekening Bank</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Nama Bank</label>
                    <select
                      value={newBank.bankName}
                      onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    >
                      <option value="Bank Mandiri">Bank Mandiri</option>
                      <option value="Bank BCA">Bank BCA</option>
                      <option value="Bank BNI">Bank BNI</option>
                      <option value="Bank BRI">Bank BRI</option>
                      <option value="Bank Syariah Indonesia">Bank Syariah Indonesia (BSI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      placeholder="contoh: 122-00-0988776-5"
                      value={newBank.accountNumber}
                      onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Atas Nama (Owner)</label>
                    <input
                      type="text"
                      value={newBank.accountHolder}
                      onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Cabang / KCU</label>
                    <input
                      type="text"
                      placeholder="contoh: KCP Sudirman"
                      value={newBank.branch}
                      onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Saldo Awal Rekening (Rp)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newBank.initialBalance}
                      onChange={(e) => setNewBank({ ...newBank, initialBalance: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddBank(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBank}
                    className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    Simpan Rekening
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileForm.banks.map((bank) => (
                <div
                  key={bank.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg font-black text-xs">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{bank.bankName}</div>
                      <div className="text-sm font-extrabold text-blue-700 tracking-wider">
                        {bank.accountNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        A/N: {bank.accountHolder} • {bank.branch || 'KCU Utama'}
                      </div>
                    </div>
                  </div>

                  {isSuperAdmin && profileForm.banks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBank(bank.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Hapus Rekening"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: KOP SURAT & TEMPLATE DOKUMEN */}
      {activeTab === 'letterhead' && (
        <form onSubmit={handleSaveLetterhead} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                    Pengaturan Elemen Kop Surat
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atur teks header, garis pemisah, logo badge, dan pesan watermark dokumen.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!isSuperAdmin}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Simpan Kop Surat
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Utama Kop (Nama PT)</label>
                <input
                  type="text"
                  value={letterheadForm.headerTitle}
                  onChange={(e) => setLetterheadForm({ ...letterheadForm, headerTitle: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Judul Klasifikasi Usaha</label>
                <input
                  type="text"
                  value={letterheadForm.headerSubtitle}
                  onChange={(e) => setLetterheadForm({ ...letterheadForm, headerSubtitle: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Baris Alamat Kantor</label>
                <input
                  type="text"
                  value={letterheadForm.addressLine1}
                  onChange={(e) => setLetterheadForm({ ...letterheadForm, addressLine1: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Izin Usaha / IUJK</label>
                <input
                  type="text"
                  value={letterheadForm.addressLine2}
                  onChange={(e) => setLetterheadForm({ ...letterheadForm, addressLine2: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kontak, Email & Website</label>
                <input
                  type="text"
                  value={letterheadForm.contactLine}
                  onChange={(e) => setLetterheadForm({ ...letterheadForm, contactLine: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teks Logo Badge</label>
                  <input
                    type="text"
                    value={letterheadForm.logoText}
                    onChange={(e) => setLetterheadForm({ ...letterheadForm, logoText: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-800 text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prefix Kode Dokumen</label>
                  <input
                    type="text"
                    value={letterheadForm.documentCodePrefix}
                    onChange={(e) => setLetterheadForm({ ...letterheadForm, documentCodePrefix: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={letterheadForm.showLogo}
                    onChange={(e) => setLetterheadForm({ ...letterheadForm, showLogo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Tampilkan Logo Badge di Sebelah Kiri Kop</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={letterheadForm.showDivider}
                    onChange={(e) => setLetterheadForm({ ...letterheadForm, showDivider: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Tampilkan Garis Pemisah (Divider Line) Ganda</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={letterheadForm.showWatermark}
                    onChange={(e) => setLetterheadForm({ ...letterheadForm, showWatermark: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Tampilkan Teks Watermark Latar Belakang</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan kaki / Footer Legal Disclaimer</label>
                <textarea
                  rows={2}
                  value={letterheadForm.footerText}
                  onChange={(e) => setLetterheadForm({ ...letterheadForm, footerText: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-slate-700"
                />
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-6 bg-slate-800 p-6 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-white border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Eye className="w-4 h-4" /> Preview Kop Surat Resmi (A4 Format)
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                  Live Preview
                </span>
              </div>

              {/* Document Sheet Simulation */}
              <div className="bg-white p-6 rounded shadow-xl border border-slate-300 min-h-[460px] flex flex-col justify-between text-slate-900 font-serif relative overflow-hidden select-none">
                {/* Background Watermark */}
                {letterheadForm.showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none transform -rotate-12">
                    <span className="text-3xl font-black uppercase text-slate-900 border-4 border-slate-900 px-6 py-2">
                      {letterheadForm.watermarkText}
                    </span>
                  </div>
                )}

                {/* Kop Surat Header */}
                <div>
                  <div className="flex items-center gap-4 border-b-0 pb-2">
                    {letterheadForm.showLogo && (
                      letterheadForm.logoUrl || profileForm.logoUrl ? (
                        <div className="w-14 h-14 rounded-lg border border-slate-200 p-1 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={letterheadForm.logoUrl || profileForm.logoUrl}
                            alt="Logo Kop"
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xl tracking-tighter shrink-0 shadow">
                          {letterheadForm.logoText}
                        </div>
                      )
                    )}
                    <div className="flex-1 text-center font-sans">
                      <h2 className="font-extrabold text-base tracking-tight text-slate-900 uppercase">
                        {letterheadForm.headerTitle}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                        {letterheadForm.headerSubtitle}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {letterheadForm.addressLine1}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium">
                        {letterheadForm.addressLine2}
                      </p>
                      <p className="text-[9px] text-blue-700 font-semibold mt-0.5">
                        {letterheadForm.contactLine}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  {letterheadForm.showDivider && (
                    <div className="my-2">
                      <div className="h-1 bg-blue-600 w-full mb-0.5"></div>
                      <div className="h-0.5 bg-slate-900 w-full"></div>
                    </div>
                  )}

                  {/* Document Body Sample */}
                  <div className="mt-4 font-sans text-xs space-y-3 leading-relaxed">
                    <div className="text-center font-bold text-slate-900 uppercase underline text-sm tracking-wide">
                      SURAT PERINTAH KERJA (SPK)
                    </div>
                    <div className="text-center text-[10px] font-mono text-slate-500">
                      Nomor: {letterheadForm.documentCodePrefix}/SPK/2026/089
                    </div>

                    <div className="pt-2 text-[11px] text-slate-700">
                      Yang bertanda tangan di bawah ini, Direksi{' '}
                      <span className="font-bold text-slate-900">{letterheadForm.headerTitle}</span> dengan ini
                      memberikan instruksi pelaksanaan pekerjaan proyek konstruksi sesuai standar keselamatan dan spesifikasi teknis terkaji.
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Proyek:</span>
                        <span className="font-bold text-slate-800">Gedung Wisma Utama 12 Lt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nilai Pekerjaan:</span>
                        <span className="font-bold text-blue-700">Rp 1.450.000.000,-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tanggal Efektif:</span>
                        <span className="font-bold text-slate-800">29 Juli 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Block & Footer */}
                <div className="mt-8 font-sans">
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p className="text-slate-500">Penerima Tugas,</p>
                      <div className="h-12"></div>
                      <p className="font-bold text-slate-900 underline">( .................................... )</p>
                      <p className="text-[9px] text-slate-500">Site Manager Proyek</p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-500">Jakarta, 29 Juli 2026</p>
                      <p className="font-semibold text-slate-800">{letterheadForm.headerTitle}</p>
                      <div className="h-12 flex items-center justify-end">
                        <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                          [ E-SIGN VERIFIED ]
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 underline">{profileForm.directorName}</p>
                      <p className="text-[9px] text-slate-500">{profileForm.directorTitle}</p>
                    </div>
                  </div>

                  {/* Footer Disclaimer */}
                  <div className="mt-4 pt-2 border-t border-slate-200 text-[8px] text-slate-400 text-center font-sans">
                    {letterheadForm.footerText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PENANDATANGAN DOKUMEN (PDF) */}
      {activeTab === 'signatories' && (
        <SignatoriesSettings onNotify={triggerNotification} />
      )}

      {/* TAB 4: USER MANAGEMENT & HAK AKSES */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Daftar Pengguna ERP & Hak Akses User
                </h3>
                <p className="text-xs text-slate-500">
                  Super Admin dapat menugaskan role jabatan untuk membatasi akses modul operasional ERP.
                </p>
              </div>

              <button
                onClick={() => handleOpenUserModal()}
                disabled={!isSuperAdmin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Tambah User Baru
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama, Email, atau Divisi..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                <span className="text-slate-500 font-medium">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Semua Role Jabatan ({users.length})</option>
                  {ROLES_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* User Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Pengguna</th>
                    <th className="py-3 px-4">Role / Jabatan</th>
                    <th className="py-3 px-4">Departemen</th>
                    <th className="py-3 px-4">Telepon</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Terakhir Login</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {user.name.substring(0, 2)}
                          </div>
                          <div>
                            <div>{user.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'Super Admin'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : user.role === 'Direktur Utama' || user.role === 'Direktur'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">{user.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{user.phone || '-'}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            user.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          {user.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">{user.lastLogin}</td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isSuperAdmin && users.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
                                  onDeleteUser(user.id);
                                  triggerNotification(`User ${user.name} berhasil dihapus.`);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matrix Hak Akses Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
              Panduan Otorisasi Modul ERP Berdasarkan Role
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg">
                <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" /> Super Admin & Direksi
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Akses penuh ke seluruh modul, persetujuan batas tinggi (PO/RAB/Payroll), audit log, dan pengaturan identitas perusahaan.
                </p>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-700" /> PM & Site Team
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Akses modul Proyek, Estimator, Laporan Harian, Variation Order, Material Out, dan Alat Berat di lapangan.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" /> Finance & Accounting
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Akses Cashflow, Pencairan Kas, Payroll Slip, COA, Jurnal Umum, Laporan Keuangan, dan Verifikasi Invoice Trading.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ATURAN SISTEM & WORKFLOW RULES */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Aturan Operasional Sistem & Batas Approval
                </h3>
                <p className="text-[11px] text-slate-500">
                  Atur ambang batas persetujuan otomatis, mata uang dasar, dan periode tahun buku keuangan.
                </p>
              </div>

              <button
                type="submit"
                disabled={!isSuperAdmin}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Simpan Aturan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Uang Dasar Pembukuan</label>
                <select
                  value={settingsForm.defaultCurrency}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultCurrency: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 bg-white"
                >
                  <option value="IDR (Rupiah)">IDR - Indonesian Rupiah (Rp)</option>
                  <option value="USD (Dollar)">USD - US Dollar ($)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Awal Tahun Buku Keuangan</label>
                <input
                  type="text"
                  value={settingsForm.fiscalYearStart}
                  onChange={(e) => setSettingsForm({ ...settingsForm, fiscalYearStart: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Ambang Batas Pengeluaran Kas / PO Memerlukan Approval Direktur (Rp)
                </label>
                <input
                  type="number"
                  value={settingsForm.autoApprovalThreshold}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoApprovalThreshold: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Pengajuan bernilai di atas Rp {settingsForm.autoApprovalThreshold.toLocaleString('id-ID')} secara otomatis masuk ke antrean Direktur Utama.
                </p>
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.enableEmailAlerts}
                    onChange={(e) => setSettingsForm({ ...settingsForm, enableEmailAlerts: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-800">Aktifkan Notifikasi Email Otomatis</div>
                    <div className="text-[10px] text-slate-500">
                      Kirim email pemberitahuan saat ada pengajuan PO baru atau perubahan status proyek.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.enableAuditLogging}
                    onChange={(e) => setSettingsForm({ ...settingsForm, enableAuditLogging: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <div className="font-bold text-slate-800">Aktifkan Audit Trail Pencatatan Log Security</div>
                    <div className="text-[10px] text-slate-500">
                      Rekam setiap riwayat perubahan data krusial di Firestore secara realtime.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CARD CONFIG NOTIFIKASI EKSTERNAL WHATSAPP & EMAIL DIREKSI */}
          <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-sm">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                    Integrasi Notifikasi Eksternal (WhatsApp & Email Direksi)
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Aktif
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mengirimkan ringkasan pesan peringatan langsung ke nomor WhatsApp atau email Direksi saat ada pengajuan PO bernilai besar yang membutuhkan persetujuan cepat.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> Nomor WhatsApp Direksi / Direktur Utama
                </label>
                <input
                  type="text"
                  defaultValue="6281234567890"
                  placeholder="Format: 62812xxxxxx (tanpa tanda + atau spasi)"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900 bg-emerald-50/30 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Format internasional diawali 62. Contoh: 6281234567890
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" /> Alamat Email Resmi Direksi
                </label>
                <input
                  type="email"
                  defaultValue="direksi@grahamulti.co.id"
                  placeholder="direksi@perusahaan.co.id"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 bg-blue-50/30 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Email tujuan penagihan persetujuan PO bernilai besar.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nama Direktur Utama (Penerima Approval)</label>
                <input
                  type="text"
                  defaultValue="Ir. Hendra Wijaya, MM"
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ambang Batas PO Bernilai Besar (Rp)</label>
                <input
                  type="number"
                  defaultValue={50000000}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-amber-700 bg-amber-50/40"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  PO di atas Rp 50.000.000 akan secara otomatis memberikan opsi Notifikasi Eksternal WhatsApp.
                </p>
              </div>
            </div>

            {/* Test buttons and live message preview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Simulasi & Uji Coba Pengiriman Pesan Peringatan
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = generatePoWhatsappMessage(
                        {
                          poNumber: 'PO/2026/08/009',
                          vendorName: 'PT Semen Tiga Roda Utama',
                          totalAmount: 185000000,
                          requestedBy: 'Tim Purchasing Proyek',
                          itemsCount: 5,
                          notes: 'Mendesak untuk cor pelat lantai 3 Gedung Tower B',
                        },
                        DEFAULT_EXTERNAL_NOTIF_CONFIG
                      );
                      openWhatsappNotification(DEFAULT_EXTERNAL_NOTIF_CONFIG.directorWhatsapp, msg);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Test Kirim WA
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const emailData = generatePoEmailPayload(
                        {
                          poNumber: 'PO/2026/08/009',
                          vendorName: 'PT Semen Tiga Roda Utama',
                          totalAmount: 185000000,
                          requestedBy: 'Tim Purchasing Proyek',
                          itemsCount: 5,
                          notes: 'Mendesak untuk cor pelat lantai 3 Gedung Tower B',
                        },
                        DEFAULT_EXTERNAL_NOTIF_CONFIG
                      );
                      openEmailNotification(
                        DEFAULT_EXTERNAL_NOTIF_CONFIG.directorEmail,
                        emailData.subject,
                        emailData.body
                      );
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Mail className="w-3.5 h-3.5" /> Test Kirim Email
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 whitespace-pre-line leading-relaxed">
                {generatePoWhatsappMessage(
                  {
                    poNumber: 'PO/2026/08/009',
                    vendorName: 'PT Semen Tiga Roda Utama',
                    totalAmount: 185000000,
                    requestedBy: 'Tim Purchasing Proyek',
                    date: new Date().toISOString().slice(0, 10),
                    itemsCount: 5,
                    notes: 'Mendesak untuk kebutuhan pengecoran struktur pelat lantai 3.',
                  },
                  DEFAULT_EXTERNAL_NOTIF_CONFIG
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 5: AUDIT LOGS & BACKUP */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Log Aktivitas & Audit Trail Admin
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan aktivitas perubahan data dan pengaturan sistem ERP secara realtime.
                </p>
              </div>

              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ companyProfile, letterhead, users, systemSettings }));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `Backup_Build_X_Pro_${new Date().toISOString().slice(0,10)}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  triggerNotification('Backup data JSON berhasil diunduh!');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> Download Backup JSON
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Waktu</th>
                    <th className="py-2.5 px-4">Pengguna</th>
                    <th className="py-2.5 px-4">Aktivitas / Perubahan</th>
                    <th className="py-2.5 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.user}</td>
                      <td className="py-3 px-4 text-slate-700">{log.action}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* USER MODAL (ADD / EDIT) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah User Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="contoh: Ir. Ahmad Wijaya"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="ahmad@grahamulti.co.id"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role ERP</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-white"
                  >
                    {ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departemen / Divisi</label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: Teknik & Proyek"
                    value={newUserForm.department}
                    onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full border border-slate-200 rounded-lg p-2 font-medium bg-white"
                  >
                    <option value="Active">Active (Dapat Login)</option>
                    <option value="Inactive">Inactive (Non-Aktif)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
