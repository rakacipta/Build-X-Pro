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
  RefreshCw,
  X,
  AlertCircle,
  Users,
  Briefcase,
  Phone,
  Check,
  Clock,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Filter,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Employee,
  PayrollSlip,
  AttendanceRecord,
  OvertimeRecord,
  CompanyProfile,
  LetterheadSettings,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface HrPayrollModuleProps {
  employees: Employee[];
  payrollSlips: PayrollSlip[];
  attendanceRecords?: AttendanceRecord[];
  overtimeRecords?: OvertimeRecord[];
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSavePayroll?: (slip: PayrollSlip) => void;
  onDeletePayroll?: (id: string) => void;
  onSaveAttendance?: (att: AttendanceRecord) => void;
  onDeleteAttendance?: (id: string) => void;
  onSaveOvertime?: (ovt: OvertimeRecord) => void;
  onDeleteOvertime?: (id: string) => void;
}

export const HrPayrollModule: React.FC<HrPayrollModuleProps> = ({
  employees,
  payrollSlips,
  attendanceRecords = [],
  overtimeRecords = [],
  onSaveEmployee,
  onDeleteEmployee,
  onSavePayroll,
  onDeletePayroll,
  onSaveAttendance,
  onDeleteAttendance,
  onSaveOvertime,
  onDeleteOvertime,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'overtime' | 'payroll'>('employees');
  const [search, setSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Juli 2026');
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  // Filters for Attendance & Overtime
  const [attStatusFilter, setAttStatusFilter] = useState<string>('ALL');
  const [ovtStatusFilter, setOvtStatusFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('2026-07-30');

  // Modals state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);

  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<Partial<PayrollSlip> | null>(null);

  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [editingAtt, setEditingAtt] = useState<Partial<AttendanceRecord> | null>(null);

  const [isOvtModalOpen, setIsOvtModalOpen] = useState(false);
  const [editingOvt, setEditingOvt] = useState<Partial<OvertimeRecord> | null>(null);

  // --- FILTERED DATA ---
  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.nik.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()) ||
      e.division.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAttendance = attendanceRecords.filter((a) => {
    const matchesSearch =
      a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      (a.notes || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = attStatusFilter === 'ALL' || a.status === attStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOvertime = overtimeRecords.filter((o) => {
    const matchesSearch =
      o.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      o.reason.toLowerCase().includes(search.toLowerCase()) ||
      o.projectOrTask.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = ovtStatusFilter === 'ALL' || o.status === ovtStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const periodSlips = payrollSlips.filter((s) => s.period === selectedPeriod);
  const filteredSlips = periodSlips.filter(
    (s) =>
      s.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase())
  );

  // --- HELPER CALCULATIONS ---
  // Helper to calculate total overtime hours approved for an employee
  const getApprovedOvertimeHours = (employeeId: string) => {
    return overtimeRecords
      .filter((o) => o.employeeId === employeeId && o.status === 'Approved')
      .reduce((sum, o) => sum + o.hours, 0);
  };

  // Helper to calculate overtime pay for an employee (standard 1/173 x basic salary x overtime hours)
  const calculateOvertimePay = (basicSalary: number, overtimeHours: number) => {
    const hourlyRate = basicSalary / 173;
    return Math.round(overtimeHours * hourlyRate * 1.5);
  };

  // Helper to calculate a slip from employee master + attendance & overtime data
  const calculateSlipFromEmp = (emp: Employee, period: string, existing?: PayrollSlip): PayrollSlip => {
    // Total approved overtime hours from records or master
    const totalOvtHours = getApprovedOvertimeHours(emp.id) || emp.overtimeHours || 0;
    const overtimePay = calculateOvertimePay(emp.basicSalary, totalOvtHours);

    const bpjsDeduction =
      existing && existing.bpjsDeduction !== undefined
        ? existing.bpjsDeduction
        : Math.round(emp.basicSalary * 0.04);

    const taxPph21 =
      existing && existing.taxPph21 !== undefined
        ? existing.taxPph21
        : Math.round((emp.basicSalary + emp.allowance) * 0.05);

    const netSalary = emp.basicSalary + emp.allowance + overtimePay - bpjsDeduction - taxPph21;

    return {
      id: existing ? existing.id : `pay-${emp.id}-${period.replace(/\s+/g, '')}`,
      employeeId: emp.id,
      employeeName: emp.name,
      period: period,
      basicSalary: emp.basicSalary,
      allowance: emp.allowance,
      overtimePay: overtimePay,
      bpjsDeduction: bpjsDeduction,
      taxPph21: taxPph21,
      netSalary: netSalary,
      status: existing ? existing.status : 'Approved',
    };
  };

  // Sync Check: employees missing slip
  const employeesWithoutSlip = employees.filter(
    (emp) => !periodSlips.some((s) => s.employeeId === emp.id || s.employeeName === emp.name)
  );

  // Handler for bulk sync payroll
  const handleBulkSyncPayroll = () => {
    if (!onSavePayroll) return;
    let syncedCount = 0;

    employees.forEach((emp) => {
      const existing = periodSlips.find((s) => s.employeeId === emp.id || s.employeeName === emp.name);
      const newSlip = calculateSlipFromEmp(emp, selectedPeriod, existing);
      onSavePayroll(newSlip);
      syncedCount++;
    });

    alert(`Berhasil menyinkronkan ${syncedCount} Slip Gaji karyawan (termasuk Absensi & Lembur) untuk periode ${selectedPeriod}!`);
  };

  // Sync attendance days & overtime hours to master employees
  const handleSyncAttendanceToMaster = () => {
    let syncedCount = 0;
    employees.forEach((emp) => {
      const hadirCount = attendanceRecords.filter(
        (a) => (a.employeeId === emp.id || a.employeeName === emp.name) && a.status === 'Hadir'
      ).length;

      const ovtHours = overtimeRecords
        .filter((o) => (o.employeeId === emp.id || o.employeeName === emp.name) && o.status === 'Approved')
        .reduce((sum, o) => sum + o.hours, 0);

      const updatedEmp: Employee = {
        ...emp,
        attendanceDays: hadirCount > 0 ? hadirCount : (emp.attendanceDays || 22),
        overtimeHours: ovtHours,
      };

      onSaveEmployee(updatedEmp);

      if (onSavePayroll) {
        const existing = periodSlips.find((s) => s.employeeId === emp.id || s.employeeName === emp.name);
        const overtimePay = calculateOvertimePay(emp.basicSalary, updatedEmp.overtimeHours);
        if (existing) {
          const netSalary = emp.basicSalary + emp.allowance + overtimePay - existing.bpjsDeduction - existing.taxPph21;
          onSavePayroll({
            ...existing,
            overtimePay,
            netSalary,
          });
        } else {
          const newSlip = calculateSlipFromEmp(updatedEmp, selectedPeriod);
          onSavePayroll(newSlip);
        }
      }
      syncedCount++;
    });

    alert(
      `Berhasil menyinkronkan data ${syncedCount} Karyawan!\n\n` +
      `- Rekapitulasi Kehadiran (Hari Hadir)\n` +
      `- Rekapitulasi Jam Lembur (Status Approved)\n` +
      `- Perhitungan Komponen Uang Lembur & Gaji Bersih Slip (${selectedPeriod})\n\n` +
      `Data Master Karyawan dan Payroll kini telah 100% selaras dengan Log Absensi & Lembur.`
    );
  };

  // --- HANDLERS FOR EMPLOYEE MODAL ---
  const handleOpenAddEmp = () => {
    setEditingEmp({
      id: 'emp-' + Date.now(),
      nik: `EMP-00${employees.length + 1}`,
      name: '',
      position: '',
      division: 'Teknik',
      status: 'Tetap',
      basicSalary: 8000000,
      allowance: 1500000,
      bankAccount: 'BCA 1234567890',
      phone: '0812-3456-7890',
      attendanceDays: 22,
      overtimeHours: 0,
    });
    setIsEmpModalOpen(true);
  };

  const handleSaveEmpForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp && editingEmp.name && editingEmp.nik) {
      const savedEmp = editingEmp as Employee;
      onSaveEmployee(savedEmp);

      if (onSavePayroll) {
        const existing = periodSlips.find(
          (s) => s.employeeId === savedEmp.id || s.employeeName === savedEmp.name
        );
        const slip = calculateSlipFromEmp(savedEmp, selectedPeriod, existing);
        onSavePayroll(slip);
      }

      setIsEmpModalOpen(false);
      setEditingEmp(null);
    } else {
      alert('Mohon isi NIK dan Nama Lengkap Karyawan.');
    }
  };

  // --- HANDLERS FOR ATTENDANCE MODAL ---
  const handleOpenAddAttendance = () => {
    const firstEmp = employees[0];
    setEditingAtt({
      id: 'att-' + Date.now(),
      employeeId: firstEmp ? firstEmp.id : '',
      employeeName: firstEmp ? firstEmp.name : '',
      date: selectedDateFilter || new Date().toISOString().split('T')[0],
      checkIn: '08:00',
      checkOut: '17:00',
      status: 'Hadir',
      location: 'Kantor Pusat / Site Proyek',
      notes: 'Presensi Kehadiran',
    });
    setIsAttModalOpen(true);
  };

  const handleSaveAttendanceForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveAttendance) return;

    if (editingAtt && editingAtt.employeeId && editingAtt.date) {
      const matchedEmp = employees.find((emp) => emp.id === editingAtt.employeeId);
      const recordToSave: AttendanceRecord = {
        ...(editingAtt as AttendanceRecord),
        employeeName: matchedEmp ? matchedEmp.name : editingAtt.employeeName || 'Karyawan',
      };

      onSaveAttendance(recordToSave);

      // Auto update employee attendanceDays
      if (matchedEmp) {
        const otherAttRecords = attendanceRecords.filter(
          (a) => a.id !== recordToSave.id && (a.employeeId === matchedEmp.id || a.employeeName === matchedEmp.name) && a.status === 'Hadir'
        );
        const newHadirCount = otherAttRecords.length + (recordToSave.status === 'Hadir' ? 1 : 0);

        onSaveEmployee({
          ...matchedEmp,
          attendanceDays: newHadirCount > 0 ? newHadirCount : matchedEmp.attendanceDays,
        });
      }

      setIsAttModalOpen(false);
      setEditingAtt(null);
    } else {
      alert('Pilih Karyawan dan Tanggal Presensi.');
    }
  };

  // Batch attendance helper: Mark all employees present for selectedDateFilter
  const handleBatchMarkPresent = () => {
    if (!onSaveAttendance) return;
    let addedCount = 0;

    employees.forEach((emp) => {
      const exists = attendanceRecords.some(
        (a) => (a.employeeId === emp.id || a.employeeName === emp.name) && a.date === selectedDateFilter
      );

      if (!exists) {
        onSaveAttendance({
          id: `att-${emp.id}-${selectedDateFilter}`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: selectedDateFilter,
          checkIn: '08:00',
          checkOut: '17:00',
          status: 'Hadir',
          location: 'Proyek / Kantor',
          notes: 'Absensi Batch Otomatis',
        });

        const currentHadir = attendanceRecords.filter(
          (a) => (a.employeeId === emp.id || a.employeeName === emp.name) && a.status === 'Hadir'
        ).length;

        onSaveEmployee({
          ...emp,
          attendanceDays: currentHadir + 1,
        });

        addedCount++;
      }
    });

    alert(`Berhasil menandai presensi HADIR untuk ${addedCount} karyawan pada tanggal ${selectedDateFilter}! Data master karyawan telah tersinkronkan.`);
  };

  // --- HANDLERS FOR OVERTIME MODAL ---
  const handleOpenAddOvertime = () => {
    const firstEmp = employees[0];
    setEditingOvt({
      id: 'ovt-' + Date.now(),
      employeeId: firstEmp ? firstEmp.id : '',
      employeeName: firstEmp ? firstEmp.name : '',
      date: new Date().toISOString().split('T')[0],
      startTime: '17:00',
      endTime: '20:00',
      hours: 3,
      reason: 'Pekerjaan Lembur Proyek / Pengecoran / Laporan',
      projectOrTask: 'PRJ-2026-001 (Wisma Utama)',
      status: 'Pending',
    });
    setIsOvtModalOpen(true);
  };

  const handleSaveOvertimeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveOvertime) return;

    if (editingOvt && editingOvt.employeeId && editingOvt.reason) {
      const matchedEmp = employees.find((emp) => emp.id === editingOvt.employeeId);

      // Compute hours automatically if times are provided
      let calcHours = editingOvt.hours || 0;
      if (editingOvt.startTime && editingOvt.endTime) {
        const [startH, startM] = editingOvt.startTime.split(':').map(Number);
        const [endH, endM] = editingOvt.endTime.split(':').map(Number);
        const diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff > 0) {
          calcHours = Math.round((diff / 60) * 10) / 10;
        }
      }

      const ovtToSave: OvertimeRecord = {
        ...(editingOvt as OvertimeRecord),
        employeeName: matchedEmp ? matchedEmp.name : editingOvt.employeeName || 'Karyawan',
        hours: calcHours > 0 ? calcHours : 2,
      };

      onSaveOvertime(ovtToSave);
      setIsOvtModalOpen(false);
      setEditingOvt(null);
    } else {
      alert('Mohon pilih karyawan dan isi alasan lembur.');
    }
  };

  // Approve / Reject Overtime Handler
  const handleSetOvertimeStatus = (ovt: OvertimeRecord, newStatus: 'Approved' | 'Rejected') => {
    if (!onSaveOvertime) return;

    const updatedOvt: OvertimeRecord = {
      ...ovt,
      status: newStatus,
      approvedBy: newStatus === 'Approved' ? 'Manager HRD / Site Manager' : undefined,
    };

    onSaveOvertime(updatedOvt);

    // Sync overtime hours and pay to employee master and payroll slip
    const matchedEmp = employees.find((emp) => emp.id === ovt.employeeId || emp.name === ovt.employeeName);
    if (matchedEmp) {
      const otherApproved = overtimeRecords.filter(
        (o) => o.id !== ovt.id && (o.employeeId === matchedEmp.id || o.employeeName === matchedEmp.name) && o.status === 'Approved'
      );
      const newTotalOvtHours = otherApproved.reduce((sum, o) => sum + o.hours, 0) + (newStatus === 'Approved' ? ovt.hours : 0);

      onSaveEmployee({
        ...matchedEmp,
        overtimeHours: newTotalOvtHours,
      });

      if (onSavePayroll) {
        const existingSlip = periodSlips.find(
          (s) => s.employeeId === matchedEmp.id || s.employeeName === matchedEmp.name
        );
        if (existingSlip) {
          const overtimePay = calculateOvertimePay(matchedEmp.basicSalary, newTotalOvtHours);
          const netSalary =
            existingSlip.basicSalary +
            existingSlip.allowance +
            overtimePay -
            existingSlip.bpjsDeduction -
            existingSlip.taxPph21;

          onSavePayroll({
            ...existingSlip,
            overtimePay,
            netSalary,
          });
        }
      }
    }
  };

  // --- SLIP FORM MODAL HANDLER ---
  const handleOpenEditSlip = (slip: PayrollSlip) => {
    setEditingSlip({ ...slip });
    setIsSlipModalOpen(true);
  };

  const handleSaveSlipForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlip && editingSlip.employeeName && onSavePayroll) {
      const basicSalary = editingSlip.basicSalary || 0;
      const allowance = editingSlip.allowance || 0;
      const overtimePay = editingSlip.overtimePay || 0;
      const bpjsDeduction = editingSlip.bpjsDeduction || 0;
      const taxPph21 = editingSlip.taxPph21 || 0;
      const netSalary = basicSalary + allowance + overtimePay - bpjsDeduction - taxPph21;

      const finalSlip: PayrollSlip = {
        ...(editingSlip as PayrollSlip),
        netSalary,
      };

      onSavePayroll(finalSlip);
      setIsSlipModalOpen(false);
      setEditingSlip(null);
    }
  };

  // --- KPI CALCULATIONS ---
  const totalPayrollCost = employees.reduce((acc, e) => acc + e.basicSalary + e.allowance, 0);

  const totalAttHadir = attendanceRecords.filter((a) => a.status === 'Hadir').length;
  const totalAttIzin = attendanceRecords.filter((a) => a.status === 'Izin' || a.status === 'Sakit' || a.status === 'Cuti').length;
  const totalAttAlpha = attendanceRecords.filter((a) => a.status === 'Alpha').length;

  const totalOvtHoursApproved = overtimeRecords
    .filter((o) => o.status === 'Approved')
    .reduce((sum, o) => sum + o.hours, 0);

  const totalOvtPendingCount = overtimeRecords.filter((o) => o.status === 'Pending').length;

  const totalPeriodBasicSalary = periodSlips.reduce((acc, s) => acc + s.basicSalary, 0);
  const totalPeriodAllowance = periodSlips.reduce((acc, s) => acc + s.allowance, 0);
  const totalPeriodOvertime = periodSlips.reduce((acc, s) => acc + s.overtimePay, 0);
  const totalPeriodDeductions = periodSlips.reduce((acc, s) => acc + s.bpjsDeduction + s.taxPph21, 0);
  const totalPeriodNetSalary = periodSlips.reduce((acc, s) => acc + s.netSalary, 0);

  return (
    <div id="hr-payroll-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN HUMAN RESOURCES, PRESENSI KEHADIRAN & PAYROLL"
        subtitle="Master Karyawan, Log Absensi Harian, Rekapitulasi Lembur & Slip Gaji Terintegrasi"
      />

      {/* Main Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Human Resources, Absensi, Lembur & Payroll
              </h2>
              <p className="text-xs text-slate-500">
                Sistem Terpadu Manajemen SDM Proyek, Presensi Kehadiran, Approval Lembur & Penggajian
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CetakPdfButton
            elementId="hr-payroll-module"
            filename="Laporan_HRD_Absensi_Payroll_Build_X_Pro.pdf"
            title="Laporan HRD, Presensi & Payroll"
            variant="emerald"
          />

          <button
            onClick={handleBulkSyncPayroll}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            title="Sinkronkan seluruh data karyawan & lembur ke Slip Gaji secara otomatis"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Auto-Sync Payroll
          </button>

          {/* Sub-Tabs Nav */}
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'employees'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Karyawan ({employees.length})
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'attendance'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absensi ({attendanceRecords.length})
            </button>

            <button
              onClick={() => setActiveTab('overtime')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === 'overtime'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lembur ({overtimeRecords.length})
              {totalOvtPendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[9px]">
                  {totalOvtPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'payroll'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slip Gaji ({periodSlips.length})
            </button>
          </div>

          <button
            onClick={handleOpenAddEmp}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" /> Karyawan Baru
          </button>
        </div>
      </div>

      {/* Sync Warning Alert Bar */}
      {employeesWithoutSlip.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">
                Terdapat {employeesWithoutSlip.length} karyawan di Master yang belum memiliki Slip Gaji untuk periode {selectedPeriod}.
              </p>
              <p className="text-[11px] text-amber-700">
                Klik "Sinkronkan Sekarang" untuk menyelaraskan slip gaji otomatis berdasarkan komponen gaji, jam presensi, dan lembur.
              </p>
            </div>
          </div>
          <button
            onClick={handleBulkSyncPayroll}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm transition"
          >
            🔄 Sinkronkan Sekarang
          </button>
        </div>
      )}

      {/* TAB 1: MASTER KARYAWAN */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Karyawan Aktif</span>
              <p className="text-xl font-black text-slate-900 mt-1">{employees.length} Orang</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tercatat di Database Master HR</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rekap Jam Lembur Terhitung</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{totalOvtHoursApproved} Jam Approved</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Total Jam Lembur Disetujui</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Est. Alokasi Gaji & Tunjangan</span>
              <p className="text-xl font-black text-amber-600 mt-1">{formatRupiah(totalPayrollCost)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Gaji Pokok + Tunjangan Bulanan</p>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari NIK, Nama, Jabatan, Divisi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
              <button
                onClick={handleSyncAttendanceToMaster}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
                title="Hitung ulang jam presensi & lembur ke master"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" /> Sync Kehadiran & Lembur
              </button>
              <span>Menampilkan <strong>{filteredEmployees.length}</strong> dari <strong>{employees.length}</strong></span>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                    <th className="p-3.5">NIK & Nama Karyawan</th>
                    <th className="p-3.5">Jabatan & Divisi</th>
                    <th className="p-3.5">Status Kerja</th>
                    <th className="p-3.5 text-right">Gaji Pokok (Rp)</th>
                    <th className="p-3.5 text-right">Tunjangan (Rp)</th>
                    <th className="p-3.5 text-center">Kehadiran & Lembur</th>
                    <th className="p-3.5 text-center">Status Slip ({selectedPeriod})</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data karyawan yang sesuai dengan kata kunci pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const matchedSlip = periodSlips.find(
                        (s) => s.employeeId === emp.id || s.employeeName === emp.name
                      );

                      const totalEmpOvt = getApprovedOvertimeHours(emp.id) || emp.overtimeHours || 0;

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5">
                            <p className="font-mono font-bold text-amber-600">{emp.nik}</p>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{emp.phone || '-'}</p>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{emp.position}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{emp.division}</div>
                          </td>

                          <td className="p-3.5">
                            <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-slate-200">
                              {emp.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-bold text-slate-900">
                            {formatRupiah(emp.basicSalary)}
                          </td>

                          <td className="p-3.5 text-right font-bold text-emerald-600">
                            {formatRupiah(emp.allowance)}
                          </td>

                          <td className="p-3.5 text-center">
                            <p className="font-bold text-slate-800">{emp.attendanceDays || 22} Hari Hadir</p>
                            <p className="text-[10px] text-amber-700 font-bold">
                              Lembur: {totalEmpOvt} Jam
                            </p>
                          </td>

                          <td className="p-3.5 text-center">
                            {matchedSlip ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                <Check className="w-3 h-3" /> Ready ({matchedSlip.status})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                <AlertCircle className="w-3 h-3" /> Belum Dibuat
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const slip = matchedSlip || calculateSlipFromEmp(emp, selectedPeriod);
                                  setSelectedSlip(slip);
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition"
                                title="Lihat & Cetak Slip Gaji"
                              >
                                Slip Gaji
                              </button>
                              <button
                                onClick={() => {
                                  setEditingEmp(emp);
                                  setIsEmpModalOpen(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Karyawan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Yakin menghapus karyawan "${emp.name}"?`)) {
                                    onDeleteEmployee(emp.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus Karyawan"
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
        </div>
      )}

      {/* TAB 2: ABSENSI & KEHADIRAN */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Summary KPI Cards for Attendance */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Catatan Presensi</span>
              <p className="text-xl font-black text-slate-900 mt-1">{attendanceRecords.length} Log Record</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Seluruh Riwayat Presensi</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kehadiran (Hadir)</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{totalAttHadir} Record</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Status Masuk Tepat Waktu / Proyek</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Izin / Sakit / Cuti</span>
              <p className="text-xl font-black text-blue-600 mt-1">{totalAttIzin} Record</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Memiliki Surat Keterangan / Izin</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tanpa Keterangan (Alpha)</span>
              <p className="text-xl font-black text-rose-600 mt-1">{totalAttAlpha} Record</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Potongan Absensi Kerja</p>
            </div>
          </div>

          {/* Action & Filter Toolbar for Attendance */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari Nama / Lokasi Presensi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
                {['ALL', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Cuti'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAttStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      attStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />

              <button
                onClick={handleBatchMarkPresent}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Mark all active employees present for selected date"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Absen Massal (Hadir All)
              </button>

              <button
                onClick={handleOpenAddAttendance}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
              >
                <Plus className="w-4 h-4" /> Input Presensi Single
              </button>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                    <th className="p-3.5">Tanggal Presensi</th>
                    <th className="p-3.5">Nama & NIK Karyawan</th>
                    <th className="p-3.5">Jam Masuk - Keluar</th>
                    <th className="p-3.5">Lokasi Kerja / Proyek</th>
                    <th className="p-3.5 text-center">Status Presensi</th>
                    <th className="p-3.5">Catatan / Keterangan</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Belum ada data catatan presensi yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((att) => {
                      const emp = employees.find((e) => e.id === att.employeeId || e.name === att.employeeName);

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" /> {att.date}
                          </td>

                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{att.employeeName}</p>
                            <p className="text-[10px] font-mono text-slate-400">{emp?.nik || 'NIK-MASTER'}</p>
                          </td>

                          <td className="p-3.5 font-mono font-semibold text-slate-800">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" /> {att.checkIn} - {att.checkOut || '17:00'}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{att.location}</span>
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                att.status === 'Hadir'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : att.status === 'Izin' || att.status === 'Sakit' || att.status === 'Cuti'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {att.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-600 text-[11px]">
                            {att.notes || '-'}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingAtt(att);
                                  setIsAttModalOpen(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Presensi"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {onDeleteAttendance && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus presensi tanggal ${att.date} untuk ${att.employeeName}?`)) {
                                      onDeleteAttendance(att.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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
        </div>
      )}

      {/* TAB 3: PENGAJUAN & REKAP LEMBUR */}
      {activeTab === 'overtime' && (
        <div className="space-y-6">
          {/* Summary KPI Cards for Overtime */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Jam Lembur Disetujui</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{totalOvtHoursApproved} Jam</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Status Approved Otoritas Site/HRD</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengajuan Lembur Pending</span>
              <p className="text-xl font-black text-amber-600 mt-1">{totalOvtPendingCount} Pengajuan</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Membutuhkan Persetujuan Otoritas</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimasi Total Biaya Lembur Bulan Ini</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(totalPeriodOvertime)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Terhitung di Slip Gaji Periode Ini</p>
            </div>
          </div>

          {/* Action & Filter Toolbar for Overtime */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari Karyawan / Alasan Lembur..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
                {['ALL', 'Pending', 'Approved', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOvtStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      ovtStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOpenAddOvertime}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" /> Form Pengajuan Lembur
            </button>
          </div>

          {/* Overtime Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] tracking-wider uppercase">
                    <th className="p-3.5">Tanggal & Jam Lembur</th>
                    <th className="p-3.5">Nama & NIK Karyawan</th>
                    <th className="p-3.5">Proyek / Tugas Terkait</th>
                    <th className="p-3.5 text-center">Durasi (Jam)</th>
                    <th className="p-3.5 text-right">Est. Upah Lembur (Rp)</th>
                    <th className="p-3.5 text-center">Status Approval</th>
                    <th className="p-3.5 text-right">Aksi & Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredOvertime.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Belum ada riwayat pengajuan lembur.
                      </td>
                    </tr>
                  ) : (
                    filteredOvertime.map((ovt) => {
                      const emp = employees.find((e) => e.id === ovt.employeeId || e.name === ovt.employeeName);
                      const estPay = emp ? calculateOvertimePay(emp.basicSalary, ovt.hours) : ovt.hours * 50000;

                      return (
                        <tr key={ovt.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5">
                            <p className="font-mono font-bold text-slate-900">{ovt.date}</p>
                            <p className="text-[10px] text-amber-700 font-mono font-bold">
                              {ovt.startTime} - {ovt.endTime}
                            </p>
                          </td>

                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{ovt.employeeName}</p>
                            <p className="text-[10px] font-mono text-slate-400">{emp?.nik || 'NIK-MASTER'}</p>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{ovt.projectOrTask}</div>
                            <div className="text-[10px] text-slate-500">{ovt.reason}</div>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className="font-black text-slate-900 font-mono text-sm">
                              {ovt.hours} Jam
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-bold text-emerald-600 font-mono">
                            {formatRupiah(estPay)}
                          </td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                ovt.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : ovt.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {ovt.status}
                            </span>
                            {ovt.approvedBy && (
                              <p className="text-[9px] text-slate-400 mt-0.5">By: {ovt.approvedBy}</p>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ovt.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleSetOvertimeStatus(ovt, 'Approved')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                                    title="Setujui Lembur"
                                  >
                                    <ThumbsUp className="w-3 h-3" /> Setujui
                                  </button>

                                  <button
                                    onClick={() => handleSetOvertimeStatus(ovt, 'Rejected')}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                                    title="Tolak Lembur"
                                  >
                                    <ThumbsDown className="w-3 h-3" /> Tolak
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setEditingOvt(ovt);
                                  setIsOvtModalOpen(true);
                                }}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Pengajuan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {onDeleteOvertime && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus pengajuan lembur ${ovt.employeeName}?`)) {
                                      onDeleteOvertime(ovt.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Hapus Overtime"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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
        </div>
      )}

      {/* TAB 4: SLIP GAJI & PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Period Selector & Sync Controls */}
          <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                <Calendar className="w-3.5 h-3.5" /> Periode Payroll Active
              </div>
              <h3 className="text-base font-bold mt-1">Daftar Rekapitulasi Slip Gaji Karyawan</h3>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-slate-800 text-white font-bold border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="Juli 2026">Juli 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="Juni 2026">Juni 2026</option>
              </select>

              <button
                onClick={handleBulkSyncPayroll}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" /> Sinkronkan Semua
              </button>
            </div>
          </div>

          {/* Period KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Jumlah Slip</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{periodSlips.length} Slip</p>
              <p className="text-[10px] text-slate-400">Periode {selectedPeriod}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Gaji Pokok</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{formatRupiah(totalPeriodBasicSalary)}</p>
              <p className="text-[10px] text-slate-400">Gaji Dasar Bruto</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Tunjangan & Lembur</p>
              <p className="text-lg font-black text-emerald-600 mt-0.5">
                {formatRupiah(totalPeriodAllowance + totalPeriodOvertime)}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold">
                Lembur: {formatRupiah(totalPeriodOvertime)}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Potongan (BPJS + PPh21)</p>
              <p className="text-lg font-black text-rose-600 mt-0.5">-{formatRupiah(totalPeriodDeductions)}</p>
              <p className="text-[10px] text-rose-500 font-semibold">Pajak & BPJS TK</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total THP (Gaji Bersih)</p>
              <p className="text-lg font-black text-blue-600 mt-0.5">{formatRupiah(totalPeriodNetSalary)}</p>
              <p className="text-[10px] text-blue-600 font-semibold">Total Transfer Gaji</p>
            </div>
          </div>

          {/* Cards Grid of Slips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSlips.length === 0 ? (
              <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 italic space-y-3">
                <p>Belum ada slip gaji yang tercatat untuk periode {selectedPeriod}.</p>
                <button
                  onClick={handleBulkSyncPayroll}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Buat Slip Gaji Otomatis dari Master Karyawan
                </button>
              </div>
            ) : (
              filteredSlips.map((slip) => {
                const matchedEmp = employees.find(
                  (e) => e.id === slip.employeeId || e.name === slip.employeeName
                );

                return (
                  <div
                    key={slip.id}
                    className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-3.5 hover:border-amber-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{slip.employeeName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {matchedEmp?.nik || 'NIK-MASTER'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {matchedEmp?.position || 'Staf'} • {matchedEmp?.division || 'Teknik'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            slip.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : slip.status === 'Approved'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {slip.status}
                        </span>

                        {onDeletePayroll && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus slip gaji "${slip.employeeName}"?`)) {
                                onDeletePayroll(slip.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Hapus Slip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-slate-600">
                        <span>Gaji Pokok:</span>
                        <span className="font-mono font-semibold">{formatRupiah(slip.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tunjangan Ops:</span>
                        <span className="font-mono font-semibold">{formatRupiah(slip.allowance)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Upah Lembur:</span>
                        <span className="font-mono font-semibold text-amber-600 font-bold">
                          {formatRupiah(slip.overtimePay)}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Potongan (BPJS & PPh21):</span>
                        <span className="font-mono font-semibold">
                          -{formatRupiah(slip.bpjsDeduction + slip.taxPph21)}
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                        <span>Take Home Pay (THP):</span>
                        <span className="text-emerald-600 font-mono">{formatRupiah(slip.netSalary)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEditSlip(slip)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" /> Edit Detail
                      </button>

                      <button
                        onClick={() => setSelectedSlip(slip)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" /> Cetak Slip Resmi
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL PRINT SLIP GAJI */}
      {selectedSlip && (() => {
        const matchedEmp = employees.find(
          (e) => e.id === selectedSlip.employeeId || e.name === selectedSlip.employeeName
        );
        const totalEarnings = selectedSlip.basicSalary + selectedSlip.allowance + selectedSlip.overtimePay;
        const totalDeductions = selectedSlip.bpjsDeduction + selectedSlip.taxPph21;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 text-slate-900 overflow-hidden">
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

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100/60">
                <div id="slip-gaji-printable-document" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6 shadow-sm relative">
                  <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 rounded-t"></div>

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

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <p className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500 font-medium">Nama Karyawan:</span>
                        <strong className="text-slate-900 font-black">{selectedSlip.employeeName}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">NIK Karyawan:</span>
                        <span className="font-mono font-bold text-slate-800">{matchedEmp?.nik || 'NIK-MASTER'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">Jabatan / Posisi:</span>
                        <span className="font-semibold text-slate-800">{matchedEmp?.position || 'Staf'}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                      <p className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-500 font-medium">Divisi / Unit:</span>
                        <span className="font-bold text-slate-800">{matchedEmp?.division || 'Teknik'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">Hari Hadir Presensi:</span>
                        <span className="font-bold text-emerald-700">{matchedEmp?.attendanceDays || 22} Hari</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500 font-medium">Rekening Tujuan:</span>
                        <span className="font-mono font-bold text-slate-800">{matchedEmp?.bankAccount || 'BCA 12345678'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                          <span className="font-mono font-bold text-amber-600">{formatRupiah(selectedSlip.overtimePay)}</span>
                        </div>
                      </div>
                      <div className="bg-emerald-50 border-t border-emerald-200 p-2.5 font-bold flex justify-between text-emerald-900">
                        <span>TOTAL PENERIMAAN BRUTO:</span>
                        <span className="font-mono">{formatRupiah(totalEarnings)}</span>
                      </div>
                    </div>

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

                  <PrintSignature
                    preparedBy="Dewi Anggraini, S.Psi."
                    preparedTitle="Staff HRD & Payroll"
                    verifiedBy={selectedSlip.employeeName}
                    verifiedTitle="Penerima Gaji (Karyawan)"
                    note={`Slip Gaji Resmi Periode ${selectedSlip.period} — Disetujui Otoritas Direksi & HRD`}
                  />

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
        );
      })()}

      {/* MODAL INPUT / EDIT KARYAWAN MASTER */}
      {isEmpModalOpen && editingEmp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingEmp.id && employees.some((e) => e.id === editingEmp.id)
                  ? 'Edit Master Data Karyawan'
                  : 'Tambah Karyawan Baru (Master HR)'}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmpForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK Karyawan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmp.nik || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, nik: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmp.name || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.position || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, position: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Divisi</label>
                  <select
                    value={editingEmp.division || 'Teknik'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, division: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Teknik">Teknik</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="HRD">HRD</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Logistik">Logistik</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pekerja</label>
                  <select
                    value={editingEmp.status || 'Tetap'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Harian">Harian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingEmp.basicSalary || 0}
                    onChange={(e) => setEditingEmp({ ...editingEmp, basicSalary: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tunjangan Bulanan (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingEmp.allowance || 0}
                    onChange={(e) => setEditingEmp({ ...editingEmp, allowance: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Rekening Transfer</label>
                  <input
                    type="text"
                    value={editingEmp.bankAccount || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, bankAccount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="BCA 1234567890"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Handphone / WhatsApp</label>
                  <input
                    type="text"
                    value={editingEmp.phone || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="0812-3456-7890"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  Simpan Master Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT PRESENSI SGL */}
      {isAttModalOpen && editingAtt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Catat Presensi Kehadiran Karyawan
              </h3>
              <button onClick={() => setIsAttModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Karyawan</label>
                <select
                  value={editingAtt.employeeId || ''}
                  onChange={(e) => {
                    const emp = employees.find((emp) => emp.id === e.target.value);
                    setEditingAtt({
                      ...editingAtt,
                      employeeId: e.target.value,
                      employeeName: emp ? emp.name : '',
                    });
                  }}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nik} - {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Presensi</label>
                  <input
                    type="date"
                    required
                    value={editingAtt.date || ''}
                    onChange={(e) => setEditingAtt({ ...editingAtt, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kehadiran</label>
                  <select
                    value={editingAtt.status || 'Hadir'}
                    onChange={(e) => setEditingAtt({ ...editingAtt, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Alpha">Alpha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Masuk (Check In)</label>
                  <input
                    type="time"
                    value={editingAtt.checkIn || '08:00'}
                    onChange={(e) => setEditingAtt({ ...editingAtt, checkIn: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Keluar (Check Out)</label>
                  <input
                    type="time"
                    value={editingAtt.checkOut || '17:00'}
                    onChange={(e) => setEditingAtt({ ...editingAtt, checkOut: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Kerja / Proyek</label>
                <input
                  type="text"
                  required
                  value={editingAtt.location || ''}
                  onChange={(e) => setEditingAtt({ ...editingAtt, location: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Proyek Wisma Utama / Head Office"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Presensi</label>
                <input
                  type="text"
                  value={editingAtt.notes || ''}
                  onChange={(e) => setEditingAtt({ ...editingAtt, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Tepat waktu / lembur / ada tugas luar"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAttModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGAJUAN LEMBUR */}
      {isOvtModalOpen && editingOvt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Form Pengajuan Lembur Karyawan
              </h3>
              <button onClick={() => setIsOvtModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOvertimeForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Karyawan Yang Melakukan Lembur</label>
                <select
                  value={editingOvt.employeeId || ''}
                  onChange={(e) => {
                    const emp = employees.find((emp) => emp.id === e.target.value);
                    setEditingOvt({
                      ...editingOvt,
                      employeeId: e.target.value,
                      employeeName: emp ? emp.name : '',
                    });
                  }}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nik} - {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lembur</label>
                  <input
                    type="date"
                    required
                    value={editingOvt.date || ''}
                    onChange={(e) => setEditingOvt({ ...editingOvt, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={editingOvt.startTime || '17:00'}
                    onChange={(e) => setEditingOvt({ ...editingOvt, startTime: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={editingOvt.endTime || '20:00'}
                    onChange={(e) => setEditingOvt({ ...editingOvt, endTime: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Durasi Jam Lembur</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingOvt.hours || 3}
                    onChange={(e) => setEditingOvt({ ...editingOvt, hours: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pengajuan</label>
                  <select
                    value={editingOvt.status || 'Pending'}
                    onChange={(e) => setEditingOvt({ ...editingOvt, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Pending">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proyek / Kode Tugas</label>
                <input
                  type="text"
                  required
                  value={editingOvt.projectOrTask || ''}
                  onChange={(e) => setEditingOvt({ ...editingOvt, projectOrTask: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="PRJ-2026-001 Wisma Utama / Head Office"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan / Detail Pekerjaan Lembur</label>
                <textarea
                  rows={2}
                  required
                  value={editingOvt.reason || ''}
                  onChange={(e) => setEditingOvt({ ...editingOvt, reason: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Supervisi pengecoran beton / penyusunan laporan keuangan / addendum..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOvtModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition"
                >
                  Simpan Pengajuan Lembur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DETAIL SLIP GAJI */}
      {isSlipModalOpen && editingSlip && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Edit Detail Slip Gaji: {editingSlip.employeeName}
              </h3>
              <button onClick={() => setIsSlipModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlipForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periode Slip</label>
                  <input
                    type="text"
                    readOnly
                    value={editingSlip.period || selectedPeriod}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Slip</label>
                  <select
                    value={editingSlip.status || 'Approved'}
                    onChange={(e) => setEditingSlip({ ...editingSlip, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid (Lunas)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={editingSlip.basicSalary || 0}
                    onChange={(e) => setEditingSlip({ ...editingSlip, basicSalary: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tunjangan Bulanan (Rp)</label>
                  <input
                    type="number"
                    value={editingSlip.allowance || 0}
                    onChange={(e) => setEditingSlip({ ...editingSlip, allowance: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upah Lembur (Rp)</label>
                  <input
                    type="number"
                    value={editingSlip.overtimePay || 0}
                    onChange={(e) => setEditingSlip({ ...editingSlip, overtimePay: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pot. BPJS (Rp)</label>
                  <input
                    type="number"
                    value={editingSlip.bpjsDeduction || 0}
                    onChange={(e) => setEditingSlip({ ...editingSlip, bpjsDeduction: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-rose-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pot. PPh21 (Rp)</label>
                  <input
                    type="number"
                    value={editingSlip.taxPph21 || 0}
                    onChange={(e) => setEditingSlip({ ...editingSlip, taxPph21: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-rose-600 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-bold">
                <span>Estimasi Gaji Bersih (THP):</span>
                <span className="font-mono text-emerald-700 text-sm">
                  {formatRupiah(
                    (editingSlip.basicSalary || 0) +
                      (editingSlip.allowance || 0) +
                      (editingSlip.overtimePay || 0) -
                      (editingSlip.bpjsDeduction || 0) -
                      (editingSlip.taxPph21 || 0)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  Simpan Slip Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
