# FinFlow 💸

A full-stack financial management platform built with **Next.js 14**, **Prisma**, **NextAuth**, and **WebSockets** — featuring real-time updates, a complete user profile system, authentication, and a Redux-powered frontend.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database ORM | Prisma |
| Authentication | NextAuth.js (Credentials + OAuth) |
| State Management | Redux Toolkit |
| Real-time | WebSockets (`ws`) |
| Styling | Tailwind CSS |
| Validation | Zod |
| Password Hashing | bcryptjs |

---

## 📁 Project Structure

```
finflow/
├── app/
│   ├── api/
│   │   └── profile/
│   │       ├── update/          # POST – update profile fields
│   │       ├── notifications/   # GET/POST – notification preferences
│   │       ├── privacy/         # GET/POST – privacy settings
│   │       ├── appearance/      # GET/POST – appearance settings
│   │       ├── activity/        # GET – recent activity logs
│   │       ├── sessions/        # GET/DELETE – active device sessions
│   │       ├── password/        # POST – change password
│   │       ├── upload-image/    # POST – avatar upload
│   │       ├── export/          # GET – download account data as JSON
│   │       └── delete/          # POST – permanently delete account
│   └── profile/
│       ├── page.tsx             # Profile settings UI
│       └── profile.css
├── lib/
│   ├── auth.ts                  # NextAuth configuration
│   └── prisma.ts                # Prisma client singleton
├── store/
│   ├── index.ts                 # Redux store
│   └── slices/
│       └── websocketSlice.ts    # WebSocket state slice
├── types/
│   ├── next-auth.d.ts           # NextAuth type augmentation
│   └── websocket.ts             # WebSocket types
├── prisma/
│   └── schema.prisma            # Database schema
├── server.ts                    # Custom WebSocket server
├── public/
│   └── uploads/
│       └── avatars/             # Uploaded profile images
└── package.json
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/finflow.git
cd finflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/finflow"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Schema

The Prisma schema defines the following models:

| Model | Description |
|---|---|
| `User` | Core user with profile fields (bio, phone, location, social links, etc.) |
| `Account` | OAuth provider accounts (NextAuth) |
| `Session` | JWT sessions (NextAuth) |
| `VerificationToken` | Email verification tokens |
| `NotificationPreference` | Per-user email/push/marketing notification toggles |
| `PrivacySetting` | Profile visibility, show email/phone/location, searchability |
| `AppearanceSetting` | Dark mode, theme color, font size, language |
| `ActivityLog` | Timestamped log of user actions with device/IP info |
| `UserSession` | Custom device session tracking (separate from NextAuth sessions) |

---

## 🔐 Authentication

Authentication is handled by **NextAuth.js** with the following providers:

- **Credentials** (email + password with bcrypt)
- **Google OAuth**
- **GitHub OAuth**

Sessions use the **JWT strategy**. The session callback enriches `session.user` with `id` and `createdAt` from the database on every request.

---

## 👤 Profile System

The profile page (`/profile`) offers six tabs, each backed by dedicated API routes:

- **General** — Edit name, email, phone, bio, date of birth, location, occupation, social links, and avatar
- **Security** — Change password (with strength validation), manage active device sessions, export data, delete account
- **Notifications** — Toggle email, push, marketing, security, comments, mentions, and product update notifications
- **Privacy** — Control profile visibility, show/hide contact info, allow messages, activity status, search discoverability
- **Appearance** — Dark mode, theme color, compact view, font size, language
- **Activity** — View last 50 logged actions with device and location info

---

## 🔄 Real-time (WebSockets)

A custom WebSocket server runs in `server.ts` alongside the Next.js app. WebSocket state is managed in Redux via `websocketSlice.ts`.

To run the server with WebSocket support:

```bash
npx ts-node server.ts
```

---

## 📦 Key Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev   # Run migrations in development
npx prisma generate  # Regenerate Prisma client
```

---

## 🖼️ Image Uploads

Profile avatars are saved to `/public/uploads/avatars/<userId>.<ext>` on the server and served as static files. Supported formats: **JPEG, PNG, WebP, GIF**. Max file size: **5MB**.

---

## 📤 Data Export

Users can download all their account data (profile, settings, activity logs) as a `.json` file from the Security tab or via `GET /api/profile/export`.

---

## 🗑️ Account Deletion

Account deletion (`POST /api/profile/delete`) requires:
1. The user's current password
2. Typing `DELETE` as confirmation

All associated records are removed in a single Prisma transaction: activity logs, sessions, settings, OAuth accounts, and the user record itself.

---

## 📄 License

MIT © FinFlow
