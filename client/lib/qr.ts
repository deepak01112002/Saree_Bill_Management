import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export function generateQRData(productId: string, sku: string, name: string, price: number): string {
  return JSON.stringify({
    productId,
    sku,
    name,
    price,
  });
}

export function generateBillQRData(billId: string, billNumber: string): string {
  return JSON.stringify({
    billId,
    billNumber,
    type: 'bill',
  });
}

