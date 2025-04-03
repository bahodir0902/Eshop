// JavaScript for enhanced product list functionality
document.addEventListener('DOMContentLoaded', function () {
    // View switching functionality (grid vs list)
    const viewButtons = document.querySelectorAll('.view-btn');
    const productsGrid = document.querySelector('.products-grid');

    // Load saved view preference on page load
    const savedView = localStorage.getItem('productView') || 'grid'; // Default to 'grid'
    viewButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === savedView) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    if (savedView === 'list') {
        productsGrid.classList.add('list-view');
    } else {
        productsGrid.classList.remove('list-view');
    }

    // Handle view switching
    viewButtons.forEach(button => {
        button.addEventListener('click', function () {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const viewType = this.getAttribute('data-view');

            if (viewType === 'list') {
                productsGrid.classList.add('list-view');
            } else {
                productsGrid.classList.remove('list-view');
            }

            // Save the preference to localStorage
            localStorage.setItem('productView', viewType);
        });
    });

    // UPDATED: Wishlist button toggle with AJAX functionality
    const wishlistButtons = document.querySelectorAll('.wishlist');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function () {
            const icon = this.querySelector('i');
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            // Store original button content for reverting if needed
            const originalHTML = this.innerHTML;
            const originalColor = this.style.color;
            const originalBorderColor = this.style.borderColor;

            // Show loading state
            this.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
            this.disabled = true;

            // Determine if we're adding or removing
            const isAdding = icon.classList.contains('fa-heart-o');

            // Set the URL based on action
            const url = isAdding
                ? `/add_favourite_item/${productId}`
                : `/remove_favourite_item/${productId}`;

            // Send AJAX request
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Reset button but with toggled state
                    if (isAdding) {
                        // Was added to favorites
                        this.innerHTML = '<i class="fa fa-heart"></i>';
                        this.style.color = '#f72585';
                        this.style.borderColor = '#f72585';

                        // Show notification
                        const notification = document.createElement('div');
                        notification.className = 'product-notification success';
                        notification.innerHTML = '<i class="fa fa-check"></i> Added to favorites';
                        document.body.appendChild(notification);

                        setTimeout(() => {
                            notification.style.opacity = '0';
                            setTimeout(() => {
                                notification.remove();
                            }, 300);
                        }, 2000);

                        // Add favorites badge if not exists
                        let favBadge = productCard.querySelector('.badge.favorite');
                        if (!favBadge) {
                            const badgeContainer = productCard.querySelector('.product-badges');
                            favBadge = document.createElement('span');
                            favBadge.className = 'badge favorite';
                            favBadge.textContent = 'Favorite';
                            badgeContainer.appendChild(favBadge);
                        }
                    } else {
                        // Was removed from favorites
                        this.innerHTML = '<i class="fa fa-heart-o"></i>';
                        this.style.color = '';
                        this.style.borderColor = '';

                        // Show notification
                        const notification = document.createElement('div');
                        notification.className = 'product-notification success';
                        notification.innerHTML = '<i class="fa fa-check"></i> Removed from favorites';
                        document.body.appendChild(notification);

                        setTimeout(() => {
                            notification.style.opacity = '0';
                            setTimeout(() => {
                                notification.remove();
                            }, 300);
                        }, 2000);

                        // Remove favorites badge if exists
                        const favBadge = productCard.querySelector('.badge.favorite');
                        if (favBadge) {
                            favBadge.remove();
                        }
                    }
                } else {
                    // Error handling
                    this.innerHTML = originalHTML;
                    this.style.color = originalColor;
                    this.style.borderColor = originalBorderColor;

                    // Show error notification
                    const notification = document.createElement('div');
                    notification.className = 'product-notification error';
                    notification.innerHTML = `<i class="fa fa-exclamation-circle"></i> ${data.error || 'Error updating favorites'}`;
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }, 2000);
                }
                this.disabled = false;
            })
            .catch(error => {
                console.error('Error:', error);
                // Reset button to original state
                this.innerHTML = originalHTML;
                this.style.color = originalColor;
                this.style.borderColor = originalBorderColor;
                this.disabled = false;

                // Show error notification
                const notification = document.createElement('div');
                notification.className = 'product-notification error';
                notification.innerHTML = '<i class="fa fa-exclamation-circle"></i> Network error';
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 2000);
            });
        });
    });

    // Add to cart functionality with AJAX
    const addToCartButtons = document.querySelectorAll('.add-to-cart, .update-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Get the product card and extract the product ID from data attribute
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');

            // Check if quantity selector exists, otherwise create one
            let quantityContainer = productCard.querySelector('.quantity-container');

            if (!quantityContainer) {
                // Create quantity selector if it doesn't exist
                const productActions = productCard.querySelector('.product-actions');
                quantityContainer = document.createElement('div');
                quantityContainer.className = 'quantity-container';
                quantityContainer.innerHTML = `
                    <span class="quantity-label">Qty:</span>
                    <div class="quantity-controls">
                        <button type="button" class="quantity-btn minus">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="99">
                        <button type="button" class="quantity-btn plus">+</button>
                    </div>
                    <button type="button" class="btn btn-confirm-cart">Confirm</button>
                `;

                // Insert before the current button
                productActions.insertBefore(quantityContainer, this);
                this.style.display = 'none';

                // Set up quantity control buttons
                const minusBtn = quantityContainer.querySelector('.minus');
                const plusBtn = quantityContainer.querySelector('.plus');
                const quantityInput = quantityContainer.querySelector('.quantity-input');
                const confirmBtn = quantityContainer.querySelector('.btn-confirm-cart');

                minusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value);
                    if (currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                    }
                });

                plusBtn.addEventListener('click', () => {
                    const currentValue = parseInt(quantityInput.value);
                    if (currentValue < 99) {
                        quantityInput.value = currentValue + 1;
                    }
                });

                confirmBtn.addEventListener('click', () => {
                    // Get the quantity value
                    const quantity = parseInt(quantityInput.value);

                    // Send AJAX request to add to cart
                    addToCartAjax(productId, quantity, productCard, this);

                    // Hide quantity container
                    quantityContainer.remove();
                    this.style.display = 'flex';
                });
            } else {
                // Toggle visibility if it already exists
                if (quantityContainer.style.display === 'none') {
                    quantityContainer.style.display = 'flex';
                    this.style.display = 'none';
                } else {
                    quantityContainer.style.display = 'none';
                }
            }
        });
    });

    // Function to send AJAX request to add product to cart
    function addToCartAjax(productId, quantity, productCard, addButton) {
        // Get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // Create form data
        const formData = new FormData();
        formData.append('quantity', quantity);

        // Show loading state
        addButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding...';

        // Send AJAX request
        fetch(`/cart/add_item/${productId}`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: formData,
            credentials: 'same-origin'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update or create the in-cart-indicator
                    let inCartIndicator = productCard.querySelector('.in-cart-indicator');
                    if (!inCartIndicator) {
                        inCartIndicator = document.createElement('div');
                        inCartIndicator.className = 'in-cart-indicator';

                        const productActions = productCard.querySelector('.product-actions');
                        productActions.insertBefore(inCartIndicator, productActions.firstChild);
                    }

                    // Update the indicator content
                    inCartIndicator.innerHTML = `
                    <span><i class="fa fa-shopping-cart"></i> In your cart: <strong>${quantity}</strong></span>
                    <button type="button" class="btn btn-danger remove-from-cart" data-item-id="${data.item_id || ''}">
                        <i class="fa fa-trash"></i> Remove
                    </button>
                `;

                    // Add "In Cart" badge if not already present
                    let inCartBadge = productCard.querySelector('.badge.in-cart');
                    if (!inCartBadge) {
                        const badgeContainer = productCard.querySelector('.product-badges');
                        inCartBadge = document.createElement('span');
                        inCartBadge.className = 'badge in-cart';
                        inCartBadge.textContent = `In Cart (${quantity})`;
                        badgeContainer.appendChild(inCartBadge);
                    } else {
                        inCartBadge.textContent = `In Cart (${quantity})`;
                    }

                    // Update cart counter if it exists
                    const cartCounter = document.querySelector('.cart-counter');
                    if (cartCounter) {
                        const currentCount = parseInt(cartCounter.textContent || '0');
                        cartCounter.textContent = currentCount + 1;
                        cartCounter.classList.add('cart-updated');
                        setTimeout(() => {
                            cartCounter.classList.remove('cart-updated');
                        }, 1000);
                    }

                    // Update the button to "Update Cart" button
                    addButton.innerHTML = '<i class="fa fa-refresh"></i> Update Cart';
                    addButton.className = 'btn btn-success update-cart';

                    // Set up the new remove button event listener
                    const newRemoveBtn = inCartIndicator.querySelector('.remove-from-cart');
                    if (newRemoveBtn) {
                        newRemoveBtn.addEventListener('click', handleRemoveFromCart);
                    }

                    // Show temporary feedback
                    const notification = document.createElement('div');
                    notification.className = 'product-notification success';
                    notification.innerHTML = '<i class="fa fa-check"></i> Product added to cart';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }, 2000);

                } else {
                    // Show error message
                    addButton.innerHTML = '<i class="fa fa-exclamation-circle"></i> Error';
                    addButton.className = 'btn btn-danger add-to-cart';

                    console.error('Error adding item to cart:', data.error);

                    // Reset button after delay
                    setTimeout(() => {
                        addButton.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';
                        addButton.className = 'btn btn-outline add-to-cart';
                    }, 2000);

                    // Show error notification
                    const notification = document.createElement('div');
                    notification.className = 'product-notification error';
                    notification.innerHTML = '<i class="fa fa-exclamation-circle"></i> Failed to add product';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                addButton.innerHTML = '<i class="fa fa-exclamation-circle"></i> Error';
                addButton.className = 'btn btn-danger add-to-cart';

                // Reset button after delay
                setTimeout(() => {
                    addButton.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';
                    addButton.className = 'btn btn-outline add-to-cart';
                }, 2000);

                // Show error notification
                const notification = document.createElement('div');
                notification.className = 'product-notification error';
                notification.innerHTML = '<i class="fa fa-exclamation-circle"></i> Network error';
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 2000);
            });
    }

    // Function to handle remove from cart
    function handleRemoveFromCart() {
        const itemId = this.getAttribute('data-item-id');
        const productCard = this.closest('.product-card');
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        // Add animation
        this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Removing...';
        // Send AJAX request to remove item
        fetch(`/cart/remove_cart_item_in_list/${itemId}`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Remove the in-cart-indicator
                    const inCartIndicator = productCard.querySelector('.in-cart-indicator');
                    if (inCartIndicator) {
                        inCartIndicator.remove();
                    }

                    // Remove the "In Cart" badge
                    const inCartBadge = productCard.querySelector('.badge.in-cart');
                    if (inCartBadge) {
                        inCartBadge.remove();
                    }

                    // Update the Add to Cart button
                    const addToCartBtn = productCard.querySelector('.update-cart');
                    if (addToCartBtn) {
                        addToCartBtn.className = 'btn btn-outline add-to-cart';
                        addToCartBtn.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';
                    }

                    // Update cart counter in the navbar if it exists
                    const cartCounter = document.querySelector('.cart-counter');
                    if (cartCounter) {
                        const currentCount = parseInt(cartCounter.textContent || '0');
                        cartCounter.textContent = Math.max(0, currentCount - 1);
                        cartCounter.classList.add('cart-updated');
                        setTimeout(() => {
                            cartCounter.classList.remove('cart-updated');
                        }, 1000);
                    }

                    // Show temporary feedback
                    const notification = document.createElement('div');
                    notification.className = 'product-notification success';
                    notification.innerHTML = '<i class="fa fa-check"></i> Product removed from cart';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }, 2000);
                } else {
                    console.error('Error removing item:', data.error);
                    this.innerHTML = '<i class="fa fa-exclamation-circle"></i> Error';

                    setTimeout(() => {
                        this.innerHTML = '<i class="fa fa-trash"></i> Remove';
                    }, 2000);

                    // Show error notification
                    const notification = document.createElement('div');
                    notification.className = 'product-notification error';
                    notification.innerHTML = '<i class="fa fa-exclamation-circle"></i> Failed to remove product';
                    document.body.appendChild(notification);

                    setTimeout(() => {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            notification.remove();
                        }, 300);
                    }, 2000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.innerHTML = '<i class="fa fa-exclamation-circle"></i> Error';

                setTimeout(() => {
                    this.innerHTML = '<i class="fa fa-trash"></i> Remove';
                }, 2000);

                // Show error notification
                const notification = document.createElement('div');
                notification.className = 'product-notification error';
                notification.innerHTML = '<i class="fa fa-exclamation-circle"></i> Network error';
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 2000);
            });
    }

    // Attach event listeners to existing remove buttons
    const removeButtons = document.querySelectorAll('.remove-from-cart');
    removeButtons.forEach(button => {
        button.addEventListener('click', handleRemoveFromCart);
    });

    // Product card hover effect
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.zIndex = '10';
        });

        card.addEventListener('mouseleave', function () {
            this.style.zIndex = '1';
        });
    });

    // Initialize favorite buttons if favorites data is available
    initializeFavoriteButtons();

    // Function to initialize favorite buttons based on server data
    function initializeFavoriteButtons() {
        // Find all favourite items from hidden inputs
        const favouriteItemElements = document.querySelectorAll('.favourite-item-id');
        if (favouriteItemElements.length === 0) return;

        const favouriteItemIds = Array.from(favouriteItemElements).map(el => parseInt(el.value));

        // Find all product cards
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productId = parseInt(card.getAttribute('data-product-id'));
            const wishlistBtn = card.querySelector('.wishlist');

            // If product is in favorites, update the button
            if (favouriteItemIds.includes(productId) && wishlistBtn) {
                const icon = wishlistBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-heart-o');
                    icon.classList.add('fa-heart');
                    wishlistBtn.style.color = '#f72585';
                    wishlistBtn.style.borderColor = '#f72585';
                }

                // Add favorite badge if not exists
                const badgeContainer = card.querySelector('.product-badges');
                if (badgeContainer && !card.querySelector('.badge.favorite')) {
                    const favBadge = document.createElement('span');
                    favBadge.className = 'badge favorite';
                    favBadge.textContent = 'Favorite';
                    badgeContainer.appendChild(favBadge);
                }
            }
        });
    }

    // Additional CSS for notifications and new favorite styles
    const style = document.createElement('style');
    style.innerHTML = `
    .product-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .product-notification.success {
        background-color: #28a745;
        color: white;
    }
    
    .product-notification.error {
        background-color: #dc3545;
        color: white;
    }
    
    .quantity-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        padding: 8px;
        background-color: #f8f9fa;
        border-radius: 4px;
    }
    
    .quantity-controls {
        display: flex;
        align-items: center;
    }
    
    .quantity-btn {
        width: 30px;
        height: 30px;
        font-size: 16px;
        background: #e9ecef;
        border: 1px solid #ced4da;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .quantity-btn.minus {
        border-radius: 4px 0 0 4px;
    }
    
    .quantity-btn.plus {
        border-radius: 0 4px 4px 0;
    }
    
    .quantity-input {
        width: 50px;
        height: 30px;
        text-align: center;
        border: 1px solid #ced4da;
        border-left: none;
        border-right: none;
    }
    
    .btn-confirm-cart {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .in-cart-indicator {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #e8f4ff;
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 14px;
    }
    
    .in-cart-indicator span {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .badge.in-cart {
        background-color: #007bff;
        color: white;
    }
    
    .badge.favorite {
        background-color: #f72585;
        color: white;
    }
    
    .cart-updated {
        animation: pulse 1s;
    }
    
    .btn.wishlist {
        transition: all 0.3s ease;
    }
    
    .btn.wishlist:disabled {
        opacity: 0.7;
        cursor: wait;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
  `;
    document.head.appendChild(style);
});