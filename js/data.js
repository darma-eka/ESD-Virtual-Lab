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
  ]
};
