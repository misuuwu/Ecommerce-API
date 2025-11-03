
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

        // --- GLOBAL VARIABLES & CONFIG ---
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        
        // Default Firebase configuration using the values you provided
        const defaultFirebaseConfig = {
            apiKey: "AIzaSyAqDLocdi1CDHDeD5Z_LOlVZOycI2tuJpk",
            authDomain: "digisoria-baa83.firebaseapp.com",
            projectId: "digisoria-baa83",
            storageBucket: "digisoria-baa83.firebasestorage.app",
            messagingSenderId: "1042609120554",
            appId: "1:1042609120554:web:0500a100e9ae42ead32a53",
            measurementId: "G-TM8CBPSRR9"
        };
        const firebaseConfig = typeof __firebase_config !== 'undefined' 
            ? JSON.parse(__firebase_config) 
            : defaultFirebaseConfig;

        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        // --- DOM ELEMENTS ---
        const userListContainer = document.getElementById('user-list-container');
        const chatWelcome = document.getElementById('chat-welcome');
        const authStatusMessage = document.getElementById('auth-status-message'); 
        const activeChatContent = document.getElementById('active-chat-content');
        const selectedUserName = document.getElementById('selected-user-name');
        const chatHeaderIcon = document.querySelector('#chat-header > div:first-child > div:nth-child(2)'); // Target the avatar div
        const lastSeenStatusElement = document.getElementById('last-seen-status'); 
        const messagesContainer = document.getElementById('messages-container');
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const userInfoDisplay = document.getElementById('user-info');
        
        // --- FIREBASE INSTANCES & STATE ---
        let db;
        let auth;
        let currentUserId = null;
        let currentUserDisplayName = null;
        let isAuthReady = false;

        let selectedUser = null; 
        let currentChatId = null; 
        let unsubscribeMessages = null; 
        let unsubscribePresence = null; 

        // --- UTILITY FUNCTIONS ---

        /**
         * Formats a Firestore timestamp into a human-readable "time ago" string.
         */
        const formatTimeAgo = (timestamp) => {
            if (!timestamp) return 'Last seen unavailable';

            const now = new Date();
            const lastActiveTime = timestamp.toDate();
            const diffInSeconds = Math.floor((now.getTime() - lastActiveTime.getTime()) / 1000);

            if (diffInSeconds < 60) {
                return 'Active now';
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `Active ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return `Active ${hours} hour${hours !== 1 ? 's' : ''} ago`;
            } else {
                // Show full date for older activity
                return `Last seen on ${lastActiveTime.toLocaleDateString()}`;
            }
        };


        const renderMessage = (message, isOwnMessage) => {
            // Container uses a column layout (flex-col) to stack the bubble and status vertically
            // It aligns to the end (right) for own messages and start (left) for others.
            const containerClass = isOwnMessage
                ? 'flex flex-col items-end'
                : 'flex items-start';

            const bubbleClass = isOwnMessage
                ? 'bubble-own shadow-md'
                : 'bubble-other shadow-sm';
            
            // Avatar (only show for the other user, on the left)
            const otherUserAvatarHtml = isOwnMessage 
                ? '' 
                : `<div class="avatar-placeholder mr-2"></div>`;
            
            // Avatar (only show for own message, on the right)
            const currentUserAvatarHtml = isOwnMessage 
                ? `<div class="avatar-placeholder ml-2"></div>` 
                : '';

            // Status Indicator (positioned below the message bubble)
            const statusText = isOwnMessage ? 'sent' : 'seen';
            const statusHtml = `
                <div class="status-indicator">
                    <i class="fas fa-check-circle"></i> ${statusText}
                </div>
            `;
            
            const element = document.createElement('div');
            element.className = containerClass + ' w-full'; // Ensure it takes full width for alignment

            // Message content block, limited width
            element.innerHTML = `
                <div class="flex items-end max-w-xs sm:max-w-sm">
                    ${otherUserAvatarHtml}

                    <div class="p-3 ${bubbleClass} flex-shrink">
                        <p class="text-sm whitespace-pre-wrap">${message.text}</p>
                    </div>

                    ${currentUserAvatarHtml}
                </div>

                <!-- Status indicator placed below the message bubble -->
                <div class="flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full max-w-xs sm:max-w-sm mt-1 mb-2">
                    ${isOwnMessage ? statusHtml : ''}
                    ${!isOwnMessage ? statusHtml : ''}
                </div>
            `;
            return element;
        };

        const renderUserListItem = (user) => {
            const element = document.createElement('div');
            // Check if this user is the currently selected one for persistent highlighting
            const isSelected = selectedUser && selectedUser.uid === user.uid;
            
            element.className = `flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition duration-150 ${isSelected ? 'bg-gray-200' : ''}`;
            element.setAttribute('data-user-id', user.uid);
            element.onclick = () => startChat(user);

            const avatarLetter = user.displayName ? user.displayName.charAt(0).toUpperCase() : '?';

            element.innerHTML = `
                <div class="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 flex-shrink-0">
                    ${avatarLetter}
                </div>
                <div class="flex-grow">
                    <p class="font-semibold text-gray-800 truncate">${user.displayName}</p>
                    <p class="text-xs text-gray-500 truncate text-gray-500">Click to start chat</p>
                </div>
            `;
            return element;
        };
        
        /**
         * Updates the current user's lastActive timestamp in Firestore.
         */
        const updatePresence = async () => {
            if (!currentUserId || !db) return;
            try {
                const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUserId);
                await setDoc(userDocRef, { lastActive: serverTimestamp() }, { merge: true });
            } catch (e) {
                console.error("Error updating presence:", e);
            }
        };

        /**
         * Creates or updates a Firestore user profile document.
         */
        const saveUserProfile = async (user) => {
            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
            
            // Generate a unique display name using part of the UID if no email/display name exists
            const defaultDisplayName = user.email ? user.email.split('@')[0] : `User-${user.uid.substring(0, 8)}`;
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: defaultDisplayName, 
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp() 
            };

            try {
                await setDoc(userDocRef, userData, { merge: true });
                currentUserDisplayName = userData.displayName;
                console.log("User profile saved/updated:", user.uid);
            } catch (e) {
                console.error("Error saving user profile to Firestore:", e);
            }
        };

        // --- CHAT & PRESENCE LOGIC ---

        const generateChatId = (uid1, uid2) => {
            const sortedUids = [uid1, uid2].sort();
            return `${sortedUids[0]}_${sortedUids[1]}`;
        };

        /**
         * Sets up a real-time listener for the selected user's profile presence.
         */
        const setupSelectedUserPresenceListener = () => {
            if (unsubscribePresence) {
                unsubscribePresence(); // Stop the previous listener
            }
            
            if (!selectedUser || !db) {
                lastSeenStatusElement.textContent = '';
                return;
            }

            const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', selectedUser.uid);
            
            unsubscribePresence = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const lastActive = userData.lastActive;
                    
                    selectedUser = {...selectedUser, ...userData}; 

                    // Check if they were active very recently
                    const now = new Date().getTime();
                    const lastActiveTime = lastActive ? lastActive.toDate().getTime() : 0;
                    const diffInSeconds = Math.floor((now - lastActiveTime) / 1000);

                    if (diffInSeconds < 60) {
                        lastSeenStatusElement.textContent = 'Active now';
                    } else {
                        lastSeenStatusElement.textContent = formatTimeAgo(lastActive);
                    }
                    
                } else {
                    lastSeenStatusElement.textContent = 'User profile not found';
                }
            }, (error) => {
                console.error("Error listening to selected user presence:", error);
                lastSeenStatusElement.textContent = 'Status unavailable';
            });
        };

        /**
         * Starts a new chat or switches to an existing one with the target user.
         */
        const startChat = (targetUser) => {
            if (!currentUserId || targetUser.uid === currentUserId) {
                console.log("Cannot chat with yourself.");
                return; 
            }
            if (!isAuthReady) {
                console.warn("Authentication not ready. Cannot start chat.");
                return;
            }
            
            // 1. Update state
            selectedUser = targetUser;
            currentChatId = generateChatId(currentUserId, targetUser.uid);

            // 2. Update UI
            chatWelcome.classList.add('hidden-auth');
            activeChatContent.classList.remove('hidden-auth');
            selectedUserName.textContent = selectedUser.displayName;
            // Update the header avatar
            chatHeaderIcon.textContent = selectedUser.displayName.charAt(0).toUpperCase(); 
            lastSeenStatusElement.textContent = 'Loading status...'; 

            // 3. Set up listeners for messages and presence
            setupMessageListener();
            setupSelectedUserPresenceListener(); 
            
            // 4. Highlight selected user in the list
            document.querySelectorAll('#user-list-container > div').forEach(item => {
                item.classList.remove('bg-gray-200'); // Remove old highlight
                if (item.getAttribute('data-user-id') === selectedUser.uid) {
                    item.classList.add('bg-gray-200'); // Apply new highlight
                }
            });
            
            messageInput.focus();
        };

        /**
         * Sets up the real-time listener for the currently selected chat.
         */
        const setupMessageListener = () => {
            if (unsubscribeMessages) {
                unsubscribeMessages(); 
            }
            
            if (!currentChatId || !db) return;

            const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', currentChatId, 'messages');
            // NOTE: Sorting is done client-side to avoid Firestore index issues (orderBy not used)
            const q = query(messagesRef);

            unsubscribeMessages = onSnapshot(q, (snapshot) => {
                const statusElement = document.getElementById('chat-loading-status');
                if (statusElement) statusElement.remove();

                const messages = [];
                snapshot.forEach((doc) => {
                    messages.push({ id: doc.id, ...doc.data() });
                });

                messages.sort((a, b) => {
                    if (!a.timestamp || !b.timestamp) return 0;
                    // Sort by time, client side
                    return a.timestamp.toMillis() - b.timestamp.toMillis(); 
                });

                messagesContainer.innerHTML = '';

                messages.forEach(message => {
                    const isOwnMessage = message.senderId === currentUserId;
                    messagesContainer.appendChild(renderMessage(message, isOwnMessage));
                });

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, (error) => {
                console.error("Error listening to messages:", error);
                messagesContainer.innerHTML = `<p class="text-red-500 text-center">Error fetching messages: ${error.message}</p>`;
            });
        };

        /**
         * Sets up the real-time listener for all registered users (contacts).
         */
        const setupUserListListener = () => {
            if (!db || !isAuthReady) return;

            const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
            const q = query(usersRef);

            onSnapshot(q, (snapshot) => {
                const loadingElement = document.getElementById('loading-users');
                if (loadingElement) loadingElement.remove();
                
                const users = [];
                snapshot.forEach((doc) => {
                    const userData = doc.data();
                    // Exclude the current user from the contact list
                    if (userData.uid !== currentUserId) {
                        users.push(userData);
                    }
                });

                userListContainer.innerHTML = '';
                if (users.length === 0) {
                     userListContainer.innerHTML = `<p class="p-4 text-center text-gray-500 text-sm">No other contacts found. Open another window to chat!</p>`;
                } else {
                    users.forEach(user => {
                        userListContainer.appendChild(renderUserListItem(user));
                    });
                }
            }, (error) => {
                console.error("Error listening to users:", error);
                userListContainer.innerHTML = `<p class="p-4 text-red-500 text-center">Error fetching contacts: ${error.message}</p>`;
            });
        };


        // --- FIREBASE INITIALIZATION & AUTHENTICATION HANDLERS ---

        /**
         * Retries the initial Firebase sign-in with exponential backoff.
         */
        const attemptSignIn = async (auth, retries = 0) => {
            const maxRetries = 5;
            const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s, 8s, 16s

            if (retries > 0) {
                authStatusMessage.textContent = `Retrying authentication in ${delay / 1000}s... (Attempt ${retries + 1}/${maxRetries})`;
            }

            if (retries >= maxRetries) {
                authStatusMessage.textContent = `Error: Authentication failed after ${maxRetries} attempts. Please refresh.`;
                console.error("Authentication failed: Max retries reached.");
                return;
            }

            await new Promise(resolve => setTimeout(resolve, delay));

            try {
                if (initialAuthToken) { 
                    await signInWithCustomToken(auth, initialAuthToken);
                } else { 
                    await signInAnonymously(auth);
                }
            } catch (e) {
                // Check if error is due to network/transient failure before retrying
                console.error(`Sign-in attempt ${retries + 1} failed. Retrying...`, e);
                await attemptSignIn(auth, retries + 1);
            }
        };


        const initializeFirebase = async () => {
            if (!firebaseConfig || !firebaseConfig.apiKey) {
                userInfoDisplay.textContent = 'Error: Firebase config missing.';
                return;
            }

            try {
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                auth = getAuth(app);
                
                authStatusMessage.textContent = 'Waiting for authentication...';
                authStatusMessage.classList.remove('hidden-auth');
                sendButton.disabled = true;

                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        currentUserId = user.uid;
                        // Save profile and get display name
                        await saveUserProfile(user); 
                        
                        // Update UI to show logged-in status
                        userInfoDisplay.textContent = `You: ${currentUserDisplayName} (${user.uid.substring(0, 8)}...)`;
                        
                        isAuthReady = true;
                        sendButton.disabled = false;
                        authStatusMessage.classList.add('hidden-auth');
                        
                        // Start listening for other users
                        setupUserListListener();
                        
                    } else {
                        // User is signed out or not yet signed in
                        currentUserId = null;
                        currentUserDisplayName = null;
                        isAuthReady = false;
                        sendButton.disabled = true;
                        
                        if (unsubscribeMessages) unsubscribeMessages();
                        if (unsubscribePresence) unsubscribePresence(); 

                        selectedUser = null;
                        currentChatId = null;

                        // Start the robust sign-in process
                        await attemptSignIn(auth, 0);
                    }
                });
            } catch (error) {
                console.error("Firebase Initialization Error:", error);
                userInfoDisplay.textContent = `Error: Failed to initialize Firebase.`;
            }
        };
        
        // --- EVENT LISTENERS ---
        
        // Handles sending a new message
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const text = messageInput.value.trim();
            if (!text || !db || !currentUserId || !selectedUser || !currentChatId) return;

            sendButton.disabled = true;

            try {
                // 1. Update own presence (since sending a message is a sign of activity)
                await updatePresence(); 

                // 2. Send the message
                const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'chats', currentChatId, 'messages');
                
                await addDoc(messagesRef, {
                    senderId: currentUserId,
                    text: text,
                    timestamp: serverTimestamp()
                });

                messageInput.value = ''; 
                messageInput.focus(); 

            } catch (error) {
                console.error("Error sending message:", error);
            } finally {
                sendButton.disabled = false;
            }
        });

        // Initialize the application on page load
        initializeFirebase();
