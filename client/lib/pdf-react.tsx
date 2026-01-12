import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 15,
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 5,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productOfText: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 3,
  },
  qrCode: {
    width: 60,
    height: 60,
  },
  website: {
    fontSize: 10,
    color: '#3b82f6',
  },
  invoiceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTop: '1 solid #e5e7eb',
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  customerBox: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1 solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  tableCell: {
    fontSize: 9,
  },
  col1: { width: '30%' },
  col2: { width: '15%' },
  col3: { width: '10%' },
  col4: { width: '15%' },
  col5: { width: '15%' },
  col6: { width: '15%' },
  summary: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #000',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #e5e7eb',
    textAlign: 'center',
    fontSize: 9,
    color: '#6b7280',
    minHeight: 80,
  },
});

interface InvoiceData {
  billNumber: string;
  createdAt: string;
  companyName?: string;
  website?: string;
  companyLogo?: string;
  qrCode?: string;
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

export function InvoicePDF({ data }: { data: InvoiceData }) {
  // Debug: Log received data
  console.log('InvoicePDF received data:', {
    hasTerms: !!data.invoiceTermsAndConditions,
    termsLength: data.invoiceTermsAndConditions?.length || 0,
    termsContent: data.invoiceTermsAndConditions?.substring(0, 100) || 'N/A',
    hasFooterNote: !!data.invoiceFooterNote,
    footerNoteLength: data.invoiceFooterNote?.length || 0,
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <View style={styles.logoContainer}>
              {data.companyLogo && (
                <Image src={data.companyLogo} style={styles.logo} />
              )}
              <Text style={styles.website}>Product of casa export</Text>
              {/* <Text style={styles.website}>{data.website || 'www.lapatola.com'}</Text> */}
            </View>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View>
                {data.gstin && <Text style={{ fontSize: 9 }}>GSTIN: {data.gstin}</Text>}
                {data.pan && <Text style={{ fontSize: 9 }}>PAN: {data.pan}</Text>}
                {data.cin && <Text style={{ fontSize: 9 }}>CIN: {data.cin}</Text>}
                {data.registeredOfficeAddress && (
                  <Text style={{ fontSize: 8, marginTop: 5, maxWidth: 150 }}>
                    {data.registeredOfficeAddress}
                  </Text>
                )}
              </View>
              {data.qrCode && (
                <View>
                  <Image src={data.qrCode} style={styles.qrCode} />
                </View>
              )}
            </View>
          </View>

          {/* Invoice Metadata */}
          <View style={styles.invoiceMeta}>
            <View>
              <Text style={{ fontSize: 9 }}>Invoice Number: {data.billNumber}</Text>
              <Text style={{ fontSize: 9 }}>Invoice Date: {formatDate(data.createdAt)}</Text>
              <Text style={{ fontSize: 9 }}>Place of Supply: {data.placeOfSupply || 'N/A'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9 }}>Payment Terms: {data.paymentTerms || 'N/A'}</Text>
              <Text style={{ fontSize: 9 }}>Mode of Payment: {data.paymentMode}</Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <View style={styles.customerBox}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            {data.customerName ? (
              <View>
                <Text style={{ fontSize: 9 }}>{data.customerName}</Text>
                {data.customerMobile && <Text style={{ fontSize: 9 }}>{data.customerMobile}</Text>}
                {data.customerPanCard && <Text style={{ fontSize: 9 }}>PAN: {data.customerPanCard}</Text>}
                {data.customerEmail && <Text style={{ fontSize: 9 }}>{data.customerEmail}</Text>}
                {data.customerAddress && <Text style={{ fontSize: 9 }}>{data.customerAddress}</Text>}
                {data.customerGstNumber && <Text style={{ fontSize: 9 }}>GST: {data.customerGstNumber}</Text>}
                {data.customerFirmName && <Text style={{ fontSize: 9 }}>Firm: {data.customerFirmName}</Text>}
              </View>
            ) : (
              <Text style={{ fontSize: 9 }}>Walk-in Customer</Text>
            )}
          </View>
          <View style={styles.customerBox}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            {data.customerName ? (
              <View>
                <Text style={{ fontSize: 9 }}>{data.customerName}</Text>
                {data.customerMobile && <Text style={{ fontSize: 9 }}>{data.customerMobile}</Text>}
                {data.customerAddress ? (
                  <Text style={{ fontSize: 9 }}>{data.customerAddress}</Text>
                ) : (
                  <Text style={{ fontSize: 9, fontStyle: 'italic' }}>Same as billing address</Text>
                )}
              </View>
            ) : (
              <Text style={{ fontSize: 9 }}>Walk-in Customer</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>Item Description</Text>
            <Text style={[styles.tableCell, styles.col2, { fontWeight: 'bold', textAlign: 'center' }]}>HSN Code</Text>
            <Text style={[styles.tableCell, styles.col3, { fontWeight: 'bold', textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableCell, styles.col4, { fontWeight: 'bold', textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold', textAlign: 'right' }]}>GST</Text>
            <Text style={[styles.tableCell, styles.col6, { fontWeight: 'bold', textAlign: 'right' }]}>Amount</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.tableCell}>{item.productName}</Text>
                {item.productSku && <Text style={[styles.tableCell, { fontSize: 8, color: '#6b7280' }]}>SKU: {item.productSku}</Text>}
                {item.gstPercentage && item.gstPercentage > 0 && (
                  <Text style={[styles.tableCell, { fontSize: 8, color: '#3b82f6' }]}>
                    GST ({item.gstPercentage}%): {formatCurrency(item.gstAmount || 0)}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.col2, { textAlign: 'center' }]}>{item.hsnCode || 'N/A'}</Text>
              <Text style={[styles.tableCell, styles.col3, { textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.col4, { textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
              <Text style={[styles.tableCell, styles.col5, { textAlign: 'right' }]}>
                {item.gstAmount ? formatCurrency(item.gstAmount) : '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col6, { textAlign: 'right' }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Additional Charges */}
        {data.additionalCharges && data.additionalCharges.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Additional Services:</Text>
            {data.additionalCharges.map((charge, index) => (
              <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 9 }}>
                  {charge.serviceName} ({charge.quantity} {charge.unit})
                </Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(charge.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.additionalCharges && data.additionalCharges.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Services:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(data.additionalCharges.reduce((sum, c) => sum + c.amount, 0))}
              </Text>
            </View>
          )}
          {data.gst > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.gst / 2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.gst / 2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total GST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.gst)}</Text>
              </View>
            </>
          )}
          {data.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#dc2626' }]}>
                Discount{data.discountPercentage ? ` (${data.discountPercentage}%)` : ''}:
              </Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>-{formatCurrency(data.discount)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text style={styles.summaryLabel}>Grand Total:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.grandTotal)}</Text>
          </View>
        </View>

        {/* Terms & Conditions - Always show */}
        <View style={{ marginTop: 20, paddingTop: 15, borderTop: '1 solid #e5e7eb', minHeight: 50 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10, fontSize: 12, fontWeight: 'bold' }]}>Terms & Conditions:</Text>
          <View style={{ marginBottom: 10 }}>
            {data.invoiceTermsAndConditions && data.invoiceTermsAndConditions.trim() ? (
              data.invoiceTermsAndConditions.split('\n').filter(line => line.trim()).map((line, index) => (
                <Text key={index} style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 3 }}>
                  {line.trim()}
                </Text>
              ))
            ) : (
              <>
                <Text style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 3 }}>• Goods once sold will not be taken back or exchanged.</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5 }}>• This is a system-generated invoice.</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 10, fontWeight: 'bold', fontSize: 12 }}>Thank you for your purchase!</Text>
          <Text style={{ fontSize: 10, color: '#3b82f6', marginBottom: 10 }}>{data.website || 'www.lapatola.com'}</Text>
          {data.invoiceFooterNote && (
            <Text style={{ fontSize: 9, marginTop: 5, marginBottom: 5 }}>{data.invoiceFooterNote}</Text>
          )}
          {/* <Text style={{ fontSize: 9, marginTop: 5 }}>For returns, please bring this invoice within 7 days.</Text> */}
        </View>
      </Page>
    </Document>
  );
}

// Quotation Data Interface (similar to InvoiceData)
export interface QuotationData {
  quotationNumber: string;
  createdAt: string;
  companyName?: string;
  website?: string;
  companyLogo?: string;
  qrCode?: string;
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
  quotationTermsAndConditions?: string;
  quotationFooterNote?: string;
}

// Quotation PDF Component
export function QuotationPDF({ data }: { data: QuotationData }) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <View style={styles.logoContainer}>
              {data.companyLogo && (
                <Image src={data.companyLogo} style={styles.logo} />
              )}
              <Text style={styles.productOfText}>Product of casa export</Text>
              <Text style={styles.website}>{data.website || 'www.lapatola.com'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View>
                {data.gstin && <Text style={{ fontSize: 9 }}>GSTIN: {data.gstin}</Text>}
                {data.pan && <Text style={{ fontSize: 9 }}>PAN: {data.pan}</Text>}
                {data.cin && <Text style={{ fontSize: 9 }}>CIN: {data.cin}</Text>}
                {data.registeredOfficeAddress && (
                  <Text style={{ fontSize: 8, marginTop: 5, maxWidth: 150 }}>
                    {data.registeredOfficeAddress}
                  </Text>
                )}
              </View>
              {data.qrCode && (
                <View>
                  <Image src={data.qrCode} style={styles.qrCode} />
                </View>
              )}
            </View>
          </View>

          {/* Quotation Metadata */}
          <View style={styles.invoiceMeta}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6', marginBottom: 5 }}>QUOTATION</Text>
              <Text style={{ fontSize: 9 }}>Quotation Number: {data.quotationNumber}</Text>
              <Text style={{ fontSize: 9 }}>Quotation Date: {formatDate(data.createdAt)}</Text>
              <Text style={{ fontSize: 9 }}>Place of Supply: {data.placeOfSupply || 'N/A'}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9 }}>Payment Terms: {data.paymentTerms || 'N/A'}</Text>
              <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#dc2626' }}>Valid for 30 days</Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <View style={styles.customerBox}>
            <Text style={styles.sectionTitle}>Quoted To:</Text>
            {data.customerName ? (
              <View>
                <Text style={{ fontSize: 9 }}>{data.customerName}</Text>
                {data.customerMobile && <Text style={{ fontSize: 9 }}>{data.customerMobile}</Text>}
                {data.customerPanCard && <Text style={{ fontSize: 9 }}>PAN: {data.customerPanCard}</Text>}
                {data.customerEmail && <Text style={{ fontSize: 9 }}>{data.customerEmail}</Text>}
                {data.customerAddress && <Text style={{ fontSize: 9 }}>{data.customerAddress}</Text>}
                {data.customerGstNumber && <Text style={{ fontSize: 9 }}>GST: {data.customerGstNumber}</Text>}
                {data.customerFirmName && <Text style={{ fontSize: 9 }}>Firm: {data.customerFirmName}</Text>}
              </View>
            ) : (
              <Text style={{ fontSize: 9 }}>Walk-in Customer</Text>
            )}
          </View>
          <View style={styles.customerBox}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            {data.customerName ? (
              <View>
                <Text style={{ fontSize: 9 }}>{data.customerName}</Text>
                {data.customerMobile && <Text style={{ fontSize: 9 }}>{data.customerMobile}</Text>}
                {data.customerAddress ? (
                  <Text style={{ fontSize: 9 }}>{data.customerAddress}</Text>
                ) : (
                  <Text style={{ fontSize: 9, fontStyle: 'italic' }}>Same as billing address</Text>
                )}
              </View>
            ) : (
              <Text style={{ fontSize: 9 }}>Walk-in Customer</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>Item Description</Text>
            <Text style={[styles.tableCell, styles.col2, { fontWeight: 'bold', textAlign: 'center' }]}>HSN Code</Text>
            <Text style={[styles.tableCell, styles.col3, { fontWeight: 'bold', textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableCell, styles.col4, { fontWeight: 'bold', textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold', textAlign: 'right' }]}>GST</Text>
            <Text style={[styles.tableCell, styles.col6, { fontWeight: 'bold', textAlign: 'right' }]}>Amount</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.tableCell}>{item.productName}</Text>
                {item.productSku && <Text style={[styles.tableCell, { fontSize: 8, color: '#6b7280' }]}>SKU: {item.productSku}</Text>}
                {item.gstPercentage && item.gstPercentage > 0 && (
                  <Text style={[styles.tableCell, { fontSize: 8, color: '#3b82f6' }]}>
                    GST ({item.gstPercentage}%): {formatCurrency(item.gstAmount || 0)}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.col2, { textAlign: 'center' }]}>{item.hsnCode || 'N/A'}</Text>
              <Text style={[styles.tableCell, styles.col3, { textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.col4, { textAlign: 'right' }]}>{formatCurrency(item.price)}</Text>
              <Text style={[styles.tableCell, styles.col5, { textAlign: 'right' }]}>
                {item.gstAmount ? formatCurrency(item.gstAmount) : '-'}
              </Text>
              <Text style={[styles.tableCell, styles.col6, { textAlign: 'right' }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Additional Charges */}
        {data.additionalCharges && data.additionalCharges.length > 0 && (
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Additional Services:</Text>
            {data.additionalCharges.map((charge, index) => (
              <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 9 }}>
                  {charge.serviceName} ({charge.quantity} {charge.unit})
                </Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{formatCurrency(charge.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.additionalCharges && data.additionalCharges.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Services:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(data.additionalCharges.reduce((sum, c) => sum + c.amount, 0))}
              </Text>
            </View>
          )}
          {data.gst > 0 && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.gst / 2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.gst / 2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total GST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(data.gst)}</Text>
              </View>
            </>
          )}
          {data.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#dc2626' }]}>
                Discount{data.discountPercentage ? ` (${data.discountPercentage}%)` : ''}:
              </Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>-{formatCurrency(data.discount)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text style={styles.summaryLabel}>Grand Total:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.grandTotal)}</Text>
          </View>
        </View>

        {/* Terms & Conditions - Always show */}
        <View style={{ marginTop: 20, paddingTop: 15, borderTop: '1 solid #e5e7eb', minHeight: 50 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10, fontSize: 12, fontWeight: 'bold' }]}>Terms & Conditions:</Text>
          <View style={{ marginBottom: 10 }}>
            {data.quotationTermsAndConditions && data.quotationTermsAndConditions.trim() ? (
              data.quotationTermsAndConditions.split('\n').filter(line => line.trim()).map((line, index) => (
                <Text key={index} style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 3 }}>
                  {line.trim()}
                </Text>
              ))
            ) : (
              <>
                <Text style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 3 }}>• This quotation is valid for 30 days from the date of issue.</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 3 }}>• Prices are subject to change without prior notice.</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 3 }}>• Payment terms as mentioned above.</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5 }}>• This is a system-generated quotation.</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 10, fontWeight: 'bold', fontSize: 12 }}>Thank you for your interest!</Text>
          <Text style={{ fontSize: 10, color: '#3b82f6', marginBottom: 10 }}>{data.website || 'www.lapatola.com'}</Text>
          {data.quotationFooterNote && (
            <Text style={{ fontSize: 9, marginTop: 5, marginBottom: 5 }}>{data.quotationFooterNote}</Text>
          )}
          <Text style={{ fontSize: 9, marginTop: 5 }}>For any queries, please contact us.</Text>
        </View>
      </Page>
    </Document>
  );
}

