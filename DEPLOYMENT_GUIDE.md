# 🚀 CodeGalaxy Deployment Guide

Complete step-by-step guide to deploy CodeGalaxy to Vercel with MongoDB Atlas.

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account
- [ ] Vercel account (free tier is fine)
- [ ] MongoDB Atlas account (free tier is fine)
- [ ] Git installed on your computer
- [ ] Your code ready to push

---

## Part 1: Set Up MongoDB Atlas (Database)

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"**
3. Sign up with Google/GitHub or email
4. Choose **"Free Shared"** tier (M0)
5. Select your preferred cloud provider and region (choose closest to your users)
6. Name your cluster (e.g., "CodeGalaxy")
7. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 2: Create Database User

1. In Atlas dashboard, click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `codegalaxy_user` (or your choice)
5. Click **"Autogenerate Secure Password"** - **SAVE THIS PASSWORD!**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

### Step 3: Whitelist IP Addresses

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
   - ⚠️ This is required for Vercel deployment
4. Click **"Confirm"**

### Step 4: Get Connection String

1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Python"** and **"3.6 or later"**
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://codegalaxy_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add `/codegalaxy` before the `?` to specify database name:
   ```
   mongodb+srv://codegalaxy_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/codegalaxy?retryWrites=true&w=majority
   ```

**Save this complete connection string - you'll need it!**

---

## Part 2: Prepare Your Code for GitHub

### Step 1: Initialize Git Repository

Open terminal in your project folder:

```bash
cd /path/to/CodeGalaxy---OJT
git init
```

### Step 2: Add All Files

```bash
git add .
```

### Step 3: Create First Commit

```bash
git commit -m "Initial commit: CodeGalaxy productivity app"
```

### Step 4: Create GitHub Repository

1. Go to https://github.com
2. Click the **"+"** icon (top right)
3. Select **"New repository"**
4. Name it: `CodeGalaxy` (or your choice)
5. Keep it **Public** (or Private if you prefer)
6. **DO NOT** initialize with README (you already have one)
7. Click **"Create repository"**

### Step 5: Push to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/CodeGalaxy.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Part 3: Deploy to Vercel

### Step 1: Sign Up for Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

### Step 2: Import Your Project

1. On Vercel dashboard, click **"Add New..."**
2. Select **"Project"**
3. Find your `CodeGalaxy` repository
4. Click **"Import"**

### Step 3: Configure Project Settings

1. **Framework Preset**: Select **"Other"** (Vercel will auto-detect Flask)
2. **Root Directory**: Leave as `./` (root)
3. **Build Command**: Leave empty (not needed for Python)
4. **Output Directory**: Leave empty

### Step 4: Add Environment Variables

**This is the most important step!**

1. Scroll down to **"Environment Variables"**
2. Add the following:

   **Variable 1:**
   - Name: `MONGODB_URI`
   - Value: Paste your complete MongoDB connection string from Part 1, Step 4
   - Example: `mongodb+srv://codegalaxy_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/codegalaxy?retryWrites=true&w=majority`
   
3. Select **"Production"**, **"Preview"**, and **"Development"** (check all three)
4. Click **"Add"**

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your live URL
4. Click **"Visit"** to see your app! 🎉

Your app will be live at: `https://your-project-name.vercel.app`

---

## Part 4: Verify Everything Works

### Test Checklist

Visit your deployed app and test:

1. **Homepage Loads** ✓
   - You should see the CodeGalaxy interface
   - Galaxy background animation should be visible

2. **Create a Task** ✓
   - Click "+ Add Task"
   - Fill in details
   - Click "Save Task"
   - Task should appear in the list

3. **Complete a Task** ✓
   - Click the checkbox next to a task
   - You should see a success message with ⭐
   - Scroll down to see a new bright white star in your galaxy!

4. **Focus Timer** ✓
   - Click a preset duration (15m, 25m, 45m)
   - Click "Start Focus"
   - Wait for timer (or let it run)
   - When complete, a colored star should appear

5. **Statistics** ✓
   - Check that task count updates
   - Check that focus time updates
   - Check that streak updates

6. **Calendar** ✓
   - Navigate months
   - Add an event
   - Event should appear on calendar

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Failed to connect to MongoDB"

**Symptoms**: App loads but features don't work, console shows MongoDB errors

**Solutions**:
1. Check Vercel environment variables:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Verify `MONGODB_URI` is set correctly
   - Make sure there are no extra spaces or quotes
   
2. Check MongoDB Atlas:
   - Go to Atlas → Network Access
   - Verify `0.0.0.0/0` is in the IP whitelist
   - Go to Database Access
   - Verify your user has "Read and write" permissions

3. Test connection string:
   - Copy your connection string
   - Replace `<password>` with actual password
   - Make sure `/codegalaxy` is before the `?`

### Issue 2: "Application Error" or 500 Error

**Solutions**:
1. Check Vercel deployment logs:
   - Go to Vercel dashboard → Your project → Deployments
   - Click on the latest deployment
   - Check the "Build Logs" and "Function Logs"

2. Common causes:
   - Missing `api/index.py` file
   - Incorrect `vercel.json` configuration
   - Missing dependencies in `requirements.txt`

3. Redeploy:
   - Go to Vercel dashboard → Your project → Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

### Issue 3: Stars Not Appearing

**Solutions**:
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if `/api/galaxy/data` returns data:
   - Visit: `https://your-app.vercel.app/api/galaxy/data`
   - Should return JSON array (might be empty at first)

4. Complete a task and check again
5. If still not working, check MongoDB connection

### Issue 4: Static Files Not Loading (CSS/JS)

**Solutions**:
1. Check that `frontend/static/` folder exists
2. Verify `vercel.json` routes are correct
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check Vercel function logs for 404 errors

---

## 🔄 Updating Your Deployed App

When you make changes to your code:

### Method 1: Automatic Deployment (Recommended)

1. Make changes to your code locally
2. Commit changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
3. Push to GitHub:
   ```bash
   git push
   ```
4. Vercel automatically detects the push and redeploys!
5. Wait 2-3 minutes, then check your live site

### Method 2: Manual Deployment

1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click "..." on any deployment
5. Click "Redeploy"

---

## 📊 Monitoring Your App

### Check App Health

Visit: `https://your-app.vercel.app/status`

Should return:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### View Logs

1. Vercel Dashboard → Your Project → Logs
2. Filter by:
   - Errors (to see problems)
   - All (to see all requests)

### Monitor MongoDB Usage

1. MongoDB Atlas Dashboard
2. Click on your cluster
3. View "Metrics" tab
4. Check:
   - Connections
   - Operations per second
   - Storage usage

---

## 🎯 Performance Tips

### 1. MongoDB Indexes
Already set up automatically! The app creates indexes on:
- `tasks` by user_id and date
- `sessions` by user_id and started_at
- `celestial_objects` by user_id and created_at

### 2. Connection Pooling
Already configured with:
- Max pool size: 50 connections
- Connection timeout: 10 seconds
- Socket timeout: 20 seconds

### 3. Caching
Consider adding:
- Browser caching for static files
- Redis for session caching (future enhancement)

---

## 🔐 Security Best Practices

### ✅ Already Implemented:
- Environment variables for sensitive data
- CORS configuration
- MongoDB connection with authentication
- No hardcoded credentials

### 🔒 Additional Recommendations:
1. **Enable MongoDB encryption at rest** (in Atlas settings)
2. **Use strong passwords** for database users
3. **Regularly rotate credentials**
4. **Monitor access logs** in MongoDB Atlas
5. **Set up alerts** for unusual activity

---

## 📈 Scaling Your App

### When You Need to Scale:

**Signs you need to upgrade:**
- More than 500 active users
- MongoDB free tier storage (512 MB) is full
- Slow response times

**Upgrade Options:**

1. **MongoDB Atlas**:
   - Upgrade to M10 tier ($0.08/hour)
   - More storage and RAM
   - Better performance

2. **Vercel**:
   - Free tier is generous (100GB bandwidth/month)
   - Pro tier if you need more

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] MongoDB Atlas cluster is running
- [ ] Database user created with correct permissions
- [ ] IP whitelist includes 0.0.0.0/0
- [ ] Connection string is correct and saved
- [ ] Code is pushed to GitHub
- [ ] Vercel project is created
- [ ] Environment variables are set in Vercel
- [ ] App is deployed successfully
- [ ] Homepage loads correctly
- [ ] Can create and complete tasks
- [ ] Stars appear in galaxy
- [ ] Focus timer works
- [ ] Calendar functions properly
- [ ] Statistics update correctly

---

## 🆘 Need Help?

### Resources:
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Vercel Docs**: https://vercel.com/docs
- **Flask Docs**: https://flask.palletsprojects.com/

### Common Support Links:
- MongoDB Atlas Support: https://support.mongodb.com/
- Vercel Support: https://vercel.com/support
- GitHub Issues: Create an issue in your repository

---

## 🎉 Success!

If you've followed all steps and everything works, congratulations! 🎊

Your CodeGalaxy app is now:
- ✅ Live on the internet
- ✅ Connected to MongoDB Atlas
- ✅ Automatically deploying on every push
- ✅ Creating stars for every achievement

**Share your deployed app and start building your galaxy!** 🌌✨

---

**Last Updated**: December 2025
**Version**: 1.0.0

