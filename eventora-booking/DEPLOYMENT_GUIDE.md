# 🚀 Eventora Deployment Guide

This guide will help you deploy your Eventora application to production.

## 📋 Prerequisites

1. **GitHub Account** (for code hosting)
2. **MongoDB Atlas Account** (free tier available)
3. **Vercel Account** (for frontend - free)
4. **Render/Railway Account** (for backend - free tier available)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (choose FREE tier)
4. Create a database user:
   - Go to **Database Access** → **Add New Database User**
   - Username: `eventora-admin`
   - Password: Create a strong password (save it!)
   - Database User Privileges: **Read and write to any database**
5. Whitelist IP Address:
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (0.0.0.0/0) for development
6. Get Connection String:
   - Go to **Clusters** → Click **Connect**
   - Choose **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://eventora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority`

---

## 🔧 Step 2: Update Frontend for Production

### 2.1 Create Environment Variables File

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
```

### 2.2 Update API Calls

The frontend should use `import.meta.env.VITE_API_URL` instead of hardcoded URLs.

---

## 🌐 Step 3: Deploy Backend (Render/Railway)

### Option A: Deploy to Render (Recommended - Free Tier)

1. **Create Account**: Go to [Render](https://render.com) and sign up with GitHub

2. **Create New Web Service**:
   - Click **New +** → **Web Service**
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service**:
   - **Name**: `eventora-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://eventora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d
   GOOGLE_CLIENT_ID=818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
   SENDGRID_API_KEY=your-sendgrid-api-key-if-using-email
   ```

5. **Deploy**: Click **Create Web Service**

6. **Get Backend URL**: After deployment, you'll get a URL like `https://eventora-backend.onrender.com`

### Option B: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Add environment variables (same as Render)
6. Railway will auto-detect Node.js and deploy

---

## 🎨 Step 4: Deploy Frontend (Vercel)

1. **Create Account**: Go to [Vercel](https://vercel.com) and sign up with GitHub

2. **Import Project**:
   - Click **Add New** → **Project**
   - Import your GitHub repository

3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   VITE_GOOGLE_CLIENT_ID=818746544645-tik4d3p74emie41cuhtk5tctv4ftnrbr.apps.googleusercontent.com
   ```

5. **Deploy**: Click **Deploy**

6. **Get Frontend URL**: After deployment, you'll get a URL like `https://eventora.vercel.app`

---

## 🔄 Step 5: Update CORS Settings

Update `backend/server.js` to allow your frontend domain:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend-url.vercel.app',
    'http://localhost:5173' // for local development
  ],
  credentials: true
}));
```

---

## ✅ Step 6: Verify Deployment

1. **Test Backend**: Visit `https://your-backend-url.onrender.com` - should show API welcome message
2. **Test Frontend**: Visit your Vercel URL
3. **Test Features**:
   - User registration/login
   - Event browsing
   - Booking flow
   - Admin login

---

## 🔐 Step 7: Create Admin User

After deployment, you need to create an admin user in MongoDB:

1. Go to MongoDB Atlas → **Browse Collections**
2. Find your database → `users` collection
3. Insert a new document:
```json
{
  "name": "Admin User",
  "email": "your-admin-email@example.com",
  "password": "$2a$10$hashedpassword...", // You'll need to hash the password
  "role": "admin",
  "isVerified": true,
  "provider": "local",
  "isActive": true
}
```

**OR** use MongoDB Compass or a script to create the admin user with hashed password.

---

## 📝 Quick Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Backend deployed to Render/Railway
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured for frontend domain
- [ ] Admin user created in database
- [ ] Test all features on production

---

## 🆘 Troubleshooting

### Backend Issues:
- **Connection Error**: Check MongoDB connection string and IP whitelist
- **Port Error**: Ensure PORT environment variable is set
- **Build Fails**: Check Node.js version (should be 18+)

### Frontend Issues:
- **API Calls Fail**: Check VITE_API_URL is correct
- **CORS Error**: Update backend CORS settings
- **Build Fails**: Check for TypeScript/ESLint errors

---

## 🔗 Useful Links

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Render](https://render.com)
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)

---

## 📞 Support

If you encounter issues, check:
1. Backend logs in Render/Railway dashboard
2. Frontend build logs in Vercel dashboard
3. MongoDB Atlas connection logs

Good luck with your deployment! 🎉

