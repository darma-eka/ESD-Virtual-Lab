/**
 * Main Application Controller & Gamification Logic
 * Styled for Materially React Admin Dashboard Design System
 */
const App = (function () {
  // User state with LocalStorage persistence
  const defaultUser = {
    name: "",
    class: "11 TP A",
    academicYear: "2026/2027",
    nis: "",
    group: "",
    role: "student", // "admin" or "student"
    isLoggedIn: false,
    level: 1,
    xp: 0,
    xpMax: 500,
    safetyScore: 0,
    badges: [],
    learnedParts: [],
    quizAnswers: {},
    quiz1Answers: {},
    quiz1Attachment: null,
    diagnosticCompleted: false,
    diagnosticData: null,
    activeScreen: "screen-home",
    activeMachine: "lathe" // "lathe" or "milling"
  };

  let userData = { ...defaultUser };
  let anatomyViewMode = "3d";
  let simViewMode = "3d";
  let currentQuizTab = "quiz1"; // "quiz1" (LK-1) or "comprehensive" (Uji Kompetensi)

  const breadcrumbsMap = {
    "screen-home": "Dashboard / Ringkasan & Lobi Utama",
    "screen-k3": "Keselamatan Kerja / Ruang APD & SOP K3",
    "screen-anatomy": "Eksplorasi Mesin / Anatomi Bubut & Frais",
    "screen-simulation": "Laboratorium / Simulator Kecepatan Potong",
    "screen-quiz": "Evaluasi & Quiz / Uji Kompetensi & LKPD Digital"
  };

  // ==================== THEME MANAGEMENT (DARK / LIGHT MODE) ====================
  let currentTheme = "light";

  function initTheme() {
    try {
      const savedTheme = localStorage.getItem("vmachining_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        currentTheme = savedTheme;
      } else if (document.documentElement.classList.contains("dark")) {
        currentTheme = "dark";
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        currentTheme = "dark";
      } else {
        currentTheme = "light";
      }
    } catch (e) {
      currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    applyTheme(currentTheme, false);
  }

  function applyTheme(theme, notify = false) {
    currentTheme = theme;
    const root = document.documentElement;
    const themeBtn = document.getElementById("btn-theme-toggle");
    const sidebarThemeIcon = document.getElementById("sidebar-theme-icon");
    const sidebarThemeLabel = document.getElementById("sidebar-theme-label");

    if (theme === "dark") {
      root.classList.add("dark");
      if (themeBtn) {
        themeBtn.innerHTML = '<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>';
        themeBtn.title = "Beralih ke Mode Terang";
        themeBtn.setAttribute("aria-label", "Beralih ke Mode Terang");
      }
      if (sidebarThemeIcon) {
        sidebarThemeIcon.setAttribute("data-lucide", "sun");
      }
      if (sidebarThemeLabel) {
        sidebarThemeLabel.textContent = "Tema Terang";
      }
    } else {
      root.classList.remove("dark");
      if (themeBtn) {
        themeBtn.innerHTML = '<i data-lucide="moon" class="w-4 h-4 text-slate-600"></i>';
        themeBtn.title = "Beralih ke Mode Gelap";
        themeBtn.setAttribute("aria-label", "Beralih ke Mode Gelap");
      }
      if (sidebarThemeIcon) {
        sidebarThemeIcon.setAttribute("data-lucide", "moon");
      }
      if (sidebarThemeLabel) {
        sidebarThemeLabel.textContent = "Tema Gelap";
      }
    }

    try {
      localStorage.setItem("vmachining_theme", theme);
    } catch (e) {}

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }

    if (notify) {
      showToast(theme === "dark" ? "Mode Gelap diaktifkan" : "Mode Terang diaktifkan", "info");
    }
  }

  function toggleTheme() {
    try { SoundEngine.playClick(); } catch (e) {}
    const isDark = document.documentElement.classList.contains("dark");
    const newTheme = isDark ? "light" : "dark";
    applyTheme(newTheme, true);
  }

  function getAccountStorageKey(name, nis) {
    const cleanNis = (nis || "").toString().trim();
    const cleanName = (name || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (cleanNis && cleanNis !== "-") {
      return "esd_account_nis_" + cleanNis;
    }
    return "esd_account_name_" + (cleanName || "guest");
  }

  function getDiagnosticStorageKey(name, nis) {
    const cleanNis = (nis || "").toString().trim();
    const cleanName = (name || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (cleanNis && cleanNis !== "-") {
      return "esd_diag_" + cleanNis;
    }
    return "esd_diag_" + (cleanName || "guest");
  }

  function loadUserData() {
    try {
      const saved = localStorage.getItem("vmachining_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        const isLogged = parsed.isLoggedIn === true && Boolean(parsed.name && parsed.name.trim());
        if (isLogged) {
          const cleanName = parsed.name.trim();
          const cleanNis = (parsed.nis || "").toString().trim();
          const accKey = getAccountStorageKey(cleanName, cleanNis);
          const savedAcc = localStorage.getItem(accKey);

          if (savedAcc) {
            const parsedAcc = JSON.parse(savedAcc);
            userData = {
              ...defaultUser,
              ...parsedAcc,
              ...parsed,
              name: cleanName,
              nis: cleanNis,
              isLoggedIn: true
            };
            userData.quizAnswers = (parsedAcc.quizAnswers && typeof parsedAcc.quizAnswers === "object") ? { ...parsedAcc.quizAnswers } : {};
            userData.quiz1Answers = (parsedAcc.quiz1Answers && typeof parsedAcc.quiz1Answers === "object") ? { ...parsedAcc.quiz1Answers } : {};
            userData.quiz1Attachment = (parsedAcc.quiz1Attachment && typeof parsedAcc.quiz1Attachment === "object") ? { ...parsedAcc.quiz1Attachment } : null;
          } else {
            userData = { ...defaultUser, ...parsed, isLoggedIn: true };
            if (!userData.quizAnswers || typeof userData.quizAnswers !== "object") userData.quizAnswers = {};
            if (!userData.quiz1Answers || typeof userData.quiz1Answers !== "object") userData.quiz1Answers = {};
            if (!userData.quiz1Attachment || typeof userData.quiz1Attachment !== "object") userData.quiz1Attachment = null;
            try {
              localStorage.setItem(accKey, JSON.stringify(userData));
            } catch (e) {}
          }

          if (userData.name) {
            userData.role = userData.name.toLowerCase().includes("admin") ? "admin" : "student";
          }

          // Verify diagnostic data for this student
          isDiagnosticCompleted(userData.name, userData.nis);
        } else {
          userData = { ...defaultUser, isLoggedIn: false };
        }
      } else {
        userData = { ...defaultUser, isLoggedIn: false };
      }
    } catch (e) {
      userData = { ...defaultUser, isLoggedIn: false };
    }
  }

  function saveUserData() {
    try {
      localStorage.setItem("vmachining_user", JSON.stringify(userData));
      if (userData.isLoggedIn && userData.name && userData.name.trim()) {
        const accKey = getAccountStorageKey(userData.name, userData.nis);
        localStorage.setItem(accKey, JSON.stringify(userData));
      }
    } catch (e) {}
    updateHUD();
  }

  // ==================== AUTHENTICATION & ROLE MANAGEMENT ====================
  function checkAuth() {
    const welcomeScreen = document.getElementById("welcome-screen");
    if (!welcomeScreen) return;

    if (!userData.isLoggedIn || !userData.name || !userData.name.trim()) {
      userData.isLoggedIn = false;
      welcomeScreen.classList.remove("hidden");
      welcomeScreen.style.display = "flex";
      closeDiagnosticModal();
      // Fill inputs if available
      const nameInput = document.getElementById("login-name");
      const classSelect = document.getElementById("login-class");
      const yearSelect = document.getElementById("login-year");
      if (nameInput && !nameInput.value && userData.name) {
        nameInput.value = userData.name;
        onStudentNameInput(userData.name);
      }
      if (classSelect && userData.class) classSelect.value = userData.class;
      if (yearSelect && userData.academicYear) yearSelect.value = userData.academicYear;
    } else {
      welcomeScreen.classList.add("hidden");
      welcomeScreen.style.display = "none";

      // If logged in student has NOT completed diagnostic, show diagnostic modal
      if (userData.role !== "admin") {
        const isDone = isDiagnosticCompleted(userData.name, userData.nis);
        if (!isDone) {
          setTimeout(() => {
            openDiagnosticModal(false);
          }, 200);
        }
      }
    }
  }

  function onStudentNameInput(val) {
    const badge = document.getElementById("login-student-badge");
    const nisText = document.getElementById("badge-nis-text");
    const groupText = document.getElementById("badge-group-text");
    const classSelect = document.getElementById("login-class");

    if (!val || !val.trim() || typeof AppData === "undefined" || !AppData.students) {
      if (badge) badge.classList.add("hidden");
      return;
    }

    const trimmed = val.trim().toLowerCase();
    const found = AppData.students.find((s) => s.name.toLowerCase() === trimmed);
    if (found) {
      if (badge && nisText && groupText) {
        nisText.textContent = `NIS: ${found.nis}`;
        groupText.textContent = `Kelompok: ${found.group}`;
        badge.classList.remove("hidden");
      }
      if (classSelect) {
        classSelect.value = "11 TP A";
      }
    } else {
      if (badge) badge.classList.add("hidden");
    }
  }

  function populateStudentDatalist() {
    const datalist = document.getElementById("student-names-list");
    if (!datalist || typeof AppData === "undefined" || !AppData.students) return;

    datalist.innerHTML = AppData.students
      .map((s) => {
        if (s.name.toLowerCase() === "siswa") {
          return `<option value="Siswa">Siswa (Akun Pengujian Laboratorium)</option>`;
        }
        return `<option value="${s.name}">${s.name} (NIS: ${s.nis} | Kelompok ${s.group})</option>`;
      })
      .join("");
  }

  const ADMIN_PASSWORD_HASH = "adminesd1"; // Kata sandi khusus Admin

  function showAdminPasswordSection() {
    try { SoundEngine.playClick(); } catch (e) {}
    const section = document.getElementById("admin-password-section");
    const btn = document.getElementById("btn-trigger-admin-login");
    const pwdInput = document.getElementById("admin-password-input");
    const errEl = document.getElementById("admin-password-error");
    if (errEl) errEl.classList.add("hidden");
    if (section) section.classList.remove("hidden");
    if (btn) btn.classList.add("hidden");
    if (pwdInput) {
      pwdInput.value = "";
      setTimeout(() => pwdInput.focus(), 100);
    }
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function hideAdminPasswordSection() {
    try { SoundEngine.playClick(); } catch (e) {}
    const section = document.getElementById("admin-password-section");
    const btn = document.getElementById("btn-trigger-admin-login");
    const pwdInput = document.getElementById("admin-password-input");
    const errEl = document.getElementById("admin-password-error");
    if (section) section.classList.add("hidden");
    if (btn) btn.classList.remove("hidden");
    if (errEl) errEl.classList.add("hidden");
    if (pwdInput) pwdInput.value = "";
  }

  function toggleAdminPasswordVisibility() {
    try { SoundEngine.playClick(); } catch (e) {}
    const pwdInput = document.getElementById("admin-password-input");
    const icon = document.getElementById("icon-reveal-password");
    if (!pwdInput) return;
    const isPwd = pwdInput.type === "password";
    pwdInput.type = isPwd ? "text" : "password";
    if (icon) {
      icon.setAttribute("data-lucide", isPwd ? "eye-off" : "eye");
      if (window.lucide) {
        try { lucide.createIcons(); } catch (e) {}
      }
    }
  }

  function verifyAdminPassword() {
    const pwdInput = document.getElementById("admin-password-input");
    const errEl = document.getElementById("admin-password-error");
    const yearSelect = document.getElementById("login-year");
    const currentYear = yearSelect ? yearSelect.value : "2026/2027";
    const entered = pwdInput ? pwdInput.value.trim() : "";

    if (entered === ADMIN_PASSWORD_HASH) {
      if (errEl) errEl.classList.add("hidden");
      if (pwdInput) pwdInput.value = "";
      hideAdminPasswordSection();
      login("Admin ESDVLab", "11 TP A", currentYear);
    } else {
      if (errEl) errEl.classList.remove("hidden");
      try { SoundEngine.playAlarm(); } catch (e) {}
      showToast("Kata sandi salah! Akses Admin ditolak.", "danger");
      if (pwdInput) {
        pwdInput.value = "";
        pwdInput.focus();
        pwdInput.classList.add("ring-2", "ring-red-500");
        setTimeout(() => pwdInput.classList.remove("ring-2", "ring-red-500"), 1200);
      }
      if (window.lucide) {
        try { lucide.createIcons(); } catch (e) {}
      }
    }
  }

  function login(name, classVal, yearVal) {
    if (!name || !name.trim()) {
      showToast("Silakan masukkan nama siswa atau akun penguji terlebih dahulu!", "danger");
      return;
    }

    const cleanName = name.trim();
    const isAdmin = cleanName.toLowerCase().includes("admin");
    const role = isAdmin ? "admin" : "student";

    let nis = "";
    let group = "";
    if (typeof AppData !== "undefined" && AppData.students) {
      const match = AppData.students.find((s) => s.name.toLowerCase() === cleanName.toLowerCase());
      if (match) {
        nis = match.nis;
        group = match.group;
      }
    }

    // 1. If previous user was active, flush their progress to their own dedicated key first
    if (userData.isLoggedIn && userData.name && userData.name.trim()) {
      const prevAccKey = getAccountStorageKey(userData.name, userData.nis);
      try {
        localStorage.setItem(prevAccKey, JSON.stringify(userData));
      } catch (e) {}
    }

    // 2. Load target student's isolated account record if it exists
    const targetKey = getAccountStorageKey(cleanName, nis);
    let targetAccData = null;
    try {
      const rawAcc = localStorage.getItem(targetKey);
      if (rawAcc) {
        targetAccData = JSON.parse(rawAcc);
      }
    } catch (e) {}

    if (targetAccData) {
      // Restore existing student's isolated progress
      userData = {
        ...defaultUser,
        ...targetAccData,
        name: cleanName,
        class: classVal || targetAccData.class || "11 TP A",
        academicYear: yearVal || targetAccData.academicYear || "2026/2027",
        nis: nis || targetAccData.nis || "",
        group: group || targetAccData.group || "",
        role: role,
        isLoggedIn: true
      };
      userData.quizAnswers = (targetAccData.quizAnswers && typeof targetAccData.quizAnswers === "object") ? { ...targetAccData.quizAnswers } : {};
      userData.quiz1Answers = (targetAccData.quiz1Answers && typeof targetAccData.quiz1Answers === "object") ? { ...targetAccData.quiz1Answers } : {};
      userData.quiz1Attachment = (targetAccData.quiz1Attachment && typeof targetAccData.quiz1Attachment === "object") ? { ...targetAccData.quiz1Attachment } : null;
      userData.badges = Array.isArray(targetAccData.badges) ? [...targetAccData.badges] : [];
      userData.learnedParts = Array.isArray(targetAccData.learnedParts) ? [...targetAccData.learnedParts] : [];
    } else {
      // New student record: clean, isolated default state
      userData = {
        ...defaultUser,
        name: cleanName,
        class: classVal || "11 TP A",
        academicYear: yearVal || "2026/2027",
        nis: nis,
        group: group,
        role: role,
        isLoggedIn: true,
        level: 1,
        xp: 0,
        xpMax: 500,
        safetyScore: 0,
        badges: [],
        learnedParts: [],
        quizAnswers: {},
        quiz1Answers: {},
        quiz1Attachment: null,
        diagnosticCompleted: false,
        diagnosticData: null
      };
    }

    // 3. Verify diagnostic completion specifically for this student
    const diagCompleted = isDiagnosticCompleted(cleanName, nis);
    if (!diagCompleted) {
      userData.diagnosticCompleted = false;
      userData.diagnosticData = null;
    }

    // 4. Reset in-memory diagnostic modal form answers so they don't leak from previous user
    diagnosticAnswers.cognitive = {};
    diagnosticAnswers.survey = {};
    if (userData.diagnosticData) {
      if (userData.diagnosticData.cognitiveAnswers) {
        diagnosticAnswers.cognitive = { ...userData.diagnosticData.cognitiveAnswers };
      }
      if (userData.diagnosticData.surveyAnswers) {
        diagnosticAnswers.survey = { ...userData.diagnosticData.surveyAnswers };
      }
    }

    // 5. Persist isolated state and refresh UI
    saveUserData();
    checkAuth();
    updateHUD();
    renderQuizScreen();

    try { SoundEngine.playSuccess(); } catch (e) {}

    if (isAdmin) {
      showToast(`Akses Admin Diterima! Selamat datang, ${cleanName}.`, "success");
    } else {
      const infoKelompok = group ? ` (${group})` : "";
      showToast(`Selamat datang di ESD V-Lab, ${cleanName}${infoKelompok}!`, "success");
      if (!isDiagnosticCompleted(cleanName, nis)) {
        setTimeout(() => {
          openDiagnosticModal(false);
        }, 350);
      }
    }
  }

  function quickLogin(type) {
    try { SoundEngine.playClick(); } catch (e) {}
    if (type === "admin") {
      showAdminPasswordSection();
    } else if (type === "siswa") {
      login("Siswa", "11 TP A", "2026/2027");
    }
  }

  function handleLoginForm(event) {
    if (event) event.preventDefault();
    const nameInput = document.getElementById("login-name");
    const classSelect = document.getElementById("login-class");
    const yearSelect = document.getElementById("login-year");

    const name = nameInput ? nameInput.value.trim() : "";
    const classVal = classSelect ? classSelect.value : "11 TP A";
    const yearVal = yearSelect ? yearSelect.value : "2026/2027";

    if (!name) {
      showToast("Silakan masukkan nama siswa terlebih dahulu!", "danger");
      return;
    }

    // Intercept if name contains admin to prevent bypassing password
    if (name.toLowerCase().includes("admin")) {
      showAdminPasswordSection();
      showToast("Akses Admin memerlukan verifikasi kata sandi guru.", "info");
      return;
    }

    login(name, classVal, yearVal);
  }

  function logout() {
    try { SoundEngine.playClick(); } catch (e) {}

    // Flush current user's progress to their dedicated account key
    if (userData.name && userData.name.trim()) {
      const accKey = getAccountStorageKey(userData.name, userData.nis);
      try {
        localStorage.setItem(accKey, JSON.stringify(userData));
      } catch (e) {}
    }

    // Reset memory state completely
    userData = {
      ...defaultUser,
      isLoggedIn: false,
      level: 1,
      xp: 0,
      xpMax: 500,
      safetyScore: 0,
      badges: [],
      learnedParts: [],
      quizAnswers: {},
      quiz1Answers: {},
      quiz1Attachment: null,
      diagnosticCompleted: false,
      diagnosticData: null
    };

    const q1Input = document.getElementById("quiz1-file-input");
    if (q1Input) q1Input.value = "";

    diagnosticAnswers.cognitive = {};
    diagnosticAnswers.survey = {};

    try {
      localStorage.removeItem("vmachining_user");
    } catch (e) {}

    hideAdminPasswordSection();
    closeDiagnosticModal();
    checkAuth();

    const nameInput = document.getElementById("login-name");
    if (nameInput) {
      nameInput.value = "";
      nameInput.focus();
    }
    const badge = document.getElementById("login-student-badge");
    if (badge) badge.classList.add("hidden");

    updateHUD();
    renderQuizScreen();
    showToast("Anda telah keluar dari sesi praktikum virtual.", "info");
  }

  function addXP(amount) {
    userData.xp += amount;
    while (userData.xp >= userData.xpMax) {
      userData.xp -= userData.xpMax;
      userData.level += 1;
      userData.xpMax = Math.round(userData.xpMax * 1.4);
      SoundEngine.playSuccess();
      showToast(`Level Up! Selamat, kamu naik ke Level ${userData.level}!`, "success");
    }
    saveUserData();
  }

  function unlockBadge(badgeId, badgeName) {
    if (!userData.badges.includes(badgeId)) {
      userData.badges.push(badgeId);
      addXP(100);
      SoundEngine.playSuccess();
      showToast(`Lencana Dibuka: ${badgeName}!`, "success");
      saveUserData();
    }
  }

  function showToast(msg, type = "info") {
    const toast = document.getElementById("game-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg font-medium text-sm shadow-xl transition-all duration-300 pointer-events-none flex items-center gap-2 ${
      type === "success"
        ? "bg-emerald-700 text-white shadow-emerald-900/20"
        : type === "danger"
        ? "bg-red-600 text-white shadow-red-900/20"
        : "bg-slate-800 text-white shadow-slate-900/20"
    }`;
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, -20px)";
    }, 3200);
  }

  function updateHUD() {
    // Update player HUD in UI
    const nameEl = document.getElementById("hud-user-name");
    const classEl = document.getElementById("hud-user-class");
    const levelEl = document.getElementById("hud-user-level");
    const xpBarEl = document.getElementById("hud-xp-bar");
    const xpTextEl = document.getElementById("hud-xp-text");
    const safetyBadgeEl = document.getElementById("hud-safety-badge");
    const statLearnedEl = document.getElementById("stat-learned-count");
    const avatarEl = document.getElementById("hud-user-avatar");
    const roleBadgeEl = document.getElementById("hud-role-badge");

    const displayName = userData.name || (userData.role === "admin" ? "Admin ESDVLab" : "Siswa");
    if (nameEl) nameEl.textContent = displayName;
    if (classEl) {
      const yearInfo = userData.academicYear ? ` • TA ${userData.academicYear}` : "";
      classEl.textContent = `${userData.class || "11 TP A"}${yearInfo}`;
    }
    if (levelEl) levelEl.textContent = `Level ${userData.level}`;
    const xpPct = Math.min(100, Math.round((userData.xp / userData.xpMax) * 100));
    if (xpBarEl) {
      xpBarEl.style.width = `${xpPct}%`;
    }
    if (xpTextEl) xpTextEl.textContent = `${userData.xp} / ${userData.xpMax} XP`;

    // Dynamic Level Card on Dashboard (screen-home)
    const homeLevelEl = document.getElementById("stat-home-level");
    const homeXpEl = document.getElementById("stat-home-xp");
    if (homeLevelEl) {
      const levelNames = ["", "Magang (L1)", "Junior (L2)", "Teknisi (L3)", "Senior (L4)", "Master (L5)", "Pakar (L6)"];
      homeLevelEl.textContent = levelNames[userData.level] || `Spesialis (L${userData.level})`;
    }
    if (homeXpEl) {
      homeXpEl.textContent = `${userData.xp} / ${userData.xpMax} XP`;
    }

    // Dynamic Level Indicators in Profile Modal
    const profileLevelBadge = document.getElementById("profile-level-badge");
    const profileXpBar = document.getElementById("profile-xp-bar");
    const profileXpText = document.getElementById("profile-xp-text");
    if (profileLevelBadge) profileLevelBadge.textContent = `Level ${userData.level}`;
    if (profileXpBar) profileXpBar.style.width = `${xpPct}%`;
    if (profileXpText) profileXpText.textContent = `${userData.xp} / ${userData.xpMax} XP`;

    if (safetyBadgeEl) {
      safetyBadgeEl.textContent = `${userData.safetyScore} Pts`;
    }
    if (statLearnedEl) {
      const totalParts = (AppData.latheParts?.length || 9) + (AppData.millingParts?.length || 13);
      statLearnedEl.textContent = `${userData.learnedParts.length} / ${totalParts}`;
    }

    // Role-based HUD avatar and role badge
    const isAdmin = userData.role === "admin";
    if (avatarEl) {
      if (isAdmin) {
        avatarEl.textContent = "👑";
        avatarEl.className = "w-9 h-9 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200 flex items-center justify-center font-bold text-sm shadow-xs";
      } else {
        const initials = (userData.name || "S").split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "S";
        avatarEl.textContent = initials;
        avatarEl.className = "w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 flex items-center justify-center font-bold text-xs shadow-xs";
      }
    }

    if (roleBadgeEl) {
      if (isAdmin) {
        roleBadgeEl.textContent = "👑 Admin Guru";
        roleBadgeEl.className = "hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 select-none shadow-xs";
        roleBadgeEl.style.display = "";
      } else {
        roleBadgeEl.textContent = `🎓 Siswa (${userData.class || "11 TP A"})`;
        roleBadgeEl.className = "hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 select-none";
        roleBadgeEl.style.display = "";
      }
    }

    // Role-based visibility for Cetak LKPD buttons
    const adminFeatures = document.querySelectorAll(".admin-only-feature");
    adminFeatures.forEach(el => {
      if (isAdmin) {
        el.classList.remove("hidden");
        el.style.display = "";
      } else {
        el.classList.add("hidden");
        el.style.display = "none";
      }
    });

    // Student quiz notification note
    const studentNote = document.getElementById("student-quiz-note");
    if (studentNote) {
      if (isAdmin) {
        studentNote.classList.add("hidden");
        studentNote.style.display = "none";
      } else {
        studentNote.classList.remove("hidden");
        studentNote.style.display = "";
      }
    }

    // Diagnostic Card HUD update on screen-home
    const diagBadge = document.getElementById("badge-diag-status");
    const diagDesc = document.getElementById("desc-diag-status");
    const diagScoreBox = document.getElementById("stat-diag-score-box");
    const diagScoreText = document.getElementById("stat-diag-score-text");
    const diagBtnText = document.getElementById("btn-diag-home-text");
    const profileDiagBadge = document.getElementById("profile-diag-badge");
    const profileDiagDesc = document.getElementById("profile-diag-desc");

    if (userData.diagnosticCompleted && userData.diagnosticData) {
      const d = userData.diagnosticData;
      if (d.skipped) {
        if (diagBadge) {
          diagBadge.textContent = "Dilewati";
          diagBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
        }
        if (diagDesc) diagDesc.textContent = "Asesmen diagnostik telah dilewati (siswa tercatat telah mengisi sebelumnya).";
        if (diagScoreBox) diagScoreBox.classList.add("hidden");
        if (diagBtnText) diagBtnText.textContent = "Kerjakan Asesmen";
        if (profileDiagBadge) {
          profileDiagBadge.textContent = "Dilewati";
          profileDiagBadge.className = "font-bold px-2 py-0.5 rounded text-[11px] bg-slate-200 text-slate-700";
        }
      } else {
        if (diagBadge) {
          diagBadge.textContent = `Selesai (${d.score}/100)`;
          diagBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300";
        }
        if (diagDesc) {
          diagDesc.textContent = `Gaya Belajar: ${d.learningStyle || "-"} | Status: ${d.category || "-"}`;
        }
        if (diagScoreBox) diagScoreBox.classList.remove("hidden");
        if (diagScoreText) diagScoreText.textContent = `${d.score} / 100`;
        if (diagBtnText) diagBtnText.textContent = "Lihat / Review Jawaban";
        if (profileDiagBadge) {
          profileDiagBadge.textContent = `Selesai (${d.score} Pts)`;
          profileDiagBadge.className = "font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800";
        }
        if (profileDiagDesc) {
          profileDiagDesc.textContent = `Gaya Belajar: ${d.learningStyle || "-"} | Kesiapan: ${d.category || "-"}`;
        }
      }
    } else {
      if (diagBadge) {
        diagBadge.textContent = "Belum Selesai";
        diagBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300";
      }
      if (diagDesc) diagDesc.textContent = "Pengukuran 10 butir kognitif awal mesin bubut & pemetaan gaya belajar untuk portofolio LKPD siswa.";
      if (diagScoreBox) diagScoreBox.classList.add("hidden");
      if (diagBtnText) diagBtnText.textContent = "Buka Soal Diagnostik";
      if (profileDiagBadge) {
        profileDiagBadge.textContent = "Belum Selesai";
        profileDiagBadge.className = "font-bold px-2 py-0.5 rounded text-[11px] bg-indigo-100 text-indigo-800";
      }
    }
  }

  // Navigation
  function navigateTo(screenId) {
    SoundEngine.playClick();
    userData.activeScreen = screenId;
    document.querySelectorAll(".app-screen").forEach((el) => {
      el.classList.add("hidden");
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update Breadcrumbs
    const breadcrumbEl = document.getElementById("breadcrumb-text");
    if (breadcrumbEl && breadcrumbsMap[screenId]) {
      breadcrumbEl.textContent = breadcrumbsMap[screenId];
    }

    // Update Sidebar Navigation Active State
    document.querySelectorAll(".sidebar-nav-item").forEach((btn) => {
      if (btn.dataset.target === screenId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update Mobile Bottom Navigation Active State
    document.querySelectorAll(".mobile-nav-item").forEach((btn) => {
      const dot = btn.querySelector(".mobile-nav-dot");
      if (btn.dataset.target === screenId) {
        btn.classList.add("text-blue-600", "font-bold");
        btn.classList.remove("text-slate-500", "font-medium");
        if (dot) dot.classList.remove("opacity-0");
      } else {
        btn.classList.remove("text-blue-600", "font-bold");
        btn.classList.add("text-slate-500", "font-medium");
        if (dot) dot.classList.add("opacity-0");
      }
    });

    // Close mobile drawer if open
    const sidebar = document.getElementById("main-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && sidebar.classList.contains("translate-x-0") && window.innerWidth < 768) {
      sidebar.classList.remove("translate-x-0");
      sidebar.classList.add("-translate-x-full");
      if (overlay) overlay.classList.add("hidden");
    }

    // Screen specific initializers
    if (screenId === "screen-anatomy") {
      renderAnatomyScreen();
      setTimeout(() => {
        if (anatomyViewMode === "3d") {
          const container = document.getElementById("anatomy-3d-container");
          if (container && typeof Lathe3D !== "undefined" && Lathe3D.AnatomyLab) {
            Lathe3D.AnatomyLab.init(container);
            Lathe3D.AnatomyLab.setMachine(userData.activeMachine);
            Lathe3D.AnatomyLab.onResize();
          }
        }
      }, 80);
    }

    if (screenId === "screen-simulation") {
      setMobileSimTab(activeMobileSimTab || "all");
      setupSimulationControls();
      updateSimOutputs();
      setTimeout(() => {
        const c = document.getElementById("lathe-canvas");
        if (c) SimEngine.init(c);
        if (simViewMode === "3d") {
          const container = document.getElementById("sim-3d-container");
          if (container && typeof Lathe3D !== "undefined" && Lathe3D.Sim3DLab) {
            Lathe3D.Sim3DLab.init(container);
            Lathe3D.Sim3DLab.onResize();
          }
        }
      }, 80);
    } else {
      SimEngine.stop();
    }

    if (screenId === "screen-k3") {
      renderK3Screen();
    }

    saveUserData();
    if (window.lucide) lucide.createIcons();
  }

  // Toggle Mobile Sidebar
  function toggleSidebar() {
    const sidebar = document.getElementById("main-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains("translate-x-0");
    if (isOpen) {
      sidebar.classList.remove("translate-x-0");
      sidebar.classList.add("-translate-x-full");
      if (overlay) overlay.classList.add("hidden");
    } else {
      sidebar.classList.remove("-translate-x-full");
      sidebar.classList.add("translate-x-0");
      if (overlay) overlay.classList.remove("hidden");
    }
  }

  // Render K3 Module
  let selectedK3Items = new Set();
  function renderK3Screen() {
    const container = document.getElementById("k3-items-grid");
    if (!container) return;
    container.innerHTML = "";

    AppData.k3.items.forEach((item) => {
      const isSelected = selectedK3Items.has(item.id);
      const card = document.createElement("div");
      card.className = `p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none group relative overflow-hidden ${
        isSelected
          ? item.category === "mandatory"
            ? "bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
            : "bg-red-50/80 border-red-500 shadow-md ring-2 ring-red-500/20"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
      }`;

      card.innerHTML = `
        <div class="flex items-start gap-3.5">
          <!-- Gambar Ikon APD / K3 -->
          <div class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-slate-50 border ${
            isSelected
              ? item.category === "mandatory"
                ? "border-emerald-300 bg-emerald-100/60 shadow-inner"
                : "border-red-300 bg-red-100/60 shadow-inner"
              : "border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/30"
          } p-1 flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-105">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-110" onerror="this.onerror=null; this.parentElement.innerHTML='<i data-lucide=&quot;${item.icon || 'shield'}&quot; class=&quot;w-8 h-8 text-slate-600&quot;></i>';">
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-bold text-sm text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">${item.name}</h4>
                <div class="mt-1">
                  ${
                    item.category === "mandatory"
                      ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-emerald-200 text-emerald-900 font-bold" : "bg-emerald-100 text-emerald-800"
                        } border border-emerald-200">
                          <i data-lucide="shield-check" class="w-3 h-3 text-emerald-600"></i> APD Wajib Digunakan
                        </span>`
                      : `<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-red-200 text-red-900 font-bold" : "bg-red-100 text-red-800"
                        } border border-red-200">
                          <i data-lucide="ban" class="w-3 h-3 text-red-600"></i> Dilarang Keras di Mesin
                        </span>`
                  }
                </div>
              </div>
              <input type="checkbox" ${isSelected ? "checked" : ""} class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 pointer-events-none mt-1 shrink-0 accent-blue-600">
            </div>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">${item.description}</p>
          </div>
        </div>
      `;

      card.onclick = () => {
        SoundEngine.playClick();
        if (selectedK3Items.has(item.id)) {
          selectedK3Items.delete(item.id);
        } else {
          selectedK3Items.add(item.id);
        }
        renderK3Screen();
      };

      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  function verifyK3() {
    let mandatoryMissing = 0;
    let prohibitedSelected = 0;

    AppData.k3.items.forEach((item) => {
      if (item.category === "mandatory" && !selectedK3Items.has(item.id)) {
        mandatoryMissing++;
      }
      if (item.category === "prohibited" && selectedK3Items.has(item.id)) {
        prohibitedSelected++;
      }
    });

    const resultBox = document.getElementById("k3-verification-result");
    if (!resultBox) return;
    resultBox.classList.remove("hidden");

    if (prohibitedSelected > 0) {
      SoundEngine.playAlarm();
      resultBox.className = "p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 mt-4";
      resultBox.innerHTML = `
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">!</div>
          <div>
            <h4 class="font-bold text-sm text-red-800">Pelanggaran K3 Fatal Terdeteksi!</h4>
            <p class="text-xs text-red-700 mt-1 leading-relaxed">
              Anda memilih item yang dilarang saat mengoperasikan mesin berputar (seperti sarung tangan tebal atau aksesoris perhiasan tangan). Serat sarung tangan dapat terlilit putaran spindel dalam hitungan milidetik dan memicu kecelakaan kerja fatal.
            </p>
          </div>
        </div>
      `;
    } else if (mandatoryMissing > 0) {
      SoundEngine.playWarning();
      resultBox.className = "p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 mt-4";
      resultBox.innerHTML = `
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">⚠️</div>
          <div>
            <h4 class="font-bold text-sm text-amber-800">Perlengkapan APD Belum Lengkap</h4>
            <p class="text-xs text-amber-700 mt-1 leading-relaxed">
              Masih terdapat <strong>${mandatoryMissing} perlengkapan APD wajib</strong> yang belum dicentang. Harap lengkapi kacamata safety, wearpack rapi, dan sepatu pelindung sebelum memasuki area mesin.
            </p>
          </div>
        </div>
      `;
    } else {
      SoundEngine.playSuccess();
      userData.safetyScore = 100;
      unlockBadge("k3_certified", "Sertifikasi K3 Zero Accident");
      addXP(75);
      resultBox.className = "p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 mt-4";
      resultBox.innerHTML = `
        <div class="flex items-start space-x-3">
          <div class="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">✓</div>
          <div>
            <h4 class="font-bold text-sm text-emerald-800">Verifikasi K3 Lulus (Standar Zero Accident)</h4>
            <p class="text-xs text-emerald-700 mt-1 leading-relaxed">
              Seluruh perlengkapan APD wajib telah terpasang dengan benar dan tidak ada aksesoris berbahaya. Anda memenuhi syarat keselamatan untuk mengoperasikan mesin bubut dan frais.
            </p>
          </div>
        </div>
      `;
    }
  }

  // Render Machine Anatomy Screen
  function renderAnatomyScreen() {
    const isLathe = userData.activeMachine === "lathe";
    const parts = isLathe ? AppData.latheParts : AppData.millingParts;
    const diagramContainer = document.getElementById("machine-diagram-area");
    const listContainer = document.getElementById("parts-list-cards");
    const photoContainer = document.getElementById("machine-photo-area");
    const photoImg = document.getElementById("img-machine-photo");
    const navHint = document.getElementById("anatomy-nav-hint");

    // Toggle button active styling
    const btnLathe = document.getElementById("btn-toggle-lathe");
    const btnMilling = document.getElementById("btn-toggle-milling");
    const svgLathe = document.getElementById("svg-lathe-blueprint");
    const svgMilling = document.getElementById("svg-milling-blueprint");

    if (btnLathe && btnMilling) {
      if (isLathe) {
        btnLathe.className = "px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs shadow-sm";
        btnMilling.className = "px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200";
        if (svgLathe) svgLathe.classList.remove("hidden");
        if (svgMilling) svgMilling.classList.add("hidden");
        if (photoImg) {
          photoImg.src = "Mesin bubut.jfif";
          photoImg.alt = "Foto Industri Mesin Bubut Konvensional";
        }
      } else {
        btnMilling.className = "px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs shadow-sm";
        btnLathe.className = "px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200";
        if (svgLathe) svgLathe.classList.add("hidden");
        if (svgMilling) svgMilling.classList.remove("hidden");
        if (photoImg) {
          photoImg.src = "Mesin Frais.png";
          photoImg.alt = "Foto Industri Mesin Frais (Vertical Milling Machine)";
        }
      }
    }

    if (navHint) {
      if (anatomyViewMode === "3d") {
        navHint.innerHTML = `💡 <strong>Navigasi 3D (${isLathe ? "Mesin Bubut" : "Mesin Frais"}):</strong> Klik & geser untuk putar 360°, scroll untuk zoom, klik pin angka untuk perbesar bagian secara detail.`;
      } else if (anatomyViewMode === "2d") {
        navHint.innerHTML = `📐 <strong>Cetak Biru 2D:</strong> Diagram CAD teknis dengan penanda posisi komponen presisi.`;
      } else {
        navHint.innerHTML = `📸 <strong>Foto Industri:</strong> Referensi mesin nyata ${isLathe ? "Mesin Bubut" : "Mesin Frais"} di bengkel SMK. Klik pin untuk membaca rincian.`;
      }
    }

    // Render Hotspots over 2D SVG diagram
    if (diagramContainer) {
      diagramContainer.querySelectorAll(".hotspot-pin").forEach((p) => p.remove());

      parts.forEach((part, idx) => {
        const pin = document.createElement("div");
        pin.className = "hotspot-pin";
        pin.style.left = `${part.x}%`;
        pin.style.top = `${part.y}%`;
        pin.title = part.name;

        const isLearned = userData.learnedParts.includes(part.id);

        pin.innerHTML = `
          <div class="hotspot-pin-inner ${isLearned ? "!bg-emerald-600 !border-emerald-200" : ""}">
            <span>${idx + 1}</span>
          </div>
        `;

        pin.onclick = () => showPartModal(part);
        diagramContainer.appendChild(pin);
      });
    }

    // Render Hotspots over Photo Reference
    const photoHotspots = document.getElementById("photo-hotspots-container");
    if (photoHotspots) {
      photoHotspots.innerHTML = "";
      parts.forEach((part, idx) => {
        const pin = document.createElement("button");
        const isLearned = userData.learnedParts.includes(part.id);
        pin.className = `absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full ${
          isLearned ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"
        } text-white font-bold text-xs shadow-lg flex items-center justify-center border-2 border-white/90 hover:scale-125 transition-all duration-150 cursor-pointer active:scale-95`;
        pin.style.left = `${part.x}%`;
        pin.style.top = `${part.y}%`;
        pin.title = `${idx + 1}. ${part.name}`;
        pin.innerHTML = `<span>${idx + 1}</span>`;
        pin.onclick = () => showPartModal(part);
        photoHotspots.appendChild(pin);
      });
    }

    // Render Parts cards list
    if (listContainer) {
      listContainer.innerHTML = "";
      parts.forEach((part, idx) => {
        const isLearned = userData.learnedParts.includes(part.id);
        const card = document.createElement("div");
        card.className = `p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
          isLearned
            ? "bg-emerald-50/50 border-emerald-200"
            : "bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
        }`;
        card.innerHTML = `
          <div class="flex items-center space-x-3">
            <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              isLearned ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
            }">${idx + 1}</span>
            <div>
              <h4 class="font-semibold text-xs text-slate-800">${part.name}</h4>
              <p class="text-[11px] text-slate-500 line-clamp-1">${part.desc}</p>
            </div>
          </div>
          <span class="text-[11px] font-medium px-2 py-0.5 rounded ${
            isLearned ? "text-emerald-700 bg-emerald-100" : "text-blue-700 bg-blue-100"
          }">
            ${isLearned ? "✓ Dipelajari" : "Detail"}
          </span>
        `;
        card.onclick = () => {
          if (anatomyViewMode === "3d" && typeof Lathe3D !== "undefined" && Lathe3D.AnatomyLab) {
            Lathe3D.AnatomyLab.focusOnPart(part.id);
          }
          showPartModal(part);
        };
        listContainer.appendChild(card);
      });
    }

    // Refresh 3D model if active
    if (anatomyViewMode === "3d") {
      const container3d = document.getElementById("anatomy-3d-container");
      if (container3d && typeof Lathe3D !== "undefined" && Lathe3D.AnatomyLab) {
        Lathe3D.AnatomyLab.setMachine(userData.activeMachine);
      }
    }
  }

  function showPartModal(part) {
    SoundEngine.playClick();
    const modal = document.getElementById("part-detail-modal");
    if (!modal) return;

    document.getElementById("modal-part-title").textContent = part.name;
    document.getElementById("modal-part-desc").textContent = part.desc;
    document.getElementById("modal-part-detail").textContent = part.detail;

    const btnMark = document.getElementById("btn-mark-learned");
    const isLearned = userData.learnedParts.includes(part.id);
    btnMark.textContent = isLearned ? "✓ Sudah Dipelajari" : "+ Tandai Telah Dipelajari (+15 XP)";
    btnMark.disabled = isLearned;

    btnMark.onclick = () => {
      if (!userData.learnedParts.includes(part.id)) {
        userData.learnedParts.push(part.id);
        addXP(15);
        SoundEngine.playSuccess();
        saveUserData();
        renderAnatomyScreen();
        modal.classList.add("hidden");
        showToast(`Komponen "${part.name}" dipelajari! +15 XP`, "success");
      }
    };

    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  }

  // Toggle 3D vs 2D vs Photo View in Anatomy Lab
  function setAnatomyViewMode(mode) {
    anatomyViewMode = mode;
    const btn3d = document.getElementById("btn-view-mode-3d");
    const btn2d = document.getElementById("btn-view-mode-2d");
    const btnPhoto = document.getElementById("btn-view-mode-photo");
    const container3d = document.getElementById("anatomy-3d-container");
    const container2d = document.getElementById("machine-diagram-area");
    const containerPhoto = document.getElementById("machine-photo-area");

    [btn3d, btn2d, btnPhoto].forEach((btn) => {
      if (btn) btn.className = "px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium transition-all";
    });
    if (container3d) container3d.classList.add("hidden");
    if (container2d) container2d.classList.add("hidden");
    if (containerPhoto) containerPhoto.classList.add("hidden");

    if (mode === "3d") {
      if (btn3d) btn3d.className = "px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all";
      if (container3d) container3d.classList.remove("hidden");

      setTimeout(() => {
        if (typeof Lathe3D !== "undefined" && Lathe3D.AnatomyLab) {
          Lathe3D.AnatomyLab.init(container3d);
          Lathe3D.AnatomyLab.setMachine(userData.activeMachine);
          Lathe3D.AnatomyLab.onResize();
        }
      }, 50);
    } else if (mode === "2d") {
      if (btn2d) btn2d.className = "px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all";
      if (container2d) container2d.classList.remove("hidden");
    } else if (mode === "photo") {
      if (btnPhoto) btnPhoto.className = "px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all";
      if (containerPhoto) containerPhoto.classList.remove("hidden");
    }

    renderAnatomyScreen();
  }

  // Mobile Simulation View Switcher (1. Layar 3D & Mesin, 2. Parameter, 3. Semua)
  let activeMobileSimTab = "all";

  function setMobileSimTab(tab) {
    activeMobileSimTab = tab;
    const panelParams = document.getElementById("sim-panel-params");
    const panelViewport = document.getElementById("sim-panel-viewport");

    const tabs = [
      { id: "mob-sim-tab-viewport", key: "viewport" },
      { id: "mob-sim-tab-params", key: "params" },
      { id: "mob-sim-tab-all", key: "all" }
    ];

    tabs.forEach(({ id, key }) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      if (key === tab) {
        btn.className = "mob-sim-tab flex-1 py-2 px-1 rounded-lg bg-blue-600 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold";
      } else {
        btn.className = "mob-sim-tab flex-1 py-2 px-1 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium";
      }
    });

    if (window.innerWidth < 1024) {
      if (tab === "viewport") {
        if (panelViewport) {
          panelViewport.classList.remove("hidden");
          panelViewport.classList.remove("order-first");
        }
        if (panelParams) panelParams.classList.add("hidden");
        setTimeout(() => {
          if (typeof Lathe3D !== "undefined" && Lathe3D.Sim3DLab) {
            Lathe3D.Sim3DLab.onResize();
          }
          if (simViewMode === "2d" && typeof SimEngine !== "undefined") {
            SimEngine.resize();
          }
        }, 60);
      } else if (tab === "params") {
        if (panelParams) panelParams.classList.remove("hidden");
        if (panelViewport) panelViewport.classList.add("hidden");
      } else if (tab === "all") {
        if (panelViewport) {
          panelViewport.classList.remove("hidden");
          panelViewport.classList.add("order-first");
        }
        if (panelParams) panelParams.classList.remove("hidden");
        setTimeout(() => {
          if (typeof Lathe3D !== "undefined" && Lathe3D.Sim3DLab) {
            Lathe3D.Sim3DLab.onResize();
          }
          if (simViewMode === "2d" && typeof SimEngine !== "undefined") {
            SimEngine.resize();
          }
        }, 60);
      }
    } else {
      if (panelParams) panelParams.classList.remove("hidden");
      if (panelViewport) {
        panelViewport.classList.remove("hidden");
        panelViewport.classList.remove("order-first");
      }
    }
  }

  // Toggle 3D vs 2D View in Simulation Lab
  function setSimViewMode(mode) {
    simViewMode = mode;
    const btn3d = document.getElementById("btn-sim-mode-3d");
    const btn2d = document.getElementById("btn-sim-mode-2d");
    const container3d = document.getElementById("sim-3d-container");
    const container2d = document.getElementById("sim-2d-container");

    if (mode === "3d") {
      if (btn3d) btn3d.className = "px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all";
      if (btn2d) btn2d.className = "px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium transition-all";
      if (container3d) container3d.classList.remove("hidden");
      if (container2d) container2d.classList.add("hidden");

      setTimeout(() => {
        if (typeof Lathe3D !== "undefined" && Lathe3D.Sim3DLab) {
          Lathe3D.Sim3DLab.init(container3d);
          Lathe3D.Sim3DLab.onResize();
        }
      }, 50);
    } else {
      if (btn2d) btn2d.className = "px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold shadow-xs transition-all";
      if (btn3d) btn3d.className = "px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium transition-all";
      if (container3d) container3d.classList.add("hidden");
      if (container2d) container2d.classList.remove("hidden");

      const c = document.getElementById("lathe-canvas");
      if (c && typeof SimEngine !== "undefined") {
        SimEngine.init(c);
        SimEngine.resize();
      }
    }
  }

  // Guard against duplicate keyboard listener registration
  let simKeydownBound = false;

  // Setup Simulation Controls
  function setupSimulationControls() {
    // Machine Operation toggle (Bubut vs Frais)
    const opLathe = document.getElementById("btn-sim-op-lathe");
    const opMilling = document.getElementById("btn-sim-op-milling");
    const curOp = SimEngine.getState().machineType;
    if (opLathe && opMilling) {
      if (curOp === "milling") {
        opMilling.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm cursor-pointer";
        opLathe.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
      } else {
        opLathe.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm cursor-pointer";
        opMilling.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
      }
      opLathe.onclick = () => {
        try { SoundEngine.playClick(); } catch (e) {}
        SimEngine.reset();
        SimEngine.updateConfig({ machineType: "lathe" });
        userData.activeMachine = "lathe";
        saveUserData();
        setupSimulationControls();
        updateSimOutputs();
      };
      opMilling.onclick = () => {
        try { SoundEngine.playClick(); } catch (e) {}
        SimEngine.reset();
        SimEngine.updateConfig({ machineType: "milling" });
        userData.activeMachine = "milling";
        saveUserData();
        setupSimulationControls();
        updateSimOutputs();
      };
    }

    // Toggle 3-Axis UI layout for Milling vs 2-Axis layout for Lathe
    const isMilling = curOp === "milling";
    const simAxisGrid = document.getElementById("sim-axis-grid");
    const droBoxY = document.getElementById("dro-box-axis-y");
    const axisGroupY = document.getElementById("axis-jog-group-y");

    const axisXTitle = document.getElementById("axis-x-title");
    const axisXSubtitle = document.getElementById("axis-x-subtitle");
    const axisXMinusLabel = document.getElementById("axis-x-minus-label");
    const axisXPlusLabel = document.getElementById("axis-x-plus-label");

    const axisZTitle = document.getElementById("axis-z-title");
    const axisZSubtitle = document.getElementById("axis-z-subtitle");
    const axisZMinusLabel = document.getElementById("axis-z-minus-label");
    const axisZPlusLabel = document.getElementById("axis-z-plus-label");

    if (simAxisGrid) {
      if (isMilling) {
        simAxisGrid.className = "grid grid-cols-1 sm:grid-cols-3 gap-2";
      } else {
        simAxisGrid.className = "grid grid-cols-2 gap-2.5";
      }
    }

    if (droBoxY) {
      if (isMilling) {
        droBoxY.classList.remove("hidden");
        droBoxY.classList.add("flex");
      } else {
        droBoxY.classList.add("hidden");
        droBoxY.classList.remove("flex");
      }
    }

    if (axisGroupY) {
      if (isMilling) {
        axisGroupY.classList.remove("hidden");
        axisGroupY.classList.add("flex");
      } else {
        axisGroupY.classList.add("hidden");
        axisGroupY.classList.remove("flex");
      }
    }

    const simViewportTitle = document.getElementById("lbl-sim-viewport-title");
    const simViewportFeed = document.getElementById("lbl-sim-viewport-feed");
    const simViewportHint = document.getElementById("lbl-sim-viewport-hint");

    // Floating Jog Overlay elements
    const overlayGroupY = document.getElementById("overlay-axis-group-y");
    const overlayDroBoxY = document.getElementById("overlay-dro-box-y");
    const overlayDroGrid = document.getElementById("overlay-dro-grid");
    const overlayLblX = document.getElementById("overlay-axis-x-title");
    const overlaySubX = document.getElementById("overlay-axis-x-subtitle");
    const overlayLblXMinus = document.getElementById("overlay-axis-x-minus-label");
    const overlayLblXPlus = document.getElementById("overlay-axis-x-plus-label");
    const overlayLblZ = document.getElementById("overlay-axis-z-title");
    const overlaySubZ = document.getElementById("overlay-axis-z-subtitle");
    const overlayLblZMinus = document.getElementById("overlay-axis-z-minus-label");
    const overlayLblZPlus = document.getElementById("overlay-axis-z-plus-label");

    if (isMilling) {
      if (axisXTitle) axisXTitle.textContent = "Sumbu X";
      if (axisXSubtitle) axisXSubtitle.textContent = "Meja (Kiri/Kanan)";
      if (axisXMinusLabel) axisXMinusLabel.textContent = "◀ Kiri";
      if (axisXPlusLabel) axisXPlusLabel.textContent = "Kanan ▶";

      if (axisZTitle) axisZTitle.textContent = "Sumbu Z";
      if (axisZSubtitle) axisZSubtitle.textContent = "Lutut (Vertikal)";
      if (axisZMinusLabel) axisZMinusLabel.textContent = "⬇ Turun";
      if (axisZPlusLabel) axisZPlusLabel.textContent = "Naik ⬆";

      // Sync Floating Jog Overlay to Milling
      if (overlayGroupY) { overlayGroupY.classList.remove("hidden"); overlayGroupY.classList.add("flex"); }
      if (overlayDroBoxY) overlayDroBoxY.classList.remove("hidden");
      if (overlayDroGrid) overlayDroGrid.className = "grid grid-cols-3 gap-1 bg-black/60 p-1.5 rounded-lg border border-slate-800/80 font-mono text-[10.5px] text-center";

      if (overlayLblX) overlayLblX.textContent = "Sumbu X";
      if (overlaySubX) overlaySubX.textContent = "Meja";
      if (overlayLblXMinus) overlayLblXMinus.textContent = "◀ Kiri";
      if (overlayLblXPlus) overlayLblXPlus.textContent = "Kanan ▶";

      if (overlayLblZ) overlayLblZ.textContent = "Sumbu Z";
      if (overlaySubZ) overlaySubZ.textContent = "Lutut";
      if (overlayLblZMinus) overlayLblZMinus.textContent = "▼ Turun";
      if (overlayLblZPlus) overlayLblZPlus.textContent = "Naik ▲";

      if (simViewportTitle) simViewportTitle.textContent = "Visualisasi Proses Penyayatan Mesin Frais 3D (Vertical Milling)";
      if (simViewportFeed) simViewportFeed.textContent = "Penyayatan Benda di Ragum";
      if (simViewportHint) {
        simViewportHint.innerHTML = "🔄 <strong>Kamera 3D Bebas:</strong> Putar 360° dengan klik & geser, scroll untuk zoom titik sayat. Pisau End Mill menyayat permukaan benda kerja pada ragum meja (Sumbu X/Y/Z).";
      }
    } else {
      if (axisXTitle) axisXTitle.textContent = "Sumbu X";
      if (axisXSubtitle) axisXSubtitle.textContent = "Melintang";
      if (axisXMinusLabel) axisXMinusLabel.textContent = "Maju (Potong)";
      if (axisXPlusLabel) axisXPlusLabel.textContent = "Mundur (Bebas)";

      if (axisZTitle) axisZTitle.textContent = "Sumbu Z";
      if (axisZSubtitle) axisZSubtitle.textContent = "Memanjang";
      if (axisZMinusLabel) axisZMinusLabel.textContent = "Ke Kiri (Makan)";
      if (axisZPlusLabel) axisZPlusLabel.textContent = "Ke Kanan (Ekor)";

      // Sync Floating Jog Overlay to Lathe
      if (overlayGroupY) { overlayGroupY.classList.add("hidden"); overlayGroupY.classList.remove("flex"); }
      if (overlayDroBoxY) overlayDroBoxY.classList.add("hidden");
      if (overlayDroGrid) overlayDroGrid.className = "grid grid-cols-2 gap-1 bg-black/60 p-1.5 rounded-lg border border-slate-800/80 font-mono text-[10.5px] text-center";

      if (overlayLblX) overlayLblX.textContent = "Sumbu X";
      if (overlaySubX) overlaySubX.textContent = "Melintang";
      if (overlayLblXMinus) overlayLblXMinus.textContent = "◀ Maju";
      if (overlayLblXPlus) overlayLblXPlus.textContent = "Mundur ▶";

      if (overlayLblZ) overlayLblZ.textContent = "Sumbu Z";
      if (overlaySubZ) overlaySubZ.textContent = "Memanjang";
      if (overlayLblZMinus) overlayLblZMinus.textContent = "◀ Makan";
      if (overlayLblZPlus) overlayLblZPlus.textContent = "Ekor ▶";

      if (simViewportTitle) simViewportTitle.textContent = "Visualisasi Proses Penyayatan Mesin Bubut 3D";
      if (simViewportFeed) simViewportFeed.textContent = "Feeding ke Arah Cekam";
      if (simViewportHint) {
        simViewportHint.innerHTML = "🔄 <strong>Kamera 3D Bebas:</strong> Putar 360° dengan klik & geser, scroll untuk zoom titik sayat. Pahat Rata Kanan (ISO 6) menyayat dari Kanan ➔ Kiri.";
      }
    }

    // Material buttons
    const matContainer = document.getElementById("sim-material-selector");
    if (matContainer) {
      matContainer.innerHTML = "";
      AppData.materials.forEach((m) => {
        const btn = document.createElement("button");
        const isActive = SimEngine.getState().materialId === m.id;
        btn.className = `p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
          isActive
            ? "bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/60 dark:border-blue-400 dark:text-blue-200 font-semibold shadow-sm"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/80"
        }`;
        btn.innerHTML = `
          <div class="font-medium">${m.name.split("/")[0]}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${m.hardness}</div>
        `;
        btn.onclick = () => {
          try { SoundEngine.playClick(); } catch (e) {}
          SimEngine.updateConfig({ materialId: m.id });
          setupSimulationControls();
          updateSimOutputs();
        };
        matContainer.appendChild(btn);
      });
    }

    // Toggle parameter panels between Lathe (Diameter & Panjang) and Milling (Endmill Ø & Dimensi Balok P×L×T)
    const paramGroupLathe = document.getElementById("param-group-lathe");
    const paramGroupMilling = document.getElementById("param-group-milling");
    const lblToolSelector = document.getElementById("lbl-tool-selector");
    const lblParamFeed = document.getElementById("lbl-param-feed");

    if (paramGroupLathe && paramGroupMilling) {
      if (isMilling) {
        paramGroupLathe.classList.add("hidden");
        paramGroupMilling.classList.remove("hidden");
        if (lblToolSelector) lblToolSelector.textContent = "Jenis Pisau Frais (End Mill HSS / Karbida)";
        if (lblParamFeed) lblParamFeed.textContent = "Pemakanan per Gigi (fz):";
      } else {
        paramGroupLathe.classList.remove("hidden");
        paramGroupMilling.classList.add("hidden");
        if (lblToolSelector) lblToolSelector.textContent = "Jenis Alat Potong (Pahat Rata Kanan — ISO 6)";
        if (lblParamFeed) lblParamFeed.textContent = "Gerak Pemakanan / Feeding (f):";
      }
    }

    // Tool buttons (Pahat Bubut vs Pisau Frais)
    const toolHss = document.getElementById("btn-tool-hss");
    const toolCarbide = document.getElementById("btn-tool-carbide");
    const currentTool = SimEngine.getState().toolId;
    if (toolHss && toolCarbide) {
      if (isMilling) {
        toolHss.textContent = "End Mill HSS";
        toolCarbide.textContent = "End Mill Karbida";
      } else {
        toolHss.textContent = "Pahat HSS";
        toolCarbide.textContent = "Pahat Karbida";
      }

      if (currentTool === "hss") {
        toolHss.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm cursor-pointer";
        toolCarbide.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
      } else {
        toolCarbide.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm cursor-pointer";
        toolHss.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
      }
      toolHss.onclick = () => {
        try { SoundEngine.playClick(); } catch (e) {}
        SimEngine.updateConfig({ toolId: "hss" });
        setupSimulationControls();
        updateSimOutputs();
      };
      toolCarbide.onclick = () => {
        try { SoundEngine.playClick(); } catch (e) {}
        SimEngine.updateConfig({ toolId: "carbide" });
        setupSimulationControls();
        updateSimOutputs();
      };
    }

    // Endmill Diameter Selector Buttons (8, 10, 12, 16, 20 mm)
    const endmillBtns = document.querySelectorAll(".btn-endmill-dia");
    const valEndmillDia = document.getElementById("val-endmill-dia");
    const curEndmillDia = SimEngine.getState().endmillDia || 12;
    if (valEndmillDia) {
      valEndmillDia.textContent = `Ø ${curEndmillDia} mm`;
    }
    endmillBtns.forEach((btn) => {
      const dia = parseInt(btn.dataset.dia);
      if (dia === curEndmillDia) {
        btn.className = "btn-endmill-dia active py-2 rounded-lg border text-xs font-bold font-mono transition-all bg-blue-600 text-white border-blue-600 shadow-sm cursor-pointer text-center";
      } else {
        btn.className = "btn-endmill-dia py-2 rounded-lg border text-xs font-bold font-mono transition-all text-slate-700 bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer text-center";
      }
      btn.onclick = () => {
        try { SoundEngine.playClick(); } catch (e) {}
        SimEngine.updateConfig({ endmillDia: dia });
        setupSimulationControls();
        updateSimOutputs();
        showToast(`Diameter End Mill diatur ke Ø ${dia} mm`, "info");
      };
    });

    // Milling Workpiece Dimension Sliders (Panjang P, Lebar L, Tinggi T)
    const sliderP = document.getElementById("slider-milling-p");
    const valP = document.getElementById("val-milling-p");
    const sliderL = document.getElementById("slider-milling-l");
    const valL = document.getElementById("val-milling-l");
    const sliderT = document.getElementById("slider-milling-t");
    const valT = document.getElementById("val-milling-t");
    const valWpSummary = document.getElementById("val-wp-dim-summary");

    function updateWpDimDisplay(p, l, t) {
      if (valP) valP.textContent = `${p} mm`;
      if (valL) valL.textContent = `${l} mm`;
      if (valT) valT.textContent = `${t} mm`;
      if (valWpSummary) valWpSummary.textContent = `${p} × ${l} × ${t} mm`;
    }

    const curP = SimEngine.getState().workpieceP || 100;
    const curL = SimEngine.getState().workpieceL || 40;
    const curT = SimEngine.getState().workpieceT || 40;

    if (sliderP) {
      sliderP.value = curP;
      sliderP.oninput = (e) => {
        const p = parseInt(e.target.value);
        SimEngine.updateConfig({ workpieceP: p });
        updateWpDimDisplay(p, SimEngine.getState().workpieceL || 40, SimEngine.getState().workpieceT || 40);
        updateSimOutputs();
      };
    }
    if (sliderL) {
      sliderL.value = curL;
      sliderL.oninput = (e) => {
        const l = parseInt(e.target.value);
        SimEngine.updateConfig({ workpieceL: l });
        updateWpDimDisplay(SimEngine.getState().workpieceP || 100, l, SimEngine.getState().workpieceT || 40);
        updateSimOutputs();
      };
    }
    if (sliderT) {
      sliderT.value = curT;
      sliderT.oninput = (e) => {
        const t = parseInt(e.target.value);
        SimEngine.updateConfig({ workpieceT: t });
        updateWpDimDisplay(SimEngine.getState().workpieceP || 100, SimEngine.getState().workpieceL || 40, t);
        updateSimOutputs();
      };
    }
    updateWpDimDisplay(curP, curL, curT);

    // Lathe Sliders
    const diaSlider = document.getElementById("slider-diameter");
    const diaVal = document.getElementById("val-diameter");
    if (diaSlider && diaVal) {
      diaSlider.value = SimEngine.getState().diameter;
      diaVal.textContent = `${diaSlider.value} mm`;
      diaSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        diaVal.textContent = `${val} mm`;
        SimEngine.updateConfig({ diameter: val });
        updateSimOutputs();
      };
    }

    const rpmSlider = document.getElementById("slider-rpm");
    const rpmVal = document.getElementById("val-rpm");
    if (rpmSlider && rpmVal) {
      rpmSlider.value = SimEngine.getState().rpm;
      rpmVal.textContent = `${rpmSlider.value} RPM`;
      rpmSlider.oninput = (e) => {
        const val = parseInt(e.target.value);
        rpmVal.textContent = `${val} RPM`;
        SimEngine.updateConfig({ rpm: val });
        updateSimOutputs();
      };
    }

    const feedSlider = document.getElementById("slider-feed");
    const feedVal = document.getElementById("val-feed");
    if (feedSlider && feedVal) {
      feedSlider.value = SimEngine.getState().feedRate;
      feedVal.textContent = isMilling ? `${feedSlider.value} mm/gigi` : `${feedSlider.value} mm/put`;
      feedSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        feedVal.textContent = isMilling ? `${val.toFixed(2)} mm/gigi` : `${val.toFixed(2)} mm/put`;
        SimEngine.updateConfig({ feedRate: val });
        updateSimOutputs();
      };
    }

    // Auto-Calculate RPM Button
    const btnCalcRPM = document.getElementById("btn-calc-ideal-rpm");
    if (btnCalcRPM) {
      btnCalcRPM.onclick = () => {
        SoundEngine.playClick();
        const curState = SimEngine.getState();
        const mat = AppData.materials.find((m) => m.id === curState.materialId) || AppData.materials[0];
        const recCs = curState.toolId === "carbide" ? mat.csCarbide : mat.csHSS;
        const midCs = (recCs.min + recCs.max) / 2;
        // n = (1000 * Cs) / (pi * d)
        // Pada mesin frais, d adalah diameter pisau endmill; pada mesin bubut, d adalah diameter benda kerja
        const effectiveDia = curState.machineType === "milling"
          ? (curState.endmillDia || 12)
          : (curState.diameter || 50);
        const idealRPM = Math.round((1000 * midCs) / (Math.PI * effectiveDia));
        const clampedRPM = Math.min(2200, Math.max(80, idealRPM));

        const rpmSlider = document.getElementById("slider-rpm");
        const rpmVal = document.getElementById("val-rpm");
        if (rpmSlider) rpmSlider.value = clampedRPM;
        if (rpmVal) rpmVal.textContent = `${clampedRPM} RPM`;

        SimEngine.updateConfig({ rpm: clampedRPM });
        updateSimOutputs();
        showToast(`⚡ Putaran Spindel diatur ke ${clampedRPM} RPM (Cs ideal: ${Math.round(midCs)} m/min, d: ${effectiveDia} mm)`, "success");
      };
    }

    // Depth of Cut slider
    const depthSlider = document.getElementById("slider-depth");
    const depthVal = document.getElementById("val-depth");
    if (depthSlider && depthVal) {
      depthSlider.value = SimEngine.getState().depthOfCut || 1.5;
      depthVal.textContent = `${depthSlider.value} mm`;
      depthSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        depthVal.textContent = `${val.toFixed(2)} mm`;
        SimEngine.updateConfig({ depthOfCut: val });
        updateSimOutputs();
      };
    }

    // Workpiece Length slider
    const lenSlider = document.getElementById("slider-length");
    const lenVal = document.getElementById("val-length");
    if (lenSlider && lenVal) {
      lenSlider.value = SimEngine.getState().length || 120;
      lenVal.textContent = `${lenSlider.value} mm`;
      lenSlider.oninput = (e) => {
        const val = parseInt(e.target.value);
        lenVal.textContent = `${val} mm`;
        SimEngine.updateConfig({ length: val });
        updateSimOutputs();
      };
    }

    // Coolant button in Operational Control Panel
    const btnCoolant = document.getElementById("btn-toggle-coolant");
    const txtCoolant = document.getElementById("txt-coolant-label");
    const paramCoolant = document.getElementById("param-coolant-status");
    if (btnCoolant) {
      const isCoolant = SimEngine.getState().coolant;
      if (isCoolant) {
        btnCoolant.className = "py-2.5 px-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white border border-cyan-400 font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md";
        if (txtCoolant) txtCoolant.textContent = "Coolant ON";
        btnCoolant.title = "Cairan Pendingin (Coolant) Aktif - Klik untuk mematikan";
      } else {
        btnCoolant.className = "py-2.5 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-400 border border-slate-700 font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md";
        if (txtCoolant) txtCoolant.textContent = "Coolant OFF";
        btnCoolant.title = "Cairan Pendingin (Coolant) Nonaktif - Klik untuk menyalakan";
      }

      if (paramCoolant) {
        paramCoolant.className = isCoolant
          ? "px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 border border-cyan-200 text-cyan-700"
          : "px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-500";
        paramCoolant.textContent = isCoolant ? "💧 Aktif (Panel Bawah)" : "🚫 Nonaktif (Panel Bawah)";
      }

      btnCoolant.onclick = () => {
        SoundEngine.playClick();
        const newState = !SimEngine.getState().coolant;
        SimEngine.updateConfig({ coolant: newState });
        setupSimulationControls();
        updateSimOutputs();
        if (typeof lucide !== "undefined") lucide.createIcons();
        showToast(newState ? "💧 Cairan Pendingin (Coolant) Dinyalakan" : "🚫 Cairan Pendingin (Coolant) Dimatikan", "info");
      };
    }

    // Action buttons (Start, AutoFeed, Stop, Reset, Emergency)
    const btnStart = document.getElementById("btn-sim-start");
    const btnAutoFeed = document.getElementById("btn-toggle-autofeed");
    const btnStop = document.getElementById("btn-sim-stop");
    const btnReset = document.getElementById("btn-sim-reset");
    const btnEmergency = document.getElementById("btn-sim-emergency");

    if (btnStart) {
      btnStart.onclick = () => {
        SimEngine.start(true);
        updateSimOutputs();
        showToast("▶ Siklus Pemotongan Dimulai (Pemakanan Otomatis Aktif)", "success");
      };
    }
    if (btnAutoFeed) {
      btnAutoFeed.onclick = () => {
        SoundEngine.playClick();
        const active = SimEngine.toggleAutoFeed();
        updateSimOutputs();
        if (typeof lucide !== "undefined") lucide.createIcons();
        if (active) {
          showToast("⚙ Pemakanan Otomatis DIAKTIFKAN", "success");
        } else {
          showToast("✋ Pemakanan Otomatis DINONAKTIFKAN (Mode Manual)", "info");
        }
      };
    }
    if (btnStop) {
      btnStop.onclick = () => {
        SimEngine.stop();
        updateSimOutputs();
        showToast("⏸ Pemotongan Dijeda", "info");
      };
    }
    if (btnReset) {
      btnReset.onclick = () => {
        SimEngine.reset();
        updateSimOutputs();
        showToast("🔄 Posisi Pahat & Benda Kerja Direset ke Awal", "info");
      };
    }
    if (btnEmergency) {
      btnEmergency.onclick = () => {
        SoundEngine.playAlarm();
        SimEngine.stop();
        updateSimOutputs();
        showToast("🚨 SAKELAR EMERGENCY STOP DIAKTIFKAN!", "danger");
      };
    }

    // Step Size Selector for Manual Axis Feed
    let jogStep = 0.5;
    const stepBtns = document.querySelectorAll(".btn-step-size");
    const txtOverlayStep = document.getElementById("txt-overlay-step");
    const btnOverlayStep = document.getElementById("btn-overlay-step");

    function setJogStep(step) {
      jogStep = step;
      stepBtns.forEach((b) => {
        if (Math.abs(parseFloat(b.dataset.step) - step) < 0.05) {
          b.classList.add("active", "bg-blue-600", "text-white");
          b.classList.remove("text-slate-300");
        } else {
          b.classList.remove("active", "bg-blue-600", "text-white");
          b.classList.add("text-slate-300");
        }
      });
      if (txtOverlayStep) {
        txtOverlayStep.textContent = `${step.toFixed(1)}`;
      }
    }

    stepBtns.forEach((btn) => {
      btn.onclick = () => {
        SoundEngine.playClick();
        const s = parseFloat(btn.dataset.step) || 0.5;
        setJogStep(s);
      };
    });

    if (btnOverlayStep) {
      const stepOptions = [0.1, 0.5, 1.0];
      btnOverlayStep.onclick = () => {
        SoundEngine.playClick();
        let curIdx = stepOptions.findIndex((val) => Math.abs(val - jogStep) < 0.05);
        if (curIdx === -1) curIdx = 1;
        const nextIdx = (curIdx + 1) % stepOptions.length;
        setJogStep(stepOptions[nextIdx]);
        showToast(`⚡ Langkah Axis Jog diatur ke ${stepOptions[nextIdx]} mm`, "info");
      };
    }

    // Helper for Manual Axis Feed (Jog)
    function executeAxisJog(axis, dir) {
      if (typeof SimEngine === "undefined") return;
      const res = SimEngine.jogAxis(axis, dir, jogStep);
      try { SoundEngine.playClick(); } catch (e) {}

      // Sync depth slider: Lathe uses X (radial infeed), Milling uses Z (knee vertical elevation)
      const isMilling = SimEngine.getState().machineType === "milling";
      if ((isMilling && axis === "Z") || (!isMilling && axis === "X")) {
        const dSlider = document.getElementById("slider-depth");
        const dVal = document.getElementById("val-depth");
        const displayVal = Math.max(0, res.value);
        if (dSlider) dSlider.value = displayVal;
        if (dVal) dVal.textContent = `${displayVal.toFixed(2)} mm`;
      }
      updateSimOutputs();
    }

    // Bind Axis Buttons with Click & Long-Press (Auto-Repeat)
    function bindAxisJogBtn(btnId, axis, dir) {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      let repeatTimer = null;
      let repeatInterval = null;

      const start = (e) => {
        e.preventDefault();
        executeAxisJog(axis, dir);

        if (repeatTimer) clearTimeout(repeatTimer);
        if (repeatInterval) clearInterval(repeatInterval);

        // Press & hold repeat after 320ms
        repeatTimer = setTimeout(() => {
          repeatInterval = setInterval(() => {
            executeAxisJog(axis, dir);
          }, 90);
        }, 320);
      };

      const end = () => {
        if (repeatTimer) { clearTimeout(repeatTimer); repeatTimer = null; }
        if (repeatInterval) { clearInterval(repeatInterval); repeatInterval = null; }
      };

      btn.onclick = (e) => {
        executeAxisJog(axis, dir);
      };

      btn.onmousedown = start;
      btn.onmouseup = end;
      btn.onmouseleave = end;
      btn.ontouchstart = start;
      btn.ontouchend = end;
      btn.ontouchcancel = end;
    }

    // Bottom panel axis buttons
    bindAxisJogBtn("btn-axis-x-minus", "X", -1); // X- Maju (Potong) / Kiri
    bindAxisJogBtn("btn-axis-x-plus", "X", 1);   // X+ Mundur (Bebas) / Kanan
    bindAxisJogBtn("btn-axis-y-minus", "Y", -1); // Y- Sadel Mundur
    bindAxisJogBtn("btn-axis-y-plus", "Y", 1);   // Y+ Sadel Maju
    bindAxisJogBtn("btn-axis-z-minus", "Z", -1); // Z- Ke Kiri (Makan) / Turun
    bindAxisJogBtn("btn-axis-z-plus", "Z", 1);   // Z+ Ke Kanan (Ekor) / Naik

    // Floating On-Screen Jog Pendant Overlay buttons
    bindAxisJogBtn("btn-overlay-axis-x-minus", "X", -1);
    bindAxisJogBtn("btn-overlay-axis-x-plus", "X", 1);
    bindAxisJogBtn("btn-overlay-axis-y-minus", "Y", -1);
    bindAxisJogBtn("btn-overlay-axis-y-plus", "Y", 1);
    bindAxisJogBtn("btn-overlay-axis-z-minus", "Z", -1);
    bindAxisJogBtn("btn-overlay-axis-z-plus", "Z", 1);

    // Floating Jog Overlay: Collapse & Expand Toggle
    const btnJogCollapse = document.getElementById("btn-jog-collapse");
    const btnJogExpand = document.getElementById("btn-jog-expand");
    const jogPendantPanel = document.getElementById("jog-pendant-panel");

    if (btnJogCollapse && btnJogExpand && jogPendantPanel) {
      // Auto-collapse jog pendant on mobile smartphone screens (< 640px) so 3D viewport is completely unobstructed
      if (window.innerWidth < 640) {
        jogPendantPanel.classList.add("hidden");
        btnJogExpand.classList.remove("hidden");
        btnJogExpand.classList.add("flex");
      }

      btnJogCollapse.onclick = (e) => {
        e.stopPropagation();
        SoundEngine.playClick();
        jogPendantPanel.classList.add("hidden");
        btnJogExpand.classList.remove("hidden");
        btnJogExpand.classList.add("flex");
      };
      btnJogExpand.onclick = (e) => {
        e.stopPropagation();
        SoundEngine.playClick();
        jogPendantPanel.classList.remove("hidden");
        btnJogExpand.classList.add("hidden");
        btnJogExpand.classList.remove("flex");
      };
    }

    // Floating Jog Overlay: Quick Spindle Start/Pause & Auto-Feed Toggle
    const btnOverlayStart = document.getElementById("btn-overlay-sim-start");
    const btnOverlayAutoFeed = document.getElementById("btn-overlay-autofeed");

    if (btnOverlayStart) {
      btnOverlayStart.onclick = () => {
        SoundEngine.playClick();
        const isRun = SimEngine.isRunning();
        if (isRun) {
          SimEngine.stop();
          updateSimOutputs();
          showToast("⏸ Pemotongan Dijeda", "info");
        } else {
          SimEngine.start(true);
          updateSimOutputs();
          showToast("▶ Siklus Pemotongan Dimulai", "success");
        }
      };
    }

    if (btnOverlayAutoFeed) {
      btnOverlayAutoFeed.onclick = () => {
        SoundEngine.playClick();
        const active = SimEngine.toggleAutoFeed();
        updateSimOutputs();
        if (typeof lucide !== "undefined") lucide.createIcons();
        if (active) {
          showToast("⚙ Pemakanan Otomatis DIAKTIFKAN", "success");
        } else {
          showToast("✋ Pemakanan Otomatis DINONAKTIFKAN (Mode Manual)", "info");
        }
      };
    }

    // Keyboard Shortcuts for Manual Feed (register only once)
    if (!simKeydownBound) {
      simKeydownBound = true;
      window.addEventListener("keydown", (e) => {
        // Don't trigger if user is typing in an input, textarea or select
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

        const curMachine = SimEngine.getState().machineType;
        let targetBtnId = null;
        let axis = null;
        let dir = 0;

        if (curMachine === "milling") {
          // Frais: Sumbu X = ArrowLeft/Right, Sumbu Y = ArrowDown/Up, Sumbu Z = PageDown/PageUp atau S/W
          if (e.key === "ArrowLeft") {
            targetBtnId = "btn-axis-x-minus";
            axis = "X";
            dir = -1;
          } else if (e.key === "ArrowRight") {
            targetBtnId = "btn-axis-x-plus";
            axis = "X";
            dir = 1;
          } else if (e.key === "ArrowDown") {
            targetBtnId = "btn-axis-y-minus";
            axis = "Y";
            dir = -1;
          } else if (e.key === "ArrowUp") {
            targetBtnId = "btn-axis-y-plus";
            axis = "Y";
            dir = 1;
          } else if (e.key === "PageDown" || e.key === "s" || e.key === "S") {
            targetBtnId = "btn-axis-z-minus";
            axis = "Z";
            dir = -1;
          } else if (e.key === "PageUp" || e.key === "w" || e.key === "W") {
            targetBtnId = "btn-axis-z-plus";
            axis = "Z";
            dir = 1;
          }
        } else {
          // Bubut: Sumbu X = ArrowDown/Up, Sumbu Z = ArrowLeft/Right
          if (e.key === "ArrowDown") {
            targetBtnId = "btn-axis-x-minus";
            axis = "X";
            dir = -1;
          } else if (e.key === "ArrowUp") {
            targetBtnId = "btn-axis-x-plus";
            axis = "X";
            dir = 1;
          } else if (e.key === "ArrowLeft") {
            targetBtnId = "btn-axis-z-minus";
            axis = "Z";
            dir = -1;
          } else if (e.key === "ArrowRight") {
            targetBtnId = "btn-axis-z-plus";
            axis = "Z";
            dir = 1;
          }
        }

        if (axis && dir) {
          e.preventDefault();
          executeAxisJog(axis, dir);
          if (targetBtnId) {
            const b = document.getElementById(targetBtnId);
            if (b) {
              b.classList.add("is-active");
              setTimeout(() => b.classList.remove("is-active"), 120);
            }
            const ovBtn = document.getElementById(targetBtnId.replace("btn-axis-", "btn-overlay-axis-"));
            if (ovBtn) {
              ovBtn.classList.add("ring-2", "ring-white", "scale-95");
              setTimeout(() => ovBtn.classList.remove("ring-2", "ring-white", "scale-95"), 120);
            }
          }
        }
      });
    }

    updateSimOutputs();
    if (window.lucide) lucide.createIcons();
  }

  // Periodic DRO updater when cutting
  setInterval(() => {
    if (typeof SimEngine !== "undefined" && SimEngine.isRunning()) {
      updateSimOutputs();
    }
  }, 100);

  function updateSimOutputs() {
    const state = SimEngine.getState();
    const evalData = state.evaluation;

    // Display Calculated actual Cs
    const csDisplay = document.getElementById("display-calculated-cs");
    if (csDisplay) {
      csDisplay.textContent = `${evalData.csActual} m/min`;
    }

    // Display Machining Time
    const timeDisplay = document.getElementById("display-machining-time");
    if (timeDisplay) {
      const mins = Math.floor(evalData.cuttingTimeMin);
      const secs = Math.round((evalData.cuttingTimeMin - mins) * 60);
      timeDisplay.textContent = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }

    // Roughness Ra
    const raDisplay = document.getElementById("display-surface-ra");
    if (raDisplay) {
      raDisplay.textContent = `${evalData.ra} µm Ra`;
    }

    // Update Mobile Quick Parameter Strip in Viewport
    const mobStripMat = document.getElementById("mob-strip-mat");
    const mobStripTool = document.getElementById("mob-strip-tool");
    const mobStripRpm = document.getElementById("mob-strip-rpm");
    if (mobStripMat) {
      const mat = (typeof AppData !== "undefined" && AppData.materials)
        ? AppData.materials.find((m) => m.id === state.materialId)
        : null;
      mobStripMat.textContent = mat ? mat.name.split(" ")[0] : "Baja";
    }
    if (mobStripTool) {
      mobStripTool.textContent = state.toolId === "carbide" ? "Karbida" : "HSS";
    }
    if (mobStripRpm) {
      mobStripRpm.textContent = `${state.rpm} RPM`;
    }

    // Update DRO (Digital Readout) Displays
    const droX = document.getElementById("dro-axis-x");
    const droY = document.getElementById("dro-axis-y");
    const droZ = document.getElementById("dro-axis-z");
    const droSpindle = document.getElementById("dro-spindle-state");

    // Floating Overlay DRO Displays
    const overlayDroX = document.getElementById("overlay-dro-x");
    const overlayDroY = document.getElementById("overlay-dro-y");
    const overlayDroZ = document.getElementById("overlay-dro-z");
    const jogMiniDro = document.getElementById("jog-mini-dro");

    const isMilling = state.machineType === "milling";
    let displayX = "0.00";
    let displayY = "0.00";
    let displayZ = "0.00";

    if (droX || overlayDroX) {
      if (isMilling) {
        const valX = (typeof state.axisX === "number" ? state.axisX : 0).toFixed(2);
        displayX = (state.axisX >= 0 ? "+" : "") + valX;
        if (droX) {
          droX.textContent = displayX;
          droX.parentElement.setAttribute("title", `Sumbu X: Posisi Memanjang Meja ${valX} mm`);
        }
        if (overlayDroX) overlayDroX.textContent = displayX;
      } else {
        const depth = state.depthOfCut || 1.5;
        const turnedDia = Math.max(0, state.diameter - (depth * 2));
        displayX = `+${depth.toFixed(2)}`;
        if (droX) {
          droX.textContent = displayX;
          droX.parentElement.setAttribute("title", `Sumbu X: Kedalaman Potong ${depth.toFixed(2)} mm (Diameter hasil: Ø ${turnedDia.toFixed(2)} mm)`);
        }
        if (overlayDroX) overlayDroX.textContent = displayX;
      }
    }

    if (droY || overlayDroY) {
      const valY = (typeof state.axisY === "number" ? state.axisY : 0).toFixed(2);
      displayY = (state.axisY >= 0 ? "+" : "") + valY;
      if (droY) {
        droY.textContent = displayY;
        droY.parentElement.setAttribute("title", `Sumbu Y: Posisi Melintang Sadel ${valY} mm`);
      }
      if (overlayDroY) overlayDroY.textContent = displayY;
    }

    if (droZ || overlayDroZ) {
      if (isMilling) {
        const valZ = (typeof state.axisZ === "number" ? state.axisZ : 0).toFixed(2);
        displayZ = (state.axisZ >= 0 ? "+" : "") + valZ;
        if (droZ) {
          droZ.textContent = displayZ;
          droZ.parentElement.setAttribute("title", `Sumbu Z: Posisi Vertikal Lutut ${valZ} mm`);
        }
        if (overlayDroZ) overlayDroZ.textContent = displayZ;
      } else {
        const currentZmm = (state.cutProgress * (state.length || 120)).toFixed(1);
        displayZ = `${currentZmm}`;
        if (droZ) {
          droZ.textContent = displayZ;
          droZ.parentElement.setAttribute("title", `Sumbu Z: Panjang Pemotongan ${currentZmm} mm dari total ${state.length || 120} mm`);
        }
        if (overlayDroZ) overlayDroZ.textContent = displayZ;
      }
    }

    // Minimized Floating Pill Mini-DRO summary
    if (jogMiniDro) {
      jogMiniDro.textContent = isMilling ? `X:${displayX} Y:${displayY} Z:${displayZ}` : `X:${displayX} Z:${displayZ}`;
    }

    // Update Auto-Feed Button State (Bottom Panel)
    const btnAutoFeed = document.getElementById("btn-toggle-autofeed");
    const txtAutoFeed = document.getElementById("txt-autofeed-status");
    if (btnAutoFeed && txtAutoFeed) {
      if (state.isAutoFeed) {
        btnAutoFeed.className = "py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border border-indigo-400 font-extrabold text-xs shadow-md shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer";
        txtAutoFeed.innerHTML = `<span>Pemakanan Otomatis</span> <span class="bg-indigo-950/80 px-1.5 py-0.5 rounded text-[10px] text-emerald-300 font-mono tracking-wider font-black">ON</span>`;
        btnAutoFeed.title = "Pemakanan Otomatis AKTIF - Klik untuk mematikan dan beralih ke kontrol manual";
      } else {
        btnAutoFeed.className = "py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 border border-slate-700 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer";
        txtAutoFeed.innerHTML = `<span>Pemakanan Otomatis</span> <span class="bg-slate-700/80 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono tracking-wider font-black">OFF</span>`;
        btnAutoFeed.title = "Pemakanan Otomatis NONAKTIF (Mode Manual Pahat) - Klik untuk mengaktifkan pemakanan otomatis";
      }
    }

    // Update Floating Overlay Auto-Feed Button
    const btnOverlayAutoFeed = document.getElementById("btn-overlay-autofeed");
    const txtOverlayAutoFeed = document.getElementById("txt-overlay-autofeed");
    if (btnOverlayAutoFeed && txtOverlayAutoFeed) {
      const isAutoStr = String(state.isAutoFeed);
      if (btnOverlayAutoFeed.dataset.autofeed !== isAutoStr) {
        btnOverlayAutoFeed.dataset.autofeed = isAutoStr;
        if (state.isAutoFeed) {
          btnOverlayAutoFeed.className = "py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs";
          txtOverlayAutoFeed.textContent = "Auto ON";
          btnOverlayAutoFeed.title = "Pemakanan Otomatis AKTIF - Klik untuk mematikan";
        } else {
          btnOverlayAutoFeed.className = "py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer";
          txtOverlayAutoFeed.textContent = "Auto OFF";
          btnOverlayAutoFeed.title = "Pemakanan Otomatis NONAKTIF - Klik untuk mengaktifkan";
        }
      }
    }

    // Update Floating Overlay Spindle Start / Pause Button
    const btnOverlayStart = document.getElementById("btn-overlay-sim-start");
    if (btnOverlayStart) {
      const isRunStr = String(state.isRunning);
      if (btnOverlayStart.dataset.running !== isRunStr) {
        btnOverlayStart.dataset.running = isRunStr;
        if (state.isRunning) {
          btnOverlayStart.className = "flex-1 py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer";
          btnOverlayStart.innerHTML = `<i data-lucide="pause" class="w-3 h-3 fill-current"></i><span>Jeda</span>`;
          btnOverlayStart.title = "Jeda Putaran Spindel (Klik untuk menghentikan putaran)";
        } else {
          btnOverlayStart.className = "flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer";
          btnOverlayStart.innerHTML = `<i data-lucide="play" class="w-3 h-3 fill-current"></i><span>Mulai</span>`;
          btnOverlayStart.title = "Mulai Putaran Spindel & Siklus Pemotongan";
        }
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }

    if (droSpindle) {
      if (state.isRunning) {
        const feedBadge = state.isAutoFeed
          ? `<span class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">AUTO</span>`
          : `<span class="bg-amber-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">MANUAL</span>`;
        droSpindle.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span> <span class="text-emerald-400 font-bold">${state.rpm} RPM</span> ${feedBadge}`;
      } else {
        droSpindle.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> <span class="text-slate-400 font-semibold">STANDBY</span>`;
      }
    }

    // Workpiece quality status box
    const statusBox = document.getElementById("sim-status-box");
    const statusTitle = document.getElementById("sim-status-title");
    const statusDesc = document.getElementById("sim-status-desc");

    if (statusBox && statusTitle && statusDesc) {
      statusTitle.textContent = evalData.title;
      statusDesc.textContent = evalData.desc;

      if (evalData.status === "OPTIMAL") {
        statusBox.className = "p-4 rounded-xl border border-emerald-300 bg-emerald-50/80 transition-all";
        statusTitle.className = "font-bold text-sm text-emerald-800";
      } else if (evalData.status === "BURNT") {
        statusBox.className = "p-4 rounded-xl border border-red-300 bg-red-50/80 transition-all";
        statusTitle.className = "font-bold text-sm text-red-800";
      } else if (evalData.status === "CHATTER") {
        statusBox.className = "p-4 rounded-xl border border-amber-300 bg-amber-50/80 transition-all";
        statusTitle.className = "font-bold text-sm text-amber-800";
      } else {
        statusBox.className = "p-4 rounded-xl border border-blue-300 bg-blue-50/80 transition-all";
        statusTitle.className = "font-bold text-sm text-blue-800";
      }
    }
  }

  // ==================== QUIZ & EVALUASI CONTROLLER ====================
  function toggleQuiz1FormulaCard() {
    const card = document.getElementById("quiz1-formula-card");
    const txt = document.getElementById("btn-toggle-formula-text");
    if (!card) return;
    const isHidden = card.classList.contains("hidden");
    if (isHidden) {
      card.classList.remove("hidden");
      if (txt) txt.textContent = "Sembunyikan Rumus Acuan";
    } else {
      card.classList.add("hidden");
      if (txt) txt.textContent = "Lihat Rumus Acuan";
    }
  }

  function switchQuizPackage(tabId) {
    currentQuizTab = tabId || "quiz1";

    const tabLk1 = document.getElementById("tab-quiz-lk1");
    const tabComp = document.getElementById("tab-quiz-comprehensive");
    const bannerLk1 = document.getElementById("quiz1-intro-banner");
    const formulaCard = document.getElementById("quiz1-formula-card");
    const attachmentCard = document.getElementById("quiz1-attachment-card");
    const titleEl = document.getElementById("quiz-screen-title");
    const subtitleEl = document.getElementById("quiz-screen-subtitle");

    if (currentQuizTab === "quiz1") {
      if (tabLk1) {
        tabLk1.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm";
      }
      if (tabComp) {
        tabComp.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
      }
      if (bannerLk1) bannerLk1.classList.remove("hidden");
      if (attachmentCard) attachmentCard.classList.remove("hidden");
      if (titleEl) titleEl.textContent = "Quiz 1: Perhitungan Parameter Bubut (LK-1)";
      if (subtitleEl) subtitleEl.textContent = "Kerjakan 10 butir soal perhitungan parameter pemotongan poros ST-37, aluminium finishing, dan optimasi baja S45C.";
    } else {
      if (tabLk1) {
        tabLk1.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
      }
      if (tabComp) {
        tabComp.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm";
      }
      if (bannerLk1) bannerLk1.classList.add("hidden");
      if (formulaCard) formulaCard.classList.add("hidden");
      if (attachmentCard) attachmentCard.classList.add("hidden");
      if (titleEl) titleEl.textContent = "Uji Kompetensi Mandiri (Teori & Kasus)";
      if (subtitleEl) subtitleEl.textContent = "Uji kemampuan kognitif K3, anatomi mesin, dan kalkulasi parameter bubut & frais secara komprehensif.";
    }

    // Update active state on sidebar navigation
    document.querySelectorAll(".sidebar-nav-item").forEach((btn) => {
      if (btn.dataset.target === "screen-quiz") {
        if (btn.dataset.quizTab === currentQuizTab) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });

    renderQuizScreen();
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function resetQuizAnswers(tabId) {
    if (tabId === "quiz1") {
      userData.quiz1Answers = {};
      showToast("Jawaban Quiz 1 berhasil direset. Silakan berlatih kembali!", "info");
    } else {
      userData.quizAnswers = {};
      showToast("Jawaban Uji Kompetensi berhasil direset. Silakan berlatih kembali!", "info");
    }
    saveUserData();
    renderQuizScreen();
  }

  // Render Quiz Challenges (Mendukung Quiz 1: LK-1 Parameter Bubut & Uji Kompetensi Komprehensif)
  function renderQuizScreen() {
    const container = document.getElementById("quiz-questions-container");
    const summaryEl = document.getElementById("quiz-summary-box");
    if (!container) return;
    container.innerHTML = "";
    if (summaryEl) {
      summaryEl.classList.add("hidden");
      summaryEl.innerHTML = "";
    }

    const isQuiz1 = currentQuizTab === "quiz1";
    const questions = isQuiz1 ? (AppData.quiz1Challenges || []) : (AppData.quizChallenges || []);
    if (!userData.quiz1Answers || typeof userData.quiz1Answers !== "object") userData.quiz1Answers = {};
    if (!userData.quizAnswers || typeof userData.quizAnswers !== "object") userData.quizAnswers = {};
    const answersMap = isQuiz1 ? userData.quiz1Answers : userData.quizAnswers;

    let lastCaseNum = null;

    questions.forEach((q, idx) => {
      // Render Header Kartu Kasus (Khusus Quiz 1) saat masuk babak kasus baru
      if (isQuiz1 && q.caseNum && q.caseNum !== lastCaseNum) {
        lastCaseNum = q.caseNum;
        const caseHeader = document.createElement("div");
        caseHeader.className = "p-4 sm:p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 mb-3 shadow-xs";
        caseHeader.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              K${q.caseNum}
            </div>
            <div class="flex-1">
              <h3 class="font-black text-sm sm:text-base text-amber-950 dark:text-amber-100">
                ${q.caseTitle || ("Studi Kasus " + q.caseNum)}
              </h3>
              ${q.caseDescription ? `
                <div class="mt-2 p-3 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans shadow-2xs">
                  ${q.caseDescription}
                </div>
              ` : ""}
            </div>
          </div>
        `;
        container.appendChild(caseHeader);
      }

      const card = document.createElement("div");
      card.className = "mat-card mb-4";
      const isAnswered = answersMap[q.id] !== undefined;
      const selectedOpt = answersMap[q.id];

      let optionsHtml = "";
      q.options.forEach((opt, optIdx) => {
        let optClass = "p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all mb-2 flex items-center justify-between ";
        if (isAnswered) {
          if (optIdx === q.correct) {
            optClass += "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold";
          } else if (optIdx === selectedOpt) {
            optClass += "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200 font-bold";
          } else {
            optClass += "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60";
          }
        } else {
          optClass += "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800";
        }

        optionsHtml += `
          <div class="${optClass}" data-qid="${q.id}" data-opt="${optIdx}">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-200 flex-shrink-0">
                ${String.fromCharCode(65 + optIdx)}
              </span>
              <span>${opt}</span>
            </div>
            ${
              isAnswered && optIdx === q.correct
                ? '<span class="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 flex-shrink-0"><i data-lucide="check" class="w-3.5 h-3.5"></i> Benar</span>'
                : isAnswered && optIdx === selectedOpt
                ? '<span class="text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1 flex-shrink-0"><i data-lucide="x" class="w-3.5 h-3.5"></i> Salah</span>'
                : ""
            }
          </div>
        `;
      });

      card.innerHTML = `
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="mat-badge mat-badge-primary">
              ${isQuiz1 ? 'LK-1 Parameter Bubut' : ('Level ' + q.level)} • ${q.category}
            </span>
            <span class="text-xs text-slate-400 font-medium">Soal ${idx + 1} dari ${questions.length}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-800 dark:text-white mb-3 leading-snug">${q.question}</h4>
          ${q.formulaHint ? `
            <div class="mb-3 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 font-mono flex items-center gap-2">
              <i data-lucide="lightbulb" class="w-4 h-4 text-amber-500 flex-shrink-0"></i>
              <span>Rumus Petunjuk: <strong>${q.formulaHint}</strong></span>
            </div>
          ` : ""}
          <div class="options-group">${optionsHtml}</div>
          ${
            isAnswered
              ? `<div class="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div class="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5 text-blue-600"></i>
                    <span>Pembahasan & Langkah Perhitungan:</span>
                  </div>
                  <div class="whitespace-pre-line">${q.explanation}</div>
                </div>`
              : ""
          }
        </div>
      `;

      // Option click event
      if (!isAnswered) {
        card.querySelectorAll(".options-group > div").forEach((optEl) => {
          optEl.onclick = () => {
            const qid = optEl.dataset.qid;
            const chosen = parseInt(optEl.dataset.opt);
            answersMap[qid] = chosen;

            if (chosen === q.correct) {
              try { SoundEngine.playSuccess(); } catch (e) {}
              addXP(50);
              showToast("Jawaban Benar! +50 XP", "success");
            } else {
              try { SoundEngine.playWarning(); } catch (e) {}
              showToast("Jawaban Kurang Tepat!", "danger");
            }
            saveUserData();
            renderQuizScreen();
          };
        });
      }

      container.appendChild(card);
    });

    // Check if all questions in the current package are answered
    const totalQ = questions.length;
    const answeredCount = Object.keys(answersMap).filter(id => questions.some(q => q.id === id)).length;
    const correctCount = questions.filter(q => answersMap[q.id] === q.correct).length;

    if (summaryEl && answeredCount === totalQ && totalQ > 0) {
      summaryEl.classList.remove("hidden");
      const isAdmin = userData.role === "admin";
      const scorePct = Math.round((correctCount / totalQ) * 100);

      // Quiz 1 Summary Table HTML
      let summaryTableHtml = "";
      if (isQuiz1 && AppData.quiz1SummaryTable) {
        summaryTableHtml = `
          <div class="mt-4 bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <div class="flex items-center gap-2 mb-2 font-bold text-xs text-slate-800 dark:text-white">
              <i data-lucide="table" class="w-4 h-4 text-amber-600"></i>
              <span>Tabel Rangkuman Hasil Perhitungan Lembar Kerja 1 (LK-1)</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-amber-50/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-amber-200 dark:border-slate-700">
                    <th class="p-2 font-bold">Kasus / Benda Kerja</th>
                    <th class="p-2 font-bold">Parameter Acuan</th>
                    <th class="p-2 font-bold font-mono">n (RPM)</th>
                    <th class="p-2 font-bold font-mono">tm (menit)</th>
                    <th class="p-2 font-bold font-mono">MRR (mm³/min)</th>
                    <th class="p-2 font-bold">Analisis Rekayasa</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  ${AppData.quiz1SummaryTable.map(row => `
                    <tr>
                      <td class="p-2 font-semibold text-slate-800 dark:text-white">${row.soal}</td>
                      <td class="p-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">${row.parameter}</td>
                      <td class="p-2 font-bold font-mono text-blue-600 dark:text-blue-400">${row.n}</td>
                      <td class="p-2 font-bold font-mono text-amber-600 dark:text-amber-400">${row.tm}</td>
                      <td class="p-2 font-bold font-mono text-emerald-600 dark:text-emerald-400">${row.mrr}</td>
                      <td class="p-2 text-[11px] text-slate-500 dark:text-slate-400">${row.catatan}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      summaryEl.innerHTML = `
        <div class="p-5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 flex flex-col gap-4 shadow-sm animate-in fade-in duration-200">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[11px] font-bold mb-1">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-blue-600"></i>
                <span>${isQuiz1 ? 'Quiz 1: Parameter Bubut Selesai' : 'Uji Kompetensi Mandiri Selesai'}</span>
              </div>
              <h4 class="font-extrabold text-base text-slate-900 dark:text-white">Hasil Evaluasi Pembelajaran</h4>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Skor Akhir: <strong class="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">${correctCount} / ${totalQ} Benar (${scorePct}%)</strong>
                — Predikat: <span class="font-bold ${scorePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">${scorePct >= 75 ? 'LULUS (KOMPETEN)' : 'PERLU PENGAYAAN'}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                onclick="App.resetQuizAnswers('${currentQuizTab}')" 
                class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Ulangi pengerjaan kuis ini untuk latihan kembali"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>Ulangi Quiz</span>
              </button>
              ${
                isAdmin
                  ? `<button onclick="App.printLKPD()" class="mat-btn mat-btn-primary admin-only-feature">
                      <i data-lucide="printer" class="w-4 h-4"></i>
                      <span>Cetak / Unduh LKPD Digital (PDF)</span>
                    </button>`
                  : `<div class="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800">
                      <i data-lucide="award" class="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i>
                      <span>Evaluasi Tersimpan</span>
                    </div>`
              }
            </div>
          </div>

          ${summaryTableHtml}

          <!-- Google Sheets Real-Time Sync Section -->
          <div class="pt-3 border-t border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/40 p-3 rounded-xl">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-white">Rekapitulasi Nilai ke Spreadsheet Guru</div>
                <div id="sync-status-quiz" class="text-[11px] text-slate-500 dark:text-slate-400">
                  ${isQuiz1 ? 'Kirim jawaban 10 butir Quiz 1, skor evaluasi, dan berkas lampiran pekerjaan siswa ke Google Sheets & Google Drive kelas.' : 'Kirim skor Uji Kompetensi, keselamatan K3, dan parameter simulasi ke Google Sheets kelas.'}
                </div>
              </div>
            </div>
            <button 
              id="btn-sync-grades-quiz" 
              onclick="${isQuiz1 ? 'App.sendQuiz1ToSpreadsheet()' : 'App.sendGradesToSpreadsheet()'}" 
              class="self-stretch sm:self-auto py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>${isQuiz1 ? 'Kirim Jawaban & Lampiran ke Spreadsheet' : 'Kirim Nilai ke Spreadsheet Guru'}</span>
            </button>
          </div>
        </div>
      `;
      if (scorePct >= 75) {
        unlockBadge("quiz_master", "Master Teori Pemesinan");
      }
    }

    renderQuiz1AttachmentUI();

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  // Kirim nilai kuis & simulasi ke Google Sheets Webhook
  async function sendGradesToSpreadsheet() {
    const btn = document.getElementById("btn-sync-grades-quiz");
    const statusEl = document.getElementById("sync-status-quiz");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Sedang Mengirim...</span>';
      if (window.lucide) lucide.createIcons();
    }
    if (statusEl) {
      statusEl.textContent = "Menghubungkan ke Google Sheets...";
      statusEl.className = "text-[11px] text-blue-600 dark:text-blue-400 font-medium";
    }

    if (typeof SyncManager === "undefined") {
      showToast("Modul sinkronisasi belum dimuat.", "danger");
      return;
    }

    const res = await SyncManager.submitGrade();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Kirim Ulang Nilai</span>';
      if (window.lucide) lucide.createIcons();
    }

    if (res.success) {
      showToast("Berhasil! Nilai Anda telah tercatat di Spreadsheet Guru.", "success");
      try { SoundEngine.playSuccess(); } catch (e) {}
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> ${res.message}</span>`;
        if (window.lucide) lucide.createIcons();
      }
    } else if (res.noUrl) {
      showToast("URL Spreadsheet belum disetel oleh Guru. Nilai tersimpan di lab ini.", "info");
      if (statusEl) {
        statusEl.innerHTML = '<span class="text-amber-700 dark:text-amber-300 flex items-center gap-1"><i data-lucide="info" class="w-3.5 h-3.5"></i> Webhook Google Sheets belum diisi oleh Guru</span>';
        if (window.lucide) lucide.createIcons();
      }
    } else {
      showToast("Gagal mengirim nilai: " + res.message, "danger");
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-red-600 dark:text-red-400 flex items-center gap-1"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Gagal: ${res.message}</span>`;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  // ==================== QUIZ 1 BERKAS LAMPIRAN & SINKRONISASI ====================
  function compressImageIfNeeded(file) {
    return new Promise((resolve, reject) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        if (file.size > 5 * 1024 * 1024) {
          return reject(new Error("Ukuran berkas PDF melebihi batas maksimal 5 MB."));
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            fileName: file.name,
            name: file.name,
            fileType: "application/pdf",
            type: "application/pdf",
            fileSize: file.size,
            size: file.size,
            fileData: e.target.result,
            dataUrl: e.target.result,
            uploadedAt: new Date().toLocaleString("id-ID")
          });
        };
        reader.onerror = () => reject(new Error("Gagal membaca berkas PDF."));
        reader.readAsDataURL(file);
        return;
      }

      if (!file.type.startsWith("image/")) {
        return reject(new Error("Format berkas tidak didukung. Harap gunakan foto/gambar (JPG/PNG/WebP) atau dokumen PDF."));
      }
      if (file.size > 10 * 1024 * 1024) {
        return reject(new Error("Ukuran foto melebihi batas maksimal 10 MB."));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          const base64Len = compressedDataUrl.length - (compressedDataUrl.indexOf(",") + 1);
          const estSize = Math.round((base64Len * 3) / 4);
          const finalName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

          resolve({
            fileName: finalName,
            name: finalName,
            fileType: "image/jpeg",
            type: "image/jpeg",
            fileSize: estSize,
            size: estSize,
            fileData: compressedDataUrl,
            dataUrl: compressedDataUrl,
            uploadedAt: new Date().toLocaleString("id-ID")
          });
        };
        img.onerror = () => reject(new Error("Gagal memproses file foto."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Gagal membaca elemen gambar."));
      reader.readAsDataURL(file);
    });
  }

  async function processQuiz1File(file) {
    if (!file) return;
    try {
      showToast("Sedang memproses dan mengompres berkas lampiran...", "info");
      const attachment = await compressImageIfNeeded(file);
      userData.quiz1Attachment = attachment;
      saveUserData();
      renderQuiz1AttachmentUI();
      showToast(`Berkas "${attachment.fileName}" berhasil dilampirkan!`, "success");
      try { SoundEngine.playSuccess(); } catch (e) {}
    } catch (err) {
      showToast(err.message || "Gagal melampirkan berkas.", "danger");
      try { SoundEngine.playAlarm(); } catch (e) {}
    }
  }

  function handleQuiz1FileUpload(event) {
    if (!event || !event.target || !event.target.files || !event.target.files[0]) return;
    processQuiz1File(event.target.files[0]);
  }

  function handleQuiz1DragOver(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dz = document.getElementById("quiz1-dropzone");
    if (dz) {
      dz.classList.add("border-amber-500", "bg-amber-100/50", "dark:bg-amber-950/40");
    }
  }

  function handleQuiz1DragLeave(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dz = document.getElementById("quiz1-dropzone");
    if (dz) {
      dz.classList.remove("border-amber-500", "bg-amber-100/50", "dark:bg-amber-950/40");
    }
  }

  function handleQuiz1Drop(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dz = document.getElementById("quiz1-dropzone");
    if (dz) {
      dz.classList.remove("border-amber-500", "bg-amber-100/50", "dark:bg-amber-950/40");
    }
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      processQuiz1File(event.dataTransfer.files[0]);
    }
  }

  function removeQuiz1Attachment() {
    userData.quiz1Attachment = null;
    const input = document.getElementById("quiz1-file-input");
    if (input) input.value = "";
    saveUserData();
    renderQuiz1AttachmentUI();
    showToast("Lampiran berkas Quiz 1 berhasil dihapus.", "info");
    try { SoundEngine.playClick(); } catch (e) {}
  }

  function renderQuiz1AttachmentUI() {
    const card = document.getElementById("quiz1-attachment-card");
    const dropzone = document.getElementById("quiz1-dropzone");
    const preview = document.getElementById("quiz1-attached-preview");
    const thumbBox = document.getElementById("quiz1-preview-thumb-box");
    const nameEl = document.getElementById("quiz1-preview-filename");
    const sizeEl = document.getElementById("quiz1-preview-filesize");
    const dateEl = document.getElementById("quiz1-preview-date");

    if (!card) return;

    if (currentQuizTab !== "quiz1") {
      card.classList.add("hidden");
      return;
    } else {
      card.classList.remove("hidden");
    }

    const att = userData.quiz1Attachment;
    if (att && att.fileData) {
      if (dropzone) dropzone.classList.add("hidden");
      if (preview) preview.classList.remove("hidden");
      if (nameEl) nameEl.textContent = att.fileName || "Lampiran_LK1.jpg";
      if (sizeEl) {
        const kb = Math.round((att.fileSize || 0) / 1024);
        sizeEl.textContent = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
      }
      if (dateEl) dateEl.textContent = att.uploadedAt || "Hari ini";

      if (thumbBox) {
        if (att.fileType && att.fileType.startsWith("image/")) {
          thumbBox.innerHTML = `<img src="${att.fileData}" alt="Thumbnail" class="w-full h-full object-cover">`;
        } else {
          thumbBox.innerHTML = `<i data-lucide="file-text" class="w-6 h-6 text-red-500"></i>`;
        }
      }
    } else {
      if (dropzone) dropzone.classList.remove("hidden");
      if (preview) preview.classList.add("hidden");
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function previewQuiz1Attachment() {
    const att = userData.quiz1Attachment;
    if (!att || !att.fileData) {
      showToast("Tidak ada berkas lampiran yang dapat ditampilkan.", "info");
      return;
    }

    const modal = document.getElementById("attachment-preview-modal");
    const titleEl = document.getElementById("attachment-modal-title");
    const metaEl = document.getElementById("attachment-modal-meta");
    const bodyEl = document.getElementById("attachment-modal-body");

    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.textContent = att.fileName || "Lampiran Pekerjaan Siswa";
    if (metaEl) {
      const kb = Math.round((att.fileSize || 0) / 1024);
      const szStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
      metaEl.textContent = `${att.fileType || "Berkas"} • ${szStr} • Diunggah: ${att.uploadedAt || "-"}`;
    }

    if (att.fileType && att.fileType.startsWith("image/")) {
      bodyEl.innerHTML = `
        <div class="max-w-full max-h-[70vh] flex items-center justify-center p-2">
          <img src="${att.fileData}" alt="Pratinjau Lampiran" class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-xl border border-slate-700/50">
        </div>
      `;
    } else if (att.fileType === "application/pdf" || (att.fileName && att.fileName.toLowerCase().endsWith(".pdf"))) {
      bodyEl.innerHTML = `
        <iframe src="${att.fileData}" class="w-full h-[65vh] rounded-xl border border-slate-700/50 bg-white" title="Pratinjau PDF"></iframe>
      `;
    } else {
      bodyEl.innerHTML = `
        <div class="text-center p-8 text-slate-400">
          <i data-lucide="file-question" class="w-12 h-12 mx-auto mb-2 text-slate-500"></i>
          <p>Pratinjau langsung tidak tersedia untuk tipe berkas ini.</p>
        </div>
      `;
    }

    modal.classList.remove("hidden");
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function closeAttachmentPreview() {
    const modal = document.getElementById("attachment-preview-modal");
    if (modal) modal.classList.add("hidden");
    const bodyEl = document.getElementById("attachment-modal-body");
    if (bodyEl) bodyEl.innerHTML = "";
  }

  async function sendQuiz1ToSpreadsheet() {
    const btn = document.getElementById("btn-sync-grades-quiz");
    const statusEl = document.getElementById("sync-status-quiz");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Sedang Mengunggah...</span>';
      if (window.lucide) lucide.createIcons();
    }
    if (statusEl) {
      statusEl.textContent = "Mengunggah hasil pengerjaan Quiz 1 & berkas lampiran ke Google Sheets & Drive...";
      statusEl.className = "text-[11px] text-blue-600 dark:text-blue-400 font-medium";
    }

    if (typeof SyncManager === "undefined") {
      showToast("Modul sinkronisasi belum dimuat.", "danger");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Kirim Jawaban & Lampiran ke Spreadsheet</span>';
        if (window.lucide) lucide.createIcons();
      }
      return;
    }

    const res = await SyncManager.submitQuiz1();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Kirim Ulang ke Spreadsheet</span>';
      if (window.lucide) lucide.createIcons();
    }

    if (res.success) {
      showToast("Berhasil! Jawaban Quiz 1 & berkas lampiran telah tersimpan di Google Spreadsheet Guru.", "success");
      try { SoundEngine.playSuccess(); } catch (e) {}
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> ${res.message}</span>`;
        if (window.lucide) lucide.createIcons();
      }
    } else if (res.noUrl) {
      showToast("URL Spreadsheet belum disetel oleh Guru. Jawaban tersimpan di memori lab.", "info");
      if (statusEl) {
        statusEl.innerHTML = '<span class="text-amber-700 dark:text-amber-300 flex items-center gap-1"><i data-lucide="info" class="w-3.5 h-3.5"></i> Webhook Google Sheets belum diisi oleh Guru</span>';
        if (window.lucide) lucide.createIcons();
      }
    } else {
      showToast("Gagal menyinkronkan Quiz 1: " + res.message, "danger");
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-red-600 dark:text-red-400 flex items-center gap-1"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Gagal: ${res.message}</span>`;
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  // ==================== ASESMEN DIAGNOSTIK KOGNITIF & ANGKET PROFIL SISWA ====================
  let diagnosticAnswers = {
    cognitive: {},
    survey: {}
  };

  function isDiagnosticCompleted(name, nis) {
    const studentName = (name || (userData && userData.name) || "").trim();
    const studentNis = (nis || (userData && userData.nis) || "").trim();
    if (!studentName && !studentNis) return false;

    // 1. Check dedicated account storage
    const accKey = getAccountStorageKey(studentName, studentNis);
    try {
      const accData = localStorage.getItem(accKey);
      if (accData) {
        const parsed = JSON.parse(accData);
        if (parsed.diagnosticCompleted && parsed.diagnosticData) {
          if (userData && userData.name && userData.name.toLowerCase() === studentName.toLowerCase()) {
            userData.diagnosticData = parsed.diagnosticData;
            userData.diagnosticCompleted = true;
          }
          return true;
        }
      }
    } catch (e) {}

    // 2. Check standardized diagnostic key
    const stdDiagKey = getDiagnosticStorageKey(studentName, studentNis);
    try {
      const cachedStd = localStorage.getItem(stdDiagKey);
      if (cachedStd) {
        const parsed = JSON.parse(cachedStd);
        if (userData && userData.name && userData.name.toLowerCase() === studentName.toLowerCase()) {
          userData.diagnosticData = parsed;
          userData.diagnosticCompleted = true;
        }
        return true;
      }
    } catch (e) {}

    // 3. Check legacy diagnostic key (esd_diag_<nis || name>)
    const legacyKey = "esd_diag_" + (studentNis || studentName);
    try {
      const cachedLegacy = localStorage.getItem(legacyKey);
      if (cachedLegacy) {
        const parsed = JSON.parse(cachedLegacy);
        if (userData && userData.name && userData.name.toLowerCase() === studentName.toLowerCase()) {
          userData.diagnosticData = parsed;
          userData.diagnosticCompleted = true;
        }
        return true;
      }
    } catch (e) {}

    return false;
  }

  function openDiagnosticModal(isManual = false) {
    const modal = document.getElementById("diagnostic-modal");
    if (!modal) return;

    // Student identity headers
    const nameEl = document.getElementById("diag-student-name");
    const nisEl = document.getElementById("diag-student-nis");
    const classEl = document.getElementById("diag-student-class");
    const groupEl = document.getElementById("diag-student-group");
    const adminCloseBtn = document.getElementById("btn-diag-admin-close");
    const mandatoryNotice = document.getElementById("diag-mandatory-notice");
    const questionsScroll = document.getElementById("diag-questions-scroll");
    const resultScreen = document.getElementById("diag-result-screen");
    const modalFooter = document.getElementById("diag-modal-footer");
    const progressWrapper = document.getElementById("diag-progress-wrapper");

    const displayName = userData.name || (userData.role === "admin" ? "Admin Guru" : "Siswa");
    if (nameEl) nameEl.textContent = `Nama: ${displayName}`;
    if (nisEl) nisEl.textContent = `NIS: ${userData.nis || "-"}`;
    if (classEl) classEl.textContent = `Kelas: ${userData.class || "11 TP A"}`;
    if (groupEl) groupEl.textContent = `Kelompok: ${userData.group || "-"}`;

    // Admin or manual retake controls
    const isTeacher = userData.role === "admin";
    if (adminCloseBtn) {
      if (isTeacher || isManual || (userData.diagnosticCompleted && userData.diagnosticData)) {
        adminCloseBtn.classList.remove("hidden");
      } else {
        adminCloseBtn.classList.add("hidden");
      }
    }

    // If user already completed and is opening manually, show result screen with option to review
    if (isManual && userData.diagnosticCompleted && userData.diagnosticData && !userData.diagnosticData.skipped) {
      showDiagnosticResultView(userData.diagnosticData, null);
    } else {
      // Show questions view
      if (questionsScroll) questionsScroll.classList.remove("hidden");
      if (resultScreen) resultScreen.classList.add("hidden");
      if (modalFooter) modalFooter.classList.remove("hidden");
      if (mandatoryNotice) mandatoryNotice.classList.remove("hidden");
      if (progressWrapper) progressWrapper.classList.remove("hidden");

      // Preload previous answers if available
      if (userData.diagnosticData && userData.diagnosticData.cognitiveAnswers) {
        diagnosticAnswers.cognitive = { ...userData.diagnosticData.cognitiveAnswers };
      }
      if (userData.diagnosticData && userData.diagnosticData.surveyAnswers) {
        diagnosticAnswers.survey = { ...userData.diagnosticData.surveyAnswers };
      }

      renderDiagnosticQuestions();
      updateDiagnosticProgress();
    }

    modal.classList.remove("hidden");
    modal.style.display = "flex";
    document.body.classList.add("modal-diagnostic-open");

    // Close mobile sidebar if open
    const sidebar = document.getElementById("main-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar && sidebar.classList.contains("open")) {
      sidebar.classList.remove("open");
    }
    if (overlay && !overlay.classList.contains("hidden")) {
      overlay.classList.add("hidden");
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function closeDiagnosticModal() {
    const modal = document.getElementById("diagnostic-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.style.display = "none";
    }
    document.body.classList.remove("modal-diagnostic-open");
  }

  function renderDiagnosticQuestions() {
    const container = document.getElementById("diag-questions-scroll");
    if (!container || typeof AppData === "undefined") return;

    const questions = AppData.diagnosticQuestions || [];
    const survey = AppData.diagnosticSurvey || [];

    let html = `
      <!-- Header Banner Bagian 1 -->
      <div class="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider block">
            Bagian I. Asesmen Diagnostik Kognitif Awal
          </span>
          <p class="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
            10 Butir Soal Pilihan Ganda Pemesinan Bubut (Bobot: 10 Poin / Soal, Skor Maksimal: 100 Poin)
          </p>
        </div>
        <span class="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
          10 Soal
        </span>
      </div>
      <div class="space-y-4">
    `;

    // Render 10 Cognitive Questions
    questions.forEach((q) => {
      const selected = diagnosticAnswers.cognitive[q.id];
      html += `
        <div id="diag-card-${q.id}" class="mat-card p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#151e2e] transition-all">
          <div class="flex items-start gap-2.5 mb-3">
            <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              ${q.number}
            </span>
            <div class="flex-1">
              <span class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                ${q.topic || "Soal Kognitif"} &bull; 10 Poin
              </span>
              <p class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-relaxed">
                ${q.question}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2 pt-1">
      `;

      const letters = ["A", "B", "C", "D", "E"];
      q.options.forEach((optText, optIdx) => {
        const letter = letters[optIdx];
        const isSel = selected === letter;
        const optClass = isSel
          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500 font-semibold"
          : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

        html += `
          <div 
            onclick="App.selectDiagnosticOption('cognitive', '${q.id}', '${letter}')"
            class="diag-opt-item diag-opt-${q.id} p-2.5 sm:p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${optClass}"
            data-letter="${letter}"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                isSel ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }">
                ${letter}
              </span>
              <span class="leading-relaxed">${optText.replace(/^[A-E]\.\s*/, '')}</span>
            </div>
            <div class="w-4 h-4 rounded-full border flex items-center justify-center ${
              isSel ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
            }">
              ${isSel ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <!-- Header Banner Bagian 2 (Non-Kognitif) -->
      <div class="p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between mt-6">
        <div>
          <span class="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider block">
            Bagian II. Angket Kesiapan Belajar & Gaya Belajar Siswa
          </span>
          <p class="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
            Bahan diagnostik non-kognitif untuk profil portofolio LKPD Anda (Tidak dinilai numerik)
          </p>
        </div>
        <span class="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-mono font-bold text-xs">
          3 Butir
        </span>
      </div>
      <div class="space-y-4">
    `;

    // Render 3 Survey Questions
    survey.forEach((s) => {
      const selected = diagnosticAnswers.survey[s.id];
      html += `
        <div id="diag-card-${s.id}" class="mat-card p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#151e2e] transition-all">
          <div class="flex items-start gap-2.5 mb-3">
            <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              ${s.number}
            </span>
            <div class="flex-1">
              <span class="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-0.5">
                ${s.title} &bull; Profil Pembelajaran
              </span>
              <p class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white leading-relaxed">
                ${s.question}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2.5 pt-1">
      `;

      s.options.forEach((opt) => {
        const isSel = selected === opt.value;
        const optClass = isSel
          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500 font-semibold"
          : "border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";

        html += `
          <div 
            onclick="App.selectDiagnosticOption('survey', '${s.id}', '${opt.value}')"
            class="diag-survey-item diag-survey-${s.id} p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${optClass}"
            data-value="${opt.value}"
          >
            <div>
              <span class="font-bold block text-xs ${isSel ? "text-purple-700 dark:text-purple-300" : "text-slate-800 dark:text-white"}">
                ${opt.label}
              </span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                ${opt.desc}
              </p>
            </div>
            <div class="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isSel ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 dark:border-slate-600"
            }">
              ${isSel ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  function selectDiagnosticOption(section, qId, val) {
    try { SoundEngine.playClick(); } catch (e) {}
    diagnosticAnswers[section][qId] = val;

    // Remove any red highlight
    const card = document.getElementById(`diag-card-${qId}`);
    if (card) {
      card.classList.remove("ring-2", "ring-red-500", "bg-red-50/30", "dark:bg-red-950/20");
    }

    // Refresh option item UI
    if (section === "cognitive") {
      const items = document.querySelectorAll(`.diag-opt-${qId}`);
      items.forEach((item) => {
        const isSel = item.dataset.letter === val;
        const letterBadge = item.querySelector("span:first-child");
        const checkCircle = item.querySelector("div:last-child");

        if (isSel) {
          item.className = `diag-opt-item diag-opt-${qId} p-2.5 sm:p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500 font-semibold`;
          if (letterBadge) letterBadge.className = "w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] bg-blue-600 text-white";
          if (checkCircle) {
            checkCircle.className = "w-4 h-4 rounded-full border flex items-center justify-center border-blue-600 bg-blue-600 text-white";
            checkCircle.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i>';
          }
        } else {
          item.className = `diag-opt-item diag-opt-${qId} p-2.5 sm:p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`;
          if (letterBadge) letterBadge.className = "w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
          if (checkCircle) {
            checkCircle.className = "w-4 h-4 rounded-full border flex items-center justify-center border-slate-300 dark:border-slate-600";
            checkCircle.innerHTML = "";
          }
        }
      });
    } else {
      const items = document.querySelectorAll(`.diag-survey-${qId}`);
      items.forEach((item) => {
        const isSel = item.dataset.value === val;
        const checkCircle = item.querySelector("div:last-child");
        if (isSel) {
          item.className = `diag-survey-item diag-survey-${qId} p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 border-purple-600 bg-purple-50/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500 font-semibold`;
          if (checkCircle) {
            checkCircle.className = "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 border-purple-600 bg-purple-600 text-white";
            checkCircle.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i>';
          }
        } else {
          item.className = `diag-survey-item diag-survey-${qId} p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`;
          if (checkCircle) {
            checkCircle.className = "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 border-slate-300 dark:border-slate-600";
            checkCircle.innerHTML = "";
          }
        }
      });
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
    updateDiagnosticProgress();
  }

  function updateDiagnosticProgress() {
    const cogCount = Object.keys(diagnosticAnswers.cognitive).length;
    const surCount = Object.keys(diagnosticAnswers.survey).length;
    const total = cogCount + surCount;
    const maxTotal = 13;
    const pct = Math.min(100, Math.round((total / maxTotal) * 100));

    const countEl = document.getElementById("diag-progress-count");
    const pctEl = document.getElementById("diag-progress-percent");
    const barEl = document.getElementById("diag-progress-bar");

    if (countEl) countEl.textContent = `${total} / ${maxTotal}`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) {
      barEl.style.width = `${pct}%`;
      if (total === maxTotal) {
        barEl.className = "bg-emerald-600 h-full rounded-full transition-all duration-300";
      } else {
        barEl.className = "bg-blue-600 h-full rounded-full transition-all duration-300";
      }
    }
  }

  async function submitDiagnosticTest() {
    const questions = AppData.diagnosticQuestions || [];
    const survey = AppData.diagnosticSurvey || [];

    // Validation: Check all 10 cognitive questions
    const unansweredCognitive = questions.filter((q) => !diagnosticAnswers.cognitive[q.id]);
    // Validation: Check all 3 survey questions
    const unansweredSurvey = survey.filter((s) => !diagnosticAnswers.survey[s.id]);

    const totalUnanswered = unansweredCognitive.length + unansweredSurvey.length;

    if (totalUnanswered > 0) {
      try { SoundEngine.playAlarm(); } catch (e) {}
      showToast(`Mohon lengkapi seluruh soal! Masih ada ${totalUnanswered} butir pertanyaan yang belum diisi.`, "danger");

      // Highlight unanswered questions
      unansweredCognitive.forEach((q) => {
        const card = document.getElementById(`diag-card-${q.id}`);
        if (card) {
          card.classList.add("ring-2", "ring-red-500", "bg-red-50/30", "dark:bg-red-950/20");
        }
      });
      unansweredSurvey.forEach((s) => {
        const card = document.getElementById(`diag-card-${s.id}`);
        if (card) {
          card.classList.add("ring-2", "ring-red-500", "bg-red-50/30", "dark:bg-red-950/20");
        }
      });

      // Scroll to the first unanswered item
      const firstId = unansweredCognitive.length > 0 ? unansweredCognitive[0].id : unansweredSurvey[0].id;
      const firstCard = document.getElementById(`diag-card-${firstId}`);
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // All 13 questions are complete!
    const submitBtn = document.getElementById("btn-diag-submit");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan & Menyinkronkan...</span>';
      if (window.lucide) {
        try { lucide.createIcons(); } catch (e) {}
      }
    }

    // Calculate score
    let correctCount = 0;
    const summaryParts = [];
    questions.forEach((q) => {
      const studentAns = diagnosticAnswers.cognitive[q.id];
      if (studentAns === q.keyLetter) {
        correctCount++;
      }
      summaryParts.push(`${q.number}:${studentAns}`);
    });

    const score = correctCount * 10;
    const category = score >= 80 ? "Kesiapan Tinggi (Mahir)" : score >= 60 ? "Kesiapan Sedang (Siap)" : "Kesiapan Awal (Perlu Penguatan)";
    const summaryStr = summaryParts.join(", ");

    const record = {
      completed: true,
      skipped: false,
      score: score,
      correctCount: correctCount,
      totalQuestions: 10,
      category: category,
      learningStyle: diagnosticAnswers.survey["survey_gaya_belajar"] || "-",
      machineExp: diagnosticAnswers.survey["survey_pengalaman_mesin"] || "-",
      safetyReadiness: diagnosticAnswers.survey["survey_kesiapan_k3"] || "-",
      cognitiveAnswers: { ...diagnosticAnswers.cognitive },
      surveyAnswers: { ...diagnosticAnswers.survey },
      answersSummary: summaryStr,
      submittedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };

    userData.diagnosticCompleted = true;
    userData.diagnosticData = record;

    const stdKey = getDiagnosticStorageKey(userData.name, userData.nis);
    const legacyKey = "esd_diag_" + (userData.nis || userData.name);
    try {
      localStorage.setItem(stdKey, JSON.stringify(record));
      localStorage.setItem(legacyKey, JSON.stringify(record));
    } catch (e) {}

    saveUserData();
    addXP(100);
    unlockBadge("badge-diagnostic", "Diagnostik Tuntas");

    // Sync to Google Spreadsheet
    const payload = {
      action: "submit_diagnostic",
      name: userData.name,
      nis: userData.nis,
      class: userData.class,
      group: userData.group,
      academicYear: userData.academicYear,
      diagnosticScore: score,
      diagnosticCorrect: correctCount,
      diagnosticTotal: 10,
      category: category,
      learningStyle: record.learningStyle,
      machineExp: record.machineExp,
      safetyReadiness: record.safetyReadiness,
      answersSummary: summaryStr,
      timestamp: record.submittedAt
    };

    let syncRes = null;
    try {
      syncRes = await SyncManager.submitDiagnostic(payload);
    } catch (err) {
      console.warn("Gagal kirim diagnostik ke sheet:", err);
    }

    try { SoundEngine.playSuccess(); } catch (e) {}
    showDiagnosticResultView(record, syncRes);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>Kirim Jawaban Diagnostik</span>';
    }

    updateHUD();
  }

  function showDiagnosticResultView(record, syncRes) {
    const questionsScroll = document.getElementById("diag-questions-scroll");
    const resultScreen = document.getElementById("diag-result-screen");
    const modalFooter = document.getElementById("diag-modal-footer");
    const mandatoryNotice = document.getElementById("diag-mandatory-notice");
    const progressWrapper = document.getElementById("diag-progress-wrapper");
    const adminCloseBtn = document.getElementById("btn-diag-admin-close");

    if (questionsScroll) questionsScroll.classList.add("hidden");
    if (mandatoryNotice) mandatoryNotice.classList.add("hidden");
    if (modalFooter) modalFooter.classList.add("hidden");
    if (progressWrapper) progressWrapper.classList.add("hidden");
    if (adminCloseBtn) adminCloseBtn.classList.remove("hidden");

    if (!resultScreen) return;
    resultScreen.classList.remove("hidden");

    const isHigh = record.score >= 80;
    const isMid = record.score >= 60;
    const badgeColor = isHigh
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300"
      : isMid
      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300"
      : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300";

    const syncHtml = syncRes && syncRes.success
      ? `<div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
          <span><strong>Berhasil Disinkronkan:</strong> Data tersimpan di Google Spreadsheet tab <em>"Pretest Diagnostik"</em>.</span>
        </div>`
      : `<div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-center gap-2">
          <i data-lucide="cloud-off" class="w-4 h-4 text-blue-600"></i>
          <span>Hasil pretest tersimpan aman di perangkat browser ini (Portofolio aktif).</span>
        </div>`;

    resultScreen.innerHTML = `
      <div class="max-w-xl mx-auto space-y-5">
        
        <!-- Trophy Icon -->
        <div class="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
          <i data-lucide="award" class="w-9 h-9"></i>
        </div>

        <div>
          <h3 class="text-xl font-black text-slate-800 dark:text-white">
            Asesmen Diagnostik Selesai!
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Terima kasih telah melengkapi pretest kognitif awal dan angket gaya belajar.
          </p>
        </div>

        <!-- Score Big Badge -->
        <div class="p-5 rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white dark:from-slate-800/80 dark:to-[#151e2e] border border-indigo-100 dark:border-slate-700 shadow-sm text-center">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Skor Diagnostik Kognitif
          </span>
          <div class="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            ${record.score} <span class="text-xl sm:text-2xl text-slate-400 font-bold">/ 100</span>
          </div>
          <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            <span>${record.category} (${record.correctCount} dari 10 Soal Benar)</span>
          </div>
        </div>

        <!-- Profil Non-Kognitif Siswa -->
        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 text-left text-xs space-y-2">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1.5">
            <i data-lucide="user-check" class="w-3.5 h-3.5 text-indigo-600"></i>
            <span>Profil Kesiapan Belajar Siswa (Portofolio):</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span class="text-slate-400 block font-medium">Gaya Belajar:</span>
              <strong class="text-indigo-600 dark:text-indigo-400 text-xs">${record.learningStyle}</strong>
            </div>
            <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span class="text-slate-400 block font-medium">Pengalaman Mesin:</span>
              <strong class="text-slate-800 dark:text-slate-200 text-xs">${record.machineExp}</strong>
            </div>
            <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span class="text-slate-400 block font-medium">Kesiapan Fisik & K3:</span>
              <strong class="text-slate-800 dark:text-slate-200 text-xs">${record.safetyReadiness}</strong>
            </div>
          </div>
        </div>

        <!-- Sync Result -->
        ${syncHtml}

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button 
            type="button" 
            onclick="App.closeDiagnosticModal(); App.showToast('Selamat belajar di Laboratorium Virtual Pemesinan!', 'success');" 
            class="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer"
          >
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
            <span>Masuk ke Laboratorium Virtual</span>
          </button>
          <button 
            type="button" 
            onclick="App.reviewDiagnosticQuestions()" 
            class="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i data-lucide="eye" class="w-4 h-4"></i>
            <span>Review Lembar Jawaban</span>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function reviewDiagnosticQuestions() {
    const questionsScroll = document.getElementById("diag-questions-scroll");
    const resultScreen = document.getElementById("diag-result-screen");
    const modalFooter = document.getElementById("diag-modal-footer");
    const mandatoryNotice = document.getElementById("diag-mandatory-notice");
    const progressWrapper = document.getElementById("diag-progress-wrapper");

    if (resultScreen) resultScreen.classList.add("hidden");
    if (questionsScroll) questionsScroll.classList.remove("hidden");
    if (modalFooter) modalFooter.classList.remove("hidden");
    if (mandatoryNotice) mandatoryNotice.classList.add("hidden");
    if (progressWrapper) progressWrapper.classList.remove("hidden");

    renderDiagnosticQuestions();
    updateDiagnosticProgress();
  }

  function skipDiagnosticTest() {
    try { SoundEngine.playClick(); } catch (e) {}

    // If student already has valid diagnostic record
    if (userData.diagnosticCompleted && userData.diagnosticData && !userData.diagnosticData.skipped) {
      showToast(`Asesmen Diagnostik Anda telah tersimpan sebelumnya (Skor: ${userData.diagnosticData.score}/100). Selamat belajar!`, "info");
      closeDiagnosticModal();
      return;
    }

    const confirmed = window.confirm(
      "Konfirmasi Lewati Pretest Diagnostik:\n\n" +
      "Apakah Anda yakin sudah pernah mengisi dan mengirimkan lembar Asesmen Diagnostik sebelumnya?\n\n" +
      "(Catatan: Pretest diagnostik diperuntukkan untuk memetakan kesiapan awal dan dimasukkan ke lembar LKPD portofolio siswa)."
    );

    if (confirmed) {
      const skippedRecord = {
        completed: true,
        skipped: true,
        score: 0,
        correctCount: 0,
        totalQuestions: 10,
        category: "Dilewati (Sudah Mengerjakan Sebelumnya)",
        learningStyle: "Dilewati (Konfirmasi Siswa)",
        machineExp: "-",
        safetyReadiness: "-",
        cognitiveAnswers: {},
        surveyAnswers: {},
        answersSummary: "Dilewati",
        submittedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
      };

      userData.diagnosticCompleted = true;
      userData.diagnosticData = skippedRecord;
      const stdKey = getDiagnosticStorageKey(userData.name, userData.nis);
      const legacyKey = "esd_diag_" + (userData.nis || userData.name);
      try {
        localStorage.setItem(stdKey, JSON.stringify(skippedRecord));
        localStorage.setItem(legacyKey, JSON.stringify(skippedRecord));
      } catch (e) {}

      saveUserData();
      closeDiagnosticModal();
      updateHUD();
      showToast("Asesmen Diagnostik dilewati. Anda dapat membuka kembali sewaktu-waktu melalui menu navigasi.", "info");
    }
  }

  function getDiagnosticLKPDHtml() {
    const d = userData.diagnosticData;
    if (!d) {
      return `
        <div class="border p-4 rounded text-xs leading-relaxed mb-6 bg-gray-50">
          <p class="text-gray-500 italic">Status Asesmen Diagnostik: Belum dikerjakan oleh peserta didik.</p>
        </div>
      `;
    }

    if (d.skipped) {
      return `
        <div class="border p-4 rounded text-xs leading-relaxed mb-6 bg-gray-50">
          <p><strong>Status Asesmen Diagnostik:</strong> Dilewati (Peserta didik menyatakan telah mengirimkan jawaban sebelumnya).</p>
          <p class="text-[11px] text-gray-500 mt-1">Waktu: ${d.submittedAt || "-"}</p>
        </div>
      `;
    }

    const questions = (typeof AppData !== "undefined" && AppData.diagnosticQuestions) ? AppData.diagnosticQuestions : [];
    let rowsHtml = "";
    questions.forEach((q) => {
      const ans = (d.cognitiveAnswers && d.cognitiveAnswers[q.id]) || "-";
      const isCorrect = ans === q.keyLetter;
      rowsHtml += `
        <tr>
          <td class="border border-gray-400 p-1.5 text-center">${q.number}</td>
          <td class="border border-gray-400 p-1.5">${q.topic || q.question.substring(0, 50) + "..."}</td>
          <td class="border border-gray-400 p-1.5 text-center font-bold font-mono">${q.keyLetter}</td>
          <td class="border border-gray-400 p-1.5 text-center font-bold font-mono">${ans}</td>
          <td class="border border-gray-400 p-1.5 text-center ${isCorrect ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}">
            ${isCorrect ? "✓ BENAR (10 Pts)" : "✗ SALAH (0 Pts)"}
          </td>
        </tr>
      `;
    });

    return `
      <div class="border p-4 rounded text-xs leading-relaxed mb-6 bg-gray-50">
        <div class="grid grid-cols-2 gap-4 mb-4 pb-3 border-b border-gray-300">
          <div>
            <p><strong>Nilai Pretest Diagnostik:</strong> <span class="text-sm font-bold">${d.score} / 100</span> (${d.correctCount} dari 10 Butir Benar)</p>
            <p><strong>Kategori Kesiapan:</strong> ${d.category}</p>
            <p><strong>Waktu Pengerjaan:</strong> ${d.submittedAt}</p>
          </div>
          <div>
            <p><strong>Gaya Belajar Siswa:</strong> <span class="font-bold underline">${d.learningStyle}</span></p>
            <p><strong>Pengalaman Mesin Perkakas:</strong> ${d.machineExp}</p>
            <p><strong>Kesiapan Fisik & K3:</strong> ${d.safetyReadiness}</p>
          </div>
        </div>

        <p class="font-bold mb-2">Tabel Rekapitulasi 10 Butir Soal Asesmen Diagnostik Kognitif:</p>
        <table class="w-full text-[11px] border-collapse border border-gray-400 bg-white">
          <thead>
            <tr class="bg-gray-200 text-left">
              <th class="border border-gray-400 p-1.5 text-center w-10">No</th>
              <th class="border border-gray-400 p-1.5">Materi / Indikator Soal</th>
              <th class="border border-gray-400 p-1.5 text-center w-16">Kunci</th>
              <th class="border border-gray-400 p-1.5 text-center w-16">Jawaban Siswa</th>
              <th class="border border-gray-400 p-1.5 text-center w-28">Status & Poin</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // Lembar Hasil Quiz 1 (LK-1: Parameter Bubut) untuk Cetak LKPD
  function getQuiz1LKPDHtml() {
    const q1Answers = userData.quiz1Answers || {};
    const questions = (typeof AppData !== "undefined" && AppData.quiz1Challenges) ? AppData.quiz1Challenges : [];
    const totalQ = questions.length;
    const answeredCount = Object.keys(q1Answers).length;
    const correctCount = questions.filter(q => q1Answers[q.id] === q.correct).length;
    const scorePct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

    let rowsHtml = "";
    questions.forEach((q, idx) => {
      const isAns = q1Answers[q.id] !== undefined;
      const ansIdx = q1Answers[q.id];
      const isCorrect = isAns && ansIdx === q.correct;
      const userText = isAns ? (String.fromCharCode(65 + ansIdx) + ". " + q.options[ansIdx]) : "-";

      rowsHtml += `
        <tr class="border-b border-gray-300">
          <td class="border border-gray-400 p-1.5 text-center font-bold">${idx + 1}</td>
          <td class="border border-gray-400 p-1.5">
            <strong>${q.category}</strong>: ${q.question}
          </td>
          <td class="border border-gray-400 p-1.5 font-bold text-center">${String.fromCharCode(65 + q.correct)}</td>
          <td class="border border-gray-400 p-1.5 text-center ${isCorrect ? 'text-green-700 font-bold' : (isAns ? 'text-red-700' : 'text-gray-400')}">
            ${isAns ? String.fromCharCode(65 + ansIdx) : 'Kosong'}
          </td>
          <td class="border border-gray-400 p-1.5 text-center font-bold ${isCorrect ? 'text-green-700' : (isAns ? 'text-red-700' : 'text-gray-400')}">
            ${isCorrect ? '✓ Benar (10)' : (isAns ? '✗ Salah (0)' : '-')}
          </td>
        </tr>
      `;
    });

    let summaryTableHtml = "";
    if (typeof AppData !== "undefined" && AppData.quiz1SummaryTable) {
      summaryTableHtml = `
        <div class="mt-4">
          <p class="font-bold mb-1">Rangkuman Tabel Hasil Perhitungan (Kunci Evaluasi LK-1):</p>
          <table class="w-full text-[10.5px] border-collapse border border-gray-400">
            <thead>
              <tr class="bg-gray-100 font-bold border-b border-gray-400">
                <th class="border border-gray-400 p-1 text-left">Benda Kerja</th>
                <th class="border border-gray-400 p-1 text-left">Parameter</th>
                <th class="border border-gray-400 p-1 text-center">n (RPM)</th>
                <th class="border border-gray-400 p-1 text-center">tm (menit)</th>
                <th class="border border-gray-400 p-1 text-center">MRR</th>
                <th class="border border-gray-400 p-1 text-left">Analisis Rekayasa</th>
              </tr>
            </thead>
            <tbody>
              ${AppData.quiz1SummaryTable.map(r => `
                <tr class="border-b border-gray-300">
                  <td class="border border-gray-400 p-1 font-semibold">${r.soal}</td>
                  <td class="border border-gray-400 p-1 font-mono">${r.parameter}</td>
                  <td class="border border-gray-400 p-1 text-center font-bold">${r.n}</td>
                  <td class="border border-gray-400 p-1 text-center font-bold">${r.tm}</td>
                  <td class="border border-gray-400 p-1 text-center font-bold">${r.mrr}</td>
                  <td class="border border-gray-400 p-1">${r.catatan}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
      <div class="border p-4 rounded text-xs leading-relaxed mb-6 bg-gray-50">
        <div class="flex items-center justify-between mb-3 border-b pb-2">
          <div>
            <p><strong>Capaian:</strong> ${correctCount} / ${totalQ} Soal Terjawab Benar (${scorePct}%)</p>
            <p class="text-[11px] text-gray-500">Mata Pelajaran: Teknik Pemesinan Lanjut | Fase F - XI SMK</p>
          </div>
          <div class="px-3 py-1 rounded border font-bold text-center ${scorePct >= 75 ? 'bg-green-100 text-green-800 border-green-300' : 'bg-amber-100 text-amber-800 border-amber-300'}">
            Nilai LK-1: ${scorePct} / 100
          </div>
        </div>

        <table class="w-full text-left text-[11px] border-collapse border border-gray-400">
          <thead>
            <tr class="bg-gray-100 text-gray-700">
              <th class="border border-gray-400 p-1.5 text-center w-8">No</th>
              <th class="border border-gray-400 p-1.5">Materi & Indikator Soal LK-1</th>
              <th class="border border-gray-400 p-1.5 text-center w-14">Kunci</th>
              <th class="border border-gray-400 p-1.5 text-center w-16">Jawaban</th>
              <th class="border border-gray-400 p-1.5 text-center w-24">Hasil</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        ${summaryTableHtml}

        ${
          userData.quiz1Attachment
            ? `
          <div class="mt-4 p-3 bg-white border border-gray-400 rounded">
            <p class="font-bold text-gray-800 mb-1">Lampiran Berkas Pekerjaan Siswa:</p>
            <p class="text-[11px] text-gray-600">
              Nama Berkas: <strong>${userData.quiz1Attachment.fileName}</strong> 
              (${Math.round(userData.quiz1Attachment.fileSize / 1024)} KB) 
              • Diunggah: ${userData.quiz1Attachment.uploadedAt || "-"}
            </p>
            ${
              userData.quiz1Attachment.fileType && userData.quiz1Attachment.fileType.startsWith("image/")
                ? `<div class="mt-2 text-center">
                    <img src="${userData.quiz1Attachment.fileData}" alt="Lampiran Siswa" style="max-height: 380px; max-width: 100%; object-fit: contain; margin: 0 auto; border: 1px solid #ccc; border-radius: 4px;" />
                   </div>`
                : `<p class="mt-1 text-[11px] text-blue-700 italic font-mono">[Dokumen PDF terlampir dalam arsip digital Google Drive]</p>`
            }
          </div>
        `
            : `
          <div class="mt-3 text-[11px] text-gray-400 italic">
            * Tidak ada lampiran berkas fisik/coretan yang diunggah untuk LK-1 ini.
          </div>
        `
        }
      </div>
    `;
  }

  // Print LKPD Generator
  function printLKPD() {
    if (userData.role !== "admin") {
      showToast("Akses Dibatasi: Fitur Cetak LKPD hanya diperuntukkan bagi Guru / Admin ESDVLab.", "danger");
      return;
    }
    SoundEngine.playClick();
    const sim = SimEngine.getState();
    const mat = AppData.materials.find((m) => m.id === sim.materialId)?.name || sim.materialId;
    const tool = sim.toolId === "carbide" ? "Pahat Karbida (Carbide Insert)" : "Pahat HSS (High Speed Steel)";
    const dateStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const printContainer = document.getElementById("printable-lkpd");
    if (!printContainer) return;

    printContainer.innerHTML = `
      <div class="print-page text-black bg-white p-8 max-w-4xl mx-auto font-sans">
        <div class="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img src="Logo ESD V-Lab.png" class="w-16 h-16 object-contain" alt="Logo ESD V-Lab">
            <div>
              <h2 class="text-xl font-bold uppercase tracking-wider">Lembar Kerja Peserta Didik (LKPD) Digital</h2>
              <h3 class="text-md font-semibold text-gray-700">Simulasi Parameter Pemesinan Bubut & Frais Konvensional</h3>
              <p class="text-xs text-gray-500">ESD V-Lab — Mata Pelajaran Teknik Pemesinan (Fase F - Kurikulum Merdeka)</p>
            </div>
          </div>
          <div class="text-right text-xs">
            <p><strong>Tanggal Praktik:</strong> ${dateStr}</p>
            <p><strong>Status K3:</strong> ${userData.safetyScore >= 100 ? "LULUS ZERO ACCIDENT" : "TERVERIFIKASI"}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm border p-4 rounded bg-gray-50">
          <div>
            <p><strong>Nama Peserta Didik:</strong> ${userData.name}</p>
            <p><strong>Kelas / Rombel:</strong> ${userData.class}</p>
            <p><strong>Tahun Ajaran:</strong> ${userData.academicYear || "2024/2025"}</p>
          </div>
          <div>
            <p><strong>NIS:</strong> ${userData.nis || "-"}</p>
            <p><strong>Kelompok Praktik:</strong> ${userData.group || "-"}</p>
            <p><strong>Level Kompetensi:</strong> Level ${userData.level} (${userData.xp} XP)</p>
          </div>
        </div>

        <h4 class="font-bold text-md mb-2 border-b pb-1">I. Data Eksperimen Simulasi Pemesinan</h4>
        <table class="w-full text-xs border-collapse border border-gray-400 mb-6">
          <thead>
            <tr class="bg-gray-200 text-left">
              <th class="border border-gray-400 p-2">Parameter</th>
              <th class="border border-gray-400 p-2">Nilai Input</th>
              <th class="border border-gray-400 p-2">Hasil Perhitungan</th>
              <th class="border border-gray-400 p-2">Keterangan / Rumus</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold">Material Benda Kerja</td>
              <td class="border border-gray-400 p-2">${mat}</td>
              <td class="border border-gray-400 p-2">-</td>
              <td class="border border-gray-400 p-2">Sesuai standar tabel</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold">Jenis Alat Potong (Pahat)</td>
              <td class="border border-gray-400 p-2">${tool}</td>
              <td class="border border-gray-400 p-2">-</td>
              <td class="border border-gray-400 p-2">Ketahanan panas pahat</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold">Diameter Benda Kerja (d)</td>
              <td class="border border-gray-400 p-2">${sim.diameter} mm</td>
              <td class="border border-gray-400 p-2">-</td>
              <td class="border border-gray-400 p-2">Dimensi awal</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold">Putaran Spindel Mesin (n)</td>
              <td class="border border-gray-400 p-2">${sim.rpm} RPM</td>
              <td class="border border-gray-400 p-2"><strong>Cs = ${sim.evaluation.csActual} m/menit</strong></td>
              <td class="border border-gray-400 p-2">Cs = (π × d × n) / 1000</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold">Gerak Pemakanan (f)</td>
              <td class="border border-gray-400 p-2">${sim.feedRate} mm/put</td>
              <td class="border border-gray-400 p-2"><strong>tc = ${sim.evaluation.cuttingTimeMin} menit</strong></td>
              <td class="border border-gray-400 p-2">tc = L / (f × n)</td>
            </tr>
            <tr>
              <td class="border border-gray-400 p-2 font-semibold">Kualitas Permukaan (Ra)</td>
              <td class="border border-gray-400 p-2">Coolant: ${sim.coolant ? "Aktif" : "Non-aktif"}</td>
              <td class="border border-gray-400 p-2 font-bold">${sim.evaluation.ra} µm Ra</td>
              <td class="border border-gray-400 p-2">${sim.evaluation.title}</td>
            </tr>
          </tbody>
        </table>

        <h4 class="font-bold text-md mb-2 border-b pb-1">II. Catatan Evaluasi & Kesimpulan</h4>
        <div class="border p-4 rounded text-xs leading-relaxed mb-6 bg-gray-50">
          <p><strong>Status Analisis:</strong> ${sim.evaluation.desc}</p>
          <p class="mt-2 text-gray-600">Berdasarkan hasil uji coba virtual, pemilihan parameter putaran spindel dan kecepatan pemakanan sangat mempengaruhi kualitas kehalusan permukaan serta keawetan mata pahat.</p>
        </div>

        <h4 class="font-bold text-md mb-2 border-b pb-1">III. Lembar Hasil Asesmen Diagnostik Awal & Angket Profil Siswa</h4>
        ${getDiagnosticLKPDHtml()}

        <h4 class="font-bold text-md mb-2 border-b pb-1 mt-6">IV. Lembar Hasil Perhitungan Parameter Pemotongan Mesin Bubut (LK-1 / Quiz 1)</h4>
        ${getQuiz1LKPDHtml()}

        <div class="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-8">
          <div>
            <p>Peserta Didik,</p>
            <div class="h-16"></div>
            <p class="font-bold underline">${userData.name}</p>
            <p>NIS: ${userData.nis || ".................................."}</p>
          </div>
          <div>
            <p>Guru Pembimbing / Penguji,</p>
            <div class="h-16"></div>
            <p class="font-bold underline">( ............................................ )</p>
            <p>NIP. ..................................</p>
          </div>
        </div>
      </div>
    `;

    window.print();
  }

  // Edit User Profile Modal
  function showProfileModal() {
    SoundEngine.playClick();
    const modal = document.getElementById("profile-modal");
    const nameInput = document.getElementById("input-user-name");
    const classInput = document.getElementById("input-user-class");
    const levelBadge = document.getElementById("profile-level-badge");
    const xpBar = document.getElementById("profile-xp-bar");
    const xpText = document.getElementById("profile-xp-text");

    if (levelBadge) {
      levelBadge.textContent = `Level ${userData.level}`;
    }
    if (xpText) {
      xpText.textContent = `${userData.xp} / ${userData.xpMax} XP`;
    }
    if (xpBar) {
      const pct = Math.min(100, Math.round((userData.xp / userData.xpMax) * 100));
      xpBar.style.width = `${pct}%`;
    }

    if (modal && nameInput && classInput) {
      nameInput.value = userData.name;
      classInput.value = userData.class;
      modal.classList.remove("hidden");
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function resetStudentLevel() {
    try { SoundEngine.playClick(); } catch (e) {}
    if (!userData.isLoggedIn || !userData.name) {
      showToast("Silakan masuk dengan akun siswa terlebih dahulu!", "danger");
      return;
    }
    const studentName = userData.name;
    const isConfirmed = window.confirm(
      `Konfirmasi Reset Level & XP Siswa:\n\n` +
      `Apakah Anda yakin ingin mereset level dan perolehan XP untuk "${studentName}" kembali ke Level 1 (0 XP)?\n\n` +
      `Level saat ini: Level ${userData.level} (${userData.xp} / ${userData.xpMax} XP)\n\n` +
      `Perolehan level ini akan dikembalikan ke kondisi awal (Level 1, 0 XP). Jawaban kuis dan portofolio asesmen diagnostik tetap aman.`
    );
    if (!isConfirmed) return;

    userData.level = 1;
    userData.xp = 0;
    userData.xpMax = 500;
    saveUserData();
    updateHUD();

    // Update profile modal UI
    const levelBadge = document.getElementById("profile-level-badge");
    const xpBar = document.getElementById("profile-xp-bar");
    const xpText = document.getElementById("profile-xp-text");
    if (levelBadge) levelBadge.textContent = "Level 1";
    if (xpBar) xpBar.style.width = "0%";
    if (xpText) xpText.textContent = "0 / 500 XP";

    try { SoundEngine.playSuccess(); } catch (e) {}
    showToast(`Level & XP untuk "${studentName}" berhasil direset ke Level 1 (0 XP)!`, "success");
  }

  function saveProfileModal() {
    const nameInput = document.getElementById("input-user-name");
    const classInput = document.getElementById("input-user-class");
    let changedName = false;
    if (nameInput && nameInput.value.trim()) {
      const cleanName = nameInput.value.trim();
      if (cleanName !== userData.name) {
        changedName = true;
        // Persist old account before switching
        if (userData.name) {
          const oldKey = getAccountStorageKey(userData.name, userData.nis);
          try { localStorage.setItem(oldKey, JSON.stringify(userData)); } catch (e) {}
        }
        userData.name = cleanName;
        userData.role = cleanName.toLowerCase().includes("admin") ? "admin" : "student";
        if (typeof AppData !== "undefined" && AppData.students) {
          const match = AppData.students.find((s) => s.name.toLowerCase() === cleanName.toLowerCase());
          if (match) {
            userData.nis = match.nis;
            userData.group = match.group;
          }
        }
        isDiagnosticCompleted(userData.name, userData.nis);
      }
    }
    if (classInput && classInput.value.trim()) {
      userData.class = classInput.value.trim();
    }
    saveUserData();
    try { SoundEngine.playSuccess(); } catch (e) {}
    document.getElementById("profile-modal").classList.add("hidden");
    showToast("Profil berhasil diperbarui!", "success");
    if (changedName) {
      renderQuizScreen();
    }
  }

  return {
    init: () => {
      loadUserData();
      initTheme();
      populateStudentDatalist();
      checkAuth();
      updateHUD();
      renderK3Screen();
      renderAnatomyScreen();
      setupSimulationControls();
      renderQuizScreen();
      setMobileSimTab(activeMobileSimTab || "all");
      updateSimOutputs();

      // Sound toggle button
      const soundBtn = document.getElementById("btn-sound-toggle");
      if (soundBtn) {
        soundBtn.onclick = () => {
          const muted = SoundEngine.toggleMute();
          soundBtn.innerHTML = muted ? '<i data-lucide="volume-x" class="w-4 h-4"></i>' : '<i data-lucide="volume-2" class="w-4 h-4"></i>';
          if (window.lucide) {
            try { lucide.createIcons(); } catch (e) {}
          }
          showToast(muted ? "Audio dinonaktifkan" : "Audio aktif", "info");
        };
      }

      // Theme toggle button
      const themeBtn = document.getElementById("btn-theme-toggle");
      if (themeBtn) {
        themeBtn.onclick = () => {
          toggleTheme();
        };
      }

      // Responsive window resize listener (orientation changes & screen adaptation)
      window.addEventListener("resize", () => {
        if (userData.activeScreen === "screen-simulation") {
          if (window.innerWidth >= 1024) {
            const panelParams = document.getElementById("sim-panel-params");
            const panelViewport = document.getElementById("sim-panel-viewport");
            if (panelParams) panelParams.classList.remove("hidden");
            if (panelViewport) {
              panelViewport.classList.remove("hidden");
              panelViewport.classList.remove("order-first");
            }
          } else {
            setMobileSimTab(activeMobileSimTab);
          }
        }
      });

      // Attachment preview modal close on ESC and backdrop click
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeAttachmentPreview();
        }
      });
      const previewModal = document.getElementById("attachment-preview-modal");
      if (previewModal) {
        previewModal.addEventListener("click", (e) => {
          if (e.target === previewModal) {
            closeAttachmentPreview();
          }
        });
      }

      if (window.lucide) {
        try { lucide.createIcons(); } catch (e) {}
      }
    },

    navigateTo,
    toggleSidebar,
    toggleTheme,
    getTheme: () => currentTheme,
    verifyK3,
    setMachine: (mach) => {
      userData.activeMachine = mach;
      renderAnatomyScreen();
      if (anatomyViewMode === "3d" && typeof Lathe3D !== "undefined" && Lathe3D.AnatomyLab) {
        Lathe3D.AnatomyLab.setMachine(mach);
        Lathe3D.AnatomyLab.onResize();
      }
    },
    setAnatomyViewMode,
    setSimViewMode,
    setMobileSimTab,
    showPartModal,
    printLKPD,
    switchQuizPackage,
    toggleQuiz1FormulaCard,
    resetQuizAnswers,
    getCurrentQuizTab: () => currentQuizTab,
    handleQuiz1FileUpload,
    handleQuiz1DragOver,
    handleQuiz1DragLeave,
    handleQuiz1Drop,
    removeQuiz1Attachment,
    renderQuiz1AttachmentUI,
    previewQuiz1Attachment,
    closeAttachmentPreview,
    sendQuiz1ToSpreadsheet,
    showProfileModal,
    saveProfileModal,
    resetStudentLevel,
    openDiagnosticModal,
    closeDiagnosticModal,
    skipDiagnosticTest,
    submitDiagnosticTest,
    selectDiagnosticOption,
    reviewDiagnosticQuestions,
    login,
    quickLogin,
    logout,
    checkAuth,
    handleLoginForm,
    onStudentNameInput,
    populateStudentDatalist,
    showAdminPasswordSection,
    hideAdminPasswordSection,
    toggleAdminPasswordVisibility,
    verifyAdminPassword,
    getUserData: () => ({ ...userData }),
    sendGradesToSpreadsheet,
    startSimulation: () => {
      SimEngine.start(true);
      updateSimOutputs();
      showToast("▶ Siklus Pemotongan Dimulai (Pemakanan Otomatis Aktif)", "success");
    },
    stopSimulation: () => {
      SimEngine.stop();
      updateSimOutputs();
      showToast("⏸ Pemotongan Dijeda", "info");
    },
    resetSimulation: () => {
      SimEngine.reset();
      updateSimOutputs();
      showToast("🔄 Posisi Pahat & Benda Kerja Direset ke Awal", "info");
    },
    emergencyStop: () => {
      try { SoundEngine.playAlarm(); } catch (e) {}
      SimEngine.stop();
      updateSimOutputs();
      showToast("🚨 SAKELAR EMERGENCY STOP DIAKTIFKAN!", "danger");
    },
    toggleAutoFeed: () => {
      try { SoundEngine.playClick(); } catch (e) {}
      const active = SimEngine.toggleAutoFeed();
      updateSimOutputs();
      if (typeof lucide !== "undefined") {
        try { lucide.createIcons(); } catch (e) {}
      }
      if (active) {
        showToast("⚙ Pemakanan Otomatis DIAKTIFKAN", "success");
      } else {
        showToast("✋ Pemakanan Otomatis DINONAKTIFKAN (Mode Manual)", "info");
      }
    },
    toggleCoolant: () => {
      try { SoundEngine.playClick(); } catch (e) {}
      const newState = !SimEngine.getState().coolant;
      SimEngine.updateConfig({ coolant: newState });
      setupSimulationControls();
      updateSimOutputs();
      if (typeof lucide !== "undefined") {
        try { lucide.createIcons(); } catch (e) {}
      }
      showToast(newState ? "💧 Cairan Pendingin (Coolant) Dinyalakan" : "🚫 Cairan Pendingin (Coolant) Dimatikan", "info");
    },
    calcIdealRPM: () => {
      try { SoundEngine.playClick(); } catch (e) {}
      const curState = SimEngine.getState();
      const mat = (typeof AppData !== "undefined" && AppData.materials)
        ? (AppData.materials.find((m) => m.id === curState.materialId) || AppData.materials[0])
        : null;
      if (!mat) return;
      const recCs = curState.toolId === "carbide" ? mat.csCarbide : mat.csHSS;
      const midCs = (recCs.min + recCs.max) / 2;
      const effectiveDia = curState.machineType === "milling"
        ? (curState.endmillDia || 12)
        : (curState.diameter || 50);
      const idealRPM = Math.round((1000 * midCs) / (Math.PI * effectiveDia));
      const clampedRPM = Math.min(2200, Math.max(80, idealRPM));

      const rpmSlider = document.getElementById("slider-rpm");
      const rpmVal = document.getElementById("val-rpm");
      if (rpmSlider) rpmSlider.value = clampedRPM;
      if (rpmVal) rpmVal.textContent = `${clampedRPM} RPM`;

      SimEngine.updateConfig({ rpm: clampedRPM });
      updateSimOutputs();
      showToast(`⚡ Putaran Spindel diatur ke ${clampedRPM} RPM (Cs ideal: ${Math.round(midCs)} m/min, d: ${effectiveDia} mm)`, "success");
    },
    setSimMachine: (mach) => {
      try { SoundEngine.playClick(); } catch (e) {}
      SimEngine.reset();
      SimEngine.updateConfig({ machineType: mach });
      userData.activeMachine = mach;
      saveUserData();
      setupSimulationControls();
      updateSimOutputs();
    },
    setSimTool: (toolId) => {
      try { SoundEngine.playClick(); } catch (e) {}
      SimEngine.updateConfig({ toolId: toolId });
      setupSimulationControls();
      updateSimOutputs();
    },
    jogAxis: (axis, dir) => {
      executeAxisJog(axis.toUpperCase(), dir);
    }
  };
})();

// Global startup
function startApp() {
  try {
    App.init();
  } catch (err) {
    console.error("App.init error:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
