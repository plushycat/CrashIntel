document.addEventListener("DOMContentLoaded", async function () {
  // --- UI INTERACTION LOGIC (Runs immediately) ---

  // Elements
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  // Elements for Navbar Interaction
  const globalNavContainer = document.querySelector(".nav-container");
  const glassNav = document.querySelector(".glass-nav");

  // Elements for Dashboard Mobile Menu
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  // 1. GLOBAL HAMBURGER HOVER EFFECT
  // When the global fixed menu (top right) is hovered, shrink the dashboard nav
  if (globalNavContainer && glassNav) {
    globalNavContainer.addEventListener("mouseenter", () => {
      glassNav.classList.add("nav-shrunk");
    });

    globalNavContainer.addEventListener("mouseleave", () => {
      glassNav.classList.remove("nav-shrunk");
    });
  }

  // 2. DASHBOARD MOBILE MENU TOGGLE
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      const span = mobileMenuBtn.querySelector("span");
      if (span) {
        span.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
      }
    });
  }

  // 3. THEME TOGGLE
  if (themeToggle) {
    themeToggle.addEventListener("click", async () => {
      body.classList.toggle("dark-mode");
      const theme = body.classList.contains("dark-mode") ? "dark" : "light";
      themeIcon.textContent = body.classList.contains("dark-mode")
        ? "☀️"
        : "🌙";
      localStorage.setItem("theme", theme);

      // Attempt to save to Supabase if client exists
      if (window.supabaseClient) {
        const { data } = await window.supabaseClient.auth.getSession();
        if (data?.session) {
          await window.supabaseClient.auth.updateUser({ data: { theme } });
        }
      }
    });
  }

  // --- SUPABASE & DATA LOGIC ---
  const welcomeEmail = document.getElementById("welcome-email");
  const welcomeEmailMobile = document.getElementById("welcome-email-mobile");
  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");
  const loadingScreen = document.getElementById("loading-screen");
  const dashboardContent = document.getElementById("dashboard-content");

  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase client not found.");
    // Even if no backend, show the UI so interactions can be tested
    if (loadingScreen) loadingScreen.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "block";
    document.body.classList.add("loaded");
    // Load map anyway
    initMap();
    return;
  }

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
    if (welcomeEmailMobile) welcomeEmailMobile.textContent = user.email;

    // Load Theme Preference
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
    initMap();
  }

  function initMap() {
    // Check if map container exists
    if (!document.getElementById("crash-map")) return;

    const map = L.map("crash-map").setView([12.9716, 77.5946], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const riskCircle = L.circle([12.9716, 77.5946], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 1500,
    }).addTo(map);

    riskCircle
      .bindPopup("<b>High Risk Zone</b><br>Silk Board Junction")
      .openPopup();

    map.on("click", function (e) {
      const elAcc = document.getElementById("stat-accidents");
      const elFat = document.getElementById("stat-fatalities");
      if (elAcc) elAcc.innerText = Math.floor(Math.random() * 500);
      if (elFat) elFat.innerText = Math.floor(Math.random() * 10);
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

  // Logout Logic
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", handleLogout);

  initDashboard();
});
