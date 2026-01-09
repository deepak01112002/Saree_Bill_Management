'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { productsAPI, lotsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { generateBarcodeDataURL } from '@/lib/barcode';
import { Search, Printer, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';

interface Product {
  _id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  mrp?: number;
  stockQuantity: number;
  brand?: string;
  color?: string;
}

interface ProductWithBarcode extends Product {
  barcodeDataURL?: string;
  barcodeLoading?: boolean;
}

export default function BulkPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lotId = searchParams?.get('lotId');
  const [products, setProducts] = useState<ProductWithBarcode[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithBarcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [generatingBarcodes, setGeneratingBarcodes] = useState(false);
  const [labelSize, setLabelSize] = useState<'small' | 'medium'>('medium');
  const [lotInfo, setLotInfo] = useState<{ lotNumber: string } | null>(null);

  useEffect(() => {
    if (lotId) {
      loadLotProducts();
    } else {
      loadProducts();
    }
  }, [lotId]);

  useEffect(() => {
    if (search) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [search, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productsAPI.getAll({ limit: 1000 }); // Get all products
      setProducts(result.products || []);
      setFilteredProducts(result.products || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      showToast.error('Failed to load products: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadLotProducts = async () => {
    try {
      setLoading(true);
      const lot = await lotsAPI.getById(lotId!);
      setLotInfo({ lotNumber: lot.lotNumber });
      
      // Get products in this LOT
      const productsInLot = await lotsAPI.getProducts(lotId!, { limit: 1000 });
      
      setProducts(productsInLot.products || []);
      setFilteredProducts(productsInLot.products || []);
      
      // Auto-select all products from LOT
      if (productsInLot.products && productsInLot.products.length > 0) {
        setSelectedProducts(new Set(productsInLot.products.map((p: Product) => p._id)));
      }
    } catch (error: any) {
      console.error('Error loading LOT products:', error);
      showToast.error('Failed to load LOT products: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  const generateBarcodesForSelected = async () => {
    const selected = products.filter((p) => selectedProducts.has(p._id));
    if (selected.length === 0) {
      showToast.error('Please select at least one product');
      return;
    }

    try {
      setGeneratingBarcodes(true);
      const productsWithBarcodes = await Promise.all(
        selected.map(async (product) => {
          try {
            const barcodeData = product.sku || product._id;
            const barcodeDataURL = await generateBarcodeDataURL(barcodeData, {
              format: 'CODE128',
              width: labelSize === 'small' ? 1.5 : 2,
              height: labelSize === 'small' ? 80 : 100,
              displayValue: true,
            });
            return { ...product, barcodeDataURL };
          } catch (error) {
            console.error(`Error generating barcode for ${product.name}:`, error);
            return product;
          }
        })
      );

      setProducts((prev) =>
        prev.map((p) => {
          const updated = productsWithBarcodes.find((pb) => pb._id === p._id);
          return updated || p;
        })
      );

      showToast.success(`Generated barcodes for ${selected.length} product(s)`);
    } catch (error: any) {
      console.error('Error generating barcodes:', error);
      showToast.error('Failed to generate barcodes');
    } finally {
      setGeneratingBarcodes(false);
    }
  };

  const handlePrint = () => {
    const selected = products.filter((p) => selectedProducts.has(p._id) && p.barcodeDataURL);
    if (selected.length === 0) {
      showToast.error('Please select products and generate barcodes first');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast.error('Please allow popups to print');
      return;
    }

    const labelWidth = labelSize === 'small' ? '25mm' : '38mm';
    const labelHeight = labelSize === 'small' ? '15mm' : '25mm';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Barcode Print</title>
          <style>
            @page {
              size: ${labelWidth} ${labelHeight};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .label {
              width: ${labelWidth};
              height: ${labelHeight};
              padding: 2mm;
              box-sizing: border-box;
              display: inline-block;
              page-break-inside: avoid;
              border: 1px solid #ccc;
              margin: 1mm;
            }
            .product-name {
              font-size: ${labelSize === 'small' ? '8px' : '10px'};
              font-weight: bold;
              margin-bottom: 1mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .product-sku {
              font-size: ${labelSize === 'small' ? '7px' : '8px'};
              color: #666;
              margin-bottom: 1mm;
            }
            .barcode {
              width: 100%;
              height: auto;
              max-height: ${labelSize === 'small' ? '8mm' : '12mm'};
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              font-size: ${labelSize === 'small' ? '7px' : '8px'};
              color: #333;
              text-align: center;
              margin-top: 1mm;
            }
            .mrp {
              text-decoration: line-through;
              color: #999;
            }
            .selling-price {
              font-weight: bold;
              color: #e74c3c;
            }
          </style>
        </head>
        <body>
          ${selected
            .map(
              (product) => `
            <div class="label">
              <div class="product-name">${product.name}</div>
              <div class="product-sku">SKU: ${product.sku}</div>
              <img src="${product.barcodeDataURL}" alt="Barcode" class="barcode" />
              <div class="price-row">
                ${product.mrp && product.mrp > product.sellingPrice ? `<span class="mrp">MRP: ₹${product.mrp}</span>` : ''}
                <span class="selling-price">₹${product.sellingPrice}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const selectedCount = selectedProducts.size;
  const selectedWithBarcodes = products.filter(
    (p) => selectedProducts.has(p._id) && p.barcodeDataURL
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href={lotId ? `/lots/${lotId}` : '/products'}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Bulk Barcode Printing
                    {lotInfo && (
                      <span className="text-lg font-normal text-gray-600 ml-2">
                        - {lotInfo.lotNumber}
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {lotId ? 'Print barcode labels for all products in this LOT' : 'Select products and print barcode labels'}
                  </p>
                </div>
              </div>
            </div>
      </div>

      {/* Controls */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Label Size:</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as 'small' | 'medium')}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="small">Small (25mm x 15mm)</option>
                  <option value="medium">Medium (38mm x 25mm)</option>
                </select>
              </div>
              <Button
                onClick={selectAll}
                variant="outline"
                disabled={filteredProducts.length === 0}
              >
                {selectedCount === filteredProducts.length ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Select All
                  </>
                )}
              </Button>
              <Button
                onClick={generateBarcodesForSelected}
                disabled={selectedCount === 0 || generatingBarcodes}
                variant="outline"
              >
                {generatingBarcodes ? 'Generating...' : 'Generate Barcodes'}
              </Button>
              <Button
                onClick={handlePrint}
                disabled={selectedWithBarcodes === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print ({selectedWithBarcodes})
              </Button>
            </div>
          </div>
          {selectedCount > 0 && (
            <p className="text-sm text-gray-600 mt-3">
              {selectedCount} product(s) selected
              {selectedWithBarcodes > 0 && ` • ${selectedWithBarcodes} with barcodes generated`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>Select products to generate and print barcodes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.has(product._id);
                const hasBarcode = !!product.barcodeDataURL;

                return (
                  <div
                    key={product._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSelectProduct(product._id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectProduct(product._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600 font-mono">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                        {hasBarcode && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <img
                              src={product.barcodeDataURL}
                              alt="Barcode"
                              className="w-full h-16 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

