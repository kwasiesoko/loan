import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Formats a number as Ghana Cedis */
const fmt = (v) =>
  `GHS ${(v || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Formats a date string as "06 Apr 2026" */
const fmtD = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Generates and downloads a PDF loan statement.
 * @param {object} loan - The full loan object returned by the API.
 */
export function downloadLoanPdf(loan) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 0;

  // ── Header band ──────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, W, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('REAL & FAST POINT ENTERPRISES', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Loan Statement & Payment Plan', margin, 21);
  doc.text(`Generated: ${fmtD(new Date().toISOString())}`, W - margin, 21, { align: 'right' });

  y = 40;

  // ── Customer info ─────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${loan.customer?.firstName} ${loan.customer?.lastName}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  y += 6;
  doc.text(`Phone: ${loan.customer?.phone || '—'}`, margin, y);

  // ── Loan overview box ─────────────────────────────────────────
  y += 10;
  doc.setFillColor(248, 250, 252); // light grey
  doc.roundedRect(margin, y, W - margin * 2, 52, 3, 3, 'F');

  const overviewRows = [
    ['Loan ID',        `#${loan.id?.slice(-8).toUpperCase() || '—'}`, 'Status',         loan.status || '—'],
    ['Principal',      fmt(loan.amount),                               'Interest Rate',  `${loan.interestRate}%`],
    ['Interest Model', loan.interestModel === 'FLAT' ? 'Flat Rate' : 'Reducing Balance', 'Duration', `${loan.durationMonths} Month(s)`],
    ['Frequency',      loan.repaymentFrequency === 'WEEKLY' ? 'Weekly' : 'Monthly',      'Installments', `${loan.installments?.length || 0}`],
    ['Installment Amt',fmt(loan.monthlyPayment),                       'Total Repayable', fmt(loan.totalRepayable)],
    ['Disbursed On',   fmtD(loan.createdAt),                          'First Due Date',  fmtD(loan.installments?.[0]?.dueDate)],
  ];

  const colW = (W - margin * 2 - 8) / 4;
  const rowH = 8;
  let ry = y + 6;
  overviewRows.forEach(([l1, v1, l2, v2]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(l1, margin + 4, ry);
    doc.text(l2, margin + 4 + colW * 2, ry);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(v1, margin + 4 + colW, ry, { align: 'right' });
    doc.text(v2, margin + 4 + colW * 4, ry, { align: 'right' });

    ry += rowH;
  });

  y += 58; // below the box

  // ── Totals bar ────────────────────────────────────────────────
  const totalPaid = loan.repayments?.reduce((s, r) => s + r.amount, 0) || 0;
  const totalRemaining = Math.max(0, loan.totalRepayable - totalPaid);
  const progress = loan.totalRepayable > 0 ? Math.min(100, (totalPaid / loan.totalRepayable) * 100) : 0;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, W - margin * 2, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Paid', margin + 4, y + 7);
  doc.text(fmt(totalPaid), margin + 4, y + 14);
  doc.setTextColor(220, 38, 38);
  doc.text('Remaining', margin + 68, y + 7);
  doc.text(fmt(totalRemaining), margin + 68, y + 14);
  doc.setTextColor(5, 150, 105);
  doc.text(`Progress: ${progress.toFixed(1)}%`, W - margin - 4, y + 10, { align: 'right' });

  y += 26;

  // ── Payment schedule table ────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Payment Schedule', margin, y);
  y += 4;

  const now = new Date();
  const rows = (loan.installments || []).map((inst, i) => {
    const overdue = !inst.paid && new Date(inst.dueDate) < now;
    const status = inst.paid ? 'Paid' : overdue ? 'Overdue' : 'Pending';
    return [
      String(i + 1),
      fmtD(inst.dueDate),
      fmt(inst.amount),
      status,
      inst.paidAt ? fmtD(inst.paidAt) : '—',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Due Date', 'Amount (GHS)', 'Status', 'Paid On']],
    body: rows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    didDrawCell: (data) => {
      // Colour-code the Status column
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw;
        if (val === 'Paid')    doc.setTextColor(5, 150, 105);
        if (val === 'Overdue') doc.setTextColor(220, 38, 38);
        if (val === 'Pending') doc.setTextColor(100, 116, 139);
      }
    },
  });

  // ── Footer ────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Real & Fast Point Enterprises — Confidential Loan Document',
      W / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pages}`, W - margin, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  // ── Save ──────────────────────────────────────────────────────
  const name = `${loan.customer?.firstName || 'Customer'}_${loan.customer?.lastName || ''}_Loan_${loan.id?.slice(-6).toUpperCase() || 'STMT'}.pdf`;
  doc.save(name.replace(/\s+/g, '_'));
}
