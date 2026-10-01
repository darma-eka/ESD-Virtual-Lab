/**
 * Google Sheets Automated Grading Sync Module
 * Handles sending student quiz, K3, and simulation scores to Google Sheets via Apps Script Webhook.
 */
const SyncManager = (function () {
  const STORAGE_KEY = "esd_google_sheet_webhook_url";
  const DEFAULT_URL = ""; // Bisa diisi URL default jika sudah dideploy permanen

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

    // Hitung skor kuis
    let correctCount = 0;
    let totalQ = 5;
    if (typeof AppData !== "undefined" && AppData.quizChallenges) {
      totalQ = AppData.quizChallenges.length;
      correctCount = AppData.quizChallenges.filter(
        (q) => user.quizAnswers && user.quizAnswers[q.id] === q.correct
      ).length;
    }
    const quizScore = Math.round((correctCount / totalQ) * 100);

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
      quizScore: quizScore,
      quizCorrect: correctCount,
      quizTotal: totalQ,
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
    var year = (payload.academicYear || "2024/2025").toString().trim();

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
    submitGrade,
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

