const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toasts');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toasts';
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info') {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warn') icon = '⚠️';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        this.container.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;

        // Show
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Hide after duration
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');

            // Remove from DOM
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
};

// Expose to window
window.Toast = Toast;
