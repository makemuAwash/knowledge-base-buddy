import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { customerApi, creditApi, getTodayString } from '@/lib/storage';
import type { Customer } from '@/types';
import { toast } from 'sonner';
import { Plus, Phone, Search, IndianRupee } from 'lucide-react';

export default function CreditManagement() {
  const today = getTodayString();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [, refresh] = useState(0);

  const customers = customerApi.getAll();
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );
  const totalOutstanding = customers.reduce((s, c) => s + c.total_outstanding, 0);

  const handleAddCustomer = () => {
    if (!custName) { toast.error('Enter customer name'); return; }
    customerApi.create({ name: custName, mobile: custMobile, address: '', total_outstanding: 0 });
    toast.success('Customer added!');
    setCustName(''); setCustMobile('');
    setAddOpen(false); refresh(n => n + 1);
  };

  const handleAddCredit = () => {
    if (!selectedCustomer || !creditAmount) return;
    const amt = parseFloat(creditAmount);
    creditApi.create({
      customer_id: selectedCustomer.id, date: today,
      items_description: creditDesc, amount: amt,
      amount_paid: 0, balance: amt, status: 'pending', notes: '',
    });
    customerApi.update(selectedCustomer.id, { total_outstanding: selectedCustomer.total_outstanding + amt });
    toast.success('Credit recorded!');
    setCreditAmount(''); setCreditDesc('');
    setAddCreditOpen(false); refresh(n => n + 1);
  };

  const handlePayment = (customer: Customer) => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    customerApi.update(customer.id, { total_outstanding: Math.max(0, customer.total_outstanding - amt) });
    toast.success(`₹${amt} payment recorded`);
    setPayAmount(''); refresh(n => n + 1);
  };

  const getDaysOverdue = (customer: Customer) => {
    const txns = creditApi.getAll().filter(t => t.customer_id === customer.id && t.status !== 'paid');
    if (txns.length === 0) return 0;
    const oldest = txns.sort((a, b) => a.date.localeCompare(b.date))[0];
    return Math.floor((Date.now() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Credit</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name *</Label><Input value={custName} onChange={e => setCustName(e.target.value)} /></div>
              <div><Label className="text-xs">Mobile</Label><Input value={custMobile} onChange={e => setCustMobile(e.target.value)} /></div>
              <Button onClick={handleAddCustomer} className="w-full">Add Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-destructive/10 border-destructive/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-xl font-mono font-bold text-destructive">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No customers found</CardContent></Card>
      ) : (
        filtered.map(c => {
          const days = getDaysOverdue(c);
          const urgency = days > 7 ? 'border-destructive/50' : days > 3 ? 'border-accent/50' : '';
          return (
            <Card key={c.id} className={urgency}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.mobile && <p className="text-xs text-muted-foreground">{c.mobile}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-destructive">₹{c.total_outstanding.toLocaleString('en-IN')}</p>
                    {days > 0 && <p className="text-[10px] text-destructive">{days} days overdue</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1 text-xs gap-1"
                    onClick={() => { setSelectedCustomer(c); setAddCreditOpen(true); }}>
                    <IndianRupee className="h-3 w-3" /> Add Credit
                  </Button>
                  <div className="flex flex-1 gap-1">
                    <Input type="number" placeholder="₹ Pay" className="text-xs font-mono h-8" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handlePayment(c)}>Pay</Button>
                  </div>
                  {c.mobile && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                      <a href={`tel:${c.mobile}`}><Phone className="h-3.5 w-3.5" /></a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={addCreditOpen} onOpenChange={setAddCreditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Credit for {selectedCustomer?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Amount *</Label><Input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} className="font-mono" /></div>
            <div><Label className="text-xs">Items</Label><Input value={creditDesc} onChange={e => setCreditDesc(e.target.value)} /></div>
            <Button onClick={handleAddCredit} className="w-full">Record Credit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
