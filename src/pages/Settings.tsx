import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, User } from 'lucide-react';

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

      {/* Developer Info */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-display font-semibold text-sm text-center">Developer Info</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span>Developed by <strong>Nauman Khan Gori</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <a href="mailto:iamnauman850@gmail.com" className="text-primary underline underline-offset-2">
                iamnauman850@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <a href="tel:8223028910" className="text-primary underline underline-offset-2">
                8223028910
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
