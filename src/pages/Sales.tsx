import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { salesApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import { toast } from 'sonner';
import { Plus, IndianRupee, Pencil, Trash2 } from 'lucide-react';

export default function Sales() {
  const today = getTodayString();
  const [cash, setCash] = useState('');
  const [online, setOnline] = useState('');
  const [credit, setCredit] = useState('');
  const total = (parseFloat(cash) || 0) + (parseFloat(online) || 0) + (parseFloat(credit) || 0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(today);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editCash, setEditCash] = useState('');
  const [editOnline, setEditOnline] = useState('');
  const [editCredit, setEditCredit] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const editTotal = (parseFloat(editCash) || 0) + (parseFloat(editOnline) || 0) + (parseFloat(editCredit) || 0);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: todaySales, refresh } = useAsyncData(() => salesApi.getByDate(date), [date]);
  const totalToday = (todaySales || []).reduce((s, i: any) => s + i.total_amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) { toast.error('Enter a valid amount'); return; }
    await salesApi.create({
      date, total_amount: total,
      cash_amount: parseFloat(cash) || 0,
      online_amount: parseFloat(online) || 0,
      credit_amount: parseFloat(credit) || 0,
      notes,
    });
    toast.success('Sale recorded!');
    setCash(''); setOnline(''); setCredit(''); setNotes('');
    refresh();
  };

  const openEdit = (s: any) => {
    setEditItem(s);
    setEditCash(String(s.cash_amount || 0));
    setEditOnline(String(s.online_amount || 0));
    setEditCredit(String(s.credit_amount || 0));
    setEditNotes(s.notes || '');
    setEditDate(s.date || date);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editItem || editTotal <= 0) { toast.error('Enter a valid amount'); return; }
    await salesApi.update(editItem.id, {
      date: editDate,
      total_amount: editTotal,
      cash_amount: parseFloat(editCash) || 0,
      online_amount: parseFloat(editOnline) || 0,
      credit_amount: parseFloat(editCredit) || 0,
      notes: editNotes,
    });
    toast.success('Sale updated!');
    setEditOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await salesApi.remove(deleteId);
    toast.success('Sale deleted');
    setDeleteId(null);
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
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Cash</Label><Input type="number" placeholder="0" value={cash} onChange={e => setCash(e.target.value)} className="font-mono text-sm" /></div>
              <div><Label className="text-xs">Online</Label><Input type="number" placeholder="0" value={online} onChange={e => setOnline(e.target.value)} className="font-mono text-sm" /></div>
              <div><Label className="text-xs">Credit</Label><Input type="number" placeholder="0" value={credit} onChange={e => setCredit(e.target.value)} className="font-mono text-sm" /></div>
            </div>
            <div>
              <Label className="text-xs">Total Amount (auto-calculated)</Label>
              <Input type="number" value={total > 0 ? total : ''} readOnly className="font-mono text-lg bg-muted" />
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
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold">₹{s.total_amount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Cash: ₹{s.cash_amount} | Online: ₹{s.online_amount} | Credit: ₹{s.credit_amount}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Sale</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Date</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Cash</Label><Input type="number" value={editCash} onChange={e => setEditCash(e.target.value)} className="font-mono" /></div>
              <div><Label className="text-xs">Online</Label><Input type="number" value={editOnline} onChange={e => setEditOnline(e.target.value)} className="font-mono" /></div>
              <div><Label className="text-xs">Credit</Label><Input type="number" value={editCredit} onChange={e => setEditCredit(e.target.value)} className="font-mono" /></div>
            </div>
            <div>
              <Label className="text-xs">Total (auto)</Label>
              <Input type="number" value={editTotal > 0 ? editTotal : ''} readOnly className="font-mono bg-muted" />
            </div>
            <div><Label className="text-xs">Notes</Label><Input value={editNotes} onChange={e => setEditNotes(e.target.value)} /></div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this sale entry. This action cannot be undone.</AlertDialogDescription>
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
