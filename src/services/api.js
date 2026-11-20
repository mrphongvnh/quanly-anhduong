import { API_URL } from "../config";

export async function callApi(action, args = []) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, args }),
    redirect: "follow"
  });
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Lỗi máy chủ không xác định");
  return json.data;
}

