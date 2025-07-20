// =============================================================================
// Get References to HTML Elements
// These elements are part of the DOM and can be referenced immediately when the script loads.
// They do not depend on Firebase initialization.
// =============================================================================

// Authentication-related elements
const authSection = document.getElementById('authSection');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerButton = document.getElementById('registerButton');
const registerMessage = document.getElementById('registerMessage');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');

const showLoginLink = document.getElementById('showLogin');
const showRegisterLink = document.getElementById('showRegister');

const mainAppContent = document.getElementById('mainAppContent');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutButton = document.getElementById('logoutButton');

// Role-based section elements
const adminSection = document.getElementById('adminSection');
const driverSection = document.getElementById('driverSection'); // Added for completeness
const userSection = document.getElementById('userSection');

// Admin - Register Driver elements
const adminRegisterEmailInput = document.getElementById('adminRegisterEmail');
const adminRegisterPasswordInput = document.getElementById('adminRegisterPassword');
const adminRegisterDriverButton = document.getElementById('adminRegisterDriverButton');
const adminRegisterMessage = document.getElementById('adminRegisterMessage');

// Admin - Create Bunk elements (NEW)
const bunkNameInput = document.getElementById('bunkName');
const bunkAddressInput = document.getElementById('bunkAddress');
const chargingTypeInput = document.getElementById('chargingType');
const contactInfoInput = document.getElementById('contactInfo');
const numberOfSlotsInput = document.getElementById('numberOfSlots');
const createBunkButton = document.getElementById('createBunkButton');
const createBunkMessage = document.getElementById('createBunkMessage');

// User - Search and Display elements (Updated IDs)
const searchLocationInput = document.getElementById('searchLocation');
const searchChargingTypeInput = document.getElementById('searchChargingType');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const bunkInfoDisplay = document.getElementById('bunkInfoDisplay'); // Updated ID


// General message display for alerts
const generalMessageDisplay = document.getElementById('generalMessageDisplay');


// Global variable to store current user's role
let currentUserRole = null;

// =============================================================================
// Logging Function
// This function does not depend on Firebase, so it can be defined globally.
// =============================================================================

/**
 * Centralized logging function for application actions.
 * @param {string} level - The severity level of the log (e.g., 'INFO', 'WARN', 'ERROR').
 * @param {string} message - A descriptive message for the log entry.
 * @param {object} [data={}] - Optional, additional data relevant to the log entry.
 */
function logAction(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp: timestamp,
        level: level,
        message: message,
        data: data
    };

    if (level === 'ERROR') {
        console.error(`[${timestamp}] [${level}] ${message}`, data);
    } else if (level === 'WARN') {
        console.warn(`[${timestamp}] [${level}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] [${level}] ${message}`, data);
    }
}

// =============================================================================
// UI Management Functions
// These functions primarily interact with the DOM and do not directly depend on Firebase.
// =============================================================================

/**
 * Controls the visibility of the login and registration forms.
 * @param {string} formToShow - Specifies which form to display ('login' or 'register').
 */
function showAuthForm(formToShow) {
    logAction('INFO', `Attempting to show ${formToShow} form.`);
    if (formToShow === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        registerMessage.textContent = '';
    } else { // 'register'
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        loginMessage.textContent = '';
    }
    logAction('INFO', `Displayed ${formToShow} form.`);
}

/**
 * Toggles the overall visibility between the authentication section and the main application content.
 * @param {boolean} isAuthenticated - True if a user is currently logged in, false otherwise.
 */
function toggleAppVisibility(isAuthenticated) {
    logAction('INFO', `Toggling main app visibility. Is Authenticated: ${isAuthenticated}`);
    if (isAuthenticated) {
        authSection.classList.add('hidden');
        mainAppContent.classList.remove('hidden');
        logAction('INFO', 'Main application content is now visible.');
    } else {
        authSection.classList.remove('hidden');
        mainAppContent.classList.add('hidden');
        userEmailDisplay.textContent = '';
        adminSection.classList.add('hidden');
        driverSection.classList.add('hidden'); // Ensure driver section is hidden
        userSection.classList.add('hidden');
        currentUserRole = null;
        logAction('INFO', 'User logged out, UI reset to authentication view.');
    }
    // Clear general messages on visibility change
    if (generalMessageDisplay) {
        generalMessageDisplay.textContent = '';
    }
}

/**
 * Dynamically displays or hides sections of the application based on the user's assigned role.
 * @param {string} role - The role of the currently logged-in user ('user', 'admin', or 'driver').
 */
function displayContentByRole(role) {
    logAction('INFO', `Adjusting content visibility for role: ${role}`);
    adminSection.classList.add('hidden');
    driverSection.classList.add('hidden');
    userSection.classList.add('hidden');

    if (role === 'admin') {
        adminSection.classList.remove('hidden');
        userSection.classList.remove('hidden'); // Admins can also see user content
        logAction('INFO', 'Admin sections displayed.');
    } else if (role === 'driver') {
        driverSection.classList.remove('hidden');
        userSection.classList.remove('hidden'); // Drivers can also see user content
        logAction('INFO', 'Driver sections displayed.');
    } else if (role === 'user') {
        userSection.classList.remove('hidden');
        logAction('INFO', 'User sections displayed.');
    } else {
        logAction('WARN', `Unknown role encountered: ${role}. No specific sections displayed.`);
    }
}

// Event listeners for switching between login and registration forms
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('login');
    logAction('INFO', 'User clicked "Login here" link to switch forms.');
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('register');
    logAction('INFO', 'User clicked "Register here" link to switch forms.');
});


// =============================================================================
// ALL FIREBASE-DEPENDENT LOGIC STARTS HERE
// This entire block of code will only execute AFTER the 'firebaseReady' event
// is dispatched from index.html, ensuring all Firebase services (window.auth, window.db etc.)
// are fully initialized and available.
// =============================================================================
window.addEventListener('firebaseReady', () => {
    logAction('INFO', 'Firebase ready event received. Setting up Firebase Auth state observer and app logic.');

    /**
     * Handles user registration with Firebase Authentication and stores user profile (including role) in Firestore.
     * @param {string} email - The email address for the new user.
     * @param {string} password - The password for the new user.
     * @param {string} role - The role to assign to the new user ('user', 'admin', or 'driver').
     * @param {HTMLElement} messageElement - The HTML element where success/error messages will be displayed.
     * @returns {Promise<void>}
     */
    async function registerUserWithRole(email, password, role, messageElement) {
        messageElement.textContent = ''; // Clear any previous messages

        // Basic client-side validation for password length
        if (password.length < 6) {
            messageElement.textContent = 'Password should be at least 6 characters.';
            messageElement.style.color = 'red';
            logAction('WARN', 'Registration attempt failed: Password too short.', { email: email, role: role });
            return;
        }

        logAction('INFO', `Attempting to register user with role: ${role}.`, { email: email });
        try {
            const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
            const user = userCredential.user;

            await window.setDoc(window.doc(window.db, 'users', user.uid), {
                email: user.email,
                role: role,
                createdAt: window.serverTimestamp()
            });

            logAction('INFO', `User registered and profile saved to Firestore.`, { email: user.email, uid: user.uid, role: role });
            messageElement.textContent = `Registration successful! User ${user.email} created as ${role}.`;
            messageElement.style.color = 'green';
            // Clear form after successful registration
            if (messageElement === registerMessage) {
                registerEmailInput.value = '';
                registerPasswordInput.value = '';
            } else if (messageElement === adminRegisterMessage) {
                adminRegisterEmailInput.value = '';
                adminRegisterPasswordInput.value = '';
            }
        } catch (error) {
            logAction('ERROR', 'User registration failed.', { email: email, role: role, error: error.message });
            messageElement.textContent = `Registration failed: ${error.message}`;
            messageElement.style.color = 'red';
        }
    }

    // Event listener for the main "Register" button (for regular users, assigns 'user' role)
    registerButton.addEventListener('click', async () => {
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        logAction('INFO', 'User initiated registration for a "user" role.');
        await registerUserWithRole(email, password, 'user', registerMessage);
    });

    // Event listener for Admin to register a Driver
    adminRegisterDriverButton.addEventListener('click', async () => {
        const email = adminRegisterEmailInput.value;
        const password = adminRegisterPasswordInput.value;
        logAction('INFO', 'Admin initiated registration for a "driver" role.');
        await registerUserWithRole(email, password, 'driver', adminRegisterMessage);
    });


    /**
     * Handles user login with Firebase Authentication and fetches their role from Firestore.
     */
    loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        loginMessage.textContent = '';
        logAction('INFO', 'Attempting user login.', { email: email });

        try {
            const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
            const user = userCredential.user;

            const userDocRef = window.doc(window.db, 'users', user.uid);
            const userDocSnap = await window.getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                currentUserRole = userData.role;
                logAction('INFO', `User logged in successfully with role: ${currentUserRole}.`, { email: user.email, uid: user.uid, role: currentUserRole });
                loginMessage.textContent = `Login successful! Welcome, ${user.email} (${currentUserRole}).`;
                loginMessage.style.color = 'green';
            } else {
                logAction('WARN', `User profile not found in Firestore for logged-in user. Defaulting to 'user' role.`, { email: user.email, uid: user.uid });
                currentUserRole = 'user';
                loginMessage.textContent = `Login successful, but profile missing. Defaulting to 'user' role.`;
                loginMessage.style.color = 'orange';
                // For users who log in but somehow don't have a profile (e.g., created via Firebase Console directly)
                await window.setDoc(window.doc(window.db, 'users', user.uid), {
                    email: user.email,
                    role: 'user',
                    createdAt: window.serverTimestamp()
                });
                logAction('INFO', `Created default 'user' profile for logged-in user ${user.email}.`);
            }
        } catch (error) {
            logAction('ERROR', 'User login failed.', { email: email, error: error.message });
            loginMessage.textContent = `Login failed: ${error.message}`;
            loginMessage.style.color = 'red';
            currentUserRole = null;
        }
    });

    // Event listener for the Logout button
    logoutButton.addEventListener('click', async () => {
        logAction('INFO', 'User initiated logout.');
        if (generalMessageDisplay) generalMessageDisplay.textContent = '';
        try {
            await window.signOut(window.auth);
            logAction('INFO', 'User logged out successfully.');
            if (generalMessageDisplay) {
                generalMessageDisplay.textContent = 'Logged out successfully.';
                generalMessageDisplay.style.color = 'green';
            }
        } catch (error) {
            logAction('ERROR', 'Logout failed.', { error: error.message });
            if (generalMessageDisplay) {
                generalMessageDisplay.textContent = `Logout failed: ${error.message}`;
                generalMessageDisplay.style.color = 'red';
            }
        }
    });

    // =============================================================================
    // Admin Module: Create EV Bunk Location Details (NEW)
    // =============================================================================
    createBunkButton.addEventListener('click', async () => {
        logAction('INFO', 'Attempting to create new EV Bunk.');
        createBunkMessage.textContent = ''; // Clear previous messages

        // Input validation
        const bunkName = bunkNameInput.value.trim();
        const bunkAddress = bunkAddressInput.value.trim();
        const chargingType = chargingTypeInput.value.trim();
        const contactInfo = contactInfoInput.value.trim();
        const numberOfSlots = parseInt(numberOfSlotsInput.value, 10);

        if (!bunkName || !bunkAddress || !chargingType || !contactInfo || isNaN(numberOfSlots) || numberOfSlots <= 0) {
            createBunkMessage.textContent = 'Please fill all fields and ensure slots is a positive number.';
            createBunkMessage.style.color = 'red';
            logAction('WARN', 'EV Bunk creation failed: Missing or invalid input.', { bunkName, bunkAddress, chargingType, contactInfo, numberOfSlots });
            return;
        }

        try {
            const bunkData = {
                name: bunkName,
                address: bunkAddress,
                chargingType: chargingType,
                contactInfo: contactInfo,
                totalSlots: numberOfSlots,
                availableSlots: numberOfSlots, // Initially all slots are available
                postedBy: window.auth.currentUser.email,
                postedAt: window.serverTimestamp()
            };

            // Save bunk data to 'chargingBunks' collection in Firestore
            await window.addDoc(window.collection(window.db, 'chargingBunks'), bunkData);

            createBunkMessage.textContent = `EV Bunk "${bunkName}" created successfully!`;
            createBunkMessage.style.color = 'green';
            logAction('INFO', 'EV Bunk created successfully.', bunkData);

            // Clear form fields
            bunkNameInput.value = '';
            bunkAddressInput.value = '';
            chargingTypeInput.value = '';
            contactInfoInput.value = '';
            numberOfSlotsInput.value = '1'; // Reset to default

        } catch (error) {
            logAction('ERROR', 'Failed to create EV Bunk.', { error: error.message });
            createBunkMessage.textContent = `Failed to create EV Bunk: ${error.message}`;
            createBunkMessage.style.color = 'red';
        }
    });


    // =============================================================================
    // User Module: Search and Display Bunk Information (NEW)
    // =============================================================================
    async function fetchAndDisplayBunks(locationFilter = '', chargingTypeFilter = '') {
        logAction('INFO', 'Fetching and displaying EV Bunks.', { locationFilter, chargingTypeFilter });
        bunkInfoDisplay.innerHTML = ''; // Clear previous display

        let q = window.query(window.collection(window.db, 'chargingBunks'));

        // Apply filters if provided
        if (locationFilter) {
            // Using 'where' for exact match on location
            // Note: For partial matches or more complex searches, you'd need to use a search index like Algolia or implement client-side filtering.
            q = window.query(q, window.where('address', '==', locationFilter));
            logAction('INFO', `Applied location filter: ${locationFilter}`);
        }
        if (chargingTypeFilter) {
            // Using 'where' for exact match on charging type
            q = window.query(q, window.where('chargingType', '==', chargingTypeFilter));
            logAction('INFO', `Applied charging type filter: ${chargingTypeFilter}`);
        }
        
        // Order by postedAt for consistent display
        q = window.query(q, window.orderBy('postedAt', 'desc'));

        try {
            const querySnapshot = await window.getDocs(q);
            if (querySnapshot.empty) {
                bunkInfoDisplay.innerHTML = '<p>No charging bunk information found.</p>';
                logAction('INFO', 'No EV Bunks found matching criteria.');
                return;
            }

            querySnapshot.forEach((doc) => {
                const bunk = doc.data();
                const bunkId = doc.id; // Get the document ID for potential future use (e.g., booking)

                const bunkCard = document.createElement('div');
                bunkCard.className = 'bunk-card';
                bunkCard.innerHTML = `
                    <h3>${bunk.name}</h3>
                    <p><strong>Address:</strong> ${bunk.address}</p>
                    <p><strong>Charging Type:</strong> ${bunk.chargingType}</p>
                    <p><strong>Contact:</strong> ${bunk.contactInfo}</p>
                    <p><strong>Available Slots:</strong> ${bunk.availableSlots} / ${bunk.totalSlots}</p>
                    <p class="posted-by">Posted by: ${bunk.postedBy} on ${bunk.postedAt ? new Date(bunk.postedAt.toDate()).toLocaleString() : 'N/A'}</p>
                    <button class="book-slot-button" data-bunk-id="${bunkId}" ${bunk.availableSlots <= 0 ? 'disabled' : ''}>Book Slot</button>
                `;
                bunkInfoDisplay.appendChild(bunkCard);
            });
            logAction('INFO', `Successfully displayed ${querySnapshot.size} EV Bunks.`);

        } catch (error) {
            logAction('ERROR', 'Error fetching EV Bunks.', { error: error.message });
            bunkInfoDisplay.innerHTML = `<p style="color: red;">Error loading bunk information: ${error.message}</p>`;
        }
    }

    // Event listener for Search Button
    searchButton.addEventListener('click', () => {
        const locationFilter = searchLocationInput.value.trim();
        const chargingTypeFilter = searchChargingTypeInput.value.trim();
        fetchAndDisplayBunks(locationFilter, chargingTypeFilter);
        logAction('INFO', 'User initiated search for EV Bunks.', { locationFilter, chargingTypeFilter });
    });

    // Event listener for Clear Search Button
    clearSearchButton.addEventListener('click', () => {
        searchLocationInput.value = '';
        searchChargingTypeInput.value = '';
        fetchAndDisplayBunks(); // Fetch all bunks
        logAction('INFO', 'User cleared search filters.');
    });


    // =============================================================================
    // Firebase Authentication State Observer (Existing Logic)
    // =============================================================================
    window.onAuthStateChanged(window.auth, async (user) => {
        if (user) {
            logAction('INFO', 'Auth state changed: User is signed in.', { email: user.email, uid: user.uid });
            if (generalMessageDisplay) generalMessageDisplay.textContent = '';

            const userDocRef = window.doc(window.db, 'users', user.uid);
            const userDocSnap = await window.getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                currentUserRole = userData.role;
                userEmailDisplay.textContent = `Logged in as: ${user.email} (${currentUserRole})`;
                logAction('INFO', `User role fetched from Firestore during auth state change.`, { email: user.email, role: currentUserRole });
            } else {
                logAction('WARN', `User profile not found for ${user.email} during auth state change. Defaulting to 'user' role.`, { uid: user.uid });
                currentUserRole = 'user';
                userEmailDisplay.textContent = `Logged in as: ${user.email} (user - profile missing!)`;
                // For new users, create a basic profile with 'user' role
                await window.setDoc(window.doc(window.db, 'users', user.uid), {
                    email: user.email,
                    role: 'user',
                    createdAt: window.serverTimestamp()
                });
                logAction('INFO', `Created default 'user' profile for new user ${user.email}.`);
            }

            toggleAppVisibility(true);
            displayContentByRole(currentUserRole);
            // Fetch and display bunks when user logs in
            fetchAndDisplayBunks();
        } else {
            logAction('INFO', 'Auth state changed: User is signed out.');
            toggleAppVisibility(false);
            showAuthForm('login');
            currentUserRole = null;
        }
    });

    logAction('INFO', 'EV Charging Slot Booking App script initialized and Firebase Auth observer set up.');
});
