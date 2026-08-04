import React from 'react';
import { CompanyProfile, DocumentSignatory } from '../../types';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_SIGNATORIES } from '../../lib/seedData';

interface PrintSignatureProps {
  preparedBy?: string;
  preparedTitle?: string;
  preparedSignatureUrl?: string;
  verifiedBy?: string;
  verifiedTitle?: string;
  directorName?: string;
  directorTitle?: string;
  signatureUrl?: string;
  city?: string;
  dateStr?: string;
  showStamp?: boolean;
  columns?: 2 | 3;
  note?: string;
  companyProfile?: CompanyProfile;
}

export const PrintSignature: React.FC<PrintSignatureProps> = ({
  preparedBy,
  preparedTitle = 'Disiapkan & Dibuat Oleh',
  preparedSignatureUrl,
  verifiedBy,
  verifiedTitle = 'Ditinjau & Diverifikasi',
  directorName,
  directorTitle,
  signatureUrl,
  city,
  dateStr,
  showStamp = true,
  columns = 3,
  note,
  companyProfile: companyProfileProp,
}) => {
  const profile = companyProfileProp || getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE);
  const signatories = getStoredData<DocumentSignatory[]>('document_signatories', INITIAL_SIGNATORIES);

  const defaultApproved = signatories.find((s) => s.roleType === 'Disetujui' && s.isDefault) || signatories.find((s) => s.roleType === 'Disetujui');
  const defaultVerified = signatories.find((s) => s.roleType === 'Diverifikasi' && s.isDefault) || signatories.find((s) => s.roleType === 'Diverifikasi');
  const defaultPrepared = signatories.find((s) => s.roleType === 'Disiapkan' && s.isDefault) || signatories.find((s) => s.roleType === 'Disiapkan');

  const finalCity = city || profile.city || 'Jakarta';
  const finalDirector = directorName || defaultApproved?.name || profile.directorName || 'Ir. Hendra Wijaya, MM';
  const finalDirectorTitle = directorTitle || defaultApproved?.title || profile.directorTitle || 'Direktur Utama';
  const finalVerifiedBy = verifiedBy || defaultVerified?.name || profile.financeManager || 'Siti Aminah, SE';
  const finalVerifiedJobTitle = defaultVerified?.title || 'Finance Manager';
  const finalPreparedBy = preparedBy || defaultPrepared?.name || 'Ir. Budi Santoso, MT';
  const finalPreparedJobTitle = defaultPrepared?.title || 'Project Manager Utama';

  const formattedDate = dateStr || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mt-8 pt-6 border-t-2 border-slate-200/80 text-slate-900 break-inside-avoid">
      {/* Date and Location Header */}
      <div className="flex justify-between items-center mb-6 text-xs text-slate-600 font-medium">
        <div>
          {note && <p className="italic text-[11px] text-slate-500">{note}</p>}
        </div>
        <div className="text-right font-semibold">
          <span>{finalCity}, {formattedDate}</span>
        </div>
      </div>

      {/* Signature Columns */}
      <div className={`grid ${columns === 2 ? 'grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-3'} gap-6 text-center text-xs`}>
        {/* Column 1: Prepared By */}
        <div className="flex flex-col justify-between items-center h-36 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            {preparedTitle}
          </p>
          {preparedSignatureUrl ? (
            <div className="my-auto py-1 h-16 flex items-center justify-center">
              <img
                src={preparedSignatureUrl}
                alt="Tanda Tangan Pembuat"
                className="max-h-14 max-w-[140px] object-contain"
              />
            </div>
          ) : (
            <div className="text-slate-400 text-[10px] italic py-2">
              [ Tanda Tangan & E-Sign ]
            </div>
          )}
          <div>
            <p className="font-extrabold text-slate-900 underline decoration-slate-400 underline-offset-4 text-xs">
              {finalPreparedBy}
            </p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{finalPreparedJobTitle}</p>
          </div>
        </div>

        {/* Column 2: Verified By (if 3 columns) */}
        {columns === 3 && (
          <div className="flex flex-col justify-between items-center h-36 p-2 rounded-xl bg-slate-50/50 border border-slate-100">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              {verifiedTitle}
            </p>
            <div className="text-slate-400 text-[10px] italic py-2">
              [ Verifikasi Keuangan ]
            </div>
            <div>
              <p className="font-extrabold text-slate-900 underline decoration-slate-400 underline-offset-4 text-xs">
                {finalVerifiedBy}
              </p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{finalVerifiedJobTitle}</p>
            </div>
          </div>
        )}

        {/* Column 3 / Main Director Signature */}
        <div className="flex flex-col justify-between items-center h-36 p-2 rounded-xl bg-blue-50/30 border border-blue-100/60 relative overflow-hidden">
          {showStamp && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 border-2 border-dashed border-blue-800 rounded-full w-20 h-20 flex items-center justify-center rotate-[ -12deg ]">
              <span className="text-[9px] font-black uppercase text-blue-900 text-center leading-tight">
                STEMPEL RESMI<br />DIREKSI
              </span>
            </div>
          )}
          <p className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px]">
            Disetujui Oleh,
          </p>
          {signatureUrl ? (
            <div className="my-auto py-1 h-16 flex items-center justify-center z-10">
              <img
                src={signatureUrl}
                alt="Tanda Tangan Digital Direksi"
                className="max-h-14 max-w-[140px] object-contain"
              />
            </div>
          ) : (
            <div className="my-auto py-1">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-100/80 text-emerald-800 text-[9px] font-extrabold font-mono rounded-full border border-emerald-300">
                ✓ TERVERIFIKASI DIREKTUR
              </span>
            </div>
          )}
          <div>
            <p className="font-black text-slate-900 underline decoration-blue-600 underline-offset-4 text-xs">
              {finalDirector}
            </p>
            <p className="text-[10px] font-bold text-blue-800 mt-0.5">{finalDirectorTitle}</p>
          </div>
        </div>
      </div>

      {/* Security Footer Note */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <span>Dokumen Resmi {profile.name} — Pengesahan Manajemen Direksi</span>
        <span>SECURITY ID: {profile.shortName || 'BX'}-SIG-{new Date().getFullYear()}-OFFICIAL</span>
      </div>
    </div>
  );
};
