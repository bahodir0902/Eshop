document.addEventListener('DOMContentLoaded', function() {
  // Initialize filter buttons
  initializeFilters();

  // Initialize order detail buttons
  initializeOrderDetails();

  // Initialize order action buttons
  initializeOrderActions();

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
    'delivered': 'delivered',
    'return_requested': 'returned',
    'returned': 'returned',
    'refunded': 'returned',
    'canceled': 'canceled',
    'failed': 'canceled'
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

// Order action buttons functionality
function initializeOrderActions() {
  // Return buttons
  const returnButtons = document.querySelectorAll('.return-btn');
  returnButtons.forEach(button => {
    button.addEventListener('click', function() {
      const orderCard = this.closest('.order-card');
      showReturnModal(orderCard);
    });
  });

  // Cancel buttons
  const cancelButtons = document.querySelectorAll('.cancel-btn');
  cancelButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (confirm('Are you sure you want to cancel this order?')) {
        const orderCard = this.closest('.order-card');
        simulateCancelOrder(orderCard);
      }
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

// Return modal
function showReturnModal(orderCard) {
  const modal = document.getElementById('orderDetailsModal');
  const modalContent = document.getElementById('modalContent');

  // Get order ID
  const orderHeader = orderCard.querySelector('.order-header');
  const orderIdElement = orderHeader.querySelector('h3');
  const orderId = orderIdElement.textContent.replace('Order #', '').trim();

  // Get order items
  const items = Array.from(orderCard.querySelectorAll('.item'));

  // Create return form
  let returnForm = `
    <h2>Return Request for Order #${orderId}</h2>
    <p>Please select the items you want to return and provide a reason:</p>
    <form id="returnForm" class="return-form">
      <div class="return-items">
  `;

  items.forEach((item, index) => {
    const itemName = item.querySelector('h5').textContent;
    const itemPrice = item.querySelector('.item-price').textContent;
    const itemQuantity = item.querySelector('.item-quantity').textContent.replace('Qty: ', '').trim();

    returnForm += `
      <div class="return-item">
        <label class="checkbox-container">
          <input type="checkbox" name="return_item_${index}" value="${index}">
          <span class="checkmark"></span>
          <div class="return-item-details">
            <strong>${itemName}</strong>
            <span>${itemPrice} - ${itemQuantity}</span>
          </div>
        </label>
        <div class="return-reason-container">
          <select name="reason_${index}" class="return-reason" disabled>
            <option value="">Select a reason</option>
            <option value="wrong_item">Wrong item received</option>
            <option value="defective">Item is defective/damaged</option>
            <option value="not_as_described">Item not as described</option>
            <option value="no_longer_needed">No longer needed</option>
            <option value="other">Other reason</option>
          </select>
          <textarea name="comment_${index}" placeholder="Additional comments (optional)" class="return-comment" disabled></textarea>
        </div>
      </div>
    `;
  });

  returnForm += `
      </div>
      <div class="return-actions">
        <button type="button" class="cancel-return-btn">Cancel</button>
        <button type="submit" class="submit-return-btn">Submit Return Request</button>
      </div>
    </form>
  `;

  // Clear modal content and add the form
  modalContent.innerHTML = returnForm;

  // Show the modal
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent scrolling

  // Add fade-in animation
  setTimeout(() => {
    modalContent.style.opacity = '1';
  }, 10);

  // Handle checkbox changes
  const checkboxes = modalContent.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener('change', function() {
      const reasonSelect = modalContent.querySelector(`select[name="reason_${index}"]`);
      const commentTextarea = modalContent.querySelector(`textarea[name="comment_${index}"]`);

      if (this.checked) {
        reasonSelect.disabled = false;
        commentTextarea.disabled = false;
      } else {
        reasonSelect.disabled = true;
        reasonSelect.value = '';
        commentTextarea.disabled = true;
        commentTextarea.value = '';
      }
    });
  });

  // Handle cancel button
  const cancelButton = modalContent.querySelector('.cancel-return-btn');
  cancelButton.addEventListener('click', closeModal);

  // Handle form submission
  const form = modalContent.querySelector('#returnForm');
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    let hasSelectedItems = false;
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        hasSelectedItems = true;
      }
    });

    if (!hasSelectedItems) {
      alert('Please select at least one item to return.');
      return;
    }

    // Simulate processing
    modalContent.innerHTML = `
      <div class="processing-return">
        <div class="loading-spinner"></div>
        <h3>Processing your return request...</h3>
      </div>
    `;

    setTimeout(() => {
      modalContent.innerHTML = `
        <div class="return-success">
          <div class="success-icon">✓</div>
          <h2>Return Request Submitted</h2>
          <p>Your return request for Order #${orderId} has been submitted successfully.</p>
          <p>You will receive an email with further instructions shortly.</p>
          <button class="close-return-btn">Close</button>
        </div>
      `;

      const closeReturnButton = modalContent.querySelector('.close-return-btn');
      closeReturnButton.addEventListener('click', function() {
        closeModal();
        simulateReturnOrder(orderCard);
      });
    }, 2000);
  });
}

// Simulate cancel order
function simulateCancelOrder(orderCard) {
  // Change order status in the UI
  const statusElement = orderCard.querySelector('.status-text');
  const statusIndicator = orderCard.querySelector('.order-status');

  // Remove existing status classes
  statusIndicator.className = 'order-status status-canceled';

  // Update status text
  statusElement.textContent = 'Canceled';

  // Update order card data attribute
  orderCard.setAttribute('data-status', 'canceled');
  orderCard.setAttribute('data-filter-category', 'canceled');

  // Update progress bar
  const progressBar = orderCard.querySelector('.order-progress-bar');
  progressBar.innerHTML = `
    <div class="canceled-status">
      <div class="step-icon"><i class="fas fa-times-circle"></i></div>
      <div class="step-label">Canceled</div>
    </div>
  `;

  // Remove action buttons
  const cancelBtn = orderCard.querySelector('.cancel-btn');
  if (cancelBtn) {
    cancelBtn.remove();
  }

  // Add a small notification
  const notification = document.createElement('div');
  notification.className = 'status-notification';
  notification.textContent = 'Order canceled successfully';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Simulate return order
function simulateReturnOrder(orderCard) {
  // Change order status in the UI
  const statusElement = orderCard.querySelector('.status-text');
  const statusIndicator = orderCard.querySelector('.order-status');

  // Remove existing status classes
  statusIndicator.className = 'order-status status-return_requested';

  // Update status text
  statusElement.textContent = 'Return Requested';

  // Update order card data attribute
  orderCard.setAttribute('data-status', 'return_requested');
  orderCard.setAttribute('data-filter-category', 'returned');

  // Update progress bar
  const progressBar = orderCard.querySelector('.order-progress-bar');
  progressBar.innerHTML = `
    <div class="return-progress">
      <div class="progress-step active">
        <div class="step-icon"><i class="fas fa-undo"></i></div>
        <div class="step-label">Return Requested</div>
      </div>
      <div class="progress-step">
        <div class="step-icon"><i class="fas fa-box"></i></div>
        <div class="step-label">Returned</div>
      </div>
      <div class="progress-step">
        <div class="step-icon"><i class="fas fa-money-bill"></i></div>
        <div class="step-label">Refunded</div>
      </div>
    </div>
  `;

  // Remove return button
  const returnBtn = orderCard.querySelector('.return-btn');
  if (returnBtn) {
    returnBtn.remove();
  }

  // Add a small notification
  const notification = document.createElement('div');
  notification.className = 'status-notification';
  notification.textContent = 'Return request submitted successfully';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
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

// Add status-notification CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .status-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #20c997;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
  }
  
  .status-notification.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .return-form {
    max-height: 70vh;
    overflow-y: auto;
    padding: 1rem 0;
  }
  
  .return-item {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #e9ecef;
    border-radius: 4px;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }
  
  .return-item-details {
    margin-left: 0.5rem;
  }
  
  .return-reason-container {
    margin-top: 0.5rem;
    margin-left: 1.5rem;
  }
  
  .return-reason, .return-comment {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    border: 1px solid #e9ecef;
    border-radius: 4px;
  }
  
  .return-comment {
    height: 80px;
    resize: none;
  }
  
  .return-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .cancel-return-btn, .submit-return-btn, .close-return-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
  }
  
  .cancel-return-btn {
    background-color: #f8f9fa;
    color: #6c757d;
    border: 1px solid #e9ecef;
  }
  
  .submit-return-btn {
    background-color: #3d5af1;
    color: white;
    border: none;
  }
  
  .close-return-btn {
    background-color: #3d5af1;
    color: white;
    border: none;
  }
  
  .processing-return, .return-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }
  
  .loading-spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #3d5af1;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    background-color: #20c997;
    color: white;
    border-radius: 50%;
    font-size: 24px;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (prefers-color-scheme: dark) {
    .return-item {
      border-color: #3a3f53;
    }
    
    .return-reason, .return-comment {
      background-color: #2a2d3a;
      border-color: #3a3f53;
      color: #f8f9fa;
    }
    
    .cancel-return-btn {
      background-color: #3a3f53;
      border-color: #4a5169;
      color: #f8f9fa;
    }
  }
`;
document.head.appendChild(styleSheet);