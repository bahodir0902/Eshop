// Admin Product Management JavaScript

document.addEventListener('DOMContentLoaded', function () {
  // Select All Functionality
  const selectAllCheckbox = document.getElementById('selectAll');
  const productCheckboxes = document.querySelectorAll('.product-select');
  const selectedCount = document.querySelector('.selected-count');
  const bulkButtons = document.querySelectorAll('.bulk-btn');

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function () {
      productCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
      updateSelectedCount();
    });
  }

  productCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      updateSelectedCount();

      // Check if all are selected and update the "select all" checkbox
      if (document.querySelectorAll('.product-select:checked').length === productCheckboxes.length) {
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.checked = false;
      }
    });
  });

  function updateSelectedCount() {
    const selectedProducts = document.querySelectorAll('.product-select:checked');
    selectedCount.textContent = `${selectedProducts.length} items selected`;

    // Enable/disable bulk action buttons
    if (selectedProducts.length > 0) {
      bulkButtons.forEach(btn => {
        btn.classList.remove('disabled');
      });
    } else {
      bulkButtons.forEach(btn => {
        btn.classList.add('disabled');
      });
    }
  }

  // Filter and Search Functionality
  const productSearch = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const sortOrder = document.getElementById('sortOrder');
  const resetFilters = document.getElementById('resetFilters');

  if (productSearch) {
    productSearch.addEventListener('input', function () {
      filterProducts();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', function () {
      filterProducts();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', function () {
      filterProducts();
    });
  }

  if (sortOrder) {
    sortOrder.addEventListener('change', function () {
      sortProducts();
    });
  }

  if (resetFilters) {
    resetFilters.addEventListener('click', function () {
      // Reset all filters
      if (productSearch) productSearch.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (sortOrder) sortOrder.value = 'newest';

      // Show all products
      document.querySelectorAll('.product-table tbody tr').forEach(row => {
        if (!row.classList.contains('empty-row')) {
          row.style.display = '';
        }
      });

      updateEmptyState();
    });
  }

  function filterProducts() {
    const searchTerm = productSearch ? productSearch.value.toLowerCase() : '';
    const category = categoryFilter ? categoryFilter.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value.toLowerCase() : '';

    document.querySelectorAll('.product-table tbody tr').forEach(row => {
      if (row.classList.contains('empty-row')) return;

      const productName = row.querySelector('.product-name').textContent.toLowerCase();
      const productDescription = row.querySelector('.product-description').textContent.toLowerCase();
      const productCategory = row.querySelector('td:nth-child(7)').textContent.toLowerCase();
      const productStatus = row.querySelector('.status-badge').textContent.toLowerCase();

      const matchesSearch = searchTerm === '' ||
        productName.includes(searchTerm) ||
        productDescription.includes(searchTerm);

      const matchesCategory = category === '' || productCategory === category;
      const matchesStatus = status === '' || productStatus === status;

      if (matchesSearch && matchesCategory && matchesStatus) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    updateEmptyState();
  }

  function sortProducts() {
    if (!sortOrder) return;

    const tbody = document.querySelector('.product-table tbody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.empty-row)'));

    // Remove all non-empty rows
    rows.forEach(row => {
      tbody.removeChild(row);
    });

    // Sort rows based on selected sort option
    const sortMethod = sortOrder.value;

    rows.sort((a, b) => {
      switch (sortMethod) {
        case 'name_asc':
          const nameA = a.querySelector('.product-name').textContent.trim();
          const nameB = b.querySelector('.product-name').textContent.trim();
          return nameA.localeCompare(nameB);

        case 'price_high':
          const priceA = parseFloat(a.querySelector('td:nth-child(5)').textContent.replace('$', ''));
          const priceB = parseFloat(b.querySelector('td:nth-child(5)').textContent.replace('$', ''));
          return priceB - priceA;

        case 'price_low':
          const priceLowA = parseFloat(a.querySelector('td:nth-child(5)').textContent.replace('$', ''));
          const priceLowB = parseFloat(b.querySelector('td:nth-child(5)').textContent.replace('$', ''));
          return priceLowA - priceLowB;

        case 'newest':
        default:
          // Assuming the date is in the format "MMM DD, YYYY"
          const dateA = new Date(a.querySelector('td:nth-child(9)').textContent);
          const dateB = new Date(b.querySelector('td:nth-child(9)').textContent);
          return dateB - dateA;
      }
    });

    // Re-add sorted rows
    const emptyRow = tbody.querySelector('.empty-row');
    if (emptyRow) {
      tbody.removeChild(emptyRow);
    }

    rows.forEach(row => {
      tbody.appendChild(row);
    });

    // Re-add empty row if needed
    if (emptyRow) {
      tbody.appendChild(emptyRow);
    }

    updateEmptyState();
  }

  function updateEmptyState() {
    const tbody = document.querySelector('.product-table tbody');
    const visibleRows = tbody.querySelectorAll('tr:not(.empty-row):not([style*="display: none"])');
    const emptyRow = tbody.querySelector('.empty-row');

    if (visibleRows.length === 0) {
      // No visible products after filtering
      if (!emptyRow) {
        const newEmptyRow = document.createElement('tr');
        newEmptyRow.className = 'empty-row';
        newEmptyRow.innerHTML = `
          <td colspan="10">
            <div class="empty-state">
              <i class="fa fa-filter empty-icon"></i>
              <h3>No Matching Products</h3>
              <p>Try adjusting your filters or search terms.</p>
              <button class="btn-primary" id="resetFiltersEmpty">
                <i class="fa fa-refresh"></i> Reset Filters
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(newEmptyRow);

        document.getElementById('resetFiltersEmpty').addEventListener('click', function () {
          resetFilters.click();
        });
      } else {
        emptyRow.style.display = '';
      }
    } else if (emptyRow) {
      emptyRow.style.display = 'none';
    }
  }

  // Delete Product Functionality
  const deleteButtons = document.querySelectorAll('.delete-product');
  const deleteModal = document.getElementById('deleteModal');
  const closeModal = document.querySelector('.close-modal');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');
  let productToDelete = null;

  deleteButtons.forEach(button => {
    button.addEventListener('click', function () {
      productToDelete = this.getAttribute('data-id');
      if (deleteModal) {
        deleteModal.style.display = 'block';
      }
    });
  });

  // Close modal when clicking on the close button or cancel button
  if (closeModal) {
    closeModal.addEventListener('click', closeDeleteModal);
  }

  if (cancelDelete) {
    cancelDelete.addEventListener('click', closeDeleteModal);
  }

  // Confirm deletion
  if (confirmDelete) {
    confirmDelete.addEventListener('click', function () {
      if (productToDelete) {
        // Optional: Send an AJAX request here to delete the product on the server.
        // For demonstration, remove the product row from the table.
        const productCheckbox = document.querySelector(`.product-select[data-id="${productToDelete}"]`);
        if (productCheckbox) {
          const productRow = productCheckbox.closest('tr');
          if (productRow) {
            productRow.remove();
          }
        }
        // Update selection count and check for empty state
        updateSelectedCount();
        updateEmptyState();
        productToDelete = null;
        closeDeleteModal();
      }
    });
  }

  function closeDeleteModal() {
    if (deleteModal) {
      deleteModal.style.display = 'none';
    }
    productToDelete = null;
  }

  // Close the modal if clicking outside of the modal content
  window.addEventListener('click', function (event) {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });
});