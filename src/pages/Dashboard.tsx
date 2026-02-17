import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Users, CreditCard } from 'lucide-react';
import {
  getDailyPL, getOverallPL, getTodayString,
  getTotalOutstanding, getWorkersPresent, workerApi
} from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';

export default function Dashboard() {
  const navigate = useNavigate();
  const today = getTodayString();

  const { data } = useAsyncData(async () => {
    const [daily, overall, outstanding, workersPresent, allWorkers] = await Promise.all([
      getDailyPL(today),
      getOverallPL(),
      getTotalOutstanding(),
      getWorkersPresent(today),
      workerApi.getAll(),
    ]);
    const totalWorkers = allWorkers.filter((w: any) => w.status === 'active').length;
    return { daily, overall, outstanding, workersPresent, totalWorkers };
  }, [today]);

  if (!data) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const { daily, overall, outstanding, workersPresent, totalWorkers } = data;
  const recoveryPercent = overall.totalInvestment > 0
    ? Math.min(100, Math.round(((overall.totalSales - overall.totalExpenses) / overall.totalInvestment) * 100))
    : 0;

  return (
    <div className="space-y-4 py-4">
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-xs font-medium opacity-80 mb-1">Today's Profit/Loss</p>
          <div className="flex items-center gap-2">
            {daily.profit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            <span className="text-3xl font-mono font-bold">
              ₹{Math.abs(daily.profit).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex gap-4 mt-3 text-xs opacity-80">
            <span>Sales: ₹{daily.totalSales.toLocaleString('en-IN')}</span>
            <span>Expenses: ₹{daily.totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <CreditCard className="h-4 w-4 mx-auto text-destructive mb-1" />
            <p className="text-lg font-mono font-bold">₹{outstanding.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-mono font-bold">{workersPresent}/{totalWorkers}</p>
            <p className="text-[10px] text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-success mb-1" />
            <p className="text-lg font-mono font-bold">{recoveryPercent}%</p>
            <p className="text-[10px] text-muted-foreground">Recovery</p>
          </CardContent>
        </Card>
      </div>

      {overall.totalInvestment > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Investment Recovery</span>
              <span className="font-mono font-medium">
                ₹{(overall.totalSales - overall.totalExpenses).toLocaleString('en-IN')} / ₹{overall.totalInvestment.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${Math.max(0, recoveryPercent)}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate('/sales')} className="h-12 gap-2"><Plus className="h-4 w-4" /> Add Sale</Button>
        <Button onClick={() => navigate('/expenses')} variant="outline" className="h-12 gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-display font-semibold text-sm">Overall Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Investment</span><span className="font-mono">₹{overall.totalInvestment.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Sales</span><span className="font-mono text-success">₹{overall.totalSales.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses</span><span className="font-mono text-destructive">₹{overall.totalExpenses.toLocaleString('en-IN')}</span></div>
            <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
              <span>Net P&L</span>
              <span className={`font-mono ${overall.profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{overall.profit.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
