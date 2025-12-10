// ==================== FOCUS TIMER & SESSIONS ====================
let timerDuration = 25 * 60; // seconds
let timerRemaining = timerDuration;
let timerInterval = null;
let currentMoodKey = 'neutral';
const MIN_TIMER_MINUTES = 1;
const MAX_TIMER_MINUTES = 180;

document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('timerDisplay');
    if (!display) return; // timer panel not on this page

    initTimerUI();
    loadStats();
});

// Expose loadStats globally for galaxy.js
window.loadStats = loadStats;

function initTimerUI() {
    const display = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startSessionBtn');
    const resetBtn = document.getElementById('resetSessionBtn');
    const customInput = document.getElementById('customTimerInput');
    const applyCustomBtn = document.getElementById('applyCustomTimerBtn');

    // Preset duration buttons
    document.querySelectorAll('.timer-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const minutes = Number(btn.dataset.minutes || '25');
            setTimerDuration(minutes);
            if (customInput) {
                customInput.value = minutes;
            }
        });
    });

    if (applyCustomBtn && customInput) {
        const applyCustomMinutes = () => {
            const minutes = Number(customInput.value);
            if (Number.isNaN(minutes)) {
                Toast.show('Enter a valid number of minutes', 'warn');
                return;
            }
            const clamped = Math.max(MIN_TIMER_MINUTES, Math.min(MAX_TIMER_MINUTES, minutes));
            if (clamped !== minutes) {
                customInput.value = clamped;
            }
            setTimerDuration(clamped);
            Toast.show(`Timer set to ${clamped} minutes`, 'info');
        };

        applyCustomBtn.addEventListener('click', applyCustomMinutes);
        customInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                applyCustomMinutes();
            }
        });
    }

    // Start / stop
    startBtn.addEventListener('click', () => {
        if (timerInterval) {
            // If already running, treat as "pause"
            clearInterval(timerInterval);
            timerInterval = null;
            startBtn.textContent = 'Resume Focus';
            return;
        }

        if (timerRemaining <= 0) {
            timerRemaining = timerDuration;
        }

        startBtn.textContent = 'Pause';

        // Start audio non-blocking
        if (window.audioController) {
            // Use current mood or default
            const mood = window.audioController.currentMood || 'Focus';
            window.audioController.play(mood);
        }

        timerInterval = setInterval(() => {
            timerRemaining -= 1;
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerRemaining = 0;
                updateTimerDisplay();
                startBtn.textContent = 'Start Focus';
                onTimerCompleted();

                // Stop audio
                if (window.audioController) {
                    window.audioController.stop();
                }
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerRemaining = timerDuration;
        updateTimerDisplay();
        startBtn.textContent = 'Start Focus';
    });

    updateTimerDisplay();
}

function setTimerDuration(minutes) {
    const safeMinutes = Math.max(MIN_TIMER_MINUTES, Math.min(MAX_TIMER_MINUTES, Number(minutes) || 25));
    timerDuration = safeMinutes * 60;
    timerRemaining = timerDuration;
    updateTimerDisplay();

    const startBtn = document.getElementById('startSessionBtn');
    if (startBtn && startBtn.textContent !== 'Start Focus' && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.textContent = 'Start Focus';
    }
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;
    const minutes = Math.floor(timerRemaining / 60);
    const seconds = timerRemaining % 60;
    display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function onTimerCompleted() {
    // Duration in minutes for the session
    const durationMinutes = timerDuration / 60;

    try {
        const response = await fetch('/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mood: currentMoodKey,
                duration_minutes: durationMinutes,
            }),
        });

        if (response.ok) {
            Toast.show('✨ Focus session saved! A new celestial body was added.', 'success');
            if (window.loadGalaxy) {
                await window.loadGalaxy();
            }
            await loadStats();
        } else {
            console.error('Failed to save session:', await response.text());
        }
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// ==================== MOODS & STATS ====================
// Moods logic removed as requested

async function loadStats() {
    try {
        const [summaryRes, streakRes] = await Promise.all([
            fetch('/stats/summary'),
            fetch('/stats/streak'),
        ]);

        if (summaryRes.ok) {
            const summary = await summaryRes.json();
            const statTasks = document.getElementById('statTasks');
            const statFocus = document.getElementById('statFocus');
            if (statTasks) {
                statTasks.textContent = `${summary.completed_tasks} / ${summary.total_tasks} tasks completed`;
            }
            if (statFocus) {
                statFocus.textContent = `${Math.round(summary.total_focus_minutes)} min focus`;
            }
        }

        if (streakRes.ok) {
            const streak = await streakRes.json();
            const statStreak = document.getElementById('statStreak');
            if (statStreak) {
                const days = streak.current_streak_days || 0;
                statStreak.textContent = `${days} day${days === 1 ? '' : 's'} streak`;
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ==================== GALAXY EXPORT ====================
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('exportGalaxyBtn');
    const canvas = document.getElementById('galaxyCanvas');
    if (!btn || !canvas) return;

    btn.addEventListener('click', () => {
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'codegalaxy.png';
            link.click();
        } catch (error) {
            console.error('Error exporting galaxy PNG:', error);
        }
    });
});


