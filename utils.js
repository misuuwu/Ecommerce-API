import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, addDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// Global variables provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable debug logging for Firestore
setLogLevel('Debug');

// Function to handle initial authentication
export async function initializeAuth() {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log('Signed in with custom token.');
        } else {
            await signInAnonymously(auth);
            console.log('Signed in anonymously.');
        }
    } catch (error) {
        console.error("Firebase auth initialization error: ", error);
        // You would typically show a user-facing error message here
    }
}

// Function to display messages in the UI
export function showMessage(message, duration = 3000) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.classList.add('show');
        setTimeout(() => {
            messageBox.classList.remove('show');
        }, duration);
    }
}

// Function to toggle password visibility (if needed in other parts of your app)
export function togglePasswordVisibility(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleIcon = document.getElementById(`${fieldId}-toggle`);
    if (passwordField && toggleIcon) {
        if (passwordField.type === "password") {
            passwordField.type = "text";
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordField.type = "password";
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
}

window.togglePasswordVisibility = togglePasswordVisibility; // Make it globally accessible for inline onclick