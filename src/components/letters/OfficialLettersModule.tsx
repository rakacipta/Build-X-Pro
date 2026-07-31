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
} from 'lucide-react';
import { CompanyProfile, OfficialLetter, LetterCategory, LetterheadSettings } from '../../types';
import { saveAs } from 'file-saver';
import { CetakPdfButton } from '../common/CetakPdfButton';
import { generatePdfFromElement, triggerPrintFallback } from '../../utils/pdfGenerator';
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
    status: 'Diterbitkan',
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
    status: 'Diterbitkan',
    createdAt: '2026-07-31T09:00:00Z',
    updatedAt: '2026-07-31T09:00:00Z',
  }
];

export const OfficialLettersModule: React.FC<OfficialLettersModuleProps> = ({
  companyProfile,
  onUpdateCompanyProfile,
  letterhead,
}) => {
  const [letters, setLetters] = useState<OfficialLetter[]>(initialLetters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'LIST' | 'FORM' | 'PREVIEW'>('LIST');

  const [editingLetter, setEditingLetter] = useState<OfficialLetter | null>(null);
  const [previewLetter, setPreviewLetter] = useState<OfficialLetter | null>(initialLetters[0]);

  // Logo Settings State
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState('');

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

  const handlePrintDirectPdf = async (letter: OfficialLetter) => {
    setPreviewLetter(letter);
    setActiveTab('PREVIEW');
    setTimeout(async () => {
      await generatePdfFromElement({
        elementId: 'printable-letter-area',
        filename: `Surat_${letter.letterNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
        title: `Surat Resmi - ${letter.title}`,
      });
    }, 250);
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
    setActiveTab('FORM');
  };

  // Open Form Edit
  const handleOpenEditForm = (letter: OfficialLetter) => {
    setEditingLetter(letter);
    setFormCategory(letter.category);
    setFormNumber(letter.letterNumber);
    setFormTitle(letter.title);
    setFormSubject(letter.subject);
    setFormEnclosure(letter.enclosure);
    setFormDate(letter.letterDate);
    setFormCity(letter.city);

    setFormRecipientName(letter.recipientName);
    setFormRecipientTitle(letter.recipientTitle);
    setFormRecipientCompany(letter.recipientCompany);
    setFormRecipientAddress(letter.recipientAddress);

    setFormOpeningText(letter.openingText);
    setFormBodyText(letter.bodyParagraphs.join('\n\n'));
    setFormClosingText(letter.closingText);

    setFormSignatoryName(letter.signatoryName);
    setFormSignatoryTitle(letter.signatoryTitle);
    setFormSignatoryNik(letter.signatoryNik || '');
    setFormShowStamp(letter.showStamp);
    setFormStatus(letter.status);

    setActiveTab('FORM');
  };

  // Save Letter
  const handleSaveLetter = () => {
    if (!formNumber.trim() || !formTitle.trim()) {
      alert('Mohon lengkapi Nomor Surat dan Judul Surat terlebih dahulu!');
      return;
    }

    const paragraphs = formBodyText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const updatedLetter: OfficialLetter = {
      id: editingLetter ? editingLetter.id : `LTR-${Date.now()}`,
      letterNumber: formNumber,
      category: formCategory,
      title: formTitle,
      subject: formSubject,
      enclosure: formEnclosure,
      letterDate: formDate,
      city: formCity,
      recipientName: formRecipientName,
      recipientTitle: formRecipientTitle,
      recipientCompany: formRecipientCompany,
      recipientAddress: formRecipientAddress,
      openingText: formOpeningText,
      bodyParagraphs: paragraphs,
      closingText: formClosingText,
      signatoryName: formSignatoryName,
      signatoryTitle: formSignatoryTitle,
      signatoryNik: formSignatoryNik,
      showStamp: formShowStamp,
      status: formStatus,
      createdAt: editingLetter ? editingLetter.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingLetter) {
      setLetters(letters.map((l) => (l.id === editingLetter.id ? updatedLetter : l)));
    } else {
      setLetters([updatedLetter, ...letters]);
    }

    setPreviewLetter(updatedLetter);
    setActiveTab('PREVIEW');
  };

  // Delete Letter
  const handleDeleteLetter = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus arsip surat ini?')) {
      setLetters(letters.filter((l) => l.id !== id));
      if (previewLetter?.id === id) {
        setPreviewLetter(letters[0] || null);
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
    try {
      const children: (Paragraph | Table)[] = [];

      // 1. Kop Surat (Letterhead)
      if (includeKop) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: companyProfile.name.toUpperCase(),
                bold: true,
                size: 28, // 14pt
                font: 'Times New Roman',
                color: '002B49',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: companyProfile.tagline || 'GENERAL CONTRACTOR, TRADING & REAL ESTATE DEVELOPER',
                bold: true,
                size: 18, // 9pt
                font: 'Times New Roman',
                color: '475569',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${companyProfile.address}, ${companyProfile.city}, ${companyProfile.province} ${companyProfile.postalCode}`,
                size: 18,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Telp: ${companyProfile.phone} | Email: ${companyProfile.email} | Web: ${companyProfile.website}`,
                size: 18,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `NPWP: ${companyProfile.npwp} | NIB: ${companyProfile.nib}`,
                size: 18,
                font: 'Times New Roman',
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
              font: 'Times New Roman',
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
            new TextRun({ text: 'Nomor      : ', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: letterToExport.letterNumber, font: 'Times New Roman', size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Lampiran  : ', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: letterToExport.enclosure || '-', font: 'Times New Roman', size: 22 }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Perihal    : ', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: letterToExport.subject, bold: true, font: 'Times New Roman', size: 22 }),
          ],
        }),
        new Paragraph({ children: [] })
      );

      // 4. Recipient Details
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Kepada Yth,\n', font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `${letterToExport.recipientName}\n`, bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `${letterToExport.recipientTitle} - ${letterToExport.recipientCompany}\n`, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `${letterToExport.recipientAddress}`, font: 'Times New Roman', size: 22 }),
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
                font: 'Times New Roman',
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
                font: 'Times New Roman',
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
              font: 'Times New Roman',
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
                font: 'Times New Roman',
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
              font: 'Times New Roman',
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
            new TextRun({ text: `${companyProfile.name}\n`, bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `${letterToExport.signatoryTitle},\n\n\n\n\n`, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: letterToExport.signatoryName, bold: true, underline: {}, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `\n${letterToExport.signatoryNik || ''}`, font: 'Times New Roman', size: 18, color: '64748B' }),
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
                          <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {letter.category}
                          </span>
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
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold rounded-lg text-[11px] flex items-center gap-1 border border-emerald-200 transition shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" /> Cetak PDF
                            </button>

                            <button
                              title="Lihat Preview Surat"
                              onClick={() => {
                                setPreviewLetter(letter);
                                setActiveTab('PREVIEW');
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              title="Download File Word (.docx)"
                              onClick={() => handleExportWordDocx(letter)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-blue-200 transition"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" /> .DOCX
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-900/20 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan & Preview Surat
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

              <div className="flex items-center gap-2 pt-1">
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
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE A4 PREVIEW & PRINT/PDF/WORD */}
      {activeTab === 'PREVIEW' && previewLetter && (
        <div className="space-y-6">
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
                onClick={() => triggerPrintFallback(previewLetter.title, document.getElementById('printable-letter-area'))}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Buka Dialog Cetak Browser"
              >
                <Printer className="w-4 h-4" /> Dialog Cetak
              </button>

              <button
                onClick={() => handleExportWordDocx(previewLetter)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" /> Download Word (.docx)
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
          <div className="flex justify-center bg-slate-100 p-2 sm:p-8 rounded-2xl border border-slate-200">
            <div
              id="printable-letter-area"
              className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-14 shadow-2xl rounded-sm font-serif leading-relaxed text-sm relative"
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

                    <div className="flex-1 text-center font-sans">
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
                {previewLetter.city}, {new Date(previewLetter.letterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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

              {/* 9. SIGNATURE BLOCK */}
              <div className="flex justify-end font-sans text-xs">
                <div className="w-72 text-center space-y-2">
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
                <span>Dokumen Resmi PT {companyProfile.name}</span>
                <span className="font-mono">ID: {previewLetter.id} | Diterbitkan via BuildX ERP</span>
              </div>
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
    </div>
  );
};
