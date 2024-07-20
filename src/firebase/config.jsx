import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqBOETLO_ezkHJsKA1D_DR6tQgfml-oIE",
  authDomain: "panthernine-c7057.firebaseapp.com",
  projectId: "panthernine-c7057",
  storageBucket: "panthernine-c7057.appspot.com",
  messagingSenderId: "702449085922",
  appId: "1:702449085922:web:6e499a72c7618ee6b35dbb",
  measurementId: "G-T5Z2ELVH2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
