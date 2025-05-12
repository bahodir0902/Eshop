// Simple Shop Detail JavaScript with Cart and Favorites
document.addEventListener('DOMContentLoaded', function() {
    initializeViewToggle();
    checkCartStatus(); // Check cart status on page load
    setupAddToCartButtons();
    setupFavoriteButtons();
});

// View Toggle (Grid/List)
function initializeViewToggle() {
    const viewToggles = document.querySelectorAll('.view-toggle');
    const grid = document.getElementById('products-grid');

    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Remove active class from all toggles
            viewToggles.forEach(t => t.classList.remove('active'));

            // Add active class to clicked toggle
            this.classList.add('active');

            // Toggle grid view
            const view = this.dataset.view;
            if (view === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.remove('list-view');
            }
        });
    });
}

// Check cart status on page load
function checkCartStatus() {
    // Cart data is passed from Django via window.cartItemsData
    if (window.cartItemsData && Array.isArray(window.cartItemsData)) {
        // Update buttons for items already in cart
        window.cartItemsData.forEach(cartItem => {
            const productId = cartItem.product_id;
            const button = document.querySelector(`.add-to-cart[data-product-id="${productId}"]`);

            if (button) {
                updateButtonToInCart(button, cartItem.id, cartItem.quantity);
            }
        });
    }
}

// Parse cart items from HTML response (if cart returns HTML instead of JSON)
function parseCartFromHTML(html) {
    // This is a fallback method if the cart endpoint returns HTML
    // You'd need to implement this based on your cart template structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Example of how you might parse cart items from HTML
    // Adjust the selectors based on your actual cart template
    const cartItems = [];
    const itemElements = doc.querySelectorAll('.cart-item'); // Adjust selector

    itemElements.forEach(element => {
        const productId = element.dataset.productId;
        const itemId = element.dataset.itemId;
        const quantity = element.dataset.quantity || element.querySelector('.quantity')?.textContent;

        if (productId && itemId) {
            cartItems.push({
                id: parseInt(itemId),
                product_id: parseInt(productId),
                quantity: parseInt(quantity) || 1
            });
        }
    });

    return { cart_items: cartItems };
}

// Fallback method to check cart status for each product individually
function fallbackCartCheck() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        const productId = button.getAttribute('data-product-id');

        // Check if this product is in cart by attempting to add it with quantity 0
        // This is a workaround if there's no specific "check" endpoint
        checkProductInCart(productId, button);
    });
}
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
                updateButtonToInCart(button, existingItem.id, existingItem.quantity);
            }
        }

        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // If already in cart, show options to remove or view cart
            if (button.classList.contains('in-cart')) {
                return;
            }

            // Show quantity selector
            showQuantitySelector(button, productId);
        });
    });
}

// Show quantity selector
function showQuantitySelector(button, productId) {
    // Remove any existing quantity selectors
    document.querySelectorAll('.quantity-selector').forEach(selector => {
        selector.remove();
    });

    // Get stock count from product card itself
    const productCard = button.closest('.product-card');
    const maxStock = productCard ? parseInt(productCard.dataset.stock) || 99 : 99;

    // Create quantity selector
    const quantitySelector = document.createElement('div');
    quantitySelector.className = 'quantity-selector';
    quantitySelector.innerHTML = `
        <div class="quantity-controls">
            <button class="quantity-btn minus" data-action="decrease">
                <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" value="1" min="1" max="${maxStock}">
            <button class="quantity-btn plus" data-action="increase">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        <div class="stock-info">Available: ${maxStock} items</div>
        <div class="quantity-actions">
            <button class="btn btn-primary quantity-confirm">
                <i class="fas fa-check"></i> Add to Cart
            </button>
            <button class="btn btn-secondary quantity-cancel">Cancel</button>
        </div>
    `;

    // Insert after button
    button.parentNode.insertBefore(quantitySelector, button.nextSibling);

    // Animate entry
    quantitySelector.style.maxHeight = '0';
    quantitySelector.style.overflow = 'hidden';
    quantitySelector.style.transition = 'max-height 0.3s ease';
    setTimeout(() => {
        quantitySelector.style.maxHeight = '200px';
    }, 10);

    // Setup quantity controls
    const minusBtn = quantitySelector.querySelector('.minus');
    const plusBtn = quantitySelector.querySelector('.plus');
    const quantityInput = quantitySelector.querySelector('.quantity-input');
    const confirmBtn = quantitySelector.querySelector('.quantity-confirm');
    const cancelBtn = quantitySelector.querySelector('.quantity-cancel');

    minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });

    plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        let value = parseInt(quantityInput.value);
        if (value < maxStock) {
            quantityInput.value = value + 1;
        }
    });

    // Validate input
    quantityInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) {
            e.target.value = 1;
        } else if (value > maxStock) {
            e.target.value = maxStock;
            showToast(`Maximum available quantity is ${maxStock}`, 'warning');
        }
    });

    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const quantity = parseInt(quantityInput.value);

        // Validate quantity against stock
        if (quantity > maxStock) {
            showToast(`Only ${maxStock} items available in stock`, 'error');
            return;
        }

        addToCart(productId, quantity, quantitySelector, button);
    });

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeQuantitySelector(quantitySelector);
    });
}

// Remove quantity selector with animation
function removeQuantitySelector(selector) {
    selector.style.maxHeight = '0';
    setTimeout(() => {
        selector.remove();
    }, 300);
}

// Add to cart function
function addToCart(productId, quantity, quantitySelector, button) {
    const url = ensureLanguagePrefix(`/cart/add_item/${productId}`);
    const confirmBtn = quantitySelector.querySelector('.quantity-confirm');
    const originalContent = confirmBtn.innerHTML;

    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
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
                    window.cartItemsData[existingItemIndex].quantity = newQuantity;
                } else {
                    window.cartItemsData.push({
                        id: itemId,
                        product_id: parseInt(productId),
                        quantity: newQuantity
                    });
                }
            }

            // Remove quantity selector and update button
            removeQuantitySelector(quantitySelector);
            updateButtonToInCart(button, itemId, newQuantity);
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

// Update button to show in cart state
function updateButtonToInCart(button, itemId, quantity) {
    button.classList.add('in-cart');
    button.innerHTML = `<i class="fas fa-check"></i> In Cart (${quantity})`;

    // Create cart indicator with clearer remove button
    let cartIndicator = button.parentElement.querySelector('.cart-indicator');
    if (!cartIndicator) {
        cartIndicator = document.createElement('div');
        cartIndicator.className = 'cart-indicator';
        cartIndicator.innerHTML = `
            <div class="cart-info">
                <span class="cart-quantity">${quantity} in your cart</span>
            </div>
            <button class="btn btn-danger remove-from-cart" data-item-id="${itemId}">
                <i class="fas fa-trash-can"></i> Remove from Cart
            </button>
        `;
        button.parentElement.appendChild(cartIndicator);

        // Animate entry
        cartIndicator.style.opacity = '0';
        cartIndicator.style.transform = 'translateY(-10px)';
        cartIndicator.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            cartIndicator.style.opacity = '1';
            cartIndicator.style.transform = 'translateY(0)';
        }, 10);

        // Set up remove button
        const removeBtn = cartIndicator.querySelector('.remove-from-cart');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeFromCart(itemId, button, cartIndicator);
        });
    } else {
        // Update existing indicator
        cartIndicator.querySelector('.cart-quantity').textContent = `${quantity} in your cart`;
        cartIndicator.querySelector('.remove-from-cart').setAttribute('data-item-id', itemId);
    }
}

// Remove from cart function
function removeFromCart(itemId, addToCartBtn, cartIndicator) {
    const removeBtn = cartIndicator.querySelector('.remove-from-cart');
    if (!removeBtn) return;

    const originalContent = removeBtn.innerHTML;
    removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
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
            // Update UI with animation
            cartIndicator.style.opacity = '0';
            cartIndicator.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                cartIndicator.remove();
                addToCartBtn.classList.remove('in-cart');
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            }, 300);

            // Update cartItemsData
            if (window.cartItemsData && Array.isArray(window.cartItemsData)) {
                window.cartItemsData = window.cartItemsData.filter(item => item.id !== parseInt(itemId));
            }

            updateCartCounter(data.cart_count);
            showToast('Item removed from cart', 'success');
        } else {
            removeBtn.innerHTML = originalContent;
            removeBtn.disabled = false;
            showToast('Failed to remove item: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        removeBtn.innerHTML = originalContent;
        removeBtn.disabled = false;
        showToast('Network error occurred', 'error');
    });
}

// Update cart counter
function updateCartCounter(newCount) {
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
        cartCounter.textContent = newCount;
    }
}

// Setup favorite buttons
function setupFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.toggle-favorite');

    favoriteButtons.forEach(button => {
        const productId = button.getAttribute('data-product-id');

        // Check if product is in favorites
        checkIfProductInFavorites(productId, button);

        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(productId, button);
        });
    });
}

// Check if product is in favorites
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

// Toggle favorite status
function toggleFavorite(productId, button) {
    const isActive = button.classList.contains('favorite-active');
    const url = isActive
        ? ensureLanguagePrefix(`/favourites/remove_favourite_item/${productId}`)
        : ensureLanguagePrefix(`/favourites/add_favourite_item/${productId}`);

    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

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
            button.innerHTML = originalContent;
            showToast(data.error || 'Failed to update favorites', 'error');
        }
        button.disabled = false;
    })
    .catch(error => {
        console.error('Error:', error);
        button.innerHTML = originalContent;
        button.disabled = false;
        showToast('Network error occurred', 'error');
    });
}

// Ensure language prefix is added to URLs
function ensureLanguagePrefix(url) {
    if (url.startsWith('http') || url.startsWith('//')) {
        return url;
    }

    const langPrefix = getLanguagePrefix();

    if (langPrefix && !url.startsWith(langPrefix)) {
        const urlWithoutLeadingSlash = url.startsWith('/') ? url.substring(1) : url;
        return `${langPrefix}/${urlWithoutLeadingSlash}`;
    }

    return url;
}

// Get language prefix from URL
function getLanguagePrefix() {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);

    if (pathSegments.length > 0 && /^[a-z]{2}(-[a-z]{2,3})?$/i.test(pathSegments[0])) {
        return `/${pathSegments[0]}`;
    }

    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang !== 'en') {
        return `/${htmlLang}`;
    }

    return '';
}

// Get CSRF token for Django
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

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
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
        <div class="toast-content">
            ${icon}
            <span class="toast-message">${message}</span>
            <span class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                background: white;
                padding: 1rem;
                margin-bottom: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border-left: 4px solid var(--primary-color);
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }
            
            .toast.success {
                border-left-color: var(--success-color);
            }
            
            .toast.error {
                border-left-color: var(--danger-color);
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .toast-content i {
                font-size: 1.25rem;
            }
            
            .toast.success .toast-content i {
                color: var(--success-color);
            }
            
            .toast.error .toast-content i {
                color: var(--danger-color);
            }
            
            .toast.info .toast-content i {
                color: var(--primary-color);
            }
            
            .toast-message {
                flex: 1;
                font-weight: 500;
            }
            
            .toast-close {
                cursor: pointer;
                font-size: 1.5rem;
                color: var(--text-muted);
                transition: color 0.2s ease;
            }
            
            .toast-close:hover {
                color: var(--text-color);
            }
            
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }
        `;
        document.head.appendChild(style);
    }

    // Add to container
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}