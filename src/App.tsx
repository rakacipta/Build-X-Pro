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

import {
  ModuleType,
  UserRole,
  Project,
  Tender,
  Material,
  PurchaseOrder,
  SalesOrder,
  CrmLead,
  Equipment,
  Employee,
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
} from './types';

import {
  INITIAL_PROJECTS,
  INITIAL_TENDERS,
  INITIAL_MATERIALS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_LEADS,
  INITIAL_EQUIPMENT,
  INITIAL_EMPLOYEES,
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
} from './lib/seedData';

import {
  subscribeToCollection,
  saveDocument,
  deleteDocument,
} from './services/firestoreService';
import { testConnection } from './lib/firebase';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore Realtime Collections State
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tenders, setTenders] = useState<Tender[]>(INITIAL_TENDERS);
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(INITIAL_PURCHASES);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(INITIAL_SALES);
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(INITIAL_LEADS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [payrollSlips, setPayrollSlips] = useState<PayrollSlip[]>(INITIAL_PAYROLL);
  const [financeTransactions, setFinanceTransactions] =
    useState<FinanceTransaction[]>(INITIAL_FINANCE);
  const [coaList, setCoaList] = useState<ChartOfAccount[]>(INITIAL_COA);
  const [journals, setJournals] = useState<JournalEntry[]>(INITIAL_JOURNALS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [ahspList, setAhspList] = useState<AHSPItem[]>(INITIAL_AHSP);
  const [rabItems, setRabItems] = useState<RABItem[]>(INITIAL_RAB_ITEMS);

  // Settings States
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY_PROFILE);
  const [letterhead, setLetterhead] = useState<LetterheadSettings>(INITIAL_LETTERHEAD);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(INITIAL_SYSTEM_USERS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);

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

    return () => {
      unsubProjects();
      unsubTenders();
      unsubMaterials();
      unsubPurchases();
      unsubSales();
      unsubLeads();
      unsubEquipment();
      unsubEmployees();
      unsubPayroll();
      unsubFinance();
      unsubCoa();
      unsubJournals();
      unsubApprovals();
      unsubAhsp();
      unsubRab();
      unsubUsers();
    };
  }, []);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending').length;

  // Handlers for Save and Delete
  const handleSaveProject = (p: Project) => saveDocument('projects', p);
  const handleDeleteProject = (id: string) => deleteDocument('projects', id);

  const handleSaveTender = (t: Tender) => saveDocument('tenders', t);
  const handleDeleteTender = (id: string) => deleteDocument('tenders', id);

  const handleSaveMaterial = (m: Material) => saveDocument('materials', m);
  const handleDeleteMaterial = (id: string) => deleteDocument('materials', id);

  const handleSavePurchase = (po: PurchaseOrder) => saveDocument('purchases', po);
  const handleDeletePurchase = (id: string) => deleteDocument('purchases', id);

  const handleSaveSalesOrder = (so: SalesOrder) => saveDocument('sales', so);
  const handleDeleteSalesOrder = (id: string) => deleteDocument('sales', id);

  const handleSaveLead = (l: CrmLead) => saveDocument('crm_leads', l);
  const handleDeleteLead = (id: string) => deleteDocument('crm_leads', id);

  const handleSaveEquipment = (e: Equipment) => saveDocument('equipment', e);
  const handleDeleteEquipment = (id: string) => deleteDocument('equipment', id);

  const handleSaveEmployee = (e: Employee) => saveDocument('employees', e);
  const handleDeleteEmployee = (id: string) => deleteDocument('employees', id);

  const handleSaveFinance = (f: FinanceTransaction) => saveDocument('finance_transactions', f);
  const handleDeleteFinance = (id: string) => deleteDocument('finance_transactions', id);

  const handleSaveRabItem = (r: RABItem) => saveDocument('rab_items', r);
  const handleDeleteRabItem = (id: string) => deleteDocument('rab_items', id);
  const handleSaveAhsp = (a: AHSPItem) => saveDocument('ahsp', a);

  // Settings Handlers
  const handleSaveSystemUser = (u: SystemUser) => saveDocument('system_users', u);
  const handleDeleteSystemUser = (id: string) => deleteDocument('system_users', id);
  const handleUpdateCompanyProfile = (profile: CompanyProfile) => setCompanyProfile(profile);
  const handleUpdateLetterhead = (lh: LetterheadSettings) => setLetterhead(lh);
  const handleUpdateSystemSettings = (s: SystemSettings) => setSystemSettings(s);

  // Approval Handlers
  const handleApprove = (id: string, notes: string) => {
    const existing = approvals.find((a) => a.id === id);
    if (existing) {
      saveDocument('approvals', {
        ...existing,
        status: 'Approved',
        notes,
        approvalDate: new Date().toISOString().split('T')[0],
        approver: currentRole,
      });
    }
  };

  const handleReject = (id: string, notes: string) => {
    const existing = approvals.find((a) => a.id === id);
    if (existing) {
      saveDocument('approvals', {
        ...existing,
        status: 'Rejected',
        notes,
        approvalDate: new Date().toISOString().split('T')[0],
        approver: currentRole,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
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
              onNavigate={setActiveModule}
            />
          )}

          {activeModule === 'crm' && (
            <CrmModule
              leads={crmLeads}
              onSaveLead={handleSaveLead}
              onDeleteLead={handleDeleteLead}
            />
          )}

          {activeModule === 'tender' && (
            <TenderModule
              tenders={tenders}
              onSaveTender={handleSaveTender}
              onDeleteTender={handleDeleteTender}
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
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
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
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeModule === 'finance' && (
            <FinanceModule
              transactions={financeTransactions}
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

          {activeModule === 'settings' && (
            <SettingsModule
              currentRole={currentRole}
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
