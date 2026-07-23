# 🚀 Quick Deployment Steps

## Step-by-Step Deployment Guide

### 1️⃣ Get MongoDB Connection String (2 minutes)

**If you already have MongoDB Atlas account and cluster** (like you do):
1. Go to https://cloud.mongodb.com
2. Select your existing cluster
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add `/eventora` before the `?` in the connection string
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority`

**If you don't have MongoDB yet**:
1. Go to https://www.mongodb.com/cloud/atlas → Sign up (FREE)
2. Create a cluster → Choose FREE tier
3. **Database Access**: Create user (username + password)
4. **Network Access**: Add IP `0.0.0.0/0` (Allow from anywhere)
5. Get connection string as above

---

### 2️⃣ Deploy Backend to Render (10 minutes)

1. Go to https://render.com → Sign up with GitHub
2. **New +** → **Web Service**
3. Connect your GitHub repo
4. **Settings**:
   - Name: `eventora-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**
5. **Environment Variables** (Add these):
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://eventora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   JWT_EXPIRE=30d
   GOOGLE_CLIENT_ID=818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
   ```
6. Click **Create Web Service**
7. Wait for deployment (5-10 minutes)
8. **Copy your backend URL**: `https://eventora-backend.onrender.com`

---

### 3️⃣ Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com → Sign up with GitHub
2. **Add New** → **Project**
3. Import your GitHub repository
4. **Configure**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://eventora-backend.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
   ```
6. Click **Deploy**
7. Wait for deployment (2-3 minutes)
8. **Copy your frontend URL**: `https://eventora.vercel.app`

---

### 4️⃣ Update Backend CORS (2 minutes)

1. Go back to Render dashboard
2. Edit your backend service
3. Add environment variable:
   ```
   FRONTEND_URL=https://eventora.vercel.app
   ```
4. Redeploy (or it will auto-redeploy)

---

### 5️⃣ Create Admin User in MongoDB

**Option A: Using MongoDB Atlas Web Interface**

1. Go to MongoDB Atlas → **Browse Collections**
2. Select your database → `users` collection
3. Click **Insert Document**
4. Use this JSON (password will be hashed automatically on first login):
```json
{
  "name": "Admin User",
  "email": "your-admin-email@example.com",
  "password": "your-secure-password",
  "role": "admin",
  "isVerified": true,
  "provider": "local",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Option B: Create via API (Recommended)**

After backend is deployed, you can create admin user by:
1. Sign up normally with `your-admin-email@example.com`
2. Then update the user role to `admin` in MongoDB Atlas

---

### 6️⃣ Test Your Deployment

1. ✅ Visit frontend URL → Should load
2. ✅ Visit backend URL → Should show API welcome message
3. ✅ Test user registration
4. ✅ Test login
5. ✅ Test admin login: `your-admin-email@example.com` / `your-secure-password`
6. ✅ Test event browsing
7. ✅ Test booking flow

---

## 🎯 Your URLs After Deployment

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://eventora-backend.onrender.com`
- **API Base**: `https://eventora-backend.onrender.com/api`

---

## ⚠️ Important Notes

1. **Free Tier Limitations**:
   - Render: Backend sleeps after 15 min inactivity (first request takes ~30s)
   - Vercel: 100GB bandwidth/month (usually enough)
   - MongoDB Atlas: 512MB storage (enough for thousands of events)

2. **First Request Delay**: 
   - Render free tier spins down after inactivity
   - First request after sleep takes 30-60 seconds
   - Consider upgrading to paid tier for production

3. **Environment Variables**:
   - Never commit `.env` files to GitHub
   - Always set them in deployment platform

4. **Admin Access**:
   - Only `your-admin-email@example.com` can access admin panel
   - Password: `your-secure-password`

---

## 🆘 Troubleshooting

**Backend not starting?**
- Check Render logs
- Verify MongoDB connection string
- Check all environment variables are set

**Frontend can't connect to backend?**
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Check backend is running (visit backend URL)

**CORS errors?**
- Update `FRONTEND_URL` in backend environment variables
- Restart backend service

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured
- [ ] Admin user created
- [ ] All features tested

**You're all set! 🎉**

