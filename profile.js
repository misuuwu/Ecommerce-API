

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAqDLocdi1CDHDeD5Z_LOlVZOycI2tuJpk",
    authDomain: "digisoria-baa83.firebaseapp.com",
    projectId: "digisoria-baa83",
    storageBucket: "digisoria-baa83.firebasestorage.app",
    messagingSenderId: "1042609120554",
    appId: "1:1042609120554:web:0500a100e9ae42ead32a53",
    measurementId: "G-TM8CBPSRR9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const editBtn = document.getElementById('edit-btn');
const saveBtn = document.getElementById('save-btn');
const applyChangesBtn = document.getElementById('apply-changes-btn');
const readOnlyView = document.getElementById('read-only-view');
const editableView = document.getElementById('editable-view');
const applyChangesContainer = document.getElementById('apply-changes-container');
const imageUploadSection = document.getElementById('image-upload-section');
const messageBox = document.getElementById('message-box');

const userNameDisplay = document.getElementById('user-name-display');
const userEmailDisplay = document.getElementById('user-email-display');
const userPhoneDisplay = document.getElementById('user-phone-display');
const userAddressDisplay = document.getElementById('user-address-display');
const userGenderDisplay = document.getElementById('user-gender-display');
const userDobDisplay = document.getElementById('user-dob-display');

const userNameInput = document.getElementById('fullName');
const userEmailInput = document.getElementById('email');
const userPhoneInput = document.getElementById('phone');
const userAddressInput = document.getElementById('address');
const genderRadios = document.getElementsByName('gender');
const dobDateSelect = document.getElementById('dob-date');
const dobMonthSelect = document.getElementById('dob-month');
const dobYearSelect = document.getElementById('dob-year');
const profileImage = document.getElementById('profile-image');
const uploadImageBtn = document.getElementById('upload-image-btn');
const imageUploadInput = document.getElementById('image-upload');

const profileLink = document.getElementById('profile-link');
const wishlistLink = document.getElementById('wishlist-link');
const orderHistoryLink = document.getElementById('order-history-link');
const settingsLink = document.getElementById('settings-link');

const profileContent = document.getElementById('profile-content');
const wishlistContent = document.getElementById('wishlist-content');
const orderHistoryContent = document.getElementById('order-history-content');
const settingsContent = document.getElementById('settings-content');
const banksContent = document.getElementById('banks-content');
const privacyContent = document.getElementById('privacy-content');
const notificationsContent = document.getElementById('notifications-content');
const addressContent = document.getElementById('address-content');

const banksLink = document.getElementById('banks-link');
const privacyLink = document.getElementById('privacy-link');
const notificationsLink = document.getElementById('notifications-link');
const addressLink = document.getElementById('address-link');

const banksBackLink = document.getElementById('banks-back-link');
const privacyBackLink = document.getElementById('privacy-back-link');
const notificationsBackLink = document.getElementById('notifications-back-link');
const addressBackLink = document.getElementById('address-back-link');

let currentUserUid = "placeholder-user-id"; // Replace with actual user ID from your authentication system

// Placeholder for user profile data
let userProfile = {
    name: "N/A",
    email: "N/A",
    phone: "N/A",
    address: "N/A",
    gender: "N/A",
    dob: {
        date: "",
        month: "",
        year: ""
    },
    image: "https://placehold.co/200x200/cccccc/333333?text=Profile"
};

// Authenticate anonymously to access Firestore and Storage
async function authenticateAndLoadProfile() {
    try {
        // Sign in anonymously to get a UID. In a real app, you'd use your existing auth method.
        const userCredential = await signInAnonymously(auth);
        currentUserUid = userCredential.user.uid;
        console.log("Authenticated with UID:", currentUserUid);
        await fetchUserProfile(currentUserUid);
    } catch (error) {
        console.error("Error during anonymous authentication:", error);
    }
}

async function fetchUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        userProfile = {
            ...userProfile,
            ...data
        };
        console.log("User profile loaded:", userProfile);
        updateDisplayData();
    } else {
        console.log("No user profile found, using default data.");
        updateDisplayData();
    }
}

async function saveUserProfile() {
    const uid = currentUserUid;
    const docRef = doc(db, "users", uid);

    let newProfileData = {
        name: userNameInput.value,
        email: userEmailInput.value,
        phone: userPhoneInput.value,
        address: userAddressInput.value,
        gender: Array.from(genderRadios).find(radio => radio.checked).value,
        dob: {
            date: dobDateSelect.value,
            month: dobMonthSelect.options[dobMonthSelect.selectedIndex].textContent,
            year: dobYearSelect.value
        },
        image: profileImage.src // Keep the current image URL
    };

    const file = imageUploadInput.files[0];
    if (file) {
        try {
            const storageRef = ref(storage, `profile_pictures/${uid}/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            newProfileData.image = downloadURL;
            profileImage.src = downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            // Continue saving other data even if image upload fails
        }
    }

    try {
        await setDoc(docRef, newProfileData, {
            merge: true
        });
        console.log("Profile updated successfully!");
        userProfile = newProfileData; // Update local state
        updateDisplayData(); // Update the UI with new data
        showMessage("Changes applied successfully!");
    } catch (error) {
        console.error("Error writing document:", error);
        showMessage("Failed to save changes. Please try again.", "error");
    }
    toggleEditMode(false);
}

function showSection(sectionToShow) {
    const allSections = [
        profileContent,
        wishlistContent,
        orderHistoryContent,
        settingsContent,
        banksContent,
        privacyContent,
        notificationsContent,
        addressContent
    ];

    allSections.forEach(section => {
        if (section === sectionToShow) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// --- Event Listeners ---
profileLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(profileContent);
});

wishlistLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(wishlistContent);
});

orderHistoryLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(orderHistoryContent);
});

settingsLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(settingsContent);
});

banksLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(banksContent);
});

privacyLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(privacyContent);
});

notificationsLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(notificationsContent);
});

addressLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(addressContent);
});

banksBackLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(settingsContent);
});
privacyBackLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(settingsContent);
});
notificationsBackLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(settingsContent);
});
addressBackLink.addEventListener('click', (event) => {
    event.preventDefault();
    showSection(settingsContent);
});

editBtn.addEventListener('click', () => {
    toggleEditMode(true);
});
saveBtn.addEventListener('click', saveUserProfile);
applyChangesBtn.addEventListener('click', saveUserProfile);
uploadImageBtn.addEventListener('click', () => {
    imageUploadInput.click();
});

imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profileImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function toggleEditMode(isEditing) {
    if (isEditing) {
        readOnlyView.classList.add('hidden');
        editableView.classList.remove('hidden');
        applyChangesContainer.classList.remove('hidden');
        imageUploadSection.classList.remove('hidden');
        populateFormFields();
    } else {
        readOnlyView.classList.remove('hidden');
        editableView.classList.add('hidden');
        applyChangesContainer.classList.add('hidden');
        imageUploadSection.classList.add('hidden');
    }
}

function populateFormFields() {
    userNameInput.value = userProfile.name;
    userEmailInput.value = userProfile.email;
    userPhoneInput.value = userProfile.phone;
    userAddressInput.value = userProfile.address;
    Array.from(genderRadios).forEach(radio => {
        if (radio.value.toLowerCase() === userProfile.gender.toLowerCase()) {
            radio.checked = true;
        }
    });
    populateDateOfBirth();
    dobDateSelect.value = userProfile.dob.date;
    const monthIndex = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(userProfile.dob.month);
    if (monthIndex > -1) {
        dobMonthSelect.value = monthIndex + 1;
    }
    dobYearSelect.value = userProfile.dob.year;
}

function updateDisplayData() {
    userNameDisplay.textContent = userProfile.name;
    userEmailDisplay.textContent = userProfile.email;
    userPhoneDisplay.textContent = userProfile.phone;
    userAddressDisplay.textContent = userProfile.address;
    userGenderDisplay.textContent = userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1);
    userDobDisplay.textContent = `${userProfile.dob.date}, ${userProfile.dob.month}, ${userProfile.dob.year}`;
    profileImage.src = userProfile.image;
}

function populateDateOfBirth() {
    if (dobDateSelect.options.length > 1) return;
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        dobDateSelect.appendChild(option);
    }
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        dobMonthSelect.appendChild(option);
    });
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 100; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        dobYearSelect.appendChild(option);
    }
}

function showMessage(msg, type = "success") {
    messageBox.textContent = msg;
    messageBox.style.backgroundColor = type === "success" ? "#22c55e" : "#ef4444";
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// Initial setup on page load
window.onload = async () => {
    populateDateOfBirth();
    await authenticateAndLoadProfile();
};

