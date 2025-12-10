// ==================== GALAXY VISUALIZATION ====================
let canvas, ctx;
let galaxyObjects = [];
let animationId = null;
let dragState = {
    active: false,
    index: null,
    offsetX: 0,
    offsetY: 0,
};
let layoutDirty = false;
let lockConstellation = false;
let saveBtn, revertBtn, toastContainer, constellationSelect;
let lastSavedLayout = null;
let globalToastHost = null;
const CONSTELLATION_PRESETS = {
    Orion: [
        { x: 0.42, y: 0.12 },
        { x: 0.46, y: 0.25 },
        { x: 0.51, y: 0.35 },
        { x: 0.56, y: 0.45 },
        { x: 0.6, y: 0.65 },
    ],
    Lyra: [
        { x: 0.25, y: 0.2 },
        { x: 0.33, y: 0.28 },
        { x: 0.29, y: 0.38 },
        { x: 0.37, y: 0.46 },
    ],
    Cassiopeia: [
        { x: 0.15, y: 0.18 },
        { x: 0.26, y: 0.25 },
        { x: 0.37, y: 0.18 },
        { x: 0.48, y: 0.26 },
        { x: 0.59, y: 0.2 },
    ],
    Grid: [
        { x: 0.25, y: 0.25 },
        { x: 0.4, y: 0.25 },
        { x: 0.55, y: 0.25 },
        { x: 0.25, y: 0.45 },
        { x: 0.4, y: 0.45 },
        { x: 0.55, y: 0.45 },
        { x: 0.25, y: 0.65 },
        { x: 0.4, y: 0.65 },
        { x: 0.55, y: 0.65 },
    ],
};
let constellationMap = { ...CONSTELLATION_PRESETS };

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('galaxyCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    globalToastHost = document.getElementById('toasts');

    const controls = initControls();
    saveBtn = controls.saveBtn;
    revertBtn = controls.revertBtn;
    toastContainer = controls.toastContainer;
    constellationSelect = controls.select;
    if (constellationSelect) {
        populateConstellationSelect(constellationSelect, constellationMap);
        fetchConstellationPresets(constellationSelect);
    }

    // Set canvas size
    resizeCanvas();
    attachPointerHandlers();
    window.addEventListener('resize', () => {
        resizeCanvas();
        markLayoutDirty(false);
    });

    // Load galaxy data
    loadGalaxy().then(() => {
        // Start animation after initial load
        animate();
    });
});

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 320;
}

// ==================== LOAD GALAXY DATA ====================
async function loadGalaxy() {
    try {
        const response = await fetch('/api/galaxy/data');
        const objects = await response.json();

        galaxyObjects = objects.map((obj, index) => ({
            id: obj.id,
            x: obj.x ?? 0,
            y: obj.y ?? 0,
            radius: obj.radius ?? 6,
            color: obj.color || '#FFD700', // Golden default
            type: obj.type || 'star',
            created_at: obj.created_at ? new Date(obj.created_at) : new Date(),
            // for simple animation timing
            index,
        }));

        updateGalaxyStats();
        markLayoutDirty(false);
    } catch (error) {
        console.error('Error loading galaxy:', error);
    }
}

// Make loadGalaxy available globally for task completion
window.loadGalaxy = loadGalaxy;

function updateGalaxyStats() {
    const starCount = galaxyObjects.filter(obj => obj.type === 'star' || obj.type === 'tiny_star').length;
    const planetCount = galaxyObjects.filter(obj => obj.type === 'planet').length;
    const cometCount = galaxyObjects.filter(obj => obj.type === 'comet').length;

    let statsText = '';
    if (starCount > 0) statsText += `${starCount} star${starCount !== 1 ? 's' : ''}`;
    if (planetCount > 0) {
        if (statsText) statsText += ', ';
        statsText += `${planetCount} planet${planetCount !== 1 ? 's' : ''}`;
    }
    if (cometCount > 0) {
        if (statsText) statsText += ', ';
        statsText += `${cometCount} comet${cometCount !== 1 ? 's' : ''}`;
    }
    if (!statsText) statsText = '0 stars';

    document.getElementById('galaxyCount').textContent = statsText;
}

// ==================== ANIMATION ====================
function animate() {
    drawGalaxy();
    animationId = requestAnimationFrame(animate);
}

function drawGalaxy() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    drawBackgroundStars();

    // Draw galaxy objects
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const time = Date.now() / 1000;

    galaxyObjects.forEach((obj) => {
        // x, y are already spiral coordinates around origin, so just offset to center
        const x = centerX + obj.x;
        const y = centerY + obj.y;

        // Twinkle animation: small pulsation in size + alpha
        const twinkle = 0.3 * Math.sin(time * 2 + obj.index);
        const baseRadius = obj.radius;
        const animatedRadius = baseRadius * (1 + twinkle * 0.1);

        if (obj.type === 'planet' || obj.type === 'comet') {
            drawPlanet(x, y, animatedRadius, obj.color);
        } else {
            drawStar(x, y, animatedRadius, obj.color, twinkle);
        }
    });
}

function drawBackgroundStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 73.7) % canvas.height;
        const size = (i % 3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStar(x, y, size, color, twinkle = 0) {
    // Draw glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    const alphaCore = 0.7 + twinkle * 0.2;

    // Golden gradient logic
    if (color === '#FFD700' || color === 'rgba(255, 215, 0, 1)') {
        gradient.addColorStop(0, `rgba(255, 236, 153, ${alphaCore})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 60, ${alphaCore * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 150, 40, 0)`);
    } else {
        gradient.addColorStop(0, hexToRgba(color, alphaCore));
        gradient.addColorStop(1, hexToRgba(color, 0));
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw star core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw star points
    ctx.strokeStyle = hexToRgba(color, 0.9);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - size * 2, y);
    ctx.lineTo(x + size * 2, y);
    ctx.moveTo(x, y - size * 2);
    ctx.lineTo(x, y + size * 2);
    ctx.stroke();
}

function drawPlanet(x, y, size, color) {
    // Draw planet shadow
    const shadowGradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
    shadowGradient.addColorStop(0, color);
    shadowGradient.addColorStop(1, '#000000');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw planet highlight
    const highlightGradient = ctx.createRadialGradient(x - size * 0.5, y - size * 0.5, 0, x, y, size);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw planet ring (for some planets)
    if (Math.random() > 0.7) {
        ctx.strokeStyle = hexToRgba(color, 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 1.5, size * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ==================== INTERACTION ====================
function attachPointerHandlers() {
    if (!canvas) return;
    canvas.style.cursor = lockConstellation ? 'default' : 'grab';
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
}

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

// ==================== HELPERS ====================
function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map((ch) => ch + ch).join('');
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function resetGalaxy() {
    if (!confirm('Reset galaxy? This will remove ALL stars and objects.')) return;

    try {
        const resp = await fetch('/api/galaxy/reset', { method: 'POST' });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
            const message = data && data.error ? data.error : 'server error';
            throw new Error(message);
        }

        galaxyObjects = [];
        lastSavedLayout = null;
        await loadGalaxy();
        if (typeof loadStats === 'function') {
            loadStats();
        }

        showToast('Galaxy reset.', 'success');
    } catch (error) {
        console.error('Error resetting galaxy:', error);
        showToast(`Reset failed: ${error.message || 'server error'}`, 'error');
    }
}

window.resetGalaxy = resetGalaxy;

function initControls() {
    const select = document.getElementById('constellationSelect');
    const applyBtn = document.getElementById('applyConstellation');
    const lockCheckbox = document.getElementById('lockConstellation');
    const saveLayoutBtn = document.getElementById('saveLayout');
    const revertLayoutBtn = document.getElementById('revertLayout');
    const resetBtn = document.getElementById('resetGalaxy');
    const toastHost = document.getElementById('galaxyToasts');

    if (applyBtn && select) {
        applyBtn.addEventListener('click', () => {
            const presetName = select.value;
            applyConstellation(presetName);
        });
    }

    if (lockCheckbox) {
        lockCheckbox.addEventListener('change', () => {
            lockConstellation = lockCheckbox.checked;
            if (canvas) {
                canvas.style.cursor = lockConstellation ? 'default' : 'grab';
            }
        });
    }

    if (saveLayoutBtn) {
        saveLayoutBtn.addEventListener('click', () => saveLayout());
    }

    if (revertLayoutBtn) {
        revertLayoutBtn.addEventListener('click', () => revertLayout());
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => resetGalaxy());
    }

    return {
        saveBtn: saveLayoutBtn,
        revertBtn: revertLayoutBtn,
        toastContainer: toastHost,
        select,
    };
}

function populateConstellationSelect(selectEl, presetsMap) {
    if (!selectEl || !presetsMap) return;
    selectEl.innerHTML = '';
    Object.keys(presetsMap).forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selectEl.appendChild(option);
    });
}

async function fetchConstellationPresets(selectEl) {
    try {
        const response = await fetch('/api/constellations');
        if (!response.ok) throw new Error('Failed to load constellations');
        const data = await response.json();
        if (data.constellations) {
            constellationMap = data.constellations;
            populateConstellationSelect(selectEl, constellationMap);
        }
    } catch {
        populateConstellationSelect(selectEl, constellationMap);
    }
}

function applyConstellation(name) {
    const pattern = constellationMap[name];
    if (!pattern || !pattern.length) {
        showGalaxyToast('No pattern found.', 'warn');
        return;
    }

    // Check if locked
    if (lockConstellation) {
        // If locked, we add the entire pattern as NEW stars
        const needed = pattern.length;
        showConfirmModal(
            `Pattern locked. Add ${needed} new stars for ${name}?`,
            () => mergeConstellation(name, pattern, needed, true)
        );
        return;
    }

    // If unlocked, we reuse existing stars
    const needed = Math.max(0, pattern.length - galaxyObjects.length);

    if (needed > 0) {
        showConfirmModal(
            `Applying ${name} requires ${needed} more star${needed !== 1 ? 's' : ''}. Add them?`,
            () => mergeConstellation(name, pattern, needed, false)
        );
    } else {
        // We have enough stars, just reposition
        mergeConstellation(name, pattern, 0, false);
    }
}

async function mergeConstellation(name, pattern, needed, isLocked) {
    const width = canvas.width;
    const height = canvas.height;
    const previousState = galaxyObjects.map(o => ({ id: o.id, x: o.x, y: o.y }));

    const updates = [];
    const newStars = [];

    // 1. Prepare Updates (reuse existing)
    let reuseCount = 0;
    if (!isLocked) {
        reuseCount = Math.min(pattern.length, galaxyObjects.length);
        for (let i = 0; i < reuseCount; i++) {
            const normalized = pattern[i];
            updates.push({
                id: galaxyObjects[i].id,
                x: normalized.x * width,
                y: normalized.y * height
            });
        }
    }

    // 2. Prepare New Stars
    // If locked, we create ALL stars from pattern.
    // If unlocked, we create only needed (starting from index reuseCount).
    const startIndex = isLocked ? 0 : reuseCount;
    for (let i = startIndex; i < pattern.length; i++) {
        const normalized = pattern[i];
        newStars.push({
            x: normalized.x * width,
            y: normalized.y * height,
            radius: 4 + Math.random() * 3,
            color: '#FFD700',
            type: 'star'
        });
    }

    try {
        const response = await fetch('/api/galaxy/layout/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates, new_stars: newStars })
        });

        if (!response.ok) throw new Error('Failed to merge layout');
        const data = await response.json();
        const addedIds = data.created_ids || [];

        // Reload to reflect changes
        await loadGalaxy();

        showGalaxyToast(`${name} applied.`, 'success');

        // Show Undo Toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-info show';
        toast.innerHTML = `
            <span>${name} applied.</span>
            <button class="btn-undo" style="margin-left: 10px; background: transparent; border: 1px solid white; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer;">Undo</button>
        `;

        toast.querySelector('.btn-undo').onclick = () => undoMerge(previousState, addedIds, toast);

        document.getElementById('toasts').appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);

    } catch (error) {
        console.error('Error applying constellation:', error);
        showGalaxyToast('Failed to apply constellation.', 'error');
    }
}

async function undoMerge(previousState, addedIds, toast) {
    try {
        // 1. Revert positions of updated stars
        // We can just use the saveLayout endpoint with the previous state?
        // Or just update local and save?
        // Let's use the merge endpoint again to revert updates!

        const updates = previousState.map(s => ({
            id: s.id,
            x: s.x,
            y: s.y
        }));

        // 2. Delete added stars
        if (addedIds.length > 0) {
            await fetch('/api/galaxy/stars', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: addedIds })
            });
        }

        // 3. Revert positions
        if (updates.length > 0) {
            await fetch('/api/galaxy/layout/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
        }

        await loadGalaxy();
        toast.remove();
        showGalaxyToast('Layout reverted.');

    } catch (error) {
        console.error('Error undoing:', error);
        showGalaxyToast('Undo failed.', 'error');
    }
}

// ==================== CONFIRM MODAL ====================
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmMessage');
    const applyBtn = document.getElementById('applyConfirmBtn');
    const cancelBtn = document.getElementById('cancelConfirmBtn');
    const closeBtn = document.getElementById('closeConfirmModal');

    msgEl.textContent = message;
    modal.classList.add('active');

    const close = () => {
        modal.classList.remove('active');
        applyBtn.onclick = null;
    };

    applyBtn.onclick = () => {
        onConfirm();
        close();
    };

    cancelBtn.onclick = close;
    closeBtn.onclick = close;
}

function handlePointerDown(event) {
    if (lockConstellation) return;
    const pointer = getCanvasPointer(event);
    const targetIndex = findNearestStar(pointer.x, pointer.y);
    if (targetIndex === null) return;

    dragState.active = true;
    dragState.index = targetIndex;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const star = galaxyObjects[targetIndex];
    dragState.offsetX = pointer.x - (centerX + star.x);
    dragState.offsetY = pointer.y - (centerY + star.y);

    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
}

function handlePointerMove(event) {
    if (!dragState.active || dragState.index === null) return;
    event.preventDefault();
    const pointer = getCanvasPointer(event);
    const star = galaxyObjects[dragState.index];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    star.x = pointer.x - dragState.offsetX - centerX;
    star.y = pointer.y - dragState.offsetY - centerY;
}

function handlePointerUp(event) {
    if (!dragState.active) return;
    if (event.pointerId) {
        try {
            canvas.releasePointerCapture(event.pointerId);
        } catch (_) {
            // ignore
        }
    }
    onStarDropped(galaxyObjects[dragState.index]);
    dragState.active = false;
    dragState.index = null;
    markLayoutDirty(true);
    if (!lockConstellation) {
        canvas.style.cursor = 'grab';
    }
}

function findNearestStar(x, y) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let nearestIndex = null;
    let nearestDistance = Infinity;

    galaxyObjects.forEach((star, index) => {
        const dx = x - (centerX + star.x);
        const dy = y - (centerY + star.y);
        const distance = Math.hypot(dx, dy);
        if (distance < 24 && distance < nearestDistance) {
            nearestIndex = index;
            nearestDistance = distance;
        }
    });

    return nearestIndex;
}

function getCanvasPointer(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function onStarDropped(star) {
    if (!star) return;
    showGalaxyToast('Star repositioned. Save layout to keep changes.');
}

function markLayoutDirty(isDirty) {
    layoutDirty = Boolean(isDirty);
    if (saveBtn) saveBtn.disabled = !layoutDirty;
    if (revertBtn) revertBtn.disabled = !layoutDirty;
}

async function saveLayout() {
    if (!layoutDirty) return;
    try {
        const payload = {
            layout: galaxyObjects.map((obj) => ({
                id: obj.id,
                x: obj.x,
                y: obj.y,
            })),
        };

        const response = await fetch('/api/galaxy/layout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to save layout');
        const data = await response.json();
        lastSavedLayout = data.layout || payload.layout;
        markLayoutDirty(false);
        showGalaxyToast('Layout saved. Your constellation is secure!');
    } catch (error) {
        console.error('Error saving layout:', error);
        showGalaxyToast('Unable to save layout right now.', 'error');
    }
}

async function revertLayout() {
    try {
        const response = await fetch('/api/galaxy/layout');
        if (!response.ok) throw new Error('Failed to fetch layout');
        const data = await response.json();
        const layout = data.layout || lastSavedLayout || [];
        layout.forEach((item) => {
            const star = galaxyObjects.find((obj) => obj.id === item.id);
            if (star) {
                star.x = item.x ?? star.x;
                star.y = item.y ?? star.y;
            }
        });
        lastSavedLayout = layout;
        markLayoutDirty(false);
        showGalaxyToast('Layout reverted to last save.');
    } catch (error) {
        console.error('Error reverting layout:', error);
        showGalaxyToast('Unable to revert layout.', 'error');
    }
}

function showGalaxyToast(message, type = 'info') {
    if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = `galaxy-toast galaxy-toast--${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
    const mapped =
        type === 'error' ? 'error' :
            type === 'warn' ? 'warn' : 'success';
    showToast(message, mapped);
}

function showToast(msg, type = 'success', timeout = 3000) {
    if (!globalToastHost) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = msg;
    globalToastHost.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, timeout);
}
