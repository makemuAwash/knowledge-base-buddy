import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { expenseApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import type { ExpenseCategory, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { Plus, ShoppingCart, Zap, Home, Truck, Wrench, Users, Pencil, Trash2 } from 'lucide-react';

const categories: { value: ExpenseCategory; label: string; icon: React.ElementType }[] = [
  { value: 'Raw Materials', label: 'Raw Materials', icon: ShoppingCart },
  { value: 'Wages', label: 'Wages', icon: Users },
  { value: 'Utilities', label: 'Utilities', icon: Zap },
  { value: 'Rent', label: 'Rent', icon: Home },
  { value: 'Transportation', label: 'Transport', icon: Truck },
  { value: 'Miscellaneous', label: 'Misc', icon: Wrench },
];

export default function Expenses() {
  const today = getTodayString();
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<ExpenseCategory>('Raw Materials');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Cash');
  const [vendor, setVendor] = useState('');

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('Raw Materials');
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPayment, setEditPayment] = useState<PaymentMethod>('Cash');
  const [editVendor, setEditVendor] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: todayExpenses, refresh } = useAsyncData(() => expenseApi.getByDate(date), [date]);
  const totalToday = (todayExpenses || []).reduce((s, i: any) => s + i.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || !description) { toast.error('Fill required fields'); return; }
    await expenseApi.create({
      date, category, item_description: description,
      quantity: parseFloat(quantity) || 0, amount: amt,
      payment_method: payment, vendor, notes: '',
    });
    toast.success('Expense recorded!');
    setDescription(''); setAmount(''); setQuantity(''); setVendor('');
    refresh();
  };

  const openEdit = (e: any) => {
    setEditItem(e);
    setEditDate(e.date);
    setEditCategory(e.category);
    setEditDescription(e.item_description);
    setEditAmount(String(e.amount));
    setEditQuantity(String(e.quantity || ''));
    setEditPayment(e.payment_method);
    setEditVendor(e.vendor || '');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editItem) return;
    const amt = parseFloat(editAmount) || 0;
    if (amt <= 0 || !editDescription) { toast.error('Fill required fields'); return; }
    await expenseApi.update(editItem.id, {
      date: editDate,
      category: editCategory,
      item_description: editDescription,
      quantity: parseFloat(editQuantity) || 0,
      amount: amt,
      payment_method: editPayment,
      vendor: editVendor,
    });
    toast.success('Expense updated!');
    setEditOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await expenseApi.remove(deleteId);
    toast.success('Expense deleted');
    setDeleteId(null);
    refresh();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Expenses</h2>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-xs" />
      </div>

      <Card className="bg-destructive/10 border-destructive/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Expenses ({date})</p>
          <p className="text-xl font-mono font-bold text-destructive">₹{totalToday.toLocaleString('en-IN')}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setCategory(value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              category === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label className="text-xs">Description *</Label><Input placeholder="What was the expense?" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Amount *</Label><Input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} className="font-mono" /></div>
              <div><Label className="text-xs">Quantity</Label><Input type="number" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} className="font-mono" /></div>
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
              <div><Label className="text-xs">Vendor</Label><Input placeholder="Optional" value={vendor} onChange={e => setVendor(e.target.value)} /></div>
            </div>
            <Button type="submit" className="w-full gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
          </form>
        </CardContent>
      </Card>

      {(todayExpenses || []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Entries for {date}</h3>
          {(todayExpenses || []).map((e: any) => (
            <Card key={e.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{e.item_description}</p>
                    <p className="text-xs text-muted-foreground">{e.category} · {e.payment_method}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-destructive">-₹{e.amount.toLocaleString('en-IN')}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(e)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(e.id)}>
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
          <DialogHeader><DialogTitle>Edit Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Date</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></div>
            <div><Label className="text-xs">Description *</Label><Input value={editDescription} onChange={e => setEditDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Amount *</Label><Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="font-mono" /></div>
              <div><Label className="text-xs">Quantity</Label><Input type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={editCategory} onValueChange={(v: ExpenseCategory) => setEditCategory(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
            </div>
            <div><Label className="text-xs">Vendor</Label><Input value={editVendor} onChange={e => setEditVendor(e.target.value)} /></div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this expense entry. This action cannot be undone.</AlertDialogDescription>
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
