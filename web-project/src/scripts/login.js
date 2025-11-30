document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const googleBtn = document.getElementById('google-login');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;

    // Load theme from localStorage
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
    }

    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!validateEmail(email)) {
            errorMessage.textContent = 'Please enter a valid email address.';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        // Simulate a login request
        console.log('Logging in with:', { email, password });
        // Here you would typically send a request to your server for authentication
    });

    googleBtn.addEventListener('click', function() {
        // Placeholder for Google OAuth integration
        alert('Google login integration coming soon!');
        // Here you would trigger Google Identity Services or similar
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
});

// Add loaded class on window load
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});