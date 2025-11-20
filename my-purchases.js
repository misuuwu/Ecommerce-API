import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
// Import Firebase Auth functions
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInAnonymously,
    signInWithCustomToken,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    doc,
    setDoc, 
    getDoc,
    updateDoc,
    increment,
    serverTimestamp,
    setLogLevel,
    orderBy // For sorting orders
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// Firebase global variables provided by the environment
// NOTE: We rely on the global __app_id, __firebase_config, and __initial_auth_token
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Initialize Firebase and Services
if (Object.keys(firebaseConfig).length > 0) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    setLogLevel('debug'); // Enable detailed Firebase logs

    // Global variables to be used by other parts of the script
    window.db = db;
    window.auth = auth;
    window.userId = null; 

    // --- Firebase Authentication Setup ---
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    if (initialAuthToken) {
        signInWithCustomToken(auth, initialAuthToken)
            .catch(error => {
                console.error("Custom token sign-in failed. Falling back to anonymous.", error);
                signInAnonymously(auth);
            });
    } else {
        // Fallback to anonymous sign-in if no token is available
        signInAnonymously(auth);
    }
    
    // --- Purchase Loading Function ---
    function loadPurchases(db, userId, container) {
        // Display loading state
        container.innerHTML = 
            '<div class="col-span-full flex justify-center py-12"><i class="fas fa-spinner fa-spin text-primary-blue text-3xl"></i></div>';
        
        // Define the collection path for the user's private orders
        const ordersCollectionPath = `artifacts/${appId}/users/${userId}/orders`;
        const purchasesRef = collection(db, ordersCollectionPath);

        // Query: Get all orders, sorted by 'timestamp' descending (newest first)
        const q = query(purchasesRef, orderBy('timestamp', 'desc'));

        // Set up real-time listener for purchases
        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = 
                    '<p class="text-center text-text-muted py-12 col-span-full text-lg">You have no purchases yet. Time to shop!</p>';
                return;
            }

            let html = '';
            snapshot.forEach((doc) => {
                const order = doc.data();
                const orderId = doc.id;
                // Convert Firestore Timestamp to Date object
                const timestamp = order.timestamp ? new Date(order.timestamp.seconds * 1000) : new Date();
                const dateString = timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const total = (order.total || 0).toFixed(2);
                const status = order.status || 'Processing';
                const itemsCount = (order.items || []).length;
                const firstItemName = order.items?.[0]?.name || 'Unknown Item';

                // Map status to Tailwind colors
                const statusColor = {
                    'Delivered': 'bg-green-100 text-green-700',
                    'Shipped': 'bg-blue-100 text-blue-700',
                    'Processing': 'bg-yellow-100 text-yellow-700',
                    'Cancelled': 'bg-red-100 text-red-700',
                    'Pending': 'bg-gray-100 text-gray-700',
                }[status] || 'bg-gray-100 text-gray-700';

                html += `
                    <div class="bg-white p-4 sm:p-6 rounded-xl shadow-custom-light border border-gray-100 transition duration-200 hover:shadow-lg flex flex-col space-y-4">
                        <!-- Order Header -->
                        <div class="flex justify-between items-start border-b pb-3 mb-3">
                            <div>
                                <h3 class="text-lg font-bold text-primary-blue">Order ID: <span class="text-text-dark font-mono">${orderId.substring(0, 8)}...</span></h3>
                                <p class="text-sm text-text-muted mt-1">Placed on: ${dateString}</p>
                            </div>
                            <span class="text-xs font-semibold px-3 py-1 rounded-full ${statusColor}">
                                ${status.toUpperCase()}
                            </span>
                        </div>
                        
                        <!-- Order Items Summary -->
                        <div class="flex items-center space-x-4">
                            <!-- Placeholder Icon for Product -->
                            <div class="w-16 h-16 flex items-center justify-center bg-secondary-gray rounded-lg text-2xl text-primary-blue shadow-inner">
                                <i class="fas fa-boxes"></i>
                            </div>
                            <div>
                                <p class="text-text-dark font-medium">${firstItemName}${itemsCount > 1 ? ` and ${itemsCount - 1} more item(s)` : ''}</p>
                                <p class="text-sm text-text-muted mt-1">${itemsCount} Total Item(s)</p>
                            </div>
                        </div>

                        <!-- Order Footer / Details -->
                        <div class="flex justify-between items-center pt-3 border-t">
                            <div class="text-lg font-extrabold text-accent-orange">
                                Total: <span class="text-text-dark">P${total}</span>
                            </div>
                            <!-- A placeholder button for viewing details -->
                            <button class="text-sm text-primary-blue font-semibold hover:text-blue-800 transition-colors py-2 px-4 border border-primary-blue rounded-lg hover:bg-primary-blue hover:text-white">
                                Track Order
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }, (error) => {
            console.error("Error fetching purchases: ", error);
            container.innerHTML = 
                '<p class="text-center text-red-danger py-12 col-span-full text-lg">Error loading purchases. Please check your connection.</p>';
        });
    }


    // --- Auth State Listener (Main Entry Point) ---
    onAuthStateChanged(auth, (user) => {
        const myPurchasesList = document.getElementById('my-purchases-list');

        if (user) {
            window.userId = user.uid;
            console.log("User authenticated:", user.uid);
            // Only load purchases if the purchases container element is present on the current page
            if (myPurchasesList) {
                loadPurchases(db, user.uid, myPurchasesList);
            }
        } else {
            window.userId = null;
            console.log("User signed out or anonymous.");
            // Display message if the user is not authenticated
            if (myPurchasesList) {
                myPurchasesList.innerHTML = 
                    '<p class="text-center text-text-muted py-12 col-span-full text-lg">Please log in to view your purchases.</p>';
            }
        }
    });

    // Public Sign Out Function
    window.signOutUser = () => {
        signOut(auth).then(() => {
            showCustomAlert('Signed Out', 'You have been successfully signed out.', 'success');
        }).catch(error => {
            console.error("Sign out error:", error);
            showCustomAlert('Error', 'Failed to sign out. Try again.', 'error');
        });
    };

} else {
    console.error("Firebase configuration is missing.");
}


// --- Custom Alert Function (Kept from original snippet) ---
function showCustomAlert(title, message, type = 'info') {
    let color = 'bg-primary-blue';
    // Assume primary-blue, accent-orange, red-danger are defined in tailwind.config
    if (type === 'success') color = 'bg-green-500'; 
    else if (type === 'error') color = 'bg-red-danger';
    else if (type === 'warning') color = 'bg-accent-orange';

    const alertDiv = document.createElement('div');
    alertDiv.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
    alertDiv.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden transform transition-all scale-100 duration-300">
                <div class="${color} text-white p-4 text-xl font-bold">${title}</div>
                <div class="p-6 text-text-dark">
                    <p>${message}</p>
                </div>
                <div class="p-4 border-t flex justify-end">
                    <button class="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-md" onclick="this.closest('.fixed').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(alertDiv);
}

// Attach the alert to the window object so it can be called globally
window.showCustomAlert = showCustomAlert;

// --- Example function for a product detail page (kept from original snippet structure) ---
// This part is retained to match the apparent structure of seed.js, 
// though the logic for adding to cart/buying now is incomplete.
document.addEventListener('DOMContentLoaded', () => {
    const detailAddToCartBtn = document.getElementById('detail-add-to-cart-btn');
    const detailBuyNowBtn = document.getElementById('detail-buy-now-btn');

    if (detailAddToCartBtn && detailBuyNowBtn) {
        // Example: Handle adding to cart logic here if this was the product detail page
        detailAddToCartBtn.addEventListener('click', () => {
             // In a real app, this would add an item to a 'cart' collection
            showCustomAlert('Cart Updated', 'Item successfully added to your cart!', 'success');
        });

        detailBuyNowBtn.addEventListener('click', () => {
            // In a real app, this would initiate the checkout process
            showCustomAlert('Initiating Checkout', 'Preparing your order for immediate purchase...', 'info');
        });
    }
});