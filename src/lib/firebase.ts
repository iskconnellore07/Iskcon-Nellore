import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiRwVZi3NWMALFOGuW9VFunYfRWY0qQIo",
  authDomain: "iskcon-nellore.firebaseapp.com",
  projectId: "iskcon-nellore",
  storageBucket: "iskcon-nellore.firebasestorage.app",
  messagingSenderId: "866388993763",
  appId: "1:866388993763:web:635954965e4f2e2127c7d6",
  measurementId: "G-XJ5VFDB8PS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if we're in the browser environment
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
