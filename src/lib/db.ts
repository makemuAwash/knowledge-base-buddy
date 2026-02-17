import Dexie, { type EntityTable } from 'dexie';
import type {
  Investment, DailyExpense, DailySales, Customer,
  CreditTransaction, Worker, Attendance, CalendarEvent
} from '@/types';

class BakeryDatabase extends Dexie {
  investments!: EntityTable<Investment, 'id'>;
  expenses!: EntityTable<DailyExpense, 'id'>;
  sales!: EntityTable<DailySales, 'id'>;
  customers!: EntityTable<Customer, 'id'>;
  credits!: EntityTable<CreditTransaction, 'id'>;
  workers!: EntityTable<Worker, 'id'>;
  attendance!: EntityTable<Attendance, 'id'>;
  calendar!: EntityTable<CalendarEvent, 'id'>;

  constructor() {
    super('BakeryDB');
    this.version(1).stores({
      investments: 'id, category, date, created_at',
      expenses: 'id, date, category, created_at',
      sales: 'id, date, created_at',
      customers: 'id, name, mobile, created_at',
      credits: 'id, customer_id, date, status, created_at',
      workers: 'id, status, role, created_at',
      attendance: 'id, worker_id, date',
      calendar: 'id, date, event_type',
    });
  }
}

export const db = new BakeryDatabase();

// ---- Export full database as JSON (for future data export) ----
export async function exportDatabase() {
  const [investments, expenses, sales, customers, credits, workers, attendance, calendar] =
    await Promise.all([
      db.investments.toArray(),
      db.expenses.toArray(),
      db.sales.toArray(),
      db.customers.toArray(),
      db.credits.toArray(),
      db.workers.toArray(),
      db.attendance.toArray(),
      db.calendar.toArray(),
    ]);
  return { investments, expenses, sales, customers, credits, workers, attendance, calendar, exportedAt: new Date().toISOString() };
}

// ---- Import database from JSON ----
export async function importDatabase(data: Awaited<ReturnType<typeof exportDatabase>>) {
  await db.transaction('rw', [db.investments, db.expenses, db.sales, db.customers, db.credits, db.workers, db.attendance, db.calendar], async () => {
    await Promise.all([
      db.investments.clear(), db.expenses.clear(), db.sales.clear(), db.customers.clear(),
      db.credits.clear(), db.workers.clear(), db.attendance.clear(), db.calendar.clear(),
    ]);
    await Promise.all([
      db.investments.bulkAdd(data.investments),
      db.expenses.bulkAdd(data.expenses),
      db.sales.bulkAdd(data.sales),
      db.customers.bulkAdd(data.customers),
      db.credits.bulkAdd(data.credits),
      db.workers.bulkAdd(data.workers),
      db.attendance.bulkAdd(data.attendance),
      db.calendar.bulkAdd(data.calendar),
    ]);
  });
}
