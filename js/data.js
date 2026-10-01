/**
 * Curriculum Data, Machine Anatomy, K3 Rules & Materials Database
 */
const AppData = {
  curriculum: {
    title: "Teknik Pemesinan Konvensional (Bubut & Frais)",
    level: "SMK Kelas XI / XII — Fase F (Kurikulum Merdeka)",
    cp: "Pada akhir fase F, peserta didik mampu menerapkan prosedur K3LH, mengidentifikasi bagian-bagian dan fungsi mesin bubut dan frais, menentukan parameter pemotongan (kecepatan potong, putaran mesin, feeding, waktu pemesinan), serta mensimulasikan proses pembubutan dan pengefraisan sesuai Standar Operasional Prosedur (SOP).",
    tp: [
      {
        id: "TP-01",
        title: "Penerapan K3LH di Bengkel Mesin",
        desc: "Menerapkan kepatuhan penggunaan APD yang benar dan mengenali potensi bahaya permesinan berputar sesuai standar industri (Zero Accident).",
        icon: "shield-check"
      },
      {
        id: "TP-02",
        title: "Identifikasi Anatomi Mesin Bubut & Frais",
        desc: "Mengidentifikasi fungsi mekanisme dari kepala tetap, eretan, kepala lepas, meja, spindle, dan poros penggerak.",
        icon: "cpu"
      },
      {
        id: "TP-03",
        title: "Kalkulasi Parameter Pemotongan",
        desc: "Menghitung putaran spindle (n), kecepatan potong (Cs), kecepatan pemakanan (f), dan durasi pembubutan/pengefraisan (tc).",
        icon: "calculator"
      },
      {
        id: "TP-04",
        title: "Analisis Hasil Kualitas Permukaan (Ra)",
        desc: "Menganalisis korelasi antara parameter pemotongan terhadap keausan pahat, terjadinya getaran (chatter), dan kualitas kehalusan permukaan benda kerja.",
        icon: "sparkles"
      }
    ]
  },

  k3: {
    items: [
      {
        id: "kacamata",
        name: "Kacamata Safety (Eye Protection)",
        category: "mandatory",
        icon: "glasses",
        image: "img/k3/kacamata.svg",
        description: "Melindungi mata dari percikan tatal/geram panas yang terlempar saat penyayatan logam berputar.",
        required: true
      },
      {
        id: "wearpack",
        name: "Pakaian Kerja / Wearpack Rapi",
        category: "mandatory",
        icon: "shirt",
        image: "img/k3/wearpack.svg",
        description: "Pakaian terstandar lengan berkancing rapat. Ujung baju tidak boleh menjuntai agar tidak terlilit benda berputar.",
        required: true
      },
      {
        id: "sepatu",
        name: "Sepatu Safety (Steel Toe Shoes)",
        category: "mandatory",
        icon: "footprints",
        image: "img/k3/sepatu.svg",
        description: "Melindungi kaki dari kejatuhan benda kerja berat, chuck, dongkrak, serta tusukan tatal tajam di lantai.",
        required: true
      },
      // Prohibited / dangerous items
      {
        id: "sarung_tangan",
        name: "Sarung Tangan Tebal",
        category: "prohibited",
        icon: "hand",
        image: "img/k3/sarung-tangan.svg",
        description: "DILARANG KERAS dipakai saat mengoperasikan mesin berputar! Serat sarung tangan sangat mudah tersangkut putaran cekam dan menarik tangan operator ke dalam mesin.",
        required: false
      },
      {
        id: "cincin_jam",
        name: "Cincin & Jam Tangan Logam",
        category: "prohibited",
        icon: "watch",
        image: "img/k3/perhiasan.svg",
        description: "DILARANG! Aksesoris tangan dapat tersangkut pada tatal logam spiral atau roda gigi, berisiko amputasi fatal.",
        required: false
      },
      {
        id: "dasi_syal",
        name: "Dasi / Kain Menjuntai",
        category: "prohibited",
        icon: "alert-octagon",
        image: "img/k3/dasi.svg",
        description: "DILARANG! Benda menggantung di leher adalah bahaya fatal terlilit spindel utama dalam hitungan detik.",
        required: false
      }
    ],
    rules: [
      "Pastikan kunci chuck (cekam) selalu dicabut SEGERA setelah mengencangkan atau melepas benda kerja.",
      "Jangan pernah membersihkan tatal/geram menggunakan tangan telanjang saat spindle masih berputar, gunakan kuas atau kait pembersih!",
      "Ketahui posisi tombol EMERGENCY STOP pada mesin sebelum menekan tombol START.",
      "Jangan mengukur benda kerja dengan jangka sorong/mikrometer saat benda masih dalam kondisi berputar."
    ]
  },

  latheParts: [
    {
      id: "headstock",
      name: "Kepala Tetap (Headstock)",
      x: 18,
      y: 35,
      desc: "Rumah transmisi roda gigi (gearbox) pengatur putaran spindle dan pemegang cekam utama.",
      detail: "Di dalamnya terdapat mekanisme roda gigi pengubah kecepatan RPM dan tuas pembalik arah ulir/feeding. Komponen ini menopang spindel utama yang berputar dengan presisi tinggi."
    },
    {
      id: "chuck",
      name: "Cekam / Spindle Chuck",
      x: 34,
      y: 36,
      desc: "Alat pencekam benda kerja silindris yang terhubung langsung ke poros spindel utama.",
      detail: "Umumnya berupa cekam rahang tiga sepusat (3-jaw self centering) atau cekam rahang empat mandiri (4-jaw independent) untuk benda kerja tidak beraturan."
    },
    {
      id: "toolpost",
      name: "Rumah Pahat (Toolpost) & Pahat Rata Kanan",
      x: 48,
      y: 32,
      desc: "Tempat menjepit mata pahat bubut rata kanan untuk penyayatan memanjang dari arah kanan ke kiri.",
      detail: "Dapat diputar 360 derajat. Pada pembubutan luar memanjang konvensional, digunakan Pahat Rata Kanan (ISO 6 / DIN 4980) yang menyayat dari arah kepala lepas (kanan) bergerak menuju cekam/kepala tetap (kiri) agar gaya potong tertumpu kokoh ke arah spindel utama."
    },
    {
      id: "carriage",
      name: "Eretan Pembawa (Carriage)",
      x: 52,
      y: 52,
      desc: "Unit yang bergerak memanjang di atas alas mesin untuk membawa eretan lintang dan eretan atas.",
      detail: "Dilengkapi tuas pemakanan otomatis (feed lever) dan setengah mur (half-nut) untuk proses pembuatan ulir."
    },
    {
      id: "cross_slide",
      name: "Eretan Lintang (Cross Slide)",
      x: 50,
      y: 40,
      desc: "Menggerakkan pahat tegak lurus sumbu kerja untuk menyayat muka (facing) dan mengatur kedalaman potong.",
      detail: "Dilengkapi piringan skala bergraduasi (vernier dial) dengan ketelitian hingga 0.02 mm."
    },
    {
      id: "tailstock",
      name: "Kepala Lepas (Tailstock)",
      x: 78,
      y: 36,
      desc: "Penumpu ujung benda kerja panjang menggunakan senter putar (live center) dan pemegang chuck bor.",
      detail: "Dapat digeser sepanjang alas mesin dan dikunci dengan tuas pengunci. Selongsongnya memiliki skala kedalaman pengeboran."
    },
    {
      id: "bed",
      name: "Alas / Meja Mesin (Bed)",
      x: 55,
      y: 65,
      desc: "Rangka landasan yang sangat kokoh dan presisi tempat eretan dan kepala lepas meluncur.",
      detail: "Terbuat dari besi cor kelabu (cast iron) berkualitas tinggi yang telah mengalami proses stabilisasi tegangan untuk meredam getaran."
    },
    {
      id: "lead_screw",
      name: "Poros Transporir (Lead Screw)",
      x: 50,
      y: 72,
      desc: "Poros berulir trapesium presisi tinggi untuk menggerakkan eretan secara otomatis saat membuat ulir.",
      detail: "Digerakkan melalui susunan roda gigi pengganti (*change gears*) dari kepala tetap."
    },
    {
      id: "emergency_stop",
      name: "Tuas / Tombol Emergency",
      x: 20,
      y: 65,
      desc: "Sakelar pemutus arus seketika untuk menghentikan putaran motor saat terjadi kondisi abnormal atau bahaya.",
      detail: "Wajib dihafal posisinya oleh setiap operator sebelum mulai menyalakan mesin!"
    }
  ],

  millingParts: [
    {
      id: "motor",
      name: "Motor Penggerak Utama",
      x: 47,
      y: 6,
      desc: "Motor listrik induksi penggerak spindel utama dengan sirip pendingin eksternal.",
      detail: "Terpasang vertikal di bagian atas kepala mesin. Menyalurkan daya putaran ke poros spindel melalui mekanisme transmisi puli/sabuk bertingkat atau susunan roda gigi pengubah kecepatan."
    },
    {
      id: "ram_head",
      name: "Kepala Mesin (Head / Milling Head)",
      x: 39,
      y: 15,
      desc: "Unit kepala pengefrais vertikal penopang poros spindel dan tuas pengatur kecepatan.",
      detail: "Dapat dimiringkan hingga sudut tertentu (swivel head) untuk pengefraisan bersudut. Dilengkapi tuas gerak selongsong manual (quill feed lever), tuas selektor kecepatan High/Low, dan roda pemakanan halus (fine feed)."
    },
    {
      id: "spindle_milling",
      name: "Spindel, Arbor & Pisau Frais (Spindle, Arbor & End Mill)",
      x: 41,
      y: 34,
      desc: "Poros putar vertikal dilengkapi Arbor collet chuck pencekam pisau frais (End Mill).",
      detail: "Poros spindel presisi standar tirus ISO/NT40. Terhubung dengan Arbor pemegang alat potong (tool holder) dan mur collet ER32 yang mencekam pisau frais jari (End Mill) karbida untuk menyayat alur pemakanan pada benda kerja."
    },
    {
      id: "column",
      name: "Kolom / Badan Mesin (Column)",
      x: 58,
      y: 39,
      desc: "Rangka tegak kokoh penyangga kepala mesin, alur luncur vertikal, dan panel kontrol listrik.",
      detail: "Terbuat dari besi cor berkualitas tinggi yang meredam getaran pemotongan. Pada bagian depan terdapat alur luncur vertikal presisi yang dilindungi karet pelindung bergelombang (accordion way bellow)."
    },
    {
      id: "panel_kontrol",
      name: "Panel Kontrol Digital (DRO - Digital Readout)",
      x: 72,
      y: 21,
      desc: "Layar pembaca digital posisi koordinat sumbu X, Y, dan Z secara presisi dan real-time.",
      detail: "Menampilkan nilai perpindahan meja dan eretan dalam satuan milimeter dengan resolusi tinggi (0.001 mm). Dilengkapi tombol keypad matriks untuk pengaturan titik nol (zeroing) dan fungsi matematika pemesinan."
    },
    {
      id: "ragum",
      name: "Ragum Penjepit (Machine Vise)",
      x: 45,
      y: 51,
      desc: "Alat pencekam benda kerja yang dibaut kencang pada alur T meja mesin frais.",
      detail: "Memiliki rahang penjepit presisi dari baja yang dikeraskan serta landasan putar (swivel base) berderajat untuk menyayat bidang bersudut dengan aman dan kokoh."
    },
    {
      id: "table",
      name: "Meja Kerja (Table - Sumbu X)",
      x: 32,
      y: 55,
      desc: "Landasan beralur T tempat menjepit ragum/benda kerja yang bergerak memanjang (Sumbu X).",
      detail: "Memiliki 3 alur T presisi untuk baut pengikat dan parit penampung cairan pendingin. Digerakkan memanjang secara manual melalui Handwheel X atau secara otomatis."
    },
    {
      id: "saddle",
      name: "Sadel / Eretan Melintang (Saddle - Sumbu Y)",
      x: 46,
      y: 64,
      desc: "Dudukan meja kerja yang bergerak melintang maju-mundur mendekati/menjauhi kolom (Sumbu Y).",
      detail: "Meluncur di atas bidang ekor burung (dovetail) lutut untuk mengontrol posisi kedalaman melintang pemakanan dengan bantuan poros transportir ulir presisi."
    },
    {
      id: "knee",
      name: "Lutut Mesin (Knee - Sumbu Z)",
      x: 49,
      y: 73,
      desc: "Penopang sadel dan meja yang bergerak vertikal naik-turun mengatur kedalaman pemotongan (Sumbu Z).",
      detail: "Ditopang oleh poros ulir vertikal teleskopik (elevating screw) yang kokoh dan meluncur pada rel kolom vertikal."
    },
    {
      id: "handwheel_x",
      name: "Handwheel X (Gerak Memanjang)",
      x: 76,
      y: 63,
      desc: "Roda pemutar manual di ujung meja untuk menggerakkan meja kerja pada arah sumbu X.",
      detail: "Dilengkapi cincin skala graduasi mikro (micrometer collar dial) berketelitian hingga 0.02 mm untuk penyayatan memanjang yang presisi."
    },
    {
      id: "handwheel_y",
      name: "Handwheel Y (Gerak Melintang)",
      x: 33,
      y: 68,
      desc: "Roda pemutar manual di bagian depan sadel untuk menggerakkan meja maju-mundur pada sumbu Y.",
      detail: "Mengatur posisi pemakanan melintang benda kerja secara halus dengan bantuan piringan skala bergraduasi."
    },
    {
      id: "handwheel_z",
      name: "Handwheel Z (Gerak Vertikal)",
      x: 41,
      y: 76,
      desc: "Roda pemutar manual di bagian lutut untuk menaikkan atau menurunkan posisi meja (sumbu Z).",
      detail: "Mengatur ketinggian meja kerja secara vertikal untuk menentukan ketebalan pemakanan (depth of cut) pisau frais terhadap benda kerja."
    },
    {
      id: "base",
      name: "Alas Mesin (Base)",
      x: 52,
      y: 88,
      desc: "Pondasi dasar kokoh penopang seluruh rangka mesin frais dan bak penampung cairan pendingin.",
      detail: "Terbuat dari besi cor berat padat dengan rusuk pengaku internal untuk meredam getaran ekstrem dan menampung sirkulasi cairan pendingin (coolant)."
    }
  ],

  materials: [
    {
      id: "mild_steel",
      name: "Baja Lunak / Mild Steel (ST 37)",
      desc: "Baja konstruksi umum, ulet dan mudah dimesin.",
      hardness: "120 - 160 HB",
      csHSS: { min: 20, max: 30, recommended: 25 },
      csCarbide: { min: 80, max: 150, recommended: 110 },
      recommendedFeed: { min: 0.1, max: 0.3, default: 0.18 },
      colorHex: "#94a3b8"
    },
    {
      id: "aluminum",
      name: "Aluminium Paduan (6061-T6)",
      desc: "Logam ringan, konduktor panas tinggi, membutuhkan putaran tinggi.",
      hardness: "60 - 95 HB",
      csHSS: { min: 60, max: 120, recommended: 90 },
      csCarbide: { min: 200, max: 500, recommended: 320 },
      recommendedFeed: { min: 0.15, max: 0.45, default: 0.25 },
      colorHex: "#cbd5e1"
    },
    {
      id: "brass",
      name: "Kuningan / Brass (CuZn)",
      desc: "Mudah disayat, tatal cenderung getas putus-putus, permukaan halus mengkilap.",
      hardness: "90 - 140 HB",
      csHSS: { min: 30, max: 60, recommended: 45 },
      csCarbide: { min: 120, max: 220, recommended: 160 },
      recommendedFeed: { min: 0.1, max: 0.35, default: 0.2 },
      colorHex: "#eab308"
    },
    {
      id: "cast_iron",
      name: "Besi Cor Kelabu (FC 250)",
      desc: "Getas, mengandung grafit bebas, menghasilkan tatal serbuk tanpa tatal spiral.",
      hardness: "180 - 240 HB",
      csHSS: { min: 15, max: 22, recommended: 18 },
      csCarbide: { min: 60, max: 100, recommended: 80 },
      recommendedFeed: { min: 0.12, max: 0.3, default: 0.16 },
      colorHex: "#64748b"
    },
    {
      id: "stainless_steel",
      name: "Baja Tahan Karat / Stainless (SUS 304)",
      desc: "Keras, liat, cepat mengalami work-hardening jika putaran terlalu lambat/pahat tumpul.",
      hardness: "180 - 220 HB",
      csHSS: { min: 12, max: 18, recommended: 15 },
      csCarbide: { min: 60, max: 95, recommended: 75 },
      recommendedFeed: { min: 0.08, max: 0.2, default: 0.12 },
      colorHex: "#e2e8f0"
    }
  ],

  toolTypes: [
    {
      id: "hss",
      name: "Pahat / Pisau HSS (High Speed Steel)",
      desc: "Baja kecepatan tinggi, ekonomis, ulet, tahan kejut, namun batas suhu potong maks ~600°C.",
      maxTemp: 600,
      multiplier: 1.0
    },
    {
      id: "carbide",
      name: "Pahat Karbida / Carbide Insert",
      desc: "Keras dan tahan panas hingga 1000°C, mampu bekerja pada kecepatan potong 3-4x lipat HSS.",
      maxTemp: 1000,
      multiplier: 3.5
    }
  ],

  quizChallenges: [
    {
      id: "q1",
      level: 1,
      category: "K3",
      question: "Saat mengoperasikan mesin bubut konvensional yang sedang berputar kencang, perlengkapan manakah yang DILARANG KERAS dipakai oleh operator?",
      options: [
        "Kacamata safety pelindung percikan",
        "Sarung tangan kain/kulit tebal",
        "Sepatu safety bersol anti-slip",
        "Wearpack pakaian kerja pas di badan"
      ],
      correct: 1,
      explanation: "Sarung tangan DILARANG saat mengoperasikan mesin berputar karena serat kain dapat tersangkut putaran benda kerja/chuck dan menarik tangan operator ke dalam mesin!"
    },
    {
      id: "q2",
      level: 1,
      category: "Anatomi Bubut",
      question: "Komponen mesin bubut yang berfungsi untuk menopang ujung benda kerja yang panjang dan menempatkan mata bor adalah...",
      options: [
        "Kepala Tetap (Headstock)",
        "Eretan Lintang (Cross Slide)",
        "Kepala Lepas (Tailstock)",
        "Poros Transporir (Lead Screw)"
      ],
      correct: 2,
      explanation: "Kepala Lepas (Tailstock) dipasang di ujung kanan alas mesin untuk menopang benda kerja panjang dengan senter putar atau memasang chuck bor."
    },
    {
      id: "q3",
      level: 2,
      category: "Perhitungan Bubut",
      question: "Sebuah poros baja lunak berdiameter 50 mm akan dibubut menggunakan pahat HSS dengan kecepatan potong Cs = 25 m/menit. Berapakah putaran mesin (n) teoritis yang tepat?",
      formulaHint: "n = (1000 x Cs) / (π x d)",
      options: [
        "~80 RPM",
        "~160 RPM",
        "~320 RPM",
        "~540 RPM"
      ],
      correct: 1,
      explanation: "n = (1000 x 25) / (3.14 x 50) = 25.000 / 157 = 159.2 RPM (dibulatkan menjadi sekitar 160 RPM)."
    },
    {
      id: "q4",
      level: 2,
      category: "Kualitas Permukaan",
      question: "Jika seorang operator menyetel putaran spindel jauh melebihi batas kecepatan potong material tanpa pendingin, apakah dampak yang paling mungkin terjadi pada benda kerja dan pahat?",
      options: [
        "Benda kerja menjadi sangat halus mengkilap tanpa cacat",
        "Pahat mengalami overheat membara, timbul asap, dan benda kerja hangus membiru",
        "Putaran mesin melambat secara otomatis tanpa perubahan suhu",
        "Geram tatal menjadi putus-putus berbentuk serbuk halus"
      ],
      correct: 1,
      explanation: "Kecepatan potong berlebih tanpa pendingin menimbulkan panas ekstrem (thermal stress) yang membuat pahat kehilangan kekerasannya (tumpul terbakar) dan permukaan benda kerja gosong membiru."
    },
    {
      id: "q5",
      level: 3,
      category: "Anatomi Frais",
      question: "Pada mesin frais, sumbu gerakan yang mengatur kedalaman pemotongan secara vertikal (naik-turunnya lutut meja mesin) adalah sumbu...",
      options: [
        "Sumbu X (Memanjang)",
        "Sumbu Y (Melintang)",
        "Sumbu Z (Vertikal)",
        "Sumbu A (Rotasi)"
      ],
      correct: 2,
      explanation: "Sumbu Z pada mesin frais mengontrol gerakan vertikal (tegak lurus) yang mengatur kedalaman pemakanan melalui pergerakan lutut (knee)."
    },
    {
      id: "q6",
      level: 2,
      category: "Perhitungan Frais",
      question: "Akan dibuat alur pada balok baja ST37 menggunakan pisau frais jari (End Mill) HSS berdiameter Ø 20 mm dengan kecepatan potong Cs = 25 m/menit. Berapakah putaran spindel (n) yang tepat?",
      formulaHint: "n = (1000 x Cs) / (π x d_endmill)",
      options: [
        "~100 RPM",
        "~200 RPM",
        "~400 RPM",
        "~800 RPM"
      ],
      correct: 2,
      explanation: "n = (1000 x 25) / (π x 20) = 25.000 / 62.83 = 397.9 RPM (~400 RPM). Pada proses pengefraisan, diameter (d) yang digunakan dalam rumus adalah diameter alat potong (pisau End Mill), bukan dimensi benda kerja."
    },
    {
      id: "q7",
      level: 2,
      category: "Perkakas Frais",
      question: "Perangkat pemegang alat potong pada mesin frais vertikal yang berfungsi untuk mencekam tangkai pisau frais jari (End Mill) dengan presisi tinggi dan terhubung ke spindel utama disebut...",
      options: [
        "Kepala Lepas (Tailstock)",
        "Arbor Collet Chuck",
        "Eretan Atas (Compound Rest)",
        "Pelat Pembawa (Lathe Dog)"
      ],
      correct: 1,
      explanation: "Arbor Collet Chuck (seperti standar tirus NT40/BT40 dengan mur collet ER32) adalah adaptor presisi tinggi yang dipasang pada hidung poros spindel untuk menjepit tangkai silindris pisau frais jari (End Mill)."
    },
    {
      id: "q8",
      level: 3,
      category: "Geometri Frais",
      question: "Saat melakukan pengefraisan alur lurus (slotting) dengan pisau frais jari (End Mill) dalam satu lintasan pemotongan, faktor apakah yang secara langsung menentukan LEBAR alur yang dihasilkan pada benda kerja?",
      options: [
        "Panjang total pisau frais",
        "Diameter pisau End Mill yang dipakai",
        "Jumlah gigi potong pisau",
        "Kecepatan pemakanan meja (feed rate)"
      ],
      correct: 1,
      explanation: "Pada pemotongan alur (slotting) satu lintasan, lebar alur yang terbentuk pada permukaan benda kerja selalu sama persis dengan diameter luar pisau frais jari (End Mill) yang digunakan."
    }
  ],

  // ==================== QUIZ 1: LEMBAR KERJA 1 (LK-1) PARAMETER BUBUT ====================
  // Sumber: D:\PPG\Courses\PPL\pembelajaran\Parameter\02_LK1_Parameter_Bubut.docx
  quiz1Challenges: [
    // ---------- KASUS 1: POROS BAJA LUNAK ST-37 (PAHAT CARBIDE) ----------
    {
      id: "lk1_q1",
      caseNum: 1,
      caseTitle: "Studi Kasus 1: Pembubutan Poros Baja Lunak ST-37",
      caseDescription: "Sebuah poros baja lunak ST-37 akan dibubut menggunakan pahat carbide. Data parameter:\n• Vc rekomendasi = 100 m/min\n• Diameter awal (d) = 40 mm, diameter akhir = 34 mm\n• Panjang pemotongan (L) = 80 mm\n• Gerak makan (f) = 0,2 mm/rev\n(Petunjuk perhitungan: Gunakan π = 3,14159)",
      level: 1,
      category: "Putaran Spindle (n)",
      question: "Soal 1.a — Hitunglah putaran spindle mesin bubut (n) dalam satuan RPM!",
      formulaHint: "n = (1000 · Vc) / (π · d)",
      options: [
        "550 RPM",
        "796 RPM",
        "980 RPM",
        "1.250 RPM"
      ],
      correct: 1,
      explanation: "n = (1000 · Vc) / (π · d) = (1000 · 100) / (3,14159 · 40) = 100.000 / 125,6636 ≈ 795,77 RPM. Dibulatkan ke putaran standar mesin terdekat yaitu 796 RPM."
    },
    {
      id: "lk1_q2",
      caseNum: 1,
      caseTitle: "Studi Kasus 1: Pembubutan Poros Baja Lunak ST-37",
      level: 1,
      category: "Kedalaman Potong (ap)",
      question: "Soal 1.b — Hitunglah kedalaman potong radial (ap) pada proses pembubutan poros tersebut!",
      formulaHint: "ap = (d_awal - d_akhir) / 2",
      options: [
        "1,5 mm",
        "2,0 mm",
        "3,0 mm",
        "6,0 mm"
      ],
      correct: 2,
      explanation: "ap = (d_awal - d_akhir) / 2 = (40 mm - 34 mm) / 2 = 6 mm / 2 = 3,0 mm. Pada pembubutan silindris lurus, kedalaman potong radial adalah setengah dari selisih diameter total benda kerja."
    },
    {
      id: "lk1_q3",
      caseNum: 1,
      caseTitle: "Studi Kasus 1: Pembubutan Poros Baja Lunak ST-37",
      level: 2,
      category: "Waktu Pemesinan (tm)",
      question: "Soal 1.c — Hitunglah waktu pemesinan teoritis (tm) yang diperlukan untuk membubut panjang L = 80 mm!",
      formulaHint: "tm = L / (f · n)",
      options: [
        "0,25 menit (15 detik)",
        "0,50 menit (30 detik)",
        "1,20 menit (72 detik)",
        "2,50 menit (150 detik)"
      ],
      correct: 1,
      explanation: "tm = L / (f · n) = 80 / (0,2 · 795,77) = 80 / 159,155 ≈ 0,5026 menit (~0,50 menit atau sekitar 30,2 detik)."
    },
    {
      id: "lk1_q4",
      caseNum: 1,
      caseTitle: "Studi Kasus 1: Pembubutan Poros Baja Lunak ST-37",
      level: 2,
      category: "Laju Pembuangan Geram (MRR)",
      question: "Soal 1.d — Hitunglah laju pembuangan material atau geram (Material Removal Rate / MRR) dalam mm³/min!",
      formulaHint: "MRR = f · ap · Vc · 1000",
      options: [
        "24.000 mm³/min",
        "36.000 mm³/min",
        "60.000 mm³/min",
        "120.000 mm³/min"
      ],
      correct: 2,
      explanation: "MRR = f · ap · Vc · 1000 = 0,2 mm/rev · 3,0 mm · 100 m/min · 1000 = 60.000 mm³/min."
    },

    // ---------- KASUS 2: POROS ALUMINIUM FINISHING ----------
    {
      id: "lk1_q5",
      caseNum: 2,
      caseTitle: "Studi Kasus 2: Pembubutan Finishing Poros Aluminium",
      caseDescription: "Poros aluminium akan dibubut finishing dengan hasil akhir yang halus. Data parameter:\n• Diameter benda kerja (d) = 25 mm\n• Kecepatan potong Vc = 150 m/min\n• Gerak makan (f) = 0,08 mm/rev\n• Kedalaman potong (ap) = 0,3 mm\n• Panjang pemotongan (L) = 120 mm",
      level: 2,
      category: "Putaran Spindle (n)",
      question: "Soal 2.a — Hitunglah putaran spindle mesin (n) untuk finishing poros aluminium tersebut!",
      formulaHint: "n = (1000 · Vc) / (π · d)",
      options: [
        "950 RPM",
        "1.200 RPM",
        "1.910 RPM",
        "2.450 RPM"
      ],
      correct: 2,
      explanation: "n = (1000 · Vc) / (π · d) = (1000 · 150) / (3,14159 · 25) = 150.000 / 78,5398 ≈ 1.909,86 RPM ≈ 1.910 RPM."
    },
    {
      id: "lk1_q6",
      caseNum: 2,
      caseTitle: "Studi Kasus 2: Pembubutan Finishing Poros Aluminium",
      level: 2,
      category: "Waktu Pemesinan (tm)",
      question: "Soal 2.b — Hitunglah waktu pemesinan (tm) untuk finishing poros aluminium sepanjang 120 mm!",
      formulaHint: "tm = L / (f · n)",
      options: [
        "0,45 menit (27 detik)",
        "0,79 menit (47 detik)",
        "1,50 menit (90 detik)",
        "2,10 menit (126 detik)"
      ],
      correct: 1,
      explanation: "tm = L / (f · n) = 120 / (0,08 · 1.909,86) = 120 / 152,789 ≈ 0,7854 menit (~0,79 menit atau sekitar 47,1 detik)."
    },
    {
      id: "lk1_q7",
      caseNum: 2,
      caseTitle: "Studi Kasus 2: Pembubutan Finishing Poros Aluminium",
      level: 3,
      category: "Analisis Variasi Vc & Kualitas",
      question: "Soal 2.c — Jika Vc dinaikkan 20%, berapa putaran n yang baru dan bagaimana pengaruhnya terhadap kualitas permukaan?",
      formulaHint: "Vc_baru = 150 · 1,2 = 180 m/min; n_baru = (1000 · Vc_baru) / (π · d)",
      options: [
        "n = 1.600 RPM; permukaan menjadi kasar karena getaran spindle meningkat",
        "n = 2.292 RPM; kualitas permukaan lebih halus karena meminimalkan Built-Up Edge (BUE)",
        "n = 2.800 RPM; benda kerja melengkung dan timbul bekas chatter terbakar",
        "n = 1.910 RPM; tidak ada perubahan putaran mesin maupun kualitas permukaan"
      ],
      correct: 1,
      explanation: "Vc baru = 150 · 1,20 = 180 m/min. n_baru = (1000 · 180) / (3,14159 · 25) ≈ 2.291,83 RPM ≈ 2.292 RPM (naik 20%). Pada finishing aluminium, kenaikan Vc mencegah terbentuknya tatal tempel (Built-Up Edge / BUE) sehingga menghasilkan sayatan yang sangat bersih dan nilai kekasaran permukaan Ra menjadi jauh lebih halus."
    },

    // ---------- KASUS 3: OPTIMASI BAJA S45C SET A VS SET B ----------
    {
      id: "lk1_q8",
      caseNum: 3,
      caseTitle: "Studi Kasus 3: Optimasi Parameter Pembubutan Baja S45C",
      caseDescription: "Operator mesin memiliki dua pilihan parameter untuk membubut baja S45C dengan d = 50 mm dan L = 100 mm:\n• Set A: Vc = 80 m/min, f = 0,3 mm/rev, ap = 2,0 mm\n• Set B: Vc = 60 m/min, f = 0,15 mm/rev, ap = 1,0 mm",
      level: 2,
      category: "Kalkulasi Set A",
      question: "Soal 3.a — Hitunglah putaran spindel (n), waktu pemesinan (tm), dan MRR untuk kombinasi Set A!",
      formulaHint: "nA = (1000 · Vc)/(π · d); tmA = L/(f · n); MRR_A = f · ap · Vc · 1000",
      options: [
        "n = 350 RPM; tm = 1,20 menit; MRR = 24.000 mm³/min",
        "n = 509 RPM; tm = 0,65 menit; MRR = 48.000 mm³/min",
        "n = 620 RPM; tm = 0,85 menit; MRR = 36.000 mm³/min",
        "n = 750 RPM; tm = 0,40 menit; MRR = 60.000 mm³/min"
      ],
      correct: 1,
      explanation: "Perhitungan Set A:\n• n = (1000 · 80) / (3,14159 · 50) ≈ 509,3 RPM (509 RPM)\n• tm = 100 / (0,3 · 509,3) ≈ 0,654 menit (~0,65 menit atau 39,3 detik)\n• MRR = 0,3 · 2,0 · 80 · 1000 = 48.000 mm³/min."
    },
    {
      id: "lk1_q9",
      caseNum: 3,
      caseTitle: "Studi Kasus 3: Optimasi Parameter Pembubutan Baja S45C",
      level: 2,
      category: "Kalkulasi Set B",
      question: "Soal 3.b — Hitunglah putaran spindel (n), waktu pemesinan (tm), dan MRR untuk kombinasi Set B!",
      formulaHint: "nB = (1000 · Vc)/(π · d); tmB = L/(f · n); MRR_B = f · ap · Vc · 1000",
      options: [
        "n = 250 RPM; tm = 2,50 menit; MRR = 4.500 mm³/min",
        "n = 382 RPM; tm = 1,75 menit; MRR = 9.000 mm³/min",
        "n = 450 RPM; tm = 1,10 menit; MRR = 12.000 mm³/min",
        "n = 500 RPM; tm = 1,50 menit; MRR = 15.000 mm³/min"
      ],
      correct: 1,
      explanation: "Perhitungan Set B:\n• n = (1000 · 60) / (3,14159 · 50) ≈ 381,97 RPM (382 RPM)\n• tm = 100 / (0,15 · 381,97) ≈ 1,745 menit (~1,75 menit atau 104,7 detik)\n• MRR = 0,15 · 1,0 · 60 · 1000 = 9.000 mm³/min."
    },
    {
      id: "lk1_q10",
      caseNum: 3,
      caseTitle: "Studi Kasus 3: Optimasi Parameter Pembubutan Baja S45C",
      level: 3,
      category: "Analisis Trade-Off Industri",
      question: "Soal 3.c — Dari kedua pilihan tersebut, set mana yang lebih produktif dan set mana yang lebih baik untuk kualitas permukaan?",
      options: [
        "Set B lebih produktif karena pemotongannya lambat sehingga hemat daya mesin",
        "Set A lebih produktif (MRR 48.000 mm³/min, tm 0,65 min / roughing), sedangkan Set B lebih baik untuk kualitas permukaan (f=0,15, ap=1,0 / finishing)",
        "Kedua set menghasilkan kualitas permukaan dan produktivitas yang sama persis",
        "Set A cocok untuk finishing karena getarannya lebih besar sehingga memecah geram"
      ],
      correct: 1,
      explanation: "Analisis Trade-off Rekayasa:\n• Set A unggul secara PRODUKTIVITAS karena menghasilkan MRR 48.000 mm³/min (5,3 kali lebih banyak) dan waktu pemesinan hanya 0,65 menit (jauh lebih cepat), ideal untuk pembubutan kasar (roughing).\n• Set B unggul dalam KUALITAS PERMUKAAN karena feeding f kecil (0,15 mm/rev) dan ap dangkal (1,0 mm) menghasilkan gaya potong minimal dan nilai kekasaran permukaan Ra yang halus, ideal untuk pembubutan halus (finishing)."
    }
  ],

  // Rangkuman Resmi Jawaban Lembar Kerja 1 (LK-1)
  quiz1SummaryTable: [
    {
      no: "1",
      soal: "Soal 1 — Poros Baja Lunak ST-37 (Pahat Karbida)",
      parameter: "Vc=100, d=40→34 mm, L=80, f=0,2, ap=3,0",
      n: "796 RPM",
      tm: "0,50 menit (30 dtk)",
      mrr: "60.000 mm³/min",
      catatan: "Roughing efisien, tatal teratur"
    },
    {
      no: "2",
      soal: "Soal 2 — Poros Aluminium Finishing",
      parameter: "Vc=150, d=25 mm, L=120, f=0,08, ap=0,3",
      n: "1.910 RPM",
      tm: "0,79 menit (47 dtk)",
      mrr: "3.600 mm³/min",
      catatan: "Finishing halus mengkilap (bebas BUE)"
    },
    {
      no: "3A",
      soal: "Soal 3 (Set A) — Baja S45C (Mode Agresif)",
      parameter: "Vc=80, d=50 mm, L=100, f=0,3, ap=2,0",
      n: "509 RPM",
      tm: "0,65 menit (39 dtk)",
      mrr: "48.000 mm³/min",
      catatan: "Unggul PRODUKTIVITAS (Roughing)"
    },
    {
      no: "3B",
      soal: "Soal 3 (Set B) — Baja S45C (Mode Halus)",
      parameter: "Vc=60, d=50 mm, L=100, f=0,15, ap=1,0",
      n: "382 RPM",
      tm: "1,75 menit (105 dtk)",
      mrr: "9.000 mm³/min",
      catatan: "Unggul KUALITAS PERMUKAAN (Finishing)"
    }
  ],

  // ==================== ASESMEN DIAGNOSTIK KOGNITIF & ANGKET NON-KOGNITIF ====================
  // Berdasarkan Dokumen 4_Instrumen_Asesmen_Pertemuan_1_Diagnostik_Formatif_Sumatif.docx
  diagnosticQuestions: [
    {
      id: "diag_1",
      number: 1,
      question: "Mesin perkakas yang prinsip kerjanya memutar benda kerja dan menyayatnya dengan pahat translasi adalah...",
      options: [
        "A. Mesin Frais",
        "B. Mesin Bubut",
        "C. Mesin Skrap",
        "D. Mesin Gerinda",
        "E. Mesin Bor"
      ],
      correct: 1, // B
      keyLetter: "B",
      points: 10,
      topic: "Prinsip Kerja Mesin Bubut"
    },
    {
      id: "diag_2",
      number: 2,
      question: "Bagian mesin bubut yang berfungsi memutar benda kerja dan memuat susunan gearbox kecepatan putar adalah...",
      options: [
        "A. Apron",
        "B. Tailstock",
        "C. Headstock",
        "D. Toolpost",
        "E. Bed mesin"
      ],
      correct: 2, // C
      keyLetter: "C",
      points: 10,
      topic: "Headstock (Kepala Tetap)"
    },
    {
      id: "diag_3",
      number: 3,
      question: "Alat pendukung yang dipasang pada kepala lepas untuk menahan ujung benda kerja panjang agar tidak lentur adalah...",
      options: [
        "A. Senter Putar (Revolving Center)",
        "B. Collet Chuck",
        "C. Face Plate",
        "D. Follower Rest",
        "E. Lathe Dog"
      ],
      correct: 0, // A
      keyLetter: "A",
      points: 10,
      topic: "Perlengkapan Kepala Lepas"
    },
    {
      id: "diag_4",
      number: 4,
      question: "Untuk melakukan pembubutan muka (facing) meratakan ujung poros, eretan yang digerakkan adalah...",
      options: [
        "A. Eretan Atas",
        "B. Eretan Melintang",
        "C. Eretan Alas",
        "D. Kepala Lepas",
        "E. Feed Rod"
      ],
      correct: 1, // B
      keyLetter: "B",
      points: 10,
      topic: "Eretan Melintang (Cross Slide)"
    },
    {
      id: "diag_5",
      number: 5,
      question: "Jika sebuah baja ST 37 berdiameter 20 mm dibubut dengan kecepatan potong Cs = 25 m/menit, maka putaran mesin n teoritis adalah...",
      options: [
        "A. 250 RPM",
        "B. 398 RPM",
        "C. 500 RPM",
        "D. 796 RPM",
        "E. 1000 RPM"
      ],
      correct: 1, // B
      keyLetter: "B",
      points: 10,
      topic: "Kalkulasi Parameter RPM (n)"
    },
    {
      id: "diag_6",
      number: 6,
      question: "Tindakan keselamatan kerja (K3LH) yang PALING KRITIS dan WAJIB segera dilakukan setelah memasang benda pada chuck adalah...",
      options: [
        "A. Menyalakan lampu kerja",
        "B. Mencabut kunci chuck dari lubang adaptor",
        "C. Menyiramkan coolant",
        "D. Menekan emergency stop",
        "E. Memutar eretan ke paling kanan"
      ],
      correct: 1, // B
      keyLetter: "B",
      points: 10,
      topic: "K3LH Kunci Cekam (Chuck)"
    },
    {
      id: "diag_7",
      number: 7,
      question: "Poros berulir trapesium tebal yang hanya berputar dan menghubungkan gerak eretan saat membubut ulir adalah...",
      options: [
        "A. Feed Rod",
        "B. Main Spindle",
        "C. Lead Screw (Poros Transportir)",
        "D. Rack Gear",
        "E. Spline Shaft"
      ],
      correct: 2, // C
      keyLetter: "C",
      points: 10,
      topic: "Poros Transportir (Lead Screw)"
    },
    {
      id: "diag_8",
      number: 8,
      question: "Komponen yang dapat diputar sudutnya (-45 s.d. +45 derajat) untuk pembubutan tirus sudut luar adalah...",
      options: [
        "A. Eretan Atas (Compound Rest)",
        "B. Eretan Melintang",
        "C. Toolpost",
        "D. Apron",
        "E. Tailstock"
      ],
      correct: 0, // A
      keyLetter: "A",
      points: 10,
      topic: "Eretan Atas (Compound Rest)"
    },
    {
      id: "diag_9",
      number: 9,
      question: "Pada pembacaan jangka sorong dengan ketelitian 0.05 mm, jika garis 0 nonius melewati angka 14 mm dan garis nonius ke-6 segaris lurus dengan skala utama, hasil pembacaannya adalah...",
      options: [
        "A. 14.06 mm",
        "B. 14.30 mm",
        "C. 14.60 mm",
        "D. 14.05 mm",
        "E. 14.65 mm"
      ],
      correct: 1, // B
      keyLetter: "B",
      points: 10,
      topic: "Alat Ukur Jangka Sorong"
    },
    {
      id: "diag_10",
      number: 10,
      question: "Dokumen rekayasa manufaktur yang wajib disahkan guru sebelum siswa menyalakan mesin bubut disebut...",
      options: [
        "A. Work Preparation (WP)",
        "B. Job Sheet",
        "C. Kartu Hadir",
        "D. Laporan Praktik",
        "E. Kartu Stok"
      ],
      correct: 0, // A
      keyLetter: "A",
      points: 10,
      topic: "Dokumen Work Preparation (WP)"
    }
  ],

  // 1.2 Angket Non-Kognitif Kesiapan Belajar & Gaya Belajar Siswa (Tidak dinilai, sebagai diagnostik & portofolio)
  diagnosticSurvey: [
    {
      id: "survey_gaya_belajar",
      number: 1,
      title: "Gaya Belajar Favorit",
      question: "Pilihlah gaya belajar yang paling menggambarkan dirimu dalam memahami materi teknik mesin:",
      options: [
        {
          value: "Visual",
          label: "Visual (Gambar / Sketsa)",
          desc: "Lebih cepat paham lewat gambar, sketsa komponen, grafik tabel, atau video demonstrasi."
        },
        {
          value: "Auditori",
          label: "Auditori (Penjelasan Lisan / Diskusi)",
          desc: "Lebih cepat paham lewat penjelasan lisan guru, instruksi ceramah, dan diskusi kelompok."
        },
        {
          value: "Kinestetik",
          label: "Kinestetik (Praktik Langsung Bengkel)",
          desc: "Lebih cepat paham dengan langsung memegang alat, mencoba handle tuas mesin, dan praktik fisik di bengkel."
        }
      ]
    },
    {
      id: "survey_pengalaman_mesin",
      number: 2,
      title: "Pengalaman Mesin Perkakas",
      question: "Bagaimanakah pengalaman interaksi langsungmu dengan mesin perkakas bubut sebelum materi ini?",
      options: [
        {
          value: "Belum Pernah",
          label: "Belum Pernah Mengoperasikan",
          desc: "Belum pernah menyentuh atau mengoperasikan mesin perkakas bubut sama sekali."
        },
        {
          value: "Pernah Melihat",
          label: "Pernah Melihat di Lab / Video",
          desc: "Pernah melihat kakak kelas/guru mengoperasikan di bengkel atau melalui tayangan video pembelajaran."
        },
        {
          value: "Pernah Mencoba",
          label: "Sudah Pernah Mencoba Dasar (Kelas X)",
          desc: "Sudah pernah mencoba menggerakkan tuas atau latihan membubut muka/lurus sederhana di kelas X."
        }
      ]
    },
    {
      id: "survey_kesiapan_k3",
      number: 3,
      title: "Kesiapan Fisik & K3",
      question: "Bagaimanakah kesiapan perlengkapan APD dan kondisi fisikmu untuk beraktivitas di bengkel pemesinan?",
      options: [
        {
          value: "Lengkap & Prima",
          label: "Lengkap & Fisik Prima",
          desc: "Memiliki seragam wearpack & safety shoes lengkap, serta tidak memiliki riwayat trauma/pusing akibat suara mesin putar."
        },
        {
          value: "Lengkap Sebagian",
          label: "APD Belum Lengkap",
          desc: "Hanya memiliki salah satu perlengkapan APD (wearpack atau sepatu safety), perlengkapan lainnya masih dipersiapkan."
        },
        {
          value: "Perlu Pendampingan",
          label: "Perlu Pendampingan Khusus",
          desc: "Belum memiliki APD lengkap / memiliki kepekaan atau kendala fisik terhadap getaran/suara mesin putar berkecepatan tinggi."
        }
      ]
    }
  ],


  classes: ["11 TP A", "11 TP B"],
  academicYears: ["2026/2027"],

  students: [
    { no: 0, name: "Siswa", nis: "SISWA-TES", class: "11 TP A", group: "Akun Uji Coba" },
    { no: 1, name: "ABYAN MAULANA", nis: "22188", class: "11 TP A", group: "12" },
    { no: 2, name: "ADHISA DINO DEWANGGA", nis: "22189", class: "11 TP A", group: "12" },
    { no: 3, name: "ADITYA PRAMANA PUTRA", nis: "22190", class: "11 TP A", group: "5" },
    { no: 4, name: "ADITYA PUTRA WICAKSONO", nis: "22191", class: "11 TP A", group: "13" },
    { no: 5, name: "AFKHAN RIZKI HANUUN", nis: "22192", class: "11 TP A", group: "1" },
    { no: 6, name: "AGRA MANGGALA YOGA ADETAMA", nis: "22193", class: "11 TP A", group: "6" },
    { no: 7, name: "AHMAD ZAKI MUCHLIS", nis: "22194", class: "11 TP A", group: "5" },
    { no: 8, name: "ALBILAL ZHUKA ADYATMA", nis: "22195", class: "11 TP A", group: "1" },
    { no: 9, name: "ALFINO WICAKSONO", nis: "22196", class: "11 TP A", group: "13" },
    { no: 10, name: "ALIF IRVAN KHOIRUL RASYID", nis: "22197", class: "11 TP A", group: "11" },
    { no: 11, name: "ALIFVIANO PUTRA PURNAWAN", nis: "22198", class: "11 TP A", group: "7" },
    { no: 12, name: "ALVIN RAHMADTULLAH", nis: "22199", class: "11 TP A", group: "7" },
    { no: 13, name: "ALVINO RIZKY MAHESSA", nis: "22200", class: "11 TP A", group: "3" },
    { no: 14, name: "ANDREAS NAYAKA WIDRAJAD", nis: "22201", class: "11 TP A", group: "14" },
    { no: 15, name: "ANDRIAN SURYA PUTRA", nis: "22202", class: "11 TP A", group: "11" },
    { no: 16, name: "ANGGER TEGUH PRASETYO", nis: "22203", class: "11 TP A", group: "18" },
    { no: 17, name: "APRILIAN NUR ADZANA", nis: "22204", class: "11 TP A", group: "10" },
    { no: 18, name: "ARSYAD BINTANG PAMBUDI", nis: "22205", class: "11 TP A", group: "15" },
    { no: 19, name: "ARUNA MUHAMMAD AHZA", nis: "22206", class: "11 TP A", group: "8" },
    { no: 20, name: "ASYRAF FARELLEZA QOWIYYAN", nis: "22207", class: "11 TP A", group: "9" },
    { no: 21, name: "BAGUS FADHIL FIRMANSYAH", nis: "22208", class: "11 TP A", group: "16" },
    { no: 22, name: "BANYU RANGGAS TIRANI", nis: "22209", class: "11 TP A", group: "18" },
    { no: 23, name: "CAESAR LANANG PUTRA SARJANA", nis: "22210", class: "11 TP A", group: "6" },
    { no: 24, name: "DIKA AMARTA", nis: "22211", class: "11 TP A", group: "2" },
    { no: 25, name: "DIMAS REZKY PRANATATAMA", nis: "22212", class: "11 TP A", group: "15" },
    { no: 26, name: "DZAKWAN FAIZ FADHLURROHMAN", nis: "22213", class: "11 TP A", group: "2" },
    { no: 27, name: "EKA ARDHITYA SAPUTRA", nis: "22214", class: "11 TP A", group: "4" },
    { no: 28, name: "FANI NOVANDI SETYA WIDADA", nis: "22215", class: "11 TP A", group: "10" },
    { no: 29, name: "FARHAN NURHIDAYAT", nis: "22216", class: "11 TP A", group: "17" },
    { no: 30, name: "FAUZY RAKA KURNIANTO", nis: "22217", class: "11 TP A", group: "9" },
    { no: 31, name: "FIRNANDA ALDI PRASETYO", nis: "22218", class: "11 TP A", group: "3" },
    { no: 32, name: "FLORENTINUS BAGUS JALU WICAKSANA", nis: "22219", class: "11 TP A", group: "4" },
    { no: 33, name: "GAVIN FATTAN FADLILLAH", nis: "22220", class: "11 TP A", group: "16" },
    { no: 34, name: "GERARDO ALEXANDRO RANGGA KRISHANDA", nis: "22221", class: "11 TP A", group: "14" },
    { no: 35, name: "GESANG DEMAS DIGDAYA", nis: "22222", class: "11 TP A", group: "8" },
    { no: 36, name: "GHATFAN RAFIF WIKAN WIJANARKO", nis: "22223", class: "11 TP A", group: "17" }
  ],

  // Google Sheets Webhook Configuration
  googleSheetConfig: {
    webAppUrl: "https://script.google.com/macros/s/AKfycbxbDK8uEeJcEUkUtKeOI-rHg9hZffke_mMuc6f4xNHnHTc4jQ5LLRmdF48ZWDFweaj6zw/exec",
    defaultSpreadsheetName: "Rekap Nilai Siswa 11 TP A"
  }
};

