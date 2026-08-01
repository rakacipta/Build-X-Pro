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
} from '../lib/seedData';

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
  } catch (e) {
    console.warn(`Error saving ${key} to localStorage:`, e);
  }
}

// Generic subscribe function with LocalStorage persistence & Firestore sync
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialSeed: T[],
  onUpdate: (data: T[]) => void
): () => void {
  // Always trigger with local cached data first
  const currentLocal = getStoredData<T[]>(collectionName, initialSeed);
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
        setStoredData(collectionName, items);
        onUpdate(items);
      } else {
        // If remote database is empty, seed it with current stored data
        try {
          await Promise.all(
            currentLocal.map((item) =>
              setDoc(doc(db, collectionName, item.id), item, { merge: true })
            )
          );
        } catch (e) {
          console.warn(`Could not seed empty Firestore collection ${collectionName}:`, e);
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
  const currentList = getStoredData<T[]>(collectionName, []);
  const updatedList = currentList.filter((x) => x.id !== id);

  setStoredData(collectionName, updatedList);

  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.warn(`Error deleting from Firestore collection ${collectionName}:`, err);
  }

  return updatedList;
}

// Helper to seed all collections manually if requested
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
