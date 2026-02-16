// LocalStorage-backed data layer with dummy API endpoint structure.
// Replace fetch calls with real API endpoints when backend is ready.

import type {
  Investment, DailyExpense, DailySales, Customer,
  CreditTransaction, Worker, Attendance, CalendarEvent
} from '@/types';

const get = <T>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
};

const set = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ---- Generic CRUD helpers ----
function createCrud<T extends { id: string; created_at?: string }>(key: string) {
  return {
    getAll: (): T[] => get<T>(key),
    getById: (id: string): T | undefined => get<T>(key).find(i => i.id === id),
    create: (item: Omit<T, 'id' | 'created_at'>): T => {
      const items = get<T>(key);
      const newItem = { ...item, id: uid(), created_at: now() } as T;
      items.push(newItem);
      set(key, items);
      return newItem;
    },
    update: (id: string, updates: Partial<T>): T | undefined => {
      const items = get<T>(key);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return undefined;
      items[idx] = { ...items[idx], ...updates };
      set(key, items);
      return items[idx];
    },
    remove: (id: string): boolean => {
      const items = get<T>(key);
      const filtered = items.filter(i => i.id !== id);
      if (filtered.length === items.length) return false;
      set(key, filtered);
      return true;
    },
    getByDate: (date: string): T[] => get<T>(key).filter((i: any) => i.date === date),
  };
}

export const investmentApi = createCrud<Investment>('bakery_investments');
export const expenseApi = createCrud<DailyExpense>('bakery_expenses');
export const salesApi = createCrud<DailySales>('bakery_sales');
export const customerApi = createCrud<Customer>('bakery_customers');
export const creditApi = createCrud<CreditTransaction>('bakery_credits');
export const workerApi = createCrud<Worker>('bakery_workers');
export const attendanceApi = createCrud<Attendance>('bakery_attendance');
export const calendarApi = createCrud<CalendarEvent>('bakery_calendar');

// ---- Aggregation helpers ----
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export function getDailyPL(date: string) {
  const sales = salesApi.getByDate(date);
  const expenses = expenseApi.getByDate(date);
  const totalSales = sales.reduce((s, i) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
  return { totalSales, totalExpenses, profit: totalSales - totalExpenses };
}

export function getMonthlyPL(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const sales = salesApi.getAll().filter(s => s.date.startsWith(prefix));
  const expenses = expenseApi.getAll().filter(e => e.date.startsWith(prefix));
  const totalSales = sales.reduce((s, i) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
  return { totalSales, totalExpenses, profit: totalSales - totalExpenses };
}

export function getOverallPL() {
  const totalInvestment = investmentApi.getAll().reduce((s, i) => s + i.amount, 0);
  const totalSales = salesApi.getAll().reduce((s, i) => s + i.total_amount, 0);
  const totalExpenses = expenseApi.getAll().reduce((s, i) => s + i.amount, 0);
  const profit = totalSales - (totalInvestment + totalExpenses);
  return { totalInvestment, totalSales, totalExpenses, profit };
}

export function getTotalOutstanding() {
  return customerApi.getAll().reduce((s, c) => s + c.total_outstanding, 0);
}

export function getWorkersPresent(date: string) {
  return attendanceApi.getByDate(date).filter(a => a.status === 'present' || a.status === 'late').length;
}

export function getDailyWageCost(date: string) {
  return attendanceApi.getByDate(date).reduce((s, a) => s + a.wage_amount, 0);
}

// Dummy API endpoints for future backend replacement
export const API_ENDPOINTS = {
  investments: '/api/investments',
  expenses: '/api/expenses',
  sales: '/api/sales',
  customers: '/api/customers',
  credits: '/api/credits',
  workers: '/api/workers',
  attendance: '/api/attendance',
  calendar: '/api/calendar',
  reports: '/api/reports',
};
