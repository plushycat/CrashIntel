document.addEventListener("DOMContentLoaded", async function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");
  const googleBtn = document.getElementById("google-login");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  const supabase = window.supabaseClient;

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

  // --- Check for existing session (Crucial for handling OAuth redirect) ---
  if (supabase) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    // If a session exists (e.g., from a successful OAuth redirect with a token in the URL hash), redirect immediately.
    if (session && !error) {
      // Use a very short delay to ensure the Supabase client has fully processed the token.
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 50);
      return; // Exit the rest of the script execution
    }
  }
  // ------

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
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (err) {
      console.error(err);
      showFeedback("An unexpected error occurred.", "error");
    }
  });

  // Google OAuth via Supabase
  googleBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    if (!supabase) {
      showFeedback("Configuration error: auth client not found.", "error");
      return;
    }

    // REACT WRAPPER FIX: Break out of iframe for OAuth
    // Redirect back to /site/loading.html on the TOP window (not iframe)
    const isInIframe = window.self !== window.top;
    const baseUrl = isInIframe ? window.top.location.origin : window.location.origin;
    const redirectUrl = baseUrl + "/loading.html";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: redirectUrl,
        skipBrowserRedirect: true  // Prevent auto-redirect so we can handle it manually
      },
    });

    if (error) {
      console.error("OAuth error:", error.message);
      showFeedback("Google login failed.", "error");
    } else if (data?.url) {
      // Break out of iframe - redirect top-level window to OAuth
      if (isInIframe) {
        window.top.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
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
