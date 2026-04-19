export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const openPrintableDocument = ({ title, subtitle = "", content = "", showDefaultHeader = true }) => {
  const printWindow = window.open("", "_blank", "width=960,height=720");
  if (!printWindow) return null;

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; padding: 32px; color: #28302d; background: #f7f7f2; }
          .sheet { max-width: 920px; margin: 0 auto; background: #ffffff; border: 1px solid #d8ddd9; border-radius: 16px; padding: 32px; }
          .title { margin: 0; font-size: 30px; font-weight: 800; }
          .subtitle { margin: 6px 0 0; color: #5f6b66; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
          .card { border: 1px solid #e4e8e5; border-radius: 12px; padding: 16px; }
          .label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #5f6b66; margin-bottom: 6px; }
          .value { font-size: 15px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { padding: 12px 10px; border-bottom: 1px solid #edf0ee; text-align: left; vertical-align: top; }
          th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #5f6b66; }
          .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #d8f5ee; color: #1b8b73; font-size: 12px; font-weight: 700; }
          .report-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
          .report-brand { display: flex; align-items: center; gap: 14px; }
          .logo-mark { width: 52px; height: 52px; border-radius: 12px; background: #d8f5ee; color: #1b8b73; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; }
          .college-name { margin: 0; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #5f6b66; }
          .divider { height: 1px; background: #d8ddd9; margin: 18px 0 24px; }
          .report-sections { display: grid; gap: 18px; }
          .report-section { border: 1px solid #e4e8e5; border-radius: 14px; padding: 18px; page-break-inside: avoid; break-inside: avoid; }
          .section-title { margin: 0; font-size: 18px; font-weight: 800; color: #28302d; letter-spacing: 0.01em; }
          .section-rule { height: 1px; background: #d8ddd9; margin: 12px 0 16px; }
          .report-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
          .report-item { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 12px; align-items: start; }
          .report-label { font-size: 12px; font-weight: 700; color: #44504b; }
          .report-value { font-size: 13px; color: #28302d; word-break: break-word; }
          @media print {
            @page { margin: 12mm; size: A4; }
            html, body { background: #ffffff; }
            body { padding: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .sheet { border: none; border-radius: 0; max-width: none; padding: 0; box-shadow: none; }
            .title { font-size: 24px; }
            .subtitle { font-size: 12px; }
            .section-title { font-size: 15px; }
            .section-rule { margin: 10px 0 14px; }
            .report-item { grid-template-columns: 150px minmax(0, 1fr); }
            .report-label, .report-value { font-size: 12px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${showDefaultHeader ? `<h1 class="title">${escapeHtml(title)}</h1>` : ""}
          ${showDefaultHeader && subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
          ${content}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return printWindow;
};
