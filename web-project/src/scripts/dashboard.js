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
    if (!supabase) { 
        console.error("Supabase client not found.");
        // Force show page so you can at least see the error
        document.body.classList.add('loaded');
        return; 
    }

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
        if(welcomeEmail) welcomeEmail.textContent = user.email;

        // 3. Apply Theme
        const savedTheme = user.user_metadata?.theme || localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
        }

        // 4. Show UI (The Critical Fixes)
        // A. Hide the loading text
        if(loadingScreen) loadingScreen.style.display = 'none';
        
        // B. Show the actual dashboard div
        if(dashboardContent) dashboardContent.style.display = 'block';
        
        // C. TURN ON THE LIGHTS (Fixes the blank page)
        document.body.classList.add('loaded');

        // 5. Load Fake Stats
        loadMockStats();
    }

    function loadMockStats() {
        // Safe check in case elements don't exist yet
        const elAccidents = document.getElementById('stat-accidents');
        const elFatalities = document.getElementById('stat-fatalities');
        const elCommon = document.getElementById('stat-common');

        setTimeout(() => {
            if(elAccidents) elAccidents.innerText = "1,245";
            if(elFatalities) elFatalities.innerText = "32";
            if(elCommon) elCommon.innerText = "Rear-End";
        }, 800);
    }

    // --- EVENT LISTENERS ---
    
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', async () => {
            body.classList.toggle('dark-mode');
            const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            themeIcon.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
            localStorage.setItem('theme', theme);
            await supabase.auth.updateUser({ data: { theme } });
        });
    }

    // Start
    initDashboard();
});