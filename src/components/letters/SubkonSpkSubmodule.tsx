import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  AlertCircle,
  FileCheck2,
  Download,
  X,
  Sparkles,
  ChevronRight,
  BadgePercent,
  Check,
  Eye,
} from 'lucide-react';
import {
  SubkonContract,
  SubkonOpname,
  Project,
  CompanyProfile,
  LetterheadSettings,
  AppNotification,
} from '../../types';
import { formatRupiah, terbilangRupiah, formatDate, formatFullDateIndonesian } from '../../utils/formatters';
import { PrintHeader } from '../common/PrintHeader';
import { PrintSignature } from '../common/PrintSignature';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { triggerPrintFallback } from '../../utils/pdfGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { saveAs } from 'file-saver';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

interface SubkonSpkSubmoduleProps {
  companyProfile: CompanyProfile;
  letterhead?: LetterheadSettings;
  projects: Project[];
  subkonContracts: SubkonContract[];
  subkonOpnames: SubkonOpname[];
  onSaveSubkonContract: (contract: SubkonContract) => void;
  onDeleteSubkonContract: (id: string) => void;
  onSaveSubkonOpname: (opname: SubkonOpname) => void;
  onDeleteSubkonOpname: (id: string) => void;
  onTriggerNotification?: (notif: Partial<AppNotification>) => void;
}

export const SubkonSpkSubmodule: React.FC<SubkonSpkSubmoduleProps> = ({
  companyProfile,
  letterhead,
  projects = [],
  subkonContracts = [],
  subkonOpnames = [],
  onSaveSubkonContract,
  onDeleteSubkonContract,
  onSaveSubkonOpname,
  onDeleteSubkonOpname,
  onTriggerNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'CONTRACTS' | 'OPNAME' | 'RETENTION'>('CONTRACTS');
  const [search, setSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');

  // Modal States
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Partial<SubkonContract> | null>(null);

  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [editingOpname, setEditingOpname] = useState<Partial<SubkonOpname> | null>(null);

  // Print Preview Modals
  const [selectedContractForPrint, setSelectedContractForPrint] = useState<SubkonContract | null>(null);
  const [selectedOpnameForPrint, setSelectedOpnameForPrint] = useState<{ opname: SubkonOpname; contract: SubkonContract } | null>(null);

  // Filtered Contracts
  const filteredContracts = subkonContracts.filter((c) => {
    const matchesSearch =
      c.spkNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.subkonName.toLowerCase().includes(search.toLowerCase()) ||
      c.workScope.toLowerCase().includes(search.toLowerCase());
    const matchesProject = selectedProjectFilter === 'ALL' || c.projectId === selectedProjectFilter;
    return matchesSearch && matchesProject;
  });

  // Calculate Metrics
  const totalContractValue = subkonContracts.reduce((acc, c) => acc + c.contractValue, 0);
  const totalOpnameGross = subkonOpnames.reduce((acc, o) => acc + o.grossAmount, 0);
  const totalRetentionHeld = subkonOpnames.reduce((acc, o) => acc + o.retentionDeduction, 0);
  const totalNetPaid = subkonOpnames.reduce((acc, o) => acc + o.netAmount, 0);

  // Retention Ready to Release (Contracts in 'Masa Pemeliharaan')
  const maintenanceContracts = subkonContracts.filter((c) => c.status === 'Masa Pemeliharaan');
  const retentionReadyToRelease = maintenanceContracts.reduce((acc, c) => {
    const contractOpnames = subkonOpnames.filter((o) => o.subkonContractId === c.id);
    const contractRetention = contractOpnames.reduce((sum, o) => sum + o.retentionDeduction, 0);
    return acc + contractRetention;
  }, 0);

  // DOCX Export Function for SPK Borongan
  const handleExportSpkDocx = async (contract: SubkonContract) => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
              },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: companyProfile.name, bold: true, size: 28, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${companyProfile.address || ''}, ${companyProfile.city || ''} | Telp: ${companyProfile.phone || ''} | Email: ${companyProfile.email || ''}`,
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '_________________________________________________________________________________', size: 16, color: '0F172A' }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'SURAT PERINTAH KERJA (SPK BORONGAN)', bold: true, size: 24 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Nomor: ${contract.spkNumber}`, bold: true, size: 20 }),
                ],
                spacing: { after: 250 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Pada hari ini, ${formatFullDateIndonesian(contract.startDate)}, bertempat di ${companyProfile.city || 'Jakarta'}, kami yang bertanda tangan di bawah ini secara sah dan sadar membuat Perjanjian Surat Perintah Kerja (SPK) Borongan:`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: 'PIHAK PERTAMA (Pemberi Kerja):', bold: true, size: 18 })] }),
                          new Paragraph({ children: [new TextRun({ text: companyProfile.name, bold: true, size: 18 })] }),
                          new Paragraph({ children: [new TextRun({ text: `Perwakilan: ${companyProfile.directorName || 'Direktur Utama'}`, size: 18 })] }),
                          new Paragraph({ children: [new TextRun({ text: `Alamat: ${companyProfile.address}`, size: 18 })] }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: 'PIHAK KEDUA (Subkontraktor):', bold: true, size: 18 })] }),
                          new Paragraph({ children: [new TextRun({ text: contract.subkonName, bold: true, size: 18 })] }),
                          new Paragraph({ children: [new TextRun({ text: `Penanggung Jawab: ${contract.subkonContact || '-'}`, size: 18 })] }),
                          new Paragraph({ children: [new TextRun({ text: `Nama Proyek: ${contract.projectName}`, size: 18 })] }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { after: 200 } }),
              new Paragraph({
                children: [new TextRun({ text: 'PASAL 1: LINGKUP PEKERJAAN BORONGAN & LOKASI PROYEK', bold: true, size: 20 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `PIHAK PERTAMA memberikan perintah kerja borongan kepada PIHAK KEDUA untuk melaksanakan lingkup pekerjaan: ${contract.workScope} pada proyek ${contract.projectName}.`,
                    size: 20,
                  }),
                ],
                spacing: { after: 150 },
              }),
              new Paragraph({
                children: [new TextRun({ text: 'PASAL 2: HARGA BORONGAN & SKEMA PEMBAYARAN', bold: true, size: 20 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `1. Total Nilai Pekerjaan Borongan disepakati sebesar ${formatRupiah(contract.contractValue)} (${terbilangRupiah(contract.contractValue)}).\n2. Pembayaran bertahap sesuai Berita Acara Opname Progress Fisik Lapangan.\n3. Setiap pencairan dipotong Jaminan Retensi Pemeliharaan sebesar ${contract.retentionPct}% dari nilai opname bruto.`,
                    size: 20,
                  }),
                ],
                spacing: { after: 150 },
              }),
              new Paragraph({
                children: [new TextRun({ text: 'PASAL 3: JANGKA WAKTU & MASA PEMELIHARAAN (GARANSI)', bold: true, size: 20 })],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `1. Pelaksanaan pekerjaan berlaku tanggal ${formatDate(contract.startDate)} s.d ${formatDate(contract.endDate)}.\n2. Masa Garansi Pemeliharaan berlaku selama ${contract.maintenancePeriodDays} Hari Kalender pasca BAST-1 Selesai 100%.\n3. Dana Retensi (${contract.retentionPct}%) dicairkan 100% setelah Masa Pemeliharaan berakhir tanpa kerusakan fisik.`,
                    size: 20,
                  }),
                ],
                spacing: { after: 300 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PIHAK PERTAMA', bold: true, size: 18 })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: companyProfile.name, size: 16 })] }),
                          new Paragraph({ text: '', spacing: { after: 800 } }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: companyProfile.directorName || 'Direktur Utama', bold: true, size: 18 })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: companyProfile.directorTitle || 'Pemberi Kerja', size: 16 })] }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'PIHAK KEDUA', bold: true, size: 18 })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: contract.subkonName, size: 16 })] }),
                          new Paragraph({ text: '', spacing: { after: 800 } }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: contract.subkonContact || 'Subkontraktor / Mandor', bold: true, size: 18 })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Penanggung Jawab Subkon', size: 16 })] }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SPK-Borongan-${contract.spkNumber}.docx`);
    } catch (err) {
      console.error('Failed to export SPK DOCX:', err);
    }
  };

  // DOCX Export Function for BAST Opname
  const handleExportOpnameDocx = async (opname: SubkonOpname, contract: SubkonContract) => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
              },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: companyProfile.name, bold: true, size: 28, color: '0F172A' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${companyProfile.address || ''}, ${companyProfile.city || ''} | Telp: ${companyProfile.phone || ''}`,
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '_________________________________________________________________________________', size: 16, color: '0F172A' }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'BERITA ACARA OPNAME PROGRESS FISIK (BAST OPNAME)', bold: true, size: 22 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `Nomor: ${opname.opnameNumber}`, bold: true, size: 20 })],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Subkontraktor: ${contract.subkonName}\nProyek: ${contract.projectName}\nNo. SPK Induk: ${contract.spkNumber}\nPeriode: ${opname.period} (${formatDate(opname.opnameDate)})`,
                    size: 20,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Rincian Perhitungan Opname', bold: true, size: 18 })] })] }),
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Nilai Nominal (Rp)', bold: true, size: 18 })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Nilai Kontrak SPK Borongan', size: 18 })] })] }),
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatRupiah(contract.contractValue), bold: true, size: 18 })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Progress Akumulasi Lapangan (${opname.progressPct}%)`, size: 18 })] })] }),
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatRupiah(opname.grossAmount), bold: true, size: 18 })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Potongan Jaminan Retensi (${contract.retentionPct}%)`, size: 18 })] })] }),
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `-${formatRupiah(opname.retentionDeduction)}`, size: 18 })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'NET TAGIHAN DIBAYARKAN', bold: true, size: 18 })] })] }),
                      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatRupiah(opname.netAmount), bold: true, size: 18 })] })] }),
                    ],
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { after: 200 } }),
              new Paragraph({
                children: [new TextRun({ text: `Terbilang: ${terbilangRupiah(opname.netAmount)}`, italics: true, size: 18 })],
                spacing: { after: 300 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Site Manager / Inspector', bold: true, size: 18 })] }),
                          new Paragraph({ text: '', spacing: { after: 800 } }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: opname.supervisorName || companyProfile.directorName, bold: true, size: 18 })] }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Subkontraktor / Mandor', bold: true, size: 18 })] }),
                          new Paragraph({ text: '', spacing: { after: 800 } }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: contract.subkonName, bold: true, size: 18 })] }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `BAST-Opname-${opname.opnameNumber}.docx`);
    } catch (err) {
      console.error('Failed to export Opname DOCX:', err);
    }
  };

  // Handle Save Contract
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract || !editingContract.spkNumber || !editingContract.subkonName) return;

    const proj = projects.find((p) => p.id === editingContract.projectId);
    const contractToSave: SubkonContract = {
      id: editingContract.id || 'subkon-' + Date.now(),
      spkNumber: editingContract.spkNumber,
      subkonName: editingContract.subkonName,
      subkonContact: editingContract.subkonContact || '',
      projectId: editingContract.projectId || projects[0]?.id || 'prj-001',
      projectName: proj ? proj.name : editingContract.projectName || 'Proyek Umum',
      workScope: editingContract.workScope || '',
      contractValue: Number(editingContract.contractValue) || 0,
      startDate: editingContract.startDate || new Date().toISOString().split('T')[0],
      endDate: editingContract.endDate || new Date().toISOString().split('T')[0],
      retentionPct: Number(editingContract.retentionPct) || 5,
      dpPct: Number(editingContract.dpPct) || 0,
      dpAmount: (Number(editingContract.contractValue) * (Number(editingContract.dpPct) || 0)) / 100,
      maintenancePeriodDays: Number(editingContract.maintenancePeriodDays) || 90,
      status: editingContract.status || 'Aktif',
      notes: editingContract.notes || '',
      createdAt: editingContract.createdAt || new Date().toISOString(),
    };

    onSaveSubkonContract(contractToSave);
    setIsContractModalOpen(false);
    setEditingContract(null);
  };

  // Open New Opname Modal for a specific contract
  const handleOpenNewOpname = (contract: SubkonContract) => {
    const existingOpnames = subkonOpnames.filter((o) => o.subkonContractId === contract.id);
    const latestOpname = existingOpnames[existingOpnames.length - 1];
    const prevProgress = latestOpname ? latestOpname.progressPct : 0;
    const defaultCurrentProgress = Math.min(prevProgress + 20, 100);
    const progressDiff = defaultCurrentProgress - prevProgress;

    const gross = (contract.contractValue * progressDiff) / 100;
    const retention = (gross * (contract.retentionPct || 5)) / 100;
    const dpRecovery = contract.dpAmount ? (gross * (contract.dpPct || 0)) / 100 : 0;
    const net = gross - retention - dpRecovery;

    setEditingOpname({
      subkonContractId: contract.id,
      opnameNumber: `OPN-00${existingOpnames.length + 1}/${contract.spkNumber}`,
      opnameDate: new Date().toISOString().split('T')[0],
      period: `Opname Progress Ke-${existingOpnames.length + 1}`,
      progressPct: defaultCurrentProgress,
      previousProgressPct: prevProgress,
      currentProgressPct: progressDiff,
      grossAmount: gross,
      retentionDeduction: retention,
      dpDeduction: dpRecovery,
      netAmount: net,
      supervisorName: companyProfile.directorName || 'Site Manager',
      status: 'Approved',
      notes: `Opname pengerjaan fisik lapangan ${progressDiff}% periode ini.`,
    });
    setIsOpnameModalOpen(true);
  };

  // Handle Opname Progress Change recalculation
  const handleOpnameProgressChange = (newAccPct: number) => {
    if (!editingOpname || !editingOpname.subkonContractId) return;
    const contract = subkonContracts.find((c) => c.id === editingOpname.subkonContractId);
    if (!contract) return;

    const prevPct = editingOpname.previousProgressPct || 0;
    const currentDiff = Math.max(0, newAccPct - prevPct);
    const gross = (contract.contractValue * currentDiff) / 100;
    const retention = (gross * (contract.retentionPct || 5)) / 100;
    const dpRecovery = contract.dpAmount ? (gross * (contract.dpPct || 0)) / 100 : 0;
    const net = gross - retention - dpRecovery;

    setEditingOpname({
      ...editingOpname,
      progressPct: newAccPct,
      currentProgressPct: currentDiff,
      grossAmount: gross,
      retentionDeduction: retention,
      dpDeduction: dpRecovery,
      netAmount: net,
    });
  };

  // Handle Save Opname
  const handleSaveOpname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpname || !editingOpname.subkonContractId || !editingOpname.opnameNumber) return;

    const opnameToSave: SubkonOpname = {
      id: editingOpname.id || 'opn-' + Date.now(),
      subkonContractId: editingOpname.subkonContractId,
      opnameNumber: editingOpname.opnameNumber,
      opnameDate: editingOpname.opnameDate || new Date().toISOString().split('T')[0],
      period: editingOpname.period || 'Progress Lapangan',
      progressPct: Number(editingOpname.progressPct) || 0,
      previousProgressPct: Number(editingOpname.previousProgressPct) || 0,
      currentProgressPct: Number(editingOpname.currentProgressPct) || 0,
      grossAmount: Number(editingOpname.grossAmount) || 0,
      retentionDeduction: Number(editingOpname.retentionDeduction) || 0,
      dpDeduction: Number(editingOpname.dpDeduction) || 0,
      netAmount: Number(editingOpname.netAmount) || 0,
      notes: editingOpname.notes || '',
      supervisorName: editingOpname.supervisorName || 'Site Manager',
      status: editingOpname.status || 'Approved',
      createdAt: editingOpname.createdAt || new Date().toISOString(),
    };

    onSaveSubkonOpname(opnameToSave);

    // If progress reaches 100%, option to update contract status to 'Masa Pemeliharaan'
    const parentContract = subkonContracts.find((c) => c.id === opnameToSave.subkonContractId);
    if (parentContract && opnameToSave.progressPct >= 100 && parentContract.status === 'Aktif') {
      onSaveSubkonContract({
        ...parentContract,
        status: 'Masa Pemeliharaan',
      });
      if (onTriggerNotification) {
        onTriggerNotification({
          type: 'SYSTEM',
          title: `Pekerjaan Subkon ${parentContract.subkonName} 100% Selesai`,
          message: `Kontrak SPK ${parentContract.spkNumber} telah mencapai 100% dan masuk Masa Pemeliharaan (${parentContract.maintenancePeriodDays} hari).`,
          priority: 'high',
          targetRoles: ['Direktur Utama', 'Project Manager', 'Finance'],
        });
      }
    }

    setIsOpnameModalOpen(false);
    setEditingOpname(null);
  };

  // Release Retention Action
  const handleReleaseRetention = (contract: SubkonContract) => {
    const contractOpnames = subkonOpnames.filter((o) => o.subkonContractId === contract.id);
    const totalRetention = contractOpnames.reduce((sum, o) => sum + o.retentionDeduction, 0);

    if (window.confirm(`Konfirmasi pencairan dana retensi sebesar ${formatRupiah(totalRetention)} untuk ${contract.subkonName}?`)) {
      onSaveSubkonContract({
        ...contract,
        status: 'Selesai',
      });

      if (onTriggerNotification) {
        onTriggerNotification({
          type: 'CASHFLOW',
          title: `Pencairan Retention Subkon ${contract.subkonName}`,
          message: `Pencairan dana retensi garansi sebesar ${formatRupiah(totalRetention)} untuk ${contract.spkNumber} disetujui.`,
          priority: 'high',
          targetRoles: ['Direktur Utama', 'Finance', 'Accounting'],
          amount: totalRetention,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manajemen Kontrak Subkontraktor & Borongan</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Surat Perintah Kerja (SPK) Subkon & Opname Fisik
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Kelola kontrak kerja pemborong/subkon, perhitungan opname progress fisik lapangan, serta potongan & pencairan jaminan pemeliharaan (retensi 5%).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingContract({
                  spkNumber: `SPK-BOR-2026-00${subkonContracts.length + 1}`,
                  subkonName: '',
                  subkonContact: '',
                  projectId: projects[0]?.id || 'prj-001',
                  projectName: projects[0]?.name || '',
                  workScope: 'Pekerjaan Borongan ',
                  contractValue: 250000000,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
                  retentionPct: 5,
                  dpPct: 10,
                  maintenancePeriodDays: 90,
                  status: 'Aktif',
                });
                setIsContractModalOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition duration-150 transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat SPK Borongan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Nilai Kontrak Borongan</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{formatRupiah(totalContractValue)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{subkonContracts.length} SPK Subkon Terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Realisasi Opname Fisik</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-emerald-700">{formatRupiah(totalOpnameGross)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{subkonOpnames.length} Berita Acara Opname Verified</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Akumulasi Retensi Ditahan (5%)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <BadgePercent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-amber-700">{formatRupiah(totalRetentionHeld)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Jaminan Garansi Pemeliharaan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Retensi Siap Dicairkan</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-indigo-700">{formatRupiah(retentionReadyToRelease)}</p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">{maintenanceContracts.length} Kontrak Masuk Masa Pemeliharaan</p>
        </div>
      </div>

      {/* Submodule Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('CONTRACTS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'CONTRACTS'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kontrak SPK Borongan ({subkonContracts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OPNAME')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'OPNAME'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Opname Pekerjaan Fisik ({subkonOpnames.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RETENTION')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'RETENTION'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BadgePercent className="w-4 h-4" />
          <span>Pencairan Dana Retensi ({maintenanceContracts.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR KONTRAK SPK BORONGAN */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-4">
          {/* Search & Project Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No SPK, Subkon, atau Jenis Pekerjaan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Proyek:</span>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Proyek</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table SPK Subkon */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">No SPK & Subkon</th>
                    <th className="p-3.5">Proyek & Lingkup Pekerjaan</th>
                    <th className="p-3.5 text-right">Nilai SPK (Borongan)</th>
                    <th className="p-3.5 text-center">Retensi (%)</th>
                    <th className="p-3.5 text-center">Periode Garansi</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada kontrak SPK Subkontraktor yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => {
                      const contractOpnames = subkonOpnames.filter((o) => o.subkonContractId === c.id);
                      const latestOpname = contractOpnames[contractOpnames.length - 1];
                      const currentProgressPct = latestOpname ? latestOpname.progressPct : 0;
                      const totalRetention = contractOpnames.reduce((sum, o) => sum + o.retentionDeduction, 0);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] block w-fit mb-1">
                              {c.spkNumber}
                            </span>
                            <p className="font-bold text-slate-900">{c.subkonName}</p>
                            {c.subkonContact && <p className="text-[11px] text-slate-400">{c.subkonContact}</p>}
                          </td>

                          <td className="p-3.5 max-w-xs">
                            <p className="font-semibold text-slate-800 line-clamp-1">{c.projectName}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{c.workScope}</p>
                          </td>

                          <td className="p-3.5 text-right">
                            <p className="font-bold text-slate-900">{formatRupiah(c.contractValue)}</p>
                            <p className="text-[10px] text-slate-500">
                              DP {c.dpPct || 0}% ({formatRupiah(c.dpAmount || 0)})
                            </p>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-full text-[11px]">
                              {c.retentionPct}% ({formatRupiah(totalRetention)})
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <p className="font-medium text-slate-700">{c.maintenancePeriodDays} Hari</p>
                            <p className="text-[10px] text-slate-400">
                              {c.startDate} s.d {c.endDate}
                            </p>
                          </td>

                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                c.status === 'Aktif'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'Masa Pemeliharaan'
                                  ? 'bg-amber-100 text-amber-800'
                                  : c.status === 'Selesai'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {c.status} ({currentProgressPct}%)
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenNewOpname(c)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                title="Input Opname Progress Fisik Baru"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Opname</span>
                              </button>

                              <button
                                onClick={() => setSelectedContractForPrint(c)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                title="Pratinjau & Cetak SPK Borongan Subkontraktor"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Cetak SPK</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingContract(c);
                                  setIsContractModalOpen(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition"
                                title="Edit Kontrak SPK"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus kontrak SPK Borongan ${c.spkNumber}?`)) {
                                    onDeleteSubkonContract(c.id);
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition"
                                title="Hapus SPK"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 2: OPNAME PEKERJAAN FISIK LAPANGAN */}
      {activeTab === 'OPNAME' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Riwayat Berita Acara Opname Fisik Lapangan</h3>
                <p className="text-[11px] text-slate-500">
                  Perhitungan kemajuan fisik borongan, pemotongan jaminan retensi (5%), dan tagihan opname bersih.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">No Opname & SPK</th>
                    <th className="p-3.5">Tanggal & Periode</th>
                    <th className="p-3.5 text-center">Progress Lapangan (%)</th>
                    <th className="p-3.5 text-right">Nilai Opname Bruto</th>
                    <th className="p-3.5 text-right">Potongan Retensi (5%)</th>
                    <th className="p-3.5 text-right">Net Dibayarkan</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subkonOpnames.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Belum ada Berita Acara Opname Fisik yang dibuat.
                      </td>
                    </tr>
                  ) : (
                    subkonOpnames.map((o) => {
                      const contract = subkonContracts.find((c) => c.id === o.subkonContractId);

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] block w-fit mb-1">
                              {o.opnameNumber}
                            </span>
                            <p className="font-bold text-slate-900">{contract ? contract.subkonName : 'Subkon'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{contract?.spkNumber}</p>
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800">{o.period}</p>
                            <p className="text-[11px] text-slate-500">{o.opnameDate}</p>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="inline-block bg-slate-100 p-1.5 rounded-xl border text-[11px]">
                              <p className="font-black text-slate-900">{o.progressPct}% Akumulasi</p>
                              <p className="text-[10px] text-emerald-700 font-bold">+{o.currentProgressPct}% Periode Ini</p>
                            </div>
                          </td>

                          <td className="p-3.5 text-right font-bold text-slate-800">
                            {formatRupiah(o.grossAmount)}
                          </td>

                          <td className="p-3.5 text-right font-bold text-amber-700">
                            -{formatRupiah(o.retentionDeduction)}
                          </td>

                          <td className="p-3.5 text-right font-black text-emerald-700 text-sm">
                            {formatRupiah(o.netAmount)}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {contract && (
                                <button
                                  onClick={() => setSelectedOpnameForPrint({ opname: o, contract })}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                  title="Pratinjau & Cetak Berita Acara Opname Fisik (BAST)"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Pratinjau BAST</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus Opname ${o.opnameNumber}?`)) {
                                    onDeleteSubkonOpname(o.id);
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 3: MANAJEMEN PENCAIRAN DANA RETENSI */}
      {activeTab === 'RETENTION' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Pengelolaan Jaminan Pemeliharaan & Dana Retensi (5%)</h4>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Dana retensi sebesar 5% dari setiap opname dipotong secara otomatis hingga pekerjaan fisik 100% selesai (BAST-1).
                Setelah periode masa pemeliharaan garansi berakhir tanpa cacat mutu, dana retensi dapat dicairkan kepada Subkontraktor.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Subkontraktor & No SPK</th>
                    <th className="p-3.5">Proyek</th>
                    <th className="p-3.5 text-right">Nilai SPK</th>
                    <th className="p-3.5 text-right">Akumulasi Retensi Ditahan</th>
                    <th className="p-3.5 text-center">Masa Pemeliharaan</th>
                    <th className="p-3.5 text-center">Status Pemeliharaan</th>
                    <th className="p-3.5 text-center">Pencairan Retensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subkonContracts.map((c) => {
                    const contractOpnames = subkonOpnames.filter((o) => o.subkonContractId === c.id);
                    const totalRetention = contractOpnames.reduce((sum, o) => sum + o.retentionDeduction, 0);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{c.subkonName}</p>
                          <span className="font-mono text-slate-500 text-[11px]">{c.spkNumber}</span>
                        </td>

                        <td className="p-3.5 font-medium text-slate-800">{c.projectName}</td>

                        <td className="p-3.5 text-right font-bold text-slate-800">{formatRupiah(c.contractValue)}</td>

                        <td className="p-3.5 text-right font-black text-amber-700 text-sm">
                          {formatRupiah(totalRetention)}
                          <span className="block text-[10px] text-slate-400 font-normal">({c.retentionPct}% dari progress)</span>
                        </td>

                        <td className="p-3.5 text-center font-semibold text-slate-700">
                          {c.maintenancePeriodDays} Hari Kalender
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                              c.status === 'Masa Pemeliharaan'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : c.status === 'Selesai'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          {c.status === 'Masa Pemeliharaan' ? (
                            <button
                              onClick={() => handleReleaseRetention(c)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow transition flex items-center justify-center gap-1.5 mx-auto"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Cairkan Retensi</span>
                            </button>
                          ) : c.status === 'Selesai' ? (
                            <span className="text-emerald-700 font-bold flex items-center justify-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Telah Dicairkan</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sedang Berlangsung</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT / EDIT KONTRAK SPK BORONGAN */}
      {isContractModalOpen && editingContract && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsContractModalOpen(false);
          }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 cursor-default text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingContract.id ? 'Edit Kontrak SPK Borongan' : 'Buat SPK Borongan Subkon Baru'}
              </h3>
              <button onClick={() => setIsContractModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Nomor SPK Borongan</label>
                  <input
                    type="text"
                    required
                    value={editingContract.spkNumber || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, spkNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono"
                    placeholder="SPK-BOR-2026-001"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Nama Subkontraktor / Mandor</label>
                  <input
                    type="text"
                    required
                    value={editingContract.subkonName || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, subkonName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                    placeholder="PT Subkon Mandiri / Mandor Budi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Kontak / Personil Responsible</label>
                  <input
                    type="text"
                    value={editingContract.subkonContact || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, subkonContact: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                    placeholder="0812-3456-7890"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Proyek Terkait</label>
                  <select
                    value={editingContract.projectId || projects[0]?.id}
                    onChange={(e) => {
                      const proj = projects.find((p) => p.id === e.target.value);
                      setEditingContract({
                        ...editingContract,
                        projectId: e.target.value,
                        projectName: proj ? proj.name : '',
                      });
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Rincian & Lingkup Pekerjaan Borongan</label>
                <textarea
                  rows={3}
                  required
                  value={editingContract.workScope || ''}
                  onChange={(e) => setEditingContract({ ...editingContract, workScope: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  placeholder="Misal: Pekerjaan Fabrikasi & Pembesian Struktur Beton Ulir D13-D25..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Nilai Kontrak (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingContract.contractValue || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, contractValue: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Potongan Retensi (%)</label>
                  <input
                    type="number"
                    required
                    value={editingContract.retentionPct || 5}
                    onChange={(e) => setEditingContract({ ...editingContract, retentionPct: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Uang Muka / DP (%)</label>
                  <input
                    type="number"
                    value={editingContract.dpPct || 0}
                    onChange={(e) => setEditingContract({ ...editingContract, dpPct: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={editingContract.startDate || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={editingContract.endDate || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Masa Garansi (Hari)</label>
                  <input
                    type="number"
                    required
                    value={editingContract.maintenancePeriodDays || 90}
                    onChange={(e) => setEditingContract({ ...editingContract, maintenancePeriodDays: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow"
                >
                  Simpan Kontrak SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT OPNAME PEKERJAAN FISIK BARU */}
      {isOpnameModalOpen && editingOpname && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpnameModalOpen(false);
          }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 cursor-default text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Input Opname Progress Fisik Lapangan</h3>
                <p className="text-[11px] text-slate-500">Perhitungan otomatis potongan retensi 5% dan tagihan net.</p>
              </div>
              <button onClick={() => setIsOpnameModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpname} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Nomor Berita Acara Opname</label>
                  <input
                    type="text"
                    required
                    value={editingOpname.opnameNumber || ''}
                    onChange={(e) => setEditingOpname({ ...editingOpname, opnameNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Tanggal Opname</label>
                  <input
                    type="date"
                    required
                    value={editingOpname.opnameDate || ''}
                    onChange={(e) => setEditingOpname({ ...editingOpname, opnameDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Keterangan Periode Opname</label>
                <input
                  type="text"
                  required
                  value={editingOpname.period || ''}
                  onChange={(e) => setEditingOpname({ ...editingOpname, period: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  placeholder="Misal: Opname Progress Fisik Minggu ke-2"
                />
              </div>

              {/* Progress Slider / Input */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Progress Lapangan Akumulasi (%):</span>
                  <span className="text-lg font-black text-blue-700">{editingOpname.progressPct}%</span>
                </div>

                <input
                  type="range"
                  min={editingOpname.previousProgressPct || 0}
                  max={100}
                  value={editingOpname.progressPct || 0}
                  onChange={(e) => handleOpnameProgressChange(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Opname Lalu: {editingOpname.previousProgressPct}%</span>
                  <span className="text-emerald-700 font-bold">Progress Periode Ini: +{editingOpname.currentProgressPct}%</span>
                  <span>Target: 100%</span>
                </div>
              </div>

              {/* Breakdown Figures */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nilai Opname Bruto:</span>
                  <span className="font-bold">{formatRupiah(editingOpname.grossAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Potongan Retensi (5%):</span>
                  <span className="font-bold">-{formatRupiah(editingOpname.retentionDeduction || 0)}</span>
                </div>
                {editingOpname.dpDeduction ? (
                  <div className="flex justify-between text-amber-300">
                    <span>Pengembalian DP:</span>
                    <span className="font-bold">-{formatRupiah(editingOpname.dpDeduction)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-slate-800 text-emerald-400 text-sm font-black">
                  <span>Net Tagihan Opname:</span>
                  <span>{formatRupiah(editingOpname.netAmount || 0)}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Catatan Supervisor / Quality Control</label>
                <textarea
                  rows={2}
                  value={editingOpname.notes || ''}
                  onChange={(e) => setEditingOpname({ ...editingOpname, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  placeholder="Catatan hasil verifikasi fisik lapangan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpnameModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 shadow"
                >
                  Simpan Berita Acara Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL: SURAT PERINTAH KERJA (SPK BORONGAN) */}
      {selectedContractForPrint && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedContractForPrint(null);
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div className="bg-slate-100 rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-300 cursor-default space-y-4 my-8 relative max-h-[92vh] flex flex-col">
            {/* Modal Action Header (Sticky Top) */}
            <div className="sticky top-0 z-30 flex items-center justify-between pb-3 border-b border-slate-200 bg-white p-4 rounded-xl shadow-md shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Dokumen Resmi SPK Borongan Subkontraktor
                </h3>
                <p className="text-xs text-slate-500">Nomor: {selectedContractForPrint.spkNumber} — Pratinjau Siap Cetak A4</p>
              </div>
              <div className="flex items-center gap-2">
                <CetakPdfButton
                  elementId="printable-spk-borongan"
                  filename={`SPK-Borongan-${selectedContractForPrint.spkNumber}`}
                  label="Cetak PDF"
                  variant="emerald"
                />
                <button
                  type="button"
                  onClick={() => triggerPrintFallback("SURAT PERINTAH KERJA BORONGAN", document.getElementById("printable-spk-borongan"))}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
                  title="Cetak langsung menggunakan printer / browser"
                >
                  <Printer className="w-4 h-4" /> Cetak Browser
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSpkDocx(selectedContractForPrint)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" /> Word (.docx)
                </button>
                <button
                  onClick={() => setSelectedContractForPrint(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl border ml-2 bg-white"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Fixed Printable Container */}
            <div className="overflow-y-auto p-4 flex justify-center bg-slate-200/60 rounded-xl flex-1">
              <div
                id="printable-spk-borongan"
                className="w-[794px] min-h-[1123px] bg-white p-[12mm] border border-slate-300 shadow-md text-slate-900 font-sans text-xs leading-relaxed space-y-4 print:shadow-none print:border-none print:p-0 print:w-full"
              >
                <PrintHeader companyProfile={companyProfile} letterhead={letterhead} title="SURAT PERINTAH KERJA BORONGAN" />

                <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                  <h1 className="text-base font-black tracking-wide text-slate-900 uppercase">
                    SURAT PERINTAH KERJA (SPK BORONGAN)
                  </h1>
                  <p className="font-mono text-xs font-bold text-slate-700">Nomor: {selectedContractForPrint.spkNumber}</p>
                </div>

                <p className="text-justify leading-relaxed text-slate-800">
                  Pada hari ini, <strong className="capitalize">{formatFullDateIndonesian(selectedContractForPrint.startDate)}</strong>, bertempat di <strong>{companyProfile.city || 'Jakarta'}</strong>, kami yang bertanda tangan di bawah ini secara sah dan sadar menyepakati Perjanjian Kerja Borongan Subkontraktor:
                </p>

                {/* Identitas Para Pihak */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 space-y-1">
                    <p className="font-bold text-slate-900 underline uppercase text-[11px] tracking-wider">PIHAK PERTAMA (Pemberi Kerja)</p>
                    <p className="font-bold text-slate-900">{companyProfile.name}</p>
                    <p className="text-slate-700"><strong>Perwakilan:</strong> {companyProfile.directorName || 'Direktur Utama'} ({companyProfile.directorTitle || 'Direktur'})</p>
                    <p className="text-slate-600"><strong>Alamat:</strong> {companyProfile.address}, {companyProfile.city}</p>
                    <p className="text-slate-600"><strong>Kontak:</strong> {companyProfile.phone} | {companyProfile.email}</p>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 space-y-1">
                    <p className="font-bold text-slate-900 underline uppercase text-[11px] tracking-wider">PIHAK KEDUA (Subkontraktor / Mandor)</p>
                    <p className="font-bold text-slate-900">{selectedContractForPrint.subkonName}</p>
                    <p className="text-slate-700"><strong>Penanggung Jawab:</strong> {selectedContractForPrint.subkonContact || '-'}</p>
                    <p className="text-slate-600"><strong>Lokasi Proyek:</strong> {selectedContractForPrint.projectName}</p>
                    <p className="text-slate-600"><strong>Status SPK:</strong> {selectedContractForPrint.status}</p>
                  </div>
                </div>

                {/* Pasal-Pasal Kontrak */}
                <div className="space-y-3 text-slate-800 text-xs leading-relaxed">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-0.5 text-[11px]">
                      PASAL 1: LINGKUP PEKERJAAN BORONGAN & LOKASI PROYEK
                    </h4>
                    <p className="mt-1">
                      PIHAK PERTAMA memberikan tugas dan kewenangan penuh kepada PIHAK KEDUA untuk melaksanakan borongan pekerjaan konstruksi:
                    </p>
                    <div className="p-2.5 my-1.5 bg-slate-100 border-l-4 border-slate-800 font-semibold text-slate-900 rounded-r-md">
                      {selectedContractForPrint.workScope}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Pekerjaan wajib dilaksanakan pada proyek <strong>{selectedContractForPrint.projectName}</strong> sesuai gambar kerja, spesifikasi teknis, dan standar keselamatan kerja (K3).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-0.5 text-[11px]">
                      PASAL 2: NILAI KONTRAK BORONGAN & SKEMA PEMBAYARAN
                    </h4>
                    <p className="mt-1">
                      1. Total Harga Pekerjaan Borongan disepakati sebesar:
                    </p>
                    <p className="font-bold text-sm text-slate-900 my-1 pl-3">
                      {formatRupiah(selectedContractForPrint.contractValue)}{' '}
                      <span className="text-xs font-normal text-slate-700 italic block">({terbilangRupiah(selectedContractForPrint.contractValue)})</span>
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-slate-700">
                      <li>Uang Muka / DP disepakati sebesar <strong>{selectedContractForPrint.dpPct || 0}% ({formatRupiah(selectedContractForPrint.dpAmount || 0)})</strong>.</li>
                      <li>Pembayaran termin selanjutnya dilaksanakan berbasis <strong>Berita Acara Opname Progress Fisik</strong> yang diverifikasi oleh Site Manager.</li>
                      <li>Setiap pembayaran Opname dipotong <strong>Jaminan Retensi Pemeliharaan sebesar {selectedContractForPrint.retentionPct}%</strong> dari nilai opname bruto.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-0.5 text-[11px]">
                      PASAL 3: JANGKA WAKTU & MASA PEMELIHARAAN (GARANSI)
                    </h4>
                    <ul className="list-disc pl-6 space-y-1 text-slate-700">
                      <li>Jangka waktu pelaksanaan mulai tanggal <strong>{formatDate(selectedContractForPrint.startDate)}</strong> sampai <strong>{formatDate(selectedContractForPrint.endDate)}</strong>.</li>
                      <li>Masa Pemeliharaan / Garansi Mutu berlaku selama <strong>{selectedContractForPrint.maintenancePeriodDays} Hari Kalender</strong> terhitung sejak BAST-1 Selesai 100%.</li>
                      <li>Dana Retensi ({selectedContractForPrint.retentionPct}%) akan dicairkan 100% setelah Masa Pemeliharaan berakhir tanpa adanya cacat fisik/kerusakan.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 uppercase border-b border-slate-300 pb-0.5 text-[11px]">
                      PASAL 4: STANDAR K3, KUALITAS & SANKSII DENDA
                    </h4>
                    <p className="mt-1 text-slate-700">
                      PIHAK KEDUA wajib mematuhi seluruh instruksi keselamatan (APD) dan menjaga kebersihan lokasi. Keterlambatan penyerahan pekerjaan karena kelalaian PIHAK KEDUA dikenakan denda keterlambatan sebesar 1‰ (satu per mil) per hari dari nilai SPK.
                    </p>
                  </div>
                </div>

                {/* Tabel Rekapitulasi Rincian SPK */}
                <table className="w-full border-collapse border border-slate-300 text-xs my-2">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-300 p-2 text-left">Komponen SPK Borongan</th>
                      <th className="border border-slate-300 p-2 text-center">Rasio / Persentase</th>
                      <th className="border border-slate-300 p-2 text-right">Nilai Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="font-bold text-slate-900">
                      <td className="p-2 border border-slate-300">Total Nilai SPK Borongan (100%)</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">100%</td>
                      <td className="p-2 border border-slate-300 text-right">{formatRupiah(selectedContractForPrint.contractValue)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300">Ketentuan Uang Muka (DP)</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{selectedContractForPrint.dpPct || 0}%</td>
                      <td className="p-2 border border-slate-300 text-right">{formatRupiah(selectedContractForPrint.dpAmount || 0)}</td>
                    </tr>
                    <tr className="bg-amber-50/80 font-semibold text-amber-950">
                      <td className="p-2 border border-slate-300">Alokasi Dana Retensi Pemeliharaan Garansi</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{selectedContractForPrint.retentionPct}%</td>
                      <td className="p-2 border border-slate-300 text-right font-bold">{formatRupiah((selectedContractForPrint.contractValue * selectedContractForPrint.retentionPct) / 100)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Kolom Tanda Tangan */}
                <div className="pt-4 border-t border-slate-300">
                  <PrintSignature
                    signatoryName={companyProfile.directorName}
                    signatoryTitle={companyProfile.directorTitle || 'Direktur Utama (Pemberi Kerja)'}
                    recipientName={selectedContractForPrint.subkonName}
                    recipientTitle="Penanggung Jawab Subkontraktor"
                    date={selectedContractForPrint.startDate}
                    city={companyProfile.city}
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Sticky Action Bar */}
            <div className="sticky bottom-0 z-30 bg-slate-900 text-white p-3.5 rounded-xl shadow-xl flex items-center justify-between border border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-bold text-xs text-white">Siap Cetak SPK Borongan Subkon</p>
                  <p className="text-[10px] text-slate-400">Pilih opsi format cetak atau download dokumen resmi di atas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CetakPdfButton
                  elementId="printable-spk-borongan"
                  filename={`SPK-Borongan-${selectedContractForPrint.spkNumber}`}
                  label="Cetak PDF / Download"
                  variant="emerald"
                />
                <button
                  type="button"
                  onClick={() => triggerPrintFallback("SURAT PERINTAH KERJA BORONGAN", document.getElementById("printable-spk-borongan"))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-4 h-4" /> Cetak Browser
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSpkDocx(selectedContractForPrint)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Download className="w-4 h-4" /> Word (.docx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL: BERITA ACARA OPNAME FISIK (BAST OPNAME) */}
      {selectedOpnameForPrint && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOpnameForPrint(null);
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div className="bg-slate-100 rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-300 cursor-default space-y-4 my-8 relative max-h-[92vh] flex flex-col">
            {/* Modal Action Header (Sticky Top) */}
            <div className="sticky top-0 z-30 flex items-center justify-between pb-3 border-b border-slate-200 bg-white p-4 rounded-xl shadow-md shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" /> Berita Acara Opname Fisik Lapangan (BAST Opname)
                </h3>
                <p className="text-xs text-slate-500">Nomor: {selectedOpnameForPrint.opname.opnameNumber} — Pratinjau Siap Cetak A4</p>
              </div>
              <div className="flex items-center gap-2">
                <CetakPdfButton
                  elementId="printable-bast-opname"
                  filename={`BAST-Opname-${selectedOpnameForPrint.opname.opnameNumber}`}
                  label="Cetak PDF"
                  variant="emerald"
                />
                <button
                  type="button"
                  onClick={() => triggerPrintFallback("BERITA ACARA OPNAME FISIK LAPANGAN", document.getElementById("printable-bast-opname"))}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> Cetak Browser
                </button>
                <button
                  type="button"
                  onClick={() => handleExportOpnameDocx(selectedOpnameForPrint.opname, selectedOpnameForPrint.contract)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" /> Word (.docx)
                </button>
                <button
                  onClick={() => setSelectedOpnameForPrint(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl border ml-2 bg-white"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Fixed Printable Area BAST */}
            <div className="overflow-y-auto p-4 flex justify-center bg-slate-200/60 rounded-xl flex-1">
              <div
                id="printable-bast-opname"
                className="w-[794px] min-h-[1123px] bg-white p-[12mm] border border-slate-300 shadow-md text-slate-900 font-sans text-xs leading-relaxed space-y-4 print:shadow-none print:border-none print:p-0 print:w-full"
              >
                <PrintHeader companyProfile={companyProfile} letterhead={letterhead} title="BERITA ACARA OPNAME FISIK" />

                <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                  <h1 className="text-base font-black tracking-wide text-slate-900 uppercase">
                    BERITA ACARA OPNAME PROGRESS FISIK (BAST OPNAME)
                  </h1>
                  <p className="font-mono text-xs font-bold text-slate-700">Nomor: {selectedOpnameForPrint.opname.opnameNumber}</p>
                </div>

                {/* Information Header Card */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-300 text-xs">
                  <div className="space-y-1">
                    <p><strong>Subkontraktor / Mandor:</strong> {selectedOpnameForPrint.contract.subkonName}</p>
                    <p><strong>Nama Proyek:</strong> {selectedOpnameForPrint.contract.projectName}</p>
                    <p><strong>Lingkup Pekerjaan:</strong> {selectedOpnameForPrint.contract.workScope}</p>
                  </div>
                  <div className="space-y-1 border-l pl-3 border-slate-300">
                    <p><strong>Nomor SPK Induk:</strong> {selectedOpnameForPrint.contract.spkNumber}</p>
                    <p><strong>Periode Opname:</strong> {selectedOpnameForPrint.opname.period}</p>
                    <p><strong>Tanggal Verifikasi:</strong> {formatDate(selectedOpnameForPrint.opname.opnameDate)}</p>
                  </div>
                </div>

                {/* Opname Calculation Table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider underline">
                    RINCIAN PERHITUNGAN OPNAME FISIK LAPANGAN
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="border border-slate-300 p-2 text-left">Uraian Komponen Opname Progress</th>
                        <th className="border border-slate-300 p-2 text-center">Volume / %</th>
                        <th className="border border-slate-300 p-2 text-right">Nilai Nominal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">1. Total Nilai Kontrak SPK Borongan (100%)</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">100%</td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{formatRupiah(selectedOpnameForPrint.contract.contractValue)}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-2 border border-slate-300">2. Progress Fisik Lapangan Akumulasi (s.d Periode Ini)</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-700">{selectedOpnameForPrint.opname.progressPct}%</td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{formatRupiah(selectedOpnameForPrint.opname.grossAmount)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 text-slate-600 pl-6">• Progress Akumulasi Periode Lalu</td>
                        <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">{selectedOpnameForPrint.opname.previousProgressPct || 0}%</td>
                        <td className="p-2 border border-slate-300 text-right text-slate-600">{formatRupiah((selectedOpnameForPrint.contract.contractValue * (selectedOpnameForPrint.opname.previousProgressPct || 0)) / 100)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border border-slate-300 font-medium text-emerald-800 pl-6">• Progress Kemajuan Fisik Periode Ini</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-emerald-700">+{selectedOpnameForPrint.opname.currentProgressPct}%</td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-emerald-700">{formatRupiah((selectedOpnameForPrint.contract.contractValue * selectedOpnameForPrint.opname.currentProgressPct) / 100)}</td>
                      </tr>
                      <tr className="bg-amber-50/80 font-semibold text-amber-950">
                        <td className="p-2 border border-slate-300">3. Potongan Jaminan Retensi Pemeliharaan Garansi ({selectedOpnameForPrint.contract.retentionPct}%)</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{selectedOpnameForPrint.contract.retentionPct}%</td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-amber-900">-{formatRupiah(selectedOpnameForPrint.opname.retentionDeduction)}</td>
                      </tr>
                      {selectedOpnameForPrint.opname.dpDeduction ? (
                        <tr className="bg-amber-50/80 font-semibold text-amber-950">
                          <td className="p-2 border border-slate-300">4. Potongan Pengembalian Uang Muka (DP)</td>
                          <td className="p-2 border border-slate-300 text-center font-mono">-</td>
                          <td className="p-2 border border-slate-300 text-right font-bold text-amber-900">-{formatRupiah(selectedOpnameForPrint.opname.dpDeduction)}</td>
                        </tr>
                      ) : null}
                      <tr className="bg-slate-900 text-white font-black text-sm">
                        <td className="p-3 border border-slate-300 uppercase">NET TAGIHAN DIBAYARKAN PERIODE INI</td>
                        <td className="p-3 border border-slate-300 text-center font-mono">NET</td>
                        <td className="p-3 border border-slate-300 text-right text-emerald-400">{formatRupiah(selectedOpnameForPrint.opname.netAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[11px] italic font-semibold text-slate-800 mt-1">
                    Terbilang: {terbilangRupiah(selectedOpnameForPrint.opname.netAmount)}
                  </p>
                </div>

                {/* Supervisor Notes */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 text-[11px] space-y-1">
                  <p className="font-bold text-slate-900">Catatan Field Supervisor / Quality Control:</p>
                  <p className="text-slate-700 italic">
                    "{selectedOpnameForPrint.opname.notes || 'Hasil verifikasi volume fisik di lapangan dinyatakan sesuai dengan gambar kerja dan standar mutu.'}"
                  </p>
                </div>

                {/* 3-Column Signatures */}
                <div className="pt-4 border-t border-slate-300 space-y-3">
                  <p className="text-center font-bold text-slate-900 text-xs">PENGESAHAN BERITA ACARA OPNAME FISIK LAPANGAN</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2">
                    <div className="space-y-12">
                      <p className="font-bold text-slate-900">Dibuat Oleh:<br /><span className="font-normal text-slate-600">Subkontraktor / Mandor</span></p>
                      <div>
                        <p className="font-bold text-slate-900 underline">{selectedOpnameForPrint.contract.subkonName}</p>
                        <p className="text-slate-500 text-[10px]">Penanggung Jawab</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p className="font-bold text-slate-900">Diverifikasi Oleh:<br /><span className="font-normal text-slate-600">Site Manager / Field Supervisor</span></p>
                      <div>
                        <p className="font-bold text-slate-900 underline">{selectedOpnameForPrint.opname.supervisorName || companyProfile.directorName}</p>
                        <p className="text-slate-500 text-[10px]">Site Manager Proyek</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p className="font-bold text-slate-900">Disetujui Oleh:<br /><span className="font-normal text-slate-600">Management / Pemberi Kerja</span></p>
                      <div className="flex flex-col items-center">
                        <QRCodeSVG value={`BAST-OPNAME-${selectedOpnameForPrint.opname.opnameNumber}`} size={44} className="mb-1" />
                        <p className="font-bold text-slate-900 underline">{companyProfile.directorName || 'Direktur Utama'}</p>
                        <p className="text-slate-500 text-[10px]">{companyProfile.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Sticky Action Bar */}
            <div className="sticky bottom-0 z-30 bg-slate-900 text-white p-3.5 rounded-xl shadow-xl flex items-center justify-between border border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-bold text-xs text-white">Siap Cetak BAST Opname Progress Fisik</p>
                  <p className="text-[10px] text-slate-400">Pilih opsi format cetak atau download Berita Acara Opname</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CetakPdfButton
                  elementId="printable-bast-opname"
                  filename={`BAST-Opname-${selectedOpnameForPrint.opname.opnameNumber}`}
                  label="Cetak PDF / Download"
                  variant="emerald"
                />
                <button
                  type="button"
                  onClick={() => triggerPrintFallback("BERITA ACARA OPNAME FISIK LAPANGAN", document.getElementById("printable-bast-opname"))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-4 h-4" /> Cetak Browser
                </button>
                <button
                  type="button"
                  onClick={() => handleExportOpnameDocx(selectedOpnameForPrint.opname, selectedOpnameForPrint.contract)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Download className="w-4 h-4" /> Word (.docx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
