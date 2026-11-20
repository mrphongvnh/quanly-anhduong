import React, { useState, useMemo, useEffect } from "react";
import { callApi } from "../services/api";
import { bodau, formatMoney } from "../utils/helpers";
import { Search, Plus, Trash2, Save, CheckCircle, MessageSquare, CheckSquare } from "lucide-react";
import Swal from "sweetalert2";

export default function OrderModule({ user, appData, editingOrder, clearEditingOrder, onOrderSaved }) {
  const isAdmin = user.role === "Admin" || user.role === "SAdmin";
  const [selectedSale, setSelectedSale] = useState(user.fullName);
  const [custQuery, setCustQuery] = useState("");
  const [selectedCust, setSelectedCust] = useState(null);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  const [prodQuery, setProdQuery] = useState("");
  const [multiChecked, setMultiChecked] = useState({});
  const [cart, setCart] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingOrder) {
      const foundCust = appData.customers.find((c) => c.name === editingOrder.customerName) || {
        name: editingOrder.customerName,
        phone: editingOrder.phone || "",
        address: editingOrder.address || "",
        debt: 0,
      };
      setSelectedCust(foundCust);
      setCustQuery(foundCust.name);
      setCart(editingOrder.items || []);
      if (editingOrder.saleName) setSelectedSale(editingOrder.saleName);
      if (editingOrder.isDraft) {
        setDraftId(editingOrder.draftId || editingOrder.id);
        setOrderId(null);
      } else {
        setOrderId(editingOrder.id);
        setDraftId(null);
      }
      clearEditingOrder();
    }
  }, [editingOrder, appData.customers, clearEditingOrder]);

  const saleInfo = useMemo(
    () => appData.staffs.find((s) => s.fullName === selectedSale),
    [appData.staffs, selectedSale]
  );

  const filteredCustomers = useMemo(() => {
    const q = bodau(custQuery);
    if (!q) return appData.customers.slice(0, 20);
    return appData.customers
      .filter((c) => bodau(c.name).includes(q) || bodau(c.phone).includes(q))
      .slice(0, 25);
  }, [appData.customers, custQuery]);

  // Chỉ lọc và sổ sản phẩm khi có nhập từ khóa vào ô tìm sản phẩm
  const filteredProducts = useMemo(() => {
    const q = bodau(prodQuery);
    if (!q) return [];
    return appData.products
      .filter((p) => bodau(p.name).includes(q) || bodau(p.code).includes(q))
      .slice(0, 40);
  }, [appData.products, prodQuery]);

  const addProductToCart = (prod) => {
    const stock = Number(prod.stock || 0);
    if (appData.strictStock && stock <= 0) {
      return Swal.fire("Hết hàng", `Sản phẩm "${prod.name}" đã hết tồn kho!`, "warning");
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.code === prod.code && !item.note);
      if (idx > -1) {
        const nextQty = prev[idx].qty + 1;
        if (appData.strictStock && nextQty > stock) {
          Swal.fire("Vượt tồn kho", `Tồn kho chỉ còn ${stock}`, "warning");
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: nextQty };
        return updated;
      }
      return [
        ...prev,
        {
          code: prod.code,
          name: prod.name,
          price: Number(prod.price || 0),
          qty: 1,
          ck: 0,
          note: "",
          maxStock: stock,
        },
      ];
    });
  };

  const handlePushMultiChecked = () => {
    const codes = Object.keys(multiChecked).filter((k) => multiChecked[k]);
    codes.forEach((code) => {
      const prod = appData.products.find((p) => p.code === code);
      if (prod) addProductToCart(prod);
    });
    setMultiChecked({});
  };

  const updateCartItem = (index, field, value) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "qty") {
        let q = Math.max(0.1, Number(value) || 0);
        if (appData.strictStock && q > item.maxStock) {
          Swal.fire("Vượt tồn kho", `Chỉ còn tối đa ${item.maxStock}`, "warning");
          q = item.maxStock;
        }
        item.qty = q;
      } else if (field === "price" || field === "ck") {
        item[field] = Math.max(0, Number(value) || 0);
      } else {
        item[field] = value;
      }
      updated[index] = item;
      return updated;
    });
  };

  const openNoteModal = async (index) => {
    const { value: text } = await Swal.fire({
      title: "Ghi chú sản phẩm",
      input: "textarea",
      inputValue: cart[index].note || "",
      inputPlaceholder: "Nhập quy cách, cắt lẻ, bảo hành...",
      showCancelButton: true,
      confirmButtonText: "Lưu ghi chú",
      cancelButtonText: "Hủy",
    });
    if (text !== undefined) {
      updateCartItem(index, "note", text);
    }
  };

  const totalAmount = useMemo(
    () =>
      cart.reduce((sum, it) => {
        const afterCk = it.price * (1 - (it.ck || 0) / 100);
        return sum + afterCk * it.qty;
      }, 0),
    [cart]
  );

  const handleSaveDraft = async () => {
    if (!selectedCust) return Swal.fire("Chưa chọn khách", "Vui lòng chọn khách hàng trước khi lưu tạm", "warning");
    if (cart.length === 0) return Swal.fire("Giỏ trống", "Vui lòng thêm ít nhất 1 sản phẩm", "warning");
    setSubmitting(true);
    try {
      await callApi("saveDraftToSheet", [
        selectedSale,
        selectedCust.name,
        JSON.stringify({ customer: selectedCust, items: cart, saleName: selectedSale }),
        draftId || "",
      ]);
      Swal.fire("Thành công", "Đã lưu đơn tạm!", "success");
      setCart([]);
      setDraftId(null);
      onOrderSaved();
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedCust) return Swal.fire("Chưa chọn khách", "Vui lòng chọn khách hàng", "warning");
    if (cart.length === 0) return Swal.fire("Giỏ trống", "Vui lòng thêm sản phẩm vào đơn", "warning");

    setSubmitting(true);
    try {
      if (orderId) {
        await callApi("updateOrder", [orderId, { customer: selectedCust, items: cart }]);
        Swal.fire("Đã cập nhật", `Đơn hàng ${orderId} đã được cập nhật!`, "success");
      } else {
        await callApi("saveOrder", [
          { customer: selectedCust, saleFullName: selectedSale, items: cart },
        ]);
        Swal.fire("Đặt hàng thành công", "Đơn hàng đã được gửi về hệ thống!", "success");
      }
      setCart([]);
      setOrderId(null);
      setDraftId(null);
      setSelectedCust(null);
      setCustQuery("");
      onOrderSaved();
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const checkedCount = Object.values(multiChecked).filter(Boolean).length;

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-blue-700">
            {orderId ? `Sửa Đơn Hàng: ${orderId}` : "Tạo Đơn Hàng Mới"}
          </h2>
          {orderId && (
            <button
              onClick={() => { setOrderId(null); setCart([]); }}
              className="text-xs text-red-600 underline"
            >
              Hủy sửa
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/70 p-3 rounded-xl">
            <div>
              <label className="text-xs font-semibold text-slate-600">Nhân viên Sale lên đơn</label>
              <select
                value={selectedSale}
                onChange={(e) => setSelectedSale(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white text-base"
              >
                {appData.staffs.map((s) => (
                  <option key={s.fullName} value={s.fullName}>
                    {s.fullName} ({s.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-700">
                SĐT Sale: <b className="text-blue-700">{saleInfo?.phone || "Chưa cập nhật"}</b>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <label className="text-xs font-semibold text-slate-600">Khách hàng *</label>
          <div className="relative mt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={custQuery}
              onFocus={() => setShowCustDropdown(true)}
              onChange={(e) => {
                setCustQuery(e.target.value);
                setShowCustDropdown(true);
              }}
              placeholder="Gõ tên khách hàng hoặc SĐT (không dấu)..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {showCustDropdown && (
            <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {filteredCustomers.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedCust(c);
                    setCustQuery(c.name);
                    setShowCustDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                >
                  <div className="font-semibold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>{c.phone} - {c.address}</span>
                    <span className="text-red-600 font-medium">Nợ: {formatMoney(c.debt)}đ</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCust && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div><span className="text-slate-500">SĐT:</span> <b>{selectedCust.phone || "---"}</b></div>
            <div><span className="text-slate-500">ĐC:</span> <b>{selectedCust.address || "---"}</b></div>
            <div>
              <span className="text-slate-500">Công nợ cũ:</span>{" "}
              <b className={Number(selectedCust.debt) > 0 ? "text-red-600" : "text-emerald-600"}>
                {formatMoney(selectedCust.debt)} đ
              </b>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={prodQuery}
            onChange={(e) => setProdQuery(e.target.value)}
            placeholder="Gõ tên sản phẩm hoặc mã SP để tìm (hỗ trợ không dấu)..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>

        {prodQuery.trim() && (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Không tìm thấy sản phẩm phù hợp</div>
            ) : (
              filteredProducts.map((p) => {
                const stock = Number(p.stock || 0);
                const badgeClass =
                  stock <= 0
                    ? "bg-red-100 text-red-700"
                    : stock < 10
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-700";

                return (
                  <div key={p.code} className="p-2.5 flex items-center justify-between hover:bg-slate-50 gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!multiChecked[p.code]}
                        onChange={(e) =>
                          setMultiChecked((prev) => ({ ...prev, [p.code]: e.target.checked }))
                        }
                        className="w-5 h-5 rounded text-blue-600 shrink-0"
                      />
                      <div
                        onClick={() => addProductToCart(p)}
                        className="cursor-pointer flex-1 min-w-0"
                      >
                        <div className="font-medium text-slate-800 text-sm truncate">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          <span className="text-blue-700 font-bold">{formatMoney(p.price)} đ</span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                            Kho: {stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => addProductToCart(p)}
                      className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {checkedCount > 0 && (
        <button
          onClick={handlePushMultiChecked}
          className="fixed bottom-20 right-4 z-30 bg-emerald-600 text-white px-4 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-bounce"
        >
          <CheckSquare className="w-5 h-5" />
          OK - Thêm ({checkedCount}) SP
        </button>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Giỏ Hàng ({cart.length} món)</h3>
          <div className="text-lg font-bold text-blue-700">
            Tổng: {formatMoney(totalAmount)} đ
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Chưa có sản phẩm nào trong giỏ</div>
        ) : (
          <div className="space-y-3">
            {cart.map((item, idx) => {
              const lineTotal = item.price * (1 - (item.ck || 0) / 100) * item.qty;
              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold text-sm text-slate-800">{item.name}</div>
                    <button
                      onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500">Số lượng</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateCartItem(idx, "qty", e.target.value)}
                        className="w-full p-1.5 border rounded-lg bg-white text-base font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Đơn giá</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateCartItem(idx, "price", e.target.value)}
                        className="w-full p-1.5 border rounded-lg bg-white text-base"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">CK (%)</label>
                      <input
                        type="number"
                        value={item.ck}
                        onChange={(e) => updateCartItem(idx, "ck", e.target.value)}
                        className="w-full p-1.5 border rounded-lg bg-white text-base"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => openNoteModal(idx)}
                      className="text-xs flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      {item.note ? item.note : "Thêm ghi chú..."}
                    </button>
                    <div className="font-bold text-blue-700 text-sm">{formatMoney(lineTotal)} đ</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            disabled={submitting}
            onClick={handleSaveDraft}
            className="py-3 px-4 rounded-xl border-2 border-amber-500 text-amber-700 font-bold flex items-center justify-center gap-2 hover:bg-amber-50"
          >
            <Save className="w-5 h-5" />
            Lưu Tạm
          </button>
          <button
            disabled={submitting}
            onClick={handleConfirmOrder}
            className="py-3 px-4 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/30"
          >
            <CheckCircle className="w-5 h-5" />
            {orderId ? "Cập Nhật Đơn" : "Xác Nhận Lưu Đơn"}
          </button>
        </div>
      </div>
    </div>
  );
}
