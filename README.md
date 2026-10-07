# Full-Stack Mobile Chat Application

A real-time mobile chat application built with **React Native (Expo)**, **TypeScript**, **Node.js/Express**, **MongoDB (Mongoose)**, **Socket.IO**, and **Firebase Phone Authentication**.

---

## Architecture Overview

```
mobile-chat-app/
├── mobile/                  # React Native Expo app (TypeScript)
│   ├── src/
│   │   ├── app/             # Expo Router Screens
│   │   │   ├── _layout.tsx  # Root Layout with AuthProvider & Stack
│   │   │   ├── index.tsx    # Home Screen (Registered Users & Logout)
│   │   │   ├── login.tsx    # Phone Number input & OTP request
│   │   │   ├── otp.tsx      # OTP verification & User sync
│   │   │   ├── profile-setup.tsx # Name setup screen
│   │   │   └── chat/[id].tsx     # Real-time Chat screen
│   │   ├── config/          # Firebase client SDK initialization
│   │   ├── context/         # AuthContext (state, profile, logout)
│   │   ├── services/        # REST API calls & Socket.IO client manager
│   │   ├── types/           # TypeScript interfaces (User, Message)
│   │   └── utils/           # API config & host resolution
│   ├── .env.example
│   └── package.json
│
└── server/                  # Node.js backend (TypeScript)
    ├── src/
    │   ├── config/          # MongoDB & Firebase Admin initialization
    │   ├── models/          # User & Message Mongoose models
    │   ├── middleware/      # Firebase token verification middleware
    │   ├── routes/          # /api/users and /api/messages routes
    │   ├── sockets/         # Socket.IO authenticated chat handler
    │   └── server.ts        # Express + Socket.IO server entry
    ├── .env.example
    └── package.json
```

---

## 1. Prerequisites

- **Node.js**: v18+ (tested on Node v20)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **Firebase Project**: A Firebase project with **Phone Authentication** enabled

---

## 2. Environment Variables

### Server (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```ini
PORT=5001
MONGODB_URI=mongodb://localhost:27017/mobile_chat_db

# Firebase Admin SDK Credentials (Choose one of the methods):
# Method 1: Path to service account JSON
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Method 2: Individual variables
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Mobile (`mobile/.env`)
Copy `mobile/.env.example` to `mobile/.env`:
```ini
# Backend API URL
# - Web: http://localhost:5001
# - Android Emulator: http://10.0.2.2:5001
# - Physical Device: http://<YOUR_COMPUTER_LOCAL_IP>:5001
EXPO_PUBLIC_API_URL=http://localhost:5001

# Firebase Web App Config (From Firebase Console -> Project Settings)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 3. Firebase Setup Steps

1. Go to [Firebase Console](https://console.firebase.google.com/) and create or select a project.
2. Under **Build > Authentication**:
   - Enable the **Phone** sign-in method.
   - (Recommended for testing): Expand **Phone numbers for testing** and add test phone numbers:
     - `+1 650-555-3434` with code `123456`
     - `+1 650-555-3435` with code `123456`
   *(Test phone numbers allow instant authentication without consuming SMS quota or delays!)*
3. **For Mobile App**:
   - In Firebase Project Settings, create a **Web app** (`</>`).
   - Copy the `apiKey`, `authDomain`, `projectId`, etc., into `mobile/.env`.
4. **For Server Backend**:
   - In Firebase Project Settings, go to **Service accounts**.
   - Click **Generate new private key** and download the JSON file.
   - Place the file as `server/firebase-service-account.json` (already in `.gitignore`).

---

## 4. MongoDB Setup Steps

- **Option A (Local)**: If you have MongoDB installed, start it:
  ```bash
  brew services start mongodb-community
  # or using docker
  docker run -d -p 27017:27017 --name mongo-chat mongo:latest
  ```
- **Option B (Atlas Cloud)**: Create a free MongoDB Atlas cluster and set `MONGODB_URI` in `server/.env`:
  ```ini
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mobile_chat_db?retryWrites=true&w=majority
  ```

---

## 5. Running the Backend Server

```bash
cd server
npm run dev
```
The server will start on port `5001` and output:
```
[Firebase Admin] Initialized
[MongoDB] Connected successfully to ...
[Server] Mobile Chat App Backend running on port 5001
```

---

## 6. Running the Mobile App

```bash
cd mobile
npm start
```
- Press `a` for Android Emulator.
- Press `w` for Web (test in two browser windows to test 2 users).
- Scan the QR code using the **Expo Go** app on your physical Android device.

---

## 7. Testing Two Users Communicating

1. Open User A (e.g., in Expo Go or Web browser):
   - Enter phone number: `+16505553434`.
   - Enter OTP: `123456`.
   - Set name: `Alice`.
2. Open User B (e.g., in a separate incognito window or second device):
   - Enter phone number: `+16505553435`.
   - Enter OTP: `123456`.
   - Set name: `Bob`.
3. In Alice's user list, Bob will be displayed. Tap on Bob to open the Chat screen.
4. Send a text message:
   - Message is saved directly to MongoDB.
   - Instantly emitted to Bob via Socket.IO.
   - Real-time messages update on both devices with timestamps!
