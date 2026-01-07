import { useEffect } from 'react';

// Import CSS
import '../assets/styles/main.css';
import '../assets/styles/login.css';

const pageHTML = `
    <div class="watermark">CrashIntel</div>
    <div class="login-container">
        <h1>Login</h1>
        <button id="google-login" class="google-btn" type="button">
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" class="google-icon" />
            Sign in with Google
        </button>
        <div class="divider"><span>or</span></div>
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
            <p class="message">Don't have an account? <a href="/register">Register here</a></p>
        </form>
        <div id="errorMessage" class="error-message"></div>
    </div>    
    <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode">
        <span class="theme-icon">🌙</span>
    </button>
    <div class="nav-container">
        <button id="nav-toggle" class="nav-toggle" aria-label="Navigation menu">
            <span class="nav-icon">☰</span>
        </button>
        <div class="nav-menu">
            <a href="/" class="nav-link" title="Home">🏠</a>
            <a href="/" class="nav-link" title="Back">⬅️</a>
        </div>
    </div>
`;

export default function LoginPage() {
  useEffect(() => {
    // Load the original login script
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initPage = async () => {
      try {
        await loadScript('/scripts/supabaseConfig.js');
        await loadScript('/scripts/supabaseClient.js');
        await loadScript('/scripts/login.js');
      } catch (e) {
        console.error('Failed to load scripts:', e);
      }
    };

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      const icon = themeToggle?.querySelector('.theme-icon');
      if (icon) icon.textContent = '☀️';
    }

    const handleThemeToggle = () => {
      document.body.classList.toggle('dark-mode');
      const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      const icon = themeToggle?.querySelector('.theme-icon');
      if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('theme', theme);
    };

    themeToggle?.addEventListener('click', handleThemeToggle);
    initPage();

    return () => {
      themeToggle?.removeEventListener('click', handleThemeToggle);
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHTML }} />;
}
