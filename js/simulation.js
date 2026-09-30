/**
 * Simulation Engine for Lathe and Milling Machining Operations
 * Handles mathematical modeling, surface finish grading, and live 2D Canvas rendering
 */
const SimEngine = (function () {
  let canvas = null;
  let ctx = null;
  let animId = null;
  let isRunning = false;
  let isAutoFeed = false;

  // State
  const state = {
    machineType: "lathe", // "lathe" or "milling"
    materialId: "mild_steel",
    toolId: "hss",
    diameter: 50, // mm
    length: 120, // mm
    depthOfCut: 1.5, // mm
    feedRate: 0.18, // mm/rev
    rpm: 160, // actual RPM (ideal for HSS on ST37 d=50mm)
    csTarget: 25, // m/min
    coolant: true,
    numTeeth: 4, // for milling cutter

    // 3-Axis Live Coordinates (mm)
    axisX: 0, // mm (Lathe: depthOfCut or Milling: Table X -50 to +50 mm)
    axisY: 0, // mm (Milling: Saddle Y -25 to +25 mm)
    axisZ: 0, // mm (Lathe: carriage Z or Milling: Knee Z -20 to +20 mm)

    // Milling Tool & Workpiece Dimensions
    endmillDia: 12, // mm (options: 8, 10, 12, 16, 20)
    workpieceP: 100, // mm (Panjang - arah sumbu X)
    workpieceL: 40, // mm (Lebar - arah sumbu Y / penjepitan ragum)
    workpieceT: 40, // mm (Tinggi - arah sumbu Z)

    // Progress & Feed Control
    isAutoFeed: false,
    lastJogCutting: 0,
    cutProgress: 0, // 0 to 1
    toolX: 0,
    timeElapsed: 0,

    // High-resolution turned workpiece contour (radial profile along length in mm)
    contour: (function () {
      const N = 120;
      const arr = new Float32Array(N);
      for (let i = 0; i < N; i++) arr[i] = 25.0; // 50 / 2 default
      return arr;
    })(),

    // Persistent 2D Milling Heightmap Grid (96 cells X x 48 cells Y)
    // Stores cumulative, irreversible depth of material cut (mm)
    // Guarantees zero material regrowth until Reset is pressed
    millingGrid: (function () {
      const arr = new Float32Array(96 * 48);
      return arr;
    })(),
    millingGridVersion: 0,

    // Particles
    chips: [],
    sparks: [],
    smoke: [],

    // Evaluation
    evaluation: {
      status: "OPTIMAL",
      badgeClass: "badge-success",
      title: "Sayatan Optimal (Halus Mengkilap)",
      desc: "Parameter pemotongan sesuai rekomendasi standar!",
      ra: 1.6,
      csActual: 102,
      cuttingTimeMin: 1.02
    }
  };

  // Particle classes
  class Chip {
    constructor(x, y, color, vxDir = 1) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() * 2.5 + 1) * vxDir;
      this.vy = -Math.random() * 5 - 2;
      this.gravity = 0.25;
      this.size = Math.random() * 3 + 2;
      this.color = color || "#e2e8f0";
      this.angle = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 0.3;
      this.life = 1.0;
      this.decay = Math.random() * 0.03 + 0.02;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.angle += this.vRot;
      this.life -= this.decay;
    }
    draw(c) {
      if (this.life <= 0) return;
      c.save();
      c.globalAlpha = Math.max(0, this.life);
      c.translate(this.x, this.y);
      c.rotate(this.angle);
      c.strokeStyle = this.color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, 0, this.size, 0, Math.PI * 1.2);
      c.stroke();
      c.restore();
    }
  }

  class SmokeParticle {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 6;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = -Math.random() * 2 - 1;
      this.size = Math.random() * 4 + 4;
      this.life = 1.0;
      this.decay = Math.random() * 0.02 + 0.015;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.size += 0.25;
      this.life -= this.decay;
    }
    draw(c) {
      if (this.life <= 0) return;
      c.save();
      c.globalAlpha = Math.max(0, this.life * 0.4);
      c.fillStyle = "#64748b";
      c.beginPath();
      c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  // Calculate parameters
  function computeParameters() {
    const mat = AppData.materials.find((m) => m.id === state.materialId) || AppData.materials[0];
    const tool = AppData.toolTypes.find((t) => t.id === state.toolId) || AppData.toolTypes[1];
    const recCs = state.toolId === "carbide" ? mat.csCarbide : mat.csHSS;

    // Calculate cutting speed & machining time based on machine type
    const isMilling = state.machineType === "milling";
    const effectiveDia = isMilling ? (state.endmillDia || 12) : state.diameter;
    const effectiveLength = isMilling ? (state.workpieceP || 100) : state.length;

    // Actual Cs = (pi * d * n) / 1000
    // Pada frais, d = diameter endmill; pada bubut, d = diameter benda kerja
    const csActual = (Math.PI * effectiveDia * state.rpm) / 1000;
    state.csActual = Math.round(csActual * 10) / 10;

    // Machining time tc = L / (f * n)
    const feedPerMin = isMilling ? (state.feedRate * (state.numTeeth || 4) * state.rpm) : (state.feedRate * state.rpm);
    let tcMin = feedPerMin > 0 ? effectiveLength / feedPerMin : 0;
    state.cuttingTimeMin = Math.round(tcMin * 100) / 100;

    // Evaluation Logic
    const minSafeCs = recCs.min * 0.7;
    const maxSafeCs = recCs.max * (state.coolant ? 1.25 : 1.0);
    const extremeOverCs = recCs.max * (state.coolant ? 1.6 : 1.25);

    let status = "OPTIMAL";
    let title = "Permukaan Halus Mengkilap (N6 - N7)";
    let desc = `Parameter putaran spindle ideal (${state.rpm} RPM menghasilkan Cs ${state.csActual} m/menit).`;
    let badgeClass = "badge-success";
    let ra = 1.6 + (state.feedRate / 0.3) * 1.6;

    if (state.csActual > extremeOverCs || (!state.coolant && state.csActual > maxSafeCs)) {
      status = "BURNT";
      title = "Pahat Overheat & Benda Gosong (N9+)";
      desc = "Kecepatan potong terlalu ekstrem! Pahat terbakar aus dan permukaan benda kerja membiru gosong.";
      badgeClass = "badge-danger";
      ra = 6.3 + (state.csActual / maxSafeCs) * 3;
    } else if (state.csActual < minSafeCs || state.feedRate > mat.recommendedFeed.max * 1.5) {
      status = "CHATTER";
      title = "Permukaan Kasar Bergelombang / Chatter (N9+)";
      desc = "Putaran spindle terlalu rendah atau pemakanan terlalu kasar! Terjadi getaran getar (chatter marks).";
      badgeClass = "badge-warning";
      ra = 8.0 + (state.feedRate * 12);
    } else if (state.csActual < recCs.min || state.csActual > recCs.max) {
      status = "ACCEPTABLE";
      title = "Hasil Standar (N7 - N8)";
      desc = "Parameter sedikit di luar rekomendasi optimum namun masih dapat ditoleransi.";
      badgeClass = "badge-info";
      ra = 3.2;
    }

    state.evaluation = {
      status,
      badgeClass,
      title,
      desc,
      ra: Math.round(ra * 10) / 10,
      csActual: state.csActual,
      cuttingTimeMin: state.cuttingTimeMin
    };

    return state.evaluation;
  }

  // Get slice index along workpiece (0 = chuck face, N-1 = tailstock end)
  function getToolSlice(progress) {
    if (!state.contour) return 0;
    const N = state.contour.length;
    const p = Math.max(0, Math.min(1.0, typeof progress === "number" ? progress : state.cutProgress));
    return Math.round((1.0 - p) * (N - 1));
  }

  // Local swept-volume material removal: only carves metal contacted by the tool
  // Preserves stepped shoulders, previous cuts, and supports both infeed/retract and longitudinal feeding
  function applyToolCutting(fromSlice, toSlice) {
    if (!state.contour) return;
    const N = state.contour.length;
    const rawR = state.diameter / 2;
    const cutR = Math.max(2.0, rawR - (state.depthOfCut || 0));

    // Clamp slices to valid indices
    const s1 = typeof fromSlice === "number" ? fromSlice : getToolSlice(state.cutProgress);
    const s2 = typeof toSlice === "number" ? toSlice : s1;
    const minIdx = Math.max(0, Math.min(N - 1, Math.min(s1, s2)));
    const maxIdx = Math.max(0, Math.min(N - 1, Math.max(s1, s2)));

    // Carve material along the swept path down to cut radius
    for (let i = minIdx; i <= maxIdx; i++) {
      if (cutR < state.contour[i]) {
        state.contour[i] = cutR;
      }
    }

    // Tool nose corner blending at active edges
    if (minIdx > 0 && cutR < state.contour[minIdx - 1]) {
      const blendR = cutR + (state.contour[minIdx - 1] - cutR) * 0.35;
      if (blendR < state.contour[minIdx - 1]) {
        state.contour[minIdx - 1] = blendR;
      }
    }
    if (maxIdx < N - 1 && cutR < state.contour[maxIdx + 1]) {
      const blendR = cutR + (state.contour[maxIdx + 1] - cutR) * 0.35;
      if (blendR < state.contour[maxIdx + 1]) {
        state.contour[maxIdx + 1] = blendR;
      }
    }
  }

  // Active plunge / localized cut wrapper
  function updateWorkpieceCutting() {
    const curSlice = getToolSlice(state.cutProgress);
    applyToolCutting(curSlice - 1, curSlice + 1);
  }

  // Dynamic 2D persistent milling heightmap stamper
  // Irreversibly carves material based on endmill cutter footprint and active depth of cut
  // Uses Math.max so once material is cut, it stays permanently removed until Reset
  function stampMillingCut(u, v, radiusMm, depthMm) {
    if (!state.millingGrid || depthMm <= 0) return false;
    const NX = 96;
    const NY = 48;
    const P = state.workpieceP || 100;
    const L = state.workpieceL || 40;

    const rU = radiusMm / P;
    const rV = radiusMm / L;

    const cx = u * (NX - 1);
    const cy = v * (NY - 1);

    const rxGrid = rU * (NX - 1);
    const ryGrid = rV * (NY - 1);

    if (rxGrid <= 0 || ryGrid <= 0) return false;

    const minIx = Math.max(0, Math.floor(cx - rxGrid));
    const maxIx = Math.min(NX - 1, Math.ceil(cx + rxGrid));
    const minIy = Math.max(0, Math.floor(cy - ryGrid));
    const maxIy = Math.min(NY - 1, Math.ceil(cy + ryGrid));

    if (minIx > maxIx || minIy > maxIy) return false;

    let modified = false;
    for (let iy = minIy; iy <= maxIy; iy++) {
      const dy = (iy - cy) / ryGrid;
      const dy2 = dy * dy;
      if (dy2 > 1.0) continue;
      const maxDx2 = 1.0 - dy2;
      const rowOffset = iy * NX;

      for (let ix = minIx; ix <= maxIx; ix++) {
        const dx = (ix - cx) / rxGrid;
        if (dx * dx <= maxDx2) {
          const idx = rowOffset + ix;
          if (depthMm > state.millingGrid[idx]) {
            state.millingGrid[idx] = depthMm;
            modified = true;
          }
        }
      }
    }
    if (modified) {
      state.millingGridVersion = (state.millingGridVersion || 0) + 1;
    }
    return modified;
  }

  // Draw Lathe Simulation
  function drawLathe(timestamp) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Workshop clean background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // Subtle CAD technical grid lines
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const centerY = h * 0.48;
    const chuckWidth = 70;
    const chuckHeight = 160;
    const chuckX = 50;

    // 1. Draw Lathe Spindle Headstock Wall
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, centerY - 110, chuckX + 10, 220);
    ctx.fillStyle = "#334155";
    ctx.fillRect(chuckX, centerY - 90, 15, 180);

    // 2. Draw 3-Jaw Chuck
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.roundRect(chuckX + 10, centerY - chuckHeight / 2, chuckWidth, chuckHeight, 6);
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chuck spinning slots / jaws animation
    const spinAngle = isRunning ? (timestamp * 0.005 * (state.rpm / 300)) : 0;
    const jawOffset = Math.sin(spinAngle) * 8;

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(chuckX + 25, centerY - 65 + jawOffset, 50, 24);
    ctx.fillRect(chuckX + 25, centerY + 41 - jawOffset, 50, 24);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(chuckX + 50, centerY - 60 + jawOffset, 30, 14);
    ctx.fillRect(chuckX + 50, centerY + 46 - jawOffset, 30, 14);

    // Center live axis mark
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Workpiece with True Turned Contour
    const wpStartX = chuckX + chuckWidth + 10;
    const wpTotalLength = Math.min(320, w * 0.5);
    const wpEndX = wpStartX + wpTotalLength;
    const rawRadiusPx = Math.min(45, Math.max(20, state.diameter * 0.6));
    const rawRadiusMm = state.diameter / 2;
    const scalePx = rawRadiusPx / rawRadiusMm;
    const N = state.contour.length;

    // A. Initial raw stock ghost boundary (dashed reference line)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(wpStartX, centerY - rawRadiusPx, wpTotalLength, rawRadiusPx * 2);
    ctx.setLineDash([]);

    // B. Build and fill solid turned workpiece contour path
    ctx.beginPath();
    ctx.moveTo(wpStartX, centerY - state.contour[0] * scalePx);
    for (let i = 1; i < N; i++) {
      const x = wpStartX + (i / (N - 1)) * wpTotalLength;
      const r = state.contour[i] * scalePx;
      ctx.lineTo(x, centerY - r);
    }
    // Right end face (tailstock contact)
    ctx.lineTo(wpEndX, centerY + state.contour[N - 1] * scalePx);
    // Bottom edge back to chuck
    for (let i = N - 1; i >= 0; i--) {
      const x = wpStartX + (i / (N - 1)) * wpTotalLength;
      const r = state.contour[i] * scalePx;
      ctx.lineTo(x, centerY + r);
    }
    ctx.closePath();

    // Base raw workpiece material gradient
    const rawMatColor = AppData.materials.find((m) => m.id === state.materialId)?.colorHex || "#94a3b8";
    const rawGrad = ctx.createLinearGradient(0, centerY - rawRadiusPx, 0, centerY + rawRadiusPx);
    rawGrad.addColorStop(0, "#334155");
    rawGrad.addColorStop(0.2, rawMatColor);
    rawGrad.addColorStop(0.5, "#cbd5e1");
    rawGrad.addColorStop(0.8, rawMatColor);
    rawGrad.addColorStop(1, "#1e293b");

    ctx.fillStyle = rawGrad;
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // C. Render machined sections with brilliant polished metallic finish
    for (let i = 0; i < N - 1; i++) {
      const rMm = state.contour[i];
      if (rMm < rawRadiusMm - 0.08) {
        const x1 = wpStartX + (i / (N - 1)) * wpTotalLength;
        const x2 = wpStartX + ((i + 1) / (N - 1)) * wpTotalLength;
        const segWidth = x2 - x1 + 0.6;
        const rPx = rMm * scalePx;

        const machGrad = ctx.createLinearGradient(0, centerY - rPx, 0, centerY + rPx);
        if (state.evaluation.status === "BURNT") {
          machGrad.addColorStop(0, "#1e1b4b");
          machGrad.addColorStop(0.3, "#312e81");
          machGrad.addColorStop(0.5, "#4338ca");
          machGrad.addColorStop(0.8, "#1e1b4b");
          machGrad.addColorStop(1, "#09090b");
        } else if (state.evaluation.status === "CHATTER") {
          machGrad.addColorStop(0, "#64748b");
          machGrad.addColorStop(0.5, "#cbd5e1");
          machGrad.addColorStop(1, "#475569");
        } else if (state.materialId === "brass") {
          // Polished brass gold finish
          machGrad.addColorStop(0, "#ca8a04");
          machGrad.addColorStop(0.2, "#fde047");
          machGrad.addColorStop(0.45, "#ffffff");
          machGrad.addColorStop(0.7, "#fef08a");
          machGrad.addColorStop(1, "#854d0e");
        } else if (state.materialId === "aluminum") {
          // Ultra bright aluminum finish
          machGrad.addColorStop(0, "#94a3b8");
          machGrad.addColorStop(0.25, "#f1f5f9");
          machGrad.addColorStop(0.5, "#ffffff");
          machGrad.addColorStop(0.75, "#e2e8f0");
          machGrad.addColorStop(1, "#64748b");
        } else {
          // Precision mirror turning steel sheen
          machGrad.addColorStop(0, "#94a3b8");
          machGrad.addColorStop(0.2, "#e2e8f0");
          machGrad.addColorStop(0.45, "#ffffff");
          machGrad.addColorStop(0.7, "#cbd5e1");
          machGrad.addColorStop(1, "#64748b");
        }

        ctx.fillStyle = machGrad;
        ctx.fillRect(x1, centerY - rPx, segWidth, rPx * 2);

        // Fine turning marks (feed micro-grooves)
        if (i % 3 === 0) {
          ctx.strokeStyle = state.evaluation.status === "BURNT"
            ? "rgba(67, 56, 202, 0.35)"
            : (state.materialId === "brass" ? "rgba(161, 98, 7, 0.20)" : "rgba(15, 23, 42, 0.12)");
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, centerY - rPx);
          ctx.lineTo(x1, centerY + rPx);
          ctx.stroke();
        }
      }
    }

    // Dynamic specular sheen animation gliding across turned sections
    if (isRunning && state.evaluation.status === "OPTIMAL") {
      const sheenX = wpStartX + ((timestamp * 0.12) % wpTotalLength);
      const sheenIdx = Math.floor(((sheenX - wpStartX) / wpTotalLength) * N);
      if (sheenIdx >= 0 && sheenIdx < N && state.contour[sheenIdx] < rawRadiusMm - 0.08) {
        const sheenR = state.contour[sheenIdx] * scalePx;
        const sheenGrad = ctx.createLinearGradient(sheenX - 18, 0, sheenX + 18, 0);
        sheenGrad.addColorStop(0, "rgba(255,255,255,0)");
        sheenGrad.addColorStop(0.5, "rgba(255,255,255,0.45)");
        sheenGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(sheenX - 18, centerY - sheenR, 36, sheenR * 2);
      }
    }

    // D. Step shoulders and diameter dimensions
    let lastStepX = -999;
    for (let i = 1; i < N; i++) {
      const prevR = state.contour[i - 1];
      const curR = state.contour[i];
      const delta = Math.abs(curR - prevR);
      if (delta > 0.3) {
        const stepX = wpStartX + (i / (N - 1)) * wpTotalLength;
        // Avoid drawing duplicate shoulder lines within 8 pixels
        if (Math.abs(stepX - lastStepX) > 8) {
          lastStepX = stepX;
          const rMax = Math.max(prevR, curR) * scalePx;
          const rMin = Math.min(prevR, curR) * scalePx;

          // Crisp vertical shoulder line
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(stepX, centerY - rMax);
          ctx.lineTo(stepX, centerY - rMin);
          ctx.moveTo(stepX, centerY + rMin);
          ctx.lineTo(stepX, centerY + rMax);
          ctx.stroke();

          // Step diameter callout with high-contrast badge
          const turnedDia = (Math.min(prevR, curR) * 2).toFixed(1);
          ctx.font = "bold 9px 'JetBrains Mono', monospace, sans-serif";
          const labelText = `Ø ${turnedDia} mm`;
          const textWidth = ctx.measureText(labelText).width;

          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.beginPath();
          ctx.roundRect(stepX + 4, centerY - rMin - 18, textWidth + 8, 14, 3);
          ctx.fill();

          ctx.fillStyle = "#38bdf8";
          ctx.fillText(labelText, stepX + 8, centerY - rMin - 8);
        }
      }
    }

    // 4. Tailstock center support (Right side)
    const tailX = wpEndX;
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(tailX, centerY);
    ctx.lineTo(tailX + 30, centerY - 20);
    ctx.lineTo(tailX + 50, centerY - 20);
    ctx.lineTo(tailX + 50, centerY + 20);
    ctx.lineTo(tailX + 30, centerY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Cutting Tool & Toolholder (Pahat HSS vs Pahat Karbida)
    const norm = Math.max(0, Math.min(1, state.cutProgress));
    const toolTipX = wpEndX - (wpTotalLength * norm);
    const activeCutRMm = Math.max(2.0, (state.diameter / 2) - (state.depthOfCut || 1.5));
    const toolTipY = centerY + (activeCutRMm * scalePx);

    if (state.toolId === "carbide") {
      // --- PAHAT KARBIDA (Indexable Carbide Insert with Pocket & Screw) ---
      // Shank dudukan pahat insert
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toolTipX - 4, toolTipY + 22);
      ctx.lineTo(toolTipX + 22, toolTipY + 22);
      ctx.lineTo(toolTipX + 22, toolTipY + 85);
      ctx.lineTo(toolTipX - 4, toolTipY + 85);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pelat Sisipan Karbida (Rhombic Insert Tip - Emas/Kuning)
      ctx.fillStyle = "#f59e0b";
      if (state.evaluation.status === "BURNT" && isRunning) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15;
      }
      ctx.beginPath();
      ctx.moveTo(toolTipX, toolTipY); // Nose radius ujung potong
      ctx.lineTo(toolTipX - 8, toolTipY + 16); // Mata potong utama
      ctx.lineTo(toolTipX + 8, toolTipY + 22);
      ctx.lineTo(toolTipX + 16, toolTipY + 8); // Mata potong bantu
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset glow

      // Baut pengunci insert tengah (Torx clamping screw)
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(toolTipX + 4, toolTipY + 14, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Lubang baut tengah
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(toolTipX + 4, toolTipY + 14, 1.2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // --- PAHAT HSS (Solid Ground High Speed Steel Tool Bit) ---
      // Toolholder body penjepit pahat
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toolTipX - 12, toolTipY + 80);
      ctx.lineTo(toolTipX - 12, toolTipY + 25);
      ctx.lineTo(toolTipX + 15, toolTipY + 25);
      ctx.lineTo(toolTipX + 15, toolTipY + 80);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mata Pahat HSS Asahan Segitiga Baja Utuh (Silver Grey)
      ctx.fillStyle = "#94a3b8";
      if (state.evaluation.status === "BURNT" && isRunning) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15;
      }
      ctx.beginPath();
      ctx.moveTo(toolTipX, toolTipY);
      ctx.lineTo(toolTipX - 10, toolTipY + 25);
      ctx.lineTo(toolTipX + 10, toolTipY + 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow
    }

    // 6. Coolant spray
    if (state.coolant && isRunning) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toolTipX - 25, toolTipY - 35);
      ctx.quadraticCurveTo(toolTipX - 10, toolTipY - 15, toolTipX, toolTipY + 2);
      ctx.stroke();

      // Splashes
      ctx.fillStyle = "rgba(186, 230, 253, 0.8)";
      for (let i = 0; i < 4; i++) {
        const sx = toolTipX + (Math.random() - 0.3) * 10;
        const sy = toolTipY + (Math.random() - 0.5) * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Update and Draw Particles (Chips, Smoke) & Auto Feed Advance
    if (isRunning && isAutoFeed && state.cutProgress < 1) {
      // Tatal logam terlempar ke belakang/kanan menjauhi mata sayat
      const chipColor = state.evaluation.status === "BURNT" ? "#312e81" : rawMatColor;
      for (let i = 0; i < 2; i++) {
        state.chips.push(new Chip(toolTipX, toolTipY, chipColor, 1));
      }

      // Generate smoke if overheated
      if (state.evaluation.status === "BURNT") {
        state.smoke.push(new SmokeParticle(toolTipX, toolTipY));
      }

      // Advance cut progress (0 to 1) only during auto feed
      const speedFactor = (state.feedRate * state.rpm) / 40000;
      const prevProg = state.cutProgress;
      state.cutProgress = Math.min(1.0, state.cutProgress + Math.max(0.0006, speedFactor));
      const prevSlice = getToolSlice(prevProg);
      const curSlice = getToolSlice(state.cutProgress);
      applyToolCutting(prevSlice, curSlice);
      if (state.cutProgress >= 1) {
        state.cutProgress = 1;
        isAutoFeed = false;
        SimEngine.stop();
        SoundEngine.playSuccess();
      }
    }

    // Render chips
    for (let i = state.chips.length - 1; i >= 0; i--) {
      state.chips[i].update();
      state.chips[i].draw(ctx);
      if (state.chips[i].life <= 0) {
        state.chips.splice(i, 1);
      }
    }

    // Render smoke
    for (let i = state.smoke.length - 1; i >= 0; i--) {
      state.smoke[i].update();
      state.smoke[i].draw(ctx);
      if (state.smoke[i].life <= 0) {
        state.smoke.splice(i, 1);
      }
    }

    // 8. Info overlay on canvas
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.roundRect(w - 230, 15, 215, 80, 8);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();

    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = "#1e88e5";
    ctx.fillText("PAHAT RATA KANAN (KANAN ➔ KIRI)", w - 215, 34);

    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(`${Math.round(state.cutProgress * 100)}%`, w - 215, 56);

    ctx.font = "500 11px Inter, sans-serif";
    if (isRunning) {
      if (isAutoFeed) {
        ctx.fillStyle = "#2e7d32";
        ctx.fillText("● OTOMATIS: MENYAYAT KE KIRI", w - 215, 75);
      } else {
        ctx.fillStyle = "#d97706";
        ctx.fillText("● SPINDEL ON (MODE MANUAL)", w - 215, 75);
      }
    } else {
      ctx.fillStyle = "#64748b";
      ctx.fillText("■ MESIN STANDBY", w - 215, 75);
    }
  }

  // Draw Milling Simulation
  function drawMilling(timestamp) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Workshop clean background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const tableY = h * 0.72;
    const tableWidth = w * 0.82;
    const tableX = (w - tableWidth) / 2;

    // Workpiece Dimensions (scaled from simulation state)
    const pMm = state.workpieceP || 100;
    const lMm = state.workpieceL || 40;
    const tMm = state.workpieceT || 40;
    const endmillDia = state.endmillDia || 12;

    const wpWidth = Math.max(140, Math.min(w * 0.62, (pMm / 100) * (w * 0.45)));
    const wpHeight = Math.max(30, Math.min(75, (tMm / 40) * 52));
    const wpX = (w - wpWidth) / 2;
    const wpY = tableY - 26 - wpHeight;

    // 1. Draw Milling Table & Vise (Adapts to Workpiece Dimensions)
    ctx.fillStyle = "#334155";
    ctx.fillRect(tableX, tableY, tableWidth, 35);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(tableX, tableY, tableWidth, 35);

    // Table T-slots
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(tableX + 15, tableY + 8, tableWidth - 30, 6);
    ctx.fillRect(tableX + 15, tableY + 20, tableWidth - 30, 6);

    // Vise (ragum) Base & Body
    const viseWidth = wpWidth + 60;
    const viseX = wpX - 30;
    ctx.fillStyle = "#1e3a8a"; // Vise blue enamel
    ctx.fillRect(viseX, tableY - 26, viseWidth, 26);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(viseX, tableY - 26, viseWidth, 26);

    // Vise Jaws (Rear & Front jaws clamping the workpiece width L)
    const jawHeight = Math.min(32, wpHeight * 0.68);
    const jawY = tableY - 26 - jawHeight;

    // Left fixed jaw
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(viseX, jawY, 26, jawHeight + 26);
    ctx.fillStyle = "#94a3b8"; // Steel jaw plate
    ctx.fillRect(viseX + 22, jawY, 4, jawHeight);

    // Right movable jaw (clamps against workpiece right side)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(wpX + wpWidth, jawY, 26, jawHeight + 26);
    ctx.fillStyle = "#94a3b8"; // Steel jaw plate
    ctx.fillRect(wpX + wpWidth, jawY, 4, jawHeight);

    // Parallel bar under workpiece
    ctx.fillStyle = "#475569";
    ctx.fillRect(wpX, tableY - 26 - 10, wpWidth, 10);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(wpX, tableY - 26 - 10, wpWidth, 10);

    // Auto Feed Progress Advancement & Physical Workpiece Intersection
    const curAxisX = typeof state.axisX === "number" ? state.axisX : 0;
    const curAxisY = typeof state.axisY === "number" ? state.axisY : 0;
    const curAxisZ = typeof state.axisZ === "number" ? state.axisZ : 0;
    const rMm = (endmillDia || 12) / 2;
    const halfP = pMm / 2;
    const halfL = lMm / 2;

    // Active cut penetration: axisZ > 0 penetrates workpiece; axisZ <= 0 is in the air
    const activeDepthMm = isAutoFeed ? (state.depthOfCut || (curAxisZ > 0 ? curAxisZ : 0)) : (curAxisZ > 0 ? curAxisZ : 0);

    // True physical overlap between rotating cutter cylinder and workpiece block
    const overlapsX = (curAxisX + rMm > -halfP) && (curAxisX - rMm < halfP);
    const overlapsY = (curAxisY + rMm > -halfL) && (curAxisY - rMm < halfL);
    const isTouchingWorkpiece = overlapsX && overlapsY && (activeDepthMm > 0);

    if (isRunning && isAutoFeed && state.cutProgress < 1) {
      const speedFactor = (state.feedRate * (state.numTeeth || 4) * state.rpm) / 50000;
      state.cutProgress = Math.min(1.0, state.cutProgress + Math.max(0.0006, speedFactor));

      // Auto-feed cycle starts slightly outside in the air, cuts across, and exits into the air
      const leadClearanceMm = rMm + 6;
      const startFeedX = -(halfP + leadClearanceMm);
      const endFeedX = +(halfP + leadClearanceMm);
      state.axisX = Math.round((startFeedX + state.cutProgress * (endFeedX - startFeedX)) * 10) / 10;

      // Stamp material cut ONLY when the cutter actually intersects workpiece material
      const feedX = state.axisX;
      const feedY = state.axisY || 0;
      const curOverX = (feedX + rMm > -halfP) && (feedX - rMm < halfP);
      const curOverY = (feedY + rMm > -halfL) && (feedY - rMm < halfL);
      if (curOverX && curOverY && activeDepthMm > 0) {
        const u = 0.5 + (feedX / pMm);
        const v = 0.5 + (feedY / lMm);
        stampMillingCut(u, v, rMm, activeDepthMm);
      }

      if (state.cutProgress >= 1) {
        state.cutProgress = 1;
        state.axisX = Math.round(endFeedX * 10) / 10;
        isAutoFeed = false;
        SimEngine.stop();
        SoundEngine.playSuccess();
      }
    }

    // 2. Draw Rectangular Block Workpiece with Persistent 2D Profile from millingGrid
    const rawMatColor = AppData.materials.find((m) => m.id === state.materialId)?.colorHex || "#94a3b8";
    const cutPos = wpX + wpWidth * state.cutProgress;
    const currentCutDepthPx = Math.max(0, Math.min(wpHeight * 0.75, (activeDepthMm / 5.0) * 20));

    let milledMatColor = "#f1f5f9";
    if (state.evaluation.status === "BURNT") {
      milledMatColor = "#312e81"; // Burnt heat-tempered blue
    } else if (state.evaluation.status === "CHATTER") {
      milledMatColor = "#64748b"; // Dull rough gray
    }

    // Render persistent 2D profile using millingGrid (column-by-column along X)
    const NX = 96;
    const NY = 48;
    const colWidth = wpWidth / NX;

    for (let ix = 0; ix < NX; ix++) {
      const colX = wpX + ix * colWidth;
      let maxDepthAtX = 0;
      for (let iy = 0; iy < NY; iy++) {
        const d = state.millingGrid[iy * NX + ix];
        if (d > maxDepthAtX) maxDepthAtX = d;
      }

      if (maxDepthAtX > 0.05) {
        const dPx = Math.min(wpHeight * 0.75, (maxDepthAtX / 5.0) * 20);
        // Cut region below stepped top
        ctx.fillStyle = milledMatColor;
        ctx.fillRect(colX, wpY + dPx, colWidth + 0.6, wpHeight - dPx);
        // Step shoulder shadow line
        ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
        ctx.fillRect(colX, wpY + dPx, colWidth + 0.6, 1.5);
      } else {
        // Pristine uncut stock column
        ctx.fillStyle = rawMatColor;
        ctx.fillRect(colX, wpY, colWidth + 0.6, wpHeight);
      }
    }

    // Solid Workpiece Perimeter (Bottom, Left & Right walls)
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wpX, wpY);
    ctx.lineTo(wpX, wpY + wpHeight);
    ctx.lineTo(wpX + wpWidth, wpY + wpHeight);
    ctx.lineTo(wpX + wpWidth, wpY);
    ctx.stroke();

    // Milled face swirl tool marks on cut sections
    ctx.strokeStyle = state.evaluation.status === "BURNT" ? "rgba(239, 68, 68, 0.45)" : "rgba(30, 41, 59, 0.20)";
    ctx.lineWidth = 1;
    for (let ix = 0; ix < NX; ix += 3) {
      let maxDepthAtX = 0;
      for (let iy = 0; iy < NY; iy++) {
        if (state.millingGrid[iy * NX + ix] > maxDepthAtX) maxDepthAtX = state.millingGrid[iy * NX + ix];
      }
      if (maxDepthAtX > 0.05) {
        const colX = wpX + ix * colWidth;
        const dPx = Math.min(wpHeight * 0.75, (maxDepthAtX / 5.0) * 20);
        ctx.beginPath();
        ctx.arc(colX, wpY + dPx + 14, 10, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
      }
    }

    // 3. Rotating Milling Cutter & Arbor Assembly (Unconstrained Free Motion Across Machine Table)
    const wpCenterX = wpX + wpWidth / 2;
    const rawCutterPxX = wpCenterX + (curAxisX / pMm) * wpWidth;
    const minTableCutterX = tableX + 22;
    const maxTableCutterX = tableX + tableWidth - 22;
    const cutterCenterX = Math.max(minTableCutterX, Math.min(maxTableCutterX, rawCutterPxX));
    const cutterRadius = Math.max(8, Math.min(32, ((endmillDia / 2) / pMm) * wpWidth));

    // Vertical elevation: clearance above workpiece when curAxisZ <= 0
    let cutterTipY = wpY;
    if (activeDepthMm > 0) {
      const cutDepthPx = Math.min(wpHeight * 0.75, (activeDepthMm / 5.0) * 20);
      cutterTipY = wpY + cutDepthPx;
    } else {
      const airGapMm = Math.abs(curAxisZ);
      const clearancePx = Math.min(42, (airGapMm / 20.0) * 32);
      cutterTipY = wpY - clearancePx;
    }

    // Spindle Quill Sleeve (Chrome)
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(cutterCenterX - 22, 0, 44, Math.max(10, cutterTipY - 75));
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cutterCenterX - 22, 0, 44, Math.max(10, cutterTipY - 75));

    // Spindle Nose Flange (NT40 Spindle Collar)
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cutterCenterX - 20, cutterTipY - 75, 40, 14);
    ctx.strokeStyle = "#475569";
    ctx.strokeRect(cutterCenterX - 20, cutterTipY - 75, 40, 14);

    // Arbor Tool Holder Body & V-Flange (BT40/ER32 Arbor)
    ctx.fillStyle = "#475569";
    ctx.fillRect(cutterCenterX - 17, cutterTipY - 61, 34, 16);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(cutterCenterX - 17, cutterTipY - 61, 34, 16);

    // Collet Clamping Nut (ER32 Precision Nut)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(cutterCenterX - 13, cutterTipY - 45, 26, 16);
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(cutterCenterX - 13, cutterTipY - 45, 26, 16);

    // End Mill Shank (tangkai pisau dicekam collet)
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cutterCenterX - Math.max(3, cutterRadius * 0.75), cutterTipY - 29, Math.max(6, cutterRadius * 1.5), 14);

    // End Mill Fluted Body (lebar pisau presisi mengikuti diameter End Mill)
    ctx.fillStyle = state.toolId === "carbide" ? "#334155" : "#475569";
    ctx.fillRect(cutterCenterX - cutterRadius, cutterTipY - 15, cutterRadius * 2, 15);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cutterCenterX - cutterRadius, cutterTipY - 15, cutterRadius * 2, 15);

    // Rotating Helical Flute Edges (Alur Heliks Mata Potong Baja / Karbida Metalik)
    const rotAngle = isRunning ? (timestamp * 0.007 * (state.rpm / 300)) : 0;
    const numTeeth = state.numTeeth || 4;
    for (let i = 0; i < numTeeth; i++) {
      const a = rotAngle + (i * Math.PI * 2) / numTeeth;
      const tx = cutterCenterX + Math.cos(a) * (cutterRadius - 2.5);
      const ty = (cutterTipY - 7.5) + Math.sin(a) * (cutterRadius * 0.35);

      // Clean metallic silver/steel flute highlights (menghilangkan bulatan kuning asing)
      ctx.fillStyle = (state.evaluation.status === "BURNT" && isRunning) ? "#ef4444" : "#94a3b8";
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(1.8, cutterRadius * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }

    const isCuttingNow = isRunning && isTouchingWorkpiece &&
                         (isAutoFeed || (state.lastJogCutting && (Date.now() - state.lastJogCutting < 350)));

    // Dynamic Sound: Cutting roar only when physically cutting material, smooth hum when in air
    if (isRunning) {
      if (isCuttingNow) {
        SoundEngine.startCutting();
      } else {
        SoundEngine.stopCutting();
      }
    }

    // Cutter contact glint / cutting point (only when actively cutting)
    if (isCuttingNow) {
      ctx.fillStyle = state.evaluation.status === "BURNT" ? "rgba(239, 68, 68, 0.8)" : "rgba(241, 245, 249, 0.85)";
      ctx.beginPath();
      ctx.arc(cutterCenterX, cutterTipY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coolant spray
    if (state.coolant && isRunning) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cutterCenterX - 35, cutterTipY - 45);
      ctx.quadraticCurveTo(cutterCenterX - 15, cutterTipY - 10, cutterCenterX, cutterTipY + 2);
      ctx.stroke();
    }

    // Particles (Chips, Smoke) - ONLY emitted when physically cutting workpiece!
    if (isCuttingNow) {
      for (let i = 0; i < 2; i++) {
        state.chips.push(new Chip(cutterCenterX, cutterTipY + 2, rawMatColor));
      }
      if (state.evaluation.status === "BURNT") {
        state.smoke.push(new SmokeParticle(cutterCenterX, cutterTipY));
      }
    }

    // Render chips
    for (let i = state.chips.length - 1; i >= 0; i--) {
      state.chips[i].update();
      state.chips[i].draw(ctx);
      if (state.chips[i].life <= 0) state.chips.splice(i, 1);
    }
    // Render smoke
    for (let i = state.smoke.length - 1; i >= 0; i--) {
      state.smoke[i].update();
      state.smoke[i].draw(ctx);
      if (state.smoke[i].life <= 0) state.smoke.splice(i, 1);
    }

    // 4. Plan View HUD (Tampak Atas Benda Kerja - Visualisasi Alur Sumbu X & Y)
    const pvBoxX = 14;
    const pvBoxY = 12;
    const pvBoxW = 196;
    const pvBoxH = 118;

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(pvBoxX, pvBoxY, pvBoxW, pvBoxH, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 9.5px Inter, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("📐 TAMPAK ATAS BENDA (SUMBU X & Y)", pvBoxX + 10, pvBoxY + 16);

    // Vise jaws in Plan View
    const pvW = 142;
    const pvH = 46;
    const pvX = pvBoxX + (pvBoxW - pvW) / 2;
    const pvY = pvBoxY + 26;

    // Rear Fixed Jaw
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(pvX - 6, pvY - 5, pvW + 12, 5);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(pvX, pvY - 1.5, pvW, 1.5);

    // Front Movable Jaw
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(pvX - 6, pvY + pvH, pvW + 12, 5);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(pvX, pvY + pvH, pvW, 1.5);

    // Uncut stock surface
    ctx.fillStyle = "#334155";
    ctx.fillRect(pvX, pvY, pvW, pvH);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(pvX, pvY, pvW, pvH);

    // Render millingGrid cells in Plan View
    const cellW = pvW / NX;
    const cellH = pvH / NY;
    for (let iy = 0; iy < NY; iy++) {
      const rowOffset = iy * NX;
      for (let ix = 0; ix < NX; ix++) {
        const d = state.millingGrid[rowOffset + ix];
        if (d > 0.05) {
          if (state.evaluation.status === "BURNT") {
            ctx.fillStyle = "#4338ca";
          } else if (state.evaluation.status === "CHATTER") {
            ctx.fillStyle = "#94a3b8";
          } else {
            ctx.fillStyle = "#f8fafc";
          }
          ctx.fillRect(pvX + ix * cellW, pvY + iy * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // Coordinate Crosshairs (Center Lines)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pvX, pvY + pvH / 2);
    ctx.lineTo(pvX + pvW, pvY + pvH / 2);
    ctx.moveTo(pvX + pvW / 2, pvY);
    ctx.lineTo(pvX + pvW / 2, pvY + pvH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live End Mill Cutter Footprint in Plan View (Unconstrained free motion)
    const pvCenterX = pvX + pvW / 2;
    const pvCenterY = pvY + pvH / 2;
    const rawToolPxX = pvCenterX + (curAxisX / pMm) * pvW;
    const rawToolPxY = pvCenterY + (curAxisY / lMm) * pvH;
    const toolPxX = Math.max(pvBoxX + 16, Math.min(pvBoxX + pvBoxW - 16, rawToolPxX));
    const toolPxY = Math.max(pvBoxY + 16, Math.min(pvBoxY + pvBoxH - 16, rawToolPxY));
    const toolRadPx = Math.max(3.5, Math.min(22, (rMm / pMm) * pvW));

    // Cutter circle - green when cutting, sky blue when in free air movement
    ctx.strokeStyle = isCuttingNow ? "#22c55e" : "#38bdf8";
    ctx.lineWidth = isCuttingNow ? 2.0 : 1.5;
    ctx.fillStyle = isCuttingNow
      ? "rgba(34, 197, 94, 0.45)"
      : (isRunning ? "rgba(56, 189, 248, 0.25)" : "rgba(148, 163, 184, 0.2)");
    ctx.beginPath();
    ctx.arc(toolPxX, toolPxY, toolRadPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating teeth tick marks on tool in Plan View
    if (isRunning) {
      for (let t = 0; t < 4; t++) {
        const ta = rotAngle + (t * Math.PI) / 2;
        ctx.strokeStyle = "#94a3b8"; // Steel metallic edge tick marks
        ctx.beginPath();
        ctx.moveTo(toolPxX + Math.cos(ta) * (toolRadPx - 2), toolPxY + Math.sin(ta) * (toolRadPx - 2));
        ctx.lineTo(toolPxX + Math.cos(ta) * toolRadPx, toolPxY + Math.sin(ta) * toolRadPx);
        ctx.stroke();
      }
    }

    // Coordinate Readouts in Plan View
    ctx.font = "600 8.5px monospace";
    ctx.fillStyle = "#38bdf8";
    const xStr = curAxisX.toFixed(1);
    const yStr = curAxisY.toFixed(1);
    const zStr = curAxisZ.toFixed(1);
    ctx.fillText(`X:${xStr >= 0 ? "+" : ""}${xStr} Y:${yStr >= 0 ? "+" : ""}${yStr} Z:${zStr}`, pvBoxX + 10, pvBoxY + 98);

    ctx.font = "600 8.5px Inter, sans-serif";
    if (isCuttingNow) {
      ctx.fillStyle = "#22c55e";
      ctx.fillText(`● MENYAYAT (${endmillDia}mm) [t:${activeDepthMm.toFixed(1)}mm]`, pvBoxX + 10, pvBoxY + 110);
    } else if (isRunning) {
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`○ GERAK BEBAS DI UDARA`, pvBoxX + 10, pvBoxY + 110);
    } else {
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`■ MESIN STANDBY`, pvBoxX + 10, pvBoxY + 110);
    }

    // 5. Info overlay on top right
    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.beginPath();
    ctx.roundRect(w - 252, 12, 240, 116, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.stroke();

    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`END MILL Ø ${endmillDia} mm (${state.toolId === "carbide" ? "KARBIDA" : "HSS"})`, w - 238, 30);

    ctx.font = "500 10px Inter, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Arbor: BT40 / ER32 Collet Chuck`, w - 238, 48);
    ctx.fillText(`Lebar Alur: ${endmillDia} mm | Kedalaman: ${activeDepthMm.toFixed(2)} mm`, w - 238, 65);
    ctx.fillText(`Benda: ${pMm} × ${lMm} × ${tMm} mm`, w - 238, 82);
    ctx.fillText(`Kecepatan Potong (Cs): ${state.csActual || 0} m/menit`, w - 238, 98);

    ctx.font = "600 10px Inter, sans-serif";
    if (isCuttingNow) {
      ctx.fillStyle = "#22c55e";
      ctx.fillText(`● AKTIF MENYAYAT (${Math.round(state.cutProgress * 100)}%)`, w - 238, 115);
    } else if (isRunning) {
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`○ GERAK BEBAS TANPA MENYAYAT`, w - 238, 115);
    } else {
      ctx.fillStyle = "#eab308";
      ctx.fillText(`■ MESIN STANDBY`, w - 238, 115);
    }
  }

  // Animation Loop
  function loop(timestamp) {
    if (state.machineType === "milling") {
      drawMilling(timestamp);
    } else {
      drawLathe(timestamp);
    }
    animId = requestAnimationFrame(loop);
  }

  return {
    init: (canvasEl) => {
      canvas = canvasEl;
      ctx = canvas.getContext("2d");
      SimEngine.resize();
      window.addEventListener("resize", SimEngine.resize);
      computeParameters();
      if (!animId) {
        animId = requestAnimationFrame(loop);
      }
    },

    resize: () => {
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = 320;
    },

    getState: () => ({ ...state, isRunning, isAutoFeed }),

    updateConfig: (newProps) => {
      Object.assign(state, newProps);
      if (newProps.diameter !== undefined && state.contour) {
        const initR = state.diameter / 2;
        for (let i = 0; i < state.contour.length; i++) {
          state.contour[i] = initR;
        }
      }
      if ((newProps.workpieceP !== undefined || newProps.workpieceL !== undefined || newProps.workpieceT !== undefined) && state.millingGrid) {
        state.millingGrid.fill(0);
        state.millingGridVersion = (state.millingGridVersion || 0) + 1;
      }
      if (isRunning && newProps.depthOfCut !== undefined) {
        if (state.machineType === "milling") {
          const depthMm = state.depthOfCut;
          if (depthMm > 0) {
            const pMm = state.workpieceP || 100;
            const lMm = state.workpieceL || 40;
            const u = isAutoFeed ? state.cutProgress : Math.max(0, Math.min(1, 0.5 + ((state.axisX || 0) / pMm)));
            const v = Math.max(0, Math.min(1, 0.5 + ((state.axisY || 0) / lMm)));
            const rMm = (state.endmillDia || 12) / 2;
            stampMillingCut(u, v, rMm, depthMm);
          }
        } else {
          updateWorkpieceCutting();
        }
      }
      const evalResult = computeParameters();
      if (isRunning) {
        SoundEngine.updateSpindlePitch(state.rpm);
      }
      return evalResult;
    },

    calculateRPM: (targetCs, dia) => {
      const isMilling = state.machineType === "milling";
      const d = dia || (isMilling ? (state.endmillDia || 12) : state.diameter);
      const cs = targetCs || state.csTarget;
      const rpm = (1000 * cs) / (Math.PI * d);
      return Math.round(rpm);
    },

    setCutProgress: (prog) => {
      state.cutProgress = Math.max(0, Math.min(1, prog));
    },

    jogAxis: (axis, direction, stepMm) => {
      // Matikan pergerakan otomatis seketika saat pergerakan manual dilakukan
      isAutoFeed = false;
      const step = typeof stepMm === "number" ? stepMm : 0.5;

      // Pastikan spindel berputar dalam mode manual jika sebelumnya mati
      if (!isRunning) {
        SimEngine.start(false);
      }

      // ----------------------------------------------------
      // MODE MESIN FRAIS (MILLING): 3 SUMBU X, Y, Z
      // ----------------------------------------------------
      if (state.machineType === "milling") {
        function emitMillingJogChips() {
          const rawMatColor = AppData.materials.find((m) => m.id === state.materialId)?.colorHex || "#94a3b8";
          const chipColor = state.evaluation.status === "BURNT" ? "#312e81" : rawMatColor;
          const w = canvas ? canvas.width : 600;
          const h = canvas ? canvas.height : 320;
          const tableY = h * 0.72;
          const pMm = state.workpieceP || 100;
          const wpWidth = Math.max(140, Math.min(w * 0.62, (pMm / 100) * (w * 0.45)));
          const wpX = (w - wpWidth) / 2;
          const wpCenterX = wpX + wpWidth / 2;
          const cutPos = wpCenterX + ((state.axisX || 0) / pMm) * wpWidth;
          const wpHeight = Math.max(30, Math.min(75, ((state.workpieceT || 40) / 40) * 52));
          const wpY = tableY - 26 - wpHeight;
          for (let i = 0; i < 3; i++) {
            state.chips.push(new Chip(cutPos, wpY + 6, chipColor));
          }
        }

        function checkAndStampMillingCut() {
          const pMm = state.workpieceP || 100;
          const lMm = state.workpieceL || 40;
          const rMm = (state.endmillDia || 12) / 2;
          const halfP = pMm / 2;
          const halfL = lMm / 2;
          const curX = typeof state.axisX === "number" ? state.axisX : 0;
          const curY = typeof state.axisY === "number" ? state.axisY : 0;
          const curZ = typeof state.axisZ === "number" ? state.axisZ : 0;
          const depthMm = curZ > 0 ? curZ : 0;

          const overlapsX = (curX + rMm > -halfP) && (curX - rMm < halfP);
          const overlapsY = (curY + rMm > -halfL) && (curY - rMm < halfL);

          if (overlapsX && overlapsY && depthMm > 0) {
            const u = 0.5 + (curX / pMm);
            const v = 0.5 + (curY / lMm);
            stampMillingCut(u, v, rMm, depthMm);
            state.lastJogCutting = Date.now();
            emitMillingJogChips();
          }
        }

        if (axis === "X") {
          // Sumbu X: Gerak Memanjang Meja Mesin Frais (Kiri / Kanan)
          // Unconstrained travel allowing endmill to move freely in air beyond workpiece
          const pMm = state.workpieceP || 100;
          const halfP = pMm / 2;
          const maxTravelX = Math.max(120, halfP + 50);
          const stepVal = step * 2.0;
          const curVal = typeof state.axisX === "number" ? state.axisX : 0;
          const newVal = Math.max(-maxTravelX, Math.min(maxTravelX, curVal + direction * stepVal));
          state.axisX = Math.round(newVal * 10) / 10;
          state.cutProgress = (state.axisX + halfP) / pMm;
          checkAndStampMillingCut();
          return { axis: "X", value: state.axisX, cutProgress: state.cutProgress, isAutoFeed };
        } else if (axis === "Y") {
          // Sumbu Y: Gerak Melintang Sadel Mesin Frais (Mundur / Maju)
          // Free travel in air forwards/backwards past vise jaws
          const lMm = state.workpieceL || 40;
          const halfL = lMm / 2;
          const maxTravelY = Math.max(50, halfL + 30);
          const stepVal = step * 1.5;
          const curVal = typeof state.axisY === "number" ? state.axisY : 0;
          const newVal = Math.max(-maxTravelY, Math.min(maxTravelY, curVal + direction * stepVal));
          state.axisY = Math.round(newVal * 10) / 10;
          checkAndStampMillingCut();
          return { axis: "Y", value: state.axisY, cutProgress: state.cutProgress, isAutoFeed };
        } else if (axis === "Z") {
          // Sumbu Z: Gerak Vertikal Lutut Mesin Frais (Turun / Naik)
          // Z <= 0 : tool is in air above workpiece (free movement)
          // Z > 0  : tool penetrates and cuts into workpiece
          const stepVal = step * 1.0;
          const curVal = typeof state.axisZ === "number" ? state.axisZ : 0;
          const newVal = Math.max(-25, Math.min(25, curVal + direction * stepVal));
          state.axisZ = Math.round(newVal * 10) / 10;

          if (state.axisZ > 0) {
            state.depthOfCut = Math.round(state.axisZ * 10) / 10;
            computeParameters();
          } else {
            state.depthOfCut = 0;
          }
          checkAndStampMillingCut();
          return { axis: "Z", value: state.axisZ, cutProgress: state.cutProgress, isAutoFeed };
        }
      }

      // ----------------------------------------------------
      // MODE MESIN BUBUT (LATHE): SUMBU X (RADIAL) & Z (MEMANJANG)
      // ----------------------------------------------------
      const rawRadiusMm = (state.diameter || 50) / 2;
      const maxDepth = Math.max(1.0, rawRadiusMm - 2.0); // Sisakan inti minimal 4 mm

      function emitJogChips() {
        const rawMatColor = AppData.materials.find((m) => m.id === state.materialId)?.colorHex || "#94a3b8";
        const chipColor = state.evaluation.status === "BURNT" ? "#312e81" : rawMatColor;
        const wpStartX = 50 + 70 + 10;
        const wpTotalLength = Math.min(320, (canvas ? canvas.width : 600) * 0.5);
        const wpEndX = wpStartX + wpTotalLength;
        const norm = Math.max(0, Math.min(1, state.cutProgress));
        const toolTipX = wpEndX - (wpTotalLength * norm);
        const rawRadiusPx = Math.min(45, Math.max(20, state.diameter * 0.6));
        const scalePx = rawRadiusPx / rawRadiusMm;
        const activeCutRMm = Math.max(2.0, rawRadiusMm - (state.depthOfCut || 0));
        const centerY = canvas ? canvas.height * 0.48 : 150;
        const toolTipY = centerY + (activeCutRMm * scalePx);
        for (let i = 0; i < 3; i++) {
          state.chips.push(new Chip(toolTipX, toolTipY, chipColor, 1));
        }
      }

      if (axis === "X") {
        // Sumbu X: Bergerak secara melintang / radial tegak lurus sumbu spindel.
        // X- : Maju ke arah benda kerja (Infeed / Memotong lebih dalam)
        // X+ : Mundur menjauhi benda kerja (Retract / Bebas)
        const curDepth = typeof state.depthOfCut === "number" ? state.depthOfCut : 1.5;
        let newDepth = curDepth;
        if (direction < 0) {
          // X- : Maju (infeed)
          newDepth = Math.min(maxDepth, curDepth + step);
        } else {
          // X+ : Mundur (retract)
          newDepth = Math.max(0.0, curDepth - step);
        }
        newDepth = Math.round(newDepth * 100) / 100;
        state.depthOfCut = newDepth;
        computeParameters();

        // Lakukan pemakanan radial pada posisi pahat saat ini
        const curSlice = getToolSlice(state.cutProgress);
        applyToolCutting(curSlice - 1, curSlice + 1);

        state.lastJogCutting = Date.now();
        emitJogChips();

        return { axis: "X", value: newDepth, cutProgress: state.cutProgress, isAutoFeed };
      } else if (axis === "Z") {
        // Sumbu Z: Bergerak secara memanjang sejajar sumbu spindel.
        // Z- : Bergerak ke kiri (ke arah chuck / kepala tetap) -> Melakukan pemakanan memanjang
        // Z+ : Bergerak ke kanan (ke arah tailstock / kepala lepas) -> Mundur ke kanan
        const totalLen = state.length || 120;
        // Travel distance in mm per step
        const travelDeltaMm = Math.max(0.2, step * 2.5); // ~1.25 mm per klik 0.5 step
        const progressDelta = travelDeltaMm / totalLen;

        const prevProg = state.cutProgress;
        let newProgress = prevProg;
        if (direction < 0) {
          // Z- : Ke Kiri (Makan)
          newProgress = Math.min(1.0, prevProg + progressDelta);
        } else {
          // Z+ : Ke Kanan (Mundur)
          newProgress = Math.max(0.0, prevProg - progressDelta);
        }

        const prevSlice = getToolSlice(prevProg);
        const newSlice = getToolSlice(newProgress);
        state.cutProgress = newProgress;

        // Pemakanan terjadi baik bergerak ke kiri (Z-) maupun ke kanan (Z+) jika kedalaman potong aktif
        if (state.depthOfCut > 0) {
          applyToolCutting(prevSlice, newSlice);
          state.lastJogCutting = Date.now();
          emitJogChips();
        }

        if (state.cutProgress >= 1) {
          state.cutProgress = 1;
          isAutoFeed = false;
          SimEngine.stop();
          SoundEngine.playSuccess();
        }
        return { axis: "Z", value: state.cutProgress * totalLen, cutProgress: state.cutProgress, isAutoFeed };
      }
      return { axis, value: 0, cutProgress: state.cutProgress, isAutoFeed };
    },

    start: (enableAutoFeed = true) => {
      isRunning = true;
      if (enableAutoFeed) {
        isAutoFeed = true;
      }
      computeParameters();
      if (state.machineType === "milling") {
        const pMm = state.workpieceP || 100;
        const lMm = state.workpieceL || 40;
        const rMm = (state.endmillDia || 12) / 2;
        const halfP = pMm / 2;
        const halfL = lMm / 2;
        const curX = typeof state.axisX === "number" ? state.axisX : 0;
        const curY = typeof state.axisY === "number" ? state.axisY : 0;
        const curZ = typeof state.axisZ === "number" ? state.axisZ : 0;
        const depthMm = curZ > 0 ? curZ : (isAutoFeed ? (state.depthOfCut || 0) : 0);

        const overlapsX = (curX + rMm > -halfP) && (curX - rMm < halfP);
        const overlapsY = (curY + rMm > -halfL) && (curY - rMm < halfL);
        if (overlapsX && overlapsY && depthMm > 0) {
          const u = 0.5 + (curX / pMm);
          const v = 0.5 + (curY / lMm);
          stampMillingCut(u, v, rMm, depthMm);
        }
      } else {
        const curSlice = getToolSlice(state.cutProgress);
        applyToolCutting(curSlice - 1, curSlice + 1);
      }
      SoundEngine.startSpindle(state.rpm);
      if (state.machineType !== "milling") {
        SoundEngine.startCutting();
      }
      if (state.evaluation.status === "BURNT") {
        SoundEngine.playAlarm();
      }
    },

    stop: () => {
      isRunning = false;
      isAutoFeed = false;
      SoundEngine.stopSpindle();
      SoundEngine.stopCutting();
    },

    reset: () => {
      SimEngine.stop();
      isAutoFeed = false;
      state.cutProgress = 0;
      state.axisX = 0;
      state.axisY = 0;
      state.axisZ = 0;
      state.chips = [];
      state.smoke = [];
      if (state.millingGrid) {
        state.millingGrid.fill(0);
        state.millingGridVersion = (state.millingGridVersion || 0) + 1;
      }
      if (state.contour) {
        const initR = state.diameter / 2;
        for (let i = 0; i < state.contour.length; i++) {
          state.contour[i] = initR;
        }
      }
      computeParameters();
    },

    toggleAutoFeed: () => {
      isAutoFeed = !isAutoFeed;
      if (isAutoFeed && !isRunning) {
        isRunning = true;
        computeParameters();
        SoundEngine.startSpindle(state.rpm);
        SoundEngine.startCutting();
        if (state.evaluation.status === "BURNT") {
          SoundEngine.playAlarm();
        }
      }
      return isAutoFeed;
    },

    setAutoFeed: (val) => {
      isAutoFeed = !!val;
      if (isAutoFeed && !isRunning) {
        isRunning = true;
        computeParameters();
        SoundEngine.startSpindle(state.rpm);
        SoundEngine.startCutting();
      }
    },

    isAutoFeed: () => isAutoFeed,
    isRunning: () => isRunning
  };
})();
