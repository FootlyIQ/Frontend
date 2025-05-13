// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDR5QsUl2CDS2wmf1uPw8FqYJkcxjw00p8",
  authDomain: "footlyiq.firebaseapp.com",
  projectId: "footlyiq",
  storageBucket: "footlyiq.firebasestorage.app",
  messagingSenderId: "608022884297",
  appId: "1:608022884297:web:00bd9d7bad4eed3578c218",
  measurementId: "G-X5PBXV2YJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);