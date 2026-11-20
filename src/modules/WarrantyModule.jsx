import React, { useState, useEffect } from "react";
import { callApi } from "../services/api";
import { bodau } from "../utils/helpers";
import { ShieldCheck, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function WarrantyModule({ mode, customers, products, onRefresh }) {
  const isSellable = mode === "baoHanhBD" || mode === "lsBHBD";
  const isHistory = mode === "lsBHKBD" || mode === "lsBHBD";

  const [custName, setCustName] = useState("");
  const [prodName, setProdName] = useState("");
  const [qty, setQty] = useState(1);
  const [isDone, setIsDone] = useState(false);

  const [historyList, setHistoryList] = useState([]);
  const [filterProd, setFilterProd] = useState("");

  const loadHistory = async () => {
    try {
      const data = await callApi(isSellable ? "getLsBHBD" : "getLsBHKBD");
      setHistoryList(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isHistory) loadHistory();
  }, [mode]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!custName || !prodName) return Swal.fire("Thiếu thông tin", "Chọn khách và sản phẩm", "warning");
    try {
      const action = isSellable ? "saveBaoHanhBDData" : "saveBaoHanhData";
      await callApi(action, [{ customerName: custName, productName: prodName, qty: Number(qty), done: isDone }]);
      Swal.fire("Đã lưu bảo hành!", isSellable ? "Đã cộng lại tồn kho!" : "", "success");
      setQty(1);
      onRefresh();
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    }
  };

  const handleDeleteRow = async (rowIndex) => {
    try {
      await callApi(isSellable ? "deleteBHBDRow" : "deleteBHKBDRow", [rowIndex]);
      loadHistory();
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    }
  };

  if (isHistory) {
    const filtered = historyList.filter((r) => bodau(r.productName).includes(bodau(filterProd)));
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border flex justify-between items-center gap-3">
          <h2 className="font-bold text-slate-800">
            {isSellable ? "Lịch Sử BH Bán Được (+Kho)" : "Lịch Sử BH Không Bán Được"}
          </h2>
          <input
            type="text"
            value={filterProd}
            onChange={(e) => setFilterProd(e.target.value)}
            placeholder="Lọc theo tên sản phẩm..."
            className="p-2 border rounded-xl text-base"
          />
        </div>

        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Ngày</th>
                <th className="p-3">Khách Hàng</th>
                <th className="p-3">Sản Phẩm</th>
                <th className="p-3 text-center">SL</th>
                <th className="p-3 text-center">Trạng Thái</th>
                <th className="p-3 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3 font-medium">{r.customerName}</td>
                  <td className="p-3">{r.productName}</td>
                  <td className="p-3 text-center font-bold">{r.qty}</td>
                  <td className="p-3 text-center">{r.done ? "Đã BH" : "Chờ xử lý"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDeleteRow(r.rowIndex || i)} className="text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl mx-auto bg-white p-5 rounded-2xl border space-y-4">
      <h2 className="text-lg font-bold text-blue-700">
        {isSellable ? "Nhập Bảo Hành Bán Được (Cộng Tồn Kho)" : "Nhập Bảo Hành Không Bán Được"}
      </h2>
      <div>
        <label className="text-xs font-semibold">Khách hàng</label>
        <select value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-base">
          <option value="">-- Chọn khách hàng --</option>
          {customers.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold">Sản phẩm bảo hành</label>
        <select value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-base">
          <option value="">-- Chọn sản phẩm --</option>
          {products.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold">Số lượng</label>
        <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full mt-1 p-2.5 border rounded-xl text-base" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isDone} onChange={(e) => setIsDone(e.target.checked)} className="w-5 h-5 rounded" />
        <span className="font-medium text-sm">Đã bảo hành xong</span>
      </label>
      <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
        <ShieldCheck className="w-5 h-5" /> Lưu Thông Tin Bảo Hành
      </button>
    </form>
  );
}

