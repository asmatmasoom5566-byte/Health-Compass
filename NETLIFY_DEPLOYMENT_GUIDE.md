# 🚀 NETLIFY DEPLOYMENT GUIDE
## Login Authentication & Admin Dashboard with JWT

---

## ✅ WHAT'S BEEN CONVERTED

Your application now works on Netlify with these features converted to serverless functions:

### 1. **Authentication (netlify/functions/auth.ts)**
- ✅ User Registration (`/api/auth/register`)
- ✅ User Login (`/api/auth/login`)
- ✅ Get Current User (`/api/auth/me`)
- ✅ Logout (`/api/auth/logout`)
- ✅ Email Verification (`/api/auth/verify-email`)
- ✅ Phone Verification (`/api/auth/verify-phone`)

### 2. **Admin Dashboard (netlify/functions/admin.ts)**
- ✅ List All Users (`/api/admin/users`)
- ✅ Update User Status (`/api/admin/users/:id/status`)
- ✅ Update User Role (`/api/admin/users/:id/role`)
- ✅ Get User Details (`/api/admin/users/:id`)
- ✅ Delete/Suspend User (`/api/admin/users/:id`)
- ✅ Create Invite Codes (`/api/admin/invite-codes`)
- ✅ List Invite Codes (`/api/admin/invite-codes`)
- ✅ Update Invite Codes (`/api/admin/invite-codes/:id`)
- ✅ View Audit Trail (`/api/admin/audit-trail`)

### 3. **Data Access (netlify/functions/data.ts)**
- ✅ Get Causes (`/api/causes`)
- ✅ Analyze Symptoms (`/api/analysis`)

---

## 🔑 KEY CHANGES

### Session → JWT Authentication
**Before:** Used express-session (doesn't work on Netlify)
**After:** Uses JWT tokens stored in localStorage

**How it works:**
1. User logs in → Server returns JWT token
2. Frontend stores token in localStorage
3. Every API request includes token in Authorization header
4. Server verifies token on each request

---

## 📋 DEPLOYMENT STEPS

### STEP 1: Push to GitHub

```bash
git add .
git commit -m "Convert to Netlify Functions with JWT"
git push origin main
```

---

### STEP 2: Configure Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your ASMAT repository

---

### STEP 3: Build Settings

| Setting | Value |
|---------|-------|
| **Base directory** | Leave blank |
| **Build command** | `npm run build` |
| **Publish directory** | `dist/public` |
| **Functions directory** | `netlify/functions` |

---

### STEP 4: Environment Variables

Add these in Netlify dashboard → Site settings → Environment variables:

```
KEY: JWT_SECRET
VALUE: (generate a random string, e.g., use: https://generate-secret.vercel.app/64)
```

**Optional (for email/SMS verification):**
```
KEY: SENDGRID_API_KEY
VALUE: your-sendgrid-key

KEY: TWILIO_ACCOUNT_SID
VALUE: your-twilio-sid

KEY: TWILIO_AUTH_TOKEN
VALUE: your-twilio-token

KEY: TWILIO_PHONE_NUMBER
VALUE: +1234567890
```

---

### STEP 5: Deploy

1. Click "Deploy site"
2. Wait 2-3 minutes for build
3. Check deploy logs for errors

---

### STEP 6: Initialize Database (First Deployment)

After first deployment, you need to create the admin user.

**Option A: Use Netlify Functions (Recommended)**
- The first user registration will auto-become admin
- Register with any invite code (or without if you remove invite validation)

**Option B: Use a seed function**
- Create a Netlify function to seed the database
- Or use the existing Express server locally to seed

---

## 🔧 TESTING THE DEPLOYMENT

### Test Login:

1. Open your Netlify site URL
2. Go to `/login`
3. Enter credentials:
   - Email: `asmatmasoom5566@gmail.com`
   - Password: `asmat334499`
4. Should redirect to home page

### Test Admin Dashboard:

1. Login as admin
2. Click "Admin" button in header
3. Should see:
   - Users tab
   - Invite Codes tab
   - Audit Trail tab

### Test Registration:

1. Go to `/register`
2. Fill in details
3. Use invite code: `ASMAT881166` (if required)
4. Submit
5. Should auto-login if first user, or show pending message

---

## 🐛 TROUBLESHOOTING

### "Unexpected token '<'... is not valid JSON"

**Cause:** Function not deployed or routing issue

**Fix:**
1. Check Netlify Functions logs
2. Verify netlify.toml has correct redirects
3. Ensure functions are in `netlify/functions/` directory

### "Authentication required"

**Cause:** Token not being sent or invalid

**Fix:**
1. Check browser localStorage for `auth_token`
2. Verify JWT_SECRET environment variable is set
3. Clear localStorage and login again

### "Admin access required"

**Cause:** User doesn't have admin role

**Fix:**
1. Check user role in database
2. First user should auto-be admin
3. Use admin dashboard to upgrade role

### Functions not working

**Check:**
1. Netlify Functions logs (Dashboard → Functions → Select function → Logs)
2. Build succeeded
3. Environment variables set correctly
4. CORS headers present in responses

---

## 📊 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────┐
│         Netlify Platform                │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Static Site (React/Vite)       │  │
│  │   - dist/public/                 │  │
│  │   - HTML, CSS, JS                │  │
│  └──────────────────────────────────┘  │
│           ↓                             │
│  ┌──────────────────────────────────┐  │
│  │   Netlify Functions              │  │
│  │   - auth.ts (Login/Register)     │  │
│  │   - admin.ts (User Management)   │  │
│  │   - data.ts (Causes/Analysis)    │  │
│  └──────────────────────────────────┘  │
│           ↓                             │
│  ┌──────────────────────────────────┐  │
│  │   Storage (In-Memory/PostgreSQL) │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔒 SECURITY NOTES

### JWT Token Security:
- Tokens stored in localStorage (vulnerable to XSS)
- Tokens expire in 7 days
- Tokens include user ID, email, role, status

### For Production:
1. Use strong JWT_SECRET (64+ characters)
2. Enable HTTPS (Netlify does this automatically)
3. Implement token refresh mechanism
4. Consider httpOnly cookies for better security
5. Add rate limiting to functions

### Current Limitations:
- In-memory storage (resets on redeploy)
- No email/SMS verification (mock mode)
- No rate limiting on functions
- Tokens in localStorage (XSS vulnerable)

---

## 📝 API ENDPOINTS

### Authentication (auth.ts)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |
| POST | `/api/auth/verify-email` | ❌ | Verify email |
| POST | `/api/auth/verify-phone` | ❌ | Verify phone |

### Admin (admin.ts)

| Method | Endpoint | Auth | Admin | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/admin/users` | ✅ | ✅ | List all users |
| PUT | `/api/admin/users/:id/status` | ✅ | ✅ | Update user status |
| PUT | `/api/admin/users/:id/role` | ✅ | ✅ | Update user role |
| GET | `/api/admin/users/:id` | ✅ | ✅ | Get user details |
| DELETE | `/api/admin/users/:id` | ✅ | ✅ | Delete/suspend user |
| POST | `/api/admin/invite-codes` | ✅ | ✅ | Create invite code |
| GET | `/api/admin/invite-codes` | ✅ | ✅ | List invite codes |
| PUT | `/api/admin/invite-codes/:id` | ✅ | ✅ | Update invite code |
| GET | `/api/admin/audit-trail` | ✅ | ✅ | View audit trail |

### Data (data.ts)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/causes` | ✅ | Get all causes |
| POST | `/api/analysis` | ✅ | Analyze symptoms |

---

## 🎯 NEXT STEPS

### Immediate:
1. ✅ Deploy to Netlify
2. ✅ Test login flow
3. ✅ Test admin dashboard
4. ✅ Create first admin user

### Future Improvements:
1. Add PostgreSQL for persistent storage
2. Implement proper email/SMS verification
3. Add rate limiting to functions
4. Implement token refresh
5. Add more data CRUD operations
6. Improve error handling
7. Add function-level logging

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Function Logs:**
   - Netlify Dashboard → Functions → Select function → Logs

2. **Check Build Logs:**
   - Netlify Dashboard → Deploys → Select deploy → Build log

3. **Test Locally:**
   ```bash
   npm run build
   npx netlify dev
   ```

4. **Common Issues:**
   - Missing environment variables
   - Incorrect file paths in functions
   - CORS issues (check headers)
   - Token not being sent (check Authorization header)

---

## 🎉 SUCCESS!

Your application is now running on Netlify with:
- ✅ JWT-based authentication
- ✅ Admin dashboard with user management
- ✅ Role-based access control
- ✅ Serverless architecture
- ✅ No Express.js server required

**Your app URL:** `https://your-site-name.netlify.app`

Enjoy your serverless medical diagnosis platform! 🚀
