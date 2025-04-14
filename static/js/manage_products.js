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

    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('productSearch');

    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            if (!searchInput.value.trim()) {
                e.preventDefault();
            }
        });
    }

    // The reset button functionality
    const resetFilters = document.getElementById('resetFilters');
    if (resetFilters) {
        resetFilters.addEventListener('click', function () {
            // Clear ALL query parameters including search
            window.location.href = window.location.pathname;
        });
    }

    // Filter Functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortOrder = document.getElementById('sortOrder');
    const perPageSelect = document.getElementById('per_page');

    // Category filter change
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            let url = new URL(window.location.href);
            if (this.value) {
                url.searchParams.set('category', this.value);
            } else {
                url.searchParams.delete('category');
            }
            window.location.href = url.toString();
        });
    }

    // Status filter change
    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            let url = new URL(window.location.href);
            if (this.value) {
                url.searchParams.set('status', this.value);
            } else {
                url.searchParams.delete('status');
            }
            window.location.href = url.toString();
        });
    }

    // Sort order change
    if (sortOrder) {
        sortOrder.addEventListener('change', function () {
            let url = new URL(window.location.href);
            if (this.value) {
                url.searchParams.set('sort', this.value);
            } else {
                url.searchParams.delete('sort');
            }
            window.location.href = url.toString();
        });
    }

    // Per page change
    if (perPageSelect) {
        perPageSelect.addEventListener('change', function () {
            let url = new URL(window.location.href);
            if (this.value) {
                url.searchParams.set('per_page', this.value);
            } else {
                url.searchParams.delete('per_page');
            }
            window.location.href = url.toString();
        });
    }

    // Delete Product Functionality
    const deleteButtons = document.querySelectorAll('.actions-cell .fa-trash');
    const deleteModal = document.getElementById('deleteModal');
    const closeModal = document.querySelector('.close-modal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    let deleteUrl = null;

    deleteButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const deleteLink = this.closest('a');
            deleteUrl = deleteLink.getAttribute('href');

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
            if (deleteUrl) {
                window.location.href = deleteUrl;
            }
        });
    }

    function closeDeleteModal() {
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }
        deleteUrl = null;
    }

    // Close the modal if clicking outside of the modal content
    window.addEventListener('click', function (event) {
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });
});