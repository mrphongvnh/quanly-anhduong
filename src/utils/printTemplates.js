import { COMPANY_INFO, DEFAULT_INVOICE_CONFIG } from "../config";
import { formatMoney } from "./helpers";

export function printExportSlip(order, customerDebt = 0) {
  const win = window.open("", "_blank", "width=650,height=850");
  const rows = (order.items || []).map((it, idx) => {
    const afterCk = it.price * (1 - (it.ck || 0) / 100);
    const total = afterCk * it.qty;
    return `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td><b>${it.name}</b> ${it.note ? `<br><i style="font-size:11px">(${it.note})</i>` : ""}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${formatMoney(it.price)}</td>
        <td style="text-align:center">${it.ck || 0}%</td>
        <td style="text-align:right"><b>${formatMoney(total)}</b></td>
      </tr>
    `;
  }).join("");

  win.document.write(`
    <html>
    <head>
      <title>Phiếu Xuất Kho - ${order.id}</title>
      <style>
        @page { size: A5 portrait; margin: 8mm; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #333; padding: 4px 6px; }
        th { background: #f1f5f9; }
        .header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 6px; }
      </style>
    </head>
    <body onload="window.print();window.close();">
      <div class="header">
        <div style="font-weight:bold; font-size:14px;">${COMPANY_INFO.name}</div>
        <div style="font-size:11px;">ĐC: ${COMPANY_INFO.address} - ĐT: ${COMPANY_INFO.phone}</div>
        <h2 style="margin:6px 0 2px; font-size:16px;">PHIẾU XUẤT KHO</h2>
        <div>Mã phiếu: <b>${order.id}</b> | Ngày: ${order.date || new Date().toLocaleDateString("vi-VN")}</div>
      </div>
      <div style="margin-top:8px;">
        <div>Khách hàng: <b>${order.customerName}</b> - SĐT: ${order.phone || ""}</div>
        <div>Địa chỉ: ${order.address || ""}</div>
        <div>NV Kinh Doanh: <b>${order.saleName}</b></div>
      </div>
      <table>
        <thead>
          <tr>
            <th width="28">STT</th>
            <th>Tên Hàng Hóa</th>
            <th width="40">SL</th>
            <th width="70">Đơn Giá</th>
            <th width="40">CK</th>
            <th width="80">Thành Tiền</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:8px; text-align:right; line-height:1.6;">
        <div>Tổng tiền hàng: <b>${formatMoney(order.totalAmount)} đ</b></div>
        <div>Công nợ cũ: <b>${formatMoney(customerDebt)} đ</b></div>
        <div style="font-size:14px;">Tổng cộng thanh toán: <b>${formatMoney(Number(order.totalAmount) + Number(customerDebt))} đ</b></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:20px; text-align:center;">
        <div><b>Người lập phiếu</b><br><i style="font-size:11px">(Ký, họ tên)</i></div>
        <div><b>Thủ kho / Giao hàng</b><br><i style="font-size:11px">(Ký, họ tên)</i></div>
        <div><b>Khách hàng</b><br><i style="font-size:11px">(Ký, nhận đủ hàng)</i></div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
}

export function generateInvoiceA5Html(invoice, config = DEFAULT_INVOICE_CONFIG, excludeMergeList = []) {
  const cfg = { ...DEFAULT_INVOICE_CONFIG, ...config };
  const mergedItems = [];
  (invoice.items || []).forEach((item) => {
    const isExcluded = excludeMergeList.some(ex => ex.toLowerCase() === item.name.toLowerCase());
    if (isExcluded) {
      mergedItems.push({ ...item });
    } else {
      const found = mergedItems.find(
        m => m.name === item.name && Number(m.price) === Number(item.price) && Number(m.ck || 0) === Number(item.ck || 0)
      );
      if (found) {
        found.qty = Number(found.qty) + Number(item.qty);
        if (item.note && !found.note?.includes(item.note)) {
          found.note = found.note ? `${found.note}; ${item.note}` : item.note;
        }
      } else {
        mergedItems.push({ ...item });
      }
    }
  });

  const rowsHtml = mergedItems.map((it, idx) => {
    const unitAfterCk = Number(it.price) * (1 - Number(it.ck || 0) / 100);
    const lineTotal = unitAfterCk * Number(it.qty);
    return `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${it.name} ${it.note ? `<span style="font-style:italic;font-size:${cfg.fontSize - 1}px">(${it.note})</span>` : ""}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${formatMoney(unitAfterCk)}</td>
        <td style="text-align:right;font-weight:bold">${formatMoney(lineTotal)}</td>
      </tr>
    `;
  }).join("");

  const subTotal = Number(invoice.totalAmount || 0);
  const directDiscount = Number(invoice.directDiscount || 0);
  const oldDebt = Number(invoice.oldDebt || 0);
  const paid = Number(invoice.paidAmount || 0);
  const finalTotal = subTotal - directDiscount + oldDebt - paid;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: A5 portrait; margin: ${cfg.marginTop}mm ${cfg.marginLeft}mm; }
        body { font-family: Arial, sans-serif; font-size: ${cfg.fontSize}px; color: #111; margin: 0; padding: 8px; }
        .title { color: ${cfg.headerColor}; font-size: ${cfg.fontSize + 5}px; font-weight: bold; text-align: center; margin: 6px 0 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { border: 1px solid #444; padding: 4px 5px; }
        th { background-color: ${cfg.headerColor}15; color: ${cfg.headerColor}; }
        .summary { margin-top: 8px; float: right; width: 65%; }
        .summary div { display: flex; justify-content: space-between; padding: 2px 0; }
      </style>
    </head>
    <body>
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid ${cfg.headerColor}; padding-bottom:5px;">
        <div>
          <div style="font-weight:bold; font-size:${cfg.fontSize + 1}px; color:${cfg.headerColor}">${COMPANY_INFO.name}</div>
          <div style="font-size:${cfg.fontSize - 2}px;">ĐC: ${COMPANY_INFO.address} | ĐT: ${COMPANY_INFO.phone}</div>
          <div style="font-size:${cfg.fontSize - 2}px; font-weight:bold;">STK: ${COMPANY_INFO.bank}</div>
        </div>
      </div>
      <div class="title">${cfg.title}</div>
      <div style="text-align:center; font-size:${cfg.fontSize - 1}px; margin-bottom:6px;">
        Số HĐ: <b>${invoice.id}</b> — Ngày: ${invoice.date || new Date().toLocaleDateString("vi-VN")}
      </div>
      <div style="margin-bottom:6px; line-height:1.4;">
        <div>Khách hàng: <b>${invoice.customerName}</b> — SĐT: ${invoice.phone || ""}</div>
        <div>Địa chỉ: ${invoice.address || ""} | Sale: <b>${invoice.saleName}</b></div>
      </div>
      <table>
        <thead>
          <tr>
            <th width="26">STT</th>
            <th>${cfg.colName}</th>
            <th width="36">${cfg.colQty}</th>
            <th width="68">${cfg.colPrice}</th>
            <th width="78">${cfg.colTotal}</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="summary">
        <div><span>Tiền hàng:</span><b>${formatMoney(subTotal)} đ</b></div>
        ${directDiscount > 0 ? `<div><span>Trừ chiết khấu:</span><b>-${formatMoney(directDiscount)} đ</b></div>` : ""}
        <div><span>Nợ cũ:</span><b>${formatMoney(oldDebt)} đ</b></div>
        ${paid > 0 ? `<div><span>Thanh toán trước:</span><b>-${formatMoney(paid)} đ</b></div>` : ""}
        <div style="border-top:1px solid #333; margin-top:3px; padding-top:3px; font-size:${cfg.fontSize + 2}px; color:${cfg.headerColor}">
          <span>TỔNG CỘNG TOA:</span><b>${formatMoney(finalTotal)} đ</b>
        </div>
      </div>
      <div style="clear:both;"></div>
      <div style="font-style:italic; font-size:${cfg.fontSize - 2}px; margin-top:8px;">${cfg.footerNote}</div>
      <div style="display:flex; justify-content:space-between; text-align:center; margin-top:16px;">
        <div><b>Người lập phiếu</b><br><i style="font-size:10px">(Ký, ghi rõ họ tên)</i></div>
        <div><b>Người giao hàng</b><br><i style="font-size:10px">(Ký, ghi rõ họ tên)</i></div>
        <div><b>Khách hàng</b><br><i style="font-size:10px">(Ký, nhận đủ hàng)</i></div>
      </div>
    </body>
    </html>
  `;
}

export function printInvoiceA5(invoice, config, excludeMergeList) {
  const html = generateInvoiceA5Html(invoice, config, excludeMergeList);
  const win = window.open("", "_blank", "width=650,height=850");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

