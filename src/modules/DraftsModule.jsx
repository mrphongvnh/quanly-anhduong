import React, { useState, useEffect } from "react";
import { callApi } from "../services/api";
import { formatMoney } from "../utils/helpers";
import { FolderOpen, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

export default function DraftsModule({ user, onLoadDraft, onRefresh }) {
  const isAdmin = user.role === "Admin" || user.role === "SAdmin";
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSales, setExpandedSales] = useState({});

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const data = isAdmin
        ? await callApi("getAllDrafts")
        : await callApi("getMyDrafts", [user.fullName]);
      setDrafts(data || []);
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (saleName, draftId) => {
    const ok = await Swal.fire({
      title: "Xóa đơn lưu tạm?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;
    try {
      await callApi("deleteDraftFromSheet", [saleName, draftId]);
      fetchDrafts();
      onRefresh();
    } catch (err) {
      Swal.fire("Lỗi", err.message, "error");
    }
  };

  if (loading) return <div className="text-center py-10 text-slate-500">Đang tải đơn lưu tạm...</div>;

  const grouped = drafts.reduce((acc, d) => {
    const sale = d.saleName || user.fullName;
    if (!acc[sale]) acc[sale] = [];
    acc[sale].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Danh Sách Đơn Lưu Tạm ({drafts.length})</h2>

      {Object.keys(grouped).map((saleName) => {
        const list = grouped[saleName];
        const isOpen = !isAdmin || expandedSales[saleName] !== false;
        return (
          <div key={saleName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {isAdmin && (
              <button
                onClick={() => setExpandedSales((p) => ({ ...p, [saleName]: !isOpen }))}
                className="w-full px-4 py-3 bg-slate-100 font-bold text-slate-800 flex items-center justify-between"
              >
                <span>Sale: {saleName} ({list.length} toa tạm)</span>
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            )}

            {isOpen && (
              <div className="divide-y divide-slate-100">
                {list.map((d) => {
                  const parsed = typeof d.cartJson === "string" ? JSON.parse(d.cartJson) : d;
                  const items = parsed.items || [];
                  const total = items.reduce((s, i) => s + i.price * (1 - (i.ck || 0) / 100) * i.qty, 0);
                  return (
                    <div key={d.draftId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-blue-700">{d.custName || parsed.customer?.name}</div>
                        <div className="text-xs text-slate-500">
                          {items.length} sản phẩm — Tạm tính: <b>{formatMoney(total)} đ</b>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onLoadDraft({
                              draftId: d.draftId,
                              customerName: d.custName || parsed.customer?.name,
                              items,
                              saleName,
                            })
                          }
                          className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-4 h-4" /> Mở lên đơn
                        </button>
                        <button
                          onClick={() => handleDelete(saleName, d.draftId)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

