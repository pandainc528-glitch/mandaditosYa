// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0UwKuwvA-IOKaHtqhGCPMtFFylCf2wGk",
  authDomain: "deriveryapp-c6b3c.firebaseapp.com",
  projectId: "deriveryapp-c6b3c",
  storageBucket: "deriveryapp-c6b3c.appspot.com",
  messagingSenderId: "986928639578",
  appId: "1:986928639578:web:79b123187ae8ace64e3263"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
