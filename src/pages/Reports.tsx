import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDailyPL, getMonthlyPL, getOverallPL, salesApi, expenseApi, attendanceApi, getTodayString } from '@/lib/storage';
import { Download, FileText, Share2, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

function buildReportData(startDate: string, endDate: string) {
  const sales = salesApi.getAll().filter(s => s.date >= startDate && s.date <= endDate);
  const expenses = expenseApi.getAll().filter(e => e.date >= startDate && e.date <= endDate);
  const wages = attendanceApi.getAll().filter(a => a.date >= startDate && a.date <= endDate);
  const totalSales = sales.reduce((s, i) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
  const totalWages = wages.reduce((s, a) => s + a.wage_amount, 0);
  return { totalSales, totalExpenses, totalWages, profit: totalSales - totalExpenses - totalWages, sales, expenses, wages, salesCount: sales.length, expenseCount: expenses.length };
}

export default function Reports() {
  const today = getTodayString();
  const [startDate, setStartDate] = useState(today.slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(today);

  const now = new Date();
  const monthly = useMemo(() => getMonthlyPL(now.getFullYear(), now.getMonth() + 1), []);
  const overall = useMemo(() => getOverallPL(), []);

  const rangeData = useMemo(() => buildReportData(startDate, endDate), [startDate, endDate]);

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ABC-Bakery-3', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report: ${startDate} to ${endDate}`, pageWidth / 2, 28, { align: 'center' });
      doc.setDrawColor(139, 69, 19);
      doc.setLineWidth(0.5);
      doc.line(14, 32, pageWidth - 14, 32);

      // Summary table
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [['Metric', 'Amount (₹)']],
        body: [
          ['Total Sales', rangeData.totalSales.toLocaleString('en-IN')],
          ['Total Expenses', rangeData.totalExpenses.toLocaleString('en-IN')],
          ['Total Wages', rangeData.totalWages.toLocaleString('en-IN')],
          ['Net Profit/Loss', rangeData.profit.toLocaleString('en-IN')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 222, 179] },
        styles: { fontSize: 10 },
      });

      let cursorY = (doc as any).lastAutoTable.finalY + 12;

      // Sales detail
      if (rangeData.sales.length > 0) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Sales Details', 14, cursorY);
        autoTable(doc, {
          startY: cursorY + 4,
          head: [['Date', 'Cash (₹)', 'Online (₹)', 'Credit (₹)', 'Total (₹)']],
          body: rangeData.sales.map(s => [
            s.date,
            s.cash_amount.toLocaleString('en-IN'),
            s.online_amount.toLocaleString('en-IN'),
            s.credit_amount.toLocaleString('en-IN'),
            s.total_amount.toLocaleString('en-IN'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [139, 69, 19], textColor: 255 },
          styles: { fontSize: 9 },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 12;
      }

      // Expenses detail
      if (rangeData.expenses.length > 0) {
        if (cursorY > 240) { doc.addPage(); cursorY = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Details', 14, cursorY);
        autoTable(doc, {
          startY: cursorY + 4,
          head: [['Date', 'Category', 'Description', 'Amount (₹)']],
          body: rangeData.expenses.map(e => [
            e.date,
            e.category,
            e.item_description,
            e.amount.toLocaleString('en-IN'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [139, 69, 19], textColor: 255 },
          styles: { fontSize: 9 },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 12;
      }

      // Footer
      if (cursorY > 260) { doc.addPage(); cursorY = 20; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120);
      doc.text(`Generated on ${new Date().toLocaleString()} | ABC-Bakery-3 | Developed by Nauman Khan Gori`, pageWidth / 2, 290, { align: 'center' });

      doc.save(`ABC-Bakery-3-Report-${startDate}-to-${endDate}.pdf`);
      toast.success('PDF report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push('ABC-Bakery-3 Report');
    lines.push(`Period,${startDate} to ${endDate}`);
    lines.push('');

    // Summary
    lines.push('--- Financial Summary ---');
    lines.push('Metric,Amount');
    lines.push(`Total Sales,${rangeData.totalSales}`);
    lines.push(`Total Expenses,${rangeData.totalExpenses}`);
    lines.push(`Total Wages,${rangeData.totalWages}`);
    lines.push(`Net Profit/Loss,${rangeData.profit}`);
    lines.push('');

    // Sales
    if (rangeData.sales.length > 0) {
      lines.push('--- Sales Details ---');
      lines.push('Date,Cash,Online,Credit,Total');
      rangeData.sales.forEach(s => {
        lines.push(`${s.date},${s.cash_amount},${s.online_amount},${s.credit_amount},${s.total_amount}`);
      });
      lines.push('');
    }

    // Expenses
    if (rangeData.expenses.length > 0) {
      lines.push('--- Expense Details ---');
      lines.push('Date,Category,Description,Quantity,Amount,Payment Method');
      rangeData.expenses.forEach(e => {
        lines.push(`${e.date},${e.category},"${e.item_description}",${e.quantity || ''},${e.amount},${e.payment_method}`);
      });
      lines.push('');
    }

    // Wages
    if (rangeData.wages.length > 0) {
      lines.push('--- Attendance & Wages ---');
      lines.push('Date,Worker ID,Status,Hours,Wage');
      rangeData.wages.forEach(w => {
        lines.push(`${w.date},${w.worker_id},${w.status},${w.hours_worked || ''},${w.wage_amount}`);
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABC-Bakery-3-Report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded!');
  };

  const handleShare = async () => {
    const text = `ABC-Bakery-3 Report (${startDate} to ${endDate})\nSales: ₹${rangeData.totalSales.toLocaleString('en-IN')}\nExpenses: ₹${rangeData.totalExpenses.toLocaleString('en-IN')}\nWages: ₹${rangeData.totalWages.toLocaleString('en-IN')}\nProfit: ₹${rangeData.profit.toLocaleString('en-IN')}`;
    if (navigator.share) {
      await navigator.share({ title: 'ABC-Bakery-3 Report', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="space-y-4 py-4">
      <h2 className="font-display font-bold text-lg">Reports</h2>

      {/* This Month */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-sm">This Month</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-mono font-bold text-success">₹{monthly.totalSales.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground">Sales</p>
            </div>
            <div>
              <p className="font-mono font-bold text-destructive">₹{monthly.totalExpenses.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground">Expenses</p>
            </div>
            <div>
              <p className={`font-mono font-bold ${monthly.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                ₹{monthly.profit.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-muted-foreground">Profit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Range */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold text-sm">Custom Report</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs" />
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sales</span><span className="font-mono text-success">₹{rangeData.totalSales.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-mono text-destructive">₹{rangeData.totalExpenses.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wages</span><span className="font-mono text-destructive">₹{rangeData.totalWages.toLocaleString('en-IN')}</span></div>
            <div className="border-t pt-1.5 flex justify-between font-semibold">
              <span>Net P&L</span>
              <span className={`font-mono ${rangeData.profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{rangeData.profit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-1 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button onClick={handleShare} variant="outline" className="gap-1 text-xs">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
