// static/js/base.js

document.addEventListener('DOMContentLoaded', function() {
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
    window.addEventListener('scroll', handleScroll, { passive: true }); // Use passive listener for performance

    // Optional: Update cart/wishlist counts if needed via AJAX after certain actions
    // Example function (replace with your actual logic)
    function updateCounts() {
        fetch('/common/get-counts') // Example endpoint
            .then(response => response.json())
            .then(data => {
                const cartBadge = document.querySelector('.cart-count');
                const wishlistBadge = document.querySelector('.wishlist-count');
                if (cartBadge && data.cart_count !== undefined) {
                    cartBadge.textContent = data.cart_count;
                    cartBadge.style.display = data.cart_count > 0 ? 'inline-block' : 'none';
                }
                if (wishlistBadge && data.wishlist_count !== undefined) {
                    wishlistBadge.textContent = data.wishlist_count;
                    wishlistBadge.style.display = data.wishlist_count > 0 ? 'inline-block' : 'none';
                }
            })
            .catch(error => console.error('Error fetching counts:', error));
    }
    updateCounts(); // Call on page load or after relevant actions

});