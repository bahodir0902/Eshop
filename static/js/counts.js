// static/js/counts.js - Persistent WebSocket connection
class CountsWebSocket {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
        this.connectionId = Date.now(); // Unique ID for this session

        // Only connect if we don't already have a connection
        if (!window.sharedCountsSocket) {
            this.connect();
            window.sharedCountsSocket = this; // Store globally
        }

        return window.sharedCountsSocket;
    }

    connect() {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // Check if user is authenticated
        if (!document.body.classList.contains('authenticated')) {
            console.log('User not authenticated, skipping WebSocket connection');
            return;
        }

        this.isConnecting = true;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/counts/`;

        try {
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = (event) => {
                console.log(`WebSocket connected (${this.connectionId})`);
                this.isConnecting = false;
                this.reconnectAttempts = 0;

                // Request initial counts
                this.socket.send(JSON.stringify({
                    'type': 'get_counts'
                }));
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'counts_update') {
                        this.updateCounts(data.data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onclose = (event) => {
                console.log(`WebSocket disconnected (${this.connectionId})`, event.code, event.reason);
                this.isConnecting = false;

                // Clean up global reference if this was the shared socket
                if (window.sharedCountsSocket === this) {
                    window.sharedCountsSocket = null;
                }

                // Only reconnect if the connection was closed unexpectedly
                if (event.code !== 1000 && event.code !== 1001) {
                    this.reconnectAttempts++;

                    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                        console.log(`Attempting to reconnect in ${delay}ms`);
                        setTimeout(() => {
                            this.connect();
                        }, delay);
                    }
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.isConnecting = false;
            this.reconnectAttempts++;
        }
    }

    updateCounts(counts) {
        // Update cart count
        if (counts.cart_count !== undefined) {
            this.updateBadges('.cart-count', counts.cart_count);
        }

        // Update wishlist count
        if (counts.wishlist_count !== undefined) {
            this.updateBadges('.wishlist-count', counts.wishlist_count);
        }

        // Update notifications count
        if (counts.notifications_count !== undefined) {
            this.updateBadges('.notifications-count', counts.notifications_count);
        }
    }

    updateBadges(selector, count) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const oldCount = parseInt(element.textContent) || 0;
            element.textContent = count;
            element.style.display = count > 0 ? 'flex' : 'none';

            // Add animation if count changed
            if (oldCount !== count) {
                this.addPulseAnimation(element);
            }
        });
    }

    addPulseAnimation(element) {
        element.classList.add('badge-pulse');
        setTimeout(() => {
            element.classList.remove('badge-pulse');
        }, 1000);
    }

    close() {
        if (this.socket) {
            this.socket.close(1000, 'Page navigation'); // Normal closure
        }

        // Clean up global reference
        if (window.sharedCountsSocket === this) {
            window.sharedCountsSocket = null;
        }
    }

    refreshCounts() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                'type': 'get_counts'
            }));
        }
    }

    getConnectionStatus() {
        if (!this.socket) return 'None';

        switch(this.socket.readyState) {
            case WebSocket.CONNECTING: return 'Connecting';
            case WebSocket.OPEN: return 'Open';
            case WebSocket.CLOSING: return 'Closing';
            case WebSocket.CLOSED: return 'Closed';
            default: return 'Unknown';
        }
    }
}

// Initialize persistent WebSocket connection
(function() {
    let countsSocket = null;

    function initializeCountsSocket() {
        // Check if we already have a working connection
        if (window.sharedCountsSocket &&
            window.sharedCountsSocket.socket &&
            window.sharedCountsSocket.socket.readyState === WebSocket.OPEN) {
            console.log('Using existing WebSocket connection');
            countsSocket = window.sharedCountsSocket;
            // Refresh counts for the new page
            countsSocket.refreshCounts();
            return;
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeCountsSocket);
            return;
        }

        // Only connect if user is authenticated
        if (document.body.classList.contains('authenticated')) {
            countsSocket = new CountsWebSocket();
            window.countsSocket = countsSocket; // Make it accessible
        }
    }

    // Initialize on page load
    initializeCountsSocket();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (countsSocket && !document.hidden) {
            console.log('Page visible, refreshing counts');
            countsSocket.refreshCounts();
        }
    });

    // Handle before page unload
    window.addEventListener('beforeunload', function(e) {
        // Don't close the connection on navigation - let it persist
        console.log('Page unloading, keeping WebSocket connection alive');
    });

    // Only close connection when explicitly needed (e.g., logout)
    window.addEventListener('unload', function() {
        // This fires when the page is actually being destroyed
        if (countsSocket && window.localStorage.getItem('closing_session') === 'true') {
            countsSocket.close();
            window.localStorage.removeItem('closing_session');
        }
    });

    // Debug function to check connection status
    window.checkWebSocketStatus = function() {
        if (window.sharedCountsSocket) {
            console.log('WebSocket Status:', window.sharedCountsSocket.getConnectionStatus());
            console.log('Connection ID:', window.sharedCountsSocket.connectionId);
        } else {
            console.log('No WebSocket connection found');
        }
    };
})();