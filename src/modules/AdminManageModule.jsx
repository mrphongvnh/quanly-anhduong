import React, { useState, useEffect } from "react";
import { callApi } from "../services/api";
import { bodau, formatMoney, exportToExcel } from "../utils/helpers";
import InvoiceDesigner from "../components/InvoiceDesigner";
import { Plus, Trash2, Download, Settings, Sliders } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminManageModule({ mode, user, appData, invoiceConfig, onUpdateInvoiceConfig, onRefresh }) {
  const isAdmin = user.role === "Admin" || user.role === "SAdmin";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [excludeModal, setExcludeModal] = useState(false);
  const [excludeList, setExcludeList] = useState([]);
  const [newExcludeName, setNewExcludeName] = useState("");
  const [designerOpen, setDesignerOpen] = useState(false);

  const [quickProducts, setQuickProducts] = useState([]);

  useEffect(() => {
    if (mode === "admin") {
      callApi("getExcludeList").then((d) => setExcludeList(d || [])).catch(() => {});
      callApi("getNextMaSP")
        .then((nextCode) => setQuickProducts([{ code: nextCode || "SP001", name: "", price: 0, stock: 0, category: "Kim Khí" }]))
        .catch(() => {});
    }
  }, [mode]);

  if (mode === "customers") {
    const filtered = appData.customers.filter(
      (c) => bodau(c.name).includes(bodau(search)) || bodau(c.phone).includes(bodau(search))
    );
    const paged = filtered.slice((page - 1) * 30, page * 30);

    const handleAddCust = async () => {
      const { value: formValues } = await Swal.fire({
        title: "Thêm Khách Hàng Mới",
        html:
          '<input id="swal-name" class="swal2-input" placeholder="Tên khách hàng *">' +
          '<input id="swal-phone" class="swal2-input" placeholder="Số điện thoại">' +
          '<input id="swal-addr" class="swal2-input" placeholder="Địa chỉ">',
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => ({
          name: document.getElementById("swal-name").value,
          phone: document.getElementById("swal-phone").value,
          address: document.getElementById("swal-addr").value,
        }),
      });
      if (formValues?.name) {
        await callApi("addNewCustomer", [formValues]);
        Swal.fire("Đã thêm khách hàng", "", "success");
        onRefresh();
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm khách hàng..."
            className="p-2 border rounded-xl text-base flex-1"
          />
          <button onClick={handleAddCust} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Thêm Khách
          </button>
        </div>

        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Tên Khách Hàng</th>
                <th className="p-3">SĐT</th>
                <th className="p-3">Địa Chỉ</th>
                <th className="p-3 text-right">Công Nợ</th>
                {isAdmin && <th className="p-3 text-right">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((c, i) => (
                <tr key={i}>
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.address}</td>
                  <td className="p-3 text-right font-bold text-red-600">{formatMoney(c.debt)} đ</td>
                  {isAdmin && (
                    <td className="p-3 text-right">
                      <button
                        onClick={async () => {
                          await callApi("deleteCustomer", [c.name]);
                          onRefresh();
                        }}
                        className="text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (mode === "products") {
    const filtered = appData.products.filter(
      (p) => bodau(p.name).includes(bodau(search)) || bodau(p.code).includes(bodau(search))
    );
    const paged = filtered.slice((page - 1) * 40, page * 40);

    const handleDownloadExcel = async () => {
      try {
        const raw = await callApi("getRawExcelData");
        exportToExcel(raw || filtered, "DanhSach_SanPham_AnhDuong.xlsx");
      } catch {
        exportToExcel(filtered, "DanhSach_SanPham_AnhDuong.xlsx");
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm sản phẩm theo tên hoặc mã..."
            className="p-2 border rounded-xl text-base flex-1"
          />
          <button onClick={handleDownloadExcel} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1">
            <Download className="w-4 h-4" /> Tải Excel
          </button>
        </div>

        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3">Mã SP</th>
                <th className="p-3">Tên Sản Phẩm</th>
                <th className="p-3 text-right">Đơn Giá</th>
                <th className="p-3 text-center">Tồn Kho</th>
                {isAdmin && <th className="p-3 text-right">Thao Tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((p) => (
                <tr key={p.code}>
                  <td className="p-3 font-mono text-xs">{p.code}</td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-right font-bold text-blue-700">{formatMoney(p.price)} đ</td>
                  <td className="p-3 text-center font-bold">{p.stock}</td>
                  {isAdmin && (
                    <td className="p-3 text-right">
                      <button
                        onClick={async () => {
                          await callApi("deleteProduct", [p.code]);
                          onRefresh();
                        }}
                        className="text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border space-y-4">
        <h2 className="font-bold text-lg text-blue-700 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Cấu Hình Hệ Thống
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Kiểm soát tồn kho</div>
              <div className="text-xs text-slate-500">Chặn đặt vượt tồn kho</div>
            </div>
            <input
              type="checkbox"
              checked={appData.strictStock}
              onChange={async (e) => {
                await callApi("toggleStockSetting", [e.target.checked]);
                onRefresh();
              }}
              className="w-6 h-6 accent-blue-600"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Loại trừ gộp đơn khi in</div>
              <button onClick={() => setExcludeModal(true)} className="text-xs text-blue-600 underline">
                Quản lý DS loại trừ ({excludeList.length})
              </button>
            </div>
            <input
              type="checkbox"
              checked={excludeList.length > 0}
              onChange={async (e) => {
                await callApi("toggleExcludeSetting", [e.target.checked]);
                onRefresh();
              }}
              className="w-6 h-6 accent-blue-600"
            />
          </div>

          <button
            onClick={() => setDesignerOpen(true)}
            className="p-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
          >
            <Sliders className="w-5 h-5" /> Cài Đặt Mẫu Hóa Đơn A5
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Thêm Nhanh Nhiều Sản Phẩm</h3>
          <button
            onClick={() =>
              setQuickProducts((p) => [...p, { code: "", name: "", price: 0, stock: 0, category: "Kim Khí" }])
            }
            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold"
          >
            + Thêm dòng
          </button>
        </div>

        {quickProducts.map((qp, idx) => (
          <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <input
              type="text"
              placeholder="Mã SP"
              value={qp.code}
              onChange={(e) => {
                const cp = [...quickProducts];
                cp[idx].code = e.target.value;
                setQuickProducts(cp);
              }}
              className="p-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Tên sản phẩm *"
              value={qp.name}
              onChange={(e) => {
                const cp = [...quickProducts];
                cp[idx].name = e.target.value;
                setQuickProducts(cp);
              }}
              className="p-2 border rounded-lg text-sm sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Đơn giá"
              value={qp.price}
              onChange={(e) => {
                const cp = [...quickProducts];
                cp[idx].price = Number(e.target.value);
                setQuickProducts(cp);
              }}
              className="p-2 border rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Tồn đầu"
              value={qp.stock}
              onChange={(e) => {
                const cp = [...quickProducts];
                cp[idx].stock = Number(e.target.value);
                setQuickProducts(cp);
              }}
              className="p-2 border rounded-lg text-sm"
            />
          </div>
        ))}

        <button
          onClick={async () => {
            const valid = quickProducts.filter((x) => x.name.trim());
            if (valid.length === 0) return;
            await callApi("addQuickProducts", [valid]);
            Swal.fire("Đã thêm sản phẩm!", "", "success");
            setQuickProducts([]);
            onRefresh();
          }}
          className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm"
        >
          Lưu Tất Cả Sản Phẩm Mới
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Quản Lý Nhân Viên ({appData.staffs.length})</h3>
          <button
            onClick={async () => {
              const { value: f } = await Swal.fire({
                title: "Thêm Nhân Viên",
                html:
                  '<input id="st-user" class="swal2-input" placeholder="Username">' +
                  '<input id="st-pass" class="swal2-input" placeholder="Mật khẩu">' +
                  '<input id="st-name" class="swal2-input" placeholder="Họ và tên">' +
                  '<select id="st-role" class="swal2-input"><option value="Sale">Sale</option><option value="Leader">Leader</option><option value="Admin">Admin</option></select>',
                showCancelButton: true,
                preConfirm: () => ({
                  username: document.getElementById("st-user").value,
                  password: document.getElementById("st-pass").value,
                  fullName: document.getElementById("st-name").value,
                  role: document.getElementById("st-role").value,
                }),
              });
              if (f?.username) {
                await callApi("addNewStaff", [f]);
                onRefresh();
              }
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
          >
            + Thêm Nhân Viên
          </button>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-2.5">Họ Tên</th>
              <th className="p-2.5">Quyền</th>
              <th className="p-2.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {appData.staffs.map((s) => (
              <tr key={s.fullName}>
                <td className="p-2.5 font-semibold">{s.fullName}</td>
                <td className="p-2.5">
                  <select
                    value={s.role}
                    onChange={async (e) => {
                      await callApi("updateStaffRole", [s.fullName, e.target.value]);
                      onRefresh();
                    }}
                    className="p-1 border rounded"
                  >
                    <option value="Sale">Sale</option>
                    <option value="Leader">Leader</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="p-2.5 text-right space-x-2">
                  <button
                    onClick={async () => {
                      const { value: p } = await Swal.fire({ title: `Đổi mật khẩu: ${s.fullName}`, input: "text", showCancelButton: true });
                      if (p) await callApi("updateStaffPass", [s.fullName, p]);
                    }}
                    className="text-xs text-blue-600 underline"
                  >
                    Đổi pass
                  </button>
                  <button
                    onClick={async () => {
                      await callApi("deleteStaff", [s.fullName]);
                      onRefresh();
                    }}
                    className="text-xs text-red-600 underline"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {excludeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3">
            <h3 className="font-bold">Sản Phẩm Loại Trừ Gộp Dòng Khi In</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExcludeName}
                onChange={(e) => setNewExcludeName(e.target.value)}
                placeholder="Tên sản phẩm..."
                className="flex-1 p-2 border rounded-lg text-sm"
              />
              <button
                onClick={async () => {
                  if (!newExcludeName) return;
                  await callApi("addExcludeProduct", [newExcludeName]);
                  const updated = await callApi("getExcludeList");
                  setExcludeList(updated || []);
                  setNewExcludeName("");
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Thêm
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {excludeList.map((name, i) => (
                <div key={i} className="py-2 flex justify-between text-sm">
                  <span>{name}</span>
                  <button
                    onClick={async () => {
                      await callApi("deleteExcludeProduct", [name]);
                      setExcludeList((p) => p.filter((x) => x !== name));
                    }}
                    className="text-red-500 text-xs"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setExcludeModal(false)} className="w-full py-2 bg-slate-100 rounded-xl font-semibold">Đóng</button>
          </div>
        </div>
      )}

      {designerOpen && (
        <InvoiceDesigner
          config={invoiceConfig}
          onSaveConfig={onUpdateInvoiceConfig}
          onClose={() => setDesignerOpen(false)}
        />
      )}
    </div>
  );
}

