"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X, Award } from "lucide-react";

interface CertificateProps {
  studentName: string;
  courseName: string;
  instructorName: string;
  completedAt?: string;
  onClose: () => void;
}

export default function Certificate({
  studentName, courseName, instructorName, completedAt, onClose,
}: CertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const dateStr = completedAt
    ? new Date(completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200, H = 850;
    canvas.width = W; canvas.height = H;

    // ── Background ──────────────────────────────────────────────────
    ctx.fillStyle = "#fdfaf2";
    ctx.fillRect(0, 0, W, H);

    // ── Outer decorative border ──────────────────────────────────────
    const drawBorder = (x: number, y: number, w: number, h: number, lw: number, color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.strokeRect(x, y, w, h);
    };
    drawBorder(18, 18, W - 36, H - 36, 3, "#c8a84b");
    drawBorder(26, 26, W - 52, H - 52, 1, "#c8a84b");
    drawBorder(32, 32, W - 64, H - 64, 6, "#0a1628");
    drawBorder(40, 40, W - 80, H - 80, 1, "#c8a84b");

    // ── Corner ornaments ─────────────────────────────────────────────
    const drawCornerOrnament = (cx: number, cy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "#c8a84b"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(0, 0, 18 + i * 7, 0, Math.PI * 2);
        ctx.globalAlpha = 0.3 - i * 0.06; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#c8a84b"; ctx.fill();
      ctx.restore();
    };
    drawCornerOrnament(60, 60); drawCornerOrnament(W - 60, 60);
    drawCornerOrnament(60, H - 60); drawCornerOrnament(W - 60, H - 60);

    // ── Navy header strip ────────────────────────────────────────────
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(50, 50, W - 100, 120);

    // ── Gold accent line below header ────────────────────────────────
    ctx.fillStyle = "#c8a84b";
    ctx.fillRect(50, 170, W - 100, 4);

    // ── Logo / brand in header ───────────────────────────────────────
    ctx.font = "bold 18px Georgia, serif";
    ctx.fillStyle = "#c8a84b";
    ctx.textAlign = "center";
    ctx.fillText("⚖ TaxCom Pro", W / 2, 95);

    ctx.font = "13px Georgia, serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("Professional Tax Community", W / 2, 118);

    ctx.font = "italic 11px Georgia, serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("taxcomppro.com", W / 2, 142);

    // ── "CERTIFICATE OF COMPLETION" title ───────────────────────────
    ctx.font = "bold 14px Georgia, serif";
    ctx.fillStyle = "#c8a84b";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "center";
    ctx.fillText("C E R T I F I C A T E  O F  C O M P L E T I O N", W / 2, 220);

    // Decorative divider
    const grd = ctx.createLinearGradient(150, 0, W - 150, 0);
    grd.addColorStop(0, "transparent"); grd.addColorStop(0.5, "#c8a84b"); grd.addColorStop(1, "transparent");
    ctx.strokeStyle = grd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(150, 235); ctx.lineTo(W - 150, 235); ctx.stroke();

    // ── "This is to certify" ─────────────────────────────────────────
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillStyle = "#555";
    ctx.fillText("This is to proudly certify that", W / 2, 290);

    // ── Student name ─────────────────────────────────────────────────
    ctx.font = "bold 58px 'Palatino Linotype', Georgia, serif";
    ctx.fillStyle = "#0a1628";
    ctx.fillText(studentName, W / 2, 370);

    // Underline for name
    const nameW = ctx.measureText(studentName).width;
    const nx = W / 2 - nameW / 2;
    ctx.fillStyle = "#c8a84b";
    ctx.fillRect(nx, 380, nameW, 2);

    // ── "has successfully completed" ────────────────────────────────
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillStyle = "#555";
    ctx.fillText("has successfully completed the course", W / 2, 430);

    // ── Course name ──────────────────────────────────────────────────
    ctx.font = "bold 34px Georgia, serif";
    ctx.fillStyle = "#1a3a6b";
    // Word-wrap if long
    const maxCW = W - 200;
    const words = courseName.split(" ");
    let line = ""; let cy = 488;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxCW && line !== "") {
        ctx.fillText(line.trim(), W / 2, cy); cy += 44; line = word + " ";
      } else { line = test; }
    }
    ctx.fillText(line.trim(), W / 2, cy);

    const finalCourseY = cy;

    // ── Gold divider ─────────────────────────────────────────────────
    const grd2 = ctx.createLinearGradient(200, 0, W - 200, 0);
    grd2.addColorStop(0, "transparent"); grd2.addColorStop(0.5, "#c8a84b"); grd2.addColorStop(1, "transparent");
    ctx.strokeStyle = grd2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(200, finalCourseY + 30); ctx.lineTo(W - 200, finalCourseY + 30); ctx.stroke();

    // ── Date ─────────────────────────────────────────────────────────
    ctx.font = "15px Georgia, serif";
    ctx.fillStyle = "#666";
    ctx.fillText(`Completed on ${dateStr}`, W / 2, finalCourseY + 60);

    // ── Signature area ───────────────────────────────────────────────
    const sigY = H - 155;

    // Left: Instructor signature
    ctx.strokeStyle = "#0a1628"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(130, sigY); ctx.lineTo(380, sigY); ctx.stroke();
    ctx.font = "bold 14px Georgia, serif";
    ctx.fillStyle = "#0a1628";
    ctx.textAlign = "center";
    ctx.fillText(instructorName, 255, sigY + 22);
    ctx.font = "12px Georgia, serif";
    ctx.fillStyle = "#888";
    ctx.fillText("Course Instructor", 255, sigY + 40);

    // Right: Platform signature
    ctx.strokeStyle = "#0a1628"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(820, sigY); ctx.lineTo(1070, sigY); ctx.stroke();
    ctx.font = "bold 14px Georgia, serif";
    ctx.fillStyle = "#0a1628";
    ctx.fillText("TaxCom Pro", 945, sigY + 22);
    ctx.font = "12px Georgia, serif";
    ctx.fillStyle = "#888";
    ctx.fillText("Platform Director", 945, sigY + 40);

    // ── Gold seal (center bottom) ─────────────────────────────────────
    const sx = W / 2, sy = sigY - 10;
    // Outer star ring
    ctx.save();
    ctx.translate(sx, sy);
    for (let i = 0; i < 24; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 24);
      ctx.fillStyle = "#c8a84b";
      ctx.globalAlpha = 0.7;
      ctx.fillRect(-1.5, -52, 3, 10);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Outer circle
    ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2);
    const sealGrd = ctx.createRadialGradient(0, 0, 5, 0, 0, 44);
    sealGrd.addColorStop(0, "#f0c040"); sealGrd.addColorStop(1, "#b8862e");
    ctx.fillStyle = sealGrd; ctx.fill();
    ctx.strokeStyle = "#0a1628"; ctx.lineWidth = 2; ctx.stroke();
    // Inner circle
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.strokeStyle = "#0a1628"; ctx.lineWidth = 1.5; ctx.stroke();
    // Checkmark
    ctx.strokeStyle = "#0a1628"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-3, 12); ctx.lineTo(14, -10); ctx.stroke();
    ctx.restore();

    // ── Certificate ID ────────────────────────────────────────────────
    const certId = `TCP-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    ctx.font = "10px monospace";
    ctx.fillStyle = "#bbb";
    ctx.textAlign = "right";
    ctx.fillText(`Certificate ID: ${certId}`, W - 55, H - 52);

    setReady(true);
  }, [studentName, courseName, instructorName, dateStr]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${courseName.replace(/\s+/g, "_")}_Certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a1628] border-b border-white/10">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#f0c040]" />
            <span className="font-bold text-white">Certificate of Completion</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownload} disabled={!ready}
              className="flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-[#f0c040] to-[#d4a017] text-[#0a1628] px-5 py-2 rounded-xl hover:shadow-lg transition-all disabled:opacity-40">
              <Download className="w-4 h-4" /> Download PNG
            </button>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate preview */}
        <div className="p-4 bg-slate-100 overflow-auto">
          <canvas ref={canvasRef} className="w-full rounded-xl shadow-lg" style={{ imageRendering: "crisp-edges" }} />
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center">
          Right-click the certificate to save, or use the Download button above.
        </div>
      </div>
    </div>
  );
}
