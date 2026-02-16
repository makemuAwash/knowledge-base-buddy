import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDailyPL, getMonthlyPL, getOverallPL, salesApi, expenseApi, attendanceApi, getTodayString } from '@/lib/storage';
import { Download, FileText, Share2 } from 'lucide-react';

export default function Reports() {
  const today = getTodayString();
  const [startDate, setStartDate] = useState(today.slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(today);

  const now = new Date();
  const monthly = useMemo(() => getMonthlyPL(now.getFullYear(), now.getMonth() + 1), []);
  const overall = useMemo(() => getOverallPL(), []);

  const rangeData = useMemo(() => {
    const sales = salesApi.getAll().filter(s => s.date >= startDate && s.date <= endDate);
    const expenses = expenseApi.getAll().filter(e => e.date >= startDate && e.date <= endDate);
    const wages = attendanceApi.getAll().filter(a => a.date >= startDate && a.date <= endDate);
    const totalSales = sales.reduce((s, i) => s + i.total_amount, 0);
    const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
    const totalWages = wages.reduce((s, a) => s + a.wage_amount, 0);
    return { totalSales, totalExpenses, totalWages, profit: totalSales - totalExpenses - totalWages, salesCount: sales.length, expenseCount: expenses.length };
  }, [startDate, endDate]);

  const handleExport = () => {
    const report = `Bakery Report (${startDate} to ${endDate})\n\nSales: ₹${rangeData.totalSales}\nExpenses: ₹${rangeData.totalExpenses}\nWages: ₹${rangeData.totalWages}\nNet P&L: ₹${rangeData.profit}\n\nSales entries: ${rangeData.salesCount}\nExpense entries: ${rangeData.expenseCount}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bakery-report-${startDate}-${endDate}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `Bakery Report (${startDate} to ${endDate})\nSales: ₹${rangeData.totalSales}\nExpenses: ₹${rangeData.totalExpenses}\nProfit: ₹${rangeData.profit}`;
    if (navigator.share) {
      await navigator.share({ title: 'Bakery Report', text });
    } else {
      navigator.clipboard.writeText(text);
      import('sonner').then(m => m.toast.success('Copied to clipboard!'));
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

          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="flex-1 gap-1 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 gap-1 text-xs"><Share2 className="h-3.5 w-3.5" /> Share</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
