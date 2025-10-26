import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
// Import Firebase Auth functions
import {
    getAuth,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    onSnapshot,
    where,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment,
    setLogLevel
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Firebase global variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = {
    apiKey: "AIzaSyAqDLocdi1CDHDeD5Z_LOlVZOycI2tuJpk",
    authDomain: "digisoria-baa83.firebaseapp.com",
    projectId: "digisoria-baa83",
    storageBucket: "digisoria-baa83.appspot.com",
    messagingSenderId: "1042609120554",
    appId: "1:1042609120554:web:0500a100e9ae42ead32a53",
    measurementId: "G-TM8CBPSRR9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const METRICS_COLLECTION = 'metrics';
const METRICS_DOC_ID = 'funnel_counts';
let CURRENT_USER_ID = 'not-authenticated-user-placeholder';
let isAuthResolved = false;
let ALL_PRODUCTS_CACHE = [];
let CURRENT_PRODUCTS = [];

// ===================================
// NEW: SHUFFLE FUNCTION
// ===================================

/**
 * Standard Fisher-Yates (Durstenfeld) shuffle algorithm.
 * @param {Array} array - The array to shuffle in place.
 * @returns {Array} - The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const updateUserMetric = async (fieldName) => {
    if (CURRENT_USER_ID === 'not-authenticated-user-placeholder') {
        console.warn(`User is not authenticated. Cannot track metric: ${fieldName}.`);
        showCustomAlert('Login Required', 'Please log in to track your order activity.', 'info');
        return;
    }
    const metricsRef = doc(db, 'users', CURRENT_USER_ID, METRICS_COLLECTION, METRICS_DOC_ID);
    try {
        await setDoc(metricsRef, {
            [fieldName]: increment(1),
            lastUpdated: new Date().toISOString()
        }, {
            merge: true
        });
        console.log(`User metric updated: ${fieldName} for user: ${CURRENT_USER_ID}.`);
    } catch (e) {
        console.error(`Error updating user metric ${fieldName}:`, e);
    }
};

// ===================================
// WISHLIST PERSISTENCE LOGIC (MODIFIED FOR FIRESTORE)
// ===================================
const WISHLIST_COLLECTION = 'wishlist';
const WISHLIST_DOC_ID = 'currentWishlist';
let wishlistIds = []; // Global state for wishlist IDs (REPLACING localStorage)


/**
 * Returns the current global wishlistIds array.
 */
function getWishlistIds() {
    return wishlistIds;
}

// Helper function to get a product by ID from the cache
function getProductById(productId) {
    return ALL_PRODUCTS_CACHE.find(p => p.id === productId.toString());
}

/**
 * Saves the current wishlistIds array to Firestore.
 */
const saveWishlistToFirestore = async () => {
    if (!isAuthResolved || CURRENT_USER_ID === 'not-authenticated-user-placeholder') {
        console.warn("Authentication not resolved or user not logged in. Cannot save wishlist.");
        return;
    }

    const wishlistRef = doc(db, 'users', CURRENT_USER_ID, WISHLIST_COLLECTION, WISHLIST_DOC_ID);

    try {
        await setDoc(wishlistRef, {
            productIds: wishlistIds,
            lastUpdated: new Date().toISOString()
        }, {
            merge: true
        });
        console.log("Wishlist saved to Firestore successfully.");
    } catch (e) {
        console.error("Error saving wishlist to Firestore:", e);
    }
};

/**
 * Loads the wishlistIds array from Firestore for the logged-in user.
 */
const loadWishlistFromFirestore = async (userId) => {
    if (userId === 'not-authenticated-user-placeholder') {
        return [];
    }

    const wishlistRef = doc(db, 'users', userId, WISHLIST_COLLECTION, WISHLIST_DOC_ID);

    try {
        const docSnap = await getDoc(wishlistRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Wishlist loaded from Firestore successfully. Items:", data.productIds ? data.productIds.length : 0);
            return data.productIds || [];
        } else {
            console.log("No existing wishlist found in Firestore. Starting with an empty wishlist.");
            return [];
        }
    } catch (e) {
        console.error("Error loading wishlist from Firestore:", e);
        return [];
    }
};

/**
 * Updates the heart icons on all rendered product cards based on the global wishlistIds state.
 */
const updateHeartIcons = () => {
    const currentWishlistIds = getWishlistIds();

    document.querySelectorAll('.toggle-wishlist').forEach(button => {
        const productId = button.dataset.productId;
        const isWishlisted = currentWishlistIds.includes(productId);
        const icon = button.querySelector('i');

        if (icon) {
            if (isWishlisted) {
                icon.classList.remove('text-white/80', 'group-hover:text-red-danger');
                icon.classList.add('text-red-danger');
            } else {
                icon.classList.remove('text-red-danger');
                icon.classList.add('text-white/80', 'group-hover:text-red-danger');
            }
        }
    });

    // Re-render the wishlist popover if it's open to reflect changes
    if (wishlistPopover && wishlistPopover.classList.contains('open')) {
        renderWishlistPopover();
    }
};

/**
 * Toggles a product's presence in the global wishlist array and saves to Firestore.
 * @param {string} productId - The ID of the product to toggle.
 */
const toggleWishlist = (productId) => {
    productId = productId.toString();
    const index = wishlistIds.indexOf(productId);
    const isCurrentlyWishlisted = index > -1;

    if (isCurrentlyWishlisted) {
        // Remove from wishlist
        wishlistIds.splice(index, 1);
        showCustomAlert('Wishlist Updated', 'Product removed from your wishlist.', 'info');
    } else {
        // Add to wishlist
        wishlistIds.push(productId);
        showCustomAlert('Wishlist Updated', 'Product added to your wishlist!', 'success');
    }

    // Save the updated state to Firestore
    saveWishlistToFirestore();

    // Update heart icons on the product grids
    updateHeartIcons();
};


// ===================================
// CART PERSISTENCE LOGIC
// ===================================
const CART_COLLECTION = 'carts';
const CART_DOC_ID = 'currentCart';

// ** Global Cart State **
let cartItems = [];

/**
 * Saves the current cartItems array to Firestore for the logged-in user.
 */
const saveCartToFirestore = async () => {
    // <<< CORE FIX: Check if auth is resolved AND user is logged in
    if (!isAuthResolved || CURRENT_USER_ID === 'not-authenticated-user-placeholder') {
        console.warn("Authentication not resolved or user not logged in. Cannot save cart.");
        return;
    }

    // Path: users/{UID}/carts/currentCart
    const cartRef = doc(db, 'users', CURRENT_USER_ID, CART_COLLECTION, CART_DOC_ID);

    try {
        // Save the entire cartItems array
        await setDoc(cartRef, {
            items: cartItems,
            lastUpdated: new Date().toISOString()
        }, {
            merge: true
        }); // Use merge: true just in case
        console.log("Shopping cart saved to Firestore successfully.");
    } catch (e) {
        console.error("Error saving cart to Firestore:", e);
    }
};

/**
 * Loads the cartItems array from Firestore for the logged-in user.
 */
const loadCartFromFirestore = async (userId) => {
    if (userId === 'not-authenticated-user-placeholder') {
        return [];
    }

    const cartRef = doc(db, 'users', userId, CART_COLLECTION, CART_DOC_ID);

    try {
        const docSnap = await getDoc(cartRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Shopping cart loaded from Firestore successfully. Items:", data.items ? data.items.length : 0);
            return data.items || [];
        } else {
            console.log("No existing cart found in Firestore. Starting with an empty cart.");
            return [];
        }
    } catch (e) {
        console.error("Error loading cart from Firestore:", e);
        return []; // Fallback to empty cart on error
    }
};


// ===================================
// AUTHENTICATION STATE MANAGEMENT (MODIFIED)
// ===================================

const userIndicator = document.getElementById('user-indicator');
const authButtonText = document.getElementById('auth-button-text');

// ** Refactored onAuthStateChanged for synchronous cart and wishlist state update **
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in.
        CURRENT_USER_ID = user.uid;

        const displayName = user.displayName || user.email;
        userIndicator.textContent = `Welcome, ${displayName.split('@')[0]}`;
        userIndicator.classList.remove('hidden', 'bg-white/20');
        userIndicator.classList.add('bg-accent-orange/80');
        authButtonText.textContent = "Sign Out";

        // Load cart and update global state after authentication
        cartItems = await loadCartFromFirestore(CURRENT_USER_ID);
        renderCart();

        // ⭐ NEW: Load wishlist and update global state after authentication ⭐
        wishlistIds = await loadWishlistFromFirestore(CURRENT_USER_ID);
        updateHeartIcons(); // Sync UI icons with loaded state

    } else {
        // User is signed out.
        CURRENT_USER_ID = 'not-authenticated-user-placeholder';
        userIndicator.textContent = 'Logged Out';
        userIndicator.classList.remove('hidden', 'bg-accent-orange/80');
        userIndicator.classList.add('bg-white/20');
        authButtonText.textContent = "Log In";

        // Clear cart and wishlist immediately on sign out
        cartItems = [];
        wishlistIds = []; // Clear global wishlist state
        renderCart();
        updateHeartIcons(); // Update icons to reflect empty wishlist
    }

    // <<< CORE FIX: Set the flag AFTER we have determined the user status
    isAuthResolved = true;
});

// ===================================
// SEARCH LOGIC VARIABLES
// ===================================
const searchInput = document.getElementById('search-input');

// ===================================
// CART STATE & LOGIC
// ===================================
const cartCountElement = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const backdrop = document.getElementById('backdrop');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalElement = document.getElementById('cart-total');
const selectedItemCountElement = document.getElementById('selected-item-count');
const checkoutButton = document.getElementById('checkout-button');
const selectAllCheckbox = document.getElementById('select-all-checkbox');

const orderReviewScreen = document.getElementById('order-review-screen');
const trackOrderScreen = document.getElementById('track-order-screen');
const SHIPPING_SUBTOTAL = 4.99;

const updateCartCountDisplay = () => {
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalCount;
    }
};

const updateCartTotal = () => {
    let subtotal = 0;
    let selectedCount = 0;
    cartItems.forEach(item => {
        if (item.selected) {
            subtotal += item.price * item.quantity;
            selectedCount++;
        }
    });
    if (cartTotalElement) {
        cartTotalElement.textContent = subtotal.toFixed(2);
    }
    if (selectedItemCountElement) {
        selectedItemCountElement.textContent = selectedCount;
    }
    if (checkoutButton) {
        checkoutButton.disabled = selectedCount === 0;
    }
    if (selectAllCheckbox) {
        // Only check 'select all' if the cart isn't empty and all items are selected
        selectAllCheckbox.checked = cartItems.length > 0 && selectedCount === cartItems.length;
    }
};

const renderCart = () => {
    cartItemsList.innerHTML = '';
    if (cartItems.length === 0) {
        cartItemsList.innerHTML = '<p class="text-center text-text-muted py-8">Your cart is empty.</p>';
    } else {
        cartItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'bg-white rounded-lg shadow-sm flex flex-col space-y-3';

            // Shop Name Header Row
            const shopHeader = document.createElement('div');
            shopHeader.className =
                'flex items-center p-3 border-b border-gray-100 bg-secondary-gray rounded-t-lg';
            shopHeader.innerHTML = `
                        <label class="flex items-center w-full">
                            <input type="checkbox" data-index="${index}" class="item-select-checkbox h-4 w-4 text-primary-blue rounded focus:ring-primary-blue border-gray-300 mr-3" ${item.selected ? 'checked' : ''}>
                            <span class="font-semibold text-text-dark text-sm">Shop Name Placeholder</span>
                        </label>
                    `;
            itemElement.appendChild(shopHeader);

            // Item Detail Row
            const itemDetail = document.createElement('div');
            itemDetail.className = 'flex items-start justify-between space-x-2 p-3 pt-0';
            itemDetail.innerHTML = `
                        <div class="flex items-start flex-shrink-0 w-1/2">
                            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md flex-shrink-0 mr-3 mt-1">
                            <div class="flex flex-col flex-grow min-w-0">
                                <span class="font-medium text-text-dark truncate">${item.name}</span>
                                <select class="mt-1 text-xs text-text-muted border-gray-200 rounded-md p-1 min-w-[5rem] max-w-full">
                                    <option>Variations: Default</option>
                                    <option>Variations: Option A</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex flex-grow justify-end items-center text-sm space-x-2">

                            <div class="flex flex-col items-center pt-2 hidden lg:flex min-w-[4rem]">
                                <span class="text-text-muted text-xs">Unit Price</span>
                                <span class="font-semibold text-primary-blue text-sm">₱${item.price.toFixed(2)}</span>
                            </div>

                            <div class="flex flex-col items-center pt-2 min-w-[5.5rem] flex-shrink-0">
                                <span class="text-text-muted text-xs">Qty</span>
                                <div class="flex items-center border border-gray-300 rounded-md mt-1">
                                    <button class="qty-btn text-text-dark hover:bg-gray-100 px-2 py-1 rounded-l-md" data-index="${index}" data-action="decrease"><i class="fas fa-minus text-xs"></i></button>
                                    <span class="px-2 font-medium text-sm">${item.quantity}</span>
                                    <button class="qty-btn text-text-dark hover:bg-gray-100 px-2 py-1 rounded-r-md" data-index="${index}" data-action="increase"><i class="fas fa-plus text-xs"></i></button>
                                </div>
                            </div>

                            <div class="flex flex-col items-center pt-2 min-w-[4.5rem] flex-shrink-0">
                                <span class="text-text-muted text-xs">Total</span>
                                <span class="font-bold text-red-danger text-lg">₱${(item.price * item.quantity).toFixed(2)}</span>
                            </div>

                            <button
                                class="delete-item-btn text-text-muted hover:text-red-danger transition-colors ml-2 pt-2 flex-shrink-0"
                                data-index="${index}">
                                <i class="fas fa-trash-alt text-lg"></i>
                            </button>
                        </div>
                    `;
            itemElement.appendChild(itemDetail);
            cartItemsList.appendChild(itemElement);
        });
        attachCartEventListeners();
    }
    updateCartTotal();
    updateCartCountDisplay();
};

const attachCartEventListeners = () => {
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const index = parseInt(event.currentTarget.dataset.index);
            const action = event.currentTarget.dataset.action;
            updateQuantity(index, action);
        });
    });
    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const index = parseInt(event.currentTarget.dataset.index);
            deleteItem(index);
        });
    });
    document.querySelectorAll('.item-select-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const index = parseInt(event.target.dataset.index);
            cartItems[index].selected = event.target.checked;
            updateCartTotal();
            saveCartToFirestore();
        });
    });
};

const toggleCartDrawer = () => {
    cartDrawer.classList.toggle('open');
    backdrop.classList.toggle('open');
    if (cartDrawer.classList.contains('open')) {
        renderCart();
    }
    // Close other elements
    if (cartDrawer.classList.contains('open')) {
        filterMenu.classList.remove('open');
        closeProductDetailModal();
        closeWishlistPopover(); // Close popover
    }
};

const closeCartDrawer = () => {
    cartDrawer.classList.remove('open');
    // Only remove backdrop if nothing else is open
    if (!filterMenu.classList.contains('open') && !wishlistPopover.classList.contains('open')) {
        backdrop.classList.remove('open');
    }
}

const updateQuantity = (index, action) => {
    // <<< CORE FIX: Gated function call
    if (!isAuthResolved) {
        showCustomAlert('Loading...', 'Please wait for the page to finish loading user data.', 'info');
        return;
    }

    const item = cartItems[index];
    if (action === 'increase') {
        item.quantity++;
    } else if (action === 'decrease' && item.quantity > 1) {
        item.quantity--;
    } else if (action === 'decrease' && item.quantity === 1) {
        deleteItem(index);
        return;
    }
    renderCart();
    saveCartToFirestore();
};

const deleteItem = (index) => {
    // <<< CORE FIX: Gated function call
    if (!isAuthResolved) {
        showCustomAlert('Loading...', 'Please wait for the page to finish loading user data.', 'info');
        return;
    }

    cartItems.splice(index, 1);
    renderCart();
    saveCartToFirestore();
};


const addToCart = (product) => {
    updateUserMetric('shoppingCartAdds');

    if (!isAuthResolved) {
        showCustomAlert('Loading...', 'Please wait for the page to finish loading user data.', 'info');
        return;
    }

    if (CURRENT_USER_ID === 'not-authenticated-user-placeholder') {
        showCustomAlert('Login Required', 'Please log in to add items to your persistent cart.', 'error');
        return;
    }

    const existingItem = cartItems.find(item => item.name === product.name);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({
            name: product.name,
            price: product.price,
            quantity: product.quantity || 1, // Use product quantity from modal if available
            image: product.image,
            selected: true,
        });
    }

    updateCartCountDisplay();

    // If the cart drawer is already open, re-render the contents
    if (cartDrawer.classList.contains('open')) {
        renderCart();
    }

    // Show a success notification instead of forcing the drawer open
    window.showCustomAlert('Item Added', `${product.name} has been added to your cart.`, 'success');

    // Add the bounce animation to the cart icon for visual feedback
    if (cartCountElement) {
        cartCountElement.classList.add('bouncing');
        setTimeout(() => {
            cartCountElement.classList.remove('bouncing');
        }, 600);
    }

    saveCartToFirestore();
};

// ===================================
// WISHLIST POPOVER LOGIC
// ===================================

const wishlistPopover = document.getElementById('wishlist-popover');
const wishlistItemsList = document.getElementById('wishlist-items-list');
const wishlistContainer = document.getElementById('wishlist-container');


const openWishlistPopover = () => {
    wishlistPopover.classList.add('open', 'opacity-100', 'scale-100', 'pointer-events-auto');
    wishlistPopover.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    renderWishlistPopover();

    // Close other popovers/drawers
    document.getElementById('profile-menu').classList.remove('open');
    closeCartDrawer();
    if (filterMenu.classList.contains('open')) {
        toggleFilterMenu();
    }
    closeProductDetailModal();

    // Add listener to close when clicking outside
    document.addEventListener('click', closeWishlistPopoverOnClickOutside);
};

const closeWishlistPopover = () => {
    wishlistPopover.classList.remove('open', 'opacity-100', 'scale-100', 'pointer-events-auto');
    wishlistPopover.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    document.removeEventListener('click', closeWishlistPopoverOnClickOutside);
};

const closeWishlistPopoverOnClickOutside = (event) => {
    // If click is outside the popover and outside the button, close the popover
    if (!wishlistContainer.contains(event.target)) {
        closeWishlistPopover();
    }
};

const toggleWishlistPopover = (event) => {
    event.stopPropagation(); // Prevent the click from immediately closing it via the window listener
    if (wishlistPopover.classList.contains('open')) {
        closeWishlistPopover();
    } else {
        openWishlistPopover();
    }
};

const renderWishlistPopover = () => {
    const currentWishlistIds = getWishlistIds();

    if (!wishlistItemsList) return;

    wishlistItemsList.innerHTML = ''; // Clear existing items

    const wishlistedProducts = ALL_PRODUCTS_CACHE.filter(p => currentWishlistIds.includes(p.id.toString()));

    if (wishlistedProducts.length === 0) {
        wishlistItemsList.innerHTML = '<p class="text-center text-text-muted py-4 text-sm">Your wishlist is empty. Start adding items!</p>';
        return;
    }

    wishlistedProducts.forEach(product => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm border border-gray-100';
        itemDiv.innerHTML = `
                    <img src="${(product.images && product.images[0]) || product.image || 'https://placehold.co/40x40/e2e8f0/64748b?text=Product'}" 
                         alt="${product.name}" 
                         class="w-10 h-10 object-cover rounded flex-shrink-0">
                    <div class="flex-grow min-w-0">
                        <h4 class="text-sm font-semibold text-text-dark truncate">${product.name}</h4>
                        <p class="text-xs text-accent-orange font-bold">₱${parseFloat(product.price).toFixed(2)}</p>
                    </div>
                    <button class="add-to-cart-from-wishlist p-1 text-primary-blue hover:text-blue-600 transition-colors flex-shrink-0"
                            data-product-id="${product.id}" title="Add to Cart">
                        <i class="fas fa-cart-plus text-lg"></i>
                    </button>
                    <button class="remove-from-wishlist p-1 text-text-muted hover:text-red-danger transition-colors flex-shrink-0"
                            data-product-id="${product.id}" title="Remove">
                        <i class="fas fa-trash-alt text-base"></i>
                    </button>
                `;
        wishlistItemsList.appendChild(itemDiv);
    });

    // Attach listeners for buttons in the wishlist panel
    document.querySelectorAll('.remove-from-wishlist').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop propagation to prevent popover closing
            const productId = button.dataset.productId;
            toggleWishlist(productId); // This handles the removal and saving
        });
    });

    document.querySelectorAll('.add-to-cart-from-wishlist').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop propagation to prevent popover closing
            const productId = button.dataset.productId;
            const product = getProductById(productId);
            if (product) {
                addToCart({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price),
                    image: (product.images && product.images[0]) || product.image
                });
                // Optional: remove from wishlist after adding to cart
                // toggleWishlist(productId); 
            }
        });
    });
};

// ===================================
// PRODUCT DETAIL MODAL LOGIC
// ===================================

const productDetailModal = document.getElementById('product-detail-modal');
const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
const detailProductName = document.getElementById('detail-product-name');
const detailPrice = document.getElementById('detail-price');
const detailRating = document.getElementById('detail-rating');
const detailDescription = document.getElementById('detail-description');
const detailMainImage = document.getElementById('detail-main-image');
const detailColorSelect = document.getElementById('detail-color-select');
const detailQtyInput = document.getElementById('detail-qty-input');
const detailQtyDecrease = document.getElementById('detail-qty-decrease');
const detailQtyIncrease = document.getElementById('detail-qty-increase');
const detailAddToCartBtn = document.getElementById('detail-add-to-cart-btn');
const detailBuyNowBtn = document.getElementById('detail-buy-now-btn');
const detailInStock = document.getElementById('detail-in-stock');

let currentProduct = null;

const closeProductDetailModal = () => {
    productDetailModal.classList.remove('open');
    currentProduct = null;
};


const renderProductDetail = (product) => {
    currentProduct = product;

    // FIX 1: Set a fallback name/title
    const name = product.name || 'Unknown Product';
    detailProductName.textContent = name;
    document.getElementById('modal-product-name-mobile').textContent = name;

    // FIX 2: Populate all other fields from the product object
    detailPrice.textContent = `₱${parseFloat(product.price || 0).toFixed(2)}`;
    detailDescription.textContent = product.description || 'No detailed description available.';

    // --- START: Image Rendering Logic ---
    const images = product.images || [product.image]; // Use images array, fall back to single image
    const defaultImage = images[0] || 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image';

    detailMainImage.src = defaultImage;

    const detailThumbnails = document.getElementById('detail-thumbnails');
    detailThumbnails.innerHTML = ''; // Clear previous thumbnails

    images.forEach((imgUrl, index) => {
        const isFirst = index === 0;
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = `w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg border-2 flex-shrink-0 cursor-pointer shadow-md ${isFirst ? 'border-primary-blue' : 'border-transparent'}`;
        thumbnailDiv.innerHTML = `<img src="${imgUrl}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover rounded-lg p-1">`;

        thumbnailDiv.addEventListener('click', () => {
            // Update main image
            detailMainImage.src = imgUrl;
            // Update border to show active thumbnail
            detailThumbnails.querySelectorAll('div').forEach(thumb => {
                thumb.classList.remove('border-primary-blue');
                thumb.classList.add('border-transparent');
            });
            thumbnailDiv.classList.remove('border-transparent');
            thumbnailDiv.classList.add('border-primary-blue');
        });

        detailThumbnails.appendChild(thumbnailDiv);
    });
    // --- END: Image Rendering Logic ---


    // Rating
    const ratingHtml = getRatingStars(product.rating || 0) +
        `<span class="ml-2 text-text-muted text-sm">(${parseFloat(product.rating || 0).toFixed(1)})</span>` +
        `<a href="#" class="ml-2 text-primary-blue hover:underline text-sm font-medium">View 345 Feedbacks</a>`;
    detailRating.innerHTML = ratingHtml;

    // Quantity and Stock
    const stock = product.stock || 500;
    detailInStock.textContent = `In stock: ${stock}`;
    detailQtyInput.value = 1;
    detailQtyInput.max = stock;

    // Variations/Colors (Placeholder logic)
    detailColorSelect.innerHTML = product.options && product.options.colors ?
        product.options.colors.map(c => `<option>${c}</option>`).join('') :
        '<option>Default</option>';

    // Seller Info Placeholder
    document.getElementById('detail-seller-property').textContent = product.property || 'No Property Info';
    document.getElementById('detail-description-property').textContent = product.property || 'No Property Info';

    // Open the modal
    productDetailModal.classList.add('open');
};


const handleDetailAddToCart = () => {
    if (!currentProduct) return;
    const quantity = parseInt(detailQtyInput.value);
    const selectedColor = detailColorSelect.value;

    // Create a cart item object with the selected quantity and variation
    const cartProduct = {
        id: currentProduct.id,
        name: `${currentProduct.name} - ${selectedColor}`, // Include variation in name for cart distinction
        price: currentProduct.price,
        image: currentProduct.image,
        quantity: quantity
    };

    addToCart(cartProduct);
    closeProductDetailModal();
};

// Attach listeners for modal quantity controls
const attachDetailModalListeners = () => {
    closeDetailModalBtn.addEventListener('click', closeProductDetailModal);
    productDetailModal.addEventListener('click', (event) => {
        // Close modal if user clicks on the semi-transparent background (not the content)
        if (event.target === productDetailModal) {
            closeProductDetailModal();
        }
    });

    detailQtyIncrease.addEventListener('click', () => {
        let qty = parseInt(detailQtyInput.value);
        const max = parseInt(detailQtyInput.max);
        if (qty < max) {
            detailQtyInput.value = qty + 1;
        }
    });

    detailQtyDecrease.addEventListener('click', () => {
        let qty = parseInt(detailQtyInput.value);
        if (qty > 1) {
            detailQtyInput.value = qty - 1;
        }
    });

    detailAddToCartBtn.addEventListener('click', handleDetailAddToCart);

    detailBuyNowBtn.addEventListener('click', () => {
        // For simplicity, this acts like add to cart and then goes to checkout
        handleDetailAddToCart();
        openOrderReview();
    });
};

// ===================================
// NEW FILTER MENU LOGIC
// ===================================

const menuButton = document.getElementById('menu-button');
const filterMenu = document.getElementById('filter-menu');
const closeMenuBtn = document.getElementById('close-menu-btn');
const cancelFiltersBtn = document.getElementById('cancel-filters-btn');
const applyFiltersBtn = document.getElementById('apply-filters-btn');

const toggleFilterMenu = () => {
    filterMenu.classList.toggle('open');
    backdrop.classList.toggle('open');
    // Close other elements
    if (filterMenu.classList.contains('open')) {
        closeCartDrawer();
        closeProductDetailModal();
        closeWishlistPopover();
    }
};


// ===================================
// ORDER REVIEW & TRACK ORDER LOGIC
// ===================================

const closeOrderReview = () => {
    orderReviewScreen.classList.remove('open');
};

const closeTrackOrder = () => {
    trackOrderScreen.classList.remove('open');
    trackOrderScreen.innerHTML = '';
}

// NEW: Function to fetch user profile data
const fetchUserProfile = async (userId) => {
    if (userId === 'not-authenticated-user-placeholder') {
        return null;
    }
    const userRef = doc(db, 'users', userId);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.warn("No user profile data found in Firestore.");
            return null;
        }
    } catch (e) {
        console.error("Error fetching user profile:", e);
        return null;
    }
};

/**
 * Renders the Track Order screen with actual order details.
 * @param {Array<Object>} orderItems - The list of items purchased in the order.
 */
const renderTrackOrderScreen = (orderItems) => {
    // Calculate totals
    const totalOrderAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Static placeholder data for the order progress bar (you would update this with real order status in a full app)
    const currentStep = 2; // For demonstration: Order Placed (1) -> Packing Order (2)
    const steps = [{
        icon: 'fas fa-shopping-cart',
        label: 'Order Placed'
    }, {
        icon: 'fas fa-box-open',
        label: 'Packing Order'
    }, {
        icon: 'fas fa-hands-helping',
        label: 'Order Shipped'
    }, {
        icon: 'fas fa-truck',
        label: 'Out for Delivery'
    }, {
        icon: 'fas fa-box',
        label: 'Delivered'
    }];

    const currencySymbol = '₱';
    const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

    // Build the progress bar HTML
    let stepsHtml = steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        const iconClass = step.icon;
        return `
                    <div class="progress-step w-1/5">
                        <div class="step-icon ${isActive ? 'active' : ''}">
                            <i class="${iconClass} text-lg"></i>
                        </div>
                        <span class="text-xs font-semibold ${isActive ? 'text-text-dark' : 'text-text-muted'}">${step.label}</span>
                    </div>
                `;
    }).join('');

    // Build the order items HTML (using the first item for the main display for simplicity)
    const firstItem = orderItems[0];
    const itemDetailsHtml = firstItem ? `
        <div class="flex items-start w-full sm:w-2/3 mb-6 sm:mb-0">
            <img src="${firstItem.image}" alt="${firstItem.name}" class="w-24 h-24 object-cover rounded-md flex-shrink-0 mr-4">
            <div class="flex flex-col">
                <span class="text-xl font-bold text-text-dark">${firstItem.name}</span>
                <span class="text-sm text-accent-orange mt-1">Quantity: ${firstItem.quantity} (Total: ${orderItems.length} item${orderItems.length > 1 ? 's' : ''})</span>
            </div>
        </div>

        <div class="w-full sm:w-1/3 flex flex-col space-y-2 text-sm text-right">
            <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                <span class="text-lg font-semibold">Total Order Amount:</span>
                <span class="text-2xl font-extrabold text-red-danger">${currencySymbol}${totalOrderAmount.toFixed(2)}</span>
            </div>
            <span class="text-sm font-bold text-green-600">Cash On Delivery</span>
        </div>
    ` : '<p class="text-center text-red-danger col-span-full py-8">No order details to display.</p>';


    const content = `
                <div class="max-w-4xl mx-auto p-4 md:p-8">
                    <div class="flex justify-between items-center mb-6 border-b pb-4 bg-page-bg sticky top-0 z-10">
                        <h2 class="text-3xl font-extrabold text-primary-blue">Track Your Order</h2>
                        <button id="close-track-btn" class="text-text-muted hover:text-red-danger transition-colors text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
                        <div class="relative flex justify-between items-start mb-12">
                            <div class="progress-bar-line">
                                <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
                            </div>
                            ${stepsHtml}
                        </div>

                        <div class="flex flex-col sm:flex-row border-t border-gray-100 pt-6">
                            ${itemDetailsHtml}
                        </div>
                    </div>

                    <div class="flex justify-between items-center p-4">
                        <button onclick="window.location.reload()" class="px-6 py-3 bg-primary-blue text-white font-semibold rounded-xl shadow-md hover:bg-blue-800 transition-colors">
                            Back to Shopping
                        </button>
                        <a href="message.html"
                           class="px-6 py-3 bg-white text-text-dark border border-gray-300 font-semibold rounded-xl shadow-sm hover:bg-gray-100 transition-colors">
                            Message Seller
                        </a>
                    </div>
                </div>
            `;
    trackOrderScreen.innerHTML = content;
    trackOrderScreen.classList.add('open');
    document.getElementById('close-track-btn').addEventListener('click', closeTrackOrder);
};

const placeOrder = () => {
    // 1. Capture the selected items before clearing the cart
    const itemsPurchased = cartItems.filter(item => item.selected);

    // 2. Log the metric for placing an order
    updateUserMetric('placeOrders');
    console.log("Order Placed!", itemsPurchased);

    // 3. Filter out purchased items
    cartItems = cartItems.filter(item => !item.selected);

    // 4. Save the new, smaller cart array to Firestore
    saveCartToFirestore();

    // 5. Update the displays
    updateCartCountDisplay();
    updateCartTotal();
    renderCart();

    // 6. Close the order review screen
    closeOrderReview();

    // 7. Show the NEW Track Order screen, passing the actual items
    renderTrackOrderScreen(itemsPurchased);
};

const renderOrderItem = (item) => {
    const row = document.createElement('div');
    const itemTotal = (item.price * item.quantity);
    const currencySymbol = '₱';
    row.className = 'bg-white rounded-lg shadow-sm flex flex-col p-4 mb-4 border border-gray-200';
    row.innerHTML = `
                <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 items-center text-text-dark">
                    <div class="col-span-4 md:col-span-3 lg:col-span-5 flex items-start">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md flex-shrink-0 mr-4">
                        <div class="flex flex-col">
                            <span class="font-bold text-lg leading-tight">${item.name}</span>
                            <span class="text-accent-orange text-sm mt-1">Variation: Default</span>
                        </div>
                    </div>

                    <div class="col-span-2 md:col-span-1 lg:col-span-2 text-center text-sm hidden sm:block">
                        <span class="text-text-muted text-xs block lg:hidden">Unit Price</span>
                        <span class="font-medium text-primary-blue mt-1">${currencySymbol}${item.price.toFixed(2)}</span>
                    </div>

                    <div class="col-span-2 md:col-span-1 lg:col-span-1 text-center text-sm hidden sm:block">
                         <span class="text-text-muted text-xs block lg:hidden">Qty</span>
                        <span class="font-medium mt-1">${item.quantity}</span>
                    </div>

                    <div class="col-span-4 md:col-span-1 lg:col-span-2 text-right">
                        <span class="font-extrabold text-red-danger text-xl">${currencySymbol}${itemTotal.toFixed(2)}</span>
                    </div>

                    <div class="col-span-4 sm:hidden flex flex-col text-sm text-text-muted mt-2">
                        <span>Unit: ${currencySymbol}${item.price.toFixed(2)} | Qty: ${item.quantity}</span>
                    </div>
                </div>
            `;
    return row;
};


const openOrderReview = async () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
        showCustomAlert('No Items Selected', 'Please select at least one item to proceed to checkout.', 'error');
        return;
    }

    if (CURRENT_USER_ID === 'not-authenticated-user-placeholder') {
        // Essential check for placing an order
        showCustomAlert('Login Required', 'You must be logged in to proceed with checkout and order placement.', 'error');
        return;
    }

    // ⭐ NEW LOGIC TO FETCH USER PROFILE DATA ⭐
    const userProfile = await fetchUserProfile(CURRENT_USER_ID);

    // Set fallback values in case the profile data is missing
    const userName = userProfile?.name || 'User Name Placeholder';
    const userAddress = userProfile?.address || 'Address not available in profile.';
    const userPhone = userProfile?.phone || 'Phone not available';
    // ⭐ END NEW LOGIC ⭐

    updateUserMetric('checkouts');
    closeCartDrawer(); // Use the existing function to close the drawer correctly

    let merchandiseSubtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalPayment = merchandiseSubtotal + SHIPPING_SUBTOTAL;
    const currencySymbol = '₱';

    const content = `
                <div class="max-w-4xl mx-auto p-4 md:p-8">
                    <div class="flex justify-between items-center mb-6 border-b pb-4 bg-page-bg sticky top-0 z-10">
                        <h2 class="text-3xl font-extrabold text-primary-blue">Review & Place Order</h2>
                        <button id="close-order-btn" class="text-text-muted hover:text-red-danger transition-colors text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div class="flex justify-between items-center border-b pb-3 mb-3">
                            <div class="text-lg font-bold text-accent-orange flex items-center">
                                <i class="fas fa-map-marker-alt mr-2"></i>Delivery Address
                            </div>
                            <button class="text-primary-blue hover:text-accent-orange font-medium text-sm transition-colors">
                                Change Address
                            </button>
                        </div>
                        <p class="text-text-dark font-medium">${userName}</p>
                        <p class="text-text-muted text-sm">${userAddress}</p>
                        <p class="text-text-muted text-sm">${userPhone}</p>
                    </div>

                    <h3 class="text-xl font-bold text-text-dark mb-4">Your Order(s):</h3>

                    <div class="hidden lg:grid grid-cols-10 gap-2 font-semibold text-text-muted text-sm border-b pb-2 px-4 mb-2">
                        <span class="col-span-5">Product Details</span>
                        <span class="col-span-2 text-center">Unit Price</span>
                        <span class="col-span-1 text-center">Quantity</span>
                        <span class="col-span-2 text-right">Total Price</span>
                    </div>

                    <div id="order-items-list" class="mb-8">
                        </div>

                    <div class="bg-white rounded-xl shadow-lg p-6 mb-8 flex flex-col lg:flex-row justify-between">

                        <div class="w-full lg:w-1/3 mb-6 lg:mb-0">
                            <h3 class="text-2xl font-bold text-text-dark mb-4">Payment Method</h3>
                            <div class="flex space-x-2">
                                <button class="px-4 py-2 bg-accent-orange text-white font-semibold rounded-lg shadow-md flex items-center">
                                    <i class="fas fa-truck mr-2"></i> Cash On Delivery
                                </button>
                                <button class="px-4 py-2 bg-green-500/80 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors">
                                    Discount %
                                </button>
                            </div>
                        </div>

                        <div class="w-full lg:w-1/2 flex flex-col items-end">
                            <div class="w-full max-w-sm space-y-2 text-text-dark mb-6">
                                <div class="flex justify-between">
                                    <span class="text-text-muted">Merchandise Subtotal:</span>
                                    <span class="font-medium">${currencySymbol}<span id="merchandise-subtotal">${merchandiseSubtotal.toFixed(2)}</span></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-text-muted">Shipping Subtotal:</span>
                                    <span class="font-medium">${currencySymbol}${SHIPPING_SUBTOTAL.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span class="text-lg font-semibold">Total Payment:</span>
                                    <span class="text-3xl font-extrabold text-red-danger">${currencySymbol}<span id="total-payment">${totalPayment.toFixed(2)}</span></span>
                                </div>
                            </div>

                            <button id="place-order-btn"
                                class="w-full max-w-sm py-3 bg-accent-orange text-white font-extrabold text-lg rounded-xl shadow-xl hover:bg-orange-600 transition-colors transform hover:scale-[1.01] active:scale-[0.99]">
                                PLACE ORDER
                            </button>
                        </div>
                    </div>
                </div>
            `;
    orderReviewScreen.innerHTML = content;
    const orderItemsList = document.getElementById('order-items-list');
    selectedItems.forEach(item => {
        orderItemsList.appendChild(renderOrderItem(item));
    });
    document.getElementById('close-order-btn').addEventListener('click', closeOrderReview);
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);

    orderReviewScreen.classList.add('open');
};

const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starsHtml += `<i class="fas fa-star"></i>`;
    }
    if (halfStar) {
        starsHtml += `<i class="fas fa-star-half-alt"></i>`;
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += `<i class="far fa-star"></i>`;
    }
    return starsHtml;
};

const featuredProductsGrid = document.getElementById('featured-products-grid');
// START MODIFIED CODE for Recommended Products
const recommendedProductsGrid = document.getElementById('recommended-products-grid');

/**
 * Renders a single RECOMMENDED product card using the FEATURED CARD STYLE.
 * @param {Object} product - The product data object.
 */
function renderRecommendedCard(product) {
    const card = document.createElement('div');
    // MODIFIED CLASS: Now uses the same square card styling as featured products
    card.className =
        'bg-light-bg rounded-xl shadow-lg overflow-hidden product-card hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between relative';

    const price = parseFloat(product.price || 0).toFixed(2);
    const rating = parseFloat(product.rating || 0).toFixed(1);
    const description = product.description || 'No description provided.';
    const productId = product.id;

    const image = (product.images && product.images[0]) || product.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';

    const currentWishlistIds = getWishlistIds();
    const isWishlisted = currentWishlistIds.includes(productId.toString());
    const heartClass = isWishlisted ? 'text-red-danger' : 'text-white/80 group-hover:text-red-danger';

    // MODIFIED INNER HTML: Using the same full featured card HTML structure
    card.innerHTML = `
                <div class="relative group">
                    <img src="${image}" alt="${product.name}" class="w-full h-48 object-cover">
                    
                    <button class="absolute top-3 right-3 p-2 bg-black/30 hover:bg-white rounded-full shadow-md z-10 toggle-wishlist transition-colors duration-200" 
                            data-product-id="${productId}" 
                            aria-label="Add to Wishlist">
                        <i class="fas fa-heart ${heartClass} text-xl transition-colors duration-200"></i>
                    </button>
                    
                    <div class="p-4">
                        <h3 class="text-lg font-bold text-text-dark truncate">${product.name}</h3>
                        <div class="flex items-center text-amber-500 text-sm mb-1">
                            ${getRatingStars(product.rating || 0)}
                            <span class="ml-2 text-text-muted text-xs">(${rating})</span>
                        </div>
                        <p class="text-text-muted text-sm truncate">${description}</p>
                        <p class="text-xl font-bold text-primary-blue mt-2">₱${price}</p>
                    </div>
                </div>
                <div class="p-4 pt-0">
                    <button class="add-to-cart-btn w-full px-4 py-2 bg-accent-orange text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2" data-id="${productId}">
                        <i class="fas fa-cart-plus"></i>
                        <span>Add to cart</span>
                    </button>
                </div>
            `;

    // Add listener to open the product detail modal on card click
    card.addEventListener('click', (event) => {
        // Only open the modal if the click target is NOT the Add to Cart or Wishlist button
        if (!event.target.closest('.add-to-cart-btn') && !event.target.closest('.toggle-wishlist')) {
            renderProductDetail(product);
        }
    });


    const addToCartButton = card.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', (event) => {
            event.stopPropagation();
            addToCart({
                id: productId,
                name: product.name,
                price: parseFloat(price),
                image: image
            });
        });
    }

    // This is the correct target for recommended products
    recommendedProductsGrid.appendChild(card);
}

/**
 * Loads a set of products from the cache and renders them to the recommended section.
 */
function loadRecommendedProducts() {
    // Clear the grid first, removing any 'Loading' messages or placeholders
    recommendedProductsGrid.innerHTML = '';

    if (ALL_PRODUCTS_CACHE.length === 0) {
        recommendedProductsGrid.innerHTML =
            '<p class="text-center text-text-muted col-span-full py-8">No products available for recommendation.</p>';
        return;
    }

    // FIX APPLIED: Changed slice(2, 8) to slice(0, 6) to ensure we always try to render the first 6
    // products from the shuffled list, regardless of the list size.
    const recommendedSet = ALL_PRODUCTS_CACHE.slice(0, 6);

    recommendedSet.forEach(product => {
        renderRecommendedCard(product); // Use the modified rendering function
    });

    // Ensure new wishlist listeners are attached to the recommended cards
    attachWishlistListeners();
}
// END MODIFIED CODE for Recommended Products


/**
 * Renders a single product card (for Featured Products section).
 * @param {Object} product - The product data object.
 */
function renderProductCard(product) {
    const card = document.createElement('div');
    card.className =
        'bg-light-bg rounded-xl shadow-lg overflow-hidden product-card hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between relative'; // Added relative for heart button positioning

    const price = parseFloat(product.price || 0).toFixed(2);
    const rating = parseFloat(product.rating || 0).toFixed(1);
    const description = product.description || 'No description provided.';
    const productId = product.id; // Get the product ID

    // Use the first image in the array if it exists, otherwise fall back to a single image or placeholder
    const image = (product.images && product.images[0]) || product.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';

    const currentWishlistIds = getWishlistIds();
    const isWishlisted = currentWishlistIds.includes(productId.toString());
    const heartClass = isWishlisted ? 'text-red-danger' : 'text-white/80 group-hover:text-red-danger';

    // NEW: Added Wishlist Button structure
    card.innerHTML = `
                <div class="relative group">
                    <img src="${image}" alt="${product.name}" class="w-full h-48 object-cover">
                    
                    <button class="absolute top-3 right-3 p-2 bg-black/30 hover:bg-white rounded-full shadow-md z-10 toggle-wishlist transition-colors duration-200" 
                            data-product-id="${productId}" 
                            aria-label="Add to Wishlist">
                        <i class="fas fa-heart ${heartClass} text-xl transition-colors duration-200"></i>
                    </button>
                    
                    <div class="p-4">
                        <h3 class="text-lg font-bold text-text-dark truncate">${product.name}</h3>
                        <div class="flex items-center text-amber-500 text-sm mb-1">
                            ${getRatingStars(product.rating || 0)}
                            <span class="ml-2 text-text-muted text-xs">(${rating})</span>
                        </div>
                        <p class="text-text-muted text-sm truncate">${description}</p>
                        <p class="text-xl font-bold text-primary-blue mt-2">₱${price}</p>
                    </div>
                </div>
                <div class="p-4 pt-0">
                    <button class="add-to-cart-btn w-full px-4 py-2 bg-accent-orange text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2" data-id="${productId}">
                        <i class="fas fa-cart-plus"></i>
                        <span>Add to cart</span>
                    </button>
                </div>
            `;

    // Add listener to open the product detail modal on card click
    card.addEventListener('click', (event) => {
        // Only open the modal if the click target is NOT the Add to Cart or Wishlist button
        if (!event.target.closest('.add-to-cart-btn') && !event.target.closest('.toggle-wishlist')) {
            renderProductDetail(product);
        }
    });


    const addToCartButton = card.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', (event) => {
            event.stopPropagation();
            addToCart({
                id: productId,
                name: product.name,
                price: parseFloat(price),
                image: image
            });
        });
    }

    featuredProductsGrid.appendChild(card);
}

// NEW: Attach listeners for the heart buttons
const attachWishlistListeners = () => {
    // Find all wishlist buttons in both featured and recommended sections
    document.querySelectorAll('.toggle-wishlist').forEach(button => {
        button.onclick = (e) => {
            e.stopPropagation(); // Prevent the card click from opening the modal
            const productId = button.dataset.productId;
            toggleWishlist(productId);
        };
    });
};

// ===================================
// PRODUCT FETCHING & CATEGORY LOGIC
// ===================================

const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
let unsubscribeProducts; // Variable to hold the unsubscribe function

const fetchProductsByCategory = (category) => {
    // 1. Unsubscribe from the previous listener if it exists
    if (unsubscribeProducts) {
        unsubscribeProducts();
    }

    // 2. Build the new query
    let productQuery;
    if (category === 'All') {
        productQuery = query(productsRef); // Query with no filter
    } else {
        // Query with a 'where' filter for the selected category
        productQuery = query(productsRef, where('category', '==', category));
    }

    // 3. Set up the new listener
    unsubscribeProducts = onSnapshot(productQuery, (querySnapshot) => {
        featuredProductsGrid.innerHTML = '';
        ALL_PRODUCTS_CACHE = []; // Clear and re-populate the cache
        CURRENT_PRODUCTS = []; // Clear the current products list

        if (querySnapshot.empty) {
            featuredProductsGrid.innerHTML =
                '<p class="text-center text-text-muted col-span-full py-12">No products found in this category.</p>';
            // If main products are empty, clear recommended too
            recommendedProductsGrid.innerHTML = '<p class="text-center text-text-muted col-span-full py-8">No products available for recommendation.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id;
            ALL_PRODUCTS_CACHE.push(product); // Add to cache
        });

        // ⭐ IMPLEMENT SHUFFLE HERE ⭐
        // Shuffle the entire cache array after it has been populated
        shuffleArray(ALL_PRODUCTS_CACHE);
        CURRENT_PRODUCTS = [...ALL_PRODUCTS_CACHE]; // Set current products to the full, shuffled list


        // 4. Render the shuffled products
        ALL_PRODUCTS_CACHE.forEach((product) => {
            renderProductCard(product);
        });


        // NEW: Attach listeners for the heart buttons after rendering all cards
        attachWishlistListeners();
        // Since products were just rendered, we must update the heart icons based on the loaded wishlistIds
        updateHeartIcons();


        // NEW: Load recommended products after populating the main cache
        loadRecommendedProducts();

    }, (error) => {
        console.error("Error fetching products:", error);
        featuredProductsGrid.innerHTML =
            '<p class="text-center text-red-danger col-span-full py-12">Failed to load products. Check console for details.</p>';
    });
};


const handleCategoryClick = (event) => {
    const button = event.currentTarget;
    const category = button.dataset.category;

    // 1. Update active button styling
    document.querySelectorAll('.category-button').forEach(btn => {
        btn.classList.remove('active', 'bg-primary-blue', 'text-white');
        btn.classList.add('bg-secondary-gray', 'text-text-dark');
    });
    button.classList.add('active', 'bg-primary-blue', 'text-white');
    button.classList.remove('bg-secondary-gray', 'text-text-dark');


    // 2. Fetch products for the new category
    fetchProductsByCategory(category);
};

// ===================================
// FEATURED PRODUCTS RENDERER (for search/filter results)
// ===================================

function renderFeaturedProducts(products) {
    featuredProductsGrid.innerHTML = '';
    if (products.length === 0) {
        featuredProductsGrid.innerHTML = '<p class="text-center text-text-muted col-span-full py-12">No products found matching your search term.</p>';
    } else {
        products.forEach((product) => {
            renderProductCard(product);
        });
    }
    // Re-attach listeners and sync icons after rendering
    attachWishlistListeners();
    updateHeartIcons();
}

// ===================================
// SEARCH LOGIC FUNCTION
// ===================================


function filterProductsBySearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (term === '') {
        // If the search term is empty, restore the full list for the current category
        CURRENT_PRODUCTS = [...ALL_PRODUCTS_CACHE];
    } else {
        // Filter products whose name, description, or property contains the search term
        CURRENT_PRODUCTS = ALL_PRODUCTS_CACHE.filter(product => {
            return (
                (product.name && product.name.toLowerCase().includes(term)) ||
                (product.description && product.description.toLowerCase().includes(term)) ||
                (product.property && product.property.toLowerCase().includes(term))
            );
        });
    }

    // Re-render the featured products grid with the filtered results
    renderFeaturedProducts(CURRENT_PRODUCTS);
}


// --- Main Event Listener for DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (Carousel, Profile dropdown, Cart drawer listeners remain the same)
    const slides = document.getElementById('carousel-slides');
    const indicators = document.querySelectorAll('.carousel-indicator');
    let currentIndex = 0;
    const totalSlides = slides ? slides.children.length : 0;

    if (slides && indicators.length > 0) {
        const updateCarousel = () => {
            const offset = -currentIndex * 100;
            slides.style.transform = `translateX(${offset}%)`;
            indicators.forEach((indicator, index) => {
                if (index === currentIndex) {
                    indicator.classList.add('active');
                    indicator.style.backgroundColor = '#FF6B1F';
                } else {
                    indicator.classList.remove('active');
                    indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                }
            });
        };
        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
        };
        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
        };
        // --- FIX APPLIED: Corrected function call for 'next-slide' button
        document.getElementById('next-slide').addEventListener('click', nextSlide);
        document.getElementById('prev-slide').addEventListener('click', prevSlide);
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
            });
        });
        setInterval(nextSlide, 5000);
        updateCarousel();
    }

    const profileButton = document.getElementById('profile-button');
    const profileMenu = document.getElementById('profile-menu');

    // --- Profile Dropdown Logic ---
    if (profileButton && profileMenu) {
        profileButton.addEventListener('click', (event) => {
            profileMenu.classList.toggle('open');
            event.stopPropagation();
            // Close wishlist popover if profile menu opens
            if (profileMenu.classList.contains('open')) {
                closeWishlistPopover();
            }
        });
        window.addEventListener('click', (event) => {
            if (!profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
                profileMenu.classList.remove('open');
            }
        });
    }


    // --- AUTH TOGGLE LISTENER (Fixed Sign Out) ---
    document.getElementById('auth-toggle-btn').addEventListener('click', async (event) => {
        event.preventDefault();

        if (CURRENT_USER_ID !== 'not-authenticated-user-placeholder') {
            try {
                await signOut(auth); // The actual Firebase sign out call
                window.location.href = 'login.html';
            } catch (error) {
                console.error("Error signing out:", error);
                showCustomAlert('Sign Out Failed', 'Could not sign out. Please check your connection.', 'error');
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- FILTER MENU EVENT LISTENERS ---
    menuButton.addEventListener('click', toggleFilterMenu);
    closeMenuBtn.addEventListener('click', toggleFilterMenu);
    cancelFiltersBtn.addEventListener('click', toggleFilterMenu);
    applyFiltersBtn.addEventListener('click', () => {
        showCustomAlert('Filters Applied', 'Filters have been applied! (Functionality not implemented yet)', 'success');
        toggleFilterMenu();
    });

    // --- CATEGORY BUTTONS EVENT LISTENERS (NEW) ---
    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', handleCategoryClick);
    });

    // ** NEW: SEARCH INPUT EVENT LISTENER **
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            filterProductsBySearch(event.target.value);
        });
    }

    // --- CART DRAWER EVENT LISTENERS ---
    document.getElementById('cart-button').addEventListener('click', toggleCartDrawer);
    document.getElementById('close-cart-btn').addEventListener('click', closeCartDrawer);

    // Updated backdrop to close either menu or cart
    backdrop.addEventListener('click', () => {
        if (cartDrawer.classList.contains('open')) {
            closeCartDrawer();
        } else if (filterMenu.classList.contains('open')) {
            toggleFilterMenu();
        }
    });

    selectAllCheckbox.addEventListener('change', (event) => {
        const checked = event.target.checked;
        cartItems.forEach(item => item.selected = checked);
        renderCart();
        saveCartToFirestore();
    });

    document.getElementById('checkout-button').addEventListener('click', openOrderReview);

    // --- PRODUCT DETAIL MODAL LISTENERS (NEW) ---
    attachDetailModalListeners();

    // --- WISHLIST POPOVER LISTENERS ---
    wishlistContainer.querySelector('#wishlist-button').addEventListener('click', toggleWishlistPopover);


    setLogLevel('debug');
    // --- INITIAL PRODUCT LOAD: Start by fetching all products ---
    // Ensure the 'All' button has the active state on load
    document.querySelector('.category-button[data-category="All"]').classList.add('active', 'bg-primary-blue', 'text-white');
    document.querySelector('.category-button[data-category="All"]').classList.remove('bg-secondary-gray', 'text-text-dark');

    fetchProductsByCategory('All');
});


function showCustomAlert(title, message, type = 'info') {
    let color = 'bg-primary-blue';
    if (type === 'success') color = 'bg-green-500';
    else if (type === 'error') color = 'bg-red-danger';

    const alertDiv = document.createElement('div');
    alertDiv.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
    alertDiv.innerHTML = `
            <div class=\"bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 overflow-hidden transform transition-all scale-100 duration-300\">
                <div class=\"${color} text-white p-4 text-xl font-bold\">${title}</div>
                <div class=\"p-6 text-text-dark\">
                    <p>${message}</p>
                </div>
                <div class=\"p-4 border-t flex justify-end\">
                    <button class=\"px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors\" onclick=\"this.closest('.fixed').remove()\">
                        OK
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(alertDiv);
}
window.showCustomAlert = showCustomAlert; // Expose the fixed function globally for external calls