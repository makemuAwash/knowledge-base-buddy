export interface Investment {
  id: string;
  category: 'Equipment' | 'Infrastructure' | 'Legal' | 'Marketing' | 'Initial Stock';
  item_name: string;
  amount: number;
  date: string;
  payment_method: 'Cash' | 'Online' | 'Credit';
  vendor: string;
  notes: string;
  created_at: string;
}

export interface DailyExpense {
  id: string;
  date: string;
  category: 'Wages' | 'Raw Materials' | 'Utilities' | 'Rent' | 'Miscellaneous' | 'Transportation';
  item_description: string;
  quantity: number;
  amount: number;
  payment_method: 'Cash' | 'Online' | 'Credit';
  vendor: string;
  notes: string;
  created_at: string;
}

export interface DailySales {
  id: string;
  date: string;
  total_amount: number;
  cash_amount: number;
  online_amount: number;
  credit_amount: number;
  notes: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  total_outstanding: number;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  customer_id: string;
  date: string;
  items_description: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid';
  notes: string;
  created_at: string;
}

export interface Worker {
  id: string;
  name: string;
  mobile: string;
  address: string;
  role: 'Baker' | 'Helper' | 'Delivery' | 'Cleaner';
  joining_date: string;
  per_day_wage: number;
  payment_cycle: 'Daily' | 'Weekly' | 'Monthly';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Attendance {
  id: string;
  worker_id: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'late';
  clock_in_time: string;
  clock_out_time: string;
  hours_worked: number;
  wage_amount: number;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  event_type: 'holiday' | 'festival' | 'special' | 'low_sales';
  event_name: string;
  notes: string;
}

export type ExpenseCategory = DailyExpense['category'];
export type InvestmentCategory = Investment['category'];
export type PaymentMethod = 'Cash' | 'Online' | 'Credit';
export type WorkerRole = Worker['role'];
export type AttendanceStatus = Attendance['status'];
