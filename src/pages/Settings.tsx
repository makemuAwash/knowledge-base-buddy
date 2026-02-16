import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-4 py-4">
      <h2 className="font-display font-bold text-lg">Settings</h2>
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Settings coming soon.</p>
          <p className="text-xs mt-2">App version 1.0.0</p>
        </CardContent>
      </Card>
    </div>
  );
}
