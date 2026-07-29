import React, { useState } from 'react';
import {
  Building2,
  Bell,
  Search,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Clock,
  Sparkles,
  Database,
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  pendingApprovalsCount: number;
  onOpenApprovals: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  companyName?: string;
  companyLogoUrl?: string;
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
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-sm">
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
                Construx ERP
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

          {/* Pending Approvals Notification Bell */}
          <button
            onClick={onOpenApprovals}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Persetujuan Menunggu"
          >
            <Bell className="w-5 h-5" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 bg-blue-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
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
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onRoleChange(role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                      currentRole === role
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>{role}</span>
                    {currentRole === role && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
