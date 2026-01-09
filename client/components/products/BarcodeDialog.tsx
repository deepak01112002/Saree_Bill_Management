'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateBarcodeDataURL } from '@/lib/barcode';
import { showToast } from '@/lib/toast';
import { ScanLine, Download, Printer } from 'lucide-react';

interface BarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    _id: string;
    name: string;
    sku: string;
    sellingPrice: number;
  } | null;
}

export function BarcodeDialog({ open, onOpenChange, product }: BarcodeDialogProps) {
  const [barcodeDataURL, setBarcodeDataURL] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && product) {
      generateBarcode();
    }
  }, [open, product]);

  const generateBarcode = async () => {
    if (!product) return;

    try {
      setLoading(true);
      // Use SKU as barcode data (or product ID if SKU not available)
      const barcodeData = product.sku || product._id;
      const dataURL = await generateBarcodeDataURL(barcodeData, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
      });
      setBarcodeDataURL(dataURL);
    } catch (error) {
      console.error('Error generating barcode:', error);
      showToast.error('Failed to generate barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!barcodeDataURL || !product) return;

    const link = document.createElement('a');
    link.download = `Barcode-${product.sku}-${product.name.replace(/\s/g, '-')}.png`;
    link.href = barcodeDataURL;
    link.click();
  };

  const handlePrint = () => {
    if (!barcodeDataURL || !product) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${product.name}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                font-family: Arial, sans-serif;
              }
              .product-info {
                text-align: center;
                margin-bottom: 20px;
              }
              .product-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .product-sku {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
              }
              .product-price {
                font-size: 16px;
                color: #333;
              }
              img {
                max-width: 400px;
                height: auto;
              }
            </style>
          </head>
          <body>
            <div class="product-info">
              <div class="product-name">${product.name}</div>
              <div class="product-sku">SKU: ${product.sku}</div>
              <div class="product-price">₹${product.sellingPrice}</div>
            </div>
            <img src="${barcodeDataURL}" alt="Barcode" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Barcode - {product.name}</DialogTitle>
          <DialogDescription>
            Scan this barcode to quickly add this product to billing
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">Generating barcode...</p>
            </div>
          ) : barcodeDataURL ? (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 w-full">
                <img src={barcodeDataURL} alt="Barcode" className="w-full h-auto max-h-32" />
              </div>
              <div className="text-center mb-4">
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600 font-mono">SKU: {product.sku}</p>
                <p className="text-sm text-gray-700 mt-1">₹{product.sellingPrice}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Failed to generate barcode</p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!barcodeDataURL}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint} disabled={!barcodeDataURL}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

