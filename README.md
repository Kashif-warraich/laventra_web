# Laventra Web — Setup Guide

React + TypeScript + Vite admin dashboard for the Laventra car wash management platform.

## Requirements

- Node.js 20+
- npm 10+

---

## 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd laventra_web
npm install
```

---

## 2. Run the Development Server

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

> The web app points to the backend at `http://127.0.0.1:3000/api/v1` (hardcoded in `src/lib/api.ts`). Make sure `laventra_app` is running on port 3000 before using the app.

---

## 3. Build for Production

```bash
npm run build
```

Output goes to the `dist/` directory.

---

## Files That Are Gitignored and Must Be Created Manually

| File/Directory | How to Create |
|---------------|--------------|
| `node_modules/` | `npm install` |
| `dist/` | `npm run build` |

> This project has **no `.env` file** — the API URL is hardcoded in `src/lib/api.ts`. No environment setup is needed for development.

---

## Backend Dependency

The web app requires the Rails backend (`laventra_app`) to be running on port 3000. Start the backend first:

```bash
# In laventra_app directory
rails server -p 3000
```

Then open `http://localhost:5173` and log in with your admin credentials.
