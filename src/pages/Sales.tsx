import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { salesApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import { toast } from 'sonner';
import { Plus, IndianRupee } from 'lucide-react';

export default function Sales() {
  const today = getTodayString();
  const [total, setTotal] = useState('');
  const [cash, setCash] = useState('');
  const [online, setOnline] = useState('');
  const [credit, setCredit] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today);

  const { data: todaySales, refresh } = useAsyncData(() => salesApi.getByDate(date), [date]);
  const totalToday = (todaySales || []).reduce((s, i: any) => s + i.total_amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmt = parseFloat(total) || 0;
    if (totalAmt <= 0) { toast.error('Enter a valid amount'); return; }
    await salesApi.create({
      date, total_amount: totalAmt,
      cash_amount: parseFloat(cash) || 0,
      online_amount: parseFloat(online) || 0,
      credit_amount: parseFloat(credit) || 0,
      notes,
    });
    toast.success('Sale recorded!');
    setTotal(''); setCash(''); setOnline(''); setCredit(''); setNotes('');
    refresh();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Sales Entry</h2>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-xs" />
      </div>

      <Card className="bg-success/10 border-success/30">
        <CardContent className="p-4 flex items-center gap-3">
          <IndianRupee className="h-5 w-5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Total Sales ({date})</p>
            <p className="text-xl font-mono font-bold text-success">₹{totalToday.toLocaleString('en-IN')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-xs">Total Amount *</Label>
              <Input type="number" placeholder="0" value={total} onChange={e => setTotal(e.target.value)} className="font-mono text-lg" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Cash</Label><Input type="number" placeholder="0" value={cash} onChange={e => setCash(e.target.value)} className="font-mono text-sm" /></div>
              <div><Label className="text-xs">Online</Label><Input type="number" placeholder="0" value={online} onChange={e => setOnline(e.target.value)} className="font-mono text-sm" /></div>
              <div><Label className="text-xs">Credit</Label><Input type="number" placeholder="0" value={credit} onChange={e => setCredit(e.target.value)} className="font-mono text-sm" /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Input placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <Button type="submit" className="w-full gap-2"><Plus className="h-4 w-4" /> Record Sale</Button>
          </form>
        </CardContent>
      </Card>

      {(todaySales || []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Entries for {date}</h3>
          {(todaySales || []).map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold">₹{s.total_amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground">Cash: ₹{s.cash_amount} | Online: ₹{s.online_amount} | Credit: ₹{s.credit_amount}</p>
                </div>
                {s.notes && <p className="text-xs text-muted-foreground max-w-[100px] truncate">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
