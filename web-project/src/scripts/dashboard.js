// --- SMART NAVIGATION LOGIC ---
window.handleBackButton = function () {
  const referrer = document.referrer;
  if (
    referrer &&
    (referrer.includes("login.html") || referrer.includes("register.html"))
  ) {
    window.location.href = "index.html";
  } else if (!referrer) {
    window.location.href = "index.html";
  } else {
    window.history.back();
  }
};

document.addEventListener("DOMContentLoaded", async function () {
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  const globalNavContainer = document.querySelector(".nav-container");
  const glassNav = document.querySelector(".glass-nav");

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  // 1. HOVER EFFECT
  if (globalNavContainer && glassNav) {
    globalNavContainer.addEventListener("mouseenter", () => {
      glassNav.classList.add("nav-shrunk");
    });

    globalNavContainer.addEventListener("mouseleave", () => {
      glassNav.classList.remove("nav-shrunk");
    });
  }

  // 2. MOBILE MENU
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
      const icon = themeToggle.querySelector(".theme-icon");
      if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";

      localStorage.setItem("theme", theme);

      if (window.supabaseClient) {
        const { data } = await window.supabaseClient.auth.getSession();
        if (data?.session) {
          await window.supabaseClient.auth.updateUser({ data: { theme } });
        }
      }
    });
  }

  // --- SUPABASE & DATA ---
  const welcomeEmail = document.getElementById("welcome-email");
  const welcomeEmailMobile = document.getElementById("welcome-email-mobile");
  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");
  const loadingScreen = document.getElementById("loading-screen");
  const dashboardContent = document.getElementById("dashboard-content");

  const supabase = window.supabaseClient;

  if (!supabase) {
    console.error("Supabase client not found.");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "block";
    document.body.classList.add("loaded");
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

    const savedTheme =
      user.user_metadata?.theme || localStorage.getItem("theme");
    const themeIcon = themeToggle?.querySelector(".theme-icon");

    if (savedTheme === "dark") {
      body.classList.add("dark-mode");
      if (themeIcon) themeIcon.textContent = "☀️";
    }

    if (loadingScreen) loadingScreen.style.display = "none";
    if (dashboardContent) dashboardContent.style.display = "block";
    document.body.classList.add("loaded");

    // loadMockStats(); // Removed in favor of real data
    initMap();
  }

  async function initMap() {
    if (!document.getElementById("crash-map")) return;

    const map = L.map("crash-map", {
      minZoom: 10,
      maxBounds: [
        [12.73, 77.37], // Southwest coordinates
        [13.20, 77.88], // Northeast coordinates
      ],
      maxBoundsViscosity: 1.0,
    }).setView([12.9716, 77.5946], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // OPTIMIZATION: Use Canvas renderer for better performance with 20k+ points
    const myRenderer = L.canvas({ padding: 0.5 });

    try {
      // Fetch real data from backend (Port 8001 to avoid zombie process on 8000)
      const response = await fetch("http://127.0.0.1:8001/api/map-data");
      const data = await response.json();

      if (data.error) {
        console.error("Map Data Error:", data.error);
        return;
      }

      console.log(`Loaded ${data.length} crash points.`);

      data.forEach((point) => {
        if (!point.Latitude || !point.Longitude) return;

        let color = "#3b82f6"; // Default blue
        const sever = String(point.Accident_Severity).toLowerCase();

        if (sever.includes("fatal")) {
          color = "#ef4444"; // Red
        } else if (sever.includes("serious")) {
          color = "#f97316"; // Orange
        } else if (sever.includes("slight")) {
          color = "#eab308"; // Yellow
        }

        L.circleMarker([point.Latitude, point.Longitude], {
          renderer: myRenderer, // Use Canvas
          radius: 4,           // Smaller dots as requested
          fillColor: color,
          color: color,        // Stroke color same as fill
          weight: 0,           // No stroke
          opacity: 1,
          fillOpacity: 0.7,    // Slight translucency
        })
          .bindPopup(
            `<b>${point.Location || "Unknown Location"}</b><br>
             Severity: ${point.Accident_Severity}`
          )
          .addTo(map);
      });
      // 3. INITIAL STATS
      updateStats(map, data);

      // 4. EVENT LISTENER
      map.on("moveend click", () => {
        updateStats(map, data);
      });

    } catch (err) {
      console.error("Failed to load map data:", err);
    }
  }

  function updateStats(map, allData) {
    const bounds = map.getBounds();
    
    // Filter points within current view
    const visiblePoints = allData.filter(p => {
        if(!p.Latitude || !p.Longitude) return false;
        return bounds.contains([p.Latitude, p.Longitude]);
    });

    const elAccidents = document.getElementById("stat-accidents");
    const elFatalities = document.getElementById("stat-fatalities");
    const elCommon = document.getElementById("stat-common");

    // 1. Total Accidents
    const total = visiblePoints.length;
    if (elAccidents) elAccidents.innerText = total.toLocaleString();

    // 2. Fatalities
    const fatalCount = visiblePoints.filter(p => String(p.Accident_Severity).toLowerCase().includes("fatal")).length;
    if (elFatalities) elFatalities.innerText = fatalCount.toLocaleString();

    // 3. Most Common Vehicle
    if (elCommon) {
        if (total === 0) {
            elCommon.innerText = "-";
        } else {
            const counts = {};
            let maxCount = 0;
            let mostCommon = "-";
            
            visiblePoints.forEach(p => {
                const v = p.Vehicle_Type || "Unknown";
                counts[v] = (counts[v] || 0) + 1;
                if(counts[v] > maxCount) {
                    maxCount = counts[v];
                    mostCommon = v;
                }
            });
            elCommon.innerText = mostCommon;
        }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", handleLogout);

  initDashboard();
});
