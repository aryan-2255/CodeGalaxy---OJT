class AudioController {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.currentMood = null;
        this.isPlaying = false;

        // Config map for mood to audio file path
        this.audioMap = {
            'Focus': '/static/media/nebula-drift.wav',
            'Calm': '/static/media/starlight-echoes.wav',
            'Chill': '/static/media/comet-trail.wav',
            'Energy': '/static/media/nebula-drift.wav',
            'DeepWork': '/static/media/starlight-echoes.wav',
            'Night': '/static/media/comet-trail.wav'
        };

        // Day of week mapping (0=Sunday, 1=Monday, etc.)
        this.dayMap = {
            1: { audio: '/static/media/nebula-drift.wav', spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j' }, // Monday
            5: { audio: '/static/media/comet-trail.wav', spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX889U0CL85jj' }   // Friday
        };

        // Specific date mapping (YYYY-MM-DD)
        this.dateMap = {
            '2025-12-25': { audio: '/static/media/starlight-echoes.wav', spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX4wta20Cwevey' }
        };

        this.spotifyMap = {
            'Focus': 'https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j',
            'Calm': 'https://open.spotify.com/playlist/37i9dQZF1DX4wta20Cwevey',
            'Chill': 'https://open.spotify.com/playlist/37i9dQZF1DX889U0CL85jj',
            'Energy': 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP',
            'DeepWork': 'https://open.spotify.com/playlist/37i9dQZF1DX5trt9i14X7j',
            'Night': 'https://open.spotify.com/playlist/37i9dQZF1DX6VdMW310YC7'
        };
    }

    play(mood) {
        if (!mood) return;

        // If already playing this mood, do nothing
        if (this.currentMood === mood && this.isPlaying) return;

        this.currentMood = mood;

        // Determine source
        let src = this.audioMap[mood];

        // Check date/day overrides
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const day = now.getDay();

        if (this.dateMap[dateStr]) {
            src = this.dateMap[dateStr].audio;
        } else if (this.dayMap[day]) {
            src = this.dayMap[day].audio;
        }

        if (src) {
            this.audio.src = src;
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    this.updateUI(true);
                })
                .catch(e => {
                    console.warn('Audio playback failed:', e);
                    this.isPlaying = false;
                    this.updateUI(false);
                });
        } else {
            console.warn('No audio found for mood:', mood);
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUI(false);
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.updateUI(false);
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play(this.currentMood || 'Focus');
        }
    }

    setVolume(val) {
        this.audio.volume = Math.max(0, Math.min(1, val / 100));
    }

    getSpotifyUrl(mood) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const day = now.getDay();

        if (this.dateMap[dateStr] && this.dateMap[dateStr].spotify) {
            return this.dateMap[dateStr].spotify;
        }
        if (this.dayMap[day] && this.dayMap[day].spotify) {
            return this.dayMap[day].spotify;
        }
        return this.spotifyMap[mood] || null;
    }

    updateUI(isPlaying) {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = isPlaying ? '⏸' : '▶';
            playBtn.classList.toggle('playing', isPlaying);
        }

        const trackTitle = document.getElementById('trackTitle');
        if (trackTitle && this.currentMood) {
            trackTitle.textContent = `${this.currentMood} Mode`;
        }

        const trackArtist = document.getElementById('trackArtist');
        if (trackArtist) {
            trackArtist.textContent = isPlaying ? 'Playing local audio' : 'Paused';
        }
    }
}

// Export instance
window.audioController = new AudioController();
