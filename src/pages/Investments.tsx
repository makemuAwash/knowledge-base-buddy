import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { investmentApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import type { InvestmentCategory, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { Plus, Landmark } from 'lucide-react';

const categoriesList: InvestmentCategory[] = ['Equipment', 'Infrastructure', 'Legal', 'Marketing', 'Initial Stock'];

export default function Investments() {
  const today = getTodayString();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('Equipment');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Cash');
  const [vendor, setVendor] = useState('');

  const { data: investments, refresh } = useAsyncData(() => investmentApi.getAll(), []);
  const items = investments || [];
  const total = items.reduce((s: number, i: any) => s + i.amount, 0);
  const byCategory = categoriesList.map(c => ({
    category: c,
    total: items.filter((i: any) => i.category === c).reduce((s: number, i: any) => s + i.amount, 0),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!itemName || !amt) { toast.error('Fill required fields'); return; }
    await investmentApi.create({ category, item_name: itemName, amount: amt, date: today, payment_method: payment, vendor, notes: '' });
    toast.success('Investment recorded!');
    setItemName(''); setAmount(''); setVendor(''); refresh();
  };

  return (
    <div className="space-y-4 py-4">
      <h2 className="font-display font-bold text-lg">Investments</h2>

      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Investment</p>
              <p className="text-xl font-mono font-bold">₹{total.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {byCategory.filter(c => c.total > 0).map(c => (
          <Card key={c.category}><CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{c.category}</p>
            <p className="font-mono font-bold text-sm">₹{c.total.toLocaleString('en-IN')}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label className="text-xs">Item *</Label><Input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="What did you invest in?" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={(v: InvestmentCategory) => setCategory(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{categoriesList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Amount *</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Payment</Label>
                <Select value={payment} onValueChange={(v: PaymentMethod) => setPayment(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Vendor</Label><Input value={vendor} onChange={e => setVendor(e.target.value)} /></div>
            </div>
            <Button type="submit" className="w-full gap-2"><Plus className="h-4 w-4" /> Add Investment</Button>
          </form>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">All Investments</h3>
          {[...items].sort((a: any, b: any) => b.created_at.localeCompare(a.created_at)).map((i: any) => (
            <Card key={i.id}><CardContent className="p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{i.item_name}</p>
                <p className="text-xs text-muted-foreground">{i.category} · {i.date}</p>
              </div>
              <span className="font-mono font-bold">₹{i.amount.toLocaleString('en-IN')}</span>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
