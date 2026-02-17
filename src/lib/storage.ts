// Async data layer backed by Dexie.js (IndexedDB).
// All methods are async. Dummy API endpoints kept for future backend replacement.

import { db } from '@/lib/db';

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ---- Generic CRUD factory ----
function createCrud<T extends { id: string; created_at?: string }>(table: any) {
  return {
    getAll: (): Promise<T[]> => table.toArray(),
    getById: (id: string): Promise<T | undefined> => table.get(id),
    create: async (item: Omit<T, 'id' | 'created_at'>): Promise<T> => {
      const newItem = { ...item, id: uid(), created_at: now() } as T;
      await table.add(newItem);
      return newItem;
    },
    update: async (id: string, updates: Partial<T>): Promise<T | undefined> => {
      await table.update(id, updates);
      return table.get(id);
    },
    remove: async (id: string): Promise<boolean> => {
      const count = await table.where('id').equals(id).count();
      if (count === 0) return false;
      await table.delete(id);
      return true;
    },
    getByDate: (date: string): Promise<T[]> => table.where('date').equals(date).toArray(),
  };
}

export const investmentApi = createCrud<any>(db.investments);
export const expenseApi = createCrud<any>(db.expenses);
export const salesApi = createCrud<any>(db.sales);
export const customerApi = createCrud<any>(db.customers);
export const creditApi = createCrud<any>(db.credits);
export const workerApi = createCrud<any>(db.workers);
export const attendanceApi = createCrud<any>(db.attendance);
export const calendarApi = createCrud<any>(db.calendar);

// ---- Helpers ----
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export async function getDailyPL(date: string) {
  const [sales, expenses] = await Promise.all([
    salesApi.getByDate(date),
    expenseApi.getByDate(date),
  ]);
  const totalSales = sales.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s: number, i: any) => s + i.amount, 0);
  return { totalSales, totalExpenses, profit: totalSales - totalExpenses };
}

export async function getMonthlyPL(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const [allSales, allExpenses] = await Promise.all([
    salesApi.getAll(),
    expenseApi.getAll(),
  ]);
  const sales = allSales.filter((s: any) => s.date.startsWith(prefix));
  const expenses = allExpenses.filter((e: any) => e.date.startsWith(prefix));
  const totalSales = sales.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s: number, i: any) => s + i.amount, 0);
  return { totalSales, totalExpenses, profit: totalSales - totalExpenses };
}

export async function getOverallPL() {
  const [investments, sales, expenses] = await Promise.all([
    investmentApi.getAll(),
    salesApi.getAll(),
    expenseApi.getAll(),
  ]);
  const totalInvestment = investments.reduce((s: number, i: any) => s + i.amount, 0);
  const totalSales = sales.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalExpenses = expenses.reduce((s: number, i: any) => s + i.amount, 0);
  const profit = totalSales - (totalInvestment + totalExpenses);
  return { totalInvestment, totalSales, totalExpenses, profit };
}

export async function getTotalOutstanding() {
  const customers = await customerApi.getAll();
  return customers.reduce((s: number, c: any) => s + c.total_outstanding, 0);
}

export async function getWorkersPresent(date: string) {
  const att = await attendanceApi.getByDate(date);
  return att.filter((a: any) => a.status === 'present' || a.status === 'late').length;
}

export async function getDailyWageCost(date: string) {
  const att = await attendanceApi.getByDate(date);
  return att.reduce((s: number, a: any) => s + a.wage_amount, 0);
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
