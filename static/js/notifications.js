function getLanguagePrefix() {
    // Extract from URL path
    const pathSegments = window.location.pathname.split('/').filter(Boolean);

    // Check if the first segment is a language code (typically 2-5 characters)
    if (pathSegments.length > 0 && /^[a-z]{2}(-[a-z]{2,3})?$/i.test(pathSegments[0])) {
        return `/${pathSegments[0]}`;
    }

    // If no language in path, check if there's a language in HTML tag
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang !== 'en') {
        return `/${htmlLang}`;
    }

    // Default (no language prefix)
    return '';
}

// Function to ensure URL has the correct language prefix
function ensureLanguagePrefix(url) {
    // Don't modify absolute URLs or URLs that already start with the language prefix
    if (url.startsWith('http') || url.startsWith('//')) {
        return url;
    }

    const langPrefix = getLanguagePrefix();

    // If we have a language prefix and the URL doesn't already have it
    if (langPrefix && !url.startsWith(langPrefix)) {
        // Make sure we don't add the prefix to URLs that already have it
        const urlWithoutLeadingSlash = url.startsWith('/') ? url.substring(1) : url;
        return `${langPrefix}/${urlWithoutLeadingSlash}`;
    }

    return url;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize notifications
  const notificationsApp = {
    elements: {
      notificationsList: document.querySelector('.notifications-list'),
      notificationItems: document.querySelectorAll('.notification-item'),
      tabButtons: document.querySelectorAll('.tab-btn'),
      markReadButtons: document.querySelectorAll('.btn-mark-read'),
      markAllReadButton: document.querySelector('.btn-mark-all-read')
    },

    init() {
      this.setupEventListeners();
      this.setupAnimations();
    },

    setupEventListeners() {
      // Tab filtering
      this.elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.filterNotifications(e.target.dataset.filter);
          this.setActiveTab(e.target);
        });
      });

      // Mark read with AJAX if configured
      if (this.elements.markReadButtons) {
        this.elements.markReadButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            if (this.shouldUseAjax()) {
              e.preventDefault();
              const notificationItem = e.target.closest('.notification-item');
              const notificationId = this.getNotificationIdFromUrl(e.target.href);
              this.markAsReadAjax(notificationId, notificationItem);
            }
          });
        });
      }

      // Mark all as read with AJAX if configured
      if (this.elements.markAllReadButton) {
        this.elements.markAllReadButton.addEventListener('click', (e) => {
          if (this.shouldUseAjax()) {
            e.preventDefault();
            this.markAllAsReadAjax();
          }
        });
      }
    },

    setupAnimations() {
      // Add staggered animation to notification items
      this.elements.notificationItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`;
      });
    },

    setActiveTab(targetTab) {
      this.elements.tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      targetTab.classList.add('active');
    },

    filterNotifications(filter) {
      if (!this.elements.notificationItems.length) return;

      this.elements.notificationItems.forEach(item => {
        if (filter === 'all') {
          item.style.display = 'flex';
        } else if (filter === 'unread') {
          if (item.classList.contains('unread')) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        }
      });
    },

    shouldUseAjax() {
      // This could be a configuration option set in Django settings
      // For now, return true to enable AJAX functionality
      return true;
    },

    getNotificationIdFromUrl(url) {
      // Extract notification ID from URL
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 2];
    },

    markAsReadAjax(notificationId, notificationItem) {
      fetch(ensureLanguagePrefix(`/notifications/mark-read/${notificationId}/`), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => {
        if (response.ok) {
          // Update UI
          notificationItem.classList.remove('unread');
          const actionsDiv = notificationItem.querySelector('.notification-actions');
          if (actionsDiv) {
            actionsDiv.remove();
          }

          // Update badge count
          this.updateUnreadBadge(-1);
        }
      })
      .catch(error => {
        console.error('Error marking notification as read:', error);
      });
    },

    markAllAsReadAjax() {
      fetch(ensureLanguagePrefix('/notifications/mark-all-read/'), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(response => {
        if (response.ok) {
          // Update UI for all unread notifications
          const unreadItems = document.querySelectorAll('.notification-item.unread');
          unreadItems.forEach(item => {
            item.classList.remove('unread');
            const actionsDiv = item.querySelector('.notification-actions');
            if (actionsDiv) {
              actionsDiv.remove();
            }
          });

          // Remove the mark all as read button
          if (this.elements.markAllReadButton) {
            this.elements.markAllReadButton.closest('.notification-actions-top').remove();
          }
        }
      })
      .catch(error => {
        console.error('Error marking all notifications as read:', error);
      });
    },

    updateUnreadBadge(change) {
      const badge = document.querySelector('.notification-badge');
      if (badge) {
        const currentCount = parseInt(badge.textContent);
        const newCount = currentCount + change;

        if (newCount <= 0) {
          // If no unread notifications, remove the entire actions section
          if (this.elements.markAllReadButton) {
            this.elements.markAllReadButton.closest('.notification-actions-top').remove();
          }
        } else {
          badge.textContent = newCount;
        }
      }
    }
  };

  // Initialize the notifications
  notificationsApp.init();
});