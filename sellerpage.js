import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
    import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
    // NOTE: ADDED orderBy AND limit to the Firestore imports
    import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, setLogLevel, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
    
    // Firebase global variables provided by the environment
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


    // Your Firebase web app's configuration
    const firebaseConfig = {
      apiKey: "AIzaSyAqDLocdi1CDHDeD5Z_LOlVZOycI2tuJpk",
      authDomain: "digisoria-baa83.firebaseapp.com",
      projectId: "digisoria-baa83",
      storageBucket: "digisoria-baa83.firebasestorage.app",
      messagingSenderId: "1042609120554",
      appId: "1:1042609120554:web:0500a100e9ae42ead32a53",
      measurementId: "G-TM8CBPSRR9"
    };
    
    let db;
    let auth;
    let productsCollection; // Private user product collection
    let publicProductsCollection; // Public collection for index.html
    let usersCollection; 
    let purchasesCollection; 
    let userId;

    // Function to generate star rating HTML
    const getRatingStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += `<span class="text-accent-yellow">★</span>`; 
        }
        if (halfStar) {
            starsHtml += `<span class="text-accent-yellow">½</span>`;
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += `<span class="text-gray-300">★`;
        }
        return starsHtml;
    };

    const renderProducts = (products) => {
        const productList = document.getElementById('productList');
        const emptyMessage = document.getElementById('emptyMessage');
        // Ensure we use the correct loading ID for the products list
        const loadingIndicatorProducts = document.getElementById('loadingIndicatorProducts'); 
        if (loadingIndicatorProducts) loadingIndicatorProducts.classList.add('hidden');

        productList.innerHTML = '';
        if (products.length === 0) {
            emptyMessage.classList.remove('hidden');
        } else {
            emptyMessage.classList.add('hidden');
            products.forEach(product => {
                const thumbnailUrl = Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0] 
                    : product.image || 'https://via.placeholder.com/400x300/e2e8f0/64748b?text=No+Image';

                const productCard = document.createElement('div');
                productCard.classList.add('bg-card-bg', 'rounded-lg', 'shadow-md', 'p-4', 'flex', 'flex-col', 'items-center', 'text-center', 'border', 'border-gray-100');
                productCard.innerHTML = `
                    <img src="${thumbnailUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300/e2e8f0/64748b?text=No+Image'" class="w-full h-48 object-cover rounded-md mb-4 shadow-sm">
                    <h3 class="text-xl font-semibold mb-1 text-dark-text">${product.name}</h3>
                    <p class="text-xs text-gray-500 mb-1">${product.category || 'Uncategorized'}</p>
                    <div class="flex items-center text-sm mb-1">${getRatingStars(product.rating)}<span class="ml-1 text-gray-500 text-xs">(${parseFloat(product.rating).toFixed(1)})</span></div>
                    <p class="text-sm text-gray-600 mb-2 max-h-20 overflow-hidden text-ellipsis">${product.description || 'No description provided.'}</p>
                    <p class="text-dark-text font-bold text-lg mb-4">$${parseFloat(product.price).toFixed(2)}</p>
                    <div class="flex gap-2 mt-auto">
                        <button data-id="${product.id}" class="edit-btn px-4 py-2 bg-accent-yellow text-dark-text rounded-lg hover:bg-yellow-500 transition-colors duration-300 text-sm font-medium shadow-sm">Edit</button>
                        <button data-id="${product.id}" class="delete-btn px-4 py-2 bg-accent-red text-white rounded-lg hover:bg-red-600 transition-colors duration-300 text-sm font-medium shadow-sm">Delete</button>
                    </div>
                `;
                productList.appendChild(productCard);
            });
        }
    };
    
    // **NEW**: Function to render the list of recent buyers
    const renderRecentBuyers = (buyers) => {
        const container = document.getElementById('recentBuyersContainer');
        if (!container) return; 
        
        container.innerHTML = '';
        
        if (buyers.length === 0) {
            container.innerHTML = `
                <p class="text-center text-gray-500 my-4 text-sm">No recent purchases found.</p>
            `;
            return;
        }
        
        // Limit to the top 5 most recent buyers
        const buyerListHtml = buyers.slice(0, 5).map(buyer => `
            <div class="bg-white p-3 rounded-lg shadow-sm text-left border border-gray-100">
                <p class="font-medium text-sm text-dark-text">${buyer.buyerName || 'Anonymous Buyer'}</p>
                <p class="text-xs text-gray-500">Bought: ${buyer.productName || 'Unknown Product'}</p>
                <p class="text-xs text-gray-400">Date: ${buyer.purchaseDate || 'N/A'}</p>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="space-y-3">${buyerListHtml}</div>
            <p class="text-xs text-gray-500 mt-4 text-center">Showing ${Math.min(buyers.length, 5)} most recent purchases.</p>
        `;
    };

    // Helper to process the newline/comma-separated URLs into an array
    const processImageUrls = (urlsString) => {
        if (!urlsString) return [];
        return urlsString.split(/[\n,]/)
                            .map(url => url.trim())
                            .filter(url => url.length > 0);
    }

    // --- CRUD Operations ---
    
    // **IMPLEMENTED**: Add logic to save to both private and public collections
    const addProduct = async (product) => {
        try {
            // 1. Get a new document reference in the private collection to establish a unique ID
            const newProductRef = doc(productsCollection); 
            
            // 2. Save the product data to the private collection
            await setDoc(newProductRef, product);

            // 3. Save the product data to the public collection using the same ID
            const publicProductRef = doc(publicProductsCollection, newProductRef.id);
            await setDoc(publicProductRef, product);

            console.log("Product successfully added with ID: ", newProductRef.id);
        } catch (error) {
            console.error("Error adding product: ", error);
        }
    };

    // **IMPLEMENTED**: Update logic for both private and public collections
    const updateProduct = async (updatedProduct) => {
        const productId = updatedProduct.id;
        const productData = { ...updatedProduct };
        delete productData.id; // Don't save the ID field itself

        try {
            // 1. Update the private user collection
            const privateProductRef = doc(productsCollection, productId);
            await updateDoc(privateProductRef, productData);

            // 2. Update the public products collection
            const publicProductRef = doc(publicProductsCollection, productId);
            await updateDoc(publicProductRef, productData);
            
            console.log("Product successfully updated: ", productId);

        } catch (error) {
            console.error("Error updating product: ", error);
        }
    };

    // **CLEANUP/CONSISTENCY**: Ensure delete uses the scoped function if needed
    const deleteProduct = async (id) => {
        try {
            // 1. Delete from the private user collection
            const privateProductRef = doc(productsCollection, id);
            await deleteDoc(privateProductRef);

            // 2. Delete from the public products collection 
            const publicProductRef = doc(publicProductsCollection, id);
            await deleteDoc(publicProductRef);

            // Assuming closeDeleteModal is available in scope
            if (typeof closeDeleteModal !== 'undefined') {
                closeDeleteModal(); 
            }
            console.log("Product successfully deleted: ", id);
        } catch (error) {
            console.error("Error deleting product: ", error);
        }
    };
    // --- End CRUD Operations ---


    // Event Listeners and UI logic
    document.addEventListener('DOMContentLoaded', async () => {
        setLogLevel('debug'); 

        const productList = document.getElementById('productList');
        const addProductBtn = document.getElementById('addProductBtn');
        const productModal = document.getElementById('productModal');
        const productForm = document.getElementById('productForm');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalTitle = document.getElementById('modalTitle');
        const productIdInput = document.getElementById('productId');
        const productNameInput = document.getElementById('productName');
        const productPriceInput = document.getElementById('productPrice');
        const productDescriptionInput = document.getElementById('productDescription');
        const productRatingInput = document.getElementById('productRating');
        const productImagesInput = document.getElementById('productImages'); 
        const productCategoryInput = document.getElementById('productCategory'); 
        
        const deleteModal = document.getElementById('deleteModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const userIdDisplay = document.getElementById('userIdDisplay');
        // **NOTE**: Renamed 'loadingIndicator' to 'loadingIndicatorProducts' to be specific
        const loadingIndicatorProducts = document.getElementById('loadingIndicatorProducts'); 
        const recentBuyersContainer = document.getElementById('recentBuyersContainer'); // **NEW**

        let productToDelete = null;
        
        // Modal functions (Defined as const inside DOMContentLoaded to fix the 'already declared' error)
        const closeDeleteModal = () => {
            deleteModal.classList.remove('visible', 'opacity-100');
            deleteModal.classList.add('invisible', 'opacity-0');
            productToDelete = null;
        };
        
        const closeModal = () => {
            productModal.classList.remove('visible', 'opacity-100');
            productModal.classList.add('invisible', 'opacity-0');
        };

        const openModal = (product = null) => {
            if (product) {
                modalTitle.textContent = 'Edit Product';
                productIdInput.value = product.id;
                productNameInput.value = product.name;
                productPriceInput.value = product.price;
                productDescriptionInput.value = product.description;
                productRatingInput.value = product.rating;
                productCategoryInput.value = product.category || 'Electronics'; 
                const imagesString = Array.isArray(product.images) 
                                     ? product.images.join('\n') 
                                     : product.image || '';
                productImagesInput.value = imagesString;
            } else {
                modalTitle.textContent = 'Add New Product';
                productForm.reset();
                productIdInput.value = '';
                productRatingInput.value = 5;
                productImagesInput.value = '';
                productCategoryInput.value = 'Electronics'; 
            }
            productModal.classList.remove('invisible', 'opacity-0');
            productModal.classList.add('visible', 'opacity-100');
        };

        const openDeleteModal = (id) => {
            productToDelete = id;
            deleteModal.classList.remove('invisible', 'opacity-0');
            deleteModal.classList.add('visible', 'opacity-100');
        };

        // Initialize Firebase
        try {
            const app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            
            // Initialize collection references
            publicProductsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'products');
            // **NEW**: Initialize purchase and user collections
            purchasesCollection = collection(db, 'purchases'); 
            usersCollection = collection(db, 'users'); 
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
            return;
        }

        // Authentication
        onAuthStateChanged(auth, async (user) => {
            // Ensure the product loading indicator is hidden initially
            if (loadingIndicatorProducts) loadingIndicatorProducts.classList.add('hidden'); 
            
            // Initialize buyer loading message
            if (recentBuyersContainer) recentBuyersContainer.innerHTML = '<p class="text-center text-gray-500 my-8">Loading buyers...</p>';


            if (user) {
                userId = user.uid;
                userIdDisplay.textContent = `User ID: ${userId}`;

                // Set up private product collection listener
                productsCollection = collection(db, 'artifacts', appId, 'users', userId, 'products');
                onSnapshot(productsCollection, (snapshot) => {
                    const products = [];
                    snapshot.forEach(doc => {
                        products.push({ id: doc.id, ...doc.data() });
                    });
                    renderProducts(products);
                }, (error) => {
                    console.error("Error fetching product data from Firestore:", error);
                });
                
                // **MODIFIED**: Setup the efficient query for purchases/orders specific to the seller.
                // NOTE: This new query will trigger the SAME index error until the index is created.
                const sellerPurchasesQuery = query(
                    purchasesCollection, 
                    where('sellerId', '==', userId),
                    orderBy('timestamp', 'desc'), // Sort by date descending
                    limit(5)                      // Only fetch the 5 most recent
                ); 
                
                // **NEW**: Start real-time listener for the Purchases/Orders collection
                onSnapshot(sellerPurchasesQuery, async (snapshot) => {
                    const purchases = [];
                    
                    // 1. Fetch all buyer names in parallel
                    const buyerLookups = snapshot.docs.map(async (doc) => {
                        const data = doc.data();
                        const purchaseDate = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
                        
                        let buyerName = 'Anonymous Buyer';
                        if (data.buyerId) {
                            try {
                                // 2. Fetch the buyer's name from the 'users' collection using buyerId
                                const buyerDoc = await getDoc(doc(usersCollection, data.buyerId));
                                if (buyerDoc.exists()) {
                                    buyerName = buyerDoc.data().name || 'Unknown User Name';
                                }
                            } catch (e) {
                                console.error("Error fetching buyer name:", e);
                            }
                        }

                        purchases.push({ 
                            id: doc.id, 
                            ...data, 
                            buyerName: buyerName, // Add the resolved name
                            purchaseDate: purchaseDate 
                        });
                    });

                    // Wait for all lookups to finish
                    await Promise.all(buyerLookups);
                    
                    // The client-side sort is now REMOVED as the query sorts on the server
                    // purchases.sort((a, b) => {
                    //     if (!a.timestamp || !b.timestamp) return 0;
                    //     return b.timestamp.seconds - a.timestamp.seconds;
                    // });

                    // Render the recent buyers
                    renderRecentBuyers(purchases);
                }, (error) => {
                    console.error("Error fetching purchase data from Firestore:", error);
                    if (recentBuyersContainer) {
                        recentBuyersContainer.innerHTML = 
                            '<p class="text-center text-accent-red my-4 text-sm">Failed to load buyer data. Check Firebase Console for index error.</p>';
                    }
                });

            } else {
                console.log("No user signed in. Signing in...");
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Authentication failed: ", error);
                    userIdDisplay.textContent = "Authentication failed.";
                }
            }
        });


        // Event Listeners (rest of event listeners remain the same)
        addProductBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', closeModal);
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeModal();
            }
        });

        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const imageURLs = processImageUrls(productImagesInput.value); 
            
            const product = {
                name: productNameInput.value,
                price: parseFloat(productPriceInput.value),
                description: productDescriptionInput.value,
                rating: parseFloat(productRatingInput.value),
                category: productCategoryInput.value, 
                images: imageURLs,
                image: imageURLs.length > 0 ? imageURLs[0] : ''
            };

            if (productIdInput.value) {
                updateProduct({ id: productIdInput.value, ...product });
            } else {
                addProduct(product);
            }
            closeModal();
        });

        productList.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.dataset.id;
                const productRef = doc(productsCollection, id);
                getDoc(productRef).then(docSnap => {
                    if (docSnap.exists()) {
                        openModal({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        console.error("No such document!");
                    }
                }).catch(error => {
                    console.error("Error getting document:", error);
                });
            }
            if (e.target.classList.contains('delete-btn')) {
                const id = e.target.dataset.id;
                openDeleteModal(id);
            }
        });
        
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        confirmDeleteBtn.addEventListener('click', () => deleteProduct(productToDelete));
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    });