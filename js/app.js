/**
 * Main Application Controller & Gamification Logic
 * Styled for Materially React Admin Dashboard Design System
 */
const App = (function () {
  // User state with LocalStorage persistence
  const defaultUser = {
    name: "Ahmad Rizki",
    class: "XI Teknik Pemesinan 1",
    level: 1,
    xp: 180,
    xpMax: 500,
    safetyScore: 0,
    badges: [],
    learnedParts: [],
    quizAnswers: {},
    activeScreen: "screen-home",
    activeMachine: "lathe" // "lathe" or "milling"
  };

  let userData = { ...defaultUser };
  let anatomyViewMode = "3d";
  let simViewMode = "3d";

  const breadcrumbsMap = {
    "screen-home": "Dashboard / Ringkasan & Lobi Utama",
    "screen-k3": "Keselamatan Kerja / Ruang APD & SOP K3",
    "screen-anatomy": "Eksplorasi Mesin / Anatomi Bubut & Frais",
    "screen-simulation": "Laboratorium / Simulator Kecepatan Potong",
    "screen-quiz": "Evaluasi Mandiri / Uji Kompetensi & LKPD Digital"
  };

  function loadUserData() {
    try {
      const saved = localStorage.getItem("vmachining_user");
      if (saved) {
        userData = { ...defaultUser, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }

  function saveUserData() {
    try {
      localStorage.setItem("vmachining_user", JSON.stringify(userData));
    } catch (e) {}
    updateHUD();
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

    if (nameEl) nameEl.textContent = userData.name;
    if (classEl) classEl.textContent = userData.class;
    if (levelEl) levelEl.textContent = `Level ${userData.level}`;
    if (xpBarEl) {
      const pct = Math.min(100, Math.round((userData.xp / userData.xpMax) * 100));
      xpBarEl.style.width = `${pct}%`;
    }
    if (xpTextEl) xpTextEl.textContent = `${userData.xp} / ${userData.xpMax} XP`;
    if (safetyBadgeEl) {
      safetyBadgeEl.textContent = `${userData.safetyScore} Pts`;
    }
    if (statLearnedEl) {
      const totalParts = (AppData.latheParts?.length || 9) + (AppData.millingParts?.length || 13);
      statLearnedEl.textContent = `${userData.learnedParts.length} / ${totalParts}`;
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

  // Setup Simulation Controls
  function setupSimulationControls() {
    // Machine Operation toggle (Bubut vs Frais)
    const opLathe = document.getElementById("btn-sim-op-lathe");
    const opMilling = document.getElementById("btn-sim-op-milling");
    const curOp = SimEngine.getState().machineType;
    if (opLathe && opMilling) {
      if (curOp === "milling") {
        opMilling.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm";
        opLathe.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200";
      } else {
        opLathe.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm";
        opMilling.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200";
      }
      opLathe.onclick = () => {
        SoundEngine.playClick();
        SimEngine.reset();
        SimEngine.updateConfig({ machineType: "lathe" });
        setupSimulationControls();
        updateSimOutputs();
      };
      opMilling.onclick = () => {
        SoundEngine.playClick();
        SimEngine.reset();
        SimEngine.updateConfig({ machineType: "milling" });
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

    if (isMilling) {
      if (axisXTitle) axisXTitle.textContent = "Sumbu X";
      if (axisXSubtitle) axisXSubtitle.textContent = "Meja (Kiri/Kanan)";
      if (axisXMinusLabel) axisXMinusLabel.textContent = "◀ Kiri";
      if (axisXPlusLabel) axisXPlusLabel.textContent = "Kanan ▶";

      if (axisZTitle) axisZTitle.textContent = "Sumbu Z";
      if (axisZSubtitle) axisZSubtitle.textContent = "Lutut (Vertikal)";
      if (axisZMinusLabel) axisZMinusLabel.textContent = "⬇ Turun";
      if (axisZPlusLabel) axisZPlusLabel.textContent = "Naik ⬆";

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
        btn.className = `p-2.5 rounded-lg border text-left text-xs transition-all ${
          isActive
            ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold shadow-sm"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`;
        btn.innerHTML = `
          <div class="font-medium">${m.name.split("/")[0]}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${m.hardness}</div>
        `;
        btn.onclick = () => {
          SoundEngine.playClick();
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
        toolHss.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm";
        toolCarbide.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200";
      } else {
        toolCarbide.className = "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm";
        toolHss.className = "flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200";
      }
      toolHss.onclick = () => {
        SoundEngine.playClick();
        SimEngine.updateConfig({ toolId: "hss" });
        setupSimulationControls();
        updateSimOutputs();
      };
      toolCarbide.onclick = () => {
        SoundEngine.playClick();
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
        btn.className = "btn-endmill-dia py-2 rounded-lg border text-xs font-bold font-mono transition-all text-slate-700 bg-white hover:bg-slate-50 border-slate-200 cursor-pointer text-center";
      }
      btn.onclick = () => {
        SoundEngine.playClick();
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
    stepBtns.forEach((btn) => {
      btn.onclick = () => {
        SoundEngine.playClick();
        stepBtns.forEach((b) => {
          b.classList.remove("active", "bg-blue-600", "text-white");
          b.classList.add("text-slate-300");
        });
        btn.classList.add("active", "bg-blue-600", "text-white");
        btn.classList.remove("text-slate-300");
        jogStep = parseFloat(btn.dataset.step) || 0.5;
      };
    });

    // Helper for Manual Axis Feed (Jog)
    function executeAxisJog(axis, dir) {
      if (typeof SimEngine === "undefined") return;
      const res = SimEngine.jogAxis(axis, dir, jogStep);
      SoundEngine.playClick();

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

      btn.onmousedown = start;
      btn.onmouseup = end;
      btn.onmouseleave = end;
      btn.ontouchstart = start;
      btn.ontouchend = end;
      btn.ontouchcancel = end;
    }

    bindAxisJogBtn("btn-axis-x-minus", "X", -1); // X- Maju (Potong) / Kiri
    bindAxisJogBtn("btn-axis-x-plus", "X", 1);   // X+ Mundur (Bebas) / Kanan
    bindAxisJogBtn("btn-axis-y-minus", "Y", -1); // Y- Sadel Mundur
    bindAxisJogBtn("btn-axis-y-plus", "Y", 1);   // Y+ Sadel Maju
    bindAxisJogBtn("btn-axis-z-minus", "Z", -1); // Z- Ke Kiri (Makan) / Turun
    bindAxisJogBtn("btn-axis-z-plus", "Z", 1);   // Z+ Ke Kanan (Ekor) / Naik

    // Keyboard Shortcuts for Manual Feed
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
        }
      }
    });

    updateSimOutputs();
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

    // Update DRO (Digital Readout) Displays
    const droX = document.getElementById("dro-axis-x");
    const droY = document.getElementById("dro-axis-y");
    const droZ = document.getElementById("dro-axis-z");
    const droSpindle = document.getElementById("dro-spindle-state");

    const isMilling = state.machineType === "milling";

    if (droX) {
      if (isMilling) {
        const valX = (typeof state.axisX === "number" ? state.axisX : 0).toFixed(2);
        droX.textContent = (state.axisX >= 0 ? "+" : "") + valX;
        droX.parentElement.setAttribute("title", `Sumbu X: Posisi Memanjang Meja ${valX} mm`);
      } else {
        const depth = state.depthOfCut || 1.5;
        const turnedDia = Math.max(0, state.diameter - (depth * 2));
        droX.textContent = `+${depth.toFixed(2)}`;
        droX.parentElement.setAttribute("title", `Sumbu X: Kedalaman Potong ${depth.toFixed(2)} mm (Diameter hasil: Ø ${turnedDia.toFixed(2)} mm)`);
      }
    }

    if (droY) {
      const valY = (typeof state.axisY === "number" ? state.axisY : 0).toFixed(2);
      droY.textContent = (state.axisY >= 0 ? "+" : "") + valY;
      droY.parentElement.setAttribute("title", `Sumbu Y: Posisi Melintang Sadel ${valY} mm`);
    }

    if (droZ) {
      if (isMilling) {
        const valZ = (typeof state.axisZ === "number" ? state.axisZ : 0).toFixed(2);
        droZ.textContent = (state.axisZ >= 0 ? "+" : "") + valZ;
        droZ.parentElement.setAttribute("title", `Sumbu Z: Posisi Vertikal Lutut ${valZ} mm`);
      } else {
        const currentZmm = (state.cutProgress * (state.length || 120)).toFixed(1);
        droZ.textContent = `${currentZmm}`;
        droZ.parentElement.setAttribute("title", `Sumbu Z: Panjang Pemotongan ${currentZmm} mm dari total ${state.length || 120} mm`);
      }
    }

    // Update Auto-Feed Button State
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

  // Render Quiz Challenges
  function renderQuizScreen() {
    const container = document.getElementById("quiz-questions-container");
    if (!container) return;
    container.innerHTML = "";

    AppData.quizChallenges.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "mat-card mb-4";
      const isAnswered = userData.quizAnswers[q.id] !== undefined;
      const selectedOpt = userData.quizAnswers[q.id];

      let optionsHtml = "";
      q.options.forEach((opt, optIdx) => {
        let optClass = "p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all mb-2 flex items-center justify-between ";
        if (isAnswered) {
          if (optIdx === q.correct) {
            optClass += "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold";
          } else if (optIdx === selectedOpt) {
            optClass += "bg-red-50 border-red-500 text-red-900 font-semibold";
          } else {
            optClass += "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
          }
        } else {
          optClass += "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50";
        }

        optionsHtml += `
          <div class="${optClass}" data-qid="${q.id}" data-opt="${optIdx}">
            <span>${String.fromCharCode(65 + optIdx)}. ${opt}</span>
            ${
              isAnswered && optIdx === q.correct
                ? '<span class="text-emerald-700 font-bold">✓ Benar</span>'
                : isAnswered && optIdx === selectedOpt
                ? '<span class="text-red-700 font-bold">✗ Salah</span>'
                : ""
            }
          </div>
        `;
      });

      card.innerHTML = `
        <div class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="mat-badge mat-badge-primary">
              Level ${q.level} • ${q.category}
            </span>
            <span class="text-xs text-slate-400 font-medium">Soal ${idx + 1} dari ${AppData.quizChallenges.length}</span>
          </div>
          <h4 class="font-semibold text-sm text-slate-800 mb-3">${q.question}</h4>
          ${q.formulaHint ? `<div class="mb-3 p-2.5 bg-blue-50/60 border border-blue-200 rounded text-xs text-blue-800 font-mono">💡 Rumus Petunjuk: ${q.formulaHint}</div>` : ""}
          <div class="options-group">${optionsHtml}</div>
          ${
            isAnswered
              ? `<div class="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong>Pembahasan:</strong> ${q.explanation}
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
            userData.quizAnswers[qid] = chosen;

            if (chosen === q.correct) {
              SoundEngine.playSuccess();
              addXP(50);
              showToast("Jawaban Benar! +50 XP", "success");
            } else {
              SoundEngine.playWarning();
              showToast("Jawaban Kurang Tepat!", "danger");
            }
            saveUserData();
            renderQuizScreen();
          };
        });
      }

      container.appendChild(card);
    });

    // Check if all answered
    const totalQ = AppData.quizChallenges.length;
    const answeredCount = Object.keys(userData.quizAnswers).length;
    const correctCount = AppData.quizChallenges.filter(
      (q) => userData.quizAnswers[q.id] === q.correct
    ).length;

    const summaryEl = document.getElementById("quiz-summary-box");
    if (summaryEl && answeredCount === totalQ) {
      summaryEl.classList.remove("hidden");
      summaryEl.innerHTML = `
        <div class="p-5 rounded-xl border border-blue-200 bg-blue-50/90 text-blue-950 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 class="font-bold text-base text-blue-900">Hasil Evaluasi Mandiri</h4>
            <p class="text-xs text-slate-600 mt-1">Skor Kuis: <strong class="text-emerald-700 font-bold">${correctCount} / ${totalQ} Benar (${Math.round((correctCount / totalQ) * 100)}%)</strong></p>
          </div>
          <button onclick="App.printLKPD()" class="mat-btn mat-btn-primary">
            <i data-lucide="printer" class="w-4 h-4"></i>
            <span>Cetak / Unduh LKPD Digital (PDF)</span>
          </button>
        </div>
      `;
      unlockBadge("quiz_master", "Master Teori Pemesinan");
      if (window.lucide) lucide.createIcons();
    }
  }

  // Print LKPD Generator
  function printLKPD() {
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
            <p><strong>Kelas / Konsentrasi:</strong> ${userData.class}</p>
          </div>
          <div>
            <p><strong>Level Kompetensi:</strong> Level ${userData.level} (${userData.xp} XP)</p>
            <p><strong>Komponen Mesin Dipelajari:</strong> ${userData.learnedParts.length} Bagian</p>
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
        <div class="border p-4 rounded text-xs leading-relaxed mb-8 bg-gray-50">
          <p><strong>Status Analisis:</strong> ${sim.evaluation.desc}</p>
          <p class="mt-2 text-gray-600">Berdasarkan hasil uji coba virtual, pemilihan parameter putaran spindel dan kecepatan pemakanan sangat mempengaruhi kualitas kehalusan permukaan serta keawetan mata pahat.</p>
        </div>

        <div class="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-8">
          <div>
            <p>Peserta Didik,</p>
            <div class="h-16"></div>
            <p class="font-bold underline">${userData.name}</p>
            <p>NISN. ..................................</p>
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
    if (modal && nameInput && classInput) {
      nameInput.value = userData.name;
      classInput.value = userData.class;
      modal.classList.remove("hidden");
    }
  }

  function saveProfileModal() {
    const nameInput = document.getElementById("input-user-name");
    const classInput = document.getElementById("input-user-class");
    if (nameInput && nameInput.value.trim()) {
      userData.name = nameInput.value.trim();
    }
    if (classInput && classInput.value.trim()) {
      userData.class = classInput.value.trim();
    }
    saveUserData();
    SoundEngine.playSuccess();
    document.getElementById("profile-modal").classList.add("hidden");
    showToast("Profil berhasil diperbarui!", "success");
  }

  return {
    init: () => {
      loadUserData();
      updateHUD();
      renderK3Screen();
      renderAnatomyScreen();
      setupSimulationControls();
      renderQuizScreen();

      // Sound toggle button
      const soundBtn = document.getElementById("btn-sound-toggle");
      if (soundBtn) {
        soundBtn.onclick = () => {
          const muted = SoundEngine.toggleMute();
          soundBtn.innerHTML = muted ? '<i data-lucide="volume-x" class="w-4 h-4"></i>' : '<i data-lucide="volume-2" class="w-4 h-4"></i>';
          if (window.lucide) lucide.createIcons();
          showToast(muted ? "Audio dinonaktifkan" : "Audio aktif", "info");
        };
      }

      // Profile edit button
      const profBtn = document.getElementById("btn-edit-profile");
      if (profBtn) profBtn.onclick = showProfileModal;

      if (window.lucide) lucide.createIcons();
    },

    navigateTo,
    toggleSidebar,
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
    showPartModal,
    printLKPD,
    showProfileModal,
    saveProfileModal
  };
})();

// Global startup
window.addEventListener("DOMContentLoaded", () => {
  App.init();
});
