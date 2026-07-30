import React, { useState } from 'react';
import {
  HardHat,
  Plus,
  Search,
  DollarSign,
  FileText,
  Printer,
  Calendar,
  CheckCircle,
  User,
  Building,
  Trash2,
  Edit2,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Employee, PayrollSlip, CompanyProfile, LetterheadSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface HrPayrollModuleProps {
  employees: Employee[];
  payrollSlips: PayrollSlip[];
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export const HrPayrollModule: React.FC<HrPayrollModuleProps> = ({
  employees,
  payrollSlips,
  onSaveEmployee,
  onDeleteEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [search, setSearch] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.nik.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingEmp({
      id: 'emp-' + Date.now(),
      nik: `EMP-00${employees.length + 1}`,
      name: '',
      position: '',
      division: 'Teknik',
      status: 'Tetap',
      basicSalary: 8000000,
      allowance: 1500000,
      bankAccount: 'BCA 12345678',
      phone: '0812-3456-7890',
      attendanceDays: 22,
      overtimeHours: 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp && editingEmp.name) {
      onSaveEmployee(editingEmp as Employee);
      setIsModalOpen(false);
      setEditingEmp(null);
    }
  };

  const totalPayrollCost = employees.reduce(
    (acc, e) => acc + e.basicSalary + e.allowance,
    0
  );

  return (
    <div id="hr-payroll-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN HUMAN RESOURCES & DAFTAR REKAPITULASI PAYROLL"
        subtitle="Data Master Karyawan, Kehadiran Proyek, Rincian Komponen Gaji & Tunjangan"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Modul Human Resources & Payroll
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen karyawan proyek/kantor, absensi, kalkulasi PPh21 & BPJS, serta penerbitan Slip Gaji.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CetakPdfButton
            elementId="hr-payroll-module"
            filename="Laporan_HR_Payroll_Build_X_Pro.pdf"
            title="Laporan HR & Rekapitulasi Payroll"
            variant="emerald"
          />

          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'employees'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Karyawan
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'payroll'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slip Gaji & Payroll
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow transition"
          >
            <Plus className="w-4 h-4" /> Karyawan Baru
          </button>
        </div>
      </div>

      {activeTab === 'employees' ? (
        <div className="space-y-6">
          {/* KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Karyawan Aktif</span>
              <p className="text-xl font-black text-slate-900 mt-1">{employees.length} Orang</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Rata-rata Kehadiran</span>
              <p className="text-xl font-black text-emerald-600 mt-1">21.8 Hari/Bulan (98%)</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Alokasi Payroll</span>
              <p className="text-xl font-black text-amber-600 mt-1">{formatRupiah(totalPayrollCost)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIK, Nama, Jabatan..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">NIK</th>
                    <th className="p-3.5">Nama Lengkap</th>
                    <th className="p-3.5">Jabatan / Divisi</th>
                    <th className="p-3.5">Status Kerja</th>
                    <th className="p-3.5 text-right">Gaji Pokok (Rp)</th>
                    <th className="p-3.5 text-right">Tunjangan (Rp)</th>
                    <th className="p-3.5 text-center">Kehadiran</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-amber-600">{emp.nik}</td>
                      <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{emp.position}</div>
                        <div className="text-[10px] text-slate-400">{emp.division}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-800">
                        {formatRupiah(emp.basicSalary)}
                      </td>
                      <td className="p-3.5 text-right text-emerald-600 font-semibold">
                        {formatRupiah(emp.allowance)}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800">
                        {emp.attendanceDays} Hari
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingEmp(emp);
                            setIsModalOpen(true);
                          }}
                          className="text-amber-600 hover:text-amber-700 font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Payroll & Slip View */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Daftar Slip Gaji Karyawan (Juli 2026)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollSlips.map((slip) => (
              <div
                key={slip.id}
                className="p-5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{slip.employeeName}</h4>
                    <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-100 px-2 py-0.5 rounded">
                      Periode: {slip.period}
                    </span>
                  </div>
                  <span className="text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                    {slip.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Gaji Pokok:</span>
                    <span>{formatRupiah(slip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tunjangan Operasional:</span>
                    <span>{formatRupiah(slip.allowance)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Upah Lembur:</span>
                    <span>{formatRupiah(slip.overtimePay)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Potongan BPJS & PPh21:</span>
                    <span>-{formatRupiah(slip.bpjsDeduction + slip.taxPph21)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-300">
                    <span>Gaji Bersih (THP):</span>
                    <span className="text-emerald-600">{formatRupiah(slip.netSalary)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSlip(slip)}
                  className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Cetak Slip Gaji Resmi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slip Gaji Modal Printable */}
      {selectedSlip && (() => {
        const matchedEmp = employees.find(
          (e) => e.id === selectedSlip.employeeId || e.name === selectedSlip.employeeName
        );
        const totalEarnings = selectedSlip.basicSalary + selectedSlip.allowance + selectedSlip.overtimePay;
        const totalDeductions = selectedSlip.bpjsDeduction + selectedSlip.taxPph21;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 text-slate-900 overflow-hidden">
              {/* Modal Header Actions (Sticky at Top) */}
              <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between gap-3 z-20 print:hidden shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Printer className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Pratinjau Slip Gaji Resmi: {selectedSlip.employeeName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Periode {selectedSlip.period} • Format Cetak Modern Perusahaan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSlip(null)}
                    className="px-3.5 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                  >
                    Tutup
                  </button>
                  <CetakPdfButton
                    elementId="slip-gaji-printable-document"
                    filename={`Slip_Gaji_${selectedSlip.employeeName.replace(/\s+/g, '_')}_${selectedSlip.period.replace(/\s+/g, '_')}.pdf`}
                    title={`Slip Gaji Resmi ${selectedSlip.employeeName}`}
                    variant="emerald"
                    label="Cetak / Unduh PDF"
                  />
                </div>
              </div>

              {/* Scrollable Document Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100/60">
                <div id="slip-gaji-printable-document" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6 shadow-sm relative">
                  {/* Top Gradient Stripe */}
                  <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 rounded-t"></div>

                  {/* Header Kop Perusahaan */}
                  {(() => {
                    const profile = getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE);
                    const letterhead = getStoredData<LetterheadSettings>('letterhead', INITIAL_LETTERHEAD);
                    const title = letterhead.headerTitle || profile.name;
                    const subtitle = letterhead.headerSubtitle || profile.tagline;
                    const address = letterhead.addressLine1 || profile.address;
                    const contact = letterhead.contactLine || `Telp: ${profile.phone} | Email: ${profile.email}`;
                    const logoUrl = letterhead.logoUrl || profile.logoUrl;
                    const logoText = letterhead.logoText || profile.shortName || 'BX';
                    const logoBgColor = letterhead.logoBgColor || '#10b981';

                    return (
                      <div className="border-b-2 border-slate-900 pb-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            {letterhead.showLogo !== false && (
                              logoUrl ? (
                                <img
                                  src={logoUrl}
                                  alt="Logo"
                                  className="w-12 h-12 object-contain rounded-xl"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 text-white font-black flex items-center justify-center text-xl rounded-xl shadow-md"
                                  style={{ backgroundColor: logoBgColor }}
                                >
                                  {logoText}
                                </div>
                              )
                            )}
                            <div>
                              <h2 className="text-base font-black text-slate-900 tracking-wider uppercase">
                                {title}
                              </h2>
                              {subtitle && (
                                <p className="text-xs font-bold text-emerald-700">{subtitle}</p>
                              )}
                              <p className="text-[10px] text-slate-500 mt-0.5">{address}</p>
                              <p className="text-[10px] text-slate-400">{contact}</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg shadow-xs uppercase tracking-wider">
                              CONFIDENTIAL PAYSLIP
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                              REF: SLIP/{selectedSlip.period}/{selectedSlip.employeeId.slice(0, 5).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Document Title Banner */}
                  <div className="text-center bg-slate-900 text-white py-3 px-4 rounded-xl shadow-xs flex items-center justify-between">
                    <div className="text-left">
                      <h1 className="text-sm font-black uppercase tracking-wider text-amber-400">
                        SLIP GAJI KARYAWAN
                      </h1>
                      <p className="text-[11px] text-slate-300">
                        PERIODE PEMBAYARAN: <strong className="text-white">{selectedSlip.period}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" /> {selectedSlip.status} / LUNAS
                      </span>
                    </div>
                  </div>

                  {/* Employee Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <p className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500 font-medium">Nama Karyawan:</span>
                        <strong className="text-slate-900 font-black">{selectedSlip.employeeName}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">NIK Karyawan:</span>
                        <span className="font-mono font-bold text-slate-800">{matchedEmp?.nik || 'NIK-2026-0812'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">Jabatan / Posisi:</span>
                        <span className="font-semibold text-slate-800">{matchedEmp?.position || 'Staf Senior'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <p className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500 font-medium">Divisi / Unit:</span>
                        <span className="font-bold text-slate-800">{matchedEmp?.division || 'Teknik'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">Status Pekerja:</span>
                        <span className="font-semibold text-slate-800">{matchedEmp?.status || 'Tetap'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">Rekening Tujuan:</span>
                        <span className="font-mono font-bold text-slate-800">{matchedEmp?.bankAccount || 'BCA 12345678'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Earnings & Deductions Tables Split */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Earnings Card */}
                    <div className="border border-emerald-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-emerald-700 text-white p-2.5 font-extrabold text-[11px] uppercase tracking-wider flex justify-between items-center">
                        <span>A. PENERIMAAN (EARNINGS)</span>
                        <Award className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div className="p-3 space-y-2 divide-y divide-slate-100 text-slate-700">
                        <div className="flex justify-between pt-1">
                          <span>Gaji Pokok (Basic)</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedSlip.basicSalary)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span>Tunjangan Jabatan & Ops</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedSlip.allowance)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span>Uang Lembur (Overtime)</span>
                          <span className="font-mono font-bold text-slate-900">{formatRupiah(selectedSlip.overtimePay)}</span>
                        </div>
                      </div>
                      <div className="bg-emerald-50 border-t border-emerald-200 p-2.5 font-bold flex justify-between text-emerald-900">
                        <span>TOTAL PENERIMAAN BRUTO:</span>
                        <span className="font-mono">{formatRupiah(totalEarnings)}</span>
                      </div>
                    </div>

                    {/* Deductions Card */}
                    <div className="border border-rose-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-slate-900 text-white p-2.5 font-extrabold text-[11px] uppercase tracking-wider flex justify-between items-center">
                        <span>B. POTONGAN (DEDUCTIONS)</span>
                        <span className="text-[10px] text-rose-300 font-mono">TAX & BPJS</span>
                      </div>
                      <div className="p-3 space-y-2 divide-y divide-slate-100 text-slate-700">
                        <div className="flex justify-between pt-1">
                          <span>Iuran BPJS Ketenagakerjaan</span>
                          <span className="font-mono font-bold text-rose-600">-{formatRupiah(selectedSlip.bpjsDeduction)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span>Pajak Penghasilan (PPh 21)</span>
                          <span className="font-mono font-bold text-rose-600">-{formatRupiah(selectedSlip.taxPph21)}</span>
                        </div>
                      </div>
                      <div className="bg-rose-50 border-t border-rose-200 p-2.5 font-bold flex justify-between text-rose-900 mt-auto">
                        <span>TOTAL POTONGAN:</span>
                        <span className="font-mono">-{formatRupiah(totalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Take Home Pay Highlighting Banner */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase block">
                        TAKE HOME PAY (GAJI BERSIH DITERIMA)
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Ditransfer ke rekening <span className="text-white font-bold">{matchedEmp?.bankAccount || 'BCA 12345678'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-amber-400 tracking-tight block">
                        {formatRupiah(selectedSlip.netSalary)}
                      </span>
                    </div>
                  </div>

                  {/* Footer & Signatures */}
                  <div className="pt-4 border-t border-slate-200 space-y-6">
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="space-y-10">
                        <p className="font-semibold text-slate-500">Disiapkan Oleh (HRD/Payroll):</p>
                        <div>
                          <p className="font-bold text-slate-900 underline">Dewi Anggraini, S.Psi.</p>
                          <p className="text-[9px] text-slate-400">HR & Payroll Officer</p>
                        </div>
                      </div>

                      <div className="space-y-10">
                        <p className="font-semibold text-slate-500">Disetujui Oleh (Finance):</p>
                        <div>
                          <p className="font-bold text-slate-900 underline">Budi Santoso, S.T.</p>
                          <p className="text-[9px] text-slate-400">Finance & Operations Director</p>
                        </div>
                      </div>

                      <div className="space-y-10">
                        <p className="font-semibold text-slate-500">Penerima Gaji:</p>
                        <div>
                          <p className="font-bold text-slate-900 underline">{selectedSlip.employeeName}</p>
                          <p className="text-[9px] text-slate-400">Karyawan Bersangkutan</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-500 text-center flex items-center justify-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>
                        Dokumen ini diterbitkan secara otomatis oleh sistem BUILD X PRO {getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE).name} dan sah secara elektronik.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Add Employee */}
      {isModalOpen && editingEmp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {editingEmp.id ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.nik || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, nik: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.name || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.position || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, position: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Divisi</label>
                  <select
                    value={editingEmp.division || 'Teknik'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, division: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="Teknik">Teknik</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="HRD">HRD</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Logistik">Logistik</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={editingEmp.basicSalary || 0}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, basicSalary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunjangan (Rp)</label>
                  <input
                    type="number"
                    value={editingEmp.allowance || 0}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, allowance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
