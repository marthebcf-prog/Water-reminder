import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyCX0LcXwAc2nIHp3h30H_l8OH2ScKViRL8",
  authDomain: "water-reminder-81de3.firebaseapp.com",
  projectId: "water-reminder-81de3",
  storageBucket: "water-reminder-81de3.firebasestorage.app",
  messagingSenderId: "851037166480",
  appId: "1:851037166480:web:a572b97da2c5f4451ab115"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export function limpiarUndefined(value: any): any {
  if (Array.isArray(value)) {
    return value
      .map((item) => limpiarUndefined(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, limpiarUndefined(item)])
    );
  }

  return value;
}

export function sincronizarFirebase(userId: string, data: any) {
  try {
    const dataLimpia = limpiarUndefined(data);
    return setDoc(doc(db, "usuarios", userId), dataLimpia, { merge: true }).catch((e) => {
      console.warn("Firebase sync error:", e);
    });
  } catch (e) {
    console.warn("Firebase sync error:", e);
    return Promise.resolve();
  }
}

export function getDocRef(userId: string) {
  return doc(db, "usuarios", userId);
}
