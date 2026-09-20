import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Copy,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  FileCheck2,
  Stamp,
  Sliders,
  X,
  Mail,
  ShieldAlert,
  Briefcase,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  QrCode,
  ShieldCheck,
  Bookmark,
  BookmarkPlus,
  Save,
  FolderPlus,
  Camera,
  Scan,
  Paperclip,
  Maximize2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CompanyProfile,
  OfficialLetter,
  LetterCategory,
  LetterheadSettings,
  LetterTemplate,
  SubkonContract,
  SubkonOpname,
  Project,
  AppNotification,
  ScannedAttachment,
} from '../../types';
import { DocumentScannerModal } from './DocumentScannerModal';
import { saveAs } from 'file-saver';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { generatePdfFromElement, triggerPrintFallback } from '../../utils/pdfGenerator';
import { SubkonSpkSubmodule } from './SubkonSpkSubmodule';
import { BastSubmodule, BastDocument } from './BastSubmodule';
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
  BorderStyle,
} from 'docx';

interface OfficialLettersModuleProps {
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile?: (profile: CompanyProfile) => void;
  letterhead?: LetterheadSettings;
  projects?: Project[];
  subkonContracts?: SubkonContract[];
  subkonOpnames?: SubkonOpname[];
  onSaveSubkonContract?: (contract: SubkonContract) => void;
  onDeleteSubkonContract?: (id: string) => void;
  onSaveSubkonOpname?: (opname: SubkonOpname) => void;
  onDeleteSubkonOpname?: (id: string) => void;
  letters?: OfficialLetter[];
  onSaveLetter?: (letter: OfficialLetter) => void;
  onDeleteLetter?: (id: string) => void;
  bastList?: BastDocument[];
  onSaveBast?: (bast: BastDocument) => void;
  onDeleteBast?: (id: string) => void;
  templates?: LetterTemplate[];
  onSaveTemplate?: (template: LetterTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
  onTriggerNotification?: (notif: Partial<AppNotification>) => void;
}

const PRESET_LOGOS = [
  {
    id: 'preset-1',
    name: 'Perisai Kontraktor Gold-Blue',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgcng9IjI0IiBmaWxsPSIjMWUyOTNiIi8+PHBhdGggZD0iTTYwIDE2IEw5NSAzMiBWNjQgQzYwIDg1DYAgMTA0IDYwIDEwNCBDNjAgMTA0IDI1IDg1IDI1IDY0IFYzMiBaIiBmaWxsPSIjMjU2M2ViIiBzdHJva2U9IiMzOGJkZjgiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik00MiA3NSBWNDggTDYwIDM4IEw3OCA0OCBWNzUgSDY2IFY5OCBINTQgVjc1IFoiIGZpbGw9IiNmYmJmMjQiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjMwIiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+',
  },
  {
    id: 'preset-2',
    name: 'Balok Crane Infra Orange-Navy',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgcng9IjI0IiBmaWxsPSIjMGYxNzJhIi8+PHBhdGggZD0iTTIwIDk1IEgxMDAgVjg1IEgyMCBaIE0zMCA4NSBMNTAgMzUgSDcwIEw5MCA4NSBaIiBmaWxsPSIjZjk3MzE2Ii8+PHBhdGggZD0iTTUwIDM1IEg5NSBWMjUgSDQwIFoiIGZpbGw9IiNmYmkyM2MiLz48Y2lyY2xlIGN4PSI4NSIgY3k9IjU1IiByPSI4IiBmaWxsPSIjMzhiZGY8Ii8+PC9zdmc+',
  },
  {
    id: 'preset-3',
    name: 'Badge Monogram GMK Emerald',
    url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgcng9IjI0IiBmaWxsPSIjMDIyYzIyIi8+PHBhdGggZD0iTTMwIDMwIEg5MCBWOTAgSDMwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBhdGggZD0iTTQ1IDQ1IEg7NSBWNzUgSDQ1IFoiIGZpbGw9IiMwNTk2NjkiLz48dGV4dCB4PSI2MCIgeT0iNjciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R01LPC90ZXh0Pjwvc3ZnPg==',
  },
];

// Default Seed Data for Letter Templates
export const INITIAL_TEMPLATES: LetterTemplate[] = [
  {
    id: 'TPL-SURAT-JALAN',
    name: 'Surat Jalan Pengiriman Barang & Material',
    category: 'SURAT_TUGAS',
    description: 'Format resmi pengiriman material/barang proyek, rincian ekspedisi, driver, dan tanda terima.',
    defaultTitle: 'Surat Jalan Pengiriman Barang & Material Proyek',
    defaultSubject: 'Surat Jalan Pengiriman Material Proyek',
    defaultEnclosure: '1 (satu) Berkas Lembar Kirim',
    defaultOpeningText: 'Bersama surat ini, kami mengirimkan material/barang proyek dengan rincian armada dan tujuan pengiriman sebagai berikut:',
    defaultBodyText:
      '1. Driver / Pengangkut: [Nama Sopir] (No. HP: 0812-xxxx-xxxx)\n' +
      '2. Nomor Kendaraan / Plat: [B 9123 RCS] (Truk Engkel / Tronton)\n' +
      '3. Rincian Barang Kiriman:\n' +
      '   - Material Semen Padang @50kg: 200 Sak\n' +
      '   - Besi Ulir 12mm x 12m: 150 Batang\n' +
      '   - Geotextile Woven 200gr: 5 Roll\n' +
      '4. Lokasi Tujuan: Site Project PT Raka Cipta Seraya - Area Gudang Utama.',
    defaultClosingText: 'Mohon barang/material tersebut di atas dapat diterima dan diperiksa dalam keadaan baik serta ditandatangani bukti serah terimanya.',
    defaultSignatoryTitle: 'Manager Logistik & Operasional',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'TPL-SPK',
    name: 'Surat Perintah Kerja (SPK) Subkon / Mitra',
    category: 'SPK',
    description: 'Format penerbitan perintah kerja proyek, lingkup pengerjaan, nilai kontrak, dan termin.',
    defaultTitle: 'Surat Perintah Kerja (SPK) Pelaksanaan Pekerjaan Proyek',
    defaultSubject: 'Surat Perintah Kerja (SPK)',
    defaultEnclosure: '1 (satu) Berkas Lampiran Spesifikasi Teknis',
    defaultOpeningText: 'Dengan hormat,\nSehubungan dengan kesepakatan hasil pembahasan teknis dan komersial, PT Raka Cipta Seraya memberikan Surat Perintah Kerja (SPK) kepada:',
    defaultBodyText:
      '1. Lingkup Pekerjaan: Pelaksanaan pengerjaan konstruksi/pemasangan material proyek sesuai spesifikasi.\n' +
      '2. Nilai Pekerjaan: Sebesar Rp 250.000.000,- (Dua Ratus Lima Puluh Juta Rupiah) belum termasuk PPN.\n' +
      '3. Waktu Pelaksanaan: 45 (empat puluh lima) hari kalender terhitung sejak penerbitan SPK ini.\n' +
      '4. Syarat Pembayaran: Pembayaran berbasis termin progress fisik pekerjaan yang disetujui Pengawas Proyek.',
    defaultClosingText: 'Demikian Surat Perintah Kerja ini dibuat untuk dilaksanakan sebagaimana mestinya dengan penuh rasa tanggung jawab.',
    defaultSignatoryTitle: 'Direktur Utama',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'TPL-SPH',
    name: 'Surat Penawaran Harga (SPH / Commercial Offer)',
    category: 'SPH',
    description: 'Format penawaran harga resmi pengadaan material, barang, atau jasa proyek.',
    defaultTitle: 'Surat Penawaran Harga (SPH)',
    defaultSubject: 'Penawaran Harga Pekerjaan & Supplai Material Proyek',
    defaultEnclosure: '1 (satu) Berkas RAB Penawaran',
    defaultOpeningText: 'Dengan hormat,\nMerujuk pada permintaan penawaran harga (RFP) dari pihak Bapak/Ibu, bersama surat ini kami mengajukan rincian penawaran harga sebagai berikut:',
    defaultBodyText:
      '1. Rincian Pekerjaan: Pengadaan material beton, besi ulir, dan jasa pengerjaan struktur.\n' +
      '2. Total Harga Penawaran: Rp 850.000.000,- (Delapan Ratus Lima Puluh Juta Rupiah) inc. PPN.\n' +
      '3. Masa Berlaku Penawaran: Berlaku selama 30 (tiga puluh) hari kalender sejak tanggal penerbitan.\n' +
      '4. Metode Pembayaran: DP 20% saat pelimpahan PO, pelunasan sesuai progress kirim.',
    defaultClosingText: 'Besar harapan kami dapat bekerjasama dengan perusahaan Bapak/Ibu. Atas perhatiannya disampaikan terima kasih.',
    defaultSignatoryTitle: 'Manager Marketing & Tender',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'TPL-SKK',
    name: 'Surat Keterangan Kerja (Employment Certificate)',
    category: 'SKK',
    description: 'Format keterangan resmi masa kerja karyawan untuk instansi / perbankan.',
    defaultTitle: 'Surat Keterangan Kerja (Employment Certificate)',
    defaultSubject: 'Surat Keterangan Kerja Karyawan',
    defaultEnclosure: '-',
    defaultOpeningText: 'Yang bertanda tangan di bawah ini, Management PT Raka Cipta Seraya menerangkan bahwa:',
    defaultBodyText:
      'Nama: [Nama Karyawan]\n' +
      'NIK / NIP: [Nomor Induk Karyawan]\n' +
      'Jabatan: [Jabatan Terakhir]\n' +
      'Masa Kerja: [Tanggal Mulai] s.d [Tanggal Selesai]\n' +
      'Bahwa yang bersangkutan adalah benar pernah bekerja pada perusahaan kami dengan dedikasi dan kinerja yang sangat baik.',
    defaultClosingText: 'Demikian surat keterangan kerja ini diberikan agar dapat dipergunakan sebagaimana mestinya.',
    defaultSignatoryTitle: 'Head of Human Resources Department',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'TPL-SURAT-TUGAS',
    name: 'Surat Tugas Inspeksi & Penugasan Lapangan',
    category: 'SURAT_TUGAS',
    description: 'Format instruksi kerja lapangan untuk tim teknisi dan pengawas proyek.',
    defaultTitle: 'Surat Tugas Penugasan Lapangan Proyek',
    defaultSubject: 'Surat Tugas Supervision & Inspeksi Site',
    defaultEnclosure: '1 (satu) Berkas Surat Jalan',
    defaultOpeningText: 'Direksi PT Raka Cipta Seraya memberikan tugas resmi kepada personil di bawah ini:',
    defaultBodyText:
      '1. Nama / Jabatan: [Nama Personil] - Site Engineer / Project Manager.\n' +
      '2. Lokasi Penugasan: Proyek Pembangunan Gedung & Infrastruktur.\n' +
      '3. Waktu Penugasan: Berlaku mulai tanggal [Tanggal] s.d [Tanggal].\n' +
      '4. Tugas & Kewajiban: Melaksanakan pengawasan mutu teknis, koordinasi dengan subkontraktor, dan menyusun laporan progress mingguan.',
    defaultClosingText: 'Demikian Surat Tugas ini dibuat untuk dipergunakan dan dilaksanakan dengan sebaik-baiknya.',
    defaultSignatoryTitle: 'Manager Operasional',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'TPL-UNDANGAN',
    name: 'Surat Undangan Rapat Evaluasi Proyek',
    category: 'UNDANGAN',
    description: 'Format undangan rapat koordinasi mingguan atau bulanan proyek.',
    defaultTitle: 'Surat Undangan Rapat Evaluasi Proyek',
    defaultSubject: 'Undangan Rapat Evaluasi & Coordination Meeting',
    defaultEnclosure: '1 (satu) Lembar Agenda Rapat',
    defaultOpeningText: 'Dengan hormat,\nDalam rangka koordinasi pelaksanaan pengerjaan proyek dan evaluasi progress bulanan, kami mengundang Bapak/Ibu untuk hadir pada rapat yang akan dilaksanakan pada:',
    defaultBodyText:
      'Hari / Tanggal: Senin, 10 Agustus 2026\nWaktu: Pukul 09.00 WIB - Selesai\nTempat: Ruang Rapat Utama PT Raka Cipta Seraya / Site Office Proyek\nAgenda Rapat: Evaluasi Progress Fisik, Review Material, dan Jadwal Kurva-S.',
    defaultClosingText: 'Mengingat pentingnya agenda rapat ini, kehadiran tepat waktu sangat kami harapkan. Atas perhatiannya kami ucapkan terima kasih.',
    defaultSignatoryTitle: 'Direktur Utama',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'TPL-SP1',
    name: 'Surat Peringatan Pertama (SP-1) Kedisiplinan',
    category: 'SP',
    description: 'Format teguran tertulis kedisiplinan dan evaluasi tata tertib karyawan.',
    defaultTitle: 'Surat Peringatan Pertama (SP 1)',
    defaultSubject: 'Surat Peringatan Kedisiplinan Karyawan',
    defaultEnclosure: '-',
    defaultOpeningText: 'Surat Peringatan Pertama (SP-1) ini diterbitkan oleh Manajemen PT Raka Cipta Seraya kepada:',
    defaultBodyText:
      'Nama: [Nama Karyawan]\n' +
      'Jabatan: [Jabatan Karyawan]\n' +
      'Divisi: [Nama Divisi / Proyek]\n' +
      'Alasan Penerbitan: Berdasarkan evaluasi absensi & kedisiplinan kerja, saudara telah melakukan tindakan keterlambatan tanpa konfirmasi selama 3 hari berturut-turut.\n' +
      'Ketentuan SP-1: Surat Peringatan ini berlaku selama 6 (enam) bulan.',
    defaultClosingText: 'Demikian Surat Peringatan ini disampaikan agar menjadi perhatian serius dan bahan perbaikan kedisiplinan saudara.',
    defaultSignatoryTitle: 'Head of Human Resources Department',
    isSystemDefault: true,
    createdAt: '2026-07-31T00:00:00Z',
  },
];

// Default Seed Data for Official Letters
const initialLetters: OfficialLetter[] = [
  {
    id: 'LTR-001',
    letterNumber: '088/SPK/PT-RCS/VIII/2026',
    category: 'SPK',
    title: 'Surat Perintah Kerja (SPK) Subkontraktor Pembesian',
    subject: 'Surat Perintah Kerja Pelaksanaan Pembesian Struktur',
    enclosure: '1 (satu) Berkas Lampiran Spesifikasi Teknis',
    letterDate: '2026-08-01',
    city: 'Jakarta',
    recipientName: 'Ir. Budi Santoso',
    recipientTitle: 'Direktur Utama',
    recipientCompany: 'PT Baja Konstruksi Mandiri',
    recipientAddress: 'Jl. Industri Raya No. 45, Kawasan Cikarang, Bekasi',
    openingText: 'Dengan hormat,\nSehubungan dengan kesepakatan hasil negosiasi tender dan klarifikasi teknis pekerjaan proyek pembangunan gedung kantor, bersama surat ini PT Raka Cipta Seraya menugaskan pihak kedua:',
    bodyParagraphs: [
      '1. Lingkup Pekerjaan: Pelaksanaan pengerjaan fabrikasi & instalasi besi beton bertulang ulir D13-D25 sesuai gambar kerja proyek.',
      '2. Nilai Pekerjaan: Sebesar Rp 450.000.000,- (Empat Ratus Lima Puluh Juta Rupiah) belum termasuk PPN 11%.',
      '3. Jangka Waktu Pelaksanaan: Berlangsung selama 60 (enam puluh) hari kalender terhitung sejak tanggal 5 Agustus 2026 sampai dengan 4 Oktober 2026.',
      '4. Sistem Pembayaran: Pembayaran dilakukan secara bertahap (Termin Progress) sesuai prestasi fisik pekerjaan yang telah diverifikasi oleh Project Manager di lapangan.',
      '5. Syarat Keselamatan Kerja (K3): Pihak kedua wajib mematuhi seluruh standar K3L & APD lengkap selama berada di area proyek.'
    ],
    closingText: 'Demikian Surat Perintah Kerja ini diterbitkan untuk dilaksanakan dengan penuh rasa tanggung jawab. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.',
    signatoryName: 'Ir. Raka Cipta Seraya, M.T.',
    signatoryTitle: 'Direktur Utama',
    signatoryNik: 'NIK. 19850412 201001 1 002',
    showStamp: true,
    showQrCode: true,
    qrCodeValue: 'https://verifikasi.rakaciptaseraya.co.id/verify?id=LTR-001&no=088%2FSPK%2FPT-RCS%2FVIII%2F2026',
    status: 'Diterbitkan',
    scannedAttachments: [
      {
        id: 'SCAN-001',
        title: 'Lampiran Fisik Kontrak & Spesifikasi Teknis Besi',
        scannedAt: '2026-08-01T14:30:00Z',
        dataUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&auto=format&fit=crop&q=80',
        pageNumber: 1,
        filterUsed: 'magic',
      },
    ],
    createdAt: '2026-07-30T10:00:00Z',
    updatedAt: '2026-07-30T10:00:00Z',
  },
  {
    id: 'LTR-002',
    letterNumber: '112/SPH/PT-RCS/VIII/2026',
    category: 'SPH',
    title: 'Surat Penawaran Harga Pekerjaan Infrastruktur Jalan',
    subject: 'Penawaran Harga Pekerjaan Pengaspalan & Drainase Proyek',
    enclosure: '1 (satu) Berkas BOQ & Rincian RAB',
    letterDate: '2026-08-02',
    city: 'Jakarta',
    recipientName: 'H. Ahmad Subagyo, S.E.',
    recipientTitle: 'Head of Procurement',
    recipientCompany: 'PT Nusantara Developers Tbk',
    recipientAddress: 'Gedung Menara Mandiri Lt. 18, Jl. Jend. Sudirman, Jakarta Selatan',
    openingText: 'Dengan hormat,\nMemenuhi undangan tender nomor 042/TND/ND/VII/2026 perihal Penawaran Pekerjaan Infrastruktur Jalan Proyek Kawasan Industri, kami dari PT Raka Cipta Seraya mengajukan penawaran harga sebagai berikut:',
    bodyParagraphs: [
      '1. Total Nilai Penawaran: Rp 1.250.000.000,- (Satu Miliar Dua Ratus Lima Puluh Juta Rupiah) inc. PPN.',
      '2. Masa Berlaku Penawaran: Penawaran harga ini berlaku selama 30 (tiga puluh) hari kalender terhitung sejak tanggal penerbitan surat ini.',
      '3. Garansi Pekerjaan: Garansi pemeliharaan pekerjaan diberikan selama 180 (seratus delapan puluh) hari kalender pasca BAST I.',
      '4. Lampiran Pendukung: Terlampir Rekapitulasi Rincian Anggaran Biaya (RAB), Spesifikasi Material Mix Asphalt Hotmix AC-WC, dan Analisa Harga Satuan Pekerjaan (AHSP).'
    ],
    closingText: 'Besar harapan kami untuk dapat berpartisipasi dan menjalin kemitraan profesional dalam proyek ini. Demikian penawaran ini kami sampaikan, atas perhatian Bapak/Ibu kami ucapkan terima kasih.',
    signatoryName: 'Dra. Hendra Wijaya',
    signatoryTitle: 'Manager Marketing & Tender',
    signatoryNik: 'NIK. 19880215 201203 1 005',
    showStamp: true,
    showQrCode: true,
    qrCodeValue: 'https://verifikasi.rakaciptaseraya.co.id/verify?id=LTR-002&no=112%2FSPH%2FPT-RCS%2FVIII%2F2026',
    status: 'Diterbitkan',
    createdAt: '2026-07-31T08:30:00Z',
    updatedAt: '2026-07-31T08:30:00Z',
  },
  {
    id: 'LTR-003',
    letterNumber: '045/SKK/HRD-RCS/VIII/2026',
    category: 'SKK',
    title: 'Surat Keterangan Kerja (Certificate of Employment)',
    subject: 'Surat Keterangan Pengalaman Kerja',
    enclosure: '-',
    letterDate: '2026-08-01',
    city: 'Jakarta',
    recipientName: 'Kepada Pihak Yang Berkepentingan',
    recipientTitle: 'Di Tempat',
    recipientCompany: '-',
    recipientAddress: 'Di Tempat',
    openingText: 'Yang bertanda tangan di bawah ini, Manajemen PT Raka Cipta Seraya menerangkan dengan sebenarnya bahwa:',
    bodyParagraphs: [
      'Nama: Muhammad Rizky Febrian, S.T.',
      'NIK Karyawan: EMP-2022-089',
      'Jabatan Terakhir: Site Supervisor / Pengawas Lapangan',
      'Masa Kerja: 10 Agustus 2022 s.d 31 Juli 2026',
      'Bahwa yang bersangkutan telah bekerja pada PT Raka Cipta Seraya dengan menunjukkan dedikasi, integritas, dan kontribusi kerja yang sangat baik dalam pengelolaan proyek-proyek konstruksi nasional.',
      'Surat Keterangan Kerja ini diterbitkan atas permintaan yang bersangkutan untuk dipergunakan sebagaimana mestinya.'
    ],
    closingText: 'Demikian surat keterangan ini dibuat agar dapat dipergunakan dengan sebaik-baiknya.',
    signatoryName: 'Siti Rahmawati, S.Psi.',
    signatoryTitle: 'Head of Human Resources Department',
    signatoryNik: 'NIK. 19910510 201502 2 001',
    showStamp: true,
    showQrCode: true,
    qrCodeValue: 'https://verifikasi.rakaciptaseraya.co.id/verify?id=LTR-003&no=045%2FSKK%2FHRD-RCS%2FVIII%2F2026',
    status: 'Diterbitkan',
    createdAt: '2026-07-31T09:00:00Z',
    updatedAt: '2026-07-31T09:00:00Z',
  }
];

export const OfficialLettersModule: React.FC<OfficialLettersModuleProps> = ({
  companyProfile,
  onUpdateCompanyProfile,
  letterhead,
  projects = [],
  subkonContracts = [],
  subkonOpnames = [],
  onSaveSubkonContract = () => {},
  onDeleteSubkonContract = () => {},
  onSaveSubkonOpname = () => {},
  onDeleteSubkonOpname = () => {},
  letters: externalLetters,
  onSaveLetter,
  onDeleteLetter,
  bastList: externalBastList,
  onSaveBast,
  onDeleteBast,
  templates: externalTemplates,
  onSaveTemplate,
  onDeleteTemplate,
  onTriggerNotification,
}) => {
  const [internalLetters, setInternalLetters] = useState<OfficialLetter[]>(initialLetters);
  const letters = externalLetters !== undefined ? externalLetters : internalLetters;

  const setLetters = (updater: OfficialLetter[] | ((prev: OfficialLetter[]) => OfficialLetter[])) => {
    if (typeof updater === 'function') {
      setInternalLetters((prev) => updater(prev));
    } else {
      setInternalLetters(updater);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  // Templates State with localStorage persistence
  const [internalTemplates, setInternalTemplates] = useState<LetterTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('rcs_official_letter_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...INITIAL_TEMPLATES, ...parsed.filter((p: LetterTemplate) => !p.isSystemDefault)];
        }
      }
    } catch (err) {
      console.error('Failed to load letter templates:', err);
    }
    return INITIAL_TEMPLATES;
  });
  const templates = externalTemplates !== undefined ? externalTemplates : internalTemplates;

  const [activeTab, setActiveTab] = useState<'LIST' | 'SUBKON' | 'BAST' | 'FORM' | 'PREVIEW' | 'TEMPLATES'>('LIST');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('ALL');
  const [templateToast, setTemplateToast] = useState<string | null>(null);

  // Modal State for Saving Template
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const [editingLetter, setEditingLetter] = useState<OfficialLetter | null>(null);
  const [previewLetter, setPreviewLetter] = useState<OfficialLetter | null>(initialLetters[0]);

  // Camera Document Scanner Modal & Lightbox State
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerTargetLetterId, setScannerTargetLetterId] = useState<string | null>(null);
  const [lightboxAttachment, setLightboxAttachment] = useState<ScannedAttachment | null>(null);
  const [formScannedAttachments, setFormScannedAttachments] = useState<ScannedAttachment[]>([]);

  // Camera Scan Handlers
  const handleSaveScannedDocs = (newScans: ScannedAttachment[]) => {
    const targetId = scannerTargetLetterId || previewLetter?.id;
    if (targetId) {
      setLetters((prev) =>
        prev.map((l) => {
          if (l.id === targetId) {
            const existing = l.scannedAttachments || [];
            const updated = { ...l, scannedAttachments: [...existing, ...newScans] };
            if (previewLetter?.id === l.id) {
              setPreviewLetter(updated);
            }
            return updated;
          }
          return l;
        })
      );
    }

    setFormScannedAttachments((prev) => [...prev, ...newScans]);
    if (onTriggerNotification) {
      onTriggerNotification(
        'Scan Dokumen Fisik Disimpan',
        `Berhasil memindai ${newScans.length} halaman dokumen fisik via kamera.`,
        'success'
      );
    }
  };

  const handleDeleteScannedAttachment = (letterId: string, attachId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus lampiran hasil scan ini?')) {
      setLetters((prev) =>
        prev.map((l) => {
          if (l.id === letterId) {
            const filtered = (l.scannedAttachments || []).filter((a) => a.id !== attachId);
            const updated = { ...l, scannedAttachments: filtered };
            if (previewLetter?.id === l.id) {
              setPreviewLetter(updated);
            }
            return updated;
          }
          return l;
        })
      );
      setFormScannedAttachments((prev) => prev.filter((a) => a.id !== attachId));
    }
  };

  // Logo Settings State
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Loading & Transition Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exportingWordId, setExportingWordId] = useState<string | null>(null);

  // Safe date formatter for letter date
  const formatLetterDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (/[a-zA-Z]/.test(dateStr)) return dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const d = new Date(year, month, day);
          return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const effectiveLogoUrl =
    companyProfile.logoUrl ||
    letterhead?.logoUrl ||
    PRESET_LOGOS[0].url;

  const handleSelectLogo = (url: string) => {
    if (onUpdateCompanyProfile) {
      onUpdateCompanyProfile({
        ...companyProfile,
        logoUrl: url,
      });
    }
  };

  const handleFileUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && onUpdateCompanyProfile) {
          onUpdateCompanyProfile({
            ...companyProfile,
            logoUrl: result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Form State
  const [formCategory, setFormCategory] = useState<LetterCategory>('SPK');
  const [formNumber, setFormNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formEnclosure, setFormEnclosure] = useState('1 (satu) Berkas');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCity, setFormCity] = useState(companyProfile.city || 'Jakarta');

  const [formRecipientName, setFormRecipientName] = useState('');
  const [formRecipientTitle, setFormRecipientTitle] = useState('');
  const [formRecipientCompany, setFormRecipientCompany] = useState('');
  const [formRecipientAddress, setFormRecipientAddress] = useState('');

  const [formOpeningText, setFormOpeningText] = useState('');
  const [formBodyText, setFormBodyText] = useState('');
  const [formClosingText, setFormClosingText] = useState('');

  const [formSignatoryName, setFormSignatoryName] = useState(companyProfile.directorName || 'Ir. Raka Cipta Seraya, M.T.');
  const [formSignatoryTitle, setFormSignatoryTitle] = useState(companyProfile.directorTitle || 'Direktur Utama');
  const [formSignatoryNik, setFormSignatoryNik] = useState('NIK. 19850412 201001 1 002');
  const [formShowStamp, setFormShowStamp] = useState(true);
  const [formShowQrCode, setFormShowQrCode] = useState(true);
  const [formQrCodeValue, setFormQrCodeValue] = useState('');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Diterbitkan' | 'Arsip'>('Diterbitkan');

  // Letterhead Edit Options
  const [includeKop, setIncludeKop] = useState(true);

  // Filter letters
  const filteredLetters = letters.filter((l) => {
    const matchesSearch =
      l.letterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || l.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Template Quick Selector Preset Loader
  const handleSelectTemplate = (category: LetterCategory) => {
    setFormCategory(category);
    const dateCode = new Date().toLocaleDateString('id-ID', { month: '2-digit', year: 'numeric' }).replace('/', '/');
    const randomSeq = String(Math.floor(Math.random() * 80) + 10).padStart(3, '0');

    if (category === 'SPK') {
      setFormNumber(`${randomSeq}/SPK/PT-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Perintah Kerja (SPK) Pelaksanaan Pekerjaan Proyek');
      setFormSubject('Surat Perintah Kerja (SPK)');
      setFormOpeningText('Dengan hormat,\nSehubungan dengan kesepakatan hasil pembahasan teknis dan komersial, PT Raka Cipta Seraya memberikan Surat Perintah Kerja (SPK) kepada:');
      setFormBodyText(
        '1. Lingkup Pekerjaan: Pelaksanaan pengerjaan konstruksi/pemasangan material proyek sesuai spesifikasi.\n' +
        '2. Nilai Pekerjaan: Sebesar Rp 250.000.000,- (Dua Ratus Lima Puluh Juta Rupiah) belum termasuk PPN.\n' +
        '3. Waktu Pelaksanaan: 45 (empat puluh lima) hari kalender terhitung sejak penerbitan SPK ini.\n' +
        '4. Syarat Pembayaran: Pembayaran berbasis termin progress fisik pekerjaan yang disetujui Pengawas Proyek.'
      );
      setFormClosingText('Demikian Surat Perintah Kerja ini dibuat untuk dilaksanakan sebagaimana mestinya dengan penuh rasa tanggung jawab.');
    } else if (category === 'SPH') {
      setFormNumber(`${randomSeq}/SPH/PT-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Penawaran Harga (SPH)');
      setFormSubject('Penawaran Harga Pekerjaan & Supplai Material Proyek');
      setFormOpeningText('Dengan hormat,\nMerujuk pada permintaan penawaran harga (RFP) dari pihak Bapak/Ibu, bersama surat ini kami mengajukan rincian penawaran harga sebagai berikut:');
      setFormBodyText(
        '1. Rincian Pekerjaan: Pengadaan material beton, besi ulir, dan jasa pengerjaan struktur.\n' +
        '2. Total Harga Penawaran: Rp 850.000.000,- (Delapan Ratus Lima Puluh Juta Rupiah) inc. PPN.\n' +
        '3. Masa Berlaku Penawaran: Berlaku selama 30 (tiga puluh) hari kalender sejak tanggal penerbitan.\n' +
        '4. Metode Pembayaran: DP 20% saat pelimpahan PO, pelunasan sesuai progress kirim.'
      );
      setFormClosingText('Besar harapan kami dapat bekerjasama dengan perusahaan Bapak/Ibu. Atas perhatiannya disampaikan terima kasih.');
    } else if (category === 'SKK') {
      setFormNumber(`${randomSeq}/SKK/HRD-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Keterangan Kerja (Employment Certificate)');
      setFormSubject('Surat Keterangan Kerja Karyawan');
      setFormOpeningText('Yang bertanda tangan di bawah ini, Management PT Raka Cipta Seraya menerangkan bahwa:');
      setFormBodyText(
        'Nama: [Nama Karyawan]\n' +
        'NIK: [Nomor Induk Karyawan]\n' +
        'Jabatan: [Jabatan Terakhir]\n' +
        'Masa Kerja: [Tanggal Mulai] s.d [Tanggal Selesai]\n' +
        'Bahwa yang bersangkutan adalah benar pernah bekerja pada perusahaan kami dengan dedikasi dan kinerja yang sangat baik.'
      );
      setFormClosingText('Demikian surat keterangan kerja ini diberikan agar dapat dipergunakan sebagaimana mestinya.');
      setFormSignatoryName('Siti Rahmawati, S.Psi.');
      setFormSignatoryTitle('Head of HRD');
    } else if (category === 'SURAT_TUGAS') {
      setFormNumber(`${randomSeq}/ST/OPS-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Tugas Penugasan Lapangan Proyek');
      setFormSubject('Surat Tugas Supervision & Inspeksi Site');
      setFormOpeningText('Direksi PT Raka Cipta Seraya memberikan tugas resmi kepada personil di bawah ini:');
      setFormBodyText(
        '1. Nama / Jabatan: [Nama Personil] - Site Engineer / Project Manager.\n' +
        '2. Lokasi Penugasan: Proyek Pembangunan Gedung & Infrastruktur.\n' +
        '3. Waktu Penugasan: Berlaku mulai tanggal [Tanggal] s.d [Tanggal].\n' +
        '4. Tugas & Kewajiban: Melaksanakan pengawasan mutu teknis, koordinasi dengan subkontraktor, dan menyusun laporan progress mingguan.'
      );
      setFormClosingText('Demikian Surat Tugas ini dibuat untuk dipergunakan dan dilaksanakan dengan sebaik-baiknya.');
    } else if (category === 'SP') {
      setFormNumber(`${randomSeq}/SP-1/HRD-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Peringatan Pertama (SP 1)');
      setFormSubject('Surat Peringatan Kedisiplinan Karyawan');
      setFormOpeningText('Surat Peringatan Pertama (SP-1) ini diterbitkan oleh Manajemen PT Raka Cipta Seraya kepada:');
      setFormBodyText(
        'Nama: [Nama Karyawan]\n' +
        'Jabatan: [Jabatan Karyawan]\n' +
        'Divisi: [Nama Divisi / Proyek]\n' +
        'Alasan Penerbitan: Berdasarkan evaluasi absensi & kedisiplinan kerja, saudara telah melakukan tindakan keterlambatan tanpa konfirmasi selama 3 hari berturut-turut.\n' +
        'Ketentuan SP-1: Surat Peringatan ini berlaku selama 6 (enam) bulan. Apabila tidak ada perbaikan kinerja, maka perusahaan akan mengambil tindakan ketat sesuai aturan ketenagakerjaan.'
      );
      setFormClosingText('Demikian Surat Peringatan ini disampaikan agar menjadi perhatian serius dan bahan perbaikan kedisiplinan saudara.');
      setFormSignatoryName('Siti Rahmawati, S.Psi.');
      setFormSignatoryTitle('Head of HRD');
    } else if (category === 'UNDANGAN') {
      setFormNumber(`${randomSeq}/UND/PT-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Undangan Rapat Evaluasi Proyek');
      setFormSubject('Undangan Rapat Evaluasi & Coordination Meeting');
      setFormOpeningText('Dengan hormat,\nDalam rangka koordinasi pelaksanaan pengerjaan proyek dan evaluasi progress bulanan, kami mengundang Bapak/Ibu untuk hadir pada rapat yang akan dilaksanakan pada:');
      setFormBodyText(
        'Hari / Tanggal: Senin, 10 Agustus 2026\n' +
        'Waktu: Pukul 09.00 WIB - Selesai\n' +
        'Tempat: Ruang Rapat Utama PT Raka Cipta Seraya / Site Office Proyek\n' +
        'Agenda Rapat: Evaluasi Progress Fisik, Review Material, dan Jadwal Kurva-S.'
      );
      setFormClosingText('Mengingat pentingnya agenda rapat ini, kehadiran tepat waktu sangat kami harapkan. Atas perhatiannya kami ucapkan terima kasih.');
    } else {
      setFormNumber(`${randomSeq}/SURAT/PT-RCS/${dateCode.replace('.', '/')}`);
      setFormTitle('Surat Perjanjian Kerjasama (MOU) / Permohonan');
      setFormSubject('Surat Permohonan Kerjasama');
      setFormOpeningText('Dengan hormat,\nBersama surat ini PT Raka Cipta Seraya menyampaikan hal-hal sebagai berikut:');
      setFormBodyText('Isikan poin-poin penjelasan surat resmi di sini...');
      setFormClosingText('Demikian surat ini disampaikan, atas perhatian dan kerjasamanya diucapkan terima kasih.');
    }
  };

  // Open Form New
  const handleOpenNewForm = () => {
    setEditingLetter(null);
    handleSelectTemplate('SPK');
    setFormRecipientName('PT Kontraktor Mitra Utama');
    setFormRecipientTitle('Direktur');
    setFormRecipientCompany('PT Kontraktor Mitra Utama');
    setFormRecipientAddress('Jl. Raya Boulevard No. 12, Jakarta');
    setFormShowQrCode(true);
    setFormQrCodeValue('');
    setFormScannedAttachments([]);
    setActiveTab('FORM');
  };

  // Open Form Edit
  const handleOpenEditForm = (letter: OfficialLetter) => {
    setEditingLetter(letter);
    setFormCategory(letter.category);
    setFormNumber(letter.letterNumber);
    setFormTitle(letter.title);
    setFormSubject(letter.subject);
    setFormEnclosure(letter.enclosure || '-');
    setFormDate(letter.letterDate || new Date().toISOString().split('T')[0]);
    setFormCity(letter.city || companyProfile.city || 'Jakarta');

    setFormRecipientName(letter.recipientName || '');
    setFormRecipientTitle(letter.recipientTitle || '');
    setFormRecipientCompany(letter.recipientCompany || '');
    setFormRecipientAddress(letter.recipientAddress || '');

    setFormOpeningText(letter.openingText || '');
    setFormBodyText((letter.bodyParagraphs || []).join('\n'));
    setFormClosingText(letter.closingText || '');

    setFormSignatoryName(letter.signatoryName || companyProfile.directorName || 'Ir. Raka Cipta Seraya, M.T.');
    setFormSignatoryTitle(letter.signatoryTitle || companyProfile.directorTitle || 'Direktur Utama');
    setFormSignatoryNik(letter.signatoryNik || '');
    setFormShowStamp(letter.showStamp ?? true);
    setFormShowQrCode(letter.showQrCode ?? true);
    setFormQrCodeValue(
      letter.qrCodeValue ||
        `https://verifikasi.rakaciptaseraya.co.id/verify?id=${letter.id}&no=${encodeURIComponent(letter.letterNumber)}`
    );
    setFormStatus(letter.status || 'Diterbitkan');
    setFormScannedAttachments(letter.scannedAttachments || []);

    setActiveTab('FORM');
  };

  // Preview Letter with Loading Transition
  const handlePreviewLetter = (letter: OfficialLetter) => {
    setIsPreviewLoading(true);
    setPreviewLetter(letter);
    setActiveTab('PREVIEW');
    setTimeout(() => {
      setIsPreviewLoading(false);
    }, 300);
  };

  // Direct Print PDF / Dialog with Loading Transition
  const handlePrintDirectPdf = (letter: OfficialLetter) => {
    setIsPreviewLoading(true);
    setIsPrinting(true);
    setPreviewLetter(letter);
    setActiveTab('PREVIEW');
    setTimeout(() => {
      setIsPreviewLoading(false);
      triggerPrintFallback(`Surat Resmi - ${letter.title}`, document.getElementById('printable-letter-area'));
      setTimeout(() => setIsPrinting(false), 800);
    }, 400);
  };

  // Print Dialog Trigger in Preview Toolbar
  const handlePrintDialog = () => {
    if (!previewLetter) return;
    setIsPrinting(true);
    setTimeout(() => {
      triggerPrintFallback(`Surat Resmi - ${previewLetter.title}`, document.getElementById('printable-letter-area'));
      setTimeout(() => setIsPrinting(false), 800);
    }, 200);
  };

  // Save Letter & Live Preview Sync with Loading Transition
  const handleSaveLetter = () => {
    setIsSaving(true);
    const finalNumber = formNumber.trim() || `001/SURAT/PT-RCS/${new Date().getFullYear()}`;
    const finalTitle = formTitle.trim() || 'Surat Resmi Perusahaan';

    const paragraphs = formBodyText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const updatedLetter: OfficialLetter = {
      id: editingLetter ? editingLetter.id : `LTR-${Date.now()}`,
      letterNumber: finalNumber,
      category: formCategory,
      title: finalTitle,
      subject: formSubject || finalTitle,
      enclosure: formEnclosure || '-',
      letterDate: formDate || new Date().toISOString().split('T')[0],
      city: formCity || companyProfile.city || 'Jakarta',
      recipientName: formRecipientName || 'Penerima Surat',
      recipientTitle: formRecipientTitle || '',
      recipientCompany: formRecipientCompany || '',
      recipientAddress: formRecipientAddress || '',
      openingText: formOpeningText || 'Dengan hormat,',
      bodyParagraphs: paragraphs.length > 0 ? paragraphs : ['Isi surat resmi.'],
      closingText: formClosingText || 'Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.',
      signatoryName: formSignatoryName || companyProfile.directorName || 'Direktur Utama',
      signatoryTitle: formSignatoryTitle || companyProfile.directorTitle || 'Direktur Utama',
      signatoryNik: formSignatoryNik || '',
      showStamp: formShowStamp,
      showQrCode: formShowQrCode,
      qrCodeValue:
        formQrCodeValue.trim() ||
        `https://verifikasi.rakaciptaseraya.co.id/verify?id=${editingLetter ? editingLetter.id : `LTR-${Date.now()}`}&no=${encodeURIComponent(finalNumber)}`,
      status: formStatus,
      scannedAttachments: formScannedAttachments,
      createdAt: editingLetter ? editingLetter.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingLetter) {
      setLetters((prev) => prev.map((l) => (l.id === editingLetter.id ? updatedLetter : l)));
    } else {
      setLetters((prev) => [updatedLetter, ...prev]);
    }

    if (onSaveLetter) {
      onSaveLetter(updatedLetter);
    }

    setPreviewLetter(updatedLetter);

    setTimeout(() => {
      setIsSaving(false);
      setActiveTab('PREVIEW');
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 4000);
    }, 350);
  };

  // Delete Letter
  const handleDeleteLetter = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus arsip surat ini?')) {
      setLetters(letters.filter((l) => l.id !== id));
      if (onDeleteLetter) {
        onDeleteLetter(id);
      }
      if (previewLetter?.id === id) {
        setPreviewLetter(letters.filter((l) => l.id !== id)[0] || null);
      }
    }
  };

  // Duplicate Letter
  const handleDuplicateLetter = (letter: OfficialLetter) => {
    const dup: OfficialLetter = {
      ...letter,
      id: `LTR-${Date.now()}`,
      letterNumber: `${letter.letterNumber}/COPY`,
      title: `${letter.title} (Salinan)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLetters([dup, ...letters]);
    if (onSaveLetter) {
      onSaveLetter(dup);
    }
    alert('Surat berhasil diduplikasi menjadi Draft baru!');
  };

  // Trigger Print Browser / PDF Export
  const handlePrintPdf = async () => {
    if (!previewLetter) return;
    await generatePdfFromElement({
      elementId: 'printable-letter-area',
      filename: `Surat_${previewLetter.letterNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
      title: `Surat Resmi - ${previewLetter.title}`,
    });
  };

  // Export File Word (.docx) using 'docx' package
  const handleExportWordDocx = async (letterToExport: OfficialLetter) => {
    setExportingWordId(letterToExport.id);
    try {
      const children: (Paragraph | Table)[] = [];

      // 1. Kop Surat (Letterhead)
      if (includeKop) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: companyProfile.name.toUpperCase(),
                bold: true,
                size: 28, // 14pt
                font: 'Roboto',
                color: '002B49',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: companyProfile.tagline || 'GENERAL CONTRACTOR, TRADING & REAL ESTATE DEVELOPER',
                bold: true,
                size: 18, // 9pt
                font: 'Roboto',
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${companyProfile.address}, ${companyProfile.city}, ${companyProfile.province} ${companyProfile.postalCode}`,
                size: 18,
                font: 'Roboto',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Telp: ${companyProfile.phone} | Email: ${companyProfile.email} | Web: ${companyProfile.website}`,
                size: 18,
                font: 'Roboto',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `NPWP: ${companyProfile.npwp} | NIB: ${companyProfile.nib}`,
                size: 18,
                font: 'Roboto',
              }),
            ],
          }),
          // Double Line border
          new Paragraph({
            border: {
              bottom: {
                color: '002B49',
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24, // thick double line effect
              },
            },
            children: [],
          }),
          new Paragraph({ children: [] }) // Spacing
        );
      }

      // 2. City & Date
      const dateStr = new Date(letterToExport.letterDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `${letterToExport.city}, ${dateStr}`,
              font: 'Roboto',
              size: 22, // 11pt
            }),
          ],
        }),
        new Paragraph({ children: [] })
      );

      // 3. Document Number & Subject Table
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Nomor      : ', bold: true, font: 'Roboto', size: 22 }),
            new TextRun({ text: letterToExport.letterNumber, font: 'Roboto', size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Lampiran  : ', bold: true, font: 'Roboto', size: 22 }),
            new TextRun({ text: letterToExport.enclosure || '-', font: 'Roboto', size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Perihal    : ', bold: true, font: 'Roboto', size: 22 }),
            new TextRun({ text: letterToExport.subject, bold: true, font: 'Roboto', size: 22 }),
          ],
        }),
        new Paragraph({ children: [] })
      );

      // 4. Recipient Details
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Kepada Yth,\n', font: 'Roboto', size: 22 }),
            new TextRun({ text: `${letterToExport.recipientName}\n`, bold: true, font: 'Roboto', size: 22 }),
            new TextRun({ text: `${letterToExport.recipientTitle} - ${letterToExport.recipientCompany}\n`, font: 'Roboto', size: 22 }),
            new TextRun({ text: `${letterToExport.recipientAddress}`, font: 'Roboto', size: 22 }),
          ],
        }),
        new Paragraph({ children: [] })
      );

      // 5. Title Heading (If SPK/SKK/SP)
      if (['SPK', 'SKK', 'SP', 'SURAT_TUGAS', 'MOU'].includes(letterToExport.category)) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: letterToExport.title.toUpperCase(),
                bold: true,
                underline: {},
                size: 24,
                font: 'Roboto',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `NO: ${letterToExport.letterNumber}`,
                bold: true,
                size: 20,
                font: 'Roboto',
              }),
            ],
          }),
          new Paragraph({ children: [] })
        );
      }

      // 6. Opening Text
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: letterToExport.openingText,
              font: 'Roboto',
              size: 22,
            }),
          ],
        }),
        new Paragraph({ children: [] })
      );

      // 7. Body Paragraphs
      letterToExport.bodyParagraphs.forEach((p) => {
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: p,
                font: 'Roboto',
                size: 22,
              }),
            ],
          }),
          new Paragraph({ children: [] })
        );
      });

      // 8. Closing Text
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: letterToExport.closingText,
              font: 'Roboto',
              size: 22,
            }),
          ],
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [] })
      );

      // 9. Signatory Section
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: `${companyProfile.name}\n`, bold: true, font: 'Roboto', size: 22 }),
            new TextRun({ text: `${letterToExport.signatoryTitle},\n\n\n\n\n`, font: 'Roboto', size: 22 }),
            new TextRun({ text: letterToExport.signatoryName, bold: true, underline: {}, font: 'Roboto', size: 22 }),
            new TextRun({ text: `\n${letterToExport.signatoryNik || ''}`, font: 'Roboto', size: 18, color: '64748B' }),
          ],
        })
      );

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `${letterToExport.letterNumber.replace(/[/\\?%*:|"<>]/g, '_')}.docx`;
      saveAs(blob, fileName);
    } catch (err) {
      console.error('Error exporting DOCX:', err);
      alert('Gagal mengeksport dokumen Word. Silakan coba kembali.');
    } finally {
      setExportingWordId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-900/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Manajemen Surat & Dokumen Resmi
                </h1>
                <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase border border-blue-200">
                  Kop Surat PT & Export Word / PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Buat, cetak, dan kelola dokumen resmi perusahaan (SPK, Penawaran SPH, Surat Keterangan Kerja, Surat Tugas, & Peringatan) dengan Kop Surat otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setScannerTargetLetterId(previewLetter?.id || null);
              setIsScannerModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20"
            title="Pindai fisik kontrak atau nota menggunakan kamera HP / webcam"
          >
            <Camera className="w-4 h-4 text-emerald-200" />
            <span>Scan Kamera</span>
          </button>

          <button
            onClick={() => setIsLogoModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            title="Pengaturan / Ganti Logo Kop Surat"
          >
            <ImageIcon className="w-4 h-4 text-blue-600" /> Logo Kop
          </button>

          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'LIST'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Arsip Surat ({letters.length})
          </button>

          <button
            onClick={handleOpenNewForm}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-900/20 transition"
          >
            <Plus className="w-4 h-4" /> Buat Surat Resmi Baru
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {showSaveSuccess && (
        <div className="bg-emerald-600 text-white p-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 no-print">
          <div className="flex items-center gap-2.5 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>Perubahan surat berhasil disimpan! Dokumen A4 telah diperbarui secara live.</span>
          </div>
          <button
            onClick={() => setShowSaveSuccess(false)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-700 transition"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'LIST'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> Daftar Arsip Surat
          </button>

          <button
            onClick={() => setActiveTab('SUBKON')}
            className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'SUBKON'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" /> Subkon & SPK Borongan ({subkonContracts.length})
          </button>

          <button
            onClick={() => setActiveTab('BAST')}
            className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
              activeTab === 'BAST'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-indigo-600" /> Dokumen BAST 1 & 2
          </button>

          {previewLetter && (
            <button
              onClick={() => setActiveTab('PREVIEW')}
              className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
                activeTab === 'PREVIEW'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4" /> Preview Dokumen A4 ({previewLetter.letterNumber})
            </button>
          )}

          {activeTab === 'FORM' && (
            <button
              className="pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 border-blue-600 text-blue-600"
            >
              <Edit className="w-4 h-4" /> {editingLetter ? 'Edit Surat' : 'Form Pembuatan Surat'}
            </button>
          )}
        </div>
      </div>

      {/* TAB SUBKON & SPK BORONGAN */}
      {activeTab === 'SUBKON' && (
        <SubkonSpkSubmodule
          companyProfile={companyProfile}
          letterhead={letterhead}
          projects={projects}
          subkonContracts={subkonContracts}
          subkonOpnames={subkonOpnames}
          onSaveSubkonContract={onSaveSubkonContract}
          onDeleteSubkonContract={onDeleteSubkonContract}
          onSaveSubkonOpname={onSaveSubkonOpname}
          onDeleteSubkonOpname={onDeleteSubkonOpname}
          onTriggerNotification={onTriggerNotification}
        />
      )}

      {/* TAB BAST 1 & BAST 2 */}
      {activeTab === 'BAST' && (
        <BastSubmodule
          projects={projects}
          companyProfile={companyProfile}
          letterhead={letterhead}
          bastList={externalBastList}
          onSaveBast={onSaveBast}
          onDeleteBast={onDeleteBast}
          onSaveOfficialLetter={(letter) => {
            setLetters((prev) => [letter, ...prev.filter((l) => l.id !== letter.id)]);
            if (onSaveLetter) {
              onSaveLetter(letter);
            }
          }}
          onTriggerNotification={onTriggerNotification}
        />
      )}

      {/* TAB 1: LIST ARSIP SURAT */}
      {activeTab === 'LIST' && (
        <div className="space-y-5 no-print">
          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. Surat, Penerima, Perihal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Kategori:</span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({letters.length})
              </button>
              <button
                onClick={() => setSelectedCategory('SPK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'SPK'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                SPK
              </button>
              <button
                onClick={() => setSelectedCategory('SPH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'SPH'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                SPH (Penawaran)
              </button>
              <button
                onClick={() => setSelectedCategory('SKK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'SKK'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                SKK Karyawan
              </button>
              <button
                onClick={() => setSelectedCategory('SURAT_TUGAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === 'SURAT_TUGAS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Surat Tugas
              </button>
            </div>
          </div>

          {/* Table List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-4">Nomor & Tanggal Surat</th>
                    <th className="p-4">Kategori & Judul</th>
                    <th className="p-4">Tujuan / Penerima</th>
                    <th className="p-4">Penandatangan</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Aksi & Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLetters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Tidak ada dokumen surat yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredLetters.map((letter) => (
                      <tr key={letter.id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 font-mono text-xs">
                            {letter.letterNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {letter.city}, {new Date(letter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              {letter.category}
                            </span>
                            {letter.scannedAttachments && letter.scannedAttachments.length > 0 && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <Camera className="w-3 h-3 text-emerald-600" />
                                {letter.scannedAttachments.length} Lampiran Scan
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 mt-1 line-clamp-1">{letter.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">Hal: {letter.subject}</p>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-900">{letter.recipientName}</div>
                          <div className="text-[11px] text-slate-500">{letter.recipientTitle} - {letter.recipientCompany}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{letter.signatoryName}</div>
                          <div className="text-[10px] text-slate-500">{letter.signatoryTitle}</div>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                              letter.status === 'Diterbitkan'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : letter.status === 'Draft'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {letter.status}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              title="Cetak & Download PDF"
                              onClick={() => handlePrintDirectPdf(letter)}
                              disabled={isPrinting || isPreviewLoading}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg text-[11px] flex items-center gap-1 border border-emerald-200 transition shadow-xs disabled:opacity-60 disabled:cursor-wait"
                            >
                              {isPrinting && previewLetter?.id === letter.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                              ) : (
                                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>Cetak PDF</span>
                            </button>

                            <button
                              title="Lihat Preview Surat"
                              onClick={() => handlePreviewLetter(letter)}
                              disabled={isPreviewLoading}
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg transition disabled:opacity-60 disabled:cursor-wait"
                            >
                              {isPreviewLoading && previewLetter?.id === letter.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              title="Pindai Fisik Kontrak/Nota via Kamera"
                              onClick={() => {
                                setScannerTargetLetterId(letter.id);
                                setPreviewLetter(letter);
                                setIsScannerModalOpen(true);
                              }}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition"
                            >
                              <Camera className="w-4 h-4" />
                            </button>

                            <button
                              title="Download File Word (.docx)"
                              onClick={() => handleExportWordDocx(letter)}
                              disabled={exportingWordId === letter.id}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-blue-200 transition disabled:opacity-60 disabled:cursor-wait"
                            >
                              {exportingWordId === letter.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              ) : (
                                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              <span>.DOCX</span>
                            </button>

                            <button
                              title="Edit Surat"
                              onClick={() => handleOpenEditForm(letter)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              title="Duplikat Surat"
                              onClick={() => handleDuplicateLetter(letter)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              title="Hapus Surat"
                              onClick={() => handleDeleteLetter(letter.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FORM EDITOR */}
      {activeTab === 'FORM' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 no-print">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingLetter ? 'Edit Dokumen Surat' : 'Form Pembuatan Surat Resmi Baru'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih jenis template atau sesuaikan isi paragraf, penerima, dan penandatangan surat.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('LIST')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveLetter}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-900/20 transition flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-wait"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Preview Surat</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Template Preset Buttons */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
              Pilih Preset Template Surat Resmi:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSelectTemplate('SPK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  formCategory === 'SPK'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Surat Perintah Kerja (SPK)
              </button>
              <button
                onClick={() => handleSelectTemplate('SPH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  formCategory === 'SPH'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Surat Penawaran Harga (SPH)
              </button>
              <button
                onClick={() => handleSelectTemplate('SKK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  formCategory === 'SKK'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Surat Keterangan Kerja (SKK)
              </button>
              <button
                onClick={() => handleSelectTemplate('SURAT_TUGAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  formCategory === 'SURAT_TUGAS'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Surat Tugas
              </button>
              <button
                onClick={() => handleSelectTemplate('SP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  formCategory === 'SP'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Surat Peringatan (SP)
              </button>
              <button
                onClick={() => handleSelectTemplate('UNDANGAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  formCategory === 'UNDANGAN'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Undangan Rapat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Col: Metadata & Recipient */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 border-b pb-1">
                1. Header & Identitas Surat
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori Surat</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as LetterCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="SPK">SPK (Surat Perintah Kerja)</option>
                    <option value="SPH">SPH (Penawaran Harga)</option>
                    <option value="MOU">Perjanjian Kerjasama (MOU)</option>
                    <option value="SKK">Surat Keterangan Kerja</option>
                    <option value="SURAT_TUGAS">Surat Tugas</option>
                    <option value="SP">Surat Peringatan</option>
                    <option value="UNDANGAN">Surat Undangan Rapat</option>
                    <option value="PERMOHONAN">Surat Permohonan</option>
                    <option value="CUSTOM">Surat Bebas / Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Surat Resmi</label>
                  <input
                    type="text"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="Contoh: 088/SPK/PT-RCS/VIII/2026"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Dokumen Surat</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Surat Perintah Kerja Pelaksanaan Pembesian"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Perihal (Hal)</label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Perihal Surat"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lampiran</label>
                  <input
                    type="text"
                    value={formEnclosure}
                    onChange={(e) => setFormEnclosure(e.target.value)}
                    placeholder="Contoh: 1 Berkas / -"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kota Penerbitan</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Surat</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 border-b pb-1 pt-2">
                2. Tujuan / Penerima Surat
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Penerima / Kepada Yth.</label>
                  <input
                    type="text"
                    value={formRecipientName}
                    onChange={(e) => setFormRecipientName(e.target.value)}
                    placeholder="Nama Penerima"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Penerima</label>
                  <input
                    type="text"
                    value={formRecipientTitle}
                    onChange={(e) => setFormRecipientTitle(e.target.value)}
                    placeholder="Direktur / Head of Procurement"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Perusahaan / Instansi</label>
                  <input
                    type="text"
                    value={formRecipientCompany}
                    onChange={(e) => setFormRecipientCompany(e.target.value)}
                    placeholder="PT Mitra Jaya / Di Tempat"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Alamat Penerima</label>
                  <input
                    type="text"
                    value={formRecipientAddress}
                    onChange={(e) => setFormRecipientAddress(e.target.value)}
                    placeholder="Jl. Raya Utama No. 12, Jakarta"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right Col: Letter Content & Signatory */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 border-b pb-1">
                3. Content & Paragraf Surat
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Paragraf Pembuka</label>
                <textarea
                  rows={2}
                  value={formOpeningText}
                  onChange={(e) => setFormOpeningText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="Dengan hormat..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Isi Paragraf / Poin-Poin Utama (Pisahkan dengan Baris Baru / Enter)
                </label>
                <textarea
                  rows={6}
                  value={formBodyText}
                  onChange={(e) => setFormBodyText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  placeholder="1. Lingkup pekerjaan...\n2. Nilai pekerjaan..."
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Paragraf Penutup</label>
                <textarea
                  rows={2}
                  value={formClosingText}
                  onChange={(e) => setFormClosingText(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  placeholder="Demikian surat ini dibuat..."
                ></textarea>
              </div>

              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-600 border-b pb-1 pt-2">
                4. Penandatangan & Stempel Perusahaan
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Penandatangan</label>
                  <input
                    type="text"
                    value={formSignatoryName}
                    onChange={(e) => setFormSignatoryName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Penandatangan</label>
                  <input
                    type="text"
                    value={formSignatoryTitle}
                    onChange={(e) => setFormSignatoryTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK / NIP Penandatangan</label>
                  <input
                    type="text"
                    value={formSignatoryNik}
                    onChange={(e) => setFormSignatoryNik(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Dokumen</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Diterbitkan">Diterbitkan (Official)</option>
                    <option value="Draft">Draft (Konsep)</option>
                    <option value="Arsip">Arsip Internal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showStampCheck"
                    checked={formShowStamp}
                    onChange={(e) => setFormShowStamp(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="showStampCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Tampilkan Badge Stempel Legalisasi PT
                  </label>
                </div>

                {/* QR Code Verification Section */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showQrCodeCheck"
                        checked={formShowQrCode}
                        onChange={(e) => setFormShowQrCode(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="showQrCodeCheck" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        Tampilkan QR Code Verifikasi Keabsahan Dokumen
                      </label>
                    </div>
                  </div>

                  {formShowQrCode && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Isi Teks / URL Pindaian QR Code
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={formQrCodeValue}
                          onChange={(e) => setFormQrCodeValue(e.target.value)}
                          placeholder={`https://verifikasi.rakaciptaseraya.co.id/verify?id=${editingLetter?.id || 'NEW'}`}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                        />
                        <div className="bg-white p-1.5 border border-slate-200 rounded-lg shrink-0 shadow-xs flex items-center justify-center">
                          <QRCodeSVG
                            value={
                              formQrCodeValue.trim() ||
                              `https://verifikasi.rakaciptaseraya.co.id/verify?id=${editingLetter?.id || 'NEW'}&no=${encodeURIComponent(formNumber || '001')}`
                            }
                            size={44}
                            level="M"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        Link otomatis verifikasi keabsahan dokumen PT Raka Cipta Seraya.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 5: Physical Scanned Attachments */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700 border-b pb-1 pt-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      5. Lampiran Fisik Kamera ({formScannedAttachments.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTargetLetterId(editingLetter?.id || 'NEW');
                        setIsScannerModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      + Scan Kamera
                    </button>
                  </h3>

                  {formScannedAttachments.length === 0 ? (
                    <div className="p-4 bg-emerald-50/50 border border-dashed border-emerald-200 rounded-xl text-center space-y-1">
                      <Scan className="w-6 h-6 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Belum Ada Lampiran Scan Fisik</p>
                      <p className="text-[11px] text-slate-500">
                        Pindai fisik nota, SPK bertanda tangan, atau dokumen pendukung menggunakan akses kamera.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {formScannedAttachments.map((attach, idx) => (
                        <div key={attach.id} className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-3/4">
                          <img src={attach.dataUrl} alt={attach.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-between text-white">
                            <div className="flex justify-between items-center">
                              <button
                                type="button"
                                onClick={() => setLightboxAttachment(attach)}
                                className="p-1 bg-slate-800/80 hover:bg-slate-800 text-white rounded-md"
                                title="Lihat Ukuran Penuh"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormScannedAttachments((prev) => prev.filter((a) => a.id !== attach.id))}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
                                title="Hapus Lampiran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold line-clamp-1">{attach.title}</p>
                              <p className="text-[9px] text-slate-300">Hal {attach.pageNumber || idx + 1}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Form Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Batal / Kembali ke Daftar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveLetter}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-900/20 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan & Menyiapkan Preview...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan & Preview Surat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE A4 PREVIEW & PRINT/PDF/WORD */}
      {activeTab === 'PREVIEW' && previewLetter && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action Toolbar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Pilihan Output Dokumen:</span>
              <button
                onClick={() => setIncludeKop(!includeKop)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  includeKop ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Sliders className="w-4 h-4" /> {includeKop ? 'Kop Surat Aktif' : 'Tanpa Kop Surat (Kertas Bawaan)'}
              </button>

              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <ImageIcon className="w-4 h-4" /> Ganti / Upload Logo Kop
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <CetakPdfButton
                elementId="printable-letter-area"
                filename={`Surat_${previewLetter.letterNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
                title={`Surat Resmi - ${previewLetter.title}`}
                label="Cetak / Download PDF"
                variant="emerald"
              />

              <button
                onClick={handlePrintDialog}
                disabled={isPrinting}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-60 disabled:cursor-wait"
                title="Buka Dialog Cetak Browser"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Menyiapkan Cetak...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Dialog Cetak</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleExportWordDocx(previewLetter)}
                disabled={exportingWordId === previewLetter.id}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-wait"
              >
                {exportingWordId === previewLetter.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses Word...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span>Download Word (.docx)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleOpenEditForm(previewLetter)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Edit className="w-4 h-4" /> Edit Content
              </button>
            </div>
          </div>

          {/* Paper Canvas (A4 Simulated Page) */}
          <div className="flex justify-center bg-slate-100 p-2 sm:p-8 rounded-2xl border border-slate-200 relative min-h-[400px]">
            {isPreviewLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-200 no-print">
                <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200/80 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide">
                    Mempersiapkan Pratinjau Dokumen A4...
                  </span>
                </div>
              </div>
            )}
            <div
              id="printable-letter-area"
              className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-14 shadow-2xl rounded-sm font-['Roboto',sans-serif] leading-relaxed text-sm relative"
            >
              {/* 1. KOP SURAT RESMI */}
              {includeKop && (
                <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
                  <div className="flex items-center gap-6">
                    {/* LOGO DI KOP SURAT RESMI */}
                    {effectiveLogoUrl ? (
                      <img
                        src={effectiveLogoUrl}
                        alt="Logo Perusahaan"
                        className="w-20 h-20 object-contain shrink-0 rounded-xl bg-white p-1 border border-slate-200 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-900 text-white font-black text-2xl flex items-center justify-center rounded-xl shrink-0 shadow-sm border-2 border-amber-400">
                        {companyProfile.shortName ? companyProfile.shortName.substring(0, 3).toUpperCase() : 'GMK'}
                      </div>
                    )}

                    <div className="flex-1 text-right font-sans">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {companyProfile.name}
                      </h1>
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        {companyProfile.tagline || 'GENERAL CONTRACTOR, TRADING & REAL ESTATE DEVELOPER'}
                      </p>
                      <p className="text-[11px] text-slate-700 mt-1">
                        {companyProfile.address}, {companyProfile.city}, {companyProfile.province} {companyProfile.postalCode}
                      </p>
                      <p className="text-[11px] text-slate-700 font-mono">
                        Telp: {companyProfile.phone} | Email: {companyProfile.email} | Website: {companyProfile.website}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        NPWP: {companyProfile.npwp} | NIB: {companyProfile.nib}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DATE & CITY */}
              <div className="text-right font-sans text-xs font-semibold mb-6">
                {previewLetter.city}, {formatLetterDate(previewLetter.letterDate)}
              </div>

              {/* 3. LETTER DETAILS TABLE */}
              <div className="grid grid-cols-1 gap-1 text-xs font-sans mb-6 max-w-lg">
                <div className="flex">
                  <span className="w-24 font-bold">Nomor</span>
                  <span className="w-4">:</span>
                  <span className="font-mono font-bold text-slate-900">{previewLetter.letterNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold">Lampiran</span>
                  <span className="w-4">:</span>
                  <span>{previewLetter.enclosure || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold">Perihal</span>
                  <span className="w-4">:</span>
                  <span className="font-bold underline">{previewLetter.subject}</span>
                </div>
              </div>

              {/* 4. RECIPIENT */}
              <div className="font-sans text-xs mb-8 space-y-0.5">
                <p>Kepada Yth.</p>
                <p className="font-bold text-slate-900 text-sm">{previewLetter.recipientName}</p>
                <p className="font-semibold text-slate-800">{previewLetter.recipientTitle}</p>
                <p className="text-slate-800">{previewLetter.recipientCompany}</p>
                <p className="text-slate-600 italic">{previewLetter.recipientAddress}</p>
              </div>

              {/* 5. TITLE HEADING (IF SPK / SKK / SP) */}
              {['SPK', 'SKK', 'SP', 'SURAT_TUGAS', 'MOU'].includes(previewLetter.category) && (
                <div className="text-center my-6 space-y-1">
                  <h2 className="text-base font-black uppercase tracking-wider underline text-slate-900 font-sans">
                    {previewLetter.title}
                  </h2>
                  <p className="text-xs font-bold font-mono text-slate-700">
                    NOMOR: {previewLetter.letterNumber}
                  </p>
                </div>
              )}

              {/* 6. OPENING */}
              <div className="mb-4 text-justify whitespace-pre-line leading-relaxed text-slate-900">
                {previewLetter.openingText}
              </div>

              {/* 7. BODY PARAGRAPHS */}
              <div className="space-y-3 mb-6 text-justify leading-relaxed">
                {previewLetter.bodyParagraphs.map((para, idx) => (
                  <p key={idx} className="text-slate-900">
                    {para}
                  </p>
                ))}
              </div>

              {/* 8. CLOSING */}
              <div className="mb-12 text-justify whitespace-pre-line leading-relaxed text-slate-900">
                {previewLetter.closingText}
              </div>

              {/* 9. SIGNATURE BLOCK & DIGITAL QR CODE VERIFICATION */}
              <div className="flex items-end justify-between font-sans text-xs mt-10">
                {/* Left: Digital Verification QR Code Card */}
                {previewLetter.showQrCode !== false ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-300 rounded-xl max-w-[280px] shadow-xs">
                    <div className="bg-white p-1.5 border border-slate-200 rounded-lg shrink-0 shadow-xs flex items-center justify-center">
                      <QRCodeSVG
                        value={
                          previewLetter.qrCodeValue ||
                          `https://verifikasi.rakaciptaseraya.co.id/verify?id=${previewLetter.id}&no=${encodeURIComponent(previewLetter.letterNumber)}`
                        }
                        size={64}
                        level="M"
                      />
                    </div>
                    <div className="text-[10px] text-slate-700 leading-snug">
                      <p className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        VERIFIKASI DIGITAL
                      </p>
                      <p className="font-mono text-[9px] text-slate-600 mt-0.5">
                        ID: <span className="font-bold">{previewLetter.id}</span>
                      </p>
                      <p className="text-[8.5px] text-slate-500 mt-0.5 leading-tight">
                        Pindai QR Code untuk verifikasi otentisitas dokumen resmi ini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Right: Signature Block */}
                <div className="w-64 text-center space-y-2">
                  <p className="font-bold text-slate-900">{companyProfile.name}</p>
                  <p className="text-slate-700 font-semibold">{previewLetter.signatoryTitle}</p>

                  {/* Stamp & Signature Space */}
                  <div className="h-28 my-2 flex items-center justify-center relative">
                    {previewLetter.showStamp && (
                      <div className="absolute opacity-80 border-2 border-dashed border-blue-600 text-blue-800 rounded-full w-24 h-24 flex flex-col items-center justify-center rotate-[-12deg] p-1 font-bold text-[9px] uppercase tracking-tighter">
                        <Stamp className="w-5 h-5 text-blue-700" />
                        <span>PT Raka Cipta Seraya</span>
                        <span className="text-[7px]">VERIFIED STAMP</span>
                      </div>
                    )}
                    <div className="italic text-slate-400 text-[10px] z-10 pt-12">
                      [Tanda Tangan & Stempel Legalisasi]
                    </div>
                  </div>

                  <p className="font-bold text-slate-900 underline text-sm">
                    {previewLetter.signatoryName}
                  </p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {previewLetter.signatoryNik || ''}
                  </p>
                </div>
              </div>

              {/* 10. FOOTER WATERMARK */}
              <div className="mt-16 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Dokumen Resmi PT {companyProfile.name} — Terverifikasi Digital via QR Code
                </span>
                <span className="font-mono">ID: {previewLetter.id} | Diterbitkan via BuildX ERP</span>
              </div>

              {/* 11. LAMPIRAN SCAN KAMERA (JIKA ADA) */}
              {previewLetter.scannedAttachments && previewLetter.scannedAttachments.length > 0 && (
                <div className="mt-12 pt-8 border-t-2 border-slate-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                        Lampiran Fisik & Scan Kamera ({previewLetter.scannedAttachments.length} Halaman)
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setScannerTargetLetterId(previewLetter.id);
                        setIsScannerModalOpen(true);
                      }}
                      className="no-print px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      + Tambah Scan Kamera
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {previewLetter.scannedAttachments.map((attach, idx) => (
                      <div key={attach.id} className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 p-3 space-y-2 shadow-xs">
                        <div className="relative aspect-3/4 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 group">
                          <img
                            src={attach.dataUrl}
                            alt={attach.title}
                            className="w-full h-full object-contain bg-slate-900/5"
                          />
                          <div className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => setLightboxAttachment(attach)}
                              className="px-3 py-1.5 bg-white text-slate-900 rounded-lg font-bold text-xs flex items-center gap-1 shadow-md hover:bg-slate-100"
                            >
                              <Maximize2 className="w-3.5 h-3.5" /> Zoom
                            </button>
                            <button
                              onClick={() => handleDeleteScannedAttachment(previewLetter.id, attach.id)}
                              className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-md hover:bg-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-700 pt-1">
                          <span className="font-bold text-slate-900 line-clamp-1">{attach.title}</span>
                          <span className="font-mono bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            Hal {attach.pageNumber || idx + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Bar for Easy Access Printing */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-800 no-print">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-bold text-sm text-white">Siap Cetak Dokumen Resmi {previewLetter.category}</p>
                <p className="text-xs text-slate-400">Nomor: {previewLetter.letterNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <CetakPdfButton
                elementId="printable-letter-area"
                filename={`Surat_${previewLetter.letterNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
                title={`Surat Resmi - ${previewLetter.title}`}
                label="Cetak / Download PDF"
                variant="emerald"
              />

              <button
                onClick={handlePrintDialog}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition disabled:opacity-60 disabled:cursor-wait"
                title="Cetak langsung melalui dialog printer browser"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Menyiapkan Cetak...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Cetak Browser</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleExportWordDocx(previewLetter)}
                disabled={exportingWordId === previewLetter.id}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 shadow-md flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-wait"
              >
                {exportingWordId === previewLetter.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses Word...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span>Word (.docx)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab('LIST')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition ml-2"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan / Ganti Logo Kop Surat */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Pengaturan Logo Kop Surat Resmi</h3>
                  <p className="text-[11px] text-slate-500">Pilih preset logo vektor atau upload logo resmi perusahaan Anda.</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Logo */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-sm">
                {effectiveLogoUrl ? (
                  <img src={effectiveLogoUrl} alt="Logo Perusahaan Saat Ini" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs font-bold text-slate-400">Tanpa Logo</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Logo Kop Aktif</span>
                <p className="font-extrabold text-slate-900 text-xs">{companyProfile.name}</p>
                <p className="text-[11px] text-slate-500">Logo ini otomatis tampil pada semua Surat Resmi & Dokumen Export PDF / Word.</p>
              </div>
            </div>

            {/* Preset Options */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Pilih Preset Logo Vektor Perusahaan:</label>
              <div className="grid grid-cols-3 gap-3">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectLogo(preset.url)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition ${
                      companyProfile.logoUrl === preset.url
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-10 h-10 object-contain" />
                    <span className="text-[10px] font-bold text-slate-700 line-clamp-1">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload or URL */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Upload File Logo Baru (PNG/JPG/SVG):</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Upload className="w-4 h-4 text-blue-600" /> Pilih File Gambar Logo
                  <input type="file" accept="image/*" onChange={handleFileUploadLogo} className="hidden" />
                </label>
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Atau Paste URL Gambar Logo:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://domain.com/logo.png"
                    value={customLogoInput}
                    onChange={(e) => setCustomLogoInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    onClick={() => {
                      if (customLogoInput.trim()) {
                        handleSelectLogo(customLogoInput.trim());
                        setCustomLogoInput('');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Scanner Camera Modal */}
      {isScannerModalOpen && (
        <DocumentScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          onSaveScans={handleSaveScannedDocs}
        />
      )}

      {/* Lightbox Modal for Scanned Attachment */}
      {lightboxAttachment && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">{lightboxAttachment.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    Halaman {lightboxAttachment.pageNumber || 1} • Discan: {new Date(lightboxAttachment.scannedAt).toLocaleString('id-ID')} • Filter: {lightboxAttachment.filterUsed || 'magic'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLightboxAttachment(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              <img
                src={lightboxAttachment.dataUrl}
                alt={lightboxAttachment.title}
                className="max-w-full max-h-[70vh] object-contain shadow-lg rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">Format: High-Resolution Processed Scan</span>
              <button
                onClick={() => setLightboxAttachment(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
