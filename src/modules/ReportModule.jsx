import React, { useState, useMemo } from "react";
import { bodau, formatMoney, exportToExcel, isDateInRange } from "../utils/helpers";
import { Download, Printer } from "lucide-react";

export default function ReportModule({ mode, appData, histories }) {
  const [searchBy, setSearchBy] = useState("product");
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState("thisMonth");

  const [reportTab, setReportTab] = useState("revenue");
  const [categoryFilter, setCategoryFilter] = useState("all");

  if (mode === "searchHistory") {
    const q = bodau(query);
    const soldRows = [];
    const pendingRows = [];

    if (q) {
      (histories.hoanThanh || []).forEach((o) => {
        if (!isDateInRange(o.date, dateRange)) return;
        if (searchBy === "customer" && bodau(o.customerName).includes(q)) {
          soldRows.push(o);
        } else if (searchBy === "product") {
          (o.items || []).forEach((it) => {
            if (bodau(it.name).includes(q)) soldRows.push({ ...o, matchedItem: it });
          });
        }
      });

      (histories.hoaDon || []).forEach((o) => {
        if (!isDateInRange(o.date, dateRange)) return;
        if (searchBy === "customer" && bodau(o.customerName).includes(q)) {
          pendingRows.push(o);
        } else if (searchBy === "product") {
          (o.items || []).forEach((it) => {
            if (bodau(it.name).includes(q)) pendingRows.push({ ...o, matchedItem: it });
          });
        }
      });
    }

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} className="p-2.5 border rounded-xl text-base">
            <option value="product">Tra cứu theo Sản Phẩm</option>
            <option value="customer">Tra cứu theo Khách Hàng</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="p-2.5 border rounded-xl text-base sm:col-span-2"
          />
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="p-2.5 border rounded-xl text-base">
            <option value="thisMonth">Tháng này</option>
            <option value="7days">7 ngày</option>
            <option value="all">Tất cả</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
            <div className="text-xs text-emerald-700 font-semibold">Tổng Lượt Đã Bán (Hoàn Thành)</div>
            <div className="text-2xl font-bold text-emerald-700">{soldRows.length} lượt</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <div className="text-xs text-amber-700 font-semibold">Chưa Bán (Đang Chờ Xử Lý)</div>
            <div className="text-2xl font-bold text-amber-700">{pendingRows.length} lượt</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Mã HĐ</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Khách Hàng</th>
                <th className="p-3">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {soldRows.map((r, i) => (
                <tr key={`s-${i}`}>
                  <td className="p-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Đã bán</span></td>
                  <td className="p-3 font-bold">{r.id}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">{r.customerName}</td>
                  <td className="p-3">{r.matchedItem ? `${r.matchedItem.name} (SL: ${r.matchedItem.qty})` : `${formatMoney(r.totalAmount)} đ`}</td>
                </tr>
              ))}
              {pendingRows.map((r, i) => (
                <tr key={`p-${i}`}>
                  <td className="p-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">Chưa bán</span></td>
                  <td className="p-3 font-bold">{r.id}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">{r.customerName}</td>
                  <td className="p-3">{r.matchedItem ? `${r.matchedItem.name} (SL: ${r.matchedItem.qty})` : `${formatMoney(r.totalAmount)} đ`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const completedInRange = useMemo(
    () => (histories.hoanThanh || []).filter((o) => isDateInRange(o.date, dateRange)),
    [histories.hoanThanh, dateRange]
  );

  const revenueBySale = useMemo(() => {
    const map = {};
    completedInRange.forEach((o) => {
      const s = o.saleName || "Khác";
      if (!map[s]) map[s] = { sale: s, orders: 0, revenue: 0 };
      map[s].orders += 1;
      map[s].revenue += Number(o.totalAmount || 0);
    });
    return Object.values(map);
  }, [completedInRange]);

  const soldProductsStats = useMemo(() => {
    const map = {};
    completedInRange.forEach((o) => {
      (o.items || []).forEach((it) => {
        const prodMeta = appData.products.find((p) => p.code === it.code);
        const cat = prodMeta?.category || "Khác";
        if (categoryFilter !== "all" && cat !== categoryFilter) return;

        if (!map[it.name]) map[it.name] = { name: it.name, category: cat, qty: 0, total: 0 };
        map[it.name].qty += Number(it.qty || 0);
        map[it.name].total += Number(it.price) * (1 - Number(it.ck || 0) / 100) * Number(it.qty);
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedInRange, appData.products, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setReportTab("revenue")}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${reportTab === "revenue" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
          >
            Doanh Thu Sale
          </button>
          <button
            onClick={() => setReportTab("products")}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${reportTab === "products" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
          >
            Sản Phẩm Bán Ra
          </button>
          <button
            onClick={() => setReportTab("store")}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${reportTab === "store" ? "bg-blue-600 text-white" : "bg-slate-100"}`}
          >
            Doanh Thu Cửa Hàng
          </button>
        </div>

        <div className="flex gap-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="p-2 border rounded-xl text-sm">
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày</option>
            <option value="thisMonth">Tháng này</option>
            <option value="lastMonth">Tháng trước</option>
            <option value="all">Tất cả</option>
          </select>
          <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-xl"><Printer className="w-5 h-5" /></button>
          <button
            onClick={() => exportToExcel(reportTab === "products" ? soldProductsStats : revenueBySale, "BaoCao_ThongKe.xlsx")}
            className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {reportTab === "products" && (
        <div className="bg-white p-3 rounded-2xl border flex gap-2 items-center">
          <span className="text-sm font-medium">Lọc nhóm hàng:</span>
          {["all", "Đồ Điện", "Kim Khí", "Khác"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${categoryFilter === cat ? "bg-blue-600 text-white" : "bg-slate-100"}`}
            >
              {cat === "all" ? "Tất cả" : cat}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-x-auto">
        {reportTab === "products" ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Tên Sản Phẩm</th>
                <th className="p-3">Nhóm Hàng</th>
                <th className="p-3 text-right">Tổng SL Bán</th>
                <th className="p-3 text-right">Doanh Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {soldProductsStats.map((p, i) => (
                <tr key={i}>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3 text-right font-bold">{formatMoney(p.qty)}</td>
                  <td className="p-3 text-right font-bold text-blue-700">{formatMoney(p.total)} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Nhân Viên / Kênh</th>
                <th className="p-3 text-right">Số Đơn Hoàn Thành</th>
                <th className="p-3 text-right">Tổng Doanh Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {revenueBySale.map((r, i) => (
                <tr key={i}>
                  <td className="p-3 font-bold">{r.sale}</td>
                  <td className="p-3 text-right">{r.orders}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{formatMoney(r.revenue)} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

