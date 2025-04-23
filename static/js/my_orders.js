document.addEventListener('DOMContentLoaded', function() {
  // Initialize filter buttons
  initializeFilters();

  // Initialize order detail buttons
  initializeOrderDetails();

  // Initialize modal
  initializeModal();

  // Add animation to orders when they come into view
  addScrollAnimations();
});

// Filter functionality
function initializeFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const orderCards = document.querySelectorAll('.order-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      const status = this.getAttribute('data-status');

      // Show/hide orders based on filter
      orderCards.forEach(card => {
        if (status === 'all' || card.getAttribute('data-filter-category') === status) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // Group order statuses into categories for filtering
  const statusMapping = {
    'paid': 'processing',
    'processing': 'processing',
    'on_hold': 'processing',
    'packing': 'processing',
    'shipped': 'shipped',
    'in_delivery': 'shipped',
    'delivered': 'delivered'
  };

  // Map actual status to filter category
  orderCards.forEach(card => {
    const status = card.getAttribute('data-status');
    const filterCategory = statusMapping[status] || status;
    card.setAttribute('data-filter-category', filterCategory);
  });
}

// Order details functionality
function initializeOrderDetails() {
  const detailButtons = document.querySelectorAll('.details-btn');
  const modal = document.getElementById('orderDetailsModal');
  const modalContent = document.getElementById('modalContent');

  detailButtons.forEach(button => {
    button.addEventListener('click', function() {
      const orderCard = this.closest('.order-card');
      const orderClone = orderCard.cloneNode(true);

      // Remove action buttons from the clone
      const actionButtons = orderClone.querySelector('.order-actions');
      if (actionButtons) {
        actionButtons.remove();
      }

      // Add extra details to the modal
      const orderHeader = orderClone.querySelector('.order-header');
      const orderIdElement = orderHeader.querySelector('h3');
      const orderId = orderIdElement.textContent.replace('Order #', '').trim();

      // Create a tracking information section
      const trackingSection = document.createElement('div');
      trackingSection.className = 'tracking-info';
      trackingSection.innerHTML = `
        <h4>Tracking Information</h4>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Tracking Number:</strong> <span class="tracking-number">N/A</span></p>
        <p><strong>Carrier:</strong> <span class="carrier">N/A</span></p>
      `;

      // Add the tracking section before the order details
      const orderDetails = orderClone.querySelector('.order-details');
      orderClone.insertBefore(trackingSection, orderDetails);

      // Add a class to indicate this is the detailed view
      orderClone.classList.add('detailed-view');

      // Clear modal content and add the clone
      modalContent.innerHTML = '';
      modalContent.appendChild(orderClone);

      // Show the modal
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling

      // Add fade-in animation
      setTimeout(() => {
        modalContent.style.opacity = '1';
      }, 10);
    });
  });
}

// Modal functionality
function initializeModal() {
  const modal = document.getElementById('orderDetailsModal');
  const closeButton = document.querySelector('.close-modal');

  // Close modal when clicking the X button
  closeButton.addEventListener('click', function() {
    closeModal();
  });

  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Close modal when pressing ESC key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

function closeModal() {
  const modal = document.getElementById('orderDetailsModal');
  const modalContent = document.getElementById('modalContent');

  // Add fade-out animation
  modalContent.style.opacity = '0';

  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  }, 300);
}

// Add scroll animations
function addScrollAnimations() {
  const orderCards = document.querySelectorAll('.order-card');

  // Set initial state for animation
  orderCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transitionDelay = `${index * 0.1}s`;
  });

  // Create an intersection observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  // Observe each card
  orderCards.forEach(card => {
    observer.observe(card);
  });

  // Trigger animation for initially visible cards
  setTimeout(() => {
    orderCards.forEach(card => {
      if (isElementInViewport(card)) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        observer.unobserve(card);
      }
    });
  }, 100);
}

// Helper function to check if element is in viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}