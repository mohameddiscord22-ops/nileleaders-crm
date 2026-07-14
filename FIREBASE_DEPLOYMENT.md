# Nile Leaders CRM - Firebase Deployment Guide

## ⚠️ Important Note

This is a **Full-Stack Application** (React + Express + MySQL). Firebase Hosting alone **cannot host the backend**.

You have two options:

---

## Option 1: Frontend Only on Firebase + Backend on Separate Service ⭐ Recommended

### Step 1: Deploy Frontend to Firebase Hosting

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Build the React app
# Make sure to set VITE_API_URL to your backend URL
VITE_API_URL=https://your-backend-url.railway.app pnpm build

# 4. Deploy
firebase deploy --only hosting
```

### Step 2: Deploy Backend to Railway/Render/Heroku

**Backend needs:**
- Node.js runtime
- MySQL database
- Environment variables

**Recommended platforms:**
- **Railway.app** - Easiest, free tier available
- **Render.com** - Good free tier
- **Heroku** - Paid but reliable

---

## Option 2: Full-Stack on Single Platform (Better) ✅

Deploy everything together on:

| Platform | Cost | Setup Time | Recommendation |
|----------|------|-----------|-----------------|
| **Railway** | Free tier available | 5 min | ⭐⭐⭐⭐⭐ |
| **Render** | Free tier available | 10 min | ⭐⭐⭐⭐ |
| **Heroku** | Paid ($7+/mo) | 5 min | ⭐⭐⭐ |
| **DigitalOcean** | $5+/mo | 15 min | ⭐⭐⭐⭐ |

---

## Quick Start: Firebase Frontend Only

### Prerequisites
- Firebase account (free)
- Node.js 16+
- pnpm

### Installation

```bash
# 1. Extract the ZIP
unzip nileleaders-crm-firebase.zip
cd nileleaders-crm-firebase

# 2. Install dependencies
pnpm install

# 3. Build for production (Replace with your actual backend URL)
VITE_API_URL=https://your-backend-url.railway.app pnpm build

# 4. Install Firebase CLI
npm install -g firebase-tools

# 5. Login
firebase login

# 6. Deploy (Project is already initialized)
firebase deploy --only hosting
```

---

## Backend Deployment (Required)

### Option A: Railway (Easiest)

```bash
# 1. Go to railway.app
# 2. Click "New Project"
# 3. Select "Deploy from GitHub"
# 4. Connect your repo
# 5. Add MySQL plugin
# 6. Set environment variables:
DATABASE_URL=<Railway MySQL connection string>
JWT_SECRET=<generate random string>
NODE_ENV=production

# 7. Deploy automatically
```

### Option B: Render

```bash
# 1. Go to render.com
# 2. Create new Web Service
# 3. Connect GitHub repo
# 4. Build command: pnpm build
# 5. Start command: pnpm start
# 6. Add MySQL database
# 7. Set environment variables
```

---

## Environment Variables

Create `.env` file in project root:

```env
# Database (MySQL)
DATABASE_URL=mysql://user:password@host:3306/nilecrm

# JWT Secret (generate random string)
JWT_SECRET=your-super-secret-key-here-change-this

# Node Environment
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-firebase-domain.web.app
```

---

## Project Structure

```
nileleaders-crm-firebase/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── index.html
├── server/                 # Express backend
│   ├── routers.ts
│   ├── db.ts
│   └── _core/
├── drizzle/                # Database schema
│   └── schema.ts
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Build & Deploy Commands

```bash
# Development
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Database migrations
pnpm db:push
```

---

## Troubleshooting

### Firebase Deploy Fails
- Check `dist/public` folder exists
- Run `pnpm build` first
- Check `firebase.json` configuration

### Backend Connection Issues
- Verify `DATABASE_URL` is correct
- Check MySQL is accessible
- Verify firewall rules

### CORS Errors
- Add frontend URL to backend CORS config
- Update `FRONTEND_URL` env variable

---

## Security Checklist

- [ ] Change JWT_SECRET to random string
- [ ] Use strong database password
- [ ] Enable HTTPS (automatic on Firebase)
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring/alerts

---

## Performance Tips

1. **Enable caching** in Firebase hosting
2. **Use CDN** for static assets
3. **Optimize images** before deployment
4. **Enable compression** on backend
5. **Monitor database** performance

---

## Support

For issues:
1. Check Firebase console
2. Check backend logs
3. Verify environment variables
4. Check database connection

---

**Last Updated:** July 13, 2026
**Version:** 1.0.0
