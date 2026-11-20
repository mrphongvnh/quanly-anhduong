import React, { useState, useEffect } from "react";
import { callApi } from "../services/api";
import { Lock, User, LogIn, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uParam = params.get("u");
    const pParam = params.get("p");
    if (uParam && pParam) {
      handleLogin(uParam, pParam, true);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const saved = localStorage.getItem("ad_auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.expiry > Date.now() && parsed.token) {
          setLoading(true);
          callApi("checkToken", [parsed.token])
            .then((res) => {
              if (res && res.success) onLoginSuccess(res);
              else localStorage.removeItem("ad_auth");
            })
            .catch(() => localStorage.removeItem("ad_auth"))
            .finally(() => setLoading(false));
        } else {
          localStorage.removeItem("ad_auth");
        }
      } catch {
        localStorage.removeItem("ad_auth");
      }
    }
  }, []);

  const handleLogin = async (u, p, isRemember) => {
    if (!u || !p) return Swal.fire("Thiếu thông tin", "Vui lòng nhập tài khoản và mật khẩu", "warning");
    setLoading(true);
    try {
      const res = await callApi("checkLogin", [u.trim(), p.trim()]);
      if (res && res.success) {
        if (isRemember) {
          localStorage.setItem(
            "ad_auth",
            JSON.stringify({ ...res, expiry: Date.now() + 7 * 24 * 60 * 60 * 1000 })
          );
        }
        onLoginSuccess(res);
      } else {
        Swal.fire("Đăng nhập thất bại", res?.message || "Sai tài khoản hoặc mật khẩu", "error");
      }
    } catch (err) {
      Swal.fire("Lỗi kết nối", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">QUẢN LÝ ÁNH DƯƠNG</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống Bán Hàng, Kho & Công Nợ Nội Bộ</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(username, password, remember);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-slate-600">Duy trì đăng nhập trong 7 ngày</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Đang xác thực..." : "Đăng Nhập Hệ Thống"}
          </button>
        </form>
      </div>
    </div>
  );
}

