//rt the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAtr2LwHSTGS9Dz4_oGc2p-kLhY0IHt-Ms",
    authDomain: "bankmanagement-53cc4.firebaseapp.com",
    projectId: "bankmanagement-53cc4",
    storageBucket: "bankmanagement-53cc4.appspot.com",
    messagingSenderId: "363550714133",
    appId: "1:363550714133:web:fb16fa7d4af3c656e2e11c"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth };

