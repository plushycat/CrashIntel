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
    }).setView(
        [
            parseFloat(localStorage.getItem("map_center_lat")) || 12.9716,
            parseFloat(localStorage.getItem("map_center_lng")) || 77.5946
        ], 
        parseInt(localStorage.getItem("map_zoom")) || 11
    );

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

      // 4. EVENT LISTENERS
      let selectionCircle = null;
      let debounceTimer;

      // A. CLICK - Select a region (Dynamic radius)
      map.on("click", (e) => {
        const center = e.latlng;
        const zoom = map.getZoom();
        
        let radius = 1500; // Default (Zoom < 12)
        if (zoom >= 14) radius = 500;
        else if (zoom === 13) radius = 750;
        else if (zoom === 12) radius = 1000;

        // Remove existing circle
        if (selectionCircle) {
            map.removeLayer(selectionCircle);
        }

        // Draw new circle
        selectionCircle = L.circle(center, {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: radius,
            weight: 2
        }).addTo(map);

        // Update stats for this circle
        updateStats(map, data, center, radius);
        
        // Update Title to indicate mode
        const title = document.querySelector(".stats-header h3");
        if(title) title.innerText = `Deep Dive (Local ${radius < 1000 ? radius + 'm' : (radius/1000) + 'km'})`;

        // SHOW CLEAR BUTTON
        const clearBtn = document.getElementById("clear-selection-btn");
        if(clearBtn) clearBtn.style.display = "flex";

        // Save Selection State
        localStorage.setItem("sel_lat", center.lat);
        localStorage.setItem("sel_lng", center.lng);
        localStorage.setItem("sel_rad", radius);
      });

      // B. MOVE - Reset selection on pan/zoom
      map.on("moveend", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // Save Persistence State
            const center = map.getCenter();
            localStorage.setItem("map_center_lat", center.lat);
            localStorage.setItem("map_center_lng", center.lng);
            localStorage.setItem("map_zoom", map.getZoom());

            // Only update stats if NO selection is active
            if (selectionCircle) {
                // Do not clear. Do not update to viewport.
                // Keep the "Deep Dive (Local)" stats active.
                return;
            }
            
            updateStats(map, data);
        }, 200);
      });

      // C. CLEAR BUTTON
      const clearBtn = document.getElementById("clear-selection-btn");
      if(clearBtn) {
        clearBtn.addEventListener("click", () => {
             if (selectionCircle) {
                map.removeLayer(selectionCircle);
                selectionCircle = null;
            }
            updateStats(map, data); // Reset to viewport stats
            
            // Clear Saved Selection
            localStorage.removeItem("sel_lat");
            localStorage.removeItem("sel_lng");
            localStorage.removeItem("sel_rad");

            // Reset Title
            const title = document.querySelector(".stats-header h3"); // Updated selector
            // Or fallback if not found (though structure changed)
            if(title) title.innerText = "Deep Dive";
            
            // Hide Button
            clearBtn.style.display = "none";
        });
      }

      // D. RESET BUTTON
      const resetBtn = document.getElementById("reset-map-btn");
      if (resetBtn) {
          resetBtn.addEventListener("click", () => {
              // 1. Clear Selection
              if (selectionCircle) {
                  map.removeLayer(selectionCircle);
                  selectionCircle = null;
              }
              if (clearBtn) clearBtn.style.display = "none";

              // 2. Reset View
              map.setView([12.9716, 77.5946], 11);

              // 3. Clear Storage
              localStorage.removeItem("map_center_lat");
              localStorage.removeItem("map_center_lng");
              localStorage.removeItem("map_zoom");
              localStorage.removeItem("sel_lat");
              localStorage.removeItem("sel_lng");
              localStorage.removeItem("sel_rad");

              // 4. Reset Stats
              updateStats(map, data);
              
              // 5. Reset Title
              const title = document.querySelector(".stats-header h3");
              if (title) title.innerText = "Deep Dive";
          });
      }

      // D. RESTORE SELECTION (if exists)
      const savedLat = parseFloat(localStorage.getItem("sel_lat"));
      const savedLng = parseFloat(localStorage.getItem("sel_lng"));
      const savedRad = parseFloat(localStorage.getItem("sel_rad"));

      if (!isNaN(savedLat) && !isNaN(savedLng) && !isNaN(savedRad)) {
          const center = L.latLng(savedLat, savedLng);
          
          // Draw restored circle
          selectionCircle = L.circle(center, {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: savedRad,
            weight: 2
          }).addTo(map);

          // Update stats
          updateStats(map, data, center, savedRad);
          
          // Update Title
          const title = document.querySelector(".stats-header h3");
          if(title) title.innerText = `Deep Dive (Local ${savedRad < 1000 ? savedRad + 'm' : (savedRad/1000) + 'km'})`;
          
          // Show Button
          if(clearBtn) clearBtn.style.display = "flex";
      }

    } catch (err) {
      console.error("Failed to load map data:", err);
      showOfflineError();
    }
  }
  
  function showOfflineError() {
      const statsContainer = document.querySelector(".stats-container");
      if(statsContainer) {
          statsContainer.innerHTML = `
            <div class="offline-card">
                <h3>Overview Unavailable</h3>
                
                <div class="offline-status" style="border:none; box-shadow:none; background:transparent; padding:0; margin-bottom:10px;">
                     <span class="stat-value" style="font-size: 1rem; font-weight:600; display:flex; align-items:center; gap:6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        Server Offline
                     </span>
                </div>
                
                <div class="offline-instruction" style="margin-bottom: 20px;">
                    <span style="opacity:0.75">Run in <strong>Project Root</strong>:</span><br>
                    <code>run_server.bat</code>
                </div>

                <button class="offline-retry-btn" onclick="window.location.reload()" title="Retry Connection">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                </button>
            </div>
          `;
      }
  }

  function updateStats(map, allData, center = null, radius = 0) {
    const bounds = map.getBounds();
    let visiblePoints;

    // Filter Logic
    if (center && radius > 0) {
        // LOCAL MODE: Filter by distance
        visiblePoints = allData.filter(p => {
            if(!p.Latitude || !p.Longitude) return false;
            const ptLatLng = L.latLng(p.Latitude, p.Longitude);
            return center.distanceTo(ptLatLng) <= radius;
        });
    } else {
        // VIEWPORT MODE: Filter by map bounds
        visiblePoints = allData.filter(p => {
            if(!p.Latitude || !p.Longitude) return false;
            return bounds.contains([p.Latitude, p.Longitude]);
        });
    }

    const elAccidents = document.getElementById("stat-accidents");
    const elFatalities = document.getElementById("stat-fatalities");
    const elCommon = document.getElementById("stat-common");

    // 1. Total Accidents
    const total = visiblePoints.length;
    if (elAccidents) elAccidents.innerText = total.toLocaleString();

    // 2. Fatalities
    const fatalCount = visiblePoints.filter(p => String(p.Accident_Severity).toLowerCase().includes("fatal")).length;
    if (elFatalities) elFatalities.innerText = fatalCount.toLocaleString();

    // 3. Most Common Cause
    if (elCommon) {
        if (total === 0) {
            elCommon.innerText = "-";
        } else {
            const counts = {};
            let maxCount = 0;
            let mostCommon = "-";
            
            visiblePoints.forEach(p => {
                const reason = p.Accident_Reason || "Unknown";
                counts[reason] = (counts[reason] || 0) + 1;
                if(counts[reason] > maxCount) {
                    maxCount = counts[reason];
                    mostCommon = reason;
                }
            });
            elCommon.innerText = mostCommon;
        }
    }
  }

  async function handleLogout() {
    // Clear Map State
    localStorage.removeItem("map_center_lat");
    localStorage.removeItem("map_center_lng");
    localStorage.removeItem("map_zoom");
    
    // Clear Selection State
    localStorage.removeItem("sel_lat");
    localStorage.removeItem("sel_lng");
    localStorage.removeItem("sel_rad");

    await supabase.auth.signOut();
    window.location.href = "login.html";
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", handleLogout);

  initDashboard();
});
