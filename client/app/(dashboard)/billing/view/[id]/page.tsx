'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { billingAPI, settingsAPI } from '@/lib/api';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { ArrowLeft, Printer, Download, QrCode, FileDown } from 'lucide-react';
import Link from 'next/link';
import { generateQRCode, generateBillQRData } from '@/lib/qr';
import { generatePDFFromInvoiceData } from '@/lib/pdf';
import { showToast } from '@/lib/toast';

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const [bill, setBill] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billQRCode, setBillQRCode] = useState<string | null>(null);

  useEffect(() => {
    loadBill();
    loadSettings();
  }, [billId]);

  useEffect(() => {
    if (bill) {
      generateBillQR();
    }
  }, [bill]);

  const loadBill = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await billingAPI.getById(billId);
      setBill(data);
    } catch (err: any) {
      console.error('Error loading bill:', err);
      setError(err.message || 'Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.get();
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      // Don't show error, just use defaults
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!bill || !settings) {
      showToast.error('Bill or settings not loaded. Please wait...');
      return;
    }
    try {
      // Prepare invoice data for PDF generation
      const invoiceData = {
        billNumber: bill.billNumber,
        createdAt: bill.createdAt,
        companyName: settings.companyName,
        website: settings.website,
        companyLogo: settings.companyLogo || "https://lapatola.com/cdn/shop/files/Screenshot_2025-12-25_183108.png?v=1766667767&width=535",
        qrCode: billQRCode,
        gstin: settings.gstin,
        pan: settings.pan,
        cin: settings.cin,
        registeredOfficeAddress: settings.registeredOfficeAddress,
        placeOfSupply: settings.placeOfSupply,
        paymentTerms: settings.paymentTerms,
        customerName: bill.customerName,
        customerMobile: bill.customerMobile,
        customerPanCard: bill.customerPanCard,
        customerEmail: bill.customerId?.email,
        customerAddress: bill.customerId?.address,
        customerGstNumber: bill.customerId?.gstNumber,
        customerFirmName: bill.customerId?.firmName,
        items: bill.items.map((item: any) => ({
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          gstPercentage: item.gstPercentage,
          gstAmount: item.gstAmount,
          hsnCode: item.hsnCode,
        })),
        additionalCharges: bill.additionalCharges,
        subtotal: bill.subtotal,
        gst: bill.gst || 0,
        discount: bill.discount || 0,
        discountPercentage: bill.discountPercentage,
        grandTotal: bill.grandTotal,
        paymentMode: bill.paymentMode,
        invoiceTermsAndConditions: settings?.termsAndConditions,
        invoiceFooterNote: settings?.invoiceFooterNote,
      };

      // Debug: Log invoice data
      console.log('PDF Invoice Data:', {
        ...invoiceData,
        invoiceTermsAndConditions: invoiceData.invoiceTermsAndConditions?.substring(0, 50) + '...',
        invoiceFooterNote: invoiceData.invoiceFooterNote?.substring(0, 50) + '...',
      });

      await generatePDFFromInvoiceData(invoiceData, `Invoice-${bill.billNumber}`);
      showToast.success('PDF downloaded successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      showToast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    }
  };

  const generateBillQR = async () => {
    if (!bill) return;
    try {
      const qrData = generateBillQRData(bill._id, bill.billNumber);
      const qrCodeDataURL = await generateQRCode(qrData);
      setBillQRCode(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating bill QR code:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || 'Bill not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/billing/history">
              <Button className="w-full">Back to Bill History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* Remove all height and overflow restrictions for print */
          html {
            height: auto !important;
            overflow: visible !important;
          }
          
          body {
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
          }
          
          /* Dashboard layout adjustments for print */
          body > div,
          body > div > div {
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
          }
          
          /* Hide sidebar, header, and navigation when printing */
          aside,
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Override dashboard layout constraints */
          body > div,
          body > div > div,
          body > div > div > div {
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
            position: relative !important;
          }
          
          /* Main container - allow full height */
          main {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
          }
          
          /* Remove flex constraints that limit height */
          .flex,
          .flex-1,
          .flex-col {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          
          /* Invoice container */
          #invoice-content {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            page-break-inside: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Card content - remove padding restrictions */
          #invoice-content > div {
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Company header - compact */
          #invoice-content .border-b {
            border-bottom: 2px solid #3b82f6 !important;
            padding-bottom: 8px !important;
            margin-bottom: 10px !important;
          }
          
          /* Company name */
          #invoice-content h2 {
            font-size: 16px !important;
            font-weight: bold !important;
            margin-bottom: 3px !important;
            color: black !important;
          }
          
          /* Website */
          #invoice-content .text-blue-600 {
            color: #3b82f6 !important;
            font-size: 8px !important;
          }
          
          /* Invoice metadata - compact */
          #invoice-content .border-t {
            border-top: 1px solid #e5e7eb !important;
            padding-top: 8px !important;
            margin-top: 8px !important;
          }
          
          /* Text colors - ensure readability */
          #invoice-content .text-gray-600,
          #invoice-content .text-gray-700,
          #invoice-content .text-gray-500 {
            color: #374151 !important;
          }
          
          #invoice-content .text-gray-900 {
            color: black !important;
          }
          
          /* Table styling - compact for single page */
          #invoice-content table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
            margin-bottom: 10px !important;
            page-break-inside: auto !important;
            font-size: 8px !important;
          }
          
          /* Allow table rows to break across pages */
          #invoice-content tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          #invoice-content thead {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #invoice-content th {
            padding: 4px !important;
            text-align: left !important;
            border-bottom: 1px solid #d1d5db !important;
            font-weight: bold !important;
            font-size: 7px !important;
          }
          
          #invoice-content td {
            padding: 4px !important;
            border-bottom: 1px solid #e5e7eb !important;
            font-size: 7px !important;
          }
          
          /* Category headers */
          #invoice-content .bg-blue-50 {
            background-color: #eff6ff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          #invoice-content .bg-gray-50 {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Summary section */
          #invoice-content .flex.justify-end {
            margin-top: 20px !important;
          }
          
          #invoice-content .w-80 {
            width: 40% !important;
          }
          
          /* Footer */
          #invoice-content .mt-8.pt-6.border-t.text-center {
            margin-top: 40px !important;
            padding-top: 20px !important;
            text-align: center !important;
            font-size: 9px !important;
            color: #6b7280 !important;
          }
          
          /* Remove shadows for print */
          #invoice-content .shadow-md,
          #invoice-content .shadow-lg {
            box-shadow: none !important;
          }
          
          /* Ensure proper spacing - compact for single page */
          #invoice-content .space-y-6 > * + * {
            margin-top: 10px !important;
          }
          
          /* Compact sections */
          #invoice-content .mb-6 {
            margin-bottom: 10px !important;
          }
          
          #invoice-content .mt-6 {
            margin-top: 10px !important;
          }
          
          #invoice-content .pt-4 {
            padding-top: 8px !important;
          }
          
          /* Footer - compact */
          #invoice-content .mt-8.pt-6.border-t.text-center {
            margin-top: 15px !important;
            padding-top: 10px !important;
            font-size: 8px !important;
          }
          
          #invoice-content .text-lg {
            font-size: 12px !important;
          }
          
          #invoice-content .text-sm {
            font-size: 8px !important;
          }
          
          #invoice-content .text-xs {
            font-size: 7px !important;
          }
          
          /* QR codes - smaller in print */
          #invoice-content img[alt="QR Code"] {
            max-width: 50px !important;
            max-height: 50px !important;
          }
          
          /* Logo sizing */
          #invoice-content img[alt*="Logo"] {
            max-height: 60px !important;
            width: auto !important;
          }
          
          /* Allow page breaks for long content */
          #invoice-content .border-b,
          #invoice-content .border-t {
            page-break-inside: auto;
          }
          
          /* Remove any fixed heights or overflow restrictions */
          #invoice-content .space-y-6,
          #invoice-content .space-y-4 {
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Ensure wrapper divs don't restrict height */
          #invoice-content div {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
        }
      `}} />
      
      <div className="space-y-6 print:space-y-4">
      {/* Header - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/billing/history">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bill Details</h1>
            <p className="text-gray-600 mt-1">Bill Number: {bill.billNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Bill Content */}
      <Card id="invoice-content" className="border-0 shadow-md print:shadow-none print:border">
        <CardContent className="p-8 print:p-4">
          {/* Company Logo & Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-start">
                  <img 
                    src={settings?.companyLogo || "https://lapatola.com/cdn/shop/files/Screenshot_2025-12-25_183108.png?v=1766667767&width=535"} 
                    alt={`${settings?.companyName || 'Company'} Logo`} 
                    className="h-28 w-auto print:h-24 mb-2"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <p className="text-xs text-gray-900 mt-1 print:text-xs font-bold">Product of casa export</p>
                </div>
                <div>
                  {/* <p className="text-sm text-blue-600 font-medium">Product of casa export</p> */}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-3">
                {billQRCode && (
                  <div>
                    <img 
                      src={billQRCode} 
                      alt="QR Code" 
                      className="w-20 h-20 print:w-16 print:h-16"
                    />
                  </div>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  {settings?.gstin && <p><strong>GSTIN:</strong> {settings.gstin}</p>}
                  {settings?.pan && <p><strong>PAN:</strong> {settings.pan}</p>}
                  {settings?.cin && <p><strong>CIN:</strong> {settings.cin}</p>}
                </div>
                {settings?.registeredOfficeAddress && (
                  <div className="text-xs text-gray-500 mt-3 max-w-xs text-right">
                    <p>Registered Office Address:</p>
                    <p>{settings.registeredOfficeAddress}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Invoice Metadata */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600"><strong>Invoice Number:</strong> <span className="font-mono font-semibold text-gray-900">{bill.billNumber}</span></p>
                <p className="text-sm text-gray-600"><strong>Invoice Date:</strong> {formatDate(bill.createdAt)}</p>
                <p className="text-sm text-gray-600"><strong>Place of Supply:</strong> {settings?.placeOfSupply || '[To be configured]'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600"><strong>Payment Terms:</strong> {settings?.paymentTerms || '[To be configured]'}</p>
                <p className="text-sm text-gray-600"><strong>Mode of Payment:</strong> <span className="capitalize font-semibold">{bill.paymentMode}</span></p>
              </div>
            </div>
            
            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Bill To:</h3>
                {bill.customerName ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-semibold">{bill.customerName}</p>
                    {bill.customerMobile && <p>{bill.customerMobile}</p>}
                    {bill.customerPanCard && <p className="font-mono">PAN: {bill.customerPanCard}</p>}
                    {bill.customerEmail && <p>{bill.customerEmail}</p>}
                    {bill.customerAddress && <p>{bill.customerAddress}</p>}
                    {bill.customerGstNumber && <p className="font-mono">GST: {bill.customerGstNumber}</p>}
                    {bill.customerFirmName && <p>Firm: {bill.customerFirmName}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Walk-in Customer</p>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Ship To:</h3>
                {bill.customerName ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-semibold">{bill.customerName}</p>
                    {bill.customerMobile && <p>{bill.customerMobile}</p>}
                    {bill.customerAddress && <p>{bill.customerAddress}</p>}
                    {!bill.customerAddress && <p className="text-gray-500 italic">Same as billing address</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Walk-in Customer</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill Items - Grouped by Category */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-700">Item Description</th>
                  <th className="text-center p-3 font-semibold text-gray-700">HSN Code</th>
                  <th className="text-center p-3 font-semibold text-gray-700">QR Code</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Qty</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Rate</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group items by category
                  const groupedItems: { [key: string]: any[] } = {};
                  bill.items?.forEach((item: any) => {
                    const category = item.categoryName || 'Uncategorized';
                    if (!groupedItems[category]) {
                      groupedItems[category] = [];
                    }
                    groupedItems[category].push(item);
                  });

                  // Calculate category subtotals
                  const categoryTotals: { [key: string]: number } = {};
                  Object.keys(groupedItems).forEach((category) => {
                    categoryTotals[category] = groupedItems[category].reduce(
                      (sum, item) => sum + (item.total || item.price * item.quantity),
                      0
                    );
                  });

                  // Render grouped items
                  return Object.entries(groupedItems).map(([category, items]) => (
                    <Fragment key={category}>
                      {/* Category Header */}
                      <tr className="bg-blue-50 border-b-2 border-blue-200">
                        <td colSpan={6} className="p-3">
                          <p className="font-bold text-blue-900 text-lg">{category}</p>
                        </td>
                      </tr>
                      {/* Category Items */}
                      {items.map((item: any, index: number) => (
                        <tr key={`${category}-${index}`} className="border-b">
                          <td className="p-3">
                            <p className="font-medium text-gray-900">{item.productName || item.name}</p>
                            {item.productSku && (
                              <p className="text-sm text-gray-500 font-mono">SKU: {item.productSku}</p>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-700 font-mono text-sm">
                            {item.hsnCode || '-'}
                          </td>
                          <td className="p-3 text-center">
                            {item.productSku && billQRCode && (
                              <div className="flex justify-center">
                                <img 
                                  src={billQRCode} 
                                  alt="QR Code" 
                                  className="w-12 h-12"
                                />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="p-3 text-right text-gray-700">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-right font-semibold text-gray-900">
                            {formatCurrency(item.total || item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                      {/* Category Subtotal */}
                      <tr className="bg-gray-50 border-b-2">
                        <td colSpan={5} className="p-3 text-right font-semibold text-gray-700">
                          Subtotal ({category}):
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          {formatCurrency(categoryTotals[category])}
                        </td>
                      </tr>
                    </Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Additional Charges (Stitching Services) - Conditional */}
          {(bill.additionalCharges && bill.additionalCharges.length > 0) && (
            <div className="mb-6 border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-3">Additional Services:</h3>
              <div className="space-y-2">
                {bill.additionalCharges.map((charge: any, index: number) => (
                  <div key={index} className="flex justify-between text-gray-700">
                    <span>{charge.serviceName} ({charge.quantity || 1} {charge.unit || 'item'})</span>
                    <span className="font-semibold">{formatCurrency(charge.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bill Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(bill.subtotal)}</span>
                </div>
                
                {/* Additional Charges Total */}
                {(bill.additionalCharges && bill.additionalCharges.length > 0) && (
                  <div className="flex justify-between text-gray-700">
                    <span>Additional Charges:</span>
                    <span>{formatCurrency(bill.additionalCharges.reduce((sum: number, c: any) => sum + (c.amount || 0), 0))}</span>
                  </div>
                )}
                
                {/* Tax Breakup - CGST/SGST */}
                {bill.gst > 0 && (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>CGST ({bill.gstPercentage ? `${(bill.gstPercentage / 2).toFixed(2)}%` : 'Calculated'}):</span>
                      <span>{formatCurrency(bill.gst / 2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>SGST ({bill.gstPercentage ? `${(bill.gstPercentage / 2).toFixed(2)}%` : 'Calculated'}):</span>
                      <span>{formatCurrency(bill.gst / 2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 border-b pb-2">
                      <span className="font-semibold">Total GST:</span>
                      <span className="font-semibold">{formatCurrency(bill.gst)}</span>
                    </div>
                  </>
                )}
                
                {bill.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount{bill.discountPercentage ? ` (${bill.discountPercentage}%)` : ''}:</span>
                    <span>-{formatCurrency(bill.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(bill.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-bold text-gray-900 mb-2">Terms & Conditions:</h3>
            {settings?.termsAndConditions ? (
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {settings.termsAndConditions}
              </div>
            ) : (
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>This is a system-generated invoice.</li>
              </ul>
            )}
          </div>

          {/* Declaration & Signatures */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Declaration:</h3>
                <p className="text-sm text-gray-700">
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                </p>
              </div>
              <div className="space-y-4">
                {/* <div>
                  <p className="text-sm text-gray-600 mb-8">Customer Signature:</p>
                  <div className="border-b border-gray-400"></div>
                </div> */}
                <div>
                  <p className="text-sm text-gray-600 mb-8">Authorized Signatory:</p>
                  <div className="border-b border-gray-400"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-blue-600 font-medium">{settings?.website || 'www.lapatola.com'}</p>
            {settings?.invoiceFooterNote && (
              <p className="text-xs text-gray-600 mt-2">{settings.invoiceFooterNote}</p>
            )}
            {/* <p className="text-xs text-gray-500 mt-2">For returns, please bring this invoice within 7 days.</p> */}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

