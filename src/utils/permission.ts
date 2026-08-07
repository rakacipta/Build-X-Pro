import { ModuleType, SystemUser } from '../types';

export const NOVIA_EMAIL = 'novia.rakaciptaseraya@gmail.com';

// Modules explicitly permitted for Novia:
// 1. KPI dashboard ('dashboard')
// 2. HR & Keuangan ('hr_payroll', 'finance', 'invoicing', 'bank_accounts', 'accounting')
// 3. Laporan executive ('reports')
export const NOVIA_ALLOWED_MODULES: ModuleType[] = [
  'dashboard',
  'hr_payroll',
  'finance',
  'invoicing',
  'bank_accounts',
  'accounting',
  'reports',
];

/**
 * Checks whether a given module is accessible for a user based on their email or user permissions.
 */
export function isModuleAllowed(
  module: ModuleType,
  currentUser?: SystemUser | null,
  currentEmail?: string
): boolean {
  const email = (currentUser?.email || currentEmail || '').toLowerCase().trim();

  // Strict check for Novia's email
  if (email === NOVIA_EMAIL.toLowerCase()) {
    return NOVIA_ALLOWED_MODULES.includes(module);
  }

  // Generic check for any user with custom allowedModules restriction
  if (currentUser?.allowedModules && currentUser.allowedModules.length > 0) {
    return currentUser.allowedModules.includes(module);
  }

  return true;
}
