# Laventra Web — Setup Guide

React + TypeScript + Vite admin dashboard for the Laventra car wash platform.
Requires **Node.js 20+**.

---

## General

The app talks to the Rails backend. The API URL is set in `src/lib/api.ts`:

```ts
const api = axios.create({ baseURL: 'https://api.laventra.live/api/v1' })
```

Change it there if your backend runs somewhere else. Make sure the backend is
running before you log in.

---

## Setup (macOS, Linux & Windows)

```bash
git clone <repo-url>
cd laventra_web

npm install
npm run dev
```

The app is now running at `http://localhost:5173`.

---

## Build for Production

```bash
npm run build
```

The output goes to the `dist/` directory.
</content>
