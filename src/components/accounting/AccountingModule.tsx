import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Scale,
  TrendingUp,
  DollarSign,
  Building2,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CreditCard,
  PieChart,
} from 'lucide-react';
import {
  ChartOfAccount,
  JournalEntry,
  CompanyProfile,
  LetterheadSettings,
  FinanceTransaction,
  ProjectInvoice,
  PurchaseOrder,
  PayrollSlip,
  CompanyBank,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface AccountingModuleProps {
  coaList: ChartOfAccount[];
  journals: JournalEntry[];
  financeTransactions?: FinanceTransaction[];
  companyProfile?: CompanyProfile;
  invoices?: ProjectInvoice[];
  purchases?: PurchaseOrder[];
  payrollSlips?: PayrollSlip[];
  onSaveJournal?: (jrn: JournalEntry) => void;
  onSaveCoa?: (coa: ChartOfAccount) => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  coaList,
  journals,
  financeTransactions = [],
  companyProfile,
  invoices = [],
  purchases = [],
  payrollSlips = [],
  onSaveJournal,
  onSaveCoa,
}) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'coa' | 'income' | 'balance'>('journal');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modals state
  const [isAddJournalOpen, setIsAddJournalOpen] = useState(false);
  const [isAddCoaOpen, setIsAddCoaOpen] = useState(false);

  // Manual Journal Form State
  const [manualJournalForm, setManualJournalForm] = useState({
    date: new Date().toISOString().split('T')[0],
    refNo: `JRN-MANUAL-${Date.now().toString().slice(-4)}`,
    description: '',
    debitAccountCode: '101-001',
    creditAccountCode: '401-001',
    amount: 0,
  });

  // New COA Form State
  const [newCoaForm, setNewCoaForm] = useState<{
    code: string;
    name: string;
    type: 'Aktiva' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban';
    initialBalance: number;
  }>({
    code: '',
    name: '',
    type: 'Aktiva',
    initialBalance: 0,
  });

  const activeProfile = companyProfile || getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE);
  const registeredBanks: CompanyBank[] = activeProfile.banks || [];

  // --- 1. DYNAMICALLY SYNCHRONIZED COA LIST ---
  const synchronizedCoaList = useMemo(() => {
    // Base COA from props or fallback defaults
    const baseList: ChartOfAccount[] = coaList && coaList.length > 0 ? [...coaList] : [
      { id: 'coa-001', code: '101-001', name: 'Kas Utama Kantor', type: 'Aktiva', balance: 425000000 },
      { id: 'coa-002', code: '101-002', name: 'Petty Cash Proyek', type: 'Aktiva', balance: 35000000 },
      { id: 'coa-005', code: '103-001', name: 'Piutang Usaha Proyek', type: 'Aktiva', balance: 0 },
      { id: 'coa-006', code: '104-001', name: 'Persediaan Material Gudang', type: 'Aktiva', balance: 1450000000 },
      { id: 'coa-007', code: '201-001', name: 'Hutang Dagang Supplier / Vendor', type: 'Kewajiban', balance: 0 },
      { id: 'coa-008', code: '301-001', name: 'Modal Disetor Pemegang Saham', type: 'Ekuitas', balance: 20000000000 },
      { id: 'coa-009', code: '401-001', name: 'Pendapatan Jasa Konstruksi', type: 'Pendapatan', balance: 0 },
      { id: 'coa-010', code: '402-001', name: 'Pendapatan Penjualan Material Trading', type: 'Pendapatan', balance: 0 },
      { id: 'coa-011', code: '501-001', name: 'Beban Pokok Kontrak (HPP Proyek)', type: 'Beban', balance: 0 },
      { id: 'coa-012', code: '502-001', name: 'Beban Gaji & Payroll Karyawan', type: 'Beban', balance: 0 },
      { id: 'coa-013', code: '503-001', name: 'Beban Operasional & Umum', type: 'Beban', balance: 0 },
    ];

    // Ensure all registered Bank Accounts in companyProfile.banks exist in COA
    registeredBanks.forEach((bank, idx) => {
      const bankCoaCode = `102-00${idx + 1}`;
      const bankCoaName = `${bank.bankName} (${bank.accountNumber})`;

      const exists = baseList.some(
        (c) =>
          c.code === bankCoaCode ||
          c.name.toLowerCase().includes(bank.bankName.toLowerCase()) ||
          c.name.includes(bank.accountNumber)
      );

      if (!exists) {
        baseList.push({
          id: `coa-bank-${bank.id}`,
          code: bankCoaCode,
          name: bankCoaName,
          type: 'Aktiva',
          balance: bank.initialBalance || 500000000,
        });
      }
    });

    return baseList;
  }, [coaList, registeredBanks]);

  // Helper to resolve COA Account by Bank/Kas name or category
  const resolveCoaForAccountName = (accountName: string): ChartOfAccount => {
    const nameLower = accountName.toLowerCase();
    const found = synchronizedCoaList.find(
      (c) =>
        c.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(c.name.toLowerCase()) ||
        (nameLower.includes('mandiri') && c.name.toLowerCase().includes('mandiri')) ||
        (nameLower.includes('bca') && c.name.toLowerCase().includes('bca')) ||
        (nameLower.includes('bni') && c.name.toLowerCase().includes('bni')) ||
        (nameLower.includes('petty') && c.name.toLowerCase().includes('petty')) ||
        (nameLower.includes('kas') && c.name.toLowerCase().includes('kas'))
    );

    if (found) return found;

    // Fallback to Kas Utama or first Bank
    return (
      synchronizedCoaList.find((c) => c.code === '101-001') ||
      synchronizedCoaList[0] || {
        id: 'fallback',
        code: '101-001',
        name: 'Kas Utama Kantor',
        type: 'Aktiva',
        balance: 0,
      }
    );
  };

  // --- 2. AUTO-GENERATE JOURNALS FROM OPERATIONAL MODULES ---
  const allJournals = useMemo(() => {
    const journalList: JournalEntry[] = [];

    // A. Manual / Stored Journals from props
    if (journals && journals.length > 0) {
      journals.forEach((j) => {
        journalList.push({ ...j, source: j.source || 'Manual' });
      });
    }

    // B. Auto Journals from Finance Transactions (Kas Masuk, Kas Keluar, Transfer)
    financeTransactions.forEach((trx) => {
      const bankCoa = resolveCoaForAccountName(trx.account);

      let expenseCoaCode = '503-001'; // Default Beban Operasional
      let expenseCoaName = 'Beban Operasional & Umum';

      if (trx.category === 'Pembelian Material' || trx.category === 'Sewa Alat') {
        expenseCoaCode = '501-001';
        expenseCoaName = 'Beban Pokok Kontrak (HPP Proyek)';
      } else if (trx.category === 'Gaji & Payroll') {
        expenseCoaCode = '502-001';
        expenseCoaName = 'Beban Gaji & Payroll Karyawan';
      }

      let revenueCoaCode = '401-001';
      let revenueCoaName = 'Pendapatan Jasa Konstruksi';
      if (trx.category !== 'Pembayaran Proyek') {
        revenueCoaCode = '402-001';
        revenueCoaName = 'Pendapatan Penjualan Material Trading';
      }

      if (trx.type === 'Cash In') {
        // Debit: Kas/Bank, Credit: Pendapatan
        journalList.push(
          {
            id: `jrn-autofin-d-${trx.id}`,
            journalNo: `JRN/${trx.trxNo}`,
            date: trx.date,
            refNo: trx.refNo || trx.trxNo,
            description: trx.description,
            accountCode: bankCoa.code,
            accountName: bankCoa.name,
            debit: trx.amount,
            credit: 0,
            source: 'Kas/Bank Operasional',
          },
          {
            id: `jrn-autofin-c-${trx.id}`,
            journalNo: `JRN/${trx.trxNo}`,
            date: trx.date,
            refNo: trx.refNo || trx.trxNo,
            description: `Pengakuan ${trx.category} - ${trx.description}`,
            accountCode: revenueCoaCode,
            accountName: revenueCoaName,
            debit: 0,
            credit: trx.amount,
            source: 'Kas/Bank Operasional',
          }
        );
      } else if (trx.type === 'Cash Out') {
        // Debit: Beban, Credit: Kas/Bank
        journalList.push(
          {
            id: `jrn-autofin-d-${trx.id}`,
            journalNo: `JRN/${trx.trxNo}`,
            date: trx.date,
            refNo: trx.refNo || trx.trxNo,
            description: `${trx.category} - ${trx.description}`,
            accountCode: expenseCoaCode,
            accountName: expenseCoaName,
            debit: trx.amount,
            credit: 0,
            source: 'Kas/Bank Operasional',
          },
          {
            id: `jrn-autofin-c-${trx.id}`,
            journalNo: `JRN/${trx.trxNo}`,
            date: trx.date,
            refNo: trx.refNo || trx.trxNo,
            description: `Pembayaran via ${trx.account}`,
            accountCode: bankCoa.code,
            accountName: bankCoa.name,
            debit: 0,
            credit: trx.amount,
            source: 'Kas/Bank Operasional',
          }
        );
      } else if (trx.type === 'Transfer') {
        // Transfer antar rekening
        const destCoa = resolveCoaForAccountName('Kas Utama');
        journalList.push(
          {
            id: `jrn-autofin-d-${trx.id}`,
            journalNo: `JRN/${trx.trxNo}`,
            date: trx.date,
            refNo: trx.refNo || trx.trxNo,
            description: `Penerimaan Transfer - ${trx.description}`,
            accountCode: destCoa.code,
            accountName: destCoa.name,
            debit: trx.amount,
            credit: 0,
            source: 'Kas/Bank Operasional',
          },
          {
            id: `jrn-autofin-c-${trx.id}`,
            journalNo: `JRN/${trx.trxNo}`,
            date: trx.date,
            refNo: trx.refNo || trx.trxNo,
            description: `Pengiriman Transfer dari ${trx.account}`,
            accountCode: bankCoa.code,
            accountName: bankCoa.name,
            debit: 0,
            credit: trx.amount,
            source: 'Kas/Bank Operasional',
          }
        );
      }
    });

    // C. Auto Journals from Unpaid/Paid Invoices
    invoices.forEach((inv) => {
      if (inv.status === 'Sent' || inv.status === 'Overdue') {
        // Unpaid Invoice -> Debit Piutang Usaha (103-001), Credit Pendapatan Konstruksi (401-001)
        journalList.push(
          {
            id: `jrn-inv-d-${inv.id}`,
            journalNo: `JRN/INV/${inv.invoiceNumber}`,
            date: inv.issueDate,
            refNo: inv.invoiceNumber,
            description: `Piutang Tagihan Invoice ${inv.invoiceNumber} (${inv.projectName})`,
            accountCode: '103-001',
            accountName: 'Piutang Usaha Proyek',
            debit: inv.totalAmount,
            credit: 0,
            source: 'Invoice Proyek',
          },
          {
            id: `jrn-inv-c-${inv.id}`,
            journalNo: `JRN/INV/${inv.invoiceNumber}`,
            date: inv.issueDate,
            refNo: inv.invoiceNumber,
            description: `Pengakuan Termijn Tagihan ${inv.projectName}`,
            accountCode: '401-001',
            accountName: 'Pendapatan Jasa Konstruksi',
            debit: 0,
            credit: inv.totalAmount,
            source: 'Invoice Proyek',
          }
        );
      }
    });

    // Sort journals by date descending
    return journalList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journals, financeTransactions, invoices, synchronizedCoaList]);

  // --- 3. LIVE CALCULATED COA BALANCES BASED ON ALL SYNCHRONIZED JOURNALS ---
  const calculatedCoaList = useMemo(() => {
    return synchronizedCoaList.map((coa) => {
      // Find all journal entries for this COA code or matching name
      const matchingEntries = allJournals.filter(
        (j) => j.accountCode === coa.code || j.accountName.toLowerCase().includes(coa.name.toLowerCase())
      );

      const totalDebit = matchingEntries.reduce((acc, j) => acc + (j.debit || 0), 0);
      const totalCredit = matchingEntries.reduce((acc, j) => acc + (j.credit || 0), 0);

      let computedBalance = coa.balance;

      if (coa.type === 'Aktiva') {
        computedBalance = (coa.balance || 0) + totalDebit - totalCredit;
      } else if (coa.type === 'Kewajiban' || coa.type === 'Ekuitas') {
        computedBalance = (coa.balance || 0) + totalCredit - totalDebit;
      } else if (coa.type === 'Pendapatan') {
        computedBalance = totalCredit - totalDebit;
      } else if (coa.type === 'Beban') {
        computedBalance = totalDebit - totalCredit;
      }

      return {
        ...coa,
        balance: Math.max(0, computedBalance),
      };
    });
  }, [synchronizedCoaList, allJournals]);

  // --- 4. CALCULATIONS FOR FINANCIAL STATEMENTS ---
  const totalPendapatan = calculatedCoaList
    .filter((c) => c.type === 'Pendapatan')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalBeban = calculatedCoaList
    .filter((c) => c.type === 'Beban')
    .reduce((acc, c) => acc + c.balance, 0);

  const labaBersih = totalPendapatan - totalBeban;

  const totalAktiva = calculatedCoaList
    .filter((c) => c.type === 'Aktiva')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalKewajiban = calculatedCoaList
    .filter((c) => c.type === 'Kewajiban')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalEkuitasBase = calculatedCoaList
    .filter((c) => c.type === 'Ekuitas')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalEkuitas = totalEkuitasBase + labaBersih;
  const totalPassiva = totalKewajiban + totalEkuitas;
  const isBalanceEqual = Math.abs(totalAktiva - totalPassiva) < 1000;

  // Filtered Journals for Display
  const filteredJournals = useMemo(() => {
    return allJournals.filter((j) => {
      const matchSearch =
        j.journalNo.toLowerCase().includes(search.toLowerCase()) ||
        j.accountName.toLowerCase().includes(search.toLowerCase()) ||
        j.accountCode.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase()) ||
        j.refNo.toLowerCase().includes(search.toLowerCase());

      const matchSource = sourceFilter === 'all' || j.source === sourceFilter;

      return matchSearch && matchSource;
    });
  }, [allJournals, search, sourceFilter]);

  // Total Debit and Credit Verification
  const grandTotalDebit = filteredJournals.reduce((acc, j) => acc + (j.debit || 0), 0);
  const grandTotalCredit = filteredJournals.reduce((acc, j) => acc + (j.credit || 0), 0);

  // Handlers for Adding Manual Journal Entry
  const handleCreateManualJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJournalForm.amount || manualJournalForm.amount <= 0) {
      alert('Masukkan nominal transaksi yang valid (> 0)');
      return;
    }

    const debitCoa = calculatedCoaList.find((c) => c.code === manualJournalForm.debitAccountCode) || calculatedCoaList[0];
    const creditCoa = calculatedCoaList.find((c) => c.code === manualJournalForm.creditAccountCode) || calculatedCoaList[1];

    const jrnNo = `JRN/MNL/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    const debitEntry: JournalEntry = {
      id: `jrn-mnl-d-${Date.now()}`,
      journalNo: jrnNo,
      date: manualJournalForm.date,
      refNo: manualJournalForm.refNo,
      description: manualJournalForm.description || 'Jurnal Penyesuaian Manual',
      accountCode: debitCoa.code,
      accountName: debitCoa.name,
      debit: Number(manualJournalForm.amount),
      credit: 0,
      source: 'Manual',
    };

    const creditEntry: JournalEntry = {
      id: `jrn-mnl-c-${Date.now() + 1}`,
      journalNo: jrnNo,
      date: manualJournalForm.date,
      refNo: manualJournalForm.refNo,
      description: manualJournalForm.description || 'Jurnal Penyesuaian Manual',
      accountCode: creditCoa.code,
      accountName: creditCoa.name,
      debit: 0,
      credit: Number(manualJournalForm.amount),
      source: 'Manual',
    };

    if (onSaveJournal) {
      onSaveJournal(debitEntry);
      onSaveJournal(creditEntry);
    }

    alert('Dua baris Jurnal Umum (Debit & Kredit) berhasil disimpan!');
    setIsAddJournalOpen(false);
    setManualJournalForm({
      date: new Date().toISOString().split('T')[0],
      refNo: `JRN-MANUAL-${Date.now().toString().slice(-4)}`,
      description: '',
      debitAccountCode: '101-001',
      creditAccountCode: '401-001',
      amount: 0,
    });
  };

  // Handlers for Adding New COA Account
  const handleCreateCoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoaForm.code || !newCoaForm.name) {
      alert('Isi kode akun dan nama akun COA dengan lengkap');
      return;
    }

    const newCoa: ChartOfAccount = {
      id: `coa-${Date.now()}`,
      code: newCoaForm.code,
      name: newCoaForm.name,
      type: newCoaForm.type,
      balance: Number(newCoaForm.initialBalance) || 0,
    };

    if (onSaveCoa) {
      onSaveCoa(newCoa);
    }

    alert(`Akun COA baru (${newCoa.code} - ${newCoa.name}) berhasil didaftarkan!`);
    setIsAddCoaOpen(false);
    setNewCoaForm({
      code: '',
      name: '',
      type: 'Aktiva',
      initialBalance: 0,
    });
  };

  return (
    <div id="accounting-module" className="p-6 space-y-6">
      <PrintHeader
        title="LAPORAN AKUNTANSI, JURNAL UMUM & FINANCIAL STATEMENTS"
        subtitle="Chart of Accounts (COA), Buku Besar Jurnal, Laporan Laba Rugi (P&L) & Neraca Keuangan Perusahaan"
      />

      {/* Synchronized Realtime Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-md border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                Ter-sinkronisasi Realtime dengan Akun Bank & Modul Operasional
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Menyambungkan {registeredBanks.length} Rekening Perbankan, {financeTransactions.length} Transaksi Kas/Bank, dan {invoices.length} Invoices secara otomatis ke Jurnal Umum.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto text-xs">
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 font-mono flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{registeredBanks.length} Rekening Bank</span>
          </div>
          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 font-mono flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{allJournals.length} Entri Jurnal</span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
            isBalanceEqual
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isBalanceEqual ? 'Balance Seimbang' : 'Selisih Balance'}</span>
          </div>
        </div>
      </div>

      {/* Main Module Header & Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Accounting, Buku Besar & Laporan Keuangan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrasi Otomatis Chart of Accounts (COA), Jurnal Umum Double-Entry, Laporan Laba Rugi (P&L), & Neraca Keseimbangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'journal'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Jurnal Umum</span>
            </button>
            <button
              onClick={() => setActiveTab('coa')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'coa'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Chart of Accounts ({calculatedCoaList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Laba Rugi (P&L)</span>
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'balance'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Neraca Keuangan</span>
            </button>
          </div>

          <CetakPdfButton
            elementId="accounting-module"
            filename="Laporan_Keuangan_Akuntansi_Build_X_Pro.pdf"
            title="Laporan Akuntansi, Jurnal Umum & Financial Statements"
            variant="emerald"
            label="Cetak PDF"
          />
        </div>
      </div>

      {/* --- TAB 1: JURNAL UMUM (DOUBLE-ENTRY LEDGER) --- */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari no jurnal, akun, keterangan, ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-transparent border-none text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
                >
                  <option value="all">Semua Sumber Trx</option>
                  <option value="Kas/Bank Operasional">Modul Kas & Bank</option>
                  <option value="Invoice Proyek">Modul Invoices</option>
                  <option value="Manual">Jurnal Penyesuaian Manual</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsAddJournalOpen(true)}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jurnal Manual</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Buku Besar Jurnal Umum (Double-Entry Log)</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Menampilkan <strong className="text-slate-900">{filteredJournals.length}</strong> entri baris
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">No Jurnal</th>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Sumber System</th>
                    <th className="p-3.5">Kode Akun</th>
                    <th className="p-3.5">Nama Akun COA</th>
                    <th className="p-3.5">Keterangan / Deskripsi</th>
                    <th className="p-3.5 text-right">Debit (Rp)</th>
                    <th className="p-3.5 text-right">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJournals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada entri jurnal yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredJournals.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-amber-600">{j.journalNo}</td>
                        <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">{j.date}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              j.source === 'Kas/Bank Operasional'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : j.source === 'Invoice Proyek'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {j.source || 'Manual'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{j.accountCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">{j.accountName}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{j.description}</td>
                        <td className="p-3.5 text-right font-extrabold text-slate-900 font-mono">
                          {j.debit > 0 ? (
                            <span className="text-emerald-700">{formatRupiah(j.debit)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-slate-900 font-mono">
                          {j.credit > 0 ? (
                            <span className="text-indigo-700">{formatRupiah(j.credit)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredJournals.length > 0 && (
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono font-black text-xs text-slate-900">
                    <tr>
                      <td colSpan={6} className="p-3.5 text-right uppercase tracking-wider">
                        Total Balance Terkalkulasi:
                      </td>
                      <td className="p-3.5 text-right text-emerald-800 font-extrabold">
                        {formatRupiah(grandTotalDebit)}
                      </td>
                      <td className="p-3.5 text-right text-indigo-800 font-extrabold">
                        {formatRupiah(grandTotalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CHART OF ACCOUNTS (COA) --- */}
      {activeTab === 'coa' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode akun atau nama COA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => setIsAddCoaOpen(true)}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Master Akun COA</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between bg-slate-50/80">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Chart of Accounts (Daftar Master Kode Akun)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Total {calculatedCoaList.length} Akun Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">Kode Akun</th>
                    <th className="p-3.5">Nama Akun COA</th>
                    <th className="p-3.5">Klasifikasi Tipe</th>
                    <th className="p-3.5 text-right">Saldo Terkalkulasi Saat Ini (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedCoaList
                    .filter(
                      (c) =>
                        c.code.toLowerCase().includes(search.toLowerCase()) ||
                        c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.type.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((c) => (
                      <tr key={c.id || c.code} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-amber-600">{c.code}</td>
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span>{c.name}</span>
                          {c.code.startsWith('102') && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold border border-blue-200">
                              Rekening Bank
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              c.type === 'Aktiva'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : c.type === 'Kewajiban'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : c.type === 'Ekuitas'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : c.type === 'Pendapatan'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                          {formatRupiah(c.balance)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: LABA RUGI (PROFIT & LOSS) --- */}
      {activeTab === 'income' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="text-center border-b pb-4 space-y-1">
            <h3 className="font-extrabold text-xl text-slate-900 uppercase tracking-wide">
              LAPORAN LABA RUGI PERUSAHAAN (PROFIT & LOSS STATEMENT)
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {activeProfile.name} • PERIODE BERJALAN TAHUN 2026
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* PENDAPATAN */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase border-b pb-1.5 flex items-center justify-between">
                <span>PENDAPATAN OPERASIONAL & PENJUALAN</span>
                <span className="text-xs text-emerald-600 font-mono">CODE: 400-SERIES</span>
              </h4>
              {calculatedCoaList
                .filter((c) => c.type === 'Pendapatan')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700 font-medium">
                    <span>
                      {c.code} - {c.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(c.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-300">
                <span>TOTAL PENDAPATAN OPERASIONAL:</span>
                <span className="text-emerald-600 font-mono">{formatRupiah(totalPendapatan)}</span>
              </div>
            </div>

            {/* BEBAN OPERASIONAL */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase border-b pb-1.5 flex items-center justify-between">
                <span>BEBAN OPERASIONAL, HPP & PAYROLL</span>
                <span className="text-xs text-rose-600 font-mono">CODE: 500-SERIES</span>
              </h4>
              {calculatedCoaList
                .filter((c) => c.type === 'Beban')
                .map((c) => (
                  <div key={c.code} className="flex justify-between text-slate-700 font-medium">
                    <span>
                      {c.code} - {c.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(c.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-300">
                <span>TOTAL BEBAN OPERASIONAL:</span>
                <span className="text-rose-600 font-mono">{formatRupiah(totalBeban)}</span>
              </div>
            </div>

            {/* LABA BERSIH */}
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-emerald-500/20 border-2 border-amber-500/50 rounded-xl flex items-center justify-between font-black text-slate-900 text-base shadow-sm">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-600" />
                <span>ESTIMASI LABA BERSIH PERIODE BERJALAN:</span>
              </div>
              <span className={`font-mono text-lg ${labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatRupiah(labaBersih)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: NERACA KESEIMBANGAN (BALANCE SHEET) --- */}
      {activeTab === 'balance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b pb-4 space-y-1">
            <h3 className="font-extrabold text-xl text-slate-900 uppercase tracking-wide">
              LAPORAN NERACA KESEIMBANGAN (BALANCE SHEET)
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {activeProfile.name} • TAHUN BUKU 2026
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* AKTIVA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase border-b pb-2 flex items-center justify-between text-emerald-800">
                <span>AKTIVA (ASET PERUSAHAAN)</span>
                <span className="font-mono text-xs">ASSETS</span>
              </h4>

              <div className="space-y-2">
                {calculatedCoaList
                  .filter((c) => c.type === 'Aktiva')
                  .map((c) => (
                    <div key={c.code} className="flex justify-between text-slate-700 font-medium">
                      <span>{c.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(c.balance)}</span>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between font-black text-slate-900 text-sm pt-4 border-t border-slate-300">
                <span>TOTAL AKTIVA:</span>
                <span className="text-emerald-700 font-mono">{formatRupiah(totalAktiva)}</span>
              </div>
            </div>

            {/* PASSIVA (KEWAJIBAN & EKUITAS) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase border-b pb-2 flex items-center justify-between text-indigo-800">
                <span>PASSIVA (KEWAJIBAN & EKUITAS)</span>
                <span className="font-mono text-xs">LIABILITIES & EQUITY</span>
              </h4>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-amber-700">
                  1. Kewajiban (Hutang Usaha)
                </div>
                {calculatedCoaList
                  .filter((c) => c.type === 'Kewajiban')
                  .map((c) => (
                    <div key={c.code} className="flex justify-between text-slate-700 font-medium pl-2">
                      <span>{c.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(c.balance)}</span>
                    </div>
                  ))}

                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider text-blue-700 mt-3 pt-2 border-t border-slate-200">
                  2. Ekuitas (Modal & Laba)
                </div>
                {calculatedCoaList
                  .filter((c) => c.type === 'Ekuitas')
                  .map((c) => (
                    <div key={c.code} className="flex justify-between text-slate-700 font-medium pl-2">
                      <span>{c.name}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(c.balance)}</span>
                    </div>
                  ))}
                <div className="flex justify-between text-slate-700 font-medium pl-2 text-emerald-800">
                  <span>Laba Berjalan Tahun 2026</span>
                  <span className="font-mono font-bold">{formatRupiah(labaBersih)}</span>
                </div>
              </div>

              <div className="flex justify-between font-black text-slate-900 text-sm pt-4 border-t border-slate-300">
                <span>TOTAL PASSIVA:</span>
                <span className="text-indigo-700 font-mono">{formatRupiah(totalPassiva)}</span>
              </div>
            </div>
          </div>

          {/* Status Balance Check */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between font-extrabold text-sm ${
              isBalanceEqual
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                Status Keseimbangan Neraca (Aktiva vs Passiva):{' '}
                <span className="uppercase">{isBalanceEqual ? 'BALANCED / SEIMBANG 🟢' : 'SELISIH BALANCE 🔴'}</span>
              </span>
            </div>
            <div className="font-mono text-xs">
              Aktiva: {formatRupiah(totalAktiva)} | Passiva: {formatRupiah(totalPassiva)}
            </div>
          </div>
        </div>
      )}

      <PrintSignature note="Laporan Keuangan Resmi (Jurnal Umum, Laba Rugi & Neraca Keseimbangan)" />

      {/* MODAL: TAMBAH JURNAL MANUAL */}
      {isAddJournalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base uppercase flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Tambah Entri Jurnal Umum Manual
              </h3>
              <button
                onClick={() => setIsAddJournalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualJournal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={manualJournalForm.date}
                    onChange={(e) => setManualJournalForm({ ...manualJournalForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">No Ref / Dokumen</label>
                  <input
                    type="text"
                    required
                    value={manualJournalForm.refNo}
                    onChange={(e) => setManualJournalForm({ ...manualJournalForm, refNo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan Jurnal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penyesuaian Beban Sewa Alat Berat atau Kas Utama..."
                  value={manualJournalForm.description}
                  onChange={(e) => setManualJournalForm({ ...manualJournalForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-emerald-700">Akun DEBIT (+)</label>
                  <select
                    value={manualJournalForm.debitAccountCode}
                    onChange={(e) => setManualJournalForm({ ...manualJournalForm, debitAccountCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {calculatedCoaList.map((c) => (
                      <option key={`d-${c.code}`} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-indigo-700">Akun KREDIT (-)</label>
                  <select
                    value={manualJournalForm.creditAccountCode}
                    onChange={(e) => setManualJournalForm({ ...manualJournalForm, creditAccountCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {calculatedCoaList.map((c) => (
                      <option key={`c-${c.code}`} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Nominal Transaksi (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={manualJournalForm.amount}
                  onChange={(e) => setManualJournalForm({ ...manualJournalForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-black text-amber-700"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddJournalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md transition"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH AKUN COA BARU */}
      {isAddCoaOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base uppercase flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Tambah Master Akun COA Baru
              </h3>
              <button
                onClick={() => setIsAddCoaOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoa} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Kode Akun COA</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 102-004 atau 504-001"
                  value={newCoaForm.code}
                  onChange={(e) => setNewCoaForm({ ...newCoaForm, code: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Nama Akun COA</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Danamon Giro atau Beban Pemeliharaan..."
                  value={newCoaForm.name}
                  onChange={(e) => setNewCoaForm({ ...newCoaForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Klasifikasi Tipe Akun</label>
                <select
                  value={newCoaForm.type}
                  onChange={(e) =>
                    setNewCoaForm({
                      ...newCoaForm,
                      type: e.target.value as 'Aktiva' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban',
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Aktiva">Aktiva (Asset)</option>
                  <option value="Kewajiban">Kewajiban (Liability)</option>
                  <option value="Ekuitas">Ekuitas (Equity)</option>
                  <option value="Pendapatan">Pendapatan (Revenue)</option>
                  <option value="Beban">Beban (Expense)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Saldo Awal Dasar (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={newCoaForm.initialBalance}
                  onChange={(e) => setNewCoaForm({ ...newCoaForm, initialBalance: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddCoaOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-md transition"
                >
                  Daftarkan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
