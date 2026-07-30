import React from 'react';
import { CompanyProfile, LetterheadSettings } from '../../types';
import { getStoredData } from '../../services/firestoreService';
import { INITIAL_COMPANY_PROFILE, INITIAL_LETTERHEAD } from '../../lib/seedData';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  docNumber?: string;
  companyProfile?: CompanyProfile;
  letterhead?: LetterheadSettings;
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle = 'Sistem Informasi Manajemen Konstruksi & Trading (Build X Pro)',
  docNumber,
  companyProfile: companyProfileProp,
  letterhead: letterheadProp,
}) => {
  const profile = companyProfileProp || getStoredData<CompanyProfile>('company_profile', INITIAL_COMPANY_PROFILE);
  const letterhead = letterheadProp || getStoredData<LetterheadSettings>('letterhead', INITIAL_LETTERHEAD);

  const headerTitle = letterhead.headerTitle || profile.name;
  const headerSubtitle = letterhead.headerSubtitle || profile.tagline;
  const addressLine1 = letterhead.addressLine1 || (profile.address ? `${profile.address}, ${profile.city}` : 'Jl. Raya Utama Konstruksi No. 88, Sudirman Center, Jakarta');
  const addressLine2 = letterhead.addressLine2;
  const contactLine = letterhead.contactLine || `Telp: ${profile.phone || '021-5558899'} | Email: ${profile.email || 'info@grahamulti.co.id'}`;
  const logoUrl = letterhead.logoUrl || profile.logoUrl;
  const logoText = letterhead.logoText || profile.shortName || 'BX';
  const logoBgColor = letterhead.logoBgColor || '#2563eb';
  const showLogo = letterhead.showLogo !== false;
  const showDivider = letterhead.showDivider !== false;

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 relative">
      {showDivider && (
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600 rounded-t mb-4"></div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {showLogo && (
            logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Perusahaan"
                className="w-16 h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-14 h-14 text-white flex items-center justify-center font-black text-xl rounded shadow"
                style={{ backgroundColor: logoBgColor }}
              >
                {logoText}
              </div>
            )
          )}
          <div>
            <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">
              {headerTitle}
            </h1>
            {headerSubtitle && (
              <p className="text-xs font-bold text-blue-700 tracking-wide">{headerSubtitle}</p>
            )}
            <p className="text-[11px] text-slate-600 leading-tight mt-0.5">{addressLine1}</p>
            {addressLine2 && <p className="text-[10px] text-slate-500">{addressLine2}</p>}
            <p className="text-[10px] text-slate-500">{contactLine}</p>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="font-extrabold text-blue-900 uppercase tracking-wide text-sm">
            {title}
          </div>
          {docNumber && (
            <div className="font-mono text-slate-700 font-bold">
              No: {docNumber}
            </div>
          )}
          <div className="text-[10px] text-slate-500 mt-1">
            Dicetak Tanggal: {currentDate}
          </div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-500 italic text-center border-t border-slate-200 pt-1">
        {subtitle}
      </div>
    </div>
  );
};
