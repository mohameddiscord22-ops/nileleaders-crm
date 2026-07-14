# Nile Leaders CRM - Complete Deployment Guide

## 📋 Overview

This is a **Full-Stack Application** consisting of:
- **Frontend**: React app deployed on Firebase Hosting
- **Backend**: Express.js API deployed on Railway/Render/Heroku
- **Database**: MySQL (managed by hosting provider)

---

## 🚀 Quick Start (Recommended)

### Prerequisites
- Node.js 16+ and pnpm installed
- Firebase account (free tier available)
- Railway account (free tier available)
- Git repository (recommended)

---

## 📱 Step 1: Deploy Backend on Railway

Railway is the easiest option for deploying the backend with a free tier.

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub or email
3. Create a new project

### 1.2 Connect Your Repository
1. Click "New Project"
2. Select "Deploy from GitHub"
3. Connect your GitHub account and select the repository
4. Railway will automatically detect it's a Node.js project

### 1.3 Add MySQL Database
1. In Railway dashboard, click "Add Service"
2. Select "MySQL"
3. Railway will create a database and provide `DATABASE_URL`

### 1.4 Configure Environment Variables
In Railway dashboard, go to **Variables** and add:

```env
DATABASE_URL=<Railway MySQL connection string>
JWT_SECRET=<generate-a-random-secret>
SESSION_SECRET=<same-as-JWT_SECRET>
NODE_ENV=production
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 1.5 Configure Build & Start Commands
In Railway **Settings**:
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`

### 1.6 Deploy
Railway will automatically deploy when you push to the main branch.

**Get your backend URL:**
- Go to Railway dashboard → Deployments
- Copy the domain (e.g., `https://nileleaders-backend.railway.app`)

---

## 🔥 Step 2: Deploy Frontend on Firebase

### 2.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2.2 Login to Firebase
```bash
firebase login
```

### 2.3 Build Frontend
```bash
# Replace with your actual backend URL from Railway
VITE_API_URL=https://your-backend-url.railway.app pnpm build
```

### 2.4 Deploy to Firebase
```bash
firebase deploy --only hosting
```

**Get your Firebase URL:**
- Check the output after deployment
- Format: `https://your-project.web.app`

---

## 🗄️ Step 3: Initialize Database

### 3.1 Run Migrations
After backend is deployed, run database migrations:

```bash
# From your local machine
DATABASE_URL="mysql://user:password@host:port/db" pnpm db:push
```

Or use Railway's shell:
1. Go to Railway dashboard
2. Click "Shell" tab
3. Run: `pnpm db:push`

---

## 🔐 Security Checklist

Before going to production, verify:

- [ ] `JWT_SECRET` is a strong random string (32+ characters)
- [ ] `DATABASE_URL` uses HTTPS/SSL connection
- [ ] `NODE_ENV` is set to `production`
- [ ] Firebase hosting has HTTPS enabled (automatic)
- [ ] Database backups are enabled
- [ ] CORS is properly configured
- [ ] No sensitive data in git repository
- [ ] `.env` file is in `.gitignore`

---

## 📊 Environment Variables Reference

### Frontend (VITE_* variables)
```env
VITE_API_URL=https://your-backend-url.railway.app
```

### Backend (Node.js environment)
```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=<random-32-char-string>
SESSION_SECRET=<same-as-JWT_SECRET>
NODE_ENV=production
PORT=3000
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push
Both Railway and Firebase support automatic deployment:

1. **Railway**: Automatically deploys when you push to main branch
2. **Firebase**: Set up GitHub Actions for automatic deployment

### GitHub Actions for Firebase
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: VITE_API_URL=${{ secrets.VITE_API_URL }} pnpm build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
```

---

## 🛠️ Troubleshooting

### Firebase Deploy Fails
**Error**: `dist/public` not found

**Solution**:
```bash
pnpm build
# Check that dist/public exists
ls -la dist/public/
```

### Backend Connection Issues
**Error**: `Cannot connect to database`

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check MySQL is running
3. Verify firewall allows connections
4. Test connection: `mysql -u user -p -h host`

### CORS Errors in Browser
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Verify `VITE_API_URL` is set correctly during build
2. Check backend CORS configuration
3. Ensure credentials are included in requests

### Authentication Not Working
**Error**: `401 Unauthorized` on API calls

**Solution**:
1. Verify `JWT_SECRET` is set on backend
2. Check session cookie is being sent
3. Verify `SESSION_SECRET` matches `JWT_SECRET`

---

## 📈 Monitoring & Logs

### View Backend Logs
**Railway**:
1. Go to dashboard
2. Click "Logs" tab
3. View real-time logs

**Firebase**:
1. Go to Firebase Console
2. Click "Hosting"
3. View deployment logs

---

## 🔄 Update & Redeploy

### Update Backend
```bash
# Push to main branch
git push origin main
# Railway auto-deploys
```

### Update Frontend
```bash
# Build with new backend URL if changed
VITE_API_URL=https://your-backend-url.railway.app pnpm build

# Deploy
firebase deploy --only hosting
```

---

## 💡 Performance Tips

1. **Enable Caching**
   - Firebase: Automatic for static assets
   - Backend: Add cache headers to API responses

2. **Optimize Images**
   - Compress images before uploading
   - Use modern formats (WebP)

3. **Database Optimization**
   - Add indexes to frequently queried columns
   - Monitor slow queries

4. **CDN**
   - Firebase Hosting uses Google CDN automatically
   - Consider Cloudflare for additional optimization

---

## 📞 Support

For issues:
1. Check Railway/Firebase dashboards for error logs
2. Review environment variables
3. Test database connection
4. Check browser console for frontend errors

---

## 🎯 Next Steps

1. ✅ Deploy backend on Railway
2. ✅ Deploy frontend on Firebase
3. ✅ Initialize database
4. ✅ Test authentication
5. ✅ Monitor logs
6. ✅ Set up automatic deployments
7. ✅ Configure backups

---

**Last Updated**: July 13, 2026  
**Version**: 2.0.0
