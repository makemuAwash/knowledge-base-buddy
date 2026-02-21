import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { investmentApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import type { InvestmentCategory, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { Plus, Landmark, Pencil, Trash2 } from 'lucide-react';

const categoriesList: InvestmentCategory[] = ['Equipment', 'Infrastructure', 'Legal', 'Marketing', 'Initial Stock'];

export default function Investments() {
  const today = getTodayString();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<InvestmentCategory>('Equipment');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Cash');
  const [vendor, setVendor] = useState('');

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<InvestmentCategory>('Equipment');
  const [editAmount, setEditAmount] = useState('');
  const [editPayment, setEditPayment] = useState<PaymentMethod>('Cash');
  const [editVendor, setEditVendor] = useState('');
  const [editDate, setEditDate] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const openEdit = (i: any) => {
    setEditItem(i);
    setEditName(i.item_name);
    setEditCategory(i.category);
    setEditAmount(String(i.amount));
    setEditPayment(i.payment_method);
    setEditVendor(i.vendor || '');
    setEditDate(i.date);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editItem) return;
    const amt = parseFloat(editAmount);
    if (!editName || !amt) { toast.error('Fill required fields'); return; }
    await investmentApi.update(editItem.id, {
      item_name: editName,
      category: editCategory,
      amount: amt,
      date: editDate,
      payment_method: editPayment,
      vendor: editVendor,
    });
    toast.success('Investment updated!');
    setEditOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await investmentApi.remove(deleteId);
    toast.success('Investment deleted');
    setDeleteId(null);
    refresh();
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
            <Card key={i.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{i.item_name}</p>
                    <p className="text-xs text-muted-foreground">{i.category} · {i.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold">₹{i.amount.toLocaleString('en-IN')}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(i)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(i.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Investment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Item *</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={editCategory} onValueChange={(v: InvestmentCategory) => setEditCategory(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{categoriesList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Amount *</Label><Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Payment</Label>
                <Select value={editPayment} onValueChange={(v: PaymentMethod) => setEditPayment(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Vendor</Label><Input value={editVendor} onChange={e => setEditVendor(e.target.value)} /></div>
            </div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this investment entry. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
