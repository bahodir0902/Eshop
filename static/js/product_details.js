document.addEventListener('DOMContentLoaded', function () {
    // Quantity selector functionality
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('product-quantity');
    const addToCartBtn = document.querySelector('.add-to-cart-detail');
    const inCartMessage = document.getElementById('in-cart-message');
    const cartQuantitySpan = document.getElementById('cart-quantity');
    const removeFromCartBtn = document.querySelector('.remove-from-cart');
    const quantitySelector = document.getElementById('quantity-selector');
    const wishlistBtn = document.querySelector('.add-to-wishlist');

    // Hide quantity selector
    function hideQuantitySelector() {
        if (quantitySelector) {
            quantitySelector.style.display = 'none';
        }
    }

    // Show quantity selector with a specific value
    function showQuantitySelector(quantity) {
        if (quantitySelector && quantityInput) {
            quantitySelector.style.display = 'flex';
            quantityInput.value = quantity;
        }
    }

    // **Quantity Selector Functionality**
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function () {
            let currentVal = parseInt(quantityInput.value);
            if (currentVal > 1) {
                quantityInput.value = currentVal - 1;
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', function () {
            let currentVal = parseInt(quantityInput.value);
            let maxStock = parseInt(quantityInput.getAttribute('max'));
            if (currentVal < maxStock) {
                quantityInput.value = currentVal + 1;
            }
        });
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Activate corresponding tab pane
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Image thumbnail gallery
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('main-product-image');

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            // Remove active class from all thumbnails
            thumbnails.forEach(t => t.classList.remove('active'));

            // Add active class to clicked thumbnail
            thumbnail.classList.add('active');

            // Update main image src if this is a real thumbnail (not a placeholder)
            if (!thumbnail.classList.contains('placeholder')) {
                const imgSrc = thumbnail.querySelector('img').src;
                mainImage.src = imgSrc;
                // Add a small fade effect
                mainImage.style.opacity = '0.7';
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                }, 100);
            }
        });
    });

    // Review star rating selector
    const ratingStars = document.querySelectorAll('.rating-star');

    ratingStars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = parseInt(this.getAttribute('data-rating'));
            selectedRating.value = rating;
            updateStars(rating);
        });

        // Hover effect: show filled stars up to hovered position
        star.addEventListener('mouseover', function () {
            const hoverRating = parseInt(this.getAttribute('data-rating'));
            ratingStars.forEach((s, index) => {
                if (index < hoverRating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });

        // Mouseout: revert to selected rating
        star.addEventListener('mouseout', function () {
            const currentRating = parseInt(selectedRating.value) || 0;
            updateStars(currentRating);
        });
    });

    // Add to cart button functionality with AJAX
    // const addToCartBtn = document.querySelector('.add-to-cart-detail');

    addToCartBtn.addEventListener('click', function () {
        const productId = this.getAttribute('data-product-id');
        const csrfToken = getCSRFToken();

        if (this.innerHTML.includes('Add to Cart')) {
            // Add item to cart
            const quantity = parseInt(quantityInput.value);
            fetch(`/cart/add_item/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({quantity: quantity})
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Product added to your cart successfully!');
                        if (data.cart_count && document.querySelector('.cart-count')) {
                            document.querySelector('.cart-count').textContent = data.cart_count;
                        }
                        cartQuantitySpan.textContent = data.quantity;
                        inCartMessage.style.display = 'inline';
                        this.innerHTML = '<i class="fa fa-shopping-cart"></i> Update Cart';
                        hideQuantitySelector(); // Hide selector after adding
                    } else {
                        showNotification('Error: ' + (data.error || 'Could not add product to cart.'));
                    }
                })
                .catch(error => {
                    console.error('Error adding to cart:', error);
                    showNotification('Error adding product to cart. Please try again.');
                });
        } else if (this.innerHTML.includes('Update Cart')) {
            // Show quantity selector for updating
            const currentQuantity = parseInt(cartQuantitySpan.textContent);
            showQuantitySelector(currentQuantity);
            this.innerHTML = '<i class="fa fa-shopping-cart"></i> Confirm Update';
        } else if (this.innerHTML.includes('Confirm Update')) {
            // Update item in cart
            const quantity = parseInt(quantityInput.value);
            fetch(`/cart/update_item/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({quantity: quantity})
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Cart updated successfully!');
                        cartQuantitySpan.textContent = quantity;
                        this.innerHTML = '<i class="fa fa-shopping-cart"></i> Update Cart';
                        hideQuantitySelector(); // Hide selector after update
                    } else {
                        showNotification('Error: ' + (data.error || 'Could not update cart.'));
                    }
                })
                .catch(error => {
                    console.error('Error updating cart:', error);
                    showNotification('Error updating cart. Please try again.');
                });
        }
    });

    // Buy now button
    const buyNowBtn = document.querySelector('.buy-now-detail');

    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function () {
            const productId = addToCartBtn ? addToCartBtn.getAttribute('data-product-id') : null;
            const quantity = parseInt(quantityInput.value);
            const csrfToken = getCSRFToken();

            // Animation for button when clicked
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 300);

            if (productId) {
                // First add to cart
                fetch(`/cart/add_item/${productId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({quantity: quantity})
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showNotification('Redirecting to checkout...');
                            // Redirect to checkout page
                            window.location.href = "/cart/";
                        } else {
                            showNotification('Error: ' + (data.error || 'Could not proceed to checkout.'));
                        }
                    })
                    .catch(error => {
                        console.error('Error during buy now:', error);
                        showNotification('Error proceeding to checkout. Please try again.');
                    });
            } else {
                showNotification('Error: Product ID not found.');
            }
        });
    }

    // Wishlist button functionality with AJAX
    // const wishlistBtn = document.querySelector('.add-to-wishlist');

    // Check if the product is already in wishlist
    function checkIfInWishlist() {
        if (!wishlistBtn) return;
        const productId = wishlistBtn.getAttribute('data-product-id');
        const heartIcon = wishlistBtn.querySelector('i');
        if (typeof favouriteItems !== 'undefined' && Array.isArray(favouriteItems)) {
            const isInFavourites = favouriteItems.some(item => item.product_id === parseInt(productId));
            if (isInFavourites) {
                heartIcon.classList.remove('fa-heart-o');
                heartIcon.classList.add('fa-heart');
                wishlistBtn.style.color = '#f27474'; // Filled heart, red color
            } else {
                heartIcon.classList.remove('fa-heart');
                heartIcon.classList.add('fa-heart-o');
                wishlistBtn.style.color = ''; // Outline heart, default color
            }
        } else {
            console.warn('favouriteItems is not defined or not an array');
        }
    }

    // Check if the product is already in cart
    function checkIfInCart() {
        if (!addToCartBtn) return;
        const productId = addToCartBtn.getAttribute('data-product-id');
        if (typeof cartItems !== 'undefined' && Array.isArray(cartItems)) {
            const cartItem = cartItems.find(item => item.product_id === parseInt(productId));
            if (cartItem && quantityInput && inCartMessage && cartQuantitySpan) {
                cartQuantitySpan.textContent = cartItem.quantity;
                inCartMessage.style.display = 'inline';
                addToCartBtn.innerHTML = '<i class="fa fa-shopping-cart"></i> Update Cart';
                hideQuantitySelector(); // Hide quantity selector if in cart
            } else if (inCartMessage) {
                inCartMessage.style.display = 'none';
                showQuantitySelector(1); // Show quantity selector with default value if not in cart
            }
        }
    }

    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', function () {
            const productId = this.getAttribute('data-product-id');
            const heartIcon = this.querySelector('i');
            const csrfToken = getCSRFToken();
            const isCurrentlyInWishlist = heartIcon.classList.contains('fa-heart');

            // Toggle heart icon immediately for better UX
            if (isCurrentlyInWishlist) {
                heartIcon.classList.remove('fa-heart');
                heartIcon.classList.add('fa-heart-o');
                this.style.color = '';
            } else {
                heartIcon.classList.remove('fa-heart-o');
                heartIcon.classList.add('fa-heart');
                this.style.color = '#f27474';
            }

            // AJAX call to add/remove from wishlist
            const url = isCurrentlyInWishlist
                ? `/favourites/remove_favourite_item/${productId}`
                : `/favourites/add_favourite_item/${productId}`;

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const message = isCurrentlyInWishlist
                            ? 'Product removed from your wishlist!'
                            : 'Product added to your wishlist!';
                        showNotification(message);
                    } else {
                        // Revert icon changes if there was an error
                        if (isCurrentlyInWishlist) {
                            heartIcon.classList.remove('fa-heart-o');
                            heartIcon.classList.add('fa-heart');
                            wishlistBtn.style.color = '#f27474';
                        } else {
                            heartIcon.classList.remove('fa-heart');
                            heartIcon.classList.add('fa-heart-o');
                            wishlistBtn.style.color = '';
                        }
                        showNotification('Error: ' + (data.error || 'Could not update wishlist.'));
                    }
                })
                .catch(error => {
                    console.error('Error updating wishlist:', error);
                    // Revert icon changes on network error
                    if (isCurrentlyInWishlist) {
                        heartIcon.classList.remove('fa-heart-o');
                        heartIcon.classList.add('fa-heart');
                        wishlistBtn.style.color = '#f27474';
                    } else {
                        heartIcon.classList.remove('fa-heart');
                        heartIcon.classList.add('fa-heart-o');
                        wishlistBtn.style.color = '';
                    }
                    showNotification('Error updating wishlist. Please try again.');
                });
        });
    }

    // Notification system
    function showNotification(message) {
        let notification = document.getElementById('product-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'product-notification';
            notification.className = 'product-notification';
            document.body.appendChild(notification);
        }
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

// Review form submission
    const reviewForm = document.querySelector('.review-form');

    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const productId = document.getElementById('product-id').value;
            const rating = parseInt(selectedRating.value);
            const comment = document.getElementById('review-content').value;
            const isAnonymous = document.getElementById('is-anonymous').checked;
            const reviewImage = document.getElementById('review-image').files[0];
            const csrfToken = getCSRFToken();

            // Validation
            if (!rating) {
                showNotification('Please select a rating before submitting your review.');
                return;
            }

            if (!comment.trim()) {
                showNotification('Please enter a review comment.');
                return;
            }

            // Create FormData object for file upload
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', comment);
            formData.append('is_anonymous', isAnonymous);
            if (reviewImage) {
                formData.append('image', reviewImage);
            }

            // Submit the review via AJAX
            fetch(`/feedbacks/feedback/${productId}`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        showNotification('Your review has been submitted. Thank you!');

                        // Reload the page to show the updated review
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showNotification('Error: ' + (data.error || 'Could not submit review.'));
                    }
                })
                .catch(error => {
                    console.error('Error submitting review:', error);
                    showNotification('Error submitting review. Please try again.');
                });
        });
    }

    const selectedRating = document.getElementById('selected-rating');

    // Initialize rating stars based on existing rating (if editing)
    if (selectedRating && selectedRating.value) {
        const rating = parseInt(selectedRating.value);
        updateStars(rating);
    }

    // Rating star click functionality
    ratingStars.forEach(star => {
        star.addEventListener('click', function () {
            const rating = parseInt(this.getAttribute('data-rating'));
            updateStars(rating);
            selectedRating.value = rating;
        });

        // Hover effects for stars
        star.addEventListener('mouseover', function () {
            const rating = parseInt(this.getAttribute('data-rating'));

            ratingStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });

        star.addEventListener('mouseout', function () {
            ratingStars.forEach(s => {
                s.classList.remove('hover');
            });
        });
    });

    // Function to update stars display
    function updateStars(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas');
                star.classList.add('active');
            } else {
                star.classList.remove('fas');
                star.classList.remove('active');
                star.classList.add('far');
            }
        });
    }

    // Review form submission


    // Delete review functionality
    const deleteReviewBtn = document.getElementById('delete-review');

    if (deleteReviewBtn) {
        deleteReviewBtn.addEventListener('click', function (e) {
            e.preventDefault();

            if (!confirm('Are you sure you want to delete your review?')) {
                return;
            }

            const productId = document.getElementById('product-id').value;
            const csrfToken = getCSRFToken();

            fetch(`/feedbacks/feedback/${productId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        showNotification('Your review has been deleted.');

                        // Reload the page to update the UI
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showNotification('Error: ' + (data.error || 'Could not delete review.'));
                    }
                })
                .catch(error => {
                    console.error('Error deleting review:', error);
                    showNotification('Error deleting review. Please try again.');
                });
        });
    }

// Related product buttons
    const relatedProductButtons = document.querySelectorAll('.related-product .btn');

    relatedProductButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productContainer = this.closest('.related-product');
            const productName = productContainer.querySelector('h3').textContent;
            const productId = this.getAttribute('data-product-id');
            const csrfToken = getCSRFToken();

            // Animation for button when clicked
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 300);

            if (productId) {
                // AJAX call to add related product to cart
                fetch(`/cart/add_item/${productId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({quantity: 1})
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showNotification(`${productName} added to your cart!`);
                            // Update cart count in header if available
                            if (data.cart_count && document.querySelector('.cart-count')) {
                                document.querySelector('.cart-count').textContent = data.cart_count;
                            }
                        } else {
                            showNotification('Error: ' + (data.error || 'Could not add product to cart.'));
                        }
                    })
                    .catch(error => {
                        console.error('Error adding related product to cart:', error);
                        showNotification('Error adding product to cart. Please try again.');
                    });
            } else {
                showNotification('Error: Product ID not found.');
            }
        });
    });

// Handle social share buttons
    const shareButtons = document.querySelectorAll('.social-share');

    shareButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            const shareType = this.classList.contains('facebook') ? 'Facebook' :
                this.classList.contains('twitter') ? 'Twitter' :
                    this.classList.contains('pinterest') ? 'Pinterest' : 'Email';

            const productName = document.querySelector('.product-header h1').textContent;
            const currentUrl = window.location.href;

            // Implement actual sharing functionality
            switch (shareType) {
                case 'Facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`);
                    break;
                case 'Twitter':
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(productName)}`);
                    break;
                case 'Pinterest':
                    const imageUrl = document.getElementById('main-product-image').src;
                    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(productName)}`);
                    break;
                case 'Email':
                    window.location.href = `mailto:?subject=${encodeURIComponent(`Check out this product: ${productName}`)}&body=${encodeURIComponent(`I found this and thought you might like it: ${currentUrl}`)}`;
                    break;
            }

            showNotification(`Shared on ${shareType}!`);
        });
    });

// Handle input validation for quantity
    quantityInput.addEventListener('change', function () {
        let value = parseInt(this.value);
        const min = parseInt(this.getAttribute('min'));
        const max = parseInt(this.getAttribute('max'));

        if (isNaN(value) || value < min) {
            this.value = min;
        } else if (value > max) {
            this.value = max;
            showNotification(`Sorry, only ${max} items available in stock.`);
        }
    });

// Add smooth scrolling to reviews section when clicking on ratings
    const productRating = document.querySelector('.product-rating');

    if (productRating) {
        productRating.addEventListener('click', function () {
            const reviewsTab = document.querySelector('[data-tab="reviews"]');
            const reviewsSection = document.getElementById('reviews-tab');

            // Activate reviews tab
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            reviewsTab.classList.add('active');
            reviewsSection.classList.add('active');

            // Scroll to reviews section
            reviewsSection.scrollIntoView({behavior: 'smooth'});
        });
    }

// Initialize tooltips for any elements with data-tooltip attribute
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        element.addEventListener('mouseover', function () {
            const tooltipText = this.getAttribute('data-tooltip');

            // Create tooltip element if it doesn't exist
            let tooltip = document.getElementById('tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'tooltip';
                tooltip.className = 'tooltip';
                document.body.appendChild(tooltip);
            }

            // Position tooltip and show it
            tooltip.textContent = tooltipText;
            tooltip.style.display = 'block';

            const rect = this.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10 + window.scrollY}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        });

        element.addEventListener('mouseout', function () {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    });
// const removeFromCartBtn = document.querySelector('.remove-from-cart');
    if (removeFromCartBtn) {
        removeFromCartBtn.addEventListener('click', function () {
            const productId = this.getAttribute('data-product-id');
            const csrfToken = getCSRFToken();

            this.classList.add('clicked');
            setTimeout(() => this.classList.remove('clicked'), 300);

            fetch(`/cart/remove_item/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Product removed from your cart!');
                        if (data.cart_count && document.querySelector('.cart-count')) {
                            document.querySelector('.cart-count').textContent = data.cart_count;
                        }
                        inCartMessage.style.display = 'none';
                        quantityInput.value = 1;
                        addToCartBtn.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';
                        showQuantitySelector(1); // Show quantity selector after removal
                    } else {
                        showNotification('Error: ' + (data.error || 'Could not remove product from cart.'));
                    }
                })
                .catch(error => {
                    console.error('Error removing from cart:', error);
                    showNotification('Error removing product from cart. Please try again.');
                });
        });
    }


// Track product view for analytics
    const productId = document.querySelector('.add-to-cart-detail')?.getAttribute('data-product-id');

    if (productId) {
        // Send view data to analytics service
        console.log(`Tracking view for product ID ${productId}`);

        // Add to recently viewed items in localStorage
        try {
            let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

            // Remove if already in list
            recentlyViewed = recentlyViewed.filter(id => id !== productId);

            // Add to front of array
            recentlyViewed.unshift(productId);

            // Keep only most recent 10 items
            recentlyViewed = recentlyViewed.slice(0, 10);

            // Save back to localStorage
            localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
        } catch (e) {
            console.error('Error updating recently viewed items:', e);
        }
    }

// Helper function to get CSRF token from cookies
    function getCSRFToken() {
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

// Initialize checks for items in cart and wishlist on page load
// Create global arrays from Django context if they don't exist in JS context
    if (typeof favouriteItems === 'undefined') {
        // Create a script to inject the favourite items data from Django into JS
        const favouriteItemsScript = document.createElement('script');
        favouriteItemsScript.innerHTML = `
            var favouriteItems = [];
            {% if favourite_items %}
                {% for item in favourite_items %}
                    favouriteItems.push({
                        product_id: {{ item.product.id }}
                    });
                {% endfor %}
            {% endif %}
        `;
        document.head.appendChild(favouriteItemsScript);
    }

    if (typeof cartItems === 'undefined') {
        // Create a script to inject the cart items data from Django into JS
        const cartItemsScript = document.createElement('script');
        cartItemsScript.innerHTML = `
            var cartItems = [];
            {% if cart_items %}
                {% for item in cart_items %}
                    cartItems.push({
                        product_id: {{ item.product.id }},
                        quantity: {{ item.quantity }}
                    });
                {% endfor %}
            {% endif %}
        `;
        document.head.appendChild(cartItemsScript);
    }
    function initializeRating() {
        if (selectedRating && selectedRating.value) {
            updateStars(parseInt(selectedRating.value));
        }
    }
// Check wishlist and cart status after a short delay to ensure scripts are loaded
    setTimeout(() => {
        checkIfInCart();
        checkIfInWishlist(); // Add this to check favorites
    }, 100);
    // Rating star selection
    initializeRating();

});


