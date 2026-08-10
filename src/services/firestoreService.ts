import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  INITIAL_PROJECTS,
  INITIAL_TENDERS,
  INITIAL_MATERIALS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_LEADS,
  INITIAL_EQUIPMENT,
  INITIAL_EMPLOYEES,
  INITIAL_PAYROLL,
  INITIAL_FINANCE,
  INITIAL_COA,
  INITIAL_JOURNALS,
  INITIAL_APPROVALS,
  INITIAL_AHSP,
  INITIAL_RAB_ITEMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUBKON_CONTRACTS,
  INITIAL_SUBKON_OPNAMES,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CLOUD_ATTACHMENTS,
  INITIAL_DOCUMENT_LOCKS,
} from '../lib/seedData';
import { DeepAuditLog, ActiveDocumentLock, CloudLargeAttachment } from '../types';

const LS_PREFIX = 'buildx_erp_v1_';
const OLD_LS_PREFIX = 'construx_erp_v1_';

export function getStoredData<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key) || localStorage.getItem(OLD_LS_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(defaultData) && !Array.isArray(parsed)) {
        return defaultData;
      }
      return parsed;
    }
  } catch (e) {
    console.warn(`Error loading ${key} from localStorage:`, e);
  }
  return defaultData;
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
    localStorage.setItem(OLD_LS_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
}

const SEED_MAP: Record<string, any[]> = {
  projects: INITIAL_PROJECTS,
  tenders: INITIAL_TENDERS,
  materials: INITIAL_MATERIALS,
  purchases: INITIAL_PURCHASES,
  sales: INITIAL_SALES,
  crm_leads: INITIAL_LEADS,
  equipment: INITIAL_EQUIPMENT,
  employees: INITIAL_EMPLOYEES,
  payroll: INITIAL_PAYROLL,
  finance_transactions: INITIAL_FINANCE,
  coa: INITIAL_COA,
  journals: INITIAL_JOURNALS,
  approvals: INITIAL_APPROVALS,
  ahsp: INITIAL_AHSP,
  rab_items: INITIAL_RAB_ITEMS,
  notifications: INITIAL_NOTIFICATIONS,
  subkon_contracts: INITIAL_SUBKON_CONTRACTS,
  subkon_opnames: INITIAL_SUBKON_OPNAMES,
  invoices: INITIAL_INVOICES,
  audit_logs: INITIAL_AUDIT_LOGS,
  cloud_attachments: INITIAL_CLOUD_ATTACHMENTS,
  document_locks: INITIAL_DOCUMENT_LOCKS,
};

// Record Deep Audit Trail Log
export async function recordAuditLog(
  logData: Omit<DeepAuditLog, 'id' | 'timestamp'>
): Promise<DeepAuditLog> {
  const newLog: DeepAuditLog = {
    id: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ipAddress: '180.252.91.' + Math.floor(Math.random() * 200 + 10),
    clientVersion: 'v1.4.2-cloud',
    ...logData,
  };
  await saveDocument('audit_logs', newLog);
  return newLog;
}

// Acquire Concurrency Document Lock
export async function acquireDocumentLock(
  lock: Omit<ActiveDocumentLock, 'id' | 'lockedAt' | 'expiresAt'>
): Promise<ActiveDocumentLock> {
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes lock
  const lockObj: ActiveDocumentLock = {
    id: `${lock.collectionName}_${lock.docId}`,
    lockedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    ...lock,
  };
  await saveDocument('document_locks', lockObj);
  return lockObj;
}

// Release Concurrency Document Lock
export async function releaseDocumentLock(collectionName: string, docId: string): Promise<void> {
  const lockId = `${collectionName}_${docId}`;
  await deleteDocument('document_locks', lockId);
}


// Generic subscribe function with LocalStorage persistence & Firestore sync
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialSeed: T[],
  onUpdate: (data: T[]) => void
): () => void {
  // Always trigger with local cached data first
  const currentLocal = getStoredData<T[]>(collectionName, initialSeed);
  setStoredData(collectionName, currentLocal);
  onUpdate(currentLocal);

  const colRef = collection(db, collectionName);

  const unsubscribe = onSnapshot(
    query(colRef),
    async (snapshot) => {
      if (!snapshot.empty) {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        localStorage.setItem(LS_PREFIX + collectionName + '_has_been_seeded', 'true');
        setStoredData(collectionName, items);
        onUpdate(items);
      } else {
        const isAlreadySeeded =
          localStorage.getItem(LS_PREFIX + collectionName + '_has_been_seeded') === 'true';
        if (!isAlreadySeeded && currentLocal && currentLocal.length > 0) {
          // First-time app initialization only: seed remote database once
          try {
            await Promise.all(
              currentLocal.map((item) =>
                setDoc(doc(db, collectionName, item.id), item, { merge: true })
              )
            );
            localStorage.setItem(LS_PREFIX + collectionName + '_has_been_seeded', 'true');
          } catch (e) {
            console.warn(`Could not seed empty Firestore collection ${collectionName}:`, e);
          }
        } else {
          // The collection is intentionally empty (e.g. after zeroing out / clearing)
          setStoredData(collectionName, []);
          onUpdate([]);
        }
      }
    },
    (error) => {
      console.warn(`Firestore subscription fallback for ${collectionName}:`, error);
      // Keep cached local storage data on network/permission error
      onUpdate(getStoredData<T[]>(collectionName, initialSeed));
    }
  );

  return unsubscribe;
}

// Add or update document in both LocalStorage & Firestore
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<T[]> {
  const currentList = getStoredData<T[]>(collectionName, []);
  const index = currentList.findIndex((x) => x.id === item.id);
  let updatedList: T[];

  if (index >= 0) {
    updatedList = [...currentList];
    updatedList[index] = item;
  } else {
    updatedList = [item, ...currentList];
  }

  setStoredData(collectionName, updatedList);

  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    console.warn(`Error writing to Firestore collection ${collectionName}:`, err);
  }

  return updatedList;
}

// Delete document from both LocalStorage & Firestore
export async function deleteDocument<T extends { id: string }>(
  collectionName: string,
  id: string
): Promise<T[]> {
  const defaultData = (SEED_MAP[collectionName] as T[]) || [];
  const currentList = getStoredData<T[]>(collectionName, defaultData);
  const updatedList = currentList.filter((x) => x.id !== id);

  setStoredData(collectionName, updatedList);

  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.warn(`Error deleting from Firestore collection ${collectionName}:`, err);
  }

  return updatedList;
}

// Overwrite all documents in a collection (LocalStorage & Firestore)
export async function replaceAllDocuments<T extends { id: string }>(
  collectionName: string,
  newList: T[]
): Promise<T[]> {
  setStoredData(collectionName, newList);
  try {
    for (const item of newList) {
      await setDoc(doc(db, collectionName, item.id), item, { merge: true });
    }
  } catch (err) {
    console.warn(`Error writing to Firestore collection ${collectionName}:`, err);
  }
  return newList;
}

// Clear all documents in a collection (LocalStorage & Firestore)
export async function clearCollectionDocuments<T extends { id: string }>(
  collectionName: string,
  currentList: T[]
): Promise<T[]> {
  localStorage.setItem(LS_PREFIX + collectionName + '_has_been_seeded', 'true');
  localStorage.setItem(OLD_LS_PREFIX + collectionName + '_has_been_seeded', 'true');
  setStoredData(collectionName, []);
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    }
  } catch (err) {
    console.warn(`Error clearing Firestore collection ${collectionName}:`, err);
  }
  return [];
}
export async function seedAllCollections(): Promise<void> {
  const seeds: [string, any[]][] = [
    ['projects', INITIAL_PROJECTS],
    ['tenders', INITIAL_TENDERS],
    ['materials', INITIAL_MATERIALS],
    ['purchases', INITIAL_PURCHASES],
    ['sales', INITIAL_SALES],
    ['crm_leads', INITIAL_LEADS],
    ['equipment', INITIAL_EQUIPMENT],
    ['employees', INITIAL_EMPLOYEES],
    ['payroll', INITIAL_PAYROLL],
    ['finance_transactions', INITIAL_FINANCE],
    ['coa', INITIAL_COA],
    ['journals', INITIAL_JOURNALS],
    ['approvals', INITIAL_APPROVALS],
    ['ahsp', INITIAL_AHSP],
    ['rab_items', INITIAL_RAB_ITEMS],
    ['notifications', INITIAL_NOTIFICATIONS],
    ['subkon_contracts', INITIAL_SUBKON_CONTRACTS],
    ['subkon_opnames', INITIAL_SUBKON_OPNAMES],
  ];

  for (const [colName, data] of seeds) {
    setStoredData(colName, data);
    for (const item of data) {
      await setDoc(doc(db, colName, item.id || item.code), item, { merge: true });
    }
  }
}
