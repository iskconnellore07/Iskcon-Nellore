import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiRwVZi3NWMALFOGuW9VFunYfRWY0qQIo",
  authDomain: "iskcon-nellore.firebaseapp.com",
  projectId: "iskcon-nellore",
  storageBucket: "iskcon-nellore.firebasestorage.app",
  messagingSenderId: "866388993763",
  appId: "1:866388993763:web:635954965e4f2e2127c7d6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "iskconnellore07@gmail.com";
const password = "Iskcon@07";

async function seedAdmin() {
  try {
    let userCredential;
    try {
      console.log("Attempting to create user...");
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully with UID:", userCredential.user.uid);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log("User already exists. Attempting to sign in...");
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Signed in successfully with UID:", userCredential.user.uid);
      } else {
        throw e;
      }
    }

    const uid = userCredential.user.uid;
    console.log("Setting super_admin role in Firestore...");
    
    await setDoc(doc(db, "users", uid), {
      email: email,
      role: "super_admin",
      createdAt: new Date().toISOString()
    });
    
    console.log("SUCCESS! The super_admin role has been successfully assigned to the user.");
    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error.message);
    if (error.message.includes("Missing or insufficient permissions")) {
      console.log("\n--- FIREBASE PERMISSION DENIED ---");
      console.log("Your Firebase Database is currently in 'Locked Mode'.");
      console.log("You must go to Firebase Console -> Firestore Database -> Rules");
      console.log("And temporarily change the rule to: allow read, write: if true;");
    }
    process.exit(1);
  }
}

seedAdmin();
