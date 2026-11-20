import * as XLSX from "xlsx";

export function bodau(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFC")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function formatMoney(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString("vi-VN");
}

export function parseNumber(str) {
  if (typeof str === "number") return str;
  return Number(String(str || "0").replace(/[^0-9-]/g, "")) || 0;
}

export function exportToExcel(data, fileName = "BaoCao_AnhDuong.xlsx") {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, fileName);
}

export function isDateInRange(dateStr, filterType, customFrom, customTo) {
  if (filterType === "all" || !dateStr) return true;
  let d;
  if (dateStr.includes("/")) {
    const parts = dateStr.split(" ")[0].split("/");
    d = new Date(parts[2], parts[1] - 1, parts[0]);
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return true;
  d.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (filterType === "today") return d.getTime() === now.getTime();
  if (filterType === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return d.getTime() === y.getTime();
  }
  if (filterType === "7days") {
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 7);
    return d >= d7 && d <= now;
  }
  if (filterType === "thisMonth") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  if (filterType === "lastMonth") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }
  if (filterType === "custom") {
    const f = customFrom ? new Date(customFrom) : null;
    const t = customTo ? new Date(customTo) : null;
    if (f) f.setHours(0, 0, 0, 0);
    if (t) t.setHours(23, 59, 59, 999);
    if (f && d < f) return false;
    if (t && d > t) return false;
    return true;
  }
  return true;
}

