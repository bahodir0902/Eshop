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

    // Filter Functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortOrder = document.getElementById('sortOrder');
    const resetFilters = document.getElementById('resetFilters');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            redirectWithFilter();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            redirectWithFilter();
        });
    }

    if (sortOrder) {
        sortOrder.addEventListener('change', function () {
            redirectWithFilter();
        });
    }

    function redirectWithFilter() {
        let url = new URL(window.location.href);

        // Update category filter
        if (categoryFilter && categoryFilter.value) {
            url.searchParams.set('category', categoryFilter.value);
        } else {
            url.searchParams.delete('category');
        }

        // Update status filter
        if (statusFilter && statusFilter.value) {
            url.searchParams.set('status', statusFilter.value);
        } else {
            url.searchParams.delete('status');
        }

        // Update sort order
        if (sortOrder && sortOrder.value) {
            url.searchParams.set('sort', sortOrder.value);
        } else {
            url.searchParams.delete('sort');
        }

        window.location.href = url.toString();
    }

    if (resetFilters) {
        resetFilters.addEventListener('click', function () {
            let url = new URL(window.location.href);
            url.search = ''; // Clear all query parameters
            window.location.href = url.toString();
        });
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