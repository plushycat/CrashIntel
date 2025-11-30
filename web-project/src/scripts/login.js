document.addEventListener("DOMContentLoaded", async function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");
  const googleBtn = document.getElementById("google-login");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  // Supabase client exposed on window (see your supabaseClient.js)
  const supabase = window.supabaseClient;
  // --- NEW HELPER FUNCTION ---
  function showFeedback(message, type) {
    // Reset classes
    errorMessage.className = "error-message visible";

    if (type === "success") {
      errorMessage.classList.add("success");
    } else {
      errorMessage.classList.add("error");
    }
    errorMessage.innerHTML = message;
  }
  // Load theme from Supabase user metadata, fallback to localStorage
  try {
    let themeFromServer = null;
    if (supabase) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        themeFromServer = data.user.user_metadata?.theme || null;
      }
    }

    const theme = themeFromServer || localStorage.getItem("theme");
    if (theme === "dark") {
      body.classList.add("dark-mode");
      themeIcon.textContent = "☀️";
    } else {
      themeIcon.textContent = "🌙";
    }
  } catch (err) {
    console.warn(
      "Could not load theme from Supabase, falling back to localStorage",
      err?.message || err
    );
    if (localStorage.getItem("theme") === "dark") {
      body.classList.add("dark-mode");
      themeIcon.textContent = "☀️";
    } else {
      themeIcon.textContent = "🌙";
    }
  }

  // Persist theme changes: try Supabase user metadata first, otherwise use localStorage
  themeToggle.addEventListener("click", async function () {
    body.classList.toggle("dark-mode");
    const theme = body.classList.contains("dark-mode") ? "dark" : "light";
    themeIcon.textContent = body.classList.contains("dark-mode") ? "☀️" : "🌙";

    if (supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ data: { theme } });
        if (error) throw error;
        return;
      } catch (err) {
        console.warn(
          "Failed to persist theme to Supabase, falling back to localStorage:",
          err?.message || err
        );
      }
    }

    // fallback
    localStorage.setItem("theme", theme);
  });

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    // Clear previous messages
    errorMessage.classList.remove("visible");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!validateEmail(email)) {
      showFeedback("Please enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      showFeedback("Password must be at least 6 characters long.", "error");
      return;
    }

    if (!supabase) {
      showFeedback("Auth client not configured.", "error");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        showFeedback(error.message || "Login failed", "error");
        return;
      }
      // SUCCESS!
      showFeedback("Login successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/dashboard.html";
      }, 1000);
    } catch (err) {
      console.error(err);
      showFeedback("An unexpected error occurred.", "error");
    }
  });

  // Google OAuth via Supabase
  // Google OAuth via Supabase
    googleBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        if (!supabase) {
            showFeedback('Configuration error: auth client not found.', 'error');
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/dashboard.html' }
        });
        
        if (error) {
            console.error('OAuth error:', error.message);
            showFeedback('Google login failed.', 'error');
        }
    });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }
});

// Add loaded class on window load
window.addEventListener("load", function () {
  document.body.classList.add("loaded");
});
