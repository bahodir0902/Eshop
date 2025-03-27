// JavaScript for enhanced product list functionality
document.addEventListener('DOMContentLoaded', function() {
  // View switching functionality (grid vs list)
  const viewButtons = document.querySelectorAll('.view-btn');
  const productsGrid = document.querySelector('.products-grid');

  viewButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      viewButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Get the view type from data attribute
      const viewType = this.getAttribute('data-view');

      // Apply appropriate class to products container
      if (viewType === 'list') {
        productsGrid.classList.add('list-view');
      } else {
        productsGrid.classList.remove('list-view');
      }
    });
  });

  // Wishlist button toggle
  const wishlistButtons = document.querySelectorAll('.wishlist');
  wishlistButtons.forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (icon.classList.contains('fa-heart-o')) {
        icon.classList.remove('fa-heart-o');
        icon.classList.add('fa-heart');
        this.style.color = '#f72585';
        this.style.borderColor = '#f72585';
      } else {
        icon.classList.remove('fa-heart');
        icon.classList.add('fa-heart-o');
        this.style.color = '';
        this.style.borderColor = '';
      }
    });
  });

  // Add to cart animation
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.innerHTML = '<i class="fa fa-check"></i> Added';
      this.classList.add('added');

      // Reset after 2 seconds
      setTimeout(() => {
        this.innerHTML = '<i class="fa fa-shopping-cart"></i> Add to Cart';
        this.classList.remove('added');
      }, 2000);
    });
  });

  // Product card hover effect
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.zIndex = '10';
    });

    card.addEventListener('mouseleave', function() {
      this.style.zIndex = '1';
    });
  });
});