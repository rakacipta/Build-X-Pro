import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
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
  INITIAL_CUSTOM_FORMS,
  INITIAL_FORM_SUBMISSIONS,
  INITIAL_OFFICIAL_LETTERS,
  INITIAL_LETTER_TEMPLATES,
  INITIAL_BAST_DOCS,
} from '../lib/seedData';
import { DeepAuditLog, ActiveDocumentLock } from '../types';

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

export const SEED_MAP: Record<string, any[]> = {
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
  custom_forms: INITIAL_CUSTOM_FORMS,
  form_submissions: INITIAL_FORM_SUBMISSIONS,
  official_letters: INITIAL_OFFICIAL_LETTERS,
  letter_templates: INITIAL_LETTER_TEMPLATES,
  bast_documents: INITIAL_BAST_DOCS,
};

// Cached flag for cloud database initialization
let isCloudDatabaseInitializedCache: boolean | null = null;

export async function checkCloudDatabaseInitialized(): Promise<boolean> {
  if (isCloudDatabaseInitializedCache !== null) {
    return isCloudDatabaseInitializedCache;
  }
  try {
    const metaSnap = await getDoc(doc(db, 'settings_single', 'system_metadata'));
    if (metaSnap.exists()) {
      isCloudDatabaseInitializedCache = true;
      return true;
    }
    // Check if any core collection has documents
    const projSnap = await getDocs(collection(db, 'projects'));
    if (!projSnap.empty) {
      isCloudDatabaseInitializedCache = true;
      await setDoc(
        doc(db, 'settings_single', 'system_metadata'),
        {
          id: 'system_metadata',
          isCloudInitialized: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    }
    isCloudDatabaseInitializedCache = false;
    return false;
  } catch (err) {
    console.warn('Error checking cloud database status:', err);
    // In case of network check failure, assume initialized to avoid re-seeding wiped collections
    return true;
  }
}

// Record Deep Audit Trail Log
export async function recordAuditLog(
  logData: Omit<DeepAuditLog, 'id' | 'timestamp'>
): Promise<DeepAuditLog> {
  const newLog: DeepAuditLog = {
    id: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ipAddress: '180.252.91.' + Math.floor(Math.random() * 200 + 10),
    clientVersion: 'v2.5-cloud',
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

// Generic subscribe function with LocalStorage persistence & Cloud Firestore sync
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialSeed: T[],
  onUpdate: (data: T[]) => void
): () => void {
  // 1. Instantly trigger with local cache for immediate UI rendering
  const currentLocal = getStoredData<T[]>(collectionName, initialSeed);
  onUpdate(currentLocal);

  const colRef = collection(db, collectionName);

  // 2. Attach real-time cloud listener
  const unsubscribe = onSnapshot(
    query(colRef),
    async (snapshot) => {
      if (!snapshot.empty) {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        setStoredData(collectionName, items);
        onUpdate(items);
      } else {
        // Firestore snapshot is empty.
        // Check if cloud database is already running (multi-device active)
        const isCloudInit = await checkCloudDatabaseInitialized();
        if (isCloudInit) {
          // Cloud database is already initialized; an empty collection means
          // data has been deleted/cleared intentionally.
          // NEVER resurrect deleted data from local initial seed!
          setStoredData(collectionName, []);
          onUpdate([]);
        } else {
          // Brand new virgin database setup across the whole system
          if (initialSeed && initialSeed.length > 0) {
            try {
              await Promise.all(
                initialSeed.map((item) =>
                  setDoc(doc(db, collectionName, item.id), item, { merge: true })
                )
              );
              await setDoc(
                doc(db, 'settings_single', 'system_metadata'),
                {
                  id: 'system_metadata',
                  isCloudInitialized: true,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
              setStoredData(collectionName, initialSeed);
              onUpdate(initialSeed);
            } catch (e) {
              console.warn(`Could not seed initial data to ${collectionName}:`, e);
              setStoredData(collectionName, []);
              onUpdate([]);
            }
          } else {
            setStoredData(collectionName, []);
            onUpdate([]);
          }
        }
      }
    },
    (error) => {
      console.warn(`Firestore subscription error for ${collectionName}:`, error);
      // Retain latest local storage state
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
    console.warn(`Error deleting document ${id} from Firestore collection ${collectionName}:`, err);
  }

  return updatedList;
}

// Overwrite all documents in a collection (LocalStorage & Firestore)
// Accurately deletes removed documents from Firestore so they never resurrect!
export async function replaceAllDocuments<T extends { id: string }>(
  collectionName: string,
  newList: T[]
): Promise<T[]> {
  setStoredData(collectionName, newList);
  try {
    const colRef = collection(db, collectionName);
    const existingSnap = await getDocs(colRef);
    const newIdSet = new Set(newList.map((x) => x.id));

    // Delete documents that are no longer present in newList
    const deleteOps: Promise<void>[] = [];
    existingSnap.forEach((docSnap) => {
      if (!newIdSet.has(docSnap.id)) {
        deleteOps.push(deleteDoc(docSnap.ref));
      }
    });
    if (deleteOps.length > 0) {
      await Promise.all(deleteOps);
    }

    // Upsert all items in newList
    const writeOps = newList.map((item) =>
      setDoc(doc(db, collectionName, item.id), item, { merge: true })
    );
    if (writeOps.length > 0) {
      await Promise.all(writeOps);
    }
  } catch (err) {
    console.warn(`Error replacing documents in Firestore collection ${collectionName}:`, err);
  }
  return newList;
}

// Clear all documents in a collection (LocalStorage & Firestore)
export async function clearCollectionDocuments<T extends { id: string }>(
  collectionName: string,
  _currentList?: T[]
): Promise<T[]> {
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

// Force re-fetch a collection from Firestore
export async function fetchCollectionFromCloud<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((d) => items.push({ id: d.id, ...d.data() } as T));
    setStoredData(collectionName, items);
    return items;
  } catch (e) {
    console.warn(`Error fetching ${collectionName} from cloud:`, e);
    return getStoredData<T[]>(collectionName, []);
  }
}

// Force re-fetch all specified collections from Firestore
export async function forceRefreshAllCollections(
  collections: string[]
): Promise<Record<string, any[]>> {
  const results: Record<string, any[]> = {};
  await Promise.all(
    collections.map(async (col) => {
      const items = await fetchCollectionFromCloud(col);
      results[col] = items;
    })
  );
  return results;
}

