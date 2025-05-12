document.addEventListener('DOMContentLoaded', function() {
    checkCartStatus(); // Add this line before your existing functions

    // Initialize add to cart buttons
    setupAddToCartButtons();

    // Initialize favorite toggle buttons
    setupFavoriteButtons();

    // Setup quick view buttons
    setupQuickViewButtons();

    // Setup Newsletter form
    setupNewsletterForm();

    // Setup product card animations
    setupProductAnimations();

    // Initialize category hover effects
    setupCategoryEffects();

    // Setup promotional countdown timer
    setupCountdownTimer();

    // Setup smooth scrolling for anchor links
    setupSmoothScrolling();

    // Handle image loading errors
    handleImageError();

});

/**
 * Product card add to cart functionality
 */
function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        const productId = button.getAttribute('data-product-id');

        // Check if this product is already in the cart
        if (window.cartItemsData && Array.isArray(window.cartItemsData)) {
            const existingItem = window.cartItemsData.find(
                item => item.product_id === parseInt(productId)
            );

            if (existingItem) {
                button.classList.add('in-cart');
                button.innerHTML = '<i class="fas fa-check"></i>';

                // Create cart indicator for items already in cart
                createOrUpdateCartIndicator(button, productId, existingItem.quantity, existingItem.id);
            }
        }

        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            // Add a ripple effect to button
            addRippleEffect(this);

            // If already in cart, do nothing (indicator handles removal)
            if (button.classList.contains('in-cart')) {
                return;
            }

            // Create quantity selector
            showQuantitySelector(button, productId);
        });
    });
}

/**
 * Show quantity selector when adding to cart
 */
function showQuantitySelector(button, productId) {
    // Remove any existing quantity selectors
    const existingSelectors = document.querySelectorAll('.quantity-selector');
    existingSelectors.forEach(selector => {
        if (typeof gsap !== 'undefined') {
            gsap.to(selector, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    selector.remove();
                }
            });
        } else {
            // Fallback if GSAP is not available
            selector.style.display = 'none';
            setTimeout(() => {
                selector.remove();
            }, 300);
        }
    });

    // Create quantity selector
    const quantitySelector = document.createElement('div');
    quantitySelector.className = 'quantity-selector';
    quantitySelector.innerHTML = `
        <button class="quantity-btn minus" data-action="decrease"><i class="fas fa-minus"></i></button>
        <input type="number" class="quantity-input" value="1" min="1" max="99">
        <button class="quantity-btn plus" data-action="increase"><i class="fas fa-plus"></i></button>
        <button class="quantity-confirm"><i class="fas fa-check"></i> Add</button>
    `;

    // Insert after button
    button.parentNode.insertBefore(quantitySelector, button.nextSibling);

    // Animate entry
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(quantitySelector,
            { height: 0, opacity: 0 },
            { height: 'auto', opacity: 1, duration: 0.3 }
        );
    } else {
        // Fallback if GSAP is not available
        quantitySelector.style.opacity = '1';
    }

    // Setup quantity buttons
    const minusBtn = quantitySelector.querySelector('.minus');
    const plusBtn = quantitySelector.querySelector('.plus');
    const quantityInput = quantitySelector.querySelector('.quantity-input');
    const confirmBtn = quantitySelector.querySelector('.quantity-confirm');

    minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        let value = parseInt(quantityInput.value);
        value = Math.max(value - 1, 1);
        quantityInput.value = value;
        addRippleEffect(minusBtn);
    });

    plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        let value = parseInt(quantityInput.value);
        value = Math.min(value + 1, 99);
        quantityInput.value = value;
        addRippleEffect(plusBtn);
    });

    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const quantity = parseInt(quantityInput.value);
        addToCart(productId, quantity, quantitySelector, button);
        addRippleEffect(confirmBtn);
    });
}

/**
 * Add to cart function
 */
function addToCart(productId, quantity, quantitySelector, button) {
    const url = ensureLanguagePrefix(`/cart/add_item/${productId}`);
    const confirmBtn = quantitySelector.querySelector('.quantity-confirm');
    const originalContent = confirmBtn.innerHTML;

    confirmBtn.innerHTML = '<span class="loading-spinner"></span> Adding...';
    confirmBtn.disabled = true;

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const itemId = data.item_id;
            const newQuantity = data.quantity;
            const cartCount = data.cart_count;

            // Update cartItemsData
            if (window.cartItemsData && Array.isArray(window.cartItemsData)) {
                const existingItemIndex = window.cartItemsData.findIndex(
                    item => item.product_id === parseInt(productId)
                );
                if (existingItemIndex !== -1) {
                    // Update existing item
                    window.cartItemsData[existingItemIndex].quantity = newQuantity;
                } else {
                    // Add new item
                    window.cartItemsData.push({
                        id: itemId,
                        product_id: parseInt(productId),
                        quantity: newQuantity
                    });
                }
            }

            // Update UI
            if (typeof gsap !== 'undefined') {
                gsap.to(quantitySelector, {
                    height: 0,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        quantitySelector.remove();
                        createOrUpdateCartIndicator(button, productId, newQuantity, itemId);
                    }
                });
            } else {
                // Fallback if GSAP is not available
                quantitySelector.style.display = 'none';
                setTimeout(() => {
                    quantitySelector.remove();
                    createOrUpdateCartIndicator(button, productId, newQuantity, itemId);
                }, 300);
            }

            updateCartCounter(cartCount);
            showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`, 'success');
        } else {
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
            showToast('Failed to add item: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        confirmBtn.innerHTML = originalContent;
        confirmBtn.disabled = false;
        showToast('Network error occurred', 'error');
    });
}

/**
 * Create or update cart indicator after adding to cart
 */
function createOrUpdateCartIndicator(button, productId, quantity, itemId) {
    // Update button state
    button.classList.add('in-cart');
    button.innerHTML = '<i class="fas fa-check"></i>';

    // Check if indicator already exists
    let cartIndicator = button.parentElement.querySelector('.in-cart-indicator');

    if (!cartIndicator) {
        // Create new indicator
        cartIndicator = document.createElement('div');
        cartIndicator.className = 'in-cart-indicator';
        cartIndicator.innerHTML = `
            <span class="cart-quantity">${quantity} in cart</span>
            <button class="remove-from-cart" data-item-id="${itemId}" data-product-id="${productId}">
                <i class="fas fa-trash-alt"></i> Remove
            </button>
        `;

        // Insert after button
        button.parentNode.insertBefore(cartIndicator, button.nextSibling);

        // Animate entry
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(cartIndicator,
                { height: 0, opacity: 0 },
                { height: 'auto', opacity: 1, duration: 0.3 }
            );
        } else {
            // Fallback if GSAP is not available
            cartIndicator.style.opacity = '1';
        }
    } else {
        // Update existing indicator
        cartIndicator.querySelector('.cart-quantity').textContent = `${quantity} in cart`;
        cartIndicator.querySelector('.remove-from-cart').setAttribute('data-item-id', itemId);
    }

    // Set up remove button
    const removeBtn = cartIndicator.querySelector('.remove-from-cart');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const itemId = removeBtn.getAttribute('data-item-id');
            removeFromCart(itemId);
            addRippleEffect(removeBtn);
        });
    }
}

/**
 * Remove from cart function
 */
function removeFromCart(itemId) {
    const removeBtn = document.querySelector(`.remove-from-cart[data-item-id="${itemId}"]`);
    if (!removeBtn) return;

    const cartIndicator = removeBtn.closest('.in-cart-indicator');
    const card = cartIndicator.closest('.product-card');
    const addToCartBtn = card.querySelector('.add-to-cart');
    const productId = removeBtn.getAttribute('data-product-id');

    removeBtn.innerHTML = '<span class="loading-spinner"></span>';
    removeBtn.disabled = true;

    const url = ensureLanguagePrefix(`/cart/remove_cart_item_in_list/${itemId}`);

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof gsap !== 'undefined') {
                gsap.to(cartIndicator, {
                    opacity: 0,
                    height: 0,
                    duration: 0.3,
                    onComplete: () => {
                        cartIndicator.remove();
                    }
                });
            } else {
                // Fallback if GSAP is not available
                cartIndicator.style.display = 'none';
                setTimeout(() => {
                    cartIndicator.remove();
                }, 300);
            }

            if (addToCartBtn) {
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i>';
                addToCartBtn.classList.remove('in-cart');
            }

            // Update cartItemsData if it exists
            if (window.cartItemsData && Array.isArray(window.cartItemsData)) {
                window.cartItemsData = window.cartItemsData.filter(item => item.id !== parseInt(itemId));
            }

            updateCartCounter(data.cart_count);
            showToast('Item removed from cart', 'success');
        } else {
            removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Remove';
            removeBtn.disabled = false;
            showToast('Failed to remove item: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Remove';
        removeBtn.disabled = false;
        showToast('Network error occurred', 'error');
    });
}

/**
 * Update cart counter with animation
 */
function updateCartCounter(newCount) {
    const cartCounter = document.querySelector('.cart-counter');
    if (!cartCounter) return;

    cartCounter.textContent = newCount;

    if (typeof gsap !== 'undefined') {
        gsap.fromTo(cartCounter,
            { scale: 1.5, backgroundColor: 'var(--accent-color)' },
            { scale: 1, backgroundColor: '', duration: 0.5, ease: 'elastic.out(1.2, 0.4)' }
        );
    }
}

/**
 * Setup favorite buttons functionality
 */
function setupFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.toggle-favorite');

    favoriteButtons.forEach(button => {
        const productId = button.getAttribute('data-product-id');

        // Check if product is in favorites
        checkIfProductInFavorites(productId, button);

        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(productId, button);
            addRippleEffect(this);
        });
    });
}

/**
 * Check if product is in favorites
 */
function checkIfProductInFavorites(productId, button) {
    fetch(ensureLanguagePrefix(`/favourites/check/${productId}/`), {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.is_favorite) {
            button.classList.add('favorite-active');
            button.innerHTML = '<i class="fas fa-heart-broken"></i>';
        }
    })
    .catch(error => {
        console.error('Error checking favorite status:', error);
    });
}

/**
 * Toggle favorite status
 */
function toggleFavorite(productId, button) {
    const isActive = button.classList.contains('favorite-active');
    const url = isActive
        ? ensureLanguagePrefix(`/favourites/remove_favourite_item/${productId}`)
        : ensureLanguagePrefix(`/favourites/add_favourite_item/${productId}`);

    button.innerHTML = '<span class="loading-spinner"></span>';

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isActive) {
                button.classList.remove('favorite-active');
                button.innerHTML = '<i class="fas fa-heart"></i>';
                showToast('Removed from favorites', 'success');
            } else {
                button.classList.add('favorite-active');
                button.innerHTML = '<i class="fas fa-heart-broken"></i>';
                showToast('Added to favorites', 'success');
            }
        } else {
            button.innerHTML = '<i class="fas fa-heart"></i>';
            showToast(data.error || 'Failed to update favorites', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showToast('Network error occurred', 'error');
    });
}

/**
 * Setup quick view buttons
 */
function setupQuickViewButtons() {
    const quickViewButtons = document.querySelectorAll('.quick-view');

    quickViewButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const productId = this.getAttribute('data-product-id');
            showQuickView(productId);
            addRippleEffect(this);
        });
    });
}

/**
 * Show quick view modal
 */
function showQuickView(productId) {
    // Placeholder for quick view functionality
    showToast('Quick view coming soon!', 'info');
}

/**
 * Setup product card animations
 */
function setupProductAnimations() {
    const productCards = document.querySelectorAll('.product-card');

    // Set animation delays for staggered effect
    productCards.forEach((card, index) => {
        card.style.setProperty('--card-index', index % 4);

        // Animate on scroll if IntersectionObserver is supported
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(card);
        } else {
            // Fallback for browsers without IntersectionObserver
            card.classList.add('animate-in');
        }
    });
}

/**
 * Setup category card effects
 */
function setupCategoryEffects() {
    const categoryCards = document.querySelectorAll('.category-card');

    categoryCards.forEach((card, index) => {
        card.style.setProperty('--card-index', index % 6);

        // Only use GSAP if it's available
        if (typeof gsap !== 'undefined') {
            // Add hover effect
            card.addEventListener('mouseenter', function() {
                gsap.to(this.querySelector('.category-icon'), {
                    y: -10,
                    scale: 1.1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', function() {
                gsap.to(this.querySelector('.category-icon'), {
                    y: 0,
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.in'
                });
            });
        }
    });
}

/**
 * Setup newsletter form submission
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();

            if (email) {
                const button = this.querySelector('button[type="submit"]');
                const originalText = button.innerHTML;

                button.innerHTML = '<span class="loading-spinner"></span> Subscribing...';
                button.disabled = true;

                // Simulate API call (replace with actual API in production)
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    emailInput.value = '';

                    showToast('Thank you for subscribing to our newsletter!', 'success');
                }, 1500);
            }
        });
    }
}

/**
 * Setup countdown timer for promotion
 */
function setupCountdownTimer() {
    const countdownElement = document.getElementById('promo-countdown');
    if (!countdownElement) return;

    // Set the end date to 7 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    function updateCountdown() {
        const now = new Date();
        const distance = endDate - now;

        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update elements
        document.getElementById('countdown-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('countdown-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('countdown-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('countdown-seconds').textContent = seconds.toString().padStart(2, '0');

        // If the countdown is over, show expired message
        if (distance < 0) {
            clearInterval(timerInterval);
            countdownElement.innerHTML = '<div class="countdown-expired">Offer Expired</div>';
        }
    }

    // Initial update
    updateCountdown();

    // Update every second
    const timerInterval = setInterval(updateCountdown, 1000);
}

/**
 * Setup smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Handle image error loading with base64 encoded placeholders
 */
function handleImageError() {
    // Create Base64 image data for placeholders
    const productPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGY5ZmEiLz48dGV4dCB4PSIyMDAiIHk9IjE1MCIgZmlsbD0iIzlkOWQ5ZCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+UHJvZHVjdCBJbWFnZTwvdGV4dD48L3N2Zz4=';

    const shopPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWYyZmYiLz48dGV4dCB4PSIyMDAiIHk9IjEwMCIgZmlsbD0iIzYzNjZmMSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+U2hvcDwvdGV4dD48L3N2Zz4=';

    const genericPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmOWZhZmIiLz48dGV4dCB4PSIyMDAiIHk9IjIwMCIgZmlsbD0iIzllOWU5ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+PC9zdmc+';

    const images = document.querySelectorAll('img');

    images.forEach(img => {
        img.onerror = function() {
            if (img.src.includes('data:image') ||
                img.src.includes('placeholder')) {
                return; // Already using placeholder image
            }

            // Replace with appropriate placeholder based on context
            if (img.closest('.product-image')) {
                this.src = productPlaceholder;
            } else if (img.closest('.shop-image')) {
                this.src = shopPlaceholder;
            } else {
                this.src = genericPlaceholder;
            }
        };
    });
}

/**
 * Add ripple effect to buttons
 */
function addRippleEffect(button) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    button.appendChild(ripple);

    const rect = button.getBoundingClientRect();

    // Position the ripple at the center of the button or click position
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${-size/2 + rect.width/2}px`;
    ripple.style.top = `${-size/2 + rect.height/2}px`;

    ripple.classList.add('animate');

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Ensure language prefix is added to URLs
 */
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

/**
 * Get language prefix from URL or HTML tag
 */
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

/**
 * Get CSRF token for Django
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Add icon based on type
    let icon;
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fas fa-info-circle"></i>';
    }

    toast.innerHTML = `
        ${icon}
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
    `;

    // Add to container
    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Add custom CSS for ripple effect
 */
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            pointer-events: none;
            z-index: 1;
        }
        
        .ripple.animate {
            animation: ripple 0.6s linear;
        }
        
        .action-btn, .btn-primary, .btn-secondary, .btn-outline {
            position: relative;
            overflow: hidden;
        }
        
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .fade-out {
            opacity: 0;
            transform: translateX(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
    `;
    document.head.appendChild(style);
})();

function checkCartStatus() {
    // Cart data is passed from Django via window.cartItemsData
    if (window.cartItemsData && Array.isArray(window.cartItemsData)) {
        // Update buttons for items already in cart
        window.cartItemsData.forEach(cartItem => {
            const productId = cartItem.product_id;
            const button = document.querySelector(`.add-to-cart[data-product-id="${productId}"]`);

            if (button) {
                button.classList.add('in-cart');
                button.innerHTML = '<i class="fas fa-check"></i>';

                // Create cart indicator for items already in cart
                createOrUpdateCartIndicator(button, productId, cartItem.quantity, cartItem.id);
            }
        });
    }
}