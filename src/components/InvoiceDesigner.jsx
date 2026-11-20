import React, { useState } from "react";
import { callApi } from "../services/api";
import { generateInvoiceA5Html } from "../utils/printTemplates";
import { Save, X } from "lucide-react";
import Swal from "sweetalert2";

export default function InvoiceDesigner({ config, onSaveConfig, onClose }) {
  const [cfg, setCfg] = useState(config);

  const sampleInvoice = {
    id: "HD00999",
    date: new Date().toLocaleDateString("vi-VN"),
    customerName: "Cửa Hàng Điện Nước Minh Tâm",
    phone: "0912.345.678",
    address: "Bình Thủy, Cần Thơ",
    saleName: "Nguyễn Văn A",
    oldDebt: 1500000,
    paidAmount: 500000,
    directDiscount: 50000,
    totalAmount: 2450000,
    items: [
      { name: "Ổ cắm điện đa năng 3 chấu", qty: 10, price: 85000, ck: 5, note: "Màu trắng" },
      { name: "Dây cáp điện Cadivi 2.5", qty: 2, price: 821250, ck: 0, note: "" },
    ],
  };

  const previewHtml = generateInvoiceA5Html(sampleInvoice, cfg, []);

  const handleSave = async () => {
    try {
      await callApi("saveInvoiceConfig", [cfg]);
      onSaveConfig(cfg);
      Swal.fire("Đã lưu cấu hình hóa đơn!", "", "success");
      onClose();
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 bg-blue-700 text-white flex justify-between items-center">
          <h3 className="font-bold">Cài Đặt Giao Diện Hóa Đơn In Ấn A5</h3>
          <button onClick={onClose} className="p-1.5 bg-blue-800 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <div className="lg:col-span-5 p-4 overflow-y-auto space-y-4 border-r">
            <div>
              <label className="text-xs font-bold">Tiêu đề hóa đơn</label>
              <input
                type="text"
                value={cfg.title}
                onChange={(e) => setCfg({ ...cfg, title: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">Cỡ chữ ({cfg.fontSize}px)</label>
                <input
                  type="range"
                  min="9"
                  max="16"
                  value={cfg.fontSize}
                  onChange={(e) => setCfg({ ...cfg, fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Màu chủ đạo</label>
                <input
                  type="color"
                  value={cfg.headerColor}
                  onChange={(e) => setCfg({ ...cfg, headerColor: e.target.value })}
                  className="w-full h-9 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">Lề trên ({cfg.marginTop}mm)</label>
                <input
                  type="range"
                  min="2"
                  max="25"
                  value={cfg.marginTop}
                  onChange={(e) => setCfg({ ...cfg, marginTop: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold">Lề trái/phải ({cfg.marginLeft}mm)</label>
                <input
                  type="range"
                  min="2"
                  max="25"
                  value={cfg.marginLeft}
                  onChange={(e) => setCfg({ ...cfg, marginLeft: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold">Tiêu đề cột Tên</label>
                <input type="text" value={cfg.colName} onChange={(e) => setCfg({ ...cfg, colName: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold">Tiêu đề cột SL</label>
                <input type="text" value={cfg.colQty} onChange={(e) => setCfg({ ...cfg, colQty: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold">Tiêu đề cột Giá</label>
                <input type="text" value={cfg.colPrice} onChange={(e) => setCfg({ ...cfg, colPrice: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold">Tiêu đề cột Tiền</label>
                <input type="text" value={cfg.colTotal} onChange={(e) => setCfg({ ...cfg, colTotal: e.target.value })} className="w-full p-1.5 border rounded text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">Ghi chú cuối hóa đơn</label>
              <textarea
                rows="2"
                value={cfg.footerNote}
                onChange={(e) => setCfg({ ...cfg, footerNote: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg text-sm"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Lưu & Đồng Bộ Mẫu In
            </button>
          </div>

          <div className="lg:col-span-7 bg-slate-200 p-4 flex items-center justify-center overflow-auto">
            <iframe
              title="Invoice A5 Preview"
              srcDoc={previewHtml}
              className="w-[148mm] h-[210mm] bg-white shadow-2xl border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

