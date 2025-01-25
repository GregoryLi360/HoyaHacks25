class NotificationManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.notificationGap = 10; // Gap between notifications in pixels
        this.baseTop = 100; // Base position from top of screen
    }

    show(message, type = 'add') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification-banner';
        notification.innerHTML = `
            <i class="material-icons success-icon">check_circle</i>
            <span class="message">${message}</span>
            <button class="close-notification">
                <i class="material-icons">close</i>
            </button>
        `;

        // Add to queue and process
        this.queue.push(notification);
        document.body.appendChild(notification);

        // Set up close button
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => this.removeNotification(notification));

        // Position and show notification
        this.processQueue();

        // Auto-remove after 3 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 3000);
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            this.queue = this.queue.filter(n => n !== notification);
            this.repositionNotifications();
        }, 300);
    }

    processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.repositionNotifications();
        this.isProcessing = false;
    }

    repositionNotifications() {
        this.queue.forEach((notification, index) => {
            const top = this.baseTop + (index * (notification.offsetHeight + this.notificationGap));
            notification.style.top = `${top}px`;
            notification.classList.add('show');
        });
    }
}

// Create and export a single instance
const notificationManager = new NotificationManager();
export default notificationManager; 