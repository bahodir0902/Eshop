// Enhanced Base JS with improved mobile menu

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

    // Enhanced Mobile Menu Functionality
    setupMobileMenu();

    // Language selector hover effect
    setupLanguageSelector();
    
    // Add ripple effect to buttons
    setupRippleEffect();
});

/**
 * Set up the enhanced mobile menu
 */
function setupMobileMenu() {
    // Get elements
    const navbarToggler = document.querySelector('.navbar-toggler');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    // Replace navbar toggler icon with custom HTML
    if (navbarToggler) {
        const togglerIcon = navbarToggler.querySelector('.navbar-toggler-icon');
        if (togglerIcon) {
            togglerIcon.innerHTML = '<div></div>';
        }
    }

    // Function to open mobile menu
    const openMobileMenu = () => {
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');

        // Add animations for menu sections
        const menuSections = document.querySelectorAll('.mobile-menu-section');
        menuSections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            setTimeout(() => {
                section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 100 + (index * 100)); // Staggered animation for sections
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
        navbarToggler.addEventListener('click', function() {
            // Prevent default Bootstrap behavior
            event.preventDefault();
            openMobileMenu();
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', function() {
            closeMobileMenu();

            // Add rotation animation to close button
            this.style.transition = 'transform 0.3s ease';
            this.style.transform = 'rotate(90deg)';
            setTimeout(() => {
                this.style.transform = 'rotate(0deg)';
            }, 300);
        });
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

    // Add active indicator to current page in mobile menu
    highlightCurrentPageInMenu();
}

/**
 * Set up language selector effects
 */
function setupLanguageSelector() {
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
                option.style.boxShadow = '0 5px 15px rgba(99, 102, 241, 0.15)';
            }
        });

        option.addEventListener('mouseout', () => {
            if (!option.classList.contains('active')) {
                option.style.transform = '';
                option.style.boxShadow = '';
            }
        });
    });
}

/**
 * Set up counts update functionality
 */
// function setupCountsUpdate() {
//     function updateCounts() {
//         // Example endpoint - replace with your actual endpoint
//         fetch('/common/get-counts/')
//             .then(response => response.json())
//             .then(data => {
//                 // Update all badge counters
//                 const countElements = document.querySelectorAll('.cart-count, .wishlist-count, .notifications-count');
//
//                 countElements.forEach(element => {
//                     const type = element.classList.contains('cart-count') ? 'cart_count' :
//                                 element.classList.contains('wishlist-count') ? 'wishlist_count' : 'notifications_count';
//
//                     if (data[type] !== undefined) {
//                         element.textContent = data[type];
//                         element.style.display = data[type] > 0 ? 'flex' : 'none';
//
//                         // Add a pulse animation when count changes
//                         element.classList.add('badge-pulse');
//                         setTimeout(() => {
//                             element.classList.remove('badge-pulse');
//                         }, 1000);
//                     }
//                 });
//             })
//             .catch(error => console.warn('Count update endpoint not available:', error));
//     }
//
//     // Initial count update
//     updateCounts();
//
//     // Refresh notification count every 60 seconds
//     setInterval(updateCounts, 60000);
// }

/**
 * Highlight current page in mobile menu
 */
function highlightCurrentPageInMenu() {
    // Get current path
    const currentPath = window.location.pathname;

    // Find all links in mobile menu
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

    // Loop through links and add active class if href matches current path
    mobileMenuLinks.forEach(link => {
        const href = link.getAttribute('href');

        // Skip links with # or javascript:void(0)
        if (href && href !== '#' && !href.startsWith('javascript')) {
            // Clean up paths for comparison
            const linkPath = new URL(href, window.location.origin).pathname;

            // Check if current path includes link path (for parent pages)
            if (currentPath === linkPath ||
                (linkPath !== '/' && currentPath.startsWith(linkPath))) {
                link.classList.add('active');
            }
        }
    });
}

/**
 * Add ripple effect to buttons
 */
function setupRippleEffect() {
    // Add ripple effect to all buttons and links in the mobile menu
    const buttons = document.querySelectorAll('.mobile-menu-link, .btn, .navbar-toggler, .mobile-menu-close, .nav-icon-link');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');

            // Get button position
            const rect = this.getBoundingClientRect();

            // Calculate ripple size and position
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            // Set ripple position and size
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            // Add ripple to button
            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Utility function to handle GSAP animations if it's available
function animateWithGSAP(element, fromVars, toVars, duration = 0.3) {
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(element, fromVars, { ...toVars, duration });
    } else {
        // Fallback for when GSAP isn't available
        Object.assign(element.style, toVars);
    }
}

// Add utility functions for consistent animations
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
}

function slideIn(element, direction = 'right', duration = 300) {
    const translateValue = direction === 'right' ? 'translateX(-20px)' : 'translateY(-20px)';
    element.style.transform = translateValue;
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
    setTimeout(() => {
        element.style.transform = 'translate(0)';
        element.style.opacity = '1';
    }, 10);
}

// Export functions for use in other scripts
window.mobileMenuUtils = {
    fadeIn,
    slideIn,
    animateWithGSAP
};