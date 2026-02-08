import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, where, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-kUUKaIP5h6uXCiSYYCePf0pWmf6QcwY",
    authDomain: "skill-matrix-3be5a.firebaseapp.com",
    projectId: "skill-matrix-3be5a",
    storageBucket: "skill-matrix-3be5a.firebasestorage.app",
    messagingSenderId: "614498722664",
    appId: "1:614498722664:web:e2a602f71b0ecb59c4acdd",
    measurementId: "G-60LG5FH4WB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.log('Persistence not supported by browser');
        }
    });

export { db, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, where };
