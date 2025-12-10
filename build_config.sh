#!/bin/bash

# Create the firebase-config.js file from environment variables
echo "Creating firebase-config.js..."

cat > frontend/static/js/firebase-config.js << EOF
const FIREBASE_CONFIG = {
    apiKey: "$FIREBASE_API_KEY",
    authDomain: "$FIREBASE_AUTH_DOMAIN",
    projectId: "$FIREBASE_PROJECT_ID",
    storageBucket: "$FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "$FIREBASE_MESSAGING_SENDER_ID",
    appId: "$FIREBASE_APP_ID",
    measurementId: "$FIREBASE_MEASUREMENT_ID"
};

window.FIREBASE_CONFIG = FIREBASE_CONFIG;
EOF

echo "firebase-config.js created successfully!"
