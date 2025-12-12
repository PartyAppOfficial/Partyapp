// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
  import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js"
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js"
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyALliduhgnNAEMT7O-tFh4A4ziQJ81aLVg",
    authDomain: "party-time-dc987.firebaseapp.com",
    projectId: "party-time-dc987",
    storageBucket: "party-time-dc987.firebasestorage.app",
    messagingSenderId: "986322413604",
    appId: "1:986322413604:web:7e7b309ec6e8f439fb90b1",
    measurementId: "G-T3P48Y1B9H"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  export { app, analytics, db, storage, auth };