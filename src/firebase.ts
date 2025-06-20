// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, serverTimestamp  } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // optional if you use file uploads

const firebaseConfig = {
  apiKey: "AIzaSyBzOHWt23EhmdcMmlTmKbRkgUHEkuUk0CQ",
  authDomain: "study-buddy-6fe66.firebaseapp.com",
  projectId: "study-buddy-6fe66",
  storageBucket: "study-buddy-6fe66.appspot.com", // ✅ corrected line
  messagingSenderId: "50156384134",
  appId: "1:50156384134:web:516d84ab1b969758bd4607",
  measurementId: "G-JL1EP7BRMH",
};



const app = initializeApp(firebaseConfig);

// Firestore
const db = getFirestore(app);

// Authentication
const auth = getAuth(app);

// Storage (optional if you're uploading files)
const storage = getStorage(app);

//export { db, auth, storage };
export { db, auth, storage, serverTimestamp };
