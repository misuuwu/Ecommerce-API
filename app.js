
    // Mock Product Data
    const products = [
        { id: 1, name: "Wireless Headphones", price: 199.99, description: "Experience crystal clear audio with these noise-cancelling wireless headphones. Features include a comfortable over-ear design and 24-hour battery life. Perfect for music lovers on the go.", image: "https://placehold.co/400x400/FF5733/FFFFFF?text=Headphones", rating: 4.5, category: "Electronics" },
        { id: 2, name: "Smart Watch", price: 249.50, description: "Stay connected and track your fitness with this sleek smartwatch. It features a heart rate monitor, step counter, and notifications for calls and messages. Compatible with both iOS and Android devices.", image: "https://placehold.co/400x400/33FF57/FFFFFF?text=Watch", rating: 4.2, category: "Electronics" },
        { id: 3, name: "Espresso Machine", price: 549.00, description: "Brew barista-quality coffee at home with this compact espresso machine. It has a built-in milk frother and a programmable brewing system. Start your day with the perfect cup.", image: "https://placehold.co/400x400/3357FF/FFFFFF?text=Coffee", rating: 4.8, category: "Appliances" },
        { id: 4, name: "Gaming Mouse", price: 75.00, description: "Gain a competitive edge with this high-precision gaming mouse. It features customizable RGB lighting, programmable buttons, and an ergonomic design for long gaming sessions.", image: "https://placehold.co/400x400/F333FF/FFFFFF?text=Mouse", rating: 4.1, category: "Electronics" },
        { id: 5, name: "Portable Blender", price: 45.00, description: "Make smoothies and shakes on the go with this portable USB-rechargeable blender. Its compact size makes it perfect for the gym, office, or travel.", image: "https://placehold.co/400x400/FFFF33/000000?text=Blender", rating: 3.9, category: "Appliances" },
        { id: 6, name: "Hiking Backpack", price: 120.00, description: "A durable and spacious backpack for all your outdoor adventures. It features multiple compartments, padded shoulder straps, and a waterproof exterior.", image: "https://placehold.co/400x400/33FFBD/000000?text=Backpack", rating: 4.6, category: "Outdoor" },
        { id: 7, name: "Leather Wallet", price: 60.00, description: "A classic bifold wallet made from genuine leather. It has multiple card slots and a dedicated cash compartment, offering style and functionality.", image: "https://placehold.co/400x400/999999/FFFFFF?text=Wallet", rating: 4.3, category: "Accessories" },
        { id: 8, name: "Noise Cancelling Earbuds", price: 150.00, description: "Compact earbuds with powerful sound and active noise cancellation. Perfect for commuting and focusing on your work.", image: "https://placehold.co/400x400/5533FF/FFFFFF?text=Earbuds", rating: 4.4, category: "Electronics" },
        { id: 9, name: "Smart Thermostat", price: 180.00, description: "Control your home's temperature from anywhere with this smart thermostat. It learns your schedule to save energy and can be controlled via a mobile app.", image: "https://placehold.co/400x400/FF33A1/FFFFFF?text=Thermostat", rating: 4.7, category: "Smart+Home" },
        { id: 10, name: "Robot Vacuum Cleaner", price: 300.00, description: "A smart robot vacuum that automatically cleans your floors. It can be scheduled, controlled via an app, and features sensors to avoid obstacles.", image: "https://placehold.co/400x400/33A1FF/FFFFFF?text=Vacuum", rating: 4.5, category: "Smart+Home" },
        { id: 11, name: "Digital Camera", price: 700.00, description: "Capture stunning photos and videos with this high-resolution digital camera. It's great for both beginners and experienced photographers.", image: "https://placehold.co/400x400/A1FF33/000000?text=Camera", rating: 4.9, category: "Electronics" },
        { id: 12, name: "Yoga Mat", price: 35.00, description: "A non-slip yoga mat made from eco-friendly materials. It provides excellent grip and cushioning for your practice.", image: "https://placehold.co/400x400/FF9B33/FFFFFF?text=Yoga+Mat", rating: 4.0, category: "Fitness" },
        { id: 13, name: "Dumbbell Set", price: 90.00, description: "A set of adjustable dumbbells for a full-body workout at home. The weights can be easily changed to suit your needs.", image: "https://placehold.co/400x400/33FF9B/FFFFFF?text=Dumbbells", rating: 4.5, category: "Fitness" },
        { id: 14, name: "Instant Pot", price: 110.00, description: "A versatile kitchen appliance that combines 7-in-1 functions: pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer.", image: "https://placehold.co/400x400/C033FF/FFFFFF?text=Instant+Pot", rating: 4.6, category: "Appliances" }
    ];

    const categories = ["All", "Electronics", "Appliances", "Outdoor", "Accessories", "Smart Home", "Fitness"];
    const wishlist = new Set();

    // Cart State
    let cart = [];

    // Utility Functions
    const getProductById = (id) => products.find(p => p.id === id);

    const getStarRating = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    };

    const showMessage = (text) => {
        const messageBox = document.getElementById('message-box');
        messageBox.textContent = text;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('opacity-100');
            messageBox.classList.remove('opacity-0');
        }, 10);
        setTimeout(() => {
            messageBox.classList.remove('opacity-100');
            messageBox.classList.add('opacity-0');
            setTimeout(() => messageBox.classList.add('hidden'), 300);
        }, 2000);
    };

    // Rendering Functions
    const renderProducts = (productsToRender, containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear previous content
        productsToRender.forEach(product => {
            const isWishlisted = wishlist.has(product.id);
            const heartIconClass = isWishlisted ? 'fas fa-heart' : 'far fa-heart';
            const heartColorClass = isWishlisted ? 'text-red-500' : 'text-gray-500';

            const productCard = document.createElement('div');
            productCard.classList.add('bg-white', 'rounded-2xl', 'shadow-md', 'p-4', 'hover:shadow-xl', 'transition-shadow', 'duration-300', 'flex', 'flex-col', 'text-center', 'relative');
            productCard.dataset.productId = product.id;
            productCard.innerHTML = `
                <button class="wishlist-btn absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors duration-200" data-product-id="${product.id}">
                    <i class="fa-heart text-xl ${isWishlisted ? 'fas' : 'far'}"></i>
                </button>
                <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-cover rounded-xl mb-4 cursor-pointer">
                <div class="flex-grow flex flex-col justify-between">
                    <div>
                        <h3 class="text-lg font-semibold mb-1 cursor-pointer">${product.name}</h3>
                        <p class="text-sm text-gray-500 mb-2">${product.category}</p>
                        <p class="text-lg font-bold text-orange-600 mb-2">$${product.price.toFixed(2)}</p>
                        <div class="flex items-center justify-center text-yellow-400 mb-2">
                            ${getStarRating(product.rating)}
                        </div>
                    </div>
                    <button class="add-to-cart-btn mt-auto bg-blue-900 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-800 transition-colors duration-200" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart mr-2"></i>Add to Cart
                    </button>
                </div>
            `;
            container.appendChild(productCard);
        });
    };

    const renderCategories = () => {
        const container = document.getElementById('category-container');
        const sidebarContainer = document.getElementById('sidebar-category-list');
        container.innerHTML = '';
        sidebarContainer.innerHTML = '<h4 class="text-lg font-bold text-gray-700 mb-4">Categories</h4>';

        categories.forEach(category => {
            // Main category button
            const categoryButton = document.createElement('button');
            categoryButton.textContent = category.replace(/\+/g, ' ');
            categoryButton.classList.add('category-filter', 'bg-white', 'text-gray-700', 'font-medium', 'py-2', 'px-4', 'rounded-full', 'shadow-sm', 'hover:bg-gray-200', 'transition-colors', 'duration-200');
            categoryButton.dataset.category = category;
            container.appendChild(categoryButton);

            // Sidebar category checkbox
            const sidebarCategoryItem = document.createElement('div');
            sidebarCategoryItem.classList.add('flex', 'items-center', 'space-x-2');
            sidebarCategoryItem.innerHTML = `
                <input type="checkbox" id="filter-${category}" class="filter-checkbox rounded text-orange-500 focus:ring-orange-500" data-category="${category}">
                <label for="filter-${category}" class="text-gray-700 text-sm">${category.replace(/\+/g, ' ')}</label>
            `;
            sidebarContainer.appendChild(sidebarCategoryItem);
        });
    };

    const updateCart = () => {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        const cartCountElement = document.getElementById('cart-item-count');
        
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let itemCount = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="text-center text-gray-500 py-12">Your cart is empty.</div>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                itemCount += item.quantity;

                const cartItem = document.createElement('div');
                cartItem.classList.add('flex', 'items-center', 'space-x-4', 'p-4', 'bg-gray-50', 'rounded-lg', 'shadow-sm');
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md flex-shrink-0">
                    <div class="flex-grow">
                        <h4 class="font-semibold text-gray-800">${item.name}</h4>
                        <p class="text-sm text-gray-500">$${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-gray-900">$${itemTotal.toFixed(2)}</span>
                        <button class="remove-from-cart-btn ml-2 text-gray-400 hover:text-red-500 transition-colors duration-200" data-product-id="${item.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        }
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
        cartCountElement.textContent = itemCount;
        cartCountElement.classList.add('bouncing');
        setTimeout(() => cartCountElement.classList.remove('bouncing'), 600);
    };

    const showProductModal = (product) => {
        const modal = document.getElementById('product-modal');
        document.getElementById('modal-image').src = product.image;
        document.getElementById('modal-image').alt = product.name;
        document.getElementById('modal-name').textContent = product.name;
        document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('modal-ratings').innerHTML = getStarRating(product.rating);
        document.getElementById('modal-add-to-cart').dataset.productId = product.id;
        document.getElementById('modal-buy-now').dataset.productId = product.id;
        
        // Update modal wishlist button based on state
        const modalWishlistBtn = document.getElementById('modal-wishlist-btn');
        modalWishlistBtn.dataset.productId = product.id;
        const modalHeartIcon = modalWishlistBtn.querySelector('i');
        if (wishlist.has(product.id)) {
            modalHeartIcon.classList.remove('far');
            modalHeartIcon.classList.add('fas');
            modalHeartIcon.classList.add('text-red-500');
        } else {
            modalHeartIcon.classList.remove('fas', 'text-red-500');
            modalHeartIcon.classList.add('far');
        }

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('opacity-100');
            document.querySelector('#product-modal > div').classList.add('scale-100');
            document.querySelector('#product-modal > div').classList.remove('scale-95');
        }, 10);
    };

    const hideProductModal = () => {
        const modal = document.getElementById('product-modal');
        modal.classList.remove('opacity-100');
        document.querySelector('#product-modal > div').classList.add('scale-95');
        document.querySelector('#product-modal > div').classList.remove('scale-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            showMessage("Your cart is empty. Add items to checkout.");
            return;
        }

        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        showMessage(`Checkout successful! Total: $${totalAmount.toFixed(2)}`);
        
        // Clear the cart
        cart = [];
        updateCart();
        
        // Optionally close the cart sidebar
        document.getElementById('cart-sidebar').classList.remove('open');
    };

    const toggleWishlist = (productId) => {
        const isWishlisted = wishlist.has(productId);
        const product = getProductById(productId);
        if (isWishlisted) {
            wishlist.delete(productId);
            showMessage(`Item removed from wishlist!`);
        } else {
            wishlist.add(productId);
            showMessage(`Item added to wishlist!`);
        }
        // Update all heart icons for this product
        document.querySelectorAll(`.wishlist-btn[data-product-id="${productId}"] i, #modal-wishlist-btn[data-product-id="${productId}"] i`).forEach(icon => {
            icon.classList.toggle('fas', !isWishlisted);
            icon.classList.toggle('far', isWishlisted);
            icon.classList.toggle('text-red-500', !isWishlisted);
            icon.classList.toggle('text-gray-500', isWishlisted);
        });
    };

    const setupListeners = () => {
        // Product card click listener for modal
        document.getElementById('featured-products-grid').addEventListener('click', (e) => {
            const card = e.target.closest('div[data-product-id]');
            if (card && !e.target.closest('.add-to-cart-btn') && !e.target.closest('.wishlist-btn')) {
                const productId = parseInt(card.dataset.productId);
                const product = getProductById(productId);
                if (product) {
                    showProductModal(product);
                }
            }
        });

        document.getElementById('recommended-products-grid').addEventListener('click', (e) => {
            const card = e.target.closest('div[data-product-id]');
            if (card && !e.target.closest('.add-to-cart-btn') && !e.target.closest('.wishlist-btn')) {
                const productId = parseInt(card.dataset.productId);
                const product = getProductById(productId);
                if (product) {
                    showProductModal(product);
                }
            }
        });

        // Close modal button
        document.getElementById('close-modal').addEventListener('click', hideProductModal);

        // Hamburger menu toggle
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const closeMenu = document.getElementById('close-menu');
        const menuSidebar = document.getElementById('menu-sidebar');

        hamburgerMenu.addEventListener('click', () => {
            menuSidebar.classList.add('open');
        });

        closeMenu.addEventListener('click', () => {
            menuSidebar.classList.remove('open');
        });

        // Cart sidebar toggle
        const cartIcon = document.getElementById('cart-icon');
        const closeCart = document.getElementById('close-cart');
        const cartSidebar = document.getElementById('cart-sidebar');

        cartIcon.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            updateCart();
        });

        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
        });

        // Add to cart button listeners
        document.getElementById('featured-products-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart-btn');
            if (btn) {
                const productId = parseInt(btn.dataset.productId);
                addToCart(productId, e);
            }
        });

        document.getElementById('recommended-products-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart-btn');
            if (btn) {
                const productId = parseInt(btn.dataset.productId);
                addToCart(productId, e);
            }
        });

        document.getElementById('modal-add-to-cart').addEventListener('click', (e) => {
            const btn = e.target;
            const productId = parseInt(btn.dataset.productId);
            addToCart(productId, e);
            hideProductModal();
        });
        
        document.getElementById('modal-buy-now').addEventListener('click', (e) => {
            const btn = e.target;
            const productId = parseInt(btn.dataset.productId);
            addToCart(productId, e);
            hideProductModal();
            handleCheckout();
        });

        // Wishlist button listeners
        document.getElementById('featured-products-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.wishlist-btn');
            if (btn) {
                const productId = parseInt(btn.dataset.productId);
                toggleWishlist(productId);
            }
        });

        document.getElementById('recommended-products-grid').addEventListener('click', (e) => {
            const btn = e.target.closest('.wishlist-btn');
            if (btn) {
                const productId = parseInt(btn.dataset.productId);
                toggleWishlist(productId);
            }
        });

        document.getElementById('modal-wishlist-btn').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            const productId = parseInt(btn.dataset.productId);
            toggleWishlist(productId);
        });

        // Remove from cart listener
        document.getElementById('cart-items').addEventListener('click', (e) => {
            const btn = e.target.closest('.remove-from-cart-btn');
            if (btn) {
                const productId = parseInt(btn.dataset.productId);
                removeFromCart(productId);
            }
        });

        // Profile dropdown toggle
        const profileIcon = document.getElementById('profile-icon');
        const profileDropdown = document.getElementById('profile-dropdown-menu');

        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
            if (!profileDropdown.classList.contains('hidden')) {
                setTimeout(() => {
                    profileDropdown.classList.add('scale-100', 'opacity-100');
                    profileDropdown.classList.remove('scale-95', 'opacity-0');
                }, 10);
            } else {
                profileDropdown.classList.remove('scale-100', 'opacity-100');
                profileDropdown.classList.add('scale-95', 'opacity-0');
                setTimeout(() => profileDropdown.classList.add('hidden'), 300);
            }
        });
        document.addEventListener('click', (e) => {
            if (!profileDropdown.classList.contains('hidden') && !profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
                profileDropdown.classList.remove('scale-100', 'opacity-100');
                profileDropdown.classList.add('scale-95', 'opacity-0');
                setTimeout(() => profileDropdown.classList.add('hidden'), 300);
            }
        });

        // Category filter listeners
        document.querySelectorAll('.category-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                filterProducts(category);
            });
        });

        // Checkout button listener
        document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
    };

    const addToCart = (productId, event) => {
        const product = getProductById(productId);
        if (!product) return;
        
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        // Flying animation logic
        const cartIcon = document.getElementById('cart-icon');
        const cartRect = cartIcon.getBoundingClientRect();
        
        let targetElement = event.target;
        // Find the image for the animation. If the click target is the button icon or text, find the parent card's image.
        if (targetElement.tagName.toLowerCase() !== 'img') {
            const productCard = event.target.closest('div[data-product-id]');
            if (productCard) {
                targetElement = productCard.querySelector('img');
            } else if (event.target.closest('#modal-add-to-cart') || event.target.closest('#modal-buy-now')) {
                targetElement = document.getElementById('modal-image');
            }
        }

        if (!targetElement) {
            showMessage('Item added to cart!');
            updateCart();
            return;
        }

        const productRect = targetElement.getBoundingClientRect();

        const flyingImg = document.createElement('img');
        flyingImg.src = product.image;
        flyingImg.classList.add('flying-animation');
        
        Object.assign(flyingImg.style, {
            top: `${productRect.top}px`,
            left: `${productRect.left}px`,
            width: `${productRect.width}px`,
            height: `${productRect.height}px`,
            opacity: '1',
            transform: 'scale(1)',
        });
        
        document.body.appendChild(flyingImg);
        
        setTimeout(() => {
            Object.assign(flyingImg.style, {
                top: `${cartRect.top + cartRect.height / 2 - 20}px`,
                left: `${cartRect.left + cartRect.width / 2 - 20}px`,
                width: '40px',
                height: '40px',
                opacity: '0.5',
                transform: 'scale(0.25)',
            });
        }, 10);
        
        flyingImg.addEventListener('transitionend', () => {
            if (flyingImg.parentNode) {
                flyingImg.parentNode.removeChild(flyingImg);
            }
            showMessage('Item added to cart!');
            updateCart();
        });
    };

    const removeFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        updateCart();
    };

    const filterProducts = (category) => {
        const featuredProductsContainer = document.getElementById('featured-products-grid');
        const recommendedProductsContainer = document.getElementById('recommended-products-grid');
        
        const filteredProducts = category === 'All' ? products : products.filter(p => p.category.replace(' ', '+') === category.replace(' ', '+'));

        // For simplicity, just render a subset to each section
        const featured = filteredProducts.slice(0, 5);
        const recommended = filteredProducts.slice(5, 10);

        renderProducts(featured, 'featured-products-grid');
        renderProducts(recommended, 'recommended-products-grid');
    };

    // Carousel Logic
    let currentSlide = 0;
    const slides = document.getElementById('carousel-slides');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const totalSlides = slides.children.length;

    const updateCarousel = () => {
        const offset = -currentSlide * 100;
        slides.style.transform = `translateX(${offset}%)`;
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    };

    document.getElementById('next-slide').addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    });

    document.getElementById('prev-slide').addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    });

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });


    // Initial render on page load
    window.onload = () => {
        renderCategories();
        // Render a subset of products for the initial view
        renderProducts(products.slice(0, 5), 'featured-products-grid');
        renderProducts(products.slice(5, 10), 'recommended-products-grid');
        updateCarousel();
        setupListeners();
    };
