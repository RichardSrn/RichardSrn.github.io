/**
 * firebase-config.js
 * 
 * Your Firebase configuration for the Online PvP Chess.
 * Note: We are using the "Compat/CDN" SDK which is ideal for GitHub Pages 
 * as it doesn't require a build step (npm).
 */

const firebaseConfig = {
    apiKey: "AIzaSyCZ1ZDIIgPofvhwzH6yFxcoNElL63Lx0xY",
    authDomain: "personal-website-95bb4.firebaseapp.com",
    databaseURL: "https://personal-website-95bb4-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "personal-website-95bb4",
    storageBucket: "personal-website-95bb4.firebasestorage.app",
    messagingSenderId: "528271049069",
    appId: "1:528271049069:web:16ce48de94d6671d431a64",
    measurementId: "G-69ECDL1CBF"
};

// Initialize Firebase (using global/compat version for simplicity in static sites)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();