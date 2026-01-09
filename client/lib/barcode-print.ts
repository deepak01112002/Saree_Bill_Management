import { generateBarcodeDataURL } from './barcode';

export interface BarcodePrintProduct {
  _id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  mrp?: number;
}

export type PrintFormat = 'thermal' | 'normal';

export interface PrintOptions {
  format: PrintFormat;
  paperWidth?: '58mm' | '80mm'; // For thermal printer
  columns?: number; // For normal printer (how many per row)
  labelsPerPage?: number; // For normal printer
}

/**
 * Generate HTML for thermal printer format
 * Optimized for 58mm or 80mm thermal printers
 */
export async function generateThermalPrintHTML(
  products: BarcodePrintProduct[],
  options: PrintOptions = { format: 'thermal', paperWidth: '58mm' }
): Promise<string> {
  const paperWidth = options.paperWidth || '58mm';
  const columns = paperWidth === '80mm' ? 3 : 2; // 3 columns for 80mm, 2 for 58mm
  
  // Generate all barcodes first
  const barcodePromises = products.map(async (product) => {
    const barcodeData = product.sku || product._id;
    const barcodeURL = await generateBarcodeDataURL(barcodeData, {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: false, // Don't show text below barcode for compact labels
    });
    return { ...product, barcodeURL };
  });

  const productsWithBarcodes = await Promise.all(barcodePromises);

  const labelWidth = paperWidth === '80mm' ? '24mm' : '27mm';
  const labelHeight = '20mm';
  const gap = '1mm';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barcode Labels - Thermal Printer</title>
  <style>
    @page {
      size: ${paperWidth} auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 8px;
      padding: 2mm;
      background: white;
      color: black;
    }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: ${gap};
      width: 100%;
    }
    .label {
      width: ${labelWidth};
      height: ${labelHeight};
      padding: 1.5mm;
      border: 0.5px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      page-break-inside: avoid;
      background: white;
    }
    .product-name {
      font-size: 7px;
      font-weight: bold;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      line-height: 1.2;
      margin-bottom: 1mm;
      max-height: 3mm;
    }
    .barcode-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0.5mm 0;
    }
    .barcode-img {
      max-width: 100%;
      height: auto;
      max-height: 6mm;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-size: 7px;
      margin-top: 0.5mm;
    }
    .price {
      font-weight: bold;
      font-size: 7px;
    }
    .mrp {
      font-size: 6px;
      color: #333;
    }
    @media print {
      body {
        padding: 1mm;
      }
      .label {
        border: 0.5px solid #000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="label-grid">
    ${productsWithBarcodes
      .map(
        (product) => `
      <div class="label">
        <div class="product-name" title="${product.name}">${truncateName(product.name, 20)}</div>
        <div class="barcode-container">
          <img src="${product.barcodeURL}" alt="Barcode" class="barcode-img" />
        </div>
        <div class="price-row">
          <span class="price">MRP: ₹${product.mrp || product.sellingPrice}</span>
        </div>
      </div>
    `
      )
      .join('')}
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}

/**
 * Generate HTML for normal printer format
 * Compact labels - maximum barcodes per page
 * Shows: Name, Barcode, MRP only
 */
export async function generateNormalPrintHTML(
  products: BarcodePrintProduct[],
  options: PrintOptions = { format: 'normal', columns: 4, labelsPerPage: 24 }
): Promise<string> {
  const columns = options.columns || 4;
  const labelsPerRow = columns;
  const rowsPerPage = Math.ceil((options.labelsPerPage || 24) / labelsPerRow);
  
  // Generate all barcodes first
  const barcodePromises = products.map(async (product) => {
    const barcodeData = product.sku || product._id;
    const barcodeURL = await generateBarcodeDataURL(barcodeData, {
      format: 'CODE128',
      width: 1,
      height: 30,
      displayValue: false,
    });
    return { ...product, barcodeURL };
  });

  const productsWithBarcodes = await Promise.all(barcodePromises);

  // Split products into pages
  const productsPerPage = labelsPerRow * rowsPerPage;
  const pages: typeof productsWithBarcodes[] = [];
  for (let i = 0; i < productsWithBarcodes.length; i += productsPerPage) {
    pages.push(productsWithBarcodes.slice(i, i + productsPerPage));
  }

  // Calculate proper label height based on A4 page size (210mm x 297mm)
  // Account for margins (8mm top + 8mm bottom = 16mm)
  // Available height = 297mm - 16mm = 281mm
  // Divide by rows and subtract gaps
  const availableHeight = 281; // A4 height (297mm) - margins (16mm)
  const totalGapHeight = (rowsPerPage - 1) * 2; // 2mm gap between rows
  const labelHeight = (availableHeight - totalGapHeight) / rowsPerPage;
  const gap = '2mm';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barcode Labels - Normal Printer</title>
  <style>
    @page {
      size: A4;
      margin: 8mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      background: white;
      color: black;
    }
    .page {
      width: 100%;
      height: 281mm;
      display: grid;
      grid-template-columns: repeat(${labelsPerRow}, 1fr);
      grid-template-rows: repeat(${rowsPerPage}, ${labelHeight}mm);
      gap: ${gap};
      padding: 0;
      page-break-after: always;
      page-break-inside: avoid;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .label {
      width: 100%;
      height: 100%;
      padding: 3mm;
      border: 0.5px solid #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      page-break-inside: avoid;
      background: white;
      box-sizing: border-box;
      overflow: hidden;
    }
    .product-name {
      font-size: 8px;
      font-weight: bold;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      line-height: 1.4;
      margin-bottom: 2mm;
      min-height: 4mm;
      padding: 0 1mm;
    }
    .barcode-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 2mm 0;
      flex: 1;
      min-height: 15mm;
      max-height: 20mm;
    }
    .barcode-img {
      max-width: 95%;
      height: auto;
      max-height: 18mm;
      object-fit: contain;
    }
    .mrp {
      font-size: 8px;
      font-weight: bold;
      text-align: center;
      margin-top: 2mm;
      width: 100%;
      padding: 1mm 0;
      min-height: 3mm;
      line-height: 1.2;
    }
    @media print {
      body {
        background: white !important;
        margin: 0;
        padding: 0;
      }
      .page {
        page-break-inside: avoid !important;
        height: 281mm !important;
      }
      .label {
        border: 0.5px solid #000 !important;
        page-break-inside: avoid !important;
      }
      .product-name {
        font-size: 8px !important;
      }
      .mrp {
        font-size: 8px !important;
      }
    }
  </style>
</head>
<body>
  ${pages
    .map(
      (pageProducts) => `
    <div class="page">
      ${pageProducts
        .map(
          (product) => `
        <div class="label">
          <div class="product-name" title="${product.name}">${truncateName(product.name, 30)}</div>
          <div class="barcode-container">
            <img src="${product.barcodeURL}" alt="Barcode" class="barcode-img" />
          </div>
          <div class="mrp">MRP: ₹${product.mrp || product.sellingPrice}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('')}
  <script>
    window.onload = function() {
      // Wait for images to load before printing
      const images = document.querySelectorAll('img');
      let loaded = 0;
      if (images.length === 0) {
        window.print();
        return;
      }
      images.forEach(img => {
        if (img.complete) {
          loaded++;
          if (loaded === images.length) {
            setTimeout(() => window.print(), 300);
          }
        } else {
          img.onload = () => {
            loaded++;
            if (loaded === images.length) {
              setTimeout(() => window.print(), 300);
            }
          };
          img.onerror = () => {
            loaded++;
            if (loaded === images.length) {
              setTimeout(() => window.print(), 300);
            }
          };
        }
      });
    };
  </script>
</body>
</html>
  `;
}

/**
 * Print barcodes - opens print dialog
 */
export async function printBarcodes(
  products: BarcodePrintProduct[],
  options: PrintOptions
): Promise<void> {
  try {
    let html: string;
    
    if (options.format === 'thermal') {
      html = await generateThermalPrintHTML(products, options);
    } else {
      html = await generateNormalPrintHTML(products, options);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait a bit for images to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } catch (error: any) {
    console.error('Error printing barcodes:', error);
    throw error;
  }
}

/**
 * Truncate product name if too long
 */
function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
}
