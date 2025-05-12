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

/**
 * Shopping Cart JavaScript
 * Enhances the functionality of the cart page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Set animation delays for cart items
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach((item, index) => {
        item.style.setProperty('--item-index', index);
    });

    // Initialize cart summary
    updateCartSummary();

    // Handle quantity changes
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const item = this.closest('.cart-item');
            const quantityInput = item.querySelector('.quantity-input');
            const productId = item.getAttribute('data-product-id');
            const stockCount = parseInt(item.getAttribute('data-stock')) || 99; // Get stock from data attribute
            let quantity = parseInt(quantityInput.value);

            if (action === 'increase') {
                // Check if we can increase quantity
                if (quantity >= stockCount) {
                    showToast(`Only ${stockCount} items available in stock`, 'error');
                    return;
                }
                quantity = Math.min(quantity + 1, stockCount); // Use actual stock as max
            } else if (action === 'decrease') {
                quantity = Math.max(quantity - 1, 1); // Min quantity is 1
            }

            // Update display
            quantityInput.value = quantity;

            // Update item total price
            const unitPrice = parseFloat(item.querySelector('.price-value').textContent.replace('$', ''));
            const totalPrice = (unitPrice * quantity).toFixed(2);
            item.querySelector('.price-total').textContent = '$' + totalPrice;

            // Update cart summary
            updateCartSummary();

            // Save changes via AJAX
            updateCartItemQuantity(productId, quantity);
        });
    });

    // Remove item functionality
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.cart-item');
            const productId = item.getAttribute('data-product-id');

            // Visual feedback before removal
            item.style.opacity = '0.5';
            item.style.transform = 'translateX(20px)';

            // Simulate AJAX call and remove item
            setTimeout(() => {
                item.style.height = item.offsetHeight + 'px';
                item.style.overflow = 'hidden';
                item.style.padding = '0';
                item.style.margin = '0';
                setTimeout(() => {
                    item.style.height = '0';
                    setTimeout(() => {
                        item.remove();
                        updateCartItemsCount();
                        updateCartSummary();
                        checkEmptyCart();
                    }, 300);
                }, 200);
            }, 300);

            // AJAX call to remove item
            removeCartItem(productId);
        });
    });

    // "Save for later" functionality
    document.querySelectorAll('.save-for-later').forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');

            // Toggle heart icon
            if (icon.classList.contains('fa-heart-o') || !icon.classList.contains('fa-heart')) {
                icon.classList.remove('fa-heart-o');
                icon.classList.add('fa-heart');
                showToast('Item saved for later!');
            } else {
                icon.classList.remove('fa-heart');
                icon.classList.add('fa-heart-o');
                showToast('Item removed from saved items.');
            }
        });
    });

    // Clear cart functionality
    const clearCartBtn = document.querySelector('.btn-clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                const cartItems = document.querySelectorAll('.cart-item');

                // Animate removal of all items
                cartItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.opacity = '0';
                        item.style.transform = 'translateX(20px)';
                    }, index * 100);
                });

                // Remove all items after animation
                setTimeout(() => {
                    cartItems.forEach(item => item.remove());
                    updateCartItemsCount();
                    updateCartSummary();
                    checkEmptyCart();
                }, cartItems.length * 100 + 300);

                // AJAX call to clear cart
                clearCart();
            }
        });
    }

    // Checkout button animation
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('mouseenter', function() {
            this.classList.add('pulse-animation');
        });

        checkoutBtn.addEventListener('mouseleave', function() {
            this.classList.remove('pulse-animation');
        });

        checkoutBtn.addEventListener('click', function() {
            // Show loading indicator
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="loading-spinner"></span> Processing...';
            this.disabled = true;

            // Simulate processing
            setTimeout(() => {
                window.location.href = '/orders/checkout'; // Redirect to checkout page
            }, 1500);
        });
    }

    // Promo code application
    const applyPromoBtn = document.querySelector('.btn-apply');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', function() {
            const promoInput = this.previousElementSibling;
            const promoCode = promoInput.value.trim();

            if (promoCode === '') {
                showToast('Please enter a promo code', 'error');
                return;
            }

            // Simulate AJAX call for promo code verification
            this.innerHTML = '<span class="loading-spinner"></span>';
            this.disabled = true;

            setTimeout(() => {
                // Simulate successful promo code application (in real app, this would be server response)
                if (promoCode.toLowerCase() === 'discount20') {
                    showToast('Promo code applied successfully! 20% discount', 'success');

                    // Add discount row to summary
                    const subtotalElement = document.getElementById('subtotal');
                    const subtotal = parseFloat(subtotalElement.textContent);
                    const discount = subtotal * 0.2;

                    const discountRowExists = document.querySelector('.discount-amount');

                    if (!discountRowExists) {
                        const discountRow = document.createElement('div');
                        discountRow.className = 'summary-row discount-amount';
                        discountRow.innerHTML = `<span>Discount (20%)</span><span>-$${discount.toFixed(2)}</span>`;

                        const divider = document.querySelector('.summary-divider');
                        divider.parentNode.insertBefore(discountRow, divider);
                    }

                    // Update total
                    updateCartSummary(true);
                } else {
                    showToast('Invalid promo code', 'error');
                }

                this.innerHTML = 'Apply';
                this.disabled = false;
            }, 1000);
        });
    }

    // Summary toggle for mobile
    const summaryToggle = document.querySelector('.summary-toggle');
    if (summaryToggle) {
        summaryToggle.addEventListener('click', function() {
            const summaryContent = document.querySelector('.summary-content');
            const icon = this.querySelector('i');

            if (summaryContent.style.display === 'none') {
                summaryContent.style.display = 'block';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                summaryContent.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    }

    // Add stock indicator for each item
    addStockIndicators();
});

/**
 * Add stock indicators to cart items
 */
function addStockIndicators() {
    const cartItems = document.querySelectorAll('.cart-item');

    cartItems.forEach(item => {
        const stockCount = parseInt(item.getAttribute('data-stock')) || 0;
        const currentQuantity = parseInt(item.querySelector('.quantity-input').value);

        // Create stock indicator
        const stockIndicator = document.createElement('div');
        stockIndicator.className = 'stock-indicator';

        if (stockCount <= 5) {
            stockIndicator.className += ' low-stock';
            stockIndicator.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> Only ${stockCount} left in stock`;
        } else {
            stockIndicator.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${stockCount} in stock`;
        }

        // Insert after item info
        const itemInfo = item.querySelector('.item-info');
        itemInfo.appendChild(stockIndicator);

        // Disable increase button if at stock limit
        const increaseBtn = item.querySelector('.increase-quantity');
        if (currentQuantity >= stockCount) {
            increaseBtn.disabled = true;
            increaseBtn.style.opacity = '0.5';
            increaseBtn.style.cursor = 'not-allowed';
        }
    });
}

/**
 * Update cart summary totals
 */
function updateCartSummary(hasDiscount = false) {
    let subtotal = 0;
    const items = document.querySelectorAll('.cart-item');

    items.forEach(item => {
        const price = parseFloat(item.querySelector('.price-value').textContent.replace('$', ''));
        const quantity = parseInt(item.querySelector('.quantity-input').value);
        subtotal += price * quantity;
    });

    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');

    if (subtotalElement) {
        subtotalElement.textContent = subtotal.toFixed(2);
    }

    if (totalElement) {
        let total = subtotal;

        // Apply discount if exists
        if (hasDiscount) {
            const discount = subtotal * 0.2; // 20% discount
            total = subtotal - discount;
        }

        totalElement.textContent = total.toFixed(2);
    }
}

/**
 * Update cart items count
 */
function updateCartItemsCount() {
    const items = document.querySelectorAll('.cart-item');
    const countElement = document.querySelector('.items-count');

    if (countElement) {
        countElement.textContent = `${items.length} Items`;
    }
}

/**
 * Check if cart is empty and show empty state
 */
function checkEmptyCart() {
    const items = document.querySelectorAll('.cart-item');
    const cartItemsSection = document.querySelector('.cart-items-section');
    const orderSummary = document.querySelector('.order-summary');

    if (items.length === 0) {
        // Show empty cart message
        const emptyCart = document.createElement('div');
        emptyCart.className = 'empty-cart';
        emptyCart.innerHTML = `
            <div class="empty-cart-illustration">
                <i class="fa-solid fa-cart-shopping"></i>
                <div class="empty-cart-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <a href="/products/" class="btn-continue-shopping">Continue Shopping</a>
        `;

        // Clear existing content and add empty cart message
        cartItemsSection.innerHTML = '';
        cartItemsSection.appendChild(emptyCart);

        // Hide order summary
        if (orderSummary) {
            orderSummary.style.display = 'none';
        }
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('cart-toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cart-toast';
        document.body.appendChild(toast);

        // Add toast styles
        const style = document.createElement('style');
        style.textContent = `
            #cart-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background-color: white;
                color: #1e293b;
                border-radius: 8px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 300px;
            }
            #cart-toast.show {
                transform: translateY(0);
                opacity: 1;
            }
            #cart-toast.success { border-left: 4px solid #10b981; }
            #cart-toast.error { border-left: 4px solid #ef4444; }
            #cart-toast.info { border-left: 4px solid #6366f1; }
            
            .stock-indicator {
                font-size: 0.8rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                margin-top: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            
            .stock-indicator {
                background-color: #f0f9ff;
                color: #0369a1;
            }
            
            .stock-indicator.low-stock {
                background-color: #fef7f7;
                color: #dc2626;
            }
            
            .qty-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }

    // Set message and type
    toast.textContent = message;
    toast.className = type;

    // Add icon based on type
    let icon;
    if (type === 'success') {
        icon = '<i class="fa-solid fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fa-solid fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fa-solid fa-info-circle"></i>';
    }

    toast.innerHTML = icon + message;

    // Show toast
    toast.classList.add('show');

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * AJAX Functions
 * Replace these with actual AJAX calls in production
 */
function updateCartItemQuantity(productId, quantity) {
    console.log(`Updating product ${productId} quantity to ${quantity}`);

    let formData = new FormData();
    formData.append('quantity', quantity);

    fetch(ensureLanguagePrefix(`/cart/update_item/${productId}`), {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')  // CSRF protection
        },
        body: formData  // Sending as form-data, NOT JSON
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Cart updated', 'success');
        } else {
            showToast('Failed to update cart', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    });
}

function removeCartItem(productId) {
    console.log(`Removing product ${productId} from cart`);

    let formData = new FormData();
    formData.append('product_id', productId);

    fetch(ensureLanguagePrefix(`/cart/remove_item/${productId}`), {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')  // CSRF token for security
        },
        body: formData  // Sending as form-data, NOT JSON
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Item removed from cart', 'success');
        } else {
            showToast('Failed to remove item', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    });
}

function clearCart() {
    console.log('Clearing cart');

    let formData = new FormData();  // Empty form data, as no parameters are needed

    fetch(ensureLanguagePrefix('/cart/clear/'), {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')  // CSRF token for security
        },
        body: formData  // Sending as form-data, NOT JSON
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Cart cleared', 'success');
        } else {
            showToast('Failed to clear cart', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    });
}


// Helper function to get CSRF token cookie for Django
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