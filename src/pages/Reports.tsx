import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMonthlyPL, getOverallPL, salesApi, expenseApi, attendanceApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import { FileText, FileSpreadsheet, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const today = getTodayString();
  const [startDate, setStartDate] = useState(today.slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(today);

  const now = new Date();

  const { data } = useAsyncData(async () => {
    const [monthly, overall, allSales, allExpenses, allWages] = await Promise.all([
      getMonthlyPL(now.getFullYear(), now.getMonth() + 1),
      getOverallPL(),
      salesApi.getAll(),
      expenseApi.getAll(),
      attendanceApi.getAll(),
    ]);
    return { monthly, overall, allSales, allExpenses, allWages };
  }, []);

  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const { monthly, overall } = data;
  const sales = data.allSales.filter((s: any) => s.date >= startDate && s.date <= endDate);
  const expenses = data.allExpenses.filter((e: any) => e.date >= startDate && e.date <= endDate);
  const wages = data.allWages.filter((a: any) => a.date >= startDate && a.date <= endDate);
  const totalSales = sales.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s: number, i: any) => s + i.amount, 0);
  const totalWages = wages.reduce((s: number, a: any) => s + a.wage_amount, 0);
  const profit = totalSales - totalExpenses - totalWages;

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('ABC-Bakery-3', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(`Report: ${startDate} to ${endDate}`, pageWidth / 2, 28, { align: 'center' });
      doc.setDrawColor(139, 69, 19); doc.setLineWidth(0.5);
      doc.line(14, 32, pageWidth - 14, 32);

      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 14, 42);
      autoTable(doc, {
        startY: 46,
        head: [['Metric', 'Amount (₹)']],
        body: [
          ['Total Sales', totalSales.toLocaleString('en-IN')],
          ['Total Expenses', totalExpenses.toLocaleString('en-IN')],
          ['Total Wages', totalWages.toLocaleString('en-IN')],
          ['Net Profit/Loss', profit.toLocaleString('en-IN')],
        ],
        theme: 'grid',
        headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 222, 179] },
        styles: { fontSize: 10 },
      });

      let cursorY = (doc as any).lastAutoTable.finalY + 12;

      if (sales.length > 0) {
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Sales Details', 14, cursorY);
        autoTable(doc, {
          startY: cursorY + 4,
          head: [['Date', 'Cash (₹)', 'Online (₹)', 'Credit (₹)', 'Total (₹)']],
          body: sales.map((s: any) => [s.date, s.cash_amount.toLocaleString('en-IN'), s.online_amount.toLocaleString('en-IN'), s.credit_amount.toLocaleString('en-IN'), s.total_amount.toLocaleString('en-IN')]),
          theme: 'striped', headStyles: { fillColor: [139, 69, 19], textColor: 255 }, styles: { fontSize: 9 },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 12;
      }

      if (expenses.length > 0) {
        if (cursorY > 240) { doc.addPage(); cursorY = 20; }
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Expense Details', 14, cursorY);
        autoTable(doc, {
          startY: cursorY + 4,
          head: [['Date', 'Category', 'Description', 'Amount (₹)']],
          body: expenses.map((e: any) => [e.date, e.category, e.item_description, e.amount.toLocaleString('en-IN')]),
          theme: 'striped', headStyles: { fillColor: [139, 69, 19], textColor: 255 }, styles: { fontSize: 9 },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 12;
      }

      if (cursorY > 260) { doc.addPage(); cursorY = 20; }
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(120);
      doc.text(`Generated on ${new Date().toLocaleString()} | ABC-Bakery-3 | Developed by Nauman Khan Gori`, pageWidth / 2, 290, { align: 'center' });

      doc.save(`ABC-Bakery-3-Report-${startDate}-to-${endDate}.pdf`);
      toast.success('PDF report downloaded!');
    } catch (err) { console.error(err); toast.error('Failed to generate PDF'); }
  };

  const handleExportCSV = () => {
    const lines: string[] = ['ABC-Bakery-3 Report', `Period,${startDate} to ${endDate}`, '', '--- Financial Summary ---', 'Metric,Amount',
      `Total Sales,${totalSales}`, `Total Expenses,${totalExpenses}`, `Total Wages,${totalWages}`, `Net Profit/Loss,${profit}`, ''];
    if (sales.length > 0) {
      lines.push('--- Sales Details ---', 'Date,Cash,Online,Credit,Total');
      sales.forEach((s: any) => lines.push(`${s.date},${s.cash_amount},${s.online_amount},${s.credit_amount},${s.total_amount}`));
      lines.push('');
    }
    if (expenses.length > 0) {
      lines.push('--- Expense Details ---', 'Date,Category,Description,Quantity,Amount,Payment Method');
      expenses.forEach((e: any) => lines.push(`${e.date},${e.category},"${e.item_description}",${e.quantity || ''},${e.amount},${e.payment_method}`));
      lines.push('');
    }
    if (wages.length > 0) {
      lines.push('--- Attendance & Wages ---', 'Date,Worker ID,Status,Hours,Wage');
      wages.forEach((w: any) => lines.push(`${w.date},${w.worker_id},${w.status},${w.hours_worked || ''},${w.wage_amount}`));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ABC-Bakery-3-Report-${startDate}-to-${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded!');
  };

  const handleShare = async () => {
    const text = `ABC-Bakery-3 Report (${startDate} to ${endDate})\nSales: ₹${totalSales.toLocaleString('en-IN')}\nExpenses: ₹${totalExpenses.toLocaleString('en-IN')}\nWages: ₹${totalWages.toLocaleString('en-IN')}\nProfit: ₹${profit.toLocaleString('en-IN')}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ABC-Bakery-3 Report',
          text: text,
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
      }
    } catch (error: any) {
      // Handle abort error (user cancels share)
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Failed to share');
      }
    }
  };

  return (
    <div className="space-y-4 py-4">
      <h2 className="font-display font-bold text-lg">Reports</h2>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-sm">This Month</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="font-mono font-bold text-success">₹{monthly.totalSales.toLocaleString('en-IN')}</p><p className="text-[10px] text-muted-foreground">Sales</p></div>
            <div><p className="font-mono font-bold text-destructive">₹{monthly.totalExpenses.toLocaleString('en-IN')}</p><p className="text-[10px] text-muted-foreground">Expenses</p></div>
            <div><p className={`font-mono font-bold ${monthly.profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{monthly.profit.toLocaleString('en-IN')}</p><p className="text-[10px] text-muted-foreground">Profit</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-display font-semibold text-sm">Custom Report</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">From</label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs" /></div>
            <div><label className="text-xs text-muted-foreground">To</label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs" /></div>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sales</span><span className="font-mono text-success">₹{totalSales.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-mono text-destructive">₹{totalExpenses.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wages</span><span className="font-mono text-destructive">₹{totalWages.toLocaleString('en-IN')}</span></div>
            <div className="border-t pt-1.5 flex justify-between font-semibold">
              <span>Net P&L</span>
              <span className={`font-mono ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{profit.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" /> PDF</Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-1 text-xs"><FileSpreadsheet className="h-3.5 w-3.5" /> CSV</Button>
            <Button onClick={handleShare} variant="outline" className="gap-1 text-xs"><Share2 className="h-3.5 w-3.5" /> Share</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
