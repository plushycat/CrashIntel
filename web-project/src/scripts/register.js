document.addEventListener("DOMContentLoaded", async function () {
  const registerForm = document.getElementById("registerForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const errorMessage = document.getElementById("errorMessage");
  const passwordRulesList = document.getElementById("passwordRules");
  const pwRulesBtn = document.getElementById("pw-rules-btn");
  const pwRulesPopup = document.getElementById("pw-rules-popup");
  const pwRulesClose = document.getElementById("pw-rules-close");
  const googleBtn = document.getElementById("google-register");
  const pwRulesWrapper = document.querySelector(".pw-rules-wrapper");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  // Supabase client exposed on window (see your supabaseClient.js)
  const supabase = window.supabaseClient;

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

  // Helper to show colorful feedback
  function showFeedback(message, type) {
    // Reset classes
    errorMessage.className = "error-message visible";

    // Add specific type (error or success)
    if (type === "success") {
      errorMessage.classList.add("success");
    } else {
      errorMessage.classList.add("error");
    }

    errorMessage.innerHTML = message;
  }

  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    // Hide previous messages
    errorMessage.classList.remove("visible");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!validateEmail(email)) {
      showFeedback("Please enter a valid email address.", "error");
      return;
    }

    const pwErrors = validatePassword(password, email);
    if (pwErrors.length > 0) {
      // Join errors with line breaks
      showFeedback(pwErrors.map((e) => `• ${e}`).join("<br>"), "error");
      return;
    }

    if (password !== confirmPassword) {
      showFeedback("Passwords do not match.", "error");
      return;
    }

    if (!supabase) {
      showFeedback("System Error: Auth client not configured.", "error");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/login.html",
        },
      });

      if (error) {
        showFeedback(error.message || "Registration failed", "error");
        return;
      }

      // SUCCESS!
      showFeedback(
        "Registration successful!<br>Please check your email to confirm your account.",
        "success"
      );

      // Optional: Clear the form
      registerForm.reset();
    } catch (err) {
      console.error(err);
      showFeedback("An unexpected error occurred.", "error");
    }
  });

  // Live validation: update rule indicators as the user types
  function updatePasswordIndicators() {
    const pwd = passwordInput.value || "";
    const email = emailInput.value || "";
    const local =
      email && email.includes("@") ? email.split("@")[0].toLowerCase() : "";

    if (!passwordRulesList) return;

    const setRule = (rule, ok) => {
      const li = passwordRulesList.querySelector(`li[data-rule="${rule}"]`);
      if (!li) return;
      li.classList.toggle("valid", ok);
      li.classList.toggle("invalid", !ok);
    };

    setRule("minLength", pwd.length >= 8);
    setRule("maxLength", pwd.length <= 128 && pwd.length > 0);
    setRule("lowercase", /[a-z]/.test(pwd));
    setRule("uppercase", /[A-Z]/.test(pwd));
    setRule("number", /[0-9]/.test(pwd));
    setRule("special", /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(pwd));
    setRule("noSpaces", !/\s/.test(pwd));
    setRule(
      "notContainEmail",
      !(local && local.length >= 3 && pwd.toLowerCase().includes(local))
    );
    const common = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "12345678",
      "111111",
      "123123",
      "abc123",
      "letmein",
      "iloveyou",
      "admin",
    ];
    setRule("notCommon", !common.includes(pwd.toLowerCase()));

    // Confirm password matching indicator (reuse errorMessage area for now)
    if (confirmPasswordInput.value) {
      const matchOk = pwd === confirmPasswordInput.value;
      // show a tiny inline helper rather than replacing errors
      const matchElId = "pw-match-helper";
      let matchEl = document.getElementById(matchElId);
      if (!matchEl) {
        matchEl = document.createElement("div");
        matchEl.id = matchElId;
        matchEl.style.fontSize = "0.9em";
        matchEl.style.marginTop = "6px";
        confirmPasswordInput.parentNode.appendChild(matchEl);
      }
      matchEl.textContent = matchOk
        ? "Passwords match"
        : "Passwords do not match";
      matchEl.style.color = matchOk ? "green" : "crimson";
    }
  }

  passwordInput.addEventListener("input", updatePasswordIndicators);
  confirmPasswordInput.addEventListener("input", updatePasswordIndicators);
  emailInput.addEventListener("input", updatePasswordIndicators);
  // The button is positioned next to the label via CSS (.label-row, .pw-rules-wrapper)

  // Popup toggle handlers for the minimal rules UI
  function openPwPopup() {
    if (!pwRulesPopup || !pwRulesBtn) return;
    pwRulesPopup.removeAttribute("hidden");
    pwRulesPopup.setAttribute("aria-modal", "true");
    pwRulesBtn.setAttribute("aria-expanded", "true");
    updatePasswordIndicators();
    // focus close button for keyboard users
    pwRulesClose?.focus();
  }

  function closePwPopup() {
    if (!pwRulesPopup || !pwRulesBtn) return;
    pwRulesPopup.setAttribute("hidden", "");
    pwRulesPopup.setAttribute("aria-modal", "false");
    pwRulesBtn.setAttribute("aria-expanded", "false");
    pwRulesBtn.focus();
  }

  if (pwRulesBtn) {
    pwRulesBtn.addEventListener("click", function () {
      if (pwRulesPopup && pwRulesPopup.hasAttribute("hidden")) openPwPopup();
      else closePwPopup();
    });
  }
  if (pwRulesClose) pwRulesClose.addEventListener("click", closePwPopup);
  if (pwRulesPopup) {
    pwRulesPopup.addEventListener("click", function (e) {
      if (e.target === pwRulesPopup) closePwPopup();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      pwRulesPopup &&
      !pwRulesPopup.hasAttribute("hidden")
    )
      closePwPopup();
  });

  // Google OAuth via Supabase
  googleBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    if (!supabase) {
      console.error("Supabase client not available on window.supabaseClient");
      errorMessage.textContent = "Configuration error: auth client not found.";
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard.html" },
    });
    if (error) {
      console.error("OAuth error:", error.message);
      errorMessage.textContent = "Google registration failed.";
    }
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Robust password validation: returns an array of error messages (empty = valid)
  function validatePassword(password, email) {
    const errors = [];
    if (!password) {
      errors.push("Password is required.");
      return errors;
    }

    if (password.length < 8) {
      errors.push("Must be at least 8 characters long.");
    }
    if (password.length > 128) {
      errors.push("Must be no more than 128 characters long.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Include at least one lowercase letter.");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Include at least one uppercase letter.");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Include at least one number.");
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      errors.push("Include at least one special character (e.g. !@#$%).");
    }
    if (/\s/.test(password)) {
      errors.push("Password must not contain spaces.");
    }

    // discourage using email local-part in password
    if (email && email.includes("@")) {
      const local = email.split("@")[0].toLowerCase();
      if (
        local &&
        local.length >= 3 &&
        password.toLowerCase().includes(local)
      ) {
        errors.push("Password should not contain part of your email.");
      }
    }

    // small common-password blacklist (expandable)
    const common = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "12345678",
      "111111",
      "123123",
      "abc123",
      "letmein",
      "iloveyou",
      "admin",
    ];
    if (common.includes(password.toLowerCase())) {
      errors.push("That password is too common — choose a stronger one.");
    }

    return errors;
  }
});

// Add loaded class on window load
window.addEventListener("load", function () {
  document.body.classList.add("loaded");
});
