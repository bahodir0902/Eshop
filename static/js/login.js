document.addEventListener('DOMContentLoaded', function() {
    // Add 'filled' class to inputs that are pre-filled (Django might pre-fill these on form errors)
    const inputs = document.querySelectorAll('.form-group input');

    inputs.forEach(input => {
        // Check if input has value on page load
        if (input.value.trim() !== '') {
            input.classList.add('filled');
            // Move the label up
            const label = input.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.classList.add('active');
            }
        }

        // Add event listeners for focus and blur
        input.addEventListener('focus', function() {
            const label = this.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.classList.add('active');
            }
        });

        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                const label = this.nextElementSibling;
                if (label && label.tagName === 'LABEL') {
                    label.classList.remove('active');
                }
                this.classList.remove('filled');
            } else {
                this.classList.add('filled');
            }
        });
    });

    // Add floating animation to background elements
    const circles = document.querySelectorAll('.circle');

    circles.forEach((circle, index) => {
        // Create random animation
        const duration = 15 + Math.random() * 10;
        const delay = index * 2;

        circle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`;
    });

    // Form validation
    const form = document.querySelector('form');

    form.addEventListener('submit', function(e) {
        let isValid = true;
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');

        // Simple validation
        if (emailInput.value.trim() === '') {
            isValid = false;
            highlightError(emailInput);
        }

        if (passwordInput.value.trim() === '') {
            isValid = false;
            highlightError(passwordInput);
        }

        if (!isValid) {
            e.preventDefault();
            showErrorMessage('Please fill in all required fields');
        }
    });

    function highlightError(input) {
        input.classList.add('error');
        input.addEventListener('focus', function() {
            this.classList.remove('error');
        }, { once: true });
    }

    function showErrorMessage(message) {
        // Create error message element if it doesn't exist
        let errorElement = document.querySelector('.error-message');

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            const form = document.querySelector('form');
            form.insertBefore(errorElement, form.firstChild);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Fade out after 3 seconds
        setTimeout(() => {
            errorElement.style.opacity = '0';
            setTimeout(() => {
                errorElement.style.display = 'none';
                errorElement.style.opacity = '1';
            }, 300);
        }, 3000);
    }

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(10px, 10px) rotate(5deg); }
        }
        
        .error-message {
            background-color: #ff5252;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            transition: opacity 0.3s ease;
        }
        
        input.error {
            border-color: #ff5252 !important;
            box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.1) !important;
        }
        
        label.active {
            transform: translateY(-1.5rem) !important;
            font-size: 0.8rem !important;
            color: var(--primary) !important;
        }
    `;
    document.head.appendChild(style);
});