document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const googleBtn = document.getElementById('google-login');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;

    // Supabase client exposed on window (see your supabaseClient.js)
    const supabase = window.supabaseClient;

    // Load theme from Supabase user metadata, fallback to localStorage
    try {
        let themeFromServer = null;
        if (supabase) {
            const { data, error } = await supabase.auth.getUser();
            if (!error && data?.user) {
                themeFromServer = data.user.user_metadata?.theme || null;
            }
        }

        const theme = themeFromServer || localStorage.getItem('theme');
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    } catch (err) {
        console.warn('Could not load theme from Supabase, falling back to localStorage', err?.message || err);
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    }

    // Persist theme changes: try Supabase user metadata first, otherwise use localStorage
    themeToggle.addEventListener('click', async function() {
        body.classList.toggle('dark-mode');
        const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        themeIcon.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';

        if (supabase) {
            try {
                const { error } = await supabase.auth.updateUser({ data: { theme } });
                if (error) throw error;
                return;
            } catch (err) {
                console.warn('Failed to persist theme to Supabase, falling back to localStorage:', err?.message || err);
            }
        }

        // fallback
        localStorage.setItem('theme', theme);
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

    // Google OAuth via Supabase
    googleBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        if (!supabase) {
            console.error('Supabase client not available on window.supabaseClient');
            errorMessage.textContent = 'Configuration error: auth client not found.';
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/login.html' }
        });
        if (error) {
            console.error('OAuth error:', error.message);
            errorMessage.textContent = 'Google login failed.';
        }
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