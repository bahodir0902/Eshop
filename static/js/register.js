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

// v3
document.addEventListener('DOMContentLoaded', function () {
    // Form elements
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const registerForm = document.getElementById('register-form');
    const submitDetailsBtn = document.getElementById('submit-details-btn');
    const resendCodeBtn = document.getElementById('resend-code');
    const resendTimer = document.getElementById('resend-timer');
    const completeRegisterBtn = document.querySelector('.register-btn');
    const verificationDigits = document.querySelectorAll('.verification-digit');

    // Function to update the active step
    function updateStep(currentStep, nextStep) {
        formSteps.forEach(step => step.classList.remove('active'));
        const nextFormStep = document.querySelector(`.form-step[data-step="${nextStep}"]`);
        if (nextFormStep) nextFormStep.classList.add('active');

        steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            if (stepNum === nextStep) step.classList.add('active');
            else if (stepNum < nextStep) step.classList.add('completed');
        });

        const progressPercentage = ((nextStep - 1) / (steps.length - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        if (nextStep === 3) updateConfirmationData();
        if (nextStep === 4) setTimeout(() => document.querySelector('.verification-digit').focus(), 300);
    }

    // Step validation function
    function validateStep(step) {
        clearFieldErrors();
        let isValid = true;
        let errorMessage = '';

        if (step === 1) {
            const firstName = document.getElementById('id_first_name').value.trim();
            const lastName = document.getElementById('id_last_name').value.trim();
            if (!firstName || !lastName) {
                isValid = false;
                errorMessage = 'Please fill in both first and last name.';
                if (!firstName) showFieldError(document.getElementById('id_first_name'), 'First name is required.');
                if (!lastName) showFieldError(document.getElementById('id_last_name'), 'Last name is required.');
            }
        } else if (step === 2) {
            const email = document.getElementById('id_email').value.trim();
            const password = document.getElementById('id_password').value;
            const rePassword = document.getElementById('id_re_password').value;
            if (!email) {
                isValid = false;
                errorMessage = 'Please enter an email address.';
                showFieldError(document.getElementById('id_email'), 'Email is required.');
            }
            if (!password || !rePassword || password !== rePassword) {
                isValid = false;
                errorMessage = 'Passwords must match and cannot be empty.';
                if (!password) showFieldError(document.getElementById('id_password'), 'Password is required.');
                if (!rePassword) showFieldError(document.getElementById('id_re_password'), 'Please confirm your password.');
                else if (password !== rePassword) showFieldError(document.getElementById('id_re_password'), 'Passwords do not match.');
            }
        }
        // Step 3 validation is handled by the submit button's AJAX request

        if (!isValid) showErrorMessage(errorMessage);
        return isValid;
    }

    // Next buttons event listener (exclude submit-details-btn)
    nextButtons.forEach(button => {
        if (button.id !== 'submit-details-btn') { // Skip the Submit Details button
            button.addEventListener('click', function () {
                const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
                const nextStep = parseInt(this.getAttribute('data-next'));
                if (validateStep(currentStep)) {
                    updateStep(currentStep, nextStep);
                }
            });
        }
    });

    // Back buttons event listener
    backButtons.forEach(button => {
        button.addEventListener('click', function () {
            const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
            const prevStep = parseInt(this.getAttribute('data-back'));
            updateStep(currentStep, prevStep);
        });
    });

    // Real-time password matching feedback
    const passwordField = document.getElementById('id_password');
    const rePasswordField = document.getElementById('id_re_password');

    function checkPasswordsMatch() {
        clearFieldErrors(rePasswordField);
        if (passwordField.value && rePasswordField.value && passwordField.value !== rePasswordField.value) {
            showFieldError(rePasswordField, 'Passwords do not match.');
        }
    }

    passwordField.addEventListener('input', checkPasswordsMatch);
    rePasswordField.addEventListener('input', checkPasswordsMatch);

    // Submit details button (Step 3)
    if (submitDetailsBtn) {
        submitDetailsBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            clearFieldErrors();

            const originalButtonHtml = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            this.disabled = true;

            try {
                const formData = new FormData(registerForm);
                const csrftoken = getCookie('csrftoken');
                const response = await fetch(ensureLanguagePrefix('/accounts/register/'), {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });

                const data = await response.json();
                console.log("Server response:", data);

                if (data.success === true) {
                    const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
                    const nextStep = parseInt(this.getAttribute('data-next'));
                    showSuccessMessage('Verification code sent to your email!');
                    startResendTimer();
                    updateStep(currentStep, nextStep);
                } else {
                    let errorMessages = [];
                    if (data.errors) {
                        Object.entries(data.errors).forEach(([field, errors]) => {
                            const fieldId = `id_${field}`;
                            const fieldElement = document.getElementById(fieldId);
                            const errorMsg = Array.isArray(errors) ? errors[0] : errors;
                            errorMessages.push(`${field}: ${errorMsg}`);
                            if (fieldElement) showFieldError(fieldElement, errorMsg);
                        });
                        showErrorMessage(errorMessages[0] || 'Please correct the errors below.');
                    } else {
                        showErrorMessage('An unexpected error occurred.');
                    }
                }
            } catch (error) {
                console.error('Submission error:', error);
                showErrorMessage('A network error occurred. Please try again.');
            } finally {
                this.innerHTML = originalButtonHtml;
                this.disabled = false;
            }
        });
    }

    // Verification code input handling
    if (verificationDigits.length) {
        verificationDigits.forEach((digit, index) => {
            digit.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value.length === 1 && index < verificationDigits.length - 1) {
                    verificationDigits[index + 1].focus();
                }
            });
            digit.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                    verificationDigits[index - 1].focus();
                }
            });
            digit.addEventListener('paste', function (e) {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                if (/^\d+$/.test(pastedText)) {
                    for (let i = 0; i < verificationDigits.length && i < pastedText.length; i++) {
                        verificationDigits[i].value = pastedText[i];
                    }
                    for (let i = 0; i < verificationDigits.length; i++) {
                        if (verificationDigits[i].value === '') {
                            verificationDigits[i].focus();
                            break;
                        } else if (i === verificationDigits.length - 1) {
                            verificationDigits[i].focus();
                        }
                    }
                }
            });
        });
    }

    // Function to start resend timer
    function startResendTimer() {
        let seconds = 60;
        resendCodeBtn.disabled = true;
        resendCodeBtn.style.opacity = '0.5';
        const timerInterval = setInterval(() => {
            seconds--;
            resendTimer.textContent = `(${seconds}s)`;
            if (seconds <= 0) {
                clearInterval(timerInterval);
                resendTimer.textContent = '';
                resendCodeBtn.disabled = false;
                resendCodeBtn.style.opacity = '1';
            }
        }, 1000);
    }

    // Event listener for resend code button
    if (resendCodeBtn) {
        resendCodeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (this.disabled) return;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            setTimeout(() => {
                this.innerHTML = 'Resend Code';
                showSuccessMessage('A new verification code has been sent!');
                startResendTimer();
                if (verificationDigits.length) {
                    verificationDigits[0].focus();
                    verificationDigits.forEach(input => input.value = '');
                }
            }, 1500);
        });
    }

    // Verify code on submit (Step 4)
    if (completeRegisterBtn) {
        completeRegisterBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Collect verification code
            let verificationCode = '';
            verificationDigits.forEach(digit => {
                verificationCode += digit.value;
            });

            // Validate code length
            if (verificationCode.length !== 4) {
                showErrorMessage('Please enter the complete 4-digit verification code');
                return;
            }

            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            this.disabled = true;

            // Prepare verification data
            const formData = new URLSearchParams();
            formData.append('email', registerForm.email.value);
            formData.append('verification_code', verificationCode);
            const csrftoken = getCookie('csrftoken');

            // Send verification request
            fetch(ensureLanguagePrefix('/accounts/verify_email/'), {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrftoken,
                },
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showSuccessMessage('Verification successful! Redirecting to your account...');
                        setTimeout(() => {
                            window.location.href = data.redirect_url || '/dashboard/';
                        }, 2000);
                    } else {
                        showErrorMessage(data.error || 'Invalid verification code. Please try again.');
                        this.disabled = false;
                        this.innerHTML = '<span>Complete Registration</span><i class="fas fa-check"></i>';
                    }
                })
                .catch(error => {
                    console.error('Verification error:', error);
                    showErrorMessage('A network error occurred. Please try again.');
                    this.disabled = false;
                    this.innerHTML = '<span>Complete Registration</span><i class="fas fa-check"></i>';
                });
        });
    }

    // Helper functions
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function clearFieldErrors(element = null) {
        if (element) {
            element.classList.remove('error-border');
            const error = element.closest('.form-group')?.querySelector('.field-error');
            if (error) error.remove();
        } else {
            document.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));
            document.querySelectorAll('.field-error').forEach(el => el.remove());
            const generalError = document.querySelector('.error-message');
            if (generalError) generalError.remove();
        }
    }

    function showFieldError(field, message) {
        const plainMessage = message.replace(/<[^>]*>?/gm, '');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = plainMessage;
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        field.classList.add('error-border');
        field.style.borderColor = '#dc3545';
        field.closest('.form-group').appendChild(errorElement);
        field.scrollIntoView({behavior: 'smooth', block: 'center'});
    }

    function showErrorMessage(message) {
        const plainMessage = message.replace(/<[^>]*>?/gm, '');
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = plainMessage;
        errorElement.style.backgroundColor = '#f8d7da';
        errorElement.style.color = '#721c24';
        errorElement.style.padding = '10px';
        errorElement.style.margin = '10px 0';
        errorElement.style.borderRadius = '4px';
        document.querySelector('.form-header').after(errorElement);
    }

    function showSuccessMessage(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) existingMessage.remove();
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;
        document.querySelector('.form-header').after(successElement);
        setTimeout(() => {
            successElement.style.opacity = '0';
            setTimeout(() => successElement.remove(), 500);
        }, 5000);
    }

    // Update confirmation data for Step 3
    function updateConfirmationData() {
        const fields = [
            {input: 'first_name', confirm: 'first-name'},
            {input: 'last_name', confirm: 'last-name'},
            {input: 'email', confirm: 'email'}
        ];
        fields.forEach(({input, confirm}) => {
            const value = document.getElementById(`id_${input}`).value;
            const confirmElement = document.getElementById(`confirm-${confirm}`);
            if (confirmElement) {
                confirmElement.textContent = value || 'Not provided';
            }
        });
    }

    // Add this to your existing register.js file
    document.addEventListener('DOMContentLoaded', function () {
        // Google button enhancement
        const googleBtn = document.querySelector('.google-btn');

        if (googleBtn) {
            // Add subtle hover animation
            googleBtn.addEventListener('mouseenter', function () {
                this.classList.add('hover-effect');
            });

            googleBtn.addEventListener('mouseleave', function () {
                this.classList.remove('hover-effect');
            });

            // Add click effect
            googleBtn.addEventListener('click', function () {
                // Add a brief animation before redirecting
                this.classList.add('clicked');

                // Small delay for the animation to be visible
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 150);
            });

            // Make button initially emphasized after page load
            setTimeout(() => {
                googleBtn.classList.add('btn-emphasized');

                // Add a subtle animation to draw attention
                googleBtn.style.transition = 'all 0.5s ease';
                googleBtn.style.transform = 'translateY(-3px)';

                setTimeout(() => {
                    googleBtn.style.transform = 'translateY(0)';
                }, 300);
            }, 500);
        }
    });
});


// v2
// document.addEventListener('DOMContentLoaded', function () {
//     // Form steps navigation
//     const steps = document.querySelectorAll('.step');
//     const formSteps = document.querySelectorAll('.form-step');
//     const progressBar = document.querySelector('.progress');
//     const nextButtons = document.querySelectorAll('.next-btn');
//     const backButtons = document.querySelectorAll('.back-btn');
//     const registerForm = document.getElementById('register-form');
//     const submitDetailsBtn = document.getElementById('submit-details-btn');
//     const resendCodeBtn = document.getElementById('resend-code');
//     const resendTimer = document.getElementById('resend-timer');
//
//     // Function to update the active step
//     function updateStep(currentStep, nextStep) {
//         // Update form steps
//         formSteps.forEach(step => {
//             step.classList.remove('active');
//         });
//
//         const nextFormStep = document.querySelector(`.form-step[data-step="${nextStep}"]`);
//         if (nextFormStep) {
//             nextFormStep.classList.add('active');
//         }
//
//         // Update step indicators
//         steps.forEach(step => {
//             const stepNum = parseInt(step.getAttribute('data-step'));
//             step.classList.remove('active', 'completed');
//
//             if (stepNum === nextStep) {
//                 step.classList.add('active');
//             } else if (stepNum < nextStep) {
//                 step.classList.add('completed');
//             }
//         });
//
//         // Update progress bar
//         const progressPercentage = ((nextStep - 1) / (steps.length - 1)) * 100;
//         progressBar.style.width = `${progressPercentage}%`;
//
//         // Pre-fill confirmation data when moving to step 3
//         if (nextStep === 3) {
//             updateConfirmationData();
//         }
//
//         // Auto-focus first verification input when moving to step 4
//         if (nextStep === 4) {
//             setTimeout(() => {
//                 document.querySelector('.verification-digit').focus();
//             }, 300);
//         }
//     }
//
//     // Event listeners for next buttons
//     nextButtons.forEach(button => {
//         button.addEventListener('click', function () {
//             const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
//             const nextStep = parseInt(this.getAttribute('data-next'));
//
//             // Validate current step
//             if (validateStep(currentStep)) {
//                 updateStep(currentStep, nextStep);
//             }
//         });
//     });
//
//     // Event listeners for back buttons
//     backButtons.forEach(button => {
//         button.addEventListener('click', function () {
//             const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
//             const prevStep = parseInt(this.getAttribute('data-back'));
//             updateStep(currentStep, prevStep);
//         });
//     });
//
//     // Function to update confirmation data
//     function updateConfirmationData() {
//         const firstName = document.getElementById(registerForm.first_name.id).value;
//         const lastName = document.getElementById(registerForm.last_name.id).value;
//         const email = document.getElementById(registerForm.email.id).value;
//
//         document.getElementById('confirm-first-name').textContent = firstName;
//         document.getElementById('confirm-last-name').textContent = lastName;
//         document.getElementById('confirm-email').textContent = email;
//     }
//
//     function getCookie(name) {
//         let cookieValue = null;
//         if (document.cookie && document.cookie !== '') {
//             const cookies = document.cookie.split(';');
//             for (let i = 0; i < cookies.length; i++) {
//                 const cookie = cookies[i].trim();
//                 if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                     cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                     break;
//                 }
//             }
//         }
//         return cookieValue;
//     }
//
//     // Submit details button (Step 3) - Modified section
//     // Submit details button (Step 3) - Modified section
//     if (submitDetailsBtn) {
//         submitDetailsBtn.addEventListener('click', async function (e) {
//             e.preventDefault();
//
//             // Clear any existing errors
//             clearFieldErrors();
//
//             // Show loading state
//             const originalButtonHtml = this.innerHTML;
//             this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
//             this.disabled = true;
//
//             try {
//                 const form = document.getElementById('register-form');
//                 const formData = new FormData(form);
//                 const csrftoken = getCookie('csrftoken');
//
//                 const response = await fetch('/accounts/register/', {
//                     method: 'POST',
//                     headers: {
//                         'X-CSRFToken': csrftoken,
//                         'X-Requested-With': 'XMLHttpRequest'
//                     },
//                     body: formData
//                 });
//
//                 const data = await response.json();
//                 console.log("Server response:", data);
//
//                 // CRITICAL: Only proceed if success is explicitly true
//                 if (data.success === true) {
//                     const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
//                     const nextStep = parseInt(this.getAttribute('data-next'));
//
//                     showSuccessMessage('Verification code sent to your email!');
//                     startResendTimer();
//                     updateStep(currentStep, nextStep);
//                 } else {
//                     // Handle different error formats
//                     if (data.errors) {
//                         // Convert any HTML error format to plain text if needed
//                         let errorMessages = [];
//
//                         // Try to parse errors regardless of format
//                         Object.entries(data.errors).forEach(([field, errors]) => {
//                             const fieldId = `id_${field}`;
//                             const fieldElement = document.getElementById(fieldId);
//
//                             // Handle array of errors
//                             if (Array.isArray(errors)) {
//                                 const errorMsg = errors[0]; // Take first error
//                                 errorMessages.push(`${field}: ${errorMsg}`);
//                                 if (fieldElement) {
//                                     showFieldError(fieldElement, errorMsg);
//                                 }
//                             }
//                             // Handle nested error objects
//                             else if (typeof errors === 'object') {
//                                 const errorMsg = errors[0] || Object.values(errors)[0];
//                                 errorMessages.push(`${field}: ${errorMsg}`);
//                                 if (fieldElement) {
//                                     showFieldError(fieldElement, errorMsg);
//                                 }
//                             }
//                             // Handle string errors
//                             else if (typeof errors === 'string') {
//                                 errorMessages.push(`${field}: ${errors}`);
//                                 if (fieldElement) {
//                                     showFieldError(fieldElement, errors);
//                                 }
//                             }
//                         });
//
//                         // Show first error as main message
//                         if (errorMessages.length > 0) {
//                             showErrorMessage(errorMessages[0]);
//                         } else {
//                             showErrorMessage("Please correct the errors below and try again.");
//                         }
//                     } else if (data.error) {
//                         showErrorMessage(data.error);
//                     } else {
//                         showErrorMessage("An error occurred during submission.");
//                     }
//
//                     console.log("Validation failed - staying on current step");
//                 }
//             } catch (error) {
//                 console.error('Error during form submission:', error);
//                 showErrorMessage('A network error occurred. Please try again.');
//             } finally {
//                 // Always restore button state
//                 this.innerHTML = originalButtonHtml;
//                 this.disabled = false;
//             }
//         });
//     }
//
// // New helper functions
//     function clearFieldErrors() {
//         console.log("Clearing all field errors");
//         // Remove error messages
//         document.querySelectorAll('.field-error').forEach(error => error.remove());
//
//         // Remove error styling from inputs
//         document.querySelectorAll('.error-border').forEach(input => {
//             input.classList.remove('error-border');
//         });
//
//         // Remove general error message
//         const existingError = document.querySelector('.error-message');
//         if (existingError) existingError.remove();
//     }
//
//     function showFieldError(field, message) {
//         // Strip HTML tags if present in the error message
//         const plainMessage = message.replace(/<[^>]*>?/gm, '');
//
//         const errorElement = document.createElement('div');
//         errorElement.className = 'field-error';
//         errorElement.textContent = plainMessage;
//         errorElement.style.color = '#dc3545';
//         errorElement.style.fontSize = '0.875rem';
//         errorElement.style.marginTop = '0.25rem';
//
//         // Add error styling
//         field.classList.add('error-border');
//         field.style.borderColor = '#dc3545';
//
//         // Add error message below the field
//         field.closest('.form-group').appendChild(errorElement);
//
//         // Scroll to the error field
//         field.scrollIntoView({behavior: 'smooth', block: 'center'});
//
//         console.log(`Error displayed for field ${field.id}: ${plainMessage}`);
//     }
//
//     function showErrorMessage(message) {
//         // Strip HTML tags if present
//         const plainMessage = message.replace(/<[^>]*>?/gm, '');
//
//         // Remove any existing error messages
//         const existingError = document.querySelector('.error-message');
//         if (existingError) {
//             existingError.remove();
//         }
//
//         // Create and add the error message element
//         const errorElement = document.createElement('div');
//         errorElement.className = 'error-message';
//         errorElement.textContent = plainMessage;
//         errorElement.style.backgroundColor = '#f8d7da';
//         errorElement.style.color = '#721c24';
//         errorElement.style.padding = '10px';
//         errorElement.style.margin = '10px 0';
//         errorElement.style.borderRadius = '4px';
//
//         // Add to the beginning of the form
//         const formHeader = document.querySelector('.form-header');
//         formHeader.after(errorElement);
//
//         console.log(`Main error message displayed: ${plainMessage}`);
//     }
//
//     // Verification code input handling
//     const verificationDigits = document.querySelectorAll('.verification-digit');
//     if (verificationDigits.length) {
//         verificationDigits.forEach((digit, index) => {
//             // Auto-focus next input when a digit is entered
//             digit.addEventListener('input', function () {
//                 // Only allow numbers
//                 this.value = this.value.replace(/[^0-9]/g, '');
//
//                 // Auto-advance to next input when a digit is entered
//                 if (this.value.length === 1 && index < verificationDigits.length - 1) {
//                     verificationDigits[index + 1].focus();
//                 }
//             });
//
//             // Handle backspace to go to previous input
//             digit.addEventListener('keydown', function (e) {
//                 if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
//                     verificationDigits[index - 1].focus();
//                 }
//             });
//
//             // Handle paste event for verification code
//             digit.addEventListener('paste', function (e) {
//                 e.preventDefault();
//                 const pastedText = (e.clipboardData || window.clipboardData).getData('text');
//
//                 // Only process if it looks like a verification code
//                 if (/^\d+$/.test(pastedText)) {
//                     // Fill all inputs with the respective digits
//                     for (let i = 0; i < verificationDigits.length && i < pastedText.length; i++) {
//                         verificationDigits[i].value = pastedText[i];
//                     }
//
//                     // Focus the next empty input or the last one if all are filled
//                     for (let i = 0; i < verificationDigits.length; i++) {
//                         if (verificationDigits[i].value === '') {
//                             verificationDigits[i].focus();
//                             break;
//                         } else if (i === verificationDigits.length - 1) {
//                             verificationDigits[i].focus();
//                         }
//                     }
//                 }
//             });
//         });
//     }
//
//     // Function to start resend timer
//     function startResendTimer() {
//         let seconds = 60; // 1 minute countdown
//         resendCodeBtn.disabled = true;
//         resendCodeBtn.style.opacity = '0.5';
//
//         const timerInterval = setInterval(() => {
//             seconds--;
//             resendTimer.textContent = `(${seconds}s)`;
//
//             if (seconds <= 0) {
//                 clearInterval(timerInterval);
//                 resendTimer.textContent = '';
//                 resendCodeBtn.disabled = false;
//                 resendCodeBtn.style.opacity = '1';
//             }
//         }, 1000);
//     }
//
//     // Event listener for resend code button
//     if (resendCodeBtn) {
//         resendCodeBtn.addEventListener('click', function (e) {
//             e.preventDefault();
//
//             if (this.disabled) return;
//
//             // Show loading state
//             this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
//
//             // Simulate code resending
//             setTimeout(() => {
//                 this.innerHTML = 'Resend Code';
//                 showSuccessMessage('A new verification code has been sent!');
//                 startResendTimer();
//
//                 // Focus the first digit input and clear all inputs
//                 if (verificationDigits.length) {
//                     verificationDigits[0].focus();
//                     verificationDigits.forEach(input => input.value = '');
//                 }
//             }, 1500);
//         });
//     }
//
//     // Function to show success message
//     function showSuccessMessage(message) {
//         // Remove any existing success messages
//         const existingMessage = document.querySelector('.success-message');
//         if (existingMessage) {
//             existingMessage.remove();
//         }
//
//         // Create and add the message element
//         const successElement = document.createElement('div');
//         successElement.className = 'success-message';
//         successElement.textContent = message;
//
//         // Add to the beginning of the form
//         const formHeader = document.querySelector('.form-header');
//         formHeader.after(successElement);
//
//         // Remove after 5 seconds
//         setTimeout(() => {
//             successElement.style.opacity = '0';
//             setTimeout(() => {
//                 successElement.remove();
//             }, 500);
//         }, 5000);
//     }
//
//     // Dummy function to validate steps (replace with your own validation logic)
//     function validateStep(step) {
//         // Example: always return true
//         return true;
//     }
//
//     // Verify code on submit
//     // Verify code on submit
//     const completeRegisterBtn = document.querySelector('.register-btn');
//     if (completeRegisterBtn) {
//         completeRegisterBtn.addEventListener('click', function (e) {
//             e.preventDefault();
//
//             // Collect verification code
//             let verificationCode = '';
//             verificationDigits.forEach(digit => {
//                 verificationCode += digit.value;
//             });
//
//             // Check if the code is complete
//             if (verificationCode.length !== 4) {
//                 showErrorMessage('Please enter the complete 4-digit verification code');
//                 return;
//             }
//
//             // Show loading state
//             this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
//             this.disabled = true;
//
//             // Prepare verification data
//             const formData = new URLSearchParams();
//             formData.append('email', registerForm.email.value);
//             formData.append('verification_code', verificationCode);
//             const csrftoken = getCookie('csrftoken');
//
//             // Send verification request
//             fetch('/accounts/verify_email/', {
//                 method: 'POST',
//                 headers: {
//                     'X-Requested-With': 'XMLHttpRequest',
//                     'X-CSRFToken': csrftoken,
//                 },
//                 body: formData,
//             })
//                 .then(response => response.json())
//                 .then(data => {
//                     if (data.success) {
//                         showSuccessMessage('Verification successful! Redirecting to your account...');
//                         setTimeout(() => {
//                             window.location.href = data.redirect_url || '/dashboard/';
//                         }, 2000);
//                     } else {
//                         showErrorMessage(data.error || 'Invalid verification code. Please try again.');
//                         this.disabled = false;
//                         this.innerHTML = '<span>Complete Registration</span><i class="fas fa-check"></i>';
//                     }
//                 })
//                 .catch(error => {
//                     console.error('Error:', error);
//                     showErrorMessage('An error occurred. Please try again.');
//                     this.disabled = false;
//                     this.innerHTML = '<span>Complete Registration</span><i class="fas fa-check"></i>';
//                 });
//         });
//     }
//
// });


// v1
// document.addEventListener('DOMContentLoaded', function() {
//     // Form steps navigation
//     const steps = document.querySelectorAll('.step');
//     const formSteps = document.querySelectorAll('.form-step');
//     const progressBar = document.querySelector('.progress');
//     const nextButtons = document.querySelectorAll('.next-btn');
//     const backButtons = document.querySelectorAll('.back-btn');
//     const registerForm = document.getElementById('register-form');
//
//     // Function to update the active step
//     function updateStep(currentStep, nextStep) {
//         // Update form steps
//         formSteps.forEach(step => {
//             step.classList.remove('active');
//         });
//
//         const nextFormStep = document.querySelector(`.form-step[data-step="${nextStep}"]`);
//         if (nextFormStep) {
//             nextFormStep.classList.add('active');
//         }
//
//         // Update step indicators
//         steps.forEach(step => {
//             const stepNum = parseInt(step.getAttribute('data-step'));
//             step.classList.remove('active', 'completed');
//
//             if (stepNum === nextStep) {
//                 step.classList.add('active');
//             } else if (stepNum < nextStep) {
//                 step.classList.add('completed');
//             }
//         });
//
//         // Update progress bar
//         const progressPercentage = ((nextStep - 1) / (steps.length - 1)) * 100;
//         progressBar.style.width = `${progressPercentage}%`;
//     }
//
//     // Event listeners for next buttons
//     nextButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
//             const nextStep = parseInt(this.getAttribute('data-next'));
//
//             // Validate current step
//             if (validateStep(currentStep)) {
//                 updateStep(currentStep, nextStep);
//             }
//         });
//     });
//
//     // Event listeners for back buttons
//     backButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             const currentStep = parseInt(this.closest('.form-step').getAttribute('data-step'));
//             const prevStep = parseInt(this.getAttribute('data-back'));
//
//             updateStep(currentStep, prevStep);
//         });
//     });
//
//     // Validate individual steps
//     function validateStep(step) {
//         let isValid = true;
//
//         // Get all required inputs in the current step
//         const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
//         const requiredInputs = currentStepElement.querySelectorAll('input[required]');
//
//         // Check if all required fields are filled
//         requiredInputs.forEach(input => {
//             if (input.value.trim() === '') {
//                 isValid = false;
//                 highlightError(input);
//             }
//         });
//
//         // Step-specific validations
//         if (step === 2) {
//             // Validate email
//             const emailInput = currentStepElement.querySelector('input[type="email"]');
//             if (emailInput && emailInput.value.trim() !== '') {
//                 if (!isValidEmail(emailInput.value)) {
//                     isValid = false;
//                     highlightError(emailInput);
//                     showErrorMessage('Please enter a valid email address');
//                 }
//             }
//
//             // Validate password match
//             const passwordInput = currentStepElement.querySelector('input[name$="password"]');
//             const rePasswordInput = currentStepElement.querySelector('input[name$="re_password"]');
//
//             if (passwordInput && rePasswordInput &&
//                 passwordInput.value.trim() !== '' &&
//                 rePasswordInput.value.trim() !== '') {
//                 if (passwordInput.value !== rePasswordInput.value) {
//                     isValid = false;
//                     highlightError(rePasswordInput);
//                     showErrorMessage('Passwords do not match');
//                 }
//             }
//         }
//
//         if (!isValid) {
//             showErrorMessage('Please correct the highlighted fields');
//         }
//
//         return isValid;
//     }
//
//     // Validate email format
//     function isValidEmail(email) {
//         const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//         return re.test(String(email).toLowerCase());
//     }
//
//     // Highlight input with error
//     function highlightError(input) {
//         input.classList.add('error');
//         input.addEventListener('focus', function() {
//             this.classList.remove('error');
//         }, { once: true });
//     }
//
//     // Show error message
//     function showErrorMessage(message) {
//         // Create error message element if it doesn't exist
//         let errorElement = document.querySelector('.error-message');
//
//         if (!errorElement) {
//             errorElement = document.createElement('div');
//             errorElement.className = 'error-message';
//             const form = document.querySelector('form');
//             form.insertBefore(errorElement, form.firstChild);
//         }
//
//         errorElement.textContent = message;
//         errorElement.style.display = 'block';
//
//         // Fade out after 3 seconds
//         setTimeout(() => {
//             errorElement.style.opacity = '0';
//             setTimeout(() => {
//                 errorElement.style.display = 'none';
//                 errorElement.style.opacity = '1';
//             }, 300);
//         }, 3000);
//     }
//
//     // Handle form submission
//     registerForm.addEventListener('submit', function(e) {
//         e.preventDefault();
//
//         // Validate all steps
//         let isValid = true;
//         for (let i = 1; i <= steps.length; i++) {
//             if (!validateStep(i)) {
//                 updateStep(null, i);
//                 isValid = false;
//                 break;
//             }
//         }
//
//         // Check terms checkbox
//         const termsCheckbox = document.getElementById('terms');
//         if (!termsCheckbox.checked) {
//             isValid = false;
//             showErrorMessage('You must agree to the Terms of Service to register');
//             updateStep(null, 3);
//         }
//
//         // Submit form if valid
//         if (isValid) {
//             // Show success animation
//             const registerBtn = document.querySelector('.register-btn');
//             registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
//             registerBtn.disabled = true;
//
//             // Simulate form submission (you can remove this setTimeout in real usage)
//             setTimeout(() => {
//                 this.submit();
//             }, 1000);
//         }
//     });
//
//     // Add 'filled' class to inputs that are pre-filled
//     const inputs = document.querySelectorAll('.form-group input');
//
//     inputs.forEach(input => {
//         // Skip checkboxes
//         if (input.type === 'checkbox') return;
//
//         // Check if input has value on page load
//         if (input.value.trim() !== '') {
//             input.classList.add('filled');
//             // Move the label up
//             const label = input.nextElementSibling;
//             if (label && label.tagName === 'LABEL') {
//                 label.classList.add('active');
//             }
//         }
//
//         // Add event listeners for focus and blur
//         input.addEventListener('focus', function() {
//             const label = this.nextElementSibling;
//             if (label && label.tagName === 'LABEL') {
//                 label.classList.add('active');
//             }
//         });
//
//         input.addEventListener('blur', function() {
//             if (this.value.trim() === '') {
//                 const label = this.nextElementSibling;
//                 if (label && label.tagName === 'LABEL') {
//                     label.classList.remove('active');
//                 }
//                 this.classList.remove('filled');
//             } else {
//                 this.classList.add('filled');
//             }
//         });
//     });
//
//     // Add floating animation to background elements
//     const style = document.createElement('style');
//     style.textContent = `
//         @keyframes float {
//             0% { transform: translate(0, 0) rotate(0deg); }
//             100% { transform: translate(10px, 10px) rotate(5deg); }
//         }
//
//         .step.completed .step-number:after {
//             content: "✓";
//             display: block;
//         }
//
//         input.error {
//             border-color: var(--error) !important;
//             box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.1) !important;
//         }
//
//         label.active {
//             transform: translateY(-1.5rem) !important;
//             font-size: 0.8rem !important;
//             color: var(--primary) !important;
//         }
//
//         @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//         }
//
//         .fa-spinner {
//             animation: spin 1s linear infinite;
//         }
//     `;
//     document.head.appendChild(style);
// });