// static/js/base.js

document.addEventListener('DOMContentLoaded', function () {
    const header = document.getElementById('page-header');
    const scrollThreshold = 50; // Pixels to scroll before changing navbar style

    const handleScroll = () => {
        if (header) {
            if (window.scrollY > scrollThreshold) {
                header.classList.add('navbar-scrolled');
            } else {
                header.classList.remove('navbar-scrolled');
            }
        }
    };

    // Initial check in case the page is already scrolled
    handleScroll();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, {passive: true}); // Use passive listener for performance


    const languageItems = document.querySelectorAll('.language-item');

    languageItems.forEach(item => {
        item.addEventListener('mouseover', () => {
            item.style.transform = 'translateX(5px)';
        });

        item.addEventListener('mouseout', () => {
            item.style.transform = 'translateX(0)';
        });
    });



    // Optional: Update cart/wishlist/notifications counts via AJAX
    function updateCounts() {
        fetch('/common/get-counts') // Example endpoint
            .then(response => response.json())
            .then(data => {
                const cartBadge = document.querySelector('.cart-count');
                const wishlistBadge = document.querySelector('.wishlist-count');
                const notificationsBadge = document.querySelector('.notifications-count');

                if (cartBadge && data.cart_count !== undefined) {
                    cartBadge.textContent = data.cart_count;
                    cartBadge.style.display = data.cart_count > 0 ? 'inline-block' : 'none';
                }
                if (wishlistBadge && data.wishlist_count !== undefined) {
                    wishlistBadge.textContent = data.wishlist_count;
                    wishlistBadge.style.display = data.wishlist_count > 0 ? 'inline-block' : 'none';
                }
                if (notificationsBadge && data.notifications_count !== undefined) {
                    notificationsBadge.textContent = data.notifications_count;
                    notificationsBadge.style.display = data.notifications_count > 0 ? 'inline-block' : 'none';
                }
            })
            .catch(error => console.error('Error fetching counts:', error));
    }

    updateCounts(); // Call on page load or after relevant actions

    // Optionally refresh notification count every 60 seconds
    setInterval(updateCounts, 60000);
});