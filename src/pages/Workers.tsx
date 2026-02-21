import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { workerApi, attendanceApi, getTodayString } from '@/lib/storage';
import { useAsyncData } from '@/hooks/use-async-data';
import type { WorkerRole, AttendanceStatus } from '@/types';
import { toast } from 'sonner';
import { UserPlus, Check, Pencil, Trash2 } from 'lucide-react';

const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-success/20 text-success border-success/30',
  absent: 'bg-destructive/20 text-destructive border-destructive/30',
  half_day: 'bg-accent/30 text-accent-foreground border-accent/30',
  late: 'bg-accent/20 text-accent-foreground border-accent/30',
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: 'Present', absent: 'Absent', half_day: 'Half Day', late: 'Late',
};

export default function Workers() {
  const today = getTodayString();
  const [date, setDate] = useState(today);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<WorkerRole>('Baker');
  const [wage, setWage] = useState('');

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editRole, setEditRole] = useState<WorkerRole>('Baker');
  const [editWage, setEditWage] = useState('');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, refresh } = useAsyncData(async () => {
    const [allWorkers, att] = await Promise.all([workerApi.getAll(), attendanceApi.getByDate(date)]);
    return { workers: allWorkers.filter((w: any) => w.status === 'active'), attendance: att };
  }, [date]);

  const workers = data?.workers || [];
  const todayAttendance = data?.attendance || [];
  const totalWages = todayAttendance.reduce((s: number, a: any) => s + a.wage_amount, 0);

  const getAttendance = (workerId: string) => todayAttendance.find((a: any) => a.worker_id === workerId);

  const markAttendance = async (worker: any, status: AttendanceStatus) => {
    const existing = getAttendance(worker.id);
    const wageAmount = status === 'present' || status === 'late'
      ? worker.per_day_wage
      : status === 'half_day' ? worker.per_day_wage / 2 : 0;

    if (existing) {
      await attendanceApi.update(existing.id, { status, wage_amount: wageAmount });
    } else {
      await attendanceApi.create({
        worker_id: worker.id, date, status,
        clock_in_time: '', clock_out_time: '',
        hours_worked: status === 'present' ? 8 : status === 'half_day' ? 4 : 0,
        wage_amount: wageAmount, notes: '',
      });
    }
    refresh();
  };

  const handleAddWorker = async () => {
    if (!name || !wage) { toast.error('Fill required fields'); return; }
    await workerApi.create({
      name, mobile, address: '', role, joining_date: today,
      per_day_wage: parseFloat(wage), payment_cycle: 'Daily', status: 'active',
    });
    toast.success('Worker added!');
    setName(''); setMobile(''); setWage('');
    setAddOpen(false); refresh();
  };

  const openEdit = (w: any) => {
    setEditItem(w);
    setEditName(w.name);
    setEditMobile(w.mobile || '');
    setEditRole(w.role);
    setEditWage(String(w.per_day_wage));
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editItem || !editName || !editWage) { toast.error('Fill required fields'); return; }
    await workerApi.update(editItem.id, {
      name: editName,
      mobile: editMobile,
      role: editRole,
      per_day_wage: parseFloat(editWage),
    });
    toast.success('Worker updated!');
    setEditOpen(false);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    // Soft delete - mark as inactive
    await workerApi.update(deleteId, { status: 'inactive' });
    toast.success('Worker removed');
    setDeleteId(null);
    refresh();
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Workers</h2>
        <div className="flex gap-2">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto text-xs" />
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1"><UserPlus className="h-3.5 w-3.5" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Worker</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label className="text-xs">Mobile</Label><Input value={mobile} onChange={e => setMobile(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select value={role} onValueChange={(v: WorkerRole) => setRole(v)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baker">Baker</SelectItem>
                        <SelectItem value="Helper">Helper</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                        <SelectItem value="Cleaner">Cleaner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Daily Wage *</Label><Input type="number" value={wage} onChange={e => setWage(e.target.value)} className="font-mono" /></div>
                </div>
                <Button onClick={handleAddWorker} className="w-full">Add Worker</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">Today's Wage Cost</p>
            <p className="text-xl font-mono font-bold">₹{totalWages.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{todayAttendance.filter((a: any) => a.status === 'present' || a.status === 'late').length} present</p>
            <p>{todayAttendance.filter((a: any) => a.status === 'absent').length} absent</p>
          </div>
        </CardContent>
      </Card>

      {workers.length > 0 && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1"
            onClick={async () => { for (const w of workers) await markAttendance(w, 'present'); toast.success('All marked present'); }}>
            <Check className="h-3 w-3" /> Mark All Present
          </Button>
        </div>
      )}

      {workers.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No workers added yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {workers.map((w: any) => {
            const att = getAttendance(w.id);
            return (
              <Card key={w.id}>
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.role} · ₹{w.per_day_wage}/day</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {att && <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[att.status as AttendanceStatus]}`}>{statusLabels[att.status as AttendanceStatus]}</span>}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(w)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(w.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {(['present', 'absent', 'half_day', 'late'] as AttendanceStatus[]).map(s => (
                      <button key={s} onClick={() => markAttendance(w, s)}
                        className={`flex-1 text-xs py-1.5 rounded-md border transition-colors ${
                          att?.status === s ? statusColors[s] : 'border-border hover:bg-muted'
                        }`}>
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Worker Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Worker</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label className="text-xs">Mobile</Label><Input value={editMobile} onChange={e => setEditMobile(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={editRole} onValueChange={(v: WorkerRole) => setEditRole(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baker">Baker</SelectItem>
                    <SelectItem value="Helper">Helper</SelectItem>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="Cleaner">Cleaner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Daily Wage *</Label><Input type="number" value={editWage} onChange={e => setEditWage(e.target.value)} className="font-mono" /></div>
            </div>
            <Button onClick={handleEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Worker</AlertDialogTitle>
            <AlertDialogDescription>This will mark the worker as inactive. Their attendance history will be preserved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
