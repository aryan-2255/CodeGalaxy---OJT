// ==================== MUSIC PLAYER STATE ====================
let currentTrackIndex = 0;
let playlist = [];
let isPlaying = false;
let audioPlayer = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    audioPlayer = document.getElementById('audioPlayer');
    initializeMusicPlayer();
});

async function initializeMusicPlayer() {
    await loadPlaylist();
    setupMusicEventListeners();
}

// ==================== LOAD MUSIC ====================
async function loadPlaylist() {
    try {
        // TODO: Replace with real music API integration
        // Example: Spotify API, SoundCloud API, Free Music Archive API
        // Add your API key and endpoint here:
        // const response = await fetch('YOUR_MUSIC_API_ENDPOINT', {
        //     headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
        // });

        const response = await fetch('/api/music');
        playlist = await response.json();

        renderPlaylist();

        if (playlist.length > 0) {
            loadTrack(0);
        }
    } catch (error) {
        console.error('Error loading playlist:', error);
    }
}

function renderPlaylist() {
    const playlistContainer = document.getElementById('playlist');

    if (playlist.length === 0) {
        playlistContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No tracks available</p>';
        return;
    }

    playlistContainer.innerHTML = playlist.map((track, index) => `
        <div class="playlist-item ${index === currentTrackIndex ? 'active' : ''}" onclick="selectTrack(${index})">
            <div class="playlist-item-title">${escapeHtml(track.title)}</div>
            <div class="playlist-item-artist">${escapeHtml(track.artist)} • ${track.duration}</div>
        </div>
    `).join('');
}

// ==================== PLAYER CONTROLS ====================
function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;

    currentTrackIndex = index;
    const track = playlist[index];

    // Update UI
    document.getElementById('trackTitle').textContent = track.title;
    document.getElementById('trackArtist').textContent = track.artist;

    // Load audio
    audioPlayer.src = track.url;

    // Update playlist active state
    document.querySelectorAll('.playlist-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });

    // Auto-play if was playing
    if (isPlaying) {
        playTrack();
    }
}

function playTrack() {
    audioPlayer.play();
    isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸';
}

function pauseTrack() {
    audioPlayer.pause();
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
}

function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function nextTrack() {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(nextIndex);
    if (isPlaying) playTrack();
}

function prevTrack() {
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    loadTrack(prevIndex);
    if (isPlaying) playTrack();
}

function selectTrack(index) {
    loadTrack(index);
    playTrack();
}

// ==================== EVENT LISTENERS ====================
function setupMusicEventListeners() {
    // Play/Pause button
    document.getElementById('playBtn').addEventListener('click', togglePlay);

    // Next/Previous buttons
    document.getElementById('nextBtn').addEventListener('click', nextTrack);
    document.getElementById('prevBtn').addEventListener('click', prevTrack);

    // Audio player events
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', nextTrack);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);

    // Progress bar click
    const progressBar = document.querySelector('.progress-bar');
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });
}

// ==================== PROGRESS & TIME ====================
function updateProgress() {
    if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        document.getElementById('progress').style.width = percent + '%';
        document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);
    }
}

function updateDuration() {
    document.getElementById('duration').textContent = formatTime(audioPlayer.duration);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== UTILITY ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
