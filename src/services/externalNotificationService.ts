import { formatRupiah } from '../utils/formatters';

export interface ExternalNotificationConfig {
  directorWhatsapp: string;
  directorEmail: string;
  directorName: string;
  largePoThreshold: number;
  enableAutoWhatsapp: boolean;
  enableAutoEmail: boolean;
}

export const DEFAULT_EXTERNAL_NOTIF_CONFIG: ExternalNotificationConfig = {
  directorWhatsapp: '6281234567890',
  directorEmail: 'direksi@grahamulti.co.id',
  directorName: 'Ir. Hendra Wijaya, MM (Direktur Utama)',
  largePoThreshold: 50000000, // Rp 50.000.000
  enableAutoWhatsapp: true,
  enableAutoEmail: true,
};

export interface PoAlertPayload {
  poNumber: string;
  vendorName: string;
  totalAmount: number;
  requestedBy: string;
  date?: string;
  projectName?: string;
  itemsCount?: number;
  notes?: string;
}

/**
 * Format phone number for WhatsApp deep link (e.g., 0812345678 -> 62812345678)
 */
export function formatWhatsappNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Generate formatted WhatsApp alert text for high-value Purchase Orders
 */
export function generatePoWhatsappMessage(
  payload: PoAlertPayload,
  config: ExternalNotificationConfig = DEFAULT_EXTERNAL_NOTIF_CONFIG
): string {
  const isLargePo = payload.totalAmount >= config.largePoThreshold;
  const headerSymbol = isLargePo ? '🚨' : '⚠️';
  const headerTitle = isLargePo
    ? 'PERINGATAN URGENT: APPROVAL PO BERNILAI BESAR'
    : 'NOTIFIKASI PERMINTAAN APPROVAL PO';

  const dateStr = payload.date || new Date().toISOString().split('T')[0];

  return `${headerSymbol} *${headerTitle}*
*BUILD X PRO - ENTERPRISE ERP SYSTEM*

Halo Bapak/Ibu ${config.directorName},

Mohon persetujuan cepat (Approval Direksi) untuk pengajuan Purchase Order (PO) berikut:

📋 *NOMOR PO:* ${payload.poNumber}
🏭 *VENDOR / SUPPLIER:* ${payload.vendorName}
💰 *TOTAL NILAI PO:* ${formatRupiah(payload.totalAmount)}
👤 *DIAJUKAN OLEH:* ${payload.requestedBy}
📅 *TANGGAL PENGAJUAN:* ${dateStr}${
    payload.projectName ? `\n🏗️ *PROYEK:* ${payload.projectName}` : ''
  }${
    isLargePo
      ? `\n⚡ *CATATAN:* PO bernilai di atas ambang batas batas (${formatRupiah(
          config.largePoThreshold
        )}) membutuhkan konfirmasi segera.`
      : ''
  }${payload.notes ? `\n📝 *KETERANGAN:* ${payload.notes}` : ''}

Silakan buka aplikasi Build X Pro Enterprise untuk melakukan otorisasi approval:
🌐 App URL: ${window.location.origin}

Terima kasih,
_Tim Purchasing & Sistem Logistik Build X Pro_`;
}

/**
 * Generate email subject and body for PO alert
 */
export function generatePoEmailPayload(
  payload: PoAlertPayload,
  config: ExternalNotificationConfig = DEFAULT_EXTERNAL_NOTIF_CONFIG
): { subject: string; body: string } {
  const isLargePo = payload.totalAmount >= config.largePoThreshold;
  const subject = `${isLargePo ? '[URGENT - HIGH VALUE] ' : ''}Persetujuan PO ${payload.poNumber} - ${payload.vendorName} (${formatRupiah(payload.totalAmount)})`;

  const body = `Yth. ${config.directorName},

Berikut ringkasan pengajuan Purchase Order (PO) yang membutuhkan persetujuan Direksi:

--------------------------------------------------
DETAIL PURCHASE ORDER
--------------------------------------------------
Nomor PO       : ${payload.poNumber}
Vendor         : ${payload.vendorName}
Total Nominal  : ${formatRupiah(payload.totalAmount)}
Diajukan Oleh  : ${payload.requestedBy}
Tanggal        : ${payload.date || new Date().toISOString().split('T')[0]}
${payload.projectName ? `Proyek         : ${payload.projectName}\n` : ''}
${isLargePo ? `Status Alert   : URGENT / HIGH VALUE PO (Diatas Rp 50 Juta)\n` : ''}
${payload.notes ? `Catatan        : ${payload.notes}\n` : ''}
--------------------------------------------------

Silakan login ke sistem ERP Build X Pro untuk menyetujui atau memberikan tanggapan:
Link Aplikasi: ${window.location.origin}

Hormat kami,
Tim Purchasing & Operasional ERP
PT Graha Multi Konstruksi`;

  return { subject, body };
}

/**
 * Open WhatsApp Web/App deep link
 */
export function openWhatsappNotification(
  phone: string,
  message: string
): void {
  const cleanedPhone = formatWhatsappNumber(phone);
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Open default mail client with mailto
 */
export function openEmailNotification(
  email: string,
  subject: string,
  body: string
): void {
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}
