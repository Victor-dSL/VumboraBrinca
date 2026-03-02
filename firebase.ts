
// Fix: Use modular Firebase SDK imports correctly to resolve named export errors
// @ts-ignore
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  onSnapshot, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  limit,
  getDocs,
  updateDoc,
  where,
  getCountFromServer,
  initializeFirestore,
  getDoc
} from 'firebase/firestore';
import { KidEntry, HistoryRecord, ChildRegistration, ApiConfig, PaymentMethod } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCzOXAP4sVZSeX4-gOiqtaG-IQq8T8WskE",
  authDomain: "vumborabrincar-13ea2.firebaseapp.com",
  projectId: "vumborabrincar-13ea2",
  storageBucket: "vumborabrincar-13ea2.firebasestorage.app",
  messagingSenderId: "608283347642",
  appId: "1:608283347642:web:cae5a28a7e55642c939083",
  measurementId: "G-73X7CQKCVX"
};

// Fix: Initialize Firebase using the modular SDK pattern with @ts-ignore to resolve environment-specific export errors
// @ts-ignore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
// Fix: Export auth and signInWithEmailAndPassword for centralized usage
// @ts-ignore
export const auth = getAuth(app); 
export { signInWithEmailAndPassword };

const activeCollection = collection(db, 'active_entries');
const historyCollection = collection(db, 'history'); 
const registeredCollection = collection(db, 'registered_children');
const configDocRef = doc(db, 'settings', 'whatsapp_api');
const sweepDocRef = doc(db, 'settings', 'renewal_sweep');

export const saveApiConfig = async (config: ApiConfig) => {
  await setDoc(configDocRef, config);
};

export const subscribeToApiConfig = (onData: (config: ApiConfig) => void) => {
  return onSnapshot(configDocRef, (snapshot) => {
    if (snapshot.exists()) {
      onData(snapshot.data() as ApiConfig);
    }
  });
};

export const getApiConfigOnce = async (): Promise<ApiConfig | null> => {
  const snap = await getDoc(configDocRef);
  return snap.exists() ? snap.data() as ApiConfig : null;
};

// Controle de varredura diária
export const getLastSweepDate = async (): Promise<string | null> => {
  const snap = await getDoc(sweepDocRef);
  return snap.exists() ? snap.data().lastSweepDate : null;
};

export const setLastSweepDate = async (dateStr: string) => {
  await setDoc(sweepDocRef, { lastSweepDate: dateStr }, { merge: true });
};

export const updateNotificationStatus = async (entryId: string, status: Partial<KidEntry['notificationStatus']>) => {
  const docRef = doc(db, 'active_entries', entryId);
  await updateDoc(docRef, {
    [`notificationStatus.${Object.keys(status)[0]}`]: Object.values(status)[0]
  });
};

export const deleteRegistration = async (id: string) => {
  await deleteDoc(doc(db, 'registered_children', id));
};

export const deleteActiveEntry = async (id: string) => {
  await deleteDoc(doc(db, 'active_entries', id));
};

export const getNextEnrollmentId = async () => {
  try {
    // Busca o maior ID de matrícula ordenando decrescentemente
    const q = query(registeredCollection, orderBy('enrollmentId', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return "0001";
    
    const lastId = snapshot.docs[0].data().enrollmentId;
    // Tenta converter para número, se falhar ou não for numérico, assume 0
    const lastNum = parseInt(lastId, 10);
    const nextNumber = (isNaN(lastNum) ? 0 : lastNum) + 1;
    
    return nextNumber.toString().padStart(4, '0');
  } catch (error) {
    console.error("Erro ao gerar matrícula:", error);
    return "0001";
  }
};

export const updateRegistrationMonthlyPayment = async (registrationId: string, monthYear: string, method: PaymentMethod, planDuration?: 'monthly' | 'quarterly') => {
  const docRef = doc(db, 'registered_children', registrationId);
  const updateData: any = { lastPaymentMonth: monthYear };
  if (planDuration) {
    updateData.planDuration = planDuration;
  }
  await updateDoc(docRef, updateData);
};

export const resetFidelityForPhone = async (phone: string) => {
  const phoneKey = phone.replace(/\D/g, '');
  const docRef = doc(db, 'fidelity_resets', phoneKey);
  await setDoc(docRef, { lastReset: Date.now() });
};

export const fetchFidelityResets = async () => {
  const snapshot = await getDocs(collection(db, 'fidelity_resets'));
  const resets: Record<string, number> = {};
  snapshot.forEach(doc => {
    resets[doc.id] = doc.data().lastReset;
  });
  return resets;
};

export const addEntry = async (entry: Omit<KidEntry, 'id'>) => {
  try {
    const entryData = { 
      ...entry,
      formattedEntryTime: new Date(entry.entryTime).toLocaleString('pt-BR'),
      isPaid: entry.isPaid || false,
      paymentMethod: entry.paymentMethod || 'não informado',
      isPaused: false,
      totalPausedTime: 0,
      notificationStatus: {
        welcomeSent: false,
        warningSent: false,
        expiredSent: false
      }
    };
    await addDoc(activeCollection, entryData);
  } catch (error: any) {
    console.error("Error adding entry:", error);
    throw error;
  }
};

export const registerChild = async (data: ChildRegistration) => {
  try {
    const docRef = doc(db, 'registered_children', data.id);
    await setDoc(docRef, data);
  } catch (error: any) {
    console.error("Error registering child:", error);
    throw error;
  }
};

export const updatePaymentStatus = async (id: string, isPaid: boolean, method?: PaymentMethod) => {
  const docRef = doc(db, 'active_entries', id);
  await updateDoc(docRef, { 
    isPaid: isPaid,
    paymentMethod: method || (isPaid ? 'não informado' : null)
  });
};

export const togglePause = async (entry: KidEntry) => {
  if (!entry.id) return;
  const docRef = doc(db, 'active_entries', entry.id);
  if (entry.isPaused) {
    const pausedAt = entry.pausedAt || Date.now();
    const currentPauseDuration = Date.now() - pausedAt;
    const previousTotal = entry.totalPausedTime || 0;
    await updateDoc(docRef, {
      isPaused: false,
      pausedAt: null,
      totalPausedTime: previousTotal + currentPauseDuration
    });
  } else {
    await updateDoc(docRef, { isPaused: true, pausedAt: Date.now() });
  }
};

export const checkoutEntry = async (entry: KidEntry) => {
  try {
    const exitTime = Date.now();
    const entryTime = Number(entry.entryTime) || Date.now();
    const pkgDuration = Number(entry.packageDuration) || 30;
    
    let totalPaused = Number(entry.totalPausedTime) || 0;
    if (entry.isPaused && entry.pausedAt) {
        totalPaused += (exitTime - entry.pausedAt);
    }

    const rawTimeDiff = exitTime - entryTime;
    const effectiveTimeSpentMs = rawTimeDiff - totalPaused;
    const timeSpentSeconds = Math.floor(effectiveTimeSpentMs / 1000);
    const expectedDurationSeconds = pkgDuration * 60;
    const diffSeconds = timeSpentSeconds - expectedDurationSeconds;
    
    const absDiff = Math.abs(diffSeconds);
    const diffMin = Math.floor(absDiff / 60);
    const diffSec = absDiff % 60;
    const formattedDiff = `${diffMin}m ${diffSec}s`;
    
    let finalStatusString = "";
    if (diffSeconds > 0) finalStatusString = `Excedeu: ${formattedDiff}`;
    else if (diffSeconds < 0) finalStatusString = `Restou: ${formattedDiff}`;
    else finalStatusString = "Tempo Exato";

    const historyData: HistoryRecord = {
      childName: String(entry.childName || "Sem Nome"),
      contactNumber: String(entry.contactNumber || "-"),
      packageId: String(entry.packageId || "A"),
      parentName: String(entry.parentName || "Sem Responsável"),
      entryTime: entryTime,
      actualExitTime: exitTime,
      packageDuration: pkgDuration,
      timeSpent: timeSpentSeconds,
      overstayDuration: diffSeconds > 0 ? Math.floor(diffSeconds / 60) : 0,
      price: entry.price || 0,
      isPaid: entry.isPaid || false,
      paymentMethod: entry.paymentMethod || 'não informado',
      formattedEntryTime: entry.formattedEntryTime || new Date(entryTime).toLocaleString('pt-BR'),
      formattedExitTime: new Date(exitTime).toLocaleString('pt-BR'),
      formattedTimeSpent: `${Math.floor(timeSpentSeconds / 60)} min`,
      finalStatus: finalStatusString,
      isGymPlan: entry.isGymPlan || false
    };

    await addDoc(historyCollection, historyData);
    if (entry.id) {
        await deleteDoc(doc(db, 'active_entries', entry.id));
    }
  } catch (error) {
    console.error("ERRO NO CHECKOUT:", error);
    throw error;
  }
};

export const subscribeToActiveEntries = (onData: (entries: KidEntry[]) => void, onError: (error: Error) => void) => {
  const q = query(activeCollection, orderBy('entryTime', 'desc'));
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KidEntry)));
  }, (error) => onError(error));
};

export const subscribeToRegistrations = (onData: (entries: ChildRegistration[]) => void, onError: (error: Error) => void) => {
  const q = query(registeredCollection, limit(1000));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChildRegistration));
    onData(entries.sort((a, b) => b.createdAt - a.createdAt));
  }, (error) => onError(error));
};

export const fetchRegistrationsByDateRange = async (startDate: number, endDate: number) => {
  const q = query(
    registeredCollection, 
    where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChildRegistration));
};

export const fetchHistory = async (customLimit: number = 2000) => {
  const q = query(historyCollection, orderBy('actualExitTime', 'desc'), limit(customLimit));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryRecord));
};

export const fetchHistoryByDateRange = async (startDate: number, endDate: number) => {
  const q = query(
    historyCollection, 
    where('actualExitTime', '>=', startDate),
    where('actualExitTime', '<=', endDate),
    orderBy('actualExitTime', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryRecord));
}
