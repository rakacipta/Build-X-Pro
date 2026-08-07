import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Bell,
  Search,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  CheckCheck,
  Volume2,
  AlertOctagon,
  TrendingDown,
  ExternalLink,
  MessageSquare,
  LogOut,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import { UserRole, AppNotification, ModuleType, SystemUser } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  openWhatsappNotification,
  generatePoWhatsappMessage,
  DEFAULT_EXTERNAL_NOTIF_CONFIG,
} from '../services/externalNotificationService';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  pendingApprovalsCount: number;
  onOpenApprovals: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  companyName?: string;
  companyLogoUrl?: string;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onNavigateModule?: (module: ModuleType) => void;
  onSendTestReminder?: () => void;
  currentUser?: SystemUser | null;
  onLogout?: () => void;
}

const ROLES: UserRole[] = [
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

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  pendingApprovalsCount,
  onOpenApprovals,
  searchQuery,
  onSearchChange,
  companyName = 'PT GRAHA MULTI KONSTRUKSI',
  companyLogoUrl,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateModule,
  onSendTestReminder,
  currentUser,
  onLogout,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'All' | 'PO' | 'Budget' | 'Unread'>('All');

  const notifRef = useRef<HTMLDivElement | null>(null);
  const roleRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Filter notifications relevant to currentRole or targeted
  const roleNotifs = notifications.filter(
    (n) =>
      !n.targetRoles ||
      n.targetRoles.length === 0 ||
      n.targetRoles.includes(currentRole) ||
      currentRole === 'Super Admin'
  );

  const unreadCount = roleNotifs.filter((n) => !n.isRead).length;

  const filteredNotifs = roleNotifs.filter((n) => {
    if (notifFilter === 'Unread') return !n.isRead;
    if (notifFilter === 'PO') return n.type === 'PO_APPROVAL' || n.type === 'VARIATION_ORDER';
    if (notifFilter === 'Budget') return n.type === 'OVER_BUDGET';
    return true;
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-sm shrink-0">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* Company Identity */}
        <div className="flex items-center gap-3">
          {companyLogoUrl ? (
            <div className="w-10 h-10 rounded-lg border border-slate-200 p-0.5 bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <img src={companyLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm font-black flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                {companyName}
              </h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Build X Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Firestore Sync Active • Realtime Enterprise Platform
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari Proyek, PO, Material, Invoice, Karyawan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Right Actions & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Time & Live Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentTime} WIB</span>
          </div>

          {/* Interactive Notification Bell Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={`relative p-2 rounded-lg transition ${
                unreadCount > 0
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 animate-pulse'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Pusat Notifikasi & Approval Alert"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Center Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                        Notifikasi & Alert Otomatis
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {unreadCount} peringatan belum dibaca untuk role {currentRole}
                      </p>
                    </div>
                  </div>
                  {unreadCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tandai Dibaca</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNotifFilter('All')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        notifFilter === 'All'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setNotifFilter('PO')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        notifFilter === 'PO'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Approval PO
                    </button>
                    <button
                      onClick={() => setNotifFilter('Budget')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        notifFilter === 'Budget'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Over-Budget
                    </button>
                  </div>
                  {onSendTestReminder && (
                    <button
                      onClick={onSendTestReminder}
                      className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md hover:bg-amber-200 font-bold"
                      title="Kirim simulasi alarm ingatkan direksi"
                    >
                      + Demo Alert
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {filteredNotifs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span>Tidak ada notifikasi dalam kategori ini.</span>
                    </div>
                  ) : (
                    filteredNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 transition flex gap-3 ${
                          !n.isRead ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.type === 'PO_APPROVAL' || n.type === 'VARIATION_ORDER' ? (
                            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center">
                              <FileCheck2 className="w-4 h-4" />
                            </div>
                          ) : n.type === 'OVER_BUDGET' ? (
                            <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center animate-pulse">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center">
                              <Bell className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                            {n.message}
                          </p>

                          {n.amount && (
                            <div className="text-[10px] font-mono font-bold text-slate-800">
                              Nilai: {formatRupiah(n.amount)}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 gap-2">
                            <div className="flex items-center gap-1.5">
                              {n.linkModule && onNavigateModule && (
                                <button
                                  onClick={() => {
                                    onNavigateModule(n.linkModule!);
                                    if (onMarkNotificationRead) onMarkNotificationRead(n.id);
                                    setShowNotifDropdown(false);
                                  }}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition"
                                >
                                  <span>Lihat & Proses</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {n.type === 'PO_APPROVAL' && (
                                <button
                                  onClick={() => {
                                    const msg = generatePoWhatsappMessage(
                                      {
                                        poNumber: n.relatedId || 'PO-2026-ALERT',
                                        vendorName: n.title,
                                        totalAmount: n.amount || 50000000,
                                        requestedBy: n.senderName || 'Tim Purchasing',
                                        notes: n.message,
                                      },
                                      DEFAULT_EXTERNAL_NOTIF_CONFIG
                                    );
                                    openWhatsappNotification(
                                      DEFAULT_EXTERNAL_NOTIF_CONFIG.directorWhatsapp,
                                      msg
                                    );
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition flex items-center gap-1"
                                  title="Kirim Pesan Ringkasan Peringatan langsung ke WhatsApp Direksi"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                                  <span>WA Direksi</span>
                                </button>
                              )}
                            </div>

                            {!n.isRead && onMarkNotificationRead && (
                              <button
                                onClick={() => onMarkNotificationRead(n.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                              >
                                Tandai Dibaca
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer link to Approvals */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <button
                    onClick={() => {
                      onOpenApprovals();
                      setShowNotifDropdown(false);
                    }}
                    className="text-xs font-bold text-slate-800 hover:text-blue-600 flex items-center justify-center gap-1.5 w-full"
                  >
                    <span>Buka Pusat Approval Workflow ({pendingApprovalsCount} Menunggu)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Dropdown */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg text-slate-700 transition"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <div className="text-left hidden sm:block">
                <span className="block text-[10px] text-slate-400 leading-none">Role Aktif</span>
                <span className="font-bold text-slate-800">{currentRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Simulasi Akses User Role
                </div>
                {ROLES.map((role) => {
                  const isSuperAdminRole = role === 'Super Admin';
                  const isAuthorizedSuperAdmin = currentUser?.email?.toLowerCase().trim() === 'sr.rcs88@gmail.com';
                  const isLockedRole = isSuperAdminRole && !isAuthorizedSuperAdmin;

                  return (
                    <button
                      key={role}
                      onClick={() => {
                        if (isLockedRole) {
                          alert(
                            'Otorisasi Super Admin dan Pengaturan Sistem dikunci khusus untuk akun resmi: sr.rcs88@gmail.com'
                          );
                          return;
                        }
                        onRoleChange(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        isLockedRole
                          ? 'opacity-60 bg-slate-50 cursor-not-allowed hover:bg-slate-100 text-slate-400'
                          : currentRole === role
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                      title={isLockedRole ? 'Dikunci khusus untuk sr.rcs88@gmail.com' : undefined}
                    >
                      <span className="flex items-center gap-1.5">
                        {role}
                        {isLockedRole && <Lock className="w-3 h-3 text-rose-500" />}
                      </span>
                      {currentRole === role && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Account & Logout Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg text-white transition shadow-sm"
              title="Profil Pengguna & Logout"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {currentUser ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden md:block max-w-[110px] truncate">
                <span className="block text-[10px] text-slate-400 leading-none truncate">
                  {currentUser ? currentUser.email : 'Akun Pengguna'}
                </span>
                <span className="font-bold text-white text-xs truncate block">
                  {currentUser ? currentUser.name : 'User ERP'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                    {currentUser ? currentUser.name.charAt(0) : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {currentUser ? currentUser.name : 'Pengguna ERP'}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser ? currentUser.email : 'user@rakaciptaseraya.co.id'}
                    </p>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                      <span>{currentRole}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 text-[11px]">Departemen:</span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {currentUser?.department || 'Operasional ERP'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 text-[11px]">Akses Modul:</span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[120px]">
                      {currentUser?.email.toLowerCase() === 'novia.rakaciptaseraya@gmail.com'
                        ? 'KPI, HR & Keuangan, Executive'
                        : currentUser?.email.toLowerCase() === 'siska.rakaciptaseraya@gmail.com'
                        ? 'Marketing, Proyek, Supply Chain'
                        : 'Akses Penuh'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50">
                    <span className="text-slate-400 text-[11px]">Status Akun:</span>
                    <span className="font-semibold text-emerald-600 text-[11px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Aktif
                    </span>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition flex items-center justify-between mt-2"
                  >
                    <span>Keluar dari Aplikasi</span>
                    <LogOut className="w-4 h-4 text-rose-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

