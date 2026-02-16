import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calendarApi, salesApi, getDailyPL } from '@/lib/storage';
import type { CalendarEvent } from '@/types';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const eventColors: Record<string, string> = {
  holiday: 'bg-destructive/20 text-destructive',
  festival: 'bg-accent/30 text-accent-foreground',
  special: 'bg-success/20 text-success',
  low_sales: 'bg-muted text-muted-foreground',
};

export default function CalendarView() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<CalendarEvent['event_type']>('festival');
  const [, refresh] = useState(0);

  const events = calendarApi.getAll();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    const event = events.find(e => e.date === d);
    const pl = getDailyPL(d);
    return { date: d, day: i + 1, event, hasSales: pl.totalSales > 0 };
  });

  const handleAddEvent = () => {
    if (!selectedDate || !eventName) { toast.error('Fill fields'); return; }
    calendarApi.create({ date: selectedDate, event_type: eventType, event_name: eventName, notes: '' });
    toast.success('Event added!');
    setEventName(''); refresh(n => n + 1);
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Calendar</h2>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-display font-semibold">{monthName} {year}</span>
        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <span key={d} className="text-muted-foreground font-medium py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {days.map(({ date, day, event, hasSales }) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square rounded-md text-xs font-medium flex flex-col items-center justify-center transition-colors ${
                  selectedDate === date ? 'ring-2 ring-primary' : ''
                } ${event ? eventColors[event.event_type] : hasSales ? 'bg-success/10' : 'hover:bg-muted'}`}
              >
                {day}
                {event && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-display font-semibold text-sm">Add Event — {selectedDate}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Event Name</Label>
                <Input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Diwali" />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={eventType} onValueChange={(v: CalendarEvent['event_type']) => setEventType(v)}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="low_sales">Low Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddEvent} className="w-full gap-2 text-xs"><Plus className="h-3.5 w-3.5" /> Add Event</Button>

            {events.filter(e => e.date === selectedDate).map(ev => (
              <div key={ev.id} className={`text-xs px-3 py-2 rounded-md ${eventColors[ev.event_type]}`}>
                {ev.event_name} ({ev.event_type})
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
