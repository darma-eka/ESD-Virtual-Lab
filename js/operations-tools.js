/**
 * operations-tools.js - Katalog Visual Pahat, Alat Bantu & Alat Ukur Mesin Bubut & Frais
 * Menghasilkan kartu visual interaktif dengan diagram teknis vektor SVG presisi tinggi
 * untuk setiap proses pemesinan di Studio Operasi (ditempatkan di bawah Parameter Standar Rekomendasi).
 */

const OperationsTools = (function () {
  "use strict";

  // =========================================================================
  // 1. GENERATOR DIAGRAM TEKNIS VEKTOR SVG (PRECISE VECTOR ILLUSTRATIONS)
  // =========================================================================

  function createSvgContainer(content, viewBox = "0 0 240 115") {
    return `
      <svg viewBox="${viewBox}" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Industrial Linear Gradients -->
          <linearGradient id="g-steel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#475569" />
            <stop offset="45%" stop-color="#94a3b8" />
            <stop offset="55%" stop-color="#cbd5e1" />
            <stop offset="100%" stop-color="#334155" />
          </linearGradient>
          <linearGradient id="g-steel-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="50%" stop-color="#334155" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="g-carbide-tin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="40%" stop-color="#f59e0b" />
            <stop offset="85%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="g-brass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#eab308" />
            <stop offset="100%" stop-color="#a16207" />
          </linearGradient>
          <linearGradient id="g-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="30%" stop-color="#e2e8f0" />
            <stop offset="70%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <linearGradient id="g-chrome-bright" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="25%" stop-color="#e2e8f0" />
            <stop offset="60%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#475569" />
          </linearGradient>
          <linearGradient id="g-workpiece-raw" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="35%" stop-color="#64748b" />
            <stop offset="65%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="g-workpiece-turned" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#64748b" />
            <stop offset="20%" stop-color="#f8fafc" />
            <stop offset="50%" stop-color="#e2e8f0" />
            <stop offset="85%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#475569" />
          </linearGradient>
          <linearGradient id="g-rake-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="60%" stop-color="#059669" />
            <stop offset="100%" stop-color="#064e3b" />
          </linearGradient>
          <linearGradient id="g-relief-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="60%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#78350f" />
          </linearGradient>
          <linearGradient id="g-relief-orange" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fb923c" />
            <stop offset="60%" stop-color="#ea580c" />
            <stop offset="100%" stop-color="#7c2d12" />
          </linearGradient>
          <linearGradient id="g-chip-brass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#b45309" />
          </linearGradient>
          <linearGradient id="g-workpiece" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="35%" stop-color="#64748b" />
            <stop offset="65%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          <linearGradient id="g-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0b1329" />
            <stop offset="100%" stop-color="#030712" />
          </linearGradient>
        </defs>

        <!-- Technical Background Grid -->
        <rect width="100%" height="100%" fill="url(#g-bg)" rx="8" />
        <g stroke="rgba(56, 189, 248, 0.08)" stroke-width="0.8">
          <line x1="20" y1="0" x2="20" y2="115" />
          <line x1="60" y1="0" x2="60" y2="115" />
          <line x1="100" y1="0" x2="100" y2="115" />
          <line x1="140" y1="0" x2="140" y2="115" />
          <line x1="180" y1="0" x2="180" y2="115" />
          <line x1="220" y1="0" x2="220" y2="115" />
          <line x1="0" y1="25" x2="240" y2="25" />
          <line x1="0" y1="57" x2="240" y2="57" />
          <line x1="0" y1="90" x2="240" y2="90" />
        </g>

        <!-- Illustration Content -->
        ${content}
      </svg>
    `;
  }

  // =========================================================================
  // MULTI-VIEW GENERATORS: PAHAT BUBUT HSS RATA KANAN (DIN 4971 / ISO 1)
  // 1. Proyeksi 2D Standar Kurikulum SMK (Pandangan Atas 80°, Depan, & Samping)
  // 2. Foto Fisik Nyata Pahat HSS Rata Kanan (Slot Dokumentasi Foto Asli)
  // =========================================================================

  const PAHAT_HSS_MULTI_VIEWS = {
    // 1. PROYEKSI 2D STANDAR (TOP VIEW 80°, PANDANGAN DEPAN & SAMPING)
    "2d": () => `
      <svg viewBox="0 0 400 200" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g-steel-2d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#475569" /><stop offset="50%" stop-color="#94a3b8" /><stop offset="100%" stop-color="#334155" />
          </linearGradient>
          <linearGradient id="g-chrome-2d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc" /><stop offset="50%" stop-color="#cbd5e1" /><stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <linearGradient id="g-bg-2d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0b1329" /><stop offset="100%" stop-color="#030712" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#g-bg-2d)" rx="8" />
        
        <!-- Garis Pemisah Proyeksi Ortogonal -->
        <g stroke="rgba(56, 189, 248, 0.08)" stroke-width="0.8">
          <line x1="200" y1="0" x2="200" y2="200" stroke="#334155" stroke-dasharray="4 3" stroke-width="1" />
          <line x1="0" y1="105" x2="400" y2="105" stroke="rgba(56, 189, 248, 0.06)" stroke-width="0.8" />
        </g>

        <!-- ============================================================== -->
        <!-- 1. PANDANGAN ATAS (TOP VIEW) - SUDUT 80Â° & SISI SAMPING 12Â°-15Â° -->
        <!-- ============================================================== -->
        <g id="view-2d-top">
          <text x="100" y="18" fill="#38bdf8" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">1. PANDANGAN ATAS (TOP VIEW)</text>
          
          <!-- Batang Pahat Persegi 12x12 mm -->
          <rect x="25" y="32" width="90" height="42" fill="url(#g-steel-2d)" stroke="#64748b" stroke-width="1.2" />
          <text x="65" y="56" fill="#0f172a" font-size="6.5" font-family="monospace" font-weight="bold">BATANG 12x12</text>

          <!-- Kepala Asahan (Mata Potong Sisi 12Â°-15Â° & Sudut Puncak Baji 80Â°) -->
          <polygon points="115,32 165,46 142,74 115,74" fill="url(#g-chrome-2d)" stroke="#38bdf8" stroke-width="1.2" />
          <line x1="115" y1="32" x2="165" y2="46" stroke="#38bdf8" stroke-width="2.5" />
          <circle cx="165" cy="46" r="3" fill="#f8fafc" stroke="#0284c7" stroke-width="1.2" />

          <!-- Anotasi Sudut Potong Sisi Samping 12Â° - 15Â° -->
          <line x1="115" y1="32" x2="175" y2="32" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="2 2" />
          <path d="M 148 32 A 25 25 0 0 1 154 43" stroke="#facc15" stroke-width="1.2" fill="none" />
          <text x="162" y="36" fill="#facc15" font-size="7.5" font-family="sans-serif" font-weight="bold">12Â°-15Â°</text>

          <!-- Anotasi Sudut 80Â° (Sudut Ujung / Baji Pahat Îµ_r = 80Â°) -->
          <path d="M 156 49 A 12 12 0 0 1 150 63" stroke="#38bdf8" stroke-width="1.5" fill="none" />
          <polyline points="152,56 140,68 120,68" stroke="#38bdf8" stroke-width="1" fill="none" />
          <text x="116" y="65" fill="#38bdf8" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="end">80Â°</text>
          <text x="116" y="74" fill="#94a3b8" font-size="6.5" font-family="sans-serif" text-anchor="end">(Sudut Ujung Îµ_r)</text>

          <!-- Panah Gerak Sayat Pemakanan -->
          <g transform="translate(65, 88)">
            <line x1="30" y1="0" x2="5" y2="0" stroke="#facc15" stroke-width="1.8" />
            <polygon points="7,-3 0,0 7,3" fill="#facc15" />
            <text x="18" y="9" fill="#facc15" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Arah Sayat (â‡¦)</text>
          </g>
        </g>

        <!-- ============================================================== -->
        <!-- 2. PANDANGAN DEPAN (FRONT VIEW) - MUKA POTONG & SUDUT BEBAS    -->
        <!-- ============================================================== -->
        <g id="view-2d-front">
          <text x="300" y="18" fill="#38bdf8" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">2. PANDANGAN DEPAN (FRONT VIEW)</text>
          
          <!-- Batang Pahat Tampak Depan -->
          <rect x="235" y="32" width="70" height="42" fill="url(#g-steel-2d)" stroke="#64748b" stroke-width="1.2" />
          
          <!-- Muka Asahan Depan dengan Sudut Bebas Muka (Î±_e = 10Â°-13Â°) -->
          <polygon points="305,32 355,32 342,74 305,74" fill="url(#g-chrome-2d)" stroke="#38bdf8" stroke-width="1.2" />
          <line x1="355" y1="32" x2="342" y2="74" stroke="#fb923c" stroke-width="2.2" />
          
          <!-- Garis Vertikal Acuan 90Â° -->
          <line x1="355" y1="28" x2="355" y2="82" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="2 2" />
          <path d="M 355 60 A 28 28 0 0 1 346 68" stroke="#fb923c" stroke-width="1.2" fill="none" />
          <polyline points="350,65 365,65 378,65" stroke="#fb923c" stroke-width="1" fill="none" />
          <text x="382" y="63" fill="#fb923c" font-size="7.5" font-family="sans-serif" font-weight="bold">Î±_e = 10Â°-13Â°</text>
          <text x="382" y="73" fill="#fdba74" font-size="6.5" font-family="sans-serif">(Bebas Muka)</text>

          <text x="270" y="56" fill="#0f172a" font-size="6.5" font-family="monospace" font-weight="bold">MUKA DEPAN</text>
        </g>

        <!-- ============================================================== -->
        <!-- 3. PANDANGAN SAMPING (SIDE VIEW) - SUDUT TATAL & BEBAS SAMPING -->
        <!-- ============================================================== -->
        <g id="view-2d-side" transform="translate(0, 105)">
          <text x="200" y="16" fill="#38bdf8" font-size="8.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">3. PANDANGAN SAMPING (SIDE VIEW) - SUDUT TATAL (Î³) &amp; BEBAS SAMPING (Î±_s)</text>
          
          <!-- Batang Samping -->
          <rect x="120" y="26" width="120" height="40" fill="url(#g-steel-2d)" stroke="#64748b" stroke-width="1.2" />
          
          <!-- Kepala Asahan Miring: Bidang Tatal (Î³ = 12Â°-20Â°) & Bebas Samping (Î±_s = 8Â°-10Â°) -->
          <polygon points="120,26 75,34 85,66 120,66" fill="url(#g-chrome-2d)" stroke="#38bdf8" stroke-width="1.2" />
          
          <!-- Anotasi Sudut Tatal Î³ = 12Â°-20Â° -->
          <line x1="50" y1="26" x2="120" y2="26" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="2 2" />
          <path d="M 102 26 A 20 20 0 0 1 96 31" stroke="#34d399" stroke-width="1.2" fill="none" />
          <polyline points="99,29 88,18 45,18" stroke="#34d399" stroke-width="1" fill="none" />
          <text x="42" y="15" fill="#34d399" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="end">Î³ = 12Â°-20Â° (Sudut Tatal)</text>

          <!-- Anotasi Sudut Bebas Samping Î±_s = 8Â°-10Â° -->
          <line x1="75" y1="26" x2="75" y2="72" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="2 2" />
          <path d="M 75 52 A 20 20 0 0 0 81 58" stroke="#f59e0b" stroke-width="1.2" fill="none" />
          <polyline points="78,55 65,62 30,62" stroke="#f59e0b" stroke-width="1" fill="none" />
          <text x="28" y="59" fill="#f59e0b" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="end">Î±_s = 8Â°-10Â°</text>
          <text x="28" y="69" fill="#fde68a" font-size="6.5" font-family="sans-serif" text-anchor="end">(Bebas Samping)</text>

          <!-- Sudut Baji Î² = 80Â° -->
          <text x="270" y="48" fill="#38bdf8" font-size="7.5" font-family="sans-serif" font-weight="bold">Sudut Baji (Î²) = 90Â° - (Î± + Î³) â‰ˆ 60Â°-70Â°</text>
          <text x="270" y="59" fill="#94a3b8" font-size="6.5" font-family="sans-serif">Standar Geometri Pahat Bubut DIN 4971 / ISO 1</text>
        </g>

        <!-- Footer Standar -->
        <rect x="15" y="180" width="370" height="15" rx="3" fill="rgba(15, 23, 42, 0.95)" stroke="#334155" stroke-width="0.8" />
        <text x="200" y="191" fill="#94a3b8" font-size="6.5" font-family="monospace" text-anchor="middle">Proyeksi Ortogonal 2D: Pandangan Atas (80Â°), Depan (10Â°-13Â°), dan Samping (12Â°-20Â°)</text>
      </svg>
    `,

    // 4. FOTO & GAMBAR ASLI PENGGUNA (DIKOSONGKAN SEMENTARA MENUNGGU UNGGAHAN)
    photo: () => `
      <div class="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-3 rounded-xl select-none">
        <div class="w-full h-full border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 rounded-xl bg-slate-900/40 flex flex-col items-center justify-center text-center p-4 transition-colors">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5 shadow-inner">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1.5">
            ðŸ“· Menunggu Unggahan Foto Asli
          </span>
          <h4 class="text-xs font-bold text-slate-200 mb-1">
            Slot Dokumentasi Foto Fisik Pahat HSS Rata Kanan
          </h4>
          <p class="text-[10.5px] text-slate-400 max-w-md leading-relaxed">
            Ruang visualisasi ini dikosongkan sementara dan siap menampilkan foto dokumentasi fisik nyata pahat HSS yang akan Anda unggah.
          </p>
        </div>
      </div>
    `
  };

  // --- SVG & REAL IMAGE ILLUSTRATION GENERATORS BY TOOL ID ---
  const SVG_LIBRARY = {
    // 1. Pahat Bubut HSS Rata Kanan (Default: Proyeksi 2D Standar)
    pahat_hss_rata_kanan: () => PAHAT_HSS_MULTI_VIEWS["2d"](),

    // Aliases untuk Pahat HSS Rata Kanan pada proses Muka, Rata, Bertingkat, dan Tirus
    pahat_muka: () => PAHAT_HSS_MULTI_VIEWS["2d"](),
    pahat_rata_kanan: () => PAHAT_HSS_MULTI_VIEWS["2d"](),
    pahat_bahu_siku: () => PAHAT_HSS_MULTI_VIEWS["2d"](),
    pahat_tirus: () => PAHAT_HSS_MULTI_VIEWS["2d"](),

    // 5. Pahat Alur & Potong (Dual Gambar Riil: Holder Bilah Insert & Pahat Alur Solid HSS DIN 4981)
    pahat_alur: () => `
      <div class="relative w-full h-full bg-slate-950 flex items-center justify-center gap-2 p-2 rounded-xl overflow-hidden select-none">
        <div class="flex-1 h-full flex flex-col items-center justify-center bg-slate-900/70 rounded-lg p-1 border border-slate-800">
          <img src="img/pahat-alur-1.jpg" alt="Holder Bilah Pahat Alur &amp; Insert" class="max-h-[78%] max-w-full object-contain rounded drop-shadow" />
          <span class="text-[9px] font-mono text-slate-300 mt-1 truncate">1. Holder &amp; Bilah Insert</span>
        </div>
        <div class="flex-1 h-full flex flex-col items-center justify-center bg-slate-900/70 rounded-lg p-1 border border-slate-800">
          <img src="img/pahat-alur-2a.jpg" alt="Pahat Alur Solid HSS DIN 4981" class="max-h-[78%] max-w-full object-contain rounded drop-shadow" />
          <span class="text-[9px] font-mono text-slate-300 mt-1 truncate">2. Pahat Alur Solid HSS</span>
        </div>
      </div>
    `,

    // 6. Mata Bor Senter (Center Drill DIN 333 Form A 60° - Gambar Riil)
    mata_bor_senter: () => `
      <div class="relative w-full h-full bg-slate-950 flex items-center justify-center p-2 rounded-xl overflow-hidden select-none">
        <img src="img/center-drill.jfif" alt="Mata Bor Senter DIN 333 Form A 60°" class="max-h-full max-w-full object-contain rounded-lg drop-shadow-md" />
        <div class="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9.5px] font-mono text-amber-400 border border-slate-700/60">
          Mata Bor Senter DIN 333 (Sudut Kerucut 60°)
        </div>
      </div>
    `,

    // 7. Pahat Ulir Segitiga Metris 60° (Gambar Riil Pahat Ulir Metris HSS)
    pahat_ulir_metris: () => `
      <div class="relative w-full h-full bg-slate-950 flex items-center justify-center p-2 rounded-xl overflow-hidden select-none">
        <img src="img/pahat-ulir-metris.jpg" alt="Pahat Bubut Ulir Metris 60°" class="max-h-full max-w-full object-contain rounded-lg drop-shadow-md" />
        <div class="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9.5px] font-mono text-blue-400 border border-slate-700/60">
          Pahat Ulir Metris 60° (Batang HSS Asah 60°)
        </div>
      </div>
    `,

    // 8. Jangka Sorong Digital (Gambar Riil: Electronic Digital Caliper)
    jangka_sorong: () => `
      <div class="relative w-full h-full bg-slate-950 flex items-center justify-center p-2 rounded-xl overflow-hidden select-none">
        <img src="img/jangka-sorong-caliper.jfif" alt="Jangka Sorong Digital (Electronic Digital Caliper)" class="max-h-full max-w-full object-contain rounded-lg drop-shadow-md" />
        <div class="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9.5px] font-mono text-emerald-400 border border-slate-700/60">
          Jangka Sorong Digital (Resolusi 0,01 mm)
        </div>
      </div>
    `,

    // 9. Mikrometer Luar Presisi (Gambar Riil: Outside Micrometer 0-25 mm)
    mikrometer_luar: () => `
      <div class="relative w-full h-full bg-slate-950 flex items-center justify-center p-2 rounded-xl overflow-hidden select-none">
        <img src="img/mikrometer.webp" alt="Mikrometer Luar Presisi (Outside Micrometer)" class="max-h-full max-w-full object-contain rounded-lg drop-shadow-md" />
        <div class="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9.5px] font-mono text-blue-400 border border-slate-700/60">
          Mikrometer Luar Presisi (Ketelitian 0,01 mm)
        </div>
      </div>
    `,

    // 10. Penyiku Presisi 90° (Precision Try Square DIN 875 - Standalone Tanpa Benda Kerja)
    penyiku_presisi: () => createSvgContainer(`
      <!-- Balok Landasan Tebal (Stock / Beam) Horizontal -->
      <rect x="42" y="78" width="156" height="24" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.3" rx="2" />
      <!-- Bevel Chamfer Atas Balok Landasan -->
      <line x1="43" y1="80" x2="197" y2="80" stroke="#94a3b8" stroke-width="0.8" opacity="0.7" />
      <text x="126" y="93" fill="#cbd5e1" font-size="7.5" font-family="monospace" font-weight="bold">DIN 875/0 STOCK</text>
      <text x="126" y="100" fill="#64748b" font-size="5.5" font-family="sans-serif">Baja Karbon Keras Bebas Tegangan</text>

      <!-- Daun Penyiku Tipis Presisi (Blade) Vertikal 90° Mutlak -->
      <rect x="42" y="12" width="22" height="68" fill="url(#g-chrome)" stroke="#334155" stroke-width="1.3" rx="1" />
      <!-- Sisi Kontak Dalam Presisi Daun (True 90° Reference Face) -->
      <line x1="64" y1="12" x2="64" y2="78" stroke="#38bdf8" stroke-width="1.6" />
      
      <!-- Alur Pembebas Sudut Dalam (Inner Corner Relief Groove DIN 875) -->
      <rect x="64" y="76" width="5" height="5" fill="#0b1329" stroke="#475569" stroke-width="0.8" />

      <!-- Tanda Ketegaklurusan 90° Sempurna -->
      <g transform="translate(64, 78)">
        <rect x="0" y="-14" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="1.2" />
        <circle cx="7" cy="-7" r="1.5" fill="#ef4444" />
        <text x="18" y="-4" fill="#ef4444" font-size="8.5" font-family="sans-serif" font-weight="bold">90° MUTLAK</text>
      </g>

      <!-- Skala Graduasi Daun Pengukur (Blade Graduation) -->
      <g stroke="#334155" stroke-width="0.6">
        <line x1="44" y1="20" x2="49" y2="20" /><line x1="44" y1="28" x2="52" y2="28" />
        <line x1="44" y1="36" x2="49" y2="36" /><line x1="44" y1="44" x2="52" y2="44" />
        <line x1="44" y1="52" x2="49" y2="52" /><line x1="44" y1="60" x2="52" y2="60" />
        <line x1="44" y1="68" x2="49" y2="68" />
      </g>
      <text x="53" y="22" fill="#0f172a" font-size="5" font-family="monospace">10</text>
      <text x="53" y="46" fill="#0f172a" font-size="5" font-family="monospace">50</text>

      <!-- Label Anotasi Bagian Alat -->
      <text x="72" y="24" fill="#38bdf8" font-size="7.5" font-family="sans-serif" font-weight="bold">← Daun Baja Presisi (Blade)</text>
      <text x="72" y="34" fill="#94a3b8" font-size="6.5" font-family="sans-serif">Toleransi Kesikuan Kelas 0 (DIN 875/0)</text>

      <text x="12" y="108" fill="#38bdf8" font-size="8" font-family="monospace">Penyiku Presisi 90° (Precision Try Square)</text>
    `),

    // 11. Senter Kepala Lepas Putar (Revolving Live Center 60°)
    senter_putar: () => createSvgContainer(`
      <!-- Tangkai Tirus Morse (Morse Taper Shank MT2/MT3) -->
      <polygon points="20,44 100,38 100,68 20,62" fill="url(#g-chrome)" stroke="#475569" stroke-width="1.2" />
      <rect x="12" y="47" width="8" height="12" fill="url(#g-steel-dark)" stroke="#334155" rx="1" />
      <text x="55" y="56" fill="#0f172a" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">MORSE TAPER MT3</text>

      <!-- Rumah Bantalan Presisi (Bearing Housing Body) -->
      <rect x="100" y="30" width="55" height="46" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.2" rx="3" />
      <!-- Cincin Knurled Anti Slip -->
      <rect x="108" y="32" width="10" height="42" fill="#334155" stroke="#475569" />
      <rect x="135" y="32" width="10" height="42" fill="#334155" stroke="#475569" />
      <text x="127" y="55" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">BEARING</text>

      <!-- Ujung Kerucut Putar Baja Keras 60° (Rotating Cone) -->
      <polygon points="155,36 198,53 155,70" fill="url(#g-chrome)" stroke="#e2e8f0" stroke-width="1.2" />
      <line x1="155" y1="53" x2="198" y2="53" stroke="#f8fafc" stroke-width="1" />
      
      <!-- Garis Sumbu & Anotasi Sudut 60° -->
      <line x1="5" y1="53" x2="225" y2="53" stroke="#ef4444" stroke-dasharray="4 2" stroke-width="0.8" />
      <text x="175" y="28" fill="#facc15" font-size="9" font-family="monospace" font-weight="bold">60° SENTER</text>
      
      <text x="15" y="104" fill="#38bdf8" font-size="8" font-family="monospace">Senter Putar Kepala Lepas (Revolving Live Center)</text>
      <text x="145" y="104" fill="#94a3b8" font-size="7.5" font-family="monospace">Bantalan Aksial & Radial</text>
    `),

    // 12. Mal Pahat Ulir 60° (Center Gauge / Fish Gauge DIN EN ISO - Standalone Tanpa Benda Kerja Lain)
    center_gauge: () => createSvgContainer(`
      <!-- Pelat Baja Tempered Presisi Mal Ulir (Center Gauge Fish Tail Standalone) -->
      <!-- Bodi Utama Pelat Baja Karbon Mengkilap Berbentuk Fish Tail Simetris -->
      <path d="M 40 32 L 102 32 L 116 52 L 130 32 L 180 32 L 202 57 L 180 82 L 130 82 L 116 62 L 102 82 L 40 82 L 40 68 L 54 57 L 40 46 Z" 
            fill="url(#g-chrome)" stroke="#334155" stroke-width="1.4" />
      
      <!-- Bayangan Kedalaman & Bevel Kontur Pelat -->
      <path d="M 42 34 L 101 34 L 116 50 L 131 34 L 178 34 L 198 57 L 178 80 L 131 80 L 116 64 L 101 80 L 42 80 L 42 67 L 52 57 L 42 47 Z" 
            fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6" />

      <!-- Celah V-Notch 60° di Tepi Atas -->
      <path d="M 102 32 L 116 52 L 130 32" fill="none" stroke="#38bdf8" stroke-width="1.8" />
      <text x="116" y="26" fill="#38bdf8" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">60° CELAH V</text>

      <!-- Celah V-Notch 60° di Tepi Bawah -->
      <path d="M 130 82 L 116 62 L 102 82" fill="none" stroke="#38bdf8" stroke-width="1.8" />
      <text x="116" y="93" fill="#38bdf8" font-size="7.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">60° CELAH V</text>

      <!-- Ujung Puncak Kerucut 60° Depan (Kanan) -->
      <path d="M 180 32 L 202 57 L 180 82" fill="none" stroke="#facc15" stroke-width="1.8" />
      <path d="M 188 51 A 14 14 0 0 1 188 63" stroke="#facc15" stroke-width="1.2" fill="none" />
      <text x="165" y="60" fill="#facc15" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">60°</text>

      <!-- Takik Ekor Belakang 60° (Kiri) -->
      <path d="M 40 46 L 54 57 L 40 68" fill="none" stroke="#fb923c" stroke-width="1.6" />
      <text x="63" y="60" fill="#fb923c" font-size="7" font-family="sans-serif" font-weight="bold">60°</text>

      <!-- Garis Graduasi Skala Milimeter pada Tepi Atas & Bawah -->
      <g stroke="#0f172a" stroke-width="0.6">
        <!-- Skala Atas -->
        <line x1="50" y1="32" x2="50" y2="37" /><line x1="60" y1="32" x2="60" y2="39" /><line x1="70" y1="32" x2="70" y2="37" /><line x1="80" y1="32" x2="80" y2="40" />
        <line x1="90" y1="32" x2="90" y2="37" /><line x1="100" y1="32" x2="100" y2="39" /><line x1="140" y1="32" x2="140" y2="37" /><line x1="150" y1="32" x2="150" y2="40" />
        <line x1="160" y1="32" x2="160" y2="37" /><line x1="170" y1="32" x2="170" y2="39" />
        <!-- Skala Bawah -->
        <line x1="50" y1="82" x2="50" y2="77" /><line x1="60" y1="82" x2="60" y2="75" /><line x1="70" y1="82" x2="70" y2="77" /><line x1="80" y1="82" x2="80" y2="74" />
        <line x1="90" y1="82" x2="90" y2="77" /><line x1="100" y1="82" x2="100" y2="75" /><line x1="140" y1="82" x2="140" y2="77" /><line x1="150" y1="82" x2="150" y2="74" />
        <line x1="160" y1="82" x2="160" y2="77" /><line x1="170" y1="82" x2="170" y2="75" />
      </g>
      <text x="80" y="47" fill="#0f172a" font-size="5" font-family="monospace">1.0</text>
      <text x="150" y="47" fill="#0f172a" font-size="5" font-family="monospace">0.5</text>
      <text x="80" y="70" fill="#0f172a" font-size="5" font-family="monospace">20</text>
      <text x="150" y="70" fill="#0f172a" font-size="5" font-family="monospace">28</text>

      <!-- Label Stempel Pabrikan pada Bodi Mal Ulir -->
      <text x="116" y="55" fill="#0f172a" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">ISO METRIC 60°</text>
      <text x="116" y="61" fill="#334155" font-size="4.5" font-family="sans-serif" text-anchor="middle">TEMPERED STEEL</text>

      <!-- Indikator Ketegaklurusan 90° Tepi Datum -->
      <line x1="40" y1="32" x2="40" y2="82" stroke="#ef4444" stroke-dasharray="2 1.5" stroke-width="0.8" />
      <text x="35" y="58" fill="#ef4444" font-size="6" font-family="monospace" text-anchor="end">90° DATUM</text>

      <text x="15" y="106" fill="#38bdf8" font-size="8" font-family="monospace">Mal Pahat Ulir 60° (Center Gauge / Fish Gauge)</text>
      <text x="135" y="106" fill="#94a3b8" font-size="7.5" font-family="monospace">Standar DIN EN ISO Metris 60°</text>
    `),

    // 13. Mal Kisar Ulir (Screw Pitch Gauge P = 2.0 mm)
    pitch_gauge: () => createSvgContainer(`
      <!-- Benda Kerja dengan Ulir Metris Kisar P = 2,0 mm -->
      <rect x="25" y="55" width="190" height="35" fill="url(#g-steel)" stroke="#475569" stroke-width="1" />
      <!-- Puncak & Dasar Ulir Segitiga Metris 60° -->
      <path d="M 35 55 L 43 45 L 51 55 L 59 45 L 67 55 L 75 45 L 83 55 L 91 45 L 99 55 L 107 45 L 115 55 L 123 45 L 131 55 L 139 45 L 147 55 L 155 45 L 163 55 L 171 45 L 179 55 L 187 45 L 195 55" stroke="#38bdf8" stroke-width="1.5" fill="none" />
      
      <!-- Bilah Mal Kisar Ulir (Screw Pitch Gauge Leaf) dari Atas -->
      <path d="M 25 24 L 200 24 L 200 35 L 195 45 L 187 35 L 179 45 L 171 35 L 163 45 L 155 35 L 147 45 L 139 35 L 131 45 L 123 35 L 115 45 L 107 35 L 99 45 L 91 35 L 83 45 L 75 35 L 67 45 L 59 35 L 51 45 L 43 35 L 35 45 L 25 35 Z" fill="url(#g-chrome)" stroke="#334155" stroke-width="1.2" />
      
      <!-- Engsel / Casing Bodi Pengunci Mal Kisar di Kiri -->
      <circle cx="28" cy="28" r="6" fill="url(#g-brass)" stroke="#78350f" stroke-width="1" />
      <circle cx="28" cy="28" r="2.2" fill="#0f172a" />
      
      <text x="110" y="20" fill="#0f172a" font-size="7.5" font-family="monospace" font-weight="bold">PITCH 2.00 mm (60°)</text>
      <text x="125" y="42" fill="#10b981" font-size="8" font-family="monospace" font-weight="bold">✓ RAPAT PAS PRESI</text>

      <text x="15" y="104" fill="#38bdf8" font-size="8" font-family="monospace">Mal Kisar Ulir (Screw Pitch Gauge)</text>
      <text x="145" y="104" fill="#94a3b8" font-size="7.5" font-family="monospace">Uji Kisar P=2.0 mm (M20)</text>
    `),

    // 15. Skala Busur Derajat Eretan Atas (Compound Rest Swivel Scale)
    skala_busur_eretan: () => createSvgContainer(`
      <!-- Piringan Dudukan Eretan Atas yang Diputar -->
      <path d="M 30 75 A 90 90 0 0 1 210 75 Z" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.4" />
      <circle cx="120" cy="75" r="45" fill="url(#g-chrome)" stroke="#475569" stroke-width="1.2" />
      
      <!-- Skala Derajat 0 s.d. 90 Derajat Kiri-Kanan -->
      <g stroke="#f8fafc" stroke-width="0.8">
        <line x1="120" y1="30" x2="120" y2="38" />
        <line x1="88" y1="35" x2="93" y2="42" />
        <line x1="60" y1="48" x2="67" y2="53" />
        <line x1="152" y1="35" x2="147" y2="42" />
        <line x1="180" y1="48" x2="173" y2="53" />
      </g>
      <text x="120" y="26" fill="#f8fafc" font-size="7.5" font-family="monospace" text-anchor="middle">0°</text>
      <text x="86" y="30" fill="#f8fafc" font-size="7" font-family="monospace">30°</text>
      <text x="148" y="30" fill="#facc15" font-size="7.5" font-family="monospace" font-weight="bold">30° ➔</text>

      <!-- Garis Indeks Penunjuk Nol & Putaran 30° ke Kanan -->
      <line x1="120" y1="75" x2="147" y2="42" stroke="#ef4444" stroke-width="2" />
      <circle cx="120" cy="75" r="5" fill="#ef4444" />
      
      <!-- Dua Baut Pengikat Eretan Atas -->
      <circle cx="70" cy="65" r="5" fill="#64748b" stroke="#334155" />
      <circle cx="70" cy="65" r="2" fill="#0f172a" />
      <circle cx="170" cy="65" r="5" fill="#64748b" stroke="#334155" />
      <circle cx="170" cy="65" r="2" fill="#0f172a" />

      <text x="120" y="66" fill="#0f172a" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">PUTAR 30° KANAN</text>
      <text x="15" y="98" fill="#38bdf8" font-size="8" font-family="monospace">Skala Busur Derajat Eretan Atas</text>
      <text x="15" y="108" fill="#94a3b8" font-size="7" font-family="monospace">Kendorkan 2 baut pengunci, geser ke 30°</text>
    `),

    // 16. Cekam Tiga Rahang Sentris (3-Jaw Scroll Chuck & Key)
    cekam_3_rahang: () => createSvgContainer(`
      <!-- Bodi Silinder Cekam (Main Chuck Body) -->
      <circle cx="85" cy="55" r="42" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.6" />
      <circle cx="85" cy="55" r="36" fill="url(#g-steel)" stroke="#475569" stroke-width="1" />
      
      <!-- 3 Rahang Bertingkat (Stepped Jaws) Bersudut 120° -->
      <!-- Rahang 1 (Atas) -->
      <rect x="79" y="18" width="12" height="24" fill="url(#g-chrome)" stroke="#334155" stroke-width="1" rx="1" />
      <!-- Rahang 2 (Kiri Bawah 120°) -->
      <g transform="translate(85,55) rotate(120)">
        <rect x="-6" y="-37" width="12" height="24" fill="url(#g-chrome)" stroke="#334155" stroke-width="1" rx="1" />
      </g>
      <!-- Rahang 3 (Kanan Bawah 240°) -->
      <g transform="translate(85,55) rotate(240)">
        <rect x="-6" y="-37" width="12" height="24" fill="url(#g-chrome)" stroke="#334155" stroke-width="1" rx="1" />
      </g>
      
      <!-- Benda Kerja Silindris yang Terjepit Sentris di Tengah -->
      <circle cx="85" cy="55" r="14" fill="url(#g-workpiece)" stroke="#38bdf8" stroke-width="1.2" />
      <circle cx="85" cy="55" r="2" fill="#ef4444" />

      <!-- Kunci Cekam (Chuck Key T-Handle) di Kanan -->
      <rect x="150" y="48" width="55" height="6" fill="url(#g-chrome)" stroke="#475569" rx="1" />
      <rect x="172" y="24" width="8" height="58" fill="url(#g-chrome)" stroke="#475569" rx="2" />
      <polygon points="144,48 150,45 150,57 144,54" fill="#0f172a" stroke="#64748b" />
      <text x="176" y="18" fill="#facc15" font-size="7.5" font-family="monospace" text-anchor="middle">KUNCI CEKAM</text>
      <text x="176" y="94" fill="#ef4444" font-size="6.5" font-family="monospace" text-anchor="middle">Cabut Usai Kunci!</text>

      <text x="12" y="106" fill="#38bdf8" font-size="8" font-family="monospace">Cekam 3 Rahang Sentris (Self-Centering)</text>
    `),

    // 17. Cekam Bor Kepala Lepas & Tangkai Tirus (Drill Chuck & Arbor)
    drill_chuck: () => createSvgContainer(`
      <!-- Tangkai Tirus Morse Taper MT2 / MT3 -->
      <polygon points="20,47 80,41 80,69 20,63" fill="url(#g-chrome)" stroke="#475569" stroke-width="1.2" />
      <rect x="12" y="50" width="8" height="10" fill="#0f172a" stroke="#334155" rx="1" />
      <text x="48" y="58" fill="#0f172a" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">ARBOR MT2</text>

      <!-- Bodi Silinder Cekam Bor Beroda Gigi (Geared Drill Chuck) -->
      <rect x="80" y="32" width="60" height="46" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.2" rx="2" />
      <!-- Cincin Gigi Cekam Bor (Geared Sleeve) -->
      <rect x="95" y="34" width="30" height="42" fill="url(#g-steel)" stroke="#475569" />
      <g stroke="#0f172a" stroke-width="1">
        <line x1="99" y1="34" x2="99" y2="76" /><line x1="104" y1="34" x2="104" y2="76" /><line x1="109" y1="34" x2="109" y2="76" />
        <line x1="114" y1="34" x2="114" y2="76" /><line x1="119" y1="34" x2="119" y2="76" />
      </g>
      <circle cx="132" cy="55" r="4.5" fill="#0f172a" stroke="#64748b" />

      <!-- Rahang Jepit Kerucut Cekam Bor & Mata Bor -->
      <polygon points="140,38 165,46 165,64 140,72" fill="url(#g-chrome)" stroke="#475569" stroke-width="1" />
      <rect x="165" y="51" width="45" height="8" fill="url(#g-carbide-tin)" stroke="#78350f" stroke-width="1" />
      
      <text x="140" y="24" fill="#38bdf8" font-size="8" font-family="monospace">Kapasitas 1-13 mm</text>
      <text x="15" y="104" fill="#38bdf8" font-size="8" font-family="monospace">Cekam Bor Kepala Lepas (Drill Chuck)</text>
    `),

    // 18. Mur Standar Penguji M20x2.0 (Thread Ring / Nut Gauge)
    mur_standar_m20: () => createSvgContainer(`
      <!-- Profil Mur Segienam Presisi M20 (Hex Nut) -->
      <polygon points="85,20 155,20 190,55 155,90 85,90 50,55" fill="url(#g-steel)" stroke="#475569" stroke-width="1.5" />
      <circle cx="120" cy="55" r="32" fill="url(#g-chrome)" stroke="#334155" stroke-width="1.2" />
      
      <!-- Ulir Metris Dalam M20 x 2.0 (Internal Thread Helix) -->
      <circle cx="120" cy="55" r="22" fill="#0b1329" stroke="#38bdf8" stroke-width="1.5" />
      <path d="M 102 55 A 18 18 0 0 1 138 55" stroke="#facc15" stroke-width="1.5" fill="none" />
      <path d="M 104 60 A 18 18 0 0 1 136 60" stroke="#facc15" stroke-width="1.5" fill="none" />
      
      <!-- Label Stempel Standar Mur -->
      <text x="120" y="48" fill="#f8fafc" font-size="8.5" font-family="monospace" font-weight="bold" text-anchor="middle">M20 x 2.0</text>
      <text x="120" y="65" fill="#10b981" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">6H GO PASS</text>
      
      <text x="15" y="105" fill="#38bdf8" font-size="8" font-family="monospace">Mur Standar Penguji M20 (Nut Gauge)</text>
      <text x="140" y="105" fill="#94a3b8" font-size="7.5" font-family="monospace">Uji Suaian Ulir Mesin Mati</text>
    `),

    // 19. Dial Indicator & Stopper Eretan
    dial_indicator: () => createSvgContainer(`
      <!-- Batang Spindel Pengukur Bawah (Plunger Stem) -->
      <rect x="117" y="65" width="6" height="42" fill="url(#g-chrome)" stroke="#475569" stroke-width="1" />
      <circle cx="120" cy="107" r="3" fill="#0f172a" stroke="#38bdf8" />

      <!-- Piringan Jam Ukur Dial Indicator Bulat -->
      <circle cx="120" cy="46" r="36" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.5" />
      <circle cx="120" cy="46" r="31" fill="#f8fafc" stroke="#334155" stroke-width="1" />
      
      <!-- Skala Keliling 0 s.d. 100 Divisi (0.01 mm) -->
      <g stroke="#0f172a" stroke-width="0.6">
        <line x1="120" y1="18" x2="120" y2="23" /><line x1="120" y1="74" x2="120" y2="69" />
        <line x1="92" y1="46" x2="97" y2="46" /><line x1="148" y1="46" x2="143" y2="46" />
        <line x1="100" y1="26" x2="104" y2="29" /><line x1="140" y1="26" x2="136" y2="29" />
        <line x1="100" y1="66" x2="104" y2="63" /><line x1="140" y1="66" x2="136" y2="63" />
      </g>
      <text x="120" y="29" fill="#0f172a" font-size="6.5" font-family="monospace" font-weight="bold" text-anchor="middle">0</text>
      <text x="120" y="40" fill="#2563eb" font-size="5.5" font-family="monospace" text-anchor="middle">0.01 mm</text>
      
      <!-- Jarum Penunjuk Merah -->
      <line x1="120" y1="46" x2="136" y2="34" stroke="#ef4444" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="120" cy="46" r="2.5" fill="#ef4444" />
      
      <text x="160" y="30" fill="#facc15" font-size="8" font-family="monospace" font-weight="bold">STOPPER AKSIS</text>
      <text x="160" y="42" fill="#38bdf8" font-size="7" font-family="monospace">Batas Eretan</text>
      <text x="15" y="105" fill="#94a3b8" font-size="8" font-family="monospace">Dial Indicator DIN 878 (0,01 mm)</text>
    `),

    // 20. Pisau Frais Muka (Face Mill Cutter Ø63 mm)
    pisau_frais_muka: () => createSvgContainer(`
      <!-- Bodi Silinder Pemegang Pisau Muka (Face Mill Body) -->
      <circle cx="100" cy="55" r="38" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.4" />
      <circle cx="100" cy="55" r="24" fill="url(#g-steel)" stroke="#475569" stroke-width="1" />
      <circle cx="100" cy="55" r="10" fill="#0b1329" stroke="#334155" stroke-width="1" />
      
      <!-- 5 Insert Karbida Segi Empat Mengelilingi Bodi Pisau -->
      <rect x="94" y="12" width="12" height="12" fill="url(#g-carbide-tin)" stroke="#78350f" stroke-width="1" rx="1" />
      <g transform="translate(100,55) rotate(72)"><rect x="-6" y="-43" width="12" height="12" fill="url(#g-carbide-tin)" stroke="#78350f" rx="1" /></g>
      <g transform="translate(100,55) rotate(144)"><rect x="-6" y="-43" width="12" height="12" fill="url(#g-carbide-tin)" stroke="#78350f" rx="1" /></g>
      <g transform="translate(100,55) rotate(216)"><rect x="-6" y="-43" width="12" height="12" fill="url(#g-carbide-tin)" stroke="#78350f" rx="1" /></g>
      <g transform="translate(100,55) rotate(288)"><rect x="-6" y="-43" width="12" height="12" fill="url(#g-carbide-tin)" stroke="#78350f" rx="1" /></g>

      <text x="150" y="32" fill="#facc15" font-size="8.5" font-family="monospace" font-weight="bold">FACE MILL Ø63</text>
      <text x="150" y="44" fill="#38bdf8" font-size="7.5" font-family="monospace">5 Mata Insert APMT</text>
      <text x="15" y="105" fill="#94a3b8" font-size="8" font-family="monospace">Pisau Frais Muka (Perataan Bidang)</text>
    `),

    // 21. Pisau Frais Jari (End Mill 2/4 Flute)
    pisau_end_mill: () => createSvgContainer(`
      <!-- Tangkai Silindris End Mill (Shank) -->
      <rect x="25" y="42" width="85" height="28" fill="url(#g-chrome)" stroke="#475569" stroke-width="1.2" rx="2" />
      <text x="65" y="58" fill="#0f172a" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">HSS-Co Ø12</text>
      
      <!-- Bagian Pemotong Heliks (Flutes) -->
      <rect x="110" y="42" width="80" height="28" fill="url(#g-steel)" stroke="#475569" stroke-width="1" />
      <path d="M 110 42 Q 130 56 150 42 Q 170 56 190 42" stroke="#38bdf8" stroke-width="2.5" fill="none" />
      <path d="M 110 70 Q 130 56 150 70 Q 170 56 190 70" stroke="#38bdf8" stroke-width="2.5" fill="none" />
      
      <!-- Mata Potong Ujung Pusat (Center Cutting) -->
      <polygon points="190,42 195,50 190,56 195,64 190,70" fill="url(#g-steel-dark)" stroke="#38bdf8" stroke-width="1" />
      
      <text x="125" y="28" fill="#facc15" font-size="8.5" font-family="monospace" font-weight="bold">END MILL 2-FLUTE</text>
      <text x="125" y="38" fill="#38bdf8" font-size="7.5" font-family="monospace">Kemampuan Plunging (Tembus)</text>
      <text x="15" y="105" fill="#94a3b8" font-size="8" font-family="monospace">Pisau Frais Jari Alur Pasak</text>
    `),

    // 22. Pisau Frais Alur T (T-Slot Cutter HSS DIN 851 - Gambar Riil)
    pisau_alur_t: () => `
      <div class="relative w-full h-full bg-slate-950 flex items-center justify-center p-2 rounded-xl overflow-hidden select-none">
        <img src="img/pahat-frais-alur-t.jpg" alt="Pisau Frais Alur T DIN 851" class="max-h-full max-w-full object-contain rounded-lg drop-shadow-md" />
        <div class="absolute bottom-1.5 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9.5px] font-mono text-amber-400 border border-slate-700/60">
          Pisau Frais Alur T DIN 851 (T-Slot Cutter HSS)
        </div>
      </div>
    `,

    // 23. Baut Alur T & Mur Pengikat Standar (T-Bolt & Nut)
    baut_t: () => createSvgContainer(`
      <!-- Profil Alur T Potongan Melintang -->
      <path d="M 40 25 L 90 25 L 90 55 L 70 55 L 70 95 L 170 95 L 170 55 L 150 55 L 150 25 L 200 25 L 200 105 L 40 105 Z" fill="#090d16" stroke="#334155" stroke-width="1.2" />
      
      <!-- Kepala Baut T Baja Tempa di dalam Alur -->
      <rect x="75" y="60" width="90" height="30" fill="url(#g-steel-dark)" stroke="#64748b" stroke-width="1.3" rx="2" />
      <!-- Batang Ulir Baut T Menjulur ke Atas -->
      <rect x="105" y="15" width="30" height="48" fill="url(#g-steel)" stroke="#475569" stroke-width="1.2" />
      <!-- Garis Ulir Metris pada Batang Baut -->
      <g stroke="#94a3b8" stroke-width="0.8">
        <line x1="105" y1="22" x2="135" y2="25" /><line x1="105" y1="30" x2="135" y2="33" />
        <line x1="105" y1="38" x2="135" y2="41" /><line x1="105" y1="46" x2="135" y2="49" />
      </g>
      <!-- Mur Segi Enam & Ring Plat di Atas Alur -->
      <rect x="95" y="10" width="50" height="14" fill="url(#g-brass)" stroke="#78350f" stroke-width="1.2" rx="1.5" />
      <text x="120" y="20" fill="#0f172a" font-size="7" font-family="monospace" font-weight="bold" text-anchor="middle">M12 DIN 787</text>

      <text x="15" y="105" fill="#38bdf8" font-size="8" font-family="monospace">Baut Alur T &amp; Mur Presisi</text>
      <text x="145" y="105" fill="#94a3b8" font-size="7.5" font-family="monospace">DIN 787 Standard</text>
    `),

    // 24. Kepala Pembagi Universal (Universal Dividing Head dengan Cekam 3-Rahang)
    kepala_pembagi: () => createSvgContainer(`
      <!-- Badan Cor Kepala Pembagi (Cast Iron Dividing Head Body) -->
      <rect x="35" y="32" width="75" height="58" fill="url(#g-steel-dark)" stroke="#475569" stroke-width="1.4" rx="4" />
      <!-- Sumbu Spindel & Cekam 3-Rahang Silindris di Kiri -->
      <rect x="18" y="42" width="22" height="38" fill="url(#g-chrome)" stroke="#334155" stroke-width="1.2" rx="2" />
      <!-- Tiga Rahang Cekam (Chuck Jaws) -->
      <rect x="12" y="44" width="8" height="8" fill="#f8fafc" stroke="#0f172a" stroke-width="0.8" />
      <rect x="12" y="57" width="8" height="8" fill="#f8fafc" stroke="#0f172a" stroke-width="0.8" />
      <rect x="12" y="70" width="8" height="8" fill="#f8fafc" stroke="#0f172a" stroke-width="0.8" />

      <!-- Piring Pembagi Berlubang (Index Plate) di Sisi Depan Kanan -->
      <circle cx="165" cy="58" r="32" fill="url(#g-chrome)" stroke="#334155" stroke-width="1.3" />
      <!-- Lubang-Lubang Konsentris Piring Pembagi -->
      <g fill="#0f172a">
        <circle cx="165" cy="38" r="1.3" /><circle cx="165" cy="78" r="1.3" />
        <circle cx="145" cy="58" r="1.3" /><circle cx="185" cy="58" r="1.3" />
        <circle cx="151" cy="44" r="1.3" /><circle cx="179" cy="72" r="1.3" />
        <circle cx="151" cy="72" r="1.3" /><circle cx="179" cy="44" r="1.3" />
      </g>

      <!-- Gunting Pembagi (Sector Arms) -->
      <path d="M 165 58 L 182 40" stroke="#f59e0b" stroke-width="2" />
      <path d="M 165 58 L 187 64" stroke="#f59e0b" stroke-width="2" />
      <!-- Engkol Pemutar & Pen Indeks (Crank Handle & Plunger Pin) -->
      <rect x="162" y="55" width="6" height="34" fill="#cbd5e1" stroke="#0f172a" stroke-width="1" rx="1" transform="rotate(-35 165 58)" />
      <circle cx="165" cy="58" r="5" fill="#ef4444" stroke="#7f1d1d" />
      <circle cx="185" cy="85" r="4" fill="#38bdf8" stroke="#0369a1" />

      <text x="50" y="24" fill="#facc15" font-size="8.5" font-family="monospace" font-weight="bold">DIVIDING HEAD 40:1</text>
      <text x="15" y="105" fill="#38bdf8" font-size="8" font-family="monospace">Kepala Pembagi Universal &amp; Cekam</text>
      <text x="155" y="105" fill="#94a3b8" font-size="7.5" font-family="monospace">Rasio Cacing 40:1</text>
    `)
  };

  // =========================================================================
  // 2. REGISTRI PERALATAN LENGKAP UNTUK SETIAP OPERASI BUBUT & FRAIS
  // =========================================================================

  const OPERATION_TOOLS_REGISTRY = {
    // -----------------------------------------------------------------------
    // BUBUT 1: PEMBUBUTAN MUKA (FACING)
    // -----------------------------------------------------------------------
    lathe_facing: [
      {
        svgKey: "pahat_hss_rata_kanan",
        name: "Pahat Bubut HSS Rata Kanan",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 4971 / ISO 1 (HSS Co 12x12)",
        spec: "Batang HSS Persegi 12x12x100 mm (Sudut Baji β = 80°)",
        desc: "Batang HSS padat diasah rata kanan. Pada pembubutan muka (facing), mata potong diposisikan tepat setinggi sumbu senter dan disayat secara melintang (cross-slide) dari lingkar luar menuju titik pusat poros untuk menghasilkan bidang muka rata dan tegak lurus."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Digital (Electronic Caliper)",
        type: "Alat Ukur Presisi Digital",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862 (Digital LCD 0,01 mm)",
        spec: "Kapasitas 0 - 150 mm | Resolusi Digital 0,01 mm (mm/inch)",
        desc: "Mengukur dimensi panjang total poros (L) dan diameter awal silinder benda kerja sebelum dan sesudah penyayatan muka dengan rahang ukur luar."
      },
      {
        svgKey: "penyiku_presisi",
        name: "Penyiku Presisi 90° (Precision Try Square)",
        type: "Alat Ukur Kesikuan",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 875/0 Presisi Tinggi",
        spec: "Bilah Baja Keras Ditoleransi 90° Mutlak",
        desc: "Memeriksa kesikuan 90° sempurna antara bidang muka yang baru dibubut dengan keliling diameter silinder luar benda kerja menggunakan metode celah cahaya (light gap)."
      },
      {
        svgKey: "senter_putar",
        name: "Senter Kepala Lepas Putar (Live Center)",
        type: "Alat Bantu Penopang & Acuan",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "Morse Taper MT2 / MT3",
        spec: "Ujung Kerucut 60° Baja Keras Bantalan Presisi",
        desc: "Sebagai acuan ketepatan tinggi senter mata pahat (harus setinggi puncak 60°) dan penopang benda kerja silindris agar tidak bergetar saat berputar."
      }
    ],

    // -----------------------------------------------------------------------
    // BUBUT 2: PEMBUBUTAN RATA / SILINDRIS (STRAIGHT TURNING)
    // -----------------------------------------------------------------------
    lathe_straight: [
      {
        svgKey: "pahat_hss_rata_kanan",
        name: "Pahat Bubut HSS Rata Kanan",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 4971 / ISO 1 (HSS Co 12x12)",
        spec: "Batang HSS Persegi 12x12x100 mm (Sudut Tatal γ = 14°)",
        desc: "Pahat potong utama pembubutan memanjang. Sisi potong samping menyayat diameter luar dari arah kanan ke kiri (menuju cekam) untuk menghasilkan permukaan silinder konsentris yang lurus dan rata."
      },
      {
        svgKey: "mikrometer_luar",
        name: "Mikrometer Luar (Outside Micrometer)",
        type: "Alat Ukur Presisi Tinggi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 863 Standar Metris",
        spec: "Rentang 25 - 50 mm | Ketelitian 0,01 mm",
        desc: "Mengukur diameter silinder poros dengan ketelitian tinggi untuk toleransi suaian ISO. Dilengkapi rachet stop untuk memastikan tekanan pengukuran seragam."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Digital (Electronic Caliper)",
        type: "Alat Ukur Presisi Digital",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862 (Digital LCD 0,01 mm)",
        spec: "Kapasitas 0 - 150 mm | Resolusi Digital 0,01 mm (mm/inch)",
        desc: "Pemeriksaan cepat diameter selama proses penyayatan kasar (roughing) dan verifikasi panjang total langkah pemakanan aksial."
      },
      {
        svgKey: "cekam_3_rahang",
        name: "Cekam Tiga Rahang (3-Jaw Chuck & Key)",
        type: "Alat Bantu Penjepit",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "DIN 6350 Self-Centering",
        spec: "Diameter Ø160 - Ø200 mm | Kunci T-Handle",
        desc: "Menjepit benda kerja silindris secara otomatis sentris dan kokoh menggunakan alur ulir spiral (scroll) yang diputar dengan kunci cekam."
      }
    ],

    // -----------------------------------------------------------------------
    // BUBUT 3: PEMBUBUTAN BERTINGKAT (STEP TURNING)
    // -----------------------------------------------------------------------
    lathe_step: [
      {
        svgKey: "pahat_hss_rata_kanan",
        name: "Pahat Bubut HSS Rata Kanan",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 4971 / ISO 1 (HSS Co 12x12)",
        spec: "Batang HSS Persegi 12x12x100 mm (Bahu Siku 90°)",
        desc: "Membubut diameter silinder luar tingkat demi tingkat sekaligus menyayat bidang dinding bahu siku tegak lurus 90° presisi menggunakan sudut potong depan dan hidung pahat sebagai bidang datum bantalan/bearing."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Batang Kedalaman (Depth Caliper)",
        type: "Alat Ukur Presisi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862 Depth Gauge",
        spec: "Batang Kedalaman Presisi | Ketelitian 0,02 mm",
        desc: "Menempelkan datum ekor caliper rata pada muka ujung poros dan mengulurkan batang kedalaman untuk mengukur panjang tingkatan aksial (L1 = 55 mm, L = 110 mm)."
      },
      {
        svgKey: "mikrometer_luar",
        name: "Mikrometer Luar (Outside Micrometer)",
        type: "Alat Ukur Presisi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 863",
        spec: "Rentang 25 - 50 mm | Ketelitian 0,01 mm",
        desc: "Memeriksa kepresisian diameter tingkat pertama (D = 48 mm) dan tingkat kedua (D1 = 36 mm) sesuai standar toleransi dudukan bantalan ISO."
      },
      {
        svgKey: "dial_indicator",
        name: "Dial Indicator & Stopper Eretan",
        type: "Alat Bantu Presisi",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "DIN 878",
        spec: "Plunger Travel 0 - 10 mm | Ketelitian 0,01 mm",
        desc: "Sebagai stopper pembatas mekanis langkah memanjang eretan agar perpindahan aksial pahat berhenti persis pada koordinat panjang tingkatan poros."
      }
    ],

    // -----------------------------------------------------------------------
    // BUBUT 4: PEMBUATAN ALUR & POTONG (GROOVING & PARTING OFF)
    // -----------------------------------------------------------------------
    lathe_grooving: [
      {
        svgKey: "pahat_alur",
        name: "Pahat Alur & Potong (Grooving Tool)",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "ISO N151.2 / Holder Q-Cut",
        spec: "Bilah Insert Karbida Lebar w = 5,0 mm | Relief 1°30'",
        desc: "Bilah baja pegas dengan insert karbida alur persegi. Menyayat secara radial lurus menuju sumbu pusat untuk alur snap-ring, seal o-ring, atau pemotongan benda kerja."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong (Inside Jaws & Depth Bar)",
        type: "Alat Ukur Presisi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Rahang Dalam & Batang Kedalaman | Ketelitian 0,02 mm",
        desc: "Mengukur lebar alur (w = 5,0 mm) menggunakan rahang dalam serta mengukur kedalaman dasar alur (h = 6,0 mm) menggunakan batang kedalaman."
      },
      {
        svgKey: "penyiku_presisi",
        name: "Penyiku Presisi 90° (Try Square)",
        type: "Alat Bantu Penyetelan",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 875/0",
        spec: "Kesikuan 90° Mutlak",
        desc: "Menyetel ketegaklurusan bilah pahat alur 90° terhadap permukaan silinder benda kerja agar kedua dinding alur sejajar dan bilah tidak terjepit."
      },
      {
        svgKey: "dial_indicator",
        name: "Mistar Baja Presisi & Dial Stopper",
        type: "Alat Ukur Posisi",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "DIN 866/II",
        spec: "Graduasi 0,5 mm & 1,0 mm Presisi",
        desc: "Menentukan jarak koordinat posisi aksial alur (Z = 50 mm) dari ujung muka datum sebelum pahat mulai menusuk ke dalam benda kerja."
      }
    ],

    // -----------------------------------------------------------------------
    // BUBUT 5: PENGEBORAN SENTER & LUBANG (CENTER DRILLING)
    // -----------------------------------------------------------------------
    lathe_center_drilling: [
      {
        svgKey: "mata_bor_senter",
        name: "Mata Bor Senter DIN 333 Form A (Center Drill)",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 333 Form A 60°",
        spec: "Ukuran BS-3 (Ø Pilot 3,15 mm | Ø Bodi 8,0 mm | Tirus 60°)",
        desc: "Mata bor kombinasi HSS berujung ganda yang sangat kaku. Ujung pemandu silindris membuat lubang awal dan bagian kerucut 60° membentuk dudukan senter putar."
      },
      {
        svgKey: "drill_chuck",
        name: "Cekam Bor Kepala Lepas & Arbor Morse Taper",
        type: "Alat Bantu Cekam",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "DIN 238 / DIN 228 Morse Taper",
        spec: "Kapasitas 1 - 13 mm | Tangkai Tirus MT2 / MT3",
        desc: "Dipasang pada lubang tirus selongsong kepala lepas (tailstock quill) untuk mencekam tangkai silindris bor senter secara kuat, kokoh, dan konsentris."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong (Pengukur Kedalaman Lubang)",
        type: "Alat Ukur Kedalaman",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Ketelitian 0,02 mm | Batang Kedalaman",
        desc: "Memeriksa kedalaman lubang bor senter agar kerucut 60° masuk tepat 2/3 dari panjang bidang tirus (kedalaman tirus ~4,5 s.d. 6,0 mm) untuk penopang optimal."
      },
      {
        svgKey: "senter_putar",
        name: "Senter Kepala Lepas Putar (Revolving Live Center)",
        type: "Alat Bantu Pasangan Senter",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "Morse Taper MT2/MT3 | Sudut 60°",
        spec: "Baja Keras 60 HRC dengan Bantalan Presisi",
        desc: "Pasangan penopang yang akan dimasukkan ke dalam lubang senter hasil pengeboran untuk pembubutan silindris di antara dua senter."
      }
    ],

    // -----------------------------------------------------------------------
    // BUBUT 6: PEMBUBUTAN TIRUS (TAPER TURNING)
    // -----------------------------------------------------------------------
    lathe_taper: [
      {
        svgKey: "pahat_hss_rata_kanan",
        name: "Pahat Bubut HSS Rata Kanan",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 4971 / ISO 1 (HSS Co 12x12)",
        spec: "Batang HSS Persegi 12x12x100 mm (Pemakanan Eretan Atas)",
        desc: "Pahat HSS rata kanan dipasang sejajar sumbu benda kerja pada rumah pahat. Pemakanan miring pembentukan kerucut tirus disayat secara halus menggunakan tarikan mundur eretan atas yang telah diputar sebesar α = 30° ke arah kanan."
      },
      {
        svgKey: "skala_busur_eretan",
        name: "Skala Busur Derajat Eretan Atas",
        type: "Alat Penyetel Sudut Mesin",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "Piringan Skala Derajat Eretan Atas",
        spec: "Rentang Putar 0° - 90° Kiri & Kanan | Garis Indeks Nol",
        desc: "Landasan putar eretan atas yang diputar ke arah kanan sebesar sudut kemiringan α = 30° setelah melonggarkan dua baut pengikat eretan atas."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong / Mal Tirus (Taper Gauge & Caliper)",
        type: "Alat Ukur Dimensi Tirus",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Kapasitas 150 mm | Ketelitian 0,02 mm",
        desc: "Mengukur diameter ujung besar (D = 60 mm), diameter ujung kecil (d = 26 mm), dan panjang bidang tirus aksial (l = 30 mm)."
      }
    ],

    // -----------------------------------------------------------------------
    // BUBUT 7: PEMBUATAN ULIR SEGITIGA METRIS (THREAD TURNING)
    // -----------------------------------------------------------------------
    lathe_threading: [
      {
        svgKey: "pahat_ulir_metris",
        name: "Pahat Ulir Segitiga Metris 60° (Threading Tool)",
        type: "Pahat Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "ISO Metric 60° / Holder SER 2020K16",
        spec: "Insert Karbida TiN 16ER 2.0 ISO (Profil Gigi 60° Lengkap)",
        desc: "Mata potong bersudut puncak persis 60° dengan radius pembentuk dasar ulir (r = 0,144P). Menyayat alur heliks ulir metris M20x2.0 secara bertahap."
      },
      {
        svgKey: "center_gauge",
        name: "Mal Pahat Ulir 60° (Center Gauge / Fish Gauge)",
        type: "Alat Bantu Penyetelan Kelurusan",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "ISO Metric 60° Center Gauge",
        spec: "Baja Pegas Keras | Celah V-Notch 60° & Graduasi",
        desc: "Alat bantu wajib untuk menyetel ketegaklurusan sudut mata potong pahat ulir 90° sempurna terhadap sumbu poros agar sayap ulir simetris 30°-30°."
      },
      {
        svgKey: "pitch_gauge",
        name: "Mal Kisar Ulir (Screw Pitch Gauge P = 2,0 mm)",
        type: "Alat Ukur Kisar Ulir",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 8530 ISO Metric",
        spec: "Bilah Baja | Profil Gigi Kisar P = 2,00 mm Sudut 60°",
        desc: "Memeriksa kesesuaian langkah kisar ulir hasil pemotongan poros transportir pada lintasan awal (scratch pass) sebelum sayatan diperdalam."
      },
      {
        svgKey: "mur_standar_m20",
        name: "Mur Standar Penguji M20x2.0 (Go-Gauge Nut)",
        type: "Alat Penguji Suaian Ulir",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "ISO 965 Kelas Toleransi 6H",
        spec: "Ulir Dalam Standar M20 x 2,0 Presisi",
        desc: "Sebagai alat uji kepresisian suaian ulir (Go-Gauge). Mur dipasangkan pada ulir hasil bubutan saat mesin mati; harus dapat berputar lancar tanpa goyang berlebih."
      }
    ],

    // -----------------------------------------------------------------------
    // OPERASI FRAIS (MILLING OPERATIONS TOOLS)
    // -----------------------------------------------------------------------
    milling_face: [
      {
        svgKey: "pisau_end_mill",
        name: "Pisau Frais Jari (End Mill HSS / Karbida Ø20 mm)",
        type: "Pisau Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 844 HSS-Co / Karbida Solid",
        spec: "Diameter Pisau Ø20 mm | 4-Flute Heliks",
        desc: "Pisau frais jari heliks digunakan untuk meratakan permukaan bidang atas balok secara presisi dengan pemakanan memanjang sumbu X."
      },
      {
        svgKey: "penyiku_presisi",
        name: "Penyiku Presisi & Bilah Paralel Baja",
        type: "Alat Bantu & Ukur Kesikuan",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 875/0 & DIN 874",
        spec: "Bilah Baja Dikeraskan Presisi Sepuh",
        desc: "Memeriksa kesikuan 90° bidang balok dan mendudukkan benda kerja di atas bantalan paralel pada rahang ragum mesin."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong (Vernier Caliper)",
        type: "Alat Ukur Dimensi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Kapasitas 150 mm | Ketelitian 0,02 mm",
        desc: "Mengukur tebal dan dimensi balok sebelum dan sesudah proses pengefraisan muka."
      },
      {
        svgKey: "dial_indicator",
        name: "Dial Indicator & Dudukan Magnetik",
        type: "Alat Bantu Penyetelan Kerataan",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "DIN 878",
        spec: "Ketelitian 0,01 mm",
        desc: "Menyetel kerataan permukaan meja mesin dan memeriksa kerataan bidang hasil pengefraisan."
      }
    ],

    milling_side: [
      {
        svgKey: "pisau_end_mill",
        name: "Pisau Frais Jari (End Mill HSS 4-Flute Ø16 mm)",
        type: "Pisau Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 844 HSS-Co / ISO 1648",
        spec: "Diameter Pisau Ø16 mm | 4 Mata Potong Heliks",
        desc: "Mata potong heliks samping menyayat dinding tegak balok untuk menghasilkan sudut 90° tegak lurus sempurna terhadap bidang dasar acuan."
      },
      {
        svgKey: "penyiku_presisi",
        name: "Penyiku Baja Presisi (Engineer's Square DIN 875)",
        type: "Alat Ukur Kesikuan 90°",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 875 Kelas 0",
        spec: "Baja Perkakas Dikeraskan | Sudut 90° Mutlak",
        desc: "Memverifikasi kesikuan 90° antara bidang acuan bawah dan bidang sisi samping balok hasil frais."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Presisi",
        type: "Alat Ukur Dimensi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Ketelitian 0,02 mm",
        desc: "Mengukur lebar balok setelah penyayatan sisi samping."
      }
    ],

    milling_slot: [
      {
        svgKey: "pisau_alur_t",
        name: "Pisau Frais Alur T (T-Slot Cutter DIN 851)",
        type: "Pisau Potong Utama Alur T",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 851 Form B (HSS-Co)",
        spec: "Diameter Cakram Ø22 mm | Tebal 8 mm | Leher Ø8 mm",
        desc: "Pisau profil cakram bergigi silang dengan leher silindris untuk menyayat pelebaran sayap kiri-kanan rongga alur T terbalik."
      },
      {
        svgKey: "pisau_end_mill",
        name: "Pisau Frais Jari (End Mill Pembuat Alur Awal)",
        type: "Pisau Alur Lurus Awal",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "DIN 844 HSS Ø12 mm",
        spec: "Diameter Ø12 mm (Sesuai Lebar Leher Baut T)",
        desc: "Membuat alur lurus vertikal awal sebagai jalur lintasan bebas untuk leher pisau alur T sebelum operasi pemotongan sayap alur T."
      },
      {
        svgKey: "baut_t",
        name: "Baut Alur T Standar & Mur Pengikat (DIN 787)",
        type: "Alat Penguji Suaian Alur T",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 787 Baja Tempa Kelas 8.8",
        spec: "Ulir M12 | Kepala T Standar Pas Meja",
        desc: "Menguji kelancaran masuk dan suaian geser kepala baut T ke dalam rongga alur T yang baru difrais."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Kedalaman Alur (Depth Caliper)",
        type: "Alat Ukur Presisi",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Ketelitian 0,02 mm",
        desc: "Memeriksa kedalaman leher alur dan kedalaman sayap alur T terhadap toleransi standar DIN 650."
      }
    ],

    milling_step: [
      {
        svgKey: "pisau_end_mill",
        name: "Pisau Frais Jari (End Mill HSS/Karbida Ø16 mm)",
        type: "Pisau Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 844 HSS-Co",
        spec: "Diameter Pisau Ø16 mm | 4-Flute Heliks",
        desc: "Menyayat lantai datar dan dinding siku 90° sekaligus pada sudut balok untuk membentuk bahu bertingkat presisi."
      },
      {
        svgKey: "penyiku_presisi",
        name: "Penyiku Presisi & Bilah Paralel",
        type: "Alat Ukur Kesikuan Bahu",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 875/0",
        spec: "Baja Keras Presisi",
        desc: "Memeriksa kesikuan sudut 90° antara dinding tegak undakan dan lantai datar undakan."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Kedalaman (Vernier Depth Gauge)",
        type: "Alat Ukur Kedalaman & Lebar",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Ketelitian 0,02 mm",
        desc: "Mengukur lebar bahu (W = 15 mm) dan kedalaman undakan (H = 10 mm)."
      }
    ],

    milling_segi_n: [
      {
        svgKey: "pisau_end_mill",
        name: "Pisau Frais Jari (End Mill HSS/Karbida Ø16 mm)",
        type: "Pisau Potong Utama",
        typeBadge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        standard: "DIN 844 HSS-Co / Karbida",
        spec: "Diameter Pisau Ø16 mm | Pemotongan Sisi & Muka",
        desc: "Menyayat bidang-bidang datar di sekeliling poros silindris secara berurutan untuk membentuk profil prisma segi-n (segi-6 / heksagonal)."
      },
      {
        svgKey: "kepala_pembagi",
        name: "Kepala Pembagi Universal (Dividing Head & Chuck)",
        type: "Alat Bantu Pencekam & Pembagi Sudut",
        typeBadge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        standard: "Rasio Cacing 40 : 1 | Piring Pembagi Berlubang",
        spec: "Cekam 3-Rahang Mandiri | Sudut Putar 360°",
        desc: "Mencekam poros silindris dan membagi keliling 360° menjadi 6 bagian sisi sama besar menggunakan rumus n_p = 40 / 6 = 6 2/3 putaran."
      },
      {
        svgKey: "jangka_sorong",
        name: "Jangka Sorong Presisi (Lebar Kunci s)",
        type: "Alat Ukur Jarak Kunci",
        typeBadge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        standard: "DIN 862",
        spec: "Ketelitian 0,02 mm",
        desc: "Mengukur jarak antara dua bidang datar sejajar (across-flats distance s) untuk memastikan ketepatan ukuran kepala baut segi-6."
      }
    ],

  };

  // Aliases untuk kompatibilitas
  OPERATION_TOOLS_REGISTRY.milling_polygon = OPERATION_TOOLS_REGISTRY.milling_segi_n;
  OPERATION_TOOLS_REGISTRY.milling_gear = OPERATION_TOOLS_REGISTRY.milling_segi_n;

  // =========================================================================
  // 3. RENDER FUNCTION UNTUK GALLERY DI BAWAH PARAMETER STANDAR
  // =========================================================================

  // Penyimpanan mode view aktif per indeks kartu
  const activePahatViews = {};

  function switchPahatView(idx, viewKey) {
    activePahatViews[idx] = viewKey;
    const container = document.getElementById(`pahat-view-container-${idx}`);
    if (!container) return;

    if (PAHAT_HSS_MULTI_VIEWS && PAHAT_HSS_MULTI_VIEWS[viewKey]) {
      container.innerHTML = PAHAT_HSS_MULTI_VIEWS[viewKey]();
    }

    // Perbarui penanda tombol tab yang aktif
    ["2d", "photo"].forEach((k) => {
      const btn = document.getElementById(`pahat-tab-${idx}-${k}`);
      if (btn) {
        if (k === viewKey) {
          btn.className = "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all bg-blue-600 text-white shadow-xs cursor-pointer";
        } else {
          btn.className = "px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer";
        }
      }
    });
  }

  function render(opData, containerId = "op-tools-gallery-grid", countBadgeId = "op-tools-gallery-count") {
    if (!opData) return;

    const grid = document.getElementById(containerId);
    const countBadge = document.getElementById(countBadgeId);
    if (!grid) return;

    // Ambil daftar peralatan berdasarkan operation ID (fallback ke lathe_straight jika tidak ditemukan)
    const tools = OPERATION_TOOLS_REGISTRY[opData.id] || OPERATION_TOOLS_REGISTRY.lathe_straight;

    if (countBadge) {
      countBadge.textContent = `${tools.length} Peralatan & Alat Ukur Terkait`;
    }

    grid.innerHTML = tools.map((tool, idx) => {
      // Jika merupakan Pahat Bubut HSS Rata Kanan, tampilkan dengan bilah tab interaktif 2 mode (2D & Foto Asli)
      if (tool.svgKey === "pahat_hss_rata_kanan") {
        const curView = activePahatViews[idx] || "2d";
        const viewHtml = PAHAT_HSS_MULTI_VIEWS[curView] ? PAHAT_HSS_MULTI_VIEWS[curView]() : PAHAT_HSS_MULTI_VIEWS["2d"]();

        return `
          <div class="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/80 dark:hover:border-blue-500/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <!-- Bilah Tab Interaktif Multi-View Pahat Rata Kanan (Gambar 2D & Gambar Asli) -->
              <div class="flex items-center justify-between gap-1 mb-2 bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 overflow-x-auto select-none">
                <div class="flex items-center gap-1">
                  <button type="button" onclick="OperationsTools.switchPahatView(${idx}, '2d')" id="pahat-tab-${idx}-2d" class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${curView === '2d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'} cursor-pointer" title="Proyeksi 2D Standar (Top View 80°, Depan, Samping)">
                    📏 Gambar 2D (Utama)
                  </button>
                  <button type="button" onclick="OperationsTools.switchPahatView(${idx}, 'photo')" id="pahat-tab-${idx}-photo" class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${curView === 'photo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'} cursor-pointer" title="Slot Dokumentasi Foto Asli">
                    📷 Gambar Asli
                  </button>
                </div>
                <span class="text-[9px] font-mono text-slate-400 px-1 hidden sm:inline-block">${tool.standard}</span>
              </div>

              <!-- Wadah Gambar Ilustrasi (Aspect Ratio 2:1) -->
              <div id="pahat-view-container-${idx}" class="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-slate-950 shadow-inner border border-slate-800/80 mb-2.5 flex items-center justify-center group-hover:scale-[1.005] transition-transform duration-200">
                ${viewHtml}
              </div>
            </div>

            <!-- Metadata & Deskripsi Teknik -->
            <div class="space-y-1.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold ${tool.typeBadge}">
                  ${tool.type}
                </span>
              </div>

              <h5 class="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                ${tool.name}
              </h5>

              <div class="text-[11px] font-mono text-blue-600 dark:text-blue-400 leading-tight">
                ${tool.spec}
              </div>

              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans line-clamp-3">
                ${tool.desc}
              </p>
            </div>
          </div>
        `;
      }

      // Ambil generator SVG standar untuk alat selain pahat rata kanan
      const svgFunc = SVG_LIBRARY[tool.svgKey] || SVG_LIBRARY.pahat_rata_kanan;
      const svgHtml = svgFunc();

      return `
        <div class="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500/80 dark:hover:border-blue-500/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <!-- Illustration Box (Aspect Ratio 2:1 Technical Drawing) -->
          <div class="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-slate-900 shadow-inner border border-slate-800/80 mb-2.5 flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-200">
            ${svgHtml}
            <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-slate-300 border border-slate-700/60">
              ${tool.standard}
            </div>
          </div>

          <!-- Metadata & Description -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded-full text-[9.5px] font-bold ${tool.typeBadge}">
                ${tool.type}
              </span>
            </div>

            <h5 class="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              ${tool.name}
            </h5>

            <div class="text-[11px] font-mono text-blue-600 dark:text-blue-400 leading-tight">
              ${tool.spec}
            </div>

            <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans line-clamp-3">
              ${tool.desc}
            </p>
          </div>
        </div>
      `;
    }).join("");
  }

  // Public API
  return {
    render,
    switchPahatView,
    getTools: (opId) => OPERATION_TOOLS_REGISTRY[opId] || OPERATION_TOOLS_REGISTRY.lathe_straight,
    views: PAHAT_HSS_MULTI_VIEWS
  };
})();

// Export ke window agar dapat diakses dari app.js
if (typeof window !== "undefined") {
  window.OperationsTools = OperationsTools;
}
