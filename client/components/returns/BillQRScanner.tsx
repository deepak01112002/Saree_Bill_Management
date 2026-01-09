'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, CheckCircle2 } from 'lucide-react';

interface BillQRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (billData: { billId?: string; billNumber?: string }) => void;
}

export function BillQRScanner({ open, onOpenChange, onScanSuccess }: BillQRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'bill-qr-scanner';
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldown = 2000; // 2 seconds cooldown between scans

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    try {
      setError('');
      setScanning(true);

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent while scanning)
        }
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      // Prevent immediate re-scanning of the same QR code
      const now = Date.now();
      if (decodedText === lastScannedRef.current && (now - lastScanTimeRef.current) < scanCooldown) {
        // Same QR code scanned too soon, ignore
        return;
      }

      // Try to parse as JSON first (for structured bill QR codes)
      const billData = JSON.parse(decodedText);
      
      if (billData.billId || billData.billNumber) {
        // Update last scanned info
        lastScannedRef.current = decodedText;
        lastScanTimeRef.current = now;
        
        // Clear any previous errors
        setError('');
        
        // Show success message
        setSuccessMessage(`Bill ${billData.billNumber || 'loaded'} scanned!`);
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
        
        // Call the success handler (loads the bill)
        onScanSuccess(billData);
        
        // Close scanner after successful bill scan (since we only need one bill for returns)
        setTimeout(() => {
          handleClose();
        }, 1500);
        return;
      }
    } catch (err) {
      // If not JSON, treat as bill number directly
      if (decodedText.startsWith('BILL-')) {
        // Update last scanned info
        lastScannedRef.current = decodedText;
        lastScanTimeRef.current = Date.now();
        
        // Clear any previous errors
        setError('');
        
        // Show success message
        setSuccessMessage(`Bill ${decodedText} scanned!`);
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
        
        // Call the success handler (loads the bill)
        onScanSuccess({ billNumber: decodedText });
        
        // Close scanner after successful bill scan
        setTimeout(() => {
          handleClose();
        }, 1500);
        return;
      }
    }
    
    // If we get here, it's not a valid bill QR code
    setError('Invalid bill QR code. Please scan a bill QR code.');
    setTimeout(() => setError(''), 3000);
  };

  const handleClose = () => {
    stopScanner();
    // Reset scan tracking when closing
    lastScannedRef.current = '';
    lastScanTimeRef.current = 0;
    setError('');
    setSuccessMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scan Bill QR Code</DialogTitle>
          <DialogDescription>
            Point your camera at the bill QR code to load the bill for return
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {successMessage && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="relative">
            <div id={scannerId} className="w-full rounded-lg overflow-hidden bg-black"></div>
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                <div className="text-center text-white">
                  <QrCode className="mx-auto h-12 w-12 mb-2" />
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Close Scanner
            </Button>
            {scanning && (
              <Button onClick={stopScanner} variant="outline" className="flex-1">
                Pause Scanner
              </Button>
            )}
            {!scanning && (
              <Button onClick={startScanner} className="flex-1">
                Resume Scanner
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

