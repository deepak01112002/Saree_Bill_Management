'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateQRCode, generateQRData } from '@/lib/qr';
import { QrCode, Download, Printer } from 'lucide-react';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    _id: string;
    name: string;
    sku: string;
    sellingPrice: number;
  } | null;
}

export function QRCodeDialog({ open, onOpenChange, product }: QRCodeDialogProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      generateQR();
    }
  }, [open, product]);

  const generateQR = async () => {
    if (!product) return;

    try {
      setLoading(true);
      const qrData = generateQRData(product._id, product.sku, product.name, product.sellingPrice);
      const dataURL = await generateQRCode(qrData);
      setQrCodeDataURL(dataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeDataURL || !product) return;

    const link = document.createElement('a');
    link.download = `QR-${product.sku}-${product.name.replace(/\s/g, '-')}.png`;
    link.href = qrCodeDataURL;
    link.click();
  };

  const handlePrint = () => {
    if (!qrCodeDataURL || !product) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${product.name}</title>
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
                max-width: 300px;
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
            <img src="${qrCodeDataURL}" alt="QR Code" />
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>QR Code - {product.name}</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly add this product to billing
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">Generating QR code...</p>
            </div>
          ) : qrCodeDataURL ? (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <img src={qrCodeDataURL} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="text-center mb-4">
                <p className="font-semibold text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600 font-mono">SKU: {product.sku}</p>
                <p className="text-sm text-gray-700 mt-1">₹{product.sellingPrice}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">Failed to generate QR code</p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!qrCodeDataURL}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint} disabled={!qrCodeDataURL}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


