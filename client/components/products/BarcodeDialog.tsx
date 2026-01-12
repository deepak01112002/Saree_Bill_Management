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
import { Label } from '@/components/ui/label';
import { generateBarcodeDataURL } from '@/lib/barcode';
import { showToast } from '@/lib/toast';
import { printBarcodes, BarcodePrintProduct, PrintOptions, PrintFormat } from '@/lib/barcode-print';
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
  const [printing, setPrinting] = useState(false);
  const [printFormat, setPrintFormat] = useState<PrintFormat>('2x3inch');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
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
        height: 80, // Consistent with bulk format (2 inch width x 3 inch height)
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

  const handleDownload = async () => {
    if (!barcodeDataURL || !product) return;

    try {
      // Create a canvas matching bulk barcode format (2 inch width x 3 inch height)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size: 2 inch width x 3 inch height at 300 DPI
      // 2 inch = 50.8mm = 600px at 300 DPI
      // 3 inch = 76.2mm = 900px at 300 DPI
      const width = 600; // 2 inches at 300 DPI
      const height = 900; // 3 inches at 300 DPI
      canvas.width = width;
      canvas.height = height;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Load barcode image
      const barcodeImg = new Image();
      barcodeImg.src = barcodeDataURL;
      
      await new Promise((resolve, reject) => {
        barcodeImg.onload = resolve;
        barcodeImg.onerror = reject;
      });

      // Calculate positions matching bulk format
      const padding = 15; // 3mm equivalent
      const topSectionHeight = 100; // Space for SKU, name, and MRP
      const barcodeAreaHeight = height - topSectionHeight - (padding * 2);
      const barcodeWidth = width - (padding * 2);
      const barcodeHeight = Math.min(barcodeAreaHeight, barcodeImg.height * (barcodeWidth / barcodeImg.width));

      // Draw SKU (top, monospace, bold)
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`SKU: ${product.sku}`, width / 2, padding + 5);

      // Draw product name (center, bold, wrapped)
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Arial';
      const maxWidth = width - (padding * 2);
      const productName = product.name;
      const words = productName.split(' ');
      let line = '';
      let y = padding + 25;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, width / 2, y);
          line = words[i] + ' ';
          y += 14;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, y);

      // Draw barcode (center, larger)
      const barcodeX = padding;
      const barcodeY = topSectionHeight + padding;
      ctx.drawImage(barcodeImg, barcodeX, barcodeY, barcodeWidth, barcodeHeight);

      // Draw MRP (bottom, bold, large)
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#000000';
      const mrpY = height - padding - 20;
      ctx.fillText(`MRP: ₹${product.sellingPrice.toFixed(2)}`, width / 2, mrpY);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `Barcode-${product.sku}-${product.name.replace(/\s/g, '-')}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast.success('Barcode downloaded with product details!');
      }, 'image/png');
    } catch (error) {
      console.error('Error creating barcode image:', error);
      // Fallback to simple download
      const link = document.createElement('a');
      link.download = `Barcode-${product.sku}-${product.name.replace(/\s/g, '-')}.png`;
      link.href = barcodeDataURL;
      link.click();
      showToast.error('Failed to create complete barcode. Downloaded basic barcode.');
    }
  };

  const handlePrint = async () => {
    if (!product) return;

    try {
      setPrinting(true);
      const productToPrint: BarcodePrintProduct = {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        sellingPrice: product.sellingPrice,
        mrp: product.sellingPrice,
      };

      const options: PrintOptions = {
        format: printFormat,
        paperWidth: printFormat === 'thermal' ? paperWidth : undefined,
        columns: printFormat === 'normal' ? 4 : undefined,
        labelsPerPage: printFormat === 'normal' ? 24 : undefined,
      };

      await printBarcodes([productToPrint], options);
      showToast.success('Opening print dialog...');
    } catch (error: any) {
      console.error('Error printing barcode:', error);
      showToast.error('Failed to print: ' + (error.message || 'Unknown error'));
    } finally {
      setPrinting(false);
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

        <div className="space-y-4">
          {/* Print Format Selection */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-semibold">Print Format</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dialog-format"
                  value="2x3inch"
                  checked={printFormat === '2x3inch'}
                  onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                  className="w-4 h-4"
                />
                <span className="text-sm">2x3 Inch (SKU, Name, Price)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dialog-format"
                  value="normal"
                  checked={printFormat === 'normal'}
                  onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Normal Printer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dialog-format"
                  value="thermal"
                  checked={printFormat === 'thermal'}
                  onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Thermal Printer</span>
              </label>
            </div>

            {printFormat === 'thermal' && (
              <div className="space-y-2">
                <Label className="text-xs">Paper Width</Label>
                <select
                  className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm"
                  value={paperWidth}
                  onChange={(e) => setPaperWidth(e.target.value as '58mm' | '80mm')}
                >
                  <option value="58mm">58mm (2 columns)</option>
                  <option value="80mm">80mm (3 columns)</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={!barcodeDataURL}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handlePrint} disabled={printing || !barcodeDataURL}>
              <Printer className="mr-2 h-4 w-4" />
              {printing ? 'Preparing...' : 'Print'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

