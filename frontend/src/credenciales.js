// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXE1F09bR3f569ZtLxsnS5-ED-69Xgf2M",
  authDomain: "proyecto-web-addd8.firebaseapp.com",
  projectId: "proyecto-web-addd8",
  storageBucket: "proyecto-web-addd8.appspot.com",
  messagingSenderId: "422278501125",
  appId: "1:422278501125:web:dc388698fcc47c0a5d1d6c"
};

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
export default appFirebase;