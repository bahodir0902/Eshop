// static/js/base.js

document.addEventListener('DOMContentLoaded', function () {
    // Desktop navbar scrolling effect
    const header = document.getElementById('page-header');
    const scrollThreshold = 50;

    const handleScroll = () => {
        if (header) {
            if (window.scrollY > scrollThreshold) {
                header.classList.add('navbar-scrolled');
            } else {
                header.classList.remove('navbar-scrolled');
            }
        }
    };

    // Initial check in case page is already scrolled
    handleScroll();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, {passive: true});

    // Mobile slide-in menu functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    // Function to open mobile menu
    const openMobileMenu = () => {
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');

        // Add animation delay for menu items
        const menuLinks = document.querySelectorAll('.mobile-menu-link');
        menuLinks.forEach((link, index) => {
            link.style.opacity = '0';
            link.style.transform = 'translateX(-10px)';
            setTimeout(() => {
                link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                link.style.opacity = '1';
                link.style.transform = 'translateX(0)';
            }, 50 + (index * 30)); // Staggered animation
        });
    };

    // Function to close mobile menu
    const closeMobileMenu = () => {
        document.body.style.overflow = ''; // Restore scrolling
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
    };

    // Add event listeners for mobile menu toggle
    if (navbarToggler) {
        navbarToggler.addEventListener('click', openMobileMenu);
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu when clicking on mobile menu links that navigate to a new page
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link:not([data-toggle])');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Only close menu for links that navigate away (not dropdown toggles)
            if (!link.classList.contains('dropdown-toggle')) {
                closeMobileMenu();
            }
        });
    });

    // Add touch swipe to close mobile menu
    let touchStartX = 0;
    let touchEndX = 0;

    if (mobileMenu) {
        mobileMenu.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        mobileMenu.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});
    }

    const handleSwipe = () => {
        // If swiped left (more than 70px)
        if (touchEndX < touchStartX - 70) {
            closeMobileMenu();
        }
    };

    // Language selector hover effect
    const languageItems = document.querySelectorAll('.language-item');
    languageItems.forEach(item => {
        item.addEventListener('mouseover', () => {
            item.style.transform = 'translateX(5px)';
        });

        item.addEventListener('mouseout', () => {
            item.style.transform = 'translateX(0)';
        });
    });

    // Mobile language options visual feedback
    const mobileLanguageOptions = document.querySelectorAll('.mobile-language-option');
    mobileLanguageOptions.forEach(option => {
        option.addEventListener('mouseover', () => {
            if (!option.classList.contains('active')) {
                option.style.transform = 'translateY(-3px)';
                option.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }
        });

        option.addEventListener('mouseout', () => {
            if (!option.classList.contains('active')) {
                option.style.transform = '';
                option.style.boxShadow = '';
            }
        });
    });

    // Optional: Update cart/wishlist/notifications counts via AJAX
    function updateCounts() {
        fetch('/common/get-counts') // Example endpoint
            .then(response => response.json())
            .then(data => {
                // Update all badge counters
                const countElements = document.querySelectorAll('.cart-count, .wishlist-count, .notifications-count');

                countElements.forEach(element => {
                    const type = element.classList.contains('cart-count') ? 'cart_count' :
                                element.classList.contains('wishlist-count') ? 'wishlist_count' : 'notifications_count';

                    if (data[type] !== undefined) {
                        element.textContent = data[type];
                        element.style.display = data[type] > 0 ? 'flex' : 'none';
                    }
                });
            })
            .catch(error => console.error('Error fetching counts:', error));
    }

    // Initial count update
    updateCounts();

    // Refresh notification count every 60 seconds
    setInterval(updateCounts, 60000);
});