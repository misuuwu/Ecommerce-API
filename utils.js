import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, addDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


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
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.classList.remove('hidden');
        messageBox.classList.add('opacity-100');
        setTimeout(() => {
            messageBox.classList.remove('opacity-100');
            messageBox.classList.add('opacity-0');
            setTimeout(() => messageBox.classList.add('hidden'), 300);
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

// Auth state change listener
onAuthStateChanged(auth, (user) => {
    const userInfoContainer = document.getElementById('user-info-container');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');

    if (user) {
        // User is signed in
        console.log("User is signed in. UID:", user.uid);
        
        // Change "Sign in" to username
        const username = user.email ? user.email.split('@')[0] : 'User';
        userInfoContainer.innerHTML = `<span class="text-sm font-medium">Hello, ${username}</span>`;
        
        // Add logout link to dropdown
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.classList.add('block', 'px-4', 'py-2', 'text-gray-800', 'font-medium', 'hover:bg-orange-100', 'rounded-lg', 'mx-2', 'transition-colors', 'duration-200');
        logoutLink.textContent = 'Logout';
        logoutLink.id = 'logout-link';
        
        // Check if logout link already exists to prevent duplicates
        if (!document.getElementById('logout-link')) {
            profileDropdownMenu.querySelector('.py-4').appendChild(logoutLink);
        }

        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                console.log('User signed out.');
                showMessage("You have been signed out.");
            } catch (error) {
                console.error("Logout error:", error);
                showMessage("Logout failed. Please try again.");
            }
        });

    } else {
        // User is signed out
        console.log("User is signed out.");
        
        // Revert "Sign in" link
        userInfoContainer.innerHTML = `<a href="signup.html" class="text-sm font-medium hover:text-orange-400 transition-colors duration-200">Sign in</a>`;
        
        // Remove logout link if it exists
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.remove();
        }
    }
});

// Call initial auth function
initializeAuth();