# 🚀 Deployment Guide - Using Your Existing MongoDB

Since you already have a MongoDB Atlas account and cluster, we'll use that! Here's how to deploy everything for FREE.

---

## 📋 Step 1: Get Your MongoDB Connection String (2 minutes)

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Select your existing cluster**
3. **Click "Connect"** button
4. **Choose "Connect your application"**
5. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Important**: Replace `<password>` with your actual database user password
7. **Add database name**: Add `/eventora` before the `?` in the connection string
   - Final format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority`

**Save this connection string** - you'll need it in Step 2!

---

## 🌐 Step 2: Deploy Backend to Render (FREE) (10 minutes)

### 2.1 Create Render Account
1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended) or email

### 2.2 Create Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. **Connect your GitHub repository**:
   - If not connected, click "Configure account" and authorize Render
   - Select your repository containing the Eventora project
   - Click **"Connect"**

### 2.3 Configure Service Settings
Fill in these details:

- **Name**: `eventora-backend` (or any name you like)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or `master`)
- **Root Directory**: `backend` ⚠️ **IMPORTANT: Set this!**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Select **"Free"** ✅

### 2.4 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add these:

```
NODE_ENV = production
```

```
PORT = 10000
```

```
MONGO_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority
```
⚠️ **Replace with YOUR actual connection string from Step 1!**

```
JWT_SECRET = your-super-secret-jwt-key-minimum-32-characters-long-change-this
```
💡 **Tip**: Use a long random string. You can generate one at: https://randomkeygen.com/

```
JWT_EXPIRE = 30d
```

```
GOOGLE_CLIENT_ID = 818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
```

### 2.5 Deploy
1. Scroll down and click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll see: **"Your service is live at https://eventora-backend.onrender.com"**
4. **Copy this URL** - this is your backend URL!

---

## 🎨 Step 3: Deploy Frontend to Vercel (FREE) (5 minutes)

### 3.1 Create Vercel Account
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended)

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. **Import Git Repository**:
   - Select your Eventora repository
   - Click **"Import"**

### 3.3 Configure Project
Fill in these settings:

- **Framework Preset**: `Vite` (should auto-detect)
- **Root Directory**: `frontend` ⚠️ **IMPORTANT: Click "Edit" and set this!**
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

### 3.4 Add Environment Variables
Click **"Environment Variables"** and add:

```
VITE_API_URL = https://eventora-backend.onrender.com/api
```
⚠️ **Replace `eventora-backend.onrender.com` with YOUR actual backend URL from Step 2!**

```
VITE_GOOGLE_CLIENT_ID = 818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
```

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Once deployed, you'll get a URL like: `https://eventora-xxxxx.vercel.app`
4. **Copy this URL** - this is your frontend URL!

---

## 🔄 Step 4: Update Backend CORS (2 minutes)

1. Go back to **Render dashboard**
2. Click on your backend service
3. Go to **"Environment"** tab
4. Add new environment variable:
   ```
   FRONTEND_URL = https://eventora-xxxxx.vercel.app
   ```
   ⚠️ **Replace with YOUR actual frontend URL from Step 3!**
5. Click **"Save Changes"**
6. Render will automatically redeploy (or click "Manual Deploy" → "Deploy latest commit")

---

## 👤 Step 5: Create Admin User (5 minutes)

You need to create an admin user in your MongoDB database. Choose one method:

### **Method A: Using MongoDB Atlas Web Interface** (Easiest)

1. Go to **MongoDB Atlas** → Your cluster
2. Click **"Browse Collections"**
3. If no database exists, click **"Create Database"**
   - Database name: `eventora`
   - Collection name: `users`
4. Click **"Insert Document"**
5. Click **"{}"** (JSON view)
6. Paste this JSON:
```json
{
  "name": "Admin User",
  "email": "your-admin-email@example.com",
  "password": "$2a$10$rQ8K8K8K8K8K8K8K8K8K8u8K8K8K8K8K8K8K8K8K8K8K8K8K8K",
  "role": "admin",
  "isVerified": true,
  "provider": "local",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

⚠️ **Problem**: The password needs to be hashed. Use Method B instead!

### **Method B: Create via API** (Recommended)

1. **Visit your frontend URL** (from Step 3)
2. **Sign up** with email: `your-admin-email@example.com` and password: `your-secure-password`
3. **Verify your email** (if email verification is enabled)
4. **Go to MongoDB Atlas** → Browse Collections → `users` collection
5. **Find your user document** (with email `your-admin-email@example.com`)
6. **Click "Edit"** on that document
7. **Change the `role` field** from `"user"` to `"admin"`
8. **Click "Update"**

✅ Done! Now you can login as admin.

---

## ✅ Step 6: Test Everything (5 minutes)

1. **Test Frontend**: 
   - Visit your Vercel URL
   - Should load the homepage ✅

2. **Test Backend**: 
   - Visit your Render URL (e.g., `https://eventora-backend.onrender.com`)
   - Should show: `{"success":true,"message":"Welcome to Eventora API",...}` ✅

3. **Test User Registration**:
   - Go to frontend → Sign up
   - Create a test account ✅

4. **Test Login**:
   - Login with your test account ✅

5. **Test Admin Login**:
   - Go to frontend → Click "Admin Login" link
   - Login with: `your-admin-email@example.com` / `your-secure-password`
   - Should access admin dashboard ✅

6. **Test Event Browsing**:
   - Browse events on homepage ✅

7. **Test Booking**:
   - Click on an event → Select seats → Make booking ✅

---

## 🎯 Your Deployment URLs

After deployment, you'll have:

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://eventora-backend.onrender.com`
- **API Base**: `https://eventora-backend.onrender.com/api`

---

## 💰 All FREE Tier Limits

### **Render (Backend)**
- ✅ Free forever
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ First request after sleep takes 30-60 seconds
- ✅ 750 hours/month free (enough for always-on)

### **Vercel (Frontend)**
- ✅ Free forever
- ✅ 100GB bandwidth/month
- ✅ Unlimited requests
- ✅ Auto-deploys from GitHub

### **MongoDB Atlas**
- ✅ Free tier (M0)
- ✅ 512MB storage
- ✅ Shared RAM
- ✅ Enough for thousands of events/bookings

---

## 🆘 Troubleshooting

### **Backend not starting?**
- Check Render logs: Go to your service → "Logs" tab
- Verify `MONGO_URI` is correct (check connection string)
- Make sure all environment variables are set

### **Frontend can't connect to backend?**
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend URL is correct (visit it directly)
- Check backend is running (Render dashboard)

### **CORS errors?**
- Make sure `FRONTEND_URL` is set in backend environment variables
- Restart backend service in Render

### **Admin login not working?**
- Verify user exists in MongoDB with `role: "admin"`
- Check email is exactly: `your-admin-email@example.com`
- Try resetting password if needed

### **MongoDB connection failed?**
- Check your IP is whitelisted in MongoDB Atlas (Network Access)
- Verify connection string has correct password
- Make sure database name is in connection string (`/eventora`)

---

## ✅ Deployment Checklist

- [ ] Got MongoDB connection string from existing cluster
- [ ] Backend deployed to Render (FREE)
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel (FREE)
- [ ] Frontend environment variables set
- [ ] CORS updated with frontend URL
- [ ] Admin user created in MongoDB
- [ ] All features tested

---

## 🎉 You're All Set!

Your Eventora app is now live on the internet! Share your frontend URL with others.

**Need help?** Check the logs in Render/Vercel dashboards for error messages.

