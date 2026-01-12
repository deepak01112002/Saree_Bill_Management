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
import { ScanLine, X, CheckCircle2, Barcode } from 'lucide-react';
import { productsAPI } from '@/lib/api';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (productData: { productId: string; sku: string; name: string; price: number }) => void;
}

export function BarcodeScanner({ open, onOpenChange, onScanSuccess }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'barcode-scanner';
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldown = 500; // 500ms cooldown for barcodes

  useEffect(() => {
    if (open) {
      // Wait for dialog to render before starting scanner
      // Use requestAnimationFrame to ensure DOM is ready
      const startTimer = setTimeout(() => {
        const checkElement = () => {
          const element = document.getElementById(scannerId);
          if (element) {
            startScanner();
          } else {
            // Retry after a short delay if element not found
            setTimeout(checkElement, 100);
          }
        };
        checkElement();
      }, 100);
      
      return () => {
        clearTimeout(startTimer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [open]);

  const startScanner = async () => {
    try {
      // Check if element exists before starting
      const element = document.getElementById(scannerId);
      if (!element) {
        console.error(`Element with id="${scannerId}" not found`);
        setError('Scanner element not found. Please try again.');
        setScanning(false);
        return;
      }

      setError('');
      setScanning(true);

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Configure for barcode scanning - full screen scan area
      // Get element dimensions or use viewport as fallback
      const elementWidth = element.clientWidth > 0 ? element.clientWidth : window.innerWidth;
      const elementHeight = element.clientHeight > 0 ? element.clientHeight : window.innerHeight;
      const scanBoxWidth = Math.min(Math.max(elementWidth * 0.95, 300), 800);
      const scanBoxHeight = Math.min(Math.max(elementHeight * 0.6, 200), 400);
      
      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: scanBoxWidth, height: scanBoxHeight }, // Wide box for barcodes
          aspectRatio: 1.0,
          // Note: html5-qrcode automatically supports barcodes
          // No need to specify formatsToSupport in newer versions
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
      
      // Prevent duplicate processing
      if (decodedText === lastScannedRef.current && (now - lastScanTimeRef.current) < scanCooldown) {
        return;
      }

      const trimmedText = decodedText.trim();
      if (!trimmedText) {
        throw new Error('Empty scan result');
      }
      
      // Use dedicated SKU API endpoint for faster lookup
      try {
        const product = await productsAPI.getBySku(trimmedText);
        
        if (product && product._id) {
          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;
          
          setError('');
          setSuccessMessage(`Product "${product.name || product.sku}" scanned!`);
          setTimeout(() => setSuccessMessage(''), 2000);
          
          // Convert to format for compatibility
          onScanSuccess({
            productId: product._id,
            sku: product.sku || product._id,
            name: product.name || 'Unknown Product',
            price: product.sellingPrice || 0,
          });
        } else {
          throw new Error(`Product with SKU/Barcode "${trimmedText}" not found`);
        }
      } catch (lookupError: any) {
        console.error('Product lookup error:', lookupError);
        setError(lookupError.message || `Product with SKU/Barcode "${trimmedText}" not found`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Invalid barcode. Please scan a valid product barcode.');
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
      <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] m-0 p-0 rounded-none flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode to add it to the cart. Scanner stays open for multiple scans.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 p-4 overflow-hidden">
          {successMessage && (
            <div className="p-3 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="relative flex-1 min-h-0">
            <div 
              id={scannerId} 
              className="w-full h-full rounded-lg overflow-hidden bg-black" 
            ></div>
            {!scanning && !error && open && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
                <div className="text-center text-white">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Barcode className="h-12 w-12" />
                    <ScanLine className="h-12 w-12" />
                  </div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t pt-4 pb-2">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Close Scanner
            </Button>
            {scanning && (
              <Button onClick={stopScanner} variant="outline" className="flex-1">
                Pause Scanner
              </Button>
            )}
            {!scanning && !error && (
              <Button onClick={startScanner} className="flex-1">
                Resume Scanner
              </Button>
            )}
          </div>
          <p className="text-xs text-center text-gray-500 pb-2">
            Scan multiple products without closing. Click "Close Scanner" when done.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
