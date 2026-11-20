import React, { useState } from "react";
import {
  ShoppingCart, FileText, PackagePlus, Search, Users, ShieldAlert,
  Menu, X, LogOut, ChevronDown, RefreshCw
} from "lucide-react";

export default function Navbar({ user, activeTab, setActiveTab, badges, onLogout, onManualSync, syncing }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("orderGroup");
  const isAdmin = user.role === "Admin" || user.role === "SAdmin";
  const isLeader = user.role === "Leader";

  const navGroups = [
    {
      id: "orderGroup",
      label: "Đặt Hàng",
      icon: ShoppingCart,
      badge: badges.drafts,
      items: [
        { id: "order", label: "Đặt Hàng Mới" },
        { id: "drafts", label: "Đơn Lưu Tạm", badge: badges.drafts },
        { id: "history", label: "Quản Lý Đơn Hàng" },
      ],
    },
    ...(isAdmin
      ? [
          {
            id: "processGroup",
            label: "Xử Lý",
            icon: FileText,
            badge: badges.pendingPrint,
            items: [
              { id: "xulydh", label: "Xử Lý Đơn Hàng", badge: badges.pendingPrint },
              { id: "lichSuHoaDon", label: "Lịch Sử Hóa Đơn" },
            ],
          },
          {
            id: "importGroup",
            label: "Nhập Kho",
            icon: PackagePlus,
            items: [
              { id: "import", label: "Nhập Kho Mới" },
              { id: "importHistory", label: "Lịch Sử Nhập Kho" },
            ],
          },
        ]
      : []),
    {
      id: "lookupGroup",
      label: "Tra Cứu & Công Nợ",
      icon: Search,
      items: [
        { id: "lichSuCongNo", label: "Lịch Sử Công Nợ" },
        ...(isAdmin
          ? [
              { id: "thanhToan", label: "Thu Tiền / Thanh Toán" },
              { id: "lichSuThanhToan", label: "Sổ Cái Thanh Toán" },
            ]
          : []),
        { id: "searchHistory", label: "Tra Cứu Bán Hàng" },
        { id: "searchImport", label: "Tra Cứu Nhập Kho" },
        { id: "searchCompleted", label: "Tra Cứu Xuất Hàng" },
        ...(isAdmin || isLeader ? [{ id: "report", label: "Báo Cáo Thống Kê" }] : []),
      ],
    },
    {
      id: "manageGroup",
      label: "Quản Lý",
      icon: Users,
      items: [
        { id: "customers", label: "Danh Sách Khách Hàng" },
        { id: "products", label: "Danh Sách Sản Phẩm" },
        ...(isAdmin ? [{ id: "admin", label: "Cấu Hình & Admin Panel" }] : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            id: "warrantyGroup",
            label: "Bảo Hành",
            icon: ShieldAlert,
            items: [
              { id: "baoHanh", label: "Nhập BH Không Bán Được" },
              { id: "lsBHKBD", label: "LS BH Không Bán Được" },
              { id: "baoHanhBD", label: "Nhập BH Bán Được (+Kho)" },
              { id: "lsBHBD", label: "LS BH Bán Được" },
            ],
          },
        ]
      : []),
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg hover:bg-blue-600 ${isAdmin ? "lg:hidden" : ""}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div
              onClick={() => handleSelect("order")}
              className="font-bold text-base sm:text-lg tracking-wide cursor-pointer flex items-center gap-2"
            >
              <span>ÁNH DƯƠNG</span>
              <span className="text-xs bg-blue-800 px-2 py-0.5 rounded-full font-normal">
                {user.role}
              </span>
            </div>
          </div>

          {isAdmin && (
            <nav className="hidden lg:flex items-center gap-1">
              {navGroups.map((group) => {
                const Icon = group.icon;
                const isActive = group.items.some((i) => i.id === activeTab);
                return (
                  <div key={group.id} className="relative group">
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                        isActive ? "bg-blue-800 text-white" : "hover:bg-blue-600 text-blue-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{group.label}</span>
                      {group.badge > 0 && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.2 rounded-full">
                          {group.badge}
                        </span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 opacity-75" />
                    </button>

                    <div className="absolute left-0 top-full pt-1 w-56 hidden group-hover:block z-50">
                      <div className="bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1.5">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-blue-50 hover:text-blue-700 ${
                              activeTab === item.id ? "bg-blue-50 text-blue-700 font-semibold" : ""
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.badge > 0 && (
                              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onManualSync}
              title="Đồng bộ dữ liệu mới nhất"
              className="p-2 rounded-lg hover:bg-blue-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            </button>
            <span className="hidden sm:inline text-sm font-medium text-blue-100">
              {user.fullName}
            </span>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 rounded-lg hover:bg-red-600 transition text-blue-100 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10">
            <div className="p-4 bg-blue-700 text-white flex items-center justify-between">
              <div>
                <div className="font-bold">{user.fullName}</div>
                <div className="text-xs text-blue-200">Vai trò: {user.role}</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-blue-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {navGroups.map((group) => {
                const Icon = group.icon;
                const isOpen = openGroup === group.id;
                return (
                  <div key={group.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenGroup(isOpen ? "" : group.id)}
                      className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between font-semibold text-sm text-slate-700"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        {group.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {group.badge > 0 && (
                          <span className="bg-amber-500 text-white text-xs px-1.5 rounded-full">
                            {group.badge}
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="p-1.5 space-y-1 bg-white">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                              activeTab === item.id
                                ? "bg-blue-600 text-white font-medium"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.badge > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
