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

    // Jika ini adalah pengiriman Asesmen Diagnostik Awal (Kognitif 10 Soal + Angket Profil)
    if (payload.action === "submit_diagnostic") {
      return handleDiagnosticSubmission(ss, payload);
    }

    // Jika ini adalah pengiriman Quiz 1 (LK-1: Parameter Bubut + Berkas Lampiran)
    if (payload.action === "submit_quiz1") {
      return handleQuiz1Submission(ss, payload);
    }
    
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

// ==============================================================================================
// PENANGANAN ASESMEN DIAGNOSTIK KOGNITIF & ANGKET NON-KOGNITIF SISWA
// Menyimpan nilai diagnostik 10 butir pilihan ganda + 3 butir angket gaya belajar ke tab "Pretest Diagnostik"
// ==============================================================================================
function handleDiagnosticSubmission(ss, payload) {
  var sheetName = "Pretest Diagnostik";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Header tabel khusus asesmen diagnostik
  var headers = [
    "NO",
    "WAKTU PENGERJAAN",
    "NAMA LENGKAP SISWA",
    "NIS",
    "KELAS",
    "KELOMPOK",
    "SKOR KOGNITIF (0-100)",
    "BENAR / 10",
    "KATEGORI KESIAPAN",
    "GAYA BELAJAR SISWA",
    "PENGALAMAN MESIN",
    "KESIAPAN FISIK & K3",
    "RINCIAN JAWABAN (Q1-Q10)",
    "TAHUN AJARAN"
  ];

  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground("#1e40af")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
  }

  var name = (payload.name || "").toString().trim();
  var nis = (payload.nis || "").toString().trim();
  var className = (payload.class || "11 TP A").toString().trim();
  var group = (payload.group || "-").toString().trim();
  var year = (payload.academicYear || "2026/2027").toString().trim();
  var score = typeof payload.diagnosticScore !== "undefined" ? Number(payload.diagnosticScore) : 0;
  var correctCount = typeof payload.diagnosticCorrect !== "undefined" ? Number(payload.diagnosticCorrect) : Math.round(score / 10);
  var summaryCorrect = correctCount + " / 10 Butir";
  
  var category = (payload.category || (score >= 80 ? "Kesiapan Tinggi (Mahir)" : score >= 60 ? "Kesiapan Sedang (Siap)" : "Kesiapan Awal (Perlu Penguatan)")).toString().trim();
  var learningStyle = (payload.learningStyle || "-").toString().trim();
  var machineExp = (payload.machineExp || "-").toString().trim();
  var safetyReadiness = (payload.safetyReadiness || "-").toString().trim();
  var answersSummary = (payload.answersSummary || "-").toString().trim();
  var timestamp = payload.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  var lastRow = sheet.getLastRow();
  var targetRow = -1;

  if (lastRow >= 2) {
    var nisRange = sheet.getRange(2, 4, lastRow - 1, 1).getValues();  // Kolom D: NIS
    var nameRange = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Kolom C: Nama

    for (var i = 0; i < nameRange.length; i++) {
      var rowNis = (nisRange[i][0] || "").toString().trim();
      var rowName = (nameRange[i][0] || "").toString().trim().toLowerCase();

      if (nis && rowNis && nis === rowNis) {
        targetRow = i + 2;
        break;
      } else if (name && rowName && rowName === name.toLowerCase()) {
        targetRow = i + 2;
        break;
      }
    }
  }

  var rowNumber = targetRow > 0 ? sheet.getRange(targetRow, 1).getValue() : (lastRow >= 2 ? lastRow : 1);
  var rowValues = [
    rowNumber,
    timestamp,
    name,
    nis,
    className,
    group,
    score,
    summaryCorrect,
    category,
    learningStyle,
    machineExp,
    safetyReadiness,
    answersSummary,
    year
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    var scoreCell = sheet.getRange(targetRow, 7);
    formatDiagnosticScoreCell(scoreCell, score);
    return createJsonResponse({
      status: "success",
      action: "updated",
      row: targetRow,
      student: name,
      score: score,
      message: "Data Pretest Diagnostik " + name + " berhasil diperbarui di baris " + targetRow + " tab 'Pretest Diagnostik'."
    });
  } else {
    sheet.appendRow(rowValues);
    var newRow = sheet.getLastRow();
    var newScoreCell = sheet.getRange(newRow, 7);
    formatDiagnosticScoreCell(newScoreCell, score);
    return createJsonResponse({
      status: "success",
      action: "appended",
      row: newRow,
      student: name,
      score: score,
      message: "Data Pretest Diagnostik baru untuk " + name + " berhasil ditambahkan di baris " + newRow + " tab 'Pretest Diagnostik'."
    });
  }
}

function formatDiagnosticScoreCell(cell, score) {
  if (score >= 80) {
    cell.setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold").setHorizontalAlignment("center");
  } else if (score >= 60) {
    cell.setBackground("#dbeafe").setFontColor("#1e40af").setFontWeight("bold").setHorizontalAlignment("center");
  } else {
    cell.setBackground("#fef3c7").setFontColor("#92400e").setFontWeight("bold").setHorizontalAlignment("center");
  }
}

// ==============================================================================================
// PENANGANAN QUIZ 1: LEMBAR KERJA 1 (LK-1) PARAMETER BUBUT & BERKAS LAMPIRAN
// Menyimpan nilai 10 butir perhitungan dan mengunggah berkas lampiran (foto/PDF) ke Google Drive
// ==============================================================================================
function handleQuiz1Submission(ss, payload) {
  var sheetName = "Quiz 1 (LK-1 Bubut)";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Header tabel khusus Quiz 1
  var headers = [
    "NO",
    "WAKTU PENGERJAAN",
    "NAMA LENGKAP SISWA",
    "NIS",
    "KELAS",
    "KELOMPOK",
    "SKOR QUIZ 1 (0-100)",
    "BENAR / 10",
    "STATUS KELULUSAN",
    "RINCIAN JAWABAN (Q1-Q10)",
    "STATUS LAMPIRAN",
    "LINK GOOGLE DRIVE LAMPIRAN",
    "TAHUN AJARAN"
  ];

  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange
      .setBackground("#b45309")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
  }

  var name = (payload.name || "").toString().trim();
  var nis = (payload.nis || "").toString().trim();
  var className = (payload.class || "11 TP A").toString().trim();
  var group = (payload.group || "-").toString().trim();
  var year = (payload.academicYear || "2026/2027").toString().trim();
  var score = typeof payload.quiz1Score !== "undefined" ? Number(payload.quiz1Score) : 0;
  var correctCount = typeof payload.quiz1Correct !== "undefined" ? Number(payload.quiz1Correct) : Math.round(score / 10);
  var summaryCorrect = correctCount + " / 10 Soal";
  var status = score >= 75 ? "LULUS (KOMPETEN)" : "PERLU PENGAYAAN";
  var answersSummary = (payload.answersSummary || "-").toString().trim();
  var timestamp = payload.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  // Proses Lampiran Berkas Siswa (Foto / PDF)
  var attachmentStatus = "Tidak Ada Lampiran";
  var attachmentUrl = "-";

  if (payload.attachment && (payload.attachment.fileData || payload.attachment.dataUrl)) {
    try {
      var folderName = "ESD V-Lab - Lampiran LK-1 Siswa";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

      var rawData = (payload.attachment.fileData || payload.attachment.dataUrl).toString();
      if (rawData.indexOf(",") > -1) {
        rawData = rawData.split(",")[1];
      }
      var decodedBytes = Utilities.base64Decode(rawData);
      var mimeType = payload.attachment.fileType || payload.attachment.type || "application/octet-stream";
      var rawFileName = payload.attachment.fileName || payload.attachment.name || "lampiran";
      var cleanFileName = (nis ? nis + "_" : "") + name.replace(/[^a-zA-Z0-9]/g, "_") + "_LK1_" + rawFileName;
      var blob = Utilities.newBlob(decodedBytes, mimeType, cleanFileName);
      var driveFile = folder.createFile(blob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      attachmentUrl = driveFile.getUrl();
      var sizeText = payload.attachment.fileSize || payload.attachment.size || "File";
      attachmentStatus = "Terlampir (" + sizeText + ")";
    } catch (errDrive) {
      attachmentStatus = "Tercatat di Lab (" + (payload.attachment.fileName || payload.attachment.name || "File") + ")";
      attachmentUrl = "Catatan: Izin Google Drive belum aktif (" + errDrive.toString() + ")";
    }
  }

  // Cari baris siswa yang cocok berdasarkan NIS atau Nama
  var lastRow = sheet.getLastRow();
  var targetRow = -1;

  if (lastRow >= 2) {
    var nisRange = sheet.getRange(2, 4, lastRow - 1, 1).getValues();  // Kolom D: NIS
    var nameRange = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Kolom C: Nama

    for (var i = 0; i < nameRange.length; i++) {
      var rowNis = (nisRange[i][0] || "").toString().trim();
      var rowName = (nameRange[i][0] || "").toString().trim().toLowerCase();

      if (nis && rowNis && nis === rowNis) {
        targetRow = i + 2;
        break;
      } else if (name && rowName && rowName === name.toLowerCase()) {
        targetRow = i + 2;
        break;
      }
    }
  }

  var rowNumber = targetRow > 0 ? sheet.getRange(targetRow, 1).getValue() : (lastRow >= 2 ? lastRow : 1);
  var linkDisplay = (attachmentUrl && attachmentUrl.indexOf("http") === 0)
    ? '=HYPERLINK("' + attachmentUrl + '", "Buka File Drive")'
    : attachmentUrl;

  var rowValues = [
    rowNumber,
    timestamp,
    name,
    nis,
    className,
    group,
    score,
    summaryCorrect,
    status,
    answersSummary,
    attachmentStatus,
    linkDisplay,
    year
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    var scoreCell = sheet.getRange(targetRow, 7);
    formatQuizScoreCell(scoreCell, score);
    return createJsonResponse({
      status: "success",
      action: "updated",
      row: targetRow,
      student: name,
      score: score,
      attachmentUrl: attachmentUrl,
      message: "Data Quiz 1 (LK-1) siswa " + name + " berhasil diperbarui di baris " + targetRow + " tab 'Quiz 1 (LK-1 Bubut)'."
    });
  } else {
    sheet.appendRow(rowValues);
    var newRow = sheet.getLastRow();
    var newScoreCell = sheet.getRange(newRow, 7);
    formatQuizScoreCell(newScoreCell, score);
    return createJsonResponse({
      status: "success",
      action: "appended",
      row: newRow,
      student: name,
      score: score,
      attachmentUrl: attachmentUrl,
      message: "Data Quiz 1 (LK-1) baru untuk " + name + " berhasil ditambahkan di baris " + newRow + " tab 'Quiz 1 (LK-1 Bubut)'."
    });
  }
}

function formatQuizScoreCell(cell, score) {
  if (score >= 75) {
    cell.setBackground("#d1fae5").setFontColor("#065f46").setFontWeight("bold").setHorizontalAlignment("center");
  } else {
    cell.setBackground("#fef3c7").setFontColor("#92400e").setFontWeight("bold").setHorizontalAlignment("center");
  }
}

// Format respon JSON standar
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==============================================================================================
// MENU OTOMATISASI GOOGLE SHEETS
// Menambahkan menu di bilah atas Google Sheets saat dokumen dibuka oleh Guru
// ==============================================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 ESD V-Lab")
    .addItem("📊 Siapkan / Rapikan Tab Quiz 1 (LK-1)", "menuSetupQuiz1Tab")
    .addItem("📝 Siapkan / Rapikan Tab Pretest Diagnostik", "menuSetupDiagnosticTab")
    .addSeparator()
    .addItem("ℹ️ Panduan Singkat Sinkronisasi", "menuShowHelp")
    .addToUi();
}

function menuSetupQuiz1Tab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Quiz 1 (LK-1 Bubut)";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0);
  }

  var headers = [
    "NO",
    "WAKTU PENGERJAAN",
    "NAMA LENGKAP SISWA",
    "NIS",
    "KELAS",
    "KELOMPOK",
    "SKOR QUIZ 1 (0-100)",
    "BENAR / 10",
    "STATUS KELULUSAN",
    "RINCIAN JAWABAN (Q1-Q10)",
    "STATUS LAMPIRAN",
    "LINK GOOGLE DRIVE LAMPIRAN",
    "TAHUN AJARAN"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground("#b45309")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  // Jika tab 11 TP A ada, salin daftar siswa jika belum ada siswa
  var sourceSheet = ss.getSheetByName("11 TP A");
  if (sourceSheet && sheet.getLastRow() <= 1) {
    var lastSourceRow = sourceSheet.getLastRow();
    if (lastSourceRow >= 2) {
      var sourceData = sourceSheet.getRange(2, 1, lastSourceRow - 1, 5).getValues();
      var rowsToInsert = [];
      for (var i = 0; i < sourceData.length; i++) {
        var no = sourceData[i][0] || (i + 1);
        var name = sourceData[i][1] || "";
        var nis = sourceData[i][2] || "";
        var cls = sourceData[i][3] || "11 TP A";
        var grp = sourceData[i][4] || "-";
        if (name) {
          rowsToInsert.push([
            no,
            "-",
            name,
            nis,
            cls,
            grp,
            "",
            "",
            "-",
            "-",
            "Belum Ada Lampiran",
            "-",
            "2026/2027"
          ]);
        }
      }
      if (rowsToInsert.length > 0) {
        sheet.getRange(2, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
      }
    }
  }

  sheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert("Tab 'Quiz 1 (LK-1 Bubut)' telah berhasil disiapkan dan diformat!");
}

function menuSetupDiagnosticTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Pretest Diagnostik";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 1);
  }

  var headers = [
    "NO",
    "WAKTU PENGERJAAN",
    "NAMA LENGKAP SISWA",
    "NIS",
    "KELAS",
    "KELOMPOK",
    "SKOR KOGNITIF (0-100)",
    "BENAR / 10",
    "KATEGORI KESIAPAN",
    "GAYA BELAJAR SISWA",
    "PENGALAMAN MESIN",
    "KESIAPAN FISIK & K3",
    "RINCIAN JAWABAN (Q1-Q10)",
    "TAHUN AJARAN"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground("#1e40af")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  var sourceSheet = ss.getSheetByName("11 TP A");
  if (sourceSheet && sheet.getLastRow() <= 1) {
    var lastSourceRow = sourceSheet.getLastRow();
    if (lastSourceRow >= 2) {
      var sourceData = sourceSheet.getRange(2, 1, lastSourceRow - 1, 5).getValues();
      var rowsToInsert = [];
      for (var i = 0; i < sourceData.length; i++) {
        var no = sourceData[i][0] || (i + 1);
        var name = sourceData[i][1] || "";
        var nis = sourceData[i][2] || "";
        var cls = sourceData[i][3] || "11 TP A";
        var grp = sourceData[i][4] || "-";
        if (name) {
          rowsToInsert.push([
            no,
            "-",
            name,
            nis,
            cls,
            grp,
            "",
            "",
            "-",
            "-",
            "-",
            "-",
            "-",
            "2026/2027"
          ]);
        }
      }
      if (rowsToInsert.length > 0) {
        sheet.getRange(2, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
      }
    }
  }

  sheet.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert("Tab 'Pretest Diagnostik' telah berhasil disiapkan dan diformat!");
}

function menuShowHelp() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "Panduan ESD V-Lab",
    "Spreadsheet ini terhubung secara otomatis dengan laboratorium virtual ESD V-Lab.\n\n" +
    "1. Data Quiz 1 & tautan lampiran Google Drive akan masuk ke tab 'Quiz 1 (LK-1 Bubut)'.\n" +
    "2. Data Asesmen Awal & Angket Gaya Belajar masuk ke tab 'Pretest Diagnostik'.\n" +
    "3. Evaluasi K3 & Uji Kompetensi masuk ke tab '11 TP A'.\n\n" +
    "Pastikan Webhook telah dideploy sebagai Web App dengan akses 'Anyone'.",
    ui.ButtonSet.OK
  );
}

// Fungsi pembantu untuk mengaktifkan izin Google Drive dengan 1 kali klik "Run / Jalankan" di editor Apps Script
function otorisasiIzinGoogleDrive() {
  var folderName = "ESD V-Lab - Lampiran LK-1 Siswa";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  Logger.log("Izin Google Drive aktif! Folder siap digunakan: " + folder.getUrl());
}


