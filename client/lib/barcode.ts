import JsBarcode from 'jsbarcode';

export function generateBarcode(
  canvas: HTMLCanvasElement,
  data: string,
  options?: {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
  }
): void {
  JsBarcode(canvas, data, {
    format: options?.format || 'CODE128',
    width: options?.width || 2,
    height: options?.height || 100,
    displayValue: options?.displayValue !== false,
    fontSize: 14,
    margin: 10,
  });
}

export function generateBarcodeDataURL(
  data: string,
  options?: {
    format?: string;
    width?: number;
    height?: number;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    try {
      generateBarcode(canvas, data, options);
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
}


