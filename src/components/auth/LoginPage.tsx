import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Users,
} from 'lucide-react';
import { SystemUser, CompanyProfile, UserRole, ModuleType } from '../../types';

interface LoginPageProps {
  systemUsers: SystemUser[];
  companyProfile: CompanyProfile;
  onLoginSuccess: (user: SystemUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  systemUsers,
  companyProfile,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by email or name
      const matchedUser = systemUsers.find(
        (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (matchedUser) {
        setIsLoading(false);
        // Ensure Novia & Siska have allowedModules attached if matched
        const cleanEmail = matchedUser.email.toLowerCase().trim();
        if (cleanEmail === 'novia.rakaciptaseraya@gmail.com' && !matchedUser.allowedModules) {
          matchedUser.allowedModules = [
            'dashboard',
            'hr_payroll',
            'finance',
            'invoicing',
            'bank_accounts',
            'accounting',
            'reports',
          ];
        } else if (cleanEmail === 'siska.rakaciptaseraya@gmail.com' && !matchedUser.allowedModules) {
          matchedUser.allowedModules = [
            'crm',
            'tender',
            'estimator',
            'project',
            'equipment',
            'trading',
            'inventory',
            'purchasing',
          ];
        }
        onLoginSuccess(matchedUser);
      } else {
        // Fallback: create dynamic user for testing if email is custom
        if (email.includes('@')) {
          const cleanInputEmail = email.toLowerCase().trim();
          const isTargetSuperAdmin = cleanInputEmail === 'sr.rcs88@gmail.com';
          const isNovia = cleanInputEmail === 'novia.rakaciptaseraya@gmail.com';
          const isSiska = cleanInputEmail === 'siska.rakaciptaseraya@gmail.com';
          const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').toUpperCase();
          
          let role: UserRole = 'Project Manager';
          let department = 'Operasional ERP';
          let name = username || 'PENGGUNA ERP';
          let allowedModules: ModuleType[] | undefined = undefined;

          if (isNovia) {
            name = 'Novia (HR & Keuangan)';
            role = 'Finance';
            department = 'HRD & Keuangan';
            allowedModules = ['dashboard', 'hr_payroll', 'finance', 'invoicing', 'bank_accounts', 'accounting', 'reports'];
          } else if (isSiska) {
            name = 'Siska (Marketing & Operations)';
            role = 'Project Manager';
            department = 'Marketing & Konstruksi ERP';
            allowedModules = ['crm', 'tender', 'estimator', 'project', 'equipment', 'trading', 'inventory', 'purchasing'];
          } else if (isTargetSuperAdmin) {
            name = 'Super Admin (RCS)';
            role = 'Super Admin';
            department = 'Direksi & Super Admin';
          }

          const dynamicUser: SystemUser = {
            id: 'usr-custom-' + Date.now(),
            name,
            email: email.trim(),
            role,
            department,
            phone: '0812-0000-1111',
            status: 'Active',
            lastLogin: 'Baru saja',
            allowedModules,
          };
          setIsLoading(false);
          onLoginSuccess(dynamicUser);
        } else {
          setIsLoading(false);
          setErrorMessage('Email tidak terdaftar dalam database pengguna sistem.');
        }
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {companyProfile.logoUrl ? (
            <img
              src={companyProfile.logoUrl}
              alt="Logo Perusahaan"
              className="w-10 h-10 object-contain rounded-lg border border-slate-700 bg-slate-900 p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/30">
              RCS
            </div>
          )}
          <div>
            <h1 className="font-bold text-base text-white tracking-wide">
              {companyProfile.name || 'PT RAKA CIPTA SERAYA'}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Build X Pro ERP Enterprise System v2.5
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firestore Sync Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>SSL 256-Bit Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl">
          {/* Left Side: System Info & Features (Visible on Large Screens) */}
          <div className="lg:col-span-5 p-6 lg:p-7 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Sistem Manajemen Kontraktor</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  Sistem ERP <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    Konstruksi & Proyek
                  </span>
                </h2>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Platform manajemen terpadu RAB, Tender, Purchasing, Gudang, SPK & Keuangan.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Multi-Role & Otorisasi
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Akses Direksi, PM, Finance, Purchasing, Estimator & Logistik.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Database Real-time
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Data otomatis tersimpan & terhubung ke Firebase Cloud Store.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Cetak PDF & E-Signature
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Dokumen PO, SPK Borongan & Laporan Keuangan resmi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quote / Company Tagline */}
            <div className="pt-4 border-t border-slate-800/80 mt-6">
              <p className="text-[10px] text-slate-400 italic">
                "{companyProfile.tagline || 'General Contractor & Infrastructure Specialist'}"
              </p>
              <div className="mt-1 text-[9px] text-slate-500 font-mono">
                &copy; {new Date().getFullYear()} {companyProfile.name || 'PT RAKA CIPTA SERAYA'}.
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-center bg-slate-900/60">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Masuk ke Akun Anda</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Masukkan email dan kata sandi akun ERP Anda.
                </p>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Alamat Email / ID Pengguna
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan alamat email anda..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        'Untuk menyetel ulang kata sandi, silakan hubungi Tim Admin IT melalui Pengaturan Pengguna.'
                      )
                    }
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Ingat saya di perangkat ini</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi Akses ERP...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard ERP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 text-center text-[11px] text-slate-500 font-mono">
        Build X Pro ERP Enterprise Platform • PT RAKA CIPTA SERAYA • Hak Cipta Dilindungi
      </footer>
    </div>
  );
};
