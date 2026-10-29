/**
 * ESD V-Lab — Precision Machining Operations Animation Engine
 * Renders 60 FPS mechanically authentic, collision-free 2D technical animations
 * for Lathe and Milling operations.
 */

const OperationsEngine = (function () {
  let canvas = null;
  let ctx = null;
  let animFrameId = null;

  // State
  let currentOperation = null;
  let currentStepIdx = 0;
  let isPlaying = false;
  let playbackSpeed = 1.0;
  let stepProgress = 0.0; // 0.0 to 1.0 inside current step
  let lastTimestamp = 0;
  let onStepChangeCallback = null;

  // Visual Animation State (Smooth Lerp Target / Current & Continuous Feed)
  const animState = {
    // Lathe parameters
    eretanAngle: 0,
    startEretanAngle: 0,
    targetEretanAngle: 0,

    toolX: 180,
    startToolX: 180,
    targetToolX: 180,

    toolZ: 260,
    startToolZ: 260,
    targetToolZ: 260,

    spindleRunning: false,
    spindleAngle: 0,
    spindleRpm: 0,
    isCutting: false,
    boltsLoose: false,
    coolantOn: false,
    quillExtended: 0,
    tailstockX: 172,
    tailstockClamped: true,
    tailstockHandwheelAngle: 0,
    centerHoleDepth: 0,
    isPeckingRetract: false,
    compoundFeed: 0,
    startCompoundFeed: 0,
    targetCompoundFeed: 0,
    compoundHandwheelAngle: 0,
    carriageLocked: false,
    isThreadingCutting: false,
    isThreadingRetracting: false,
    isThreadingReturning: false,

    // Milling parameters
    tableX: 0,
    startTableX: 0,
    targetTableX: 0,

    tableY: 0,
    startTableY: 0,
    targetTableY: 0,

    quillZ: 70,
    startQuillZ: 70,
    targetQuillZ: 70,

    cutterRotating: false,
    cutterAngle: 0,

    // Dynamic cut progression
    cutDepthProgress: 0, // 0 to 1
    chips: []
  };

  // Color Palette (Industrial Material Precision)
  const COLORS = {
    bgLight: "#0f172a", // Deep slate engineering dark blueprint canvas
    bgGrid: "rgba(51, 65, 85, 0.4)",
    metalCastIron: "#334155",
    metalCastIronDark: "#1e293b",
    metalSteel: "#94a3b8",
    metalSteelBright: "#e2e8f0",
    metalSteelDark: "#475569",
    metalBrass: "#d97706",
    metalCarbideGold: "#f59e0b",
    accentBlue: "#3b82f6",
    accentCyan: "#06b6d4",
    accentEmerald: "#10b981",
    accentAmber: "#f59e0b",
    accentRed: "#ef4444",
    coolant: "#38bdf8",
    sparkChip: "#fef08a"
  };

  /**
   * Initialize canvas and start render loop
   */
  function init(canvasElementId, onStepChange) {
    canvas = document.getElementById(canvasElementId);
    if (!canvas) {
      console.warn("Canvas element not found:", canvasElementId);
      return;
    }

    ctx = canvas.getContext("2d");
    onStepChangeCallback = onStepChange;

    setupCanvasDPI();
    window.addEventListener("resize", setupCanvasDPI);

    // Click handler for interactive Canvas buttons (Zoom Toggle)
    canvas.addEventListener("click", (evt) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = evt.clientX - rect.left;
      const clickY = evt.clientY - rect.top;

      if (currentOperation && currentOperation.machine === "milling") {
        return;
      }
    });

    canvas.addEventListener("mousemove", (evt) => {
      const rect = canvas.getBoundingClientRect();
      const moveX = evt.clientX - rect.left;
      const moveY = evt.clientY - rect.top;

      if (currentOperation && currentOperation.machine === "milling") {
        canvas.style.cursor = "default";
        return;
      }
      canvas.style.cursor = "default";
    });

    // Default operation (loads lathe facing)
    if (typeof MachiningOperationsData !== "undefined" && MachiningOperationsData.lathe) {
      setOperation("lathe_facing");
    }

    isPlaying = true; // Auto-play by default so animations run immediately!
    lastTimestamp = performance.now();
    startLoop();
  }

  function setupCanvasDPI() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = (rect && rect.width > 0) ? rect.width : 800;
    const h = (rect && rect.height > 0) ? rect.height : 480;

    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  function setOperation(opId) {
    if (typeof MachiningOperationsData === "undefined") return;

    let found = null;
    if (MachiningOperationsData.lathe) {
      found = MachiningOperationsData.lathe.find((o) => o.id === opId);
    }
    if (!found && MachiningOperationsData.milling) {
      found = MachiningOperationsData.milling.find((o) => o.id === opId);
    }

    if (!found) return;

    currentOperation = found;
    currentStepIdx = 0;
    stepProgress = 0.0;
    isPlaying = true; // Auto-play when user selects an operation!
    animState.chips = [];
    animState.compoundFeed = 0;
    animState.startCompoundFeed = 0;
    animState.targetCompoundFeed = 0;
    animState.compoundHandwheelAngle = 0;
    animState.carriageLocked = false;

    syncStepVisualTargets(0, true);

    if (onStepChangeCallback) {
      onStepChangeCallback(currentStepIdx, currentOperation.steps[currentStepIdx], currentOperation);
    }
  }

  function syncStepVisualTargets(stepIdx, immediate = false) {
    if (!currentOperation || !currentOperation.steps[stepIdx]) return;
    const s = currentOperation.steps[stepIdx];

    if (currentOperation.machine === "lathe") {
      animState.startEretanAngle = immediate ? (s.eretanAngle !== undefined ? s.eretanAngle : 0) : animState.eretanAngle;
      animState.targetEretanAngle = s.eretanAngle !== undefined ? s.eretanAngle : 0;

      animState.startCompoundFeed = immediate ? (s.compoundFeed !== undefined ? s.compoundFeed : 0) : animState.compoundFeed;
      animState.targetCompoundFeed = s.compoundFeed !== undefined ? s.compoundFeed : 0;
      animState.carriageLocked = !!s.carriageLocked;

      animState.startToolX = (s.startToolX !== undefined) ? s.startToolX : (immediate ? (s.toolX !== undefined ? s.toolX : 180) : animState.toolX);
      animState.targetToolX = s.toolX !== undefined ? s.toolX : 180;

      animState.startToolZ = (s.startToolZ !== undefined) ? s.startToolZ : (immediate ? (s.toolZ !== undefined ? s.toolZ : 260) : animState.toolZ);
      animState.targetToolZ = s.toolZ !== undefined ? s.toolZ : 260;

      animState.spindleRunning = !!s.spindleRunning;
      animState.isCutting = !!s.isCutting;
      animState.boltsLoose = !!s.boltsLoose;
      animState.coolantOn = !!s.coolantOn;
      if (currentOperation.id === "lathe_threading") {
        animState.isThreadingCutting = false;
        animState.isThreadingRetracting = false;
        animState.isThreadingReturning = false;
      }
      if (currentOperation.id === "lathe_center_drilling") {
        if (stepIdx === 0) {
          animState.tailstockX = 195;
          animState.tailstockClamped = false;
          animState.quillExtended = 0;
          animState.centerHoleDepth = 0;
        } else if (stepIdx === 1) {
          animState.tailstockX = immediate ? 172 : animState.tailstockX;
          animState.tailstockClamped = immediate;
          animState.quillExtended = 0;
          animState.centerHoleDepth = 0;
        } else if (stepIdx === 2) {
          animState.tailstockX = 172;
          animState.tailstockClamped = true;
          animState.quillExtended = immediate ? 27.0 : 0;
          animState.centerHoleDepth = immediate ? 9.0 : 0;
        } else if (stepIdx === 3) {
          animState.tailstockX = 172;
          animState.tailstockClamped = true;
          animState.quillExtended = 0;
          animState.centerHoleDepth = 9.0;
        }
      } else {
        animState.quillExtended = 0;
      }

      if (immediate) {
        animState.eretanAngle = animState.targetEretanAngle;
        animState.compoundFeed = animState.targetCompoundFeed;
        animState.toolX = animState.targetToolX;
        animState.toolZ = animState.targetToolZ;
        animState.cutDepthProgress = s.isCutting ? 1.0 : (stepIdx >= 6 ? 1.0 : 0);
      }
    } else {
      animState.startTableX = immediate ? (s.tableX !== undefined ? s.tableX : 0) : animState.tableX;
      animState.targetTableX = s.tableX !== undefined ? s.tableX : 0;

      animState.startTableY = immediate ? (s.tableY !== undefined ? s.tableY : 0) : animState.tableY;
      animState.targetTableY = s.tableY !== undefined ? s.tableY : 0;

      animState.startQuillZ = immediate ? (s.quillZ !== undefined ? s.quillZ : 70) : animState.quillZ;
      animState.targetQuillZ = s.quillZ !== undefined ? s.quillZ : 70;

      animState.cutterRotating = !!s.cutterRotating;
      animState.isCutting = !!s.isCutting;
      animState.coolantOn = !!s.coolantOn;

      if (immediate) {
        animState.tableX = animState.targetTableX;
        animState.tableY = animState.targetTableY;
        animState.quillZ = animState.targetQuillZ;
        animState.cutDepthProgress = s.isCutting ? 1.0 : (stepIdx >= 4 ? 1.0 : 0);
      }
    }
  }

  // Playback Controls
  function play() {
    isPlaying = true;
  }

  function pause() {
    isPlaying = false;
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    return isPlaying;
  }

  function setSpeed(speed) {
    playbackSpeed = Math.max(0.25, Math.min(3.0, speed));
  }

  function nextStep() {
    if (!currentOperation) return;
    if (currentStepIdx < currentOperation.steps.length - 1) {
      currentStepIdx++;
      stepProgress = 0.0;
      syncStepVisualTargets(currentStepIdx);
      if (onStepChangeCallback) {
        onStepChangeCallback(currentStepIdx, currentOperation.steps[currentStepIdx], currentOperation);
      }
    } else {
      // Loop seamlessly back to beginning so the cycle continues
      currentStepIdx = 0;
      stepProgress = 0.0;
      syncStepVisualTargets(0);
      if (onStepChangeCallback) {
        onStepChangeCallback(0, currentOperation.steps[0], currentOperation);
      }
    }
  }

  function prevStep() {
    if (!currentOperation) return;
    if (currentStepIdx > 0) {
      currentStepIdx--;
      stepProgress = 0.0;
      syncStepVisualTargets(currentStepIdx);
      if (onStepChangeCallback) {
        onStepChangeCallback(currentStepIdx, currentOperation.steps[currentStepIdx], currentOperation);
      }
    }
  }

  function goToStep(index) {
    if (!currentOperation || index < 0 || index >= currentOperation.steps.length) return;
    currentStepIdx = index;
    stepProgress = 0.0;
    syncStepVisualTargets(currentStepIdx);
    if (onStepChangeCallback) {
      onStepChangeCallback(currentStepIdx, currentOperation.steps[currentStepIdx], currentOperation);
    }
  }

  function resetOperation() {
    goToStep(0);
    isPlaying = true; // Auto-play when resetting
  }

  // Main Render Loop
  function startLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    function loop(time) {
      try {
        const dt = Math.min(0.06, (time - lastTimestamp) / 1000);
        lastTimestamp = time;

        update(dt);
        render();
      } catch (err) {
        console.error("OperationsEngine render error:", err);
      }

      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
  }

  function update(dt) {
    if (!currentOperation) return;

    const currentStep = currentOperation.steps[currentStepIdx] || {};

    // Handle auto-advancing step progress when playing
    if (isPlaying) {
      // Active cutting steps get dedicated duration (~7.2s) for observable feed motion and chip creation
      const isCutting = !!currentStep.isCutting;
      const baseDuration = isCutting ? 7.2 : 3.6;
      const stepDuration = baseDuration / playbackSpeed;
      stepProgress += dt / stepDuration;
      if (stepProgress >= 1.0) {
        nextStep();
      }
    }

    // Continuous Kinematic Interpolation for Active Mechanical Motion
    if (currentOperation.machine === "lathe") {
      const p = Math.min(1.0, Math.max(0.0, stepProgress));

      if (currentOperation.id === "lathe_facing") {
        const act = currentStep.visualAction;
        if (act === "align_center_height") {
          // Langkah 1: Pahat sejajar ujung senter putar (X=75, Y=0) dengan efek floating halus
          const floatOffset = Math.sin(performance.now() * 0.005) * 1.5;
          animState.toolZ = 251;
          animState.toolX = 119 + floatOffset;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 0;
        } else if (act === "touch_face_z0") {
          // Langkah 2: Eretan memanjang bergeser perlahan mendekati muka ujung benda kerja
          const touchP = Math.min(1.0, p / 0.65);
          animState.toolZ = 262 - (262 - 251) * touchP;
          animState.toolX = 155;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 0;
          if (p >= 0.65 && Math.random() < 0.7) {
            // Percikan gesekan touching muka ujung
            spawnChip(75, 14 + (Math.random() - 0.5) * 4, 20 + Math.random() * 25, (Math.random() - 0.5) * 35, COLORS.sparkChip);
          }
        } else if (act === "feed_axial_depth") {
          // Langkah 3: Tarik radial ke luar diameter, lalu infeed aksial ap = 0,8 mm, lalu kunci eretan
          if (p < 0.45) {
            const subP = p / 0.45;
            animState.toolX = 155 + (190 - 155) * subP;
            animState.toolZ = 251;
            animState.carriageLocked = false;
          } else if (p < 0.85) {
            const subP = (p - 0.45) / 0.40;
            animState.toolX = 190;
            animState.toolZ = 251 - (251 - 249) * subP;
            animState.carriageLocked = false;
          } else {
            animState.toolX = 190;
            animState.toolZ = 249;
            animState.carriageLocked = true;
          }
          animState.cutDepthProgress = 0;
        } else if (act === "cut_facing_pass") {
          // Langkah 4: Pemakanan radial konstan dari diameter luar (Y=30) menuju titik pusat senter (Y=0)
          animState.toolZ = 249;
          animState.toolX = 190 - (190 - 119) * p;
          animState.carriageLocked = true;
          animState.cutDepthProgress = p;
          if (Math.random() < 0.85) {
            const cutPt = getLatheCutPoint();
            // Tatal melengkung mengkilap terlempar ke samping
            spawnChip(cutPt.x, cutPt.y + (Math.random() - 0.5) * 6, 25 + Math.random() * 35, (Math.random() - 0.5) * 40, COLORS.sparkChip);
          }
        } else if (act === "inspect_facing") {
          // Langkah 5: Pahat ditarik mundur ke posisi aman, spindel berhenti
          const retP = Math.min(1.0, p / 0.25);
          animState.toolX = 119 + (190 - 119) * retP;
          animState.toolZ = 249 + (265 - 249) * retP;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 1.0;
        }
      } else if (currentOperation.id === "lathe_straight") {
        const act = currentStep.visualAction;
        if (act === "clamp_workpiece") {
          // Langkah 1: Pencekaman & Uji Run-out. Pahat aman di luar
          animState.toolX = 210;
          animState.toolZ = 260;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 0;
        } else if (act === "touch_diameter_x0") {
          // Langkah 2: Touching diameter luar. Pahat maju perlahan dari Y=40 ke Y=30 (toolX 210 -> 187)
          const touchP = Math.min(1.0, p / 0.65);
          animState.toolX = 210 - (210 - 187) * touchP;
          animState.toolZ = 210;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 0;
          if (p >= 0.65 && Math.random() < 0.65) {
            const cutPt = getLatheCutPoint();
            spawnChip(cutPt.x, 30, (Math.random() - 0.5) * 35, 25 + Math.random() * 25, COLORS.sparkChip);
          }
        } else if (act === "set_radial_depth") {
          // Langkah 3: Tarik ke kanan melewati ujung benda kerja (Z=256), lalu maju infeed radial ke Y=25 (toolX=176)
          if (p < 0.45) {
            const subP = p / 0.45;
            animState.toolZ = 210 + (256 - 210) * subP;
            animState.toolX = 200;
          } else {
            const subP = (p - 0.45) / 0.55;
            animState.toolZ = 256;
            animState.toolX = 200 - (200 - 176) * subP;
          }
          animState.carriageLocked = false;
          animState.cutDepthProgress = 0;
        } else if (act === "cut_straight_longitudinal") {
          // Langkah 4: Pemakanan memanjang arah kanan ke kiri (Z dari 252 ke 104)
          // Mata pahat tetap strictly di sisi luar (toolX = 176, Y_tip = 25.0 mm)
          animState.toolX = 176;
          animState.toolZ = 252 - (252 - 104) * p;
          animState.cutDepthProgress = p;
          animState.carriageLocked = false;
          if (Math.random() < 0.85) {
            const cutPt = getLatheCutPoint();
            // Tatal pita terkelupas mengalir halus ke samping belakang
            spawnChip(cutPt.x, 25 + (Math.random() - 0.5) * 4, -30 - Math.random() * 40, 30 + Math.random() * 40, COLORS.sparkChip);
          }
        } else if (act === "measure_diameter") {
          // Langkah 5: Pengukuran diameter. Pahat mundur ke posisi aman
          const retP = Math.min(1.0, p / 0.25);
          animState.toolX = 176 + (215 - 176) * retP;
          animState.toolZ = 104 + (265 - 104) * retP;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 1.0;
        }
      } else if (currentOperation.id === "lathe_step") {
        const act = currentStep.visualAction;
        if (act === "mark_step_boundaries") {
          // Langkah 1: Penandaan batas panjang tingkatan L = 110 mm (X = -35) dan L1 = 55 mm (X = 20)
          // Benda kerja masih utuh mentah D0 = 60 mm. Pahat/penggores bergerak memberi tanda goresan batas
          if (p < 0.40) {
            // Bergerak ke batas L = 110 mm (X = -35, toolZ = 104)
            const subP = p / 0.40;
            animState.toolZ = 250 - (250 - 104) * subP;
            animState.toolX = 210 - (210 - 187) * Math.sin(subP * Math.PI);
          } else if (p < 0.75) {
            // Bergerak ke batas L1 = 55 mm (X = 20, toolZ = 178)
            const subP = (p - 0.40) / 0.35;
            animState.toolZ = 104 + (178 - 104) * subP;
            animState.toolX = 210 - (210 - 187) * Math.sin(subP * Math.PI);
          } else {
            // Mundur ke posisi aman
            const subP = (p - 0.75) / 0.25;
            animState.toolZ = 178 + (250 - 178) * subP;
            animState.toolX = 187 + (210 - 187) * subP;
          }
          animState.carriageLocked = false;
          animState.cutDepthProgress = 0;
        } else if (act === "cut_step_diameter_48") {
          // Langkah 2: Pembubutan Diameter 48 mm (R = 24 mm, toolX = 174) sepanjang total 110 mm
          // Gerak makan memanjang dari muka ujung kanan (Z = 252, X_tip = 75) ke batas bahu utama (Z = 104, X_tip = -35)
          animState.toolX = 174;
          animState.toolZ = 252 - (252 - 104) * p;
          animState.cutDepthProgress = p;
          animState.carriageLocked = false;
          if (Math.random() < 0.85) {
            const cutPt = getLatheCutPoint();
            spawnChip(cutPt.x, 24 + (Math.random() - 0.5) * 4, -30 - Math.random() * 40, 30 + Math.random() * 40, COLORS.sparkChip);
          }
        } else if (act === "inspect_step_stage_1") {
          // Langkah 3: Pemeriksaan diameter 48 mm dan panjang total 110 mm dengan Jangka Sorong Asli
          const retP = Math.min(1.0, p / 0.25);
          animState.toolX = 174 + (215 - 174) * retP;
          animState.toolZ = 104 + (265 - 104) * retP;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 1.0;
        } else if (act === "cut_step_diameter_36") {
          // Langkah 4: Pembubutan Diameter Tingkat Kedua 36 mm (R = 18 mm, toolX = 160) sepanjang 55 mm
          // Gerak makan memanjang dari muka ujung kanan (Z = 252, X_tip = 75) ke batas tingkat kedua (Z = 178, X_tip = 20)
          animState.toolX = 160;
          animState.toolZ = 252 - (252 - 178) * p;
          animState.cutDepthProgress = p;
          animState.carriageLocked = false;
          if (Math.random() < 0.85) {
            const cutPt = getLatheCutPoint();
            spawnChip(cutPt.x, 18 + (Math.random() - 0.5) * 4, -30 - Math.random() * 40, 30 + Math.random() * 40, COLORS.sparkChip);
          }
        } else if (act === "inspect_step_stage_2") {
          // Langkah 5: Chamfer ujung & Pemeriksaan dimensi dengan Sisi Belakang (Depth Bar) & Kepala Jangka Sorong
          const retP = Math.min(1.0, p / 0.25);
          animState.toolX = 160 + (215 - 160) * retP;
          animState.toolZ = 178 + (265 - 178) * retP;
          animState.carriageLocked = false;
          animState.cutDepthProgress = 1.0;
        }
      } else if (currentOperation.id === "lathe_center_drilling") {
        const act = currentStep.visualAction;
        // Carriage remains safely parked away
        animState.toolZ = 260;
        animState.toolX = 215;
        animState.carriageLocked = false;

        if (act === "mount_center_drill") {
          // Langkah 1: Kepala lepas di posisi aman parkir (tsX = 185), klem terbuka
          animState.tailstockX = 185;
          animState.tailstockClamped = false;
          animState.quillExtended = 0;
          animState.centerHoleDepth = 0;
        } else if (act === "clamp_tailstock") {
          // Langkah 2: Menggeser kepala lepas dari 185 ke 172 (jarak aman 18 mm), lalu klem dikencangkan
          if (p < 0.65) {
            const slideP = p / 0.65;
            animState.tailstockX = 185 - (185 - 172) * slideP;
            animState.tailstockClamped = false;
          } else {
            animState.tailstockX = 172;
            animState.tailstockClamped = true;
          }
          animState.quillExtended = 0;
          animState.centerHoleDepth = 0;
        } else if (act === "drill_center_hole") {
          // Langkah 3: Pengeboran Senter Maju-Mundur (Siklus Pecking Bertahap 2/3 Tirus 60°)
          animState.tailstockX = 172;
          animState.tailstockClamped = true;

          // Perhitungan Siklus Maju-Mundur (Pecking Kinematics):
          // Jarak ujung bor ke muka benda kerja di X = 75 adalah 18 mm (quillExt = 18 mm menyentuh muka)
          // Kedalaman lubang maksimum adalah 9 mm (quillExt = 27 mm)
          let qExt = 0;
          let hDepth = 0;
          let isRetract = false;
          let hwSpeed = 0;

          if (p < 0.12) {
            // Fase 1: Pendekatan Cepat (Approach 0 s.d. 18 mm)
            const subP = p / 0.12;
            qExt = 18 * subP;
            hDepth = 0;
            isRetract = false;
            hwSpeed = 14.0;
          } else if (p < 0.28) {
            // Fase 2: Penetrasi 1 - Bor Pemandu (Pilot Hole 0 s.d. 3.5 mm)
            const subP = (p - 0.12) / (0.28 - 0.12);
            qExt = 18 + 3.5 * subP;
            hDepth = 3.5 * subP;
            isRetract = false;
            hwSpeed = 8.0;
            if (Math.random() < 0.75) {
              spawnChip(75 - hDepth, (Math.random() - 0.5) * 3, 20 + Math.random() * 25, (Math.random() - 0.5) * 20, COLORS.sparkChip);
            }
          } else if (p < 0.38) {
            // Fase 3: Mundur 1 (Retract 1) - Membuang Tatal & Pendinginan
            const subP = (p - 0.28) / (0.38 - 0.28);
            qExt = 21.5 - (21.5 - 17.0) * subP;
            hDepth = 3.5;
            isRetract = true;
            hwSpeed = -16.0;
            // Tatal tersembur keluar saat bor ditarik mundur
            if (Math.random() < 0.8) {
              spawnChip(75, (Math.random() - 0.5) * 4, 30 + Math.random() * 35, (Math.random() - 0.5) * 30, COLORS.sparkChip);
            }
          } else if (p < 0.44) {
            // Fase 4: Maju Kembali Cepat (Rapid Return)
            const subP = (p - 0.38) / (0.44 - 0.38);
            qExt = 17.0 + (21.5 - 17.0) * subP;
            hDepth = 3.5;
            isRetract = false;
            hwSpeed = 16.0;
          } else if (p < 0.62) {
            // Fase 5: Penetrasi 2 - Membentuk Awal Tirus 60° (Kedalaman 3.5 s.d. 6.5 mm)
            const subP = (p - 0.44) / (0.62 - 0.44);
            qExt = 21.5 + (24.5 - 21.5) * subP;
            hDepth = 3.5 + (6.5 - 3.5) * subP;
            isRetract = false;
            hwSpeed = 7.0;
            if (Math.random() < 0.85) {
              spawnChip(75 - hDepth, (Math.random() - 0.5) * 4, 25 + Math.random() * 30, (Math.random() - 0.5) * 25, COLORS.sparkChip);
            }
          } else if (p < 0.72) {
            // Fase 6: Mundur 2 (Retract 2) - Evakuasi Tatal Kedalaman (Mencegah Bor Patah)
            const subP = (p - 0.62) / (0.72 - 0.62);
            qExt = 24.5 - (24.5 - 17.0) * subP;
            hDepth = 6.5;
            isRetract = true;
            hwSpeed = -16.0;
            if (Math.random() < 0.85) {
              spawnChip(75, (Math.random() - 0.5) * 4, 35 + Math.random() * 35, (Math.random() - 0.5) * 30, COLORS.sparkChip);
            }
          } else if (p < 0.78) {
            // Fase 7: Maju Kembali Cepat ke Dasar Sayatan (Rapid Return 2)
            const subP = (p - 0.72) / (0.78 - 0.72);
            qExt = 17.0 + (24.5 - 17.0) * subP;
            hDepth = 6.5;
            isRetract = false;
            hwSpeed = 16.0;
          } else if (p < 0.92) {
            // Fase 8: Penetrasi 3 - Menyelesaikan Kedalaman Standar 2/3 Tirus (6.5 s.d. 9.0 mm)
            const subP = (p - 0.78) / (0.92 - 0.78);
            qExt = 24.5 + (27.0 - 24.5) * subP;
            hDepth = 6.5 + (9.0 - 6.5) * subP;
            isRetract = false;
            hwSpeed = 6.0;
            if (Math.random() < 0.85) {
              spawnChip(75 - hDepth, (Math.random() - 0.5) * 4, 25 + Math.random() * 30, (Math.random() - 0.5) * 25, COLORS.sparkChip);
            }
          } else {
            // Fase 9: Dwell & Finishing Permukaan Konis 60°
            qExt = 27.0;
            hDepth = 9.0;
            isRetract = false;
            hwSpeed = 0;
          }

          animState.quillExtended = qExt;
          animState.centerHoleDepth = hDepth;
          animState.isPeckingRetract = isRetract;
          animState.tailstockHandwheelAngle += dt * hwSpeed * playbackSpeed;
          animState.cutDepthProgress = Math.min(1.0, hDepth / 9.0);
        } else if (act === "inspect_center_hole") {
          // Langkah 4: Menarik mundur bor ke posisi aman, spindel mati, lubang selesai
          const retP = Math.min(1.0, p / 0.35);
          animState.tailstockX = 172;
          animState.tailstockClamped = true;
          animState.quillExtended = 27.0 * (1.0 - retP);
          animState.centerHoleDepth = 9.0;
          animState.isPeckingRetract = false;
          animState.tailstockHandwheelAngle -= dt * 14.0 * (1.0 - retP) * playbackSpeed;
          animState.cutDepthProgress = 1.0;
        }
      } else if (currentOperation.id === "lathe_taper" && currentStep.visualAction === "cut_taper_pass") {
        // Carriage stays firmly locked in place
        animState.toolZ = animState.targetToolZ;
        animState.toolX = animState.targetToolX;
        // Upper slide compound feed smoothly retracts along 30° dovetail
        animState.compoundFeed = animState.startCompoundFeed + (animState.targetCompoundFeed - animState.startCompoundFeed) * p;
        // Compound rest manual handwheel continuously spins
        animState.compoundHandwheelAngle -= dt * 14.0 * playbackSpeed;
        animState.cutDepthProgress = p;

        if (Math.random() < 0.75) {
          const cutPt = getLatheCutPoint();
          spawnChip(cutPt.x + (Math.random() - 0.5) * 6, cutPt.y, (Math.random() - 0.5) * 45, 40 + Math.random() * 40, COLORS.sparkChip);
        }
      } else if (currentOperation.id === "lathe_threading" && currentStep.visualAction === "align_thread_gauge") {
        // Kinematika 3-Fase Penyetelan Pahat dengan Mal Ulir (Center Gauge Alignment):
        // Fase 1 (0.00 <= p < 0.35): Eretan & Pahat meluncur menuju Mal Ulir (Z: 247 -> 175, X: 230 -> 212)
        // Fase 2 (0.35 <= p < 0.70): Pahat masuk presisi ke celah V 60° Mal Ulir, hasil tegak lurus 90° diperiksa & baut toolpost dikencangkan
        // Fase 3 (0.70 <= p <= 1.00): Pahat mundur radial bebas lalu eretan bergeser mulus ke sisi kanan awal benda kerja (Z: 175 -> 247, X: 212 -> 204)
        if (p < 0.35) {
          const p1 = p / 0.35;
          const ease1 = 0.5 - 0.5 * Math.cos(p1 * Math.PI);
          animState.toolZ = 247 + (175 - 247) * ease1;
          animState.toolX = 230 + (212 - 230) * ease1;
          animState.boltsLoose = true;
        } else if (p < 0.70) {
          animState.toolZ = 175;
          animState.toolX = 212;
          animState.boltsLoose = false;
        } else if (p < 0.78) {
          const p2 = (p - 0.70) / (0.78 - 0.70);
          const ease2 = Math.sin(p2 * Math.PI * 0.5);
          animState.toolZ = 175;
          animState.toolX = 212 + (225 - 212) * ease2;
          animState.boltsLoose = false;
        } else {
          const p3 = Math.min(1.0, (p - 0.78) / (1.00 - 0.78));
          const ease3 = 0.5 - 0.5 * Math.cos(p3 * Math.PI);
          animState.toolZ = 175 + (247 - 175) * ease3;
          animState.toolX = 225 + (204 - 225) * ease3;
          animState.boltsLoose = false;
        }
      } else if (currentOperation.id === "lathe_threading" && currentStep.isCutting) {
        // Kinematika 3-Fase Pembuatan Ulir Metris:
        // Fase 1 (0.00 <= p < 0.60): Pemakanan longitudinal dari kanan (Z=247) ke alur pembebas kiri (Z=94), half-nut ON
        // Fase 2 (0.60 <= p < 0.74): Pembebasan pahat mundur radial menjauhi alur benda (X: targetCutToolX -> safeToolX), half-nut OFF
        // Fase 3 (0.74 <= p <= 1.00): Eretan meluncur halus (smooth cosine return) kembali ke kanan benda (Z=247), pahat tetap bebas
        const act = currentStep.visualAction;
        const targetCutToolX = act === "cut_thread_pass_1" ? 186 : act === "cut_thread_pass_2" ? 184 : act === "cut_thread_pass_3" ? 181 : 178;
        const safeToolX = 204;
        const zStart = 247;
        const zEnd = 94;

        if (p < 0.60) {
          // Fase 1: Pemakanan Longitudinal dari Kanan ke Kiri (Half-nut Engaged)
          const p1 = Math.min(1.0, p / 0.60);
          animState.toolZ = zStart + (zEnd - zStart) * p1;
          animState.toolX = targetCutToolX;
          animState.isThreadingCutting = true;
          animState.isThreadingRetracting = false;
          animState.isThreadingReturning = false;

          // Progres kedalaman ulir bertambah saat pemakanan maju
          if (act === "cut_thread_pass_1") {
            animState.cutDepthProgress = 0.15 * p1;
          } else if (act === "cut_thread_pass_2") {
            animState.cutDepthProgress = 0.15 + 0.30 * p1;
          } else if (act === "cut_thread_pass_3") {
            animState.cutDepthProgress = 0.45 + 0.30 * p1;
          } else if (act === "cut_thread_pass_4") {
            animState.cutDepthProgress = 0.75 + 0.25 * p1;
          }

          if (Math.random() < 0.75) {
            const cutPt = getLatheCutPoint();
            spawnChip(cutPt.x + (Math.random() - 0.5) * 4, cutPt.y, -25 - Math.random() * 35, 30 + Math.random() * 40, COLORS.sparkChip);
          }
        } else if (p < 0.74) {
          // Fase 2: Pembebasan Pahat Mundur Bebas Secara Radial di Alur Pembebas (Half-nut Disengaged)
          const p2 = (p - 0.60) / (0.74 - 0.60);
          const easeRet = Math.sin(p2 * Math.PI * 0.5);
          animState.toolZ = zEnd;
          animState.toolX = targetCutToolX + (safeToolX - targetCutToolX) * easeRet;
          animState.isThreadingCutting = false;
          animState.isThreadingRetracting = true;
          animState.isThreadingReturning = false;

          // Pertahankan kedalaman ulir yang sudah tersayat penuh pada lintasan ini
          if (act === "cut_thread_pass_1") animState.cutDepthProgress = 0.15;
          else if (act === "cut_thread_pass_2") animState.cutDepthProgress = 0.45;
          else if (act === "cut_thread_pass_3") animState.cutDepthProgress = 0.75;
          else if (act === "cut_thread_pass_4") animState.cutDepthProgress = 1.00;
        } else {
          // Fase 3: Eretan Kembali Meluncur Halus ke Kanan Benda Kerja (Smooth Cosine Return)
          const p3 = Math.min(1.0, (p - 0.74) / (1.00 - 0.74));
          const easeReturn = 0.5 - 0.5 * Math.cos(p3 * Math.PI);
          animState.toolZ = zEnd + (zStart - zEnd) * easeReturn;
          animState.toolX = safeToolX;
          animState.isThreadingCutting = false;
          animState.isThreadingRetracting = false;
          animState.isThreadingReturning = true;

          // Kedalaman ulir tetap terjaga penuh
          if (act === "cut_thread_pass_1") animState.cutDepthProgress = 0.15;
          else if (act === "cut_thread_pass_2") animState.cutDepthProgress = 0.45;
          else if (act === "cut_thread_pass_3") animState.cutDepthProgress = 0.75;
          else if (act === "cut_thread_pass_4") animState.cutDepthProgress = 1.00;
        }
      } else if (currentStep.isCutting) {
        // Continuous smooth feeding of cutting tool across workpiece
        animState.toolZ = animState.startToolZ + (animState.targetToolZ - animState.startToolZ) * p;
        animState.toolX = animState.startToolX + (animState.targetToolX - animState.startToolX) * p;
        animState.cutDepthProgress = Math.min(1.0, 0.2 + p * 0.8);

        // Continuous chip emission while cutting
        if (Math.random() < 0.65) {
          const cutPt = getLatheCutPoint();
          spawnChip(cutPt.x + (Math.random() - 0.5) * 6, cutPt.y, (Math.random() - 0.5) * 45, 40 + Math.random() * 40, COLORS.sparkChip);
        }
      } else if (currentStep.visualAction === "swivel_compound_rest") {
        // Smooth compound rest swivel
        const easeP = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        animState.eretanAngle = animState.startEretanAngle + (animState.targetEretanAngle - animState.startEretanAngle) * easeP;
        animState.toolX += (animState.targetToolX - animState.toolX) * Math.min(1.0, dt * 5.0 * playbackSpeed);
        animState.toolZ += (animState.targetToolZ - animState.toolZ) * Math.min(1.0, dt * 5.0 * playbackSpeed);
      } else {
        // Smooth positioning transition
        const lerpRate = Math.min(1.0, dt * 5.0 * playbackSpeed);
        animState.eretanAngle += (animState.targetEretanAngle - animState.eretanAngle) * lerpRate;
        animState.toolX += (animState.targetToolX - animState.toolX) * lerpRate;
        animState.toolZ += (animState.targetToolZ - animState.toolZ) * lerpRate;
        animState.compoundFeed += (animState.targetCompoundFeed - animState.compoundFeed) * lerpRate;
      }

      // Spindle rotation:
      // Spindle rotates when running, stops strictly when not running (for safe setup & inspection)
      if (animState.spindleRunning) {
        animState.spindleAngle += dt * 18.0;
        animState.spindleRpm = 450;
      } else {
        animState.spindleRpm = 0;
      }
    } else {
      // Sembunyikan dan hentikan semua animasi proses pemesinan pada mesin frais
      animState.spindleRpm = 0;
      animState.spindleRunning = false;
      return;
    }

    // Update Chips / Metal Particle System
    updateParticles(dt);
  }

  function spawnChip(x, y, vx, vy, color = COLORS.sparkChip) {
    animState.chips.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 80 + vx,
      vy: -Math.random() * 80 + vy,
      size: Math.random() * 2.5 + 1.5,
      life: 1.0,
      decay: Math.random() * 1.5 + 1.2,
      color
    });
  }

  function updateParticles(dt) {
    for (let i = animState.chips.length - 1; i >= 0; i--) {
      const p = animState.chips[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt; // gravity
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        animState.chips.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // RENDER MASTER
  // =========================================================================
  function render() {
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return; // avoid drawing when hidden

    // Auto-resync backing store resolution whenever layout width changes
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;

    // Background Gradient (Blueprint / Engineering Workshop Canvas)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0b1329");
    bgGrad.addColorStop(1, "#080d1a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Precision Technical Grid
    renderTechnicalGrid(w, h);

    if (!currentOperation) return;

    if (currentOperation.machine === "lathe") {
      ctx.save();
      // Center & scale coordinate system with ample space for HUD
      const centerX = w * 0.46;
      const centerY = h * 0.49;
      ctx.translate(centerX, centerY);

      renderLatheAssembly();

      // Render metal chips / sparks on top of machine
      renderParticles();

      ctx.restore();

      // Render Canvas Top HUD & Interactive Overlays
      renderCanvasHUD(w, h);
    } else {
      // Sembunyikan semua animasi proses pemesinan pada mesin frais
      renderMillingDevelopmentScreen(w, h);
    }
  }

  function renderTechnicalGrid(w, h) {
    ctx.strokeStyle = COLORS.bgGrid;
    ctx.lineWidth = 1;

    const gridSize = 40;
    ctx.beginPath();
    for (let x = 0; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Subtle center axis
    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.52);
    ctx.lineTo(w, h * 0.52);
    ctx.stroke();
  }

  // =========================================================================
  // MESIN FRAIS DEVELOPMENT SCREEN (PENGEMBANGAN)
  // =========================================================================
  function renderMillingDevelopmentScreen(w, h) {
    ctx.save();

    // 1. Technical backdrop
    ctx.fillStyle = "#020617"; // slate-950
    ctx.fillRect(0, 0, w, h);

    // 2. Blueprint technical grid
    ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
    ctx.lineWidth = 1;
    const gSize = 36;
    ctx.beginPath();
    for (let x = 0; x < w; x += gSize) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gSize) {
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 3. Center development card
    const cardW = Math.min(500, w * 0.88);
    const cardH = 220;
    const cardX = (w - cardW) / 2;
    const cardY = (h - cardH) / 2;

    ctx.fillStyle = "rgba(15, 23, 42, 0.94)"; // slate-900
    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)"; // amber-500
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cardX, cardY, cardW, cardH, [20]);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.fill();
    ctx.stroke();

    // Glowing amber accent header line
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cardX + 28, cardY);
    ctx.lineTo(cardX + cardW - 28, cardY);
    ctx.stroke();

    // Icon Circle
    const iconCx = w / 2;
    const iconCy = cardY + 46;
    ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
    ctx.beginPath();
    ctx.arc(iconCx, iconCy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🛠️", iconCx, iconCy);

    // Pill Badge
    const badgeText = "MODUL MESIN FRAIS";
    ctx.font = "bold 10px Inter, sans-serif";
    const bMetrics = ctx.measureText(badgeText);
    const bW = bMetrics.width + 18;
    const bH = 20;
    const bX = (w - bW) / 2;
    const bY = iconCy + 32;

    ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bX, bY, bW, bH, [10]);
    } else {
      ctx.rect(bX, bY, bW, bH);
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.fillText(badgeText, w / 2, bY + 10);

    // Main Heading Text: "Masih dalam tahap Pengembangan!"
    ctx.font = "bold 20px Inter, 'Segoe UI', sans-serif";
    if (w < 480) ctx.font = "bold 16px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Masih dalam tahap Pengembangan!", w / 2, cardY + 128);

    // Subtitle
    ctx.font = "12px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Animasi proses pemesinan mesin frais saat ini disembunyikan sementara.", w / 2, cardY + 158);

    ctx.font = "11px Inter, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Silakan beralih ke tab Mesin Bubut untuk melihat animasi proses lengkap.", w / 2, cardY + 180);

    ctx.restore();
  }

  // =========================================================================
  // MESIN BUBUT (LATHE RENDERING)
  // =========================================================================
  function renderLatheAssembly() {
    // Lathe Spindle Centerline is at local (0, 0)
    // Left: Headstock & Chuck (X: -260 to -160)
    // Center: Workpiece (X: -160 to +60)
    // Right: Tailstock (X: +130 to +240)
    // Bottom: Bed, Carriage, Cross-Slide, Compound Rest, Toolpost

    const currentStep = currentOperation.steps[currentStepIdx] || {};
    const cutPt = getLatheCutPoint();

    // 1. Bed Ways & Machine Base
    renderLatheBed();

    // 2. Headstock & 3-Jaw Chuck
    renderLatheHeadstockAndChuck();

    // 3. Workpiece (Steel bar with dynamic cutting geometry)
    renderLatheWorkpiece();

    // 4. Tailstock (Kepala Lepas)
    renderLatheTailstock();

    // 5. Carriage & Compound Rest with Swivel Angle & Tool
    renderLatheCarriageAndTool();

    // 6. Coolant Stream (if active)
    if (animState.coolantOn) {
      renderCoolantSpray(cutPt.x, cutPt.y);
    }

    // 7. Visual Step Annotation Overlay
    renderLatheStepAnnotations(currentStep, cutPt);
  }

  // Helper: Exact cutting contact point in top-view coordinates
  function getLatheCutPoint() {
    const opId = currentOperation ? currentOperation.id : "lathe_straight";
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    if (opId === "lathe_center_drilling") {
      const hDepth = animState.centerHoleDepth || 0;
      return { x: 75 - hDepth, y: 0 };
    }
    if (opId === "lathe_facing") {
      const faceY = Math.max(0, Math.min(30, crossY - 58));
      return { x: 75, y: faceY };
    }
    if (opId === "lathe_grooving") {
      const bladeX = carX - 8;
      const toolTipY = Math.max(24, crossY - 60);
      return { x: bladeX, y: toolTipY };
    }
    if (opId === "lathe_taper") {
      const taperStartX = 45;
      const taperEndX = 75;
      const p = Math.min(1.0, Math.max(0.0, animState.cutDepthProgress || 0));
      const curX = taperEndX - (taperEndX - taperStartX) * p;
      const curR = 13 + (30 - 13) * p;
      return { x: curX, y: curR };
    }
    if (opId === "lathe_straight") {
      const toolTipY = Math.max(25, crossY - 58);
      return { x: carX - 15, y: toolTipY };
    }
    if (opId === "lathe_step") {
      const toolTipY = Math.max(18, crossY - 58);
      return { x: carX - 15, y: toolTipY };
    }
    if (opId === "lathe_threading") {
      const toolTipY = Math.max(26, crossY - 58);
      return { x: carX - 8, y: toolTipY };
    }
    return { x: carX - 10, y: 28 };
  }

  function renderLatheBed() {
    ctx.save();
    // 1. Pelindung Cipratan Geram Belakang (Rear Splash Guard)
    ctx.fillStyle = "#0c1424";
    ctx.fillRect(-285, -102, 555, 30);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.strokeRect(-285, -102, 555, 30);
    ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
    for (let gx = -260; gx <= 240; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, -102);
      ctx.lineTo(gx, -72);
      ctx.stroke();
    }

    // 2. Bodi Cor Alas Mesin (Main Cast Iron Bed Ways)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-285, -72, 555, 150);

    // 3. Alas Pemandu Belakang (Rear Guideways)
    ctx.fillStyle = "#334155";
    ctx.fillRect(-285, -72, 555, 34);

    // Rear Prismatic V-Way (Prisma Panduan Belakang - Ground Finish)
    const vRearGrad = ctx.createLinearGradient(0, -70, 0, -50);
    vRearGrad.addColorStop(0, "#475569");
    vRearGrad.addColorStop(0.48, "#cbd5e1");
    vRearGrad.addColorStop(0.52, "#f1f5f9");
    vRearGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = vRearGrad;
    ctx.fillRect(-285, -68, 555, 14);

    // Rear Flat Guideway (Bidang Datar Alas Belakang)
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(-285, -50, 555, 8);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-285, -48, 555, 2);

    // 4. Rongga Tengah Pembuangan Tatal (Center Chip Bed Cavity)
    ctx.fillStyle = "#090d16";
    ctx.fillRect(-285, -38, 555, 70);

    // Tulang Rusuk Penguat Silang (Cast Iron Diagonal Cross Ribs)
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    for (let rx = -240; rx <= 240; rx += 70) {
      ctx.beginPath();
      ctx.moveTo(rx - 12, -38);
      ctx.lineTo(rx + 12, 32);
      ctx.lineTo(rx + 22, 32);
      ctx.lineTo(rx - 2, -38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Alas Pemandu Depan (Front Guideways - Sisi Eretan & Operator)
    ctx.fillStyle = "#334155";
    ctx.fillRect(-285, 32, 555, 42);

    // Front Prismatic V-Way (Prisma Panduan Depan Eretan)
    const vFrontGrad = ctx.createLinearGradient(0, 34, 0, 54);
    vFrontGrad.addColorStop(0, "#475569");
    vFrontGrad.addColorStop(0.48, "#cbd5e1");
    vFrontGrad.addColorStop(0.52, "#f8fafc");
    vFrontGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = vFrontGrad;
    ctx.fillRect(-285, 36, 555, 16);

    // Front Flat Way
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(-285, 56, 555, 12);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(-285, 58, 555, 2);

    // 6. Batang Gigi Pemakanan Memanjang (Longitudinal Rack Gear)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-285, 74, 555, 7);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    for (let gx = -285; gx <= 270; gx += 4) {
      ctx.beginPath();
      ctx.moveTo(gx, 74);
      ctx.lineTo(gx, 80);
      ctx.stroke();
    }

    // 7. Poros Transportir (Lead Screw Acme) & Poros Pembawa (Feed Rod)
    const screwGrad = ctx.createLinearGradient(0, 83, 0, 89);
    screwGrad.addColorStop(0, "#64748b");
    screwGrad.addColorStop(0.5, "#e2e8f0");
    screwGrad.addColorStop(1, "#334155");
    ctx.fillStyle = screwGrad;
    ctx.fillRect(-285, 83, 555, 6);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    for (let sx = -285; sx <= 270; sx += 6) {
      ctx.beginPath();
      ctx.moveTo(sx, 83);
      ctx.lineTo(sx + 2, 89);
      ctx.stroke();
    }

    const rodGrad = ctx.createLinearGradient(0, 92, 0, 96);
    rodGrad.addColorStop(0, "#94a3b8");
    rodGrad.addColorStop(0.5, "#f1f5f9");
    rodGrad.addColorStop(1, "#475569");
    ctx.fillStyle = rodGrad;
    ctx.fillRect(-285, 92, 555, 5);

    ctx.restore();
  }

  function renderLatheHeadstockAndChuck() {
    ctx.save();
    // 1. Kepala Tetap (Headstock Body Casting - Top View)
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-285, -85, 115, 160, [8, 0, 0, 8]);
    ctx.fill();
    ctx.stroke();

    // Penutup Kotak Roda Gigi (Inspection Cover Plate)
    ctx.fillStyle = "#273549";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-278, -75, 92, 110, [6]);
    ctx.fill();
    ctx.stroke();

    // Baut Penutup Kotak Roda Gigi (Allen Socket Bolts)
    ctx.fillStyle = "#cbd5e1";
    const boltPoints = [
      [-272, -70], [-232, -70], [-192, -70],
      [-272, 30], [-232, 30], [-192, 30]
    ];
    boltPoints.forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Tuas Pemindah Putaran (Gear Shift Levers on Top of Headstock)
    // Lever 1
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-255, -45, 6, 22);
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(-252, -45, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();

    // Lever 2
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-220, -45, 6, 22);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(-217, -45, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f87171";
    ctx.stroke();

    // Label Plat Spindel RPM
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(-268, 5, 75, 16);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SPINDLE GEAR", -230, 16);

    // 2. Flensa Spindel Utama (Spindle Nose Flange)
    const flangeGrad = ctx.createLinearGradient(0, -58, 0, 58);
    flangeGrad.addColorStop(0, "#475569");
    flangeGrad.addColorStop(0.5, "#cbd5e1");
    flangeGrad.addColorStop(1, "#334155");
    ctx.fillStyle = flangeGrad;
    ctx.fillRect(-170, -56, 16, 112);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(-170, -56, 16, 112);

    // 3. Cekam Tiga Rahang (3-Jaw Chuck - Realistic Cylindrical Top View)
    const chuckX = -154;
    const chuckW = 39;
    const chuckRad = 68; // Diameter 136 mm (-68 to +68)

    // Bodi Silinder Cekam (Forged Steel Cylinder)
    const chuckGrad = ctx.createLinearGradient(0, -chuckRad, 0, chuckRad);
    chuckGrad.addColorStop(0, "#334155");
    chuckGrad.addColorStop(0.2, "#64748b");
    chuckGrad.addColorStop(0.5, "#cbd5e1");
    chuckGrad.addColorStop(0.8, "#475569");
    chuckGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = chuckGrad;
    ctx.fillRect(chuckX, -chuckRad, chuckW, chuckRad * 2);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(chuckX, -chuckRad, chuckW, chuckRad * 2);

    // Muka Cekam (Ground Steel Front Face Cap at X = -115)
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(chuckX + chuckW - 3, -chuckRad, 3, chuckRad * 2);

    // Alur Konsentris Muka Cekam (Concentric Machined Rings on Chuck Face)
    ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
    ctx.lineWidth = 1;
    [24, 42, 58].forEach((r) => {
      ctx.beginPath();
      ctx.moveTo(chuckX + chuckW, -r);
      ctx.lineTo(chuckX + chuckW, r);
      ctx.stroke();
    });

    // 4. Animasi Rotasi Cekam Realistis (Realistic Cylindrical 3-Jaw Spin Projection)
    // Sumbu putar spindel: theta = animState.spindleAngle
    const theta = animState.spindleAngle;
    const isSpinning = animState.spindleRunning;

    // A. Pantulan Kilau Silinder Berputar (Dynamic Specular Sheen Bands)
    if (isSpinning) {
      ctx.save();
      const waveY1 = Math.sin(theta * 1.5) * 25;
      const waveY2 = Math.cos(theta * 1.5) * 25;
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.fillRect(chuckX + 4, waveY1 - 8, chuckW - 8, 16);
      ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
      ctx.fillRect(chuckX + 4, waveY2 - 6, chuckW - 8, 12);
      ctx.restore();
    }

    // B. Tiga Alur Pemandu Rahang & Rahang Keras Bertingkat (3 Master Jaws at 120°)
    for (let i = 0; i < 3; i++) {
      const phi = theta + (i * Math.PI * 2) / 3;
      const yProj = chuckRad * Math.sin(phi);
      const zProj = Math.cos(phi); // > 0 means visible on top view

      // Gambar alur pemandu dan rahang ketika tampak di atas (zProj > -0.2)
      if (zProj > -0.2) {
        const slotAlpha = Math.max(0.2, (zProj + 0.2) / 1.2);
        ctx.save();
        ctx.globalAlpha = slotAlpha;

        // Alur Pemandu Rahang (Milled Radial Guide Slot)
        const slotH = 16;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(chuckX + 6, yProj - slotH / 2, chuckW - 6, slotH);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckX + 6, yProj - slotH / 2, chuckW - 6, slotH);

        // Rahang Baja Keras Bertingkat (Stepped Master Jaw)
        // Rahang menonjol keluar dari muka cekam menjepit benda kerja pada radius 30
        const jawExtW = 16; // menonjol keluar 16px (X = -115 s.d. -99)
        const jawH = 14;
        const jawY = Math.sign(yProj) !== 0 ? Math.sign(yProj) * Math.min(Math.abs(yProj), 32) : 0;

        const jawGrad = ctx.createLinearGradient(chuckX + chuckW, 0, chuckX + chuckW + jawExtW, 0);
        jawGrad.addColorStop(0, "#cbd5e1");
        jawGrad.addColorStop(0.5, "#f1f5f9");
        jawGrad.addColorStop(1, "#94a3b8");
        ctx.fillStyle = jawGrad;
        ctx.fillRect(chuckX + chuckW, jawY - jawH / 2, jawExtW, jawH);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckX + chuckW, jawY - jawH / 2, jawExtW, jawH);

        // Undakan Rahang (Stepped Serrations)
        ctx.strokeStyle = "#64748b";
        ctx.beginPath();
        ctx.moveTo(chuckX + chuckW + 5, jawY - jawH / 2);
        ctx.lineTo(chuckX + chuckW + 5, jawY + jawH / 2);
        ctx.moveTo(chuckX + chuckW + 10, jawY - jawH / 2);
        ctx.lineTo(chuckX + chuckW + 10, jawY + jawH / 2);
        ctx.stroke();

        ctx.restore();
      }

      // Lubang Kunci Cekam (Pinion Key Sockets pada keliling silinder)
      const socketPhi = phi + Math.PI / 6;
      const sY = (chuckRad - 10) * Math.sin(socketPhi);
      const sZ = Math.cos(socketPhi);
      if (sZ > 0.4) {
        ctx.save();
        ctx.globalAlpha = (sZ - 0.4) / 0.6;
        ctx.fillStyle = "#090d16";
        ctx.beginPath();
        ctx.arc(chuckX + 16, sY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#94a3b8";
        ctx.stroke();
        // Socket square
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(chuckX + 14, sY - 2, 4, 4);
        ctx.restore();
      }
    }

    // Pusat Spindel Cekam (Center Spindle Bore)
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(chuckX + chuckW, 0, 11, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    ctx.restore();
  }

  function renderLatheWorkpiece() {
    ctx.save();
    const chuckFaceX = -115;
    const rawLen = 190;
    const rawRad = 30; // Radius 30mm, Diameter 60mm (-30 to +30)
    const opId = currentOperation ? currentOperation.id : "lathe_straight";
    const currentStep = (currentOperation && currentOperation.steps) ? (currentOperation.steps[currentStepIdx] || {}) : {};
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    // Gradien Silindris Bahan Mentah Baja ST-37 (Steel Lighting)
    const stockGrad = ctx.createLinearGradient(0, -rawRad, 0, rawRad);
    stockGrad.addColorStop(0, "#334155");
    stockGrad.addColorStop(0.2, "#64748b");
    stockGrad.addColorStop(0.48, "#cbd5e1");
    stockGrad.addColorStop(0.52, "#f8fafc");
    stockGrad.addColorStop(0.8, "#94a3b8");
    stockGrad.addColorStop(1, "#334155");

    // Gradien Permukaan Hasil Sayatan Mengkilap (Bright Turned Surface)
    const cutGrad = ctx.createLinearGradient(0, -rawRad, 0, rawRad);
    cutGrad.addColorStop(0, "#0284c7");
    cutGrad.addColorStop(0.25, "#38bdf8");
    cutGrad.addColorStop(0.5, "#f0f9ff");
    cutGrad.addColorStop(0.75, "#bae6fd");
    cutGrad.addColorStop(1, "#0369a1");

    // Efek Putaran Benda Kerja (Rotational Sheen Striations)
    function drawSpinTexture(x, y, w, h) {
      if (!animState.spindleRunning) return;
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      const offset = (animState.spindleAngle * 25) % 18;
      for (let ly = y - 20 + offset; ly < y + h; ly += 18) {
        if (ly >= y && ly <= y + h - 2) {
          ctx.fillRect(x, ly, w, 1.5);
        }
      }
      ctx.restore();
    }

    if (opId === "lathe_taper") {
      // Pembubutan Tirus (Taper Turning - Top View)
      // Diameter D = 60 mm (R = 30), Diameter d = 26 mm (R = 13), Panjang l = 30 mm (Panjang = 30 px)
      // Sudut tirus α = 30° (tan 30° ≈ 0.577, ΔR/l = 17/30 ≈ 0.567)
      const taperLen = 30;
      const taperStartX = chuckFaceX + rawLen - taperLen; // X = -115 + 190 - 30 = 45
      const taperEndX = chuckFaceX + rawLen; // X = 75
      const dSmallRad = 13; // d = 26 mm (radius 13)
      const dBigRad = 30;   // D = 60 mm (radius 30)
      const isCuttingStep = currentOperation.steps[currentStepIdx] && currentOperation.steps[currentStepIdx].visualAction === "cut_taper_pass";
      const isInspected = currentStepIdx >= 7;

      // Bagian Silinder Mentah (Kiri, X = -115 s.d. 45)
      ctx.fillStyle = stockGrad;
      ctx.fillRect(chuckFaceX, -rawRad, taperStartX - chuckFaceX, rawRad * 2);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(chuckFaceX, -rawRad, taperStartX - chuckFaceX, rawRad * 2);
      drawSpinTexture(chuckFaceX, -rawRad, taperStartX - chuckFaceX, rawRad * 2);

      if (isInspected) {
        // Tirus Selesai Penuh (Finished Conical Taper 30°)
        ctx.beginPath();
        ctx.moveTo(taperStartX, -dBigRad);
        ctx.lineTo(taperEndX, -dSmallRad);
        ctx.lineTo(taperEndX, dSmallRad);
        ctx.lineTo(taperStartX, dBigRad);
        ctx.closePath();
        ctx.fillStyle = cutGrad;
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        drawSpinTexture(taperStartX, -dBigRad, taperLen, dBigRad * 2);

        // Garis Generator Tirus Mengkilap
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        for (let tx = taperStartX + 5; tx < taperEndX; tx += 6) {
          const ratio = (tx - taperStartX) / taperLen;
          const rCur = dBigRad - (dBigRad - dSmallRad) * ratio;
          ctx.beginPath();
          ctx.moveTo(tx, -rCur);
          ctx.lineTo(tx, rCur);
          ctx.stroke();
        }

        // Muka Ujung Kanan (End Face Cap d = 26)
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(taperEndX - 2, -dSmallRad, 2, dSmallRad * 2);
        ctx.strokeStyle = "#64748b";
        ctx.strokeRect(taperEndX - 2, -dSmallRad, 2, dSmallRad * 2);

      } else if (isCuttingStep) {
        // Pemakanan Sedang Berjalan: Dinamis dari X=75 mundur ke X=45
        const p = Math.min(1.0, Math.max(0.0, animState.cutDepthProgress || 0));
        const curCutX = taperEndX - taperLen * p;
        const radAtCutX = dSmallRad + (dBigRad - dSmallRad) * p;

        // Bagian yang belum tersayat (X = taperStartX s.d. curCutX): Silinder Mentah R=30
        if (curCutX > taperStartX) {
          ctx.fillStyle = stockGrad;
          ctx.fillRect(taperStartX, -rawRad, curCutX - taperStartX, rawRad * 2);
          ctx.strokeStyle = "#475569";
          ctx.strokeRect(taperStartX, -rawRad, curCutX - taperStartX, rawRad * 2);
          drawSpinTexture(taperStartX, -rawRad, curCutX - taperStartX, rawRad * 2);
        }

        // Bagian yang sudah tersayat tirus (X = curCutX s.d. taperEndX)
        if (curCutX < taperEndX) {
          ctx.beginPath();
          ctx.moveTo(curCutX, -radAtCutX);
          ctx.lineTo(taperEndX, -dSmallRad);
          ctx.lineTo(taperEndX, dSmallRad);
          ctx.lineTo(curCutX, radAtCutX);
          ctx.closePath();
          ctx.fillStyle = cutGrad;
          ctx.fill();
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Garis arsir sayatan
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.lineWidth = 1;
          for (let tx = curCutX + 4; tx < taperEndX; tx += 6) {
            const ratio = (tx - taperStartX) / taperLen;
            const rCur = dBigRad - (dBigRad - dSmallRad) * ratio;
            ctx.beginPath();
            ctx.moveTo(tx, -rCur);
            ctx.lineTo(tx, rCur);
            ctx.stroke();
          }

          // Step bahu pemotongan di curCutX
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(curCutX, -radAtCutX);
          ctx.lineTo(curCutX, -rawRad);
          ctx.moveTo(curCutX, radAtCutX);
          ctx.lineTo(curCutX, rawRad);
          ctx.stroke();
        }

        // Muka Ujung Kanan (End Face Cap d = 26)
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(taperEndX - 2, -dSmallRad, 2, dSmallRad * 2);
        ctx.strokeStyle = "#64748b";
        ctx.strokeRect(taperEndX - 2, -dSmallRad, 2, dSmallRad * 2);

      } else {
        // Langkah 1-6 (Persiapan / Penyetelan Sudut): Benda kerja masih silinder utuh
        ctx.fillStyle = stockGrad;
        ctx.fillRect(taperStartX, -rawRad, taperLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(taperStartX, -rawRad, taperLen, rawRad * 2);
        drawSpinTexture(taperStartX, -rawRad, taperLen, rawRad * 2);

        // Muka Ujung Kanan (End Face Cap D = 60)
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(taperEndX - 2, -rawRad, 2, rawRad * 2);
        ctx.strokeStyle = "#64748b";
        ctx.strokeRect(taperEndX - 2, -rawRad, 2, rawRad * 2);
      }

      // Lubang Senter 60° di Muka Ujung
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.moveTo(taperEndX, -4);
      ctx.lineTo(taperEndX - 6, 0);
      ctx.lineTo(taperEndX, 4);
      ctx.closePath();
      ctx.fill();

    } else if (opId === "lathe_facing") {
      // Pembubutan Muka (Facing - Top View)
      // Panjang benda kerja rawLen = 190, Muka ujung asli di X = 75
      const currentStep = currentOperation.steps[currentStepIdx] || {};
      const act = currentStep.visualAction;
      const isCutStep = act === "cut_facing_pass";
      const isFinishedStep = act === "inspect_facing";
      const cutDepthPx = 2.2; // Representasi ap = 0,8 mm

      if (isFinishedStep || (isCutStep && animState.cutDepthProgress >= 0.98)) {
        // Step 5 atau setelah pemotongan selesai: Seluruh bidang muka telah tersayat rata & siku 90°
        const finishedLen = rawLen - cutDepthPx;
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, finishedLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(chuckFaceX, -rawRad, finishedLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, finishedLen, rawRad * 2);

        // Lapisan Muka Hasil Sayatan Halus Mengkilap (Mirror-Faced End Face)
        const faceX = chuckFaceX + finishedLen;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(faceX, -rawRad, cutDepthPx, rawRad * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(faceX, -rawRad, cutDepthPx, rawRad * 2);

        // Garis pantulan kilap cahaya tegak lurus (90° Precision Chamfer/Edge)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(faceX + cutDepthPx, -rawRad);
        ctx.lineTo(faceX + cutDepthPx, rawRad);
        ctx.stroke();

      } else if (isCutStep) {
        // Step 4: Pemakanan radial berlangsung dari luar (Y = 30) menuju pusat (Y = 0)
        // carX / toolX menentukan radius batas pemotongan saat ini
        const p = Math.min(1.0, Math.max(0.0, animState.cutDepthProgress || 0));
        const sweptRad = (1.0 - p) * rawRad; // radius yang belum disayat (mengecil ke 0)
        const unCutLen = rawLen;
        const cutLen = rawLen - cutDepthPx;

        // Badan silinder utama
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, cutLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(chuckFaceX, -rawRad, cutLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, cutLen, rawRad * 2);

        // Bagian luar yang SUDAH tersayat (mengkilap, kedalaman ap = 0,8 mm)
        const cutFaceX = chuckFaceX + cutLen;
        ctx.fillStyle = cutGrad;
        // Sisi atas yang tersayat
        if (sweptRad < rawRad) {
          ctx.fillRect(cutFaceX, -rawRad, cutDepthPx, rawRad - sweptRad);
          ctx.fillRect(cutFaceX, sweptRad, cutDepthPx, rawRad - sweptRad);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1;
          ctx.strokeRect(cutFaceX, -rawRad, cutDepthPx, rawRad - sweptRad);
          ctx.strokeRect(cutFaceX, sweptRad, cutDepthPx, rawRad - sweptRad);
        }

        // Bagian inti tengah yang BELUM tersayat (masih panjang rawLen, permukaan gergaji kasar)
        if (sweptRad > 0.5) {
          ctx.fillStyle = stockGrad;
          ctx.fillRect(cutFaceX, -sweptRad, cutDepthPx, sweptRad * 2);
          // Tekstur kasar gergaji pada inti tengah
          ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
          ctx.lineWidth = 0.8;
          for (let ry = -sweptRad + 2; ry < sweptRad; ry += 3) {
            ctx.beginPath();
            ctx.moveTo(cutFaceX + cutDepthPx, ry);
            ctx.lineTo(cutFaceX + cutDepthPx + 1, ry + 1);
            ctx.stroke();
          }
          // Undakan bahu pemotongan aksial di sweptRad
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cutFaceX, -sweptRad);
          ctx.lineTo(cutFaceX + cutDepthPx, -sweptRad);
          ctx.moveTo(cutFaceX, sweptRad);
          ctx.lineTo(cutFaceX + cutDepthPx, sweptRad);
          ctx.stroke();
        }

      } else {
        // Step 1 - 3: Benda kerja mentah silinder utuh dengan muka ujung bekas gergaji kasar (Rough Saw-Cut Face)
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, rawLen, rawRad * 2);

        // Muka Ujung Mentah (Rough Saw-Cut Cap di X = 75)
        const endX = chuckFaceX + rawLen;
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(endX - 2, -rawRad, 2, rawRad * 2);
        ctx.strokeStyle = "#64748b";
        ctx.strokeRect(endX - 2, -rawRad, 2, rawRad * 2);

        // Pola garis kasar bekas gergaji mesin (Saw marks)
        ctx.strokeStyle = "rgba(15, 23, 42, 0.45)";
        ctx.lineWidth = 0.8;
        for (let y = -rawRad + 3; y < rawRad; y += 4) {
          ctx.beginPath();
          ctx.moveTo(endX - 2, y);
          ctx.lineTo(endX, y + 2);
          ctx.stroke();
        }
      }

    } else if (opId === "lathe_straight") {
      // Pembubutan Rata / Silindris (Straight Turning - Top View)
      // Diameter awal mentah D0 = 60mm (rawRad = 30)
      // Target pembubutan rata D1 = 50mm (turnedRad = 25, ap = 2.5mm pada radius)
      // Panjang pembubutan L = 110mm (dari X = 75 mundur ke X = -35)
      const isCuttingStep = currentStepIdx === 3; // cut_straight_longitudinal
      const isPostCutStep = currentStepIdx >= 4;  // measure_diameter
      const carX = -30 + (animState.toolZ - 90) * 0.74;
      const toolTipX = carX - 15;
      const turnedRad = 25; // ⌀50mm

      let curCutX = chuckFaceX + rawLen; // 75
      if (isCuttingStep) {
        curCutX = Math.max(-35, Math.min(chuckFaceX + rawLen, toolTipX));
      } else if (isPostCutStep) {
        curCutX = -35;
      }

      const unCutLen = curCutX - chuckFaceX; // Bagian mentah di kiri (-115 s.d. curCutX)
      const cutLen = (chuckFaceX + rawLen) - curCutX; // Bagian tersayat di kanan (curCutX s.d. 75)

      // 1. Bagian Belum Tersayat (Mentah D = 60mm, R = 30) di sisi kiri
      if (unCutLen > 0) {
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, unCutLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckFaceX, -rawRad, unCutLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, unCutLen, rawRad * 2);
      }

      // 2. Bagian Telah Tersayat (Halus Mengkilap D = 50mm, R = 25) di sisi kanan
      if (cutLen > 0) {
        ctx.fillStyle = cutGrad;
        ctx.fillRect(curCutX, -turnedRad, cutLen, turnedRad * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(curCutX, -turnedRad, cutLen, turnedRad * 2);
        drawSpinTexture(curCutX, -turnedRad, cutLen, turnedRad * 2);

        // Bahu Transisi Sudut Potong Utama 75° (Lead Angle Shoulder) tepat di posisi ujung pahat
        ctx.fillStyle = "#60a5fa";
        ctx.strokeStyle = "#1d4ed8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(curCutX - 3, -rawRad);
        ctx.lineTo(curCutX, -turnedRad);
        ctx.lineTo(curCutX, turnedRad);
        ctx.lineTo(curCutX - 3, rawRad);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 3. Muka Ujung Kanan (Face di X = 75)
      const endFaceRad = cutLen > 0 ? turnedRad : rawRad;
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(chuckFaceX + rawLen - 2, -endFaceRad, 2, endFaceRad * 2);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(chuckFaceX + rawLen - 2, -endFaceRad, 2, endFaceRad * 2);

      // Titik Pusat Lubang Senter Putar di Muka Ujung Kanan
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(chuckFaceX + rawLen, -5);
      ctx.lineTo(chuckFaceX + rawLen - 7, 0);
      ctx.lineTo(chuckFaceX + rawLen, 5);
      ctx.closePath();
      ctx.fill();

    } else if (opId === "lathe_step") {
      // Pembubutan Bertingkat (Step Turning - Top View)
      // Dimensi & Urutan Kerja Sesuai Standar Pemesinan:
      // 1. Bahan Mentah: D0 = 60 mm (rawRad = 30), total panjang X = -115 s.d. 75
      // 2. Langkah 2: Bubut D = 48 mm (step2Rad = 24) sepanjang total 110 mm (X = 75 s.d. -35)
      // 3. Langkah 3: Periksa diameter 48 mm dan panjang 110 mm dengan Jangka Sorong
      // 4. Langkah 4: Bubut D = 36 mm (step1Rad = 18) sepanjang 55 mm (X = 75 s.d. 20)
      // 5. Langkah 5: Periksa tingkat kedua dengan Sisi Belakang (Depth Bar) & Kepala Jangka Sorong + Chamfer

      const carX = -30 + (animState.toolZ - 90) * 0.74;
      const toolTipX = carX - 15;
      const step1Rad = 18; // D1 = 36mm
      const step2Rad = 24; // D2 = 48mm

      if (currentStepIdx === 0) {
        // ---------------------------------------------------------------------
        // LANGKAH 1: Benda kerja masih 100% UTUH MENTAH D0 = 60 mm (Belum tersayat)
        // ---------------------------------------------------------------------
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, rawLen, rawRad * 2);

        // Muka Ujung Kanan Mentah
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(chuckFaceX + rawLen - 2, -rawRad, 2, rawRad * 2);
        ctx.strokeStyle = "#94a3b8";
        ctx.strokeRect(chuckFaceX + rawLen - 2, -rawRad, 2, rawRad * 2);

        // Titik Lubang Senter Putar
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(chuckFaceX + rawLen, -5);
        ctx.lineTo(chuckFaceX + rawLen - 7, 0);
        ctx.lineTo(chuckFaceX + rawLen, 5);
        ctx.closePath();
        ctx.fill();

        // Goresan Tanda Batas Ukuran (Marking Scribe Lines) tipis di keliling benda kerja
        const pMark = stepProgress;
        if (pMark > 0.25) {
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-35, -rawRad - 2);
          ctx.lineTo(-35, rawRad + 2);
          ctx.stroke();
        }
        if (pMark > 0.60) {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(20, -rawRad - 2);
          ctx.lineTo(20, rawRad + 2);
          ctx.stroke();
        }

      } else if (currentStepIdx === 1) {
        // ---------------------------------------------------------------------
        // LANGKAH 2: Pembubutan Diameter 48 mm Sepanjang Total 110 mm (X = 75 s.d. -35)
        // ---------------------------------------------------------------------
        const curCutX = Math.max(-35, Math.min(75, toolTipX));
        const unCutLen = curCutX - chuckFaceX;
        const cutLen = 75 - curCutX;

        // Bagian Mentah di Kiri (-115 s.d. curCutX, R = 30)
        if (unCutLen > 0) {
          ctx.fillStyle = stockGrad;
          ctx.fillRect(chuckFaceX, -rawRad, unCutLen, rawRad * 2);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 1;
          ctx.strokeRect(chuckFaceX, -rawRad, unCutLen, rawRad * 2);
          drawSpinTexture(chuckFaceX, -rawRad, unCutLen, rawRad * 2);
        }

        // Bagian Tersayat Diameter 48 mm di Kanan (curCutX s.d. 75, R = 24)
        if (cutLen > 0) {
          ctx.fillStyle = cutGrad;
          ctx.fillRect(curCutX, -step2Rad, cutLen, step2Rad * 2);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(curCutX, -step2Rad, cutLen, step2Rad * 2);
          drawSpinTexture(curCutX, -step2Rad, cutLen, step2Rad * 2);

          // Bahu Transisi Sudut Potong Utama 75° di posisi mata pahat
          ctx.fillStyle = "#60a5fa";
          ctx.strokeStyle = "#1d4ed8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(curCutX - 3, -rawRad);
          ctx.lineTo(curCutX, -step2Rad);
          ctx.lineTo(curCutX, step2Rad);
          ctx.lineTo(curCutX - 3, rawRad);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Muka Ujung Kanan
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(73, -step2Rad, 2, step2Rad * 2);
        ctx.strokeStyle = "#94a3b8";
        ctx.strokeRect(73, -step2Rad, 2, step2Rad * 2);

      } else if (currentStepIdx === 2) {
        // ---------------------------------------------------------------------
        // LANGKAH 3: Pemeriksaan Dimensi D = 48 mm & Panjang 110 mm (Silinder 48 mm Selesai)
        // ---------------------------------------------------------------------
        // Pangkal Mentah D0 = 60 mm (-115 s.d. -35)
        const baseLen = -35 - chuckFaceX;
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, baseLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckFaceX, -rawRad, baseLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, baseLen, rawRad * 2);

        // Silinder D = 48 mm Utuh Sepanjang 110 mm (-35 s.d. 75)
        ctx.fillStyle = cutGrad;
        ctx.fillRect(-35, -step2Rad, 110, step2Rad * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-35, -step2Rad, 110, step2Rad * 2);
        drawSpinTexture(-35, -step2Rad, 110, step2Rad * 2);

        // Bahu Siku 90° Pertama di X = -35 (undakan R = 24 ke R = 30)
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(-36, -rawRad, 2, rawRad - step2Rad);
        ctx.fillRect(-36, step2Rad, 2, rawRad - step2Rad);

        // Muka Ujung Kanan
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(73, -step2Rad, 2, step2Rad * 2);

      } else if (currentStepIdx === 3) {
        // ---------------------------------------------------------------------
        // LANGKAH 4: Pembubutan Diameter Tingkat Kedua 36 mm dari X = 75 mundur ke X = 20
        // ---------------------------------------------------------------------
        // Pangkal Mentah D0 = 60 mm (-115 s.d. -35)
        const baseLen = -35 - chuckFaceX;
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, baseLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckFaceX, -rawRad, baseLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, baseLen, rawRad * 2);

        // Bahu Siku di X = -35
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(-36, -rawRad, 2, rawRad - step2Rad);
        ctx.fillRect(-36, step2Rad, 2, rawRad - step2Rad);

        // Bagian Tingkat D = 48 mm (-35 s.d. curCutX2)
        const curCutX2 = Math.max(20, Math.min(75, toolTipX));
        const remLen48 = curCutX2 - (-35);
        const cutLen36 = 75 - curCutX2;

        if (remLen48 > 0) {
          ctx.fillStyle = cutGrad;
          ctx.fillRect(-35, -step2Rad, remLen48, step2Rad * 2);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-35, -step2Rad, remLen48, step2Rad * 2);
          drawSpinTexture(-35, -step2Rad, remLen48, step2Rad * 2);
        }

        // Bagian yang Sedang Disayat D = 36 mm (curCutX2 s.d. 75, R = 18)
        if (cutLen36 > 0) {
          ctx.fillStyle = cutGrad;
          ctx.fillRect(curCutX2, -step1Rad, cutLen36, step1Rad * 2);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 1.2;
          ctx.strokeRect(curCutX2, -step1Rad, cutLen36, step1Rad * 2);
          drawSpinTexture(curCutX2, -step1Rad, cutLen36, step1Rad * 2);

          // Bahu Transisi Sudut Potong Utama 75° di posisi mata pahat
          ctx.fillStyle = "#60a5fa";
          ctx.strokeStyle = "#1d4ed8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(curCutX2 - 3, -step2Rad);
          ctx.lineTo(curCutX2, -step1Rad);
          ctx.lineTo(curCutX2, step1Rad);
          ctx.lineTo(curCutX2 - 3, step2Rad);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Muka Ujung Kanan
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(73, -step1Rad, 2, step1Rad * 2);

      } else {
        // ---------------------------------------------------------------------
        // LANGKAH 5: Poros Bertingkat Selesai Sempurna dengan Chamfer 1x45°
        // ---------------------------------------------------------------------
        // Pangkal Mentah D0 = 60mm (-115 s.d. -35)
        const baseLen = -35 - chuckFaceX; // 80 mm
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, baseLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(chuckFaceX, -rawRad, baseLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, baseLen, rawRad * 2);

        // Tingkat 2 D2 = 48mm (-35 s.d. 20, L = 55mm)
        ctx.fillStyle = cutGrad;
        ctx.fillRect(-35, -step2Rad, 55, step2Rad * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-35, -step2Rad, 55, step2Rad * 2);
        drawSpinTexture(-35, -step2Rad, 55, step2Rad * 2);

        // Bahu Siku 2 di X = -35 (90° square)
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(-36, -rawRad, 2, rawRad - step2Rad);
        ctx.fillRect(-36, step2Rad, 2, rawRad - step2Rad);

        // Tingkat 1 D1 = 36mm (20 s.d. 75, L = 55mm)
        ctx.fillStyle = cutGrad;
        ctx.fillRect(20, -step1Rad, 55, step1Rad * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(20, -step1Rad, 55, step1Rad * 2);
        drawSpinTexture(20, -step1Rad, 55, step1Rad * 2);

        // Bahu Siku 1 di X = 20 (90° square)
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(19, -step2Rad, 2, step2Rad - step1Rad);
        ctx.fillRect(19, step1Rad, 2, step2Rad - step1Rad);

        // Chamfer 1x45° di Ujung Kanan (X = 75)
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.moveTo(73, -step1Rad);
        ctx.lineTo(75, -step1Rad + 2);
        ctx.lineTo(75, step1Rad - 2);
        ctx.lineTo(73, step1Rad);
        ctx.closePath();
        ctx.fill();

        // Muka Ujung Kanan
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(73, -step1Rad + 2, 2, (step1Rad - 2) * 2);
      }

    } else if (opId === "lathe_grooving") {
      // ---------------------------------------------------------------------
      // PEMBUATAN ALUR (GROOVING — PANDANGAN ATAS STANDAR TEKNIK)
      // ---------------------------------------------------------------------
      const grooveCenter = 25.0; // Sumbu alur di X = 25 (berjarak 50 mm dari muka ujung X = 75)
      const grooveW = 5.0;      // Lebar bilah pahat alur w = 5,0 mm
      const grooveLeft = grooveCenter - grooveW / 2;  // X = 22.5
      const grooveRight = grooveCenter + grooveW / 2; // X = 27.5

      // Tentukan kedalaman alur aktual (0 s.d. 6 mm)
      const isCuttingStep = currentStep && currentStep.visualAction === "cut_groove_radial";
      const isFinishedStep = currentStepIdx >= 3 || (currentStep && currentStep.stepNumber === 4);

      let grooveDepth = 0;
      if (isFinishedStep) {
        grooveDepth = 6.0; // Alur selesai penuh sedalam 6 mm (diameter dasar 48 mm)
      } else if (isCuttingStep) {
        // Kedalaman alur menjejak posisi mata pahat aktual (crossY - 60)
        const toolTipY = Math.max(24.0, Math.min(30.0, crossY - 60));
        grooveDepth = Math.max(0, 30.0 - toolTipY);
      }

      const recRad = rawRad - grooveDepth; // Radius silinder pada dasar alur (30 -> 24)

      if (grooveDepth > 0) {
        // 1. Silinder Bagian Kiri (dari Cekam ke Sisi Kiri Alur)
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, grooveLeft - chuckFaceX, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(chuckFaceX, -rawRad, grooveLeft - chuckFaceX, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, grooveLeft - chuckFaceX, rawRad * 2);

        // 2. Silinder Bagian Kanan (dari Sisi Kanan Alur ke Muka Ujung)
        ctx.fillStyle = stockGrad;
        ctx.fillRect(grooveRight, -rawRad, (chuckFaceX + rawLen) - grooveRight, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(grooveRight, -rawRad, (chuckFaceX + rawLen) - grooveRight, rawRad * 2);
        drawSpinTexture(grooveRight, -rawRad, (chuckFaceX + rawLen) - grooveRight, rawRad * 2);

        // 3. Rongga Saluran Alur (Groove Recessed Core)
        const grooveCoreGrad = ctx.createLinearGradient(0, -recRad, 0, recRad);
        grooveCoreGrad.addColorStop(0, "#475569");
        grooveCoreGrad.addColorStop(0.3, "#94a3b8");
        grooveCoreGrad.addColorStop(0.5, "#cbd5e1");
        grooveCoreGrad.addColorStop(0.7, "#94a3b8");
        grooveCoreGrad.addColorStop(1, "#334155");

        ctx.fillStyle = grooveCoreGrad;
        ctx.fillRect(grooveLeft, -recRad, grooveW, recRad * 2);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.strokeRect(grooveLeft, -recRad, grooveW, recRad * 2);

        // Dinding Samping Siku 90° Sisi Kiri & Kanan Alur
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Dinding kiri
        ctx.moveTo(grooveLeft, -rawRad); ctx.lineTo(grooveLeft, -recRad);
        ctx.moveTo(grooveLeft, recRad); ctx.lineTo(grooveLeft, rawRad);
        // Dinding kanan
        ctx.moveTo(grooveRight, -rawRad); ctx.lineTo(grooveRight, -recRad);
        ctx.moveTo(grooveRight, recRad); ctx.lineTo(grooveRight, rawRad);
        ctx.stroke();

        // Garis Dasar Alur Presisi Mengkilap
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(grooveLeft, recRad - 0.8, grooveW, 1.2);
        ctx.fillRect(grooveLeft, -recRad - 0.4, grooveW, 1.2);

      } else {
        // Silinder Mentah Utuh Penuh (Langkah 1 & Langkah 2)
        ctx.fillStyle = stockGrad;
        ctx.fillRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
        ctx.strokeStyle = "#475569";
        ctx.strokeRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
        drawSpinTexture(chuckFaceX, -rawRad, rawLen, rawRad * 2);
      }

      // Muka Ujung Kanan Silinder
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(chuckFaceX + rawLen - 2, -rawRad, 2, rawRad * 2);

    } else if (opId === "lathe_center_drilling") {
      // ---------------------------------------------------------------------
      // PENGEBORAN SENTER (CENTER DRILLING DIN 333-A — PANDANGAN ATAS STANDAR)
      // ---------------------------------------------------------------------
      ctx.fillStyle = stockGrad;
      ctx.fillRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
      drawSpinTexture(chuckFaceX, -rawRad, rawLen, rawRad * 2);

      const faceX = chuckFaceX + rawLen; // X = 75.0 (Muka ujung kanan benda kerja)
      const currentStepNum = currentStep ? currentStep.stepNumber : 1;
      let holeDepth = 0;
      if (animState.centerHoleDepth !== undefined) {
        holeDepth = animState.centerHoleDepth;
      } else if (currentStepNum >= 4) {
        holeDepth = 9.0;
      }

      if (holeDepth > 0.05) {
        // Geometri Lubang Senter Standar DIN 333 Form A:
        // Pilot drill: diameter d1 = 3.15 mm (radius 1.6 mm), panjang pilot L = 4.0 mm
        // Kerucut 60°: setengah sudut 30° (tan 30° = 0.577)
        const pilotR = 1.6;
        let coneDepth = 0;
        let mouthR = pilotR;
        if (holeDepth > 4.0) {
          coneDepth = holeDepth - 4.0;
          mouthR = Math.min(4.5, pilotR + coneDepth * 0.577);
        }
        const coneStartX = faceX - coneDepth;
        const holeBottomX = faceX - holeDepth;
        const pilotBodyX = Math.min(coneStartX, holeBottomX + 1.2);

        // Rongga Lubang Senter Potongan Gelap (Internal Cavity Shadow)
        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.moveTo(faceX, -mouthR);
        if (coneDepth > 0) {
          ctx.lineTo(coneStartX, -pilotR);
        }
        ctx.lineTo(pilotBodyX, -pilotR);
        ctx.lineTo(holeBottomX, 0); // Ujung bor silang 118°
        ctx.lineTo(pilotBodyX, pilotR);
        if (coneDepth > 0) {
          ctx.lineTo(coneStartX, pilotR);
        }
        ctx.lineTo(faceX, mouthR);
        ctx.closePath();
        ctx.fill();

        // Garis batas internal bersudut 60°
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Garis kilau refleksi konis 60°
        if (coneDepth > 0.4) {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(coneStartX, -pilotR);
          ctx.lineTo(faceX, -mouthR);
          ctx.moveTo(coneStartX, pilotR);
          ctx.lineTo(faceX, mouthR);
          ctx.stroke();
        }

        // Muka Ujung Silinder di Luar Lubang Senter (Flat Face with Center Hole Opening)
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(faceX - 2, -rawRad, 2, rawRad - mouthR);
        ctx.fillRect(faceX - 2, mouthR, 2, rawRad - mouthR);

      } else {
        // Muka Ujung Kanan Silinder Utuh Rata Sempurna (Langkah 1 & 2: Facing Selesai 90°, Belum Terlubang)
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(faceX - 2, -rawRad, 2, rawRad * 2);
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(faceX, -rawRad);
        ctx.lineTo(faceX, rawRad);
        ctx.stroke();
      }

    } else if (opId === "lathe_threading") {
      // Pembuatan Ulir Metris Segitiga 60° (Thread Turning - Top View)
      // Dimulai dari sisi kanan benda kerja (X = 75) menuju ke kiri sampai alur pembebas (X = -35)
      const threadEndX = chuckFaceX + rawLen; // X = -115 + 190 = 75
      const threadStartX = -35;
      const threadLen = threadEndX - threadStartX; // 110 px
      const undercutW = 8;
      const undercutStartX = threadStartX - undercutW; // X = -43
      const undercutRad = 25; // R = 25 mm pada alur pembebas (diameter 50)

      // 1. Silinder Mentah Utama di Kiri (X = -115 s.d. -43)
      ctx.fillStyle = stockGrad;
      ctx.fillRect(chuckFaceX, -rawRad, undercutStartX - chuckFaceX, rawRad * 2);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(chuckFaceX, -rawRad, undercutStartX - chuckFaceX, rawRad * 2);
      drawSpinTexture(chuckFaceX, -rawRad, undercutStartX - chuckFaceX, rawRad * 2);

      // 2. Alur Pembebas Ulir (Thread Relief Groove DIN 76 Form A, X = -43 s.d. -35)
      const reliefGrad = ctx.createLinearGradient(0, -undercutRad, 0, undercutRad);
      reliefGrad.addColorStop(0, "#334155");
      reliefGrad.addColorStop(0.5, "#94a3b8");
      reliefGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = reliefGrad;
      ctx.fillRect(undercutStartX, -undercutRad, undercutW, undercutRad * 2);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.strokeRect(undercutStartX, -undercutRad, undercutW, undercutRad * 2);
      drawSpinTexture(undercutStartX, -undercutRad, undercutW, undercutRad * 2);

      // Garis transisi bahu alur pembebas
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(undercutStartX, -rawRad);
      ctx.lineTo(undercutStartX, -undercutRad);
      ctx.moveTo(undercutStartX, rawRad);
      ctx.lineTo(undercutStartX, undercutRad);
      ctx.moveTo(threadStartX, -undercutRad);
      ctx.lineTo(threadStartX, -rawRad);
      ctx.moveTo(threadStartX, undercutRad);
      ctx.lineTo(threadStartX, rawRad);
      ctx.stroke();

      // 3. Batang Silinder Bidang Ulir (X = -35 s.d. 75)
      ctx.fillStyle = cutGrad;
      ctx.fillRect(threadStartX, -rawRad, threadLen, rawRad * 2);
      drawSpinTexture(threadStartX, -rawRad, threadLen, rawRad * 2);

      // Menghitung Kedalaman Ulir Berdasarkan Langkah Pemakanan Bertahap
      // Max Depth = 4.2 px (mewakili profil kedalaman penuh H = 1.23 mm)
      const maxToothDepth = 4.2;
      let curPassMaxDepth = 0;
      let prevPassDepth = 0;
      const isCutting = currentStep && currentStep.isCutting;
      const stepAct = currentStep ? currentStep.visualAction : "";

      if (stepAct === "cut_thread_pass_1") {
        prevPassDepth = 0;
        curPassMaxDepth = maxToothDepth * 0.15; // 0.63 px (scratch)
      } else if (stepAct === "cut_thread_pass_2") {
        prevPassDepth = maxToothDepth * 0.15;
        curPassMaxDepth = maxToothDepth * 0.45; // 1.89 px (roughing 1)
      } else if (stepAct === "cut_thread_pass_3") {
        prevPassDepth = maxToothDepth * 0.45;
        curPassMaxDepth = maxToothDepth * 0.75; // 3.15 px (roughing 2)
      } else if (stepAct === "cut_thread_pass_4") {
        prevPassDepth = maxToothDepth * 0.75;
        curPassMaxDepth = maxToothDepth * 1.00; // 4.20 px (full & spring)
      } else if (currentStepIdx >= 7) {
        prevPassDepth = maxToothDepth;
        curPassMaxDepth = maxToothDepth;
      } else if (currentStepIdx === 4) {
        curPassMaxDepth = maxToothDepth * 0.15;
        prevPassDepth = curPassMaxDepth;
      } else if (currentStepIdx === 5) {
        curPassMaxDepth = maxToothDepth * 0.45;
        prevPassDepth = curPassMaxDepth;
      } else if (currentStepIdx === 6) {
        curPassMaxDepth = maxToothDepth * 0.75;
        prevPassDepth = curPassMaxDepth;
      } else {
        curPassMaxDepth = 0;
        prevPassDepth = 0;
      }

      const pCut = Math.min(1.0, Math.max(0.0, stepProgress || 0));
      // Pemakanan longitudinal berlangsung pada pCut <= 0.60, lalu gigi tetap terpotong penuh saat retract & return
      const pStroke = isCutting ? Math.min(1.0, pCut / 0.60) : 1.0;
      // Pahat meluncur dari kanan (X = 75) ke kiri (X = -35)
      const curToolCutX = isCutting ? (threadEndX - (threadEndX - threadStartX) * pStroke) : (currentStepIdx >= 4 ? threadStartX : threadEndX);

      // 4. Profil Gigi Segitiga Metris 60° pada Tepi Atas & Bawah Poros
      const pitch = 6.5; // Kisar proporsional top-view
      const numTeeth = Math.floor(threadLen / pitch);

      for (let i = 0; i < numTeeth; i++) {
        const tx = threadStartX + i * pitch;
        // Gigi yang berada di sebelah kanan posisi pahat (tx >= curToolCutX) sudah terpotong pada lintasan ini
        let activeDepth = 0;
        if (isCutting) {
          activeDepth = tx >= curToolCutX - pitch * 0.5 ? curPassMaxDepth : prevPassDepth;
        } else if (currentStepIdx >= 7) {
          activeDepth = maxToothDepth;
        } else if (currentStepIdx === 3) {
          activeDepth = maxToothDepth * 0.15;
        } else if (currentStepIdx === 4) {
          activeDepth = maxToothDepth * 0.45;
        } else if (currentStepIdx === 5) {
          activeDepth = maxToothDepth * 0.75;
        } else if (currentStepIdx === 6) {
          activeDepth = maxToothDepth * 1.00;
        }

        if (activeDepth > 0.08) {
          // Gigi V-Groove 60° Sisi Atas
          ctx.beginPath();
          ctx.moveTo(tx, -rawRad);
          ctx.lineTo(tx + pitch / 2, -rawRad + activeDepth);
          ctx.lineTo(tx + pitch, -rawRad);
          ctx.closePath();
          ctx.fillStyle = "#0c1424"; // Dasar cekungan V ulir
          ctx.fill();
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Puncak Gigi Mengkilap
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(tx + pitch - 0.6, -rawRad - 0.5, 1.2, 1);

          // Gigi V-Groove 60° Sisi Bawah
          ctx.beginPath();
          ctx.moveTo(tx, rawRad);
          ctx.lineTo(tx + pitch / 2, rawRad - activeDepth);
          ctx.lineTo(tx + pitch, rawRad);
          ctx.closePath();
          ctx.fillStyle = "#0c1424";
          ctx.fill();
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(tx + pitch - 0.6, rawRad - 0.5, 1.2, 1);

          // 5. Garis Alur Heliks Miring Melintasi Bodi Poros (Helical Thread Flanks)
          const helixAlpha = Math.min(0.85, activeDepth / maxToothDepth * 0.9);
          ctx.strokeStyle = `rgba(30, 41, 59, ${helixAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(tx + pitch / 2, -rawRad + activeDepth);
          ctx.lineTo(tx + pitch, rawRad - activeDepth);
          ctx.stroke();

          // Kilauan Sisi Sayap Ulir (Thread Flank Shading)
          ctx.strokeStyle = `rgba(255, 255, 255, ${helixAlpha * 0.45})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(tx + pitch * 0.6, -rawRad + activeDepth);
          ctx.lineTo(tx + pitch * 1.1, rawRad - activeDepth);
          ctx.stroke();
        }
      }

      // 6. Chamfer Ujung Kanan (45° Lead-in Chamfer di Muka Poros X = 75)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(threadStartX, -rawRad, threadLen, rawRad * 2);

      // Tutup Muka Ujung Kanan
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(threadEndX - 2, -rawRad, 2, rawRad * 2);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(threadEndX - 2, -rawRad, 2, rawRad * 2);

      // Chamfer 45° di Ujung Muka Poros
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(threadEndX - 3, -rawRad);
      ctx.lineTo(threadEndX, -rawRad + 3);
      ctx.lineTo(threadEndX, -rawRad);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(threadEndX - 3, rawRad);
      ctx.lineTo(threadEndX, rawRad - 3);
      ctx.lineTo(threadEndX, rawRad);
      ctx.closePath();
      ctx.fill();

    } else {
      ctx.fillStyle = stockGrad;
      ctx.fillRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(chuckFaceX, -rawRad, rawLen, rawRad * 2);
    }

    ctx.restore();
  }

  function renderLatheTailstock() {
    ctx.save();
    const tsX = (currentOperation.id === "lathe_center_drilling" && animState.tailstockX !== undefined)
      ? animState.tailstockX
      : (currentOperation.id === "lathe_center_drilling" ? 172 : 121);

    // 1. Badan Cor Kepala Lepas (Tailstock Body Casting - Top View)
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(tsX, -38, 88, 76, [6, 4, 4, 6]);
    ctx.fill();
    ctx.stroke();

    // Pelat Penjepit ke Alas Mesin (Bed Clamping Base)
    ctx.fillStyle = "#334155";
    ctx.fillRect(tsX + 4, 28, 80, 16);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(tsX + 4, 28, 80, 16);

    // Tuas Pengunci Kepala Lepas (Clamping Lever on Front)
    const isClamped = (currentOperation.id === "lathe_center_drilling")
      ? (animState.tailstockClamped !== undefined ? animState.tailstockClamped : true)
      : true;

    if (isClamped) {
      // Terkunci kokoh tegak lurus ke bawah
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(tsX + 32, 40, 6, 16);
      ctx.fillStyle = "#22c55e"; // hijau indikator terkunci aman
      ctx.beginPath();
      ctx.arc(tsX + 35, 56, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Posisi kendur/miring bebas geser (Langkah 1)
      ctx.save();
      ctx.translate(tsX + 35, 40);
      ctx.rotate(-0.55); // miring terbuka
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(-3, 0, 6, 16);
      ctx.fillStyle = "#f59e0b"; // kuning amber peringatan klem bebas
      ctx.beginPath();
      ctx.arc(0, 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Laras Kepala Lepas (Quill Barrel - Ground Polished Steel Cylinder)
    const quillExt = animState.quillExtended || 0; // Maju ke kiri mendekati benda kerja
    const quillLen = 50 + quillExt;
    const quillStartX = tsX - quillExt - 18;

    const quillGrad = ctx.createLinearGradient(0, -14, 0, 14);
    quillGrad.addColorStop(0, "#475569");
    quillGrad.addColorStop(0.3, "#cbd5e1");
    quillGrad.addColorStop(0.5, "#f8fafc");
    quillGrad.addColorStop(0.7, "#cbd5e1");
    quillGrad.addColorStop(1, "#334155");
    ctx.fillStyle = quillGrad;
    ctx.fillRect(quillStartX, -14, quillLen, 28);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.strokeRect(quillStartX, -14, quillLen, 28);

    // Skala Ukur Milimeter pada Laras (Quill Millimeter Scale)
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let qx = quillStartX + 8; qx < tsX + 20; qx += 4) {
      const isMajor = ((qx - quillStartX) % 12 === 0);
      ctx.beginPath();
      ctx.moveTo(qx, -14);
      ctx.lineTo(qx, -14 + (isMajor ? 6 : 4));
      ctx.stroke();
    }

    // 3. Alat Bantu pada Lubang Tirus Morse Laras:
    if (currentOperation.id === "lathe_center_drilling") {
      // A. Cekam Bor Presisi (Keyed Drill Chuck) & Bor Senter Otentik DIN 333 Form A
      const chuckBackX = quillStartX;
      const chuckNoseX = quillStartX - 38;

      // 1. Tangkai Arbor Morse (Morse Taper Arbor Collar)
      ctx.fillStyle = "#334155";
      ctx.fillRect(chuckBackX - 4, -12, 4, 24);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(chuckBackX - 4, -12, 4, 24);

      // 2. Bodi Utama Cekam Bor (Main Chuck Body - Hardened Steel)
      const chuckGrad = ctx.createLinearGradient(0, -16, 0, 16);
      chuckGrad.addColorStop(0, "#1e293b");
      chuckGrad.addColorStop(0.25, "#475569");
      chuckGrad.addColorStop(0.5, "#94a3b8");
      chuckGrad.addColorStop(0.75, "#475569");
      chuckGrad.addColorStop(1, "#0f172a");

      ctx.fillStyle = chuckGrad;
      ctx.fillRect(chuckNoseX + 6, -16, 28, 32);
      ctx.strokeStyle = "#334155";
      ctx.strokeRect(chuckNoseX + 6, -16, 28, 32);

      // Ring Diamond Knurling (Pita Cengkeram Kasar Bertekstur)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(chuckNoseX + 18, -15.5, 12, 31);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
      ctx.lineWidth = 0.8;
      for (let kx = chuckNoseX + 19; kx < chuckNoseX + 30; kx += 2.5) {
        ctx.beginPath();
        ctx.moveTo(kx, -15.5);
        ctx.lineTo(kx, 15.5);
        ctx.stroke();
      }

      // Geared Ring (Ring Bergerigi untuk Kunci Cekam Bor / Chuck Key)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(chuckNoseX + 8, -15, 8, 30);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 0.7;
      for (let gy = -14; gy <= 14; gy += 3.5) {
        ctx.beginPath();
        ctx.moveTo(chuckNoseX + 8, gy);
        ctx.lineTo(chuckNoseX + 16, gy);
        ctx.stroke();
      }
      // Lubang Kunci Cekam (Key Pilot Hole)
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.arc(chuckNoseX + 12, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Hidung Konis Depan Cekam (Front Tapered Chuck Nose)
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(chuckNoseX + 6, -15);
      ctx.lineTo(chuckNoseX, -11);
      ctx.lineTo(chuckNoseX, 11);
      ctx.lineTo(chuckNoseX + 6, 15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.stroke();

      // Tiga Rahang Baja Presisi (3 Ground Steel Jaws Clamping Shank)
      const jawX = chuckNoseX - 5;
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(chuckNoseX, -10);
      ctx.lineTo(jawX, -4.5);
      ctx.lineTo(jawX, 4.5);
      ctx.lineTo(chuckNoseX, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.stroke();

      // Garis celah pembagi rahang
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(chuckNoseX, 0);
      ctx.lineTo(jawX, 0);
      ctx.stroke();

      // ----------------------------------------------------------------------
      // MATA BOR SENTER OTENTIK DIN 333 FORM A (HSS CENTER DRILL BIT)
      // ----------------------------------------------------------------------
      const shankX = jawX - 4;       // quillStartX - 47
      const coneX = shankX - 7;      // quillStartX - 54
      const pilotX = coneX - 6;      // quillStartX - 60
      const tipX = pilotX - 1.2;     // quillStartX - 61.2

      // 1. Batang Silindris HSS (Cylindrical Shank ⌀6,3 / ⌀8 mm)
      const drillGrad = ctx.createLinearGradient(0, -4, 0, 4);
      drillGrad.addColorStop(0, "#64748b");
      drillGrad.addColorStop(0.3, "#e2e8f0");
      drillGrad.addColorStop(0.6, "#f8fafc");
      drillGrad.addColorStop(1, "#475569");

      ctx.fillStyle = drillGrad;
      ctx.fillRect(shankX, -4, 4, 8);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(shankX, -4, 4, 8);

      // 2. Kerucut Tirus 60° (Countersink Chamfer Body 60° DIN 333)
      ctx.fillStyle = drillGrad;
      ctx.beginPath();
      ctx.moveTo(shankX, -4.0);
      ctx.lineTo(coneX, -1.6);
      ctx.lineTo(coneX, 1.6);
      ctx.lineTo(shankX, 4.0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.stroke();

      // Alur Tatal Heliks Spiral pada Konis (Countersink Spiral Chip Flutes)
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(shankX - 1, -2.8);
      ctx.lineTo(coneX + 1.5, -1.0);
      ctx.lineTo(coneX + 2.5, 0.2);
      ctx.lineTo(shankX - 0.5, -1.2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(shankX - 1, 2.8);
      ctx.lineTo(coneX + 1.5, 1.0);
      ctx.lineTo(coneX + 2.5, -0.2);
      ctx.lineTo(shankX - 0.5, 1.2);
      ctx.closePath();
      ctx.fill();

      // Sisi Potong Emas / HSS Mengkilap (Bright 60° Cutting Edges)
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(shankX, -4.0);
      ctx.lineTo(coneX, -1.6);
      ctx.moveTo(shankX, 4.0);
      ctx.lineTo(coneX, 1.6);
      ctx.stroke();

      // 3. Badan Bor Pemandu (Pilot Drill Body ⌀3,15 mm)
      ctx.fillStyle = drillGrad;
      ctx.fillRect(pilotX, -1.6, 6, 3.2);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(pilotX, -1.6, 6, 3.2);

      // Alur tatal pada pilot drill
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(pilotX + 1.2, -0.7, 4.2, 1.4);

      // 4. Ujung Mata Potong Konis 118° & Pahat Silang (118° Chisel Point)
      ctx.fillStyle = "#facc15"; // HSS / TiN coated cutting tip
      ctx.beginPath();
      ctx.moveTo(pilotX, -1.6);
      ctx.lineTo(tipX, 0);
      ctx.lineTo(pilotX, 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Titik Kontak Ujung Mata Bor Senter (Apex Glow)
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(tipX, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // B. Senter Putar 60° (Revolving Center 60°)
      const rcX = quillStartX;
      // Rumah Bantalan Senter Putar (Bearing Housing Collar)
      ctx.fillStyle = "#475569";
      ctx.fillRect(rcX - 14, -15, 14, 30);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(rcX - 14, -15, 14, 30);

      // Ujung Kerucut Senter Baja Keras 60° (Hardened 60° Conical Center Tip)
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(rcX - 14, -11);
      ctx.lineTo(rcX - 28, 0); // Ujung runcing menopang benda kerja
      ctx.lineTo(rcX - 14, 11);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.stroke();

      // Titik Kontak Penopang Senter Putar pada Benda Kerja
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(rcX - 28, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Roda Pemutar Laras Kepala Lepas (Quill Feed Handwheel)
    const hwX = tsX + 88;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(hwX, -22, 10, 44);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(hwX, -22, 10, 44);

    // Roda Cengkeram Bergelombang (Fluted Rim)
    ctx.fillStyle = "#94a3b8";
    for (let ry = -20; ry <= 20; ry += 5) {
      ctx.fillRect(hwX + 1, ry - 1, 8, 2);
    }

    // Pegangan Putar Krom yang Berputar Dinamis (Rotating Crank Handle)
    const crankAngle = animState.tailstockHandwheelAngle || 0;
    const crankR = 15;
    const crankY = crankR * Math.sin(crankAngle);
    const crankXOff = crankR * Math.cos(crankAngle) * 0.28;

    // Lengan engkol
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hwX + 5, 0);
    ctx.lineTo(hwX + 12 + crankXOff, crankY);
    ctx.stroke();

    // Kenop pegangan pegas silindris krom
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(hwX + 14 + crankXOff, crankY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  function renderLatheCarriageAndTool() {
    ctx.save();
    // Koordinat Posisi Eretan (Top View)
    // toolZ maps horizontal along spindle axis: 90 (left/near chuck) to 260 (right/safe)
    // toolX maps radial infeed towards spindle axis: 180 (retracted/safe) to 60 (center/deep cut)
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    // -----------------------------------------------------------------------
    // 1. MEJA ERETAN ALAS & APRON (CARRIAGE SADDLE & APRON BASE)
    // Berada tepat DI BAWAH benda kerja (Y >= 34) pada alas pemandu depan (operator side)
    // Tidak pernah menutupi atau melintasi silinder benda kerja (Y in [-30, +30])
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.translate(carX, 0);

    // A. Bodi Meja Eretan Alas (Saddle Carriage Base on Front Bed Ways)
    // Terletak di Y: 34 s.d. 72 (tepat di bawah diameter benda kerja Y = 30)
    const saddleGrad = ctx.createLinearGradient(0, 34, 0, 72);
    saddleGrad.addColorStop(0, "#334155");
    saddleGrad.addColorStop(0.5, "#475569");
    saddleGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = saddleGrad;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-46, 34, 92, 38, [3, 3, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Alur Ekor Burung Panduan Eretan Melintang (Cross-Slide Dovetail Guide)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-18, 34, 36, 38);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, 34, 36, 38);

    // Garis kemiringan alur ekor burung (Dovetail slope lines)
    ctx.strokeStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(-14, 34);
    ctx.lineTo(-14, 72);
    ctx.moveTo(14, 34);
    ctx.lineTo(14, 72);
    ctx.stroke();

    // Pembersih Bram Kuningan (Brass Guideway Wipers) di Sayap Kiri & Kanan Alas Depan
    [[-46, 36], [34, 36], [-46, 62], [34, 62]].forEach(([wx, wy]) => {
      ctx.fillStyle = "#d97706";
      ctx.fillRect(wx, wy, 12, 8);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(wx + 2, wy + 2, 8, 4);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(wx + 4, wy + 3, 4, 2);
    });

    // Baut & Plat Klem Pengunci Eretan Memanjang (Carriage Lock Mechanism)
    const isLocked = animState.carriageLocked;
    ctx.fillStyle = isLocked ? "#ef4444" : "#cbd5e1";
    ctx.beginPath();
    ctx.arc(36, 48, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isLocked ? "#991b1b" : "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (isLocked) {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(31, 38, 10, 5);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(31, 38, 10, 5);
    }

    // B. Dinding Depan Eretan / Apron Mesin Bubut (Front Apron Casting)
    // Menempel di sisi depan meja eretan (Y: 72 s.d. 106)
    const apronGrad = ctx.createLinearGradient(0, 72, 0, 106);
    apronGrad.addColorStop(0, "#1e293b");
    apronGrad.addColorStop(0.3, "#334155");
    apronGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = apronGrad;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-44, 72, 88, 34, [0, 0, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Roda Pemutar Manual Eretan Memanjang (Longitudinal Feed Handwheel) di Sisi Kiri Apron
    const hwX = -24;
    const hwY = 89;
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(hwX, hwY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Velg Krom & Spoke Roda Pemutar
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(hwX, hwY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pegangan Putar Krom (Crank Handle Knob) yang berputar dinamis mengikuti toolZ
    const apronHwAngle = animState.toolZ * 0.22;
    const kx = hwX + Math.cos(apronHwAngle) * 7.5;
    const ky = hwY + Math.sin(apronHwAngle) * 7.5;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(kx, ky, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.stroke();

    // Tuas Otomatis Pemakanan (Power Feed Engagement Lever) di Tengah Apron
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(4, 76, 5, 18);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(4, 76, 5, 18);
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(6.5, 95, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tuas Mur Belah Ulir (Half-Nut Threading Lever) di Kanan Apron
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(24, 78, 5, 16);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(24, 78, 5, 16);
    const isHalfNutEngaged = (currentOperation && currentOperation.id === "lathe_threading") ? !!animState.isThreadingCutting : animState.isCutting;
    ctx.fillStyle = isHalfNutEngaged ? "#ef4444" : "#f59e0b";
    ctx.beginPath();
    ctx.arc(26.5, 95, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // end saddle translation

    // -----------------------------------------------------------------------
    // 2. ERETAN MELINTANG (CROSS-SLIDE) DENGAN SKALA NONIUS & RODA PEMUTAR
    // -----------------------------------------------------------------------
    ctx.save();
    ctx.translate(carX, crossY);

    // Meja Luncur Ekor Burung (Cross-Slide Dovetail Table)
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-24, -20, 48, 64, [4, 4, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Baji Penyetel Kelonggaran (Brass Gib Strip on Right Flank)
    ctx.fillStyle = "#d97706";
    ctx.fillRect(21, -16, 3, 56);
    // 3 Baut Penyetel Gib
    ctx.fillStyle = "#cbd5e1";
    [-8, 12, 32].forEach((gy) => {
      ctx.fillRect(22, gy, 3, 2);
    });

    // Lubang Pelumasan Oli (Brass Oiler Nipple)
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(-16, 28, 3, 0, Math.PI * 2);
    ctx.fill();

    // Dudukan Poros Ulir Melintang & Skala Nonius Mikrometer (Operator Edge)
    const dialY = 44;
    // Blok Bantalan Ulir Lintang
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-10, dialY, 20, 10);

    // Cincin Skala Nonius Mikrometer (Micrometer Dial Collar 0.02 mm)
    const dialGrad = ctx.createLinearGradient(-12, dialY + 10, 12, dialY + 10);
    dialGrad.addColorStop(0, "#475569");
    dialGrad.addColorStop(0.5, "#f1f5f9");
    dialGrad.addColorStop(1, "#334155");
    ctx.fillStyle = dialGrad;
    ctx.fillRect(-12, dialY + 10, 24, 8);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(-12, dialY + 10, 24, 8);
    // Garis Skala Nonius
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let dx = -10; dx <= 10; dx += 3) {
      ctx.beginPath();
      ctx.moveTo(dx, dialY + 10);
      ctx.lineTo(dx, dialY + 14);
      ctx.stroke();
    }

    // Roda Pemutar Eretan Melintang (Dual-Ball Cross-Feed Crank Handle)
    const crankY = dialY + 22;
    // Palang Poros Engkol
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-22, crankY - 2, 44, 4);
    // Knop Krom Bulat di Kiri & Kanan
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(-22, crankY, 5, 0, Math.PI * 2);
    ctx.arc(22, crankY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.stroke();

    // -----------------------------------------------------------------------
    // 3. MEJA PUTAR NONIUS DERAJAT ERETAN ATAS (SWIVEL BASE & 360° DIAL)
    // -----------------------------------------------------------------------
    // Piringan Dudukan Meja Putar (Circular Swivel Plate, Radius 26)
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Busur Skala Nonius Derajat (Engraved 360° Circular Protractor Scale)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.8;
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const len = isMajor ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * (26 - len), Math.sin(rad) * (26 - len));
      ctx.lineTo(Math.cos(rad) * 26, Math.sin(rad) * 26);
      ctx.stroke();
    }

    // Garis Indeks Nol pada Meja Eretan Lintang
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(0, 31);
    ctx.stroke();

    // 2 Baut Pengikat Eretan Atas (T-Slot Hex Clamping Bolts)
    // Terletak di alur T radius 18, di kiri dan kanan
    const boltColor = animState.boltsLoose ? "#f59e0b" : "#cbd5e1";
    ctx.fillStyle = boltColor;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;

    // Baut Kiri
    ctx.beginPath();
    ctx.arc(-17, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Baut Kanan
    ctx.beginPath();
    ctx.arc(17, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Animasi Kunci Pas saat mengendurkan atau mengencangkan baut
    const isWrenchTighten = currentOperation.steps[currentStepIdx] && currentOperation.steps[currentStepIdx].visualAction === "tighten_bolts";
    if (animState.boltsLoose || isWrenchTighten) {
      ctx.save();
      const boltXTarget = (Math.sin(performance.now() * 0.003) > 0) ? -17 : 17;
      ctx.translate(boltXTarget, 0);
      const wrenchSwing = Math.sin(performance.now() * 0.008) * (animState.boltsLoose ? -0.4 : 0.4);
      ctx.rotate(wrenchSwing);
      renderWrenchIcon();
      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // 4. ERETAN ATAS / ERETAN PAHAT BERPUTAR (SWIVELING COMPOUND REST)
    // -----------------------------------------------------------------------
    ctx.save();
    // Putaran eretan atas sebesar sudut α (derajat)
    // Miring ke arah kanan (positif / CW ke arah kepala lepas / tailstock)
    let angleRad = (animState.eretanAngle * Math.PI) / 180;
    if (currentOperation && currentOperation.id === "lathe_taper") {
      // Sudut visual eretan atas disesuaikan presisi agar peluncur bergerak sepanjang generator tirus 30°
      // Dari sumbu vertikal kanvas: θ = 60.46° (90° - 29.54°), sehingga miring jelas dan presisi ke arah kanan
      const visualAngleDeg = (animState.eretanAngle / 30) * 60.46;
      angleRad = (visualAngleDeg * Math.PI) / 180;
    }
    ctx.rotate(angleRad);

    // Landasan Bawah Ekor Burung Tetap pada Meja Putar (Base Dovetail Guide)
    ctx.fillStyle = "#334155";
    ctx.fillRect(-14, -30, 28, 56);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, -30, 28, 56);

    // Geser peluncur eretan atas sepanjang sumbu miring:
    // Pemakanan ditarik mundur (retract feed ke arah +Y menjauhi sumbu benda kerja)
    const feedOffset = animState.compoundFeed || 0;
    ctx.save();
    ctx.translate(0, feedOffset);

    // Badan Peluncur Eretan Atas (Compound Rest Upper Slide Body)
    ctx.fillStyle = "#475569";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-16, -32, 32, 50, [3, 3, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Alur Ekor Burung Eretan Atas
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-12, -26, 24, 38);

    // Roda Pemutar Manual Eretan Atas di Ujung Belakang (Feed Handwheel with Spoke Spin)
    const upperHwY = 24;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-8, upperHwY, 16, 6);
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(-8, upperHwY, 16, 6);

    // Rotating Handwheel Handle
    const hwAngle = animState.compoundHandwheelAngle || 0;
    const hx = Math.sin(hwAngle) * 5.5;
    const hy = Math.cos(hwAngle) * 3;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(hx, upperHwY + 8 + hy, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.stroke();

    // -----------------------------------------------------------------------
    // 5. RUMAH PAHAT EMPAT ARAH (4-WAY SQUARE TOOLPOST TURRET)
    // -----------------------------------------------------------------------
    // Posisi Rumah Pahat di (0, -18) pada bodi eretan atas
    const tpY = -18;
    const tpSize = 30; // 30x30 mm bujur sangkar

    // Bodi Kotak Rumah Pahat 4 Arah (Square Block with Chamfered Corners)
    ctx.save();
    ctx.translate(0, tpY);

    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Chamfered square
    const h = tpSize / 2;
    const c = 4; // chamfer
    ctx.moveTo(-h + c, -h);
    ctx.lineTo(h - c, -h);
    ctx.lineTo(h, -h + c);
    ctx.lineTo(h, h - c);
    ctx.lineTo(h - c, h);
    ctx.lineTo(-h + c, h);
    ctx.lineTo(-h, h - c);
    ctx.lineTo(-h, -h + c);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tiang Pengikat Senter Rumah Pahat (Center Turret Stud)
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();

    // Tuas Pengencang Rumah Pahat (Heavy Clamping Lever Handle)
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-2, -2, 4, 18);
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(0, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();

    // 4 Baut Pengikat Pahat Kepala Segi Empat (Square-Head Clamping Screws)
    // Berjajar di sisi penjepitan pahat (sisi depan kiri)
    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    [-9, -3, 3, 9].forEach((by) => {
      ctx.fillRect(-13, by - 2, 4, 4);
      ctx.strokeRect(-13, by - 2, 4, 4);
    });

    // -----------------------------------------------------------------------
    // 6. PAHAT BUBUT OTENTIK (AUTHENTIC LATHE CUTTING TOOL — STANDAR ISO)
    // -----------------------------------------------------------------------
    renderAuthenticTool(currentOperation.id);

    ctx.restore(); // end toolpost translate
    ctx.restore(); // end compound feed translate
    ctx.restore(); // end compound rest swivel
    ctx.restore(); // end cross-slide translate
    ctx.restore(); // end carriage save
  }

  function renderAuthenticTool(opId) {
    ctx.save();
    // Koordinat lokal relatif terhadap pusat Rumah Pahat (0, 0):
    // Batang pahat dijepit di slot kiri (-h = -15), menjulur ke depan (ke arah -Y) menuju benda kerja
    const shankX = -13;
    const shankW = 10;
    const shankLen = 28;

    // Batang Pahat Baja Karbon Hitam Oksida (Tool Shank 16x16 mm)
    ctx.fillStyle = "#090d16";
    ctx.fillRect(shankX, -shankLen, shankW, shankLen);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(shankX, -shankLen, shankW, shankLen);

    // Tip of tool shank is at Y = -shankLen (-28)
    const tipY = -shankLen;

    if (opId === "lathe_grooving") {
      // ---------------------------------------------------------------------
      // PAHAT ALUR & POTONG (GROOVING TOOL — STANDAR ISO 7 / N123)
      // ---------------------------------------------------------------------
      // Bilah pipih panjang (narrow grooving blade) tegak lurus sumbu poros
      const bladeW = 5;
      const bladeLen = 14;
      const bladeX = shankX + (shankW - bladeW) / 2; // -13 + (10 - 5)/2 = -10.5

      // Bilah Badan Pahat Baja Perkakas (Hardened Tool Steel Blade Body)
      const bladeGrad = ctx.createLinearGradient(bladeX, 0, bladeX + bladeW, 0);
      bladeGrad.addColorStop(0, "#475569");
      bladeGrad.addColorStop(0.5, "#94a3b8");
      bladeGrad.addColorStop(1, "#334155");
      ctx.fillStyle = bladeGrad;
      ctx.fillRect(bladeX, tipY - bladeLen, bladeW, bladeLen);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(bladeX, tipY - bladeLen, bladeW, bladeLen);

      // Insert Karbida Pemotong Alur (Tungsten Carbide Grooving Insert Tip)
      // Berujung datar lurus 90° presisi selebar w = 5 mm dengan alur pemecah tatal
      ctx.fillStyle = "#f59e0b"; // TiN Coated Gold Carbide
      ctx.fillRect(bladeX, tipY - bladeLen, bladeW, 3.5);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(bladeX, tipY - bladeLen, bladeW, 3.5);

      // Mata Potong Depan Mengkilap Tajam (Front Cutting Edge)
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(bladeX, tipY - bladeLen, bladeW, 1);

      // Alur Pemecah Tatal (Chipbreaker Cavity) di Muka Atas Insert
      ctx.fillStyle = "#b45309";
      ctx.fillRect(bladeX + 0.8, tipY - bladeLen + 1.2, bladeW - 1.6, 1.4);

      // Sudut Bebas Samping (Side Clearance Flanks)
      ctx.strokeStyle = "rgba(15, 23, 42, 0.6)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(bladeX + 0.7, tipY);
      ctx.lineTo(bladeX + 0.7, tipY - bladeLen + 3.5);
      ctx.moveTo(bladeX + bladeW - 0.7, tipY);
      ctx.lineTo(bladeX + bladeW - 0.7, tipY - bladeLen + 3.5);
      ctx.stroke();

      // Baut Klem Pengikat Bilah pada Pemegang Pahat
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(shankX + shankW / 2, tipY + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (opId === "lathe_threading") {
      // ---------------------------------------------------------------------
      // PAHAT ULIR SEGITIGA METRIS 60° (THREADING TOOL — ISO METRIC 60°)
      // ---------------------------------------------------------------------
      // Insert karbida segitiga bersudut puncak persis 60°
      const insTipY = tipY - 12;
      const insX = shankX + shankW / 2;

      // Dudukan Insert (Pocket Shim Seat)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(shankX - 1, tipY - 8, shankW + 2, 8);

      // Insert Karbida Segitiga TiN Emas Berujung Tajam 60°
      ctx.fillStyle = COLORS.metalCarbideGold; // #f59e0b
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(insX, insTipY); // Ujung runcing puncak 60°
      ctx.lineTo(insX - 7, tipY - 1);
      ctx.lineTo(insX + 7, tipY - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Baut Pengunci Insert Torx di Tengah Segitiga
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(insX, tipY - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (opId === "lathe_facing") {
      // ---------------------------------------------------------------------
      // PAHAT BUBUT MUKA (FACING TOOL — ISO 2/3)
      // ---------------------------------------------------------------------
      // Mata potong utama menghadap bidang muka poros (sudut miring ~45°-60°)
      const insTipY = tipY - 12;
      const insX = shankX + 2;

      // Dudukan Pocket Miring
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(shankX - 2, tipY - 10, shankW + 4, 10);

      // Insert Karbida Muka TiN Emas
      ctx.fillStyle = COLORS.metalCarbideGold;
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(insX - 3, insTipY); // Ujung mata potong
      ctx.lineTo(insX + 11, insTipY + 4); // Sisi potong muka
      ctx.lineTo(insX + 8, tipY);
      ctx.lineTo(insX - 5, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Baut Torx
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(insX + 3, tipY - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (opId === "lathe_center_drilling") {
      // ---------------------------------------------------------------------
      // PENGEBORAN SENTER: Pahat bubut diistirahatkan di posisi aman
      // ---------------------------------------------------------------------
      ctx.fillStyle = "#475569";
      ctx.fillRect(shankX, tipY - 6, shankW, 6);

    } else {
      // ---------------------------------------------------------------------
      // PAHAT BUBUT RATA KANAN (SIDE TURNING TOOL — ISO 6 / CNMG 80°)
      // Digunakan untuk: lathe_taper, lathe_straight, lathe_step
      // ---------------------------------------------------------------------
      // Lead angle κr = 75°-90°, sudut potong menghadap ke kiri (kepala tetap)
      const insTipY = tipY - 12;
      const insX = shankX + 1;

      // Pocket Dudukan Insert Karbida (Carbide Shim Seat)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(shankX - 2, tipY - 10, shankW + 4, 10);

      // Insert Karbida Rhombic 80° Warna Emas TiN (TiN-Coated Carbide)
      ctx.fillStyle = COLORS.metalCarbideGold;
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(insX - 3, insTipY); // Ujung hidung pahat (nose radius r_eps = 0.8mm)
      ctx.lineTo(insX - 7, insTipY + 7); // Sudut potong utama menghadap kiri (ke cekam)
      ctx.lineTo(insX + 5, tipY);
      ctx.lineTo(insX + 9, insTipY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pola Alur Pemecah Tatal 3D (Chipbreaker Groove Geometry)
      ctx.strokeStyle = "rgba(120, 53, 15, 0.7)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(insX - 1, insTipY + 4, 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // Baut Torx Pengunci Insert di Tengah
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(insX + 1, tipY - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function renderWrenchIcon() {
    ctx.save();
    ctx.fillStyle = "#f59e0b";
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.5;

    // Gagang Kunci Pas
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -18);
    ctx.lineTo(30, -14);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kepala Kunci Pas
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rahang Kunci Pas (Open-End Mouth)
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.rect(-3, -3, 6, 6);
    ctx.fill();

    ctx.restore();
  }

  function renderCoolantSpray(targetX, targetY) {
    ctx.save();
    // Pipa Saluran Pendingin Fleksibel (Loc-Line Flexible Coolant Hose)
    const startX = targetX - 45;
    const startY = targetY - 45;

    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(targetX - 22, targetY - 35, targetX - 8, targetY - 12);
    ctx.stroke();

    // Nozel Semprotan Kuningan (Brass Nozzle Tip)
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(targetX - 10, targetY - 14, 6, 6);

    // Semburan Cairan Coolant Emulsi Putih/Biru
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(targetX - 7, targetY - 10);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Tetesan Cipratan Coolant (Coolant Droplets)
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.6) {
        spawnChip(targetX + (Math.random() - 0.5) * 6, targetY + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35, COLORS.coolant);
      }
    }
    ctx.restore();
  }

  function renderLatheStepAnnotations(step, cutPt) {
    ctx.save();
    const act = step.visualAction;
    const isFacing = currentOperation && currentOperation.id === "lathe_facing";
    const isStraight = currentOperation && currentOperation.id === "lathe_straight";
    const isStep = currentOperation && currentOperation.id === "lathe_step";
    const isTaper = currentOperation && currentOperation.id === "lathe_taper";

    // -------------------------------------------------------------------------
    // ANOTASI & ALAT BANTU KHUSUS PEMBUBUTAN MUKA (STEP-BY-STEP FACING AIDS)
    // -------------------------------------------------------------------------
    if (isFacing) {
      if (act === "align_center_height") {
        renderFacingCenterAlignment(stepProgress);
      } else if (act === "touch_face_z0") {
        renderFacingTouchZ0(stepProgress, cutPt);
      } else if (act === "feed_axial_depth") {
        renderFacingAxialDepth(stepProgress);
      } else if (act === "cut_facing_pass") {
        renderFacingRadialCut(cutPt, stepProgress);
      } else if (act === "inspect_facing") {
        renderFacingInspection(stepProgress);
      }
      ctx.restore();
      return;
    }

    // -------------------------------------------------------------------------
    // ANOTASI & ALAT BANTU KHUSUS PEMBUBUTAN RATA / SILINDRIS (STRAIGHT TURNING)
    // -------------------------------------------------------------------------
    if (isStraight) {
      if (act === "clamp_workpiece") {
        renderStraightClampCentering(stepProgress);
      } else if (act === "touch_diameter_x0") {
        renderStraightTouchX0(stepProgress, cutPt);
      } else if (act === "set_radial_depth") {
        renderStraightRadialDepth(stepProgress);
      } else if (act === "cut_straight_longitudinal") {
        renderStraightCuttingPass(cutPt, stepProgress);
      } else if (act === "measure_diameter") {
        renderStraightInspection(stepProgress);
      }
      ctx.restore();
      return;
    }

    // -------------------------------------------------------------------------
    // ANOTASI & ALAT BANTU KHUSUS PEMBUBUTAN BERTINGKAT (STEP TURNING)
    // -------------------------------------------------------------------------
    if (isStep) {
      if (act === "mark_step_boundaries") {
        renderStepMarking(stepProgress);
      } else if (act === "cut_step_diameter_48") {
        renderStep48Cutting(cutPt, stepProgress);
      } else if (act === "inspect_step_stage_1") {
        renderStep110Inspection(stepProgress);
      } else if (act === "cut_step_diameter_36") {
        renderStep36Cutting(cutPt, stepProgress);
      } else if (act === "inspect_step_stage_2") {
        renderStepDepthBarInspection(stepProgress);
      }
      ctx.restore();
      return;
    }

    // -------------------------------------------------------------------------
    // ANOTASI & ALAT BANTU KHUSUS PEMBUATAN ALUR & POTONG (GROOVING AIDS)
    // -------------------------------------------------------------------------
    const isGrooving = currentOperation && currentOperation.id === "lathe_grooving";
    if (isGrooving) {
      if (act === "align_groove_tool") {
        renderGrooveToolAlignment(stepProgress);
      } else if (act === "position_groove_z") {
        renderGroovePositionZ(stepProgress);
      } else if (act === "cut_groove_radial") {
        renderGrooveRadialCutting(cutPt, stepProgress);
      } else if (act === "inspect_groove") {
        renderGrooveInspection(stepProgress);
      }
      ctx.restore();
      return;
    }

    // -------------------------------------------------------------------------
    // ANOTASI & ALAT BANTU KHUSUS PENGEBORAN SENTER (CENTER DRILLING AIDS)
    // -------------------------------------------------------------------------
    const isCenterDrill = currentOperation && currentOperation.id === "lathe_center_drilling";
    if (isCenterDrill) {
      if (act === "mount_center_drill") {
        renderCenterDrillMounting(stepProgress);
      } else if (act === "clamp_tailstock") {
        renderCenterDrillPositioning(stepProgress);
      } else if (act === "drill_center_hole") {
        renderCenterDrillPeckingProcess(stepProgress, cutPt);
      } else if (act === "inspect_center_hole") {
        renderCenterDrillInspection(stepProgress);
      }
      ctx.restore();
      return;
    }

    // -------------------------------------------------------------------------
    // ANOTASI KHUSUS PEMBUBUTAN TIRUS (STEP-BY-STEP TAPER TURNING VISUAL AIDS)
    // -------------------------------------------------------------------------
    if (isTaper) {
      if (act === "align_tool_parallel") {
        renderTaperToolParallelAlignment();
      } else if (act === "calculate_angle") {
        renderTaperFormulaCard();
        renderTaperDimensionLines();
        renderTaperSwivelBaseHighlight();
      } else if (act === "loosen_bolts") {
        renderTaperBoltHighlight(true);
      } else if (act === "swivel_compound_rest") {
        renderTaperSwivelLoupe();
      } else if (act === "tighten_bolts") {
        renderTaperBoltHighlight(false);
      } else if (act === "lock_carriage_set_depth") {
        renderCarriageLockIndicator();
      } else if (act === "cut_taper_pass") {
        renderTaperFeedIndicator(cutPt);
        if (Math.random() < 0.85) {
          spawnChip(cutPt.x + (Math.random() - 0.5) * 8, cutPt.y, (Math.random() - 0.5) * 50, 40 + Math.random() * 40, COLORS.sparkChip);
        }
      } else if (act === "inspect_taper") {
        renderBevelProtractorInspection();
      }
      ctx.restore();
      return;
    }

    // -------------------------------------------------------------------------
    // ANOTASI KHUSUS PEMBUBUTAN ULIR SEGITIGA METRIS (THREAD TURNING AIDS)
    // -------------------------------------------------------------------------
    const isThreading = currentOperation && currentOperation.id === "lathe_threading";
    if (isThreading) {
      if (act === "align_thread_gauge") {
        renderThreadGaugeAlignment(stepProgress);
      } else if (act === "set_thread_gearbox") {
        renderThreadGearboxCard(stepProgress);
      } else if (act === "touch_thread_zero") {
        renderThreadTouchZeroIndicator(cutPt);
      } else if (act.startsWith("cut_thread_pass")) {
        const passIndex = act === "cut_thread_pass_1" ? 1 : act === "cut_thread_pass_2" ? 2 : act === "cut_thread_pass_3" ? 3 : 4;
        const passAp = passIndex === 1 ? "0,10 mm" : passIndex === 2 ? "0,40 mm" : passIndex === 3 ? "0,85 mm" : "1,23 mm (Penuh)";
        renderThreadPassIndicator(passIndex, passAp, cutPt);
        if (animState.isThreadingCutting && Math.random() < 0.85) {
          spawnChip(cutPt.x + (Math.random() - 0.5) * 6, cutPt.y, -30 - Math.random() * 40, 30 + Math.random() * 40, COLORS.sparkChip);
        }
      } else if (act === "inspect_thread") {
        renderThreadInspection(stepProgress);
      }
      ctx.restore();
      return;
    }

    // Busur Penunjuk Sudut Umum (Miring ke Arah Kanan)
    if (act === "calculate_angle" || act === "swivel_compound_rest" || act === "cut_taper_pass") {
      const carX = -30 + (animState.toolZ - 90) * 0.74;
      const crossY = 32 + (animState.toolX - 60) * 0.44;

      ctx.save();
      ctx.translate(carX, crossY);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -42);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      // Busur melengkung ke kanan (+30° searah jarum jam)
      ctx.arc(0, 0, 36, -Math.PI / 2, -Math.PI / 2 + (30 * Math.PI) / 180, false);
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText("α = 30°", 12, -42);
      ctx.restore();
    }

    // Partikel tatal sayatan untuk operasi bubut umum
    if (act === "cut_facing_pass") {
      if (Math.random() < 0.85) {
        spawnChip(cutPt.x, cutPt.y + (Math.random() - 0.5) * 8, 30 + Math.random() * 30, (Math.random() - 0.5) * 50, COLORS.sparkChip);
      }
    } else if (act === "cut_straight_longitudinal" || act === "cut_step_1" || act === "cut_step_2") {
      if (Math.random() < 0.85) {
        spawnChip(cutPt.x, cutPt.y + (Math.random() - 0.5) * 8, -30 - Math.random() * 40, 30 + Math.random() * 40, COLORS.sparkChip);
      }
    } else if (act === "cut_groove_radial") {
      if (Math.random() < 0.85) {
        spawnChip(cutPt.x + (Math.random() - 0.5) * 4, cutPt.y, (Math.random() - 0.5) * 40, 40 + Math.random() * 30, COLORS.sparkChip);
      }
    } else if (act === "drill_center_hole") {
      if (Math.random() < 0.85) {
        spawnChip(cutPt.x, cutPt.y + (Math.random() - 0.5) * 4, 30 + Math.random() * 30, (Math.random() - 0.5) * 30, COLORS.sparkChip);
      }
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS & ALAT BANTU UNTUK PEMBUBUTAN MUKA (FACING)
  // ---------------------------------------------------------------------------

  // 1. Langkah 1: Penyetelan Pahat Muka Tepat Setinggi Titik Senter
  function renderFacingCenterAlignment(p) {
    ctx.save();
    // Animasi Fade Out ketika menuju akhir langkah (p > 0.82)
    const fadeAlpha = p > 0.82 ? Math.max(0, (1.0 - p) / 0.18) : 1.0;
    ctx.globalAlpha = fadeAlpha;

    // Animasi Floating / Mengambang halus naik-turun menunjukkan pengecekan ketinggian
    const floatY = Math.sin(performance.now() * 0.005) * 2.8;

    // Garis Laser Sumbu Senter Mesin (Centerline Datum)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(135, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Titik Senter Puncak Ujung Kepala Lepas (X = 75, Y = 0)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(75, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Lingkaran Denyut Bidik Presisi pada Titik Temu Ujung Pahat & Senter
    const pulseRad = 6 + Math.sin(performance.now() * 0.008) * 3;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(75, floatY, pulseRad, 0, Math.PI * 2);
    ctx.stroke();

    // Floating Magnifying Loupe Overlay (Kaca Pembesar Presisi Ketinggian Senter)
    const loupeX = 75;
    const loupeY = -78 + floatY;
    const loupeR = 34;

    // Lingkaran Kaca Pembesar
    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(loupeX, loupeY, loupeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gagang Kaca Pembesar
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(loupeX + loupeR * 0.7, loupeY + loupeR * 0.7);
    ctx.lineTo(loupeX + loupeR * 0.7 + 16, loupeY + loupeR * 0.7 + 16);
    ctx.stroke();

    // Di Dalam Kaca Pembesar: Pembesaran Ujung Senter 60° (Kiri) & Ujung Pahat HSS (Kanan)
    ctx.save();
    ctx.beginPath();
    ctx.arc(loupeX, loupeY, loupeR - 2, 0, Math.PI * 2);
    ctx.clip();

    // Latar grid mikrometer dalam loupe
    ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
    ctx.lineWidth = 0.6;
    for (let gx = loupeX - loupeR; gx <= loupeX + loupeR; gx += 8) {
      ctx.beginPath();
      ctx.moveTo(gx, loupeY - loupeR);
      ctx.lineTo(gx, loupeY + loupeR);
      ctx.stroke();
    }
    for (let gy = loupeY - loupeR; gy <= loupeY + loupeR; gy += 8) {
      ctx.beginPath();
      ctx.moveTo(loupeX - loupeR, gy);
      ctx.lineTo(loupeX + loupeR, gy);
      ctx.stroke();
    }

    // Garis senter referensi horizontal merah di loupe
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(loupeX - loupeR, loupeY);
    ctx.lineTo(loupeX + loupeR, loupeY);
    ctx.stroke();

    // Ujung Kerucut Senter Putar 60° (Kanan)
    ctx.fillStyle = "#e2e8f0";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(loupeX + 22, loupeY - 14);
    ctx.lineTo(loupeX + 2, loupeY); // Titik temu puncak senter
    ctx.lineTo(loupeX + 22, loupeY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ujung Mata Potong Pahat HSS Muka (Kiri)
    ctx.fillStyle = COLORS.metalCarbideGold;
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(loupeX - 22, loupeY - 12);
    ctx.lineTo(loupeX - 1, loupeY); // Ujung hidung pahat tepat menyentuh puncak
    ctx.lineTo(loupeX - 12, loupeY + 16);
    ctx.lineTo(loupeX - 22, loupeY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // end clip

    // Badge Presisi Ketinggian Senter Terpasang Rapi di Bawah Loupe
    const badgeW = 140;
    const badgeH = 18;
    const badgeY = loupeY + loupeR + 6;
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(loupeX - badgeW / 2, badgeY, badgeW, badgeH, [5]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("h = 0,00 mm (SENTER ✓)", loupeX, badgeY + badgeH / 2);

    // Indikator Pelat Ganjal (Shim Plate) di Bawah Pahat
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1;
    ctx.fillRect(carX - 24, crossY + 12, 22, 4);
    ctx.strokeRect(carX - 24, crossY + 12, 22, 4);

    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Pelat Shim 0,5mm", carX - 32, crossY + 26);

    ctx.restore();
  }

  // 2. Langkah 2: Touching Muka Ujung Benda Kerja (Z0) & Animasi Skala Nonius Reset Nol
  function renderFacingTouchZ0(p, cutPt) {
    ctx.save();
    const isTouched = p >= 0.65;
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    // Panah Gerak Eretan Memanjang ke Kiri (Z Feed Approach)
    if (!isTouched) {
      ctx.strokeStyle = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, 85);
      ctx.lineTo(82, 85);
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(82, 85);
      ctx.lineTo(88, 81);
      ctx.lineTo(88, 89);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Geser Eretan Memanjang (Z) Perlahan", 100, 75);
    }

    // Efek Percikan Kilau Sentuhan Tipis (Light Touch Spark Ring)
    if (isTouched) {
      const touchX = 75;
      const touchY = cutPt ? cutPt.y : 15;

      // Cincin kilap kontak
      ctx.strokeStyle = "rgba(254, 240, 138, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(touchX, touchY, 6 + Math.sin(performance.now() * 0.015) * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(touchX, touchY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Label Kontak
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(touchX - 70, touchY - 32, 140, 20, [4]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("LIGHT TOUCH (Goresan Tipis) ✓", touchX, touchY - 19);
    }

    // PANEL ANIMASI CINCIN SKALA NONIUS ERETAN MEMANJANG (Micrometer Nonius Collar)
    const dialX = carX + 35;
    const dialY = crossY + 36;
    const dialW = 140;
    const dialH = 58;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = isTouched ? "#22c55e" : "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(dialX - dialW / 2, dialY, dialW, dialH, [8]);
    ctx.fill();
    ctx.stroke();

    // Judul Panel
    ctx.fillStyle = isTouched ? "#4ade80" : "#94a3b8";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CINCIN NONIUS ERETAN MEMANJANG", dialX, dialY + 13);

    // Rumah Silindris Skala Nonius
    const collarY = dialY + 22;
    const collarW = 100;
    const collarH = 18;
    const collarX = dialX - collarW / 2;

    const colGrad = ctx.createLinearGradient(collarX, 0, collarX + collarW, 0);
    colGrad.addColorStop(0, "#334155");
    colGrad.addColorStop(0.5, "#cbd5e1");
    colGrad.addColorStop(1, "#334155");
    ctx.fillStyle = colGrad;
    ctx.fillRect(collarX, collarY, collarW, collarH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(collarX, collarY, collarW, collarH);

    // Garis Indeks Merah Tetap di Tengah
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dialX, collarY - 2);
    ctx.lineTo(dialX, collarY + collarH + 2);
    ctx.stroke();

    // Garis-garis graduasi skala bergerak
    const shift = isTouched ? 0 : ((1.0 - p / 0.65) * 45) % 10;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let gx = -45; gx <= 45; gx += 5) {
      const markX = dialX + gx - shift;
      if (markX > collarX + 2 && markX < collarX + collarW - 2) {
        const isMajor = Math.abs(gx) % 20 === 0;
        ctx.beginPath();
        ctx.moveTo(markX, collarY);
        ctx.lineTo(markX, collarY + (isMajor ? 8 : 4));
        ctx.stroke();
      }
    }

    // Angka Digital Readout Nonius
    if (isTouched) {
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText("Z₀ = 0,00 mm (NOL)", dialX, dialY + 52);
    } else {
      const zVal = ((1.0 - p / 0.65) * 2.8).toFixed(2);
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.fillText(`Z = +${zVal} mm`, dialX, dialY + 52);
    }

    ctx.restore();
  }

  // 3. Langkah 3: Pemberian Kedalaman Potong Aksial (ap = 0,8 mm) & Penguncian Eretan
  function renderFacingAxialDepth(p) {
    ctx.save();
    const isLocked = p >= 0.85;
    const isAxialFeeding = p >= 0.45 && p < 0.85;
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    // Panah Tahap 1: Pahat Mundur Radial ke Luar Diameter
    if (p < 0.45) {
      ctx.strokeStyle = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(75, 45);
      ctx.lineTo(75, 75);
      ctx.stroke();
      // Arrow head down
      ctx.beginPath();
      ctx.moveTo(75, 75);
      ctx.lineTo(71, 69);
      ctx.lineTo(79, 69);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("1. Tarik Pahat Menjauh ke Luar OD (D = 60)", 85, 62);
    }

    // Panah Tahap 2: Pemberian Infeed Aksial ap = 0,8 mm
    if (isAxialFeeding || isLocked) {
      // Garis dimensi kedalaman potong ap pada muka ujung benda kerja
      ctx.strokeStyle = "#facc15";
      ctx.fillStyle = "#facc15";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(75, -36);
      ctx.lineTo(73, -36);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(75, -40);
      ctx.lineTo(75, -32);
      ctx.moveTo(73, -40);
      ctx.lineTo(73, -32);
      ctx.stroke();

      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("ap = 0,8 mm", 74, -44);
    }

    // Banner Kunci Eretan Memanjang (Carriage Lock Status)
    const lockX = carX - 10;
    const lockY = crossY + 45;
    ctx.fillStyle = isLocked ? "rgba(22, 101, 52, 0.94)" : "rgba(30, 41, 59, 0.9)";
    ctx.strokeStyle = isLocked ? "#4ade80" : "#64748b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(lockX - 90, lockY, 180, 26, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isLocked ? "#f0fdf4" : "#cbd5e1";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(isLocked ? "🔒 ERETAN MEMANJANG DIKUNCI!" : "⏳ Menyetel Eretan...", lockX, lockY + 17);

    // Animasi Baut Pengunci Eretan Memanjang (Saddle Clamp Bolt)
    ctx.save();
    ctx.translate(carX + 15, crossY - 10);
    ctx.fillStyle = isLocked ? "#22c55e" : "#cbd5e1";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    // Hex bolt head
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + (isLocked ? 0.3 : 0);
      const bx = Math.cos(a) * 6;
      const by = Math.sin(a) * 6;
      if (i === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // 4. Langkah 4: Pemakanan Radial Menuju Titik Pusat Senter (Facing Pass)
  function renderFacingRadialCut(cutPt, p) {
    ctx.save();
    const curR = 30 * (1.0 - p); // radius dari 30 turun ke 0
    const curD = curR * 2;
    // Kecepatan Potong Permukaan Efektif: Vc = (pi * D * n) / 1000
    const curVc = (Math.PI * curD * 450) / 1000;

    // Panah Arah Pemakanan Radial (Eretan Melintang ke Bawah/Tengah)
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutPt.x + 18, cutPt.y + 12);
    ctx.lineTo(cutPt.x + 18, cutPt.y - 12);
    ctx.stroke();
    // Arrow head pointing to center
    ctx.beginPath();
    ctx.moveTo(cutPt.x + 18, cutPt.y - 12);
    ctx.lineTo(cutPt.x + 14, cutPt.y - 6);
    ctx.lineTo(cutPt.x + 22, cutPt.y - 6);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Feed Radial (f) Menuju Pusat Senter", cutPt.x + 26, cutPt.y + 2);

    // Animasi Tatal Pita Melengkung Mengkilap (Curly Ribbon Chips Ejection)
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 3; c++) {
      const chipAge = (performance.now() * 0.008 + c * 0.8) % 2.5;
      const chipX = cutPt.x + 4 + chipAge * 10;
      const chipY = cutPt.y + Math.sin(chipAge * 6) * 5;
      ctx.beginPath();
      ctx.arc(chipX, chipY, 3, 0, Math.PI * 1.5);
      ctx.stroke();
    }

    // Telemetry Box Kecepatan Potong Cs & Diameter Efektif
    const hudX = -30;
    const hudY = -120;
    const hudW = 260;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.94)";
    ctx.strokeStyle = curD < 12 ? "#ef4444" : "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`DIAMETER PEMOTONGAN EFEKTIF: D = ${curD.toFixed(1)} mm`, hudX, hudY + 16);

    ctx.fillStyle = curD < 12 ? "#f87171" : "#facc15";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText(`Kecepatan Potong (Cs): ${curVc.toFixed(1)} m/menit (n = 450 RPM)`, hudX, hudY + 31);

    if (curD < 14) {
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("⚠ Cs MENDEKATI NOL DI PUSAT! Kurangi Feed", hudX, hudY + 44);
    } else {
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("Pemakanan radial stabil & pendinginan aktif ✓", hudX, hudY + 44);
    }

    ctx.restore();
  }

  // 5. Langkah 5: Pemeriksaan Kesikuan 90° & Kerataan Bidang Muka (Alat Bantu Muncul - Aksi - Keluar)
  function renderFacingInspection(p) {
    ctx.save();
    // Waktu 0.02 s.d. 0.52: Alat Bantu 1 - PENYIKU PRESISI 90° (Steel Square)
    // Waktu 0.52 s.d. 1.00: Alat Bantu 2 - JANGKA SORONG (Vernier Caliper)

    // =========================================================================
    // ALAT BANTU 1: PENYIKU PRESISI (PRECISION STEEL SQUARE 90°)
    // =========================================================================
    if (p >= 0.02 && p < 0.52) {
      let sqAlpha = 1.0;
      let sqOffsetX = 0;
      let sqOffsetY = 0;

      if (p < 0.18) {
        // Fase 1: Masuk (Slide-In dari kanan atas)
        const inP = (p - 0.02) / 0.16;
        sqAlpha = inP;
        sqOffsetX = (1.0 - inP) * 50;
        sqOffsetY = -(1.0 - inP) * 50;
      } else if (p > 0.44) {
        // Fase 3: Keluar (Slide-Out ke kanan atas & Fade-Out)
        const outP = (p - 0.44) / 0.08;
        sqAlpha = Math.max(0, 1.0 - outP);
        sqOffsetX = outP * 40;
        sqOffsetY = -outP * 40;
      }
      // Fase 2: Aksi Pengujian Celah Cahaya (p in 0.18 to 0.44)

      ctx.save();
      ctx.globalAlpha = sqAlpha;
      ctx.translate(sqOffsetX, sqOffsetY);

      // Posisi Penyiku:
      // Badan tebal (Stock) bersandar rapat di silinder diameter luar atas (Y = -30 s.d. -44, X = 15 s.d. 73)
      // Daun tipis (Blade) turun tegak lurus menyusuri bidang muka hasil facing (X = 73, Y = -30 s.d. +30)
      const stockX = 22;
      const stockY = -42;
      const stockW = 51;
      const stockH = 12;

      const bladeX = 73;
      const bladeY = -30;
      const bladeW = 7;
      const bladeH = 60;

      // 1. Badan Tebal Penyiku (Cast Iron / Hardened Steel Stock)
      const stockGrad = ctx.createLinearGradient(stockX, stockY, stockX, stockY + stockH);
      stockGrad.addColorStop(0, "#1e293b");
      stockGrad.addColorStop(0.5, "#475569");
      stockGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = stockGrad;
      ctx.beginPath();
      ctx.roundRect(stockX, stockY, stockW, stockH, [2]);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Alur / Grafir presisi pada badan penyiku
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(stockX + 4, stockY + 2, stockW - 8, stockH - 4);

      // 2. Daun Bilah Tipis Penyiku Presisi (Hardened Ground Steel Blade)
      const bladeGrad = ctx.createLinearGradient(bladeX, 0, bladeX + bladeW, 0);
      bladeGrad.addColorStop(0, "#cbd5e1");
      bladeGrad.addColorStop(0.4, "#f8fafc");
      bladeGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = bladeGrad;
      ctx.fillRect(bladeX, bladeY, bladeW, bladeH);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.strokeRect(bladeX, bladeY, bladeW, bladeH);

      // Sudut Siku Sambungan 90°
      ctx.fillStyle = "#334155";
      ctx.fillRect(stockX + stockW - 10, stockY, 10, stockH);

      // Simbol Sudut 90° Presisi
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bladeX - 8, bladeY + 8);
      ctx.lineTo(bladeX, bladeY + 8);
      ctx.lineTo(bladeX, bladeY);
      ctx.stroke();
      // Titik sudut
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(bladeX - 4, bladeY + 4, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Uji Celah Cahaya (Optical Light Gap Test):
      // Garis pertemuan bilah penyiku dengan muka bidang (X = 73)
      if (p >= 0.18 && p <= 0.44) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bladeX, bladeY);
        ctx.lineTo(bladeX, bladeY + bladeH);
        ctx.stroke();

        // Kartu Verifikasi Kesikuan 90°
        const cardX = 110;
        const cardY = -45;
        ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, 175, 48, [8]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 9.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("✔ SIKU 90° TERVERIFIKASI", cardX + 87, cardY + 16);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.fillText("Uji Celah Cahaya: Rapat Total", cardX + 87, cardY + 30);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("Celah = 0,00 mm (Rata Sempurna)", cardX + 87, cardY + 42);
      }

      ctx.restore();
    }

    // =========================================================================
    // ALAT BANTU 2: JANGKA SORONG (VERNIER CALIPER 0,02 mm)
    // =========================================================================
    if (p >= 0.52) {
      let calAlpha = 1.0;
      let calOffsetY = 0;

      if (p < 0.68) {
        // Fase 1: Masuk (Slide-In dari bawah)
        const inP = (p - 0.52) / 0.16;
        calAlpha = inP;
        calOffsetY = (1.0 - inP) * 55;
      } else if (p > 0.90) {
        // Fase 3: Keluar (Slide-Out ke bawah & Fade-Out)
        const outP = (p - 0.90) / 0.10;
        calAlpha = Math.max(0, 1.0 - outP);
        calOffsetY = outP * 55;
      }
      // Fase 2: Aksi Pengukuran Panjang Total (p in 0.68 to 0.90)

      ctx.save();
      ctx.globalAlpha = calAlpha;
      ctx.translate(0, calOffsetY);

      // Posisi Pengukuran Panjang Total:
      // Rahang Ukur Luar Tetap (Fixed Jaw) menempel di muka cekam X = -115
      // Rahang Ukur Luar Geser (Sliding Jaw) menempel di muka ujung facing X = 73 (Rentang 188 px = 190.00 mm)
      const leftFaceX = -115;
      const rightFaceX = 73;
      const targetLen = 188;
      let curOpening = targetLen;
      let isLocked = false;
      let showLoupe = false;

      if (p < 0.64) {
        curOpening = targetLen + 12;
      } else if (p < 0.75) {
        const closeP = (p - 0.64) / 0.11;
        curOpening = (targetLen + 12) - 12 * closeP;
      } else {
        curOpening = targetLen;
        isLocked = true;
        showLoupe = true;
      }

      drawHorizontalCaliperForLength(ctx, {
        leftX: leftFaceX,
        rightX: rightFaceX,
        jawOpening: curOpening,
        beamY: 56,
        locked: isLocked,
        alpha: 1.0
      });

      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -20,
          y: -65,
          mainMm: 190,
          vernierFrac: 0.00,
          totalText: "L = 190,00 mm",
          title: "PEMBACAAN NONIUS PANJANG TOTAL (0,02 mm)",
          tolerance: "±0,02 mm (PASS ✓)"
        });
      }

      // 4. Panel Hasil Pengukuran Digital Jangka Sorong
      if (p >= 0.68 && p <= 0.90) {
        const hudX = -20;
        const hudY = 76;
        const hudW = 270;
        const hudH = 46;

        ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 9.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("PENGUKURAN PANJANG TOTAL BENDA KERJA", hudX, hudY + 15);

        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 11.5px JetBrains Mono, monospace";
        ctx.fillText("L = 190,00 mm ± 0,02 mm (PASS ✓)", hudX, hudY + 33);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS & ALAT BANTU PEMBUBUTAN RATA / SILINDRIS (STRAIGHT)
  // ---------------------------------------------------------------------------

  // 1. Langkah 1: Pencekaman Benda Kerja & Uji Keolengan (Centering & Dial Indicator)
  function renderStraightClampCentering(p) {
    ctx.save();
    // Fade out smoothly towards end of step (p > 0.88)
    const fadeAlpha = p > 0.88 ? Math.max(0, (1.0 - p) / 0.12) : 1.0;
    ctx.globalAlpha = fadeAlpha;

    // Fase 1 (p < 0.45): Kunci Cekam (Chuck Key) mengencangkan rahang cekam
    if (p < 0.45) {
      const keyAlpha = p < 0.10 ? p / 0.10 : (p > 0.38 ? Math.max(0, (0.45 - p) / 0.07) : 1.0);
      ctx.save();
      ctx.globalAlpha = keyAlpha;

      // Posisi Lubang Kunci Cekam di Rim Cekam (X = -140, Y = -35)
      const pinX = -140;
      const pinY = -35;
      const keySwing = Math.sin(performance.now() * 0.009) * 0.32;

      ctx.translate(pinX, pinY);
      ctx.rotate(keySwing);

      // Batang Poros Kunci Cekam (Chrome Vanadium Key Shank)
      const shankGrad = ctx.createLinearGradient(-4, 0, 4, 0);
      shankGrad.addColorStop(0, "#475569");
      shankGrad.addColorStop(0.5, "#cbd5e1");
      shankGrad.addColorStop(1, "#334155");
      ctx.fillStyle = shankGrad;
      ctx.fillRect(-3, -38, 6, 38);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -38, 6, 38);

      // Kepala Kotak Penggerak Masuk ke Cekam (Square Drive Pinion Tip)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-4, 0, 8, 8);

      // Palang T-Bar Kunci Cekam (Sliding T-Handle Bar)
      const barGrad = ctx.createLinearGradient(0, -42, 0, -34);
      barGrad.addColorStop(0, "#94a3b8");
      barGrad.addColorStop(0.5, "#f8fafc");
      barGrad.addColorStop(1, "#475569");
      ctx.fillStyle = barGrad;
      ctx.fillRect(-28, -42, 56, 8);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.strokeRect(-28, -42, 56, 8);

      // Knop Bulat di Ujung Kiri & Kanan T-Bar
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(-28, -38, 5, 0, Math.PI * 2);
      ctx.arc(28, -38, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Panah Rotasi Pengencangan (Tighten CW)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -38, 22, -Math.PI * 0.7, Math.PI * 0.2);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(22 * Math.cos(Math.PI * 0.2), -38 + 22 * Math.sin(Math.PI * 0.2));
      ctx.lineTo(22 * Math.cos(Math.PI * 0.2) - 5, -38 + 22 * Math.sin(Math.PI * 0.2) - 4);
      ctx.lineTo(22 * Math.cos(Math.PI * 0.2) + 2, -38 + 22 * Math.sin(Math.PI * 0.2) - 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Badge Peringatan K3 Chuck Key
      const badgeX = -85;
      const badgeY = -120;
      ctx.fillStyle = "rgba(11, 23, 44, 0.94)";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(badgeX - 120, badgeY, 240, 36, [7]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("PENGENCANGAN RAHANG CEKAM 3 (CHUCK KEY)", badgeX, badgeY + 15);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("⚠ Segera cabut kunci cekam setelah kencang!", badgeX, badgeY + 28);
    }

    // Fase 2 (p >= 0.40): Dial Test Indicator (DTI) menguji keolengan (Run-Out)
    if (p >= 0.40) {
      let dtiAlpha = 1.0;
      let dtiOffsetY = 0;
      if (p < 0.52) {
        const inP = (p - 0.40) / 0.12;
        dtiAlpha = inP;
        dtiOffsetY = -(1.0 - inP) * 35;
      }
      ctx.save();
      ctx.globalAlpha = dtiAlpha;
      ctx.translate(0, dtiOffsetY);

      // Posisi Dudukan Magnet DTI di Alas Belakang Mesin (X = 20, Y = -88)
      const magX = 18;
      const magY = -92;

      // 1. Blok Magnetik Sakelar ON (Magnetic Base Stand)
      ctx.fillStyle = "#1e3a8a"; // Biru industri
      ctx.fillRect(magX - 14, magY - 10, 28, 20);
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1;
      ctx.strokeRect(magX - 14, magY - 10, 28, 20);
      // Tombol Sakelar Magnet ON
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(magX - 10, magY - 6, 8, 12);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("ON", magX - 6, magY + 3);

      // 2. Tiang & Lengan Fleksibel DTI (Articulated Arm)
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(magX, magY + 10);
      ctx.lineTo(magX, magY + 26);
      ctx.lineTo(magX + 16, magY + 36);
      ctx.stroke();

      // Knop Pengunci Sendi Lengan (Knurled Locking Knob)
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(magX, magY + 26, 4, 0, Math.PI * 2);
      ctx.fill();

      // 3. Dial Gauge Body (Jam Ukur Presisi 0,01 mm) di X = 34, Y = -54
      const dialGaugeX = magX + 16;
      const dialGaugeY = magY + 44;
      const dialR = 16;

      // Bezel Luar Bergerigi
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(dialGaugeX, dialGaugeY, dialR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Piringan Putih Dial
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(dialGaugeX, dialGaugeY, dialR - 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Skala Garis-garis Dial Jam
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.6;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        ctx.moveTo(dialGaugeX + Math.cos(a) * (dialR - 6), dialGaugeY + Math.sin(a) * (dialR - 6));
        ctx.lineTo(dialGaugeX + Math.cos(a) * (dialR - 3), dialGaugeY + Math.sin(a) * (dialR - 3));
        ctx.stroke();
      }

      // Jarum Penunjuk DTI (Needle Oscillating Subtly <= 0.01 mm)
      const needleWiggle = Math.sin(performance.now() * 0.014) * 0.08;
      const needleAngle = -Math.PI / 2 + needleWiggle;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(dialGaugeX, dialGaugeY);
      ctx.lineTo(dialGaugeX + Math.cos(needleAngle) * (dialR - 4), dialGaugeY + Math.sin(needleAngle) * (dialR - 4));
      ctx.stroke();

      // Titik Pusat Jarum
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(dialGaugeX, dialGaugeY, 2, 0, Math.PI * 2);
      ctx.fill();

      // 4. Batang Sensor Spindel & Jarum Peraba Karbida (Feeler Stylus)
      // Menempel tepat di permukaan diameter luar silinder di Y = -30
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dialGaugeX, dialGaugeY + dialR);
      ctx.lineTo(dialGaugeX, -30);
      ctx.stroke();

      // Ujung Bola Karbida Peraba (Carbide Ball Feeler Tip)
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(dialGaugeX, -30, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Lingkaran Kontak Sentuh Stylus
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(dialGaugeX, -30, 5 + Math.sin(performance.now() * 0.01) * 2, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Kartu Hasil Uji Keolengan (Run-Out Verification Card)
      const cardX = -15;
      const cardY = -124;
      const cardW = 270;
      const cardH = 46;

      ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(cardX - cardW / 2, cardY, cardW, cardH, [8]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("✔ UJI KEKONSENTRISAN (RUN-OUT) OK", cardX, cardY + 15);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText("Penyimpangan Putaran Poros: Δ ≤ 0,01 mm", cardX, cardY + 29);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("Poros Berputar Sentris & Siap Dibubut", cardX, cardY + 40);

      ctx.restore();
    }

    ctx.restore();
  }

  // 2. Langkah 2: Touching Diameter Luar Benda Kerja (X0) & Nonius Reset Nol
  function renderStraightTouchX0(p, cutPt) {
    ctx.save();
    const isTouched = p >= 0.65;
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    // Panah Gerak Eretan Melintang Maju ke Arah Diameter Luar (X Feed Approach)
    if (!isTouched) {
      ctx.strokeStyle = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(carX - 15, crossY + 14);
      ctx.lineTo(carX - 15, crossY - 6);
      ctx.stroke();
      // Panah ke atas menuju diameter luar benda kerja
      ctx.beginPath();
      ctx.moveTo(carX - 15, crossY - 6);
      ctx.lineTo(carX - 19, crossY);
      ctx.lineTo(carX - 11, crossY);
      ctx.closePath();
      ctx.fill();

      // Banner Petunjuk Tindakan
      const bannerX = -15;
      const bannerY = -120;
      ctx.fillStyle = "rgba(11, 23, 44, 0.94)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(bannerX - 130, bannerY, 260, 36, [7]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("MENYENTUHKAN PAHAT KE DIAMETER LUAR", bannerX, bannerY + 15);
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("Majukan eretan melintang perlahan hingga timbul gesekan tipis", bannerX, bannerY + 28);
    }

    // Efek Percikan Kilau Sentuhan Tipis (Light Touch Spark Ring at Y = 30)
    if (isTouched) {
      const touchX = carX - 15;
      const touchY = 30;

      // Cincin kilap kontak sentuh tipis
      ctx.strokeStyle = "rgba(254, 240, 138, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(touchX, touchY, 6 + Math.sin(performance.now() * 0.016) * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(touchX, touchY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Percikan halus kilatan kontak
      for (let s = 0; s < 4; s++) {
        const ang = (performance.now() * 0.01 + s * Math.PI / 2) % (Math.PI * 2);
        const dist = 7 + (s * 3) % 6;
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(touchX + Math.cos(ang) * dist - 1, touchY + Math.sin(ang) * dist - 1, 2, 2);
      }

      // Label Kontak Ringan
      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(touchX - 75, touchY + 14, 150, 22, [5]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("LIGHT TOUCH OD (⌀60 mm) ✓", touchX, touchY + 28);
    }

    // PANEL ANIMASI CINCIN SKALA NONIUS ERETAN MELINTANG (Cross-Slide Micrometer Collar)
    const dialX = carX + 35;
    const dialY = crossY + 38;
    const dialW = 145;
    const dialH = 58;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = isTouched ? "#22c55e" : "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(dialX - dialW / 2, dialY, dialW, dialH, [8]);
    ctx.fill();
    ctx.stroke();

    // Judul Panel
    ctx.fillStyle = isTouched ? "#4ade80" : "#94a3b8";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CINCIN NONIUS ERETAN MELINTANG", dialX, dialY + 13);

    // Rumah Silindris Skala Nonius
    const collarY = dialY + 22;
    const collarW = 105;
    const collarH = 18;
    const collarX = dialX - collarW / 2;

    const colGrad = ctx.createLinearGradient(collarX, 0, collarX + collarW, 0);
    colGrad.addColorStop(0, "#334155");
    colGrad.addColorStop(0.5, "#cbd5e1");
    colGrad.addColorStop(1, "#334155");
    ctx.fillStyle = colGrad;
    ctx.fillRect(collarX, collarY, collarW, collarH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(collarX, collarY, collarW, collarH);

    // Garis Indeks Merah Tetap di Tengah
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(dialX, collarY - 2);
    ctx.lineTo(dialX, collarY + collarH + 2);
    ctx.stroke();

    // Garis-garis graduasi skala bergerak
    const shift = isTouched ? 0 : ((1.0 - p / 0.65) * 40) % 10;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let gx = -45; gx <= 45; gx += 5) {
      const markX = dialX + gx - shift;
      if (markX > collarX + 2 && markX < collarX + collarW - 2) {
        const isMajor = Math.abs(gx) % 20 === 0;
        ctx.beginPath();
        ctx.moveTo(markX, collarY);
        ctx.lineTo(markX, collarY + (isMajor ? 8 : 4));
        ctx.stroke();
      }
    }

    // Angka Digital Readout Nonius
    if (isTouched) {
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText("X₀ = 0,00 mm (NOL)", dialX, dialY + 52);
    } else {
      const xVal = ((1.0 - p / 0.65) * 5.0).toFixed(2);
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.fillText(`X = +${xVal} mm`, dialX, dialY + 52);
    }

    ctx.restore();
  }

  // 3. Langkah 3: Penyetelan Kedalaman Potong Radial (ap = 2,5 mm, D60 -> D50)
  function renderStraightRadialDepth(p) {
    ctx.save();
    const isRetracting = p < 0.45;
    const isRadialInfeed = p >= 0.45;
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    // Panah Tahap 1: Pahat Ditarik ke Kanan Melewati Muka Benda Kerja
    if (isRetracting) {
      ctx.strokeStyle = "#38bdf8";
      ctx.fillStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 48);
      ctx.lineTo(82, 48);
      ctx.stroke();
      // Panah ke kanan
      ctx.beginPath();
      ctx.moveTo(82, 48);
      ctx.lineTo(76, 44);
      ctx.lineTo(76, 52);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("1. Geser Pahat Melewati Muka Ujung Kanan (X = 78)", 45, 62);
    }

    // Tahap 2: Pemberian Infeed Radial ap = 2,5 mm (Y dari 30 turun ke 25)
    if (isRadialInfeed) {
      // Garis dimensi kedalaman potong ap di samping ujung benda kerja
      const dimX = 82;
      ctx.strokeStyle = "#facc15";
      ctx.fillStyle = "#facc15";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dimX, 30);
      ctx.lineTo(dimX, 25);
      ctx.stroke();
      // Tick marks
      ctx.beginPath();
      ctx.moveTo(dimX - 4, 30);
      ctx.lineTo(dimX + 4, 30);
      ctx.moveTo(dimX - 4, 25);
      ctx.lineTo(dimX + 4, 25);
      ctx.stroke();

      // Panah infeed radial ke atas menuju sumbu
      ctx.beginPath();
      ctx.moveTo(dimX, 25);
      ctx.lineTo(dimX - 3, 28);
      ctx.lineTo(dimX + 3, 28);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 9.5px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("ap = 2,5 mm", dimX + 8, 29);

      // Garis bantu diameter target ⌀50 mm (R = 25)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(-35, 25);
      ctx.lineTo(85, 25);
      ctx.moveTo(-35, -25);
      ctx.lineTo(85, -25);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Banner Informasi Infeed & Pengurangan Diameter
    const cardX = -15;
    const cardY = -124;
    const cardW = 280;
    const cardH = 48;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = isRadialInfeed ? "#22c55e" : "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(cardX - cardW / 2, cardY, cardW, cardH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isRadialInfeed ? "#4ade80" : "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PENYETELAN KEDALAMAN POTONG RADIAL (ap)", cardX, cardY + 15);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.fillText("Infeed Radial ap = 2,50 mm  |  ΔD = 2 · ap = 5,00 mm", cardX, cardY + 29);
    ctx.fillStyle = "#facc15";
    ctx.fillText("Target Diameter: ⌀60,00 mm ➔ ⌀50,00 mm (Siap Makan)", cardX, cardY + 41);

    ctx.restore();
  }

  // 4. Langkah 4: Pemakanan Memanjang Arah Kanan ke Kiri (Longitudinal Pass)
  function renderStraightCuttingPass(cutPt, p) {
    ctx.save();
    const curCutLen = 110 * p;
    const remLen = 110 * (1.0 - p);
    // Vc = (pi * D * n) / 1000 = (pi * 50 * 400) / 1000 = 62.8 m/min
    const curVc = 62.8;

    // Panah Arah Pemakanan Memanjang (Longitudinal Feed to Left)
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutPt.x + 28, 48);
    ctx.lineTo(cutPt.x - 12, 48);
    ctx.stroke();
    // Arrow head pointing to left (towards chuck)
    ctx.beginPath();
    ctx.moveTo(cutPt.x - 12, 48);
    ctx.lineTo(cutPt.x - 6, 44);
    ctx.lineTo(cutPt.x - 6, 52);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Gerak Makan Memanjang (f = 0,15 mm/put) ➔ Kiri", cutPt.x + 34, 51);

    // Animasi Tatal Pita Melengkung Mengkilap (Continuous Curly Ribbon Chips)
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.6;
    for (let c = 0; c < 4; c++) {
      const chipAge = (performance.now() * 0.007 + c * 0.65) % 2.2;
      const chipX = cutPt.x + 2 + chipAge * 8;
      const chipY = 25 + Math.sin(chipAge * 7) * 4;
      ctx.beginPath();
      ctx.arc(chipX, chipY, 3.5, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    // Telemetry Box Pemakanan Memanjang di Bagian Atas Kanvas
    const hudX = -15;
    const hudY = -124;
    const hudW = 280;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`PEMBUBUTAN RATA MEMANJANG (L = 110 mm)`, hudX, hudY + 15);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.fillText(`Panjang Tersayat: ${curCutLen.toFixed(1)} mm  |  Sisa: ${remLen.toFixed(1)} mm`, hudX, hudY + 29);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.fillText(`⌀50,00 mm  |  Cs = ${curVc} m/mnt (n = 400 RPM)  |  Aman Cekam ✓`, hudX, hudY + 43);

    ctx.restore();
  }

  // 5. Langkah 5: Pengukuran Diameter Silinder dengan Mikrometer Luar 50-75 mm
  function renderStraightInspection(p) {
    ctx.save();
    // Animasi Mikrometer: Masuk (p < 0.18), Mengukur 3 Titik (p in 0.18-0.85), Keluar (p > 0.85)
    let micAlpha = 1.0;
    let micOffsetY = 0;

    if (p < 0.18) {
      const inP = p / 0.18;
      micAlpha = inP;
      micOffsetY = (1.0 - inP) * 50;
    } else if (p > 0.85) {
      const outP = (p - 0.85) / 0.15;
      micAlpha = Math.max(0, 1.0 - outP);
      micOffsetY = outP * 50;
    }

    ctx.save();
    ctx.globalAlpha = micAlpha;
    ctx.translate(0, micOffsetY);

    // Mikrometer berpindah secara halus di 3 posisi pengukuran:
    // Posisi 1: Ujung (X = 55) saat p in [0.18, 0.40]
    // Posisi 2: Tengah (X = 20) saat p in [0.40, 0.65]
    // Posisi 3: Pangkal (X = -15) saat p in [0.65, 0.85]
    let targetMicX = 55;
    let posLabel = "1. Posisi Ujung (Z = -20 mm)";
    let measuredVal = "⌀50,00 mm";

    if (p >= 0.40 && p < 0.65) {
      const transP = (p - 0.40) / 0.08;
      targetMicX = transP < 1.0 ? 55 + (20 - 55) * transP : 20;
      posLabel = "2. Posisi Tengah (Z = -55 mm)";
      measuredVal = "⌀50,00 mm";
    } else if (p >= 0.65) {
      const transP = (p - 0.65) / 0.08;
      targetMicX = transP < 1.0 ? 20 + (-15 - 20) * transP : -15;
      posLabel = "3. Posisi Pangkal (Z = -90 mm)";
      measuredVal = "⌀50,01 mm";
    }

    const micX = targetMicX;

    // GAMBAR MIKROMETER LUAR PRESISI (OUTSIDE MICROMETER 50-75 mm / 0,01 mm)
    // Silinder yang diukur berdiameter 50 mm (Y: -25 s.d. +25)

    // 1. Rangka Busur U (Forged Steel C-Frame Warna Biru Enamel Industri)
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 10;
    ctx.beginPath();
    // Busur C mengitari diameter silinder dari atas (Y = -34) melengkung ke kiri lalu ke bawah (Y = 34)
    ctx.arc(micX - 22, 0, 36, -Math.PI * 0.42, Math.PI * 0.42, true);
    ctx.stroke();

    // Lapisan kilap rangka krom / insulasi panas plastik hitam pada bingkai U
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(micX - 22, 0, 36, -Math.PI * 0.22, Math.PI * 0.22, true);
    ctx.stroke();

    // Plat Insulasi Panas (Thermal Heat Insulator Grip)
    ctx.fillStyle = "#334155";
    ctx.fillRect(micX - 62, -12, 8, 24);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.strokeRect(micX - 62, -12, 8, 24);

    // 2. Landasan Tetap (Fixed Anvil) di Sisi Atas (Y = -25)
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(micX - 3, -34, 6, 9);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(micX - 3, -34, 6, 9);
    // Ujung Karbida Landasan
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(micX - 3, -27, 6, 2);

    // 3. Poros Geser / Spindel Ukur (Measuring Spindle) di Sisi Bawah (Y = +25)
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(micX - 3, 25, 6, 12);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(micX - 3, 25, 6, 12);
    // Ujung Karbida Spindel
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(micX - 3, 25, 6, 2);

    // Titik Sentuh Ukur Kontak (Contact Points at Y = -25 and Y = +25)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(micX, -25, 2.5, 0, Math.PI * 2);
    ctx.arc(micX, 25, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Silinder Skala Utama (Main Scale Sleeve / Barrel)
    const sleeveY = 37;
    const sleeveH = 22;
    const sleeveW = 14;
    const sleeveGrad = ctx.createLinearGradient(micX - sleeveW / 2, 0, micX + sleeveW / 2, 0);
    sleeveGrad.addColorStop(0, "#475569");
    sleeveGrad.addColorStop(0.5, "#cbd5e1");
    sleeveGrad.addColorStop(1, "#334155");
    ctx.fillStyle = sleeveGrad;
    ctx.fillRect(micX - sleeveW / 2, sleeveY, sleeveW, sleeveH);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.strokeRect(micX - sleeveW / 2, sleeveY, sleeveW, sleeveH);

    // Garis Datum Skala Utama
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(micX, sleeveY);
    ctx.lineTo(micX, sleeveY + sleeveH);
    ctx.stroke();

    // 5. Tabung Putar Skala Nonius (Thimble & Ratchet Stop)
    const thimbleY = sleeveY + sleeveH;
    const thimbleH = 18;
    const thimbleW = 16;
    ctx.fillStyle = sleeveGrad;
    ctx.fillRect(micX - thimbleW / 2, thimbleY, thimbleW, thimbleH);
    ctx.strokeStyle = "#1e293b";
    ctx.strokeRect(micX - thimbleW / 2, thimbleY, thimbleW, thimbleH);

    // Roda Gigi Putar Rachet (Ratchet Knurl Knob)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(micX - 5, thimbleY + thimbleH, 10, 8);

    // KARTU HASIL VERIFIKASI PENGUKURAN DIAMETER DI ATAS KANVAS
    const hudX = -15;
    const hudY = -125;
    const hudW = 280;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✔ HASIL PENGUKURAN DIAMETER MIKROMETER", hudX, hudY + 14);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.fillText(`${posLabel} : ${measuredVal}`, hudX, hudY + 28);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("Toleransi ISO h7 (±0,01 mm)  |  Silindris Sempurna ✓", hudX, hudY + 42);

    ctx.restore(); // end micrometer save

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS & ALAT BANTU PEMBUBUTAN BERTINGKAT (STEP TURNING)
  // ---------------------------------------------------------------------------

  // ===========================================================================
  // SISTEM PENGUKURAN JANGKA SORONG STANDAR INDUSTRI (AUTHENTIC VERNIER METROLOGY)
  // ===========================================================================

  // 1. PENGUKURAN DIAMETER LUAR POROS SECARA TEGAK LURUS 90° (OUTSIDE DIAMETER)
  function drawVerticalCaliperForDiameter(ctx, opts) {
    const {
      xCenter = 20,
      diameter = 48,
      jawOpening = 48,
      rockAngle = 0,
      locked = false,
      alpha = 1.0
    } = opts;

    ctx.save();
    ctx.globalAlpha = alpha;

    const R = diameter / 2;
    // Putar di sekitar titik kontak pusat silinder (Teknik Rocking mengeliminasi cosine error)
    ctx.translate(xCenter, 0);
    if (rockAngle !== 0) ctx.rotate(rockAngle);
    ctx.translate(-xCenter, 0);

    const beamW = 14;
    const beamX = xCenter + 26; // Batang vertikal berada 26 px di sebelah kanan titik ukur
    const headTopY = -R - 22;   // Kepala tetap berada 22 px di atas keliling atas silinder
    const beamBottomY = R + 115; // Batang menjulur ke bawah ke arah operator
    const beamH = beamBottomY - headTopY;

    // A. Rahang Tetap Atas (Fixed Outside Jaw) pada Y = -R
    // Muka kontak rata presisi menempel di keliling atas silinder Y = -R
    const jawReachX = xCenter - 16; // Rahang menjulur ke kiri melingkupi silinder

    const jawGrad = ctx.createLinearGradient(jawReachX, 0, beamX + beamW, 0);
    jawGrad.addColorStop(0, "#94a3b8");
    jawGrad.addColorStop(0.3, "#f1f5f9");
    jawGrad.addColorStop(0.7, "#cbd5e1");
    jawGrad.addColorStop(1, "#475569");

    ctx.fillStyle = jawGrad;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.2;

    // Profil Rahang Luar Tetap (Tapered Beak Jaw dengan Ujung Paruh Runcing)
    ctx.beginPath();
    ctx.moveTo(jawReachX, -R); // Ujung paruh ukur runcing
    ctx.lineTo(beamX, -R);     // Bidang kontak rata presisi
    ctx.lineTo(beamX + beamW, -R);
    ctx.lineTo(beamX + beamW, headTopY);
    ctx.lineTo(beamX - 10, headTopY);
    ctx.bezierCurveTo(beamX - 14, headTopY + 2, jawReachX + 4, -R - 8, jawReachX, -R);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rahang Ukur Dalam Tetap (Inside Jaw Horn / Nib) - Ujung Runcing Menjulur ke Atas
    ctx.fillStyle = jawGrad;
    ctx.beginPath();
    ctx.moveTo(beamX, headTopY);
    ctx.lineTo(beamX - 16, headTopY - 18); // Puncak runcing
    ctx.lineTo(beamX - 10, headTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Muka Ukur Bertingkat Tetap (Fixed Step Measuring Face) di puncak kepala
    ctx.fillStyle = "#64748b";
    ctx.fillRect(beamX - 8, headTopY - 5, 8, 5);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(beamX - 8, headTopY - 5, 8, 5);

    // B. Batang Utama Vertikal (Main Stainless Steel Beam)
    const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + beamW, 0);
    beamGrad.addColorStop(0, "#cbd5e1");
    beamGrad.addColorStop(0.4, "#f8fafc");
    beamGrad.addColorStop(0.8, "#cbd5e1");
    beamGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = beamGrad;
    ctx.fillRect(beamX, headTopY, beamW, beamH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(beamX, headTopY, beamW, beamH);

    // Alur Pandu Bilah Kedalaman (Central Guide Groove)
    ctx.strokeStyle = "rgba(71, 85, 105, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(beamX + beamW / 2, headTopY + 10);
    ctx.lineTo(beamX + beamW / 2, beamBottomY - 5);
    ctx.stroke();

    // Garis Skala Utama Milimeter pada Batang Vertikal
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.7;
    for (let my = headTopY + 12; my < beamBottomY - 8; my += 4) {
      const mmDist = my - (headTopY + 12);
      const isMajor = mmDist % 20 === 0;
      const isMid = mmDist % 10 === 0;
      const tickW = isMajor ? 6 : (isMid ? 4 : 2.5);
      ctx.beginPath();
      ctx.moveTo(beamX, my);
      ctx.lineTo(beamX + tickW, my);
      ctx.stroke();
    }

    // C. Rahang Ukur Geser Bawah (Sliding Outside Jaw) pada slideY
    const slideY = -R + jawOpening;
    const sliderH = 34;
    const sliderW = 28;

    // Profil Rahang Luar Geser (Tapered Beak Jaw dengan Ujung Paruh Runcing)
    ctx.fillStyle = jawGrad;
    ctx.beginPath();
    ctx.moveTo(jawReachX, slideY); // Ujung paruh ukur runcing
    ctx.lineTo(beamX, slideY);     // Bidang kontak rata presisi
    ctx.lineTo(beamX, slideY + sliderH);
    ctx.lineTo(beamX - 8, slideY + sliderH);
    ctx.bezierCurveTo(beamX - 12, slideY + sliderH - 4, jawReachX + 4, slideY + 8, jawReachX, slideY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Modul Peluncur Digital (Electronic Digital Caliper Slider Body - Jangka sorong (Caliper).jfif)
    const sliderGrad = ctx.createLinearGradient(beamX - 4, 0, beamX + sliderW, 0);
    sliderGrad.addColorStop(0, "#cbd5e1");
    sliderGrad.addColorStop(0.5, "#f1f5f9");
    sliderGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = sliderGrad;
    ctx.beginPath();
    ctx.roundRect(beamX - 3, slideY - 4, sliderW, sliderH, [3]);
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Layar LCD Digital Display Hijau/Perak High Contrast
    const lcdW = sliderW - 8;
    const lcdH = 15;
    const lcdX = beamX + 1;
    const lcdY = slideY + 4;
    ctx.fillStyle = "#334155";
    ctx.fillRect(lcdX, lcdY, lcdW, lcdH);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(lcdX + 1, lcdY + 1, lcdW - 2, lcdH - 2);

    // Teks Angka Digital 7-Segment Real-Time (e.g. 26.8 mm)
    const dispVal = jawOpening.toFixed(1);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 9px 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillText(dispVal, lcdX + lcdW - 7, lcdY + 11);
    ctx.font = "bold 4.5px sans-serif";
    ctx.fillText("mm", lcdX + lcdW - 2, lcdY + 10);

    // 3 Tombol Kontrol Khas: Biru (mm/in), Merah (ON/OFF), Kuning (ZERO)
    // 1. Tombol mm/in (Biru di atas LCD)
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(lcdX + 1, slideY - 2, 8, 2.5);
    // 2. Tombol Merah ON/OFF (Bawah Kiri)
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(lcdX + 1, slideY + sliderH - 12, 7, 4);
    // 3. Tombol Kuning ZERO (Bawah Kanan)
    ctx.fillStyle = "#eab308";
    ctx.fillRect(lcdX + 10, slideY + sliderH - 12, 7, 4);

    // Roda Jempol Penggerak Halus (Knurled Thumb Wheel) di Bawah Slider
    ctx.fillStyle = "#64748b";
    ctx.fillRect(beamX + sliderW - 7, slideY + sliderH - 5, 8, 8);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(beamX + sliderW - 7, slideY + sliderH - 5, 8, 8);

    // Baut Pengunci (Locking Screw) di Samping Kanan Slider
    ctx.fillStyle = locked ? "#22c55e" : "#475569";
    ctx.beginPath();
    ctx.arc(beamX + sliderW - 3, slideY + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    if (locked) {
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("🔒 LOCK", beamX + sliderW + 3, slideY + 8);
    }

    // D. Titik Kontak Pengukuran pada Keliling Benda Kerja
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(xCenter, -R, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(xCenter, slideY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Panah Gaya Ukur Lembut (Measuring Force F ≈ 5 - 10 N)
    if (Math.abs(jawOpening - diameter) < 1.0) {
      ctx.strokeStyle = "#4ade80";
      ctx.fillStyle = "#4ade80";
      ctx.lineWidth = 1.2;

      // Panah dari atas ke bawah
      ctx.beginPath();
      ctx.moveTo(xCenter - 8, -R - 8);
      ctx.lineTo(xCenter - 8, -R - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCenter - 8, -R - 2);
      ctx.lineTo(xCenter - 10, -R - 5);
      ctx.lineTo(xCenter - 6, -R - 5);
      ctx.closePath();
      ctx.fill();

      // Panah dari bawah ke atas
      ctx.beginPath();
      ctx.moveTo(xCenter - 8, slideY + 8);
      ctx.lineTo(xCenter - 8, slideY + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCenter - 8, slideY + 2);
      ctx.lineTo(xCenter - 10, slideY + 5);
      ctx.lineTo(xCenter - 6, slideY + 5);
      ctx.closePath();
      ctx.fill();

      // Teks Gaya Ukur
      ctx.font = "bold 7.5px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText("F ≈ 5-10 N", xCenter - 14, (slideY - R) / 2 + 2.5);

      // Garis Bantu Siku 90° terhadap Sumbu Poros
      ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(xCenter - 12, 0);
      ctx.lineTo(xCenter + 22, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // 2. PENGUKURAN PANJANG POROS DENGAN RAHANG UKUR LUAR (OUTSIDE JAWS FOR LENGTH)
  function drawHorizontalCaliperForLength(ctx, opts) {
    const {
      leftX = -35,
      rightX = 75,
      jawOpening = 110,
      beamY = 56,
      locked = false,
      alpha = 1.0
    } = opts;

    ctx.save();
    ctx.globalAlpha = alpha;

    const beamH = 14;
    const beamLeftX = leftX - 18;
    const beamW = (leftX + jawOpening) - beamLeftX + 65; // Batang menjulur 65 px melewati peluncur
    const jawTipY = 16; // Rahang menjulur ke atas ke Y = 16 untuk menjepit bidang muka

    const steelGrad = ctx.createLinearGradient(0, beamY, 0, beamY + beamH);
    steelGrad.addColorStop(0, "#e2e8f0");
    steelGrad.addColorStop(0.3, "#f8fafc");
    steelGrad.addColorStop(0.7, "#cbd5e1");
    steelGrad.addColorStop(1, "#94a3b8");

    // A. Batang Utama (Horizontal Main Beam)
    ctx.fillStyle = steelGrad;
    ctx.fillRect(beamLeftX, beamY, beamW, beamH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(beamLeftX, beamY, beamW, beamH);

    // Label Branding: ELECTRONIC DIGITAL CALIPER
    ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
    ctx.font = "bold 4px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("ELECTRONIC DIGITAL CALIPER", beamLeftX + beamW - 6, beamY + beamH - 2.5);

    // Alur Rel Tengah
    ctx.strokeStyle = "rgba(71, 85, 105, 0.5)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(beamLeftX + 15, beamY + beamH / 2);
    ctx.lineTo(beamLeftX + beamW - 5, beamY + beamH / 2);
    ctx.stroke();

    // Skala Milimeter pada Batang Utama
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.7;
    for (let bx = leftX; bx < beamLeftX + beamW - 10; bx += 4) {
      const mmDist = bx - leftX;
      const isMajor = mmDist % 20 === 0;
      const isMid = mmDist % 10 === 0;
      const markH = isMajor ? 6.5 : (isMid ? 4.5 : 3);
      ctx.beginPath();
      ctx.moveTo(bx, beamY);
      ctx.lineTo(bx, beamY + markH);
      ctx.stroke();
    }

    // B. Rahang Tetap Kiri (Fixed Outside Jaw di leftX = -35)
    // Muka kontak rata kanan ada di leftX, menempel pada bahu siku 90° (Tapered Beak Jaw)
    ctx.fillStyle = steelGrad;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftX, beamY);
    ctx.lineTo(leftX, jawTipY); // Ujung paruh runcing
    ctx.bezierCurveTo(leftX - 2, jawTipY + 4, leftX - 12, beamY - 6, beamLeftX, beamY);
    ctx.lineTo(beamLeftX, beamY + beamH);
    ctx.lineTo(leftX, beamY + beamH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // C. Rahang Geser Kanan (Sliding Outside Jaw di slideX = leftX + jawOpening)
    const slideX = leftX + jawOpening;
    const sliderW = 32;

    // Rahang Geser menjulur ke atas: muka kontak rata kiri di slideX (Tapered Beak Jaw)
    ctx.fillStyle = steelGrad;
    ctx.beginPath();
    ctx.moveTo(slideX, beamY);
    ctx.lineTo(slideX, jawTipY); // Ujung paruh runcing
    ctx.bezierCurveTo(slideX + 2, jawTipY + 4, slideX + 12, beamY - 6, slideX + sliderW, beamY);
    ctx.lineTo(slideX + sliderW, beamY + beamH);
    ctx.lineTo(slideX, beamY + beamH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Modul Peluncur Digital (Electronic Digital Caliper Slider Body - Jangka sorong (Caliper).jfif)
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(slideX - 2, beamY - 4, sliderW, beamH + 8, [3]);
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Layar LCD Digital Display
    const lcdW = sliderW - 8;
    const lcdH = beamH - 2;
    const lcdX = slideX + 2;
    const lcdY = beamY - 1;
    ctx.fillStyle = "#334155";
    ctx.fillRect(lcdX, lcdY, lcdW, lcdH);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(lcdX + 1, lcdY + 1, lcdW - 2, lcdH - 2);

    // Teks Angka Digital 7-Segment Real-Time
    const dispLen = jawOpening.toFixed(1);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 8.5px 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillText(dispLen, lcdX + lcdW - 7, lcdY + 9);
    ctx.font = "bold 4px sans-serif";
    ctx.fillText("mm", lcdX + lcdW - 2, lcdY + 8);

    // 3 Tombol Kontrol Khas: Biru (mm/in), Merah (ON/OFF), Kuning (ZERO)
    ctx.fillStyle = "#2563eb"; // mm/in
    ctx.fillRect(lcdX + 1, beamY + beamH - 2, 6, 2.5);
    ctx.fillStyle = "#dc2626"; // ON/OFF
    ctx.fillRect(lcdX + 8, beamY + beamH - 2, 6, 2.5);
    ctx.fillStyle = "#eab308"; // ZERO
    ctx.fillRect(lcdX + 15, beamY + beamH - 2, 6, 2.5);

    // Roda Jempol di Bawah Slider
    ctx.fillStyle = "#64748b";
    ctx.fillRect(slideX + sliderW - 8, beamY + beamH + 2, 8, 7);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(slideX + sliderW - 8, beamY + beamH + 2, 8, 7);

    // Baut Pengunci di Bawah Slider
    ctx.fillStyle = locked ? "#22c55e" : "#475569";
    ctx.beginPath();
    ctx.arc(slideX + 8, beamY + beamH + 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    if (locked) {
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("🔒 LOCKED", slideX + 14, beamY + beamH + 8);
    }

    // D. Titik Kontak Pengukuran Panjang
    // Kontak Kiri pada Bahu Siku di (leftX, 24)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(leftX, 24, 3, 0, Math.PI * 2);
    ctx.fill();

    // Kontak Kanan pada Muka Ujung di (slideX, 18)
    ctx.beginPath();
    ctx.arc(slideX, 18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Garis Dimensi Panjang
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftX, 34);
    ctx.lineTo(slideX, 34);
    ctx.stroke();
    // Arrowheads
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(leftX, 34); ctx.lineTo(leftX + 5, 31); ctx.lineTo(leftX + 5, 37); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(slideX, 34); ctx.lineTo(slideX - 5, 31); ctx.lineTo(slideX - 5, 37); ctx.closePath(); ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`L = ${jawOpening.toFixed(1)} mm`, (leftX + slideX) / 2, 45);

    ctx.restore();
  }

  // 3. PENGUKURAN UNDAKAN DENGAN SISI BELAKANG (DEPTH BAR / DEPTH GAUGE)
  function drawDepthBarCaliper(ctx, opts) {
    const {
      datumX = 75,
      stepX = 20,
      depthExt = 55,
      beamY = 22,
      locked = false,
      alpha = 1.0
    } = opts;

    ctx.save();
    ctx.globalAlpha = alpha;

    const beamH = 14;
    const beamLen = 175;
    const tailX = datumX; // Datum ekor belakang bersandar rata pada muka ujung X = datumX

    // A. Bilah Kedalaman (Depth Bar / Rod)
    // Meluncur dari tailX ke arah kiri sepanjang depthExt
    const rodH = 3.2;
    const rodTipX = tailX - depthExt;
    const rodGrad = ctx.createLinearGradient(rodTipX, 0, tailX, 0);
    rodGrad.addColorStop(0, "#f8fafc");
    rodGrad.addColorStop(0.5, "#cbd5e1");
    rodGrad.addColorStop(1, "#94a3b8");

    ctx.fillStyle = rodGrad;
    ctx.fillRect(rodTipX, beamY + (beamH - rodH) / 2, depthExt, rodH);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(rodTipX, beamY + (beamH - rodH) / 2, depthExt, rodH);

    // Titik Kontak Ujung Bilah Kedalaman pada Bahu Siku di (stepX, beamY + 7)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(rodTipX, beamY + beamH / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Percikan Sentuhan Kontak Presisi saat Merapat
    if (Math.abs(depthExt - (datumX - stepX)) < 1.0) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      for (let sp = 0; sp < 4; sp++) {
        const ang = (sp * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(rodTipX, beamY + beamH / 2);
        ctx.lineTo(rodTipX + Math.cos(ang) * 5, beamY + beamH / 2 + Math.sin(ang) * 5);
        ctx.stroke();
      }
    }

    // B. Bidang Datum Tumpuan Ekor pada Muka Benda Kerja (datumX = 75)
    // Garis vertikal tebal emas/kuning yang menegaskan kontak tumpuan rata 90°
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(datumX, beamY - 12);
    ctx.lineTo(datumX, beamY + beamH + 12);
    ctx.stroke();

    // Label Datum Tumpuan Ekor
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("DATUM TUMPUAN EKOR (90°)", datumX, beamY - 16);

    // C. Batang Utama (Main Beam) menjulur ke kanan dari datumX
    const beamGrad = ctx.createLinearGradient(0, beamY, 0, beamY + beamH);
    beamGrad.addColorStop(0, "#e2e8f0");
    beamGrad.addColorStop(0.3, "#f8fafc");
    beamGrad.addColorStop(0.7, "#cbd5e1");
    beamGrad.addColorStop(1, "#94a3b8");

    ctx.fillStyle = beamGrad;
    ctx.fillRect(tailX, beamY, beamLen, beamH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(tailX, beamY, beamLen, beamH);

    // Alur Pandu Bilah Kedalaman di Tengah Batang
    ctx.strokeStyle = "rgba(71, 85, 105, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tailX, beamY + beamH / 2);
    ctx.lineTo(tailX + beamLen - 4, beamY + beamH / 2);
    ctx.stroke();

    // Skala Milimeter pada Batang Utama
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.7;
    for (let bx = tailX + 15; bx < tailX + beamLen - 10; bx += 4) {
      const mmDist = bx - (tailX + 15);
      const isMajor = mmDist % 20 === 0;
      const isMid = mmDist % 10 === 0;
      const markH = isMajor ? 6.5 : (isMid ? 4.5 : 3);
      ctx.beginPath();
      ctx.moveTo(bx, beamY);
      ctx.lineTo(bx, beamY + markH);
      ctx.stroke();
    }

    // D. Peluncur Skala Nonius pada Batang (Bergerak Sinkron dengan Bilah Kedalaman)
    // Posisi peluncur membuka sejauh depthExt dari pangkal skala
    const sliderX = tailX + 12 + depthExt;
    const sliderW = 32;

    // Modul Peluncur Digital (Electronic Digital Caliper Slider Body - Jangka sorong (Caliper).jfif)
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(sliderX, beamY - 4, sliderW, beamH + 8, [3]);
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Layar LCD Digital Display
    const lcdW = sliderW - 8;
    const lcdH = beamH - 2;
    const lcdX = sliderX + 2;
    const lcdY = beamY - 1;
    ctx.fillStyle = "#334155";
    ctx.fillRect(lcdX, lcdY, lcdW, lcdH);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(lcdX + 1, lcdY + 1, lcdW - 2, lcdH - 2);

    // Teks Angka Digital 7-Segment Real-Time
    const dispDepth = depthExt.toFixed(1);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 8.5px 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillText(dispDepth, lcdX + lcdW - 7, lcdY + 9);
    ctx.font = "bold 4px sans-serif";
    ctx.fillText("mm", lcdX + lcdW - 2, lcdY + 8);

    // 3 Tombol Kontrol Khas: Biru (mm/in), Merah (ON/OFF), Kuning (ZERO)
    ctx.fillStyle = "#2563eb"; // mm/in
    ctx.fillRect(lcdX + 1, beamY + beamH - 2, 6, 2.5);
    ctx.fillStyle = "#dc2626"; // ON/OFF
    ctx.fillRect(lcdX + 8, beamY + beamH - 2, 6, 2.5);
    ctx.fillStyle = "#eab308"; // ZERO
    ctx.fillRect(lcdX + 15, beamY + beamH - 2, 6, 2.5);

    // Baut Pengunci di Atas Slider
    ctx.fillStyle = locked ? "#22c55e" : "#475569";
    ctx.beginPath();
    ctx.arc(sliderX + sliderW / 2, beamY - 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    if (locked) {
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("🔒 LOCK", sliderX + sliderW / 2, beamY - 11);
    }

    // Roda Jempol di Bawah Slider
    ctx.fillStyle = "#64748b";
    ctx.fillRect(sliderX + sliderW - 8, beamY + beamH + 2, 8, 6);

    // E. Garis Indikator Panjang Kedalaman yang Menjulur
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tailX, beamY + beamH + 8);
    ctx.lineTo(rodTipX, beamY + beamH + 8);
    ctx.stroke();

    // Arrowheads
    ctx.beginPath();
    ctx.moveTo(rodTipX, beamY + beamH + 8); ctx.lineTo(rodTipX + 5, beamY + beamH + 5); ctx.lineTo(rodTipX + 5, beamY + beamH + 11); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tailX, beamY + beamH + 8); ctx.lineTo(tailX - 5, beamY + beamH + 5); ctx.lineTo(tailX - 5, beamY + beamH + 11); ctx.closePath(); ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Panjang Tingkat L1 = ${depthExt.toFixed(1)} mm`, (tailX + rodTipX) / 2, beamY + beamH + 20);

    ctx.restore();
  }

  // 4. JENDELA KACA PEMBESAR SKALA NONIUS (AUTHENTIC VERNIER LOUPE)
  function drawVernierLoupe(ctx, opts) {
    const {
      x = -75,
      y = 65,
      mainMm = 48,
      vernierFrac = 0.00,
      totalText = "⌀48,00 mm",
      title = "PEMBACAAN NONIUS (0,02 mm)",
      tolerance = "±0,02 mm (PASS ✓)",
      alpha = 1.0
    } = opts;

    ctx.save();
    ctx.globalAlpha = alpha;

    const cardW = 195;
    const cardH = 68;
    const cardX = x - cardW / 2;
    const cardY = y - cardH / 2;

    // Background Card Box
    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, [8]);
    ctx.fill();
    ctx.stroke();

    // Judul Modul Pembacaan
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(title, x, cardY + 12);

    // Kotak Tampilan Zoom Skala Utama vs Skala Nonius
    const scaleBoxX = cardX + 10;
    const scaleBoxY = cardY + 16;
    const scaleBoxW = cardW - 20;
    const scaleBoxH = 26;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(scaleBoxX, scaleBoxY, scaleBoxW, scaleBoxH / 2); // Skala Utama (Atas)
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(scaleBoxX, scaleBoxY + scaleBoxH / 2, scaleBoxW, scaleBoxH / 2); // Skala Nonius (Bawah)
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(scaleBoxX, scaleBoxY, scaleBoxW, scaleBoxH);

    // Garis Pembatas Horisontal Antara Utama & Nonius
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(scaleBoxX, scaleBoxY + scaleBoxH / 2);
    ctx.lineTo(scaleBoxX + scaleBoxW, scaleBoxY + scaleBoxH / 2);
    ctx.stroke();

    // Garis-garis Skala Utama (Atas)
    const centerLineX = scaleBoxX + scaleBoxW / 2;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    for (let i = -6; i <= 6; i++) {
      const lx = centerLineX + i * 14;
      if (lx >= scaleBoxX + 2 && lx <= scaleBoxX + scaleBoxW - 2) {
        const isTarget = i === 0;
        ctx.beginPath();
        ctx.moveTo(lx, scaleBoxY);
        ctx.lineTo(lx, scaleBoxY + scaleBoxH / 2);
        ctx.stroke();

        if (isTarget) {
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 7px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText(String(mainMm), lx, scaleBoxY + 8);
        }
      }
    }

    // Garis-garis Skala Nonius (Bawah)
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.9;
    for (let j = -6; j <= 6; j++) {
      const nx = centerLineX + j * 13.5;
      if (nx >= scaleBoxX + 2 && nx <= scaleBoxX + scaleBoxW - 2) {
        ctx.beginPath();
        ctx.moveTo(nx, scaleBoxY + scaleBoxH / 2);
        ctx.lineTo(nx, scaleBoxY + scaleBoxH);
        ctx.stroke();
      }
    }

    // Garis Berimpit Sempurna (Coincident Line Highlight) di centerLineX
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerLineX, scaleBoxY - 2);
    ctx.lineTo(centerLineX, scaleBoxY + scaleBoxH + 2);
    ctx.stroke();

    // Panah Indikator Garis Berimpit
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(centerLineX, scaleBoxY + scaleBoxH + 4);
    ctx.lineTo(centerLineX - 3, scaleBoxY + scaleBoxH + 8);
    ctx.lineTo(centerLineX + 3, scaleBoxY + scaleBoxH + 8);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 6.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("▲ BERIMPIT TEPAT", centerLineX, scaleBoxY + scaleBoxH + 14);

    // Baris Nilai Akhir
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Hasil: ${totalText}  |  ${tolerance}`, x, cardY + scaleBoxH + 23);

    ctx.restore();
  }

  // 5. WRAPPER KOMPATIBILITAS JANGKA SORONG UMUM
  function drawAuthenticVernierCaliper(ctx, opts) {
    if (opts.rotation === Math.PI / 2) {
      drawVerticalCaliperForDiameter(ctx, {
        xCenter: opts.x || 20,
        diameter: Math.abs(opts.jawOpening) || 48,
        jawOpening: Math.abs(opts.jawOpening) || 48,
        scale: opts.scale || 1.0
      });
    } else if (opts.showDepthBar) {
      drawDepthBarCaliper(ctx, {
        datumX: opts.x || 75,
        stepX: (opts.x || 75) - (opts.depthBarExt || 55),
        depthExt: opts.depthBarExt || 55,
        scale: opts.scale || 1.0
      });
    } else {
      drawHorizontalCaliperForLength(ctx, {
        leftX: (opts.x || 75) - Math.abs(opts.jawOpening || 110),
        rightX: opts.x || 75,
        jawOpening: Math.abs(opts.jawOpening || 110),
        beamY: opts.y || 56,
        scale: opts.scale || 1.0
      });
    }
  }

  // 1. Langkah 1: Penandaan Batas Panjang Poros Bertingkat (Benda Kerja Utuh)
  function renderStepMarking(p) {
    ctx.save();
    const fadeAlpha = p > 0.88 ? Math.max(0, (1.0 - p) / 0.12) : 1.0;
    ctx.globalAlpha = fadeAlpha;

    // A. MISTAR BAJA PRESISI (STAINLESS STEEL RULE) DI ATAS BENDA KERJA (Y = -54)
    const ruleX = -115;
    const ruleY = -56;
    const ruleW = 190;
    const ruleH = 14;

    const ruleGrad = ctx.createLinearGradient(0, ruleY, 0, ruleY + ruleH);
    ruleGrad.addColorStop(0, "#cbd5e1");
    ruleGrad.addColorStop(0.5, "#f8fafc");
    ruleGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = ruleGrad;
    ctx.fillRect(ruleX, ruleY, ruleW, ruleH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(ruleX, ruleY, ruleW, ruleH);

    // Garis Skala Milimeter pada Mistar Baja
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let rx = ruleX; rx <= ruleX + ruleW; rx += 5) {
      const isMajor = (rx - ruleX) % 25 === 0;
      ctx.beginPath();
      ctx.moveTo(rx, ruleY + ruleH);
      ctx.lineTo(rx, ruleY + ruleH - (isMajor ? 7 : 3.5));
      ctx.stroke();
    }

    // Label Angka pada Mistar (0 di muka kanan X = 75, bergerak ke kiri)
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("0", 75, ruleY + 6);
    ctx.fillText("55", 20, ruleY + 6);
    ctx.fillText("110", -35, ruleY + 6);

    // B. GARIS DIMENSI BATAS TINGKAT L_TOTAL DAN L1
    // Garis Dimensi L = 110 mm (dari X = 75 ke X = -35)
    ctx.strokeStyle = "#facc15";
    ctx.fillStyle = "#facc15";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(75, -36);
    ctx.lineTo(-35, -36);
    ctx.stroke();
    // Ticks & Arrowheads
    ctx.beginPath();
    ctx.moveTo(75, -40); ctx.lineTo(75, -32);
    ctx.moveTo(-35, -40); ctx.lineTo(-35, -32);
    ctx.stroke();

    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("L_total = 110 mm (Batas Diameter 48 mm)", 20, -40);

    // C. GORESAN TANDA BATAS BERKILAU DI KELILING BENDA KERJA
    // Batas Total 110 mm di X = -35
    if (p > 0.25) {
      ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-35, -31);
      ctx.lineTo(-35, 31);
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(-35, 30, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-35 - 55, 38, 110, 18, [4]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.font = "bold 8px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Batas Total 110 mm (X = -35)", -35, 50);
    }

    // Batas Tingkat 2 (55 mm) di X = 20
    if (p > 0.60) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, -31);
      ctx.lineTo(20, 31);
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(20, 30, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(20 - 50, 38, 100, 18, [4]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 8px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("Batas Tingkat 55 mm (X = 20)", 20, 50);
    }

    // D. KARTU TELEMETRI PENANDAAN DI ATAS KANVAS
    const hudX = -15;
    const hudY = -124;
    const hudW = 285;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PENANDAAN BATAS PANJANG POROS BERTINGKAT", hudX, hudY + 15);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.fillText("Panjang Total L = 110 mm  |  Panjang Tingkat L1 = 55 mm", hudX, hudY + 29);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("Benda kerja masih utuh mentah ⌀60 mm (belum disayat) ✓", hudX, hudY + 43);

    ctx.restore();
  }

  // 2. Langkah 2: Pembubutan Diameter 48 mm Sepanjang Total 110 mm
  function renderStep48Cutting(cutPt, p) {
    ctx.save();
    const curCutLen = 110 * p;
    const remLen = 110 * (1.0 - p);

    // Panah Arah Pemakanan Memanjang ke Batas X = -35
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutPt.x + 28, 44);
    ctx.lineTo(cutPt.x - 12, 44);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(cutPt.x - 12, 44);
    ctx.lineTo(cutPt.x - 6, 40);
    ctx.lineTo(cutPt.x - 6, 48);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Pemakanan Diameter 48 mm ➔ Menuju X = -35", cutPt.x + 34, 47);

    // Animasi Tatal Pita Spiral Emas/Perak
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.6;
    for (let c = 0; c < 4; c++) {
      const chipAge = (performance.now() * 0.007 + c * 0.65) % 2.2;
      const chipX = cutPt.x + 2 + chipAge * 8;
      const chipY = 24 + Math.sin(chipAge * 7) * 4;
      ctx.beginPath();
      ctx.arc(chipX, chipY, 3.5, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    // Telemetry Box di Atas Kanvas
    const hudX = -15;
    const hudY = -124;
    const hudW = 285;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PEMBUBUTAN DIAMETER 48 mm (PANJANG TOTAL 110 mm)", hudX, hudY + 15);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.fillText(`Panjang Disayat: ${curCutLen.toFixed(1)} mm / 110 mm  (Sisa: ${remLen.toFixed(1)} mm)`, hudX, hudY + 29);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("D = 48,00 mm  |  Bahu Siku 90° Utama Terbentuk di X = -35 ✓", hudX, hudY + 43);

    ctx.restore();
  }

  // 3. Langkah 3: Pemeriksaan Dimensi D = 48 mm & Panjang Total 110 mm dengan Jangka Sorong Asli
  function renderStep110Inspection(p) {
    ctx.save();
    let calAlpha = 1.0;
    let calOffsetY = 0;

    if (p < 0.10) {
      const inP = p / 0.10;
      calAlpha = inP;
      calOffsetY = (1.0 - inP) * 45;
    } else if (p > 0.92) {
      const outP = (p - 0.92) / 0.08;
      calAlpha = Math.max(0, 1.0 - outP);
      calOffsetY = outP * 45;
    }

    ctx.save();
    ctx.globalAlpha = calAlpha;
    ctx.translate(0, calOffsetY);

    // Dua Mode Pengukuran Metrologi Berurutan:
    // p in [0.00, 0.48]: Mode 1 - Pengukuran Diameter D = 48 mm menggunakan Rahang Luar secara Tegak Lurus 90°
    // p in [0.48, 1.00]: Mode 2 - Pengukuran Panjang Total L = 110 mm menggunakan Rahang Luar secara Sejajar Sumbu
    const isMeasuringDiameter = p < 0.48;

    if (isMeasuringDiameter) {
      // -----------------------------------------------------------------------
      // MODE 1: PENGUKURAN DIAMETER D = 48 mm (POSISI TEGAK LURUS 90° SUMBU POROS)
      // -----------------------------------------------------------------------
      const targetDia = 48;
      const xMeasure = 20; // Posisi aksial pengukuran di X = 20
      let curOpening = targetDia;
      let curRock = 0;
      let isLocked = false;
      let showLoupe = false;

      if (p < 0.14) {
        // Pendekatan: rahang terbuka lebih lebar (D + 12 mm = 60 mm)
        curOpening = targetDia + 12;
      } else if (p < 0.28) {
        // Penjepitan halus: rahang merapat dari 60 mm ke 48 mm
        const closeP = (p - 0.14) / 0.14;
        curOpening = (targetDia + 12) - 12 * closeP;
      } else if (p < 0.38) {
        // Teknik Rocking (goyangan halus ±0.7°) untuk mencari titik balik terkecil (eliminasi cosine error)
        curOpening = targetDia;
        const rockP = (p - 0.28) / 0.10;
        curRock = Math.sin(rockP * Math.PI * 4) * 0.012;
        if (rockP > 0.7) isLocked = true;
      } else {
        // Terkunci & Pembacaan
        curOpening = targetDia;
        isLocked = true;
        showLoupe = true;
      }

      // Gambar Jangka Sorong Vertikal Tegak Lurus
      drawVerticalCaliperForDiameter(ctx, {
        xCenter: xMeasure,
        diameter: targetDia,
        jawOpening: curOpening,
        rockAngle: curRock,
        locked: isLocked,
        alpha: 1.0
      });

      // Jendela Kaca Pembesar Skala Nonius
      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -75,
          y: 65,
          mainMm: 48,
          vernierFrac: 0.00,
          totalText: "⌀48,00 mm",
          title: "PEMBACAAN NONIUS DIAMETER (0,02 mm)",
          tolerance: "ISO h7 (±0,02 mm) PASS ✓"
        });
      }

    } else {
      // -----------------------------------------------------------------------
      // MODE 2: PENGUKURAN PANJANG TOTAL L = 110 mm (POSISI SEJAJAR SUMBU POROS)
      // -----------------------------------------------------------------------
      const leftShoulderX = -35;
      const rightFaceX = 75;
      const targetLen = 110;
      let curOpening = targetLen;
      let isLocked = false;
      let showLoupe = false;

      const lenP = (p - 0.48) / 0.52; // sub-progress 0.0 to 1.0

      if (lenP < 0.20) {
        // Pendekatan: rahang geser terbuka lebih lebar (122 mm)
        curOpening = targetLen + 12;
      } else if (lenP < 0.45) {
        // Penjepitan halus: rahang geser merapat ke kiri hingga muka X = 75
        const closeP = (lenP - 0.20) / 0.25;
        curOpening = (targetLen + 12) - 12 * closeP;
      } else if (lenP < 0.65) {
        // Verifikasi kesejajaran & pengencangan baut pengunci
        curOpening = targetLen;
        if (lenP > 0.50) isLocked = true;
      } else {
        // Pembacaan terkunci
        curOpening = targetLen;
        isLocked = true;
        showLoupe = true;
      }

      // Gambar Jangka Sorong Horisontal Sejajar Sumbu
      drawHorizontalCaliperForLength(ctx, {
        leftX: leftShoulderX,
        rightX: rightFaceX,
        jawOpening: curOpening,
        beamY: 56,
        locked: isLocked,
        alpha: 1.0
      });

      // Jendela Kaca Pembesar Skala Nonius
      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -75,
          y: 65,
          mainMm: 110,
          vernierFrac: 0.00,
          totalText: "L = 110,00 mm",
          title: "PEMBACAAN NONIUS PANJANG (0,02 mm)",
          tolerance: "±0,02 mm (PASS ✓)"
        });
      }
    }

    // KARTU TELEMETRI VERIFIKASI DI ATAS KANVAS
    const hudX = -15;
    const hudY = -125;
    const hudW = 285;
    const hudH = 52;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✔ PEMERIKSAAN JANGKA SORONG STANDAR INDUSTRI", hudX, hudY + 14);

    if (isMeasuringDiameter) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText("1. Uji Diameter: ⌀48,00 mm ± 0,02 mm (PASS ✓)", hudX, hudY + 27);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("Tegak Lurus 90° Sumbu Poros | Metode Rocking Halus", hudX, hudY + 40);
    } else {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText("2. Uji Panjang Total: L = 110,00 mm ± 0,02 mm (PASS ✓)", hudX, hudY + 27);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("Rahang Tetap di Bahu X = -35  ➔  Rahang Geser di Muka X = 75", hudX, hudY + 40);
    }

    ctx.restore(); // end caliper save

    ctx.restore();
  }

  // 4. Langkah 4: Pembubutan Diameter Tingkat Kedua 36 mm (L1 = 55 mm)
  function renderStep36Cutting(cutPt, p) {
    ctx.save();
    const curCutLen = 55 * p;
    const remLen = 55 * (1.0 - p);

    // Panah Arah Pemakanan Memanjang ke Batas Tingkat 2 (X = 20)
    ctx.strokeStyle = "#38bdf8";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cutPt.x + 24, 40);
    ctx.lineTo(cutPt.x - 10, 40);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(cutPt.x - 10, 40);
    ctx.lineTo(cutPt.x - 4, 36);
    ctx.lineTo(cutPt.x - 4, 44);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Pemakanan Tingkat 2 ➔ Batas X = 20", cutPt.x + 30, 43);

    // Animasi Tatal Pita Spiral Emas
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 4; c++) {
      const chipAge = (performance.now() * 0.007 + c * 0.7) % 2.2;
      const chipX = cutPt.x + 2 + chipAge * 8;
      const chipY = 18 + Math.sin(chipAge * 7) * 4;
      ctx.beginPath();
      ctx.arc(chipX, chipY, 3, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    // Telemetry Box di Atas Kanvas
    const hudX = -15;
    const hudY = -124;
    const hudW = 285;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PEMBUBUTAN DIAMETER TINGKAT KEDUA (D = ⌀36 mm)", hudX, hudY + 15);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.fillText(`Panjang Disayat: ${curCutLen.toFixed(1)} mm / 55 mm  (Sisa: ${remLen.toFixed(1)} mm)`, hudX, hudY + 29);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("D1 = 36,00 mm  |  Bahu Siku 90° Antar-Tingkat Bersih di X = 20 ✓", hudX, hudY + 43);

    ctx.restore();
  }

  // 5. Langkah 5: Pemeriksaan Dimensi dengan Sisi Belakang (Depth Bar) & Kepala Jangka Sorong
  function renderStepDepthBarInspection(p) {
    ctx.save();
    let calAlpha = 1.0;
    let calOffsetY = 0;

    if (p < 0.10) {
      const inP = p / 0.10;
      calAlpha = inP;
      calOffsetY = (1.0 - inP) * 45;
    } else if (p > 0.92) {
      const outP = (p - 0.92) / 0.08;
      calAlpha = Math.max(0, 1.0 - outP);
      calOffsetY = outP * 45;
    }

    ctx.save();
    ctx.globalAlpha = calAlpha;
    ctx.translate(0, calOffsetY);

    // Dua Metode Pengukuran Sesuai Standar Metrologi Industri:
    // p in [0.00, 0.48]: Metode 1 - Pengukuran Panjang Undakan L1 = 55 mm dengan Batang Kedalaman (Depth Bar / Sisi Belakang)
    // p in [0.48, 1.00]: Metode 2 - Pengukuran Diameter Tingkat Dua D1 = 36 mm & Undakan Bahu dengan Ujung Kepala Jangka Sorong
    const isMeasuringDepthBar = p < 0.48;

    if (isMeasuringDepthBar) {
      // -----------------------------------------------------------------------
      // METODE 1: PENGUKURAN DENGAN SISI BELAKANG JANGKA SORONG (DEPTH BAR)
      // Datum ekor bodi utama bersandar rata 90° pada muka ujung poros di X = 75
      // Bilah kedalaman meluncur ke kiri sepanjang poros 36 mm hingga bahu X = 20
      // -----------------------------------------------------------------------
      const datumFaceX = 75;
      const targetStepX = 20;
      const targetStepLen = 55;
      let curDepth = 0;
      let isLocked = false;
      let showLoupe = false;

      const depthP = p / 0.48; // sub-progress 0.0 to 1.0

      if (depthP < 0.20) {
        // Dudukan ekor bertumpu rata di muka X = 75
        curDepth = 0;
      } else if (depthP < 0.55) {
        // Bilah kedalaman meluncur keluar sepanjang 55 mm
        const extP = (depthP - 0.20) / 0.35;
        curDepth = targetStepLen * extP;
      } else if (depthP < 0.72) {
        // Ujung bilah menempel bahu siku di X = 20, penguncian baut
        curDepth = targetStepLen;
        if (depthP > 0.60) isLocked = true;
      } else {
        // Pembacaan terkunci
        curDepth = targetStepLen;
        isLocked = true;
        showLoupe = true;
      }

      // Gambar Pengukuran Sisi Belakang (Depth Bar)
      drawDepthBarCaliper(ctx, {
        datumX: datumFaceX,
        stepX: targetStepX,
        depthExt: curDepth,
        beamY: 22,
        locked: isLocked,
        alpha: 1.0
      });

      // Jendela Kaca Pembesar Skala Nonius
      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -75,
          y: 65,
          mainMm: 55,
          vernierFrac: 0.00,
          totalText: "L1 = 55,00 mm",
          title: "PEMBACAAN NONIUS DEPTH BAR (0,02 mm)",
          tolerance: "±0,02 mm (PASS ✓)"
        });
      }

    } else {
      // -----------------------------------------------------------------------
      // METODE 2: PENGUKURAN DENGAN UJUNG KEPALA JANGKA SORONG (OUTSIDE JAWS)
      // Rahang ukur luar menjepit diameter D1 = 36 mm pada X = 48
      // Muka ukur bertingkat memeriksa kerataan siku undakan di X = 20
      // -----------------------------------------------------------------------
      const targetDia = 36;
      const xMeasure = 48; // Titik ukur di tengah tingkat 55 mm
      let curOpening = targetDia;
      let curRock = 0;
      let isLocked = false;
      let showLoupe = false;

      const headP = (p - 0.48) / 0.52; // sub-progress 0.0 to 1.0

      if (headP < 0.20) {
        // Pendekatan: rahang terbuka (36 + 10 = 46 mm)
        curOpening = targetDia + 10;
      } else if (headP < 0.45) {
        // Penjepitan halus: rahang merapat ke 36 mm
        const closeP = (headP - 0.20) / 0.25;
        curOpening = (targetDia + 10) - 10 * closeP;
      } else if (headP < 0.65) {
        // Rocking alignment check ±0.6°
        curOpening = targetDia;
        const rockP = (headP - 0.45) / 0.20;
        curRock = Math.sin(rockP * Math.PI * 4) * 0.012;
        if (headP > 0.55) isLocked = true;
      } else {
        // Pembacaan terkunci
        curOpening = targetDia;
        isLocked = true;
        showLoupe = true;
      }

      // Gambar Jangka Sorong Vertikal pada Diameter 36 mm
      drawVerticalCaliperForDiameter(ctx, {
        xCenter: xMeasure,
        diameter: targetDia,
        jawOpening: curOpening,
        rockAngle: curRock,
        locked: isLocked,
        alpha: 1.0
      });

      // Indikator Pemeriksaan Muka Bertingkat di Bahu X = 20
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(20, -18);
      ctx.lineTo(20, -24);
      ctx.stroke();

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("MUKA TINGKAT SIKU ✓", 20, -27);

      // Jendela Kaca Pembesar Skala Nonius
      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -75,
          y: 65,
          mainMm: 36,
          vernierFrac: 0.00,
          totalText: "⌀36,00 mm",
          title: "PEMBACAAN NONIUS KEPALA (0,02 mm)",
          tolerance: "ISO h7 (±0,02 mm) PASS ✓"
        });
      }
    }

    // KARTU HASIL VERIFIKASI PENGUKURAN DI ATAS KANVAS
    const hudX = -15;
    const hudY = -125;
    const hudW = 285;
    const hudH = 52;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✔ VERIFIKASI DUA FITUR METROLOGI JANGKA SORONG", hudX, hudY + 14);

    if (isMeasuringDepthBar) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText("1. Sisi Belakang (Depth Bar): L1 = 55,00 mm (PASS ✓)", hudX, hudY + 27);
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("Datum Ekor Rata di Muka X = 75  ➔  Bilah ke Bahu Siku X = 20", hudX, hudY + 40);
    } else {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillText("2. Ujung Kepala (Rahang Luar): D1 = ⌀36,00 mm (PASS ✓)", hudX, hudY + 27);
      ctx.fillStyle = "#4ade80";
      ctx.fillText("Muka Bertingkat & Chamfer 1x45° Ujung Sempurna ✔", hudX, hudY + 40);
    }

    ctx.restore(); // end caliper save

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS UNTUK OPERASI PEMBUATAN ALUR & POTONG (GROOVING)
  // ---------------------------------------------------------------------------

  // 1. LANGKAH 1: Pemasangan Pahat Alur & Uji Kesikuan 90° dengan Penyiku Presisi
  function renderGrooveToolAlignment(p) {
    ctx.save();

    // Animasi Muncul - Aksi - Keluar:
    // p < 0.20: Slide-in dari kanan atas & Fade-in
    // 0.20 <= p <= 0.82: Uji kesikuan & celah cahaya (Light gap inspection)
    // p > 0.82: Slide-out ke kanan atas & Fade-out
    let sqAlpha = 1.0;
    let sqOffsetX = 0;
    let sqOffsetY = 0;

    if (p < 0.20) {
      const inP = p / 0.20;
      sqAlpha = inP;
      sqOffsetX = (1.0 - inP) * 45;
      sqOffsetY = -(1.0 - inP) * 45;
    } else if (p > 0.82) {
      const outP = (p - 0.82) / 0.18;
      sqAlpha = Math.max(0, 1.0 - outP);
      sqOffsetX = outP * 45;
      sqOffsetY = -outP * 45;
    }

    // PENYIKU PRESISI (PRECISION TRY SQUARE 90°)
    ctx.save();
    ctx.globalAlpha = sqAlpha;
    ctx.translate(sqOffsetX, sqOffsetY);

    // Badan Tebal Penyiku (Stock) bersandar rapat di silinder diameter luar (Y = 18 s.d. 30, X = -18 s.d. 22.5)
    // Daun Bilah Tipis (Blade) turun tegak lurus menyusuri sisi samping kiri bilah pahat (X = 22.5, Y = 30 s.d. 54)
    const stockX = -18;
    const stockY = 20;
    const stockW = 40.5;
    const stockH = 10;

    const bladeX = 16.5;
    const bladeY = 30;
    const bladeW = 6;
    const bladeH = 26;

    // 1. Badan Tebal Penyiku (Hardened Ground Steel Stock)
    const stockGrad = ctx.createLinearGradient(stockX, stockY, stockX, stockY + stockH);
    stockGrad.addColorStop(0, "#1e293b");
    stockGrad.addColorStop(0.5, "#475569");
    stockGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = stockGrad;
    ctx.beginPath();
    ctx.roundRect(stockX, stockY, stockW, stockH, [2]);
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grafir badan penyiku
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(stockX + 3, stockY + 2, stockW - 6, stockH - 4);

    // 2. Daun Bilah Tipis Penyiku Presisi (Ground Steel Blade)
    const bladeGrad = ctx.createLinearGradient(bladeX, 0, bladeX + bladeW, 0);
    bladeGrad.addColorStop(0, "#cbd5e1");
    bladeGrad.addColorStop(0.4, "#f8fafc");
    bladeGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = bladeGrad;
    ctx.fillRect(bladeX, bladeY, bladeW, bladeH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(bladeX, bladeY, bladeW, bladeH);

    // Sudut Sambungan Siku 90°
    ctx.fillStyle = "#334155";
    ctx.fillRect(stockX + stockW - 8, stockY, 8, stockH);

    // Simbol Sudut 90° Presisi
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(22.5 - 6, 30 + 6);
    ctx.lineTo(22.5 - 6, 30);
    ctx.lineTo(22.5, 30);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(22.5 - 3, 30 + 3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Garis Uji Celah Cahaya Presisi (Zero Light Gap - Parallel Contact)
    // Berada di pertemuan antara bilah daun penyiku kanan (X = 22.5) dan sisi samping bilah pahat (X = 22.5)
    if (p >= 0.20 && p <= 0.82) {
      const pulse = 0.85 + Math.sin(performance.now() * 0.008) * 0.15;
      ctx.strokeStyle = `rgba(74, 222, 128, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(22.5, 34);
      ctx.lineTo(22.5, 52);
      ctx.stroke();

      // Label Celah Cahaya Siku 90°
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 8px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText("CELAH CAHAYA PARALEL 90,0° ✓", 14, 46);

      // Label Sudut Bebas Samping (Side Clearance Flanks)
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("BEBAS SAMPING γs = 2°", 29, 50);
    }

    ctx.restore(); // end try square

    // Indikator Titik Ketinggian Senter
    ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-115, 0);
    ctx.lineTo(120, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // KARTU HUD PANDUAN LANGKAH 1
    const hudX = 0;
    const hudY = -128;
    const hudW = 340;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("UJI KESIKUAN 90° & KELURUSAN BILAH PAHAT ALUR", hudX, hudY + 14);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("• Daun Penyiku Presisi (Try Square) memverifikasi bilah persis 90° tegak lurus spindel", hudX, hudY + 27);

    ctx.fillStyle = "#4ade80";
    ctx.fillText("• Celah cahaya paralel + sudut bebas samping simetris meniadakan gesekan & chatter ✓", hudX, hudY + 40);

    ctx.restore();
  }

  // 2. LANGKAH 2: Penentuan Posisi Aksial Z = 50 mm & Kunci Eretan Memanjang
  function renderGroovePositionZ(p) {
    ctx.save();

    // A. MISTAR BAJA PRESISI (STAINLESS STEEL RULE) DI ATAS BENDA KERJA (Y = -54)
    const ruleX = 15;
    const ruleY = -54;
    const ruleW = 65;
    const ruleH = 12;

    const ruleGrad = ctx.createLinearGradient(0, ruleY, 0, ruleY + ruleH);
    ruleGrad.addColorStop(0, "#cbd5e1");
    ruleGrad.addColorStop(0.5, "#f8fafc");
    ruleGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = ruleGrad;
    ctx.fillRect(ruleX, ruleY, ruleW, ruleH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(ruleX, ruleY, ruleW, ruleH);

    // Garis Skala Milimeter pada Mistar Baja (0 di muka ujung X = 75, bergerak ke kiri)
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let d = 0; d <= 60; d += 2) {
      const rx = 75 - d;
      const isMajor = d % 10 === 0;
      const isMid = d % 5 === 0;
      const tLen = isMajor ? 6 : (isMid ? 4 : 2.5);
      ctx.beginPath();
      ctx.moveTo(rx, ruleY + ruleH);
      ctx.lineTo(rx, ruleY + ruleH - tLen);
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 6.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(d.toString(), rx, ruleY + 5);
      }
    }

    // B. GARIS DIMENSI JARAK AKSIAL Z = 50,0 mm
    const dimY = -36;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(75, dimY);
    ctx.lineTo(25, dimY);
    ctx.stroke();

    // Tanda panah di X = 75 dan X = 25
    ctx.fillStyle = "#facc15";
    // Panah kanan
    ctx.beginPath();
    ctx.moveTo(75, dimY);
    ctx.lineTo(71, dimY - 2.5);
    ctx.lineTo(71, dimY + 2.5);
    ctx.closePath();
    ctx.fill();
    // Panah kiri
    ctx.beginPath();
    ctx.moveTo(25, dimY);
    ctx.lineTo(29, dimY - 2.5);
    ctx.lineTo(29, dimY + 2.5);
    ctx.closePath();
    ctx.fill();

    // Garis proyeksi vertikal
    ctx.strokeStyle = "rgba(250, 204, 21, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(75, -42);
    ctx.lineTo(75, 30);
    ctx.moveTo(25, -42);
    ctx.lineTo(25, 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Teks Dimensi
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Z = 50,0 mm", 50, dimY - 4);

    // C. INDIKATOR TOUCHING X0 DI KELILING BENDA KERJA (X = 25, Y = 30)
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(25, 30, 3, 0, Math.PI * 2);
    ctx.fill();

    // Lingkaran riak kontak touching
    const ripple = (performance.now() * 0.004) % 1;
    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - ripple})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(25, 30, 3 + ripple * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("TOUCHING X0 (⌀60 mm) ➔ NONIUS 0,00 mm", 32, 28);

    // D. INDIKATOR PENGUNCI ERETAN MEMANJANG (CARRIAGE LOCK ON)
    const lockBoxX = 28;
    const lockBoxY = 62;
    ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(lockBoxX, lockBoxY, 115, 20, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("🔒 CARRIAGE LOCK ON", lockBoxX + 57.5, lockBoxY + 13);

    // KARTU HUD PANDUAN LANGKAH 2
    const hudX = 0;
    const hudY = -128;
    const hudW = 340;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PENENTUAN POSISI AKSIAL Z = 50 mm & KUNCI ERETAN", hudX, hudY + 14);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("• Mistar Baja: Posisi alur tepat 50 mm dari muka ujung kanan (Z = 50,0 mm)", hudX, hudY + 27);

    ctx.fillStyle = "#4ade80";
    ctx.fillText("• Baut Klem Eretan Memanjang Dikunci Kaku: Mencegah pergeseran aksial saat alur ✓", hudX, hudY + 40);

    ctx.restore();
  }

  // 3. LANGKAH 3: Penyayatan Alur Radial Bertahap Menuju Kedalaman 6 mm
  function renderGrooveRadialCutting(cutPt, p) {
    ctx.save();
    const cutY = (cutPt && cutPt.y !== undefined) ? cutPt.y : (30.0 - 6.0 * Math.min(1.0, Math.max(0.0, p)));

    // TATAL C-SHAPE PRESISI (CHARACTERISTIC GROOVING C-SHAPED SWARF)
    // Pahat alur dengan alur pemecah tatal (chipbreaker) menghasilkan tatal melengkung C pendek
    const numChips = 4;
    for (let c = 0; c < numChips; c++) {
      const chipAge = ((p * 12 + c * 0.25) % 1.0);
      const chipX = 25 + Math.sin(chipAge * Math.PI * 2) * 5;
      const chipY = cutY - chipAge * 18;
      const chipR = 2.5 + chipAge * 1.5;

      ctx.save();
      ctx.strokeStyle = c % 2 === 0 ? "#facc15" : "#94a3b8"; // Percampuran warna keemasan & baja
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      // Bentuk C-shape curl
      ctx.arc(chipX, chipY, chipR, -Math.PI * 0.2, Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();
    }

    // Hitung Dimensi Dinamis Real-Time Sesuai Posisi Pahat
    const curDepth = (6.0 * Math.min(1.0, Math.max(0.0, p))).toFixed(2);
    const curDia = (60.0 - 12.0 * Math.min(1.0, Math.max(0.0, p))).toFixed(2);

    // KOTAK STATUS SIKLUS PECKING DI DEKAT BENDA KERJA
    const peckingBoxX = -85;
    const peckingBoxY = 48;
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(peckingBoxX, peckingBoxY, 100, 24, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SIKLUS PECKING AKTIF", peckingBoxX + 50, peckingBoxY + 10);
    ctx.fillStyle = "#facc15";
    ctx.fillText("CUT 1 mm ➔ RETRACT 0,2 mm", peckingBoxX + 50, peckingBoxY + 19);

    // KARTU HUD PANDUAN LANGKAH 3
    const hudX = 0;
    const hudY = -128;
    const hudW = 340;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PENYAYATAN RADIAL ALUR (RADIAL GROOVING INFEED)", hudX, hudY + 14);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText(`• Kedalaman Alur: h = ${curDepth} / 6,00 mm  |  ⌀ Dasar Alur: ⌀${curDia} mm`, hudX, hudY + 27);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("• Tatal C-shape terputus rapi berkat alur chipbreaker & pendingin kontinyu ✓", hudX, hudY + 40);

    ctx.restore();
  }

  // 4. LANGKAH 4: Pemeriksaan Dimensi Alur (Kedalaman 6 mm & Lebar 5 mm) dengan Jangka Sorong
  function renderGrooveInspection(p) {
    ctx.save();

    // Animasi Masuk & Keluar Caliper:
    let calAlpha = 1.0;
    let calOffsetY = 0;

    if (p < 0.08) {
      const inP = p / 0.08;
      calAlpha = inP;
      calOffsetY = (1.0 - inP) * 35;
    } else if (p > 0.92) {
      const outP = (p - 0.92) / 0.08;
      calAlpha = Math.max(0, 1.0 - outP);
      calOffsetY = outP * 35;
    }

    ctx.save();
    ctx.globalAlpha = calAlpha;
    ctx.translate(0, calOffsetY);

    // Dua Metode Pemeriksaan Sesuai Standar Metrologi Industri:
    // p in [0.00, 0.50]: Metode 1 - Pengukuran Kedalaman Alur h = 6,00 mm dengan Batang Kedalaman (Depth Bar / Sisi Belakang)
    // p in [0.50, 1.00]: Metode 2 - Pengukuran Lebar Alur w = 5,00 mm dengan Rahang Ukur Dalam (Inside Jaws)
    const isMeasuringDepth = p < 0.50;

    if (isMeasuringDepth) {
      // -----------------------------------------------------------------------
      // METODE 1: PENGUKURAN KEDALAMAN ALUR DENGAN SISI BELAKANG (DEPTH BAR)
      // Datum ekor bodi jangka sorong bersandar rata 90° pada keliling luar di Y = -30
      // Batang kedalaman (depth bar) meluncur vertikal ke bawah sedalam 6 mm ke dasar alur (Y = -24)
      // -----------------------------------------------------------------------
      const subP = p / 0.50; // 0.0 to 1.0
      const grooveX = 25.0;
      const targetDepth = 6.0;
      let curDepthExt = 0;
      let isLocked = false;
      let showLoupe = false;

      if (subP < 0.20) {
        curDepthExt = 0;
      } else if (subP < 0.55) {
        const extP = (subP - 0.20) / 0.35;
        curDepthExt = targetDepth * extP;
      } else if (subP < 0.75) {
        curDepthExt = targetDepth;
        if (subP > 0.60) isLocked = true;
      } else {
        curDepthExt = targetDepth;
        isLocked = true;
        showLoupe = true;
      }

      // GAMBAR JANGKA SORONG BATANG KEDALAMAN VERTIKAL (VERTICAL DEPTH GAUGE)
      const datumY = -30; // Permukaan luar silinder atas
      const tipY = datumY + curDepthExt; // Dasar alur turun ke arah tengah benda kerja

      // A. Batang Kedalaman (Depth Bar Rod) tipis presisi
      const rodW = 2.5;
      const rodGrad = ctx.createLinearGradient(grooveX - rodW / 2, 0, grooveX + rodW / 2, 0);
      rodGrad.addColorStop(0, "#f8fafc");
      rodGrad.addColorStop(0.5, "#cbd5e1");
      rodGrad.addColorStop(1, "#94a3b8");

      ctx.fillStyle = rodGrad;
      ctx.fillRect(grooveX - rodW / 2, datumY, rodW, curDepthExt);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(grooveX - rodW / 2, datumY, rodW, curDepthExt);

      // Titik Kontak Ujung Batang Kedalaman di Dasar Alur (Y = -24)
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(grooveX, tipY, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Percikan Kontak Presisi saat menyentuh dasar
      if (Math.abs(curDepthExt - targetDepth) < 0.3) {
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 1;
        for (let sp = 0; sp < 4; sp++) {
          const ang = (sp * Math.PI) / 2 + Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(grooveX, tipY);
          ctx.lineTo(grooveX + Math.cos(ang) * 4, tipY + Math.sin(ang) * 4);
          ctx.stroke();
        }
      }

      // B. Landasan Datum Tumpuan Ekor (Caliper Base Datum Face)
      // Bersandar rata pada permukaan silinder di kiri & kanan alur (X = 25 ± 20)
      const datumW = 42;
      const datumH = 8;
      const datumX = grooveX - datumW / 2;

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(datumX, datumY - datumH, datumW, datumH);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(datumX, datumY - datumH, datumW, datumH);

      // Garis Kontak Datum Emas
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(datumX, datumY);
      ctx.lineTo(grooveX - 3.5, datumY);
      ctx.moveTo(grooveX + 3.5, datumY);
      ctx.lineTo(datumX + datumW, datumY);
      ctx.stroke();

      // C. Badan Batang Utama (Main Beam) menjulang vertikal ke atas
      const beamW = 14;
      const beamH = 45;
      const beamX = grooveX - beamW / 2;
      const beamY = datumY - datumH - beamH;

      const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + beamW, 0);
      beamGrad.addColorStop(0, "#cbd5e1");
      beamGrad.addColorStop(0.5, "#f8fafc");
      beamGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = beamGrad;
      ctx.fillRect(beamX, beamY, beamW, beamH);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.strokeRect(beamX, beamY, beamW, beamH);

      // Skala Milimeter pada Batang
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 0.8;
      for (let sy = beamY + 5; sy < beamY + beamH - 5; sy += 3) {
        ctx.beginPath();
        ctx.moveTo(beamX + beamW, sy);
        ctx.lineTo(beamX + beamW - 3.5, sy);
        ctx.stroke();
      }

      // Baut Pengunci (Lock Screw)
      ctx.fillStyle = isLocked ? "#22c55e" : "#f59e0b";
      ctx.beginPath();
      ctx.arc(beamX - 3, datumY - datumH - 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Label Datum
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("DATUM EKOR JANGKA SORONG", grooveX, datumY - datumH - 4);

      // Jendela Kaca Pembesar Skala Nonius Kedalaman
      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -75,
          y: 65,
          mainMm: 6,
          vernierFrac: 0.00,
          totalText: "h = 6,00 mm",
          title: "PEMBACAAN NONIUS KEDALAMAN (0,02 mm)",
          tolerance: "ISO h9 (±0,03 mm) PASS ✓"
        });
      }

    } else {
      // -----------------------------------------------------------------------
      // METODE 2: PENGUKURAN LEBAR ALUR DENGAN RAHANG UKUR DALAM (INSIDE JAWS)
      // Rahang ukur dalam jangka sorong masuk ke dalam rongga alur di X = 25
      // Rahang kiri menyentuh dinding X = 22.5, rahang kanan menyentuh dinding X = 27.5 (w = 5,00 mm)
      // -----------------------------------------------------------------------
      const subP = (p - 0.50) / 0.50; // 0.0 to 1.0
      const grooveX = 25.0;
      const targetW = 5.0;
      let curW = 3.0; // Mulai dari menguncup 3 mm lalu melebar ke 5 mm
      let isLocked = false;
      let showLoupe = false;

      if (subP < 0.20) {
        curW = 3.0;
      } else if (subP < 0.55) {
        const extP = (subP - 0.20) / 0.35;
        curW = 3.0 + (targetW - 3.0) * extP;
      } else if (subP < 0.75) {
        curW = targetW;
        if (subP > 0.60) isLocked = true;
      } else {
        curW = targetW;
        isLocked = true;
        showLoupe = true;
      }

      // GAMBAR RAHANG UKUR DALAM (INSIDE MEASURING JAWS)
      // Masuk ke rongga alur dari bawah (Y = 24 s.d. 30)
      const jawTipY = 26; // Di dalam rongga alur
      const jawBaseY = 48; // Di bawah benda kerja
      const leftJawX = grooveX - curW / 2;
      const rightJawX = grooveX + curW / 2;

      // Rahang Kiri Tetap (Fixed Inside Nib Jaw)
      ctx.fillStyle = "#cbd5e1";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftJawX, jawTipY);
      ctx.lineTo(leftJawX + 1.5, jawTipY);
      ctx.lineTo(leftJawX + 2.5, jawBaseY);
      ctx.lineTo(leftJawX - 5, jawBaseY);
      ctx.lineTo(leftJawX, jawTipY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rahang Kanan Geser (Sliding Inside Nib Jaw)
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(rightJawX, jawTipY);
      ctx.lineTo(rightJawX - 1.5, jawTipY);
      ctx.lineTo(rightJawX - 2.5, jawBaseY);
      ctx.lineTo(rightJawX + 5, jawBaseY);
      ctx.lineTo(rightJawX, jawTipY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Titik Kontak Presisi pada Dinding Kiri (X = 22.5) & Kanan (X = 27.5)
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(leftJawX, jawTipY + 1.5, 2, 0, Math.PI * 2);
      ctx.arc(rightJawX, jawTipY + 1.5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Garis Dimensi Lebar Alur w = 5,00 mm
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(leftJawX, jawTipY + 1.5);
      ctx.lineTo(rightJawX, jawTipY + 1.5);
      ctx.stroke();

      // Label Kontak Dinding
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("LEBAR ALUR w = 5,00 mm ✓", grooveX, jawBaseY + 10);

      // Badan Geser Jangka Sorong di Bawah
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(grooveX - 18, jawBaseY, 36, 10);
      ctx.strokeStyle = "#64748b";
      ctx.strokeRect(grooveX - 18, jawBaseY, 36, 10);

      // Baut Klem
      ctx.fillStyle = isLocked ? "#22c55e" : "#f59e0b";
      ctx.beginPath();
      ctx.arc(grooveX + 12, jawBaseY + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Jendela Kaca Pembesar Skala Nonius Lebar
      if (showLoupe) {
        drawVernierLoupe(ctx, {
          x: -75,
          y: 65,
          mainMm: 5,
          vernierFrac: 0.00,
          totalText: "w = 5,00 mm",
          title: "PEMBACAAN NONIUS LEBAR ALUR (0,02 mm)",
          tolerance: "Toleransi Alur ±0,02 mm PASS ✓"
        });
      }
    }

    // KARTU HASIL VERIFIKASI PENGUKURAN DI ATAS KANVAS
    const hudX = 0;
    const hudY = -128;
    const hudW = 340;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✔ VERIFIKASI DUA FITUR METROLOGI ALUR JANGKA SORONG", hudX, hudY + 14);

    if (isMeasuringDepth) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("1. Sisi Belakang (Depth Bar): Kedalaman h = 6,00 mm (PASS ✓)", hudX, hudY + 27);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 8px JetBrains Mono, monospace";
      ctx.fillText("Datum Ekor Bertumpu Rata 90° pada Keliling Luar ⌀60 mm ➔ Dasar ⌀48 mm", hudX, hudY + 40);
    } else {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("2. Rahang Ukur Dalam (Inside Jaws): Lebar Alur w = 5,00 mm (PASS ✓)", hudX, hudY + 27);
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 8px JetBrains Mono, monospace";
      ctx.fillText("Kedua Dinding Alur Rata Tegak Lurus 90° & Sudut Bebas Beram Sempurna ✔", hudX, hudY + 40);
    }

    ctx.restore(); // end caliper save

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS UNTUK OPERASI PENGEBORAN SENTER (CENTER DRILLING)
  // ---------------------------------------------------------------------------
  function renderCenterDrillMounting(p) {
    ctx.save();

    // 1. KARTU HUD ATAS (LANGKAH 1)
    const hudX = 0;
    const hudY = -128;
    const hudW = 350;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("LANGKAH 1: PERSIAPAN & PEMASANGAN BOR SENTER DIN 333 FORM A", hudX, hudY + 14);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("1. Tangkai cekam bor dipasang ke morse quill; bor senter dijepit konsentris.", hudX, hudY + 27);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("2. Kencangkan kuat dengan Kunci Cekam. Kepala lepas di posisi parkir aman (>30 mm).", hudX, hudY + 40);

    // 2. HIGHLIGHT DATUM MUKA BENDA KERJA (FACING 90° SELESAI)
    const faceX = 75;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(faceX, -36);
    ctx.lineTo(faceX, 36);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label Datum
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(faceX - 65, -45, 60, 16, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("DATUM MUKA 90°", faceX - 35, -34);

    // 3. DIMENSI JARAK PARKIR AMAN (>30 mm)
    const drillTipX = 106; // tsX = 185 -> tipX = 185 - 79 = 106
    const dimY = -22;

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(faceX, dimY);
    ctx.lineTo(drillTipX, dimY);
    ctx.stroke();

    // Panah ujung dimensi
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(faceX, dimY);
    ctx.lineTo(faceX + 5, dimY - 2.5);
    ctx.lineTo(faceX + 5, dimY + 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(drillTipX, dimY);
    ctx.lineTo(drillTipX - 5, dimY - 2.5);
    ctx.lineTo(drillTipX - 5, dimY + 2.5);
    ctx.closePath();
    ctx.fill();

    // Tag Dimensi
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect((faceX + drillTipX) / 2 - 40, dimY - 14, 80, 12, [3]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("JARAK PARKIR: 31 mm ✔", (faceX + drillTipX) / 2, dimY - 5);

    // 4. ANIMASI KUNCI CEKAM BOR (CHUCK KEY T-HANDLE)
    const chuckKeyX = 141; // tsX = 185, chuckNoseX = 129, geared ring at 137 to 145 -> hole at 141
    const chuckKeyHoleY = -16;

    // Batang Kunci Pasak (Key Pinion Shaft)
    const shaftGrad = ctx.createLinearGradient(chuckKeyX - 2, 0, chuckKeyX + 2, 0);
    shaftGrad.addColorStop(0, "#cbd5e1");
    shaftGrad.addColorStop(0.5, "#f8fafc");
    shaftGrad.addColorStop(1, "#64748b");
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(chuckKeyX - 2.5, -55, 5, 39);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(chuckKeyX - 2.5, -55, 5, 39);

    // Kepala Pinion Roda Gigi Kunci (Bevel Pinion Head)
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(chuckKeyX - 4, -20);
    ctx.lineTo(chuckKeyX - 2, chuckKeyHoleY);
    ctx.lineTo(chuckKeyX + 2, chuckKeyHoleY);
    ctx.lineTo(chuckKeyX + 4, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gagang T-Handle Kunci Cekam
    ctx.fillStyle = shaftGrad;
    ctx.beginPath();
    ctx.roundRect(chuckKeyX - 22, -58, 44, 5, [2.5]);
    ctx.fill();
    ctx.stroke();

    // Kenop Ujung T-Handle
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(chuckKeyX - 22, -55.5, 3.5, 0, Math.PI * 2);
    ctx.arc(chuckKeyX + 22, -55.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Panah Torsi Putaran Kencang (Torque Rotation Arc)
    const tRot = (p * 6) % (Math.PI * 2);
    ctx.save();
    ctx.translate(chuckKeyX, -55.5);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 12, tRot, tRot + 1.2 * Math.PI);
    ctx.stroke();

    // Kepala panah
    const arrowTipAngle = tRot + 1.2 * Math.PI;
    const ax = 12 * Math.cos(arrowTipAngle);
    const ay = 12 * Math.sin(arrowTipAngle);
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(ax, ay, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tag Kunci Cekam
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(chuckKeyX - 60, -78, 120, 16, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("KUNCI CEKAM BOR (CHUCK KEY)", chuckKeyX, -67);

    // 5. INDIKATOR TUAS KEPALA LEPAS BEBAS (UNCLAMPED)
    const leverX = 185 + 35;
    const leverY = 48;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(leverX - 70, leverY + 14, 140, 15, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("TUAS BEBAS (UNCLAMPED) - SIAP GESER", leverX, leverY + 25);

    ctx.restore();
  }

  function renderCenterDrillPositioning(p) {
    ctx.save();

    // 1. KARTU HUD ATAS (LANGKAH 2)
    const hudX = 0;
    const hudY = -128;
    const hudW = 350;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("LANGKAH 2: PENYETELAN JARAK AMAN (15-20 mm) & PENGUNCIAN KEPALA LEPAS", hudX, hudY + 14);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("1. Kepala lepas digeser hingga jarak ujung mata bor ke muka benda tepat 18,0 mm.", hudX, hudY + 27);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("2. Kencangkan tuas pengunci alas (Bed Clamp) agar rigid dan tahan gaya aksial pemotongan.", hudX, hudY + 40);

    // 2. DIMENSI JARAK AMAN AWAL: 18,0 mm (STANDAR 15 - 20 mm)
    const faceX = 75;
    const drillTipX = 93; // tsX = 172 -> tipX = 172 - 79 = 93.0
    const dimY = -22;

    // Witness lines vertikal
    ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(faceX, -30);
    ctx.lineTo(faceX, dimY + 3);
    ctx.moveTo(drillTipX, -10);
    ctx.lineTo(drillTipX, dimY + 3);
    ctx.stroke();

    // Garis dimensi horizontal
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(faceX, dimY);
    ctx.lineTo(drillTipX, dimY);
    ctx.stroke();

    // Panah dimensi
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(faceX, dimY);
    ctx.lineTo(faceX + 5, dimY - 2.5);
    ctx.lineTo(faceX + 5, dimY + 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(drillTipX, dimY);
    ctx.lineTo(drillTipX - 5, dimY - 2.5);
    ctx.lineTo(drillTipX - 5, dimY + 2.5);
    ctx.closePath();
    ctx.fill();

    // Badge Dimensi
    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect((faceX + drillTipX) / 2 - 62, dimY - 22, 124, 17, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("JARAK AMAN: 18,0 mm (PASS ✔)", (faceX + drillTipX) / 2, dimY - 10);

    // 3. HIGHLIGHT TUAS PENGUNCI KEPALA LEPAS (BED CLAMP LEVER LOCKED)
    const leverX = 172 + 35;
    const leverY = 56;

    // Lingkaran kilau kunci
    ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(leverX, leverY, 10 + 2 * Math.sin(p * 8), 0, Math.PI * 2);
    ctx.stroke();

    // Tag Kunci Alas
    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(leverX - 85, leverY + 16, 170, 24, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("TUAS PENGUNCI ALAS TERKUNCI KOKOH ✔", leverX, leverY + 27);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "7px JetBrains Mono, monospace";
    ctx.fillText("Menahan gaya dorong aksial pengeboran", leverX, leverY + 36);

    // 4. PENUNJUK LARAS KEPALA LEPAS (QUILL BARREL AT ZERO)
    const quillIndicatorX = 172 - 18;
    ctx.fillStyle = "rgba(11, 23, 44, 0.9)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(quillIndicatorX - 45, -45, 90, 14, [3]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Laras Quill: 0,0 mm", quillIndicatorX, -35);

    ctx.restore();
  }

  function renderCenterDrillPeckingProcess(p, cutPt) {
    ctx.save();

    // 1. KARTU HUD ATAS (LANGKAH 3)
    const hudX = 0;
    const hudY = -128;
    const hudW = 350;
    const hudH = 50;

    const isRetract = !!animState.isPeckingRetract;
    const holeDepth = (animState.centerHoleDepth !== undefined ? animState.centerHoleDepth : 0.0);

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = isRetract ? "#f59e0b" : "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isRetract ? "#f59e0b" : "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("LANGKAH 3: SIKLUS PENGEBORAN SENTER BERTAHAP 'MAJU-MUNDUR' (PECKING FEED)", hudX, hudY + 14);

    if (isRetract) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("⟲ GERAKAN MUNDUR: Evakuasi tatal keluar dari lubang & pendinginan ujung bor.", hudX, hudY + 27);
    } else {
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("➔ GERAKAN MAJU: Penyayatan aksial bertahap menuju 2/3 tirus 60° (h = 9,0 mm).", hudX, hudY + 27);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("Cegah penumpukan panas & tatal terjepit (chip jamming) agar mata bor tidak patah.", hudX, hudY + 40);

    // 2. BADGE STATUS DINAMIS DI ATAS AKSI (X = 50, Y = -45)
    const badgeX = 50;
    const badgeY = -48;
    const badgeW = 190;
    const badgeH = 20;

    ctx.fillStyle = isRetract ? "rgba(69, 26, 3, 0.95)" : "rgba(8, 47, 73, 0.95)";
    ctx.strokeStyle = isRetract ? "#f59e0b" : "#38bdf8";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(badgeX - badgeW / 2, badgeY, badgeW, badgeH, [5]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isRetract ? "#fbbf24" : "#38bdf8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    if (isRetract) {
      ctx.fillText("⟲ TARIK MUNDUR: BUANG TATAL & DINGINKAN", badgeX, badgeY + 13);
    } else {
      ctx.fillText(`➔ PENYAYATAN MAJU: KEDALAMAN ${holeDepth.toFixed(1)} mm / 9,0 mm`, badgeX, badgeY + 13);
    }

    // 3. EVAKUASI TATAL (CHIP EVACUATION SWARF FLYING OUT)
    const faceX = 75;
    if (isRetract || (holeDepth > 0.5 && Math.random() < 0.6)) {
      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1;
      const chipCount = isRetract ? 6 : 3;
      for (let c = 0; c < chipCount; c++) {
        const cx = faceX - 2 - c * 5 - (p * 40 % 20);
        const cy = (c % 2 === 0 ? 1 : -1) * (5 + c * 3.5);
        ctx.beginPath();
        ctx.arc(cx, cy, 1.8, 0, Math.PI * 1.5);
        ctx.stroke();
      }

      if (isRetract) {
        // Tag Tatal Keluar
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.roundRect(faceX - 65, 24, 60, 13, [3]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 6.5px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("Tatal Keluar ✔", faceX - 35, 33);
      }
    }

    // 4. PENETES OLI PEMOTONG (CUTTING OIL DROPPER)
    const dropperX = 80;
    const dropperY = -34;
    // Pipa nozel penetes oli
    ctx.fillStyle = "#b45309";
    ctx.fillRect(dropperX - 2, dropperY - 14, 4, 14);
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(dropperX - 2, dropperY - 14, 4, 14);

    // Nozel penetes
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(dropperX - 3, dropperY);
    ctx.lineTo(dropperX + 3, dropperY);
    ctx.lineTo(dropperX + 1, dropperY + 5);
    ctx.lineTo(dropperX - 1, dropperY + 5);
    ctx.closePath();
    ctx.fill();

    // Tetesan oli kuning berkilau jatuh ke mulut lubang
    const dropProg = (p * 8) % 1.0;
    const dropY = dropperY + 5 + dropProg * 28;
    ctx.fillStyle = "rgba(234, 179, 8, 0.9)";
    ctx.beginPath();
    ctx.ellipse(dropperX, dropY, 1.8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Label Oli Pemotong
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(dropperX - 45, dropperY - 26, 90, 12, [3]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 6.8px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Oli Pemotong (Coolant)", dropperX, dropperY - 17);

    // 5. INDIKATOR PUTARAN RODA HANDEL LARAS
    const hwX = 172 + 88 + 14;
    const hwLabelY = 28;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = isRetract ? "#f59e0b" : "#4ade80";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hwX - 35, hwLabelY, 70, 14, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isRetract ? "#facc15" : "#4ade80";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(isRetract ? "⟲ Putar Mundur" : "⟳ Putar Maju", hwX, hwLabelY + 10);

    // 6. MINI METERAN KEDALAMAN (DEPTH PROGRESS HUD)
    const meterX = 0;
    const meterY = 62;
    const meterW = 220;
    const meterH = 26;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(meterX - meterW / 2, meterY, meterW, meterH, [5]);
    ctx.fill();
    ctx.stroke();

    // Text baris atas
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`KEDALAMAN: ${holeDepth.toFixed(1)} mm / 9,0 mm (2/3 Tirus 60°)`, meterX, meterY + 11);

    // Progress bar latar
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(meterX - 90, meterY + 15, 180, 6);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(meterX - 90, meterY + 15, 180, 6);

    // Progress bar isi
    const pct = Math.max(0, Math.min(1, holeDepth / 9.0));
    ctx.fillStyle = (pct >= 0.95) ? "#22c55e" : "#38bdf8";
    ctx.fillRect(meterX - 90, meterY + 15, 180 * pct, 6);

    ctx.restore();
  }

  function renderCenterDrillInspection(p) {
    ctx.save();

    // 1. KARTU HUD ATAS (LANGKAH 4)
    const hudX = 0;
    const hudY = -128;
    const hudW = 350;
    const hudH = 50;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(hudX - hudW / 2, hudY, hudW, hudH, [8]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("LANGKAH 4: PEMERIKSAAN KUALITAS LUBANG SENTER 60° DIN 333 FORM A", hudX, hudY + 14);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("1. Laras kepala lepas ditarik mundur ke jarak aman, spindel mesin dimatikan.", hudX, hudY + 27);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText("2. Periksa ketepatan sudut konis 60° dan kedalaman 2/3 tirus menggunakan Mal Senter (Center Gauge).", hudX, hudY + 40);

    // 2. MAL SENTER 60° OTENTIK (PRECISION CENTER GAUGE / FISH TAIL GAUGE DIN EN ISO)
    // Mal senter diposisikan mengukur sudut lubang senter di muka poros (X = 75, Y = 0)
    const gaugeTipX = 75 - 4.5; // Ujung tirus 60° mal senter masuk menempel ke bidang konis lubang
    const gaugeBodyX = 85;
    const gaugeW = 36;
    const gaugeH = 46;

    // Plat Baja Tahan Karat Mengkilap (Ground Stainless Steel Plate)
    const gaugeGrad = ctx.createLinearGradient(gaugeBodyX, -gaugeH / 2, gaugeBodyX + gaugeW, gaugeH / 2);
    gaugeGrad.addColorStop(0, "#f8fafc");
    gaugeGrad.addColorStop(0.3, "#cbd5e1");
    gaugeGrad.addColorStop(0.7, "#94a3b8");
    gaugeGrad.addColorStop(1, "#64748b");

    ctx.fillStyle = gaugeGrad;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Ujung konis 60° masuk ke lubang
    ctx.moveTo(gaugeTipX, 0);
    ctx.lineTo(gaugeBodyX, -7.8); // 30° slope: 13.5 * tan(30°) = 7.8
    ctx.lineTo(gaugeBodyX, -gaugeH / 2);
    ctx.lineTo(gaugeBodyX + gaugeW, -gaugeH / 2);
    ctx.lineTo(gaugeBodyX + gaugeW, gaugeH / 2);
    ctx.lineTo(gaugeBodyX, gaugeH / 2);
    ctx.lineTo(gaugeBodyX, 7.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Skala Ukur Etsa Laser pada Plat Mal Senter
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.7;
    for (let gx = gaugeBodyX + 4; gx < gaugeBodyX + gaugeW - 4; gx += 4) {
      ctx.beginPath();
      ctx.moveTo(gx, -gaugeH / 2);
      ctx.lineTo(gx, -gaugeH / 2 + 5);
      ctx.moveTo(gx, gaugeH / 2);
      ctx.lineTo(gx, gaugeH / 2 - 5);
      ctx.stroke();
    }

    // Tulisan Grafir pada Mal Senter
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 6.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("60° DIN", gaugeBodyX + gaugeW / 2, -4);
    ctx.font = "6px JetBrains Mono, monospace";
    ctx.fillText("GAUGE", gaugeBodyX + gaugeW / 2, 6);

    // Titik Kontak Presisi Mal Senter pada Sudut Konis 60°
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(gaugeTipX + 3, -4.5, 2, 0, Math.PI * 2);
    ctx.arc(gaugeTipX + 3, 4.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Label Kontak Mal Senter
    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(gaugeBodyX - 10, -48, 110, 16, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("SUDUT KONIS 60° PASS ✔", gaugeBodyX + 45, -37);

    // 3. JENDELA KACA PEMBESAR CROSS-SECTION DIN 333-A (INSPECTION LOUPE)
    const loupeX = -70;
    const loupeY = 62;
    const loupeW = 200;
    const loupeH = 48;

    ctx.fillStyle = "rgba(11, 23, 44, 0.96)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(loupeX - loupeW / 2, loupeY, loupeW, loupeH, [6]);
    ctx.fill();
    ctx.stroke();

    // Header Jendela Loupe
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("DIAGRAM KUALITAS LUBANG DIN 333-A", loupeX, loupeY + 12);

    ctx.fillStyle = "#facc15";
    ctx.font = "7.5px JetBrains Mono, monospace";
    ctx.fillText("• Sudut Konis 60° Sesuai Mal Senter PASS ✔", loupeX, loupeY + 23);

    ctx.fillStyle = "#4ade80";
    ctx.font = "7.5px JetBrains Mono, monospace";
    ctx.fillText("• Kedalaman 2/3 Konis: h = 9,00 mm PASS ✔", loupeX, loupeY + 34);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "7px JetBrains Mono, monospace";
    ctx.fillText("• Lubang Pemandu ⌀3,15 mm Bersih Bebas Beram", loupeX, loupeY + 44);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS UNTUK OPERASI TIRUS
  // ---------------------------------------------------------------------------
  function renderTaperFormulaCard() {
    ctx.save();
    const cardX = -170;
    const cardY = -128;
    const cardW = 340;
    const cardH = 52;

    ctx.fillStyle = "rgba(11, 23, 44, 0.94)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("RUMUS KEMIRINGAN ERETAN ATAS: tan α = (D - d) / (2 · l)", 0, cardY + 16);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText("tan α = (60 - 26) / (2 · 30) = 34 / 60 = 0,567", 0, cardY + 31);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.fillText("α = arctan(0,567) ≈ 29,54°  =>  Disetel: α = 30°", 0, cardY + 45);

    ctx.restore();
  }

  function renderTaperDimensionLines() {
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.fillStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";

    // Panjang tirus l = 30 mm (dari X = 45 s.d. X = 75)
    ctx.beginPath();
    ctx.moveTo(45, -42);
    ctx.lineTo(75, -42);
    ctx.moveTo(45, -46);
    ctx.lineTo(45, -38);
    ctx.moveTo(75, -46);
    ctx.lineTo(75, -38);
    ctx.stroke();
    ctx.fillText("l = 30 mm", 60, -46);

    // Diameter Besar D = 60 mm (di bahu X = 45)
    ctx.beginPath();
    ctx.moveTo(35, -30);
    ctx.lineTo(35, 30);
    ctx.moveTo(31, -30);
    ctx.lineTo(39, -30);
    ctx.moveTo(31, 30);
    ctx.lineTo(39, 30);
    ctx.stroke();
    ctx.save();
    ctx.translate(29, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Ø D = 60 mm", 0, -3);
    ctx.restore();

    // Diameter Kecil d = 26 mm (di muka X = 75)
    ctx.beginPath();
    ctx.moveTo(85, -13);
    ctx.lineTo(85, 13);
    ctx.moveTo(81, -13);
    ctx.lineTo(89, -13);
    ctx.moveTo(81, 13);
    ctx.lineTo(89, 13);
    ctx.stroke();
    ctx.save();
    ctx.translate(95, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText("Ø d = 26 mm", 0, -3);
    ctx.restore();

    ctx.restore();
  }

  function renderTaperSwivelBaseHighlight() {
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    ctx.save();
    ctx.translate(carX, crossY);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -44);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    // Busur derajat melengkung ke kanan (+30°)
    ctx.arc(0, 0, 36, -Math.PI / 2, -Math.PI / 2 + (30 * Math.PI) / 180, false);
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.fillText("α = 30°", 12, -42);
    ctx.restore();
  }

  function renderTaperBoltHighlight(isLoose) {
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    ctx.save();
    ctx.translate(carX, crossY);
    const color = isLoose ? "#f59e0b" : "#10b981";

    [-17, 17].forEach((bx) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, 0, 8 + Math.sin(performance.now() * 0.006) * 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = color;
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(isLoose ? "2 BAUT KENDUR" : "2 BAUT TERKUNCI KUAT ✓", 0, -22);
    ctx.restore();
  }

  function renderTaperToolParallelAlignment() {
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    ctx.save();
    // 1. Garis referensi horisontal kesejajaran sumbu benda kerja
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(-115, 30);
    ctx.lineTo(110, 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Garis indikator sejajar pada badan pahat
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(carX - 25, crossY - 18);
    ctx.lineTo(carX + 25, crossY - 18);
    ctx.stroke();

    // 3. Badge Status Kesejajaran Pahat
    const badgeX = carX;
    const badgeY = crossY + 45;
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(badgeX - 105, badgeY - 12, 210, 24, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✓ PAHAT SEJAJAR SUMBU BENDA (0°)", badgeX, badgeY + 4);

    ctx.restore();
  }

  function renderTaperSwivelLoupe() {
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    ctx.save();
    const lx = carX - 65;
    const ly = crossY - 45;
    const lRad = 32;

    ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(carX, crossY);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.beginPath();
    ctx.arc(lx, ly, lRad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(lx, ly);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    for (let d = 0; d <= 45; d += 1) {
      const rad = (-Math.PI / 2) + ((d - 30) * 0.06);
      const isMajor = d % 10 === 0;
      const isTarget = d === 30;
      const len = isTarget ? 14 : (isMajor ? 10 : 5);
      ctx.strokeStyle = isTarget ? "#ef4444" : (isMajor ? "#f8fafc" : "#64748b");
      ctx.lineWidth = isTarget ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * (lRad - 2 - len), Math.sin(rad) * (lRad - 2 - len));
      ctx.lineTo(Math.cos(rad) * (lRad - 2), Math.sin(rad) * (lRad - 2));
      ctx.stroke();

      if (d === 0 || d === 15 || d === 30 || d === 45) {
        ctx.fillStyle = isTarget ? "#ef4444" : "#cbd5e1";
        ctx.font = "bold 7px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${d}°`, Math.cos(rad) * (lRad - 20), Math.sin(rad) * (lRad - 20));
      }
    }

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(0, -lRad + 2);
    ctx.lineTo(-4, -lRad + 10);
    ctx.lineTo(4, -lRad + 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("NONIUS: 30° KE ARAH KANAN", lx, ly + lRad + 12);

    ctx.restore();
  }

  function renderTouchZeroIndicator(x, y) {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      spawnChip(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, COLORS.sparkChip);
    }
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x - 70, y - 48, 140, 22, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("DRO: X0 = 0.00 | Z0 = 0.00", x, y - 34);
    ctx.restore();
  }

  function renderCarriageLockIndicator() {
    const carX = -30 + (animState.toolZ - 90) * 0.74;

    ctx.save();
    ctx.translate(carX, 0);

    ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(15, 60, 120, 20, [4]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CARRIAGE LOCKED 🔒", 75, 74);

    ctx.fillStyle = "#38bdf8";
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(0, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-3, 22);
    ctx.lineTo(0, 16);
    ctx.lineTo(3, 22);
    ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.fillText("ap = 0,5 mm", 32, 28);

    ctx.restore();
  }

  function renderTaperFeedIndicator(cutPt) {
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;

    ctx.save();
    ctx.translate(carX, crossY);
    // Kemiringan visual eretan atas miring ke kanan (+30° dari sumbu poros / 60.46° dari vertikal)
    const visualAngleDeg = (animState.eretanAngle / 30) * 60.46;
    const angleRad = (visualAngleDeg * Math.PI) / 180;
    ctx.rotate(angleRad);

    // Panah gerakan pemakanan ditarik mundur (retract feed ke arah +Y)
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(22, -45);
    ctx.lineTo(22, 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Kepala panah mengarah MUNDUR (ke arah belakang / operator)
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(17, 5);
    ctx.lineTo(22, 16);
    ctx.lineTo(27, 5);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("FEED DITARIK MUNDUR ➔", 28, -14);

    ctx.restore();
  }

  function renderBevelProtractorInspection() {
    ctx.save();
    const p1 = { x: 75, y: 13 };
    const p2 = { x: 45, y: 30 };
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const bladeAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(bladeAngle);

    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(-52, -2, 104, 5);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.strokeRect(-52, -2, 104, 5);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.6;
    for (let bx = -48; bx <= 48; bx += 4) {
      ctx.beginPath();
      ctx.moveTo(bx, -2);
      ctx.lineTo(bx, 1);
      ctx.stroke();
    }

    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(0, 20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(0, 20, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("30° 00'", 0, 20);

    ctx.restore();

    const badgeX = 55;
    const badgeY = 72;
    ctx.fillStyle = "rgba(6, 78, 59, 0.95)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX - 85, badgeY - 14, 170, 28, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✓ SUDUT 30° SESUAI PRESISI", badgeX, badgeY - 2);
    ctx.fillStyle = "#a7f3d0";
    ctx.font = "8px JetBrains Mono, monospace";
    ctx.fillText("D = 60 mm | d = 26 mm | l = 30 mm", badgeX, badgeY + 9);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // HELPER VISUAL OVERLAYS & ALAT BANTU UNTUK PEMBUBUTAN ULIR METRIS (THREADING)
  // ---------------------------------------------------------------------------

  // 1. Langkah 1: Pemasangan Pahat Ulir 60° & Pengecekan dengan Mal Ulir (Center Gauge)
  function renderThreadGaugeAlignment(p) {
    const carX = -30 + (animState.toolZ - 90) * 0.74;
    const crossY = 32 + (animState.toolX - 60) * 0.44;
    const toolTipX = carX - 8;
    const toolTipY = crossY - 58;

    ctx.save();

    // Titik referensi & parameter Mal Ulir (Center Gauge 60° / Fish Gauge)
    const gx = 25;
    const gy = 30; // menempel lurus pada permukaan silinder benda kerja Y = 30
    const gw = 52;
    const gh = 22;
    const apexX = 25;
    const apexY = 41; // Sudut puncak celah V 60°

    // Opasitas Mal Ulir: Tampak penuh di Fase 1 & 2, memudar halus di Fase 3a saat pahat mundur, hilang saat eretan meluncur ke kanan
    const gaugeAlpha = p < 0.70 ? 1.0 : (p < 0.78 ? Math.max(0, (0.78 - p) / 0.08) : 0);

    if (gaugeAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = gaugeAlpha;

      // -----------------------------------------------------------------------
      // A. Menggambar Mal Ulir Presisi Standar DIN EN ISO 60° (Fish Gauge)
      // -----------------------------------------------------------------------
      // Gradien Plat Baja Karbon Mengkilap (Stainless Chrome Tempered Steel)
      const gaugeGrad = ctx.createLinearGradient(gx - gw / 2, gy, gx + gw / 2, gy + gh);
      gaugeGrad.addColorStop(0, "#cbd5e1");
      gaugeGrad.addColorStop(0.3, "#f8fafc");
      gaugeGrad.addColorStop(0.65, "#94a3b8");
      gaugeGrad.addColorStop(1, "#cbd5e1");

      ctx.fillStyle = gaugeGrad;
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Tepi atas: datum referensi lurus menempel pada silinder benda kerja Y = gy
      ctx.moveTo(gx - gw / 2, gy);
      ctx.lineTo(gx + gw / 2 - 6, gy);
      // Ujung runcing depan (kanan) bersudut 60°
      ctx.lineTo(gx + gw / 2, gy + gh / 2);
      ctx.lineTo(gx + gw / 2 - 6, gy + gh);
      // Tepi bawah dengan Celah V 60° (Takik Mal Ulir)
      ctx.lineTo(gx + 7, gy + gh);
      ctx.lineTo(apexX, apexY); // Apex takik V 60° di (25, 41)
      ctx.lineTo(gx - 7, gy + gh);
      ctx.lineTo(gx - gw / 2 + 5, gy + gh);
      // Takik ekor ikan (fish tail) di kiri
      ctx.lineTo(gx - gw / 2, gy + gh - 4);
      ctx.lineTo(gx - gw / 2 + 5, gy + gh / 2);
      ctx.lineTo(gx - gw / 2, gy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bevel refleksi dalam
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(gx - gw / 2 + 1, gy + 1);
      ctx.lineTo(gx + gw / 2 - 7, gy + 1);
      ctx.lineTo(gx + gw / 2 - 1, gy + gh / 2);
      ctx.stroke();

      // Garis Graduasi Skala Milimeter pada Tepi Mal Ulir
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 0.6;
      for (let sx = -18; sx <= 18; sx += 3.5) {
        if (Math.abs(sx) > 3) {
          ctx.beginPath();
          ctx.moveTo(gx + sx, gy);
          ctx.lineTo(gx + sx, gy + (Math.abs(sx) % 7 === 0 ? 4 : 2.5));
          ctx.stroke();
        }
      }

      // Tulisan Engraving pada Mal Ulir
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 6.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("60° METRIC", gx, gy + 8);
      ctx.font = "5px JetBrains Mono, monospace";
      ctx.fillText("DIN EN ISO", gx, gy + 14);

      ctx.restore();
    }

    // Helper banner renderer di bagian atas kanvas
    function renderStep1Banner(title, desc, strokeColor, bgColor, textColor) {
      const bannerX = -170;
      const bannerY = -128;
      const bannerW = 340;
      const bannerH = 48;

      ctx.fillStyle = bgColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, [6]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(title, 0, bannerY + 16);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "7.5px JetBrains Mono, monospace";
      ctx.fillText(desc, 0, bannerY + 33);
    }

    if (p < 0.35) {
      // =======================================================================
      // FASE 1 (0.00 <= p < 0.35): Eretan & Pahat Meluncur Menuju Mal Ulir
      // =======================================================================
      // Garis trajektori lintasan gerakan pahat mendekati takik V
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(toolTipX, toolTipY);
      ctx.lineTo(apexX, apexY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Chevron panah arah luncur pahat
      const t = (performance.now() * 0.003) % 1;
      const cx = toolTipX + (apexX - toolTipX) * t;
      const cy = toolTipY + (apexY - toolTipY) * t;
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Target reticle lingkaran berdenyut di celah V 60°
      const pulse = Math.sin(performance.now() * 0.008) * 2;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(apexX, apexY, 6 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Panah indikator pendekatan
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(apexX, apexY + 2);
      ctx.lineTo(apexX - 4, apexY + 9);
      ctx.lineTo(apexX + 4, apexY + 9);
      ctx.closePath();
      ctx.fill();

      renderStep1Banner(
        "➔ LANGKAH 1A: PENDEKATAN PAHAT MENUJU MAL ULIR (CENTER GAUGE)",
        "Eretan memanjang & melintang menggerakkan pahat mendekati celah V 60° untuk kalibrasi sudut...",
        "#0284c7",
        "rgba(8, 47, 73, 0.95)",
        "#38bdf8"
      );

    } else if (p < 0.70) {
      // =======================================================================
      // FASE 2 (0.35 <= p < 0.70): Pahat Masuk Presisi di Takik V 60° — Hasil 90° Siku Diperlihatkan
      // =======================================================================
      // 1. Sorotan Garis Kontak Flank 60° Pas Sempurna Tanpa Celah Cahaya
      ctx.save();
      ctx.strokeStyle = "#10b981";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(apexX - 7, gy + gh);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(apexX + 7, gy + gh);
      ctx.stroke();
      ctx.restore();

      // Label "Tanpa Celah Cahaya" di samping takik V
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("✓ TANPA CELAH CAHAYA (0 mm)", apexX + 11, apexY + 5);

      // 2. Garis Referensi Sumbu Benda Kerja (Datum Horisontal Y = 30)
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(-15, gy);
      ctx.lineTo(65, gy);
      ctx.stroke();

      // 3. Garis Sumbu Pahat (Datum Vertikal X = 25)
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(apexX, gy - 12);
      ctx.lineTo(apexX, gy + gh + 14);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Lambang Siku Sempurna 90° (Right Angle Perpendicular Symbol)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(apexX, gy + 7);
      ctx.lineTo(apexX + 7, gy + 7);
      ctx.lineTo(apexX + 7, gy);
      ctx.stroke();

      // Titik pusat siku
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(apexX + 3.5, gy + 3.5, 1, 0, Math.PI * 2);
      ctx.fill();

      // Label Sudut 90° Siku Tegak Lurus
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 8px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("90° TEGAK LURUS", apexX + 10, gy + 4);

      // 5. Pembagian Sudut Simetris 30° / 30° pada Sayap Pahat (Flank Symmetry)
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(apexX, apexY, 12, Math.PI * 0.5, Math.PI * 0.5 + (30 * Math.PI) / 180);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(apexX, apexY, 12, Math.PI * 0.5 - (30 * Math.PI) / 180, Math.PI * 0.5);
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.font = "bold 6.5px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText("30°", apexX - 3, apexY + 11);
      ctx.textAlign = "left";
      ctx.fillText("30°", apexX + 3, apexY + 11);

      // 6. Animasi Pengencangan Baut Toolpost saat Pahat Terkalibrasi
      if (p >= 0.40 && p < 0.68) {
        ctx.save();
        // Lokasi baut penjepit di toolpost
        const tpX = carX - 13;
        const tpY = crossY - 18;
        ctx.translate(tpX, tpY);
        const wrenchSwing = Math.sin(performance.now() * 0.01) * 0.35;
        ctx.rotate(wrenchSwing);
        renderWrenchIcon();
        ctx.restore();

        ctx.fillStyle = "#facc15";
        ctx.font = "bold 7px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("Kencangkan Baut Toolpost ✓", carX + 8, crossY + 6);
      }

      renderStep1Banner(
        "✓ LANGKAH 1B: HASIL PENYETELAN — TEGAK LURUS 90° SEMPURNA TERHADAP BENDA KERJA",
        "Pahat pas rapat di celah V 60° tanpa celah cahaya | Sudut sayap simetris 30°/30° | Baut toolpost dikunci kuat",
        "#10b981",
        "rgba(6, 78, 59, 0.95)",
        "#34d399"
      );

    } else {
      // =======================================================================
      // FASE 3 (0.70 <= p <= 1.00): Eretan Bergeser Menuju Posisi Awal Ulir (Kanan Benda)
      // =======================================================================
      // 1. Garis Lintasan Luncur ke Kanan Benda (Z: 175 -> 247)
      ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(25, 41);
      ctx.lineTo(82, 38);
      ctx.stroke();
      ctx.setLineDash([]);

      // Kepala Panah Luncur Balik ke Kanan
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(82, 38);
      ctx.lineTo(76, 34);
      ctx.lineTo(76, 42);
      ctx.closePath();
      ctx.fill();

      // Animated traveling dot along return path
      const t3 = (performance.now() * 0.003) % 1;
      const dotX = 25 + (82 - 25) * t3;
      const dotY = 41 + (38 - 41) * t3;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Garis Batas Muka Kanan Benda Kerja (X = 75 mm / Titik Awal Ulir)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(75, -34);
      ctx.lineTo(75, 46);
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("Muka Kanan (X = 75 mm)", 78, -26);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "6.5px JetBrains Mono, monospace";
      ctx.fillText("Titik Awal Pemakanan Ulir", 78, -17);

      renderStep1Banner(
        "➔ LANGKAH 1C: ERETAN BERGESER KE POSISI AWAL ULIR (SISI KANAN BENDA)",
        "Penyetelan sukses! Pahat bebas meluncur ke awal ulir (Z=247 / X0=75 mm) siap untuk siklus penyayatan bertahap",
        "#f59e0b",
        "rgba(69, 26, 3, 0.94)",
        "#fbbf24"
      );
    }

    ctx.restore();
  }

  // 2. Langkah 2: Kartu Penyetelan Gearbox Kisar Ulir & Poros Transportir
  function renderThreadGearboxCard(p) {
    ctx.save();
    const cardX = -170;
    const cardY = -128;
    const cardW = 340;
    const cardH = 54;

    ctx.fillStyle = "rgba(11, 23, 44, 0.95)";
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("KOTAK RODA GIGI TRANSPORTIR (QUICK-CHANGE GEARBOX)", 0, cardY + 16);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText("Kisar Nominal: P = 2,0 mm  |  Poros Transportir: 4 TPI Sinkron", 0, cardY + 31);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 10.5px JetBrains Mono, monospace";
    ctx.fillText("Kedalaman Ulir: H = 0,6134 · P = 1,23 mm (Metris Kasar M20x2.0)", 0, cardY + 46);

    ctx.restore();
  }

  // 3. Langkah 3: Indikator Touching Nol di Sisi Kanan Benda
  function renderThreadTouchZeroIndicator(cutPt) {
    ctx.save();
    const touchX = 75;
    const touchY = 30;

    // Efek Sentuhan Percikan Nol
    for (let i = 0; i < 4; i++) {
      spawnChip(touchX + (Math.random() - 0.5) * 4, touchY + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 25, COLORS.sparkChip);
    }

    // Panah Penunjuk Awal Pemotongan dari Kanan Benda
    ctx.strokeStyle = "#facc15";
    ctx.fillStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(touchX + 45, touchY + 32);
    ctx.lineTo(touchX + 10, touchY + 32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(touchX + 16, touchY + 28);
    ctx.lineTo(touchX + 8, touchY + 32);
    ctx.lineTo(touchX + 16, touchY + 36);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 8.5px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("TITIK AWAL PEMAKANAN", touchX + 48, touchY + 35);

    // Badge Sentuh Nol DRO
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(touchX - 70, touchY - 48, 150, 24, [5]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("DRO: X0 = 0.00 | Z0 = 0.00", touchX + 5, touchY - 33);

    ctx.restore();
  }

  // 4. Langkah 4, 5, 6, 7: Indikator Lintasan Pemotongan Ulir Bertahap
  function renderThreadPassIndicator(passNum, ap, cutPt) {
    ctx.save();
    const bannerX = -135;
    const bannerY = -128;
    const bannerW = 270;
    const bannerH = 46;

    const isPhase2 = animState.isThreadingRetracting || (stepProgress !== undefined && stepProgress >= 0.60 && stepProgress < 0.74);
    const isPhase3 = animState.isThreadingReturning || (stepProgress !== undefined && stepProgress >= 0.74);
    const isPhase1 = !isPhase2 && !isPhase3;

    const borderColor = isPhase3 ? "#10b981" : isPhase2 ? "#fb923c" : (passNum === 4 ? "#10b981" : "#a855f7");

    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = passNum === 4 ? "#34d399" : "#c084fc";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`LINTASAN ${passNum}/4: SAYATAN BERTAHAP (ap = ${ap})`, 0, bannerY + 16);

    const statusText = passNum === 1 ? "Goresan Awal Tipis" : passNum === 2 ? "Sayatan Kasar Pertama" : passNum === 3 ? "Semi-Finishing Flank" : "Finishing & Spring Pass";

    if (isPhase2) {
      ctx.fillStyle = "#fb923c";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("Fase 2: Pembebasan Pahat Radial (Retract Outward)", 0, bannerY + 32);

      // Panah Arah Pembebasan Radial (Tegak Lurus Poros ke Luar) di alur pembebas X = -35
      ctx.strokeStyle = "#fb923c";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(-35, 34);
      ctx.lineTo(-35, 54);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.moveTo(-39, 48);
      ctx.lineTo(-35, 56);
      ctx.lineTo(-31, 48);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("⇩ PEMBEBASAN PAHAT SECARA RADIAL (HALF-NUT DISENGAGED)", 0, 68);
    } else if (isPhase3) {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("Fase 3: Eretan Kembali ke Kanan Benda (Rapid Return)", 0, bannerY + 32);

      // Panah Arah Luncur Balik ke Kanan (Smooth Rapid Return)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(-35, 48);
      ctx.lineTo(80, 48);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(74, 43);
      ctx.lineTo(84, 48);
      ctx.lineTo(74, 53);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("⇨ ERETAN KEMBALI KE POSISI AWAL DENGAN SMOOTH", 20, 62);
    } else {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText(`Fase 1: ${statusText} (Feed Kanan ke Kiri)`, 0, bannerY + 32);

      // Panah Arah Pemakanan Otomatis dari Kanan ke Kiri
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(85, 48);
      ctx.lineTo(-45, 48);
      ctx.stroke();
      ctx.setLineDash([]);

      // Kepala Panah Mengarah ke Kiri (Menuju Cekam)
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(-40, 43);
      ctx.lineTo(-50, 48);
      ctx.lineTo(-40, 53);
      ctx.closePath();
      ctx.fill();

      ctx.font = "bold 8.5px JetBrains Mono, monospace";
      ctx.fillText("⇦ FEED TRANSPORTIR: DARI KANAN KE KIRI (HALF-NUT ENGAGED)", 20, 62);
    }

    ctx.restore();
  }

  // 5. Langkah 8: Pemeriksaan Ulir Menggunakan Mal Kisar Ulir & Mur Standar
  function renderThreadInspection(p) {
    ctx.save();
    const tx = 20;
    const ty = 30;

    // Gambar Mal Kisar Ulir (Screw Pitch Gauge P = 2.0 mm)
    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx - 35, ty + 18);
    ctx.lineTo(tx + 35, ty + 18);
    ctx.lineTo(tx + 30, ty + 6);
    // Gigi-gigi serrasi mal kisar yang pas di alur ulir
    for (let gx = 30; gx >= -30; gx -= 6.5) {
      ctx.lineTo(tx + gx - 3.25, ty - 2);
      ctx.lineTo(tx + gx - 6.5, ty + 6);
    }
    ctx.lineTo(tx - 35, ty + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 7.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("PITCH 2.00 mm", tx, ty + 14);

    // Gambar Mur Standar M20 (Hex Nut Test) yang terpasang sebagian pada ulir
    const nutX = -10;
    const nutW = 18;
    const nutH = 68; // diameter luar mur ~34 mm
    const nutGrad = ctx.createLinearGradient(nutX, -nutH / 2, nutX + nutW, nutH / 2);
    nutGrad.addColorStop(0, "#94a3b8");
    nutGrad.addColorStop(0.3, "#f8fafc");
    nutGrad.addColorStop(0.7, "#cbd5e1");
    nutGrad.addColorStop(1, "#475569");

    ctx.fillStyle = nutGrad;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(nutX, -nutH / 2, nutW, nutH, [3]);
    ctx.fill();
    ctx.stroke();

    // Chamfer dan Alur Mur Segi Enam
    ctx.strokeStyle = "rgba(15, 23, 42, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(nutX + 4, -nutH / 2);
    ctx.lineTo(nutX + 4, nutH / 2);
    ctx.moveTo(nutX + nutW - 4, -nutH / 2);
    ctx.lineTo(nutX + nutW - 4, nutH / 2);
    ctx.stroke();

    // Teks Mur
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 7px JetBrains Mono, monospace";
    ctx.save();
    ctx.translate(nutX + nutW / 2, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillText("MUR M20x2.0", 0, 2.5);
    ctx.restore();

    // Badge Hasil Pemeriksaan Presisi
    const badgeX = 5;
    const badgeY = 82;
    ctx.fillStyle = "rgba(6, 78, 59, 0.95)";
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX - 110, badgeY - 14, 220, 28, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("✓ HASIL ULIR METRIS M20x2.0 PRESISI (PASS)", badgeX, badgeY - 2);
    ctx.fillStyle = "#a7f3d0";
    ctx.font = "8px JetBrains Mono, monospace";
    ctx.fillText("Kisar P = 2,0 mm | H = 1,23 mm | Flank 60° Simetris", badgeX, badgeY + 9);

    ctx.restore();
  }

  function renderGlowingCallout(x, y, text) {
    ctx.save();
    ctx.font = "bold 11px Inter, sans-serif";
    const tw = ctx.measureText(text).width;
    const pad = 8;

    // Glowing badge background
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - pad, y - 12 - pad, tw + pad * 2, 24 + pad, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // =========================================================================
  // =========================================================================
  // MESIN FRAIS 3D ISOMETRIS BERPRESISI TINGGI (HIGH-DEFINITION 3D MILLING)
  // Dilengkapi: Mode Pandangan Terfokus Pemesinan (2.05x Close-Up Zoom),
  // Anatomi Otentik Pahat (End Mill Heliks 4-Flute TiAlN & Pahat Frais Alur T DIN 851),
  // Kinematika Meja Sumbu Z Naik-Turun, Vektor Gerak Makan Meja, Rotasi Spindel CW,
  // Kontak Zona Geser Panas, Percikan Tatal Spiral, dan Irisan Visual Profil Alur T.
  // =========================================================================

  let millingZoomMode = "focus"; // "focus" (default close-up 2.05x) atau "overview" (1.0x full machine)

  // Konstanta proyeksi isometris teknis standar (Sudut 30° / -30° / 90° tegak lurus)
  const ISO_C = 0.866025; // cos(30°)
  const ISO_S = 0.5;      // sin(30°)

  // Konversi koordinat 3D ruang mesin (X: memanjang meja, Y: melintang pelana, Z: vertikal)
  // ke koordinat 2D kanvas layar
  function isoPt(x, y, z) {
    return {
      x: (x - y) * ISO_C,
      y: (x + y) * ISO_S - z
    };
  }

  // Helper untuk menggambar balok 3D isometris solid dengan shading 3 bidang presisi
  function drawIsoBox(x, y, z, dx, dy, dz, topColor, frontColor, sideColor, strokeColor, lineWidth) {
    const p000 = isoPt(x, y, z);
    const p100 = isoPt(x + dx, y, z);
    const p110 = isoPt(x + dx, y + dy, z);
    const p010 = isoPt(x, y + dy, z);

    const p001 = isoPt(x, y, z + dz);
    const p101 = isoPt(x + dx, y, z + dz);
    const p111 = isoPt(x + dx, y + dy, z + dz);
    const p011 = isoPt(x, y + dy, z + dz);

    // Bidang Atas (+Z top face)
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(p001.x, p001.y);
    ctx.lineTo(p101.x, p101.y);
    ctx.lineTo(p111.x, p111.y);
    ctx.lineTo(p011.x, p011.y);
    ctx.closePath();
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth || 0.8;
      ctx.stroke();
    }

    // Bidang Depan-Kanan (+Y front face)
    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(p010.x, p010.y);
    ctx.lineTo(p110.x, p110.y);
    ctx.lineTo(p111.x, p111.y);
    ctx.lineTo(p011.x, p011.y);
    ctx.closePath();
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth || 0.8;
      ctx.stroke();
    }

    // Bidang Samping-Kanan (+X side face)
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(p100.x, p100.y);
    ctx.lineTo(p110.x, p110.y);
    ctx.lineTo(p111.x, p111.y);
    ctx.lineTo(p101.x, p101.y);
    ctx.closePath();
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth || 0.8;
      ctx.stroke();
    }
  }

  // Helper untuk silinder vertikal 3D isometris (Spindle, Quill, Arbor, Endmill, Cutter)
  function drawIsoCylinder(cx, cy, zBase, radius, height, bodyColor, topColor, strokeColor, segs = 24) {
    const topArr = [];
    const botArr = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const lx = cx + Math.cos(a) * radius;
      const ly = cy + Math.sin(a) * radius;
      topArr.push(isoPt(lx, ly, zBase + height));
      botArr.push(isoPt(lx, ly, zBase));
    }

    let minIdx = 0, maxIdx = 0;
    for (let i = 1; i < segs; i++) {
      if (topArr[i].x < topArr[minIdx].x) minIdx = i;
      if (topArr[i].x > topArr[maxIdx].x) maxIdx = i;
    }

    // Dinding silinder
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(topArr[minIdx].x, topArr[minIdx].y);
    for (let i = minIdx; i !== maxIdx; i = (i + 1) % segs) {
      ctx.lineTo(topArr[i].x, topArr[i].y);
    }
    ctx.lineTo(topArr[maxIdx].x, topArr[maxIdx].y);
    ctx.lineTo(botArr[maxIdx].x, botArr[maxIdx].y);
    for (let i = maxIdx; i !== minIdx; i = (i - 1 + segs) % segs) {
      ctx.lineTo(botArr[i].x, botArr[i].y);
    }
    ctx.lineTo(botArr[minIdx].x, botArr[minIdx].y);
    ctx.closePath();
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Bidang Muka Atas
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(topArr[0].x, topArr[0].y);
    for (let i = 1; i <= segs; i++) {
      ctx.lineTo(topArr[i].x, topArr[i].y);
    }
    ctx.closePath();
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // FUNGSI UTAMA PERAKITAN MESIN FRAIS 3D ISOMETRIS
  function renderMillingAssembly() {
    ctx.save();

    // -------------------------------------------------------------------------
    // KAMERA & TRANSFORMASI PANDANGAN (VIEWPORT ZOOM & FRAMING)
    // -------------------------------------------------------------------------
    // "millingZoomMode === 'focus'": Pandangan Terfokus Pemesinan (2.05x Close-Up)
    // Sumbu Spindel & Titik Kontak Pemotongan terpusat sempurna, pisau endmill tampak
    // besar, jelas, dan proses penyayatan terlihat dinamis tanpa terhalang.
    if (millingZoomMode === "focus") {
      ctx.translate(0, 36);
      ctx.scale(2.05, 2.05);
    } else {
      ctx.translate(0, -10);
      ctx.scale(1.0, 1.0);
    }

    const currentStep = (currentOperation && currentOperation.steps) 
      ? (currentOperation.steps[currentStepIdx] || {}) 
      : {};

    // Ketinggian penaikan lutut meja (Knee/Table Z Elevation)
    // Sumbu Z Meja Naik Membawa Benda Kerja Mendekati Pisau!
    const rawQuillZ = animState.quillZ !== undefined ? animState.quillZ : 70;
    const tableElevZ = Math.max(0, (70 - rawQuillZ) * 0.42);

    // Posisi Meja Memanjang (Sumbu X) dan Melintang (Sumbu Y)
    const tblX = (animState.tableX || 0) * 1.35;
    const tblY = (animState.tableY || 0) * 0.75;

    // 1. Kolom Tegak & Landasan Bawah (Latar Belakang Mesin)
    renderMillingIsoColumnAndBase(tableElevZ);

    // 2. Lengan Mendatar (Ram) & Kepala Frais
    renderMillingIsoRamAndHead();

    // 3. Lutut Cor (Knee) & Pelana (Saddle) yang Bergerak Naik-Turun Sumbu Z
    renderMillingIsoKneeAndSaddle(tableElevZ, tblY);

    // 4. Meja Frais Isometris 3D dengan 3 Alur T & Roda Pemutar
    renderMillingIsoTable(tableElevZ, tblX, tblY);

    // 5. Alat Cekam: Ragum Presisi (+Bilah Paralel) atau Kepala Pembagi (Dividing Head)
    renderMillingIsoWorkholding(tableElevZ, tblX, tblY);

    // 6. Benda Kerja Solid Isometris 3D dengan Sayatan Dinamis Sesuai Arah Pemakanan
    renderMillingIsoWorkpiece(tableElevZ, tblX, tblY);

    // 7. Spindel, Kolet ER32 & Anatomi Pisau Frais Berpresisi Tinggi
    renderMillingIsoSpindleAndCutter();

    // 8. Visualisasi Dinamis Proses Penyayatan:
    // Rotasi Spindel CW, Panah Gerak Makan Meja, Zona Geser Panas, dan Dimensi ap/ae
    renderMillingIsoCuttingAction(tableElevZ, tblX, tblY);

    // 9. Selang Pendingin Fleksibel Isometris 3D (Loc-Line Coolant Hose)
    if (animState.coolantOn) {
      renderMillingIsoCoolant();
    }

    // 10. Anotasi Langkah & Alat Ukur Interaktif Isometris 3D
    renderMillingIsoStepAnnotations(currentStep, tableElevZ, tblX, tblY);

    ctx.restore();

    // 11. HUD Panel Informasi Pahat & Proses Sayatan (Dirender di Koordinat Layar)
    renderMillingIsoToolingHUD();
  }

  // 1. Landasan Kaki Cor & Kolom Utama Isometris 3D
  function renderMillingIsoColumnAndBase(tableElevZ) {
    ctx.save();

    // A. Landasan Kaki Bawah Besi Cor (Cast Iron Base Footing)
    drawIsoBox(-150, -140, -145, 230, 200, 25, "#334155", "#1e293b", "#0f172a", "#475569");

    // Palung Penampung Pendingin & Tatal (Coolant Sump Tray)
    drawIsoBox(-140, -130, -120, 210, 180, 8, "#090d16", "#1e293b", "#1e293b", "#334155");

    // B. Kolom Vertikal Utama Mesin Frais 3D (Heavy Vertical Column)
    // Terletak di belakang-kiri sumbu spindel: X: -130 s.d. -20, Y: -125 s.d. -25
    drawIsoBox(-130, -125, -112, 110, 100, 255, "#334155", "#1e293b", "#0f172a", "#475569");

    // Jalur Pemandu Vertikal Ekor Burung (Vertical Dovetail Guideways)
    drawIsoBox(-22, -100, -85, 8, 75, 195, "#64748b", "#475569", "#334155", "#94a3b8");

    // Alur Pelumasan Presisi & Wiper Minyak
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 1;
    for (let wz = -60; wz <= 90; wz += 30) {
      const wp1 = isoPt(-22, -95, wz);
      const wp2 = isoPt(-14, -30, wz);
      ctx.beginPath();
      ctx.moveTo(wp1.x, wp1.y);
      ctx.lineTo(wp2.x, wp2.y);
      ctx.stroke();
    }

    // Plat Nama & Spesifikasi Mesin Frais (Nameplate)
    const npPt = isoPt(-75, -24, 75);
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.roundRect(npPt.x - 22, npPt.y - 12, 44, 24, [3]);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 6.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MILL-TECH", npPt.x, npPt.y - 1);
    ctx.fillStyle = "#bae6fd";
    ctx.font = "5px JetBrains Mono, monospace";
    ctx.fillText("ISO-40 / 3-AXIS", npPt.x, npPt.y + 7);

    // C. Poros Ulir Pengangkat Lutut Meja Teleskopik (Knee Elevating Leadscrew)
    const screwH = 80 + tableElevZ * 0.85;
    drawIsoCylinder(-15, -45, -112, 9, screwH, "#94a3b8", "#cbd5e1", "#475569");

    // Ulir Trapesium Pengangkat Lutut (Trapezoidal Knee Threads)
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.2;
    for (let tz = -105; tz < -112 + screwH - 6; tz += 5) {
      const th1 = isoPt(-24, -45, tz);
      const th2 = isoPt(-6, -45, tz + 2.5);
      ctx.beginPath();
      ctx.moveTo(th1.x, th1.y);
      ctx.lineTo(th2.x, th2.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 2. Lengan Mendatar (Overarm / Ram) & Kepala Frais Isometris 3D
  function renderMillingIsoRamAndHead() {
    ctx.save();

    // A. Lengan Mendatar (Ram) di Atas Kolom
    drawIsoBox(-120, -115, 143, 120, 115, 42, "#475569", "#334155", "#1e293b", "#64748b");

    // B. Kepala Frais Vertikal (Vertical Milling Head Housing)
    drawIsoBox(-40, -42, 130, 80, 84, 55, "#334155", "#1e293b", "#0f172a", "#475569");

    // Tutup Motor Penggerak Spindel & Kotak Roda Gigi
    drawIsoCylinder(0, 0, 185, 24, 30, "#1e293b", "#334155", "#475569");

    // Plat Skala Derajat Kemiringan Kepala Frais (Swivel Degree Plate)
    const degPt = isoPt(20, -2, 148);
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(degPt.x, degPt.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 5.5px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("0°", degPt.x, degPt.y + 2);

    // Handel Penurun Pinola Manual (Quill Fine Feed Handwheel)
    const hwPt = isoPt(38, -5, 138);
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(hwPt.x, hwPt.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  // 3. Lutut Cor (Knee) & Pelana (Saddle) yang Bergerak Naik-Turun Sumbu Z
  function renderMillingIsoKneeAndSaddle(tableElevZ, tblY) {
    ctx.save();

    // Elevasi Dasar Lutut (Knee Base Z)
    const kneeZ = -95 + tableElevZ;

    // A. Lutut Besi Cor (Cast Iron Knee Casting)
    drawIsoBox(-90, -95, kneeZ, 115, 115, 50, "#334155", "#1e293b", "#0f172a", "#475569");

    // Jalur Pemandu Mendatar Pelana (Saddle Dovetail Ways) di Atas Lutut
    drawIsoBox(-70, -80, kneeZ + 50, 95, 95, 10, "#64748b", "#475569", "#334155", "#94a3b8");

    // Engkol Pemutar Penaikan Lutut Sumbu Z (Knee Elevating Crank)
    const crankCenter = isoPt(-20, 22, kneeZ + 20);
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.arc(crankCenter.x, crankCenter.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Gagang Engkol Pemutar Vertikal Berputar Halus
    const crankAngle = tableElevZ * 0.45;
    const chX = crankCenter.x + Math.cos(crankAngle) * 16;
    const chY = crankCenter.y + Math.sin(crankAngle) * 16;
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(crankCenter.x, crankCenter.y);
    ctx.lineTo(chX, chY);
    ctx.stroke();

    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.arc(chX, chY, 4, 0, Math.PI * 2);
    ctx.fill();

    // B. Pelana (Saddle) yang Meluncur Melintang Sumbu Y
    const saddleZ = kneeZ + 60;
    drawIsoBox(-75, -60 + tblY, saddleZ, 110, 85, 12, "#475569", "#334155", "#1e293b", "#64748b");

    ctx.restore();
  }

  // 4. Meja Frais Isometris 3D dengan 3 Alur T & Roda Pemutar
  function renderMillingIsoTable(tableElevZ, tblX, tblY) {
    ctx.save();

    const tableZ = -25 + tableElevZ;
    const tblW = 210;
    const tblD = 78;
    const tblH = 18;

    // Badan Meja Kerja Mesin Frais Besi Cor Presisi
    drawIsoBox(-tblW / 2 + tblX, -tblD / 2 + tblY, tableZ, tblW, tblD, tblH, "#64748b", "#334155", "#1e293b", "#94a3b8");

    // 3 Buah Alur T Standar (Standard T-Slots) pada Meja Frais
    const slotYs = [-tblD / 2 + tblY + 16, tblY, -tblD / 2 + tblY + tblD - 16];
    slotYs.forEach((sy) => {
      drawIsoBox(-tblW / 2 + tblX + 8, sy - 2.5, tableZ + tblH - 3.5, tblW - 16, 5, 4, "#0f172a", "#1e293b", "#090d16", "#38bdf8", 0.6);
    });

    // Roda Handel Pemutar Meja Kiri (Left Longitudinal Handwheel)
    const lWheelPt = isoPt(-tblW / 2 + tblX - 10, tblY, tableZ + tblH / 2);
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.ellipse(lWheelPt.x, lWheelPt.y, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Roda Handel Pemutar Meja Kanan (Right Longitudinal Handwheel)
    const rWheelPt = isoPt(tblW / 2 + tblX + 10, tblY, tableZ + tblH / 2);
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.ellipse(rWheelPt.x, rWheelPt.y, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // 5. Alat Cekam: Ragum Presisi (+Bilah Paralel) atau Kepala Pembagi (Dividing Head)
  function renderMillingIsoWorkholding(tableElevZ, tblX, tblY) {
    ctx.save();

    const opId = currentOperation ? currentOperation.id : "milling_face";
    const tableZ = -25 + tableElevZ;
    const tableTopZ = tableZ + 18;
    const viseW = 120;
    const viseD = 52;
    const viseH = 22;
    const viseX = -viseW / 2 + tblX;
    const viseY = -viseD / 2 + tblY;

    if (opId === "milling_segi_n" || opId === "milling_polygon" || opId === "milling_gear") {
      // -----------------------------------------------------------------------
      // KEPALA PEMBAGI UNIVERSAL ISOMETRIS 3D (DIVIDING HEAD & 3-JAW CHUCK)
      // -----------------------------------------------------------------------
      const dhX = -65 + tblX;
      const dhY = tblY;

      // Badan Cor Kepala Pembagi (Cast Iron Dividing Head Housing)
      drawIsoBox(dhX - 25, dhY - 22, tableTopZ, 30, 44, 38, "#475569", "#334155", "#1e293b", "#64748b");

      // Cekam 3-Rahang Mandiri (Self-Centering 3-Jaw Chuck)
      drawIsoCylinder(dhX + 8, dhY, tableTopZ + 19, 18, 12, "#cbd5e1", "#f8fafc", "#475569");

      // 3 Buah Rahang Baja Cekam yang Menjepit Benda Silindris
      [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach((ja) => {
        const jx = dhX + 8 + Math.cos(ja) * 11;
        const jy = dhY + Math.sin(ja) * 11;
        drawIsoBox(jx - 3, jy - 3, tableTopZ + 20, 6, 6, 8, "#f8fafc", "#0f172a", "#334155", "#cbd5e1");
      });

      // Piringan Pembagi Berlubang (Perforated Index Plate) di Sisi Depan
      const platePt = isoPt(dhX - 10, dhY + 23, tableTopZ + 19);
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(platePt.x, platePt.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lubang-Lubang Indeks Pembagi Presisi
      ctx.fillStyle = "#0f172a";
      for (let r = 5; r <= 11; r += 3) {
        const holes = r === 5 ? 8 : (r === 8 ? 12 : 16);
        for (let h = 0; h < holes; h++) {
          const ha = (h / holes) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(platePt.x + Math.cos(ha) * r, platePt.y + Math.sin(ha) * r, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Engkol Pembagi dengan Pen Indeks (Indexing Crank Handle)
      const curStepIdx = currentStepIdx || 0;
      const indexAngle = (curStepIdx * (Math.PI * 2) * 0.66) % (Math.PI * 2);
      const crankLen = 13;
      const chX = platePt.x + Math.cos(indexAngle) * crankLen;
      const chY = platePt.y + Math.sin(indexAngle) * crankLen;

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(platePt.x, platePt.y);
      ctx.lineTo(chX, chY);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(chX, chY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Penyangga Kepala Lepas (Tailstock Center Support) di Kanan
      const tsX = 58 + tblX;
      drawIsoBox(tsX, dhY - 14, tableTopZ, 20, 28, 30, "#475569", "#334155", "#1e293b", "#64748b");
      drawIsoCylinder(tsX - 4, dhY, tableTopZ + 19, 5, 8, "#cbd5e1", "#f8fafc", "#475569");

    } else {
      // -----------------------------------------------------------------------
      // RAGUM MESIN PRESISI DENGAN SEPASANG BILAH PARALEL (MACHINE VISE & PARALLELS)
      // -----------------------------------------------------------------------
      // Landasan Cor Ragum (Vise Base)
      drawIsoBox(viseX, viseY, tableTopZ, viseW, viseD, viseH, "#334155", "#1e293b", "#0f172a", "#475569");

      // Rahang Tetap di Belakang (Fixed Jaw)
      drawIsoBox(viseX + 10, viseY + 4, tableTopZ + viseH, viseW - 20, 10, 14, "#475569", "#334155", "#1e293b", "#94a3b8");

      // Rahang Bergerak di Depan (Movable Jaw)
      drawIsoBox(viseX + 10, viseY + viseD - 14, tableTopZ + viseH, viseW - 20, 10, 14, "#475569", "#334155", "#1e293b", "#94a3b8");

      // Sepasang Bilah Paralel Presisi Baja Terpoles (Precision Parallel Bars)
      const parH = 7;
      const parL = viseW - 24;
      const parW = 5;

      // Bilah Paralel Belakang
      drawIsoBox(viseX + 12, viseY + 15, tableTopZ + viseH, parL, parW, parH, "#f8fafc", "#94a3b8", "#cbd5e1", "#38bdf8", 0.6);
      // Bilah Paralel Depan
      drawIsoBox(viseX + 12, viseY + viseD - 15 - parW, tableTopZ + viseH, parL, parW, parH, "#f8fafc", "#94a3b8", "#cbd5e1", "#38bdf8", 0.6);

      // Handel Pemutar Ragum Presisi di Ujung Kanan
      const handlePt = isoPt(viseX + viseW + 5, viseY + viseD / 2, tableTopZ + viseH / 2);
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(handlePt.x, handlePt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // 6. Benda Kerja Solid Isometris 3D dengan Sayatan Dinamis Sesuai Arah Pemakanan
  function renderMillingIsoWorkpiece(tableElevZ, tblX, tblY) {
    ctx.save();

    const opId = currentOperation ? currentOperation.id : "milling_face";
    const tableZ = -25 + tableElevZ;
    const tableTopZ = tableZ + 18;
    const viseH = 22;
    const parH = 7;
    const wpBaseZ = tableTopZ + viseH + parH; // Dasar balok duduk di atas bilah paralel

    const wpL = 76; // Panjang balok arah X
    const wpW = 38; // Lebar balok arah Y
    const wpH = 26; // Tinggi balok arah Z
    const wpX = -wpL / 2 + tblX;
    const wpY = -wpW / 2 + tblY;

    const cutProgress = animState.cutDepthProgress || 0;

    // Palet Baja ST-37 Solid Isometris
    const rawTop = "#475569";
    const rawFront = "#334155";
    const rawSide = "#1e293b";
    const cutTop = "#f8fafc";   // Kilau perak hasil sayatan
    const cutFront = "#38bdf8"; // Biru cerah bidang terpotong
    const cutSide = "#0284c7";

    if (opId === "milling_face") {
      // -----------------------------------------------------------------------
      // 1. FRAIS MUKA / RATA (FACE MILLING DENGAN ENDMILL SOLID CARBIDE O20 mm)
      // -----------------------------------------------------------------------
      const cutAp = 5.0 * cutProgress;

      // Balok dasar
      drawIsoBox(wpX, wpY, wpBaseZ, wpL, wpW, wpH - cutAp, cutAp > 0 ? cutTop : rawTop, rawFront, rawSide, "#cbd5e1");

      // Pola sapuan melingkar pisau Endmill (Circular Scallop Toolpaths)
      if (cutAp > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 0.9;
        for (let fx = wpX + 8; fx <= wpX + wpL - 8; fx += 10) {
          const sp1 = isoPt(fx, wpY + 4, wpBaseZ + wpH - cutAp + 0.2);
          const sp2 = isoPt(fx + 6, wpY + wpW - 4, wpBaseZ + wpH - cutAp + 0.2);
          ctx.beginPath();
          ctx.moveTo(sp1.x, sp1.y);
          ctx.quadraticCurveTo(sp1.x + 8, (sp1.y + sp2.y) / 2, sp2.x, sp2.y);
          ctx.stroke();
        }
      }

    } else if (opId === "milling_side") {
      // -----------------------------------------------------------------------
      // 2. FRAIS SISI / BIDANG SIKU 90° (SIDE MILLING DENGAN ENDMILL HELIKS PANJANG)
      // -----------------------------------------------------------------------
      const sideAe = 8 * cutProgress;

      // Balok yang disayat sisi depannya
      drawIsoBox(wpX, wpY, wpBaseZ, wpL, wpW - sideAe, rawTop, cutFront, rawSide, "#cbd5e1");

      // Garis vertikal jejak sisi heliks Endmill pada dinding siku
      if (sideAe > 0) {
        ctx.strokeStyle = "rgba(248, 250, 252, 0.55)";
        ctx.lineWidth = 0.8;
        for (let fx = wpX + 6; fx <= wpX + wpL - 6; fx += 8) {
          const p1 = isoPt(fx, wpY + wpW - sideAe, wpBaseZ);
          const p2 = isoPt(fx, wpY + wpW - sideAe, wpBaseZ + wpH);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Indikator Sudut Siku 90° Hijau Presisi di Pojok Sisi
        const pSiku = isoPt(wpX + wpL, wpY + wpW - sideAe, wpBaseZ + wpH - 6);
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 6px JetBrains Mono, monospace";
        ctx.fillText("∟ 90° SIKU", pSiku.x + 4, pSiku.y);
      }

    } else if (opId === "milling_slot") {
      // -----------------------------------------------------------------------
      // 3. FRAIS ALUR T (T-SLOT MILLING DENGAN PISAU ALUR T DIN 851)
      // DILENGKAPI IRISAN PERSPEKTIF TERBUKA (CUTAWAY SECTION) DI MUKA DEPAN!
      // -----------------------------------------------------------------------
      // Balok utama
      drawIsoBox(wpX, wpY, wpBaseZ, wpL, wpW, wpH, rawTop, rawFront, rawSide, "#cbd5e1");

      // Alur Awal Lurus Vertikal (Pre-milled Straight Neck Slot dibuat dengan Endmill)
      const slotNeckW = 10;
      const slotNeckY = wpY + wpW / 2 - slotNeckW / 2;
      const neckDepth = 15;

      drawIsoBox(wpX - 0.5, slotNeckY, wpBaseZ + wpH - neckDepth, wpL + 1, slotNeckW, neckDepth + 0.5, "#090d16", "#0f172a", "#1e293b", "#38bdf8");

      // Pelebaran Sayap Bawah Alur T (Disayat oleh Pisau Frais Alur T DIN 851)
      const tWingCut = cutProgress;
      if (tWingCut > 0) {
        const wingW = 18 * tWingCut;
        const wingY = wpY + wpW / 2 - wingW / 2;
        const wingH = 7;
        const wingZ = wpBaseZ + wpH - neckDepth;

        drawIsoBox(wpX - 1, wingY, wingZ, wpL + 2, wingW, wingH, cutTop, "#090d16", cutSide, "#38bdf8");

        // Irisan Profil Alur T Terbuka di Muka Depan Balok (+X)
        // Memperjelas rongga T yang terbentuk di bagian dalam balok
        const pT1 = isoPt(wpX + wpL + 0.5, slotNeckY, wpBaseZ + wpH);
        const pT2 = isoPt(wpX + wpL + 0.5, slotNeckY + slotNeckW, wpBaseZ + wpH);
        const pT3 = isoPt(wpX + wpL + 0.5, slotNeckY + slotNeckW, wingZ + wingH);
        const pT4 = isoPt(wpX + wpL + 0.5, wingY + wingW, wingZ + wingH);
        const pT5 = isoPt(wpX + wpL + 0.5, wingY + wingW, wingZ);
        const pT6 = isoPt(wpX + wpL + 0.5, wingY, wingZ);
        const pT7 = isoPt(wpX + wpL + 0.5, wingY, wingZ + wingH);
        const pT8 = isoPt(wpX + wpL + 0.5, slotNeckY, wingZ + wingH);

        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pT1.x, pT1.y);
        ctx.lineTo(pT2.x, pT2.y);
        ctx.lineTo(pT3.x, pT3.y);
        ctx.lineTo(pT4.x, pT4.y);
        ctx.lineTo(pT5.x, pT5.y);
        ctx.lineTo(pT6.x, pT6.y);
        ctx.lineTo(pT7.x, pT7.y);
        ctx.lineTo(pT8.x, pT8.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

    } else if (opId === "milling_step") {
      // -----------------------------------------------------------------------
      // 4. FRAIS BERTINGKAT (STEP MILLING DENGAN SQUARE ENDMILL 90°)
      // -----------------------------------------------------------------------
      const stepW = 14;
      const stepH = 10 * cutProgress;

      // Bagian balok yang tidak tersayat (Belakang)
      drawIsoBox(wpX, wpY, wpBaseZ, wpL, wpW - stepW, wpH, rawTop, rawFront, rawSide, "#cbd5e1");

      // Bagian undakan siku bertingkat (Depan)
      drawIsoBox(wpX, wpY + wpW - stepW, wpBaseZ, wpL, stepW, wpH - stepH, cutTop, rawFront, cutSide, "#cbd5e1");

      // Garis pertemuan siku 90° antara dinding tegak dan dasar undakan
      if (stepH > 0) {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.2;
        const sp1 = isoPt(wpX, wpY + wpW - stepW, wpBaseZ + wpH - stepH);
        const sp2 = isoPt(wpX + wpL, wpY + wpW - stepW, wpBaseZ + wpH - stepH);
        ctx.beginPath();
        ctx.moveTo(sp1.x, sp1.y);
        ctx.lineTo(sp2.x, sp2.y);
        ctx.stroke();
      }

    } else if (opId === "milling_segi_n" || opId === "milling_polygon" || opId === "milling_gear") {
      // -----------------------------------------------------------------------
      // 5. FRAIS BENDA SEGI-n / KEPALA BAUT (DENGAN ENDMILL & KEPALA PEMBAGI)
      // -----------------------------------------------------------------------
      const barRad = 13;
      const barL = 60;
      const barStartX = -48 + tblX;
      const barY = tblY;
      const barCenterZ = tableTopZ + 19;

      const numFacets = 6;
      const facetCut = cutProgress;

      // Gambar penampang prisma segi-6 yang terbentuk secara bertahap
      for (let s = 0; s < numFacets; s++) {
        const a1 = (s * Math.PI * 2) / numFacets;
        const a2 = ((s + 1) * Math.PI * 2) / numFacets;

        const isCurrentFacet = (s === 0);
        const isCut = isCurrentFacet ? facetCut > 0 : (s <= (currentStepIdx || 0));
        const depth = isCurrentFacet ? facetCut * 2.5 : (isCut ? 2.5 : 0);

        const y1 = barY + Math.cos(a1) * (barRad - depth);
        const z1 = barCenterZ + Math.sin(a1) * (barRad - depth);
        const y2 = barY + Math.cos(a2) * (barRad - depth);
        const z2 = barCenterZ + Math.sin(a2) * (barRad - depth);

        const p1 = isoPt(barStartX, y1, z1);
        const p2 = isoPt(barStartX + barL, y1, z1);
        const p3 = isoPt(barStartX + barL, y2, z2);
        const p4 = isoPt(barStartX, y2, z2);

        ctx.fillStyle = isCut ? cutTop : (z1 > barCenterZ ? rawTop : rawFront);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Label Nomor Bidang
        if (isCut && s < 3) {
          const midX = (p1.x + p3.x) / 2;
          const midY = (p1.y + p3.y) / 2;
          ctx.fillStyle = "#0284c7";
          ctx.font = "bold 5.5px JetBrains Mono, monospace";
          ctx.textAlign = "center";
          ctx.fillText(`S${s + 1}`, midX, midY + 1.5);
        }
      }
    }

    ctx.restore();
  }

  // 7. Spindel, Kolet ER32 & Anatomi Pisau Frais Berpresisi Tinggi
  function renderMillingIsoSpindleAndCutter() {
    ctx.save();

    // Sumbu Spindel Vertikal kaku pada (X = 0, Y = 0)
    // A. Pinola Spindel Baja Krom Presisi (Chrome Spindle Quill Sleeve)
    drawIsoCylinder(0, 0, 75, 18, 55, "#cbd5e1", "#f8fafc", "#475569");

    // Skala Graduasi Kedalaman Milimeter pada Pinola
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 0.8;
    for (let mz = 85; mz <= 122; mz += 5) {
      const sp1 = isoPt(-12, 12, mz);
      const sp2 = isoPt(-6, 6, mz);
      ctx.beginPath();
      ctx.moveTo(sp1.x, sp1.y);
      ctx.lineTo(sp2.x, sp2.y);
      ctx.stroke();
    }

    // B. Cekam Kolet Presisi ER32 / ISO 40 (Collet Chuck Arbor)
    drawIsoCylinder(0, 0, 48, 14, 27, "#334155", "#64748b", "#1e293b");

    // Mur Pengencang Kolet ER32 dengan Alur Kunci Spanner (ER32 Slotted Nut)
    drawIsoCylinder(0, 0, 38, 16.5, 10, "#1e293b", "#475569", "#0f172a");

    // Alur Kunci Spanner pada Mur
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 1.2;
    for (let na = 0; na < Math.PI * 2; na += Math.PI / 3) {
      const nx = Math.cos(na) * 16.5;
      const ny = Math.sin(na) * 16.5;
      const np1 = isoPt(nx, ny, 39);
      const np2 = isoPt(nx, ny, 47);
      ctx.beginPath();
      ctx.moveTo(np1.x, np1.y);
      ctx.lineTo(np2.x, np2.y);
      ctx.stroke();
    }

    // C. Pegas Kolet ER32 (ER32 Spring Collet Clamping Ring)
    drawIsoCylinder(0, 0, 34, 11, 4, "#94a3b8", "#cbd5e1", "#334155");

    const opId = currentOperation ? currentOperation.id : "milling_face";

    if (opId === "milling_slot" && (currentStepIdx || 0) > 0) {
      // -----------------------------------------------------------------------
      // PISAU FRAIS ALUR T DIN 851 ISOMETRIS 3D (T-SLOT CUTTER HSS-Co8)
      // Sesuai gambar nyata referensi: "Pahat Frais Alur (T).jpg"
      // -----------------------------------------------------------------------
      // 1. Batang Leher Ramping Bebas (Relieved Cylindrical Neck)
      // Diameter leher O9 mm lebih kecil dari alur lurus atas agar meluncur bebas tanpa gesekan!
      drawIsoCylinder(0, 0, 19, 4.5, 15, "#cbd5e1", "#f8fafc", "#475569");

      // 2. Kepala Cakram Pisau Alur T (Thick Cylindrical Disc Cutter Head)
      // Diameter cakram O26 mm, tebal 9 mm dengan warna emas perunggu HSS Kobalt Co8
      drawIsoCylinder(0, 0, 10, 13, 9, "#b45309", "#fde047", "#78350f");

      // 3. Gigi Potong Silang Berselang-Seling (Staggered Teeth / Alternate Tooth Pitch)
      // Sesuai standar DIN 851 dan foto asli pahat alur T
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.4;
      for (let ta = 0; ta < Math.PI * 2; ta += Math.PI / 5) {
        const tx1 = Math.cos(ta) * 13;
        const ty1 = Math.sin(ta) * 13;
        const tp1 = isoPt(tx1, ty1, 10);
        const tp2 = isoPt(tx1, ty1, 19);
        ctx.beginPath();
        ctx.moveTo(tp1.x, tp1.y);
        ctx.lineTo(tp2.x, tp2.y);
        ctx.stroke();

        // Garis kilau mata potong relief berselang-seling
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(tp1.x - 0.5, tp1.y - 0.5);
        ctx.lineTo(tp2.x - 0.5, tp2.y - 0.5);
        ctx.stroke();
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 1.4;
      }

    } else {
      // -----------------------------------------------------------------------
      // PISAU ENDMILL 4-FLUTE SOLID CARBIDE ISOMETRIS 3D (TiAlN COATED)
      // Digunakan untuk: milling_face, milling_side, milling_step, milling_segi_n,
      // serta langkah awal slotting pada milling_slot
      // -----------------------------------------------------------------------
      const emRadius = (opId === "milling_face") ? 11 : 9.5;
      const emHeight = 26;
      const baseZ = 8;

      // Badan Silinder Endmill Baja Karbida
      drawIsoCylinder(0, 0, baseZ, emRadius, emHeight, "#1e293b", "#64748b", "#0f172a");

      // 4 Alur Spiral Heliks (4 Helical Spiral Flutes with 30° Helix Angle)
      // Memvisualisasikan spiral alur heliks pembuang tatal dengan mata potong tajam
      for (let f = 0; f < 4; f++) {
        const startAng = (f * Math.PI) / 2;
        ctx.strokeStyle = "#090d16";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let hz = baseZ + 1; hz <= baseZ + emHeight - 2; hz += 2) {
          const ang = startAng + ((hz - baseZ) / emHeight) * (Math.PI * 0.85);
          const fx = Math.cos(ang) * (emRadius - 0.4);
          const fy = Math.sin(ang) * (emRadius - 0.4);
          const pt = isoPt(fx, fy, hz);
          if (hz === baseZ + 1) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Garis kilau mata potong tajam relief (Sharp Cutting Edge Land)
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let hz = baseZ + 1; hz <= baseZ + emHeight - 2; hz += 2) {
          const ang = startAng + ((hz - baseZ) / emHeight) * (Math.PI * 0.85) + 0.12;
          const fx = Math.cos(ang) * (emRadius - 0.2);
          const fy = Math.sin(ang) * (emRadius - 0.2);
          const pt = isoPt(fx, fy, hz);
          if (hz === baseZ + 1) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Mata Potong Ujung Muka Bawah (End Teeth / Radial Face Cutting Edges)
      // 4 mata potong radial di dasar pisau yang menyapu permukaan balok
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.2;
      for (let f = 0; f < 4; f++) {
        const ang = (f * Math.PI) / 2;
        const ep1 = isoPt(0, 0, baseZ);
        const ep2 = isoPt(Math.cos(ang) * emRadius, Math.sin(ang) * emRadius, baseZ);
        ctx.beginPath();
        ctx.moveTo(ep1.x, ep1.y);
        ctx.lineTo(ep2.x, ep2.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // 8. Visualisasi Dinamis Proses Penyayatan:
  // Rotasi Spindel CW, Panah Gerak Makan Meja, Zona Geser Panas, Percikan Tatal, dan Dimensi ap/ae
  function renderMillingIsoCuttingAction(tableElevZ, tblX, tblY) {
    ctx.save();

    const opId = currentOperation ? currentOperation.id : "milling_face";
    const isCutting = animState.isCutting;
    const isRotating = animState.cutterRotating;

    // A. Busur Putaran Spindel CW (Clockwise Rotation M03)
    if (isRotating) {
      const rotZ = 22;
      const rotR = 19;
      const spinOffset = (performance.now() * 0.007) % (Math.PI * 2);

      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let a = spinOffset; a < spinOffset + Math.PI * 1.5; a += 0.2) {
        const rx = Math.cos(a) * rotR;
        const ry = Math.sin(a) * rotR;
        const rpt = isoPt(rx, ry, rotZ);
        if (a === spinOffset) ctx.moveTo(rpt.x, rpt.y);
        else ctx.lineTo(rpt.x, rpt.y);
      }
      ctx.stroke();

      // Panah Arah Putaran CW di Ujung Busur
      const arrowAng = spinOffset + Math.PI * 1.5;
      const ax = Math.cos(arrowAng) * rotR;
      const ay = Math.sin(arrowAng) * rotR;
      const apt = isoPt(ax, ay, rotZ);

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(apt.x, apt.y, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Teks Putaran CW
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("↻ CW 650 RPM", apt.x + 8, apt.y - 6);
    }

    // B. Panah Vektor Arah Gerak Makan Meja (Table Feed Vector Vf)
    if (isCutting) {
      // Vektor pemakanan meja sepanjang sumbu X
      const feedStartX = tblX - 25;
      const feedEndX = tblX + 25;
      const feedY = tblY + 28;
      const feedZ = -10 + tableElevZ;

      const pF1 = isoPt(feedStartX, feedY, feedZ);
      const pF2 = isoPt(feedEndX, feedY, feedZ);

      // Garis Panah Bercahaya Tebal
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.4;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(pF1.x, pF1.y);
      ctx.lineTo(pF2.x, pF2.y);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Kepala Panah Gerak Makan
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(pF2.x + 4, pF2.y + 2);
      ctx.lineTo(pF2.x - 4, pF2.y - 4);
      ctx.lineTo(pF2.x - 2, pF2.y + 6);
      ctx.closePath();
      ctx.fill();

      // Teks Parameter Gerak Makan
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 6px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("ARAH GERAK MAKAN MEJA (Vf = 120 mm/min)", (pF1.x + pF2.x) / 2, pF1.y + 12);

      // C. Zona Geser Logam Panas (Shear Zone Glow) di Titik Temu Sayatan
      const contactPt = isoPt(0, tblY, 12);
      ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(contactPt.x, contactPt.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Percikan Tatal Beram Spiral Logam (Curly Metal Chips)
      if (Math.random() < 0.65) {
        spawnChip(contactPt.x + (Math.random() - 0.5) * 10, contactPt.y + (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 55, -Math.random() * 45, COLORS.chip);
      }

      // D. Garis Dimensi Kedalaman Potong ap & Lebar Potong ae
      const dimPt = isoPt(tblX + 38, tblY, 14);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dimPt.x, dimPt.y - 8);
      ctx.lineTo(dimPt.x, dimPt.y + 8);
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 5.5px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("ap = 1,0 mm", dimPt.x + 4, dimPt.y + 2);
    }

    ctx.restore();
  }

  // 9. Selang Pendingin Fleksibel Isometris 3D (Loc-Line Coolant Hose)
  function renderMillingIsoCoolant() {
    ctx.save();
    const hoseStart = isoPt(-30, 20, 115);
    const hoseEnd = isoPt(0, 0, 18);

    // Ruas-ruas bola fleksibel biru & oranye
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(hoseStart.x, hoseStart.y);
    ctx.quadraticCurveTo(hoseStart.x + 15, hoseStart.y + 30, hoseEnd.x - 8, hoseEnd.y - 6);
    ctx.stroke();

    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 5;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(hoseStart.x, hoseStart.y);
    ctx.quadraticCurveTo(hoseStart.x + 15, hoseStart.y + 30, hoseEnd.x - 8, hoseEnd.y - 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pancaran Fluida Pendingin
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hoseEnd.x - 5, hoseEnd.y - 4);
    ctx.lineTo(hoseEnd.x + 3, hoseEnd.y + 8);
    ctx.stroke();

    // Butiran Percikan Coolant
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.7) {
        spawnChip(hoseEnd.x + (Math.random() - 0.5) * 8, hoseEnd.y + 4 + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 35, COLORS.coolant);
      }
    }

    ctx.restore();
  }

  // 10. Anotasi Langkah & Alat Ukur Interaktif Isometris 3D
  function renderMillingIsoStepAnnotations(step, tableElevZ, tblX, tblY) {
    ctx.save();
    const act = step.visualAction;

    if (act === "clamp_vise_parallel") {
      const pPar = isoPt(tblX, tblY + 12, 14);
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 7px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("✔ BILAH PARALEL PRESISI TERPASANG RAPAT", pPar.x, pPar.y + 20);

    } else if (act === "tap_workpiece_tight") {
      const pMallet = isoPt(tblX, tblY, 48);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(pMallet.x - 14, pMallet.y - 7, 28, 14, [3]);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 6px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("PALU", pMallet.x, pMallet.y + 2);

    } else if (act === "inspect_face_flatness") {
      const pDial = isoPt(tblX, tblY, 36);
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(pDial.x, pDial.y - 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 6.5px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("DIAL", pDial.x, pDial.y - 10);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 6.5px JetBrains Mono, monospace";
      ctx.fillText("DEV < 0,02 mm (RATA)", pDial.x, pDial.y + 14);

    } else if (act === "inspect_side_square") {
      const pSq = isoPt(tblX + 38, tblY + 15, 24);
      ctx.fillStyle = "rgba(6, 78, 59, 0.92)";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pSq.x - 30, pSq.y - 8, 60, 16, [4]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 6px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("✔ SIKU 90° PRESISI", pSq.x, pSq.y + 3);

    } else if (act === "test_t_bolt_fit") {
      const pBolt = isoPt(tblX, tblY, 26);
      ctx.fillStyle = "rgba(30, 58, 138, 0.92)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pBolt.x - 42, pBolt.y - 8, 84, 16, [4]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#93c5fd";
      ctx.font = "bold 6px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("✔ BAUT T MELUNCUR BEBAS (PASS)", pBolt.x, pBolt.y + 3);
    }

    ctx.restore();
  }

  // 11. HUD Panel Informasi Pahat & Proses Sayatan (Dirender di Koordinat Layar)
  function renderMillingIsoToolingHUD() {
    if (!currentOperation || currentOperation.machine !== "milling") return;

    ctx.save();
    const opId = currentOperation.id;
    const isSlot = (opId === "milling_slot" && (currentStepIdx || 0) > 0);

    // Tentukan Spesifikasi Pahat
    let toolTitle = "";
    let toolSpecs = "";
    let toolMat = "";
    let cutMethod = "Climb Milling (Frais Searah / Down-Cut)";

    if (isSlot) {
      toolTitle = "PISAU FRAIS ALUR T DIN 851";
      toolSpecs = "Kepala Cakram Ø22×8 mm | Leher Ramping Ø9 mm | Gigi Berselang-Seling";
      toolMat = "HSS-Co8 (High Speed Steel Cobalt)";
    } else if (opId === "milling_face") {
      toolTitle = "END MILL SOLID CARBIDE 4-FLUTE Ø20 mm";
      toolSpecs = "Diameter Ø20 mm | 4-Flute Heliks 30° | Ujung Rata (Flat End Face)";
      toolMat = "Micrograin Solid Carbide + TiAlN Coating";
    } else if (opId === "milling_side") {
      toolTitle = "END MILL HELIKS PANJANG 4-FLUTE Ø16 mm";
      toolSpecs = "Mata Potong Samping Panjang | Heliks 30° | Siku 90° Sisi Balok";
      toolMat = "Solid Carbide TiAlN";
    } else if (opId === "milling_step") {
      toolTitle = "SQUARE ENDMILL 4-FLUTE Ø16 mm";
      toolSpecs = "Sudut Pojok Siku 90° Tajam | Pemakanan Aksial & Radial Simultan";
      toolMat = "Solid Carbide TiAlN";
    } else if (opId === "milling_segi_n" || opId === "milling_polygon" || opId === "milling_gear") {
      toolTitle = "END MILL FINISHING 4-FLUTE Ø16 mm";
      toolSpecs = "Muka Datar Menyapu Poros | Dividing Head Rasio 40:1 (6 Sisi Heksagonal)";
      toolMat = "Solid Carbide TiAlN";
    }

    // Kartu HUD Semi-Transparan di Kiri Bawah Header
    const cardX = 14;
    const cardY = 82;
    const cardW = 340;
    const cardH = 68;

    ctx.fillStyle = "rgba(11, 19, 43, 0.88)";
    ctx.strokeStyle = isSlot ? "#f59e0b" : "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, [8]);
    ctx.fill();
    ctx.stroke();

    // Ikon & Judul Pahat
    ctx.fillStyle = isSlot ? "#fbbf24" : "#38bdf8";
    ctx.font = "bold 9.5px JetBrains Mono, monospace";
    ctx.fillText(`🛠️ ${toolTitle}`, cardX + 10, cardY + 16);

    // Geometri & Bahan
    ctx.fillStyle = "#f8fafc";
    ctx.font = "8px JetBrains Mono, monospace";
    ctx.fillText(`• Geometri: ${toolSpecs}`, cardX + 10, cardY + 31);
    ctx.fillText(`• Bahan Pahat: ${toolMat}`, cardX + 10, cardY + 45);

    // Metode Pemotongan & Status Kontak
    const inCut = animState.isCutting;
    ctx.fillStyle = inCut ? "#34d399" : "#94a3b8";
    ctx.font = "bold 8px JetBrains Mono, monospace";
    ctx.fillText(`• ${cutMethod} | ${inCut ? "🔴 IN-CUT ENGAGEMENT" : "🟢 TRAVERSE"}`, cardX + 10, cardY + 59);

    ctx.restore();
  }


    function renderParticles() {
    ctx.save();
    for (let i = 0; i < animState.chips.length; i++) {
      const p = animState.chips[i];
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // CANVAS TOP HUD OVERLAY
  // =========================================================================
  function renderCanvasHUD(w, h) {
    if (!currentOperation) return;

    ctx.save();
    const step = currentOperation.steps[currentStepIdx] || {};

    // Top Left: Operation Title & Progress Badge
    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.strokeStyle = "rgba(51, 65, 85, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, 14, 290, 62, [10]);
    ctx.fill();
    ctx.stroke();

    // Machine icon & title
    ctx.fillStyle = currentOperation.machine === "lathe" ? "#38bdf8" : "#34d399";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.fillText(currentOperation.machine === "lathe" ? "MESIN BUBUT (LATHE)" : "MESIN FRAIS (MILLING)", 26, 32);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillText(currentOperation.title, 26, 50);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`Langkah ${currentStepIdx + 1} dari ${currentOperation.steps.length}: ${step.title ? step.title.substring(0, 24) + '...' : ''}`, 26, 64);

    // Live Step Progress Bar in Canvas HUD
    ctx.fillStyle = "rgba(51, 65, 85, 0.6)";
    ctx.fillRect(26, 69, 266, 3);
    ctx.fillStyle = isPlaying ? "#38bdf8" : "#94a3b8";
    ctx.fillRect(26, 69, 266 * Math.min(1.0, Math.max(0.0, stepProgress)), 3);

    // Top Right: Live Telemetry Indicators
    const hudW = 200;
    ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
    ctx.strokeStyle = "rgba(51, 65, 85, 0.7)";
    ctx.beginPath();
    ctx.roundRect(w - hudW - 14, 14, hudW, 62, [10]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText("STATUS ELEMEN:", w - hudW + 2, 32);

    // Spindle / Cutter Status
    const isRunning = currentOperation.machine === "lathe" ? animState.spindleRunning : animState.cutterRotating;
    ctx.fillStyle = isRunning ? "#34d399" : "#94a3b8";
    ctx.beginPath();
    ctx.arc(w - hudW + 8, 46, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.fillText(isRunning ? "Spindel: BERPUTAR" : "Spindel: DIAM", w - hudW + 18, 50);

    // Coolant / Angle Telemetry
    if (currentOperation.id === "lathe_taper") {
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`Sudut Eretan: ${Math.round(animState.eretanAngle)}°`, w - hudW + 2, 66);
    } else {
      ctx.fillStyle = animState.coolantOn ? "#38bdf8" : "#64748b";
      ctx.fillText(animState.coolantOn ? "Coolant: AKTIF" : "Coolant: OFF", w - hudW + 2, 66);
    }

    // Zoom Toggle Button for Milling Machine (Pilihan Mode Fokus Pahat vs Mesin Penuh)
    if (currentOperation.machine === "milling") {
      const btnW = 160;
      const btnH = 24;
      const btnX = w - btnW - 14;
      const btnY = 82;

      ctx.fillStyle = millingZoomMode === "focus" ? "rgba(2, 132, 199, 0.45)" : "rgba(30, 41, 59, 0.75)";
      ctx.strokeStyle = millingZoomMode === "focus" ? "#38bdf8" : "#64748b";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, [6]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = millingZoomMode === "focus" ? "#38bdf8" : "#cbd5e1";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(millingZoomMode === "focus" ? "🔍 ZOOM: FOKUS 2.0x" : "🌐 ZOOM: MESIN PENUH", btnX + btnW / 2, btnY + btnH / 2);
    }

    // =========================================================================
    // DEDICATED BOTTOM STEP ACTION BANNER (GENEROUS BREATHING ROOM)
    // =========================================================================
    const bannerH = 40;
    const bannerY = h - bannerH - 12;
    const maxBannerW = Math.min(w - 28, 760);
    const bannerX = (w - maxBannerW) / 2;

    // Glowing glassmorphic container in screen coordinates (well clear of machine)
    ctx.fillStyle = "rgba(11, 19, 43, 0.94)";
    ctx.strokeStyle = currentOperation.machine === "lathe" ? "#38bdf8" : "#34d399";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, maxBannerW, bannerH, [10]);
    ctx.fill();
    ctx.stroke();

    // Subtle glow accent on border
    ctx.strokeStyle = currentOperation.machine === "lathe" ? "rgba(56, 189, 248, 0.25)" : "rgba(52, 211, 153, 0.25)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Step Number Pill Badge on the left
    const badgeW = 86;
    const badgeH = 24;
    const badgeX = bannerX + 10;
    const badgeY = bannerY + (bannerH - badgeH) / 2;

    ctx.fillStyle = currentOperation.machine === "lathe" ? "rgba(2, 132, 199, 0.35)" : "rgba(5, 150, 105, 0.35)";
    ctx.strokeStyle = currentOperation.machine === "lathe" ? "#38bdf8" : "#34d399";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, [6]);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = currentOperation.machine === "lathe" ? "#38bdf8" : "#34d399";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`LANGKAH ${currentStepIdx + 1}/${currentOperation.steps.length}`, badgeX + badgeW / 2, badgeY + badgeH / 2);

    // Full Step Title with clean, unobstructed typography
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const textX = badgeX + badgeW + 14;
    const textMaxW = bannerX + maxBannerW - textX - 14;
    const fullStepText = step.title ? step.title.replace(/^\d+\.\s*/, '') : '';
    ctx.fillText(fullStepText, textX, bannerY + bannerH / 2, textMaxW);

    ctx.restore();
  }

  // Public API
  return {
    init,
    resize: setupCanvasDPI,
    setOperation,
    play,
    pause,
    togglePlay,
    setSpeed,
    nextStep,
    prevStep,
    goToStep,
    resetOperation,
    getCurrentOperation: () => currentOperation,
    getCurrentStepIndex: () => currentStepIdx,
    getStepProgress: () => stepProgress,
    isPlaying: () => isPlaying,
    getState: () => animState,
    toggleMillingZoom: () => {
      millingZoomMode = (millingZoomMode === "focus" ? "overview" : "focus");
      render();
    },
    getMillingZoom: () => millingZoomMode,
    seekStepProgress: (p) => {
      stepProgress = Math.max(0.0, Math.min(1.0, p));
      update(0.016);
      render();
    }
  };
})();

// Export to window
if (typeof window !== "undefined") {
  window.OperationsEngine = OperationsEngine;
}