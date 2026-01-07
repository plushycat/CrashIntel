import { useEffect } from 'react';

// Import CSS
import '../assets/styles/main.css';
import '../assets/styles/register.css';

const pageHTML = `
    <div class="watermark">CrashIntel</div>
    <div class="register-container">
        <h1>Create Account</h1>
        <button id="google-register" class="google-btn" type="button">
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" class="google-icon" />
            Sign up with Google
        </button>
        <div class="divider"><span>or</span></div>
        <form id="registerForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <div class="label-row">
                    <label for="password">Password</label>
                    <div class="pw-rules-wrapper">
                        <button id="pw-rules-btn" type="button" class="pw-rules-btn" aria-expanded="false" aria-controls="pw-rules-popup" title="Password rules">ℹ</button>

                        <div id="pw-rules-popup" class="pw-rules-popup" role="dialog" aria-modal="false" hidden>
                            <div class="pw-rules-content">
                                <button id="pw-rules-close" type="button" class="pw-rules-close" aria-label="Close">×</button>
                                <h4>Password rules</h4>
                                <ul id="passwordRules" class="password-rules" aria-live="polite">
                                    <li data-rule="minLength">At least 8 characters</li>
                                    <li data-rule="maxLength">No more than 128 characters</li>
                                    <li data-rule="lowercase">Contains a lowercase letter</li>
                                    <li data-rule="uppercase">Contains an uppercase letter</li>
                                    <li data-rule="number">Contains a number</li>
                                    <li data-rule="special">Contains a special character (e.g. !@#$%)</li>
                                    <li data-rule="noSpaces">No spaces</li>
                                    <li data-rule="notContainEmail">Doesn't contain your email local-part</li>
                                    <li data-rule="notCommon">Not a common password</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
            </div>
            <button type="submit">Register</button>
            <p class="message">Already have an account? <a href="/login">Login here</a></p>
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
            <a href="/login" class="nav-link" title="Back">⬅️</a>
        </div>
    </div>
`;

export default function RegisterPage() {
  useEffect(() => {
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
        await loadScript('/scripts/register.js');
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
