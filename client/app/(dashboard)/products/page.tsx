'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, Edit, Trash2, Package, QrCode, ScanLine, Upload, Lock } from 'lucide-react';
import Link from 'next/link';
import { QRCodeDialog } from '@/components/products/QRCodeDialog';
import { BarcodeDialog } from '@/components/products/BarcodeDialog';
import { showToast, showConfirm } from '@/lib/toast';

interface Product {
  _id: string;
  name: string;
  sareeType: string;
  brand: string;
  color: string;
  sellingPrice: number;
  stockQuantity: number;
  sku: string;
  gstPercentage?: number;
  hsnCode?: string;
  priceLocked?: boolean;
  category?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface Category {
  _id: string;
  name: string;
  code: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, search, selectedCategory]);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productsAPI.getAll({
        search: search || undefined,
        page,
        limit: 20,
        category: selectedCategory || undefined,
      });
      setProducts(result.products || []);
      setTotal(result.total || 0);
      setPages(result.pages || 1);
    } catch (error: any) {
      console.error('Error loading products:', error);
      showToast.error('Failed to load products: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await productsAPI.delete(id);
      showToast.success('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      showToast.error('Failed to delete product: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your inventory</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/upload">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>
          </Link>
          <Link href="/products/bulk-print">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Bulk Print
            </Button>
          </Link>
          <Link href="/products/add">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name, SKU, or brand..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-11"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 h-11 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>All Products ({total})</CardTitle>
          <CardDescription>List of all products in your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {search ? 'Try a different search term' : 'Get started by adding your first product'}
              </p>
              {!search && (
                <Link href="/products/add">
                  <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Product</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Brand</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">SKU</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">HSN</th>
                      <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Price</th>
                      <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">GST %</th>
                      <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                      <th className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500 dark:text-gray-400">{product.color}</p>
                              {product.category && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                  {product.category.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{product.sareeType}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-300">{product.brand}</td>
                        <td className="p-4">
                          <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 rounded">
                            {product.sku}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                            {product.hsnCode || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(product.sellingPrice)}
                            </span>
                            {product.priceLocked && (
                              <span title="Price Locked">
                                <Lock className="h-4 w-4 text-yellow-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-semibold ${
                            product.gstPercentage === undefined || product.gstPercentage === null
                              ? 'text-gray-400 dark:text-gray-500'
                              : product.gstPercentage > 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {product.gstPercentage !== undefined && product.gstPercentage !== null
                              ? `${product.gstPercentage}%`
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`font-semibold ${
                              product.stockQuantity === 0
                                ? 'text-red-600'
                                : product.stockQuantity < 10
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}
                          >
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setQrDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="View QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setBarcodeDialogOpen(true);
                              }}
                              className="text-purple-600 hover:text-purple-700"
                              title="View Barcode"
                            >
                              <ScanLine className="h-4 w-4" />
                            </Button>
                            <Link href={`/products/edit/${product._id}`}>
                              <Button variant="ghost" size="sm" title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product._id, product.name)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Page {page} of {pages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
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

      {/* QR Code Dialog */}
      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        product={selectedProduct}
      />

      {/* Barcode Dialog */}
      <BarcodeDialog
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
        product={selectedProduct}
      />
    </div>
  );
}

