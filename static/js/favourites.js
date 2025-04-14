// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function () {
    // Initialize GSAP
    initializeAnimations();

    // Set up event listeners
    setupEventListeners();

    // Initialize cards with entry animation
    animateCardsEntry();

    parseCartItemsData();

    markItemsInCart();


});

let cartItemsData = [];

// Parse cart items data from hidden HTML element
function parseCartItemsData() {
    const cartDataElement = document.getElementById('cart-data');
    if (cartDataElement && cartDataElement.dataset.cartItems) {
        try {
            cartItemsData = JSON.parse(cartDataElement.dataset.cartItems);
        } catch (error) {
            console.error('Error parsing cart items data:', error);
            cartItemsData = [];
        }
    }
}

// Add this function after parseCartItemsData()

// Check if a product is in cart
function isProductInCart(productId) {
    return cartItemsData.some(item => item.product_id === parseInt(productId));
}

// Add this function after the isProductInCart() function

// Mark items that are already in cart
function markItemsInCart() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');

    addToCartButtons.forEach(button => {
        const productId = button.getAttribute('data-id');

        if (isProductInCart(productId)) {
            // Get the card
            const card = button.closest('.favorite-card');
            const productInfo = card.querySelector('.product-info');
            const cartItemId = getCartItemId(productId);
            const quantity = getCartItemQuantity(productId);

            // Create in-cart indicator
            const cartIndicator = document.createElement('div');
            cartIndicator.className = 'in-cart-indicator';

            // Update content
            cartIndicator.innerHTML = `
                <div class="cart-indicator-content">
                    <div class="cart-quantity">
                        <i class="fas fa-shopping-cart"></i>
                        <span class="quantity-value">${quantity}</span>
                        <span class="in-cart-text">in cart</span>
                    </div>
                    <button class="remove-from-cart cosmic-btn" data-item-id="${cartItemId}">
                        <span class="btn-content">
                            <i class="fas fa-trash-alt"></i>
                            <span class="btn-text">Remove</span>
                        </span>
                    </button>
                </div>
            `;

            // Insert it before product info
            productInfo.parentNode.insertBefore(cartIndicator, productInfo);

            // Update the add button style
            button.innerHTML = '<i class="fas fa-sync-alt"></i>';
            button.classList.add('in-cart');
        }
    });

    // Setup in-cart indicators and remove buttons
    setupExistingCartItems();
}

// Get cart item ID for a product
function getCartItemId(productId) {
    const cartItem = cartItemsData.find(item => item.product_id === parseInt(productId));
    return cartItem ? cartItem.id : null;
}

// Get quantity of a product in cart
function getCartItemQuantity(productId) {
    const cartItem = cartItemsData.find(item => item.product_id === parseInt(productId));
    return cartItem ? cartItem.quantity : 0;
}

// Initialize GSAP animations
function initializeAnimations() {
    // Random star positions
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        gsap.set(particle, {
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            opacity: Math.random() * 0.6 + 0.2
        });

        // Create twinkling effect
        gsap.to(particle, {
            opacity: Math.random() * 0.8 + 0.1,
            duration: Math.random() * 3 + 2,
            repeat: -1,
            yoyo: true
        });
    });

    // Add parallax effect to particles
    document.addEventListener('mousemove', e => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

        gsap.to('.floating-particles', {
            x: moveX,
            y: moveY,
            duration: 1
        });
    });

    // Nebula subtle animation
    gsap.to('.nebula', {
        backgroundPosition: '100% 100%',
        duration: 120,
        repeat: -1,
        ease: 'none'
    });
}

// Set up all event listeners
function setupEventListeners() {
    // Flip card when info button is clicked
    const detailsButtons = document.querySelectorAll('.details-button');
    detailsButtons.forEach(button => {
        button.addEventListener('click', function () {
            const card = this.closest('.favorite-card');
            card.classList.add('flipped');
        });
    });

    // Flip back when back button is clicked
    const flipBackButtons = document.querySelectorAll('.flip-back-button');
    flipBackButtons.forEach(button => {
        button.addEventListener('click', function () {
            const card = this.closest('.favorite-card');
            card.classList.remove('flipped');
        });
    });

    // Remove item from favorites
    const removeButtons = document.querySelectorAll('.remove-button');
    removeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productId = this.getAttribute('data-id');
            removeFromFavorites(productId);
        });
    });

    // Clear all favorites
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
        clearAllButton.addEventListener('click', clearAllFavorites);
    }

    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productId = this.getAttribute('data-id');
            toggleQuantitySelector(productId, this);
        });
    });

    // Setup in-cart indicators and remove from cart buttons
    setupExistingCartItems();
}

// Setup cart indicators and remove buttons for items already in cart
function setupExistingCartItems() {
    // Find all in-cart indicators
    const cartIndicators = document.querySelectorAll('.in-cart-indicator');

    // Add event listeners to remove buttons
    cartIndicators.forEach(indicator => {
        const removeButton = indicator.querySelector('.remove-from-cart');
        if (removeButton) {
            removeButton.addEventListener('click', function () {
                const itemId = this.getAttribute('data-item-id');
                removeFromCart(itemId);
            });
        }
    });
}

// Animate cards entry with staggered effect
function animateCardsEntry() {
    const cards = document.querySelectorAll('.favorite-card');

    gsap.from(cards, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.3
    });

    // Subtle hover animation for cards
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            if (!this.classList.contains('flipped')) {
                gsap.to(this, {
                    y: -10,
                    boxShadow: '0 20px 30px rgba(0, 0, 0, 0.3)',
                    duration: 0.3
                });
            }
        });

        card.addEventListener('mouseleave', function () {
            if (!this.classList.contains('flipped')) {
                gsap.to(this, {
                    y: 0,
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                    duration: 0.3
                });
            }
        });
    });
}

// Toggle quantity selector for adding to cart
function toggleQuantitySelector(productId, button) {
    const card = button.closest('.favorite-card');
    const cardActions = card.querySelector('.card-actions');

    // Check if quantity selector already exists
    let quantitySelector = card.querySelector('.quantity-selector');

    if (quantitySelector) {
        // If it exists, just hide it and show the button
        gsap.to(quantitySelector, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                quantitySelector.remove();
                gsap.to(button, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.3
                });
            }
        });
        return;
    }

    // If it doesn't exist, create and show it
    quantitySelector = document.createElement('div');
    quantitySelector.className = 'quantity-selector';
    quantitySelector.innerHTML = `
        <div class="quantity-controls">
            <button type="button" class="quantity-btn minus">
                <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" value="1" min="1" max="99">
            <button type="button" class="quantity-btn plus">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        <div class="quantity-actions">
            <button type="button" class="quantity-cancel">
                <i class="fas fa-times"></i>
            </button>
            <button type="button" class="quantity-confirm">
                <i class="fas fa-shopping-cart"></i> Add
            </button>
        </div>
    `;

    // Hide the button
    gsap.to(button, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
            // Insert quantity selector before card actions
            cardActions.parentNode.insertBefore(quantitySelector, cardActions);

            // Set initial height to 0 for animation
            gsap.set(quantitySelector, {
                height: 0,
                opacity: 0
            });

            // Animate it in
            gsap.to(quantitySelector, {
                height: 'auto',
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out'
            });

            // Set up event listeners
            setupQuantitySelectorEvents(quantitySelector, productId, button);
        }
    });
}

// Set up event listeners for quantity selector
function setupQuantitySelectorEvents(selector, productId, button) {
    const minusBtn = selector.querySelector('.minus');
    const plusBtn = selector.querySelector('.plus');
    const input = selector.querySelector('.quantity-input');
    const cancelBtn = selector.querySelector('.quantity-cancel');
    const confirmBtn = selector.querySelector('.quantity-confirm');

    // Minus button
    minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(input.value);
        if (currentValue > 1) {
            input.value = currentValue - 1;

            // Add pulse animation
            gsap.fromTo(input,
                {backgroundColor: 'rgba(239, 97, 159, 0.2)'},
                {backgroundColor: 'white', duration: 0.5}
            );
        }
    });

    // Plus button
    plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(input.value);
        if (currentValue < 99) {
            input.value = currentValue + 1;

            // Add pulse animation
            gsap.fromTo(input,
                {backgroundColor: 'rgba(66, 190, 251, 0.2)'},
                {backgroundColor: 'white', duration: 0.5}
            );
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        // Hide quantity selector and show the original button
        gsap.to(selector, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                selector.remove();
                gsap.to(button, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.3
                });
            }
        });
    });

    // Confirm button
    confirmBtn.addEventListener('click', () => {
        const quantity = parseInt(input.value);

        // Animate the confirm button
        gsap.to(confirmBtn, {
            scale: 0.9,
            duration: 0.1,
            onComplete: () => {
                gsap.to(confirmBtn, {
                    scale: 1,
                    duration: 0.1
                });
            }
        });

        // Add to cart
        addToCart(productId, quantity, selector, button);
    });
}

// Remove an item from favorites
function removeFromFavorites(productId) {
    const card = document.querySelector(`.favorite-card[data-id="${productId}"]`);

    // Animate the removal
    gsap.to(card, {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            // Send AJAX request to remove from favorites
            const url = `/favourites/remove_favourite_item/${productId}`;

            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Remove the card from DOM
                        card.remove();

                        // Show success notification
                        showToast('Item removed from favorites', 'success');

                        // Check if we need to show empty state
                        const remainingCards = document.querySelectorAll('.favorite-card');
                        if (remainingCards.length === 0) {
                            showEmptyState();
                        }
                    } else {
                        // Show error notification
                        showToast('Failed to remove item: ' + data.error, 'error');

                        // Revert animation
                        gsap.to(card, {
                            scale: 1,
                            opacity: 1,
                            duration: 0.5
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred', 'error');

                    // Revert animation
                    gsap.to(card, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.5
                    });
                });
        }
    });
}

// Clear all favorites
function clearAllFavorites() {
    // Add confirmation with a cool effect
    if (!confirm('Are you sure you want to remove all items from your favorites?')) {
        return;
    }

    const cards = document.querySelectorAll('.favorite-card');

    // Animate all cards
    gsap.to(cards, {
        scale: 0,
        opacity: 0,
        stagger: 0.05,
        duration: 0.5,
        onComplete: () => {
            // Send AJAX request to clear all favorites
            fetch('/favourites/clear_favourites/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success notification
                        showToast('All items removed from favorites', 'success');

                        // Show empty state
                        showEmptyState();
                    } else {
                        // Show error notification
                        showToast('Failed to clear favorites', 'error');

                        // Revert animation for all cards
                        gsap.to(cards, {
                            scale: 1,
                            opacity: 1,
                            stagger: 0.05,
                            duration: 0.5
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred', 'error');

                    // Revert animation for all cards
                    gsap.to(cards, {
                        scale: 1,
                        opacity: 1,
                        stagger: 0.05,
                        duration: 0.5
                    });
                });
        }
    });
}
function addToCart(productId, quantity, quantitySelector, button) {
    const url = `/cart/add_item/${productId}`;
    const confirmBtn = quantitySelector.querySelector('.quantity-confirm');
    const originalContent = confirmBtn.innerHTML;

    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Adding...';
    confirmBtn.disabled = true;

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken(),
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
                const existingItemIndex = cartItemsData.findIndex(
                    item => item.product_id === parseInt(productId)
                );
                if (existingItemIndex !== -1) {
                    // Update existing item
                    cartItemsData[existingItemIndex].quantity = newQuantity;
                } else {
                    // Add new item
                    cartItemsData.push({
                        id: itemId,
                        product_id: parseInt(productId),
                        quantity: newQuantity
                    });
                }

                // Update UI
                gsap.to(quantitySelector, {
                    height: 0,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        quantitySelector.remove();
                        createOrUpdateCartIndicator(button, productId, newQuantity, itemId);
                    }
                });

                updateCartCounter(cartCount);
                showToast(`Added ${quantity} to cart. Total: ${newQuantity}`, 'success');
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
// Add to cart functionality
// function addToCart(productId, quantity, quantitySelector, button) {
//     if (isProductInCart(productId)) {
//         // Item already in cart - update quantity instead
//         const cartItemId = getCartItemId(productId);
//         const existingQuantity = getCartItemQuantity(productId);
//
//         // Update UI
//         showToast('Item already in your cart with quantity ' + existingQuantity, 'info');
//
//         // Hide quantity selector
//         gsap.to(quantitySelector, {
//             height: 0,
//             opacity: 0,
//             duration: 0.3,
//             onComplete: () => {
//                 quantitySelector.remove();
//                 gsap.to(button, {
//                     opacity: 1,
//                     scale: 1,
//                     duration: 0.3
//                 });
//             }
//         });
//
//         return;
//     }
//    const url = `/cart/add_item/${productId}`;
//     const confirmBtn = quantitySelector.querySelector('.quantity-confirm');
//     const originalContent = confirmBtn.innerHTML;
//
//     confirmBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Adding...';
//     confirmBtn.disabled = true;
//
//     fetch(url, {
//         method: 'POST',
//         headers: {
//             'X-CSRFToken': getCsrfToken(),
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({quantity: quantity})
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 gsap.to(quantitySelector, {
//                     height: 0,
//                     opacity: 0,
//                     duration: 0.3,
//                     onComplete: () => {
//                         quantitySelector.remove();
//                         createOrUpdateCartIndicator(button, productId, quantity, data.item_id);
//                     }
//                 });
//
//                 // Update cartItemsData
//                 cartItemsData.push({
//                     id: data.item_id,
//                     product_id: parseInt(productId),
//                     quantity: quantity
//                 });
//
//                 updateCartCounter(data.cart_count || 1);
//                 showToast('Item added to your cart', 'success');
//             } else {
//                 confirmBtn.innerHTML = originalContent;
//                 confirmBtn.disabled = false;
//                 showToast('Failed to add item: ' + (data.error || 'Unknown error'), 'error');
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             confirmBtn.innerHTML = originalContent;
//             confirmBtn.disabled = false;
//             showToast('Network error occurred', 'error');
//         });
// }

// Create or update in-cart indicator
function createOrUpdateCartIndicator(button, productId, quantity, itemId) {
    const card = button.closest('.favorite-card');
    const productInfo = card.querySelector('.product-info');

    // Check if indicator already exists
    let cartIndicator = card.querySelector('.in-cart-indicator');

    if (!cartIndicator) {
        // Create new indicator
        cartIndicator = document.createElement('div');
        cartIndicator.className = 'in-cart-indicator';

        // Insert it before product info
        productInfo.parentNode.insertBefore(cartIndicator, productInfo);

        // Set initial state for animation
        gsap.set(cartIndicator, {
            opacity: 0,
            y: -20
        });
    }

    // Update content
    cartIndicator.innerHTML = `
        <div class="cart-indicator-content">
            <div class="cart-quantity">
                <i class="fas fa-shopping-cart"></i>
                <span class="quantity-value">${quantity}</span>
                <span class="in-cart-text">in cart</span>
            </div>
            <button class="remove-from-cart cosmic-btn" data-item-id="${itemId}">
                <span class="btn-content">
                    <i class="fas fa-trash-alt"></i>
                    <span class="btn-text">Remove</span>
                </span>
            </button>
        </div>
    `;

    // Animate in
    gsap.to(cartIndicator, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'back.out(1.4)'
    });

    // Add event listener to remove button
    const removeBtn = cartIndicator.querySelector('.remove-from-cart');
    if (removeBtn) {
        removeBtn.addEventListener('click', function () {
            const itemId = this.getAttribute('data-item-id');
            removeFromCart(itemId);
        });
    }

    // Update the add button style
    button.innerHTML = '<i class="fas fa-sync-alt"></i>';
    button.classList.add('in-cart');

    // Show the button again
    gsap.to(button, {
        opacity: 1,
        scale: 1,
        duration: 0.3
    });
}

// Remove from cart
function removeFromCart(itemId) {
    const removeBtn = document.querySelector(`.remove-from-cart[data-item-id="${itemId}"]`);
    if (!removeBtn) return;

    const cartIndicator = removeBtn.closest('.in-cart-indicator');
    const card = cartIndicator.closest('.favorite-card');
    const addToCartBtn = card.querySelector('.add-to-cart-button');

    removeBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
    removeBtn.disabled = true;

    const url = `/cart/remove_cart_item_in_list/${itemId}`;

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken(),
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                gsap.to(cartIndicator, {
                    opacity: 0,
                    height: 0,
                    duration: 0.3,
                    onComplete: () => {
                        cartIndicator.remove();
                    }
                });

                if (addToCartBtn) {
                    addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i>';
                    addToCartBtn.classList.remove('in-cart');
                }

                cartItemsData = cartItemsData.filter(item => item.id !== parseInt(itemId));
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

// Update cart counter
function updateCartCounter(newCount) {
    const cartCounter = document.querySelector('.cart-counter');
    if (!cartCounter) return;

    cartCounter.textContent = newCount;
    gsap.fromTo(cartCounter,
        { scale: 1.5, backgroundColor: '#4edcca' },
        { scale: 1, backgroundColor: '', duration: 0.5, ease: 'elastic.out(1.2, 0.4)' }
    );
}

// Show empty state when all items are removed
function showEmptyState() {
    const favoritesGrid = document.querySelector('.favorites-grid');
    const headerContent = document.querySelector('.header-content');

    // Clear the grid
    favoritesGrid.innerHTML = '';

    // Remove clear all button
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
        clearAllButton.remove();
    }

    // Create and add the empty state HTML
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <div class="empty-animation">
            <div class="planet"></div>
            <div class="astronaut">
                <i class="fas fa-user-astronaut"></i>
            </div>
        </div>
        <h2>Your Cosmic Collection Is Empty</h2>
        <p>Start adding your favorite products to create your personal galaxy of amazing items!</p>
        <a href="/products/" class="explore-button">
            <span class="button-text">Explore Products</span>
            <i class="fas fa-rocket"></i>
        </a>
    `;

    // Add to grid
    favoritesGrid.appendChild(emptyState);

    // Animate entry
    gsap.from(emptyState, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
    });

    // Animate astronaut
    gsap.to('.astronaut', {
        y: -20,
        rotation: 5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    const toastProgress = toast.querySelector('.toast-progress');

    // Set message
    toastMessage.textContent = message;

    // Set icon based on type
    if (type === 'success') {
        toastIcon.className = 'toast-icon fas fa-check-circle';
        toastIcon.style.color = 'var(--success-color)';
    } else if (type === 'error') {
        toastIcon.className = 'toast-icon fas fa-exclamation-circle';
        toastIcon.style.color = 'var(--danger-color)';
    } else {
        toastIcon.className = 'toast-icon fas fa-info-circle';
        toastIcon.style.color = 'var(--primary-color)';
    }

    // Show toast
    toast.classList.add('active');

    // Animate progress bar
    gsap.fromTo(toastProgress,
        {scaleX: 1},
        {
            scaleX: 0,
            duration: 3,
            ease: 'linear',
            onComplete: () => {
                // Hide toast
                toast.classList.remove('active');
            }
        }
    );
}

// Get CSRF token from cookies
function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken='.length) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken='.length));
                break;
            }
        }
    }
    return cookieValue;
}

// Add product to favorites (for potential future use)
function addToFavorites(productId) {
    const url = `/favourites/add_favourite_item/${productId}`;

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken(),
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Item added to favorites', 'success');
            } else {
                showToast('Failed to add item: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

// Add CSS for the new components
document.addEventListener('DOMContentLoaded', function () {
    const style = document.createElement('style');
    style.textContent = `
        /* Quantity Selector Styles */
        .quantity-selector {
            margin: -10px 0;
            
            padding: 12px;
            background: rgba(20, 25, 45, 0.5);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 
                        inset 0 1px 1px rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.15);
            overflow: hidden;
        }
        
        .quantity-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .quantity-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .quantity-btn:hover {
            background: rgba(66, 190, 251, 0.3);
            transform: scale(1.1);
        }
        
        .quantity-btn.minus:hover {
            background: rgba(239, 97, 159, 0.3);
        }
        
        .quantity-input {
            width: 70px;
            height: 36px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            margin: 0 10px;
            transition: background 0.3s ease;
        }
        
        .quantity-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
        }
        
        .quantity-cancel, .quantity-confirm {
            padding: 8px 15px;
            border-radius: 20px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: all 0.3s ease;
        }
        
        .quantity-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
        }
        
        .quantity-confirm {
            background: linear-gradient(45deg, #42befb, #4edcca);
            color: #fff;
            flex-grow: 1;
            margin-left: 10px;
            box-shadow: 0 4px 10px rgba(66, 190, 251, 0.3);
        }
        
        .quantity-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .quantity-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(66, 190, 251, 0.4);
        }
        
        /* In-cart indicator */
        .in-cart-indicator {
            background: linear-gradient(45deg, rgba(20, 25, 45, 0.7), rgba(66, 190, 251, 0.3));
            border-radius: 10px;
            margin: 10px 0;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2), 
                        inset 0 1px 1px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(66, 190, 251, 0.3);
            backdrop-filter: blur(5px);
        }
        
        .cart-indicator-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
        }
        
        .cart-quantity {
            display: flex;
            align-items: center;
            color: #fff;
            font-weight: 600;
        }
        
        .cart-quantity i {
            margin-right: 8px;
            color: #42befb;
            font-size: 18px;
        }
        
        .quantity-value {
            font-size: 18px;
            margin-right: 5px;
        }
        
        .in-cart-text {
            opacity: 0.8;
            font-size: 14px;
        }
        
        .cosmic-btn {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 6px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.3s ease;
        }
        
        .cosmic-btn:hover {
            background: rgba(239, 97, 159, 0.3);
            transform: translateY(-2px);
        }
        
        .cosmic-btn i {
            font-size: 11px;
        }
        
        .btn-content {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        /* Add to cart button in cart state */
        .add-to-cart-button.in-cart {
            background: rgba(66, 190, 251, 0.2);
            border-color: rgba(66, 190, 251, 0.4);
        }
        
        /* Toast enhancements */
        .toast-progress {
            transform-origin: left;
        }
    \``;
    document.head.appendChild(style);
});
