import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, CreditCard, Landmark, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/credit', icon: CreditCard, label: 'Credit Management' },
  { path: '/investments', icon: Landmark, label: 'Investments' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Find current page title
  const allPages = [
    { path: '/', label: 'Dashboard' },
    { path: '/sales', label: 'Sales' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/workers', label: 'Workers' },
    { path: '/reports', label: 'Reports' },
    ...menuItems,
  ];
  const current = allPages.find(p => p.path === location.pathname);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <h1 className="text-lg font-display font-bold text-primary truncate">
            🧁 BakeryPro
          </h1>
          <span className="text-sm font-medium text-muted-foreground">
            {current?.label}
          </span>
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Slide-out menu */}
      {open && (
        <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-64 bg-card shadow-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-display font-bold text-lg">Menu</span>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {menuItems.map(({ path, icon: Icon, label }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
