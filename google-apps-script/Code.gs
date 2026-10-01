/**
 * ==============================================================================================
 * ESD V-LAB — GOOGLE APPS SCRIPT WEBHOOK UNTUK REKAP NILAI OTOMATIS
 * Mata Pelajaran: Teknik Pemesinan (Fase F - SMK)
 * Integrasi: Tab "11 TP A" dari LABEL PENILAIAN.xlsx
 * ==============================================================================================
 * 
 * PANDUAN SINGKAT PEMASANGAN:
 * 1. Buka file Google Sheets hasil impor / upload dari "LABEL PENILAIAN.xlsx".
 * 2. Klik menu "Extensions" (Ekstensi) > "Apps Script".
 * 3. Hapus seluruh isi editor Apps Script yang ada, lalu salin (paste) SELURUH KODE ini.
 * 4. Klik ikon "Save" (Simpan proyek).
 * 5. Klik tombol biru "Deploy" (Terapkan) di pojok kanan atas > pilih "New deployment" (Penerapan baru).
 * 6. Pada ikon gerigi "Select type", pilih "Web app" (Aplikasi web).
 * 7. Isi konfigurasi:
 *    - Description: "Webhook Nilai ESD V-Lab"
 *    - Execute as: "Me" (Email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - agar web app lab siswa dapat mengirim nilai tanpa login google).
 * 8. Klik "Deploy", izinkan akses akun Google (Review Permissions > Advanced > Go to Untitled project (unsafe) > Allow).
 * 9. Salin "Web app URL" (akhiran /exec) dan tempelkan ke menu "Pengaturan Spreadsheet" di ESD V-Lab.
 */

// Menangani permintaan GET (Untuk pengujian status koneksi dari browser atau lab)
function doGet(e) {
  var response = {
    status: "success",
    app: "ESD V-Lab Grade Webhook",
    message: "Layanan sinkronisasi Google Sheets ESD V-Lab aktif dan siap menerima data nilai siswa.",
    timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Menangani pengiriman nilai siswa via POST dari aplikasi ESD V-Lab
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Kunci thread selama maksimal 10 detik agar penulisan baris paralel dari banyak siswa tidak bentrok
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Tidak ada data (payload) yang diterima dari permintaan."
      });
    }

    var payload = JSON.parse(e.postData.contents);

    // Ambil spreadsheet aktif
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Cari tab "11 TP A" terlebih dahulu, jika tidak ada gunakan tab aktif pertama
    var targetSheetName = payload.class || "11 TP A";
    var sheet = ss.getSheetByName(targetSheetName);
    if (!sheet) {
      sheet = ss.getSheetByName("11 TP A");
    }
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    // Pastikan Header Evaluasi tersedia mulai kolom F (Kolom 6)
    ensureEvaluationHeaders(sheet);

    // Data dari siswa
    var nis = (payload.nis || "").toString().trim();
    var name = (payload.name || "").toString().trim();
    var className = (payload.class || "11 TP A").toString().trim();
    var group = (payload.group || "").toString().trim();
    var year = (payload.academicYear || "2024/2025").toString().trim();
    
    var quizScore = typeof payload.quizScore !== "undefined" ? payload.quizScore : 0;
    var quizSummary = (payload.quizCorrect || 0) + " / " + (payload.quizTotal || 5) + " Benar";
    var safetyScore = (payload.safetyScore || 0) + " Pts";
    var partsLearned = (payload.learnedPartsCount || 0) + " Bagian";
    var simParam = "Cs: " + (payload.simCs || "-") + " m/min | Ra: " + (payload.simRa || "-") + " µm";
    var status = quizScore >= 75 ? "LULUS (KOMPETEN)" : "REMIDI";
    var timestamp = payload.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    // Cari baris siswa yang cocok berdasarkan NIS atau Nama
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow >= 2) {
      var nameRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // Kolom B: Nama
      var nisRange = sheet.getRange(2, 3, lastRow - 1, 1).getValues();  // Kolom C: NIS

      for (var i = 0; i < nameRange.length; i++) {
        var currentNis = (nisRange[i][0] || "").toString().trim();
        var currentName = (nameRange[i][0] || "").toString().trim().toLowerCase();

        // Cocokkan NIS jika ada, atau cocokkan nama siswa
        if (nis && currentNis && nis === currentNis) {
          targetRow = i + 2;
          break;
        } else if (name && currentName && currentName === name.toLowerCase()) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 0) {
      // Siswa ditemukan di daftar (update baris siswa yang bersangkutan pada Kolom F sampai M)
      // F: Nilai Kuis | G: Benar/Total | H: K3 APD | I: Anatomi | J: Parameter Simulasi | K: Status | L: Waktu Pengerjaan | M: Tahun Ajaran
      sheet.getRange(targetRow, 6, 1, 8).setValues([[
        quizScore,
        quizSummary,
        safetyScore,
        partsLearned,
        simParam,
        status,
        timestamp,
        year
      ]]);

      // Beri warna latar belakang lembut pada nilai kuis (hijau jika lulus, kuning jika remidi)
      var scoreCell = sheet.getRange(targetRow, 6);
      if (quizScore >= 75) {
        scoreCell.setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
      } else {
        scoreCell.setBackground("#fef3c7").setFontColor("#92400e").setFontWeight("bold");
      }

      return createJsonResponse({
        status: "success",
        action: "updated",
        row: targetRow,
        student: name,
        nis: nis,
        quizScore: quizScore,
        message: "Nilai siswa " + name + " (NIS: " + nis + ") berhasil diperbarui di Baris " + targetRow + "."
      });

    } else {
      // Siswa belum ada di baris tabel, buat baris baru di bawah
      var nextNo = lastRow >= 2 ? (lastRow) : 1;
      var newRowValues = [
        nextNo,
        name,
        nis,
        className,
        group,
        quizScore,
        quizSummary,
        safetyScore,
        partsLearned,
        simParam,
        status,
        timestamp,
        year
      ];
      sheet.appendRow(newRowValues);
      var insertedRow = sheet.getLastRow();

      var newScoreCell = sheet.getRange(insertedRow, 6);
      if (quizScore >= 75) {
        newScoreCell.setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold");
      } else {
        newScoreCell.setBackground("#fef3c7").setFontColor("#92400e").setFontWeight("bold");
      }

      return createJsonResponse({
        status: "success",
        action: "appended",
        row: insertedRow,
        student: name,
        nis: nis,
        quizScore: quizScore,
        message: "Data siswa baru " + name + " berhasil ditambahkan pada Baris " + insertedRow + "."
      });
    }

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan pada Google Apps Script: " + error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

// Fungsi bantu untuk memeriksa dan melengkapi header tabel jika belum ada
function ensureEvaluationHeaders(sheet) {
  var headers = [
    "NO",
    "NAMA",
    "NIS",
    "KELAS",
    "Kelompok",
    "NILAI KUIS (0-100)",
    "BENAR / TOTAL",
    "SKOR K3 (APD)",
    "ANATOMI MESIN",
    "PARAMETER CS & RA",
    "STATUS EVALUASI",
    "WAKTU PENGERJAAN",
    "TAHUN AJARAN"
  ];

  var existingLastCol = sheet.getLastColumn();
  if (existingLastCol < 6) {
    // Header evaluasi belum ada, set baris 1 mulai kolom F (6)
    var evalHeaders = [
      "NILAI KUIS (0-100)",
      "BENAR / TOTAL",
      "SKOR K3 (APD)",
      "ANATOMI MESIN",
      "PARAMETER CS & RA",
      "STATUS EVALUASI",
      "WAKTU PENGERJAAN",
      "TAHUN AJARAN"
    ];
    var range = sheet.getRange(1, 6, 1, evalHeaders.length);
    range.setValues([evalHeaders]);
    range.setBackground("#1e40af").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  }
}

// Format respon JSON standar
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
