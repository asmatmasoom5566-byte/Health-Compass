# PostgreSQL Database Setup Guide

## 🎯 Problem Solved

This guide sets up a **shared PostgreSQL database** that both your **localhost** and **Netlify deployment** will use, solving:
- ✅ Invite codes generated on Netlify work on localhost (and vice versa)
- ✅ Users registered in either environment appear in both dashboards
- ✅ All data is synchronized in real-time
- ✅ Persistent storage that survives server restarts

---

## 📋 Step-by-Step Setup

### STEP 1: Create PostgreSQL Database (Neon.tech - FREE)

1. **Go to [Neon.tech](https://neon.tech)**
2. **Sign up** with GitHub or email
3. **Create a new project:**
   - Project name: `asmat-medical-app`
   - Database name: `asmat_db`
   - Region: Choose closest to you (e.g., `Virginia` for US, `Frankfurt` for EU)
4. **Get your connection string:**
   - Dashboard → Your Project → Connection Details
   - Copy the **Connection String** (looks like: `postgresql://user:password@host/dbname`)

---

### STEP 2: Add DATABASE_URL to Netlify

1. **Go to Netlify Dashboard** → Your Site
2. **Site configuration** → **Environment variables**
3. **Add variable:**------
   ```
   KEY: DATABASE_URL
   VALUE: (paste your Neon connection string)
   ```
4. **Save** and **Redeploy** your site

---

### STEP 3: Add DATABASE_URL to Local Development

Create or update your `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/dbname
```

Replace with your actual Neon connection string.

---

### STEP 4: Run Database Migrations

The database tables need to be created. Run:

```bash
npm run db:push
```

This will create all necessary tables:
- `users` - User accounts
- `invite_codes` - Registration invite codes
- `verification_tokens` - Email/phone verification
- `user_status_audit` - Admin action logs
- `causes` - Medical conditions
- `search_history` - User searches
- `analysis_sessions` - Diagnostic sessions

---

### STEP 5: Test the Setup

#### Local Development:
```bash
npm run dev
```
Visit: `http://localhost:5000`

#### Netlify Deployment:
Your site should automatically redeploy with the new DATABASE_URL.

#### Verify Both Environments:
1. **Login on localhost** with: `0784690946` / `asmat334499`
2. **Generate an invite code** on localhost
3. **Login on Netlify** with same credentials
4. **Check if the invite code appears** on Netlify admin dashboard
5. ✅ If it appears → **Database sharing is working!**

---

## 🔧 Files Changed

### Created:
- `server/storage-database.ts` - Database storage implementation for localhost
- `netlify/functions/db-storage.ts` - Database storage for Netlify functions
- `netlify/functions/auth-simple.ts` - Updated to use PostgreSQL (replaced in-memory)

### Modified:
- `server/storage.ts` - Now uses database when DATABASE_URL is available

---

## 📊 Architecture Overview

### Before (In-Memory):
```
Localhost (RAM)     Netlify (RAM)
  [Data A]            [Data B]
     ❌ NO SHARING ❌
```

### After (PostgreSQL):
```
Localhost  ──┐
              ├──→ [PostgreSQL Database] ←── Netlify
Netlify    ──┘         ✅ SHARED DATA ✅
```

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL must be set in production"
**Fix:** Add DATABASE_URL to Netlify environment variables (Step 2)

### Error: "Connection refused" or "ECONNREFUSED"
**Fix:** 
1. Check DATABASE_URL is correct
2. Ensure Neon database is active
3. Check firewall settings

### Error: "relation does not exist"
**Fix:** Run `npm run db:push` to create tables

### Data not syncing between environments
**Fix:**
1. Verify both use the SAME DATABASE_URL
2. Check Netlify logs for connection errors
3. Restart localhost server

---

## 🎉 Success Indicators

✅ Both environments show same users
✅ Invite codes work across both platforms
✅ Admin changes on localhost appear on Netlify
✅ Database persists after server restarts
✅ No "Invalid invite code" errors

---

## 💡 Next Steps

After setup is complete:
1. Test registration flow on both environments
2. Verify admin dashboard shows consistent data
3. Monitor database usage in Neon dashboard
4. Consider setting up database backups

---

## 📞 Need Help?

If you encounter issues:
1. Check Netlify function logs
2. Check localhost console output
3. Verify DATABASE_URL is identical in both places
4. Ensure migrations have been run

---

**Database sharing is now enabled! Both localhost and Netlify will use the same PostgreSQL database.** 🚀
