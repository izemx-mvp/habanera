export type OfficialDocument = {
  kind: string;
  reference: string;
  date: string;
  subtitle: string;
  metadata: Array<[string, string]>;
  columns: string[];
  rows: Array<Array<string | number>>;
  total?: string;
  note?: string;
};

async function makePdf(document: OfficialDocument) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const autoTable = autoTableModule.default;
  pdf.setFillColor(96, 60, 46); pdf.rect(0, 0, 210, 34, "F");
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(21); pdf.text("HABANERA", 16, 16);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text("MEAT · WINE · SHOW — ÉCONOMAT MARRAKECH", 16, 24);
  pdf.setTextColor(29, 13, 11); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text(document.kind, 16, 48);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(109, 102, 99); pdf.text(document.subtitle, 16, 55);
  pdf.setTextColor(29, 13, 11); let y = 66;
  document.metadata.forEach(([label, value]) => { pdf.setFont("helvetica", "bold"); pdf.text(`${label} :`, 16, y); pdf.setFont("helvetica", "normal"); pdf.text(String(value), 52, y); y += 6; });
  autoTable(pdf, { startY: y + 4, head: [document.columns], body: document.rows, theme: "grid", headStyles: { fillColor: [96, 60, 46], textColor: [255, 255, 255] }, styles: { font: "helvetica", fontSize: 8, cellPadding: 3 }, alternateRowStyles: { fillColor: [248, 246, 244] } });
  const finalY = ((pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30) + 10;
  if (document.total) { pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.text(document.total, 194, finalY, { align: "right" }); }
  if (document.note) { pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(109, 102, 99); pdf.text(document.note, 16, finalY + 10, { maxWidth: 178 }); }
  const signatureY = Math.max(finalY + 28, 245); pdf.setTextColor(29, 13, 11); pdf.setFontSize(9); pdf.text("Établi par", 20, signatureY); pdf.text("Contrôle économat", 82, signatureY); pdf.text("Signature / cachet", 150, signatureY);
  pdf.setDrawColor(222, 216, 213); pdf.line(16, signatureY + 20, 58, signatureY + 20); pdf.line(78, signatureY + 20, 126, signatureY + 20); pdf.line(146, signatureY + 20, 194, signatureY + 20);
  pdf.setTextColor(109, 102, 99); pdf.setFontSize(7); pdf.text(`Document généré le ${document.date} · ${document.reference}`, 105, 289, { align: "center" });
  return pdf;
}

export async function downloadPdf(document: OfficialDocument) { const pdf = await makePdf(document); pdf.save(`${document.reference}.pdf`); }
export async function printPdf(document: OfficialDocument) { const pdf = await makePdf(document); const url = pdf.output("bloburl"); const popup = window.open(url, "_blank"); popup?.addEventListener("load", () => popup.print(), { once: true }); }