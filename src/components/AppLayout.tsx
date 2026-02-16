import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
