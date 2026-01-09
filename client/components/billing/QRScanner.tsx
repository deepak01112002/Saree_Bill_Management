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
import { QrCode, X, CheckCircle2, ScanLine } from 'lucide-react';
import { productsAPI } from '@/lib/api';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (productData: { productId: string; sku: string; name: string; price: number }) => void;
}

export function QRScanner({ open, onOpenChange, onScanSuccess }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-scanner';
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldown = 300; // 300ms cooldown - prevents duplicate processing from rapid camera frames, but allows re-scans

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

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const now = Date.now();
      
      // Only prevent duplicate processing if it's the exact same scan within a very short time
      // This prevents the camera from processing the same frame multiple times
      // But allows users to scan the same product again after moving it away and back
      if (decodedText === lastScannedRef.current && (now - lastScanTimeRef.current) < scanCooldown) {
        // Same code scanned too soon (within 300ms), ignore to prevent duplicate processing
        // This is likely the same camera frame being processed multiple times
        return;
      }

      // Try to parse as JSON (QR code format)
      try {
        const productData = JSON.parse(decodedText);

        if (productData.productId && productData.sku) {
          // Update last scanned info AFTER processing
          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;
          
          setError('');
          setSuccessMessage(`Product ${productData.name || productData.sku} scanned!`);
          setTimeout(() => setSuccessMessage(''), 1500);
          
          onScanSuccess(productData);
          return;
        }
      } catch (jsonError) {
        // Not JSON, likely a barcode (SKU)
        // Try to find product by SKU
        try {
          const result = await productsAPI.getAll({ search: decodedText, limit: 1 });
          const products = result.products || [];
          
          // Find exact SKU match
          const product = products.find((p: any) => p.sku === decodedText || p.sku?.toLowerCase() === decodedText.toLowerCase());
          
          if (product) {
            lastScannedRef.current = decodedText;
            lastScanTimeRef.current = now;
            
            setError('');
            setSuccessMessage(`Product ${product.name || product.sku} scanned!`);
            setTimeout(() => setSuccessMessage(''), 1500);
            
            // Convert to QR format for compatibility
            onScanSuccess({
              productId: product._id,
              sku: product.sku,
              name: product.name,
              price: product.sellingPrice,
            });
            return;
          } else {
            throw new Error('Product not found');
          }
        } catch (lookupError) {
          console.error('Product lookup error:', lookupError);
          setError('Product not found. Please scan a valid QR code or barcode.');
          setTimeout(() => setError(''), 3000);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Invalid code. Please scan a product QR code or barcode.');
      setTimeout(() => setError(''), 3000);
    }
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
          <DialogTitle>Scan QR Code or Barcode</DialogTitle>
          <DialogDescription>
            Point your camera at a product QR code or barcode to add it to the cart. Scanner stays open for multiple scans.
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
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <QrCode className="h-12 w-12" />
                    <ScanLine className="h-12 w-12" />
                  </div>
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
          <p className="text-xs text-center text-gray-500">
            Scan multiple products without closing. Click "Close Scanner" when done.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

