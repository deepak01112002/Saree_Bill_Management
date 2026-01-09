'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Printer, Package, CheckCircle2, Circle, Search } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import { printBarcodes, BarcodePrintProduct, PrintOptions, PrintFormat } from '@/lib/barcode-print';

export default function BulkBarcodePrintPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [search, setSearch] = useState('');
  const [printFormat, setPrintFormat] = useState<PrintFormat>('normal');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [columns, setColumns] = useState(4);
  const [labelsPerPage, setLabelsPerPage] = useState(24);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productsAPI.getAll({ limit: 1000 });
      setProducts(result.products || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      showToast.error('Failed to load products: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const filteredProducts = getFilteredProducts();
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  const getFilteredProducts = () => {
    if (!search.trim()) return products;
    const searchLower = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.brand?.toLowerCase().includes(searchLower)
    );
  };

  const handlePrint = async () => {
    if (selectedProducts.size === 0) {
      showToast.error('Please select at least one product');
      return;
    }

    try {
      setPrinting(true);
      const filteredProducts = getFilteredProducts();
      const productsToPrint: BarcodePrintProduct[] = filteredProducts
        .filter((p) => selectedProducts.has(p._id))
        .map((p) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku || p._id,
          sellingPrice: p.sellingPrice || 0,
          mrp: p.mrp || p.sellingPrice || 0,
        }));

      const options: PrintOptions = {
        format: printFormat,
        paperWidth: printFormat === 'thermal' ? paperWidth : undefined,
        columns: printFormat === 'normal' ? columns : undefined,
        labelsPerPage: printFormat === 'normal' ? labelsPerPage : undefined,
      };

      await printBarcodes(productsToPrint, options);
      showToast.success(`Printing ${productsToPrint.length} barcode(s)...`);
    } catch (error: any) {
      console.error('Error printing barcodes:', error);
      showToast.error('Failed to print barcodes: ' + (error.message || 'Unknown error'));
    } finally {
      setPrinting(false);
    }
  };

  const filteredProducts = getFilteredProducts();
  const allSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Barcode Print</h1>
          <p className="text-gray-600 mt-1">Select products and print barcodes in bulk</p>
        </div>
      </div>

      {/* Print Settings */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Print Settings</CardTitle>
          <CardDescription>Choose print format and options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Print Format *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="thermal"
                  checked={printFormat === 'thermal'}
                  onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                  className="w-4 h-4"
                />
                <span>Thermal Printer (58mm/80mm)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="normal"
                  checked={printFormat === 'normal'}
                  onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                  className="w-4 h-4"
                />
                <span>Normal Printer (Multiple per page)</span>
              </label>
            </div>
          </div>

          {printFormat === 'thermal' && (
            <div className="space-y-2">
              <Label>Paper Width *</Label>
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md"
                value={paperWidth}
                onChange={(e) => setPaperWidth(e.target.value as '58mm' | '80mm')}
              >
                <option value="58mm">58mm (2 columns)</option>
                <option value="80mm">80mm (3 columns)</option>
              </select>
            </div>
          )}

          {printFormat === 'normal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Columns per Row</Label>
                <Input
                  type="number"
                  min="2"
                  max="6"
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value) || 4)}
                />
                <p className="text-xs text-gray-500">How many barcodes per row (2-6)</p>
              </div>
              <div className="space-y-2">
                <Label>Labels per Page</Label>
                <Input
                  type="number"
                  min="4"
                  max="48"
                  value={labelsPerPage}
                  onChange={(e) => setLabelsPerPage(parseInt(e.target.value) || 24)}
                />
                <p className="text-xs text-gray-500">Maximum labels per page (4-48)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Select Products ({selectedProducts.size} selected)
              </CardTitle>
              <CardDescription>
                Select products to print barcodes for
              </CardDescription>
            </div>
            <Button variant="outline" onClick={selectAll}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, SKU, or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {search ? 'Try adjusting your search' : 'No products available'}
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold w-12">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={selectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="text-left p-3 font-semibold">Product Name</th>
                      <th className="text-left p-3 font-semibold">SKU</th>
                      <th className="text-right p-3 font-semibold">MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProducts.has(product._id);
                      return (
                        <tr
                          key={product._id}
                          className={`border-b hover:bg-gray-50 cursor-pointer ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleProduct(product._id)}
                        >
                          <td className="p-3">
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </td>
                          <td className="p-3 font-medium text-gray-900">{product.name}</td>
                          <td className="p-3 text-gray-600 font-mono text-sm">
                            {product.sku || 'N/A'}
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-900">
                            {formatCurrency(product.mrp || product.sellingPrice || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedProducts.size} of {filteredProducts.length} products selected
                </p>
                <Button
                  onClick={handlePrint}
                  disabled={printing || selectedProducts.size === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {printing ? 'Preparing Print...' : `Print ${selectedProducts.size} Barcode(s)`}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
