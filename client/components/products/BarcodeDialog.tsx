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
  const [printFormat, setPrintFormat] = useState<PrintFormat>('normal');
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
            <div className="flex gap-4">
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

