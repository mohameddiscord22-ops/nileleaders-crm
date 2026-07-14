# Nile Leaders CRM - Setup & Deployment Guide

## Project Overview

**Nile Leaders CRM** is a full-featured lead management system built with React 19, Express, tRPC, and MySQL. The application provides local authentication, lead management, feedback tracking, Excel import, and PWA support.

### Key Features

- **Local Authentication**: Username/password login with JWT sessions
- **Lead Management**: Full CRUD operations with search and filtering
- **Feedback System**: Track lead status with follow-up dates
- **Excel Import**: Batch import leads from Excel files with auto-detection
- **Auto-Categorization**: Leads automatically categorized by feedback status
- **Dashboard**: Real-time statistics and upcoming follow-ups
- **Admin Panel**: User management with role-based access control
- **PWA Support**: Offline-capable with service worker
- **Toast Notifications**: Sonner-based notifications for all operations
- **Dark Theme**: Premium OKLCH color palette

---

## Database Setup

### Migrations

The database schema has been generated and is ready to apply. The migration file is located at:
```
drizzle/0001_orange_nightshade.sql
```

**Tables created:**
- `users` - User accounts with local auth (username/passwordHash)
- `leads` - Lead records with auto-categorization
- `lead_feedback` - Feedback history for each lead

### Connection

The application connects to MySQL using the `DATABASE_URL` environment variable. This is pre-configured in the Manus environment.

---

## First-Time Setup

### 1. Start the Application

```bash
pnpm dev
```

The dev server will start on `http://localhost:3000`

### 2. Create First Admin Account

1. Navigate to `/login`
2. Click "أول مرة تدخل النظام؟ اعمل حساب الأدمن" (Create admin account)
3. Fill in:
   - **الاسم** (Name): Your name
   - **اليوزرنيم** (Username): Your username
   - **الباسورد** (Password): A secure password
4. Click "إنشاء الحساب" (Create Account)

**Note:** The first user created automatically becomes an admin.

### 3. Login

Use your credentials to log in. You'll be redirected to the dashboard.

---

## User Management

### Creating Additional Users (Admin Only)

1. Navigate to `/users` (admin only)
2. Click "+ إضافة يوزر" (Add User)
3. Fill in username, password, and name
4. Click "إنشاء" (Create)

### Resetting User Passwords

1. Go to `/users`
2. Find the user
3. Click "إعادة تعيين الباسورد" (Reset Password)
4. Enter new password and confirm

### Deleting Users

1. Go to `/users`
2. Click the delete button for the user
3. Confirm deletion

---

## Lead Management

### Importing Leads from Excel

1. Go to `/leads`
2. Click "استيراد من إكسل" (Import from Excel)
3. Select your Excel file (.xlsx, .xls, or .csv)
4. Map columns to lead fields:
   - **Phone** (required): Column with phone numbers
   - **Owner Name** (optional): Column with lead names
5. Click "استيراد" (Import)

**Auto-Detection:** The system automatically detects phone and name columns.

### Creating Leads Manually

1. Go to `/leads`
2. Click the lead row to open details
3. Click "تعديل" (Edit)
4. Fill in the lead information
5. Click "حفظ" (Save)

### Adding Feedback

1. Open a lead from the list
2. Click "إضافة فيدباك" (Add Feedback)
3. Select status:
   - **متاح** (Available)
   - **مش متاح** (Not Available)
   - **هيبقى فاضي بعدين** (Will Be Free Later)
   - **متتصلش تاني** (Do Not Contact)
4. If "Will Be Free Later", select a follow-up date
5. Add optional notes
6. Click "حفظ" (Save)

### Contacting Leads

Each lead has two quick action buttons:
- **واتساب** (WhatsApp): Opens WhatsApp chat with the lead
- **اتصال** (Call): Opens phone dialer

---

## Dashboard

The dashboard shows:
- **Total Leads**: Count of all leads
- **Available**: Leads marked as available
- **Not Available**: Leads marked as unavailable
- **Upcoming**: Leads with scheduled follow-ups
- **Pie Chart**: Visual breakdown of lead statuses
- **Follow-up Reminders**: Upcoming follow-ups sorted by date
- **Recent Activity**: Latest feedback and lead updates

---

## PWA Features

The application is a Progressive Web App and can be installed on mobile devices:

### Installation

1. **iOS**: Open in Safari → Share → Add to Home Screen
2. **Android**: Open in Chrome → Menu (⋮) → Install App
3. **Desktop**: Click the install icon in the address bar (if available)

### Offline Support

The service worker caches essential assets for offline access. However, data operations require a network connection.

---

## Authentication Details

### Session Management

- Sessions are stored in HTTP-only cookies
- JWT tokens are signed with `JWT_SECRET` (pre-configured)
- Sessions expire after 7 days of inactivity
- All authentication is local (no third-party OAuth)

### Password Security

- Passwords are hashed using bcryptjs
- Minimum password requirements: 8 characters recommended
- Passwords are never stored in plain text

---

## API Routes

All API routes are under `/api/trpc`:

### Authentication
- `auth.me` - Get current user
- `auth.login` - Login with username/password
- `auth.register` - Create new account
- `auth.logout` - Logout current user

### Leads
- `leads.list` - Get leads with filters
- `leads.get` - Get single lead details
- `leads.create` - Create new lead
- `leads.update` - Update lead
- `leads.delete` - Delete lead
- `leads.batchCreate` - Batch create from Excel

### Feedback
- `feedback.list` - Get feedback for a lead
- `feedback.create` - Add feedback to lead

### Dashboard
- `dashboard.stats` - Get statistics
- `dashboard.upcoming` - Get upcoming follow-ups

### Users (Admin Only)
- `users.list` - List all users
- `users.create` - Create new user
- `users.update` - Update user
- `users.delete` - Delete user
- `users.resetPassword` - Reset user password

---

## Deployment

### Building for Production

```bash
pnpm build
```

This creates:
- `dist/` - Compiled server code
- `client/dist/` - Compiled frontend code

### Environment Variables

Required environment variables for production:

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secure-secret-key
NODE_ENV=production
```

### Running in Production

```bash
pnpm start
```

The application will listen on port 3000 by default.

### Deployment Platforms

The application is compatible with:
- **Manus** (Recommended - built-in hosting)
- **Railway**
- **Render**
- **Heroku**
- **Docker** (custom Dockerfile can be created)

---

## Troubleshooting

### Login Issues

- **"Username or password incorrect"**: Check credentials
- **"User not found"**: Register a new account first
- **Session cookie issues**: Clear browser cookies and try again

### Lead Import Issues

- **"File format not supported"**: Use .xlsx, .xls, or .csv
- **"No data found"**: Ensure Excel file has data in the first sheet
- **"Duplicate phone numbers"**: System skips duplicate phone numbers

### Database Connection Issues

- **"Cannot connect to database"**: Verify `DATABASE_URL` is correct
- **"Table doesn't exist"**: Run migrations (already done)
- **"Permission denied"**: Check database user permissions

---

## Performance Tips

1. **Search**: Use search to filter large lead lists
2. **Batch Import**: Import multiple leads at once instead of one-by-one
3. **Caching**: The app caches data locally - refresh if needed
4. **Mobile**: Use PWA for better mobile performance

---

## Security Best Practices

1. **Change Default Password**: Create strong admin password on first login
2. **Regular Backups**: Backup database regularly
3. **HTTPS**: Always use HTTPS in production
4. **Session Timeout**: Sessions expire after 7 days
5. **User Roles**: Only admins can manage users

---

## Support & Documentation

- **Frontend Guide**: See `webdev-readme-fullstack` in project
- **Database Schema**: See `drizzle/schema.ts`
- **API Routes**: See `server/routers.ts`
- **Components**: See `client/src/components/`

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Wouter
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL, Drizzle ORM
- **Authentication**: JWT, bcryptjs
- **UI Components**: shadcn/ui, Recharts, Sonner
- **Build**: Vite, esbuild
- **Testing**: Vitest
- **PWA**: Service Worker, Web Manifest

---

## License

This project is provided as-is for use within Nile Leaders.

---

**Last Updated**: July 12, 2026
**Version**: 1.0.0
