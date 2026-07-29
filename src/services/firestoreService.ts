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
} from '../lib/seedData';

// Generic subscribe function with local fallback & auto-seeding
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialSeed: T[],
  onUpdate: (data: T[]) => void
): () => void {
  const colRef = collection(db, collectionName);
  let isInitial = true;

  const unsubscribe = onSnapshot(
    query(colRef),
    async (snapshot) => {
      if (snapshot.empty && isInitial) {
        isInitial = false;
        // Auto-seed collection if empty
        try {
          await Promise.all(
            initialSeed.map((item) => setDoc(doc(db, collectionName, item.id), item))
          );
        } catch (e) {
          console.warn(`Could not seed ${collectionName} to Firestore, using memory data:`, e);
          onUpdate(initialSeed);
          return;
        }
      } else {
        isInitial = false;
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        if (items.length > 0) {
          onUpdate(items);
        } else {
          onUpdate(initialSeed);
        }
      }
    },
    (error) => {
      console.warn(`Firestore subscription error for ${collectionName}:`, error);
      onUpdate(initialSeed);
    }
  );

  return unsubscribe;
}

// Add or update document in Firestore
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (err) {
    console.error(`Error saving document in ${collectionName}:`, err);
  }
}

// Delete document from Firestore
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.error(`Error deleting document in ${collectionName}:`, err);
  }
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
  ];

  for (const [colName, data] of seeds) {
    for (const item of data) {
      await setDoc(doc(db, colName, item.id || item.code), item, { merge: true });
    }
  }
}
