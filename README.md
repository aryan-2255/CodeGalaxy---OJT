# 🌌 CodeGalaxy - Productivity Tracker

Transform your daily tasks and focus sessions into a beautiful, growing galaxy. Every completed task and focus session creates a star in your personal universe!

![CodeGalaxy](https://img.shields.io/badge/Flask-3.0.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)

## ✨ Features

- **📝 Task Management**: Create, organize, and complete tasks across multiple categories (Personal, Work, Life, Study)
- **⏱️ Focus Timer**: Pomodoro-style timer with preset durations (15m, 25m, 45m) or custom times
- **🎵 Mood-Based Music**: Local audio player with mood selections (Focus, Calm, Chill, Energy, Deep Work, Night)
- **📅 Calendar Integration**: Visual calendar with event scheduling
- **🌟 Galaxy Visualization**: Watch your galaxy grow with every achievement
  - **Task completion creates bright white stars** ⭐
  - **Focus sessions create colored celestial bodies** (stars, planets, comets)
- **📊 Statistics Dashboard**: Track completion rates, focus time, and daily streaks
- **🎨 Constellation Presets**: Arrange your stars in beautiful patterns (Cassiopeia, Grid, Lyra, Orion)
- **💾 Layout Saving**: Drag & drop stars and save custom arrangements

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.11 or higher
- MongoDB Atlas account (free tier works great!)
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd CodeGalaxy---OJT
```

### 2. Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/codegalaxy?retryWrites=true&w=majority
```

### 6. Run the Application

```bash
python -m backend.app
```

Visit `http://localhost:3000` in your browser! 🎉

## 🌐 Deploy to Vercel

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: CodeGalaxy productivity app"
```

2. **Push to GitHub**:
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/codegalaxy.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up MongoDB Atlas for Production

1. Go to your MongoDB Atlas dashboard
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (0.0.0.0/0) - Required for Vercel
5. Save

### Step 3: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com/)** and sign in with GitHub

2. **Import Your Repository**:
   - Click "New Project"
   - Select your CodeGalaxy repository
   - Click "Import"

3. **Configure Environment Variables**:
   - In the Vercel project settings, go to **Environment Variables**
   - Add the following:
     ```
     Key: MONGODB_URI
     Value: mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/codegalaxy?retryWrites=true&w=majority
     ```
   - Apply to: Production, Preview, and Development

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Step 4: Verify Deployment

1. Visit your Vercel URL
2. Create a task and complete it - a star should appear! ⭐
3. Try the focus timer
4. Check the galaxy visualization

## 📁 Project Structure

```
CodeGalaxy---OJT/
├── api/
│   └── index.py              # Vercel entry point
├── backend/
│   ├── app.py                # Flask application factory
│   ├── routes/               # API endpoints
│   │   ├── tasks.py          # Task CRUD + completion (creates stars!)
│   │   ├── sessions.py       # Focus session management
│   │   ├── galaxy.py         # Galaxy/celestial objects
│   │   ├── stats.py          # Statistics & analytics
│   │   ├── calendar.py       # Calendar events
│   │   ├── music.py          # Music player
│   │   ├── moods.py          # Mood management
│   │   └── status.py         # Health check
│   ├── utils/
│   │   ├── db.py             # MongoDB connection
│   │   └── star_logic.py     # Star generation algorithm
│   ├── seeds/                # Data seeding scripts
│   └── static/audio/         # Local audio files
├── frontend/
│   ├── templates/
│   │   └── index.html        # Main UI
│   └── static/
│       ├── css/              # Stylesheets
│       ├── js/               # JavaScript modules
│       └── media/            # Audio files
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── requirements.txt          # Python dependencies
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

## 🔧 API Endpoints

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/<id>` - Update task
- `DELETE /api/tasks/<id>` - Delete task
- `PATCH /api/tasks/<id>/complete` - **Complete task & create star** ⭐

### Sessions
- `POST /sessions` - Create focus session + celestial object
- `GET /sessions/today` - Get today's sessions

### Galaxy
- `GET /api/galaxy/data` - Get all celestial objects
- `POST /api/galaxy/stars` - Bulk create stars
- `DELETE /api/galaxy/stars` - Bulk delete stars
- `POST /api/galaxy/reset` - Reset entire galaxy
- `GET /api/galaxy/layout` - Get star positions
- `POST /api/galaxy/layout` - Save star positions
- `GET /api/constellations` - Get preset constellations

### Statistics
- `GET /stats/summary` - Dashboard overview
- `GET /stats/streak` - Current streak
- `GET /stats/weekly` - Weekly focus minutes

### Calendar
- `GET /api/calendar` - List events
- `POST /api/calendar` - Create event
- `DELETE /api/calendar/<id>` - Delete event

## 🎨 How Stars Are Created

### Task Completion Stars ⭐
When you complete a task:
- **Color**: Bright white (`#F7F7FF`)
- **Size**: Small star (15-minute equivalent)
- **Type**: `star`
- **Metadata**: Includes task title, category, and ID

### Focus Session Stars 🌟
When you complete a focus session:
- **Color**: Based on mood (Focus, Calm, Energy, etc.)
- **Size**: Varies by duration
  - < 10 min → tiny_star
  - 10-30 min → star
  - 30-60 min → planet
  - > 60 min → comet
- **Type**: Dynamic based on duration
- **Metadata**: Includes session duration and mood

## 🛠️ Technologies Used

- **Backend**: Flask 3.0.0, Python 3.11+
- **Database**: MongoDB Atlas
- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Deployment**: Vercel
- **Audio**: Local WAV/MP3 files

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Problem**: "Failed to connect to MongoDB"

**Solutions**:
1. Check your `MONGODB_URI` in `.env` or Vercel environment variables
2. Verify your MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Ensure your database user has read/write permissions
4. Check that your connection string includes the database name

### Stars Not Appearing

**Problem**: Tasks complete but no stars appear

**Solutions**:
1. Check browser console for errors (F12)
2. Verify MongoDB connection is working (`/status` endpoint)
3. Clear browser cache and refresh
4. Check that `/api/galaxy/data` returns celestial objects

### Vercel Deployment Fails

**Problem**: Build fails on Vercel

**Solutions**:
1. Ensure `requirements.txt` has all dependencies
2. Check that `api/index.py` exists
3. Verify `vercel.json` is properly configured
4. Check Vercel build logs for specific errors

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes | `mongodb://localhost:27017/codegalaxy` (dev) |
| `FLASK_ENV` | Flask environment | No | `production` |
| `FLASK_DEBUG` | Enable debug mode | No | `False` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by the beauty of the cosmos
- Built with love for productivity enthusiasts
- Special thanks to the Flask and MongoDB communities

---

**Made with ❤️ and ☕ by CodeGalaxy Team**

🌟 **Star this repo if you found it helpful!** 🌟
