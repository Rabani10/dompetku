// ══════════════════════════════════════════════════════════════════
//  DompetKu - Google Apps Script Backend
//  Paste kode ini di: script.google.com → New Project
//  Lalu: Deploy → New Deployment → Web App → Anyone → Deploy
// ══════════════════════════════════════════════════════════════════

const SPREADSHEET_NAME = "DompetKu";
const SHEET_TRANSACTIONS = "Transaksi";
const SHEET_SUMMARY = "Ringkasan";

// ── GET: cek apakah script aktif ─────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "DompetKu API aktif" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST: terima data dari app ────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === "addTransaction") {
      return addTransaction(payload.data);
    } else if (action === "getTransactions") {
      return getTransactions();
    } else if (action === "deleteTransaction") {
      return deleteTransaction(payload.id);
    }

    return respond({ success: false, error: "Unknown action" });

  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ── TAMBAH TRANSAKSI ──────────────────────────────────────────────
function addTransaction(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_TRANSACTIONS);

  // Buat header jika belum ada
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID", "Tanggal", "Tipe", "Kategori",
      "Deskripsi", "Jumlah", "Catatan", "Waktu Input"
    ]);
    // Style header
    const headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground("#0D1117");
    headerRange.setFontColor("#58A6FF");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  // Cek duplikat berdasarkan ID
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    if (ids.includes(data.id)) {
      return respond({ success: true, message: "Sudah ada" });
    }
  }

  // Tambahkan baris baru
  sheet.appendRow([
    data.id,
    data.date,
    data.type === "income" ? "Pemasukan" : "Pengeluaran",
    data.category,
    data.desc,
    data.amount,
    data.note || "",
    new Date().toLocaleString("id-ID")
  ]);

  // Warna baris berdasarkan tipe
  const row = sheet.getLastRow();
  const rowRange = sheet.getRange(row, 1, 1, 8);
  if (data.type === "income") {
    rowRange.setBackground("#0d2818");
  } else {
    rowRange.setBackground("#2d0d0d");
  }

  // Format kolom jumlah
  sheet.getRange(row, 6).setNumberFormat("#,##0");

  // Update ringkasan
  updateSummary(ss);

  return respond({ success: true, message: "Transaksi ditambahkan" });
}

// ── AMBIL SEMUA TRANSAKSI ─────────────────────────────────────────
function getTransactions() {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_TRANSACTIONS);

  if (!sheet || sheet.getLastRow() <= 1) {
    return respond({ success: true, data: [] });
  }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  const transactions = data.map(row => ({
    id: row[0],
    date: row[1],
    type: row[2] === "Pemasukan" ? "income" : "expense",
    category: row[3],
    desc: row[4],
    amount: row[5],
    note: row[6]
  }));

  return respond({ success: true, data: transactions });
}

// ── HAPUS TRANSAKSI ───────────────────────────────────────────────
function deleteTransaction(id) {
  const ss = getOrCreateSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return respond({ success: false, error: "Sheet tidak ditemukan" });

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return respond({ success: false, error: "Tidak ada data" });

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const rowIndex = ids.indexOf(id);

  if (rowIndex === -1) return respond({ success: false, error: "ID tidak ditemukan" });

  sheet.deleteRow(rowIndex + 2);
  updateSummary(ss);

  return respond({ success: true, message: "Transaksi dihapus" });
}

// ── UPDATE SHEET RINGKASAN ────────────────────────────────────────
function updateSummary(ss) {
  let sheet = ss.getSheetByName(SHEET_SUMMARY);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SUMMARY);
  }

  sheet.clearContents();

  const txSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  if (!txSheet || txSheet.getLastRow() <= 1) return;

  const data = txSheet.getRange(2, 1, txSheet.getLastRow() - 1, 6).getValues();

  // Hitung per bulan
  const monthlyMap = {};
  const catMap = {};

  data.forEach(row => {
    const dateStr = row[1];
    const type = row[2]; // "Pemasukan" atau "Pengeluaran"
    const category = row[3];
    const amount = parseFloat(row[5]) || 0;

    // Parse tanggal
    let dateObj;
    try {
      dateObj = new Date(dateStr);
    } catch(e) { return; }

    const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
    if (type === "Pemasukan") monthlyMap[key].income += amount;
    else monthlyMap[key].expense += amount;

    // Per kategori
    if (type === "Pengeluaran") {
      catMap[category] = (catMap[category] || 0) + amount;
    }
  });

  // Tulis ringkasan bulanan
  sheet.getRange(1, 1).setValue("📊 RINGKASAN BULANAN");
  sheet.getRange(1, 1).setFontWeight("bold").setFontSize(14).setFontColor("#58A6FF");

  sheet.getRange(2, 1, 1, 4).setValues([["Bulan", "Pemasukan", "Pengeluaran", "Saldo"]]);
  sheet.getRange(2, 1, 1, 4).setFontWeight("bold").setBackground("#161B22").setFontColor("#8B949E");

  const sortedMonths = Object.keys(monthlyMap).sort().reverse();
  sortedMonths.forEach((m, i) => {
    const v = monthlyMap[m];
    const row = i + 3;
    sheet.getRange(row, 1, 1, 4).setValues([[
      m,
      v.income,
      v.expense,
      v.income - v.expense
    ]]);
    sheet.getRange(row, 2, 1, 3).setNumberFormat("#,##0");
  });

  // Tulis ringkasan kategori
  const catStart = sortedMonths.length + 5;
  sheet.getRange(catStart, 1).setValue("🏷️ PENGELUARAN PER KATEGORI");
  sheet.getRange(catStart, 1).setFontWeight("bold").setFontSize(12).setFontColor("#58A6FF");
  sheet.getRange(catStart + 1, 1, 1, 2).setValues([["Kategori", "Total"]]);
  sheet.getRange(catStart + 1, 1, 1, 2).setFontWeight("bold").setBackground("#161B22").setFontColor("#8B949E");

  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  sortedCats.forEach(([cat, amount], i) => {
    sheet.getRange(catStart + 2 + i, 1, 1, 2).setValues([[cat, amount]]);
    sheet.getRange(catStart + 2 + i, 2).setNumberFormat("#,##0");
  });

  // Auto-resize columns
  sheet.autoResizeColumns(1, 4);
  txSheet.autoResizeColumns(1, 8);
}

// ── HELPER: Get/Create Spreadsheet ───────────────────────────────
function getOrCreateSpreadsheet() {
  // Cek di Drive apakah sudah ada
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  // Buat baru
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  return ss;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
