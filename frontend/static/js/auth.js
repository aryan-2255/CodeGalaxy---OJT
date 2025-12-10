/**
 * CodeGalaxy Authentication Module
 * Handles Firebase authentication state and API requests with user context
 */

// Firebase configuration (same as login.html)
const firebaseConfig = {
    apiKey: "AIzaSyBC_8XvushvQAM-DaIaHyZwKrrrMnUdw2o",
    authDomain: "ojt1-cfc0f.firebaseapp.com",
    projectId: "ojt1-cfc0f",
    storageBucket: "ojt1-cfc0f.firebasestorage.app",
    messagingSenderId: "446786938762",
    appId: "1:446786938762:web:2496436098abffc0990a73",
    measurementId: "G-N359GY25SL"
};

// Auth state
let currentUser = null;
let firebaseApp = null;
let firebaseAuth = null;

/**
 * Initialize Firebase and check authentication
 */
async function initAuth() {
    try {
        // Dynamic import of Firebase modules
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getAuth, onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        
        firebaseApp = initializeApp(firebaseConfig);
        firebaseAuth = getAuth(firebaseApp);
        
        return new Promise((resolve) => {
            onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    };
                    
                    // Store in localStorage for persistence
                    localStorage.setItem('codegalaxy_user', JSON.stringify(currentUser));
                    
                    // Update UI with user info
                    updateUserUI(currentUser);
                    
                    resolve(currentUser);
                } else {
                    // No user signed in, redirect to login
                    currentUser = null;
                    localStorage.removeItem('codegalaxy_user');
                    window.location.href = '/login';
                }
            });
        });
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // Check localStorage as fallback
        const storedUser = localStorage.getItem('codegalaxy_user');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            updateUserUI(currentUser);
            return currentUser;
        }
        window.location.href = '/login';
    }
}

/**
 * Update UI with user information
 */
function updateUserUI(user) {
    // Create user profile element if it doesn't exist
    let userProfile = document.getElementById('userProfile');
    
    if (!userProfile) {
        userProfile = document.createElement('div');
        userProfile.id = 'userProfile';
        userProfile.className = 'user-profile';
        userProfile.innerHTML = `
            <img class="user-avatar" id="userAvatar" src="" alt="User avatar">
            <div class="user-info">
                <span class="user-name" id="userName"></span>
                <button class="logout-btn" id="logoutBtn" title="Sign Out">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        `;
        
        // Insert after header
        const header = document.querySelector('.app-header');
        if (header) {
            header.appendChild(userProfile);
        }
    }
    
    // Update user info
    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (avatar) {
        avatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email) + '&background=7c3aed&color=fff';
    }
    
    if (name) {
        name.textContent = user.displayName || user.email?.split('@')[0] || 'User';
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleSignOut);
    }
}

/**
 * Sign out the current user
 */
async function handleSignOut() {
    try {
        const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const auth = getAuth();
        await signOut(auth);
        localStorage.removeItem('codegalaxy_user');
        window.location.href = '/login';
    } catch (error) {
        console.error('Sign out error:', error);
        // Force redirect anyway
        localStorage.removeItem('codegalaxy_user');
        window.location.href = '/login';
    }
}

/**
 * Get current user ID for API requests
 */
function getCurrentUserId() {
    if (currentUser) {
        return currentUser.uid;
    }
    const storedUser = localStorage.getItem('codegalaxy_user');
    if (storedUser) {
        return JSON.parse(storedUser).uid;
    }
    return null;
}

/**
 * Get current user object
 */
function getCurrentUser() {
    if (currentUser) {
        return currentUser;
    }
    const storedUser = localStorage.getItem('codegalaxy_user');
    if (storedUser) {
        return JSON.parse(storedUser);
    }
    return null;
}

/**
 * Authenticated fetch wrapper
 * Adds user ID to all API requests for data isolation
 */
async function authFetch(url, options = {}) {
    const userId = getCurrentUserId();
    
    if (!userId) {
        window.location.href = '/login';
        throw new Error('User not authenticated');
    }
    
    // Add user ID header
    const headers = {
        ...options.headers,
        'X-User-Id': userId
    };
    
    return fetch(url, {
        ...options,
        headers
    });
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return getCurrentUserId() !== null;
}

// Export functions for use in other modules
window.CodeGalaxyAuth = {
    initAuth,
    getCurrentUser,
    getCurrentUserId,
    authFetch,
    isAuthenticated,
    handleSignOut
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});
