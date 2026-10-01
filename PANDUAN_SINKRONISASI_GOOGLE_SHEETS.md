# Panduan Integrasi Rekap Nilai Otomatis ke Google Sheets
## ESD V-Lab — Laboratorium Pemesinan Bubut & Frais (Fase F SMK)

Dokumen ini berisi panduan langkah-demi-langkah bagi Guru / Penguji untuk menghubungkan aplikasi **ESD V-Lab** ke **Google Spreadsheet** secara *real-time*, sehingga setiap kali siswa menyelesaikan evaluasi atau kuis, nilai akan langsung terisi otomatis pada baris siswa yang bersangkutan tanpa perlu input manual.

---

### Alur Kerja Sistem (*System Architecture*)

```
[Siswa Menyelesaikan Kuis / Praktik di ESD V-Lab]
                       │
                       ▼ (fetch POST JSON)
        [Google Apps Script Webhook]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[Cari Siswa Berdasarkan NIS / Nama]
         │
         ├───► Jika Ditemukan: Perbarui Nilai Kolom F - M pada Baris Siswa
         └───► Jika Baru: Tambahkan Baris Baru di Bagian Bawah
```

---

### Langkah 1: Siapkan Google Spreadsheet
1. Buka [Google Drive](https://drive.google.com).
2. Unggah file **`LABEL PENILAIAN.xlsx`** (yang berada di folder `D:\PPG\Courses\Semester 2\Seminar\RPP\ARTEFAK\LABEL PENILAIAN.xlsx`) ke Google Drive Anda.
3. Buka file tersebut, lalu pilih **Buka dengan Google Spreadsheet (Open with Google Sheets)**.
4. Pastikan terdapat Tab/Sheet bernama **`11 TP A`** yang berisi daftar 36 siswa dengan kolom:
   - Kolom A: `NO`
   - Kolom B: `NAMA`
   - Kolom C: `NIS`
   - Kolom D: `KELAS`
   - Kolom E: `Kelompok`

---

### Langkah 2: Pasang Kode Google Apps Script
1. Pada Google Spreadsheet yang sedang terbuka, klik menu:
   **Extensions (Ekstensi) > Apps Script**.
2. Hapus seluruh baris kode bawaan `function myFunction() { ... }` yang ada di editor.
3. Buka file **`google-apps-script/Code.gs`** dari proyek ini, atau salin kode lengkap di bawah ini, lalu tempelkan (*paste*) ke editor Apps Script:

```javascript
/**
 * ESD V-LAB — GOOGLE APPS SCRIPT WEBHOOK REKAP NILAI OTOMATIS
 */
function doGet(e) {
  var response = {
    status: "success",
    app: "ESD V-Lab Grade Webhook",
    message: "Layanan sinkronisasi Google Sheets ESD V-Lab aktif.",
    timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Tidak ada data yang diterima."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. PENGIRIMAN ASESMEN DIAGNOSTIK AWAL (Tab 'Pretest Diagnostik')
    if (payload.action === "submit_diagnostic") {
      var dSheet = ss.getSheetByName("Pretest Diagnostik") || ss.insertSheet("Pretest Diagnostik");
      var dHeaders = [
        "NO", "WAKTU PENGERJAAN", "NAMA LENGKAP SISWA", "NIS", "KELAS", "KELOMPOK",
        "SKOR KOGNITIF (0-100)", "BENAR / 10", "KATEGORI KESIAPAN", "GAYA BELAJAR SISWA",
        "PENGALAMAN MESIN", "KESIAPAN FISIK & K3", "RINCIAN JAWABAN (Q1-Q10)", "TAHUN AJARAN"
      ];
      if (dSheet.getLastRow() < 1) {
        dSheet.getRange(1, 1, 1, dHeaders.length).setValues([dHeaders])
          .setBackground("#1e40af").setFontColor("#ffffff").setFontWeight("bold")
          .setHorizontalAlignment("center").setVerticalAlignment("middle");
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
        dSheet.getRange(dTargetRow, 7)
          .setBackground(dScore >= 80 ? "#d1fae5" : dScore >= 60 ? "#dbeafe" : "#fef3c7")
          .setFontColor(dScore >= 80 ? "#065f46" : dScore >= 60 ? "#1e40af" : "#92400e").setFontWeight("bold");
        return ContentService.createTextOutput(JSON.stringify({
          status: "success", action: "updated", row: dTargetRow, student: dName, score: dScore,
          message: "Pretest Diagnostik " + dName + " berhasil diperbarui di tab 'Pretest Diagnostik'."
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        dSheet.appendRow(dRowValues);
        var dNewRow = dSheet.getLastRow();
        dSheet.getRange(dNewRow, 7)
          .setBackground(dScore >= 80 ? "#d1fae5" : dScore >= 60 ? "#dbeafe" : "#fef3c7")
          .setFontColor(dScore >= 80 ? "#065f46" : dScore >= 60 ? "#1e40af" : "#92400e").setFontWeight("bold");
        return ContentService.createTextOutput(JSON.stringify({
          status: "success", action: "appended", row: dNewRow, student: dName, score: dScore,
          message: "Pretest Diagnostik " + dName + " berhasil ditambahkan di tab 'Pretest Diagnostik'."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. PENGIRIMAN NILAI KUIS REGULER & PRAKTIK (Tab '11 TP A')
    var sheet = ss.getSheetByName(payload.class || "11 TP A") || ss.getSheetByName("11 TP A") || ss.getSheets()[0];

    // Buat header evaluasi otomatis jika belum ada (Kolom F - M)
    if (sheet.getLastColumn() < 6) {
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
      sheet.getRange(1, 6, 1, evalHeaders.length)
        .setValues([evalHeaders])
        .setBackground("#1e40af")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
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
        var cNis = (nisRange[i][0] || "").toString().trim();
        var cName = (nameRange[i][0] || "").toString().trim().toLowerCase();
        if ((nis && cNis && nis === cNis) || (name && cName && cName === name.toLowerCase())) {
          targetRow = i + 2;
          break;
        }
      }
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 6, 1, 8).setValues([[
        quizScore, quizSummary, safetyScore, partsLearned, simParam, status, timestamp, year
      ]]);
      var cell = sheet.getRange(targetRow, 6);
      cell.setBackground(quizScore >= 75 ? "#d1fae5" : "#fef3c7")
          .setFontColor(quizScore >= 75 ? "#065f46" : "#92400e")
          .setFontWeight("bold");

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "updated",
        row: targetRow,
        student: name,
        message: "Nilai siswa " + name + " (NIS: " + nis + ") berhasil diperbarui di Baris " + targetRow
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      var nextNo = lastRow >= 2 ? lastRow : 1;
      sheet.appendRow([
        nextNo, name, nis, payload.class || "11 TP A", payload.group || "-",
        quizScore, quizSummary, safetyScore, partsLearned, simParam, status, timestamp, year
      ]);
      var newCell = sheet.getRange(sheet.getLastRow(), 6);
      newCell.setBackground(quizScore >= 75 ? "#d1fae5" : "#fef3c7")
             .setFontColor(quizScore >= 75 ? "#065f46" : "#92400e")
             .setFontWeight("bold");

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "appended",
        row: sheet.getLastRow(),
        student: name,
        message: "Data siswa baru " + name + " berhasil ditambahkan"
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

4. Klik tombol **Save Project** (ikon disket 💾) atau tekan `Ctrl + S`. Beri nama proyek misalnya `Webhook Nilai ESD V-Lab`.

---

### Langkah 3: Terapkan (*Deploy*) Sebagai Web App
1. Klik tombol biru **Deploy** (Terapkan) di pojok kanan atas > pilih **New deployment** (Penerapan baru).
2. Di jendela pop-up, klik ikon gerigi di sebelah kiri *Select type*, lalu pilih **Web app**.
3. Isi parameter konfigurasi berikut:
   - **Description**: `Webhook Rekap Nilai 11 TP A`
   - **Execute as**: `Me (<email-anda>@gmail.com)`
   - **Who has access**: **`Anyone`** *(PENTING: Pilih "Anyone" agar lab virtual di browser siswa dapat mengirim data tanpa harus meminta siswa login akun Google satu per satu).*
4. Klik tombol **Deploy**.
5. Google akan meminta izin akses pertama kali:
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik tautan kecil di bawah: **Advanced (Lanjutan)** > klik **Go to Webhook Nilai ESD V-Lab (unsafe)**.
   - Klik **Allow**.
6. Salin **Web app URL** yang muncul (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Langkah 4: Hubungkan ke ESD V-Lab
1. Buka aplikasi **ESD V-Lab** di browser Anda.
2. Masuk sebagai **Admin ESDVLab** (bisa menggunakan tombol cepat *👑 Admin ESDVLab* di Welcome Screen).
3. Di bilah navigasi Sidebar atau tombol di Header atas, klik menu **Sinkron Google Sheets**.
4. Tempelkan (*paste*) URL Web App yang sudah Anda salin ke kolom input.
5. Klik tombol **Tes URL**.
   - Jika berhasil, akan muncul notifikasi hijau: `✅ Layanan sinkronisasi Google Sheets ESD V-Lab aktif.`
6. Klik tombol **Simpan URL Webhook**.
7. Selesai! URL ini kini tersimpan di memori aplikasi lab.

---

### Langkah 5: Pembuktian & Pengujian
1. Masuk ke ESD V-Lab sebagai siswa (misalnya akun **Abyan Maulana** NIS 22188 atau akun tes).
2. Buka menu **Uji Kompetensi Mandiri** di sidebar.
3. Jawab kuis hingga selesai.
4. Pada kotak ringkasan hasil evaluasi, klik tombol hijau **"Kirim Nilai ke Spreadsheet Guru"**.
5. Buka tab Google Spreadsheet Anda di browser. Anda akan melihat:
   - Baris milik siswa (misal: baris ke-2 untuk Abyan Maulana) langsung terisi nilai kuis, status lulus/remidi (berwarna hijau/kuning), skor K3, parameter pemesinan, dan waktu pengiriman secara otomatis!

---

### Tips Tambahan untuk Guru / Peneliti PTK:
- **Export ke Excel**: Kapan pun Anda butuh file `.xlsx` untuk lampiran laporan PTK / Seminar PPG, cukup buka Google Spreadsheet Anda lalu klik **File > Download > Microsoft Excel (.xlsx)**.
- **Kerahasiaan Nilai**: Siswa hanya dapat mengirim nilai mereka sendiri dan tidak memiliki akses untuk melihat spreadsheet rekap milik guru.
