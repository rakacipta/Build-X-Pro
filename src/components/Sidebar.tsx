import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Calculator,
  Briefcase,
  ShoppingBag,
  Boxes,
  ShoppingCart,
  Truck,
  HardHat,
  Wallet,
  Landmark,
  BookOpenCheck,
  CheckSquare,
  BarChart3,
  ChevronRight,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { ModuleType } from '../types';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (mod: ModuleType) => void;
  pendingApprovalsCount: number;
}

interface NavGroup {
  label: string;
  items: {
    id: ModuleType;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  pendingApprovalsCount,
}) => {
  const navGroups: NavGroup[] = [
    {
      label: 'Ringkasan',
      items: [
        { id: 'dashboard', label: 'KPI Dashboard', icon: LayoutDashboard },
        {
          id: 'approvals',
          label: 'Workflow Approval',
          icon: CheckSquare,
          badge: pendingApprovalsCount,
        },
      ],
    },
    {
      label: 'Marketing & Tender',
      items: [
        { id: 'crm', label: 'CRM & Pipeline', icon: Users },
        { id: 'tender', label: 'Tender & BOQ', icon: FileCheck2 },
      ],
    },
    {
      label: 'Konstruksi & Proyek',
      items: [
        { id: 'estimator', label: 'Estimator (RAB & AHSP)', icon: Calculator },
        { id: 'project', label: 'Project Management', icon: Briefcase },
        { id: 'equipment', label: 'Alat Berat & Fleet', icon: Truck },
      ],
    },
    {
      label: 'Trading & Supply Chain',
      items: [
        { id: 'trading', label: 'Trading Material', icon: ShoppingBag },
        { id: 'inventory', label: 'Inventory & Gudang', icon: Boxes },
        { id: 'purchasing', label: 'Purchasing (PO/PR)', icon: ShoppingCart },
      ],
    },
    {
      label: 'HR & Keuangan',
      items: [
        { id: 'hr_payroll', label: 'HRD & Payroll', icon: HardHat },
        { id: 'finance', label: 'Finance & Cashflow', icon: Wallet },
        { id: 'bank_accounts', label: 'Akun Bank Perusahaan', icon: Landmark },
        { id: 'accounting', label: 'Accounting & COA', icon: BookOpenCheck },
      ],
    },
    {
      label: 'Pelaporan',
      items: [{ id: 'reports', label: 'Laporan Executive', icon: BarChart3 }],
    },
    {
      label: 'Administrasi Sistem',
      items: [
        { id: 'settings', label: 'Pengaturan Super Admin', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-[calc(100vh-61px)] overflow-y-auto no-scrollbar shrink-0 select-none">
      <div className="p-4 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm tracking-tight shadow-md shadow-blue-900/30">
            BX
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-tight uppercase">Build X Pro</h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Module Suite</p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-6 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white text-blue-600'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
