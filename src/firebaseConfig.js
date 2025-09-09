// Importa lo necesario de Firebase
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 agregado

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBF8ud74jKG8w-2i0AHjAPo6p_8TbKmLRc",
  authDomain: "proyecto-meduca.firebaseapp.com",
  projectId: "proyecto-meduca",
  storageBucket: "proyecto-meduca.appspot.com",
  messagingSenderId: "177072501541",
  appId: "1:177072501541:web:68af28ce285fa945d320cc",
};

// Verifica si ya existe una app inicializada para evitar errores
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Exporta la instancia de autenticación, Firestore y Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 👈 agregado
