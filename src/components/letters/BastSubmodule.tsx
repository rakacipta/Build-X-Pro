import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  ShieldCheck,
  Search,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  UserCheck,
  Layers,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Clock,
  Send,
} from 'lucide-react';
import { Project, CompanyProfile, OfficialLetter } from '../../types';
import { Document, Paragraph, TextRun, Packer, AlignmentType } from 'docx';

interface BastDocument {
  id: string;
  type: 'BAST1' | 'BAST2';
  bastNumber: string;
  refBast1Number?: string; // Khusus BAST-2
  projectId: string;
  projectName: string;
  clientName: string;
  clientAddress?: string;
  clientRepresentative?: string;
  contractNumber: string;
  contractDate: string;
  contractValue: number;
  retentionPct: number; // 5%
  retentionAmount: number; // Nilai Retensi 5%
  bastDate: string;
  bastCity: string;
  maintenanceDays: number; // e.g. 180
  maintenanceEndDate: string;
  inspectionNotes: string;
  status: 'Draft' | 'Disetujui' | 'Ditandatangani' | 'Retensi Dicairkan';
  contractorSignatory: string; // PT RCS
  contractorTitle: string;
  clientSignatory: string;
  clientTitle: string;
  consultantSignatory?: string;
  consultantTitle?: string;
  createdAt: string;
  updatedAt: string;
}

interface BastSubmoduleProps {
  projects: Project[];
  companyProfile: CompanyProfile;
  onSaveOfficialLetter?: (letter: OfficialLetter) => void;
  onTriggerNotification?: (notif: any) => void;
}

// Initial Seed Data for BAST Documents
const INITIAL_BAST_DOCS: BastDocument[] = [
  {
    id: 'bast-001',
    type: 'BAST1',
    bastNumber: '015/BAST-1/RCS-PROJ/VIII/2026',
    projectId: '1',
    projectName: 'Pembangunan Gedung Perkantoran Sudirman Tower',
    clientName: 'PT Graha Jaya Utama',
    clientAddress: 'Jl. Jendral Sudirman No. 102, Jakarta Selatan',
    clientRepresentative: 'Ir. Hendra Kusuma',
    contractNumber: '008/SPK/GJU/III/2026',
    contractDate: '2026-03-10',
    contractValue: 2500000000,
    retentionPct: 5,
    retentionAmount: 125000000,
    bastDate: '2026-08-01',
    bastCity: 'Jakarta',
    maintenanceDays: 180,
    maintenanceEndDate: '2027-01-28',
    inspectionNotes:
      'Seluruh pekerjaan fisik struktur dan finishing telah selesai 100%. Testing commissioning genset dan AC central dinyatakan lulus dengan hasil sempurna.',
    status: 'Ditandatangani',
    contractorSignatory: 'Ir. Raka Cipta Seraya, M.T.',
    contractorTitle: 'Direktur Utama',
    clientSignatory: 'Ir. Hendra Kusuma',
    clientTitle: 'Project Director',
    consultantSignatory: 'Budi Santoso, S.T.',
    consultantTitle: 'Team Leader MK',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'bast-002',
    type: 'BAST2',
    bastNumber: '004/BAST-2/RCS-PROJ/VIII/2026',
    refBast1Number: '002/BAST-1/RCS-PROJ/02/2026',
    projectId: '2',
    projectName: 'Renovasi Interior & MEP Restoran Menteng',
    clientName: 'PT Kuliner Nusantara',
    clientAddress: 'Jl. Cikini Raya No. 45, Jakarta Pusat',
    clientRepresentative: 'Dewi Sartika',
    contractNumber: '012/SPK/KN/I/2026',
    contractDate: '2026-01-15',
    contractValue: 850000000,
    retentionPct: 5,
    retentionAmount: 42500000,
    bastDate: '2026-08-05',
    bastCity: 'Jakarta',
    maintenanceDays: 180,
    maintenanceEndDate: '2026-08-05',
    inspectionNotes:
      'Masa pemeliharaan 180 hari telah berakhir. Seluruh poin checklist defect list telah diperbaiki dan dibersihkan 100%. Retensi 5% dapat dicairkan full.',
    status: 'Retensi Dicairkan',
    contractorSignatory: 'Ir. Raka Cipta Seraya, M.T.',
    contractorTitle: 'Direktur Utama',
    clientSignatory: 'Dewi Sartika',
    clientTitle: 'General Manager',
    createdAt: '2026-08-05T11:00:00Z',
    updatedAt: '2026-08-05T11:00:00Z',
  },
];

export const BastSubmodule: React.FC<BastSubmoduleProps> = ({
  projects,
  companyProfile,
  onSaveOfficialLetter,
  onTriggerNotification,
}) => {
  const [bastList, setBastList] = useState<BastDocument[]>(() => {
    try {
      const saved = localStorage.getItem('rcs_bast_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BAST_DOCS;
  });

  const [activeTab, setActiveTab] = useState<'LIST' | 'FORM' | 'PREVIEW'>('LIST');
  const [filterType, setFilterType] = useState<'ALL' | 'BAST1' | 'BAST2'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for preview / edit
  const [selectedBast, setSelectedBast] = useState<BastDocument | null>(bastList[0]);
  const [editingBast, setEditingBast] = useState<Partial<BastDocument> | null>(null);

  // Helper formatting
  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return 'Hari';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long' });
    } catch {
      return 'Hari';
    }
  };

  const saveBastListToStorage = (updated: BastDocument[]) => {
    setBastList(updated);
    try {
      localStorage.setItem('rcs_bast_documents', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Open Form New
  const handleOpenNew = (type: 'BAST1' | 'BAST2') => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProject = projects[0];
    const contractVal = defaultProject?.budget || 1000000000;
    const retPct = 5;
    const retAmt = (contractVal * retPct) / 100;

    // Calculate 180 days after today
    const endMaint = new Date();
    endMaint.setDate(endMaint.getDate() + 180);
    const endMaintStr = endMaint.toISOString().split('T')[0];

    const newDoc: Partial<BastDocument> = {
      type,
      bastNumber:
        type === 'BAST1'
          ? `${String(bastList.length + 1).padStart(3, '0')}/BAST-1/RCS-PROJ/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
          : `${String(bastList.length + 1).padStart(3, '0')}/BAST-2/RCS-PROJ/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      refBast1Number: type === 'BAST2' ? '015/BAST-1/RCS-PROJ/VIII/2026' : undefined,
      projectId: defaultProject?.id || '',
      projectName: defaultProject?.name || 'Proyek Konstruksi',
      clientName: defaultProject?.client || 'Klien Proyek',
      clientAddress: 'Jl. Raya Proyek No. 1, Jakarta',
      clientRepresentative: defaultProject?.client || 'Bapak/Ibu Klien',
      contractNumber: '001/SPK/RCS/2026',
      contractDate: '2026-01-10',
      contractValue: contractVal,
      retentionPct: retPct,
      retentionAmount: retAmt,
      bastDate: today,
      bastCity: companyProfile.city || 'Jakarta',
      maintenanceDays: 180,
      maintenanceEndDate: endMaintStr,
      inspectionNotes:
        type === 'BAST1'
          ? 'Pekerjaan fisik telah selesai 100% dengan mutu baik. Pengujian sistem MEP & struktur lolos verifikasi.'
          : 'Masa pemeliharaan telah berakhir. Seluruh perbaikan (defect list) telah diselesaikan 100% dan siap dicairkan retensinya.',
      status: 'Disetujui',
      contractorSignatory: 'Ir. Raka Cipta Seraya, M.T.',
      contractorTitle: 'Direktur Utama',
      clientSignatory: defaultProject?.client || 'Bapak/Ibu Klien',
      clientTitle: 'Direktur / Owner',
      consultantSignatory: 'Konsultan Pengawas S.T.',
      consultantTitle: 'Team Leader MK',
    };

    setEditingBast(newDoc);
    setActiveTab('FORM');
  };

  // Handle Project Selection in Form
  const handleProjectSelect = (projId: string) => {
    const sel = projects.find((p) => p.id === projId);
    if (sel && editingBast) {
      const contractVal = sel.budget || 1000000000;
      const retPct = editingBast.retentionPct ?? 5;
      const retAmt = (contractVal * retPct) / 100;

      setEditingBast({
        ...editingBast,
        projectId: sel.id,
        projectName: sel.name,
        clientName: sel.client,
        clientRepresentative: sel.client,
        contractValue: contractVal,
        retentionAmount: retAmt,
      });
    }
  };

  // Save BAST
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBast || !editingBast.projectName) return;

    const now = new Date().toISOString();
    const docToSave: BastDocument = {
      id: editingBast.id || `bast-${Date.now()}`,
      type: editingBast.type || 'BAST1',
      bastNumber: editingBast.bastNumber || `BAST-${Date.now()}`,
      refBast1Number: editingBast.refBast1Number,
      projectId: editingBast.projectId || '',
      projectName: editingBast.projectName || '',
      clientName: editingBast.clientName || '',
      clientAddress: editingBast.clientAddress || '',
      clientRepresentative: editingBast.clientRepresentative || '',
      contractNumber: editingBast.contractNumber || '',
      contractDate: editingBast.contractDate || now.split('T')[0],
      contractValue: editingBast.contractValue || 0,
      retentionPct: editingBast.retentionPct ?? 5,
      retentionAmount: editingBast.retentionAmount || 0,
      bastDate: editingBast.bastDate || now.split('T')[0],
      bastCity: editingBast.bastCity || companyProfile.city || 'Jakarta',
      maintenanceDays: editingBast.maintenanceDays || 180,
      maintenanceEndDate: editingBast.maintenanceEndDate || now.split('T')[0],
      inspectionNotes: editingBast.inspectionNotes || '',
      status: editingBast.status || 'Ditandatangani',
      contractorSignatory: editingBast.contractorSignatory || 'Ir. Raka Cipta Seraya, M.T.',
      contractorTitle: editingBast.contractorTitle || 'Direktur Utama',
      clientSignatory: editingBast.clientSignatory || '',
      clientTitle: editingBast.clientTitle || 'Owner',
      consultantSignatory: editingBast.consultantSignatory,
      consultantTitle: editingBast.consultantTitle,
      createdAt: editingBast.createdAt || now,
      updatedAt: now,
    };

    const exists = bastList.some((b) => b.id === docToSave.id);
    let updatedList: BastDocument[];
    if (exists) {
      updatedList = bastList.map((b) => (b.id === docToSave.id ? docToSave : b));
    } else {
      updatedList = [docToSave, ...bastList];
    }

    saveBastListToStorage(updatedList);
    setSelectedBast(docToSave);

    // Sync to Official Letter Archive if callback provided
    if (onSaveOfficialLetter) {
      const isBast1 = docToSave.type === 'BAST1';
      const letterDoc: OfficialLetter = {
        id: `LTR-${docToSave.id}`,
        letterNumber: docToSave.bastNumber,
        category: isBast1 ? 'BAST1' : 'BAST2',
        title: isBast1
          ? `Berita Acara Serah Terima Pertama (BAST-1) - ${docToSave.projectName}`
          : `Berita Acara Serah Terima Kedua / Final (BAST-2) - ${docToSave.projectName}`,
        subject: isBast1
          ? `Serah Terima Pertama (PHO) & Masa Pemeliharaan`
          : `Serah Terima Akhir (FHO) & Pencairan Retensi 5%`,
        enclosure: '1 (Satu) Berkas Laporan Physical Progress 100%',
        letterDate: docToSave.bastDate,
        city: docToSave.bastCity,
        recipientName: docToSave.clientRepresentative,
        recipientTitle: docToSave.clientTitle,
        recipientCompany: docToSave.clientName,
        recipientAddress: docToSave.clientAddress,
        openingText: `Pada hari ini ${getDayName(docToSave.bastDate)}, tanggal ${formatDate(
          docToSave.bastDate
        )}, kami yang bertanda tangan di bawah ini secara sah menyatakan:`,
        bodyParagraphs: [
          `1. PIHAK PERTAMA (Pemilik Proyek): ${docToSave.clientName}`,
          `2. PIHAK KEDUA (Kontraktor Pelaksana): ${companyProfile.name}`,
          `3. Nilai Kontrak Pekerjaan: ${formatRupiah(docToSave.contractValue)} (Kontrak SPK: ${docToSave.contractNumber})`,
          isBast1
            ? `4. Berdasarkan BAST-1 ini, Pekerjaan Fisik dinyatakan 100% Selesai (PHO) dan Masa Pemeliharaan (${docToSave.maintenanceDays} hari) resmi dimulai hingga tanggal ${formatDate(docToSave.maintenanceEndDate)}.`
            : `4. Berdasarkan BAST-2 ini, Masa Pemeliharaan telah berakhir dan Retensi 5% sebesar ${formatRupiah(docToSave.retentionAmount)} resmi dicairkan ke Pihak Kedua.`,
          `5. Catatan Inspeksi: ${docToSave.inspectionNotes}`,
        ],
        closingText:
          'Demikian Berita Acara Serah Terima ini dibuat dalam rangkap 2 (dua) bermaterai cukup dan memiliki kekuatan hukum yang sama.',
        signatoryName: docToSave.contractorSignatory,
        signatoryTitle: docToSave.contractorTitle,
        showStamp: true,
        showQrCode: true,
        status: 'Diterbitkan',
        createdAt: docToSave.createdAt,
        updatedAt: docToSave.updatedAt,
      };
      onSaveOfficialLetter(letterDoc);
    }

    if (onTriggerNotification) {
      onTriggerNotification({
        type: 'SYSTEM',
        title: docToSave.type === 'BAST1' ? 'BAST-1 Diterbitkan' : 'BAST-2 Diterbitkan',
        message: `Dokumen ${docToSave.bastNumber} untuk ${docToSave.projectName} telah disimpan dengan nilai retensi 5% ${formatRupiah(
          docToSave.retentionAmount
        )}.`,
        priority: 'high',
      });
    }

    setActiveTab('PREVIEW');
  };

  // Delete BAST
  const handleDeleteBast = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen BAST ini?')) {
      const updated = bastList.filter((b) => b.id !== id);
      saveBastListToStorage(updated);
      if (selectedBast?.id === id) {
        setSelectedBast(updated[0] || null);
      }
    }
  };

  // DOCX Export Function for BAST
  const handleExportBastDocx = async (bast: BastDocument) => {
    const isBast1 = bast.type === 'BAST1';
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
                  new TextRun({ text: companyProfile.name || 'PT RAKA CIPTA SERAYA', bold: true, size: 28, color: '0F172A' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${companyProfile.address || ''}, ${companyProfile.city || 'Jakarta'} | Telp: ${companyProfile.phone || ''} | Email: ${companyProfile.email || ''}`,
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '_________________________________________________________________________________',
                    size: 16,
                    color: '0F172A',
                  }),
                ],
                spacing: { after: 250 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: isBast1
                      ? 'BERITA ACARA SERAH TERIMA PERTAMA PEKERJAAN (BAST-1)'
                      : 'BERITA ACARA SERAH TERIMA KEDUA / FINAL (BAST-2)',
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Nomor: ${bast.bastNumber}`, bold: true, size: 20 }),
                ],
                spacing: { after: 300 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Pada hari ini, ${getDayName(bast.bastDate)}, tanggal ${formatDate(
                      bast.bastDate
                    )}, bertempat di ${bast.bastCity}, kami yang bertanda tangan di bawah ini:`,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `1. PIHAK PERTAMA (Klien / Pemilik Proyek): `, bold: true }),
                  new TextRun({ text: `${bast.clientName} (${bast.clientRepresentative} - ${bast.clientTitle})` }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `2. PIHAK KEDUA (Kontraktor Pelaksana): `, bold: true }),
                  new TextRun({ text: `${companyProfile.name} (${bast.contractorSignatory} - ${bast.contractorTitle})` }),
                ],
                spacing: { after: 250 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: isBast1
                      ? `MENYATAKAN BAWHA:\n` +
                        `1. PIHAK KEDUA telah menyelesaikan seluruh pengerjaan fisik proyek "${bast.projectName}" sebesar 100% sesuai Kontrak SPK No. ${bast.contractNumber}.\n` +
                        `2. Nilai Total Kontrak sebesar ${formatRupiah(bast.contractValue)} dengan Potongan Retensi 5% sebesar ${formatRupiah(bast.retentionAmount)}.\n` +
                        `3. BAST-1 ini menandai dimulainya Masa Pemeliharaan selama ${bast.maintenanceDays} Hari Kalender hingga ${formatDate(bast.maintenanceEndDate)}.\n` +
                        `4. Catatan Inspeksi: ${bast.inspectionNotes}`
                      : `MENYATAKAN BAWHA:\n` +
                        `1. Masa Pemeliharaan selama ${bast.maintenanceDays} Hari Kalender berdasarkan BAST-1 Ref No. ${bast.refBast1Number || '-'} telah berakhir.\n` +
                        `2. Seluruh perbaikan (defect list) telah diselesaikan 100% dan disetujui oleh PIHAK PERTAMA.\n` +
                        `3. PIHAK PERTAMA mencairkan 100% Dana Retensi 5% sebesar ${formatRupiah(bast.retentionAmount)} kepada PIHAK KEDUA.`
                  }),
                ],
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Demikian Berita Acara Serah Terima (${isBast1 ? 'BAST-1' : 'BAST-2'}) ini dibuat dalam rangkap bermaterai cukup untuk dipergunakan sebagaimana mestinya.`,
                  }),
                ],
                spacing: { after: 500 },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bast.type}_${bast.bastNumber.replace(/\//g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed export DOCX:', err);
      alert('Gagal mengeksport Word file.');
    }
  };

  // Filtered List
  const filteredList = bastList.filter((b) => {
    const matchesType = filterType === 'ALL' || b.type === filterType;
    const matchesSearch =
      b.bastNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate Metrics
  const countBast1 = bastList.filter((b) => b.type === 'BAST1').length;
  const countBast2 = bastList.filter((b) => b.type === 'BAST2').length;
  const totalRetentionInMaintenance = bastList
    .filter((b) => b.type === 'BAST1')
    .reduce((acc, b) => acc + b.retentionAmount, 0);
  const totalRetentionReleased = bastList
    .filter((b) => b.type === 'BAST2')
    .reduce((acc, b) => acc + b.retentionAmount, 0);

  return (
    <div className="space-y-6">
      {/* Submodule Header & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Dokumen Administrasi Konstruksi</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Dokumen BAST 1 & BAST 2 (Handover & Retensi)
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Penerbitan Berita Acara Serah Terima Pertama (BAST-1 / PHO), Pelacakan Masa Pemeliharaan, dan
            Serah Terima Akhir (BAST-2 / FHO) untuk Pencairan Retensi 5%.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenNew('BAST1')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-900/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat BAST-1 (PHO 100%)</span>
          </button>
          <button
            onClick={() => handleOpenNew('BAST2')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-900/30 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Buat BAST-2 (FHO Retensi 5%)</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dokumen BAST</p>
            <p className="text-xl font-black text-slate-900">{bastList.length} Dokumen</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BAST-1 (Masa Pemeliharaan)</p>
            <p className="text-xl font-black text-indigo-900">{countBast1} Proyek Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai Retensi 5% Tertahan</p>
            <p className="text-lg font-black text-rose-700">{formatRupiah(totalRetentionInMaintenance)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Retensi 5% Dicairkan (BAST-2)</p>
            <p className="text-lg font-black text-emerald-700">{formatRupiah(totalRetentionReleased)}</p>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 no-print">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
            activeTab === 'LIST' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Daftar BAST-1 & BAST-2 ({bastList.length})
        </button>

        {selectedBast && (
          <button
            onClick={() => setActiveTab('PREVIEW')}
            className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'PREVIEW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" /> Preview Cetak A4 ({selectedBast.bastNumber})
          </button>
        )}

        {activeTab === 'FORM' && (
          <button
            className="pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 border-amber-600 text-amber-700"
          >
            <Edit className="w-4 h-4" /> Formulir BAST ({editingBast?.type})
          </button>
        )}
      </div>

      {/* TAB 1: LIST OF BAST DOCUMENTS */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nomor BAST, proyek, klien..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType('BAST1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === 'BAST1' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BAST-1 (PHO)
                </button>
                <button
                  onClick={() => setFilterType('BAST2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === 'BAST2' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BAST-2 (FHO)
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Menampilkan <strong className="text-slate-900 font-bold">{filteredList.length}</strong> dokumen
            </p>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="p-3.5 pl-5">Jenis & No. BAST</th>
                    <th className="p-3.5">Proyek & Klien</th>
                    <th className="p-3.5">Nilai Kontrak</th>
                    <th className="p-3.5">Retensi 5%</th>
                    <th className="p-3.5">Tgl BAST & Masa Garansi</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredList.length > 0 ? (
                    filteredList.map((bast) => (
                      <tr key={bast.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                bast.type === 'BAST1'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {bast.type}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{bast.bastNumber}</p>
                              <p className="text-[11px] text-slate-500 font-medium">SPK: {bast.contractNumber}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-slate-800 max-w-xs truncate">{bast.projectName}</p>
                          <p className="text-[11px] text-slate-500">{bast.clientName}</p>
                        </td>

                        <td className="p-3.5 font-bold text-slate-900">
                          {formatRupiah(bast.contractValue)}
                        </td>

                        <td className="p-3.5">
                          <span className="font-extrabold text-rose-700">
                            {formatRupiah(bast.retentionAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">({bast.retentionPct}%)</span>
                        </td>

                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800">{formatDate(bast.bastDate)}</p>
                          <p className="text-[11px] text-indigo-600 font-medium">
                            s.d. {formatDate(bast.maintenanceEndDate)} ({bast.maintenanceDays} hr)
                          </p>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              bast.status === 'Retensi Dicairkan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bast.status === 'Ditandatangani'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {bast.status}
                          </span>
                        </td>

                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBast(bast);
                                setActiveTab('PREVIEW');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Preview Dokumen BAST A4"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleExportBastDocx(bast)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Unduh File Word (.docx)"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingBast(bast);
                                setActiveTab('FORM');
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit BAST"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteBast(bast.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Dokumen BAST"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada dokumen BAST yang ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT / NEW FORM */}
      {activeTab === 'FORM' && editingBast && (
        <form onSubmit={handleSubmitForm} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {editingBast.id ? 'Edit Dokumen BAST' : `Buat Dokumen ${editingBast.type} Baru`}
              </h3>
              <p className="text-xs text-slate-500">
                Isi rincian serah terima pekerjaan, masa pemeliharaan, dan nilai retensi 5%.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
            >
              Kembali ke Daftar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Jenis BAST */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Dokumen BAST</label>
              <select
                value={editingBast.type || 'BAST1'}
                onChange={(e) => {
                  const type = e.target.value as 'BAST1' | 'BAST2';
                  setEditingBast({
                    ...editingBast,
                    type,
                    bastNumber: editingBast.bastNumber?.includes('BAST-')
                      ? editingBast.bastNumber.replace(/BAST-1|BAST-2/, type === 'BAST1' ? 'BAST-1' : 'BAST-2')
                      : editingBast.bastNumber,
                  });
                }}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-white"
              >
                <option value="BAST1">BAST-1 (Serah Terima Pertama / PHO Progress 100%)</option>
                <option value="BAST2">BAST-2 (Serah Terima Akhir / FHO & Pencairan Retensi)</option>
              </select>
            </div>

            {/* Pilih Proyek */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Proyek Terkait</label>
              <select
                value={editingBast.projectId || ''}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-white"
              >
                <option value="">-- Pilih Proyek --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.client})
                  </option>
                ))}
              </select>
            </div>

            {/* Nomor BAST */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Surat BAST</label>
              <input
                type="text"
                required
                value={editingBast.bastNumber || ''}
                onChange={(e) => setEditingBast({ ...editingBast, bastNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 bg-white"
                placeholder="misal: 015/BAST-1/RCS-PROJ/VIII/2026"
              />
            </div>
          </div>

          {/* Ref BAST1 (if BAST2) */}
          {editingBast.type === 'BAST2' && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/80">
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Referensi Nomor Dokumen BAST-1
              </label>
              <input
                type="text"
                required
                value={editingBast.refBast1Number || ''}
                onChange={(e) => setEditingBast({ ...editingBast, refBast1Number: e.target.value })}
                className="w-full border border-emerald-300 rounded-xl p-2.5 text-xs font-bold bg-white text-emerald-900"
                placeholder="misal: 015/BAST-1/RCS-PROJ/VIII/2026"
              />
            </div>
          )}

          {/* Nilai Kontrak & Retensi */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Perhitungan Nilai Kontrak & Retensi 5%</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Kontrak SPK (Rp)</label>
                <input
                  type="number"
                  value={editingBast.contractValue || 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const pct = editingBast.retentionPct ?? 5;
                    setEditingBast({
                      ...editingBast,
                      contractValue: val,
                      retentionAmount: (val * pct) / 100,
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs font-bold bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">Persentase Retensi (%)</label>
                <input
                  type="number"
                  value={editingBast.retentionPct ?? 5}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value) || 0;
                    const val = editingBast.contractValue || 0;
                    setEditingBast({
                      ...editingBast,
                      retentionPct: pct,
                      retentionAmount: (val * pct) / 100,
                    });
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs font-bold bg-white text-rose-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">Nilai Rupiah Retensi (5%)</label>
                <input
                  type="number"
                  value={editingBast.retentionAmount || 0}
                  onChange={(e) =>
                    setEditingBast({ ...editingBast, retentionAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs font-bold bg-white text-rose-700"
                />
              </div>
            </div>
          </div>

          {/* Tanggal & Masa Pemeliharaan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal BAST</label>
              <input
                type="date"
                required
                value={editingBast.bastDate || ''}
                onChange={(e) => setEditingBast({ ...editingBast, bastDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Masa Pemeliharaan (Hari)</label>
              <input
                type="number"
                value={editingBast.maintenanceDays || 180}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 180;
                  const bDate = new Date(editingBast.bastDate || new Date());
                  bDate.setDate(bDate.getDate() + days);
                  setEditingBast({
                    ...editingBast,
                    maintenanceDays: days,
                    maintenanceEndDate: bDate.toISOString().split('T')[0],
                  });
                }}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-white text-indigo-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Akhir Pemeliharaan (FHO)</label>
              <input
                type="date"
                value={editingBast.maintenanceEndDate || ''}
                onChange={(e) => setEditingBast({ ...editingBast, maintenanceEndDate: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold bg-white"
              />
            </div>
          </div>

          {/* Catatan Inspeksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Hasil Inspeksi / Defects</label>
            <textarea
              rows={3}
              value={editingBast.inspectionNotes || ''}
              onChange={(e) => setEditingBast({ ...editingBast, inspectionNotes: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs font-medium bg-white"
              placeholder="Jelaskan kondisi fisik pengerjaan, testing commissioning, atau checklist defect list..."
            />
          </div>

          {/* Signatories */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Penandatangan Dokumen BAST</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pihak Kontraktor (PT RCS)</label>
                <input
                  type="text"
                  value={editingBast.contractorSignatory || ''}
                  onChange={(e) => setEditingBast({ ...editingBast, contractorSignatory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pihak Klien / Owner</label>
                <input
                  type="text"
                  value={editingBast.clientSignatory || ''}
                  onChange={(e) => setEditingBast({ ...editingBast, clientSignatory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Konsultan Pengawas / MK</label>
                <input
                  type="text"
                  value={editingBast.consultantSignatory || ''}
                  onChange={(e) => setEditingBast({ ...editingBast, consultantSignatory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Terbitkan BAST</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PRINTABLE A4 PREVIEW */}
      {activeTab === 'PREVIEW' && selectedBast && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('LIST')}
                className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
              >
                &larr; Kembali
              </button>
              <span className="text-sm font-extrabold text-slate-900">
                Dokumen Cetak A4 - {selectedBast.bastNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> Cetak A4 / PDF
              </button>

              <button
                onClick={() => handleExportBastDocx(selectedBast)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" /> Unduh Word (.docx)
              </button>
            </div>
          </div>

          {/* Printable A4 Page */}
          <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-900 text-xs font-serif leading-relaxed print:p-0 print:border-none print:shadow-none print:max-w-none">
            {/* Kop Surat */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0">
                  RCS
                </div>
                <div>
                  <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">
                    {companyProfile.name || 'PT RAKA CIPTA SERAYA'}
                  </h1>
                  <p className="text-[11px] font-sans text-slate-600">
                    {companyProfile.address || 'Jl. Utama Construction No. 88, Jakarta'} | Telp:{' '}
                    {companyProfile.phone || '021-5549302'}
                  </p>
                  <p className="text-[10px] font-sans text-slate-500">
                    Email: {companyProfile.email || 'official@rakaciptaseraya.co.id'} | Website:
                    www.rakaciptaseraya.co.id
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 pt-2">
              <h2 className="text-base font-bold uppercase tracking-wide border-b-2 border-slate-900 inline-block px-4 pb-0.5">
                {selectedBast.type === 'BAST1'
                  ? 'BERITA ACARA SERAH TERIMA PERTAMA PEKERJAAN (BAST-1)'
                  : 'BERITA ACARA SERAH TERIMA KEDUA / FINAL (BAST-2)'}
              </h2>
              <p className="font-sans text-xs font-bold text-slate-700">Nomor: {selectedBast.bastNumber}</p>
            </div>

            {/* Opening Paragraph */}
            <p className="font-sans leading-relaxed text-justify">
              Pada hari ini, <strong className="font-bold">{getDayName(selectedBast.bastDate)}</strong> tanggal{' '}
              <strong className="font-bold">{formatDate(selectedBast.bastDate)}</strong>, bertempat di{' '}
              {selectedBast.bastCity}, kami yang bertanda tangan di bawah ini secara sah dan penuh kesadaran membuat
              Berita Acara Serah Terima Pekerjaan:
            </p>

            {/* Parties Details */}
            <div className="font-sans space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold">1. PIHAK PERTAMA</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8 font-semibold">
                  {selectedBast.clientRepresentative} ({selectedBast.clientTitle}) – {selectedBast.clientName}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-3 font-bold">2. PIHAK KEDUA</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8 font-semibold">
                  {selectedBast.contractorSignatory} ({selectedBast.contractorTitle}) – {companyProfile.name}
                </span>
              </div>
            </div>

            {/* Clauses */}
            <div className="font-sans space-y-3 leading-relaxed text-justify">
              <p className="font-bold border-b border-slate-300 pb-1">
                KEDUA BELAH PIHAK DENGAN INI MENYATAKAN BERSAMA:
              </p>

              {selectedBast.type === 'BAST1' ? (
                <>
                  <p>
                    1. <strong className="font-bold">Penyelesaian Fisik 100%:</strong> PIHAK KEDUA telah menyelesaikan seluruh lingkup pekerjaan konstruksi fisik untuk proyek <strong className="font-bold">{selectedBast.projectName}</strong> sesuai dengan Kontrak SPK Nomor: <strong className="font-bold">{selectedBast.contractNumber}</strong> tanggal {formatDate(selectedBast.contractDate)}.
                  </p>
                  <p>
                    2. <strong className="font-bold">Masa Pemeliharaan:</strong> Dengan ditandatanganinya BAST-1 ini, maka Masa Pemeliharaan (Garansi Mutu Pekerjaan) selama <strong className="font-bold">{selectedBast.maintenanceDays} Hari Kalender</strong> resmi dimulai terhitung sejak tanggal <strong className="font-bold">{formatDate(selectedBast.bastDate)}</strong> sampai dengan tanggal <strong className="font-bold">{formatDate(selectedBast.maintenanceEndDate)}</strong>.
                  </p>
                  <p>
                    3. <strong className="font-bold">Penahanan Retensi 5%:</strong> PIHAK PERTAMA menahan Dana Jaminan Retensi sebesar <strong className="font-bold">5%</strong> yaitu sejumlah <strong className="font-bold text-rose-800">{formatRupiah(selectedBast.retentionAmount)}</strong> dari total Nilai Kontrak <strong className="font-bold">{formatRupiah(selectedBast.contractValue)}</strong> hingga diterbitkannya BAST-2 (Final Handover).
                  </p>
                  <p>
                    4. <strong className="font-bold">Hasil Inspeksi Lapangan:</strong> {selectedBast.inspectionNotes}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    1. <strong className="font-bold">Masa Pemeliharaan Berakhir:</strong> Masa Pemeliharaan selama {selectedBast.maintenanceDays} Hari Kalender atas proyek <strong className="font-bold">{selectedBast.projectName}</strong> berdasarkan BAST-1 Nomor: <strong className="font-bold">{selectedBast.refBast1Number || '-'}</strong> telah berakhir dengan baik.
                  </p>
                  <p>
                    2. <strong className="font-bold">Pencairan Retensi 100%:</strong> Seluruh perbaikan (defect list / punch list) telah diselesaikan 100% oleh PIHAK KEDUA. Dengan demikian, PIHAK PERTAMA menyetujui pencairan penuh Dana Retensi 5% sebesar <strong className="font-bold text-emerald-800">{formatRupiah(selectedBast.retentionAmount)}</strong> kepada PIHAK KEDUA.
                  </p>
                  <p>
                    3. <strong className="font-bold">Catatan Akhir:</strong> {selectedBast.inspectionNotes}
                  </p>
                </>
              )}
            </div>

            {/* Table Breakdown */}
            <div className="font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Total Nilai Kontrak SPK:</span>
                <span>{formatRupiah(selectedBast.contractValue)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-700">
                <span>Jaminan Retensi Pemeliharaan (5%):</span>
                <span>{formatRupiah(selectedBast.retentionAmount)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-300 pt-1.5">
                <span>
                  {selectedBast.type === 'BAST1'
                    ? 'Nilai Pembayaran Progress Fisik (95%):'
                    : 'Nilai Pencairan Retensi Akhir (100%):'}
                </span>
                <span className="text-indigo-900 text-sm">
                  {formatRupiah(
                    selectedBast.type === 'BAST1'
                      ? selectedBast.contractValue - selectedBast.retentionAmount
                      : selectedBast.retentionAmount
                  )}
                </span>
              </div>
            </div>

            {/* Closing */}
            <p className="font-sans leading-relaxed">
              Demikian Berita Acara Serah Terima ini dibuat dalam rangkap 2 (dua) bermaterai cukup dan memiliki kekuatan
              hukum yang sama untuk dipergunakan sebagaimana mestinya.
            </p>

            {/* Signatures */}
            <div className="font-sans grid grid-cols-3 gap-6 pt-8 text-center text-xs">
              <div>
                <p className="text-slate-500">PIHAK PERTAMA (Klien)</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                  {selectedBast.clientRepresentative}
                </p>
                <p className="text-[10px] text-slate-500">{selectedBast.clientTitle}</p>
              </div>

              <div>
                <p className="text-slate-500">KONSULTAN PENGAWAS (MK)</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                  {selectedBast.consultantSignatory || 'Team Leader MK'}
                </p>
                <p className="text-[10px] text-slate-500">{selectedBast.consultantTitle || 'Konsultan Pengawas'}</p>
              </div>

              <div>
                <p className="text-slate-500">PIHAK KEDUA (Kontraktor)</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                  {selectedBast.contractorSignatory}
                </p>
                <p className="text-[10px] text-slate-500">{selectedBast.contractorTitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
