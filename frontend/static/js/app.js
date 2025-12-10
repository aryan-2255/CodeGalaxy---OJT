// ==================== STATE MANAGEMENT ====================
let currentFilter = 'all';
let currentEditingTask = null;
let currentTasks = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Load initial data
    await loadTasks();
    await loadCalendar();
    await loadUpcoming();

    // Setup event listeners
    setupEventListeners();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            loadTasks();
        });
    });

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        openTaskModal();
    });

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelBtn').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        loadCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        loadCalendar();
    });

    // Close modal on outside click
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') {
            closeTaskModal();
        }
    });

    // Audio Controls
    const moodSelect = document.getElementById('moodSelect');
    if (moodSelect) {
        moodSelect.addEventListener('change', (e) => {
            if (window.audioController) {
                window.audioController.play(e.target.value);
                Toast.show(`Playing ${e.target.value} Mode`, 'info');
            }
        });
    }

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (window.audioController) {
                window.audioController.toggle();
            }
        });
    }

    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (window.audioController) {
                window.audioController.setVolume(e.target.value);
            }
        });
    }

    const spotifyBtn = document.getElementById('spotifyBtn');
    if (spotifyBtn) {
        spotifyBtn.addEventListener('click', () => {
            if (window.audioController) {
                const mood = moodSelect ? moodSelect.value : 'Focus';
                const url = window.audioController.getSpotifyUrl(mood);
                if (url) {
                    window.open(url, '_blank');
                } else {
                    Toast.show(`No Spotify playlist found for ${mood}`, 'warn');
                }
            }
        });
    }

    // Task View Panel
    document.getElementById('closeTaskView').addEventListener('click', closeTaskView);
    document.getElementById('addTaskForDateBtn').addEventListener('click', () => {
        const dateStr = document.getElementById('taskViewPanel').dataset.date;
        if (dateStr) {
            closeTaskView();
            openTaskModal(null, dateStr);
        }
    });

    // Close task view on outside click
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('taskViewPanel');
        if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.calendar-day')) {
            closeTaskView();
        }
    });
}

// ==================== TASK MANAGEMENT ====================
async function loadTasks() {
    try {
        let url = '/api/tasks';
        if (currentFilter !== 'all') {
            url += `?category=${currentFilter}`;
        }

        const response = await fetch(url);
        const tasks = await response.json();
        currentTasks = tasks;
        renderTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');

    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No tasks found. Add your first task!</p>';
        return;
    }

    taskList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" draggable="true" ondragstart="handleDragStart(event, '${task.id}')">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}', ${task.completed})"></div>
            <div class="task-content" onclick="editTask('${task.id}')">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="task-date">📅 ${formatDate(task.date)}${task.due_at ? ` at ${formatTime(task.due_at)}` : ''}</span>
                    <span class="task-category">🏷️ ${task.category}</span>
                    <span class="task-priority priority-${task.priority.toLowerCase()}">⚡ ${task.priority}</span>
                </div>
            </div>
            <button class="task-delete-btn" onclick="event.stopPropagation(); deleteTask('${task.id}')" title="Delete task">🗑️</button>
        </div>
    `).join('');
}

async function toggleTask(taskId, currentCompleted) {
    try {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const taskData = await fetch(`/api/tasks?category=all`).then(r => r.json());
        const task = taskData.find(t => t.id === taskId);

        let response;
        
        // If marking as complete, use the PATCH endpoint that creates a star
        if (!currentCompleted) {
            response = await fetch(`/api/tasks/${taskId}/complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // If uncompleting, use PUT to update
            response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...task,
                    completed: false
                })
            });
        }

        if (response.ok) {
            await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);

            // If task was just completed, show appreciation and reload galaxy
            if (!currentCompleted) {
                const messages = [
                    "Task completed — well done! ⭐",
                    "Nice! Task finished. A star is born! ⭐",
                    "Good job — keep the streak alive! ⭐"
                ];
                const msg = messages[Math.floor(Math.random() * messages.length)];
                Toast.show(msg, 'success');
                
                // Reload galaxy to show the new star
                if (window.loadGalaxy) {
                    await window.loadGalaxy();
                }
                
                // Reload stats to update counts
                if (window.loadStats) {
                    await window.loadStats();
                }
            }
        }
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

async function editTask(taskId) {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            currentEditingTask = task;
            openTaskModal(task);
        }
    } catch (error) {
        console.error('Error loading task:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);
            closeTaskModal();
            await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);
            closeTaskModal();
            Toast.show('Task deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// ==================== MODAL MANAGEMENT ====================
function openTaskModal(task = null, dateOverride = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');

    if (task) {
        modalTitle.textContent = 'Edit Task';
        document.getElementById('taskTitleInput').value = task.title;
        document.getElementById('taskDescInput').value = task.description || '';
        document.getElementById('taskDateInput').value = task.date ? new Date(task.date).toISOString().split('T')[0] : '';
        document.getElementById('taskTimeInput').value = task.due_at ? new Date(task.due_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
        document.getElementById('taskPriorityInput').value = task.priority;
        document.getElementById('taskCategoryInput').value = task.category;

        // Add delete button if editing
        if (!document.getElementById('deleteTaskBtn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteTaskBtn';
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn-secondary';
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginRight = 'auto';
            deleteBtn.onclick = () => deleteTask(task.id);
            document.querySelector('.modal-actions').prepend(deleteBtn);
        }
    } else {
        modalTitle.textContent = 'Add New Task';
        form.reset();
        // Set default date to today or override
        const defaultDate = dateOverride || new Date().toISOString().split('T')[0];
        document.getElementById('taskDateInput').value = defaultDate;
        document.getElementById('taskTimeInput').value = '';

        // Remove delete button if exists
        const deleteBtn = document.getElementById('deleteTaskBtn');
        if (deleteBtn) deleteBtn.remove();
    }

    modal.classList.add('active');
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    currentEditingTask = null;
    document.getElementById('taskForm').reset();
}

async function handleTaskSubmit(e) {
    e.preventDefault();

    const rawDate = document.getElementById('taskDateInput').value;
    const rawTime = document.getElementById('taskTimeInput').value;

    const isoDate = rawDate ? new Date(rawDate).toISOString() : null;
    let dueAt = null;

    if (rawDate && rawTime) {
        const dateTime = new Date(`${rawDate}T${rawTime}`);
        dueAt = dateTime.toISOString();
    } else if (rawDate) {
        // If only date, due_at can be start of day or null. Let's keep it null or consistent with date.
        // Requirement says: if time omitted, due_at can be startOfDay(date) or null.
        // We'll use start of day in UTC for sorting purposes if needed, or just null to indicate "all day".
        // Let's use null for "no specific time" to avoid timezone confusion.
        dueAt = null;
    }

    const taskData = {
        title: document.getElementById('taskTitleInput').value,
        description: document.getElementById('taskDescInput').value,
        date: isoDate,
        due_at: dueAt,
        priority: document.getElementById('taskPriorityInput').value,
        category: document.getElementById('taskCategoryInput').value,
        completed: currentEditingTask ? currentEditingTask.completed : false
    };

    try {
        let response;
        if (currentEditingTask) {
            response = await fetch(`/api/tasks/${currentEditingTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        } else {
            response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
        }

        if (response.ok) {
            await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);
            closeTaskModal();
            await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);
            closeTaskModal();
            Toast.show(currentEditingTask ? 'Task updated!' : 'Task created!', 'success');
        }
    } catch (error) {
        console.error('Error saving task:', error);
    }
}

// ==================== CALENDAR ====================
async function loadCalendar() {
    try {
        const response = await fetch(`/api/calendar?month=${currentMonth + 1}&year=${currentYear}`);
        const events = await response.json();

        renderCalendar(events);
    } catch (error) {
        console.error('Error loading calendar:', error);
    }
}

function renderCalendar(events) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    let html = '';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day" style="font-weight: 600; color: var(--text-secondary);">${day}</div>`;
    });

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const hasCalendarEvent = events.some(e => e.date === dateStr);
        const hasTask = currentTasks.some(t => {
            if (!t.date) return false;
            return t.date.startsWith(dateStr);
        });

        const hasEvent = hasCalendarEvent || hasTask;
        const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" 
            onclick="openTaskView('${dateStr}')"
            ondragover="handleDragOver(event)"
            ondrop="handleDrop(event, '${dateStr}')"
            ondragenter="handleDragEnter(event)"
            ondragleave="handleDragLeave(event)">${day}</div>`;
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    calendarGrid.innerHTML = html;
}

// ==================== UPCOMING EVENTS ====================
async function loadUpcoming() {
    try {
        const [tasksResponse, eventsResponse] = await Promise.all([
            fetch('/api/tasks'),
            fetch('/api/calendar'),
        ]);

        const tasks = await tasksResponse.json();
        const events = await eventsResponse.json();

        const upcomingTasks = tasks
            .filter((t) => !t.completed && isUpcoming(t.date))
            .map((t) => ({
                id: t.id,
                title: t.title,
                date: t.date,
                time: t.due_at ? formatTime(t.due_at) : null,
                type: 'task',
                category: t.category,
                sortDate: t.due_at || t.date // Use due_at for sorting if available
            }));

        const upcomingEvents = events
            .filter((e) => isUpcoming(e.date))
            .map((e) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                time: e.time,
                type: 'event',
                category: e.category,
                sortDate: e.date + (e.time ? `T${e.time}` : '') // Approx sort
            }));

        const upcoming = [...upcomingTasks, ...upcomingEvents]
            .sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate))
            .slice(0, 10);

        renderUpcoming(upcoming);
    } catch (error) {
        console.error('Error loading upcoming:', error);
    }
}

function renderUpcoming(items) {
    const upcomingList = document.getElementById('upcomingList');

    if (items.length === 0) {
        upcomingList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No upcoming items</p>';
        return;
    }

    upcomingList.innerHTML = items.map(item => `
        <div class="upcoming-item">
            <div class="upcoming-content">
                <div class="upcoming-title">${item.type === 'task' ? '✓' : '📅'} ${escapeHtml(item.title)}</div>
                <div class="upcoming-time">${formatDate(item.date)}${item.time ? ` at ${item.time}` : ''}</div>
            </div>
            <button class="upcoming-delete-btn" onclick="event.stopPropagation(); ${item.type === 'task' ? `deleteTask('${item.id}')` : `deleteEvent('${item.id}')`}" title="Delete">🗑️</button>
        </div>
    `).join('');
}

// ==================== TASK VIEW PANEL ====================
function openTaskView(dateStr) {
    const panel = document.getElementById('taskViewPanel');
    const list = document.getElementById('taskViewList');
    const dateTitle = document.getElementById('taskViewDate');

    panel.dataset.date = dateStr;

    // Format date title
    const dateObj = new Date(dateStr);
    dateTitle.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Filter tasks for this date
    const tasksForDate = currentTasks.filter(t => t.date && t.date.startsWith(dateStr));

    if (tasksForDate.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tasks for this date.</p>';
    } else {
        list.innerHTML = tasksForDate.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" style="margin-bottom: 0.5rem;">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}', ${task.completed})"></div>
                <div class="task-content" onclick="closeTaskView(); editTask('${task.id}')">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.due_at ? `<div class="task-meta">⏰ ${formatTime(task.due_at)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    panel.classList.add('active');
}

function closeTaskView() {
    document.getElementById('taskViewPanel').classList.remove('active');
}

// Delete calendar event (used by Upcoming list)
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const response = await fetch(`/api/calendar/${eventId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await Promise.all([loadTasks(), loadUpcoming(), loadCalendar()]);
            await Promise.all([loadTasks(), loadUpcoming(), loadCalendar()]);
            Toast.show('Event deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
    }
}

// ==================== UTILITY FUNCTIONS ====================
function normalizeDateValue(dateValue) {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function isUpcoming(dateValue) {
    const date = normalizeDateValue(dateValue);
    if (!date) return false;

    const now = new Date();
    // Reset time to start of day for accurate comparison
    now.setHours(0, 0, 0, 0);

    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    // Check if date is today or in the future, within 7 days
    return date >= now && date <= inSevenDays;
}

function formatDate(dateStr) {
    const date = normalizeDateValue(dateStr);
    if (!date) return 'Soon';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// ==================== DRAG & DROP ====================
function handleDragStart(e, taskId) {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Add ghost class for visual feedback if needed
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

async function handleDrop(e, dateStr) {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    // If dropped on same date, do nothing
    if (task.date && task.date.startsWith(dateStr)) return;

    // Keep existing time if present, else just date
    let newDueAt = null;
    if (task.due_at) {
        const timePart = task.due_at.split('T')[1];
        newDueAt = `${dateStr}T${timePart}`;
    }

    // Optimistic update
    const originalDate = task.date;
    const originalDueAt = task.due_at;

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...task,
                date: new Date(dateStr).toISOString(),
                due_at: newDueAt
            })
        });

        if (response.ok) {
            await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);

            // Show Undo Toast
            const toast = document.createElement('div');
            toast.className = 'toast toast-info show';
            toast.innerHTML = `
                <span>Task moved to ${dateStr}</span>
                <button class="btn-undo" style="margin-left: 10px; background: transparent; border: 1px solid white; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer;">Undo</button>
            `;

            // Undo handler
            toast.querySelector('.btn-undo').onclick = async () => {
                await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...task,
                        date: originalDate,
                        due_at: originalDueAt
                    })
                });
                await Promise.all([loadTasks(), loadCalendar(), loadUpcoming()]);
                toast.remove();
            };

            document.getElementById('toasts').appendChild(toast);
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
        }
    } catch (error) {
        console.error('Error moving task:', error);
        Toast.show('Failed to move task', 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// showNotification removed in favor of Toast.show
