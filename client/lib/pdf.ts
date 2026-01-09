import { pdf, Document } from '@react-pdf/renderer';
import React from 'react';
import { InvoicePDF, QuotationPDF, QuotationData } from './pdf-react';

interface InvoiceData {
  billNumber: string;
  createdAt: string;
  companyName?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  registeredOfficeAddress?: string;
  placeOfSupply?: string;
  paymentTerms?: string;
  customerName?: string;
  customerMobile?: string;
  customerPanCard?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstNumber?: string;
  customerFirmName?: string;
  items: Array<{
    productName: string;
    productSku?: string;
    quantity: number;
    price: number;
    total: number;
    gstPercentage?: number;
    gstAmount?: number;
    hsnCode?: string;
  }>;
  additionalCharges?: Array<{
    serviceName: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  gst: number;
  discount: number;
  discountPercentage?: number;
  grandTotal: number;
  paymentMode: string;
  invoiceTermsAndConditions?: string;
  invoiceFooterNote?: string;
}

/**
 * Generate PDF from invoice data using react-pdf
 * @param data - Invoice data object
 * @param filename - Name of the PDF file (without .pdf extension)
 */
export async function generatePDFFromElement(elementId: string, filename: string = 'invoice'): Promise<void> {
  try {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Generating PDF...';
    loadingToast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10000;';
    document.body.appendChild(loadingToast);

    // Get the invoice element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Extract data from the DOM (we'll need to parse the invoice HTML)
    // For now, we'll need to pass the data directly
    // This function signature needs to change, but for backward compatibility,
    // we'll extract data from data attributes or a hidden JSON element
    
    // Check if there's a data attribute with invoice data
    const invoiceDataJson = element.getAttribute('data-invoice');
    if (!invoiceDataJson) {
      throw new Error('Invoice data not found. Please ensure the invoice element has data-invoice attribute.');
    }

    const invoiceData: InvoiceData = JSON.parse(invoiceDataJson);

    // Generate PDF using react-pdf
    const doc = React.createElement(InvoicePDF, { data: invoiceData }) as React.ReactElement;
    const asPdf = pdf(doc as any);
    const blob = await asPdf.toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Remove loading indicator
    if (document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate PDF directly from invoice data
 * @param data - Invoice data object
 * @param filename - Name of the PDF file
 */
export async function generatePDFFromInvoiceData(data: InvoiceData, filename: string = 'invoice'): Promise<void> {
  try {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Generating PDF...';
    loadingToast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10000;';
    document.body.appendChild(loadingToast);

    // Generate PDF using react-pdf
    const doc = React.createElement(InvoicePDF, { data }) as React.ReactElement;
    const asPdf = pdf(doc as any);
    const blob = await asPdf.toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Remove loading indicator
    if (document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate Quotation PDF directly from quotation data
 * @param data - Quotation data object
 * @param filename - Name of the PDF file
 */
export async function generateQuotationPDF(data: QuotationData, filename: string = 'quotation'): Promise<void> {
  try {
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Generating Quotation PDF...';
    loadingToast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10000;';
    document.body.appendChild(loadingToast);

    // Generate PDF using react-pdf
    const doc = React.createElement(QuotationPDF, { data }) as React.ReactElement;
    const asPdf = pdf(doc as any);
    const blob = await asPdf.toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Remove loading indicator
    if (document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    throw error;
  }
}
