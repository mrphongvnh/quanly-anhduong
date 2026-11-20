import React, { useState, useEffect, useCallback } from "react";
import { callApi } from "./services/api";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import OrderModule from "./modules/OrderModule";
import DraftsModule from "./modules/DraftsModule";
import HistoryModule from "./modules/HistoryModule";
import ProcessOrderModule from "./modules/ProcessOrderModule";
import DebtPaymentModule from "./modules/DebtPaymentModule";
import WarehouseModule from "./modules/WarehouseModule";
import ReportModule from "./modules/ReportModule";
import WarrantyModule from "./modules/WarrantyModule";
import AdminManageModule from "./modules/AdminManageModule";
import { DEFAULT_INVOICE_CONFIG } from "./config";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("order");
  const [syncing, setSyncing] = useState(false);

  const [appData, setAppData] = useState({
    customers: [],
    products: [],
    staffs: [],
    strictStock: false,
    excludeMerge: [],
  });
  const [histories, setHistories] = useState({ hoaDon: [], hoanThanh: [], huyToa: [] });
  const [draftsCount, setDraftsCount] = useState(0);
  const [invoiceConfig, setInvoiceConfig] = useState(DEFAULT_INVOICE_CONFIG);

  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedDebtCustomer, setSelectedDebtCustomer] = useState(null);

  const syncAllData = useCallback(async (currentUser = user, loadAllHistory = false) => {
    if (!currentUser) return;
    setSyncing(true);
    try {
      const [base, hist, drafts, invCfg] = await Promise.all([
        callApi("getDataForApp"),
        callApi("getAllHistories", [currentUser.fullName, currentUser.role, loadAllHistory]),
        currentUser.role === "Admin" || currentUser.role === "SAdmin"
          ? callApi("getAllDrafts")
          : callApi("getMyDrafts", [currentUser.fullName]),
        callApi("loadInvoiceConfig").catch(() => null),
      ]);

      if (base) setAppData(base);
      if (hist) setHistories(hist);
      if (Array.isArray(drafts)) setDraftsCount(drafts.length);
      if (invCfg) setInvoiceConfig((prev) => ({ ...prev, ...invCfg }));
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    syncAllData(user);

    const interval = setInterval(() => {
      if (!document.hidden) {
        syncAllData(user);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, syncAllData]);

  const handleLogout = async () => {
    if (user?.token) {
      callApi("logoutUser", [user.token]).catch(() => {});
    }
    localStorage.removeItem("ad_auth");
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  const pendingPrintCount = (histories.hoaDon || []).filter((h) => h.status === "Đã in").length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badges={{ drafts: draftsCount, pendingPrint: pendingPrintCount }}
        onLogout={handleLogout}
        onManualSync={() => syncAllData(user)}
        syncing={syncing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {activeTab === "order" && (
          <OrderModule
            user={user}
            appData={appData}
            editingOrder={editingOrder}
            clearEditingOrder={() => setEditingOrder(null)}
            onOrderSaved={() => syncAllData(user)}
          />
        )}

        {activeTab === "drafts" && (
          <DraftsModule
            user={user}
            onLoadDraft={(draftData) => {
              setEditingOrder({ ...draftData, isDraft: true });
              setActiveTab("order");
            }}
            onRefresh={() => syncAllData(user)}
          />
        )}

        {activeTab === "history" && (
          <HistoryModule
            user={user}
            appData={appData}
            hoaDon={histories.hoaDon || []}
            onEditOrder={(order) => {
              setEditingOrder({ ...order, isDraft: false });
              setActiveTab("order");
            }}
            onLoadAll={() => syncAllData(user, true)}
            onRefresh={() => syncAllData(user)}
          />
        )}

        {(activeTab === "xulydh" || activeTab === "lichSuHoaDon") && (
          <ProcessOrderModule
            mode={activeTab}
            user={user}
            appData={appData}
            histories={histories}
            invoiceConfig={invoiceConfig}
            onRefresh={() => syncAllData(user)}
          />
        )}

        {(activeTab === "lichSuCongNo" || activeTab === "thanhToan" || activeTab === "lichSuThanhToan") && (
          <DebtPaymentModule
            mode={activeTab}
            user={user}
            customers={appData.customers}
            initialCustomer={selectedDebtCustomer}
            onGoToPayment={(cust) => {
              setSelectedDebtCustomer(cust);
              setActiveTab("thanhToan");
            }}
            onRefresh={() => syncAllData(user)}
          />
        )}

        {(activeTab === "import" || activeTab === "importHistory" || activeTab === "searchImport" || activeTab === "searchCompleted") && (
          <WarehouseModule
            mode={activeTab}
            user={user}
            products={appData.products}
            onRefresh={() => syncAllData(user)}
          />
        )}

        {(activeTab === "searchHistory" || activeTab === "report") && (
          <ReportModule
            mode={activeTab}
            user={user}
            appData={appData}
            histories={histories}
          />
        )}

        {(activeTab === "baoHanh" || activeTab === "lsBHKBD" || activeTab === "baoHanhBD" || activeTab === "lsBHBD") && (
          <WarrantyModule
            mode={activeTab}
            user={user}
            customers={appData.customers}
            products={appData.products}
            onRefresh={() => syncAllData(user)}
          />
        )}

        {(activeTab === "customers" || activeTab === "products" || activeTab === "admin") && (
          <AdminManageModule
            mode={activeTab}
            user={user}
            appData={appData}
            invoiceConfig={invoiceConfig}
            onUpdateInvoiceConfig={setInvoiceConfig}
            onRefresh={() => syncAllData(user)}
          />
        )}
      </main>
    </div>
  );
}

