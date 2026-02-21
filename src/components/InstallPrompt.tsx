import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // iOS detection
    const ua = navigator.userAgent;
    const iosDetected = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    
    if (iosDetected) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Handle beforeinstallprompt for Android
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // If event already occurred before component mounted, try to get it from window
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => setShow(false);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2 shrink-0">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Install BakeryPro</p>
          <p className="text-xs text-muted-foreground">
            {isIOS
              ? "Tap Share → Add to Home Screen"
              : "Quick access & offline support"}
          </p>
        </div>
        {!isIOS && (
          <Button size="sm" onClick={handleInstall} className="shrink-0">
            Install
          </Button>
        )}
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
