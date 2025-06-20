// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEXlK5dfJp4Op4HHRVJw9QzRuqmhq3qmA",
  authDomain: "software-project-auth.firebaseapp.com",
  projectId: "software-project-auth",
  storageBucket: "software-project-auth.firebasestorage.app",
  messagingSenderId: "992515498154",
  appId: "1:992515498154:web:c2148a7a41a4f2ad7330d3",
  measurementId: "G-NLB2PP1LPD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
export { app, analytics, auth };
