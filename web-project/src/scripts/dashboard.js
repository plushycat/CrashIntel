document.addEventListener("DOMContentLoaded", async function () {
  // Elements
  const welcomeEmail = document.getElementById("welcome-email");
  const logoutBtn = document.getElementById("logout-btn");
  const loadingScreen = document.getElementById("loading-screen");
  const dashboardContent = document.getElementById("dashboard-content");

  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error("Supabase client not found.");
    document.body.classList.add("loaded");
    return;
  }

  // --- INIT ---
  async function initDashboard() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      window.location.href = "login.html";
      return;
    }

    const user = session.user;
    if (welcomeEmail) welcomeEmail.textContent = user.email;

    const savedTheme =
      user.user_metadata?.theme || localStorage.getItem("theme");
    if (savedTheme === "dark") {
      body.classList.add("dark-mode");
      themeIcon.textContent = "☀️";
    }

    if (loadingScreen) loadingScreen.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "block";
    document.body.classList.add("loaded");

    loadMockStats();

    // INITIALIZE MAP
    initMap();
  }

  // --- MAP LOGIC ---
  function initMap() {
    // 1. Create Map (Centered on Bangalore)
    const map = L.map("crash-map").setView([12.9716, 77.5946], 12);

    // 2. Add Tiles (The visual map)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // 3. Add an Overlay (Example: High Risk Zone)
    const riskCircle = L.circle([12.9716, 77.5946], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 1500,
    }).addTo(map);

    // 4. Add a Popup
    riskCircle
      .bindPopup("<b>High Risk Zone</b><br>Silk Board Junction")
      .openPopup();

    // 5. Click Event (Updates the stats panel)
    map.on("click", function (e) {
      // Update stats when map is clicked (Mock interaction)
      document.getElementById("stat-accidents").innerText = Math.floor(
        Math.random() * 500
      );
      document.getElementById("stat-fatalities").innerText = Math.floor(
        Math.random() * 10
      );
    });
  }

  function loadMockStats() {
    const elAccidents = document.getElementById("stat-accidents");
    const elFatalities = document.getElementById("stat-fatalities");
    const elCommon = document.getElementById("stat-common");

    setTimeout(() => {
      if (elAccidents) elAccidents.innerText = "1,245";
      if (elFatalities) elFatalities.innerText = "32";
      if (elCommon) elCommon.innerText = "Rear-End";
    }, 800);
  }

  // --- EVENT LISTENERS ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", async () => {
      body.classList.toggle("dark-mode");
      const theme = body.classList.contains("dark-mode") ? "dark" : "light";
      themeIcon.textContent = body.classList.contains("dark-mode")
        ? "☀️"
        : "🌙";
      localStorage.setItem("theme", theme);
      await supabase.auth.updateUser({ data: { theme } });
    });
  }

  initDashboard();
});
