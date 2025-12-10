# ⚡ Quick Start Guide - CodeGalaxy

Get CodeGalaxy running in 5 minutes!

## 🎯 For Local Development

### 1. Clone & Setup (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd CodeGalaxy---OJT

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure MongoDB (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codegalaxy
```

### 3. Run! (30 seconds)

```bash
python -m backend.app
```

Visit: **http://localhost:3000** 🎉

---

## 🚀 For Vercel Deployment

### Prerequisites
- GitHub account
- Vercel account
- MongoDB Atlas account (free tier)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/codegalaxy.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable:
     - `MONGODB_URI` = your MongoDB Atlas connection string
   - Click "Deploy"

3. **Done!**
   - Your app is live at: `https://your-project.vercel.app`

---

## 📝 MongoDB Atlas Setup (2 minutes)

1. **Create Account**: https://cloud.mongodb.com
2. **Create Cluster**: Choose Free (M0) tier
3. **Create User**: Database Access → Add User → Save password
4. **Whitelist IP**: Network Access → Add IP → Allow 0.0.0.0/0
5. **Get Connection String**: 
   - Database → Connect → Connect your application
   - Copy string and replace `<password>` with your password
   - Add `/codegalaxy` before the `?`

---

## ✅ Verify It Works

1. **Create a task** → Should appear in list
2. **Complete the task** → A bright white star appears! ⭐
3. **Start focus timer** → Creates colored celestial body when done
4. **Check statistics** → Should update with your activity

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection fails | Check `.env` file has correct `MONGODB_URI` |
| Port 3000 in use | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| Stars not appearing | Check `/status` endpoint, verify MongoDB connection |
| Vercel deployment fails | Check environment variables are set |

---

## 📚 More Help

- **Full README**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Status Check**: Visit `/status` endpoint

---

**That's it! Start building your galaxy! 🌌✨**

