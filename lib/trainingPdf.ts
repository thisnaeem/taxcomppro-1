import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CERTIFICATE_DISCLAIMER } from "@/lib/training";

const NAVY = rgb(0.039, 0.086, 0.157); // #0a1628
const GOLD = rgb(0.831, 0.627, 0.090); // #d4a017
const SLATE = rgb(0.4, 0.45, 0.53);

export async function buildCertificatePdf(input: {
  preparerName: string; officeName: string | null; trainingTitle: string; versionLabel: string;
  completedAt: Date; score: number | null; certificateNumber: string; verifyUrl: string;
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]); // landscape letter
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  // Border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: GOLD, borderWidth: 1 });

  const centerText = (text: string, y: number, font = regular, size = 12, color = NAVY) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  centerText("TAX COMPLIANCE PRO", height - 90, bold, 22, NAVY);
  centerText("Certificate of Completion", height - 125, bold, 28, GOLD);

  centerText("This certifies that", height - 175, italic, 13, SLATE);
  centerText(input.preparerName, height - 210, bold, 30, NAVY);

  centerText("has successfully completed", height - 245, italic, 13, SLATE);
  centerText(input.trainingTitle, height - 275, bold, 16, NAVY);
  centerText(input.versionLabel, height - 297, regular, 11, SLATE);

  if (input.officeName) centerText(input.officeName, height - 322, regular, 12, SLATE);

  const dateStr = input.completedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const scoreStr = input.score != null ? `   •   Assessment Score: ${input.score}%` : "";
  centerText(`Completed ${dateStr}${scoreStr}`, height - 348, regular, 11, NAVY);

  // Footer: certificate number + QR verification
  page.drawText(`Certificate No. ${input.certificateNumber}`, { x: 60, y: 70, size: 9, font: regular, color: SLATE });
  page.drawText("Verify at " + input.verifyUrl, { x: 60, y: 56, size: 9, font: regular, color: SLATE });

  try {
    const qrRes = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(input.verifyUrl)}`);
    if (qrRes.ok) {
      const qrBytes = new Uint8Array(await qrRes.arrayBuffer());
      const qrImg = await doc.embedPng(qrBytes);
      page.drawImage(qrImg, { x: width - 140, y: 45, width: 70, height: 70 });
    }
  } catch { /* QR is a nice-to-have; skip silently if the fetch fails */ }

  // Disclaimer
  const disclaimerLines = wrapText(CERTIFICATE_DISCLAIMER, italic, 8, width - 200);
  disclaimerLines.forEach((line, i) => centerText(line, 100 - i * 10, italic, 8, SLATE));

  return doc.save();
}

export async function buildComplianceReportPdf(input: {
  officeName: string | null; eroName: string; trainingTitle: string; versionLabels: string[];
  assignedCount: number; completedCount: number; generatedAt: Date;
  rows: { name: string; email: string; videoPct: number; score: number | null; acknowledged: boolean; certificate: boolean; completedAt: Date | null; status: string }[];
}) {
  const doc = await PDFDocument.create();
  let page = doc.addPage([612, 792]); // portrait letter
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  let { height } = page.getSize();
  const { width } = page.getSize();
  let y = height - 50;

  const text = (t: string, x: number, size = 10, font = regular, color = NAVY) => page.drawText(t, { x, y, size, font, color });

  text("Tax Compliance Pro — Staff Training Compliance Report", 40, 16, bold);
  y -= 26;
  text(`Office: ${input.officeName ?? "—"}`, 40, 10); y -= 14;
  text(`Purchasing ERO: ${input.eroName}`, 40, 10); y -= 14;
  text(`Training: ${input.trainingTitle}`, 40, 10); y -= 14;
  text(`Version(s) completed: ${input.versionLabels.join(", ") || "—"}`, 40, 10); y -= 14;
  text(`Assigned staff: ${input.assignedCount}   •   Completed: ${input.completedCount}   •   Completion rate: ${input.assignedCount ? Math.round((input.completedCount / input.assignedCount) * 100) : 0}%`, 40, 10); y -= 14;
  text(`Report generated: ${input.generatedAt.toLocaleString("en-US")}`, 40, 9, regular, SLATE); y -= 26;

  const cols = [
    { label: "Staff Member", x: 40, w: 110 },
    { label: "Email", x: 150, w: 130 },
    { label: "Video", x: 285, w: 40 },
    { label: "Score", x: 325, w: 40 },
    { label: "Ack.", x: 365, w: 40 },
    { label: "Cert.", x: 405, w: 40 },
    { label: "Completed", x: 445, w: 70 },
    { label: "Status", x: 515, w: 60 },
  ];

  const drawHeader = () => {
    page.drawRectangle({ x: 36, y: y - 4, width: width - 72, height: 16, color: NAVY });
    cols.forEach(c => page.drawText(c.label, { x: c.x, y, size: 8, font: bold, color: rgb(1, 1, 1) }));
    y -= 18;
  };
  drawHeader();

  for (const row of input.rows) {
    if (y < 60) {
      page = doc.addPage([612, 792]);
      height = page.getSize().height;
      y = height - 50;
      drawHeader();
    }
    const vals = [
      truncate(row.name, 20), truncate(row.email, 24), `${row.videoPct}%`,
      row.score != null ? `${row.score}%` : "—", row.acknowledged ? "Signed" : "—",
      row.certificate ? "Issued" : "—", row.completedAt ? row.completedAt.toLocaleDateString() : "—", truncate(row.status, 14),
    ];
    cols.forEach((c, i) => page.drawText(vals[i], { x: c.x, y, size: 8, font: regular, color: NAVY }));
    y -= 16;
  }

  return doc.save();
}

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

function wrapText(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
