
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/database";
// Firebase storage is not used in this implementation, but could be added here.
// import "firebase/compat/storage";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase config values
const firebaseConfig = {
    apiKey: "AIzaSyB7n40sONiZM_5OR1l0QYQvN9tbVRmTYXE",
    authDomain: "app-ffc-v3.firebaseapp.com",
    projectId: "app-ffc-v3",
    databaseURL: "https://app-ffc-v3-default-rtdb.firebaseio.com",
    storageBucket: "app-ffc-v3.appspot.com",
    messagingSenderId: "1038630797481",
    appId: "1:1038630797481:web:d02c7853d3d615a47c69b8",
    measurementId: "G-T845M76H45"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize and export Firebase services
export const auth = firebase.auth();
export const firestore = firebase.firestore(); // v8 compat
export const database = firebase.database();
// export const storage = firebase.storage();

// Export v9 firestore instance for modular usage
export const db = getFirestore();
