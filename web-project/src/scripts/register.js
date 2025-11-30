document.addEventListener("DOMContentLoaded", async function () {
  // --- 1. DOM ELEMENTS ---
  const registerForm = document.getElementById("registerForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const errorMessage = document.getElementById("errorMessage"); // The Status Box

  // Password Rules Elements
  const passwordRulesList = document.getElementById("passwordRules");
  const pwRulesBtn = document.getElementById("pw-rules-btn");
  const pwRulesPopup = document.getElementById("pw-rules-popup");
  const pwRulesClose = document.getElementById("pw-rules-close");

  const googleBtn = document.getElementById("google-register");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const body = document.body;

  // --- 2. SUPABASE SETUP ---
  const supabase = window.supabaseClient;

  // --- 3. HELPER: VISUAL FEEDBACK BOX ---
  function showFeedback(message, type) {
    // Reset classes
    errorMessage.className = "error-message visible";

    // Add specific type (error or success)
    if (type === "success") {
      errorMessage.classList.add("success");
      errorMessage.classList.remove("error");
    } else {
      errorMessage.classList.add("error");
      errorMessage.classList.remove("success");
    }

    errorMessage.innerHTML = message;
  }

  // --- 4. HELPER: CHECK "HAVE I BEEN PWNED" API ---
  /**
   * Checks if a password exists in the 'Have I Been Pwned' database.
   * Uses k-anonymity (SHA-1 hashing) so the real password is never sent over the network.
   */
  async function checkPasswordBreach(password) {
    // 1. Hash the password using SHA-1
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // 2. Send only the first 5 characters (Prefix) to the API
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    try {
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`
      );
      if (!response.ok) return false; // Fail open if API is down

      // 3. Check if the rest of the hash (Suffix) exists in the response
      const text = await response.text();
      return text.includes(suffix);
    } catch (err) {
      console.warn("Password check failed:", err);
      return false;
    }
  }

  // --- 5. THEME LOGIC (Preserved) ---
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
    console.warn("Theme load error:", err);
  }

  themeToggle.addEventListener("click", async function () {
    body.classList.toggle("dark-mode");
    const theme = body.classList.contains("dark-mode") ? "dark" : "light";
    themeIcon.textContent = body.classList.contains("dark-mode") ? "☀️" : "🌙";

    if (supabase) {
      try {
        await supabase.auth.updateUser({ data: { theme } });
      } catch (err) {
        console.warn("Failed to persist theme:", err);
      }
    }
    localStorage.setItem("theme", theme);
  });

  // --- 6. REGISTRATION FORM SUBMISSION ---
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorMessage.classList.remove("visible"); // Hide previous messages

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // A. Basic Validation
    if (!validateEmail(email)) {
      showFeedback("Please enter a valid email address.", "error");
      return;
    }

    const pwErrors = validatePassword(password, email);
    if (pwErrors.length > 0) {
      showFeedback(pwErrors.map((e) => `• ${e}`).join("<br>"), "error");
      return;
    }

    if (password !== confirmPassword) {
      showFeedback("Passwords do not match.", "error");
      return;
    }

    // B. Robust Security Check (Async)
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;

    // Change button to show we are working
    submitBtn.innerText = "Checking security...";
    submitBtn.disabled = true;

    // Call the API
    const isCommon = await checkPasswordBreach(password);

    if (isCommon) {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
      showFeedback(
        "❌ This password has been exposed in data breaches.<br>Please choose a more secure password.",
        "error"
      );
      return;
    }

    // C. Supabase Registration
    submitBtn.innerText = "Creating Account...";

    if (!supabase) {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
      showFeedback("System Error: Auth client not configured.", "error");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect to Login page after confirming email
          emailRedirectTo: window.location.origin + "/login.html",
        },
      });

      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;

      if (error) {
        showFeedback(error.message || "Registration failed", "error");
        return;
      }

      // Success!
      showFeedback(
        "Registration successful!<br>Please check your email to confirm your account.",
        "success"
      );
      registerForm.reset();
    } catch (err) {
      console.error(err);
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
      showFeedback("An unexpected error occurred.", "error");
    }
  });

  // --- 7. LIVE VALIDATION & POPUP LOGIC ---
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

    // Note: We removed the local hardcoded "notCommon" check to rely on the robust API check instead.
    // We set this to true if the password is valid length to keep the UI clean.
    setRule("notCommon", pwd.length >= 8);
  }

  passwordInput.addEventListener("input", updatePasswordIndicators);
  emailInput.addEventListener("input", updatePasswordIndicators);
  // confirmPasswordInput listener removed from here as match logic is handled on submit for cleanliness,
  // but you can add it back if you want live "match" text.

  // Popup Toggles
  function openPwPopup() {
    if (!pwRulesPopup || !pwRulesBtn) return;
    pwRulesPopup.removeAttribute("hidden");
    pwRulesPopup.setAttribute("aria-modal", "true");
    pwRulesBtn.setAttribute("aria-expanded", "true");
    updatePasswordIndicators();
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

  // --- 8. GOOGLE OAUTH ---
  googleBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    errorMessage.classList.remove("visible");

    if (!supabase) {
      showFeedback("Configuration error: auth client not found.", "error");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard.html" },
    });
    if (error) {
      console.error("OAuth error:", error.message);
      showFeedback("Google registration failed.", "error");
    }
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Robust password validation (Removed the hardcoded array)
  function validatePassword(password, email) {
    const errors = [];
    if (!password) {
      errors.push("Password is required.");
      return errors;
    }

    if (password.length < 8) errors.push("Must be at least 8 characters long.");
    if (password.length > 128)
      errors.push("Must be no more than 128 characters long.");
    if (!/[a-z]/.test(password))
      errors.push("Include at least one lowercase letter.");
    if (!/[A-Z]/.test(password))
      errors.push("Include at least one uppercase letter.");
    if (!/[0-9]/.test(password)) errors.push("Include at least one number.");
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(password))
      errors.push("Include at least one special character.");
    if (/\s/.test(password)) errors.push("Password must not contain spaces.");

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
    return errors;
  }
});

window.addEventListener("load", function () {
  document.body.classList.add("loaded");
});
