import { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import CSS
import '../assets/styles/main.css';
import '../assets/styles/landing.css';

const pageHTML = `
    <header class="hero">
        <div class="hero-content">
            <h1>CrashIntel</h1>
            <p>Discover insights, predict risks, and make Bangalore's roads safer with cutting-edge data analysis and predictions.</p>
            <a href="/login" class="cta-button">Get Started</a>
        </div>
        <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode">
            <span class="theme-icon">🌙</span>
        </button>
    </header>
    <section class="features">
        <div class="feature">
            <h2>🔍 Hotspot Detection</h2>
            <p>Identify accident-prone locations using advanced clustering algorithms and spatial analysis. Visualize high-risk zones on interactive maps to inform urban planning and safety measures.</p>
        </div>
        <div class="feature">
            <h2>🧠 Risk Prediction</h2>
            <p>Leverage machine learning models to predict accident severity and risk factors. Our AI analyzes historical data to forecast potential incidents and suggest preventive actions.</p>
        </div>
        <div class="feature">
            <h2>📊 Actionable Insights</h2>
            <p>Get comprehensive reports and recommendations for safer travel. From traffic signal optimization to driver education programs, turn data into real-world impact.</p>
        </div>
    </section>
    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 CrashIntel.</p>
            <p>Built with ❤️ for safer roads.</p>
        </div>
    </footer>
`;

export default function LandingPage() {
  useEffect(() => {
    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark-mode');
      const icon = themeToggle?.querySelector('.theme-icon');
      if (icon) icon.textContent = '☀️';
    }
    
    const handleThemeToggle = () => {
      body.classList.toggle('dark-mode');
      const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
      const icon = themeToggle?.querySelector('.theme-icon');
      if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('theme', theme);
    };
    
    themeToggle?.addEventListener('click', handleThemeToggle);
    
    // Intercept link clicks for React Router
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
      ctaButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/login';
      });
    }
    
    return () => {
      themeToggle?.removeEventListener('click', handleThemeToggle);
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHTML }} />;
}
