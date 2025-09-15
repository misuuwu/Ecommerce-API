

        document.addEventListener('DOMContentLoaded', () => {
            const cartButton = document.getElementById('cart-button');
            const cartSidebar = document.getElementById('cart-sidebar');
            const closeCartBtn = document.getElementById('close-cart-btn');
            const backdrop = document.getElementById('backdrop');
            const productGrid = document.getElementById('product-grid');
            const recommendedGrid = document.getElementById('recommended-grid');
            const cartItemsContainer = document.getElementById('cart-items');
            const cartTotalElement = document.getElementById('cart-total');
            const cartCountElement = document.getElementById('cart-count');
            const checkoutBtn = document.getElementById('checkout-btn');
            const messageBox = document.getElementById('message-box');
            const closeMessageBtn = document.getElementById('close-message-btn');
            const productDetailModal = document.getElementById('product-detail-modal');
            const closeProductDetailBtn = document.getElementById('close-product-detail-btn');
            const detailName = document.getElementById('detail-name');
            const detailPrice = document = document.getElementById('detail-price');
            const detailRating = document.getElementById('detail-rating');
            const detailDescription = document.getElementById('detail-description');
            const detailImg = document.getElementById('detail-img');
            const detailAddToCartBtn = document.getElementById('detail-add-to-cart-btn');
            const categoriesList = document.getElementById('categories-list');

            let cart = [];

            const allProducts = [
                { name: "Stylish Sneakers", price: 89.99, description: "Step out in style and comfort with these modern sneakers. Designed for both performance and everyday wear, they feature breathable materials and a cushioned sole.", rating: 4.5, category: "Fashion" },
                { name: "Classic Leather Watch", price: 199.50, description: "An elegant timepiece with a genuine leather strap and a scratch-resistant face. Perfect for formal occasions or daily use.", rating: 4.8, category: "Fashion" },
                { name: "Noise-Cancelling Headphones", price: 120.00, description: "Immerse yourself in pure sound. These headphones offer superior noise cancellation, a comfortable fit, and long-lasting battery life.", rating: 4.2, category: "Electronics" },
                { name: "Vintage Camera", price: 450.00, description: "Capture life's moments with a touch of nostalgia. This classic camera is fully functional and a great piece for collectors and photographers alike.", rating: 4.9, category: "Electronics" },
                { name: "Ergonomic Desk Chair", price: 250.00, description: "Enhance your workspace with this comfortable and supportive desk chair. Adjustable features ensure proper posture during long hours.", rating: 4.7, category: "Home" },
                { name: "Smart Coffee Maker", price: 75.00, description: "Brew the perfect cup every time with this smart coffee maker. Features programmable settings and a sleek, compact design.", rating: 4.6, category: "Home" },
                { name: "Portable Bluetooth Speaker", price: 55.00, description: "Take your music anywhere with this powerful and portable speaker. Waterproof design and a 12-hour battery life make it perfect for outdoor adventures.", rating: 4.4, category: "Electronics" },
                { name: "Artisanal Coffee Beans", price: 18.99, description: "A unique blend of ethically sourced beans, hand-roasted to perfection. Notes of caramel and chocolate provide a rich, smooth flavor.", rating: 5.0, category: "Groceries" },
                { name: "Wireless Keyboard", price: 49.99, description: "A minimalist wireless keyboard with quiet, responsive keys. Perfect for both office work and casual use.", rating: 4.1, category: "Electronics" },
                { name: "High-Performance Blender", price: 95.00, description: "Effortlessly blend smoothies, soups, and more with this powerful blender. Stainless steel blades and multiple speed settings.", rating: 4.7, category: "Home" },
                { name: "Gaming Mouse", price: 65.50, description: "Gain a competitive edge with this ergonomic gaming mouse. Features customizable buttons and a high-precision sensor for ultimate control.", rating: 4.8, category: "Electronics" },
                { name: "Portable Monitor", price: 210.00, description: "Expand your view on the go with this lightweight and ultra-slim portable monitor. Connects easily to laptops and smartphones via USB-C.", rating: 4.3, category: "Electronics" },
                { name: "Stainless Steel Water Bottle", price: 25.00, description: "Stay hydrated with this durable water bottle. Double-wall insulation keeps drinks hot or cold for hours.", rating: 4.9, category: "Lifestyle" },
                { name: "Yoga Mat", price: 35.00, description: "Achieve the perfect pose with this non-slip, eco-friendly yoga mat. Provides excellent cushioning and support for all your stretches.", rating: 4.6, category: "Lifestyle" },
                { name: "LED Desk Lamp", price: 45.00, description: "Illuminate your workspace with this modern LED lamp. Adjustable brightness and color temperature to suit your needs.", rating: 4.5, category: "Home" },
                { name: "External Hard Drive", price: 80.00, description: "Store your important files and backups with this reliable external hard drive. Large capacity and fast data transfer speeds.", rating: 4.7, category: "Electronics" },
                { name: "Mechanical Keyboard", price: 120.00, description: "Experience superior typing with a tactile and satisfying click. Features durable mechanical switches and customizable backlighting.", rating: 4.9, category: "Electronics" },
                { name: "Digital Drawing Tablet", price: 180.00, description: "Unleash your creativity with this high-resolution drawing tablet. Comes with a pressure-sensitive stylus for precision and control.", rating: 4.5, category: "Electronics" },
                { name: "Leather Messenger Bag", price: 99.00, description: "A stylish and functional messenger bag made from premium leather. Multiple compartments for a laptop, documents, and other essentials.", rating: 4.8, category: "Fashion" },
                { name: "Electric Toothbrush", price: 70.00, description: "Achieve a professional clean at home. This electric toothbrush uses sonic vibrations to remove plaque and improve gum health.", rating: 4.6, category: "Beauty" },
                { name: "Espresso Machine", price: 350.00, description: "Become your own barista with this compact espresso machine. Brews rich, flavorful espresso with a single touch.", rating: 4.7, category: "Home" },
                { name: "Smart Scale", price: 50.00, description: "Track your health and fitness with this smart scale. Syncs with your phone to provide detailed metrics and progress tracking.", rating: 4.2, category: "Electronics" },
                { name: "Foldable Drone", price: 290.00, description: "Capture stunning aerial footage with this lightweight and foldable drone. Easy to fly and equipped with a high-definition camera.", rating: 4.5, category: "Electronics" },
                { name: "Handcrafted Mug", price: 15.00, description: "Enjoy your morning coffee in this unique, handcrafted ceramic mug. Each piece is one-of-a-kind and holds a generous serving.", rating: 4.9, category: "Home" },
                { name: "Air Purifier", price: 130.00, description: "Breathe cleaner air with this powerful air purifier. Removes dust, pollen, and allergens from your home for a healthier environment.", rating: 4.4, category: "Home" },
                { name: "Portable Power Bank", price: 30.00, description: "Never run out of battery again. This compact power bank provides fast charging and can power multiple devices on a single charge.", rating: 4.8, category: "Electronics" },
                { name: "Reusable Shopping Bags (Set of 3)", price: 12.00, description: "Reduce your environmental impact with these durable, reusable shopping bags. Folds up neatly for easy storage.", rating: 4.6, category: "Groceries" },
                { name: "Acoustic Guitar", price: 200.00, description: "Start your musical journey with this beautiful acoustic guitar. Delivers a rich, warm tone and is perfect for beginners and experienced players alike.", rating: 4.9, category: "Lifestyle" },
                { name: "Microfiber Towels (Set of 6)", price: 22.00, description: "Highly absorbent and quick-drying microfiber towels. Ideal for kitchen, bathroom, or gym use.", rating: 4.5, category: "Home" },
                { name: "Car Vacuum Cleaner", price: 40.00, description: "Keep your car spotless with this compact and powerful vacuum. Plugs into your car's power outlet for easy, on-the-go cleaning.", rating: 4.3, category: "Automotive" },
                { name: "Waterproof Phone Case", price: 29.99, description: "Protect your phone from water and dust with this durable case. Perfect for beach trips, hiking, and everyday use.", rating: 4.7, category: "Lifestyle" },
                { name: "Gourmet Hot Sauce Set", price: 34.00, description: "A fiery collection of small-batch hot sauces. Features unique flavors and varying heat levels.", rating: 4.9, category: "Groceries" },
                { name: "Hair Dryer with Diffuser", price: 65.00, description: "Style your hair like a pro with this powerful hair dryer. Includes a diffuser attachment for creating natural curls and waves.", rating: 4.4, category: "Beauty" },
                { name: "Car Air Freshener", price: 8.00, description: "Keep your car smelling fresh with this long-lasting air freshener. Available in a variety of scents.", rating: 4.0, category: "Automotive" },
                { name: "Travel Backpack", price: 79.00, description: "A versatile backpack for all your adventures. Features multiple compartments, a padded laptop sleeve, and a comfortable design.", rating: 4.8, category: "Fashion" },
                { name: "Camping Tent", price: 120.00, description: "A durable and lightweight tent for your next outdoor adventure. Easy to set up and provides great protection from the elements.", rating: 4.6, category: "Outdoor" },
                { name: "Sleeping Bag", price: 85.00, description: "Stay warm on cold nights with this cozy sleeping bag. Packs down small for easy transport.", rating: 4.7, category: "Outdoor" },
                { name: "Hiking Boots", price: 95.00, description: "Sturdy and comfortable boots designed for long treks. Provides excellent ankle support and grip on various terrains.", rating: 4.8, category: "Outdoor" },
                { name: "Headlamp", price: 25.00, description: "A powerful and adjustable headlamp, essential for nighttime activities. Features multiple brightness settings and a long-lasting battery.", rating: 4.5, category: "Outdoor" },
                { name: "BBQ Grill Set", price: 50.00, description: "Everything you need for a perfect cookout. This set includes a spatula, tongs, and fork, all made from stainless steel.", rating: 4.9, category: "Home" },
                { name: "Gardening Tool Set", price: 30.00, description: "A complete set of essential gardening tools. Perfect for planting, weeding, and maintaining your garden.", rating: 4.3, category: "Home" },
                { name: "Dog Leash", price: 18.00, description: "A durable and comfortable leash for your furry friend. Features a strong clip and padded handle.", rating: 4.6, category: "Pets" },
                { name: "Cat Tree", price: 75.00, description: "Give your cat a place to climb, scratch, and relax. Features multiple levels and a scratching post.", rating: 4.7, category: "Pets" },
                { name: "Art Easel", price: 60.00, description: "A sturdy wooden easel for artists of all ages. Adjustable to different heights and angles.", rating: 4.5, category: "Arts & Crafts" },
                { name: "Watercolor Paint Set", price: 22.00, description: "A high-quality set of vibrant watercolor paints. Perfect for creating beautiful and expressive art.", rating: 4.8, category: "Arts & Crafts" },
                { name: "Sewing Machine", price: 150.00, description: "A user-friendly sewing machine for beginners and hobbyists. Great for mending clothes or starting new projects.", rating: 4.4, category: "Arts & Crafts" },
                { name: "Resistance Bands (Set of 5)", price: 28.00, description: "A versatile set of bands with different resistance levels. Ideal for strength training, physical therapy, and stretching.", rating: 4.7, category: "Fitness" },
                { name: "Jump Rope", price: 15.00, description: "A simple yet effective tool for cardio. Features comfortable handles and an adjustable length.", rating: 4.6, category: "Fitness" },
                { name: "Dumbbell Set", price: 120.00, description: "A comprehensive set of weights for a full-body workout. Includes a rack for easy storage.", rating: 4.9, category: "Fitness" },
                { name: "Protein Powder", price: 40.00, description: "A delicious and effective protein supplement to support muscle growth and recovery. Available in multiple flavors.", rating: 4.5, category: "Supplements" },
                { name: "Vitamin C Gummies", price: 20.00, description: "Boost your immune system with these tasty and easy-to-take gummies. A great way to get your daily dose of Vitamin C.", rating: 4.7, category: "Supplements" },
                { name: "Face Moisturizer", price: 35.00, description: "A lightweight and hydrating moisturizer for all skin types. Leaves your skin feeling soft and smooth.", rating: 4.8, category: "Beauty" },
                { name: "Hair Mask", price: 25.00, description: "Restore and repair damaged hair with this nourishing hair mask. Leaves hair silky, shiny, and healthy.", rating: 4.6, category: "Beauty" },
                { name: "Lip Balm Set (Set of 4)", price: 10.00, description: "Keep your lips hydrated and soft with this set of assorted lip balms. Each one has a unique, pleasant scent.", rating: 4.5, category: "Beauty" },
                { name: "Scented Candle", price: 20.00, description: "A beautifully scented candle to create a relaxing atmosphere. Made from natural soy wax and features a long burn time.", rating: 4.9, category: "Home" },
                { name: "Throw Blanket", price: 30.00, description: "A soft and cozy throw blanket, perfect for curling up on the sofa. Available in a variety of colors.", rating: 4.7, category: "Home" },
                { name: "Desk Organizer", price: 15.00, description: "Keep your workspace tidy with this functional desk organizer. Features multiple compartments for pens, paper, and other office supplies.", rating: 4.4, category: "Home" },
                { name: "Instant Camera", price: 80.00, description: "Capture and print memories instantly with this fun and retro camera. Features easy-to-use controls and a compact design.", rating: 4.6, category: "Electronics" },
                { name: "Phone Tripod", price: 20.00, description: "Take perfect photos and videos with this portable and adjustable phone tripod. Extends for different heights and angles.", rating: 4.5, category: "Electronics" },
                { name: "Smart Refrigerator", price: 1500.00, description: "A modern refrigerator with smart features like a built-in display, remote monitoring, and voice commands.", rating: 4.9, category: "Appliances" },
                { name: "Electric Toaster Oven", price: 65.00, description: "A versatile kitchen appliance that can toast, bake, and broil. A perfect addition to any kitchen.", rating: 4.7, category: "Appliances" },
                { name: "High-Powered Vacuum Cleaner", price: 200.00, description: "A powerful vacuum cleaner with strong suction and a lightweight design. Cleans carpets and hard floors with ease.", rating: 4.8, category: "Appliances" }
            ];

            const categories = [...new Set(allProducts.map(product => product.category))];
            
            // Carousel Logic
            const carouselSlide = document.getElementById('carousel-slide');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const indicatorsContainer = document.getElementById('carousel-indicators');
            const slides = document.querySelectorAll('.carousel-item');
            let currentSlide = 0;
            
            function updateIndicators() {
                const indicators = indicatorsContainer.querySelectorAll('span');
                indicators.forEach((indicator, index) => {
                    if (index === currentSlide) {
                        indicator.classList.remove('bg-gray-400');
                        indicator.classList.add('bg-white');
                    } else {
                        indicator.classList.remove('bg-white');
                        indicator.classList.add('bg-gray-400');
                    }
                });
            }

            function updateCarousel() {
                carouselSlide.style.transform = `translateX(${-currentSlide * 100}%)`;
                updateIndicators();
            }

            nextBtn.addEventListener('click', () => {
                currentSlide = (currentSlide + 1) % slides.length;
                updateCarousel();
            });

            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                updateCarousel();
            });

            indicatorsContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'SPAN') {
                    const indicatorIndex = Array.from(indicatorsContainer.children).indexOf(e.target);
                    currentSlide = indicatorIndex;
                    updateCarousel();
                }
            });

            function renderCategories() {
                categoriesList.innerHTML = '';
                categories.forEach(category => {
                    const categoryElement = document.createElement('div');
                    categoryElement.className = 'flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition cursor-pointer category-btn';
                    categoryElement.setAttribute('data-category', category);
                    categoryElement.innerHTML = `
                        <div class="bg-gray-200 rounded-lg w-16 h-16 mb-2"></div>
                        <span class="text-sm font-medium">${category}</span>
                    `;
                    categoriesList.appendChild(categoryElement);
                });
            }

            // Fisher-Yates shuffle algorithm to randomize products
            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            }

            // Function to render products, with an optional filter by category
            function renderProducts(products, container) {
                shuffleArray(products);
                container.innerHTML = '';
                products.forEach(product => {
                    const productCard = document.createElement('div');
                    productCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer product-card relative';
                    
                    const randomImgUrl = `https://picsum.photos/600/400?random=${Math.random()}`;
                    product.img = randomImgUrl;

                    productCard.setAttribute('data-name', product.name);
                    
                    productCard.innerHTML = `
                        <span class="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full z-10">Flash Sale</span>
                        <img src="${randomImgUrl}" alt="${product.name}" class="w-full h-64 object-cover">
                        <div class="p-6 text-center">
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${product.name}</h3>
                            <p class="text-2xl font-bold text-orange-500 mb-4">₱${product.price.toFixed(2)}</p>
                            <button class="add-to-cart-btn bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                                data-name="${product.name}" data-price="${product.price}">Add to Cart</button>
                        </div>
                    `;
                    container.appendChild(productCard);
                });
            }

            function getStarRatingHtml(rating) {
                const fullStars = Math.floor(rating);
                const halfStar = rating % 1 >= 0.5;
                const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
                let starsHtml = '';

                for (let i = 0; i < fullStars; i++) {
                    starsHtml += `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.961a1 1 0 00.95.691h4.167c.969 0 1.371 1.24.588 1.81l-3.374 2.454a1 1 0 00-.364 1.118l1.287 3.96a1 1 0 01-1.545 1.118L10 14.62l-3.374 2.454a1 1 0 01-1.546-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.245 9.389c-.783-.57-.38-1.81.588-1.81h4.167a1 1 0 00.95-.691l1.286-3.96z"></path></svg>`;
                }
                if (halfStar) {
                    starsHtml += `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor" /><stop offset="50%" stop-color="#cbd5e1" /></linearGradient></defs><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.961a1 1 0 00.95.691h4.167c.969 0 1.371 1.24.588 1.81l-3.374 2.454a1 1 0 00-.364 1.118l1.287 3.96a1 1 0 01-1.545 1.118L10 14.62l-3.374 2.454a1 1 0 01-1.546-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.245 9.389c-.783-.57-.38-1.81.588-1.81h4.167a1 1 0 00.95-.691l1.286-3.96z" fill="url(#half)"></path></svg>`;
                }
                for (let i = 0; i < emptyStars; i++) {
                    starsHtml += `<svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.961a1 1 0 00.95.691h4.167c.969 0 1.371 1.24.588 1.81l-3.374 2.454a1 1 0 00-.364 1.118l1.287 3.96a1 1 0 01-1.545 1.118L10 14.62l-3.374 2.454a1 1 0 01-1.546-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.245 9.389c-.783-.57-.38-1.81.588-1.81h4.167a1 1 0 00.95-.691l1.286-3.96z"></path></svg>`;
                }
                return `<div class="flex items-center space-x-1">${starsHtml}</div><span class="text-gray-600 ml-2">(${rating})</span>`;
            }

            function updateCartDisplay() {
                cartItemsContainer.innerHTML = '';
                let total = 0;
                let itemCount = 0;

                if (cart.length === 0) {
                    cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center mt-8">Your cart is empty.</p>';
                } else {
                    cart.forEach(item => {
                        const subtotal = item.price * item.quantity;
                        total += subtotal;
                        itemCount += item.quantity;

                        const itemElement = document.createElement('li');
                        itemElement.className = 'flex items-center justify-between p-2 rounded-lg bg-gray-50';
                        itemElement.setAttribute('data-name', item.name);
                        itemElement.innerHTML = `
                            <div class="flex-1">
                                <h5 class="font-semibold text-gray-900">${item.name}</h5>
                                <span class="text-gray-500 text-sm">$${item.price.toFixed(2)} x ${item.quantity}</span>
                            </div>
                            <div class="flex items-center space-x-4">
                                <span class="font-bold text-gray-800">$${subtotal.toFixed(2)}</span>
                                <button class="remove-item-btn text-gray-400 hover:text-red-500 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        `;
                        cartItemsContainer.appendChild(itemElement);
                    });
                }
                
                cartTotalElement.textContent = `$${total.toFixed(2)}`;
                cartCountElement.textContent = itemCount;

                document.querySelectorAll('.remove-item-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const itemElement = e.target.closest('li');
                        const itemName = itemElement.getAttribute('data-name');
                        const itemIndex = cart.findIndex(item => item.name === itemName);

                        if (itemIndex > -1) {
                            cart.splice(itemIndex, 1);
                            updateCartDisplay();
                        }
                    });
                });
            }

            cartButton.addEventListener('click', () => {
                cartSidebar.classList.remove('translate-x-full');
                backdrop.classList.remove('hidden');
            });

            closeCartBtn.addEventListener('click', () => {
                cartSidebar.classList.add('translate-x-full');
                backdrop.classList.add('hidden');
            });

            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    cartSidebar.classList.add('translate-x-full');
                    productDetailModal.classList.add('hidden');
                    messageBox.classList.add('hidden');
                    backdrop.classList.add('hidden');
                }
            });

            document.addEventListener('click', (e) => {
                const button = e.target.closest('.add-to-cart-btn');
                if (button) {
                    const productName = button.getAttribute('data-name');
                    const productPrice = parseFloat(button.getAttribute('data-price'));
                    
                    animateToCart(button);
                    addToCart(productName, productPrice);
                    return;
                }

                const productCard = e.target.closest('[data-name]');
                if (productCard) {
                    const productName = productCard.getAttribute('data-name');
                    const product = allProducts.find(p => p.name === productName);
                    if (product) {
                        renderProductDetails(product);
                        productDetailModal.classList.remove('hidden');
                        backdrop.classList.remove('hidden');
                    }
                }
            });
            
            categoriesList.addEventListener('click', (e) => {
                const categoryBtn = e.target.closest('.category-btn');
                if (categoryBtn) {
                    const category = categoryBtn.getAttribute('data-category');
                    const filteredProducts = allProducts.filter(product => product.category === category);
                    renderProducts(filteredProducts, productGrid);
                }
            });

            detailAddToCartBtn.addEventListener('click', (e) => {
                const productName = e.target.getAttribute('data-name');
                const productPrice = parseFloat(e.target.getAttribute('data-price'));
                
                animateToCart(e.target);
                addToCart(productName, productPrice);
            });

            function addToCart(name, price) {
                const existingItem = cart.find(item => item.name === name);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    cart.push({ name: name, price: price, quantity: 1 });
                }
                updateCartDisplay();

                cartButton.classList.add('bouncing');
                cartButton.addEventListener('animationend', () => {
                    cartButton.classList.remove('bouncing');
                }, { once: true });
            }

            function animateToCart(originElement) {
                const buttonRect = originElement.getBoundingClientRect();
                const cartRect = cartButton.getBoundingClientRect();

                const flyingButton = document.createElement('div');
                flyingButton.classList.add('fly-to-cart', 'bg-blue-600', 'rounded-full', 'w-8', 'h-8');
                flyingButton.style.top = `${buttonRect.top}px`;
                flyingButton.style.left = `${buttonRect.left}px`;
                
                document.body.appendChild(flyingButton);

                requestAnimationFrame(() => {
                    flyingButton.style.transform = `translate(${cartRect.left - buttonRect.left}px, ${cartRect.top - buttonRect.top}px) scale(0.5)`;
                    flyingButton.style.opacity = '0';
                });

                flyingButton.addEventListener('transitionend', () => {
                    flyingButton.remove();
                });
            }

            function renderProductDetails(product) {
                detailName.textContent = product.name;
                detailPrice.textContent = `$${product.price.toFixed(2)}`;
                detailDescription.textContent = product.description;
                detailImg.src = product.img;
                detailImg.alt = product.name;
                
                detailAddToCartBtn.setAttribute('data-name', product.name);
                detailAddToCartBtn.setAttribute('data-price', product.price);

                detailRating.innerHTML = getStarRatingHtml(product.rating);
            }

            closeProductDetailBtn.addEventListener('click', () => {
                productDetailModal.classList.add('hidden');
                backdrop.classList.add('hidden');
            });

            checkoutBtn.addEventListener('click', () => {
                if (cart.length > 0) {
                    messageBox.classList.remove('hidden');
                    cartSidebar.classList.add('translate-x-full');
                    backdrop.classList.add('hidden');
                    cart = [];
                    updateCartDisplay();
                } else {
                    messageBox.querySelector('h4').textContent = "Cart is Empty!";
                    messageBox.querySelector('p').textContent = "Please add items to your cart before checking out.";
                    messageBox.classList.remove('hidden');
                }
            });

            closeMessageBtn.addEventListener('click', () => {
                messageBox.classList.add('hidden');
                messageBox.querySelector('h4').textContent = "Thank You!";
                messageBox.querySelector('p').textContent = "Your order has been placed successfully.";
            });

            // Initial rendering
            renderCategories();
            renderProducts(allProducts.slice(0, 8), productGrid); // Render 8 featured products
            renderProducts(allProducts.slice(8, 12), recommendedGrid); // Render 4 recommended products
            updateCartDisplay();
            updateIndicators();
        });