import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqDLocdi1CDHDeD5Z_LOlVZOycI2tuJpk",
    authDomain: "digisoria-baa83.firebaseapp.com",
    projectId: "digisoria-baa83",
    storageBucket: "digisoria-baa83.firebasestorage.app",
    messagingSenderId: "1042609120554",
    appId: "1:1042609120554:web:0500a100e9ae42ead32a53",
    measurementId: "G-TM8CBPSRR9"
};

// Global variables for Firebase auth token provided by the environment
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const messageBox = document.getElementById('messageBox');

function showMessage(message, duration = 3000) {
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}

function togglePasswordVisibility(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleIcon = document.getElementById(`${fieldId}-toggle`);
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

// This makes the togglePasswordVisibility function available globally
window.togglePasswordVisibility = togglePasswordVisibility;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let isAuthReady = false;

// Firebase Initialization
async function initializeAuth() {
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
        showMessage(`Authentication error: ${error.message}`);
    }
}

// Logout functionality
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            showMessage("Logout successful!");
            window.location.href = 'login.html'; // Redirect to login page after logout
        } catch (error) {
            console.error("Logout error:", error);
            showMessage(`Logout error: ${error.message}`);
        }
    });
}

// Listen for authentication state changes and update the UI
onAuthStateChanged(auth, (user) => {
    const signinLink = document.getElementById('signin-link');
    const userDisplayName = document.getElementById('user-display-name');

    if (user) {
        console.log("User is signed in. UID:", user.uid);
        // We now wait for the user state to be confirmed before showing a message
        if (isAuthReady) {
            showMessage(`Logged in as: ${user.email || 'Anonymous user'}`);
        }
        
        if (signinLink && userDisplayName) {
            userDisplayName.textContent = user.displayName || user.email; // Use displayName or email
            signinLink.href = 'profile.html'; // Change the link to the profile page
        }
    } else {
        console.log("User is signed out.");
        if (signinLink && userDisplayName) {
            userDisplayName.textContent = 'Sign in';
            signinLink.href = 'login.html';
        }
    }
    isAuthReady = true;
});

initializeAuth();

// Form Submissions
const loginForm = document.getElementById('login');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage("Login successful!");
            window.location.href = 'seed.html'; // Add this line to redirect
          
        } catch (error) {
            let errorMessage = "An error occurred during login. Please try again.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                errorMessage = "Invalid email or password.";
            } else {
                console.error("Login error:", error);
            }
            showMessage(errorMessage);
        }
    });
}

const signupForm = document.getElementById('signup');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            showMessage("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must be at least 6 characters long.");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage("Account created successfully!");
            window.location.href = 'login.html'; 
           
        } catch (error) {
            let errorMessage = "An error occurred during signup. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "The email address is not valid.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please choose a stronger password.";
            } else {
                console.error("Signup error:", error);
            }
            showMessage(errorMessage);
        }
    });
}

// UI Toggle
const loginContainer = document.getElementById('loginForm');
const signupContainer = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');

if (showSignupBtn && loginContainer && signupContainer) {
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.remove('visible');
        loginContainer.classList.add('hidden');
        signupContainer.classList.remove('hidden');
        signupContainer.classList.add('visible');
    });
}
if (showLoginBtn && signupContainer && loginContainer) {
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupContainer.classList.remove('visible');
        signupContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginContainer.classList.add('visible');
    });
}
