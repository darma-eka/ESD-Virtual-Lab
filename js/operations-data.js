/**
 * ESD V-Lab — Database Operasi & Prosedur Praktik Pemesinan Lengkap
 * Mata Pelajaran: Teknik Pemesinan Bubut & Frais (Fase F - SMK)
 * Berisi 13 proses pekerjaan lengkap dengan langkah terperinci, alat bantu, SOP K3, dan parameter potong
 */

const MachiningOperationsData = {
  // =========================================================================
  // KATEGORI 1: MESIN BUBUT (LATHE MACHINING OPERATIONS)
  // =========================================================================
  lathe: [
    {
      id: "lathe_facing",
      machine: "lathe",
      title: "Pembubutan Muka (Facing)",
      subtitle: "Meratakan Permukaan Bidang Ujung Poros Siku 90°",
      category: "Dasar Pemesinan",
      badgeColor: "emerald",
      difficulty: "Dasar",
      estimatedTime: "15 Menit",
      summary: "Proses meratakan bidang muka benda kerja hingga tegak lurus sempurna terhadap garis sumbu putar.",
      parameters: {
        cs: "25 - 30 m/menit",
        n: "350 - 500 RPM",
        feed: "0,1 - 0,15 mm/putaran",
        ap: "0,5 - 1,0 mm aksial",
        formula: "n = (1000 · Cs) / (π · d)"
      },
      toolsUsed: [
        { name: "Pahat Bubut HSS Rata Kanan", desc: "Batang HSS padat diasah rata kanan untuk menyayat bidang muka tegak lurus sumbu" },
        { name: "Senter Kepala Lepas (Revolving Center)", desc: "Acuan ketinggian senter pahat" },
        { name: "Penyiku Presisi (Steel Square)", desc: "Pemeriksaan kesikuan permukaan 90°" },
        { name: "Jangka Sorong", desc: "Mengukur panjang total benda kerja" }
      ],
      safetyNotes: [
        "Pahat harus tepat setinggi titik senter agar tidak menyisakan tonjolan pentil di tengah muka.",
        "Kunci benda kerja kokoh di cekam, jangan membiarkan benda menonjol terlalu panjang tanpa penopang.",
        "Gunakan kacamata pelindung karena tatal facing terlempar ke arah samping luar."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Penyetelan Pahat Muka Tepat Setinggi Titik Senter",
          desc: "Pasang pahat muka pada toolpost. Dekatkan ujung mata potong pahat ke ujung senter putar kepala lepas. Setel pelat ganjal (shim) hingga ketinggian ujung potong persis segaris dengan titik puncak senter.",
          callout: "Jika pahat terlalu rendah atau tinggi, bagian tengah bidang muka akan tersisa pentil kecil dan pahat cepat aus.",
          visualAction: "align_center_height",
          eretanAngle: 0,
          toolX: 119,
          toolZ: 251,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Touching Muka Ujung Benda Kerja (Z0)",
          desc: "Nyalakan spindel mesin pada putaran sesuai diameter. Geser eretan memanjang secara perlahan hingga ujung pahat menyentuh tipis muka ujung benda kerja (menghasilkan goresan kilap). Nol-kan cincin nonius eretan memanjang.",
          callout: "Sentuhan harus sangat ringan (light touch) hanya untuk menetapkan titik nol sumbu Z.",
          visualAction: "touch_face_z0",
          eretanAngle: 0,
          toolX: 155,
          toolZ: 251,
          startToolZ: 262,
          spindleRunning: true,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Pemberian Kedalaman Potong Aksial (ap)",
          desc: "Tarik pahat ke arah luar diameter benda kerja dengan eretan lintang. Masukkan pahat maju ke arah benda kerja menggunakan eretan memanjang sebesar kedalaman potong yang direncanakan (misal ap = 0,8 mm).",
          callout: "Kunci eretan memanjang agar kedalaman tidak mundur akibat dorongan gaya potong aksial.",
          visualAction: "feed_axial_depth",
          eretanAngle: 0,
          toolX: 190,
          toolZ: 249,
          carriageLocked: true,
          spindleRunning: true,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Pemakanan Radial Menuju Titik Pusat Senter",
          desc: "Putar handel eretan melintang dari tepi terluar menuju ke titik pusat senter benda kerja secara konstan. Pahat memotong lapisan permukaan ujung hingga rata, tatal terkelupas melengkung dan mengkilap.",
          callout: "Kurangi laju pemakanan saat mendekati titik pusat karena kecepatan potong efektif (Cs) mendekati nol di titik senter.",
          visualAction: "cut_facing_pass",
          eretanAngle: 0,
          startToolX: 190,
          toolX: 119,
          toolZ: 249,
          carriageLocked: true,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Pemeriksaan Kesikuan dan Kerataan Bidang Muka",
          desc: "Tarik pahat mundur menjauh, hentikan putaran spindel. Letakkan bilah penyiku presisi pada bidang muka. Arahkan ke cahaya: tidak boleh ada celah cahaya antara bilah penyiku dan bidang muka benda kerja.",
          callout: "Jika permukaan cembung/cekung, periksa kembali kelurusan eretan lintang dan ketinggian senter pahat.",
          visualAction: "inspect_facing",
          eretanAngle: 0,
          toolX: 190,
          toolZ: 265,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "lathe_straight",
      machine: "lathe",
      title: "Pembubutan Rata / Silindris (Straight Turning)",
      subtitle: "Mengurangi Diameter Poros Silindris Sepanjang Sumbu Z",
      category: "Dasar Pemesinan",
      badgeColor: "blue",
      difficulty: "Dasar",
      estimatedTime: "20 Menit",
      summary: "Operasi pembubutan memanjang searah sumbu poros untuk meratakan atau mengurangi diameter benda kerja secara silindris seragam.",
      parameters: {
        cs: "25 - 35 m/menit",
        n: "250 - 400 RPM",
        feed: "0,12 - 0,20 mm/putaran",
        ap: "1,0 - 2,0 mm radial",
        formula: "tm = L / (f · n)"
      },
      toolsUsed: [
        { name: "Pahat Bubut HSS Rata Kanan", desc: "Pahat HSS potong utama pembubutan silindris memanjang dari kanan ke kiri" },
        { name: "Cekam Tiga Rahang (3-Jaw Chuck)", desc: "Menjepit benda kerja sentris" },
        { name: "Jangka Sorong & Mikrometer Luar", desc: "Pemeriksaan diameter presisi 0,01 mm" },
        { name: "Kunci Cekam (Chuck Key)", desc: "Mengencangkan rahang penjepit" }
      ],
      safetyNotes: [
        "Selalu cabut kunci cekam segera setelah mengencangkan benda kerja! Jangan pernah meninggalkan kunci menancap.",
        "Jika panjang poros keluar cekam melebihi 3x diameter, wajib gunakan penopang senter putar kepala lepas.",
        "Kancing lengan baju kerja dengan rapi agar tidak terlilit putaran poros."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pencekaman Benda Kerja & Uji Keolengan (Centering)",
          desc: "Jepit poros benda kerja pada cekam 3 rahang dengan panjang keluar secukupnya. Putar cekam secara manual untuk memastikan benda kerja berputar lurus konsentris dan tidak oleng (run-out minimal).",
          callout: "Segera lepaskan kunci cekam dan kembalikan ke tempatnya sebelum menyalakan mesin!",
          visualAction: "clamp_workpiece",
          eretanAngle: 0,
          toolX: 210,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Touching Diameter Luar Benda Kerja (X0)",
          desc: "Nyalakan spindel mesin. Geser eretan melintang hingga ujung pahat menyentuh tipis permukaan silindris benda kerja. Setelah timbul goresan melingkar halus, nol-kan skala cincin nonius eretan melintang.",
          callout: "Titik sentuh ini menjadi acuan angka nol untuk penambahan kedalaman potong radial selanjutnya.",
          visualAction: "touch_diameter_x0",
          eretanAngle: 0,
          startToolX: 210,
          toolX: 187,
          toolZ: 210,
          spindleRunning: true,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Penyetelan Kedalaman Potong Radial (ap)",
          desc: "Tarik pahat ke arah kanan melewati ujung benda kerja. Majukan pahat ke arah sumbu pusat (sumbu X) sebesar kedalaman potong yang diinginkan (misal ap = 1,5 mm). Perhatikan skala nonius eretan lintang.",
          callout: "Ingat prinsip skala diameter: pada banyak mesin bubut, penambahan dial 1 mm akan mengurangi diameter benda kerja 2 mm.",
          visualAction: "set_radial_depth",
          eretanAngle: 0,
          toolX: 176,
          toolZ: 256,
          spindleRunning: true,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Pemakanan Memanjang Arah Kanan ke Kiri",
          desc: "Jalankan gerak makan eretan memanjang (secara otomatis atau manual halus) bergerak ke kiri mendekati cekam. Pahat memotong logam menghasilkan diameter silinder yang seragam. Tatal mengalir halus.",
          callout: "Hentikan pemakanan sebelum pahat membentur rahang cekam! Sisakan jarak aman minimal 15-20 mm.",
          visualAction: "cut_straight_longitudinal",
          eretanAngle: 0,
          startToolX: 176,
          toolX: 176,
          startToolZ: 252,
          toolZ: 104,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Pengukuran Diameter dengan Mikrometer / Jangka Sorong",
          desc: "Tarik pahat mundur menjauh, hentikan putaran mesin. Ukur diameter silinder di tiga posisi berbeda (ujung, tengah, pangkal) untuk memastikan tidak terjadi ketirusan atau penyimpangan ukuran.",
          callout: "Jika diameter ujung dan pangkal berbeda, periksa kelurusan kepala lepas atau keausan alas mesin.",
          visualAction: "measure_diameter",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 265,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "lathe_step",
      machine: "lathe",
      title: "Pembubutan Bertingkat (Step Turning)",
      subtitle: "Membuat Poros dengan Variasi Diameter & Bahu Siku 90°",
      category: "Poros Presisi",
      badgeColor: "indigo",
      difficulty: "Menengah",
      estimatedTime: "30 Menit",
      summary: "Pembuatan poros bertingkat dengan diameter berbeda yang dibatasi oleh bidang bahu siku tegak lurus untuk dudukan bantalan/bearing.",
      parameters: {
        cs: "25 - 30 m/menit",
        n: "300 - 450 RPM",
        feed: "0,1 - 0,15 mm/putaran",
        ap: "1,0 mm per passing",
        formula: "L_total = L1 + L2 + L3"
      },
      toolsUsed: [
        { name: "Pahat Bubut HSS Rata Kanan", desc: "Pahat HSS untuk membubut diameter poros bertingkat dan merapikan bidang bahu siku 90°" },
        { name: "Jangka Sorong Kedalaman", desc: "Mengukur panjang setiap tingkatan poros" },
        { name: "Dial Indicator / Stopper Eretan", desc: "Batas penghenti panjang langkah pemakanan" }
      ],
      safetyNotes: [
        "Perhatikan jarak antara pahat dan bahu bertingkat saat mendekati batas akhir pemakanan.",
        "Gunakan pembacaan skala dial eretan memanjang secara teliti agar panjang tingkatan presisi sesuai gambar kerja."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Penandaan Batas Panjang Poros Bertingkat",
          desc: "Gunakan ujung pahat atau penggores untuk membuat tanda goresan batas panjang total pemesinan bertingkat (L = 110 mm di X = -35) dan batas tingkat kedua (L1 = 55 mm di X = 20) pada permukaan benda kerja silindris mentah (D0 = 60 mm). Benda kerja masih utuh mentah.",
          callout: "Goresan tanda mempermudah operator mengetahui batas panjang langkah pemakanan otomatis agar tidak bablas.",
          visualAction: "mark_step_boundaries",
          eretanAngle: 0,
          toolX: 210,
          toolZ: 250,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Pembubutan Diameter 48 mm Sepanjang Total 110 mm",
          desc: "Setel kedalaman potong radial dan bubut diameter terbesar dahulu (D = 48 mm) sepanjang total yang akan dibubut bertingkat (L = 110 mm, dari X = 75 ke X = -35). Membubut diameter luar penuh terlebih dahulu menjaga kekakuan poros dan meminimalkan getaran.",
          callout: "Bahu siku 90° pertama kini terbentuk di X = -35 membatasi diameter 48 mm dengan diameter mentah 60 mm.",
          visualAction: "cut_step_diameter_48",
          eretanAngle: 0,
          startToolX: 174,
          toolX: 174,
          startToolZ: 252,
          toolZ: 104,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          coolantOn: true
        },
        {
          stepNumber: 3,
          title: "Pemeriksaan Dimensi Diameter 48 mm & Panjang Total 110 mm",
          desc: "Hentikan spindel dan posisikan pahat aman. Posisikan jangka sorong tegak lurus 90° terhadap sumbu poros untuk memeriksa diameter D = 48 mm dengan rahang ukur luar (menggunakan teknik goyangan halus/rocking untuk meniadakan cosine error, lalu kunci baut). Selanjutnya posisikan jangka sorong sejajar sumbu di bawah poros untuk memeriksa panjang total pemakanan L = 110 mm dari muka ujung (X = 75) ke bahu siku 90° (X = -35).",
          callout: "Gunakan bagian tengah rahang luar (bukan ujung tipis) untuk menjepit diameter, dan pastikan skala nonius 0,02 mm terbaca tepat.",
          visualAction: "inspect_step_stage_1",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 265,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Pembubutan Diameter Tingkat Kedua (D = 36 mm, L = 55 mm)",
          desc: "Nyalakan spindel kembali. Pahat menyayat tingkat kedua menjadi diameter D = 36 mm dari muka ujung kanan (X = 75) hingga batas L1 = 55 mm (X = 20), sekaligus membentuk bahu siku 90° terhadap tingkat diameter 48 mm.",
          callout: "Mata pahat tetap berada di sisi luar keliling silinder dan tatal pita terkelupas rapi ke belakang.",
          visualAction: "cut_step_diameter_36",
          eretanAngle: 0,
          startToolX: 160,
          toolX: 160,
          startToolZ: 252,
          toolZ: 178,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Pemeriksaan Dimensi dengan Sisi Belakang (Depth Bar) & Kepala Jangka Sorong",
          desc: "Hentikan spindel dan periksa chamfer 1x45°. Tempelkan bidang datum ekor jangka sorong rata 90° pada muka ujung poros (X = 75), ulurkan batang kedalaman (depth bar) ke kiri hingga menyentuh dasar bahu siku (X = 20) untuk mengukur panjang undakan L1 = 55 mm. Lanjutkan pemeriksaan diameter D1 = 36 mm menggunakan rahang ukur luar dan kerataan undakan menggunakan muka bertingkat di ujung kepala jangka sorong.",
          callout: "Teknik pengukuran undakan dengan sisi belakang (depth bar) jangka sorong menjamin ketepatan panjang aksial sesuai toleransi ISO.",
          visualAction: "inspect_step_stage_2",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 265,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "lathe_grooving",
      machine: "lathe",
      title: "Pembuatan Alur & Potong (Grooving & Parting Off)",
      subtitle: "Menyayat Radial untuk Alur Snap Ring, O-Ring & Pemotongan",
      category: "Alur & Ulir",
      badgeColor: "amber",
      difficulty: "Menengah",
      estimatedTime: "20 Menit",
      summary: "Operasi penyayatan tegak lurus sumbu poros menggunakan pahat alur berbentuk bilah pipih dengan lebar terstandarisasi.",
      parameters: {
        cs: "15 - 20 m/menit (Kecepatan Rendah)",
        n: "150 - 250 RPM",
        feed: "0,04 - 0,08 mm/putaran (Sangat Halus)",
        ap: "Penyayatan radial bertahap",
        formula: "Lebar alur = lebar pahat w"
      },
      toolsUsed: [
        { name: "Pahat Alur / Parting Tool (Bilah Insert Karbida w = 5 mm)", desc: "Bilah tipis sudut bebas samping presisi" },
        { name: "Penyiku Presisi (Try Square 90°)", desc: "Verifikasi ketegaklurusan bilah pahat terhadap sumbu spindel" },
        { name: "Mistar Baja Presisi", desc: "Penentuan posisi aksial alur Z = 50 mm" },
        { name: "Jangka Sorong (Depth Bar & Inside Jaws)", desc: "Pemeriksaan kedalaman h = 6 mm & lebar w = 5 mm" },
        { name: "Cairan Pendingin Bertekanan (Soluble Coolant)", desc: "Membilas tatal C-shape agar tidak menyumbat alur" }
      ],
      safetyNotes: [
        "Pahat alur harus terpasang persis tegak lurus 90° terhadap sumbu benda kerja untuk mencegah keausan samping.",
        "Gunakan putaran mesin rendah (sekitar 180 - 220 RPM) untuk meredam getaran (chatter) dan mencegah pahat patah.",
        "Kunci eretan memanjang (carriage lock) wajib diaktifkan sebelum memulai pemakanan radial.",
        "Alirkan coolant bertekanan secara kontinyu dan terapkan teknik pecking agar rongga alur sempit tidak macet oleh tatal."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pemasangan Pahat Alur & Uji Kesikuan 90°",
          desc: "Pasang pahat alur (blade insert w = 5,0 mm) pada toolpost tepat setinggi sumbu senter poros. Gunakan daun penyiku presisi (try square) yang disandarkan pada benda kerja untuk memverifikasi bilah pahat tegak lurus sempurna 90° terhadap sumbu putar spindel.",
          callout: "Ketegaklurusan 90° mutlak wajib agar sisi samping bilah tidak bergesekan (rubbing) yang memicu getaran keras atau bilah patah.",
          visualAction: "align_groove_tool",
          eretanAngle: 0,
          toolX: 228,
          toolZ: 175,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false,
          carriageLocked: false
        },
        {
          stepNumber: 2,
          title: "Penentuan Posisi Aksial Z = 50 mm & Kunci Eretan Memanjang",
          desc: "Posisikan bilah pahat pada jarak aksial alur yang direncanakan (Z = 50 mm dari muka ujung kanan benda kerja, X = 25,0 mm). Tempelkan tipis ujung pahat (touching X0) pada keliling terluar (R = 30 mm, ⌀60 mm) lalu nol-kan skala nonius eretan melintang. Kunci baut klem eretan memanjang (carriage lock) agar meja eretan terkunci kaku secara aksial.",
          callout: "Baut klem eretan memanjang (carriage lock) harus selalu terkunci kuat saat pemakanan alur radial berlangsung.",
          visualAction: "position_groove_z",
          eretanAngle: 0,
          toolX: 192,
          toolZ: 175,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false,
          carriageLocked: true
        },
        {
          stepNumber: 3,
          title: "Penyayatan Alur Radial Bertahap Menuju Kedalaman 6 mm",
          desc: "Nyalakan spindel pada RPM rendah (n ≈ 180 - 200 RPM) dan semprotkan cairan pendingin (coolant) bertekanan tepat ke bilah alur. Putar handel eretan melintang secara perlahan menembus logam secara radial dari R = 30 mm ke R = 24 mm (kedalaman alur h = 6,0 mm, diameter dasar ⌀48,0 mm). Terapkan siklus pecking (tarik mundur 0,2 mm tiap kedalaman 1 mm) untuk memutus tatal C-shape agar alur bersih.",
          callout: "Teknik 'pecking' dan pendingin kontinyu mencegah tatal menumpuk (swarf jamming) yang dapat memecahkan insert karbida.",
          visualAction: "cut_groove_radial",
          eretanAngle: 0,
          startToolX: 192,
          toolX: 178,
          startToolZ: 175,
          toolZ: 175,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          coolantOn: true,
          carriageLocked: true
        },
        {
          stepNumber: 4,
          title: "Pemeriksaan Dimensi Alur (Lebar 5 mm & Kedalaman 6 mm) dengan Jangka Sorong",
          desc: "Mundurkan pahat ke posisi aman, matikan putaran spindel, bersihkan sisa tatal alur. Gunakan batang kedalaman (depth bar / sisi belakang) jangka sorong untuk mengukur kedalaman alur h = 6,00 mm (diameter dasar ⌀48,0 mm), dan gunakan rahang ukur dalam (inside jaws) jangka sorong untuk memverifikasi lebar alur w = 5,00 mm.",
          callout: "Pastikan dasar alur rata, sudut dasar alur tajam bebas beram, dan kedua bidang dinding alur sejajar tegak lurus 90°.",
          visualAction: "inspect_groove",
          eretanAngle: 0,
          toolX: 228,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false,
          carriageLocked: false
        }
      ]
    },
    {
      id: "lathe_center_drilling",
      machine: "lathe",
      title: "Pengeboran Senter & Lubang (Center Drilling & Drilling)",
      subtitle: "Menggunakan Kepala Lepas (Tailstock) untuk Lubang Senter 60°",
      category: "Pengeboran Bubut",
      badgeColor: "cyan",
      difficulty: "Dasar",
      estimatedTime: "15 Menit",
      summary: "Pembuatan lubang senter presisi pada muka poros sebagai dudukan senter putar atau pemandu awal mata bor spiral.",
      parameters: {
        cs: "20 - 25 m/menit",
        n: "600 - 900 RPM (RPM Tinggi untuk Bor Senter Kecil)",
        feed: "Manual handel quill kepala lepas",
        ap: "Kedalaman 2/3 tirus bor senter",
        formula: "Sudut bor senter standar = 60°"
      },
      toolsUsed: [
        { name: "Mata Bor Senter HSS DIN 333-A (Center Drill Bit A2 / A3)", desc: "Mata bor khusus sudut tirus 60° & pilot pemandu" },
        { name: "Cekam Bor Kepala Lepas & Kunci Cekam (Keyed Drill Chuck)", desc: "Menjepit batang silindris bor senter konsentris" },
        { name: "Kepala Lepas (Tailstock Assembly dengan Skala Laras)", desc: "Pemberi gerak makan aksial manual terukur" },
        { name: "Oli Pelumas Pemotongan (Cutting Oil Dropper)", desc: "Mendinginkan ujung bor & melumasi evakuasi tatal" },
        { name: "Mal Senter 60° (Center Gauge)", desc: "Verifikasi sudut konis 60° dan kedalaman 2/3 tirus" }
      ],
      safetyNotes: [
        "Bidang muka poros WAJIB dibubut rata (facing) sebelum dibor senter agar mata bor tidak terpeleset atau patah.",
        "Atur posisi kepala lepas dengan jarak aman awal 15 - 20 mm dari muka benda, lalu kunci tuas alas secara kokoh.",
        "Gunakan putaran spindel tinggi (n ≈ 700 - 850 RPM) dan terapkan teknik penyayatan bertahap MAJU-MUNDUR (pecking feed).",
        "Tarik mundur mata bor secara berkala untuk membuang tatal yang menumpuk di dalam lubang, mendinginkan bor, dan mencegah ujung bor patah."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Persiapan Bidang Muka Rata & Pemasangan Bor Senter",
          desc: "Pastikan bidang muka ujung poros telah dibubut rata tegak lurus 90°. Pasang tangkai tirus morse cekam bor (drill chuck) ke dalam laras kepala lepas, jepit mata bor senter DIN 333 Form A pada rahang cekam secara konsentris, lalu kencangkan kuat menggunakan kunci cekam bor. Kepala lepas masih berada pada posisi aman parkir (jarak >40 mm).",
          callout: "Pemasangan mata bor senter harus konsentris dan bidang muka wajib rata agar ujung bor tidak tergelincir saat mulai menyentuh titik pusat.",
          visualAction: "mount_center_drill",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Menggeser & Mengunci Kepala Lepas pada Posisi Siap (Jarak 15-20 mm)",
          desc: "Dorong badan kepala lepas menyusuri meja alas mesin mendekati ujung benda kerja hingga jarak ujung mata bor senter tersisa sekitar 15 - 20 mm (posisi aman siap pemakanan) dari muka benda kerja. Kencangkan tuas pengunci alas kepala lepas (clamp lever) dengan kuat agar kepala lepas terkunci kaku dan tidak terdorong mundur saat proses pengeboran.",
          callout: "Penguncian tuas kepala lepas mutlak wajib sebelum pemutaran handel quill dilakukan.",
          visualAction: "clamp_tailstock",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Pengeboran Senter Bertahap 'Maju-Mundur' (Siklus Pecking 2/3 Tirus 60°)",
          desc: "Nyalakan spindel pada putaran tinggi (n ≈ 750 RPM) dan beri tetesan oli pemotong. Putar handel pemutar laras (quill) secara bertahap dengan teknik 'MAJU-MUNDUR' (pecking feed): bor maju membuat lubang pemandu, lalu ditarik mundur sedikit untuk membuang tatal keluar dan mendinginkan ujung bor, kemudian maju lebih dalam membentuk tirus 60° hingga mencapai kedalaman standar 2/3 panjang konis, lalu mundur kembali.",
          callout: "Gerakan maju-mundur wajib diterapkan untuk mengevakuasi tatal dari rongga lubang sempit, mengantisipasi penumpukan panas, dan mencegah mata bor senter patah di dalam poros.",
          visualAction: "drill_center_hole",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 260,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          coolantOn: true
        },
        {
          stepNumber: 4,
          title: "Menarik Mundur Bor & Pemeriksaan Lubang Senter 60° DIN 333",
          desc: "Tarik mundur laras kepala lepas hingga bor senter kembali ke posisi aman bebas dari benda kerja, lalu matikan putaran mesin. Bersihkan serpihan tatal dari dalam lubang senter. Periksa kebersihan, ketepatan sudut tirus 60°, dan kedalaman lubang menggunakan mal senter (center gauge).",
          callout: "Lubang senter standar DIN 333-A harus memiliki sudut konis 60° halus dan lubang pemandu bebas geram agar senter putar dapat menopang benda kerja tanpa oblak.",
          visualAction: "inspect_center_hole",
          eretanAngle: 0,
          toolX: 215,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "lathe_taper",
      machine: "lathe",
      title: "Pembubutan Tirus (Taper Turning)",
      subtitle: "Metode Pemiringan Eretan Atas Sebesar Sudut α = 30° ke Arah Kanan & Ditarik Mundur",
      category: "Profil & Kemiringan",
      badgeColor: "blue",
      difficulty: "Menengah",
      estimatedTime: "25 Menit",
      summary: "Proses pembuatan poros tirus konis presisi dengan mengatur pahat sejajar benda kerja, memutar eretan atas sebesar sudut α (30°) miring ke arah kanan, dan melakukan pemakanan menggunakan eretan atas dengan cara ditarik mundur.",
      parameters: {
        cs: "25 - 35 m/menit (HSS / Karbida)",
        n: "320 - 450 RPM",
        feed: "0,08 - 0,12 mm/putaran (Manual Handel Eretan Atas Ditarik Mundur)",
        ap: "0,5 mm per passing (Kedalaman Potong Radial)",
        formula: "tan α = (D - d) / (2 · l) => tan 30° ≈ 0,577"
      },
      toolsUsed: [
        { name: "Pahat Bubut HSS Rata Kanan", desc: "Pahat HSS diposisikan menyayat bidang miring dengan gerakan eretan atas ditarik mundur" },
        { name: "Kunci Pas 14/17 mm", desc: "Untuk mengendurkan & mengencangkan 2 baut pengikat eretan atas" },
        { name: "Piringan Skala Derajat & Nonius Eretan Atas", desc: "Skala nonius derajat pada landasan eretan atas (miring ke kanan 30°)" },
        { name: "Jangka Sorong (Vernier Caliper)", desc: "Mengukur diameter D = 60 mm, d = 26 mm, dan panjang l = 30 mm" },
        { name: "Mal Tirus / Bevel Protractor", desc: "Pemeriksaan kesesuaian sudut tirus 30°" }
      ],
      safetyNotes: [
        "Wajib memakai kacamata pelindung (safety glasses) dari serpihan geram tirus panas.",
        "Pastikan baut pengunci eretan atas dikencangkan kuat dan seimbang sebelum menyalakan motor utama.",
        "Kunci baut eretan memanjang (carriage lock) ke meja mesin agar tidak bergeser terdorong gaya potong aksial.",
        "Gunakan kuas atau kait tatal untuk membersihkan geram, jangan pernah menggunakan tangan telanjang."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pemasangan Pahat Sejajar Benda Kerja & Setinggi Senter",
          desc: "Pasang pahat bubut rata kanan pada rumah pahat (toolpost) tepat setinggi ujung senter kepala lepas. Atur posisi badan pahat agar sejajar dengan garis sumbu benda kerja dengan posisi eretan atas pada skala 0°, dan kencangkan baut pengikat rumah pahat secara kokoh.",
          callout: "Pahat wajib diposisikan sejajar dengan garis sumbu benda kerja dan setinggi senter kepala lepas sebelum eretan atas dimiringkan.",
          visualAction: "align_tool_parallel",
          eretanAngle: 0,
          compoundFeed: 0,
          toolX: 180,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Perhitungan Sudut Kemiringan Eretan Atas (α)",
          desc: "Hitung besaran sudut pergeseran eretan atas menggunakan rumus tirus: tan α = (D - d) / (2 · l). Dengan diameter besar D = 60 mm, diameter kecil d = 26 mm, dan panjang tirus l = 30 mm, diperoleh tan α = 34 / 60 = 0,567 sehingga sudut kemiringan eretan atas disetel pada skala α = 30° ke arah kanan.",
          callout: "Perhatikan: Rumus membagi 2 karena sudut tirus diukur dari garis sumbu tengah poros (half-angle α = 30°).",
          visualAction: "calculate_angle",
          eretanAngle: 0,
          compoundFeed: 0,
          toolX: 180,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Mengendurkan 2 Baut Pengikat Eretan Atas",
          desc: "Gunakan kunci pas 14/17 mm untuk mengendurkan 2 buah baut pengikat eretan atas pada pelat dudukan putar. Cukup kendurkan 1-2 putaran saja hingga pelat eretan atas dapat diputar dengan bebas namun tidak goyang berlebihan.",
          callout: "Kunci pas diputar berlawanan arah jarum jam (CCW) pada kedua baut pengikat eretan atas.",
          visualAction: "loosen_bolts",
          eretanAngle: 0,
          compoundFeed: 0,
          toolX: 180,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: true,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Memutar & Memiringkan Eretan Atas Sebesar Sudut α = 30° ke Arah Kanan",
          desc: "Pegang bodi eretan atas secara hati-hati, lalu putar bodi eretan atas miring ke arah kanan (ke arah kepala lepas / tailstock) hingga garis penunjuk skala nonius bertepatan tepat dengan garis 30° pada busur piringan derajat landasan.",
          callout: "Eretan atas dimiringkan miring ke arah kanan sebesar 30° sehingga gerakan penarikan mundur eretan atas nantinya menghasilkan bidang tirus kerucut 30° mengecil ke arah luar benda kerja.",
          visualAction: "swivel_compound_rest",
          eretanAngle: 30,
          compoundFeed: 0,
          toolX: 180,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: true,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 5,
          title: "Mengencangkan Kembali Baut Pengunci Eretan Atas pada Skala 30°",
          desc: "Setelah garis sudut tepat berada di angka 30° ke arah kanan, kencangkan kembali kedua baut pengikat secara bergantian dan bertahap dengan torsi seimbang agar sudut kemiringan kokoh dan tidak bergeser saat terkena beban potong.",
          callout: "Kencangkan kedua baut secara bertahap dan seimbang pada sudut 30° agar posisi piringan derajat tidak terpuntir.",
          visualAction: "tighten_bolts",
          eretanAngle: 30,
          compoundFeed: 0,
          toolX: 180,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 6,
          title: "Memposisikan Pahat di Titik Awal & Mengunci Eretan Memanjang (Carriage Lock)",
          desc: "Geser eretan ke posisi awal pemakanan tirus di ujung luar muka benda kerja (X = 75, d = 26 mm). Kencangkan baut pengunci eretan memanjang (carriage clamp) ke alas meja mesin agar kokoh terkunci. Gunakan eretan melintang untuk menyetel kedalaman potong radial.",
          callout: "PENTING: Eretan memanjang WAJIB DIKUNCI! Selama proses pembubutan tirus, pemakanan hanya dilakukan oleh eretan atas yang ditarik mundur.",
          visualAction: "lock_carriage_set_depth",
          eretanAngle: 30,
          compoundFeed: 0,
          toolX: 112,
          toolZ: 174,
          spindleRunning: true,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: true,
          coolantOn: false
        },
        {
          stepNumber: 7,
          title: "Pemakanan Tirus Menggunakan Eretan Atas dengan Cara Ditarik Mundur",
          desc: "Nyalakan spindel dan aktifkan cairan pendingin. Putar handel roda eretan atas secara manual secara perlahan dan konstan dengan cara ditarik mundur (retract feed). Peluncur eretan atas akan bergerak miring menarik pahat dari ujung luar (X = 75, d = 26 mm) menuju pangkal tirus (X = 45, D = 60 mm) sepanjang l = 30 mm, menghasilkan bidang kerucut tirus presisi 30°.",
          callout: "Pemakanan dilakukan manual memutar handel eretan atas dengan cara ditarik mundur. Eretan memanjang tetap terkunci kokoh.",
          visualAction: "cut_taper_pass",
          eretanAngle: 30,
          compoundFeed: 34.5,
          toolX: 112,
          toolZ: 174,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          carriageLocked: true,
          coolantOn: true
        },
        {
          stepNumber: 8,
          title: "Pemeriksaan Sudut 30° & Pengukuran Hasil Tirus",
          desc: "Tarik mundur pahat dengan eretan melintang, matikan putaran spindel. Bersihkan sisa geram tatal menggunakan kuas. Periksa diameter besar (D = 60 mm), diameter kecil (d = 26 mm), panjang tirus (l = 30 mm) dengan jangka sorong, serta verifikasi kesesuaian sudut tirus 30° menggunakan busur bilah derajat (bevel protractor) atau mal tirus.",
          callout: "Benda kerja harus dalam kondisi berhenti total sebelum alat ukur atau mal tirus 30° ditempelkan ke bidang tirus.",
          visualAction: "inspect_taper",
          eretanAngle: 30,
          compoundFeed: 0,
          toolX: 180,
          toolZ: 260,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "lathe_threading",
      machine: "lathe",
      title: "Pembuatan Ulir Segitiga Metris (Thread Turning)",
      subtitle: "Pemotongan Ulir Metris Bertahap dari Sisi Kanan Benda Kerja (ISO 60°)",
      category: "Alur & Ulir",
      badgeColor: "purple",
      difficulty: "Tingkat Lanjut",
      estimatedTime: "35 Menit",
      summary: "Proses pembuatan ulir segitiga metris standar ISO (M20x2.0) pada silinder luar secara bertahap dimulai dari sisi kanan benda kerja menuju ke kiri dengan penambahan kedalaman potong bertahap hingga profil ulir 60° terbentuk sempurna.",
      parameters: {
        cs: "12 - 18 m/menit (Putaran Lambat Presisi)",
        n: "100 - 150 RPM",
        feed: "Kisar Pitch P = 2,0 mm (Otomatis Poros Transportir)",
        ap: "Bertahap 4 Lintasan: 0,10 mm → 0,40 mm → 0,85 mm → 1,23 mm",
        formula: "Kedalaman Profil Ulir H = 0,6134 · P = 0,6134 · 2,0 = 1,23 mm"
      },
      toolsUsed: [
        { name: "Pahat Ulir Segitiga Metris 60° (Insert Karbida TiN ISO)", desc: "Mata potong bersudut puncak persis 60° dengan alur pemecah geram" },
        { name: "Mal Ulir (Center Gauge 60°)", desc: "Alat bantu menyetel ketegaklurusan sudut 90° pahat terhadap sumbu poros" },
        { name: "Mal Kisar Ulir (Screw Pitch Gauge P = 2,0 mm)", desc: "Bilah penguji kesesuaian langkah kisar ulir metris" },
        { name: "Kotak Roda Gigi Kisar (Quick-Change Gearbox)", desc: "Menyetel transmisi rasio kisar poros transportir" },
        { name: "Mur Standar Penguji (Thread Ring / Nut Gauge M20)", desc: "Pemeriksaan suaian ulir hasil pembubutan" }
      ],
      safetyNotes: [
        "Gunakan putaran RPM rendah (100–150 RPM) agar operator memiliki kendali penuh melepas tuas mur belah sebelum menabrak bidang bahu.",
        "Wajib menyetel kelurusan sudut pahat dengan mal ulir (center gauge) agar profil ulir simetris 60°.",
        "Alirkan pelumas minyak pemotong (cutting oil / coolant) pada setiap lintasan untuk mencegah puncak ulir robek atau kasar.",
        "Jangan pernah membersihkan serpihan tatal berulir saat spindel masih berputar."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pemasangan & Penyetelan Kelurusan Pahat Ulir 60° (Center Gauge)",
          desc: "Eretan dan pahat meluncur mendekati mal ulir (center gauge 60°) yang ditempelkan pada benda kerja. Pahat disetel pas masuk ke dalam takik V 60° hingga terbukti tegak lurus 90° sempurna terhadap sumbu poros, lalu baut pengikat toolpost dikencangkan kuat. Setelah penyetelan selesai, eretan bergeser mulus menuju posisi awal di sisi kanan benda kerja.",
          callout: "Penyetelan dengan mal ulir menjamin posisi pahat tegak lurus 90° terhadap sumbu benda kerja dan kedua sudut sayap ulir (flank) simetris 30°-30°.",
          visualAction: "align_thread_gauge",
          eretanAngle: 0,
          compoundFeed: 0,
          startToolX: 230,
          toolX: 204,
          startToolZ: 247,
          toolZ: 247,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Penyetelan Tuas Kisar Kotak Roda Gigi (Quick-Change Gearbox)",
          desc: "Periksa tabel kisar ulir pada kepala tetap mesin bubut. Geser tuas transmisi gearbox transportir ke kombinasi rasio kisar P = 2,0 mm (untuk ulir metris kasar M20x2.0). Poros transportir (lead screw) akan berputar secara sinkron menggerakkan eretan sesuai langkah kisar.",
          callout: "Pastikan tuas gearbox terkunci pada pasaknya dan poros transportir berputar lancar saat motor diuji putar.",
          visualAction: "set_thread_gearbox",
          eretanAngle: 0,
          compoundFeed: 0,
          startToolX: 204,
          toolX: 204,
          startToolZ: 247,
          toolZ: 247,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Pemposisian Pahat di Sisi Kanan Benda & Touching Nol (Touch Zero)",
          desc: "Posisikan pahat di sebelah kanan muka luar benda kerja (X ≥ 75 mm). Dekatkan pahat hingga menyentuh sangat tipis diameter luar silinder benda kerja berputar untuk menetapkan titik referensi nol radial (X0 = 0,00), lalu setel cincin skala nonius eretan melintang ke angka 0.",
          callout: "Awal proses penyayatan ulir selalu dimulai dari sisi kanan luar benda kerja untuk memberi jarak awalan bagi poros transportir mencapai kecepatan sinkron.",
          visualAction: "touch_thread_zero",
          eretanAngle: 0,
          compoundFeed: 0,
          toolX: 187,
          toolZ: 247,
          spindleRunning: true,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Lintasan Sayatan Pertama: Goresan Awal / Scratch Pass (ap = 0,10 mm)",
          desc: "Masukkan kedalaman potong awalan sangat tipis (ap = 0,10 mm) pada eretan melintang. Kunci tuas mur belah (half-nut). Mesin menyayat goresan heliks tipis dari sisi kanan benda (X = 75 mm) meluncur ke kiri hingga alur pembebas (X = -35 mm). Di ujung alur pembebas, pahat dimundurkan secara radial ke posisi bebas pemakanan, lalu eretan kembali ke posisi awal di sebelah kanan secara smooth sebelum penyayatan step berikutnya.",
          callout: "Pahat otomatis ditarik mundur radial di alur pembebas sebelum eretan meluncur kembali ke posisi awal di sebelah kanan benda.",
          visualAction: "cut_thread_pass_1",
          eretanAngle: 0,
          compoundFeed: 0,
          startToolX: 204,
          toolX: 204,
          startToolZ: 247,
          toolZ: 247,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Lintasan Sayatan Kedua: Pemakanan Kasar / Roughing Pass (ap = 0,40 mm)",
          desc: "Tambahkan kedalaman potong menjadi ap = 0,40 mm dari posisi awal di kanan benda kerja. Kunci kembali tuas mur belah dan jalankan pemakanan dari kanan ke kiri untuk memperdalam alur V. Saat mencapai alur pembebas, pahat mundur bebas secara radial lalu eretan meluncur kembali ke kanan secara smooth.",
          callout: "Pelepasan tuas mur belah dan pembebasan pahat radial di alur pembebas mencegah pahat menabrak bidang bahu atau merusak permukaan alur saat kembali.",
          visualAction: "cut_thread_pass_2",
          eretanAngle: 0,
          compoundFeed: 0,
          startToolX: 204,
          toolX: 204,
          startToolZ: 247,
          toolZ: 247,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: true
        },
        {
          stepNumber: 6,
          title: "Lintasan Sayatan Ketiga: Pemakanan Semi-Finishing (ap = 0,85 mm)",
          desc: "Dari posisi awal di kanan, masukkan kedalaman potong radial ap = 0,85 mm (~70% kedalaman penuh). Jalankan pemakanan dengan pelumasan minyak potong berkelanjutan dari kanan ke kiri, lalu di alur pembebas pahat dibebaskan secara radial sebelum eretan meluncur kembali ke posisi awal.",
          callout: "Pembebasan pahat radial (quick retract) sangat krusial agar ujung mata potong pahat tidak menggesek permukaan sayap ulir saat eretan meluncur mundur.",
          visualAction: "cut_thread_pass_3",
          eretanAngle: 0,
          compoundFeed: 0,
          startToolX: 204,
          toolX: 204,
          startToolZ: 247,
          toolZ: 247,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: true
        },
        {
          stepNumber: 7,
          title: "Lintasan Sayatan Keempat: Finishing & Spring Pass (H = 1,23 mm)",
          desc: "Pahat menyayat lintasan akhir dari kanan ke kiri hingga kedalaman profil penuh H = 1,23 mm tercapai, disusul lintasan penyisiran (spring pass). Di ujung alur pembebas, pahat dimundurkan radial ke posisi bebas pemakanan dan eretan kembali dengan smooth ke sisi kanan.",
          callout: "Siklus pembubutan bertahap tuntas: profil ulir segitiga metris 60° M20x2.0 kini terbentuk sempurna dengan kedalaman 1,23 mm dan sayap ulir mengilat.",
          visualAction: "cut_thread_pass_4",
          eretanAngle: 0,
          compoundFeed: 0,
          startToolX: 204,
          toolX: 204,
          startToolZ: 247,
          toolZ: 247,
          spindleRunning: true,
          isCutting: true,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: true
        },
        {
          stepNumber: 8,
          title: "Pembersihan & Pemeriksaan Hasil Ulir (Pitch Gauge & Mur Standar)",
          desc: "Tarik mundur pahat menjauhi benda kerja, matikan putaran motor spindel. Bersihkan sisa tatal geram dari alur ulir menggunakan kuas. Periksa kesesuaian langkah ulir dengan mal kisar (pitch gauge P = 2,0 mm) serta uji kepresisian pasangan ulir menggunakan mur standar M20. Mur harus dapat berputar mulus tanpa goyang dan pas.",
          callout: "Benda kerja harus dalam kondisi berhenti total saat mur penguji dipasangkan pada ulir hasil bubutan.",
          visualAction: "inspect_thread",
          eretanAngle: 0,
          compoundFeed: 0,
          toolX: 200,
          toolZ: 250,
          spindleRunning: false,
          isCutting: false,
          boltsLoose: false,
          carriageLocked: false,
          coolantOn: false
        }
      ]
    }
  ],

  // =========================================================================
  // KATEGORI 2: MESIN FRAIS (MILLING MACHINING OPERATIONS)
  // =========================================================================
  milling: [
    {
      id: "milling_face",
      machine: "milling",
      title: "Frais Muka / Rata (Face Milling)",
      subtitle: "Meratakan Permukaan Bidang Balok Menggunakan Pisau Endmill",
      category: "Perataan Bidang",
      badgeColor: "emerald",
      difficulty: "Dasar",
      estimatedTime: "20 Menit",
      summary: "Proses meratakan permukaan atas benda kerja balok menggunakan pisau frais jari (End Mill) dengan pemakanan meja sumbu X dan pengaturan kedalaman potong melalui penaikan meja mesin (sumbu Z).",
      parameters: {
        cs: "25 - 35 m/menit (HSS / Karbida)",
        n: "450 - 650 RPM",
        feed: "0,08 - 0,14 mm/gigi (Vf = fz · z · n)",
        ap: "0,8 - 1,5 mm per passing (Knee Sumbu Z Naik)",
        formula: "Vf = fz · z · n"
      },
      toolsUsed: [
        { name: "Pisau Frais Jari (End Mill HSS/Solid Carbide Ø20 mm)", desc: "Mata potong heliks untuk meratakan bidang datar balok" },
        { name: "Ragum Presisi Mesin Frais (Machine Vise)", desc: "Menjepit balok benda kerja kokoh" },
        { name: "Bilah Paralel Presisi (Parallel Blocks)", desc: "Alas penopang agar bidang kerja sejajar alas ragum" },
        { name: "Palu Plastik / Tembaga (Soft Mallet)", desc: "Memukul benda kerja merapat ke paralel" }
      ],
      safetyNotes: [
        "Pastikan benda kerja dijepit kuat pada ragum dan bilah paralel tidak bergerak saat digoyang.",
        "Ketinggian pemakanan diatur dengan menaikkan meja mesin (lutut/knee sumbu Z), bukan menurunkan spindel.",
        "Gunakan pelindung kaca akrilik (chip guard) dan kacamata keselamatan kerja."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pemasangan Benda Kerja pada Ragum dengan Bilah Paralel",
          desc: "Bersihkan rahang ragum dari serpihan logam. Letakkan sepasang bilah paralel presisi di dasar ragum. Letakkan balok benda kerja di atas paralel dan kencangkan handel ragum secara kokoh.",
          callout: "Bilah paralel memastikan bidang dasar benda kerja rata dan sejajar dengan meja mesin frais.",
          visualAction: "clamp_vise_parallel",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Merapatkan Benda Kerja dengan Palu Tembaga / Plastik",
          desc: "Pukul bagian atas benda kerja menggunakan palu lunak (tembaga/plastik) secara merata sambil menguji bilah paralel di bawahnya. Bilah paralel harus terjepit rapat dan tidak bisa digeser dengan tangan.",
          callout: "Jangan gunakan palu besi karena dapat merusak permukaan benda kerja dan merusak rahang ragum presisi.",
          visualAction: "tap_workpiece_tight",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Touching Permukaan Atas Benda Kerja (Z0)",
          desc: "Nyalakan spindel pada RPM kerja. Naikkan lutut meja mesin (knee sumbu Z) secara perlahan hingga kertas uji di atas benda kerja tersentuh tipis oleh ujung pisau Endmill. Nol-kan cincin nonius sumbu Z meja.",
          callout: "Pergerakan naik-turun dilakukan oleh meja mesin melalui poros pengangkat lutut (knee leadscrew).",
          visualAction: "touch_face_z0",
          tableX: -40,
          tableY: 0,
          quillZ: 25,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Penyetelan Kedalaman Potong (Meja Sumbu Z Naik ap = 1,0 mm)",
          desc: "Geser meja (sumbu X) ke luar jangkauan pisau. Naikkan lutut meja mesin (sumbu Z) sebesar kedalaman potong yang direncanakan (ap = 1,0 mm) menggunakan handel poros lutut. Kunci tuas pengunci lutut meja.",
          callout: "Spindel dan pisau Endmill berada pada posisi vertikal tetap yang kaku selama pemotongan.",
          visualAction: "set_depth_z",
          tableX: -60,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 5,
          title: "Pemakanan Meja Memanjang (Sumbu X) Meratakan Permukaan",
          desc: "Jalankan gerak pemakanan meja sumbu X melintasi pisau Endmill. Pisau Endmill menyayat permukaan balok, tatal keperakan terlempar dan di belakang lintasan pisau terbentuk bidang rata mengkilap.",
          callout: "Perhatikan arah pemotongan: tatal terpotong di depan kontak dan permukaan halus terbentuk di belakang pisau.",
          visualAction: "cut_face_pass",
          tableX: 60,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 6,
          title: "Pemeriksaan Kerataan Permukaan dengan Jam Ukur (Dial Indicator)",
          desc: "Tarik meja ke posisi aman, matikan putaran spindel. Pasang jam ukur (dial indicator) pada dudukan magnetik dan sapukan sensor dial melintasi permukaan benda kerja. Jarum dial menunjukkan penyimpangan < 0,02 mm.",
          callout: "Bidang pertama yang rata ini menjadi bidang acuan dasar (datum face) untuk proses penyikuan balok.",
          visualAction: "inspect_face_flatness",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "milling_side",
      machine: "milling",
      title: "Frais Sisi / Bidang Siku 90° (Side & Squaring Milling)",
      subtitle: "Meratakan Bidang Sisi Samping Menghasilkan Sudut Tegak Lurus 90°",
      category: "Penyikuan Balok",
      badgeColor: "blue",
      difficulty: "Menengah",
      estimatedTime: "25 Menit",
      summary: "Proses pemotongan bidang sisi samping balok menggunakan sisi potong heliks End Mill untuk menghasilkan balok kubus siku sempurna 90°.",
      parameters: {
        cs: "25 - 35 m/menit",
        n: "450 - 650 RPM",
        feed: "0,08 - 0,12 mm/gigi",
        ap: "1,0 - 1,5 mm radial / kedalaman aksial penuh",
        formula: "Sudut kesikuan = 90° ± 0,02 mm"
      },
      toolsUsed: [
        { name: "Pisau Frais Jari (End Mill HSS 4-Flute Ø16 mm)", desc: "Mata potong heliks samping" },
        { name: "Penyiku Baja Presisi (Precision Engineer's Square DIN 875)", desc: "Memeriksa kesikuan sudut 90°" },
        { name: "Batang Silinder Penekan (Round Bar Pin)", desc: "Membantu penjepitan bidang siku pada rahang ragum" }
      ],
      safetyNotes: [
        "Selalu bersihkan rahang tetap ragum sebelum menjepit bidang acuan pertama.",
        "Perhatikan agar badan pisau Endmill tidak menyentuh bibir rahang ragum baja yang dikeraskan."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Penjepitan Benda Kerja dengan Bidang Acuan pada Rahang Tetap",
          desc: "Letakkan bidang benda kerja yang sudah selesai diratakan (bidang 1) menempel rapat pada rahang tetap ragum. Gunakan pin silinder penekan pada rahang gerak agar bidang 1 menempel presisi tegak lurus.",
          callout: "Rahang tetap ragum adalah acuan tegak lurus utama pada mesin frais.",
          visualAction: "clamp_squaring_vise",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Touching Sisi Samping Balok (Sumbu Y0)",
          desc: "Nyalakan spindel pisau End Mill. Geser pelana meja (saddle sumbu Y) perlahan hingga sisi samping pisau menyentuh halus dinding balok benda kerja. Nol-kan cincin nonius sumbu Y.",
          callout: "Hati-hati: sentuhkan bagian samping flute pisau, bukan ujung bawahnya.",
          visualAction: "touch_side_y0",
          tableX: -40,
          tableY: 20,
          quillZ: 15,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Penyetelan Kedalaman Pemotongan Sisi (Sumbu Y Infeed)",
          desc: "Tarik meja sumbu X keluar dari benda kerja. Majukan sumbu Y sebesar kedalaman potong yang direncanakan (ap = 1,0 mm). Naikkan meja (sumbu Z) agar ujung pisau melampaui batas bawah bidang yang disayat.",
          callout: "Kunci tuas pengunci sumbu Y dan sumbu Z sebelum menjalankan pemakanan memanjang.",
          visualAction: "set_side_depth_y",
          tableX: -55,
          tableY: 22,
          quillZ: 15,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Pemakanan Sisi Samping Memanjang (Side Milling)",
          desc: "Jalankan meja sumbu X melintasi pisau End Mill. Sisi heliks pisau menyayat permukaan samping balok secara mulus menghasilkan bidang yang tegak lurus 90° terhadap bidang dasar.",
          callout: "Gunakan semprotan pendingin (coolant) untuk menjaga ketajaman pisau dan kualitas permukaan halus.",
          visualAction: "cut_side_pass",
          tableX: 55,
          tableY: 22,
          quillZ: 15,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Pemeriksaan Kesikuan Sudut 90° dengan Penyiku Presisi",
          desc: "Tarik benda kerja ke posisi aman, matikan mesin. Tempelkan bilah penyiku presisi pada bidang 1 dan bidang 2. Periksa kesikuan di sepanjang panjang balok: tidak boleh ada celah cahaya sedikit pun.",
          callout: "Jika kedua bidang sudah terbukti siku 90°, balok kini memiliki bidang referensi datum X dan Y yang valid.",
          visualAction: "inspect_squaring_90",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "milling_slot",
      machine: "milling",
      title: "Frais Alur T (T-Slot Milling)",
      subtitle: "Membuat Alur Profil T Presisi Menggunakan Pisau Frais Alur T DIN 851",
      category: "Alur & Profil T",
      badgeColor: "amber",
      difficulty: "Menengah",
      estimatedTime: "30 Menit",
      summary: "Proses pembuatan alur T standar pada meja mesin atau perlengkapan klem menggunakan kombinasi Pisau Endmill untuk alur awal dan Pisau Frais Alur T (T-Slot Cutter) untuk sayap bawah alur T.",
      parameters: {
        cs: "18 - 25 m/menit (HSS DIN 851)",
        n: "300 - 450 RPM",
        feed: "0,04 - 0,08 mm/gigi",
        ap: "Pelebaran sayap kiri-kanan sesuai dimensi standar T-Slot",
        formula: "Lebar leher = d_alur lurus | Lebar sayap = D_cutter"
      },
      toolsUsed: [
        { name: "Pisau Frais Alur T (T-Slot Milling Cutter HSS DIN 851)", desc: "Mata potong cakram berleher silindris dengan gigi berselang-seling" },
        { name: "Pisau Frais Jari (End Mill 2-Flute Ø12 mm)", desc: "Membuat alur lurus awal sebelum alur T disayat" },
        { name: "Baut T Standar (T-Bolt Standard & Nut)", desc: "Menguji suaian dan kelancaran masuknya baut T ke dalam alur" },
        { name: "Jangka Sorong Kedalaman (Depth Caliper)", desc: "Memeriksa kedalaman leher dan sayap alur T" }
      ],
      safetyNotes: [
        "Wajib membuat alur lurus vertikal terlebih dahulu sebelum memasukkan pisau alur T agar leher pisau tidak patah.",
        "Gunakan putaran rendah dan pendingin melimpah karena serpihan tatal di dalam sayap alur T sulit keluar.",
        "Penaikan meja (sumbu Z) harus tepat agar sayap alur T terbentuk simetris di dasar lubang."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pembuatan Alur Awal Lurus Vertikal Menggunakan Pisau Endmill",
          desc: "Balok benda kerja telah dibuatkan alur lurus vertikal (lebar 12 mm, kedalaman 22 mm) menggunakan pisau Endmill. Alur lurus ini berfungsi sebagai jalur masuk bebas untuk batang leher pisau alur T.",
          callout: "Alur lurus awal harus lebih dalam dari posisi bibir bawah pisau alur T untuk memberikan ruang bebas tatal.",
          visualAction: "premilled_slot_inspect",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Pemasangan Pisau Frais Alur T (T-Slot Cutter DIN 851)",
          desc: "Pasang Pisau Frais Alur T pada cekam collet arbor spindel. Pisau memiliki kepala pemotong berbentuk cakram dengan gigi silang serta leher silindris yang lebih ramping dari alur lurus.",
          callout: "Periksa kebersihan tangkai pisau dan pastikan terkunci kuat pada spindel mesin.",
          visualAction: "mount_tslot_cutter",
          tableX: -45,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Penyelarasan Leher Pisau & Penyetelan Ketinggian Meja (Sumbu Z Naik)",
          desc: "Posisikan leher pisau alur T di luar ujung benda kerja. Naikkan meja mesin (lutut sumbu Z) hingga kepala cakram pisau berada tepat pada ketinggian ruang sayap alur T yang direncanakan. Kunci lutut sumbu Z.",
          callout: "Meja mesin yang naik membawa benda kerja ke posisi potong, sementara spindel tetap di posisi vertikalnya.",
          visualAction: "align_tslot_depth_z",
          tableX: -55,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 4,
          title: "Pemakanan Pelebaran Sayap Bawah Alur T (Sumbu X Horizontal Feed)",
          desc: "Nyalakan spindel pisau alur T dengan cairan pendingin aktif. Jalankan meja sumbu X melintasi pisau. Cakram pisau menyayat sisi kiri dan kanan secara bersamaan di bawah permukaan, menghasilkan profil rongga T terbalik.",
          callout: "Gunakan pemakanan perlahan dan stabil agar gigi sayap pisau alur T tidak mengalami kejutan beban.",
          visualAction: "cut_tslot_pass",
          tableX: 55,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Pembersihan Tatal & Pengujian Suaian Baut T (T-Bolt Fit)",
          desc: "Tarik meja ke posisi aman, matikan spindel. Semprotkan udara bertekanan untuk membersihkan serpihan geram dari dalam alur T. Masukkan kepala baut T standar dan geser di sepanjang alur untuk menguji kepresisian kelancaran suaian.",
          callout: "Baut T harus dapat meluncur lancar tanpa tersendat dan sayap penahan mampu menahan gaya tarik klem.",
          visualAction: "inspect_tslot_tbolt",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "milling_step",
      machine: "milling",
      title: "Frais Bertingkat (Step Milling)",
      subtitle: "Membuat Profil Undakan Siku pada Sudut Balok Menggunakan Pisau Endmill",
      category: "Kontur & Undakan",
      badgeColor: "indigo",
      difficulty: "Menengah",
      estimatedTime: "25 Menit",
      summary: "Pembuatan kontur bertingkat dengan koordinat lebar dan kedalaman tertentu untuk penempatan komponen bertingkat atau bantalan menggunakan pisau Endmill.",
      parameters: {
        cs: "25 - 35 m/menit",
        n: "450 - 650 RPM",
        feed: "0,08 - 0,14 mm/gigi",
        ap: "1,5 mm per step kedalaman (Knee Sumbu Z Naik)",
        formula: "Volume step = P · L_step · H_step"
      },
      toolsUsed: [
        { name: "Pisau Frais Jari (End Mill HSS / Karbida Ø16 mm)", desc: "Memotong bidang datar dan dinding siku 90° sekaligus" },
        { name: "Ragum Mesin Frais & Bilah Paralel", desc: "Penjepit benda kerja kokoh" },
        { name: "Jangka Sorong Kedalaman", desc: "Mengukur ketinggian dinding dan lebar undakan" }
      ],
      safetyNotes: [
        "Pastikan arah putaran spindel searah jarum jam (CW) saat dilihat dari atas.",
        "Ketinggian pemakanan diatur bertahap dengan menaikkan meja mesin sumbu Z.",
        "Kunci sumbu Y saat melakukan pemakanan sumbu X agar lebar undakan tidak bergeser."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pemberian Batas Ukuran Undakan & Penjepitan Balok pada Ragum",
          desc: "Tandai batas lebar undakan (W = 15 mm) dan batas kedalaman undakan (H = 10 mm) pada benda kerja. Cekam balok dengan kokoh pada ragum mesin di atas bilah paralel.",
          callout: "Gunakan dial mesin sebagai patokan ukuran utama, goresan hanya sebagai verifikasi visual.",
          visualAction: "mark_step_profile",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Touching Referensi Sudut Balok (X0, Y0, Z0)",
          desc: "Sentuhkan pisau End Mill ke permukaan atas balok (Z0), sisi samping (Y0), dan muka depan (X0). Naikkan meja sedikit demi sedikit untuk touching Z0. Nol-kan seluruh cincin skala nonius.",
          callout: "Ketelitian titik sentuh awal menentukan akurasi seluruh dimensi undakan bertingkat.",
          visualAction: "touch_corner_xyz",
          tableX: -45,
          tableY: 15,
          quillZ: 25,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Ketinggian Meja Naik & Pemakanan Kasar Undakan (Roughing Steps)",
          desc: "Geser sumbu Y sebesar lebar undakan. Naikkan meja mesin (lutut sumbu Z) bertahap (1,5 mm per pass). Jalankan meja sumbu X melintasi pisau Endmill membuang sebagian besar material logam undakan.",
          callout: "Sisakan material sekitar 0,3 mm pada dinding dan dasar undakan untuk proses penyelesaian halus (finishing).",
          visualAction: "roughing_step_passes",
          tableX: 45,
          tableY: 15,
          quillZ: 18,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 4,
          title: "Pemakanan Halus Sudut Siku (Finishing Shoulder 90°)",
          desc: "Lakukan lintasan pemakanan akhir dengan kecepatan putar lebih tinggi dan gerak makan lambat halus pada dasar undakan dan dinding vertikal untuk menghasilkan permukaan halus dan siku 90° sempurna.",
          callout: "Gunakan cairan pendingin melimpah pada tahap finishing untuk mencegah burr (duri logam).",
          visualAction: "finish_step_90",
          tableX: -45,
          tableY: 15,
          quillZ: 14,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 5,
          title: "Pemeriksaan Dimensi Undakan Bertingkat",
          desc: "Tarik meja menjauh, hentikan putaran mesin. Bersihkan benda kerja dan ukur lebar undakan (W), kedalaman undakan (H), serta kesikuan dinding menggunakan jangka sorong dan penyiku baja.",
          callout: "Periksa sudut dalam pertemuan undakan: pastikan bersih tanpa serpihan tatal terjebak.",
          visualAction: "inspect_step_milling",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        }
      ]
    },
    {
      id: "milling_segi_n",
      machine: "milling",
      title: "Frais Benda Segi-n / Kepala Baut (Hexagonal Milling)",
      subtitle: "Mengefrais Bidang Segi Banyak Menggunakan Kepala Pembagi (Dividing Head) & Pisau Endmill",
      category: "Pembagian Keliling & Segi-n",
      badgeColor: "rose",
      difficulty: "Tingkat Lanjut",
      estimatedTime: "35 Menit",
      summary: "Pembuatan benda bersegi banyak (segi-6 / heksagonal) pada poros silindris baja menggunakan Kepala Pembagi Universal (Dividing Head) dengan pisau Endmill, membagi keliling 360° menjadi n bagian bidang datar yang simetris dan presisi.",
      parameters: {
        cs: "25 - 35 m/menit (HSS / Karbida)",
        n: "500 - 700 RPM",
        feed: "0,08 - 0,12 mm/gigi",
        ap: "Kedalaman sayatan sisi s = (D - d_kunci)/2",
        formula: "Putaran Engkol n_p = 40 / n_sisi (Segi-6: n_p = 40/6 = 6 2/3 putaran)"
      },
      toolsUsed: [
        { name: "Pisau Frais Jari (End Mill HSS/Karbida Ø16 mm)", desc: "Menyayat bidang-bidang datar di sekeliling poros silindris" },
        { name: "Kepala Pembagi Universal (Dividing Head dengan Cekam 3-Rahang)", desc: "Mencekam poros silindris dan membagi sudut keliling 360° secara presisi" },
        { name: "Jangka Sorong Presisi (Vernier Caliper)", desc: "Mengukur lebar kunci (across-flats distance s) hasil pengefraisan" }
      ],
      safetyNotes: [
        "Selalu kunci tuas pengunci spindel kepala pembagi saat pisau Endmill sedang menyayat bidang datar.",
        "Lepaskan tuas pengunci spindel sebelum memutar engkol pembagi ke sisi berikutnya, lalu kunci kembali sebelum pemakanan.",
        "Ketinggian pemakanan diatur dengan menaikkan meja mesin (lutut sumbu Z) hingga kedalaman bidang datar tercapai."
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Pemasangan Poros Silindris pada Cekam Kepala Pembagi (Dividing Head)",
          desc: "Pasang poros silindris baja (misal Ø32 mm) pada cekam 3-rahang kepala pembagi yang terpasang di atas meja frais. Kencangkan kunci cekam secara sentris dan kokoh. Kunci tuas spindel kepala pembagi.",
          callout: "Pastikan poros tercekam konsentris tanpa goyang (run-out < 0,02 mm).",
          visualAction: "mount_hex_stock",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 2,
          title: "Touching Permukaan Puncak Benda (Z0) & Penyetelan Ketinggian Meja",
          desc: "Nyalakan spindel pisau Endmill. Geser sumbu Y ke sumbu tengah poros. Naikkan lutut meja mesin (sumbu Z) hingga ujung pisau menyentuh tipis puncak silinder (Z0). Geser keluar meja, naikkan meja sumbu Z sebesar kedalaman bidang datar (h = 2,5 mm).",
          callout: "Ketinggian meja sumbu Z dikunci kencang untuk memastikan seluruh bidang sisi segi-6 memiliki ukuran yang seragam.",
          visualAction: "set_hex_depth_z",
          tableX: -45,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 3,
          title: "Pemakanan Sisi Datar 1 (First Flat Facet) dengan Pisau Endmill",
          desc: "Kunci spindel kepala pembagi. Nyalakan cairan pendingin dan jalankan meja sumbu X melintasi pisau Endmill. Pisau menyayat puncak silinder menghasilkan bidang datar pertama yang bersih dan presisi.",
          callout: "Perhatikan arah penyayatan: tatal terlempar ke depan dan di belakang pisau terbentuk bidang datar mengkilap.",
          visualAction: "cut_hex_face1",
          tableX: 45,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 4,
          title: "Pembagian Sudut: Memutar Engkol Kepala Pembagi Sebesar 60°",
          desc: "Tarik meja sumbu X kembali ke posisi awal. Buka tuas pengunci spindel kepala pembagi. Putar engkol pembagi sebesar n_p = 40 / 6 = 6 putaran penuh + 12 lubang pada lingkaran 18 (sudut 60°). Masukkan pen indeks lalu kunci kembali tuas spindel.",
          callout: "Rumus putaran kepala pembagi n_p = 40 / z. Untuk segi-6: n_p = 40/6 = 6 putaran + 2/3 putaran.",
          visualAction: "index_hex_angle",
          tableX: -45,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: false,
          coolantOn: false
        },
        {
          stepNumber: 5,
          title: "Pemakanan Sisi Datar 2 hingga Sisi 6 secara Berurutan",
          desc: "Jalankan meja sumbu X menyayat bidang datar kedua. Lakukan pengulangan pemutaran engkol 60° dan penyayatan untuk bidang ke-3, 4, 5, dan 6 hingga seluruh keliling poros berubah menjadi prisma segi-6 (heksagonal) yang sempurna.",
          callout: "Pastikan tuas spindel kepala pembagi selalu dikunci setiap kali pemakanan berlangsung.",
          visualAction: "cut_hex_repeat",
          tableX: 45,
          tableY: 0,
          quillZ: 20,
          cutterRotating: true,
          isCutting: true,
          coolantOn: true
        },
        {
          stepNumber: 6,
          title: "Pemeriksaan Jarak Kunci (Lebar Kunci s = 27 mm) dengan Jangka Sorong",
          desc: "Tarik meja ke posisi aman, matikan putaran mesin. Bersihkan seluruh sisa tatal. Ukur jarak antara dua bidang datar yang berlawanan (across flats / lebar kunci s) menggunakan jangka sorong pada ketiga pasang bidang datar.",
          callout: "Ketiga pasangan bidang datar harus memiliki ukuran lebar kunci yang sama persis (toleransi ±0,03 mm).",
          visualAction: "inspect_hex_finished",
          tableX: 0,
          tableY: 0,
          quillZ: 70,
          cutterRotating: false,
          isCutting: false,
          coolantOn: false
        }
      ]
    }
  ]
};

// Export to window
if (typeof window !== "undefined") {
  window.MachiningOperationsData = MachiningOperationsData;
}
