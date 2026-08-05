import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  CreditCard,
  Copy,
  CheckCircle2,
  Trash2,
  Edit3,
  Search,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Download,
  Info,
  Printer,
  Wallet,
  CheckSquare,
  Square,
  SlidersHorizontal,
  PieChart,
  RotateCcw,
} from 'lucide-react';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { CompanyProfile, CompanyBank, FinanceTransaction, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface BankAccountsModuleProps {
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  transactions: FinanceTransaction[];
  currentRole: UserRole;
}

export const BankAccountsModule: React.FC<BankAccountsModuleProps> = ({
  companyProfile,
  onUpdateCompanyProfile,
  transactions,
  currentRole,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal State for Bank Account Detail
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<CompanyBank | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: 'Bank Mandiri',
    accountNumber: '',
    accountHolder: companyProfile.name,
    branch: '',
    initialBalance: 0,
  });

  // Modal State for Quick Saldo Edit
  const [editingBalanceBank, setEditingBalanceBank] = useState<CompanyBank | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('0');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyAccount = (accNo: string, id: string) => {
    navigator.clipboard.writeText(accNo);
    setCopiedId(id);
    showToast(`Nomor Rekening ${accNo} berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to compute base/initial balance of a bank
  const getBankBaseBalance = (bankOrName: CompanyBank | string): number => {
    if (typeof bankOrName === 'object') {
      if (bankOrName.initialBalance !== undefined) return bankOrName.initialBalance;
      return 0;
    } else {
      const foundBank = companyProfile.banks.find(
        (b) => b.bankName.toLowerCase() === bankOrName.toLowerCase() || b.id === bankOrName
      );
      if (foundBank && foundBank.initialBalance !== undefined) {
        return foundBank.initialBalance;
      }
      return 0;
    }
  };

  // Compute calculated balance per bank account based on transactions
  const getBankBalance = (bankOrName: CompanyBank | string) => {
    const bankName = typeof bankOrName === 'object' ? bankOrName.bankName : bankOrName;
    const bankTrx = transactions.filter(
      (t) =>
        t.account.toLowerCase().includes(bankName.toLowerCase()) ||
        bankName.toLowerCase().includes(t.account.toLowerCase())
    );
    const totalIn = bankTrx
      .filter((t) => t.type === 'Cash In')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalOut = bankTrx
      .filter((t) => t.type === 'Cash Out')
      .reduce((acc, t) => acc + t.amount, 0);

    const baseBalance = getBankBaseBalance(bankOrName);
    return baseBalance + totalIn - totalOut;
  };

  // Get total mutasi (Cash In / Cash Out) per bank account
  const getBankMutasi = (bankName: string) => {
    const bankTrx = transactions.filter(
      (t) =>
        t.account.toLowerCase().includes(bankName.toLowerCase()) ||
        bankName.toLowerCase().includes(t.account.toLowerCase())
    );
    const totalIn = bankTrx
      .filter((t) => t.type === 'Cash In')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalOut = bankTrx
      .filter((t) => t.type === 'Cash Out')
      .reduce((acc, t) => acc + t.amount, 0);
    return { totalIn, totalOut, netMutasi: totalIn - totalOut };
  };

  const handleOpenModal = (bank?: CompanyBank) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
        branch: bank.branch,
        initialBalance: getBankBaseBalance(bank),
      });
    } else {
      setEditingBank(null);
      setBankForm({
        bankName: 'Bank Mandiri',
        accountNumber: '',
        accountHolder: companyProfile.name,
        branch: 'KCU Utama',
        initialBalance: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditBalance = (bank: CompanyBank) => {
    setEditingBalanceBank(bank);
    setNewBalanceInput(getBankBaseBalance(bank).toString());
  };

  const handleSaveBalanceOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalanceBank) return;

    const parsedVal = parseFloat(newBalanceInput.replace(/[^0-9.-]/g, '')) || 0;
    if (parsedVal < 0) {
      alert('Masukkan nominal saldo awal yang valid (>= 0)');
      return;
    }

    const updatedBanks = companyProfile.banks.map((b) =>
      b.id === editingBalanceBank.id ? { ...b, initialBalance: parsedVal } : b
    );

    onUpdateCompanyProfile({ ...companyProfile, banks: updatedBanks });
    showToast(`Saldo awal rekening ${editingBalanceBank.bankName} (${editingBalanceBank.accountNumber}) berhasil diperbarui.`);
    setEditingBalanceBank(null);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.accountNumber || !bankForm.accountHolder) return;

    const bankPayload = {
      ...bankForm,
      initialBalance: Number(bankForm.initialBalance) || 0,
    };

    let updatedBanks: CompanyBank[];
    if (editingBank) {
      updatedBanks = companyProfile.banks.map((b) =>
        b.id === editingBank.id ? { ...b, ...bankPayload } : b
      );
      showToast('Data Rekening Bank & Saldo Awal berhasil diperbarui.');
    } else {
      const newBank: CompanyBank = {
        id: `bank-${Date.now()}`,
        ...bankPayload,
      };
      updatedBanks = [...companyProfile.banks, newBank];
      showToast('Rekening Bank Perusahaan baru berhasil ditambahkan.');
    }

    onUpdateCompanyProfile({ ...companyProfile, banks: updatedBanks });
    setIsModalOpen(false);
  };

  const handleDeleteBank = (id: string, bankName: string) => {
    if (companyProfile.banks.length <= 1) {
      alert('Sistem harus memiliki minimal 1 Rekening Bank Utama.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus rekening ${bankName}?`)) {
      const updatedBanks = companyProfile.banks.filter((b) => b.id !== id);
      onUpdateCompanyProfile({ ...companyProfile, banks: updatedBanks });
      showToast(`Rekening ${bankName} berhasil dihapus.`);
    }
  };

  // State for selecting which registered banks are included in the combined balance calculation
  const [selectedBanksForTotal, setSelectedBanksForTotal] = useState<string[]>(() =>
    companyProfile.banks.map((b) => b.id)
  );
  const [showTotalConfig, setShowTotalConfig] = useState<boolean>(false);

  // Sync selected bank IDs if companyProfile.banks changes
  useEffect(() => {
    const validIds = companyProfile.banks.map((b) => b.id);
    setSelectedBanksForTotal((prev) => {
      const filteredPrev = prev.filter((id) => validIds.includes(id));
      const newIds = validIds.filter((id) => !prev.includes(id));
      return [...filteredPrev, ...newIds];
    });
  }, [companyProfile.banks]);

  // Combined Balance calculations
  const selectedBanksList = companyProfile.banks.filter((b) =>
    selectedBanksForTotal.includes(b.id)
  );

  const totalCombinedBalance = selectedBanksList.reduce(
    (sum, bank) => sum + getBankBalance(bank.bankName),
    0
  );

  const grandTotalAllBanks = companyProfile.banks.reduce(
    (sum, bank) => sum + getBankBalance(bank.bankName),
    0
  );

  const handleToggleBankSelection = (id: string) => {
    if (selectedBanksForTotal.includes(id)) {
      if (selectedBanksForTotal.length === 1) {
        showToast('Minimal 1 rekening harus dipilih untuk perhitungan saldo gabungan.');
        return;
      }
      setSelectedBanksForTotal(selectedBanksForTotal.filter((item) => item !== id));
    } else {
      setSelectedBanksForTotal([...selectedBanksForTotal, id]);
    }
  };

  const handleSelectAllBanks = () => {
    setSelectedBanksForTotal(companyProfile.banks.map((b) => b.id));
  };

  const isSuperAdmin = currentRole === 'Super Admin' || currentRole === 'Direktur Utama' || currentRole === 'Finance';

  return (
    <div id="bank-accounts-module" className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <PrintHeader
        title="LAPORAN MASTER AKUN BANK & SALDO KAS RESMI"
        subtitle={`Daftar Rekening Bank Perusahaan ${companyProfile.name} & Informasi Transfer Pembayaran`}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border border-blue-500/30 mb-2">
              <Landmark className="w-3.5 h-3.5" /> Modul HR & Keuangan Perusahaan
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              Kelola Akun Bank Perusahaan
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Daftar rekening resmi {companyProfile.name} untuk operasional penerimaan termijn proyek, pembayaran vendor, & payroll karyawan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CetakPdfButton
              elementId="bank-accounts-module"
              filename="Akun_Bank_Perusahaan_Build_X_Pro.pdf"
              title="Laporan Master Akun Bank & Saldo Kas Resmi"
              variant="emerald"
            />
            <button
              onClick={() => handleOpenModal()}
              disabled={!isSuperAdmin}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Tambah Rekening Bank
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 p-5 rounded-2xl border border-emerald-700/50 shadow-md text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider">Saldo Gabungan Perbankan</span>
            <p className="text-xl font-black text-emerald-400 mt-1 font-mono">{formatRupiah(totalCombinedBalance)}</p>
            <span className="text-[10px] text-slate-300 font-semibold">{selectedBanksForTotal.length} dari {companyProfile.banks.length} Rekening Terpilih</span>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Total Rekening Resmi</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{companyProfile.banks.length} Rekening</p>
            <span className="text-[10px] text-blue-600 font-semibold">Terverifikasi Legalitas PT</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Perusahaan Pemilik</span>
            <p className="text-base font-extrabold text-slate-900 mt-1 truncate max-w-[180px]">{companyProfile.name}</p>
            <span className="text-[10px] text-slate-500 font-mono">NPWP: {companyProfile.npwp}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Akses Otorisasi</span>
            <p className="text-base font-extrabold text-slate-900 mt-1">{currentRole}</p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Hak Izin Keuangan
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Saldo Gabungan Detail & Interactive Breakdown Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-200">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight">
                  Saldo Gabungan Rekening Perbankan Perusahaan
                </h3>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                  Consolidated Cash
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total akumulasi saldo kas siap pakai dari seluruh rekening resmi terdaftar PT {companyProfile.name}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowTotalConfig(!showTotalConfig)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 transition"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              {showTotalConfig ? 'Sembunyikan Opsi Rekening' : 'Pilih Rekening Gabungan'}
            </button>
            <button
              onClick={handleSelectAllBanks}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-200 flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pilih Semua
            </button>
          </div>
        </div>

        {/* Total Display Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-800/40 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 space-y-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
              TOTAL SALDO KAS GABUNGAN ({selectedBanksList.length} REKENING TERPILIH)
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-center gap-2">
              {formatRupiah(totalCombinedBalance)}
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Grand total seluruh {companyProfile.banks.length} rekening registered: <strong className="text-emerald-300 font-mono">{formatRupiah(grandTotalAllBanks)}</strong>
            </p>
          </div>

          {/* Bank Toggles */}
          <div className="relative z-10 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {companyProfile.banks.map((bank) => {
                const isSelected = selectedBanksForTotal.includes(bank.id);
                const bankBal = getBankBalance(bank.bankName);
                return (
                  <button
                    key={bank.id}
                    onClick={() => handleToggleBankSelection(bank.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-xs'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>{bank.bankName}</span>
                    <span className="font-mono text-[11px] text-emerald-300">({formatRupiah(bankBal)})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Breakdown by Bank Account */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 uppercase tracking-wide">
              <PieChart className="w-4 h-4 text-emerald-600" /> Distribusi Kontribusi Saldo
            </span>
            <span className="text-slate-500 font-normal">
              Persentase proporsi terhadap total gabungan Rp {formatRupiah(totalCombinedBalance)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedBanksList.map((bank) => {
              const bal = getBankBalance(bank);
              const baseBal = getBankBaseBalance(bank);
              const percentage = totalCombinedBalance > 0 ? ((bal / totalCombinedBalance) * 100).toFixed(1) : '0';

              return (
                <div key={bank.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:bg-slate-100/80 transition group relative">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-900 text-xs">{bank.bankName}</span>
                      <div className="flex items-center gap-1.5">
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleOpenEditBalance(bank)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md transition"
                            title="Edit Saldo Awal Rekening"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="text-base font-black text-slate-900 font-mono">{formatRupiah(bal)}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Saldo Awal: <span className="font-semibold text-slate-700">{formatRupiah(baseBal)}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, Number(percentage)))}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span className="truncate max-w-[120px]">{bank.accountNumber}</span>
                      <span className="truncate">{bank.branch || 'KCU Utama'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bank Account Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
            Daftar Rekening Bank Operasional
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Klik tombol Edit Saldo untuk memperbarui saldo awal rekening
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companyProfile.banks.map((bank, index) => {
            const calculatedBalance = getBankBalance(bank);
            const baseBalance = getBankBaseBalance(bank);
            const mutasi = getBankMutasi(bank.bankName);
            const isMandiri = bank.bankName.toLowerCase().includes('mandiri');
            const isBca = bank.bankName.toLowerCase().includes('bca');
            const isBni = bank.bankName.toLowerCase().includes('bni');

            return (
              <div
                key={bank.id}
                className={`relative rounded-2xl p-6 text-white shadow-xl transition-transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[240px] ${
                  isMandiri
                    ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 border border-blue-700/50'
                    : isBca
                    ? 'bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-950 border border-cyan-700/50'
                    : isBni
                    ? 'bg-gradient-to-br from-orange-900 via-amber-900 to-slate-950 border border-amber-700/50'
                    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700'
                }`}
              >
                {/* Bank Card Watermark Circle */}
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none"></div>

                {/* Top Row: Bank Badge & Actions */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-white text-sm border border-white/20 shadow">
                      {bank.bankName.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-base tracking-tight text-white">{bank.bankName}</h4>
                      <p className="text-[10px] text-white/70 uppercase tracking-wider font-mono">
                        {bank.branch || 'KCU Utama'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-xl p-1 border border-white/15">
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleOpenEditBalance(bank)}
                        className="px-2 py-1 bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 border border-emerald-400/40 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                        title="Edit Saldo Rekening"
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit Saldo</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(bank)}
                      disabled={!isSuperAdmin}
                      className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                      title="Edit Detail Rekening"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {isSuperAdmin && companyProfile.banks.length > 1 && (
                      <button
                        onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                        className="p-1.5 text-white/60 hover:text-rose-400 hover:bg-white/10 rounded-lg transition"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Middle Row: Account Number */}
                <div className="my-3 relative z-10">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 block mb-0.5">
                    Nomor Rekening
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-extrabold tracking-widest text-white">
                      {bank.accountNumber}
                    </span>
                    <button
                      onClick={() => handleCopyAccount(bank.accountNumber, bank.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition flex items-center gap-1 text-[10px]"
                      title="Salin No Rekening"
                    >
                      {copiedId === bank.id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Account Holder, Saldo Awal & Estimated Balance */}
                <div className="pt-3 border-t border-white/10 relative z-10 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-semibold text-white/60 block uppercase">Atas Nama (Owner)</span>
                      <span className="font-bold text-white uppercase text-[11px]">{bank.accountHolder}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-semibold text-white/60 block uppercase">Saldo Awal (Base)</span>
                      <span className="font-mono font-extrabold text-white/90 text-xs">
                        {formatRupiah(baseBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/10 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-300 block">Total Saldo Akhir Berjalan:</span>
                      <span className="font-mono font-black text-emerald-300 text-sm">
                        {formatRupiah(calculatedBalance)}
                      </span>
                    </div>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleOpenEditBalance(bank)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-[10px] transition flex items-center gap-1 border border-white/10"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-300" /> Edit Saldo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank Transactions Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
              Riwayat Mutasi & Voucher Transaksi Terkait Rekening
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan seluruh pencatatan Cash In & Cash Out dari modul Finance yang menggunakan akun bank ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Rekening:</span>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">Semua Akun Bank ({transactions.length} TRX)</option>
              {companyProfile.banks.map((b) => (
                <option key={b.id} value={b.bankName}>
                  {b.bankName} - {b.accountNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nomor TRX</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Akun Bank</th>
                <th className="py-3 px-4">Jenis TRX</th>
                <th className="py-3 px-4">Kategori & Keterangan</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions
                .filter((t) =>
                  selectedBankId === 'ALL'
                    ? true
                    : t.account.toLowerCase().includes(selectedBankId.toLowerCase()) ||
                      selectedBankId.toLowerCase().includes(t.account.toLowerCase())
                )
                .map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{trx.trxNo}</td>
                    <td className="py-3 px-4 text-slate-500">{trx.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{trx.account}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          trx.type === 'Cash In'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {trx.type === 'Cash In' ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        )}
                        {trx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{trx.category}</div>
                      <div className="text-[11px] text-slate-500">{trx.description}</div>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-black font-mono ${
                        trx.type === 'Cash In' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {trx.type === 'Cash In' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <PrintSignature note="Laporan Rekening Perusahaan & Saldo Kas Perbankan" />

      {/* Quick Edit Saldo Modal */}
      {editingBalanceBank && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase">
                    Edit Saldo Rekening Bank
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingBalanceBank.bankName} • {editingBalanceBank.accountNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingBalanceBank(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBalanceOnly} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Pemilik Rekening:</span>
                  <span className="font-bold text-slate-900">{editingBalanceBank.accountHolder}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Kantor Cabang:</span>
                  <span className="font-bold text-slate-900">{editingBalanceBank.branch || 'KCU Utama'}</span>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-800 mb-1 uppercase text-[10px] tracking-wider">
                  Nominal Saldo Awal / Pembukaan Rekening (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={newBalanceInput}
                    onChange={(e) => setNewBalanceInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-black text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Saldo awal ini akan dijumlahkan dengan total mutasi kas masuk/keluar pada rekening.
                </p>
              </div>

              {/* Realtime Breakdown */}
              {(() => {
                const mutasi = getBankMutasi(editingBalanceBank.bankName);
                const baseVal = Number(newBalanceInput) || 0;
                const totalProj = baseVal + mutasi.netMutasi;

                return (
                  <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2 text-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center justify-between">
                      <span>Kalkulasi Saldo Akhir Berjalan</span>
                      <span className="font-mono">{editingBalanceBank.bankName}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-600">Saldo Awal Baru:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(baseVal)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-600">Total Cash In (Masuk):</span>
                      <span className="font-bold text-emerald-600">+{formatRupiah(mutasi.totalIn)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-600">Total Cash Out (Keluar):</span>
                      <span className="font-bold text-rose-600">-{formatRupiah(mutasi.totalOut)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-sm font-black border-t border-emerald-200 pt-1.5 text-emerald-950">
                      <span>Proyeksi Saldo Akhir:</span>
                      <span className="text-emerald-700">{formatRupiah(totalProj)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBalanceBank(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Account Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm uppercase">
                {editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bank Resmi</label>
                <select
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 bg-slate-50"
                >
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank BRI">Bank BRI</option>
                  <option value="Bank Syariah Indonesia">Bank Syariah Indonesia (BSI)</option>
                  <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                  <option value="Bank Permata">Bank Permata</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rekening Bank</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 122-00-0988776-5"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atas Nama (Pemilik Rekening)</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kantor Cabang / KCU</label>
                <input
                  type="text"
                  placeholder="Contoh: KCP Sudirman Plaza Jakarta"
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Saldo Awal / Modal Dasar Rekening (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={bankForm.initialBalance}
                  onChange={(e) => setBankForm({ ...bankForm, initialBalance: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-700 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
