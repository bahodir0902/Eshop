document.addEventListener('DOMContentLoaded', function() {
    // Update shipping cost based on delivery option selection
    const deliveryOptions = document.querySelectorAll('input[name="delivery_option"]');
    const shippingCostElement = document.getElementById('shipping-cost');

    deliveryOptions.forEach(option => {
        option.addEventListener('change', function() {
            let shippingCost = '5.99';

            if (this.value === 'express') {
                shippingCost = '12.99';
            } else if (this.value === 'next_day') {
                shippingCost = '19.99';
            }

            shippingCostElement.textContent = '$' + shippingCost;
            updateTotals();
        });
    });

    // Calculate initial totals
    calculateOrderSummary();

    // Toggle order summary on mobile
    const summaryToggle = document.querySelector('.summary-toggle');
    const summaryContent = document.querySelector('.summary-content');

    if (summaryToggle && summaryContent) {
        summaryToggle.addEventListener('click', function() {
            summaryContent.classList.toggle('collapsed');
            this.querySelector('i').classList.toggle('fa-chevron-down');
            this.querySelector('i').classList.toggle('fa-chevron-up');
        });
    }

    // Form validation
   const addressForm = document.getElementById('address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', function(e) {
            // Check all required fields
            const requiredFields = addressForm.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('invalid'); // Optional: for styling
                } else {
                    field.classList.remove('invalid');
                }
            });

            // Prevent submission only if validation fails
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
            // If valid, do nothing here; let the form submit naturally to the server
        });
    }

    // Calculate order summary totals
    function calculateOrderSummary() {
        // const subtotal = calculateSubtotal();
        // document.getElementById('subtotal').textContent = subtotal.toFixed(2);

        updateTotals();
    }

    function updateTotals() {
        const subtotalValue = parseFloat(document.getElementById('subtotal').textContent);
        const shippingValue = parseFloat(shippingCostElement.textContent.replace('$', ''));

        // Get any discount applied
        let discountValue = 0;
        const discountElement = document.getElementById('discount-amount');
        if (discountElement) {
            discountValue = parseFloat(discountElement.textContent.replace('$', ''));
        }

        // Calculate total
        const total = subtotalValue + shippingValue + discountValue;
        document.getElementById('total').textContent = total.toFixed(2);
    }

    function addDiscountRow(label, amount) {
        // Check if discount row already exists
        let discountRow = document.querySelector('.discount-amount-row');

        if (!discountRow) {
            // Create new discount row
            discountRow = document.createElement('div');
            discountRow.className = 'summary-row discount-amount-row';

            const labelSpan = document.createElement('span');
            labelSpan.textContent = label;

            const amountSpan = document.createElement('span');
            amountSpan.id = 'discount-amount';
            amountSpan.textContent = '$' + amount.toFixed(2);

            discountRow.appendChild(labelSpan);
            discountRow.appendChild(amountSpan);

            // Insert before the divider
            const divider = document.querySelector('.summary-divider:last-of-type');
            divider.before(discountRow);
        } else {
            // Update existing discount row
            const amountSpan = discountRow.querySelector('#discount-amount');
            amountSpan.textContent = '$' + amount.toFixed(2);
        }
    }
});