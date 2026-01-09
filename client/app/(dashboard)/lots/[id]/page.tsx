'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { lotsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateBarcodeDataURL } from '@/lib/barcode';
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

interface Product {
  _id: string;
  name: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  category?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface Lot {
  _id: string;
  lotNumber: string;
  uploadDate: string;
  category?: {
    _id: string;
    name: string;
    code: string;
  };
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  productCount: number;
  totalStockValue: number;
  status: 'active' | 'closed';
  products: Product[];
}

export default function LotDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const lotId = params.id as string;

  const [lot, setLot] = useState<Lot | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (lotId) {
      loadLot();
      loadProducts();
    }
  }, [lotId, page]);

  const loadLot = async () => {
    try {
      setLoading(true);
      const data = await lotsAPI.getById(lotId);
      setLot(data);
    } catch (error: any) {
      console.error('Error loading LOT:', error);
      showToast.error('Failed to load LOT: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const result = await lotsAPI.getProducts(lotId, { page, limit: 50 });
      setProducts(result.products || []);
      setTotalProducts(result.total || 0);
      setTotalPages(result.pages || 1);
    } catch (error: any) {
      console.error('Error loading products:', error);
      showToast.error('Failed to load products: ' + (error.message || 'Unknown error'));
    } finally {
      setProductsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">LOT Not Found</h2>
        <p className="text-gray-600 mb-4">The LOT you're looking for doesn't exist.</p>
        <Link href="/lots">
          <Button>Back to LOTs</Button>
        </Link>
      </div>
    );
  }

  const averagePrice = lot.productCount > 0 ? lot.totalStockValue / lot.productCount : 0;

  // Generate thermal-optimized HTML for barcode printing
  const generateThermalPrintHTML = (
    products: Array<{
      name: string;
      sku: string;
      sellingPrice: number;
      mrp?: number;
      barcodeDataURL: string;
    }>,
    lotNumber: string,
    columns: number
  ): string => {
    // Ultra-compact labels for maximum labels per page
    const labelWidth = columns === 3 ? '25mm' : '27mm';
    const labelHeight = '10mm'; // Very compact height
    const paperWidth = columns === 3 ? '80mm' : '58mm';
    
    const escapeHtml = (text: string): string => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barcodes - ${lotNumber}</title>
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
      margin: 0;
      padding: 0.5mm;
      font-family: Arial, sans-serif;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label-grid {
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 0.3mm;
      width: 100%;
    }
    .label {
      width: ${labelWidth};
      height: ${labelHeight};
      padding: 0.3mm;
      border: 0.3px solid #000;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
      background: white;
      overflow: hidden;
    }
    .barcode-container {
      width: 100%;
      height: 5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.2mm;
      flex-shrink: 0;
    }
    .barcode {
      width: 100%;
      height: 100%;
      max-height: 5mm;
      object-fit: contain;
      image-rendering: crisp-edges;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sku-text {
      font-size: 4px;
      color: #000;
      font-family: 'Courier New', monospace;
      text-align: center;
      line-height: 1;
      margin-bottom: 0.1mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }
    .price-text {
      font-size: 5px;
      font-weight: bold;
      color: #000;
      text-align: center;
      line-height: 1;
      white-space: nowrap;
    }
    .mrp-text {
      font-size: 4px;
      text-decoration: line-through;
      color: #666;
      margin-right: 1px;
    }
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .label {
        border: 0.3px solid #000;
        page-break-inside: avoid;
      }
      .label-grid {
        gap: 0.3mm;
      }
    }
  </style>
</head>
<body>
  <div class="label-grid">
    ${products
      .map(
        (product) => `
    <div class="label">
      <div class="barcode-container">
        <img src="${product.barcodeDataURL}" alt="Barcode" class="barcode" />
      </div>
      <div class="sku-text">${product.sku}</div>
      <div class="price-text">
        ${product.mrp && product.mrp > product.sellingPrice
          ? `<span class="mrp-text">₹${product.mrp}</span>`
          : ''}
        ₹${product.sellingPrice}
      </div>
    </div>
    `
      )
      .join('')}
  </div>
  <script>
    // Optional: Auto-print when page loads
    // Uncomment the line below to enable auto-print
    // window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/lots">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{lot.lotNumber}</h1>
          <p className="text-gray-600 mt-1">LOT Details</p>
        </div>
      </div>

      {/* LOT Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{lot.productCount}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock Value</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(lot.totalStockValue)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Cost</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCurrency(averagePrice)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  {lot.status === 'active' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm flex items-center gap-1 w-fit">
                      <CheckCircle2 className="h-4 w-4" />
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm flex items-center gap-1 w-fit">
                      <Clock className="h-4 w-4" />
                      Closed
                    </span>
                  )}
                </div>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOT Details */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>LOT Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Upload Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(lot.uploadDate)}</p>
                </div>
              </div>

              {lot.category && (
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{lot.category.name}</p>
                  </div>
                </div>
              )}

              {lot.uploadedBy && (
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Uploaded By</p>
                    <p className="font-semibold text-gray-900">{lot.uploadedBy.name}</p>
                    <p className="text-xs text-gray-500">{lot.uploadedBy.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (products.length === 0) {
                    showToast.error('No products in this LOT to print barcodes');
                    return;
                  }
                  // Navigate to bulk print page with LOT products
                  window.open(`/products/bulk-print?lotId=${lot._id}`, '_blank');
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Print Barcodes (All Products)
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  showToast.info('Excel export feature coming soon!');
                }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Products in LOT</CardTitle>
          <CardDescription>All products included in this LOT</CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">No products found in this LOT</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Cost Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Selling Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            href={`/products/${product._id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-700">{product.sku}</span>
                        </td>
                        <td className="py-3 px-4">
                          {product.category ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{formatCurrency(product.costPrice)}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {formatCurrency(product.sellingPrice)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">{product.stockQuantity}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(product.costPrice * product.stockQuantity)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Showing page {page} of {totalPages} ({totalProducts} total products)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

