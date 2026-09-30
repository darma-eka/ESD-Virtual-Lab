# V-Machining: Interactive Workshop Simulator SMK
### Media Pembelajaran Berbasis Web — Teknik Pemesinan Konvensional (Bubut & Frais)
**Sesuai Kurikulum Merdeka (Fase F - SMK Bidang Keahlian Teknologi & Rekayasa)**

---

## 🌟 Gambaran Singkat

**V-Machining** adalah media ajar interaktif berbasis web yang memadukan konsep **Gamifikasi (Game-based Learning)** dan **Simulasi Fisik Pemesinan**. Media ini dirancang khusus untuk peserta didik SMK Konsentrasi Keahlian Teknik Pemesinan agar dapat memahami prosedur keselamatan, anatomi mesin, serta menghitung dan melihat dampak langsung parameter pemotongan sebelum melakukan praktik di bengkel nyata.

Media dapat diakses dengan lancar baik melalui **Komputer (PC/Laptop)** maupun **Smartphone (Android/iOS)** tanpa memerlukan instalasi aplikasi tambahan atau server khusus (berjalan secara *standalone client-side*).

---

## 🚀 Fitur Unggulan

### 1. Ruang APD & Keselamatan Kerja (K3)
* **Interactive Safety Checklist / Dress-up:** Siswa memilih perlengkapan APD wajib (kacamata safety, wearpack, safety shoes, earplug, dll.) dan harus menyingkirkan benda berbahaya (sarung tangan, perhiasan cincin/jam tangan).
* **Alarm Pelanggaran K3:** Jika siswa memakai sarung tangan pada mesin berputar, sistem membunyikan alarm bahaya dan memberikan edukasi pencegahan kecelakaan kerja fatal.
* **Simulasi Tombol Emergency Stop:** Pengenalan fungsi tombol henti darurat mekanik.

### 2. Galeri Anatomi Mesin Bubut 3D (Interactive 3D Lathe Explorer)
* **Kamera Bebas 360° & Precision Zoom:** Model 3D mesin bubut industri lengkap yang dapat diputar 360 derajat ke segala sudut (orbit rotation), diperbesar (zoom-in/zoom-out) hingga ke detail mur, senter putar, tuas, dan pahat potong.
* **Inspeksi Bagian-Bagian Mesin (Part-by-Part Zoom):** Klik nomor pin (1 s.d. 9) atau kartu komponen untuk animasi kamera *fly-to* halus dan penyorotan visual (*emissive highlight*) langsung pada komponen: *Headstock, Chuck Rahang 3, Toolpost & Pahat Rata Kanan (ISO 6), Carriage, Eretan Lintang, Tailstock & Senter Putar 60°, Alas Mesin (Bed), Poros Transporir (Lead Screw),* serta *Tombol Emergency Stop*.
* **Preset Sudut Pandang:** Tombol instan *3D Isometrik*, *Pandangan Depan (Front)*, *Pandangan Atas (Top)*, *Pandangan Samping (Side)*, serta mode *Putar Otomatis 360°*.
* **Dual View:** Bebas beralih antara tampilan **3D View interaktif** dan **2D Blueprint teknis**.

### 3. Lab Simulasi Kecepatan Potong Mesin Bubut 3D (Turning Simulation Lab)
* **Visualisasi Pemotongan 3D Real-Time & Pahat Bergerak Nyata:**
  * Spindel dan cekam berputar dengan kecepatan proporsional terhadap RPM yang dipilih.
  * Eretan dan pahat rata kanan bergerak otomatis memanjang (*longitudinal feed*) menyayat dari arah kanan ke kiri (ekor menuju cekam).
  * **Kontur Pemakanan Dinamis (*True Subtractive Turned Contour*):** Benda kerja terukir secara subtraktif dan permanen mengikuti lintasan sayatan pahat. Mendukung pembuatan **poros bertingkat (*stepped shaft*)** dengan bidang bahu (*shoulders*) dan ukuran diameter otomatis (*Ø callouts*).
  * **Material Surface Grading Nyata:** Tampilan permukaan hasil sayatan berubah sesuai material (baja mengkilap, kuningan emas berkilau, aluminium putih terang) serta kualitas pemotongan (halus mengkilap, kasar bergetar/*chatter marks*, atau biru gosong terbakar/*burnt temper*).
  * Partikel geram/tatal logam (*flying metal chips*) berhamburan dari titik sentuh pahat ke bak penampung.
  * Semburan cairan pendingin (*coolant stream*) aktif menyiram mata potong saat sakelar dinyalakan.
  * Efek termal ekstrem: pahat membara merah panas (*red-hot glow*), timbul partikel asap, dan permukaan membiru gosong saat parameter melebihi batas aman.
* **Panel Kontrol Operasional & Pemakanan Manual Tepat di Bawah Layar Simulasi:**
  * **Tombol Operasi Utama:** *Mulai Simulasi*, *Jeda*, *Reset*, *E-Stop*, sakelar *Coolant*, serta tombol *Pemakanan Otomatis* (Auto Feed ON/OFF).
  * **Kontrol Pergerakan Manual Sumbu X & Sumbu Z:**
    * **Sumbu X (Melintang/Radial):** Tombol **X-** untuk memajukan pahat masuk ke benda kerja (*infeed / tambah kedalaman sayat*) dan **X+** untuk memundurkan pahat menjauhi benda kerja (*retract / bebas*).
    * **Sumbu Z (Memanjang/Longitudinal):** Tombol **Z-** untuk menggerakkan pahat memanjang ke kiri menuju cekam (*pemakanan memanjang*) dan **Z+** untuk menggerakkan pahat mundur ke kanan menuju kepala lepas.
    * Dilengkapi pemilih resolusi langkah (*Jog Step: 0.1 mm, 0.5 mm, 1.0 mm*) serta dukungan tombol panah keyboard (*Arrow Keys*).
    * Fitur pengaman otomatis: menekan pergerakan manual akan seketika menghentikan pemakanan otomatis agar posisi pahat terkontrol presisi.
  * **Digital Readout (DRO Live Display):** Menampilkan posisi koordinat aktual sumbu X (kedalaman potong $a$) dan sumbu Z (panjang sayatan $L$) secara real-time.
* **Perhitungan Matematis Pemesinan Nyata:**
  $$\text{Kecepatan Potong } Cs = \frac{\pi \cdot d \cdot n}{1000} \quad (\text{m/menit})$$
  $$\text{Putaran Spindel } n = \frac{1000 \cdot Cs}{\pi \cdot d} \quad (\text{RPM})$$
  $$\text{Waktu Pemesinan } t_c = \frac{L}{f \cdot n} \quad (\text{menit})$$
  $$\text{Kedalaman Pemakanan } a = \frac{d_{awal} - d_{akhir}}{2} \quad (\text{mm})$$
* **Fitur Tombol "⚡ Hitung RPM Ideal":** Menghitung secara otomatis putaran spindel optimum berdasarkan standar kecepatan potong material dan diameter benda kerja.
* **Variasi Material & Pahat:**
  * Material: *Baja Lunak (ST37)*, *Aluminium*, *Kuningan (Brass)*, *Besi Cor (Cast Iron)*, dan *Stainless Steel (SUS 304)*.
  * Pahat: *Pahat HSS* vs *Pahat Karbida (Carbide Insert)*.
* **Kamera Bebas Selama Pembubutan:** Siswa dapat memutar kamera 360° dan memperbesar (*zoom*) langsung ke titik sentuh ujung sayat (*tool-workpiece interface*) saat proses pemakanan sedang berlangsung!

### 4. Tantangan Operator & Lembar Kerja Siswa (LKPD Digital)
* **Kuis Studi Kasus:** Pertanyaan berbasis skenario industri dengan hint rumus dan pembahasan komprehensif.
* **Auto-Generate LKPD (PDF Print-Ready):** Siswa dan guru dapat mencetak atau mengunduh laporan hasil uji simulasi (berisi nama siswa, kelas, parameter yang diuji, nilai kekasaran $Ra$, dan tanda tangan penguji) hanya dengan sekali klik tombol.

### 5. Pengalaman Audio Prosedural (Web Audio API)
* Tidak membutuhkan file MP3 eksternal yang membebani kuota internet.
* Suara dengung dinamo spindel berubah frekuensi mengikuti nilai RPM yang diatur.
* Efek suara gesekan tatal logam saat proses pemotongan berlangsung, klik antarmuka futuristik, serta nada keberhasilan saat naik level.

### 6. Desain Antarmuka Modern (Materially React Admin Theme)
* Mengadopsi arsitektur antarmuka **Materially React Admin Dashboard** yang bersih, elegan, dan profesional.
* Menggunakan palet warna standar industri (Material Blue, Slate, White Surface, dan pastel status chips) serta tipografi Inter/Roboto yang tajam.
* Dilengkapi *Sidebar Navigation Drawer* di sisi kiri dengan grup menu rapi, breadcrumb navigasi di topbar, serta kartu metrik (*Stat Cards*) modern dengan ikon Lucide.
* Bebas dari kesan visual gelap/neon berlebihan, sehingga terlihat layaknya platform pembelajaran enterprise resmi (*human-crafted & enterprise-grade*).

---

## 📂 Struktur File Proyek

```text
├── index.html              # Antarmuka web bergaya Materially React (Sidebar, TopBar, Stat Cards & Modul)
├── css/
│   └── style.css           # Styling Materially: surface cards, clean sliders, drawer, dan print CSS
├── js/
│   ├── audio.js            # Engine suara prosedural (Web Audio API)
│   ├── data.js             # Basis data CP/TP, komponen mesin, aturan K3, material logam, dan kuis
│   ├── simulation.js       # Engine kalkulasi matematika pemesinan & canvas grafis teknis
│   └── app.js              # State management, breadcrumbs, navigasi drawer & cetak LKPD
└── README.md               # Dokumentasi dan panduan penggunaan media ajar
```

---

## 💻 Petunjuk Cara Menjalankan

1. **Buka Langsung di Browser:**
   * Klik dua kali file [index.html](file:///D:/PPG/Courses/Semester%202/Seminar/Mata%20Kuliah%20Semester%202/Lab/index.html) menggunakan Google Chrome, Microsoft Edge, Mozilla Firefox, atau browser smartphone Anda.
   * Berjalan 100% *client-side* tanpa memerlukan instalasi Node.js, Apache, maupun Python.
2. **Penggunaan Responsif di Smartphone:**
   * Pada layar ponsel, sidebar otomatis bertransformasi menjadi *drawer menu* yang dapat dibuka-tutup dengan tombol hamburger di kiri atas.
