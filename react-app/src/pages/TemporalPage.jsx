import { useEffect } from 'react';

// Import CSS
import '../assets/styles/main.css';
import '../assets/styles/dashboard.css';
import '../assets/styles/temporal.css';

const pageHTML = `
    <div id="loading-screen"
        style="height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
        Loading Temporal Analysis...
    </div>

    <div id="dashboard-content" class="dashboard-container" style="display: none;">

        <div class="dashboard-header">

            <nav class="glass-nav">
                <div class="nav-brand">CrashIntel</div>

                <button id="mobile-menu-btn" class="nav-toggle-dashboard" aria-label="Toggle Dashboard Menu">
                    <span class="nav-icon">☰</span>
                </button>

                <div class="nav-links" id="nav-links">
                    <a href="/dashboard" class="nav-item">Home</a>
                    <a href="/predictive-ra" class="nav-item">Predictive RA</a>
                    <a href="/temporal" class="nav-item active">Temporal</a>

                    <div class="mobile-user-profile">
                        <span id="welcome-email-mobile" class="email-text">...</span>
                        <button id="logout-btn-mobile" class="btn-logout-small">Sign Out</button>
                    </div>
                </div>

                <div class="user-profile desktop-only">
                    <span id="welcome-email" class="email-text">...</span>
                    <button id="logout-btn" class="btn-logout-small">Sign Out</button>
                </div>
            </nav>

            <div class="top-controls">

                <div class="nav-container">
                    <button id="nav-toggle" class="nav-toggle" aria-label="Navigation menu">
                        <span class="nav-icon">☰</span>
                    </button>
                    <div class="nav-menu">
                        <a href="/" class="nav-link" title="Home">🏠</a>
                        <button onclick="handleBackButton()" class="nav-link" title="Go Back"
                            style="border:none; cursor:pointer; font-size:1.2rem;">⬅️</button>
                    </div>
                </div>

                <button id="theme-toggle" class="theme-toggle" aria-label="Toggle Theme">
                    <span class="theme-icon">🌙</span>
                </button>
            </div>

        </div>

        <!-- Hero Section -->
        <section class="glass-card" style="margin-bottom: 30px; text-align: center;">
            <h1 style="font-size: 2.5rem; margin-bottom: 15px;">📊 Temporal Analysis</h1>
            <p style="font-size: 1.1rem; opacity: 0.8; max-width: 800px; margin: 0 auto;">
                Explore 30 analysis questions from Phase 3. Click any question to reveal insights about accident patterns over time, weather conditions, vehicle types, and more.
            </p>
        </section>

        <!-- Summary Stats -->
        <div class="faq-summary">
            <div class="faq-summary-item">
                <div class="faq-summary-value" id="total-questions">--</div>
                <div class="faq-summary-label">Analysis Questions</div>
            </div>
            <div class="faq-summary-item">
                <div class="faq-summary-value">📈</div>
                <div class="faq-summary-label">Data-Driven Insights</div>
            </div>
            <div class="faq-summary-item">
                <div class="faq-summary-value">🔍</div>
                <div class="faq-summary-label">Pattern Discovery</div>
            </div>
        </div>

        <!-- FAQ Accordion -->
        <section class="glass-card" style="margin-bottom: 80px;">
            <h3 style="margin-bottom: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px;">
                📋 Analysis Questions & Insights
            </h3>
            
            <div id="faq-container" class="faq-container">
                <div class="faq-loading">
                    <div class="faq-loading-spinner"></div>
                    <p>Loading analysis questions...</p>
                </div>
            </div>
        </section>

    </div>
`;

export default function TemporalPage() {
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
        await loadScript('/scripts/dashboard.js');
        await loadScript('/scripts/temporal.js');
      } catch (e) {
        console.error('Failed to load scripts:', e);
      }
    };

    initPage();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: pageHTML }} />;
}
