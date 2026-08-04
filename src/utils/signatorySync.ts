import { Employee, SystemUser, DocumentSignatory } from '../types';
import { getStoredData, setStoredData } from '../services/firestoreService';
import { INITIAL_EMPLOYEES, INITIAL_SYSTEM_USERS, INITIAL_SIGNATORIES } from '../lib/seedData';

export interface RegisteredPerson {
  id: string;
  name: string;
  title: string;
  division: string;
  nipOrNik: string;
  sourceType: 'EMPLOYEE' | 'SYSTEM_USER';
}

/**
 * Get all registered people (Employees & System Users) merged and deduplicated by name.
 */
export function getRegisteredPeople(): RegisteredPerson[] {
  const employees = getStoredData<Employee[]>('employees', INITIAL_EMPLOYEES);
  const systemUsers = getStoredData<SystemUser[]>('system_users', INITIAL_SYSTEM_USERS);

  const peopleMap = new Map<string, RegisteredPerson>();

  // Add Employees
  employees.forEach((emp) => {
    if (emp.name && emp.name.trim()) {
      const key = emp.name.trim().toLowerCase();
      peopleMap.set(key, {
        id: emp.id,
        name: emp.name.trim(),
        title: emp.position || 'Staff',
        division: emp.division || 'Umum',
        nipOrNik: emp.nik || '',
        sourceType: 'EMPLOYEE',
      });
    }
  });

  // Add System Users (don't overwrite if already added from employees)
  systemUsers.forEach((usr) => {
    if (usr.name && usr.name.trim() && usr.name !== 'Super Admin (RCS)') {
      const key = usr.name.trim().toLowerCase();
      if (!peopleMap.has(key)) {
        peopleMap.set(key, {
          id: usr.id,
          name: usr.name.trim(),
          title: usr.role || 'Pengguna ERP',
          division: usr.department || 'Manajemen',
          nipOrNik: `USR-${usr.id}`,
          sourceType: 'SYSTEM_USER',
        });
      }
    }
  });

  return Array.from(peopleMap.values());
}

/**
 * Determine default PDF role category based on position/role title
 */
export function determineRoleType(title: string): 'Disetujui' | 'Diverifikasi' | 'Disiapkan' {
  const t = title.toLowerCase();
  if (t.includes('direktur') || t.includes('direksi') || t.includes('ceo') || t.includes('owner')) {
    return 'Disetujui';
  }
  if (t.includes('finance') || t.includes('keuangan') || t.includes('accounting') || t.includes('hrd') || t.includes('auditor')) {
    return 'Diverifikasi';
  }
  return 'Disiapkan';
}

/**
 * Synchronize registered employees and system users to document_signatories list.
 */
export function syncSignatoriesWithEmployees(): {
  signatories: DocumentSignatory[];
  addedCount: number;
  updatedCount: number;
} {
  const currentSignatories = getStoredData<DocumentSignatory[]>('document_signatories', INITIAL_SIGNATORIES);
  const registeredPeople = getRegisteredPeople();

  let addedCount = 0;
  let updatedCount = 0;

  const updatedSignatories = [...currentSignatories];

  registeredPeople.forEach((person) => {
    const personNameClean = person.name.toLowerCase();
    
    // Find existing by employeeId or matching name
    const existingIndex = updatedSignatories.findIndex(
      (s) => (s.employeeId && s.employeeId === person.id) || s.name.toLowerCase() === personNameClean
    );

    if (existingIndex >= 0) {
      // Update existing signatory with current registered details
      const existing = updatedSignatories[existingIndex];
      const hasChanges =
        existing.name !== person.name ||
        existing.title !== person.title ||
        existing.division !== person.division ||
        existing.nipOrNik !== person.nipOrNik ||
        existing.employeeId !== person.id;

      if (hasChanges) {
        updatedSignatories[existingIndex] = {
          ...existing,
          name: person.name,
          title: person.title || existing.title,
          division: person.division || existing.division,
          nipOrNik: person.nipOrNik || existing.nipOrNik,
          employeeId: person.id,
        };
        updatedCount++;
      }
    } else {
      // Add new signatory from registered person
      const roleType = determineRoleType(person.title);
      const hasDefaultForRole = updatedSignatories.some(
        (s) => s.roleType === roleType && s.isDefault
      );

      const newSig: DocumentSignatory = {
        id: `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: person.name,
        title: person.title,
        roleType,
        division: person.division,
        nipOrNik: person.nipOrNik,
        isDefault: !hasDefaultForRole, // Make default if category has no default yet
        employeeId: person.id,
      };

      updatedSignatories.push(newSig);
      addedCount++;
    }
  });

  // Ensure every roleType has at least one default signatory
  ['Disetujui', 'Diverifikasi', 'Disiapkan'].forEach((role) => {
    const hasDefault = updatedSignatories.some((s) => s.roleType === role && s.isDefault);
    if (!hasDefault) {
      const firstRoleIndex = updatedSignatories.findIndex((s) => s.roleType === role);
      if (firstRoleIndex >= 0) {
        updatedSignatories[firstRoleIndex].isDefault = true;
      }
    }
  });

  setStoredData('document_signatories', updatedSignatories);

  return {
    signatories: updatedSignatories,
    addedCount,
    updatedCount,
  };
}
