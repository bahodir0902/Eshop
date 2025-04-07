document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const paymentForm = document.getElementById('payment-form');
    const cardNameInput = document.getElementById('id_card_name');
    const cardNumberInput = document.getElementById('id_card_number');
    const expiryDateInput = document.getElementById('id_expiry_date');
    const cvvInput = document.getElementById('id_cvv');
    const cardTypeIcon = document.querySelector('.card-type-icon i');

    // Auto-focus the card name input field
    if (cardNameInput) {
        setTimeout(() => {
            cardNameInput.focus();
        }, 500);
    }

    // Function to update inline error messages (if any)
    function showFieldErrors(errors) {
        // errors is expected to be an object with keys matching the field names
        // For example: { card_name: "Error message...", card_number: "Error message...", ... }
        for (const field in errors) {
            const errorSpan = document.getElementById('error_' + field);
            if (errorSpan) {
                errorSpan.textContent = errors[field];
                // Also add a class to highlight the input
                const inputField = document.getElementById('id_' + field);
                if (inputField) {
                    inputField.classList.add('invalid');
                }
            }
        }
    }

    // If Django passed field errors, read and display them
    const fieldErrorsScript = document.getElementById('fieldErrors');
    if (fieldErrorsScript) {
        try {
            const fieldErrors = JSON.parse(fieldErrorsScript.textContent);
            showFieldErrors(fieldErrors);
        } catch (err) {
            console.error("Error parsing field errors", err);
        }
    }

    // Format and update card number input and update the card icon
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, ''); // remove non-digits
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' '); // add spaces every 4 digits
            }
            this.value = value.substring(0, 19); // limit to 19 characters (16 digits + 3 spaces)
            updateCardTypeIcon(value);
        });
    }

    function updateCardTypeIcon(cardNumber) {
        cardTypeIcon.className = ''; // reset classes
        if (cardNumber.startsWith('4')) {
            cardTypeIcon.classList.add('fab', 'fa-cc-visa');
        } else if (cardNumber.startsWith('5')) {
            cardTypeIcon.classList.add('fab', 'fa-cc-mastercard');
        } else if (cardNumber.startsWith('3')) {
            cardTypeIcon.classList.add('fab', 'fa-cc-amex');
        } else {
            cardTypeIcon.classList.add('fab', 'fa-credit-card');
        }
    }

    // Format expiry date input as MM/YY
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            this.value = value.substring(0, 5);
        });
    }

    // Limit CVV input to 3 or 4 digits
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').substring(0, 4);
        });
    }

    // Form submission: perform client-side validation before normal form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            // Clear any previous inline error messages
            document.querySelectorAll('.error-message').forEach(span => span.textContent = '');
            document.querySelectorAll('input').forEach(input => input.classList.remove('invalid'));

            let isValid = true;
            // Check that required fields are not empty
            const requiredFields = paymentForm.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('invalid');
                    const errorSpan = document.getElementById('error_' + field.name);
                    if (errorSpan) {
                        errorSpan.textContent = 'This field is required';
                    }
                }
            });

            // Validate card number length (should be 15 or 16 digits without spaces)
            const cardNumber = cardNumberInput.value.replace(/\s/g, '');
            if (cardNumber.length < 15 || cardNumber.length > 16) {
                isValid = false;
                cardNumberInput.classList.add('invalid');
                const errorSpan = document.getElementById('error_card_number');
                if (errorSpan) {
                    errorSpan.textContent = "Card number's length is not valid";
                }
            }

            // Validate expiry date format and ensure the card is not expired
            const expiryDate = expiryDateInput.value;
            if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
                isValid = false;
                expiryDateInput.classList.add('invalid');
                const errorSpan = document.getElementById('error_expiry_date');
                if (errorSpan) {
                    errorSpan.textContent = "Expiry date must be in MM/YY format";
                }
            } else {
                const [month, year] = expiryDate.split('/');
                const expiryMonth = parseInt(month, 10);
                const expiryYear = parseInt('20' + year, 10);
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();
                if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
                    isValid = false;
                    expiryDateInput.classList.add('invalid');
                    const errorSpan = document.getElementById('error_expiry_date');
                    if (errorSpan) {
                        errorSpan.textContent = "The card has expired";
                    }
                }
            }

            // Validate CVV (3 or 4 digits)
            const cvv = cvvInput.value;
            if (!/^\d{3,4}$/.test(cvv)) {
                isValid = false;
                cvvInput.classList.add('invalid');
                const errorSpan = document.getElementById('error_cvv');
                if (errorSpan) {
                    errorSpan.textContent = "CVV must be 3 or 4 digits";
                }
            }

            if (!isValid) {
                e.preventDefault();
                alert('Please fix the errors in the form before submitting.');
            }
            // If valid, the form submits normally (sending a POST request to Django)
        });
    }

    // Toggle order summary on mobile devices
    const summaryToggle = document.querySelector('.summary-toggle');
    const summaryContent = document.querySelector('.summary-content');
    if (summaryToggle && summaryContent) {
        summaryToggle.addEventListener('click', function() {
            summaryContent.classList.toggle('collapsed');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });
    }

    // CVV tooltip hover behavior
    const cvvTooltip = document.querySelector('.cvv-tooltip');
    if (cvvTooltip) {
        cvvTooltip.addEventListener('mouseover', function() {
            this.style.opacity = 1;
        });
        cvvTooltip.addEventListener('mouseout', function() {
            this.style.opacity = 0.7;
        });
    }
});

// document.addEventListener('DOMContentLoaded', function() {
//     // Initialize the page with existing order summary data
//     // calculateOrderSummary();
//
//     // Handle payment method selection
//     const paymentMethods = document.querySelectorAll('input[name="payment_method"]');
//     const creditCardForm = document.getElementById('credit-card-form');
//
//     paymentMethods.forEach(method => {
//         method.addEventListener('change', function() {
//             if (this.value === 'credit_card') {
//                 creditCardForm.style.display = 'block';
//                 creditCardForm.querySelectorAll('input').forEach(input => {
//                     input.setAttribute('required', '');
//                 });
//             } else {
//                 creditCardForm.style.display = 'none';
//                 creditCardForm.querySelectorAll('input').forEach(input => {
//                     input.removeAttribute('required');
//                 });
//             }
//         });
//     });
//
//     // Handle "same as shipping address" checkbox
//     const sameAddressCheckbox = document.getElementById('id_same_address');
//     const billingAddressForm = document.getElementById('billing-address-form');
//
//     if (sameAddressCheckbox && billingAddressForm) {
//         sameAddressCheckbox.addEventListener('change', function() {
//             if (this.checked) {
//                 billingAddressForm.style.display = 'none';
//                 billingAddressForm.querySelectorAll('input, select').forEach(input => {
//                     input.removeAttribute('required');
//                 });
//             } else {
//                 billingAddressForm.style.display = 'block';
//                 const requiredFields = billingAddressForm.querySelectorAll('input:not([id$="address_line_2"])');
//                 requiredFields.forEach(input => {
//                     input.setAttribute('required', '');
//                 });
//             }
//         });
//     }
//
//     // Credit card formatting
//     const cardNumberInput = document.getElementById('id_card_number');
//     const expiryDateInput = document.getElementById('id_expiry_date');
//     const cvvInput = document.getElementById('id_cvv');
//     const cardTypeIcon = document.querySelector('.card-type-icon i');
//
//     if (cardNumberInput) {
//         cardNumberInput.addEventListener('input', function(e) {
//             // Remove non-digits
//             let value = this.value.replace(/\D/g, '');
//
//             // Add spaces after every 4 digits
//             if (value.length > 0) {
//                 value = value.match(/.{1,4}/g).join(' ');
//             }
//
//             // Limit to 19 characters (16 digits + 3 spaces)
//             this.value = value.substring(0, 19);
//
//             // Update card type icon based on first digits
//             updateCardTypeIcon(this.value.replace(/\D/g, ''));
//         });
//     }
//
//     // Update card type icon based on first digits
//     function updateCardTypeIcon(cardNumber) {
//         // Remove all existing card type classes
//         cardTypeIcon.className = '';
//
//         // Add the appropriate card type class
//         if (cardNumber.startsWith('4')) {
//             cardTypeIcon.classList.add('fab', 'fa-cc-visa');
//         } else if (cardNumber.startsWith('5')) {
//             cardTypeIcon.classList.add('fab', 'fa-cc-mastercard');
//         } else if (cardNumber.startsWith('3')) {
//             cardTypeIcon.classList.add('fab', 'fa-cc-amex');
//         } else {
//             cardTypeIcon.classList.add('fab', 'fa-credit-card');
//         }
//     }
//
//     if (expiryDateInput) {
//         expiryDateInput.addEventListener('input', function(e) {
//             // Remove non-digits
//             let value = this.value.replace(/\D/g, '');
//
//             // Format as MM/YY
//             if (value.length > 2) {
//                 value = value.substring(0, 2) + '/' + value.substring(2, 4);
//             }
//
//             this.value = value.substring(0, 5);
//         });
//     }
//
//     if (cvvInput) {
//         cvvInput.addEventListener('input', function(e) {
//             // Remove non-digits and limit to 4 characters (for Amex)
//             this.value = this.value.replace(/\D/g, '').substring(0, 4);
//         });
//     }
//
//     // Form validation
//     const paymentForm = document.getElementById('payment-form');
//     if (paymentForm) {
//         paymentForm.addEventListener('submit', function(e) {
//             e.preventDefault();
//
//             // Simple validation
//             const requiredFields = paymentForm.querySelectorAll('[required]');
//             let isValid = true;
//
//             requiredFields.forEach(field => {
//                 if (!field.value.trim()) {
//                     isValid = false;
//                     field.classList.add('invalid');
//                 } else {
//                     field.classList.remove('invalid');
//                 }
//             });
//
//             // Additional validation for credit card fields
//             if (document.querySelector('input[name="payment_method"]:checked').value === 'credit_card') {
//                 // Validate card number (simple length check)
//                 const cardNumber = cardNumberInput.value.replace(/\s/g, '');
//                 if (cardNumber.length < 15 || cardNumber.length > 16) {
//                     isValid = false;
//                     cardNumberInput.classList.add('invalid');
//                 }
//
//                 // Validate expiry date format (MM/YY)
//                 const expiryDate = expiryDateInput.value;
//                 if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
//                     isValid = false;
//                     expiryDateInput.classList.add('invalid');
//                 } else {
//                     // Check if expired
//                     const [month, year] = expiryDate.split('/');
//                     const expiryMonth = parseInt(month, 10);
//                     const expiryYear = parseInt('20' + year, 10);
//
//                     const now = new Date();
//                     const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
//                     const currentYear = now.getFullYear();
//
//                     if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
//                         isValid = false;
//                         expiryDateInput.classList.add('invalid');
//                     }
//                 }
//
//                 // Validate CVV (3-4 digits)
//                 const cvv = cvvInput.value;
//                 if (!/^\d{3,4}$/.test(cvv)) {
//                     isValid = false;
//                     cvvInput.classList.add('invalid');
//                 }
//             }
//
//             if (isValid) {
//                 // In a real implementation, you would process payment here
//                 // For demo, we'll just redirect to confirmation page
//                 window.location.href = '/checkout/confirmation/';
//             } else {
//                 // Show error message
//                 alert('Please fill in all required fields correctly.');
//             }
//         });
//     }
//
//     // Toggle order summary on mobile
//     const summaryToggle = document.querySelector('.summary-toggle');
//     const summaryContent = document.querySelector('.summary-content');
//
//     if (summaryToggle && summaryContent) {
//         summaryToggle.addEventListener('click', function() {
//             summaryContent.classList.toggle('collapsed');
//             this.querySelector('i').classList.toggle('fa-chevron-down');
//             this.querySelector('i').classList.toggle('fa-chevron-up');
//         });
//     }
//
//     // Show helpful tooltips
//     const cvvTooltip = document.querySelector('.cvv-tooltip');
//     if (cvvTooltip) {
//         cvvTooltip.addEventListener('mouseover', function() {
//             this.style.opacity = 1;
//         });
//
//         cvvTooltip.addEventListener('mouseout', function() {
//             this.style.opacity = 0.7;
//         });
//     }
//
//     // Auto-focus first input field in credit card form
//     const cardNameInput = document.getElementById('id_card_name');
//     if (cardNameInput) {
//         setTimeout(() => {
//             cardNameInput.focus();
//         }, 500);
//     }
// });