import { ModuleType, SystemUser } from '../types';

export const NOVIA_EMAIL = 'novia.rakaciptaseraya@gmail.com';
export const SISKA_EMAIL = 'siska.rakaciptaseraya@gmail.com';

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

// Modules explicitly permitted for Siska:
// 1. Marketing & Tender ('crm', 'tender')
// 2. Konstruksi & Proyek ('estimator', 'project', 'equipment')
// 3. Trading & Supply Chain ('trading', 'inventory', 'purchasing')
export const SISKA_ALLOWED_MODULES: ModuleType[] = [
  'crm',
  'tender',
  'estimator',
  'project',
  'equipment',
  'trading',
  'inventory',
  'purchasing',
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

  // Strict check for Siska's email
  if (email === SISKA_EMAIL.toLowerCase()) {
    return SISKA_ALLOWED_MODULES.includes(module);
  }

  // Generic check for any user with custom allowedModules restriction
  if (currentUser?.allowedModules && currentUser.allowedModules.length > 0) {
    return currentUser.allowedModules.includes(module);
  }

  return true;
}

/**
 * Returns the first allowed module for a user as their default home/landing view.
 */
export function getFirstAllowedModule(
  currentUser?: SystemUser | null,
  currentEmail?: string
): ModuleType {
  const email = (currentUser?.email || currentEmail || '').toLowerCase().trim();
  if (email === NOVIA_EMAIL.toLowerCase()) {
    return NOVIA_ALLOWED_MODULES[0];
  }
  if (email === SISKA_EMAIL.toLowerCase()) {
    return SISKA_ALLOWED_MODULES[0];
  }
  if (currentUser?.allowedModules && currentUser.allowedModules.length > 0) {
    return currentUser.allowedModules[0];
  }
  return 'dashboard';
}

