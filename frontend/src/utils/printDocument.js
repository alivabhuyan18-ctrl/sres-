export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const openPrintableDocument = ({ title, subtitle = "", content = "" }) => {
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
          @media print {
            body { background: #ffffff; padding: 0; }
            .sheet { border: none; border-radius: 0; max-width: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <h1 class="title">${escapeHtml(title)}</h1>
          ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
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
