document.addEventListener('DOMContentLoaded', async function() {
    // Elements
    const welcomeEmail = document.getElementById('welcome-email');
    const logoutBtn = document.getElementById('logout-btn');
    const loadingScreen = document.getElementById('loading-screen');
    const dashboardContent = document.getElementById('dashboard-content');
    
    // Theme
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;

    // Supabase
    const supabase = window.supabaseClient;
    if (!supabase) { alert("System Error: Supabase client not found."); return; }

    // --- INIT ---
    async function initDashboard() {
        // 1. Check Session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            window.location.href = 'login.html';
            return;
        }

        // 2. Setup User Info
        const user = session.user;
        welcomeEmail.textContent = user.email;

        // 3. Apply Theme
        const savedTheme = user.user_metadata?.theme || localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
        }

        // 4. Show UI
        loadingScreen.style.display = 'none';
        dashboardContent.style.display = 'block';

        // 5. Load Fake Stats (Placeholder for real data)
        loadMockStats();
    }

    function loadMockStats() {
        // Simulate data fetching for the "Deep Dive" section
        setTimeout(() => {
            document.getElementById('stat-accidents').innerText = "1,245";
            document.getElementById('stat-fatalities').innerText = "32";
            document.getElementById('stat-common').innerText = "Rear-End";
        }, 800);
    }

    // --- EVENT LISTENERS ---
    
    // Logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    // Theme Toggle
    themeToggle.addEventListener('click', async () => {
        body.classList.toggle('dark-mode');
        const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        themeIcon.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
        await supabase.auth.updateUser({ data: { theme } });
    });

    // Start
    initDashboard();
});