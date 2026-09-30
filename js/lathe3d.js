/**
 * Lathe3D — Comprehensive 3D Lathe Engine & Virtual Machining Lab
 * Powered by Three.js & OrbitControls
 * 
 * Accurately proportioned industrial metal lathe assembly:
 * - Proper realistic scale ratio: Bed, Headstock, Chuck, Workpiece, Carriage, and Tailstock
 * - Generous spacing with NO overlapping or colliding parts
 * - 360-degree interactive orbit rotation and precision zoom inspection
 * - Smooth camera focus / zoom animations to individual parts for Anatomi Mesin
 * - Visual 3D component highlighting when inspecting parts
 * - Real-time 3D turning simulation with dynamic workpiece cutting, flying metal chips,
 *   coolant flow, red-hot thermal effects, and surface finish grading
 */

const Lathe3D = (function () {
  // Shared Color Palette for realistic industrial machinery
  const PALETTE = {
    machineBody: 0x243b55,      // Industrial machine enamel slate-blue
    machineBodyDark: 0x142233,
    castIron: 0x334155,         // Heavy cast iron bed & legs
    castIronDark: 0x1e293b,
    steelPolished: 0xe2e8f0,    // Ground precision bed ways, quill, spindles
    steelMatte: 0x94a3b8,
    steelDark: 0x475569,
    chrome: 0xf8fafc,           // Handwheels, levers
    brass: 0xd97706,            // Feed gears, dials, brass fittings
    bronze: 0xb45309,
    carbideGold: 0xf59e0b,      // Carbide insert cutting tip (PVD TiN coating)
    carbideShank: 0x1e293b,     // Black oxide tool shank
    emergencyRed: 0xdc2626,     // E-Stop button
    switchYellow: 0xfacc15,
    coolantBlue: 0x38bdf8,
    coolantPipe: 0x0284c7,
    coolantNozzle: 0xf59e0b,
    highlight: 0x38bdf8
  };

  /**
   * Helper to create basic materials with consistent lighting properties
   */
  function createMat(color, roughness = 0.4, metalness = 0.6, options = {}) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      ...options
    });
  }

  /**
   * Generates a dynamic 3D turned workpiece with cylindrical rings along the spindle axis (X).
   * Supports real-time sculpting of turned diameters, shoulders, steps, and finishes.
   */
  function createContourWorkpiece(numSlices = 120, radialSegments = 32) {
    const rawLength = 7.6;
    const startX = 0.65; // local X at chuck face
    const endX = startX + rawLength; // 8.25 at tailstock center
    const baseRadius = 0.36;

    const numVertsAlongLength = numSlices;
    const numVertsRadial = radialSegments + 1;
    const totalCylinderVerts = numVertsAlongLength * numVertsRadial;
    const totalCapVerts = (radialSegments + 2) * 2;
    const totalVerts = totalCylinderVerts + totalCapVerts;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const indices = [];

    // Precalculate cos and sin lookup tables
    const cosTable = new Float32Array(numVertsRadial);
    const sinTable = new Float32Array(numVertsRadial);
    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      cosTable[j] = Math.cos(theta);
      sinTable[j] = Math.sin(theta);
    }

    // 1. Generate cylinder mantle vertices
    for (let i = 0; i < numSlices; i++) {
      const t = i / (numSlices - 1);
      const x = startX + t * rawLength;
      for (let j = 0; j <= radialSegments; j++) {
        const idx = (i * numVertsRadial + j) * 3;
        const uvIdx = (i * numVertsRadial + j) * 2;
        positions[idx] = x;
        positions[idx + 1] = baseRadius * cosTable[j];
        positions[idx + 2] = baseRadius * sinTable[j];

        normals[idx] = 0;
        normals[idx + 1] = cosTable[j];
        normals[idx + 2] = sinTable[j];

        // Raw steel color (bright machine ground steel)
        colors[idx] = 0.70;
        colors[idx + 1] = 0.75;
        colors[idx + 2] = 0.82;

        uvs[uvIdx] = t;
        uvs[uvIdx + 1] = j / radialSegments;
      }
    }

    // Body triangle indices (wound counter-clockwise for outward-facing normals)
    for (let i = 0; i < numSlices - 1; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const v1 = i * numVertsRadial + j;
        const v2 = (i + 1) * numVertsRadial + j;
        const v3 = (i + 1) * numVertsRadial + (j + 1);
        const v4 = i * numVertsRadial + (j + 1);

        indices.push(v1, v4, v2);
        indices.push(v4, v3, v2);
      }
    }

    // 2. Chuck end-cap (at startX, normal -X)
    const cap1Center = totalCylinderVerts;
    const cap1Ring = cap1Center + 1;
    positions[cap1Center * 3] = startX;
    positions[cap1Center * 3 + 1] = 0;
    positions[cap1Center * 3 + 2] = 0;
    normals[cap1Center * 3] = -1;
    normals[cap1Center * 3 + 1] = 0;
    normals[cap1Center * 3 + 2] = 0;
    colors[cap1Center * 3] = 0.50;
    colors[cap1Center * 3 + 1] = 0.55;
    colors[cap1Center * 3 + 2] = 0.60;
    uvs[cap1Center * 2] = 0.5;
    uvs[cap1Center * 2 + 1] = 0.5;

    for (let j = 0; j <= radialSegments; j++) {
      const idx = (cap1Ring + j) * 3;
      const uvIdx = (cap1Ring + j) * 2;
      positions[idx] = startX;
      positions[idx + 1] = baseRadius * cosTable[j];
      positions[idx + 2] = baseRadius * sinTable[j];
      normals[idx] = -1;
      normals[idx + 1] = 0;
      normals[idx + 2] = 0;
      colors[idx] = 0.50;
      colors[idx + 1] = 0.55;
      colors[idx + 2] = 0.60;
      uvs[uvIdx] = 0.5 + 0.5 * cosTable[j];
      uvs[uvIdx + 1] = 0.5 + 0.5 * sinTable[j];
    }
    for (let j = 0; j < radialSegments; j++) {
      indices.push(cap1Center, cap1Ring + j + 1, cap1Ring + j);
    }

    // 3. Right end-cap (at endX, normal +X)
    const cap2Center = cap1Ring + radialSegments + 1;
    const cap2Ring = cap2Center + 1;
    positions[cap2Center * 3] = endX;
    positions[cap2Center * 3 + 1] = 0;
    positions[cap2Center * 3 + 2] = 0;
    normals[cap2Center * 3] = 1;
    normals[cap2Center * 3 + 1] = 0;
    normals[cap2Center * 3 + 2] = 0;
    colors[cap2Center * 3] = 0.65;
    colors[cap2Center * 3 + 1] = 0.70;
    colors[cap2Center * 3 + 2] = 0.75;
    uvs[cap2Center * 2] = 0.5;
    uvs[cap2Center * 2 + 1] = 0.5;

    for (let j = 0; j <= radialSegments; j++) {
      const idx = (cap2Ring + j) * 3;
      const uvIdx = (cap2Ring + j) * 2;
      positions[idx] = endX;
      positions[idx + 1] = baseRadius * cosTable[j];
      positions[idx + 2] = baseRadius * sinTable[j];
      normals[idx] = 1;
      normals[idx + 1] = 0;
      normals[idx + 2] = 0;
      colors[idx] = 0.65;
      colors[idx + 1] = 0.70;
      colors[idx + 2] = 0.75;
      uvs[uvIdx] = 0.5 + 0.5 * cosTable[j];
      uvs[uvIdx + 1] = 0.5 + 0.5 * sinTable[j];
    }
    for (let j = 0; j < radialSegments; j++) {
      indices.push(cap2Center, cap2Ring + j, cap2Ring + j + 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      metalness: 0.85,
      roughness: 0.22,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;

    return {
      mesh,
      geometry: geo,
      material: mat,
      numSlices,
      radialSegments,
      numVertsRadial,
      cosTable,
      sinTable,
      cap1Ring,
      cap2Ring,
      baseRadius,
      startX,
      endX,
      rawLength
    };
  }

  /**
   * Updates the 3D workpiece vertex radii and colors to match the actual cut contour
   */
  function updateContourMesh(wpObj, contourArray, maxDiaMm, status, rawMatHex, materialId) {
    if (!wpObj || !wpObj.geometry || !wpObj.geometry.attributes || !wpObj.geometry.attributes.position) return;
    const { geometry, numSlices, radialSegments, numVertsRadial, cosTable, sinTable, cap1Ring, cap2Ring, baseRadius } = wpObj;

    const pos = geometry.attributes.position.array;
    const col = geometry.attributes.color.array;

    const rawRadiusMm = (typeof maxDiaMm === "number" && !isNaN(maxDiaMm) && maxDiaMm > 0) ? maxDiaMm / 2 : 25.0;
    const refRadiusMm = 25.0; // 50 mm standard reference diameter
    const scale = (baseRadius || 0.36) / refRadiusMm;

    // Parse raw material color
    let rawColor;
    try {
      rawColor = new THREE.Color(rawMatHex || 0x64748b);
    } catch (e) {
      rawColor = new THREE.Color(0x64748b);
    }

    let cutR = 0.94, cutG = 0.96, cutB = 1.0; // Mirror steel shine default
    if (status === "BURNT") {
      cutR = 0.12; cutG = 0.11; cutB = 0.28; // Tempered dark blue/purple burn
    } else if (status === "CHATTER") {
      cutR = 0.58; cutG = 0.62; cutB = 0.68; // Matte chatter gray
    } else {
      if (materialId === "brass") {
        cutR = 0.98; cutG = 0.88; cutB = 0.42; // Gleaming turned brass gold
      } else if (materialId === "aluminum") {
        cutR = 0.98; cutG = 0.99; cutB = 1.00; // Ultra bright aluminum
      } else if (materialId === "cast_iron") {
        cutR = 0.70; cutG = 0.74; cutB = 0.78; // Graphite cast iron
      } else {
        cutR = 0.94; cutG = 0.96; cutB = 1.00; // Bright polished steel
      }
    }

    const hasContour = Array.isArray(contourArray) || contourArray instanceof Float32Array;
    const n = Math.min(numSlices, hasContour ? contourArray.length : 0);
    if (n === 0) return;

    for (let i = 0; i < n; i++) {
      let rMm = contourArray[i];
      if (typeof rMm !== "number" || isNaN(rMm)) rMm = rawRadiusMm;
      const r3D = Math.max(0.04, rMm * scale);
      const isCut = rMm < (rawRadiusMm - 0.08);

      let cr = isCut ? cutR : rawColor.r;
      let cg = isCut ? cutG : rawColor.g;
      let cb = isCut ? cutB : rawColor.b;

      // Slight contrast accent on stepped shoulders
      if (i > 0 && Math.abs(contourArray[i] - contourArray[i - 1]) > 0.3) {
        cr *= 0.85;
        cg *= 0.85;
        cb *= 0.85;
      }

      const baseIdx = i * numVertsRadial;
      for (let j = 0; j <= radialSegments; j++) {
        const pIdx = (baseIdx + j) * 3;
        pos[pIdx + 1] = r3D * cosTable[j];
        pos[pIdx + 2] = r3D * sinTable[j];

        col[pIdx] = cr;
        col[pIdx + 1] = cg;
        col[pIdx + 2] = cb;
      }
    }

    // Update chuck & right end caps rings
    const r0 = Math.max(0.04, (contourArray[0] || rawRadiusMm) * scale);
    for (let j = 0; j <= radialSegments; j++) {
      const pIdx = (cap1Ring + j) * 3;
      pos[pIdx + 1] = r0 * cosTable[j];
      pos[pIdx + 2] = r0 * sinTable[j];
    }
    const rEnd = Math.max(0.04, (contourArray[n - 1] || rawRadiusMm) * scale);
    for (let j = 0; j <= radialSegments; j++) {
      const pIdx = (cap2Ring + j) * 3;
      pos[pIdx + 1] = rEnd * cosTable[j];
      pos[pIdx + 2] = rEnd * sinTable[j];
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeVertexNormals();

    // Dynamically adjust material roughness based on cut quality
    if (wpObj.material) {
      if (status === "BURNT") {
        wpObj.material.roughness = 0.78;
        wpObj.material.metalness = 0.6;
      } else if (status === "CHATTER") {
        wpObj.material.roughness = 0.62;
        wpObj.material.metalness = 0.75;
      } else {
        wpObj.material.roughness = materialId === "brass" ? 0.18 : 0.20;
        wpObj.material.metalness = 0.90;
      }
    }

    if (wpObj.mesh) {
      wpObj.mesh.visible = true;
    }
  }

  /**
   * Builds the entire 3D Lathe Machine model hierarchy
   * Centerline of the spindle is aligned at Y = 2.2, Z = 0
   * @param {Object} options Configuration options
   * @returns {Object} Object containing root group and animatable component handles
   */
  function buildLatheModel(options = {}) {
    const root = new THREE.Group();
    root.name = "Lathe_Assembly";

    // References to dynamically animated parts and anchors
    const parts = {
      root: root,
      chuckGroup: null,      // Rotates around X axis
      workpieceGroup: null,  // Holds raw and machined cylinder meshes
      rawWorkpiece: null,
      machinedWorkpiece: null,
      carriageGroup: null,   // Slides along X axis
      crossSlideGroup: null, // Slides along Z axis
      toolpostGroup: null,
      toolTip: null,         // Point where chips and coolant meet
      tailstockGroup: null,
      tailstockQuill: null,
      coolantPipeGroup: null,
      coolantStream: null,
      chipParticles: null,
      anchors: {},           // 3D coordinates for anatomy pins/camera focus
      partMeshes: {}         // Map of part ID to array of meshes for visual highlighting
    };

    function registerPartMesh(partId, mesh) {
      if (!parts.partMeshes[partId]) {
        parts.partMeshes[partId] = [];
      }
      parts.partMeshes[partId].push(mesh);
    }

    // Shared reusable materials
    const mats = {
      body: createMat(PALETTE.machineBody, 0.4, 0.4),
      bodyDark: createMat(PALETTE.machineBodyDark, 0.5, 0.3),
      bedWays: createMat(PALETTE.steelPolished, 0.18, 0.88),
      castIron: createMat(PALETTE.castIron, 0.65, 0.4),
      castIronDark: createMat(PALETTE.castIronDark, 0.7, 0.3),
      steel: createMat(PALETTE.steelMatte, 0.32, 0.75),
      steelDark: createMat(PALETTE.steelDark, 0.45, 0.65),
      chrome: createMat(PALETTE.chrome, 0.1, 0.95),
      brass: createMat(PALETTE.brass, 0.28, 0.8),
      carbideTip: createMat(PALETTE.carbideGold, 0.2, 0.9),
      toolShank: createMat(PALETTE.carbideShank, 0.4, 0.6),
      redButton: createMat(PALETTE.emergencyRed, 0.3, 0.1),
      yellowBase: createMat(PALETTE.switchYellow, 0.4, 0.1)
    };

    // ==========================================
    // 1. BASE STAND, LEGS & CHIP PAN
    // ==========================================
    const baseGroup = new THREE.Group();
    baseGroup.name = "Lathe_Base";

    // Left Support Pedestal (under headstock)
    const leftLegGeo = new THREE.BoxGeometry(3.6, 2.6, 2.8);
    const leftLeg = new THREE.Mesh(leftLegGeo, mats.castIronDark);
    leftLeg.position.set(-8.2, -1.3, 0);
    baseGroup.add(leftLeg);

    // Left leg inspection panel door
    const leftDoorGeo = new THREE.BoxGeometry(2.0, 1.8, 0.08);
    const leftDoor = new THREE.Mesh(leftDoorGeo, mats.body);
    leftDoor.position.set(-8.2, -1.3, 1.42);
    baseGroup.add(leftDoor);

    // Right Support Pedestal (under tailstock end)
    const rightLegGeo = new THREE.BoxGeometry(2.8, 2.6, 2.8);
    const rightLeg = new THREE.Mesh(rightLegGeo, mats.castIronDark);
    rightLeg.position.set(8.5, -1.3, 0);
    baseGroup.add(rightLeg);

    // Leveling feet pads
    [-9.6, -6.8, 7.5, 9.5].forEach((fx) => {
      [-1.15, 1.15].forEach((fz) => {
        const footGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.18, 16);
        const foot = new THREE.Mesh(footGeo, mats.steelDark);
        foot.position.set(fx, -2.65, fz);
        baseGroup.add(foot);
      });
    });

    // Chip Pan (Bak Penampung Geram/Coolant)
    const panBottomGeo = new THREE.BoxGeometry(21.4, 0.2, 3.4);
    const panBottom = new THREE.Mesh(panBottomGeo, mats.castIron);
    panBottom.position.set(0.2, 0.08, 0);
    baseGroup.add(panBottom);

    // Pan Front & Rear Rims
    const rimFrontGeo = new THREE.BoxGeometry(21.4, 0.4, 0.12);
    const rimFront = new THREE.Mesh(rimFrontGeo, mats.castIron);
    rimFront.position.set(0.2, 0.32, 1.7);
    baseGroup.add(rimFront);

    const rimBackGeo = new THREE.BoxGeometry(21.4, 0.9, 0.12);
    const rimBack = new THREE.Mesh(rimBackGeo, mats.castIron);
    rimBack.position.set(0.2, 0.58, -1.7);
    baseGroup.add(rimBack);

    root.add(baseGroup);

    // ==========================================
    // 2. BED & PRECISION WAYS (ALAS MESIN)
    // ==========================================
    const bedGroup = new THREE.Group();
    bedGroup.name = "Lathe_Bed";

    // Main Bed Casting (Heavy ribbed cast iron)
    const bedMainGeo = new THREE.BoxGeometry(20.4, 0.9, 2.2);
    const bedMain = new THREE.Mesh(bedMainGeo, mats.bodyDark);
    bedMain.position.set(0.2, 0.75, 0);
    bedGroup.add(bedMain);
    registerPartMesh("bed", bedMain);

    // Bed Center Cavity / Chip Drop Openings
    [-2.2, 0.8, 3.8].forEach((cx) => {
      const cavityGeo = new THREE.BoxGeometry(1.6, 0.65, 0.9);
      const cavity = new THREE.Mesh(cavityGeo, mats.castIronDark);
      cavity.position.set(cx, 0.75, 0);
      bedGroup.add(cavity);
    });

    // Precision Ground V-Ways & Flat Ways (Prisma & Meja Datar)
    // Front V-Way (Prisma Depan)
    const vWayFrontGeo = new THREE.BoxGeometry(20.0, 0.14, 0.26);
    const vWayFront = new THREE.Mesh(vWayFrontGeo, mats.bedWays);
    vWayFront.position.set(0.2, 1.25, 0.82);
    vWayFront.rotation.x = Math.PI / 4;
    bedGroup.add(vWayFront);
    registerPartMesh("bed", vWayFront);

    // Rear V-Way (Prisma Belakang)
    const vWayRearGeo = new THREE.BoxGeometry(20.0, 0.14, 0.26);
    const vWayRear = new THREE.Mesh(vWayRearGeo, mats.bedWays);
    vWayRear.position.set(0.2, 1.25, -0.82);
    vWayRear.rotation.x = Math.PI / 4;
    bedGroup.add(vWayRear);
    registerPartMesh("bed", vWayRear);

    // Flat Inner Ways
    const flatWayGeo = new THREE.BoxGeometry(20.0, 0.08, 0.45);
    const flatWay = new THREE.Mesh(flatWayGeo, mats.bedWays);
    flatWay.position.set(0.2, 1.22, 0);
    bedGroup.add(flatWay);
    registerPartMesh("bed", flatWay);

    // Rack Gear under front way (Gigi Rak untuk gerakan manual eretan)
    const rackGeo = new THREE.BoxGeometry(16.5, 0.1, 0.16);
    const rack = new THREE.Mesh(rackGeo, mats.brass);
    rack.position.set(1.2, 1.08, 1.05);
    bedGroup.add(rack);

    root.add(bedGroup);
    parts.anchors["bed"] = new THREE.Vector3(0.5, 1.0, 0);

    // ==========================================
    // 3. HEADSTOCK (KEPALA TETAP) & GEARBOX
    // ==========================================
    const headstockGroup = new THREE.Group();
    headstockGroup.name = "Headstock";

    // Main Gearbox Enclosure (Balanced, sleek proportion)
    const hsBodyGeo = new THREE.BoxGeometry(4.4, 2.5, 2.6);
    const hsBody = new THREE.Mesh(hsBodyGeo, mats.body);
    hsBody.position.set(-8.0, 2.2, 0);
    headstockGroup.add(hsBody);
    registerPartMesh("headstock", hsBody);

    // Headstock Top Lid / Inspection Cover
    const hsTopGeo = new THREE.BoxGeometry(4.2, 0.22, 2.4);
    const hsTop = new THREE.Mesh(hsTopGeo, mats.bodyDark);
    hsTop.position.set(-8.0, 3.52, 0);
    headstockGroup.add(hsTop);
    registerPartMesh("headstock", hsTop);

    // Speed Selector Levers on Front Face
    const leverPositions = [
      { x: -8.8, y: 2.8, z: 1.34, color: 0x2563eb }, // RPM Lever A
      { x: -7.6, y: 2.8, z: 1.34, color: 0x2563eb }, // RPM Lever B
      { x: -8.8, y: 1.8, z: 1.34, color: 0xd97706 }, // Feed Lever
      { x: -7.6, y: 1.8, z: 1.34, color: 0xd97706 }  // Thread Lever
    ];

    leverPositions.forEach((pos) => {
      // Chrome Hub
      const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
      const hub = new THREE.Mesh(hubGeo, mats.chrome);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(pos.x, pos.y, pos.z);
      headstockGroup.add(hub);

      // Lever Rod
      const rodGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.5, 12);
      const rod = new THREE.Mesh(rodGeo, mats.chrome);
      rod.position.set(pos.x, pos.y + 0.25, pos.z + 0.04);
      headstockGroup.add(rod);

      // Spherical Knob
      const knobGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const knobMat = createMat(pos.color, 0.3, 0.2);
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.position.set(pos.x, pos.y + 0.5, pos.z + 0.04);
      headstockGroup.add(knob);
      registerPartMesh("headstock", knob);
    });

    // RPM Speed Table Chart Plate on Front of Headstock
    const plateGeo = new THREE.PlaneGeometry(1.4, 0.85);
    const plateMat = createMat(0xe2e8f0, 0.3, 0.1);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(-6.4, 2.7, 1.32);
    headstockGroup.add(plate);

    // Spindle Nose Collar (Dudukan Cekam)
    const noseGeo = new THREE.CylinderGeometry(0.68, 0.75, 0.6, 32);
    const nose = new THREE.Mesh(noseGeo, mats.steel);
    nose.rotation.z = Math.PI / 2;
    nose.position.set(-5.6, 2.2, 0);
    headstockGroup.add(nose);
    registerPartMesh("headstock", nose);

    // Emergency Stop Mushroom Button on Front of Headstock
    const eStopGroup = new THREE.Group();
    const eBaseGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16);
    const eBase = new THREE.Mesh(eBaseGeo, mats.yellowBase);
    eBase.rotation.x = Math.PI / 2;
    eStopGroup.add(eBase);

    const eCapGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.16, 20);
    const eCap = new THREE.Mesh(eCapGeo, mats.redButton);
    eCap.rotation.x = Math.PI / 2;
    eCap.position.set(0, 0, 0.12);
    eStopGroup.add(eCap);
    registerPartMesh("emergency_stop", eCap);
    registerPartMesh("emergency_stop", eBase);

    eStopGroup.position.set(-6.4, 1.7, 1.34);
    headstockGroup.add(eStopGroup);

    root.add(headstockGroup);
    parts.anchors["headstock"] = new THREE.Vector3(-8.0, 2.3, 0);
    parts.anchors["emergency_stop"] = new THREE.Vector3(-6.4, 1.7, 1.4);

    // ==========================================
    // 4. ROTATING SPINDLE & 3-JAW CHUCK (CEKAM)
    // ==========================================
    // Chuck rotating pivot is along the X axis at (X = -5.3, Y = 2.2, Z = 0)
    // Realistic Chuck Radius = 0.95 (Clears bed ways at Y = 1.25 with 0.05 margin)
    const chuckPivot = new THREE.Group();
    chuckPivot.position.set(-5.3, 2.2, 0);

    // Chuck Body (Steel Cylinder with chamfered rim)
    const chuckRadius = 0.95;
    const chuckLength = 0.65;
    const chuckBodyGeo = new THREE.CylinderGeometry(chuckRadius, chuckRadius, chuckLength, 36);
    const chuckBody = new THREE.Mesh(chuckBodyGeo, mats.steel);
    chuckBody.rotation.z = Math.PI / 2;
    chuckBody.position.set(chuckLength / 2, 0, 0);
    chuckPivot.add(chuckBody);
    registerPartMesh("chuck", chuckBody);

    // Chuck Front Face Plate
    const chuckFaceGeo = new THREE.CylinderGeometry(chuckRadius * 0.94, chuckRadius * 0.94, 0.04, 36);
    const chuckFace = new THREE.Mesh(chuckFaceGeo, mats.steelDark);
    chuckFace.rotation.z = Math.PI / 2;
    chuckFace.position.set(chuckLength + 0.02, 0, 0);
    chuckPivot.add(chuckFace);
    registerPartMesh("chuck", chuckFace);

    // 3 Adjustable Stepped Jaws (Rahang Cekam 3 Buah, bersudut 120°)
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const jawArm = new THREE.Group();
      jawArm.rotation.x = angle;

      // Base jaw block
      const jawBaseGeo = new THREE.BoxGeometry(0.32, 0.24, 0.32);
      const jawBase = new THREE.Mesh(jawBaseGeo, mats.bedWays);
      jawBase.position.set(chuckLength + 0.16, 0.52, 0);
      jawArm.add(jawBase);
      registerPartMesh("chuck", jawBase);

      // Stepped tooth
      const step1Geo = new THREE.BoxGeometry(0.22, 0.18, 0.24);
      const step1 = new THREE.Mesh(step1Geo, mats.steel);
      step1.position.set(chuckLength + 0.14, 0.36, 0);
      jawArm.add(step1);
      registerPartMesh("chuck", step1);

      // Pinion key socket on chuck perimeter
      const socketGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const socket = new THREE.Mesh(socketGeo, mats.castIronDark);
      socket.position.set(chuckLength / 2, chuckRadius * 0.98, 0);
      jawArm.add(socket);

      chuckPivot.add(jawArm);
    }

    // Safety Chuck Shield (Tutup Pelindung Cekam Transparan)
    const guardPivot = new THREE.Group();
    guardPivot.position.set(-5.0, 3.3, -0.6);
    const guardFrameGeo = new THREE.CylinderGeometry(1.25, 1.25, 1.1, 16, 1, true, 0, Math.PI * 0.85);
    const guardMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.15,
      side: THREE.DoubleSide
    });
    const guardMesh = new THREE.Mesh(guardFrameGeo, guardMat);
    guardMesh.rotation.z = Math.PI / 2;
    guardMesh.rotation.x = Math.PI * 0.55;
    guardPivot.add(guardMesh);
    root.add(guardPivot);

    root.add(chuckPivot);
    parts.chuckGroup = chuckPivot;
    parts.anchors["chuck"] = new THREE.Vector3(-4.65, 2.2, 0);

    // ==========================================
    // 5. WORKPIECE (BENDA KERJA KONTUR PEMESINAN DINAMIS)
    // ==========================================
    // Mount workpiece directly inside chuckPivot so it spins synchronously!
    const workpieceGroup = new THREE.Group();
    workpieceGroup.name = "Workpiece_Assembly";

    // Create dynamic contour-sculpted workpiece mesh
    const wpContourObj = createContourWorkpiece(120, 32);
    workpieceGroup.add(wpContourObj.mesh);

    chuckPivot.add(workpieceGroup);
    parts.workpieceGroup = workpieceGroup;
    parts.contourWorkpiece = wpContourObj;
    parts.rawWorkpiece = wpContourObj.mesh;
    parts.machinedWorkpiece = wpContourObj.mesh;

    // ==========================================
    // 6. CARRIAGE, SADDLE & APRON (ERETAN PEMBAWA)
    // ==========================================
    const carriageGroup = new THREE.Group();
    carriageGroup.name = "Carriage_Assembly";
    // Carriage rests on bed (Y = 1.25) and moves along X axis
    // Compact length in X = 1.6 units (prevents collision with chuck & tailstock!)
    carriageGroup.position.set(0.8, 1.25, 0);

    // Saddle Casting (H-Shape sliding over bed ways)
    const saddleGeo = new THREE.BoxGeometry(1.6, 0.22, 2.0);
    const saddle = new THREE.Mesh(saddleGeo, mats.body);
    saddle.position.set(0, 0.11, 0);
    carriageGroup.add(saddle);
    registerPartMesh("carriage", saddle);

    // Saddle Way Wipers (Karet pembersih tatal pada kedua ujung eretan)
    [-0.8, 0.8].forEach((wx) => {
      const wiperGeo = new THREE.BoxGeometry(0.08, 0.2, 1.95);
      const wiper = new THREE.Mesh(wiperGeo, mats.steelDark);
      wiper.position.set(wx, 0.08, 0);
      carriageGroup.add(wiper);
    });

    // Apron Box (Kotak Roda Gigi Depan Eretan)
    const apronGeo = new THREE.BoxGeometry(1.6, 1.0, 0.35);
    const apron = new THREE.Mesh(apronGeo, mats.bodyDark);
    apron.position.set(0, -0.42, 1.15);
    carriageGroup.add(apron);
    registerPartMesh("carriage", apron);

    // Longitudinal Handwheel (Roda Pemutar Eretan Memanjang)
    const handwheelGroup = new THREE.Group();
    const hwRimGeo = new THREE.TorusGeometry(0.36, 0.04, 12, 28);
    const hwRim = new THREE.Mesh(hwRimGeo, mats.chrome);
    handwheelGroup.add(hwRim);
    registerPartMesh("carriage", hwRim);

    // Handwheel Spokes
    for (let s = 0; s < 3; s++) {
      const spokeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.68, 8);
      const spoke = new THREE.Mesh(spokeGeo, mats.chrome);
      spoke.rotation.z = (s * Math.PI) / 3;
      handwheelGroup.add(spoke);
    }

    // Handwheel Center Boss
    const bossGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16);
    const boss = new THREE.Mesh(bossGeo, mats.steel);
    boss.rotation.x = Math.PI / 2;
    handwheelGroup.add(boss);

    // Revolving Handle
    const handleGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.3, 12);
    const handle = new THREE.Mesh(handleGeo, mats.chrome);
    handle.position.set(0.28, 0, 0.15);
    handle.rotation.x = Math.PI / 2;
    handwheelGroup.add(handle);

    handwheelGroup.position.set(-0.45, -0.4, 1.38);
    carriageGroup.add(handwheelGroup);

    // Feed Engage Lever & Half-Nut Lever on Apron
    const halfNutLeverGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.38, 12);
    const halfNutLever = new THREE.Mesh(halfNutLeverGeo, mats.chrome);
    halfNutLever.position.set(0.42, -0.32, 1.38);
    halfNutLever.rotation.z = -0.45;
    carriageGroup.add(halfNutLever);

    const halfNutBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), mats.redButton);
    halfNutBall.position.set(0.52, -0.16, 1.38);
    carriageGroup.add(halfNutBall);

    // Thread Chasing Dial (Indikator Pahat Ulir)
    const dialGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.22, 20);
    const dial = new THREE.Mesh(dialGeo, mats.brass);
    dial.position.set(0.68, -0.05, 1.18);
    carriageGroup.add(dial);

    // ==========================================
    // 7. CROSS SLIDE & COMPOUND REST (ERETAN LINTANG & ATAS)
    // ==========================================
    const crossSlideGroup = new THREE.Group();
    crossSlideGroup.name = "Cross_Slide";
    // Base position of cross slide on carriage saddle:
    // Placed at Z = 1.20 so all slides sit safely forward toward operator (+Z),
    // leaving a wide, clean gap of ~0.35-0.45 units to the workpiece front surface (Z = 0.36)!
    crossSlideGroup.position.set(0, 0.22, 1.20);

    // Cross Slide Base Plate (Heavy cast iron with machined dovetail ways)
    const csBaseGeo = new THREE.BoxGeometry(0.95, 0.18, 1.45);
    const csBase = new THREE.Mesh(csBaseGeo, mats.castIron);
    csBase.position.set(0, 0.09, 0.05);
    crossSlideGroup.add(csBase);
    registerPartMesh("cross_slide", csBase);

    // Rear chip guard wiper on cross slide
    const csRearGuardGeo = new THREE.BoxGeometry(0.92, 0.08, 0.05);
    const csRearGuard = new THREE.Mesh(csRearGuardGeo, mats.steelDark);
    csRearGuard.position.set(0, 0.15, -0.66);
    crossSlideGroup.add(csRearGuard);

    // Cross Feed Micrometer Dial & Handwheel (Facing operator at +Z)
    const csHwGroup = new THREE.Group();
    const csVernierGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 24);
    const csVernier = new THREE.Mesh(csVernierGeo, mats.steel);
    csVernier.rotation.x = Math.PI / 2;
    csHwGroup.add(csVernier);
    registerPartMesh("cross_slide", csVernier);

    const csHwRim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 12, 28), mats.chrome);
    csHwGroup.add(csHwRim);
    registerPartMesh("cross_slide", csHwRim);

    // Cross feed handwheel spokes & center hub
    for (let s = 0; s < 3; s++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 8), mats.chrome);
      sp.rotation.z = (s * Math.PI) / 3;
      csHwGroup.add(sp);
    }
    const csHwCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 16), mats.steel);
    csHwCenter.rotation.x = Math.PI / 2;
    csHwGroup.add(csHwCenter);

    const csHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.26, 12), mats.chrome);
    csHandle.position.set(0.20, 0, 0.14);
    csHandle.rotation.x = Math.PI / 2;
    csHwGroup.add(csHandle);

    csHwGroup.position.set(0, 0.09, 0.86);
    crossSlideGroup.add(csHwGroup);

    // Compound Rest Swivel Turntable (Graduated 360° protractor scale)
    const compoundTurntableGeo = new THREE.CylinderGeometry(0.44, 0.48, 0.06, 32);
    const compoundTurntable = new THREE.Mesh(compoundTurntableGeo, mats.brass);
    compoundTurntable.position.set(0, 0.21, -0.12);
    crossSlideGroup.add(compoundTurntable);
    registerPartMesh("cross_slide", compoundTurntable);

    // Compound Top Slide (Eretan Atas / Tool Slide)
    // Sits on turntable, set back at Z = -0.12 in crossSlide (world Z = 1.08)
    const topSlideGeo = new THREE.BoxGeometry(0.68, 0.15, 0.82);
    const topSlide = new THREE.Mesh(topSlideGeo, mats.castIron);
    topSlide.position.set(0, 0.315, -0.12);
    crossSlideGroup.add(topSlide);
    registerPartMesh("cross_slide", topSlide);

    // Top Slide Feed Small Handwheel & Vernier Collar (at rear of top slide)
    const topHwGroup = new THREE.Group();
    const topVernier = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.08, 20), mats.steel);
    topVernier.rotation.x = Math.PI / 2;
    topHwGroup.add(topVernier);

    const topHw = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 10, 20), mats.chrome);
    topHwGroup.add(topHw);

    const topHwHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.18, 10), mats.chrome);
    topHwHandle.position.set(0.11, 0, 0.09);
    topHwHandle.rotation.x = Math.PI / 2;
    topHwGroup.add(topHwHandle);

    topHwGroup.position.set(0, 0.32, 0.34);
    crossSlideGroup.add(topHwGroup);

    // ==========================================
    // 8. 4-WAY INDUSTRIAL TOOLPOST & PAHAT RATA KANAN (ISO 6)
    // ==========================================
    const toolpostGroup = new THREE.Group();
    toolpostGroup.name = "Toolpost_and_Cutter";
    // Toolpost sits squarely on top of the compound rest:
    // In crossSlideGroup: X = 0.0, Y = 0.39, Z = -0.22 (World Z = 1.20 - 0.22 = 0.98!)
    // Front face of toolpost is at World Z = 0.98 - 0.26 = 0.72!
    // Ample clearance from workpiece front surface (Z = 0.36): 0.72 - 0.36 = 0.36 units (ZERO collision!)
    toolpostGroup.position.set(0, 0.39, -0.22);

    // 4-Way Toolpost Block (Heavy Square Machined Steel Block)
    const tpWidth = 0.52;
    const tpHeight = 0.44;
    const tpDepth = 0.52;
    const tpBlockGeo = new THREE.BoxGeometry(tpWidth, tpHeight, tpDepth);
    const tpBlock = new THREE.Mesh(tpBlockGeo, mats.castIronDark);
    tpBlock.position.set(0, tpHeight / 2, 0);
    toolpostGroup.add(tpBlock);
    registerPartMesh("toolpost", tpBlock);

    // Toolpost Machined Clamping T-Slots (Side pockets where tool shanks slide in)
    const slotGeo = new THREE.BoxGeometry(0.18, 0.18, 0.54);
    const slotLeft = new THREE.Mesh(slotGeo, mats.steelDark);
    slotLeft.position.set(-tpWidth / 2 + 0.07, tpHeight / 2 + 0.04, 0);
    toolpostGroup.add(slotLeft);

    // Central Clamping Stud & Locking Handle
    const tpHolderStem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 16), mats.chrome);
    tpHolderStem.position.set(0, tpHeight + 0.13, 0);
    toolpostGroup.add(tpHolderStem);

    const tpCenterCap = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.08, 16), mats.steel);
    tpCenterCap.position.set(0, tpHeight + 0.25, 0);
    toolpostGroup.add(tpCenterCap);

    // Ergonomic Double-Ended Locking Lever Bar with chrome spherical knobs
    const tpHandleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.68, 14), mats.chrome);
    tpHandleBar.rotation.z = Math.PI / 2;
    tpHandleBar.position.set(0, tpHeight + 0.26, 0);
    toolpostGroup.add(tpHandleBar);
    registerPartMesh("toolpost", tpHandleBar);

    [-0.34, 0.34].forEach((hx) => {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), mats.chrome);
      knob.position.set(hx, tpHeight + 0.26, 0);
      toolpostGroup.add(knob);
    });

    // 4 Heavy-Duty Tool Clamping Screws on top of Toolpost
    [-0.15, 0.15].forEach((bx) => {
      [-0.15, 0.15].forEach((bz) => {
        const boltGeo = new THREE.BoxGeometry(0.075, 0.12, 0.075);
        const bolt = new THREE.Mesh(boltGeo, mats.steel);
        bolt.position.set(bx, tpHeight + 0.06, bz);
        toolpostGroup.add(bolt);
        registerPartMesh("toolpost", bolt);
      });
    });

    // -------------------------------------------------------------
    // PAHAT BUBUT RATA KANAN (Right-Hand Turning Tool — ISO 6 / DIN 4980)
    // -------------------------------------------------------------
    // The tool shank is clamped securely in the toolpost slot at Y = 2.20 (spindle center).
    // It extends forward from Z = -0.22 (center of toolpost) out towards Z = -0.84 (World Z = 0.36)!
    // Overhang is ~0.45 units (clearly projecting into the gap, fully visible!).
    const toolGroup = new THREE.Group();

    // Tool Shank (Heavy black oxide rectangular steel shank)
    const shankLength = 0.68;
    const shankGeo = new THREE.BoxGeometry(0.16, 0.16, shankLength);
    const shank = new THREE.Mesh(shankGeo, mats.toolShank);
    // Position shank so it protrudes out towards -Z (toward workpiece)
    // Shank center in toolpostGroup: X = -0.18, Y = 0.26 (World Y = 2.20!), Z = -0.32
    shank.position.set(-0.18, 0.26, -0.32);
    // Slight lead angle (kappa_r = 75° / 15° lead angle) so cutting edge leads toward chuck
    shank.rotation.y = -Math.PI / 16;
    toolGroup.add(shank);
    registerPartMesh("toolpost", shank);

    // Carbide Shim Seat (Dudukan Plat Sisipan Karbida)
    const shimGeo = new THREE.BoxGeometry(0.15, 0.03, 0.15);
    const shim = new THREE.Mesh(shimGeo, mats.steelDark);
    shim.position.set(-0.24, 0.345, -0.60);
    shim.rotation.y = -Math.PI / 16;
    toolGroup.add(shim);

    // Carbide Insert (Mata Pahat Karbida Emas PVD TiN Coating)
    // Rhombic 80° turning insert with chipbreaker groove and corner radius
    const tipShape = new THREE.Shape();
    tipShape.moveTo(0, 0);
    tipShape.lineTo(0.14, 0.03);
    tipShape.lineTo(0.11, 0.14);
    tipShape.lineTo(-0.03, 0.11);
    tipShape.closePath();

    const tipExtrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.012, bevelThickness: 0.012 };
    const tipGeo = new THREE.ExtrudeGeometry(tipShape, tipExtrudeSettings);
    const tipMat = mats.carbideTip.clone();
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.rotation.x = Math.PI / 2;
    tipMesh.rotation.z = -Math.PI / 4;
    // Exactly positioned so cutting nose touches workpiece front at World Z = 0.36, World Y = 2.20!
    // In toolpostGroup: Z = 0.36 - (1.20 - 0.22) = 0.36 - 0.98 = -0.62!
    tipMesh.position.set(-0.28, 0.37, -0.62);
    toolGroup.add(tipMesh);
    registerPartMesh("toolpost", tipMesh);
    parts.toolTip = tipMesh;

    // Torx Clamping Screw in Center of Carbide Insert
    const torxScrewGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.05, 12);
    const torxScrew = new THREE.Mesh(torxScrewGeo, mats.steelDark);
    torxScrew.position.set(-0.23, 0.37, -0.58);
    toolGroup.add(torxScrew);

    toolpostGroup.add(toolGroup);

    // -------------------------------------------------------------
    // COOLANT HOSE & NOZZLE
    // -------------------------------------------------------------
    const coolantGroup = new THREE.Group();
    // Mounted on the right side of the cross slide / toolpost
    coolantGroup.position.set(0.30, 0.26, 0.05);

    // Segmented flexible knuckle hose (blue and orange alternating segments)
    for (let c = 0; c < 7; c++) {
      const segGeo = new THREE.SphereGeometry(0.045, 12, 12);
      const segMat = createMat(c % 2 === 0 ? PALETTE.coolantPipe : 0xf97316, 0.4, 0.2);
      const seg = new THREE.Mesh(segGeo, segMat);
      seg.position.set(-c * 0.08, c * 0.03 + 0.05, -c * 0.10);
      coolantGroup.add(seg);
    }

    // Brass Nozzle Tip pointed directly at the cutting zone (carbide tip & workpiece contact)
    const nozzleGeo = new THREE.ConeGeometry(0.045, 0.15, 12);
    const nozzle = new THREE.Mesh(nozzleGeo, mats.brass);
    nozzle.rotation.x = -Math.PI * 0.60;
    nozzle.rotation.y = -Math.PI * 0.22;
    nozzle.position.set(-0.52, 0.24, -0.68);
    coolantGroup.add(nozzle);

    // Coolant Fluid Stream Mesh (Translucent jet spraying on tool tip)
    const streamGeo = new THREE.CylinderGeometry(0.02, 0.055, 0.25, 10);
    const streamMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.1
    });
    const stream = new THREE.Mesh(streamGeo, streamMat);
    stream.rotation.x = Math.PI * 0.40;
    stream.position.set(-0.54, 0.16, -0.74);
    stream.visible = false;
    coolantGroup.add(stream);
    parts.coolantStream = stream;

    toolpostGroup.add(coolantGroup);
    parts.coolantPipeGroup = coolantGroup;

    crossSlideGroup.add(toolpostGroup);
    carriageGroup.add(crossSlideGroup);
    root.add(carriageGroup);

    parts.carriageGroup = carriageGroup;
    parts.crossSlideGroup = crossSlideGroup;
    parts.toolpostGroup = toolpostGroup;
    parts.anchors["carriage"] = new THREE.Vector3(0.8, 1.30, 1.35);
    parts.anchors["cross_slide"] = new THREE.Vector3(0.8, 1.55, 1.20);
    parts.anchors["toolpost"] = new THREE.Vector3(0.6, 2.05, 0.95);

    // ==========================================
    // 9. TAILSTOCK (KEPALA LEPAS)
    // ==========================================
    const tailstockGroup = new THREE.Group();
    tailstockGroup.name = "Tailstock_Assembly";
    // Base sits on bed at Y = 1.25.
    // Centered at X = 5.2, comfortably separated from workpiece right end (X = 2.95)!
    tailstockGroup.position.set(5.2, 1.25, 0);

    // Tailstock Base Plate (Sliding on Bed)
    const tsBaseGeo = new THREE.BoxGeometry(2.0, 0.25, 1.6);
    const tsBase = new THREE.Mesh(tsBaseGeo, mats.bodyDark);
    tsBase.position.set(0, 0.125, 0);
    tailstockGroup.add(tsBase);
    registerPartMesh("tailstock", tsBase);

    // Tailstock Main Casting Body (Graceful curved/stepped shape)
    const tsBodyGeo = new THREE.BoxGeometry(1.8, 1.2, 1.3);
    const tsBody = new THREE.Mesh(tsBodyGeo, mats.body);
    tsBody.position.set(0, 0.85, 0);
    tailstockGroup.add(tsBody);
    registerPartMesh("tailstock", tsBody);

    // Tailstock Bed Clamp Lever
    const tsClampLever = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65, 12), mats.chrome);
    tsClampLever.position.set(0.4, 1.45, 0.55);
    tsClampLever.rotation.z = 0.4;
    tailstockGroup.add(tsClampLever);
    registerPartMesh("tailstock", tsClampLever);

    // Tailstock Barrel / Quill (Selongsong dengan skala mm)
    // Height must be Y = 0.95 inside tailstock to match centerline Y = 2.20!
    // Extends forward from tailstock body from X = -0.9 to X = -1.8
    const quillRadius = 0.24;
    const quillLength = 1.6;
    const quillGeo = new THREE.CylinderGeometry(quillRadius, quillRadius, quillLength, 28);
    const quill = new THREE.Mesh(quillGeo, mats.bedWays);
    quill.rotation.z = Math.PI / 2;
    quill.position.set(-1.0, 0.95, 0);
    tailstockGroup.add(quill);
    registerPartMesh("tailstock", quill);
    parts.tailstockQuill = quill;

    // Revolving Live Center (Senter Putar 60° Presisi)
    // The cone tip seats firmly against workpiece right end at world X = +2.95!
    // In tailstock space: 2.95 - 5.2 = -2.25
    const liveCenterGroup = new THREE.Group();
    liveCenterGroup.position.set(-1.8, 0.95, 0);

    // Center Bearing Housing
    const lcBody = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.4, 24), mats.steel);
    lcBody.rotation.z = Math.PI / 2;
    liveCenterGroup.add(lcBody);
    registerPartMesh("tailstock", lcBody);

    // Hardened 60° Cone Center Point
    // Tip extends to -0.45 from bearing housing, reaching world X = 5.2 - 1.8 - 0.45 = 2.95!
    const coneGeo = new THREE.ConeGeometry(0.22, 0.5, 24);
    const cone = new THREE.Mesh(coneGeo, mats.steel);
    cone.rotation.z = Math.PI / 2;
    cone.position.set(-0.25, 0, 0);
    liveCenterGroup.add(cone);
    registerPartMesh("tailstock", cone);

    tailstockGroup.add(liveCenterGroup);

    // Rear Feed Handwheel (Roda Pemutar Maju Selongsong Kepala Lepas)
    const tsHwGroup = new THREE.Group();
    const tsHwRim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 12, 24), mats.chrome);
    tsHwGroup.add(tsHwRim);
    registerPartMesh("tailstock", tsHwRim);

    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.72, 8), mats.chrome);
      sp.rotation.z = (i * Math.PI) / 3;
      tsHwGroup.add(sp);
    }
    const tsHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.28, 12), mats.chrome);
    tsHandle.position.set(0.3, 0, 0.15);
    tsHandle.rotation.x = Math.PI / 2;
    tsHwGroup.add(tsHandle);

    tsHwGroup.rotation.y = Math.PI / 2;
    tsHwGroup.position.set(1.0, 0.95, 0);
    tailstockGroup.add(tsHwGroup);

    root.add(tailstockGroup);
    parts.tailstockGroup = tailstockGroup;
    parts.anchors["tailstock"] = new THREE.Vector3(5.2, 2.2, 0);

    // ==========================================
    // 10. LEADSCREW & FEED RODS (POROS PENGGERAK)
    // ==========================================
    const rodsGroup = new THREE.Group();
    rodsGroup.name = "Leadscrew_and_Feed_Rods";

    // Leadscrew (Poros Transporir Berulir Trapesium)
    const leadScrewGeo = new THREE.CylinderGeometry(0.1, 0.1, 19.8, 16);
    const leadScrew = new THREE.Mesh(leadScrewGeo, mats.brass);
    leadScrew.rotation.z = Math.PI / 2;
    leadScrew.position.set(0.5, 0.55, 1.15);
    rodsGroup.add(leadScrew);
    registerPartMesh("lead_screw", leadScrew);

    // Smooth Feed Rod (Poros Pembawa Otomatis)
    const feedRodGeo = new THREE.CylinderGeometry(0.08, 0.08, 19.8, 16);
    const feedRod = new THREE.Mesh(feedRodGeo, mats.steel);
    feedRod.rotation.z = Math.PI / 2;
    feedRod.position.set(0.5, 0.32, 1.15);
    rodsGroup.add(feedRod);
    registerPartMesh("lead_screw", feedRod);

    // Spindle Start/Stop Control Rod
    const ctrlRodGeo = new THREE.CylinderGeometry(0.06, 0.06, 19.8, 12);
    const ctrlRod = new THREE.Mesh(ctrlRodGeo, mats.steelDark);
    ctrlRod.rotation.z = Math.PI / 2;
    ctrlRod.position.set(0.5, 0.12, 1.15);
    rodsGroup.add(ctrlRod);

    // Right-end bracket support for rods
    const rodBracket = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.45), mats.castIron);
    rodBracket.position.set(10.3, 0.35, 1.15);
    rodsGroup.add(rodBracket);

    root.add(rodsGroup);
    parts.anchors["lead_screw"] = new THREE.Vector3(0.5, 0.55, 1.2);

    return parts;
  }

  /**
   * Helper textures for Milling Machine (Procedural Canvas Textures)
   */
  function createMillingHeadBadgeTexture() {
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 128;
    const c = cvs.getContext("2d");
    if (!c) return null;

    c.fillStyle = "#0a0f1d";
    c.fillRect(0, 0, 512, 128);

    c.strokeStyle = "#e2e8f0";
    c.lineWidth = 6;
    c.strokeRect(8, 8, 496, 112);

    c.fillStyle = "#ffffff";
    c.font = "bold 32px 'Segoe UI', Arial, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("VERTICAL MILLING", 256, 46);

    c.font = "bold 24px 'Segoe UI', Arial, sans-serif";
    c.fillStyle = "#94a3b8";
    c.fillText("MACHINE", 256, 88);

    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    return tex;
  }

  function createDroScreenTexture() {
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 512;
    const c = cvs.getContext("2d");
    if (!c) return null;

    // Dark screen
    c.fillStyle = "#07121b";
    c.fillRect(0, 0, 512, 512);

    c.strokeStyle = "#164e63";
    c.lineWidth = 8;
    c.strokeRect(8, 8, 496, 496);

    // Glowing DRO Digital Readout Coordinates
    c.font = "bold 58px 'Courier New', monospace";
    c.fillStyle = "#38bdf8";
    c.shadowColor = "#38bdf8";
    c.shadowBlur = 12;

    c.fillText("X   +0.000", 40, 115);
    c.fillText("Y   +0.000", 40, 225);
    c.fillText("Z   +0.000", 40, 335);

    c.shadowBlur = 0;
    c.font = "bold 26px 'Segoe UI', Arial, sans-serif";
    c.fillStyle = "#10b981";
    c.fillText("AXIS MODE: ABS (MM)", 40, 415);
    c.fillStyle = "#f59e0b";
    c.fillText("SPINDLE: READY", 40, 465);

    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    return tex;
  }

  function createDroKeypadTexture() {
    const cvs = document.createElement("canvas");
    cvs.width = 256;
    cvs.height = 512;
    const c = cvs.getContext("2d");
    if (!c) return null;

    c.fillStyle = "#1e293b";
    c.fillRect(0, 0, 256, 512);

    const cols = 4;
    const rows = 6;
    const btnW = 44;
    const btnH = 34;
    const startX = 24;
    const startY = 32;
    const gapX = 14;
    const gapY = 16;

    const keyColors = [
      ["#38bdf8", "#38bdf8", "#38bdf8", "#ef4444"],
      ["#cbd5e1", "#cbd5e1", "#cbd5e1", "#f59e0b"],
      ["#cbd5e1", "#cbd5e1", "#cbd5e1", "#f59e0b"],
      ["#cbd5e1", "#cbd5e1", "#cbd5e1", "#f59e0b"],
      ["#cbd5e1", "#cbd5e1", "#cbd5e1", "#10b981"],
      ["#e2e8f0", "#e2e8f0", "#e2e8f0", "#10b981"]
    ];

    const labels = [
      ["X", "Y", "Z", "CLR"],
      ["7", "8", "9", "/"],
      ["4", "5", "6", "*"],
      ["1", "2", "3", "-"],
      ["0", ".", "+/-", "+"],
      ["F1", "F2", "SET", "ENT"]
    ];

    for (let r = 0; r < rows; r++) {
      for (let cl = 0; cl < cols; cl++) {
        const x = startX + cl * (btnW + gapX);
        const y = startY + r * (btnH + gapY);
        c.fillStyle = keyColors[r][cl];
        c.beginPath();
        c.rect(x, y, btnW, btnH);
        c.fill();

        c.fillStyle = (r === 0 || cl === 3) ? "#0f172a" : "#1e293b";
        c.font = "bold 15px 'Segoe UI', Arial, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText(labels[r][cl], x + btnW / 2, y + btnH / 2);
      }
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    return tex;
  }

  function createMilledFaceTexture() {
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 512;
    const c = cvs.getContext("2d");
    if (!c) return null;

    // Base bright machined metallic silver
    c.fillStyle = "#e2e8f0";
    c.fillRect(0, 0, 512, 512);

    // Subtle fine longitudinal machining grain
    c.fillStyle = "rgba(148, 163, 184, 0.08)";
    for (let y = 0; y < 512; y += 4) {
      c.fillRect(0, y, 512, 2);
    }

    // Overlapping radial cycloidal tool marks (bekas sayatan melingkar khas endmill)
    c.lineWidth = 2.0;
    for (let x = -80; x <= 600; x += 36) {
      c.strokeStyle = "rgba(71, 85, 105, 0.28)";
      c.beginPath();
      c.arc(x, 256, 170, -Math.PI * 0.44, Math.PI * 0.44);
      c.stroke();

      // Highlighting specular reflection crest
      c.strokeStyle = "rgba(255, 255, 255, 0.45)";
      c.beginPath();
      c.arc(x + 2, 256, 170, -Math.PI * 0.44, Math.PI * 0.44);
      c.stroke();
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Builds an accurately proportioned, highly detailed 3D Vertical Milling Machine (Mesin Frais)
   * modeled precisely after the industrial reference photograph (Mesin Frais.png):
   * 
   * Components & Kinematic Axes:
   * 1. Foundation Base in deep industrial blue enamel (Base)
   * 2. Heavy vertical Column with front dovetail ways, side electrical cabinet, and black accordion way-cover bellow
   * 3. Heavy cast Knee (Lutut) sliding vertically (Z axis) on column ways, with elevating telescopic screw
   * 4. Handwheel Z (gerak vertikal) on lower front face of knee with revolving crank handle
   * 5. Cast Saddle (Sadel) with blue front bracket, sliding along cross Y axis
   * 6. Handwheel Y (gerak melintang) on front of saddle with micrometer dial collar and crank
   * 7. Long precision ground Table (Meja Frais) with 3 longitudinal T-slots, coolant drainage troughs
   * 8. Handwheel X (gerak memanjang) on right end of table with large wheel, dial, and crank handle
   * 9. Industrial Machine Vise (Ragum) in blue enamel with hardened ground steel jaws clamping a metal workpiece
   * 10. Horizontal Overarm & Swivel Turret Knuckle with degree scale markings
   * 11. Vertical Milling Head (Kepala Mesin) with "VERTICAL MILLING MACHINE" emblem plate, speed levers, quill feed lever, fine feed dial
   * 12. Electric Drive Motor on top of head in deep industrial blue with vertical cooling ribs and terminal box
   * 13. High-precision Vertical Spindle with quill sleeve, collet chuck (NT40/BT40), and helical carbide End Mill cutter
   * 14. Articulated mounting arm holding a Digital Readout (DRO - Panel Kontrol) with glowing LCD coordinate display (X, Y, Z) and keypad buttons
   */
  function buildMillingModel(options = {}) {
    const root = new THREE.Group();
    root.name = "Milling_Assembly";

    const parts = {
      root: root,
      spindleGroup: null,     // Rotates around Y axis
      tableGroup: null,       // Moves along X axis
      saddleGroup: null,      // Moves along Z axis
      kneeGroup: null,        // Moves along Y axis
      droGroup: null,
      anchors: {},
      partMeshes: {}
    };

    function registerPartMesh(partId, mesh) {
      if (!parts.partMeshes[partId]) {
        parts.partMeshes[partId] = [];
      }
      parts.partMeshes[partId].push(mesh);
    }

    // Material palette matching Mesin Frais.png
    const mats = {
      baseBlue: createMat(0x1a4670, 0.42, 0.45),
      baseBlueDark: createMat(0x102f4c, 0.5, 0.35),
      bodyLight: createMat(0xd8e1e8, 0.38, 0.35),
      bodyMedium: createMat(0x94a3b8, 0.45, 0.4),
      bodyDark: createMat(0x334155, 0.55, 0.5),
      tableSteel: createMat(0xd5dde5, 0.22, 0.85),
      steelWays: createMat(0xe2e8f0, 0.16, 0.9),
      steelPolished: createMat(0xf1f5f9, 0.16, 0.92),
      steelDark: createMat(0x334155, 0.5, 0.5),
      motorBlue: createMat(0x1e40af, 0.35, 0.5),
      motorCap: createMat(0x1d4ed8, 0.4, 0.4),
      viseBlue: createMat(0x1a4670, 0.4, 0.45),
      chrome: createMat(0xf8fafc, 0.1, 0.95),
      blackPhenolic: createMat(0x1e293b, 0.25, 0.2),
      brass: createMat(0xd97706, 0.28, 0.8),
      bellows: createMat(0x1e293b, 0.85, 0.08),
      carbide: createMat(0xf1f5f9, 0.22, 0.92),
      carbideShank: createMat(0x1e293b, 0.4, 0.6),
      arborCollar: createMat(0x18181b, 0.35, 0.65),
      goldTiN: createMat(0xf59e0b, 0.22, 0.95),
      droBezel: createMat(0x1e293b, 0.3, 0.3),
      milledFaceMat: (function() {
        const mat = createMat(0xf8fafc, 0.22, 0.88);
        const tex = createMilledFaceTexture();
        if (tex) mat.map = tex;
        return mat;
      })()
    };

    // ==========================================
    // 1. BASE STAND (ALAS MESIN FRAIS)
    // ==========================================
    const baseGroup = new THREE.Group();
    baseGroup.name = "Milling_Base";

    // Main heavy blue foundation casting (supporting column at back and knee at front)
    const baseMainGeo = new THREE.BoxGeometry(4.2, 0.66, 4.6);
    const baseMain = new THREE.Mesh(baseMainGeo, mats.baseBlue);
    baseMain.position.set(0, -2.35, -0.3);
    baseGroup.add(baseMain);
    registerPartMesh("base", baseMain);

    // Stepped upper base rim with chamfer
    const baseTopGeo = new THREE.BoxGeometry(3.9, 0.16, 4.3);
    const baseTop = new THREE.Mesh(baseTopGeo, mats.baseBlueDark);
    baseTop.position.set(0, -1.94, -0.3);
    baseGroup.add(baseTop);
    registerPartMesh("base", baseTop);

    // Recessed coolant and chip tray lip at front base
    const baseTrayGeo = new THREE.BoxGeometry(3.2, 0.05, 2.0);
    const baseTray = new THREE.Mesh(baseTrayGeo, mats.steelDark);
    baseTray.position.set(0, -1.86, 0.9);
    baseGroup.add(baseTray);
    registerPartMesh("base", baseTray);

    // 4 Corner foundation bolt recesses
    [[-1.75, -2.35], [1.75, -2.35], [-1.75, 1.75], [1.75, 1.75]].forEach(([bx, bz]) => {
      const boltGeo = new THREE.CylinderGeometry(0.16, 0.20, 0.24, 16);
      const bolt = new THREE.Mesh(boltGeo, mats.steelDark);
      bolt.position.set(bx, -1.90, bz);
      baseGroup.add(bolt);
      registerPartMesh("base", bolt);
    });

    root.add(baseGroup);
    parts.anchors["base"] = new THREE.Vector3(0, -2.0, 1.8);

    // ==========================================
    // 2. COLUMN & GUIDEWAYS (KOLOM / BADAN MESIN)
    // Proportioned accurately to Mesin Frais.png:
    // Slender, sturdy vertical column positioned at the rear (Z <= 0.0)
    // ==========================================
    const columnGroup = new THREE.Group();
    columnGroup.name = "Milling_Column";

    // Lower Column Tower (from Y = -2.0 to Y = 0.7, Z from -2.2 to 0.0)
    const colLowerGeo = new THREE.BoxGeometry(1.85, 2.7, 2.2);
    const colLower = new THREE.Mesh(colLowerGeo, mats.bodyLight);
    colLower.position.set(0, -0.65, -1.1);
    columnGroup.add(colLower);
    registerPartMesh("column", colLower);

    // Upper Column Tower (from Y = 0.7 to Y = 3.8, Z from -2.2 to 0.0)
    const colUpperGeo = new THREE.BoxGeometry(1.75, 3.1, 2.2);
    const colUpper = new THREE.Mesh(colUpperGeo, mats.bodyLight);
    colUpper.position.set(0, 2.25, -1.1);
    columnGroup.add(colUpper);
    registerPartMesh("column", colUpper);

    // Front vertical ground dovetail slideways (mounted on front face at Z = 0.0)
    const railLeftGeo = new THREE.BoxGeometry(0.16, 4.2, 0.08);
    const railLeft = new THREE.Mesh(railLeftGeo, mats.steelWays);
    railLeft.position.set(-0.72, 0.8, 0.04);
    columnGroup.add(railLeft);
    registerPartMesh("column", railLeft);

    const railRight = railLeft.clone();
    railRight.position.x = 0.72;
    columnGroup.add(railRight);
    registerPartMesh("column", railRight);

    // Center vertical ground slideway plate
    const centerSlideGeo = new THREE.BoxGeometry(1.28, 4.2, 0.04);
    const centerSlide = new THREE.Mesh(centerSlideGeo, mats.steelPolished);
    centerSlide.position.set(0, 0.8, 0.02);
    columnGroup.add(centerSlide);
    registerPartMesh("column", centerSlide);

    // Accordion rubber way-cover bellows (Pelindung slideway vertikal)
    // As seen prominently in Mesin Frais.png behind the knee
    for (let i = 0; i < 13; i++) {
      const bellowGeo = new THREE.BoxGeometry(1.24, 0.065, 0.08);
      const bellow = new THREE.Mesh(bellowGeo, mats.bellows);
      bellow.position.set(0, 0.65 + i * 0.13, 0.06);
      columnGroup.add(bellow);
      registerPartMesh("column", bellow);
    }

    // Side Electrical Cabinet (Right side of column, clear of moving work zone)
    const cabinetGeo = new THREE.BoxGeometry(0.32, 2.2, 1.4);
    const cabinet = new THREE.Mesh(cabinetGeo, mats.bodyLight);
    cabinet.position.set(1.02, 1.2, -1.1);
    columnGroup.add(cabinet);
    registerPartMesh("column", cabinet);

    // Cabinet door seam & latch handle
    const latchGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12);
    const latch = new THREE.Mesh(latchGeo, mats.chrome);
    latch.position.set(1.19, 1.2, -0.5);
    columnGroup.add(latch);

    // Lower Power Switch Box (Right side, as seen in Mesin Frais.png)
    const switchBoxGeo = new THREE.BoxGeometry(0.16, 0.55, 0.38);
    const switchBox = new THREE.Mesh(switchBoxGeo, mats.blackPhenolic);
    switchBox.position.set(1.00, -0.65, -0.45);
    columnGroup.add(switchBox);
    registerPartMesh("column", switchBox);

    const rotaryKnobGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.10, 16);
    const rotaryKnob = new THREE.Mesh(rotaryKnobGeo, mats.bodyDark);
    rotaryKnob.rotation.z = Math.PI / 2;
    rotaryKnob.position.set(1.09, -0.60, -0.45);
    columnGroup.add(rotaryKnob);

    root.add(columnGroup);
    parts.anchors["column"] = new THREE.Vector3(0, 1.4, -0.4);

    // ==========================================
    // 3. KNEE & ELEVATING SCREW (LUTUT MESIN - SUMBU Z)
    // Sits on column vertical ways and extends forward
    // ==========================================
    const kneeGroup = new THREE.Group();
    kneeGroup.name = "Milling_Knee";

    // Main heavy knee casting (from Z = 0.02 to Z = 1.52)
    const kneeBodyGeo = new THREE.BoxGeometry(1.9, 1.35, 1.5);
    const kneeBody = new THREE.Mesh(kneeBodyGeo, mats.bodyLight);
    kneeBody.position.set(0, -0.42, 0.77);
    kneeGroup.add(kneeBody);
    registerPartMesh("knee", kneeBody);

    // Knee under-wedge chamfer support
    const kneeWedgeGeo = new THREE.BoxGeometry(1.7, 0.55, 1.1);
    const kneeWedge = new THREE.Mesh(kneeWedgeGeo, mats.bodyMedium);
    kneeWedge.position.set(0, -1.05, 0.65);
    kneeGroup.add(kneeWedge);
    registerPartMesh("knee", kneeWedge);

    // Top horizontal cross-slideway dovetail ways (for saddle)
    const kneeTopWaysGeo = new THREE.BoxGeometry(1.8, 0.10, 1.4);
    const kneeTopWays = new THREE.Mesh(kneeTopWaysGeo, mats.steelWays);
    kneeTopWays.position.set(0, 0.30, 0.77);
    kneeGroup.add(kneeTopWays);
    registerPartMesh("knee", kneeTopWays);

    // Elevating Telescopic Screw (Underneath Knee to Base)
    // Sleeve is anchored to base, rod is attached to knee so it telescopes realistically
    const screwSleeveGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.75, 20);
    const screwSleeve = new THREE.Mesh(screwSleeveGeo, mats.steelDark);
    screwSleeve.position.set(0, -1.60, 0.77);
    baseGroup.add(screwSleeve);
    registerPartMesh("knee", screwSleeve);

    const screwRodGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.75, 20);
    const screwRod = new THREE.Mesh(screwRodGeo, mats.steelPolished);
    screwRod.position.set(0, -1.10, 0.77);
    kneeGroup.add(screwRod);
    registerPartMesh("knee", screwRod);

    // Knee locking clamp lever on left side
    const kneeClampGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.32, 12);
    const kneeClamp = new THREE.Mesh(kneeClampGeo, mats.chrome);
    kneeClamp.position.set(-1.00, -0.2, 0.4);
    kneeClamp.rotation.x = Math.PI / 4;
    kneeGroup.add(kneeClamp);

    // Handwheel Z Boss (Angled forward on lower front face of knee, matching Mesin Frais.png)
    const hwZBossGeo = new THREE.CylinderGeometry(0.26, 0.30, 0.22, 16);
    const hwZBoss = new THREE.Mesh(hwZBossGeo, mats.bodyLight);
    hwZBoss.rotation.x = Math.PI / 4;
    hwZBoss.position.set(-0.42, -0.85, 1.50);
    kneeGroup.add(hwZBoss);
    registerPartMesh("knee", hwZBoss);

    // Handwheel Z Wheel & Crank Handle (Gerak Vertikal)
    const hwZGroup = new THREE.Group();
    hwZGroup.position.set(-0.42, -0.92, 1.62);
    hwZGroup.rotation.x = Math.PI / 4;

    const hwZRingGeo = new THREE.TorusGeometry(0.40, 0.055, 12, 28);
    const hwZRing = new THREE.Mesh(hwZRingGeo, mats.blackPhenolic);
    hwZGroup.add(hwZRing);
    registerPartMesh("handwheel_z", hwZRing);

    const hwZHubGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 16);
    const hwZHub = new THREE.Mesh(hwZHubGeo, mats.chrome);
    hwZHub.rotation.x = Math.PI / 2;
    hwZGroup.add(hwZHub);
    registerPartMesh("handwheel_z", hwZHub);

    // 3 Chrome Spokes
    for (let s = 0; s < 3; s++) {
      const angle = (s * Math.PI * 2) / 3;
      const spokeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.36, 12);
      const spoke = new THREE.Mesh(spokeGeo, mats.chrome);
      spoke.position.set(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0);
      spoke.rotation.z = angle - Math.PI / 2;
      hwZGroup.add(spoke);
      registerPartMesh("handwheel_z", spoke);
    }

    // Revolving crank handle
    const hwZHandleGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.42, 12);
    const hwZHandle = new THREE.Mesh(hwZHandleGeo, mats.blackPhenolic);
    hwZHandle.rotation.x = Math.PI / 2;
    hwZHandle.position.set(0.30, 0, 0.20);
    hwZGroup.add(hwZHandle);
    registerPartMesh("handwheel_z", hwZHandle);

    kneeGroup.add(hwZGroup);

    root.add(kneeGroup);
    parts.kneeGroup = kneeGroup;
    parts.hwZGroup = hwZGroup;
    parts.anchors["knee"] = new THREE.Vector3(0, -0.4, 0.9);
    parts.anchors["handwheel_z"] = new THREE.Vector3(-0.42, -0.90, 1.75);

    // ==========================================
    // 4. SADDLE (SADEL / GERAK MELINTANG - SUMBU Y)
    // Sits on knee ways at Y = 0.47, spans Z = 0.25 to 1.95
    // ==========================================
    const saddleGroup = new THREE.Group();
    saddleGroup.name = "Milling_Saddle";

    // Main saddle casting
    const saddleMainGeo = new THREE.BoxGeometry(2.2, 0.34, 1.7);
    const saddleMain = new THREE.Mesh(saddleMainGeo, mats.bodyLight);
    saddleMain.position.set(0, 0.47, 1.10);
    saddleGroup.add(saddleMain);
    registerPartMesh("saddle", saddleMain);

    // Front deep blue accent bracket (characteristic feature in Mesin Frais.png)
    const saddleFrontBlueGeo = new THREE.BoxGeometry(2.22, 0.20, 0.18);
    const saddleFrontBlue = new THREE.Mesh(saddleFrontBlueGeo, mats.baseBlue);
    saddleFrontBlue.position.set(0, 0.44, 1.95);
    saddleGroup.add(saddleFrontBlue);
    registerPartMesh("saddle", saddleFrontBlue);

    // Top longitudinal guide ways for table (X travel)
    const saddleWaysGeo = new THREE.BoxGeometry(2.1, 0.08, 1.3);
    const saddleWays = new THREE.Mesh(saddleWaysGeo, mats.steelWays);
    saddleWays.position.set(0, 0.68, 1.10);
    saddleGroup.add(saddleWays);
    registerPartMesh("saddle", saddleWays);

    // Front bearing housing block for Handwheel Y
    const saddleBearingGeo = new THREE.BoxGeometry(0.60, 0.36, 0.28);
    const saddleBearing = new THREE.Mesh(saddleBearingGeo, mats.bodyLight);
    saddleBearing.position.set(-0.65, 0.42, 2.05);
    saddleGroup.add(saddleBearing);
    registerPartMesh("saddle", saddleBearing);

    // Handwheel Y (Gerak Melintang)
    const hwYGroup = new THREE.Group();
    hwYGroup.position.set(-0.65, 0.42, 2.20);

    // Micrometer Vernier Dial Collar
    const hwYDialGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.14, 24);
    const hwYDial = new THREE.Mesh(hwYDialGeo, mats.chrome);
    hwYDial.rotation.x = Math.PI / 2;
    hwYGroup.add(hwYDial);
    registerPartMesh("handwheel_y", hwYDial);

    // Handwheel Y Ring
    const hwYRingGeo = new THREE.TorusGeometry(0.38, 0.06, 12, 28);
    const hwYRing = new THREE.Mesh(hwYRingGeo, mats.blackPhenolic);
    hwYRing.position.z = 0.10;
    hwYGroup.add(hwYRing);
    registerPartMesh("handwheel_y", hwYRing);

    // Spokes
    for (let s = 0; s < 3; s++) {
      const angle = (s * Math.PI * 2) / 3;
      const spokeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.34, 12);
      const spoke = new THREE.Mesh(spokeGeo, mats.chrome);
      spoke.position.set(Math.cos(angle) * 0.17, Math.sin(angle) * 0.17, 0.10);
      spoke.rotation.z = angle - Math.PI / 2;
      hwYGroup.add(spoke);
      registerPartMesh("handwheel_y", spoke);
    }

    // Revolving handle
    const hwYHandleGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.42, 12);
    const hwYHandle = new THREE.Mesh(hwYHandleGeo, mats.blackPhenolic);
    hwYHandle.rotation.x = Math.PI / 2;
    hwYHandle.position.set(0.28, 0, 0.30);
    hwYGroup.add(hwYHandle);
    registerPartMesh("handwheel_y", hwYHandle);

    saddleGroup.add(hwYGroup);

    // Attach Saddle to Knee (Kinematic Chain for Sumbu Z / Vertikal)
    kneeGroup.add(saddleGroup);
    parts.saddleGroup = saddleGroup;
    parts.hwYGroup = hwYGroup;
    parts.anchors["saddle"] = new THREE.Vector3(0, 0.48, 1.10);
    parts.anchors["handwheel_y"] = new THREE.Vector3(-0.65, 0.42, 2.35);

    // ==========================================
    // 5. TABLE (MEJA KERJA BERALUR T - SUMBU X)
    // Centered at Z = 1.10 with depth 1.16 (Z: 0.52 to 1.68)
    // Rear edge at Z = 0.52 leaves ~0.52 open clearance from column front at Z = 0.0!
    // ==========================================
    const tableGroup = new THREE.Group();
    tableGroup.name = "Milling_Table";

    // Main heavy precision table slab
    const tableMainGeo = new THREE.BoxGeometry(8.4, 0.34, 1.16);
    const tableMain = new THREE.Mesh(tableMainGeo, mats.tableSteel);
    tableMain.position.set(0, 0.86, 1.10);
    tableGroup.add(tableMain);
    registerPartMesh("table", tableMain);

    // Top precision ground surface
    const tableTopGeo = new THREE.BoxGeometry(8.36, 0.02, 1.12);
    const tableTop = new THREE.Mesh(tableTopGeo, mats.steelPolished);
    tableTop.position.set(0, 1.04, 1.10);
    tableGroup.add(tableTop);
    registerPartMesh("table", tableTop);

    // 3 Precision Longitudinal T-Slots running along X
    [-0.25, 0, 0.25].forEach((tz) => {
      const slotGeo = new THREE.BoxGeometry(8.1, 0.035, 0.065);
      const slot = new THREE.Mesh(slotGeo, mats.steelDark);
      slot.position.set(0, 1.04, 1.10 + tz);
      tableGroup.add(slot);
      registerPartMesh("table", slot);
    });

    // Left and Right End Bearing Bracket Caps
    const capLeftGeo = new THREE.BoxGeometry(0.22, 0.34, 1.16);
    const capLeft = new THREE.Mesh(capLeftGeo, mats.bodyLight);
    capLeft.position.set(-4.2, 0.86, 1.10);
    tableGroup.add(capLeft);
    registerPartMesh("table", capLeft);

    const capRight = capLeft.clone();
    capRight.position.x = 4.2;
    tableGroup.add(capRight);
    registerPartMesh("table", capRight);

    // Handwheel X (Gerak Memanjang - prominent on the right end)
    const hwXGroup = new THREE.Group();
    hwXGroup.position.set(4.35, 0.86, 1.10);

    // Lead screw extension shaft
    const hwXShaftGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.30, 16);
    const hwXShaft = new THREE.Mesh(hwXShaftGeo, mats.chrome);
    hwXShaft.rotation.z = Math.PI / 2;
    hwXShaft.position.x = 0.15;
    hwXGroup.add(hwXShaft);
    registerPartMesh("handwheel_x", hwXShaft);

    // Micrometer Dial Collar
    const hwXDialGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 24);
    const hwXDial = new THREE.Mesh(hwXDialGeo, mats.chrome);
    hwXDial.rotation.z = Math.PI / 2;
    hwXDial.position.x = 0.30;
    hwXGroup.add(hwXDial);
    registerPartMesh("handwheel_x", hwXDial);

    // Handwheel X Ring
    const hwXRingGeo = new THREE.TorusGeometry(0.44, 0.065, 12, 28);
    const hwXRing = new THREE.Mesh(hwXRingGeo, mats.blackPhenolic);
    hwXRing.rotation.y = Math.PI / 2;
    hwXRing.position.x = 0.42;
    hwXGroup.add(hwXRing);
    registerPartMesh("handwheel_x", hwXRing);

    // Spokes
    for (let s = 0; s < 3; s++) {
      const angle = (s * Math.PI * 2) / 3;
      const spokeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.40, 12);
      const spoke = new THREE.Mesh(spokeGeo, mats.chrome);
      spoke.position.set(0.42, Math.cos(angle) * 0.20, Math.sin(angle) * 0.20);
      spoke.rotation.x = angle;
      hwXGroup.add(spoke);
      registerPartMesh("handwheel_x", spoke);
    }

    // Revolving crank handle
    const hwXHandleGeo = new THREE.CylinderGeometry(0.04, 0.065, 0.46, 12);
    const hwXHandle = new THREE.Mesh(hwXHandleGeo, mats.blackPhenolic);
    hwXHandle.rotation.z = Math.PI / 2;
    hwXHandle.position.set(0.68, 0.32, 0);
    hwXGroup.add(hwXHandle);
    registerPartMesh("handwheel_x", hwXHandle);

    tableGroup.add(hwXGroup);

    // Left end crank handle
    const leftCrankGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.28, 12);
    const leftCrank = new THREE.Mesh(leftCrankGeo, mats.chrome);
    leftCrank.rotation.z = Math.PI / 2;
    leftCrank.position.set(-4.38, 0.86, 1.10);
    tableGroup.add(leftCrank);

    // Attach Table to Saddle (Kinematic Chain for Sumbu Y / Melintang)
    saddleGroup.add(tableGroup);
    parts.tableGroup = tableGroup;
    parts.hwXGroup = hwXGroup;
    parts.anchors["table"] = new THREE.Vector3(1.2, 0.86, 1.10);
    parts.anchors["handwheel_x"] = new THREE.Vector3(4.75, 0.86, 1.10);

    // ==========================================
    // 6. MACHINE VISE (RAGUM PENJEPIT) & WORKPIECE
    // Mounted directly on table at Z = 1.10
    // Realistically proportioned with elevated parallels & securely clamped workpiece
    // ==========================================
    const ragumGroup = new THREE.Group();
    ragumGroup.name = "Milling_Vise";

    // Vise Swivel Base Plate (Deep blue cast round plate with degree scale)
    const viseBaseGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.06, 32);
    const viseBase = new THREE.Mesh(viseBaseGeo, mats.viseBlue);
    viseBase.position.set(0, 1.07, 1.10);
    ragumGroup.add(viseBase);
    registerPartMesh("ragum", viseBase);

    // Degree scale graduation ring on vise swivel base
    const viseScaleRingGeo = new THREE.CylinderGeometry(0.79, 0.79, 0.02, 32);
    const viseScaleRing = new THREE.Mesh(viseScaleRingGeo, mats.steelPolished);
    viseScaleRing.position.set(0, 1.11, 1.10);
    ragumGroup.add(viseScaleRing);

    // 2 T-bolt base clamping ears (locking vise to table T-slots)
    [[-0.82, 0], [0.82, 0]].forEach(([ex, ez]) => {
      const earGeo = new THREE.BoxGeometry(0.18, 0.08, 0.22);
      const ear = new THREE.Mesh(earGeo, mats.viseBlue);
      ear.position.set(ex, 1.08, 1.10 + ez);
      ragumGroup.add(ear);
      registerPartMesh("ragum", ear);

      const boltGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12);
      const bolt = new THREE.Mesh(boltGeo, mats.steelDark);
      bolt.position.set(ex, 1.14, 1.10 + ez);
      ragumGroup.add(bolt);
      registerPartMesh("ragum", bolt);
    });

    // Vise Main Body Casting (Blue enamel heavy cast frame)
    const viseBodyGeo = new THREE.BoxGeometry(1.50, 0.22, 1.50);
    const viseBody = new THREE.Mesh(viseBodyGeo, mats.viseBlue);
    viseBody.position.set(0, 1.22, 1.10);
    ragumGroup.add(viseBody);
    registerPartMesh("ragum", viseBody);

    // Precision ground center guide slideway bed (steel ways where jaw slides)
    const viseWaysGeo = new THREE.BoxGeometry(0.82, 0.03, 1.46);
    const viseWays = new THREE.Mesh(viseWaysGeo, mats.steelWays);
    viseWays.position.set(0, 1.335, 1.10);
    ragumGroup.add(viseWays);
    registerPartMesh("ragum", viseWays);

    // Center relief channel along slideway
    const viseGrooveGeo = new THREE.BoxGeometry(0.26, 0.04, 1.44);
    const viseGroove = new THREE.Mesh(viseGrooveGeo, mats.steelDark);
    viseGroove.position.set(0, 1.34, 1.10);
    ragumGroup.add(viseGroove);
    registerPartMesh("ragum", viseGroove);

    // Precision Ground Parallels (Sepasang Ganjal Presisi / Parallel Bars)
    // Sits on the vise slideway to raise workpiece so it protrudes safely above jaws
    const parallelBarsGroup = new THREE.Group();
    parallelBarsGroup.name = "Parallel_Bars";
    const parGeo = new THREE.BoxGeometry(1.35, 0.08, 0.05);
    const parRear = new THREE.Mesh(parGeo, mats.steelDark);
    parRear.position.set(0, 1.38, 0.95);
    parallelBarsGroup.add(parRear);
    registerPartMesh("ragum", parRear);

    const parFront = new THREE.Mesh(parGeo, mats.steelDark);
    parFront.position.set(0, 1.38, 1.25);
    parallelBarsGroup.add(parFront);
    registerPartMesh("ragum", parFront);

    ragumGroup.add(parallelBarsGroup);
    parts.parallelBarsGroup = parallelBarsGroup;
    parts.parRear = parRear;
    parts.parFront = parFront;

    // Fixed Rear Jaw Casting (Rahang Tetap)
    const jawFixedGeo = new THREE.BoxGeometry(1.50, 0.24, 0.26);
    const jawFixed = new THREE.Mesh(jawFixedGeo, mats.viseBlue);
    jawFixed.position.set(0, 1.45, 0.72);
    ragumGroup.add(jawFixed);
    registerPartMesh("ragum", jawFixed);

    // Fixed jaw top socket cap screws
    [[-0.50, 0.72], [0.50, 0.72]].forEach(([bx, bz]) => {
      const capGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
      const cap = new THREE.Mesh(capGeo, mats.steelDark);
      cap.position.set(bx, 1.58, bz);
      ragumGroup.add(cap);
    });

    // Fixed Jaw Ground Hardened Steel Plate (Plat Baja Rahang Belakang)
    // Front clamping face is exactly at Z = 0.87
    const jawPlateRearGeo = new THREE.BoxGeometry(1.50, 0.22, 0.04);
    const jawPlateRear = new THREE.Mesh(jawPlateRearGeo, mats.steelPolished);
    jawPlateRear.position.set(0, 1.45, 0.85);
    ragumGroup.add(jawPlateRear);
    registerPartMesh("ragum", jawPlateRear);

    // Movable Front Jaw Group (Rahang Bergerak - otomatis menyesuaikan lebar benda kerja L)
    const jawMovableGroup = new THREE.Group();
    jawMovableGroup.name = "Movable_Jaw_Assembly";

    const jawMoveGeo = new THREE.BoxGeometry(1.50, 0.24, 0.28);
    const jawMove = new THREE.Mesh(jawMoveGeo, mats.viseBlue);
    jawMove.position.set(0, 1.45, 1.51);
    jawMovableGroup.add(jawMove);
    registerPartMesh("ragum", jawMove);

    // Movable jaw top socket cap screws
    [[-0.50, 1.51], [0.50, 1.51]].forEach(([bx, bz]) => {
      const capGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
      const cap = new THREE.Mesh(capGeo, mats.steelDark);
      cap.position.set(bx, 1.58, bz);
      jawMovableGroup.add(cap);
    });

    // Movable Jaw Ground Hardened Steel Plate (Plat Baja Rahang Depan)
    // Clamping back face is at Z = 1.33 for standard L=40 (L_3D=0.46)
    const jawPlateFrontGeo = new THREE.BoxGeometry(1.50, 0.22, 0.04);
    const jawPlateFront = new THREE.Mesh(jawPlateFrontGeo, mats.steelPolished);
    jawPlateFront.position.set(0, 1.45, 1.35);
    jawMovableGroup.add(jawPlateFront);
    registerPartMesh("ragum", jawPlateFront);

    ragumGroup.add(jawMovableGroup);
    parts.jawMovableGroup = jawMovableGroup;

    // Helper: Create a single unified, 100% solid watertight workpiece geometry
    // Combines top heightfield (NX*NY), 4 dynamic edge-lowering side walls, and bottom face
    function createUnifiedSolidWorkpieceGeo(NX, NY, defaultT) {
      const geo = new THREE.BufferGeometry();
      const totalVerts = (NX * NY) + (NY * 2) + (NY * 2) + (NX * 2) + (NX * 2) + 4;
      const positions = new Float32Array(totalVerts * 3);
      const colors = new Float32Array(totalVerts * 3);
      const indices = [];

      const baseIdxLeft = NX * NY;
      const baseIdxRight = baseIdxLeft + (NY * 2);
      const baseIdxRear = baseIdxRight + (NY * 2);
      const baseIdxFront = baseIdxRear + (NX * 2);
      const baseIdxBottom = baseIdxFront + (NX * 2);

      const rawR = 0.68, rawG = 0.72, rawB = 0.80;

      // 1. Top Heightfield Surface
      for (let iy = 0; iy < NY; iy++) {
        const v = (iy / (NY - 1)) - 0.5;
        for (let ix = 0; ix < NX; ix++) {
          const u = (ix / (NX - 1)) - 0.5;
          const vIdx = ix + iy * NX;
          const p3 = vIdx * 3;
          positions[p3] = u;
          positions[p3 + 1] = defaultT;
          positions[p3 + 2] = v;

          colors[p3] = rawR;
          colors[p3 + 1] = rawG;
          colors[p3 + 2] = rawB;
        }
      }
      for (let iy = 0; iy < NY - 1; iy++) {
        for (let ix = 0; ix < NX - 1; ix++) {
          const a = ix + iy * NX;
          const b = (ix + 1) + iy * NX;
          const c = ix + (iy + 1) * NX;
          const d = (ix + 1) + (iy + 1) * NX;
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }

      // 2. Left Wall (-X side at x = -0.5)
      for (let iy = 0; iy < NY; iy++) {
        const v = (iy / (NY - 1)) - 0.5;
        const idxBot = baseIdxLeft + iy * 2;
        const idxTop = baseIdxLeft + iy * 2 + 1;

        positions[idxBot * 3] = -0.5;
        positions[idxBot * 3 + 1] = 0;
        positions[idxBot * 3 + 2] = v;
        colors[idxBot * 3] = rawR * 0.95;
        colors[idxBot * 3 + 1] = rawG * 0.95;
        colors[idxBot * 3 + 2] = rawB * 0.95;

        positions[idxTop * 3] = -0.5;
        positions[idxTop * 3 + 1] = defaultT;
        positions[idxTop * 3 + 2] = v;
        colors[idxTop * 3] = rawR;
        colors[idxTop * 3 + 1] = rawG;
        colors[idxTop * 3 + 2] = rawB;
      }
      for (let iy = 0; iy < NY - 1; iy++) {
        const b0 = baseIdxLeft + iy * 2;
        const t0 = baseIdxLeft + iy * 2 + 1;
        const b1 = baseIdxLeft + (iy + 1) * 2;
        const t1 = baseIdxLeft + (iy + 1) * 2 + 1;
        indices.push(b0, b1, t0);
        indices.push(t0, b1, t1);
      }

      // 3. Right Wall (+X side at x = 0.5)
      for (let iy = 0; iy < NY; iy++) {
        const v = (iy / (NY - 1)) - 0.5;
        const idxBot = baseIdxRight + iy * 2;
        const idxTop = baseIdxRight + iy * 2 + 1;

        positions[idxBot * 3] = 0.5;
        positions[idxBot * 3 + 1] = 0;
        positions[idxBot * 3 + 2] = v;
        colors[idxBot * 3] = rawR * 0.95;
        colors[idxBot * 3 + 1] = rawG * 0.95;
        colors[idxBot * 3 + 2] = rawB * 0.95;

        positions[idxTop * 3] = 0.5;
        positions[idxTop * 3 + 1] = defaultT;
        positions[idxTop * 3 + 2] = v;
        colors[idxTop * 3] = rawR;
        colors[idxTop * 3 + 1] = rawG;
        colors[idxTop * 3 + 2] = rawB;
      }
      for (let iy = 0; iy < NY - 1; iy++) {
        const b0 = baseIdxRight + iy * 2;
        const t0 = baseIdxRight + iy * 2 + 1;
        const b1 = baseIdxRight + (iy + 1) * 2;
        const t1 = baseIdxRight + (iy + 1) * 2 + 1;
        indices.push(b0, t0, b1);
        indices.push(t0, t1, b1);
      }

      // 4. Rear Wall (-Z side at z = -0.5, facing fixed jaw)
      for (let ix = 0; ix < NX; ix++) {
        const u = (ix / (NX - 1)) - 0.5;
        const idxBot = baseIdxRear + ix * 2;
        const idxTop = baseIdxRear + ix * 2 + 1;

        positions[idxBot * 3] = u;
        positions[idxBot * 3 + 1] = 0;
        positions[idxBot * 3 + 2] = -0.5;
        colors[idxBot * 3] = rawR * 0.95;
        colors[idxBot * 3 + 1] = rawG * 0.95;
        colors[idxBot * 3 + 2] = rawB * 0.95;

        positions[idxTop * 3] = u;
        positions[idxTop * 3 + 1] = defaultT;
        positions[idxTop * 3 + 2] = -0.5;
        colors[idxTop * 3] = rawR;
        colors[idxTop * 3 + 1] = rawG;
        colors[idxTop * 3 + 2] = rawB;
      }
      for (let ix = 0; ix < NX - 1; ix++) {
        const b0 = baseIdxRear + ix * 2;
        const t0 = baseIdxRear + ix * 2 + 1;
        const b1 = baseIdxRear + (ix + 1) * 2;
        const t1 = baseIdxRear + (ix + 1) * 2 + 1;
        indices.push(b0, t0, b1);
        indices.push(t0, t1, b1);
      }

      // 5. Front Wall (+Z side at z = 0.5, facing movable jaw)
      for (let ix = 0; ix < NX; ix++) {
        const u = (ix / (NX - 1)) - 0.5;
        const idxBot = baseIdxFront + ix * 2;
        const idxTop = baseIdxFront + ix * 2 + 1;

        positions[idxBot * 3] = u;
        positions[idxBot * 3 + 1] = 0;
        positions[idxBot * 3 + 2] = 0.5;
        colors[idxBot * 3] = rawR * 0.95;
        colors[idxBot * 3 + 1] = rawG * 0.95;
        colors[idxBot * 3 + 2] = rawB * 0.95;

        positions[idxTop * 3] = u;
        positions[idxTop * 3 + 1] = defaultT;
        positions[idxTop * 3 + 2] = 0.5;
        colors[idxTop * 3] = rawR;
        colors[idxTop * 3 + 1] = rawG;
        colors[idxTop * 3 + 2] = rawB;
      }
      for (let ix = 0; ix < NX - 1; ix++) {
        const b0 = baseIdxFront + ix * 2;
        const t0 = baseIdxFront + ix * 2 + 1;
        const b1 = baseIdxFront + (ix + 1) * 2;
        const t1 = baseIdxFront + (ix + 1) * 2 + 1;
        indices.push(b0, b1, t0);
        indices.push(t0, b1, t1);
      }

      // 6. Bottom Face (-Y side at y = 0, resting on parallel bars)
      const v0 = baseIdxBottom;
      const v1 = baseIdxBottom + 1;
      const v2 = baseIdxBottom + 2;
      const v3 = baseIdxBottom + 3;

      const bCoords = [
        [-0.5, 0, -0.5],
        [0.5, 0, -0.5],
        [0.5, 0, 0.5],
        [-0.5, 0, 0.5]
      ];
      for (let i = 0; i < 4; i++) {
        const p3 = (baseIdxBottom + i) * 3;
        positions[p3] = bCoords[i][0];
        positions[p3 + 1] = bCoords[i][1];
        positions[p3 + 2] = bCoords[i][2];
        colors[p3] = rawR * 0.85;
        colors[p3 + 1] = rawG * 0.85;
        colors[p3 + 2] = rawB * 0.85;
      }
      indices.push(v0, v1, v2);
      indices.push(v0, v2, v3);

      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      geo.userData = {
        NX: NX,
        NY: NY,
        baseIdxLeft: baseIdxLeft,
        baseIdxRight: baseIdxRight,
        baseIdxRear: baseIdxRear,
        baseIdxFront: baseIdxFront,
        baseIdxBottom: baseIdxBottom
      };

      return geo;
    }

    // Workpiece Assembly: 100% Watertight Solid Monolithic Workpiece with Adaptive Heightfield
    const workpieceGroup = new THREE.Group();
    workpieceGroup.name = "Milling_Workpiece_Assembly";

    const NX_3D = 96;
    const NY_3D = 48;
    const wpSolidGeo = createUnifiedSolidWorkpieceGeo(NX_3D, NY_3D, 0.45);

    const wpSolidMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      metalness: 0.75,
      side: THREE.DoubleSide
    });
    const wpSolidMesh = new THREE.Mesh(wpSolidGeo, wpSolidMat);
    wpSolidMesh.name = "Workpiece_Solid_Watertight";
    workpieceGroup.add(wpSolidMesh);

    ragumGroup.add(workpieceGroup);
    parts.workpieceGroup = workpieceGroup;
    parts.wpSolidMesh = wpSolidMesh;
    parts.wpTopMesh = wpSolidMesh; // Keep reference for backward compatibility
    parts.wpBodyMesh = null;
    parts.wpBottomMesh = null;
    parts.wpLeftMesh = null;
    parts.wpRightMesh = null;
    parts.wpRearMesh = null;
    parts.wpFrontMesh = null;
    parts.lastMillingGridVersion = -1;
    parts.lastDimensionsKey = "";
    parts.lastEvalStatus = "";
    parts.lastMaterialKey = "";

    // Clamping Acme Lead Screw
    const viseScrewGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.46, 16);
    const viseScrew = new THREE.Mesh(viseScrewGeo, mats.steelPolished);
    viseScrew.rotation.x = Math.PI / 2;
    viseScrew.position.set(0, 1.32, 1.70);
    ragumGroup.add(viseScrew);
    registerPartMesh("ragum", viseScrew);
    parts.viseScrew = viseScrew;

    // Front Screw Thrust Bearing Block
    const screwBearingGeo = new THREE.BoxGeometry(0.50, 0.20, 0.14);
    const screwBearing = new THREE.Mesh(screwBearingGeo, mats.viseBlue);
    screwBearing.position.set(0, 1.32, 1.90);
    ragumGroup.add(screwBearing);
    registerPartMesh("ragum", screwBearing);

    // Clamping Hex Nut & Tightening Crank Handle
    const hexNutGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 6);
    const hexNut = new THREE.Mesh(hexNutGeo, mats.chrome);
    hexNut.rotation.x = Math.PI / 2;
    hexNut.position.set(0, 1.32, 1.98);
    ragumGroup.add(hexNut);
    registerPartMesh("ragum", hexNut);

    const viseCrankGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.46, 12);
    const viseCrank = new THREE.Mesh(viseCrankGeo, mats.chrome);
    viseCrank.position.set(0, 1.32, 2.08);
    ragumGroup.add(viseCrank);
    registerPartMesh("ragum", viseCrank);

    // Attach Vise to Table (Kinematic Chain for Sumbu X / Memanjang)
    tableGroup.add(ragumGroup);
    parts.ragumGroup = ragumGroup;
    parts.anchors["ragum"] = new THREE.Vector3(0, 1.50, 1.10);

    // ==========================================
    // 7. RAM, OVERARM & HEAD (KEPALA MESIN)
    // Sits atop column and cantilevers forward so head aligns at Z = 1.10
    // ==========================================
    const headGroup = new THREE.Group();
    headGroup.name = "Milling_Head";

    // Horizontal Sliding Ram on top of column (Z from -2.0 to 0.6)
    const ramGeo = new THREE.BoxGeometry(1.75, 0.85, 2.6);
    const ram = new THREE.Mesh(ramGeo, mats.bodyLight);
    ram.position.set(0, 3.82, -0.7);
    headGroup.add(ram);
    registerPartMesh("ram_head", ram);

    // Front Swivel Knuckle (Rotates for angular milling)
    const knuckleGeo = new THREE.CylinderGeometry(0.80, 0.80, 0.65, 32);
    const knuckle = new THREE.Mesh(knuckleGeo, mats.bodyMedium);
    knuckle.rotation.z = Math.PI / 2;
    knuckle.position.set(0, 3.82, 0.55);
    headGroup.add(knuckle);
    registerPartMesh("ram_head", knuckle);

    // Milling Head Main Housing (Centered over table at Z = 1.10)
    const headHousingGeo = new THREE.BoxGeometry(1.65, 1.4, 1.4);
    const headHousing = new THREE.Mesh(headHousingGeo, mats.bodyLight);
    headHousing.position.set(0, 3.85, 1.10);
    headGroup.add(headHousing);
    registerPartMesh("ram_head", headHousing);

    // Front Nameplate Badge: "VERTICAL MILLING MACHINE"
    const badgeTex = createMillingHeadBadgeTexture();
    if (badgeTex) {
      const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTex });
      const badgeGeo = new THREE.PlaneGeometry(1.2, 0.36);
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0, 4.18, 1.81);
      headGroup.add(badge);
      registerPartMesh("ram_head", badge);
    }

    // Speed Range & Gear Shift Levers (Left & Right)
    [[-0.90, 0x1e293b], [0.90, 0x1e293b]].forEach(([lx, col]) => {
      const rodGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.40, 12);
      const rod = new THREE.Mesh(rodGeo, mats.chrome);
      rod.position.set(lx, 3.95, 1.10);
      rod.rotation.z = lx > 0 ? -Math.PI / 4 : Math.PI / 4;
      headGroup.add(rod);
      registerPartMesh("ram_head", rod);

      const knobGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const knobMat = createMat(col, 0.3, 0.2);
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.position.set(lx + (lx > 0 ? 0.16 : -0.16), 4.12, 1.10);
      headGroup.add(knob);
      registerPartMesh("ram_head", knob);
    });

    // Sensitive Quill Feed Lever (Manual spoke lever with black knob on right side)
    const quillLeverHubGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16);
    const quillLeverHub = new THREE.Mesh(quillLeverHubGeo, mats.chrome);
    quillLeverHub.rotation.z = Math.PI / 2;
    quillLeverHub.position.set(0.92, 3.25, 1.10);
    headGroup.add(quillLeverHub);

    const quillLeverRodGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.75, 12);
    const quillLeverRod = new THREE.Mesh(quillLeverRodGeo, mats.chrome);
    quillLeverRod.position.set(1.02, 3.25, 1.45);
    quillLeverRod.rotation.x = Math.PI / 3;
    headGroup.add(quillLeverRod);
    registerPartMesh("ram_head", quillLeverRod);

    const quillKnobGeo = new THREE.SphereGeometry(0.10, 16, 16);
    const quillKnob = new THREE.Mesh(quillKnobGeo, mats.blackPhenolic);
    quillKnob.position.set(1.02, 3.48, 1.76);
    headGroup.add(quillKnob);
    registerPartMesh("ram_head", quillKnob);

    // Fine Feed Handwheel on front face
    const fineDialGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.10, 20);
    const fineDial = new THREE.Mesh(fineDialGeo, mats.chrome);
    fineDial.rotation.x = Math.PI / 2;
    fineDial.position.set(0.42, 3.45, 1.81);
    headGroup.add(fineDial);
    registerPartMesh("ram_head", fineDial);

    // Quill housing sleeve casting
    const quillHousingGeo = new THREE.CylinderGeometry(0.50, 0.50, 1.05, 32);
    const quillHousing = new THREE.Mesh(quillHousingGeo, mats.bodyLight);
    quillHousing.position.set(0, 3.05, 1.10);
    headGroup.add(quillHousing);
    registerPartMesh("ram_head", quillHousing);

    // Depth Stop Rod on front of quill
    const depthRodGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 12);
    const depthRod = new THREE.Mesh(depthRodGeo, mats.chrome);
    depthRod.position.set(0.35, 2.85, 1.45);
    headGroup.add(depthRod);

    root.add(headGroup);
    parts.anchors["ram_head"] = new THREE.Vector3(0, 3.8, 1.25);
    parts.anchors["overarm"] = parts.anchors["ram_head"];

    // ==========================================
    // 8. ELECTRIC DRIVE MOTOR (MOTOR PENGGERAK UTAMA)
    // Mounted atop the rear of the head/ram at Z = 0.50
    // ==========================================
    const motorGroup = new THREE.Group();
    motorGroup.name = "Milling_Motor";

    // Main Motor Cylinder in deep blue
    const motorBodyGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.4, 32);
    const motorBody = new THREE.Mesh(motorBodyGeo, mats.motorBlue);
    motorBody.position.set(0, 5.25, 0.50);
    motorGroup.add(motorBody);
    registerPartMesh("motor", motorBody);

    // 16 Vertical Cooling Fins around motor perimeter
    for (let f = 0; f < 16; f++) {
      const angle = (f * Math.PI * 2) / 16;
      const finGeo = new THREE.BoxGeometry(0.03, 1.25, 0.10);
      const fin = new THREE.Mesh(finGeo, mats.motorBlue);
      fin.position.set(
        Math.cos(angle) * 0.67,
        5.25,
        0.50 + Math.sin(angle) * 0.67
      );
      fin.rotation.y = -angle;
      motorGroup.add(fin);
      registerPartMesh("motor", fin);
    }

    // Top fan cowl / dome end cap
    const motorCapGeo = new THREE.CylinderGeometry(0.62, 0.67, 0.32, 32);
    const motorCap = new THREE.Mesh(motorCapGeo, mats.motorCap);
    motorCap.position.set(0, 6.05, 0.50);
    motorGroup.add(motorCap);
    registerPartMesh("motor", motorCap);

    // Terminal electrical junction box on side
    const motorBoxGeo = new THREE.BoxGeometry(0.30, 0.42, 0.38);
    const motorBox = new THREE.Mesh(motorBoxGeo, mats.bodyDark);
    motorBox.position.set(0.74, 5.2, 0.50);
    motorGroup.add(motorBox);
    registerPartMesh("motor", motorBox);

    root.add(motorGroup);
    parts.anchors["motor"] = new THREE.Vector3(0, 5.35, 0.50);

    // ==========================================
    // 9. SPINDLE, ARBOR & END MILL CUTTER (SPINDEL, ARBOR & PISAU FRAIS)
    // Coaxial with head and centered over table at X = 0, Z = 1.10
    // Height dynamically synchronized with workpiece top surface and depth of cut
    // ==========================================
    const spindleGroup = new THREE.Group();
    spindleGroup.name = "Milling_Spindle";
    spindleGroup.position.set(0, 2.74, 1.10);

    // Precision ground chrome quill sleeve (Selongsong Poros Quill)
    const quillSleeveGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.65, 32);
    const quillSleeve = new THREE.Mesh(quillSleeveGeo, mats.steelPolished);
    quillSleeve.position.set(0, 0.32, 0);
    spindleGroup.add(quillSleeve);
    registerPartMesh("spindle_milling", quillSleeve);

    // Spindle nose collar (Hidung Spindel ISO/NT40)
    const spindleNoseGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.14, 32);
    const spindleNose = new THREE.Mesh(spindleNoseGeo, mats.steelWays);
    spindleNose.position.set(0, 0.07, 0);
    spindleGroup.add(spindleNose);
    registerPartMesh("spindle_milling", spindleNose);

    // Dual Spindle Drive Keys (Pasak Penggerak Flens Arbor)
    [-0.15, 0.15].forEach((kx) => {
      const driveKeyGeo = new THREE.BoxGeometry(0.045, 0.06, 0.04);
      const driveKey = new THREE.Mesh(driveKeyGeo, mats.steelDark);
      driveKey.position.set(kx, 0.03, 0);
      spindleGroup.add(driveKey);
      registerPartMesh("spindle_milling", driveKey);
    });

    // ------------------------------------------
    // ARBOR PEMEGANG PISAU FRAIS (BT40 / NT40 COLLET CHUCK ARBOR)
    // Clearly distinct tool-holder assembly between spindle nose and end mill
    // ------------------------------------------
    const arborGroup = new THREE.Group();
    arborGroup.name = "Milling_Arbor_ToolHolder";

    // Arbor V-Flange Collar with Tool Change Retention Groove
    const arborFlangeGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.14, 32);
    const arborFlange = new THREE.Mesh(arborFlangeGeo, mats.steelPolished);
    arborFlange.position.set(0, -0.07, 0);
    arborGroup.add(arborFlange);
    registerPartMesh("spindle_milling", arborFlange);

    // Peripheral V-Groove on Arbor Flange
    const vGrooveGeo = new THREE.TorusGeometry(0.165, 0.015, 8, 32);
    const vGroove = new THREE.Mesh(vGrooveGeo, mats.steelDark);
    vGroove.position.set(0, -0.07, 0);
    vGroove.rotation.x = Math.PI / 2;
    arborGroup.add(vGroove);

    // Arbor Tapered Adapter Body / Chuck Neck
    const arborNeckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.22, 24);
    const arborNeck = new THREE.Mesh(arborNeckGeo, mats.steelDark);
    arborNeck.position.set(0, -0.25, 0);
    arborGroup.add(arborNeck);
    registerPartMesh("spindle_milling", arborNeck);

    // Collet Chuck Nose Barrel
    const chuckNoseGeo = new THREE.CylinderGeometry(0.115, 0.12, 0.12, 24);
    const chuckNose = new THREE.Mesh(chuckNoseGeo, mats.steelPolished);
    chuckNose.position.set(0, -0.42, 0);
    arborGroup.add(chuckNose);
    registerPartMesh("spindle_milling", chuckNose);

    // ER32 Collet Clamping Nut (Nut Pengencang Collet dengan spanner slots)
    const colletNutGeo = new THREE.CylinderGeometry(0.095, 0.11, 0.14, 24);
    const colletNut = new THREE.Mesh(colletNutGeo, mats.blackPhenolic);
    colletNut.position.set(0, -0.54, 0);
    arborGroup.add(colletNut);
    registerPartMesh("spindle_milling", colletNut);

    // 6 Peripheral Spanner Notches on Collet Nut
    for (let sn = 0; sn < 6; sn++) {
      const sAngle = (sn * Math.PI * 2) / 6;
      const notchGeo = new THREE.BoxGeometry(0.02, 0.08, 0.03);
      const notch = new THREE.Mesh(notchGeo, mats.steelDark);
      notch.position.set(Math.cos(sAngle) * 0.10, -0.54, Math.sin(sAngle) * 0.10);
      notch.rotation.y = -sAngle;
      arborGroup.add(notch);
    }

    spindleGroup.add(arborGroup);
    parts.arborGroup = arborGroup;

    // ------------------------------------------
    // PISAU FRAIS JARI (HELICAL CARBIDE END MILL CUTTER)
    // Nested in cutterGroup so it scales proportionally with Endmill diameter (8 to 20 mm)
    // Bottom end tip is exactly at y = -0.90
    // ------------------------------------------
    const cutterGroup = new THREE.Group();
    cutterGroup.name = "Milling_Cutter_Assembly";

    // Cylindrical tool shank gripped by collet (extends from y = -0.54 to -0.66)
    // Base diameter calibrated to 12 mm standard (flute radius = 0.078 units, diameter = 0.156 units matching 12 mm slot)
    const cutterShankGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.22, 24);
    const cutterShank = new THREE.Mesh(cutterShankGeo, mats.carbide);
    cutterShank.position.set(0, -0.60, 0);
    cutterGroup.add(cutterShank);
    registerPartMesh("spindle_milling", cutterShank);

    // Fluted cutting body with helical flutes (extends from y = -0.62 to -0.90)
    const cutterFlutesGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.28, 24);
    const cutterFlutes = new THREE.Mesh(cutterFlutesGeo, mats.carbide);
    cutterFlutes.position.set(0, -0.76, 0);
    cutterGroup.add(cutterFlutes);
    registerPartMesh("spindle_milling", cutterFlutes);

    // Helical spiral flutes rings with relief edges (4 flutes)
    for (let h = 0; h < 6; h++) {
      const fluteRingGeo = new THREE.TorusGeometry(0.076, 0.009, 8, 24);
      const fluteRing = new THREE.Mesh(fluteRingGeo, mats.steelDark);
      fluteRing.position.set(0, -0.63 - h * 0.045, 0);
      fluteRing.rotation.x = Math.PI / 4;
      cutterGroup.add(fluteRing);
      registerPartMesh("spindle_milling", fluteRing);
    }

    // End-cutting teeth on bottom tip face (at y = -0.90)
    const endTeethGeo = new THREE.CylinderGeometry(0.076, 0.015, 0.02, 20);
    const endTeeth = new THREE.Mesh(endTeethGeo, mats.carbide);
    endTeeth.position.set(0, -0.89, 0);
    cutterGroup.add(endTeeth);
    registerPartMesh("spindle_milling", endTeeth);

    spindleGroup.add(cutterGroup);
    parts.cutterGroup = cutterGroup;

    root.add(spindleGroup);
    parts.spindleGroup = spindleGroup;
    parts.anchors["spindle_milling"] = new THREE.Vector3(0, 2.10, 1.10);
    parts.anchors["spindle"] = parts.anchors["spindle_milling"];

    // ==========================================
    // 10. DIGITAL READOUT (DRO - PANEL KONTROL)
    // Mounted on right side of column and swings forward toward operator
    // ==========================================
    const droGroup = new THREE.Group();
    droGroup.name = "Milling_DRO";

    // Column swivel mount bracket (on right side of column)
    const droMountGeo = new THREE.BoxGeometry(0.26, 0.36, 0.36);
    const droMount = new THREE.Mesh(droMountGeo, mats.bodyDark);
    droMount.position.set(0.98, 3.2, -0.3);
    droGroup.add(droMount);

    // Articulated swing arm
    const arm1Geo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 16);
    const arm1 = new THREE.Mesh(arm1Geo, mats.steelDark);
    arm1.rotation.z = -Math.PI / 3;
    arm1.position.set(1.45, 3.4, 0.1);
    droGroup.add(arm1);

    const jointElbowGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.20, 16);
    const jointElbow = new THREE.Mesh(jointElbowGeo, mats.steelDark);
    jointElbow.position.set(1.85, 3.5, 0.5);
    droGroup.add(jointElbow);

    const arm2Geo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 16);
    const arm2 = new THREE.Mesh(arm2Geo, mats.steelDark);
    arm2.rotation.x = Math.PI / 3;
    arm2.position.set(1.95, 3.5, 0.85);
    droGroup.add(arm2);

    // DRO Console Bezel & Housing (Angled -18° toward operator)
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(2.0, 3.5, 1.15);
    consoleGroup.rotation.y = -Math.PI / 10;

    const consoleBoxGeo = new THREE.BoxGeometry(1.8, 1.15, 0.20);
    const consoleBox = new THREE.Mesh(consoleBoxGeo, mats.droBezel);
    consoleGroup.add(consoleBox);
    registerPartMesh("panel_kontrol", consoleBox);

    // Glowing DRO Screen Texture
    const droScreenTex = createDroScreenTexture();
    if (droScreenTex) {
      const screenMat = new THREE.MeshBasicMaterial({ map: droScreenTex });
      const screenGeo = new THREE.PlaneGeometry(0.92, 0.82);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-0.33, 0, 0.11);
      consoleGroup.add(screen);
      registerPartMesh("panel_kontrol", screen);
    }

    // Keypad Matrix Texture
    const droKeypadTex = createDroKeypadTexture();
    if (droKeypadTex) {
      const keypadMat = new THREE.MeshBasicMaterial({ map: droKeypadTex });
      const keypadGeo = new THREE.PlaneGeometry(0.52, 0.82);
      const keypad = new THREE.Mesh(keypadGeo, keypadMat);
      keypad.position.set(0.48, 0, 0.11);
      consoleGroup.add(keypad);
      registerPartMesh("panel_kontrol", keypad);
    }

    droGroup.add(consoleGroup);
    root.add(droGroup);
    parts.droGroup = droGroup;
    parts.anchors["panel_kontrol"] = new THREE.Vector3(2.0, 3.5, 1.20);

    // Dynamic 3-Axis Kinematic Controller
    // Allows full independent motion of Table (Sumbu X), Saddle (Sumbu Y), and Knee (Sumbu Z)
    // with realistic handwheel rotations
    parts.axisX = 0;
    parts.axisY = 0;
    parts.axisZ = 0;

    parts.setAxes = function (axX, axY, axZ) {
      if (typeof axX === "number") {
        parts.axisX = axX;
        if (parts.tableGroup) parts.tableGroup.position.x = axX;
        if (parts.hwXGroup) parts.hwXGroup.rotation.x = axX * 3.5;
      }
      if (typeof axY === "number") {
        parts.axisY = axY;
        if (parts.saddleGroup) parts.saddleGroup.position.z = axY;
        if (parts.hwYGroup) parts.hwYGroup.rotation.z = axY * 3.5;
      }
      if (typeof axZ === "number") {
        parts.axisZ = axZ;
        if (parts.kneeGroup) parts.kneeGroup.position.y = axZ;
        if (parts.hwZGroup) parts.hwZGroup.rotation.z = axZ * 3.5;
      }
    };

    // Set End Mill Diameter (8, 10, 12, 16, 20 mm)
    // Proportionally scales cutter shank and flutes in 3D to match active diameter
    parts.currentEndmillDia = 12;
    parts.setEndmillDiameter = function (diaMm) {
      const d = typeof diaMm === "number" ? diaMm : 12;
      parts.currentEndmillDia = d;
      // Base endmill diameter is 12 mm -> scale 1.0 (flute diameter = 0.069 units matching 12 mm slot)
      const scaleXZ = d / 12.0;
      if (parts.cutterGroup) {
        parts.cutterGroup.scale.set(scaleXZ, 1.0, scaleXZ);
      }
    };

    // Update Workpiece Dimensions (Panjang P, Lebar L, Tinggi T) & Real-Time Milling Cut Deformation
    // Update Workpiece Dimensions (Panjang P, Lebar L, Tinggi T) & Real-Time Milling Cut Deformation
    // Movable jaw automatically adjusts to tightly clamp workpiece width L
    // 3D Heightfield dynamically deforms according to persistent millingGrid (irreversible material removal)
    // Dynamic material adaptation: sets physical metal color, roughness & metalness based on selected material
    parts.updateWorkpieceAndVise = function (
      pMm,
      lMm,
      tMm,
      cutProgress,
      depthOfCut,
      evalStatus,
      millingGrid,
      millingGridVersion,
      materialId,
      matColorHex
    ) {
      const p = typeof pMm === "number" ? pMm : 100;
      const l = typeof lMm === "number" ? lMm : 40;
      const t = typeof tMm === "number" ? tMm : 40;

      // 3D Scene Unit Scaling:
      // P: 100 mm -> 1.35 units
      // L: 40 mm -> 0.46 units (proportional realistic vise clamping)
      // T: 40 mm -> 0.45 units
      const P_3D = (p / 100.0) * 1.35;
      const L_3D = (l / 40.0) * 0.46;
      const T_3D = (t / 40.0) * 0.45;

      // 1. Move Movable Jaw to tightly clamp workpiece width L
      // Front face of rear fixed jaw is at Z = 0.87
      // Front jaw plate touches workpiece at Z = 0.87 + L_3D
      // Default L = 40 mm -> L_3D = 0.46, front clamping face at 1.33
      const jawShiftZ = L_3D - 0.46;
      if (parts.jawMovableGroup) {
        parts.jawMovableGroup.position.z = jawShiftZ;
      }

      // 2. Adjust Clamping Lead Screw
      if (parts.viseScrew) {
        parts.viseScrew.position.z = 1.70 + jawShiftZ * 0.5;
        parts.viseScrew.scale.z = Math.max(0.4, 1.0 + jawShiftZ * 1.4);
      }

      // 3. Adjust Parallel Bars (Ganjal Presisi di bawah benda kerja)
      if (parts.parRear && parts.parFront) {
        const parScaleX = Math.max(0.5, P_3D / 1.35);
        parts.parRear.scale.x = parScaleX;
        parts.parFront.scale.x = parScaleX;
        parts.parRear.position.z = 0.87 + Math.min(0.06, L_3D * 0.18);
        parts.parFront.position.z = 0.87 + L_3D - Math.min(0.06, L_3D * 0.18);
      }

      const Y_base = 1.42;
      const Z_center = 0.87 + (L_3D / 2);
      const X_center = 0;

      // Workpiece Unified Solid Mesh (Top Heightfield + Adaptive Seamless Side Walls + Bottom)
      if (parts.wpSolidMesh) {
        // Base of solid workpiece rests directly on parallel bars (Y_base = 1.42)
        parts.wpSolidMesh.position.set(X_center, Y_base, Z_center);
        parts.wpSolidMesh.scale.set(P_3D, 1.0, L_3D);

        const geo = parts.wpSolidMesh.geometry;
        const posAttr = geo.attributes.position;
        const colAttr = geo.attributes.color;
        const uData = geo.userData;
        const NX = uData.NX || 96;
        const NY = uData.NY || 48;

        const curVersion = typeof millingGridVersion === "number" ? millingGridVersion : 0;
        const dimKey = `${p}-${l}-${t}`;
        const matKey = `${materialId || "mild_steel"}-${matColorHex || ""}`;

        if (
          parts.lastMillingGridVersion !== curVersion ||
          parts.lastDimensionsKey !== dimKey ||
          parts.lastEvalStatus !== evalStatus ||
          parts.lastMaterialKey !== matKey
        ) {
          parts.lastMillingGridVersion = curVersion;
          parts.lastDimensionsKey = dimKey;
          parts.lastEvalStatus = evalStatus;
          parts.lastMaterialKey = matKey;

          // Parse physical material color
          let rawColor;
          try {
            rawColor = new THREE.Color(
              matColorHex ||
                (materialId === "brass"
                  ? "#eab308"
                  : materialId === "aluminum"
                  ? "#cbd5e1"
                  : materialId === "cast_iron"
                  ? "#475569"
                  : materialId === "stainless_steel"
                  ? "#e2e8f0"
                  : "#94a3b8")
            );
          } catch (e) {
            rawColor = new THREE.Color(0x94a3b8);
          }

          const rawR = rawColor.r;
          const rawG = rawColor.g;
          const rawB = rawColor.b;

          const depthScale = 0.065 / 5.0; // 3D units per mm of cut depth

          // Cut surface highlights based on active material and evaluation status
          let cutR = 0.96, cutG = 0.98, cutB = 1.00;
          if (evalStatus === "BURNT") {
            cutR = 0.22; cutG = 0.18; cutB = 0.50; // Heat-tempered blue/violet
          } else if (evalStatus === "CHATTER") {
            cutR = rawR * 0.82; cutG = rawG * 0.82; cutB = rawB * 0.82; // Rough dull chatter
          } else {
            if (materialId === "brass") {
              cutR = 0.98; cutG = 0.88; cutB = 0.35; // Glistening golden brass mirror finish
            } else if (materialId === "aluminum") {
              cutR = 0.98; cutG = 0.99; cutB = 1.00; // Brilliant polished aluminum
            } else if (materialId === "cast_iron") {
              cutR = 0.50; cutG = 0.54; cutB = 0.60; // Fresh machined matte gray iron
            } else if (materialId === "stainless_steel") {
              cutR = 0.98; cutG = 0.99; cutB = 1.00; // Gleaming polished stainless steel
            } else {
              cutR = 0.96; cutG = 0.98; cutB = 1.00; // Shiny machined mild steel
            }
          }

          // Dynamically adjust material roughness & metalness to match selected material
          if (parts.wpSolidMesh.material) {
            if (evalStatus === "BURNT") {
              parts.wpSolidMesh.material.roughness = 0.75;
              parts.wpSolidMesh.material.metalness = 0.65;
            } else if (evalStatus === "CHATTER") {
              parts.wpSolidMesh.material.roughness = 0.62;
              parts.wpSolidMesh.material.metalness = 0.72;
            } else {
              if (materialId === "brass") {
                parts.wpSolidMesh.material.roughness = 0.18;
                parts.wpSolidMesh.material.metalness = 0.92;
              } else if (materialId === "aluminum") {
                parts.wpSolidMesh.material.roughness = 0.22;
                parts.wpSolidMesh.material.metalness = 0.85;
              } else if (materialId === "cast_iron") {
                parts.wpSolidMesh.material.roughness = 0.60;
                parts.wpSolidMesh.material.metalness = 0.50;
              } else if (materialId === "stainless_steel") {
                parts.wpSolidMesh.material.roughness = 0.14;
                parts.wpSolidMesh.material.metalness = 0.95;
              } else {
                parts.wpSolidMesh.material.roughness = 0.28;
                parts.wpSolidMesh.material.metalness = 0.88;
              }
            }
          }

          // 1. Update Top Heightfield Surface
          for (let iy = 0; iy < NY; iy++) {
            const rowOffset = iy * NX;
            for (let ix = 0; ix < NX; ix++) {
              const vIdx = rowOffset + ix;
              const depthMm = millingGrid ? millingGrid[vIdx] : 0;
              const depth3D = depthMm * depthScale;
              const cutY = Math.max(0.01, T_3D - depth3D);

              posAttr.setY(vIdx, cutY);

              if (depthMm > 0.02) {
                colAttr.setXYZ(vIdx, cutR, cutG, cutB);
              } else {
                colAttr.setXYZ(vIdx, rawR, rawG, rawB);
              }
            }
          }

          // 2. Update Left Wall (-X side: ix = 0)
          const baseLeft = uData.baseIdxLeft;
          for (let iy = 0; iy < NY; iy++) {
            const gridIdx = 0 + iy * NX;
            const depthMm = millingGrid ? millingGrid[gridIdx] : 0;
            const depth3D = depthMm * depthScale;
            const cutY = Math.max(0.01, T_3D - depth3D);
            const topIdx = baseLeft + iy * 2 + 1;
            const botIdx = baseLeft + iy * 2;
            posAttr.setY(topIdx, cutY);
            colAttr.setXYZ(botIdx, rawR * 0.95, rawG * 0.95, rawB * 0.95);
            if (depthMm > 0.02) {
              colAttr.setXYZ(topIdx, cutR, cutG, cutB);
            } else {
              colAttr.setXYZ(topIdx, rawR, rawG, rawB);
            }
          }

          // 3. Update Right Wall (+X side: ix = NX - 1)
          const baseRight = uData.baseIdxRight;
          for (let iy = 0; iy < NY; iy++) {
            const gridIdx = (NX - 1) + iy * NX;
            const depthMm = millingGrid ? millingGrid[gridIdx] : 0;
            const depth3D = depthMm * depthScale;
            const cutY = Math.max(0.01, T_3D - depth3D);
            const topIdx = baseRight + iy * 2 + 1;
            const botIdx = baseRight + iy * 2;
            posAttr.setY(topIdx, cutY);
            colAttr.setXYZ(botIdx, rawR * 0.95, rawG * 0.95, rawB * 0.95);
            if (depthMm > 0.02) {
              colAttr.setXYZ(topIdx, cutR, cutG, cutB);
            } else {
              colAttr.setXYZ(topIdx, rawR, rawG, rawB);
            }
          }

          // 4. Update Rear Wall (-Z side: iy = 0)
          const baseRear = uData.baseIdxRear;
          for (let ix = 0; ix < NX; ix++) {
            const gridIdx = ix + 0 * NX;
            const depthMm = millingGrid ? millingGrid[gridIdx] : 0;
            const depth3D = depthMm * depthScale;
            const cutY = Math.max(0.01, T_3D - depth3D);
            const topIdx = baseRear + ix * 2 + 1;
            const botIdx = baseRear + ix * 2;
            posAttr.setY(topIdx, cutY);
            colAttr.setXYZ(botIdx, rawR * 0.95, rawG * 0.95, rawB * 0.95);
            if (depthMm > 0.02) {
              colAttr.setXYZ(topIdx, cutR, cutG, cutB);
            } else {
              colAttr.setXYZ(topIdx, rawR, rawG, rawB);
            }
          }

          // 5. Update Front Wall (+Z side: iy = NY - 1)
          const baseFront = uData.baseIdxFront;
          for (let ix = 0; ix < NX; ix++) {
            const gridIdx = ix + (NY - 1) * NX;
            const depthMm = millingGrid ? millingGrid[gridIdx] : 0;
            const depth3D = depthMm * depthScale;
            const cutY = Math.max(0.01, T_3D - depth3D);
            const topIdx = baseFront + ix * 2 + 1;
            const botIdx = baseFront + ix * 2;
            posAttr.setY(topIdx, cutY);
            colAttr.setXYZ(botIdx, rawR * 0.95, rawG * 0.95, rawB * 0.95);
            if (depthMm > 0.02) {
              colAttr.setXYZ(topIdx, cutR, cutG, cutB);
            } else {
              colAttr.setXYZ(topIdx, rawR, rawG, rawB);
            }
          }

          // 6. Update Bottom Face
          const baseBottom = uData.baseIdxBottom;
          if (typeof baseBottom === "number") {
            for (let i = 0; i < 4; i++) {
              colAttr.setXYZ(baseBottom + i, rawR * 0.85, rawG * 0.85, rawB * 0.85);
            }
          }

          posAttr.needsUpdate = true;
          colAttr.needsUpdate = true;
          geo.computeVertexNormals();
        }
      }

      // 6. Spindle Height Alignment with Workpiece Top (Knee motion handles clearance & penetration)
      if (parts.spindleGroup) {
        const wpTopY = Y_base + T_3D;
        // Tool tip is at y = -0.89 relative to spindleGroup, resting at wpTopY
        parts.spindleGroup.position.y = wpTopY + 0.89;
      }
    };

    // Initialize default workpiece & vise dimensions
    parts.updateWorkpieceAndVise(100, 40, 40, 0, 0, "OPTIMAL", null, 0, "mild_steel", "#94a3b8");

    return parts;
  }

  // =========================================================================
  // LAB 1: ANATOMY 3D EXPLORER (SCREEN-ANATOMY)
  // =========================================================================
  const AnatomyLab = (function () {
    let container = null;
    let canvas = null;
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let latheModel = null;
    let millingModel = null;
    let currentModel = null;
    let activeMachineType = "lathe";
    let animId = null;
    let autoRotate = false;

    // Visual component highlight state
    let highlightedPartId = null;
    let highlightTimer = null;
    const originalEmissives = new Map();

    // Smooth camera transition state
    const camTransition = {
      active: false,
      progress: 0,
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      startLook: new THREE.Vector3(),
      targetLook: new THREE.Vector3()
    };

    // Camera preset viewpoints tailored to lathe and milling proportions
    const LATHE_PRESETS = {
      iso: { pos: [7.5, 6.0, 9.5], target: [0, 1.8, 0] },
      front: { pos: [0, 2.2, 10.5], target: [0, 2.0, 0] },
      top: { pos: [0, 13.0, 0.3], target: [0, 1.5, 0] },
      side: { pos: [11.5, 2.2, 0.3], target: [2.5, 1.8, 0] }
    };

    const MILLING_PRESETS = {
      iso: { pos: [5.2, 4.0, 6.8], target: [0, 1.4, 0.9] },
      front: { pos: [0, 1.8, 7.8], target: [0, 1.4, 0.9] },
      top: { pos: [0, 11.0, 1.0], target: [0, 1.4, 0.9] },
      side: { pos: [7.8, 1.8, 0.9], target: [0, 1.4, 0.9] }
    };

    function init(containerEl) {
      if (!containerEl) return;
      container = containerEl;
      
      // If already initialized and attached, trigger clean resize & reload machine
      if (renderer && canvas && container.contains(canvas)) {
        loadMachine(activeMachineType);
        onResize();
        return;
      }

      container.innerHTML = "";

      // Setup Three.js Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a); // Modern slate dark theme

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      // Camera with comfortable perspective
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(7.5, 6.0, 9.5);

      // WebGL Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      canvas = renderer.domElement;
      canvas.className = "w-full h-full block cursor-grab active:cursor-grabbing outline-none select-none";
      container.appendChild(canvas);

      // Create overlay toolbar
      createToolbar();

      // OrbitControls for 360-degree rotation and zoom
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 1.5;
      controls.maxDistance = 26.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.08;
      controls.target.set(0, 1.8, 0);

      // Studio Lighting for metallic surface highlights
      const ambient = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
      dirLight.position.set(10, 16, 12);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
      fillLight.position.set(-12, 7, -9);
      scene.add(fillLight);

      const spotLight = new THREE.PointLight(0xffedd5, 0.85, 14);
      spotLight.position.set(1.5, 4.0, 3.0);
      scene.add(spotLight);

      // Ground Workshop Grid Floor
      const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
      grid.position.y = -2.68;
      scene.add(grid);

      // Assemble active machine
      loadMachine(activeMachineType);

      // Render 3D Label Pins overlay
      createPinOverlay();

      // Render 3-Axis Table Jog Controller overlay for Milling
      createAxisControllerOverlay();

      // Window resize listener
      window.addEventListener("resize", onResize);

      // Animation Loop
      animate();
    }

    function loadMachine(machineType) {
      activeMachineType = machineType;
      if (!scene) return;

      // Remove any previously displayed model
      if (latheModel && latheModel.root && latheModel.root.parent === scene) {
        scene.remove(latheModel.root);
      }
      if (millingModel && millingModel.root && millingModel.root.parent === scene) {
        scene.remove(millingModel.root);
      }

      clearHighlight();

      if (machineType === "milling") {
        if (!millingModel) {
          millingModel = buildMillingModel();
        }
        scene.add(millingModel.root);
        currentModel = millingModel;

        const p = MILLING_PRESETS.iso;
        camera.position.set(...p.pos);
        controls.target.set(...p.target);
        controls.minDistance = 1.5;
        controls.maxDistance = 24.0;
      } else {
        if (!latheModel) {
          latheModel = buildLatheModel();
        }
        scene.add(latheModel.root);
        currentModel = latheModel;

        const p = LATHE_PRESETS.iso;
        camera.position.set(...p.pos);
        controls.target.set(...p.target);
        controls.minDistance = 2.5;
        controls.maxDistance = 26.0;
      }

      controls.update();
      updatePins();

      // Toggle 3-Axis milling table jog controller overlay
      const axisOverlay = document.getElementById("anatomy-milling-axes");
      if (axisOverlay) {
        if (machineType === "milling") {
          axisOverlay.classList.remove("hidden");
        } else {
          axisOverlay.classList.add("hidden");
        }
      }
    }

    function setMachine(machineType) {
      if (machineType !== "lathe" && machineType !== "milling") machineType = "lathe";
      if (activeMachineType === machineType && currentModel) return;
      activeMachineType = machineType;
      if (scene) {
        loadMachine(machineType);
      }
    }

    function createToolbar() {
      const bar = document.createElement("div");
      bar.className = "absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl text-xs select-none";
      bar.innerHTML = `
        <button id="btn-3d-iso" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-sm">
          3D Isometrik
        </button>
        <button id="btn-3d-front" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all">
          Depan
        </button>
        <button id="btn-3d-top" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all">
          Atas
        </button>
        <button id="btn-3d-side" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all">
          Samping
        </button>
        <button id="btn-3d-reset" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all">
          Reset
        </button>
        <div class="h-4 w-px bg-slate-700 mx-0.5"></div>
        <button id="btn-3d-autorotate" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          <span id="txt-3d-autorotate">Putar 360°</span>
        </button>
      `;
      container.appendChild(bar);

      // Event handlers
      bar.querySelector("#btn-3d-iso").onclick = () => setPreset("iso");
      bar.querySelector("#btn-3d-front").onclick = () => setPreset("front");
      bar.querySelector("#btn-3d-top").onclick = () => setPreset("top");
      bar.querySelector("#btn-3d-side").onclick = () => setPreset("side");
      bar.querySelector("#btn-3d-reset").onclick = () => setPreset("iso");

      const btnAuto = bar.querySelector("#btn-3d-autorotate");
      const txtAuto = bar.querySelector("#txt-3d-autorotate");
      btnAuto.onclick = () => {
        autoRotate = !autoRotate;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 2.0;
        btnAuto.className = autoRotate
          ? "px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium flex items-center gap-1.5 transition-all shadow-sm"
          : "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-all";
        txtAuto.textContent = autoRotate ? "Berputar..." : "Putar 360°";
      };
    }

    function createPinOverlay() {
      const pinContainer = document.createElement("div");
      pinContainer.id = "anatomy-3d-pins";
      pinContainer.className = "absolute inset-0 pointer-events-none overflow-hidden z-10";
      container.appendChild(pinContainer);
      updatePins();
    }

    function createAxisControllerOverlay() {
      const existing = document.getElementById("anatomy-milling-axes");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "anatomy-milling-axes";
      overlay.className = "absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/70 shadow-2xl text-xs select-none max-w-[95%]";
      overlay.innerHTML = `
        <div class="flex items-center gap-1.5 text-slate-300 font-bold px-1 text-[11px]">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sumbu Meja:</span>
        </div>
        <!-- Sumbu X -->
        <div class="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60" title="Sumbu X: Gerak Memanjang Meja (Kiri / Kanan)">
          <span class="font-bold text-blue-400 font-mono">X:</span>
          <button id="btn-anat-x-min" class="px-2 py-0.5 rounded-lg bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-mono font-bold shadow-xs">◀ X-</button>
          <button id="btn-anat-x-pls" class="px-2 py-0.5 rounded-lg bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-mono font-bold shadow-xs">X+ ▶</button>
          <span id="txt-anat-x" class="font-mono text-emerald-400 font-bold min-w-[38px] text-right text-[11px]">0.0</span>
        </div>
        <!-- Sumbu Y -->
        <div class="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60" title="Sumbu Y: Gerak Melintang Sadel (Maju / Mundur)">
          <span class="font-bold text-cyan-400 font-mono">Y:</span>
          <button id="btn-anat-y-min" class="px-2 py-0.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 active:scale-95 text-white font-mono font-bold shadow-xs">▼ Y-</button>
          <button id="btn-anat-y-pls" class="px-2 py-0.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 active:scale-95 text-white font-mono font-bold shadow-xs">Y+ ▲</button>
          <span id="txt-anat-y" class="font-mono text-emerald-400 font-bold min-w-[38px] text-right text-[11px]">0.0</span>
        </div>
        <!-- Sumbu Z -->
        <div class="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60" title="Sumbu Z: Gerak Vertikal Lutut (Turun / Naik)">
          <span class="font-bold text-amber-400 font-mono">Z:</span>
          <button id="btn-anat-z-min" class="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono font-bold shadow-xs">⬇ Z-</button>
          <button id="btn-anat-z-pls" class="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono font-bold shadow-xs">Z+ ⬆</button>
          <span id="txt-anat-z" class="font-mono text-emerald-400 font-bold min-w-[38px] text-right text-[11px]">0.0</span>
        </div>
        <!-- Reset -->
        <button id="btn-anat-reset-axes" class="px-2 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-medium text-[11px] transition-all" title="Kembalikan meja ke posisi tengah">
          Reset
        </button>
      `;
      container.appendChild(overlay);

      let curX = 0;
      let curY = 0;
      let curZ = 0;

      function updateReadout() {
        const tx = overlay.querySelector("#txt-anat-x");
        const ty = overlay.querySelector("#txt-anat-y");
        const tz = overlay.querySelector("#txt-anat-z");
        if (tx) tx.textContent = (curX * 25.0).toFixed(1);
        if (ty) ty.textContent = (curY * 30.0).toFixed(1);
        if (tz) tz.textContent = (curZ * 20.0).toFixed(1);
      }

      function bindHold(btnId, fn) {
        const btn = overlay.querySelector(btnId);
        if (!btn) return;
        let timer = null, interval = null;
        const doStep = (e) => {
          e.preventDefault();
          fn();
          if (millingModel && millingModel.setAxes) {
            millingModel.setAxes(curX, curY, curZ);
          }
          updateReadout();
          if (timer) clearTimeout(timer);
          if (interval) clearInterval(interval);
          timer = setTimeout(() => {
            interval = setInterval(() => {
              fn();
              if (millingModel && millingModel.setAxes) {
                millingModel.setAxes(curX, curY, curZ);
              }
              updateReadout();
            }, 80);
          }, 300);
        };
        const stop = () => {
          if (timer) { clearTimeout(timer); timer = null; }
          if (interval) { clearInterval(interval); interval = null; }
        };
        btn.onmousedown = doStep;
        btn.onmouseup = stop;
        btn.onmouseleave = stop;
        btn.ontouchstart = doStep;
        btn.ontouchend = stop;
      }

      bindHold("#btn-anat-x-min", () => { curX = Math.max(-1.8, curX - 0.08); });
      bindHold("#btn-anat-x-pls", () => { curX = Math.min(1.8, curX + 0.08); });
      bindHold("#btn-anat-y-min", () => { curY = Math.max(-0.6, curY - 0.05); });
      bindHold("#btn-anat-y-pls", () => { curY = Math.min(0.6, curY + 0.05); });
      bindHold("#btn-anat-z-min", () => { curZ = Math.max(-0.4, curZ - 0.04); });
      bindHold("#btn-anat-z-pls", () => { curZ = Math.min(0.4, curZ + 0.04); });

      overlay.querySelector("#btn-anat-reset-axes").onclick = () => {
        curX = 0; curY = 0; curZ = 0;
        if (millingModel && millingModel.setAxes) {
          millingModel.setAxes(0, 0, 0);
        }
        updateReadout();
      };

      if (activeMachineType !== "milling") {
        overlay.classList.add("hidden");
      }
    }

    function updatePins() {
      const pinContainer = document.getElementById("anatomy-3d-pins");
      if (!pinContainer || !camera || !currentModel) return;

      pinContainer.innerHTML = "";
      if (typeof AppData === "undefined") return;

      const parts = activeMachineType === "milling" ? AppData.millingParts : AppData.latheParts;
      if (!parts) return;

      const hw = container.clientWidth / 2;
      const hh = container.clientHeight / 2;
      if (hw <= 0 || hh <= 0) return;

      parts.forEach((part, idx) => {
        let v;
        const meshes = currentModel.partMeshes ? currentModel.partMeshes[part.id] : null;
        if (meshes && meshes[0]) {
          v = new THREE.Vector3();
          meshes[0].getWorldPosition(v);
        } else if (currentModel.anchors && currentModel.anchors[part.id]) {
          v = currentModel.anchors[part.id].clone();
        } else {
          return;
        }

        // Project 3D vector to screen 2D space
        v.y += (activeMachineType === "milling" && (part.id === "motor" || part.id === "panel_kontrol")) ? 0.35 : 0.65;

        v.project(camera);

        // Check if point is in front of camera
        if (v.z > 1.0) return;

        const x = v.x * hw + hw;
        const y = -(v.y * hh) + hh;

        const pin = document.createElement("button");
        pin.className = "absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center border-2 border-white/90 hover:scale-125 transition-all duration-150 cursor-pointer active:scale-95";
        pin.style.left = `${x}px`;
        pin.style.top = `${y}px`;
        pin.title = `${idx + 1}. ${part.name}`;
        pin.innerHTML = `<span>${idx + 1}</span>`;

        pin.onclick = (e) => {
          e.stopPropagation();
          focusOnPart(part.id);
          if (typeof App !== "undefined" && App.showPartModal) {
            App.showPartModal(part);
          }
        };

        pinContainer.appendChild(pin);
      });
    }

    function setPreset(presetKey) {
      const presets = activeMachineType === "milling" ? MILLING_PRESETS : LATHE_PRESETS;
      const p = presets[presetKey] || presets.iso;
      if (!p) return;
      flyTo(new THREE.Vector3(...p.pos), new THREE.Vector3(...p.target));
    }

    /**
     * Zooms the camera smoothly onto a specific machine component
     * and triggers a visual emissive highlight
     */
    function focusOnPart(partId) {
      if (!currentModel) return;
      let target;
      const meshes = currentModel.partMeshes ? currentModel.partMeshes[partId] : null;
      if (meshes && meshes[0]) {
        target = new THREE.Vector3();
        meshes[0].getWorldPosition(target);
      } else if (currentModel.anchors && currentModel.anchors[partId]) {
        target = currentModel.anchors[partId].clone();
      }
      if (!target) return;

      let offset = new THREE.Vector3(2.5, 1.8, 3.2);

      if (activeMachineType === "milling") {
        if (partId === "base") offset.set(2.4, 1.4, 3.0);
        else if (partId === "column") offset.set(3.2, 1.8, 3.4);
        else if (partId === "knee") offset.set(1.9, 1.2, 2.4);
        else if (partId === "handwheel_z") offset.set(1.2, 0.8, 1.5);
        else if (partId === "saddle") offset.set(1.8, 1.2, 2.2);
        else if (partId === "handwheel_y") offset.set(1.2, 0.8, 1.5);
        else if (partId === "table") offset.set(2.5, 1.5, 2.5);
        else if (partId === "handwheel_x") offset.set(1.4, 0.9, 1.6);
        else if (partId === "ragum") offset.set(1.2, 0.9, 1.5);
        else if (partId === "ram_head") offset.set(2.2, 1.4, 2.4);
        else if (partId === "motor") offset.set(2.0, 1.4, 2.2);
        else if (partId === "spindle_milling") offset.set(1.1, 0.8, 1.3);
        else if (partId === "panel_kontrol") offset.set(1.3, 0.9, 1.5);
      } else {
        if (partId === "chuck") offset.set(1.8, 1.4, 2.5);
        else if (partId === "toolpost") offset.set(1.2, 0.9, 1.6);
        else if (partId === "tailstock") offset.set(2.4, 1.6, 2.8);
        else if (partId === "headstock") offset.set(3.2, 2.4, 3.8);
        else if (partId === "emergency_stop") offset.set(1.2, 0.9, 1.8);
        else if (partId === "lead_screw") offset.set(1.4, 1.0, 2.2);
        else if (partId === "bed") offset.set(2.5, 2.0, 3.5);
        else if (partId === "cross_slide") offset.set(1.5, 1.2, 2.0);
        else if (partId === "carriage") offset.set(1.8, 1.4, 2.4);
      }

      const newPos = target.clone().add(offset);
      flyTo(newPos, target.clone());

      // Trigger visual highlight on the meshes
      highlightPart(partId);
    }

    function highlightPart(partId) {
      if (!currentModel || !currentModel.partMeshes) return;

      // Clear previous highlight
      clearHighlight();

      const meshes = currentModel.partMeshes[partId];
      if (!meshes || meshes.length === 0) return;

      highlightedPartId = partId;
      meshes.forEach((mesh) => {
        if (mesh.material && mesh.material.emissive) {
          if (!originalEmissives.has(mesh)) {
            originalEmissives.set(mesh, mesh.material.emissive.getHex());
          }
          mesh.material.emissive.setHex(PALETTE.highlight);
        }
      });

      // Gradually clear highlight after 2.5 seconds
      highlightTimer = setTimeout(() => {
        clearHighlight();
      }, 2500);
    }

    function clearHighlight() {
      if (highlightTimer) clearTimeout(highlightTimer);
      originalEmissives.forEach((origHex, mesh) => {
        if (mesh.material && mesh.material.emissive) {
          mesh.material.emissive.setHex(origHex);
        }
      });
      originalEmissives.clear();
      highlightedPartId = null;
    }

    function flyTo(targetCamPos, targetLookAt) {
      camTransition.active = true;
      camTransition.progress = 0;
      camTransition.startPos.copy(camera.position);
      camTransition.targetPos.copy(targetCamPos);
      camTransition.startLook.copy(controls.target);
      camTransition.targetLook.copy(targetLookAt);
    }

    function onResize() {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    function animate() {
      animId = requestAnimationFrame(animate);

      // Subtle spindle rotation if milling
      if (activeMachineType === "milling" && millingModel && millingModel.spindleGroup) {
        millingModel.spindleGroup.rotation.y += 0.02;
      }

      // Smooth camera interpolation (Cubic Ease-Out)
      if (camTransition.active) {
        camTransition.progress += 0.04;
        if (camTransition.progress >= 1.0) {
          camTransition.progress = 1.0;
          camTransition.active = false;
        }

        const t = 1 - Math.pow(1 - camTransition.progress, 3);
        camera.position.lerpVectors(camTransition.startPos, camTransition.targetPos, t);
        controls.target.lerpVectors(camTransition.startLook, camTransition.targetLook, t);
      }

      controls.update();
      renderer.render(scene, camera);
      updatePins();
    }

    function destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      clearHighlight();
      if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    return {
      init,
      setMachine,
      focusOnPart,
      setPreset,
      onResize,
      destroy
    };
  })();

  // =========================================================================
  // LAB 2: 3D TURNING SIMULATION LAB (SCREEN-SIMULATION)
  // =========================================================================
  const Sim3DLab = (function () {
    let container = null;
    let canvas = null;
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let latheModel = null;
    let millingModel = null;
    let cutSpot = null;
    let animId = null;
    let autoRotate = false;

    // Simulation Live State
    let chips = [];
    let chipMat = null;

    function init(containerEl) {
      if (!containerEl) return;
      container = containerEl;

      // If already initialized and attached, trigger clean resize
      if (renderer && canvas && container.contains(canvas)) {
        onResize();
        return;
      }

      container.innerHTML = "";

      // Setup 3D Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0f1d); // Dark workshop ambient

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      // Camera positioned with clear view of the entire turning process
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(3.0, 3.4, 5.0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      canvas = renderer.domElement;
      canvas.className = "w-full h-full block cursor-grab active:cursor-grabbing outline-none select-none";
      container.appendChild(canvas);

      // OrbitControls for 360-degree rotation and zoom
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 1.5;
      controls.maxDistance = 20.0;
      controls.maxPolarAngle = Math.PI / 2 + 0.08;
      controls.target.set(0.5, 2.1, 0.3); // Frame tool-workpiece interface

      // Studio Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.72);
      scene.add(ambient);

      const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
      mainLight.position.set(7, 12, 9);
      scene.add(mainLight);

      // Focused spot light illuminating the cutting point
      cutSpot = new THREE.PointLight(0xffedd5, 1.4, 10);
      cutSpot.position.set(1.0, 3.2, 2.0);
      scene.add(cutSpot);

      // Floor grid
      const grid = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
      grid.position.y = -2.68;
      scene.add(grid);

      // Lathe model assembly
      latheModel = buildLatheModel();
      latheModel.cutSpot = cutSpot;
      scene.add(latheModel.root);

      // Milling model assembly
      millingModel = buildMillingModel();
      millingModel.root.visible = false;
      scene.add(millingModel.root);

      // Build metal chips particle pool
      initChipParticles();

      // UI Viewport Controls Overlay
      createSimOverlay();

      window.addEventListener("resize", onResize);
      animate();
    }

    function createSimOverlay() {
      const overlay = document.createElement("div");
      overlay.className = "absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-lg text-[11px] select-none";
      overlay.innerHTML = `
        <button id="btn-sim3d-focus" class="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-xs flex items-center gap-1" title="Fokuskan sudut pandang ke titik penyayatan aktif">
          <span>🔍 Fokus</span>
        </button>
        <button id="btn-sim3d-front" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all" title="Pandangan Depan (Front View)">
          Depan
        </button>
        <button id="btn-sim3d-iso" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all" title="Pandangan Isometrik (Isometric View)">
          Isometrik
        </button>
        <button id="btn-sim3d-autorotate" class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition-all" title="Putar Otomatis 360 Derajat">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          <span id="txt-sim3d-autorotate">360°</span>
        </button>
      `;
      container.appendChild(overlay);

      overlay.querySelector("#btn-sim3d-focus").onclick = () => {
        if (millingModel && millingModel.root.visible) {
          const curX = millingModel.tableGroup ? millingModel.tableGroup.position.x : 0;
          const curY = millingModel.saddleGroup ? millingModel.saddleGroup.position.z : 0;
          const curZ = millingModel.kneeGroup ? millingModel.kneeGroup.position.y : 0;
          camera.position.set(curX + 1.4, 2.45 + curZ, 2.3 + curY);
          controls.target.set(curX, 1.85 + curZ, 1.10 + curY);
        } else {
          const curX = latheModel ? latheModel.carriageGroup.position.x : 1.0;
          camera.position.set(curX + 0.8, 2.6, 2.2);
          controls.target.set(curX, 2.2, 0.36);
        }
      };
      overlay.querySelector("#btn-sim3d-front").onclick = () => {
        if (millingModel && millingModel.root.visible) {
          camera.position.set(0, 1.8, 7.5);
          controls.target.set(0, 1.4, 0.9);
        } else {
          camera.position.set(0, 2.2, 8.5);
          controls.target.set(0, 2.1, 0);
        }
      };
      overlay.querySelector("#btn-sim3d-iso").onclick = () => {
        if (millingModel && millingModel.root.visible) {
          camera.position.set(4.5, 3.5, 5.8);
          controls.target.set(0, 1.4, 0.9);
        } else {
          camera.position.set(5.5, 4.5, 6.5);
          controls.target.set(0.5, 1.8, 0);
        }
      };

      const btnAuto = overlay.querySelector("#btn-sim3d-autorotate");
      const txtAuto = overlay.querySelector("#txt-sim3d-autorotate");
      btnAuto.onclick = () => {
        autoRotate = !autoRotate;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.8;
        btnAuto.className = autoRotate
          ? "px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium flex items-center gap-1.5 transition-all shadow-sm"
          : "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition-all";
        txtAuto.textContent = autoRotate ? "Berputar..." : "Putar 360°";
      };
    }

    function initChipParticles() {
      chips = [];
      chipMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1, // Realistic machined steel silver chips
        roughness: 0.35,
        metalness: 0.85
      });
      for (let i = 0; i < 40; i++) {
        const geo = new THREE.BoxGeometry(0.02, 0.02, 0.05);
        const mesh = new THREE.Mesh(geo, chipMat);
        mesh.visible = false;
        scene.add(mesh);
        chips.push({
          mesh: mesh,
          vx: 0,
          vy: 0,
          vz: 0,
          rotX: 0,
          rotY: 0,
          life: 0
        });
      }
    }

    function updateChipPhysics() {
      chips.forEach((c) => {
        if (c.life > 0) {
          c.mesh.position.x += c.vx;
          c.mesh.position.y += c.vy;
          c.mesh.position.z += c.vz;
          c.vy -= 0.005; // Gravity
          c.mesh.rotation.x += c.rotX;
          c.mesh.rotation.y += c.rotY;
          c.life -= 0.025;
          if (c.life <= 0 || c.mesh.position.y < -2.5) {
            c.life = 0;
            c.mesh.visible = false;
          }
        }
      });
    }

    function emitChip(pos, customColorHex) {
      const chip = chips.find((c) => c.life <= 0);
      if (!chip) return;

      if (typeof customColorHex === "number" && chipMat) {
        chipMat.color.setHex(customColorHex);
      }

      chip.mesh.position.copy(pos);
      chip.mesh.position.x += (Math.random() - 0.5) * 0.08;
      chip.mesh.position.y += 0.04;
      chip.mesh.position.z += 0.04;

      // Fly upward and toward the chip tray
      chip.vx = (Math.random() * 0.06 + 0.02) * (Math.random() > 0.5 ? 1 : -1);
      chip.vy = Math.random() * 0.1 + 0.06;
      chip.vz = Math.random() * 0.12 + 0.04;

      chip.rotX = Math.random() * 0.3;
      chip.rotY = Math.random() * 0.3;
      chip.life = 1.0;
      chip.mesh.visible = true;
    }

    let lastSimMachineType = null;
    function updateSimulationFrame(simState) {
      if (!simState) return;

      const isMilling = simState.machineType === "milling";

      if (lastSimMachineType !== simState.machineType) {
        lastSimMachineType = simState.machineType;
        if (isMilling) {
          camera.position.set(4.5, 3.5, 5.8);
          controls.target.set(0, 1.85, 1.10);
        } else {
          camera.position.set(3.0, 3.4, 5.0);
          controls.target.set(0.5, 2.1, 0.3);
        }
        controls.update();
      }

      if (isMilling) {
        if (latheModel) latheModel.root.visible = false;
        if (millingModel) {
          millingModel.root.visible = true;
          const rpm = simState.rpm || 600;
          const spinSpeed = (rpm / 60) * 0.22;

          if (simState.isRunning && millingModel.spindleGroup) {
            millingModel.spindleGroup.rotation.y += spinSpeed;
          }

          // Full 3-Axis Table, Saddle, and Knee Kinematics
          // Synchronized 1-to-1 with cutting position (u, v) and stationary cutter at (X=0, Z=1.10)
          const P = simState.workpieceP || 100;
          const L = simState.workpieceL || 40;
          const P_3D = (P / 100.0) * 1.35;
          const L_3D = (L / 40.0) * 0.46;

          let u = 0.5;
          if (typeof simState.axisX === "number") {
            u = 0.5 + (simState.axisX / P);
          } else if (typeof simState.cutProgress === "number") {
            u = simState.cutProgress;
          }

          let v = 0.5;
          if (typeof simState.axisY === "number") {
            v = 0.5 + (simState.axisY / L);
          }

          // Exact mathematical lock:
          // Table moves along X such that workpiece point u is directly at world X = 0
          const axX = (0.5 - u) * P_3D;

          // Saddle moves along Z such that workpiece point v is directly at world Z = 1.10
          const axY = 1.10 - (0.87 + L_3D / 2) - (v - 0.5) * L_3D;

          let axZ = 0;
          if (typeof simState.axisZ === "number") {
            axZ = (simState.axisZ / 20.0) * 0.4;
          }

          // Move the physical 3D hierarchy (table, saddle, knee) and handwheels
          if (typeof millingModel.setAxes === "function") {
            millingModel.setAxes(axX, axY, axZ);
          } else {
            if (millingModel.tableGroup) millingModel.tableGroup.position.x = axX;
            if (millingModel.saddleGroup) millingModel.saddleGroup.position.z = axY;
            if (millingModel.kneeGroup) millingModel.kneeGroup.position.y = axZ;
          }

          // Dynamic cutter scaling based on selected Endmill diameter (8, 10, 12, 16, 20 mm)
          if (typeof millingModel.setEndmillDiameter === "function") {
            millingModel.setEndmillDiameter(simState.endmillDia || 12);
          }

          // Dynamic workpiece dimensions (P, L, T), adaptive vise clamping, and material removal cut
          const evalStatus = simState.evaluation ? simState.evaluation.status : "OPTIMAL";
          const matColorHex = (typeof AppData !== "undefined" && AppData.materials)
            ? (AppData.materials.find((m) => m.id === simState.materialId)?.colorHex || "#94a3b8")
            : "#94a3b8";

          if (typeof millingModel.updateWorkpieceAndVise === "function") {
            millingModel.updateWorkpieceAndVise(
              simState.workpieceP || 100,
              simState.workpieceL || 40,
              simState.workpieceT || 40,
              simState.cutProgress || 0,
              simState.depthOfCut || 0,
              evalStatus,
              simState.millingGrid,
              simState.millingGridVersion,
              simState.materialId,
              matColorHex
            );
          }

          if (cutSpot) {
            cutSpot.position.set(0, 2.5 + axZ, 1.10);
          }

          // Chips only emit when cutter physically touches and penetrates the workpiece
          const rMm = (simState.endmillDia || 12) / 2;
          const halfP = P / 2;
          const halfL = L / 2;
          const curX = typeof simState.axisX === "number" ? simState.axisX : 0;
          const curY = typeof simState.axisY === "number" ? simState.axisY : 0;
          const curZ = typeof simState.axisZ === "number" ? simState.axisZ : 0;
          const activeDepth = simState.isAutoFeed ? (simState.depthOfCut || (curZ > 0 ? curZ : 0)) : (curZ > 0 ? curZ : 0);

          const overlapsX = (curX + rMm > -halfP) && (curX - rMm < halfP);
          const overlapsY = (curY + rMm > -halfL) && (curY - rMm < halfL);
          const isTouchingWorkpiece = overlapsX && overlapsY && (activeDepth > 0);

          const isActivelyCutting = simState.isRunning && isTouchingWorkpiece &&
                                    ((simState.isAutoFeed && simState.cutProgress < 1.0) ||
                                     (simState.lastJogCutting && (Date.now() - simState.lastJogCutting < 350)));
          if (isActivelyCutting) {
            const chipColorHex = (evalStatus === "BURNT")
              ? 0x312e81
              : (simState.materialId === "brass"
                ? 0xfacc15
                : (simState.materialId === "cast_iron"
                  ? 0x475569
                  : (simState.materialId === "stainless_steel" ? 0xf8fafc : 0xcbd5e1)));
            emitChip(new THREE.Vector3((Math.random() - 0.5) * 0.08, 1.87 + axZ, 1.10 + (Math.random() - 0.5) * 0.08), chipColorHex);
          }
        }
        return;
      }

      // Lathe operation mode
      if (millingModel) millingModel.root.visible = false;
      if (!latheModel) return;
      latheModel.root.visible = true;

      // 1. Spindle rotation speed (proportional to user RPM slider)
      const rpm = simState.rpm || 160;
      const spinSpeed = (rpm / 60) * 0.18;

      if (simState.isRunning) {
        latheModel.chuckGroup.rotation.x += spinSpeed;
      }

      // 3. Tool and Carriage Feed Motion
      // Pahat Rata Kanan feeds from Right (Tailstock side) to Left (Chuck side)
      // Workpiece right tip is at world X = 2.95, chuck face is at world X = -4.65
      // Tool tip is offset by X = -0.28 relative to carriageGroup
      // Synchronized carriage travel span: startX = 3.23 (tool at X = 2.95), endX = -4.37 (tool at X = -4.65)
      const startX = 3.23;
      const endX = -4.37;
      const curX = startX - (startX - endX) * simState.cutProgress;
      latheModel.carriageGroup.position.x = curX;

      // Cross-slide depth of cut offset:
      // Calibrated so tool tip precisely touches the cut radius at any diameter & depth
      const baseRadius = 0.36;
      const scaleRadial = baseRadius / 25.0;
      const rawRadiusMm = (simState.diameter || 50) / 2;
      const activeCutRadiusMm = Math.max(2.0, rawRadiusMm - (simState.depthOfCut || 0));
      latheModel.crossSlideGroup.position.z = 0.84 + (activeCutRadiusMm * scaleRadial);

      // Dynamic moving spotlight following cutting zone:
      if (latheModel.cutSpot) {
        latheModel.cutSpot.position.x = curX - 0.28;
      }

      // 4. Dynamic Workpiece Cutting (True Turned Contour Modeling)
      if (latheModel.contourWorkpiece && simState.contour) {
        const matColorHex = (typeof AppData !== "undefined" && AppData.materials)
          ? (AppData.materials.find((m) => m.id === simState.materialId)?.colorHex || "#64748b")
          : "#64748b";
        const evalStatus = simState.evaluation ? simState.evaluation.status : "OPTIMAL";

        updateContourMesh(
          latheModel.contourWorkpiece,
          simState.contour,
          simState.diameter || 50,
          evalStatus,
          matColorHex,
          simState.materialId
        );

        // Tool tip visual thermal effects
        if (evalStatus === "BURNT" && simState.isRunning) {
          latheModel.toolTip.material.color.setHex(0xef4444);
          if (latheModel.toolTip.material.emissive) latheModel.toolTip.material.emissive.setHex(0xb91c1c);
        } else {
          latheModel.toolTip.material.color.setHex(PALETTE.carbideGold);
          if (latheModel.toolTip.material.emissive) latheModel.toolTip.material.emissive.setHex(0x000000);
        }
      }

      // 5. Coolant Stream Toggle
      if (latheModel.coolantStream) {
        latheModel.coolantStream.visible = !!simState.coolant && simState.isRunning;
      }

      // 6. Flying Metal Chips Emitter (Auto Feed or active manual jog cutting)
      const isActivelyCutting = (simState.isAutoFeed && simState.cutProgress < 0.98) ||
                                (simState.lastJogCutting && (Date.now() - simState.lastJogCutting < 350));
      if (simState.isRunning && isActivelyCutting && (simState.depthOfCut > 0)) {
        const toolWorldPos = new THREE.Vector3();
        latheModel.toolTip.getWorldPosition(toolWorldPos);
        const latheChipColor = (evalStatus === "BURNT")
          ? 0x312e81
          : (simState.materialId === "brass"
            ? 0xfacc15
            : (simState.materialId === "cast_iron"
              ? 0x475569
              : (simState.materialId === "stainless_steel" ? 0xf8fafc : 0xcbd5e1)));
        emitChip(toolWorldPos, latheChipColor);
      }
    }

    function onResize() {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    function animate() {
      animId = requestAnimationFrame(animate);

      // Query current SimEngine status and sync 3D model
      if (typeof SimEngine !== "undefined" && SimEngine.getState) {
        updateSimulationFrame(SimEngine.getState());
      }

      // Continuous chip physics animation across all machine modes (lathe & milling)
      updateChipPhysics();

      controls.update();
      renderer.render(scene, camera);
    }

    function destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    return {
      init,
      onResize,
      destroy
    };
  })();

  return {
    AnatomyLab,
    Sim3DLab,
    buildLatheModel,
    buildMillingModel
  };
})();
