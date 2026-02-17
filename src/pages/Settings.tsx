import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, User, Download, Upload } from 'lucide-react';
import { exportDatabase, importDatabase } from '@/lib/db';
import { toast } from 'sonner';

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `ABC-Bakery-3-Backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Database exported!');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importDatabase(data);
      toast.success('Database imported! Refresh to see changes.');
    } catch { toast.error('Import failed – invalid file'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-4 py-4">
      <h2 className="font-display font-bold text-lg">Settings</h2>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-display font-semibold text-sm">Data Backup</h3>
          <p className="text-xs text-muted-foreground">Export your entire database as JSON or import a previous backup.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleExport} variant="outline" className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Export Data
            </Button>
            <Button onClick={() => fileRef.current?.click()} variant="outline" className="gap-2 text-xs">
              <Upload className="h-3.5 w-3.5" /> Import Data
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm">App version 1.1.0</p>
          <p className="text-xs mt-1">Data stored locally via IndexedDB (Dexie.js)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-display font-semibold text-sm text-center">Developer Info</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3"><User className="h-4 w-4 text-primary shrink-0" /><span>Developed by <strong>Nauman Khan Gori</strong></span></div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary shrink-0" /><a href="mailto:iamnauman850@gmail.com" className="text-primary underline underline-offset-2">iamnauman850@gmail.com</a></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary shrink-0" /><a href="tel:8223028910" className="text-primary underline underline-offset-2">8223028910</a></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
