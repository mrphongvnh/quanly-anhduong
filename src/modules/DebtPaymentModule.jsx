import React, { useState, useEffect } from "react";
import { callApi } from "../services/api";
import { bodau, formatMoney, exportToExcel, isDateInRange } from "../utils/helpers";
import { AlertTriangle, Download, DollarSign, Edit3 } from "lucide-react";
import Swal from "sweetalert2";

export default function DebtPaymentModule({ mode, user, customers, initialCustomer, onGoToPayment, onRefresh }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [selectedCust, setSelectedCust] = useState(initialCustomer || null);
  const [payAmount, setPayAmount] = useState(0);
  const [collector, setCollector] = useState(user.fullName);

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (initialCustomer) setSelectedCust(initialCustomer);
  }, [initialCustomer]);

  useEffect(() => {
    if (mode === "lichSuThanhToan") {
      callApi("getAllPaymentHistory").then((d) => setPaymentHistory(d || [])).catch(() => {});
    }
  }, [mode]);

  if (mode === "lichSuCongNo") {
    const debtList = customers.filter(
      (c) => Number(c.debt || 0) !== 0 && bodau(c.name).includes(bodau(search))
    );
    const negativeDebtCusts = debtList.filter((c) => Number(c.debt) < 0);
    const paged = debtList.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="space-y-4">
        {negativeDebtCusts.length > 0 && (
          <div className="bg-red-50 border border-red-300 text-red-800 p-3.5 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="text-sm">
              <b>Cảnh báo nợ âm ({negativeDebtCusts.length} khách):</b>{" "}
              {negativeDebtCusts.map((c) => `${c.name} (${formatMoney(c.debt)}đ)`).join(", ")}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-between bg-white p-4 rounded-2xl border">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm khách hàng đang nợ..."
            className="p-2 border rounded-xl text-base flex-1 min-w-[220px]"
          />
          <button
            onClick={() =>
              exportToExcel(
                debtList.map((c) => ({ KhachHang: c.name, SDT: c.phone, DiaChi: c.address, CongNo: c.debt })),
                "CongNo_AnhDuong.xlsx"
              )
            }
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Xuất Excel
          </button>
        </div>

        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Khách Hàng</th>
                <th className="p-3">SĐT</th>
                <th className="p-3 text-right">Dư Nợ Hiện Tại</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((c, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className={`p-3 text-right font-bold ${Number(c.debt) < 0 ? "text-amber-600" : "text-red-600"}`}>
                    {formatMoney(c.debt)} đ
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onGoToPayment(c)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      Thu nợ
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

  if (mode === "thanhToan") {
    const currentDebt = Number(selectedCust?.debt || 0);
    const remainingDebt = currentDebt - Number(payAmount || 0);

    const handleConfirmPayment = async () => {
      if (!selectedCust) return Swal.fire("Chưa chọn khách", "", "warning");
      if (!payAmount || payAmount <= 0) return Swal.fire("Nhập số tiền thu hợp lệ", "", "warning");

      try {
        await callApi("updateCustomerDebt", [selectedCust.name, remainingDebt]);
        await callApi("savePaymentRecord", [
          {
            customerName: selectedCust.name,
            oldDebt: currentDebt,
            paidAmount: Number(payAmount),
            newDebt: remainingDebt,
            collector,
          },
        ]);
        await callApi("sendPaymentTelegramNotification", [
          selectedCust.name,
          Number(payAmount),
          remainingDebt,
          collector,
        ]).catch(() => {});

        Swal.fire("Thu nợ thành công!", `Dư nợ mới: ${formatMoney(remainingDebt)} đ`, "success");
        setPayAmount(0);
        setSelectedCust({ ...selectedCust, debt: remainingDebt });
        onRefresh();
      } catch (err) {
        Swal.fire("Lỗi", err.message, "error");
      }
    };

    const handleDirectEditDebt = async () => {
      const { value: newVal } = await Swal.fire({
        title: `Sửa trực tiếp công nợ: ${selectedCust.name}`,
        input: "number",
        inputValue: currentDebt,
        showCancelButton: true,
      });
      if (newVal !== undefined) {
        await callApi("updateCustomerDebt", [selectedCust.name, Number(newVal)]);
        setSelectedCust({ ...selectedCust, debt: Number(newVal) });
        onRefresh();
      }
    };

    return (
      <div className="max-w-xl mx-auto bg-white p-5 rounded-2xl border space-y-4">
        <h2 className="text-lg font-bold text-blue-700">Thu Tiền Công Nợ Khách Hàng</h2>

        <div>
          <label className="text-xs font-semibold text-slate-600">Chọn khách hàng</label>
          <select
            value={selectedCust?.name || ""}
            onChange={(e) => setSelectedCust(customers.find((c) => c.name === e.target.value) || null)}
            className="w-full mt-1 p-2.5 border rounded-xl text-base"
          >
            <option value="">-- Chọn khách hàng --</option>
            {customers.map((c, i) => (
              <option key={i} value={c.name}>
                {c.name} (Nợ: {formatMoney(c.debt)}đ)
              </option>
            ))}
          </select>
        </div>

        {selectedCust && (
          <>
            <div className="p-3.5 bg-red-50 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs text-red-700">Công nợ hiện tại</div>
                <div className="text-xl font-bold text-red-600">{formatMoney(currentDebt)} đ</div>
              </div>
              {user.role === "SAdmin" && (
                <button onClick={handleDirectEditDebt} className="px-3 py-1.5 bg-white border border-red-300 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> Sửa nợ gốc
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Số tiền thu (VNĐ)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full mt-1 p-2.5 border rounded-xl text-base font-bold text-emerald-700"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[500000, 1000000, 2000000, 5000000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPayAmount(v)}
                    className="px-3 py-1 bg-slate-100 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                  >
                    {formatMoney(v)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPayAmount(Math.max(0, currentDebt))}
                  className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold"
                >
                  Trả hết nợ
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Người thu tiền</label>
              <input
                type="text"
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-xl text-base"
              />
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl flex justify-between items-center">
              <span className="text-sm font-medium">Số dư nợ còn lại sau thu:</span>
              <span className="text-lg font-bold text-blue-700">{formatMoney(remainingDebt)} đ</span>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700"
            >
              <DollarSign className="w-5 h-5" /> Xác Nhận Thu Tiền
            </button>
          </>
        )}
      </div>
    );
  }

  const filteredPayments = paymentHistory.filter(
    (p) => bodau(p.customerName).includes(bodau(search)) && isDateInRange(p.date, dateFilter)
  );
  const totalCollected = filteredPayments.reduce((s, p) => s + Number(p.paidAmount || 0), 0);
  const totalSystemDebt = customers.reduce((s, c) => s + Number(c.debt || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-500">Tổng Đã Thu (theo lọc)</div>
          <div className="text-xl font-bold text-emerald-600">{formatMoney(totalCollected)} đ</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-500">Số Lượt Giao Dịch</div>
          <div className="text-xl font-bold text-slate-800">{filteredPayments.length} lượt</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border">
          <div className="text-xs text-slate-500">Tổng Dư Nợ Hiện Tại</div>
          <div className="text-xl font-bold text-red-600">{formatMoney(totalSystemDebt)} đ</div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên khách hàng..."
          className="p-2 border rounded-xl text-base flex-1"
        />
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="p-2 border rounded-xl text-base">
          <option value="all">Tất cả</option>
          <option value="today">Hôm nay</option>
          <option value="7days">7 ngày</option>
          <option value="thisMonth">Tháng này</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Ngày</th>
              <th className="p-3">Khách Hàng</th>
              <th className="p-3 text-right">Nợ Cũ</th>
              <th className="p-3 text-right">Đã Thu</th>
              <th className="p-3 text-right">Còn Lại</th>
              <th className="p-3">Người Thu</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPayments.map((p, i) => (
              <tr key={i}>
                <td className="p-3">{p.date}</td>
                <td className="p-3 font-semibold">{p.customerName}</td>
                <td className="p-3 text-right">{formatMoney(p.oldDebt)}</td>
                <td className="p-3 text-right font-bold text-emerald-600">{formatMoney(p.paidAmount)}</td>
                <td className="p-3 text-right font-bold text-red-600">{formatMoney(p.newDebt)}</td>
                <td className="p-3">{p.collector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

