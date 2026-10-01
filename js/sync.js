/**
 * Google Sheets Automated Grading Sync Module
 * Handles sending student quiz, K3, and simulation scores to Google Sheets via Apps Script Webhook.
 */
const SyncManager = (function () {
  const STORAGE_KEY = "esd_google_sheet_webhook_url";
  const DEFAULT_URL = "https://script.google.com/macros/s/AKfycbxbDK8uEeJcEUkUtKeOI-rHg9hZffke_mMuc6f4xNHnHTc4jQ5LLRmdF48ZWDFweaj6zw/exec";

  function getWebhookUrl() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
    if (typeof AppData !== "undefined" && AppData.googleSheetConfig && AppData.googleSheetConfig.webAppUrl) {
      return AppData.googleSheetConfig.webAppUrl;
    }
    return DEFAULT_URL;
  }

  function setWebhookUrl(url) {
    const clean = (url || "").trim();
    try {
      localStorage.setItem(STORAGE_KEY, clean);
    } catch (e) {}
    return clean;
  }

  // Mengumpulkan data lengkap performa siswa dari aplikasi
  function gatherStudentData() {
    const user = typeof App !== "undefined" && App.getUserData ? App.getUserData() : {};
    const sim = typeof SimEngine !== "undefined" ? SimEngine.getState() : {};

    // Hitung skor kuis komprehensif
    let correctCount = 0;
    let totalQ = 8;
    if (typeof AppData !== "undefined" && AppData.quizChallenges) {
      totalQ = AppData.quizChallenges.length;
      correctCount = AppData.quizChallenges.filter(
        (q) => user.quizAnswers && user.quizAnswers[q.id] === q.correct
      ).length;
    }
    const compScore = Math.round((correctCount / totalQ) * 100);

    // Hitung skor Quiz 1 (LK-1: Parameter Bubut)
    let q1Correct = 0;
    let q1Total = 10;
    if (typeof AppData !== "undefined" && AppData.quiz1Challenges) {
      q1Total = AppData.quiz1Challenges.length;
      q1Correct = AppData.quiz1Challenges.filter(
        (q) => user.quiz1Answers && user.quiz1Answers[q.id] === q.correct
      ).length;
    }
    const quiz1Score = Math.round((q1Correct / q1Total) * 100);

    // Tentukan quiz aktif
    const activeTab = typeof App !== "undefined" && App.getCurrentQuizTab ? App.getCurrentQuizTab() : "quiz1";
    const activeQuizScore = activeTab === "quiz1" ? quiz1Score : compScore;
    const activeQuizCorrect = activeTab === "quiz1" ? q1Correct : correctCount;
    const activeQuizTotal = activeTab === "quiz1" ? q1Total : totalQ;
    const activeQuizName = activeTab === "quiz1" ? "Quiz 1 (LK-1 Bubut)" : "Uji Kompetensi Mandiri";

    // K3 & Anatomi
    const totalParts = (AppData?.latheParts?.length || 9) + (AppData?.millingParts?.length || 13);
    const learnedCount = (user.learnedParts || []).length;

    // Evaluasi simulasi
    const simCs = sim.evaluation ? sim.evaluation.csActual : "-";
    const simRa = sim.evaluation ? sim.evaluation.ra : "-";
    const simTitle = sim.evaluation ? sim.evaluation.title : "-";

    return {
      action: "submit_grade",
      name: user.name || "Siswa Belum Terdaftar",
      nis: user.nis || "-",
      class: user.class || "11 TP A",
      group: user.group || "-",
      academicYear: user.academicYear || "2024/2025",
      quizName: activeQuizName,
      quizScore: activeQuizScore,
      quizCorrect: activeQuizCorrect,
      quizTotal: activeQuizTotal,
      quiz1Score: quiz1Score,
      quiz1Correct: q1Correct,
      quiz1Total: q1Total,
      compQuizScore: compScore,
      compQuizCorrect: correctCount,
      compQuizTotal: totalQ,
      safetyScore: user.safetyScore || 0,
      safetyStatus: (user.safetyScore || 0) >= 100 ? "LULUS ZERO ACCIDENT" : "TERVERIFIKASI",
      learnedPartsCount: learnedCount,
      learnedPartsTotal: totalParts,
      simCs: simCs,
      simRa: simRa,
      simResult: simTitle,
      timestamp: new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short"
      })
    };
  }

  // Mengumpulkan data lengkap pengerjaan Quiz 1 (LK-1: Parameter Bubut) beserta berkas lampiran
  function gatherQuiz1Data() {
    const user = typeof App !== "undefined" && App.getUserData ? App.getUserData() : {};
    const questions = (typeof AppData !== "undefined" && AppData.quiz1Challenges) ? AppData.quiz1Challenges : [];
    const q1Answers = user.quiz1Answers || {};

    let correctCount = 0;
    const summaryParts = [];

    questions.forEach((q, idx) => {
      const studentAns = q1Answers[q.id];
      if (studentAns === q.correct) {
        correctCount++;
      }
      const letter = (studentAns !== undefined && studentAns !== null) ? String.fromCharCode(65 + studentAns) : "-";
      summaryParts.push(`Q${idx + 1}:${letter}`);
    });

    const totalQ = questions.length || 10;
    const score = Math.round((correctCount / totalQ) * 100);
    const status = score >= 75 ? "LULUS (KOMPETEN)" : "PERLU PENGAYAAN";
    const summaryStr = summaryParts.join(", ");

    let attachmentPayload = null;
    if (user.quiz1Attachment && user.quiz1Attachment.dataUrl) {
      const base64Data = user.quiz1Attachment.dataUrl.split(",")[1] || user.quiz1Attachment.dataUrl;
      attachmentPayload = {
        hasAttachment: true,
        fileName: user.quiz1Attachment.name,
        fileType: user.quiz1Attachment.type,
        fileSize: user.quiz1Attachment.sizeFormatted || `${Math.round(user.quiz1Attachment.size / 1024)} KB`,
        fileData: base64Data
      };
    }

    return {
      action: "submit_quiz1",
      name: user.name || "Siswa Belum Terdaftar",
      nis: user.nis || "-",
      class: user.class || "11 TP A",
      group: user.group || "-",
      academicYear: user.academicYear || "2026/2027",
      quiz1Score: score,
      quiz1Correct: correctCount,
      quiz1Total: totalQ,
      quizStatus: status,
      answersSummary: summaryStr,
      attachment: attachmentPayload,
      timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    };
  }

  // Kirim hasil Quiz 1 & berkas lampiran ke Google Sheets Webhook
  async function submitQuiz1(customPayload = null) {
    const webhookUrl = getWebhookUrl();
    const payload = customPayload || gatherQuiz1Data();

    if (!webhookUrl) {
      try {
        localStorage.setItem("esd_pending_quiz1", JSON.stringify(payload));
      } catch (e) {}
      return {
        success: false,
        noUrl: true,
        message: "URL Google Apps Script belum disetel. Hasil Quiz 1 & berkas lampiran telah tersimpan secara lokal di browser."
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === "success",
        data: result,
        attachmentUrl: result.attachmentUrl || null,
        message: result.message || "Hasil Quiz 1 & Lampiran berhasil disinkronkan ke Google Sheets!"
      };
    } catch (err) {
      console.warn("Sinkronisasi Quiz 1 gagal:", err);
      try {
        localStorage.setItem("esd_pending_quiz1", JSON.stringify(payload));
      } catch (e) {}
      return {
        success: false,
        error: err.message,
        message: "Gagal terhubung ke Google Sheets: " + err.message + ". Data tersimpan aman di browser."
      };
    }
  }

  // Kirim nilai ke Google Sheets Webhook
  async function submitGrade(customPayload = null) {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      return {
        success: false,
        noUrl: true,
        message: "URL Google Apps Script belum disetel. Hubungi Guru / Admin untuk mengisi URL Spreadsheet."
      };
    }

    const payload = customPayload || gatherStudentData();

    try {
      // Menggunakan Content-Type: text/plain;charset=utf-8 untuk menghindari CORS preflight block
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === "success",
        data: result,
        message: result.message || "Nilai berhasil disinkronkan ke Google Sheets!"
      };
    } catch (err) {
      console.warn("Sinkronisasi gagal:", err);
      return {
        success: false,
        error: err.message,
        message: "Gagal terhubung ke Google Sheets: " + err.message
      };
    }
  }

  // Kirim Asesmen Diagnostik Awal & Profil Belajar ke Google Sheets Webhook
  async function submitDiagnostic(customPayload) {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      try {
        localStorage.setItem("esd_pending_diagnostic", JSON.stringify(customPayload));
      } catch (e) {}
      return {
        success: false,
        noUrl: true,
        message: "URL Google Apps Script belum disetel. Hasil pretest telah disimpan secara lokal di browser."
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(customPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.status === "success",
        data: result,
        message: result.message || "Hasil Asesmen Diagnostik berhasil disinkronkan ke Google Sheets!"
      };
    } catch (err) {
      console.warn("Sinkronisasi diagnostik gagal:", err);
      try {
        localStorage.setItem("esd_pending_diagnostic", JSON.stringify(customPayload));
      } catch (e) {}
      return {
        success: false,
        error: err.message,
        message: "Gagal terhubung ke Google Sheets: " + err.message + ". Hasil tersimpan di memori browser."
      };
    }
  }

  // Pengujian koneksi URL Webhook (Khusus Guru / Admin)
  async function testConnection(customUrl = null) {
    const url = customUrl || getWebhookUrl();
    if (!url) {
      return { success: false, message: "URL Web App masih kosong!" };
    }

    try {
      const response = await fetch(url, {
        method: "GET"
      });
      const data = await response.json();
      return {
        success: data.status === "success" || data.status === "ok",
        message: data.message || "Koneksi ke Google Apps Script berhasil!",
        data: data
      };
    } catch (err) {
      return {
        success: false,
        message: "Gagal menghubungi URL Web App: " + err.message
      };
    }
  }

  // Tampilkan Modal Pengaturan Spreadsheet untuk Guru / Admin
  function openModal() {
    const modal = document.getElementById("sheet-sync-modal");
    const inputUrl = document.getElementById("input-sheet-url");
    const statusBox = document.getElementById("sheet-sync-status-box");

    if (inputUrl) {
      inputUrl.value = getWebhookUrl();
    }
    if (statusBox) {
      statusBox.innerHTML = getWebhookUrl()
        ? '<span class="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-4 h-4"></i> URL Webhook Aktif Tersimpan</span>'
        : '<span class="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-4 h-4"></i> Belum ada URL Spreadsheet terpasang</span>';
    }
    if (modal) {
      modal.classList.remove("hidden");
    }
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function closeModal() {
    const modal = document.getElementById("sheet-sync-modal");
    if (modal) modal.classList.add("hidden");
  }

  function saveModalUrl() {
    const inputUrl = document.getElementById("input-sheet-url");
    const val = inputUrl ? inputUrl.value.trim() : "";
    setWebhookUrl(val);
    closeModal();
    if (typeof App !== "undefined" && App.showToast) {
      App.showToast("URL Google Sheets Webhook berhasil disimpan!", "success");
    }
  }

  // Salin Kode Google Apps Script ke Clipboard
  function copyScriptCode() {
    const code = `/**
 * ESD V-LAB — GOOGLE APPS SCRIPT WEBHOOK UNTUK REKAP NILAI OTOMATIS
 * Salin dan tempelkan ke menu Extensions > Apps Script pada Google Sheets Anda.
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    app: "ESD V-Lab Grade Webhook",
    message: "Layanan sinkronisasi Google Sheets ESD V-Lab aktif.",
    timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Payload kosong" })).setMimeType(ContentService.MimeType.JSON);
    }
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Jika Asesmen Diagnostik Awal
    if (payload.action === "submit_diagnostic") {
      var dSheet = ss.getSheetByName("Pretest Diagnostik") || ss.insertSheet("Pretest Diagnostik");
      var dHeaders = ["NO", "WAKTU PENGERJAAN", "NAMA LENGKAP SISWA", "NIS", "KELAS", "KELOMPOK", "SKOR KOGNITIF (0-100)", "BENAR / 10", "KATEGORI KESIAPAN", "GAYA BELAJAR SISWA", "PENGALAMAN MESIN", "KESIAPAN FISIK & K3", "RINCIAN JAWABAN (Q1-Q10)", "TAHUN AJARAN"];
      if (dSheet.getLastRow() < 1) {
        dSheet.getRange(1, 1, 1, dHeaders.length).setValues([dHeaders]).setBackground("#1e40af").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
        dSheet.setRowHeight(1, 35);
        dSheet.setFrozenRows(1);
      }
      var dName = (payload.name || "").toString().trim();
      var dNis = (payload.nis || "").toString().trim();
      var dScore = typeof payload.diagnosticScore !== "undefined" ? Number(payload.diagnosticScore) : 0;
      var dCorrect = typeof payload.diagnosticCorrect !== "undefined" ? Number(payload.diagnosticCorrect) : Math.round(dScore / 10);
      var dCategory = (payload.category || (dScore >= 80 ? "Kesiapan Tinggi (Mahir)" : dScore >= 60 ? "Kesiapan Sedang (Siap)" : "Kesiapan Awal (Perlu Penguatan)")).toString().trim();
      var dTimestamp = payload.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      var dLastRow = dSheet.getLastRow();
      var dTargetRow = -1;
      if (dLastRow >= 2) {
        var dNisRange = dSheet.getRange(2, 4, dLastRow - 1, 1).getValues();
        var dNameRange = dSheet.getRange(2, 3, dLastRow - 1, 1).getValues();
        for (var di = 0; di < dNameRange.length; di++) {
          if ((dNis && dNisRange[di][0] && dNis === dNisRange[di][0].toString().trim()) || (dName && dNameRange[di][0] && dName.toLowerCase() === dNameRange[di][0].toString().trim().toLowerCase())) {
            dTargetRow = di + 2;
            break;
          }
        }
      }
      var dRowValues = [
        dTargetRow > 0 ? dSheet.getRange(dTargetRow, 1).getValue() : (dLastRow >= 2 ? dLastRow : 1),
        dTimestamp, dName, dNis, payload.class || "11 TP A", payload.group || "-",
        dScore, dCorrect + " / 10 Butir", dCategory, payload.learningStyle || "-",
        payload.machineExp || "-", payload.safetyReadiness || "-", payload.answersSummary || "-", payload.academicYear || "2026/2027"
      ];
      if (dTargetRow > 0) {
        dSheet.getRange(dTargetRow, 1, 1, dRowValues.length).setValues([dRowValues]);
        dSheet.getRange(dTargetRow, 7).setBackground(dScore >= 80 ? "#d1fae5" : dScore >= 60 ? "#dbeafe" : "#fef3c7").setFontColor(dScore >= 80 ? "#065f46" : dScore >= 60 ? "#1e40af" : "#92400e").setFontWeight("bold");
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "updated", row: dTargetRow, student: dName, score: dScore, message: "Pretest Diagnostik " + dName + " berhasil diperbarui di tab 'Pretest Diagnostik'." })).setMimeType(ContentService.MimeType.JSON);
      } else {
        dSheet.appendRow(dRowValues);
        var dNewRow = dSheet.getLastRow();
        dSheet.getRange(dNewRow, 7).setBackground(dScore >= 80 ? "#d1fae5" : dScore >= 60 ? "#dbeafe" : "#fef3c7").setFontColor(dScore >= 80 ? "#065f46" : dScore >= 60 ? "#1e40af" : "#92400e").setFontWeight("bold");
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "appended", row: dNewRow, student: dName, score: dScore, message: "Pretest Diagnostik " + dName + " berhasil ditambahkan di tab 'Pretest Diagnostik'." })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Jika Kuis 1 (LK-1 Parameter Bubut + Lampiran Berkas)
    if (payload.action === "submit_quiz1") {
      var qSheet = ss.getSheetByName("Quiz 1 (LK-1 Bubut)") || ss.insertSheet("Quiz 1 (LK-1 Bubut)");
      var qHeaders = ["NO", "WAKTU PENGERJAAN", "NAMA LENGKAP SISWA", "NIS", "KELAS", "KELOMPOK", "SKOR QUIZ 1 (0-100)", "BENAR / 10", "STATUS KELULUSAN", "RINCIAN JAWABAN (Q1-Q10)", "STATUS LAMPIRAN", "LINK GOOGLE DRIVE LAMPIRAN", "TAHUN AJARAN"];
      if (qSheet.getLastRow() < 1) {
        qSheet.getRange(1, 1, 1, qHeaders.length).setValues([qHeaders]).setBackground("#b45309").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
        qSheet.setRowHeight(1, 35);
        qSheet.setFrozenRows(1);
      }
      var qName = (payload.name || "").toString().trim();
      var qNis = (payload.nis || "").toString().trim();
      var qScore = typeof payload.quiz1Score !== "undefined" ? Number(payload.quiz1Score) : 0;
      var qCorrect = typeof payload.quiz1Correct !== "undefined" ? Number(payload.quiz1Correct) : Math.round(qScore / 10);
      var qSummary = qCorrect + " / 10 Soal";
      var qStatus = qScore >= 75 ? "LULUS (KOMPETEN)" : "PERLU PENGAYAAN";
      var qTimestamp = payload.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      var qAttachmentStatus = "Tidak Ada Lampiran";
      var qAttachmentUrl = "-";

      if (payload.attachment && payload.attachment.fileData) {
        try {
          var folderName = "ESD V-Lab - Lampiran LK-1 Siswa";
          var folders = DriveApp.getFoldersByName(folderName);
          var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
          var decodedBytes = Utilities.base64Decode(payload.attachment.fileData);
          var mimeType = payload.attachment.fileType || "application/octet-stream";
          var cleanFileName = (qNis ? qNis + "_" : "") + qName.replace(/[^a-zA-Z0-9]/g, "_") + "_LK1_" + (payload.attachment.fileName || "lampiran");
          var blob = Utilities.newBlob(decodedBytes, mimeType, cleanFileName);
          var driveFile = folder.createFile(blob);
          driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          qAttachmentUrl = driveFile.getUrl();
          qAttachmentStatus = "Terlampir (" + (payload.attachment.fileSize || "File") + ")";
        } catch (errDrive) {
          qAttachmentStatus = "Tercatat di Lab (" + (payload.attachment.fileName || "File") + ")";
          qAttachmentUrl = "Catatan: Izin Google Drive belum aktif (" + errDrive.toString() + ")";
        }
      }

      var qLastRow = qSheet.getLastRow();
      var qTargetRow = -1;
      if (qLastRow >= 2) {
        var qNisRange = qSheet.getRange(2, 4, qLastRow - 1, 1).getValues();
        var qNameRange = qSheet.getRange(2, 3, qLastRow - 1, 1).getValues();
        for (var qi = 0; qi < qNameRange.length; qi++) {
          if ((qNis && qNisRange[qi][0] && qNis === qNisRange[qi][0].toString().trim()) || (qName && qNameRange[qi][0] && qName.toLowerCase() === qNameRange[qi][0].toString().trim().toLowerCase())) {
            qTargetRow = qi + 2;
            break;
          }
        }
      }

      var qRowValues = [
        qTargetRow > 0 ? qSheet.getRange(qTargetRow, 1).getValue() : (qLastRow >= 2 ? qLastRow : 1),
        qTimestamp, qName, qNis, payload.class || "11 TP A", payload.group || "-",
        qScore, qSummary, qStatus, payload.answersSummary || "-", qAttachmentStatus, qAttachmentUrl, payload.academicYear || "2026/2027"
      ];

      if (qTargetRow > 0) {
        qSheet.getRange(qTargetRow, 1, 1, qRowValues.length).setValues([qRowValues]);
        qSheet.getRange(qTargetRow, 7).setBackground(qScore >= 75 ? "#d1fae5" : "#fef3c7").setFontColor(qScore >= 75 ? "#065f46" : "#92400e").setFontWeight("bold");
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "updated", row: qTargetRow, student: qName, score: qScore, attachmentUrl: qAttachmentUrl, message: "Data Quiz 1 (LK-1) siswa " + qName + " berhasil diperbarui di tab 'Quiz 1 (LK-1 Bubut)'." })).setMimeType(ContentService.MimeType.JSON);
      } else {
        qSheet.appendRow(qRowValues);
        var qNewRow = qSheet.getLastRow();
        qSheet.getRange(qNewRow, 7).setBackground(qScore >= 75 ? "#d1fae5" : "#fef3c7").setFontColor(qScore >= 75 ? "#065f46" : "#92400e").setFontWeight("bold");
        return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "appended", row: qNewRow, student: qName, score: qScore, attachmentUrl: qAttachmentUrl, message: "Data Quiz 1 (LK-1) baru untuk " + qName + " berhasil ditambahkan di tab 'Quiz 1 (LK-1 Bubut)'." })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Rekap Evaluasi Mandiri / Kuis Reguler
    var sheet = ss.getSheetByName(payload.class || "11 TP A") || ss.getSheetByName("11 TP A") || ss.getSheets()[0];

    // Pastikan Header Evaluasi tersedia
    if (sheet.getLastColumn() < 6) {
      var evalHeaders = ["NILAI KUIS (0-100)", "BENAR / TOTAL", "SKOR K3 (APD)", "ANATOMI MESIN", "PARAMETER CS & RA", "STATUS EVALUASI", "WAKTU PENGERJAAN", "TAHUN AJARAN"];
      sheet.getRange(1, 6, 1, evalHeaders.length).setValues([evalHeaders]).setBackground("#1e40af").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    }

    var nis = (payload.nis || "").toString().trim();
    var name = (payload.name || "").toString().trim();
    var quizScore = typeof payload.quizScore !== "undefined" ? payload.quizScore : 0;
    var quizSummary = (payload.quizCorrect || 0) + " / " + (payload.quizTotal || 5) + " Benar";
    var safetyScore = (payload.safetyScore || 0) + " Pts";
    var partsLearned = (payload.learnedPartsCount || 0) + " Bagian";
    var simParam = "Cs: " + (payload.simCs || "-") + " m/min | Ra: " + (payload.simRa || "-") + " µm";
    var status = quizScore >= 75 ? "LULUS (KOMPETEN)" : "REMIDI";
    var timestamp = payload.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    var year = (payload.academicYear || "2026/2027").toString().trim();

    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    if (lastRow >= 2) {
      var nameRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      var nisRange = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
      for (var i = 0; i < nameRange.length; i++) {
        if ((nis && nisRange[i][0] && nis === nisRange[i][0].toString().trim()) || (name && nameRange[i][0] && name.toLowerCase() === nameRange[i][0].toString().trim().toLowerCase())) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 6, 1, 8).setValues([[quizScore, quizSummary, safetyScore, partsLearned, simParam, status, timestamp, year]]);
      var cell = sheet.getRange(targetRow, 6);
      cell.setBackground(quizScore >= 75 ? "#d1fae5" : "#fef3c7").setFontColor(quizScore >= 75 ? "#065f46" : "#92400e").setFontWeight("bold");
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "updated", row: targetRow, student: name, message: "Nilai siswa " + name + " berhasil diperbarui di baris " + targetRow })).setMimeType(ContentService.MimeType.JSON);
    } else {
      var nextNo = lastRow >= 2 ? lastRow : 1;
      sheet.appendRow([nextNo, name, nis, payload.class || "11 TP A", payload.group || "-", quizScore, quizSummary, safetyScore, partsLearned, simParam, status, timestamp, year]);
      var newCell = sheet.getRange(sheet.getLastRow(), 6);
      newCell.setBackground(quizScore >= 75 ? "#d1fae5" : "#fef3c7").setFontColor(quizScore >= 75 ? "#065f46" : "#92400e").setFontWeight("bold");
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "appended", row: sheet.getLastRow(), student: name, message: "Data baru " + name + " berhasil ditambahkan" })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🚀 ESD V-Lab")
    .addItem("📊 Siapkan Tab Quiz 1 (LK-1)", "menuSetupQuiz1Tab")
    .addItem("📝 Siapkan Tab Pretest Diagnostik", "menuSetupDiagnosticTab")
    .addToUi();
}

function menuSetupQuiz1Tab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Quiz 1 (LK-1 Bubut)") || ss.insertSheet("Quiz 1 (LK-1 Bubut)", 0);
  var headers = ["NO","WAKTU PENGERJAAN","NAMA LENGKAP SISWA","NIS","KELAS","KELOMPOK","SKOR QUIZ 1 (0-100)","BENAR / 10","STATUS KELULUSAN","RINCIAN JAWABAN (Q1-Q10)","STATUS LAMPIRAN","LINK GOOGLE DRIVE LAMPIRAN","TAHUN AJARAN"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground("#b45309").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert("Tab 'Quiz 1 (LK-1 Bubut)' telah siap!");
}

function menuSetupDiagnosticTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Pretest Diagnostik") || ss.insertSheet("Pretest Diagnostik", 1);
  var headers = ["NO","WAKTU PENGERJAAN","NAMA LENGKAP SISWA","NIS","KELAS","KELOMPOK","SKOR KOGNITIF (0-100)","BENAR / 10","KATEGORI KESIAPAN","GAYA BELAJAR SISWA","PENGALAMAN MESIN","KESIAPAN FISIK & K3","RINCIAN JAWABAN (Q1-Q10)","TAHUN AJARAN"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground("#1e40af").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert("Tab 'Pretest Diagnostik' telah siap!");
}

function otorisasiIzinGoogleDrive() {
  var folder = DriveApp.createFolder("ESD V-Lab - Lampiran LK-1 Siswa");
  Logger.log("Izin Drive aktif: " + folder.getUrl());
}`;

    navigator.clipboard.writeText(code).then(() => {
      if (typeof App !== "undefined" && App.showToast) {
        App.showToast("Kode Google Apps Script berhasil disalin ke clipboard!", "success");
      }
    }).catch(() => {
      alert("Silakan buka file 'google-apps-script/Code.gs' di folder proyek untuk menyalin kodenya.");
    });
  }

  return {
    getWebhookUrl,
    setWebhookUrl,
    gatherStudentData,
    gatherQuiz1Data,
    submitGrade,
    submitQuiz1,
    submitDiagnostic,
    testConnection,
    openModal,
    closeModal,
    saveModalUrl,
    copyScriptCode
  };
})();

// Helper untuk pengetesan dari Modal Admin
window.testWebhookFromModal = async function () {
  const input = document.getElementById("input-sheet-url");
  const statusBox = document.getElementById("sheet-sync-status-box");
  const url = input ? input.value.trim() : "";
  if (!url) {
    if (typeof App !== "undefined" && App.showToast) {
      App.showToast("Masukkan URL Google Apps Script terlebih dahulu!", "danger");
    }
    return;
  }
  if (statusBox) {
    statusBox.innerHTML = '<span class="text-blue-600 font-semibold flex items-center gap-1.5"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Menghubungi Webhook Google...</span>';
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }
  const res = await SyncManager.testConnection(url);
  if (statusBox) {
    if (res.success) {
      statusBox.innerHTML = `<span class="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i> ${res.message}</span>`;
    } else {
      statusBox.innerHTML = `<span class="text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5"><i data-lucide="x-circle" class="w-4 h-4"></i> ${res.message}</span>`;
    }
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }
};

