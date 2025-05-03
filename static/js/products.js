/**
 * Enhanced Products JavaScript with Smooth Animations
 * Complete version with all improvements integrated
 */

// Language handling utilities
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

// GSAP-like animation utility for smoother transitions
const SmoothAnimation = {
    easeOutBack: function (t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutQuart: function (t) {
        return 1 - Math.pow(1 - t, 4);
    },
    easeInOutQuart: function (t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    },
    animate: function (element, properties, duration = 300, easing = this.easeOutQuart) {
        const startTime = performance.now();
        const initialProperties = {};

        // Store initial values
        for (const prop in properties) {
            let initialValue = parseFloat(window.getComputedStyle(element)[prop]) || 0;
            initialProperties[prop] = initialValue;
        }

        // Animation frame function
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);

            for (const prop in properties) {
                const initialValue = initialProperties[prop];
                const targetValue = properties[prop];
                const value = initialValue + (targetValue - initialValue) * easedProgress;
                element.style[prop] = `${value}${prop === 'opacity' ? '' : 'px'}`;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }
};

// All functionality wrapped in DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function () {
    // ===============================================================
    // 1. ENHANCED HEART ICON ANIMATIONS (WISHLIST FUNCTIONALITY)
    // ===============================================================

    // Create heart animation with particle effects
    function createHeartAnimation(heartIcon) {
        // Add particle effects for fun interactions
        function createParticles(x, y) {
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: ${y}px;
                left: ${x}px;
                width: 1px;
                height: 1px;
                pointer-events: none;
                z-index: 9999;
            `;
            document.body.appendChild(container);

            const particleCount = 6;
            const colors = ['#f72585', '#b5179e', '#7209b7', '#560bad'];

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                const size = Math.random() * 6 + 3;
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 50 + 30;

                particle.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: ${size}px;
                    height: ${size}px;
                    background-color: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                `;

                container.appendChild(particle);

                // Animate each particle
                const startTime = performance.now();
                const duration = Math.random() * 600 + 400;

                function animateParticle(time) {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    const translateX = Math.cos(angle) * velocity * progress;
                    const translateY = Math.sin(angle) * velocity * progress - (100 * Math.pow(progress, 2)); // Arc upward
                    const scale = 1 - progress;
                    const opacity = 1 - progress;

                    particle.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
                    particle.style.opacity = opacity;

                    if (progress < 1) {
                        requestAnimationFrame(animateParticle);
                    } else {
                        particle.remove();
                        if (container.children.length === 0) {
                            container.remove();
                        }
                    }
                }

                requestAnimationFrame(animateParticle);
            }
        }

        // Create a ripple effect
        function createRipple(element) {
            const ripple = document.createElement('div');
            ripple.className = 'heart-ripple';

            // Position the ripple
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                width: 100%;
                height: 100%;
                background-color: rgba(247, 37, 133, 0.15);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
            `;

            element.appendChild(ripple);

            // Animate the ripple
            SmoothAnimation.animate(ripple, {
                transform: 'translate(-50%, -50%) scale(2.5)'
            }, 600, SmoothAnimation.easeOutQuart);

            setTimeout(() => {
                SmoothAnimation.animate(ripple, {opacity: 0}, 300);
                setTimeout(() => ripple.remove(), 300);
            }, 300);
        }

        // Main heart icon click animation
        return function (event) {
            const button = event.currentTarget;
            const icon = button.querySelector('i');

            if (!icon) return;

            // Create ripple effect
            createRipple(button);

            // Get position for particles
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Add particle effects when favoriting (only when adding to favorites)
            if (icon.classList.contains('fa-heart-o') || icon.classList.contains('far')) {
                createParticles(x, y);
            }

            // Apply scale animation to button
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        };
    }

    // Apply wishlist button functionality with animation
    const wishlistButtons = document.querySelectorAll('.wishlist');
    wishlistButtons.forEach(button => {
        // Add animation effect
        const heartAnimation = createHeartAnimation(button);
        button.addEventListener('click', heartAnimation);

        // Ensure heart icon is properly colored
        const icon = button.querySelector('i');
        if (icon && (icon.classList.contains('fa-heart-o') || icon.classList.contains('far'))) {
            icon.style.color = '#f72585';
        }

        // Add AJAX functionality for wishlist
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
            const isAdding = icon.classList.contains('fa-heart-o') || icon.classList.contains('far');

            // Set the URL based on action
            const url = isAdding
                ? `/favourites/add_favourite_item/${productId}`
                : `/favourites/remove_favourite_item/${productId}`;

            // Send AJAX request
            fetch(ensureLanguagePrefix(url), {
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

                            // Apply background color for better visibility
                            this.style.backgroundColor = 'rgba(247, 37, 133, 0.12)';

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
                            // Keep the heart color visible even when not active
                            this.querySelector('i').style.color = '#f72585';
                            this.style.color = '';
                            this.style.borderColor = '';
                            this.style.backgroundColor = 'rgba(247, 37, 133, 0.07)';

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

    // ===============================================================
    // 2. ENHANCED VIEW SWITCHING (GRID/LIST VIEW)
    // ===============================================================

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

    // Enhanced view switching with animations
    viewButtons.forEach(button => {
        button.addEventListener('click', function () {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const viewType = this.getAttribute('data-view');

            if (viewType === 'list') {
                // Apply staggered card animation when switching to list view
                const cards = productsGrid.querySelectorAll('.product-card');

                // First, add the list-view class
                productsGrid.classList.add('list-view');

                // Then animate each card
                cards.forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50 + (index * 30));
                });
            } else {
                // Similarly animate grid view transition
                const cards = productsGrid.querySelectorAll('.product-card');

                cards.forEach((card) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                });

                productsGrid.classList.remove('list-view');

                setTimeout(() => {
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50 + (index * 30));
                    });
                }, 100);
            }

            // Save the preference to localStorage
            localStorage.setItem('productView', viewType);
        });
    });

    // ===============================================================
    // 3. ENHANCED FILTER SIDEBAR ANIMATIONS & FUNCTIONALITY
    // ===============================================================

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

    // Improved sidebar opening animation
    function openFilterSidebar() {
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // First display the elements
        filterPanel.style.display = 'flex';
        filterOverlay.style.display = 'block';

        // Trigger a reflow
        void filterPanel.offsetWidth;

        // Then add active classes for transitions
        filterPanel.classList.add('active');
        filterOverlay.classList.add('active');
        filterToggle.classList.add('active');

        // Animate filter groups with staggered timing
        const filterGroups = document.querySelectorAll('.filter-group');
        filterGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';

            setTimeout(() => {
                group.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 100 + (index * 50));
        });

        // Add content push effect only on larger screens
        if (window.innerWidth >= 992) {
            setTimeout(() => {
                productsContainer.classList.add('sidebar-open');
            }, 50);
        }
    }

    // Improved sidebar closing animation
    function closeFilterSidebar() {
        filterPanel.classList.remove('active');
        filterOverlay.classList.remove('active');
        filterToggle.classList.remove('active');
        productsContainer.classList.remove('sidebar-open');

        // Wait for the transition to finish before hiding elements
        setTimeout(() => {
            if (!filterPanel.classList.contains('active')) {
                document.body.style.overflow = ''; // Restore scrolling
                filterPanel.style.display = '';
                filterOverlay.style.display = '';
            }
        }, 500);
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
            closeFilterSidebar();
        });
    }

    // Close sidebar with ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && filterPanel && filterPanel.classList.contains('active')) {
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
        if (filterPanel && filterPanel.classList.contains('active')) {
            if (window.innerWidth < 992) {
                productsContainer.classList.remove('sidebar-open');
            } else {
                productsContainer.classList.add('sidebar-open');
            }
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

    // ===============================================================
    // 4. ENHANCED CATEGORIES DROPDOWN ANIMATION
    // ===============================================================

    const categoriesToggle = document.querySelector('.categories-toggle');
    const categoriesDropdown = document.querySelector('.categories-dropdown-content');
    const closeCategories = document.querySelector('.close-categories');
    const applyCategories = document.querySelector('.apply-categories');
    const resetCategories = document.querySelector('.reset-categories');
    const categoryCheckboxes = document.querySelectorAll('.categories-list input[type="checkbox"]');
    const filterForm = document.getElementById('filter-form');
    const hiddenCategoryInputs = document.querySelector('.hidden-category-inputs');

    if (categoriesToggle && categoriesDropdown) {
        function toggleCategoriesDropdown(event) {
            event.preventDefault();
            event.stopPropagation();

            const isActive = categoriesDropdown.classList.contains('active');

            if (isActive) {
                // Close with animation
                categoriesDropdown.style.opacity = '0';
                categoriesDropdown.style.transform = 'translateY(10px)';
                categoriesToggle.classList.remove('active');

                setTimeout(() => {
                    categoriesDropdown.classList.remove('active');
                }, 300);

                document.removeEventListener('click', handleOutsideClick);
            } else {
                // Open with animation
                categoriesDropdown.classList.add('active');
                categoriesToggle.classList.add('active');

                // Ensure we start from the initial state before animating
                categoriesDropdown.style.opacity = '0';
                categoriesDropdown.style.transform = 'translateY(10px)';

                // Force a reflow
                void categoriesDropdown.offsetWidth;

                // Now animate to final state
                categoriesDropdown.style.opacity = '1';
                categoriesDropdown.style.transform = 'translateY(0)';

                document.addEventListener('click', handleOutsideClick);
            }
        }

        function handleOutsideClick(event) {
            if (!categoriesDropdown.contains(event.target) && !categoriesToggle.contains(event.target)) {
                toggleCategoriesDropdown(event);
            }
        }

        categoriesToggle.addEventListener('click', toggleCategoriesDropdown);
    }

    // Close dropdown with close button
    if (closeCategories) {
        closeCategories.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            categoriesDropdown.style.opacity = '0';
            categoriesDropdown.style.transform = 'translateY(10px)';
            categoriesToggle.classList.remove('active');

            setTimeout(() => {
                categoriesDropdown.classList.remove('active');
            }, 300);

            document.removeEventListener('click', handleOutsideClick);
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
    if (categoryCheckboxes) {
        categoryCheckboxes.forEach(checkbox => {
            if (checkbox.getAttribute('data-form-submit') === 'true') {
                checkbox.addEventListener('change', function () {
                    // Update hidden inputs in the main filter form
                    updateHiddenCategoryInputs();
                });
            }
        });
    }

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

    // Update active category count badge
    function updateCategoryCount() {
        if (!categoriesToggle) return;

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
    if (categoryCheckboxes) {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateCategoryCount);
        });
    }

    // ===============================================================
    // 5. ENHANCED PRODUCT CARD HOVER EFFECTS
    // ===============================================================

    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.zIndex = '10';

            // Add subtle shadow animation
            this.style.transition = 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)';

            // Enhance image on hover with subtle zoom
            const image = this.querySelector('.product-image img');
            if (image) {
                image.style.transform = 'scale(1.08)';
                image.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
            }
        });

        card.addEventListener('mouseleave', function () {
            this.style.zIndex = '1';

            // Reset image zoom
            const image = this.querySelector('.product-image img');
            if (image) {
                image.style.transform = 'scale(1)';
            }
        });
    });

    // ===============================================================
    // 6. ADD TO CART FUNCTIONALITY
    // ===============================================================

    const addToCartButtons = document.querySelectorAll('.add-to-cart, .update-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Check if button is disabled or has the 'out-of-stock' class
            if (this.disabled || this.classList.contains('out-of-stock')) {
                // Show a notification that the item is out of stock
                const notification = document.createElement('div');
                notification.className = 'product-notification error';
                notification.innerHTML = '<i class="fa fa-exclamation-circle"></i> This item is out of stock';
                document.body.appendChild(notification);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 2000);

                return; // Stop execution
            }

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
        fetch(ensureLanguagePrefix(`/cart/add_item/${productId}`), {
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
        fetch(ensureLanguagePrefix(`/cart/remove_cart_item_in_list/${itemId}`), {
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

    // ===============================================================
    // 7. MOBILE SORT FUNCTIONALITY
    // ===============================================================

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

    // ===============================================================
    // 8. INITIALIZE FAVORITE BUTTONS
    // ===============================================================

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
                    // Update for Font Awesome 4 or 5
                    if (icon.classList.contains('fa-heart-o')) {
                        icon.classList.remove('fa-heart-o');
                        icon.classList.add('fa-heart');
                    } else if (icon.classList.contains('far')) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    }

                    wishlistBtn.style.color = '#f72585';
                    wishlistBtn.style.borderColor = '#f72585';
                    wishlistBtn.style.backgroundColor = 'rgba(247, 37, 133, 0.12)';
                }

                // Add favorite badge if not exists
                const badgeContainer = card.querySelector('.product-badges');
                if (badgeContainer && !card.querySelector('.badge.favorite')) {
                    const favBadge = document.createElement('span');
                    favBadge.className = 'badge favorite';
                    favBadge.textContent = 'Favorite';
                    badgeContainer.appendChild(favBadge);
                }
            } else if (wishlistBtn) {
                // Ensure non-favorite hearts are visible
                const icon = wishlistBtn.querySelector('i');
                if (icon && (icon.classList.contains('fa-heart-o') || icon.classList.contains('far'))) {
                    icon.style.color = '#f72585';
                    wishlistBtn.style.backgroundColor = 'rgba(247, 37, 133, 0.07)';
                }
            }
        });
    }

    // Initialize on page load
    initializeFavoriteButtons();

    // Fix any missing heart icons by double-checking
    setTimeout(() => {
        // For Font Awesome 4
        const emptyHearts = document.querySelectorAll('.wishlist i.fa-heart-o');
        emptyHearts.forEach(icon => {
            if (!icon.style.color) {
                icon.style.color = '#f72585';
            }
        });

        // For Font Awesome 5
        const farHearts = document.querySelectorAll('.wishlist i.far.fa-heart');
        farHearts.forEach(icon => {
            if (!icon.style.color) {
                icon.style.color = '#f72585';
            }
        });
    }, 500);
});