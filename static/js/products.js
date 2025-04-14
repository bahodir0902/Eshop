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
                ? `/favourites/add_favourite_item/${productId}`
                : `/favourites/remove_favourite_item/${productId}`;

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

    // === FIXED FILTER SIDEBAR FUNCTIONALITY ===

    // Filter sidebar functionality
    const filterToggle = document.querySelector('.filter-toggle');
    const filterPanel = document.querySelector('.filter-panel');
    const closeFilters = document.querySelector('.close-filters');
    const filterOverlay = document.querySelector('.filter-overlay');
    const productsContainer = document.querySelector('.products-container');

    // Update filter count badge
    function updateFilterCount() {
        const activeFilters = document.querySelectorAll('.active-filter');
        const filterCount = activeFilters.length;

        const filterCountBadge = document.querySelector('.filter-count');
        if (filterCountBadge) {
            filterCountBadge.textContent = filterCount;

            if (filterCount > 0) {
                filterCountBadge.classList.add('active');
            } else {
                filterCountBadge.classList.remove('active');
            }
        }
    }

    // Add filter count badge if it doesn't exist
    if (filterToggle && !filterToggle.querySelector('.filter-count')) {
        const filterCountBadge = document.createElement('span');
        filterCountBadge.className = 'filter-count';
        filterToggle.appendChild(filterCountBadge);

        // Initialize count
        updateFilterCount();
    }

    // Add animation delay to filter groups
    const filterGroups = document.querySelectorAll('.filter-group');
    filterGroups.forEach((group, index) => {
        group.style.setProperty('--index', index);
    });

    // Function to open filter sidebar
    function openFilterSidebar() {
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        filterPanel.classList.add('active');
        filterOverlay.classList.add('active');
        filterToggle.classList.add('active');

        // Only add the sidebar-open class on larger screens
        if (window.innerWidth >= 992) {
            productsContainer.classList.add('sidebar-open');
        }

        // Reset animation for filter groups
        filterGroups.forEach((group) => {
            group.style.animation = 'none';
            group.offsetHeight; // Force reflow
            group.style.animation = null;
        });
    }

    // Function to close filter sidebar
    function closeFilterSidebar() {
        document.body.style.overflow = ''; // Restore scrolling
        filterPanel.classList.remove('active');
        filterOverlay.classList.remove('active');
        filterToggle.classList.remove('active');
        productsContainer.classList.remove('sidebar-open');
    }

    // Toggle filter sidebar when clicking the filter button
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (filterPanel.classList.contains('active')) {
                closeFilterSidebar();
            } else {
                openFilterSidebar();
            }
        });
    }

    // Close filter sidebar with close button
    if (closeFilters) {
        closeFilters.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeFilterSidebar();
        });
    }

    // Close filter sidebar when clicking the overlay
    if (filterOverlay) {
        filterOverlay.addEventListener('click', function (e) {
            e.preventDefault();
            closeFilterSidebar();
        });
    }

    // Close sidebar with ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && filterPanel.classList.contains('active')) {
            closeFilterSidebar();
        }
    });

    // Prevent filter panel clicks from propagating to overlay
    if (filterPanel) {
        filterPanel.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    // Handle window resize to adjust sidebar behavior
    window.addEventListener('resize', function () {
        if (filterPanel.classList.contains('active') && window.innerWidth < 992) {
            productsContainer.classList.remove('sidebar-open');
        } else if (filterPanel.classList.contains('active') && window.innerWidth >= 992) {
            productsContainer.classList.add('sidebar-open');
        }
    });

    // Handle removing filters
    const removeFilterBtns = document.querySelectorAll('.remove-filter');
    if (removeFilterBtns.length > 0) {
        removeFilterBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                // Get the parameter to remove
                const param = this.getAttribute('data-param');
                const value = this.getAttribute('data-value');

                // Get the current URL
                const url = new URL(window.location.href);
                const searchParams = url.searchParams;

                // Handle different types of parameters
                if (param === 'price') {
                    searchParams.delete('min_price');
                    searchParams.delete('max_price');
                } else if (param === 'category' && value) {
                    // For multiple selection parameters, only remove the specific value
                    const currentValues = searchParams.getAll(param);
                    searchParams.delete(param);

                    currentValues.forEach(val => {
                        if (val !== value) {
                            searchParams.append(param, val);
                        }
                    });
                } else {
                    searchParams.delete(param);
                }

                // Redirect to the updated URL
                window.location.href = url.toString();

                // Update count after a brief delay
                setTimeout(updateFilterCount, 100);
            });
        });
    }

    // Clear all filters
    const clearAllBtn = document.querySelector('.clear-all-filters');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Get the current URL
            const url = new URL(window.location.href);
            const searchParams = url.searchParams;

            // Keep only the search query if it exists
            const searchQuery = searchParams.get('q');

            // Clear all parameters
            url.search = '';

            // Add back the search query if it existed
            if (searchQuery) {
                url.searchParams.set('q', searchQuery);
            }

            // Redirect to the updated URL
            window.location.href = url.toString();

            // Update count after a brief delay
            setTimeout(updateFilterCount, 100);
        });
    }

    // Mobile quick sort functionality
    const mobileSort = document.getElementById('mobile-sort');
    if (mobileSort) {
        mobileSort.addEventListener('change', function () {
            const form = document.getElementById('filter-form');
            if (form) {
                const sortInput = form.querySelector('input[name="sort"]:checked');
                if (sortInput) {
                    sortInput.checked = false;
                }

                const newSort = this.value;
                if (newSort) {
                    const newSortInput = form.querySelector(`input[name="sort"][value="${newSort}"]`);
                    if (newSortInput) {
                        newSortInput.checked = true;
                    }
                    form.submit();
                }
            }
        });
    }

    function initializeCartButtons() {
        // Find all product cards
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const productId = card.getAttribute('data-product-id');
            const inCartIndicator = card.querySelector('.in-cart-indicator');
            const addToCartBtn = card.querySelector('.add-to-cart');
            const updateCartBtn = card.querySelector('.update-cart');

            // If this product has an in-cart indicator, it should show "Update Cart"
            if (inCartIndicator) {
                // Hide "Add to Cart" if it exists
                if (addToCartBtn) {
                    addToCartBtn.style.display = 'none';
                }

                // Show "Update Cart" if it exists
                if (updateCartBtn) {
                    updateCartBtn.style.display = 'flex';
                }
                // If "Update Cart" button doesn't exist but should, create it from "Add to Cart"
                else if (addToCartBtn) {
                    addToCartBtn.innerHTML = '<i class="fa fa-refresh"></i> Update Cart';
                    addToCartBtn.className = 'btn btn-success update-cart';
                    addToCartBtn.style.display = 'flex';
                }
            }
        });
    }

    initializeCartButtons();


    const categoriesToggle = document.querySelector('.categories-toggle');
    const categoriesDropdown = document.querySelector('.categories-dropdown-content');
    const closeCategories = document.querySelector('.close-categories');
    const applyCategories = document.querySelector('.apply-categories');
    const resetCategories = document.querySelector('.reset-categories');
    const categoryCheckboxes = document.querySelectorAll('.categories-list input[type="checkbox"]');
    const filterForm = document.getElementById('filter-form');
    const hiddenCategoryInputs = document.querySelector('.hidden-category-inputs');

    // Function to toggle categories dropdown
    function toggleCategoriesDropdown(event) {
        event.preventDefault();
        event.stopPropagation();

        const isActive = categoriesDropdown.classList.contains('active');

        if (isActive) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    // Function to open dropdown
    function openDropdown() {
        categoriesDropdown.classList.add('active');
        categoriesToggle.classList.add('active');

        // Close when clicking outside
        document.addEventListener('click', handleOutsideClick);
    }

    // Function to close dropdown
    function closeDropdown() {
        categoriesDropdown.classList.remove('active');
        categoriesToggle.classList.remove('active');

        // Remove outside click listener
        document.removeEventListener('click', handleOutsideClick);
    }

    // Handle clicks outside the dropdown
    function handleOutsideClick(event) {
        if (!categoriesDropdown.contains(event.target) && !categoriesToggle.contains(event.target)) {
            closeDropdown();
        }
    }

    // Toggle dropdown when clicking the toggle button
    if (categoriesToggle && categoriesDropdown) {
        categoriesToggle.addEventListener('click', toggleCategoriesDropdown);
    }

    // Close dropdown with close button
    if (closeCategories) {
        closeCategories.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeDropdown();
        });
    }

    // Handle Apply button
    if (applyCategories) {
        applyCategories.addEventListener('click', function (e) {
            e.preventDefault();

            // Get current URL and params
            const url = new URL(window.location.href);
            const searchParams = url.searchParams;

            // Clear all category parameters
            searchParams.delete('category');

            // Add selected categories
            categoryCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    searchParams.append('category', checkbox.value);
                }
            });

            // Redirect to the updated URL
            window.location.href = url.toString();
        });
    }

    // Handle Reset button
    if (resetCategories) {
        resetCategories.addEventListener('click', function (e) {
            e.preventDefault();

            // Uncheck all checkboxes
            categoryCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });

            // Apply changes immediately
            if (applyCategories) {
                applyCategories.click();
            }
        });
    }

    // Handle direct checkbox changes with data-form-submit attribute
    categoryCheckboxes.forEach(checkbox => {
        if (checkbox.getAttribute('data-form-submit') === 'true') {
            checkbox.addEventListener('change', function () {
                // Update hidden inputs in the main filter form
                updateHiddenCategoryInputs();
            });
        }
    });

    // Function to update hidden category inputs in the main filter form
    function updateHiddenCategoryInputs() {
        if (hiddenCategoryInputs) {
            // Clear existing inputs
            hiddenCategoryInputs.innerHTML = '';

            // Add inputs for selected categories
            categoryCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'category';
                    hiddenInput.value = checkbox.value;
                    hiddenCategoryInputs.appendChild(hiddenInput);
                }
            });
        }
    }

    // Initialize hidden inputs
    updateHiddenCategoryInputs();

    // Close dropdown with ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && categoriesDropdown.classList.contains('active')) {
            closeDropdown();
        }
    });

    // Update active category count badge
    function updateCategoryCount() {
        const activeCategoriesCount = document.querySelectorAll('.categories-list input[type="checkbox"]:checked').length;

        if (activeCategoriesCount > 0) {
            // Create or update the count badge
            let countBadge = categoriesToggle.querySelector('.category-count');
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.className = 'category-count';
                categoriesToggle.appendChild(countBadge);
            }

            countBadge.textContent = activeCategoriesCount;
            countBadge.style.display = 'flex';
        } else {
            // Remove the count badge if no categories selected
            const countBadge = categoriesToggle.querySelector('.category-count');
            if (countBadge) {
                countBadge.style.display = 'none';
            }
        }
    }

    // Run once on page load
    updateCategoryCount();

    // Update when checkboxes change
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCategoryCount);
    });


});