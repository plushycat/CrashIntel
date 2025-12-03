document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. DOM ELEMENTS ---
    const welcomeName = document.getElementById('welcome-name');
    const welcomeEmail = document.getElementById('welcome-email');
    const logoutBtn = document.getElementById('logout-btn');
    const reportForm = document.getElementById('report-form');
    const reportsList = document.getElementById('reports-list');
    const loadingScreen = document.getElementById('loading-screen');
    const dashboardContent = document.getElementById('dashboard-content');
    
    // Theme Toggles
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;

    // --- 2. SUPABASE SETUP ---
    const supabase = window.supabaseClient;

    if (!supabase) {
        alert("System Error: Supabase client not found.");
        return;
    }

    // --- 3. SESSION CHECK & INITIALIZATION ---
    async function initDashboard() {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            // No user? Kick them out.
            window.location.href = 'login.html';
            return;
        }

        // User found! Setup UI
        const user = session.user;
        const displayName = user.user_metadata?.full_name || 'User';
        
        welcomeName.textContent = `Welcome back!`; // or use displayName
        welcomeEmail.textContent = user.email;

        // Apply Theme preference if saved
        const savedTheme = user.user_metadata?.theme || localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
        }

        // Show Dashboard
        loadingScreen.style.display = 'none';
        dashboardContent.style.display = 'block';

        // Load Data
        loadReports();
    }

    initDashboard();

    // --- 4. LOAD REPORTS (Read from DB) ---
    async function loadReports() {
        reportsList.innerHTML = '<div style="text-align:center; opacity:0.6;">Loading reports...</div>';

        const { data, error } = await supabase
            .from('saved_reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reports:', error);
            reportsList.innerHTML = '<div style="color:crimson; text-align:center;">Failed to load reports.</div>';
            return;
        }

        if (data.length === 0) {
            reportsList.innerHTML = '<div style="text-align:center; opacity:0.6;">No reports found. Add one!</div>';
            return;
        }

        // Render List
        reportsList.innerHTML = data.map(report => {
            const date = new Date(report.created_at).toLocaleDateString();
            const riskClass = `risk-${report.severity.toLowerCase()}`; // e.g., risk-high
            
            return `
                <div class="report-item">
                    <div>
                        <div style="font-weight:600; font-size:1.1rem;">${report.location_name}</div>
                        <div style="font-size:0.85rem; opacity:0.7;">Reported on ${date}</div>
                    </div>
                    <span class="risk-badge ${riskClass}">${report.severity} Risk</span>
                </div>
            `;
        }).join('');
    }

    // --- 5. SAVE REPORT (Write to DB) ---
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const locationInput = document.getElementById('location-input');
            const severityInput = document.getElementById('severity-input');
            const submitBtn = reportForm.querySelector('button');

            const location = locationInput.value.trim();
            const severity = severityInput.value;

            if (!location) return;

            // UI Loading State
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";
            submitBtn.disabled = true;

            const { error } = await supabase
                .from('saved_reports')
                .insert([{ location_name: location, severity: severity }]);

            submitBtn.innerText = originalText;
            submitBtn.disabled = false;

            if (error) {
                alert('Error saving report: ' + error.message);
            } else {
                // Success
                locationInput.value = ''; // Clear form
                loadReports(); // Refresh list
            }
        });
    }

    // --- 6. LOGOUT ---
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    // --- 7. THEME TOGGLE (Same as other pages) ---
    themeToggle.addEventListener('click', async () => {
        body.classList.toggle('dark-mode');
        const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        themeIcon.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
        localStorage.setItem('theme', theme);
        await supabase.auth.updateUser({ data: { theme } });
    });
});