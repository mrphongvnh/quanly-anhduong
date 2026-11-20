import React, { useState, useEffect } from "react";
import { callApi } from "../services/api";
import { bodau, formatMoney, exportToExcel, isDateInRange } from "../utils/helpers";
import { Save, Download, Edit } from "lucide-react";
import Swal from "sweetalert2";

export default function WarehouseModule({ mode, products, onRefresh }) {
  const [prodQuery, setProdQuery] = useState("");
  const [importItems, setImportItems] = useState([]);
  const [editingImportId, setEditingImportId] = useState(null);

  const [importHistory, setImportHistory] = useState([]);
  const [page, setPage] = useState(1);

  const [selectedProdCode, setSelectedProdCode] = useState("");
  const [dateRange, setDateRange] = useState("thisMonth");
  const [lookupResults, setLookupResults] = useState([]);

  useEffect(() => {
    if (mode === "importHistory" || mode === "searchImport") {
      callApi("getImportHistory").then((d) => setImportHistory(d || [])).catch(() => {});
    }
    if (mode === "searchCompleted") {
      callApi("getAllHistories", ["", "Admin", true])
        .then((d) => setLookupResults(d?.hoanThanh || []))
        .catch(() => {});
    }
  }, [mode]);

  if (mode === "import") {
    const handleSaveImport = async () => {
      if (importItems.length === 0) return Swal.fire("Chưa có sản phẩm nhập", "", "warning");
      try {
        if (editingImportId) {
          await callApi("updateImportData", [editingImportId, importItems]);
          Swal.fire("Đã cập nhật phiếu nhập!", "", "success");
        } else {
          await callApi("saveImportData", [importItems]);
          Swal.fire("Nhập kho thành công!", "", "success");
        }
        setImportItems([]);
        setEditingImportId(null);
        onRefresh();
      } catch (err) {
        Swal.fire("Lỗi", err.message, "error");
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border space-y-3">
          <h2 className="font-bold text-lg text-blue-700">
            {editingImportId ? `Sửa Phiếu Nhập: ${editingImportId}` : "Tạo Phiếu Nhập Kho"}
          </h2>
          <input
            type="text"
            value={prodQuery}
            onChange={(e) => setProdQuery(e.target.value)}
            placeholder="Tìm sản phẩm theo tên hoặc mã SP..."
            className="w-full p-2.5 border rounded-xl text-base"
          />
          {prodQuery && (
            <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
              {products
                .filter((p) => bodau(p.name).includes(bodau(prodQuery)) || bodau(p.code).includes(bodau(prodQuery)))
                .slice(0, 20)
                .map((p) => (
                  <button
                    key={p.code}
                    onClick={() => {
                      setImportItems((prev) => [...prev, { code: p.code, name: p.name, qty: 1, note: "" }]);
                      setProdQuery("");
                    }}
                    className="w-full text-left p-2.5 hover:bg-blue-50 flex justify-between text-sm"
                  >
                    <span><b>[{p.code}]</b> {p.name}</span>
                    <span className="text-slate-500">Tồn: {p.stock}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border space-y-3">
          {importItems.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl">
              <div className="sm:col-span-5 font-medium text-sm">{it.name}</div>
              <div className="sm:col-span-2">
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => {
                    const cp = [...importItems];
                    cp[idx].qty = Number(e.target.value);
                    setImportItems(cp);
                  }}
                  placeholder="SL nhập"
                  className="w-full p-2 border rounded-lg bg-white text-base"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={it.note}
                  onChange={(e) => {
                    const cp = [...importItems];
                    cp[idx].note = e.target.value;
                    setImportItems(cp);
                  }}
                  placeholder="Ghi chú nhà cung cấp..."
                  className="w-full p-2 border rounded-lg bg-white text-base"
                />
              </div>
              <button
                onClick={() => setImportItems((p) => p.filter((_, i) => i !== idx))}
                className="sm:col-span-1 text-red-600 text-xs font-bold"
              >
                Xóa
              </button>
            </div>
          ))}

          <button
            onClick={handleSaveImport}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Lưu Phiếu Nhập Kho
          </button>
        </div>
      </div>
    );
  }

  if (mode === "importHistory") {
    const paged = importHistory.slice((page - 1) * 20, page * 20);
    return (
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b font-bold">Lịch Sử Nhập Kho ({importHistory.length} phiếu)</div>
        <div className="divide-y">
          {paged.map((imp) => (
            <div key={imp.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-blue-700">{imp.id} — Ngày: {imp.date}</div>
                <div className="text-xs text-slate-500">{(imp.items || []).length} mặt hàng</div>
              </div>
              <button
                onClick={() => {
                  setEditingImportId(imp.id);
                  setImportItems(imp.items || []);
                }}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Sửa phiếu
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 bg-slate-50 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded">Trước</button>
          <span className="py-1 text-sm">Trang {page}</span>
          <button disabled={page * 20 >= importHistory.length} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">Sau</button>
        </div>
      </div>
    );
  }

  const sourceList = mode === "searchImport" ? importHistory : lookupResults;
  const matchedRows = [];
  if (selectedProdCode) {
    sourceList.forEach((doc) => {
      if (!isDateInRange(doc.date, dateRange)) return;
      (doc.items || []).forEach((it) => {
        if (it.code === selectedProdCode) {
          matchedRows.push({
            id: doc.id,
            date: doc.date,
            partner: doc.customerName || "Nhập kho",
            qty: Number(it.qty || 0),
            note: it.note || "",
          });
        }
      });
    });
  }
  const totalQty = matchedRows.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={selectedProdCode}
          onChange={(e) => setSelectedProdCode(e.target.value)}
          className="p-2.5 border rounded-xl text-base sm:col-span-2"
        >
          <option value="">-- Chọn 1 sản phẩm để tra cứu --</option>
          {products.map((p) => (
            <option key={p.code} value={p.code}>[{p.code}] {p.name}</option>
          ))}
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="p-2.5 border rounded-xl text-base">
          <option value="today">Hôm nay</option>
          <option value="7days">7 ngày qua</option>
          <option value="thisMonth">Tháng này</option>
          <option value="lastMonth">Tháng trước</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-500">Tổng Số Phiếu</div>
          <div className="text-xl font-bold">{matchedRows.length} phiếu</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-500">Tổng Số Lượng</div>
          <div className="text-xl font-bold text-blue-700">{formatMoney(totalQty)}</div>
        </div>
        <button
          onClick={() => exportToExcel(matchedRows, `TraCuu_${selectedProdCode}.xlsx`)}
          className="bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 p-4"
        >
          <Download className="w-5 h-5" /> Tải Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Mã Phiếu</th>
              <th className="p-3">Ngày</th>
              <th className="p-3">Đối Tượng</th>
              <th className="p-3 text-right">Số Lượng</th>
              <th className="p-3">Ghi Chú</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {matchedRows.map((r, i) => (
              <tr key={i}>
                <td className="p-3 font-bold">{r.id}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.partner}</td>
                <td className="p-3 text-right font-bold text-blue-700">{r.qty}</td>
                <td className="p-3">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

