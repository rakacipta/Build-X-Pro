import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Copy,
  Check,
  X,
  AlertTriangle,
  Smartphone,
  ShieldAlert,
  Settings,
  Building,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import {
  ExternalNotificationConfig,
  DEFAULT_EXTERNAL_NOTIF_CONFIG,
  PoAlertPayload,
  generatePoWhatsappMessage,
  generatePoEmailPayload,
  openWhatsappNotification,
  openEmailNotification,
  formatWhatsappNumber,
} from '../../services/externalNotificationService';

interface ExternalNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  poPayload: PoAlertPayload | null;
  config?: Partial<ExternalNotificationConfig>;
}

export const ExternalNotificationModal: React.FC<ExternalNotificationModalProps> = ({
  isOpen,
  onClose,
  poPayload,
  config: customConfig,
}) => {
  const activeConfig: ExternalNotificationConfig = {
    ...DEFAULT_EXTERNAL_NOTIF_CONFIG,
    ...customConfig,
  };

  const [activeTab, setActiveTab] = useState<'wa' | 'email'>('wa');
  const [phone, setPhone] = useState(activeConfig.directorWhatsapp);
  const [email, setEmail] = useState(activeConfig.directorEmail);
  const [waMessage, setWaMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (poPayload) {
      const waMsg = generatePoWhatsappMessage(poPayload, activeConfig);
      const emailPayload = generatePoEmailPayload(poPayload, activeConfig);
      setWaMessage(waMsg);
      setEmailSubject(emailPayload.subject);
      setEmailBody(emailPayload.body);
    }
    setPhone(activeConfig.directorWhatsapp);
    setEmail(activeConfig.directorEmail);
  }, [poPayload, customConfig]);

  if (!isOpen || !poPayload) return null;

  const isLargePo = poPayload.totalAmount >= activeConfig.largePoThreshold;

  const handleSendWhatsapp = () => {
    openWhatsappNotification(phone, waMessage);
  };

  const handleSendEmail = () => {
    openEmailNotification(email, emailSubject, emailBody);
  };

  const handleCopyText = () => {
    const textToCopy = activeTab === 'wa' ? waMessage : `${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 cursor-default space-y-4 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isLargePo
                  ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Notifikasi Eksternal Direksi
                </h3>
                {isLargePo && (
                  <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    PO BERNILAI BESAR (&gt; {formatRupiah(activeConfig.largePoThreshold)})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim ringkasan pesan ke WhatsApp atau Email Direksi untuk otorisasi cepat PO {poPayload.poNumber}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl border bg-slate-50 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PO Quick Info Box */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Nomor PO</span>
            <span className="font-mono font-bold text-slate-800">{poPayload.poNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Vendor</span>
            <span className="font-bold text-slate-900 truncate block">{poPayload.vendorName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Total Nilai PO</span>
            <span className="font-black text-emerald-700 text-sm">
              {formatRupiah(poPayload.totalAmount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Pemohon</span>
            <span className="font-medium text-slate-700 truncate block">{poPayload.requestedBy}</span>
          </div>
        </div>

        {/* Dispatch Channel Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('wa')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'wa'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-200" />
            <span>WhatsApp Integration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'email'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-200" />
            <span>Email Integration</span>
          </button>
        </div>

        {/* WhatsApp Tab Content */}
        {activeTab === 'wa' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Nomor WhatsApp Tujuan (Direksi):</span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Format: {formatWhatsappNumber(phone)}
                </span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="misal: 081234567890 atau 6281234567890"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ringkasan Pesan WhatsApp (Dapat Disesuaikan):
              </label>
              <textarea
                rows={7}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-slate-800 bg-slate-50 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Email Tab Content */}
        {activeTab === 'email' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Tujuan (Direksi):
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="direksi@grahamulti.co.id"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-sans text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subjek Email:</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Isi Pesan Email:</label>
              <textarea
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 font-sans text-[11px] leading-relaxed text-slate-800 bg-slate-50 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Salin Ringkasan</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Batal
            </button>

            {activeTab === 'wa' ? (
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim WhatsApp Direksi</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Kirim Email Client</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
