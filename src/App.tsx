import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { CrmModule } from './components/crm/CrmModule';
import { TenderModule } from './components/tender/TenderModule';
import { EstimatorModule } from './components/estimator/EstimatorModule';
import { ProjectModule } from './components/project/ProjectModule';
import { TradingModule } from './components/trading/TradingModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { PurchasingModule } from './components/purchasing/PurchasingModule';
import { EquipmentModule } from './components/equipment/EquipmentModule';
import { HrPayrollModule } from './components/hr/HrPayrollModule';
import { FinanceModule } from './components/finance/FinanceModule';
import { BankAccountsModule } from './components/finance/BankAccountsModule';
import { AccountingModule } from './components/accounting/AccountingModule';
import { ApprovalsModule } from './components/approvals/ApprovalsModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { OfficialLettersModule } from './components/letters/OfficialLettersModule';
import { LoginPage } from './components/auth/LoginPage';

import {
  ModuleType,
  UserRole,
  Project,
  Tender,
  Quotation,
  Material,
  PurchaseOrder,
  SalesOrder,
  CrmLead,
  Equipment,
  Employee,
  AttendanceRecord,
  OvertimeRecord,
  PayrollSlip,
  FinanceTransaction,
  ChartOfAccount,
  JournalEntry,
  ApprovalRequest,
  AHSPItem,
  RABItem,
  CompanyProfile,
  LetterheadSettings,
  SystemUser,
  SystemSettings,
  AppNotification,
  SubkonContract,
  SubkonOpname,
} from './types';

import {
  INITIAL_PROJECTS,
  INITIAL_TENDERS,
  INITIAL_QUOTATIONS,
  INITIAL_MATERIALS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_LEADS,
  INITIAL_EQUIPMENT,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_OVERTIME,
  INITIAL_PAYROLL,
  INITIAL_FINANCE,
  INITIAL_COA,
  INITIAL_JOURNALS,
  INITIAL_APPROVALS,
  INITIAL_AHSP,
  INITIAL_RAB_ITEMS,
  INITIAL_COMPANY_PROFILE,
  INITIAL_LETTERHEAD,
  INITIAL_SYSTEM_USERS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUBKON_CONTRACTS,
  INITIAL_SUBKON_OPNAMES,
} from './lib/seedData';
import { formatRupiah } from './utils/formatters';

import {
  subscribeToCollection,
  saveDocument,
  deleteDocument,
  getStoredData,
  setStoredData,
} from './services/firestoreService';
import { testConnection } from './lib/firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent Collections State
  const [projects, setProjects] = useState<Project[]>(() =>
    getStoredData('projects', INITIAL_PROJECTS)
  );
  const [tenders, setTenders] = useState<Tender[]>(() =>
    getStoredData('tenders', INITIAL_TENDERS)
  );
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    getStoredData('quotations', INITIAL_QUOTATIONS)
  );
  const [materials, setMaterials] = useState<Material[]>(() =>
    getStoredData('materials', INITIAL_MATERIALS)
  );
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() =>
    getStoredData('purchases', INITIAL_PURCHASES)
  );
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() =>
    getStoredData('sales', INITIAL_SALES)
  );
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() =>
    getStoredData('crm_leads', INITIAL_LEADS)
  );
  const [equipment, setEquipment] = useState<Equipment[]>(() =>
    getStoredData('equipment', INITIAL_EQUIPMENT)
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    getStoredData('employees', INITIAL_EMPLOYEES)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    getStoredData('attendance', INITIAL_ATTENDANCE)
  );
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() =>
    getStoredData('overtime', INITIAL_OVERTIME)
  );
  const [payrollSlips, setPayrollSlips] = useState<PayrollSlip[]>(() =>
    getStoredData('payroll', INITIAL_PAYROLL)
  );
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>(() =>
    getStoredData('finance_transactions', INITIAL_FINANCE)
  );
  const [coaList, setCoaList] = useState<ChartOfAccount[]>(() =>
    getStoredData('coa', INITIAL_COA)
  );
  const [journals, setJournals] = useState<JournalEntry[]>(() =>
    getStoredData('journals', INITIAL_JOURNALS)
  );
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() =>
    getStoredData('approvals', INITIAL_APPROVALS)
  );
  const [ahspList, setAhspList] = useState<AHSPItem[]>(() =>
    getStoredData('ahsp', INITIAL_AHSP)
  );
  const [rabItems, setRabItems] = useState<RABItem[]>(() =>
    getStoredData('rab_items', INITIAL_RAB_ITEMS)
  );

  // Subkon & SPK Borongan States
  const [subkonContracts, setSubkonContracts] = useState<SubkonContract[]>(() =>
    getStoredData('subkon_contracts', INITIAL_SUBKON_CONTRACTS)
  );
  const [subkonOpnames, setSubkonOpnames] = useState<SubkonOpname[]>(() =>
    getStoredData('subkon_opnames', INITIAL_SUBKON_OPNAMES)
  );

  // Notifications & Alert State
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getStoredData('notifications', INITIAL_NOTIFICATIONS)
  );
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
    type: 'info' | 'alert' | 'success';
  } | null>(null);

  // Settings States
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() =>
    getStoredData('company_profile', INITIAL_COMPANY_PROFILE)
  );
  const [letterhead, setLetterhead] = useState<LetterheadSettings>(() =>
    getStoredData('letterhead', INITIAL_LETTERHEAD)
  );
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() =>
    getStoredData('system_users', INITIAL_SYSTEM_USERS)
  );
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    getStoredData('system_settings', INITIAL_SYSTEM_SETTINGS)
  );

  // Initialize Firestore Subscriptions
  useEffect(() => {
    testConnection();

    const unsubProjects = subscribeToCollection('projects', INITIAL_PROJECTS, setProjects);
    const unsubTenders = subscribeToCollection('tenders', INITIAL_TENDERS, setTenders);
    const unsubMaterials = subscribeToCollection('materials', INITIAL_MATERIALS, setMaterials);
    const unsubPurchases = subscribeToCollection('purchases', INITIAL_PURCHASES, setPurchases);
    const unsubSales = subscribeToCollection('sales', INITIAL_SALES, setSalesOrders);
    const unsubLeads = subscribeToCollection('crm_leads', INITIAL_LEADS, setCrmLeads);
    const unsubEquipment = subscribeToCollection('equipment', INITIAL_EQUIPMENT, setEquipment);
    const unsubEmployees = subscribeToCollection('employees', INITIAL_EMPLOYEES, setEmployees);
    const unsubAttendance = subscribeToCollection('attendance', INITIAL_ATTENDANCE, setAttendanceRecords);
    const unsubOvertime = subscribeToCollection('overtime', INITIAL_OVERTIME, setOvertimeRecords);
    const unsubPayroll = subscribeToCollection('payroll', INITIAL_PAYROLL, setPayrollSlips);
    const unsubFinance = subscribeToCollection(
      'finance_transactions',
      INITIAL_FINANCE,
      setFinanceTransactions
    );
    const unsubCoa = subscribeToCollection('coa', INITIAL_COA, setCoaList);
    const unsubJournals = subscribeToCollection('journals', INITIAL_JOURNALS, setJournals);
    const unsubApprovals = subscribeToCollection('approvals', INITIAL_APPROVALS, setApprovals);
    const unsubAhsp = subscribeToCollection('ahsp', INITIAL_AHSP, setAhspList);
    const unsubRab = subscribeToCollection('rab_items', INITIAL_RAB_ITEMS, setRabItems);
    const unsubUsers = subscribeToCollection('system_users', INITIAL_SYSTEM_USERS, setSystemUsers);
    const unsubNotifs = subscribeToCollection('notifications', INITIAL_NOTIFICATIONS, setNotifications);
    const unsubSubkon = subscribeToCollection('subkon_contracts', INITIAL_SUBKON_CONTRACTS, setSubkonContracts);
    const unsubOpnames = subscribeToCollection('subkon_opnames', INITIAL_SUBKON_OPNAMES, setSubkonOpnames);

    return () => {
      unsubProjects();
      unsubTenders();
      unsubMaterials();
      unsubPurchases();
      unsubSales();
      unsubLeads();
      unsubEquipment();
      unsubEmployees();
      unsubAttendance();
      unsubOvertime();
      unsubPayroll();
      unsubFinance();
      unsubCoa();
      unsubJournals();
      unsubApprovals();
      unsubAhsp();
      unsubRab();
      unsubUsers();
      unsubNotifs();
      unsubSubkon();
      unsubOpnames();
    };
  }, []);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending').length;

  // Notification Action Handlers
  const handleMarkNotificationRead = async (id: string) => {
    const existing = notifications.find((n) => n.id === id);
    if (existing) {
      const updated = await saveDocument('notifications', { ...existing, isRead: true });
      setNotifications(updated);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const updatedList = notifications.map((n) => ({ ...n, isRead: true }));
    setStoredData('notifications', updatedList);
    setNotifications(updatedList);
    for (const n of updatedList) {
      await saveDocument('notifications', n);
    }
  };

  const handleTriggerNotification = async (notifData: Partial<AppNotification>) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      type: notifData.type || 'SYSTEM',
      title: notifData.title || 'Notifikasi Sistem',
      message: notifData.message || '',
      timestamp: 'Baru saja',
      isRead: false,
      priority: notifData.priority || 'high',
      targetRoles: notifData.targetRoles || ['Direktur Utama', 'Direktur', 'Super Admin'],
      linkModule: notifData.linkModule,
      relatedId: notifData.relatedId,
      amount: notifData.amount,
      senderName: notifData.senderName || currentRole,
    };

    const updated = await saveDocument('notifications', newNotif);
    setNotifications(updated);

    setToastMessage({
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type === 'OVER_BUDGET' ? 'alert' : 'info',
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSendReminder = async (reqNo: string, title: string, amount: number) => {
    await handleTriggerNotification({
      type: 'REMINDER',
      title: `⚡ INGATAN PUSH ALERT: Approval ${reqNo}`,
      message: `Peringatan dari ${currentRole}: Pengajuan ${title} senilai ${formatRupiah(
        amount
      )} membutuhkan tindakan persetujuan direksi segera.`,
      priority: 'urgent',
      targetRoles: ['Direktur Utama', 'Direktur', 'Super Admin'],
      linkModule: 'approvals',
      relatedId: reqNo,
      amount: amount,
      senderName: currentRole,
    });

    setToastMessage({
      title: 'Notifikasi Reminder Terkirim!',
      message: `Peringatan & alert persetujuan untuk ${reqNo} telah didorong ke Direksi secara real-time.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Subkon CRUD Handlers
  const handleSaveSubkonContract = async (contract: SubkonContract) => {
    const updated = await saveDocument('subkon_contracts', contract);
    setSubkonContracts(updated);
  };

  const handleDeleteSubkonContract = async (id: string) => {
    const updated = await deleteDocument('subkon_contracts', id);
    setSubkonContracts(updated);
  };

  const handleSaveSubkonOpname = async (opname: SubkonOpname) => {
    const updated = await saveDocument('subkon_opnames', opname);
    setSubkonOpnames(updated);
  };

  const handleDeleteSubkonOpname = async (id: string) => {
    const updated = await deleteDocument('subkon_opnames', id);
    setSubkonOpnames(updated);
  };

  // Persistent Handlers for Save and Delete
  const handleSaveProject = async (p: Project) => {
    const updated = await saveDocument('projects', p);
    setProjects(updated);
  };
  const handleDeleteProject = async (id: string) => {
    const updated = await deleteDocument<Project>('projects', id);
    setProjects(updated);
  };

  const handleSaveTender = async (t: Tender) => {
    const updated = await saveDocument('tenders', t);
    setTenders(updated);
  };
  const handleDeleteTender = async (id: string) => {
    const updated = await deleteDocument<Tender>('tenders', id);
    setTenders(updated);
  };

  const handleSaveQuotation = async (q: Quotation) => {
    const updated = await saveDocument('quotations', q);
    setQuotations(updated);
  };
  const handleDeleteQuotation = async (id: string) => {
    const updated = await deleteDocument<Quotation>('quotations', id);
    setQuotations(updated);
  };

  const handleSaveMaterial = async (m: Material) => {
    const updated = await saveDocument('materials', m);
    setMaterials(updated);
  };
  const handleDeleteMaterial = async (id: string) => {
    const updated = await deleteDocument<Material>('materials', id);
    setMaterials(updated);
  };

  const handleSavePurchase = async (po: PurchaseOrder) => {
    const updated = await saveDocument('purchases', po);
    setPurchases(updated);
  };
  const handleDeletePurchase = async (id: string) => {
    const updated = await deleteDocument<PurchaseOrder>('purchases', id);
    setPurchases(updated);
  };

  const handleSaveSalesOrder = async (so: SalesOrder) => {
    const updated = await saveDocument('sales', so);
    setSalesOrders(updated);
  };
  const handleDeleteSalesOrder = async (id: string) => {
    const updated = await deleteDocument<SalesOrder>('sales', id);
    setSalesOrders(updated);
  };

  const handleSaveLead = async (l: CrmLead) => {
    const updated = await saveDocument('crm_leads', l);
    setCrmLeads(updated);
  };
  const handleDeleteLead = async (id: string) => {
    const updated = await deleteDocument<CrmLead>('crm_leads', id);
    setCrmLeads(updated);
  };

  const handleSaveEquipment = async (e: Equipment) => {
    const updated = await saveDocument('equipment', e);
    setEquipment(updated);
  };
  const handleDeleteEquipment = async (id: string) => {
    const updated = await deleteDocument<Equipment>('equipment', id);
    setEquipment(updated);
  };

  const handleSaveEmployee = async (e: Employee) => {
    const updatedEmployees = await saveDocument('employees', e);
    setEmployees(updatedEmployees);

    // Auto-sync payroll slip for this employee
    const currentPeriod = 'Juli 2026';
    const overtimePay = Math.round((e.overtimeHours || 0) * (e.basicSalary / 173));
    const bpjsDeduction = Math.round(e.basicSalary * 0.04);
    const taxPph21 = Math.round((e.basicSalary + e.allowance) * 0.05);
    const netSalary = e.basicSalary + e.allowance + overtimePay - bpjsDeduction - taxPph21;

    const existingSlip = payrollSlips.find(
      (s) => s.employeeId === e.id || s.employeeName === e.name
    );

    const updatedSlip: PayrollSlip = {
      id: existingSlip ? existingSlip.id : 'pay-' + Date.now(),
      employeeId: e.id,
      employeeName: e.name,
      period: existingSlip ? existingSlip.period : currentPeriod,
      basicSalary: e.basicSalary,
      allowance: e.allowance,
      overtimePay: overtimePay,
      bpjsDeduction: bpjsDeduction,
      taxPph21: taxPph21,
      netSalary: netSalary,
      status: existingSlip ? existingSlip.status : 'Approved',
    };

    const updatedPayroll = await saveDocument('payroll', updatedSlip);
    setPayrollSlips(updatedPayroll);
  };

  const handleDeleteEmployee = async (id: string) => {
    const updatedEmployees = await deleteDocument<Employee>('employees', id);
    setEmployees(updatedEmployees);

    // Remove associated payroll slip if exists
    const targetSlip = payrollSlips.find((s) => s.employeeId === id);
    if (targetSlip) {
      const updatedPayroll = await deleteDocument<PayrollSlip>('payroll', targetSlip.id);
      setPayrollSlips(updatedPayroll);
    }
  };

  const handleSavePayroll = async (p: PayrollSlip) => {
    const updatedPayroll = await saveDocument('payroll', p);
    setPayrollSlips(updatedPayroll);
  };

  const handleDeletePayroll = async (id: string) => {
    const updatedPayroll = await deleteDocument<PayrollSlip>('payroll', id);
    setPayrollSlips(updatedPayroll);
  };

  const handleSaveAttendance = async (a: AttendanceRecord) => {
    const updated = await saveDocument('attendance', a);
    setAttendanceRecords(updated);
  };

  const handleDeleteAttendance = async (id: string) => {
    const updated = await deleteDocument<AttendanceRecord>('attendance', id);
    setAttendanceRecords(updated);
  };

  const handleSaveOvertime = async (o: OvertimeRecord) => {
    const updated = await saveDocument('overtime', o);
    setOvertimeRecords(updated);
  };

  const handleDeleteOvertime = async (id: string) => {
    const updated = await deleteDocument<OvertimeRecord>('overtime', id);
    setOvertimeRecords(updated);
  };

  const handleSaveFinance = async (f: FinanceTransaction) => {
    const updated = await saveDocument('finance_transactions', f);
    setFinanceTransactions(updated);
  };
  const handleDeleteFinance = async (id: string) => {
    const updated = await deleteDocument<FinanceTransaction>('finance_transactions', id);
    setFinanceTransactions(updated);
  };

  const handleSaveRabItem = async (r: RABItem) => {
    const updated = await saveDocument('rab_items', r);
    setRabItems(updated);
  };
  const handleDeleteRabItem = async (id: string) => {
    const updated = await deleteDocument<RABItem>('rab_items', id);
    setRabItems(updated);
  };

  const handleSaveAhsp = async (a: AHSPItem) => {
    const updated = await saveDocument('ahsp', a);
    setAhspList(updated);
  };

  // Settings Handlers
  const handleSaveSystemUser = async (u: SystemUser) => {
    const updated = await saveDocument('system_users', u);
    setSystemUsers(updated);
  };
  const handleDeleteSystemUser = async (id: string) => {
    const updated = await deleteDocument<SystemUser>('system_users', id);
    setSystemUsers(updated);
  };

  const handleUpdateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    setStoredData('company_profile', profile);
    saveDocument('settings_single', { id: 'company_profile', ...profile });
  };

  const handleUpdateLetterhead = (lh: LetterheadSettings) => {
    setLetterhead(lh);
    setStoredData('letterhead', lh);
    saveDocument('settings_single', { id: 'letterhead', ...lh });
  };

  const handleUpdateSystemSettings = (s: SystemSettings) => {
    setSystemSettings(s);
    setStoredData('system_settings', s);
    saveDocument('settings_single', { id: 'system_settings', ...s });
  };

  // Approval Handlers
  const handleApprove = async (id: string, notes: string) => {
    const existing = approvals.find((a) => a.id === id);
    if (existing) {
      const updatedApproval = {
        ...existing,
        status: 'Approved' as const,
        notes,
        approvalDate: new Date().toISOString().split('T')[0],
        approver: currentRole,
      };
      const updated = await saveDocument('approvals', updatedApproval);
      setApprovals(updated);
    }
  };

  const handleReject = async (id: string, notes: string) => {
    const existing = approvals.find((a) => a.id === id);
    if (existing) {
      const updatedApproval = {
        ...existing,
        status: 'Rejected' as const,
        notes,
        approvalDate: new Date().toISOString().split('T')[0],
        approver: currentRole,
      };
      const updated = await saveDocument('approvals', updatedApproval);
      setApprovals(updated);
    }
  };

  // Auth & Login Handlers
  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('gmk_erp_logged_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gmk_erp_logged_user');
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <LoginPage
        systemUsers={systemUsers}
        companyProfile={companyProfile}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 font-sans flex flex-col overflow-hidden relative">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 flex items-start gap-3 animate-slide-up">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
            <span className="text-lg">⚡</span>
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-400 text-sm mb-0.5">{toastMessage.title}</h4>
            <p className="text-slate-300 leading-relaxed">{toastMessage.message}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white font-bold text-sm px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenApprovals={() => setActiveModule('approvals')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        companyName={companyProfile.name}
        companyLogoUrl={companyProfile.logoUrl}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onNavigateModule={(mod) => setActiveModule(mod as ModuleType)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Main Content Module Screen */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-12">
          {activeModule === 'dashboard' && (
            <DashboardModule
              projects={projects}
              financeTransactions={financeTransactions}
              equipment={equipment}
              employees={employees}
              approvals={approvals}
              materials={materials}
              purchaseOrders={purchases}
              onNavigate={setActiveModule}
            />
          )}

          {activeModule === 'crm' && (
            <CrmModule
              leads={crmLeads}
              onSaveLead={handleSaveLead}
              onDeleteLead={handleDeleteLead}
              quotations={quotations}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={handleDeleteQuotation}
            />
          )}

          {activeModule === 'tender' && (
            <TenderModule
              tenders={tenders}
              onSaveTender={handleSaveTender}
              onDeleteTender={handleDeleteTender}
              quotations={quotations}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={handleDeleteQuotation}
            />
          )}

          {activeModule === 'estimator' && (
            <EstimatorModule
              ahspList={ahspList}
              rabItems={rabItems}
              onSaveRabItem={handleSaveRabItem}
              onDeleteRabItem={handleDeleteRabItem}
              onSaveAhsp={handleSaveAhsp}
            />
          )}

          {activeModule === 'project' && (
            <ProjectModule
              projects={projects}
              rabItems={rabItems}
              financeTransactions={financeTransactions}
              purchases={purchases}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'trading' && (
            <TradingModule
              salesOrders={salesOrders}
              onSaveSalesOrder={handleSaveSalesOrder}
              onDeleteSalesOrder={handleDeleteSalesOrder}
            />
          )}

          {activeModule === 'inventory' && (
            <InventoryModule
              materials={materials}
              onSaveMaterial={handleSaveMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {activeModule === 'purchasing' && (
            <PurchasingModule
              purchases={purchases}
              onSavePurchase={handleSavePurchase}
              onDeletePurchase={handleDeletePurchase}
              onSendReminder={handleSendReminder}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'equipment' && (
            <EquipmentModule
              equipmentList={equipment}
              onSaveEquipment={handleSaveEquipment}
              onDeleteEquipment={handleDeleteEquipment}
            />
          )}

          {activeModule === 'hr_payroll' && (
            <HrPayrollModule
              employees={employees}
              payrollSlips={payrollSlips}
              attendanceRecords={attendanceRecords}
              overtimeRecords={overtimeRecords}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onSavePayroll={handleSavePayroll}
              onDeletePayroll={handleDeletePayroll}
              onSaveAttendance={handleSaveAttendance}
              onDeleteAttendance={handleDeleteAttendance}
              onSaveOvertime={handleSaveOvertime}
              onDeleteOvertime={handleDeleteOvertime}
            />
          )}

          {activeModule === 'finance' && (
            <FinanceModule
              transactions={financeTransactions}
              projects={projects}
              onSaveTransaction={handleSaveFinance}
              onDeleteTransaction={handleDeleteFinance}
            />
          )}

          {activeModule === 'bank_accounts' && (
            <BankAccountsModule
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              transactions={financeTransactions}
              currentRole={currentRole}
            />
          )}

          {activeModule === 'accounting' && (
            <AccountingModule coaList={coaList} journals={journals} onSaveJournal={() => {}} />
          )}

          {activeModule === 'approvals' && (
            <ApprovalsModule
              approvals={approvals}
              currentRole={currentRole}
              onApprove={handleApprove}
              onReject={handleReject}
              onSendReminder={handleSendReminder}
            />
          )}

          {activeModule === 'reports' && (
            <ReportsModule
              projects={projects}
              salesOrders={salesOrders}
              purchases={purchases}
              financeTransactions={financeTransactions}
              employees={employees}
              materials={materials}
            />
          )}

          {activeModule === 'official_letters' && (
            <OfficialLettersModule
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              letterhead={letterhead}
              projects={projects}
              subkonContracts={subkonContracts}
              subkonOpnames={subkonOpnames}
              onSaveSubkonContract={handleSaveSubkonContract}
              onDeleteSubkonContract={handleDeleteSubkonContract}
              onSaveSubkonOpname={handleSaveSubkonOpname}
              onDeleteSubkonOpname={handleDeleteSubkonOpname}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeModule === 'settings' && (
            <SettingsModule
              currentRole={currentRole}
              currentUser={currentUser}
              companyProfile={companyProfile}
              onUpdateCompanyProfile={handleUpdateCompanyProfile}
              letterhead={letterhead}
              onUpdateLetterhead={handleUpdateLetterhead}
              users={systemUsers}
              onSaveUser={handleSaveSystemUser}
              onDeleteUser={handleDeleteSystemUser}
              systemSettings={systemSettings}
              onUpdateSystemSettings={handleUpdateSystemSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
